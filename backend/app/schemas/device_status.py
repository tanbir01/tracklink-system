"""DeviceStatus-related Pydantic schemas."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

__all__ = [
    "DeviceStatusCreate",
    "DeviceStatusRead",
]


class DeviceStatusCreate(BaseModel):
    device_id: str = Field(..., min_length=1, max_length=255, description="Unique device identifier string")
    battery_percent: int | None = Field(None, ge=0, le=100)
    is_charging: bool | None = False
    wifi_connected: bool | None = False
    mobile_data: bool | None = False
    connection_type: str | None = Field(None, max_length=50)
    network_operator: str | None = Field(None, max_length=100)
    signal_strength: int | None = None
    timestamp: datetime | None = None


class DeviceStatusRead(BaseModel):
    id: uuid.UUID
    device_id: uuid.UUID
    battery_percent: int | None
    is_charging: bool | None
    wifi_connected: bool | None
    mobile_data: bool | None
    connection_type: str | None
    network_operator: str | None
    signal_strength: int | None
    timestamp: datetime

    model_config = {"from_attributes": True}
