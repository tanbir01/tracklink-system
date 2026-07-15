"""
Redis-based sliding-window rate limiter.
"""

from __future__ import annotations

from fastapi import HTTPException, Request, status
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from app.config import settings
from app.database import get_redis


async def check_rate_limit(
    key: str,
    limit: int,
    window_seconds: int = 60,
) -> tuple[bool, int, int]:
    """
    Sliding-window counter rate limiter.

    Returns (allowed, remaining, retry_after_seconds).
    """
    redis = await get_redis()
    current = await redis.incr(key)
    if current == 1:
        await redis.expire(key, window_seconds)
    ttl = await redis.ttl(key)
    remaining = max(0, limit - current)
    return current <= limit, remaining, max(0, ttl)


async def rate_limit_by_ip(
    request: Request,
    limit: int | None = None,
    window_seconds: int = 60,
) -> None:
    """
    Rate-limit a request by client IP address.

    Raises HTTP 429 if the limit is exceeded.
    """
    effective_limit = limit or settings.RATE_LIMIT_PER_MINUTE
    client_ip = request.client.host if request.client else "unknown"
    key = f"rate_limit:{client_ip}:{request.url.path}"
    allowed, remaining, retry_after = await check_rate_limit(key, effective_limit, window_seconds)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Try again in {retry_after} seconds.",
            headers={
                "Retry-After": str(retry_after),
                "X-RateLimit-Limit": str(effective_limit),
                "X-RateLimit-Remaining": "0",
            },
        )


async def rate_limit_auth(request: Request) -> None:
    """Rate limit specifically for auth endpoints (stricter)."""
    await rate_limit_by_ip(request, limit=settings.AUTH_RATE_LIMIT_PER_MINUTE)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Global rate-limit middleware applied per client IP.
    Auth endpoints get a stricter limit.
    """

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Skip rate limiting for health checks and WebSocket upgrades
        if request.url.path in ("/health", "/docs", "/openapi.json", "/redoc"):
            return await call_next(request)
        if request.headers.get("upgrade", "").lower() == "websocket":
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"

        # Choose limit based on path
        is_auth = request.url.path.startswith("/api/auth")
        limit = settings.AUTH_RATE_LIMIT_PER_MINUTE if is_auth else settings.RATE_LIMIT_PER_MINUTE
        key = f"rate_limit:global:{client_ip}:{request.url.path}"

        try:
            allowed, remaining, retry_after = await check_rate_limit(key, limit)
        except Exception:
            # If Redis is unavailable, allow the request through
            return await call_next(request)

        if not allowed:
            return Response(
                content=f'{{"detail":"Rate limit exceeded. Try again in {retry_after} seconds."}}',
                status_code=429,
                media_type="application/json",
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                },
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response
