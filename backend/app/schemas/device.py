"""Device-related Pydantic schemas."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

__all__ = [
    "DeviceCreate",
    "DeviceRead",
    "DeviceUpdate",
    "DeviceListRead",
]


class DeviceCreate(BaseModel):
    device_id: str = Field(..., min_length=1, max_length=255)
    name: str = Field(default="My Device", max_length=100)
    model: str | None = Field(None, max_length=100)
    manufacturer: str | None = Field(None, max_length=100)
    android_version: str | None = Field(None, max_length=20)


class DeviceRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    device_id: str
    name: str
    model: str | None
    manufacturer: str | None
    android_version: str | None
    last_seen: datetime | None
    is_online: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class DeviceUpdate(BaseModel):
    name: str | None = Field(None, max_length=100)
    model: str | None = Field(None, max_length=100)
    manufacturer: str | None = Field(None, max_length=100)
    android_version: str | None = Field(None, max_length=20)


class DeviceListRead(BaseModel):
    devices: list[DeviceRead]
    total: int
