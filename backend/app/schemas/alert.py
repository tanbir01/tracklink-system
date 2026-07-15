"""Alert-related Pydantic schemas."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

__all__ = [
    "AlertCreate",
    "AlertRead",
    "AlertMarkRead",
    "AlertListResponse",
]


class AlertCreate(BaseModel):
    device_id: uuid.UUID | None = None
    type: str = Field(
        ...,
        pattern=r"^(low_battery|device_offline|device_online|geofence_enter|geofence_exit|device_restart|sim_changed|speed_alert|system)$",
    )
    title: str = Field(..., min_length=1, max_length=255)
    message: str | None = None
    metadata_: dict[str, Any] = Field(default_factory=dict, alias="metadata")


class AlertRead(BaseModel):
    id: uuid.UUID
    device_id: uuid.UUID | None
    user_id: uuid.UUID
    type: str
    title: str
    message: str | None
    is_read: bool
    metadata_: dict[str, Any] = Field(default_factory=dict, alias="metadata")
    created_at: datetime

    model_config = {"from_attributes": True, "populate_by_name": True}


class AlertMarkRead(BaseModel):
    alert_ids: list[uuid.UUID] = Field(..., min_length=1)


class AlertListResponse(BaseModel):
    alerts: list[AlertRead]
    total: int
    unread_count: int
