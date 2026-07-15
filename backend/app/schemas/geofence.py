"""Geofence-related Pydantic schemas."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

__all__ = [
    "GeofenceCreate",
    "GeofenceRead",
    "GeofenceUpdate",
    "GeofenceToggle",
    "GeofenceListResponse",
    "DeviceGeofenceRead",
]


class GeofenceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    radius_meters: float = Field(..., gt=0, le=100_000)


class GeofenceRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    latitude: float
    longitude: float
    radius_meters: float
    is_enabled: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class GeofenceUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    latitude: float | None = Field(None, ge=-90, le=90)
    longitude: float | None = Field(None, ge=-180, le=180)
    radius_meters: float | None = Field(None, gt=0, le=100_000)


class GeofenceToggle(BaseModel):
    is_enabled: bool


class GeofenceListResponse(BaseModel):
    geofences: list[GeofenceRead]
    total: int


class DeviceGeofenceRead(BaseModel):
    id: uuid.UUID
    device_id: uuid.UUID
    geofence_id: uuid.UUID
    last_state: str
    updated_at: datetime

    model_config = {"from_attributes": True}
