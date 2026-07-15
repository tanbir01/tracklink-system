"""
User settings API routes.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.schemas.user import UserSettingsRead, UserSettingsUpdate, UserUpdate, UserRead
from app.services.auth_service import AuthService

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get(
    "",
    response_model=UserSettingsRead,
    summary="Get current user settings",
)
async def get_settings(
    db: DbSession,
    current_user: CurrentUser,
) -> UserSettingsRead:
    service = AuthService(db)
    user_settings = await service.get_or_create_settings(current_user.id)
    return UserSettingsRead.model_validate(user_settings)


@router.put(
    "",
    response_model=UserSettingsRead,
    summary="Update user settings",
)
async def update_settings(
    body: UserSettingsUpdate,
    db: DbSession,
    current_user: CurrentUser,
) -> UserSettingsRead:
    service = AuthService(db)
    user_settings = await service.update_settings(current_user.id, body)
    return UserSettingsRead.model_validate(user_settings)


@router.put(
    "/profile",
    response_model=UserRead,
    summary="Update user profile",
)
async def update_profile(
    body: UserUpdate,
    db: DbSession,
    current_user: CurrentUser,
) -> UserRead:
    service = AuthService(db)
    user = await service.update_profile(current_user.id, body)
    return UserRead.model_validate(user)
