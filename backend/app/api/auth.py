"""
Authentication API routes: register, login, refresh, logout, password change.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request, status

from app.api.deps import CurrentUser, DbSession
from app.core.rate_limiter import rate_limit_auth
from app.schemas.user import (
    PasswordChange,
    TokenRefresh,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserRead,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    dependencies=[Depends(rate_limit_auth)],
)
async def register(
    body: UserCreate,
    request: Request,
    db: DbSession,
) -> UserRead:
    service = AuthService(db)
    user = await service.register(
        body,
        ip_address=request.client.host if request.client else None,
    )
    return UserRead.model_validate(user)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate and get tokens",
    dependencies=[Depends(rate_limit_auth)],
)
async def login(
    body: UserLogin,
    request: Request,
    db: DbSession,
) -> TokenResponse:
    service = AuthService(db)
    return await service.login(
        body,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
    dependencies=[Depends(rate_limit_auth)],
)
async def refresh_token(
    body: TokenRefresh,
    request: Request,
    db: DbSession,
) -> TokenResponse:
    service = AuthService(db)
    return await service.refresh(
        body.refresh_token,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Logout and revoke refresh token",
)
async def logout(
    body: TokenRefresh,
    db: DbSession,
    current_user: CurrentUser,
) -> dict:
    service = AuthService(db)
    await service.logout(body.refresh_token, current_user.id)
    return {"detail": "Logged out successfully"}


@router.post(
    "/change-password",
    status_code=status.HTTP_200_OK,
    summary="Change current user's password",
)
async def change_password(
    body: PasswordChange,
    request: Request,
    db: DbSession,
    current_user: CurrentUser,
) -> dict:
    service = AuthService(db)
    await service.change_password(
        current_user,
        body.current_password,
        body.new_password,
        ip_address=request.client.host if request.client else None,
    )
    return {"detail": "Password changed successfully"}


@router.get(
    "/me",
    response_model=UserRead,
    summary="Get current user profile",
)
async def get_me(current_user: CurrentUser) -> UserRead:
    return UserRead.model_validate(current_user)
