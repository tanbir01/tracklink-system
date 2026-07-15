"""Location-related Pydantic schemas."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

__all__ = [
    "LocationCreate",
    "LocationBatchCreate",
    "LocationRead",
    "LocationHistoryParams",
    "LocationHistoryResponse",
]


class LocationCreate(BaseModel):
    device_id: str = Field(..., min_length=1, max_length=255, description="Unique device identifier string")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    altitude: float | None = None
    speed: float | None = Field(None, ge=0)
    heading: float | None = Field(None, ge=0, le=360)
    accuracy: float | None = Field(None, ge=0)
    provider: str | None = Field("gps", max_length=50)
    timestamp: datetime

    @field_validator("provider")
    @classmethod
    def validate_provider(cls, v: str | None) -> str | None:
        if v is not None:
            allowed = {"gps", "network", "fused", "passive"}
            if v.lower() not in allowed:
                return "gps"
            return v.lower()
        return v


class LocationBatchCreate(BaseModel):
    locations: list[LocationCreate] = Field(..., min_length=1, max_length=100)


class LocationRead(BaseModel):
    id: uuid.UUID
    device_id: uuid.UUID
    latitude: float
    longitude: float
    altitude: float | None
    speed: float | None
    heading: float | None
    accuracy: float | None
    provider: str | None
    timestamp: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class LocationHistoryParams(BaseModel):
    start_time: datetime | None = None
    end_time: datetime | None = None
    limit: int = Field(default=100, ge=1, le=10000)
    offset: int = Field(default=0, ge=0)


class LocationHistoryResponse(BaseModel):
    locations: list[LocationRead]
    total: int
    limit: int
    offset: int
