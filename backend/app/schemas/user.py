"""User-related Pydantic schemas."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

__all__ = [
    "UserCreate",
    "UserLogin",
    "UserRead",
    "UserUpdate",
    "UserSettingsRead",
    "UserSettingsUpdate",
    "TokenResponse",
    "TokenRefresh",
    "PasswordReset",
    "PasswordChange",
]


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$")
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("username")
    @classmethod
    def username_lower(cls, v: str) -> str:
        return v.lower()


class UserLogin(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class UserRead(BaseModel):
    id: uuid.UUID
    username: str
    email: str
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    username: str | None = Field(None, min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$")


class UserSettingsRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    update_interval: int
    battery_optimization: bool
    notify_low_battery: bool
    notify_device_offline: bool
    notify_device_online: bool
    notify_geofence_enter: bool
    notify_geofence_exit: bool
    notify_device_restart: bool
    notify_sim_changed: bool
    map_provider: str
    theme: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserSettingsUpdate(BaseModel):
    update_interval: int | None = Field(None, ge=5, le=3600)
    battery_optimization: bool | None = None
    notify_low_battery: bool | None = None
    notify_device_offline: bool | None = None
    notify_device_online: bool | None = None
    notify_geofence_enter: bool | None = None
    notify_geofence_exit: bool | None = None
    notify_device_restart: bool | None = None
    notify_sim_changed: bool | None = None
    map_provider: str | None = Field(None, max_length=50)
    theme: str | None = Field(None, max_length=20)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenRefresh(BaseModel):
    refresh_token: str


class PasswordReset(BaseModel):
    email: EmailStr


class PasswordChange(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=128)
