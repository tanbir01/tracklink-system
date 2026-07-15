"""
Custom exception classes and FastAPI exception handlers.
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger("tracklink")


# ── Custom exceptions ───────────────────────────────────────────────────────
class TrackLinkException(Exception):
    """Base exception for TrackLink."""

    def __init__(self, message: str, status_code: int = 500, details: Any = None):
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(message)


class NotFoundException(TrackLinkException):
    def __init__(self, resource: str = "Resource", resource_id: Any = None):
        msg = f"{resource} not found"
        if resource_id:
            msg = f"{resource} with id '{resource_id}' not found"
        super().__init__(message=msg, status_code=status.HTTP_404_NOT_FOUND)


class DuplicateException(TrackLinkException):
    def __init__(self, resource: str = "Resource", field: str = ""):
        msg = f"{resource} already exists"
        if field:
            msg = f"{resource} with this {field} already exists"
        super().__init__(message=msg, status_code=status.HTTP_409_CONFLICT)


class ForbiddenException(TrackLinkException):
    def __init__(self, message: str = "You do not have permission to perform this action"):
        super().__init__(message=message, status_code=status.HTTP_403_FORBIDDEN)


class UnauthorizedException(TrackLinkException):
    def __init__(self, message: str = "Invalid or expired authentication credentials"):
        super().__init__(message=message, status_code=status.HTTP_401_UNAUTHORIZED)


class BadRequestException(TrackLinkException):
    def __init__(self, message: str = "Bad request"):
        super().__init__(message=message, status_code=status.HTTP_400_BAD_REQUEST)


# ── Exception handlers ──────────────────────────────────────────────────────
def register_exception_handlers(app: FastAPI) -> None:
    """Register all custom exception handlers on the FastAPI app."""

    @app.exception_handler(TrackLinkException)
    async def tracklink_exception_handler(request: Request, exc: TrackLinkException) -> JSONResponse:
        logger.warning("TrackLinkException: %s (status=%d)", exc.message, exc.status_code)
        content: dict[str, Any] = {"detail": exc.message}
        if exc.details:
            content["errors"] = exc.details
        return JSONResponse(status_code=exc.status_code, content=content)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        errors = []
        for err in exc.errors():
            loc = " -> ".join(str(l) for l in err.get("loc", []))
            errors.append({
                "field": loc,
                "message": err.get("msg", "Validation error"),
                "type": err.get("type", ""),
            })
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": "Validation error", "errors": errors},
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=getattr(exc, "headers", None),
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled exception: %s", exc)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "An internal server error occurred"},
        )
