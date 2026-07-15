"""
Location API routes: submit, batch submit, history, latest, CSV export.
"""

from __future__ import annotations

import csv
import io
import uuid
from datetime import datetime

from fastapi import APIRouter, Query, status
from starlette.responses import StreamingResponse

from app.api.deps import CurrentUser, DbSession
from app.schemas.location import (
    LocationBatchCreate,
    LocationCreate,
    LocationHistoryResponse,
    LocationRead,
)
from app.services.location_service import LocationService

router = APIRouter(prefix="/locations", tags=["Locations"])


@router.post(
    "",
    response_model=LocationRead,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a single location update",
)
async def submit_location(
    body: LocationCreate,
    db: DbSession,
    current_user: CurrentUser,
) -> LocationRead:
    service = LocationService(db)
    location = await service.submit_location(current_user.id, body)
    return LocationRead.model_validate(location)


@router.post(
    "/batch",
    response_model=list[LocationRead],
    status_code=status.HTTP_201_CREATED,
    summary="Submit a batch of location updates",
)
async def submit_locations_batch(
    body: LocationBatchCreate,
    db: DbSession,
    current_user: CurrentUser,
) -> list[LocationRead]:
    service = LocationService(db)
    locations = await service.submit_batch(current_user.id, body.locations)
    return [LocationRead.model_validate(loc) for loc in locations]


@router.get(
    "/device/{device_uuid}/history",
    response_model=LocationHistoryResponse,
    summary="Get location history for a device",
)
async def get_location_history(
    device_uuid: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
    start_time: datetime | None = Query(None),
    end_time: datetime | None = Query(None),
    limit: int = Query(default=100, ge=1, le=10000),
    offset: int = Query(default=0, ge=0),
) -> LocationHistoryResponse:
    service = LocationService(db)
    locations, total = await service.get_history(
        device_uuid, current_user.id, start_time, end_time, limit, offset
    )
    return LocationHistoryResponse(
        locations=[LocationRead.model_validate(loc) for loc in locations],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/device/{device_uuid}/latest",
    response_model=LocationRead,
    summary="Get the latest location for a device",
)
async def get_latest_location(
    device_uuid: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> LocationRead:
    service = LocationService(db)
    location = await service.get_latest(device_uuid, current_user.id)
    return LocationRead.model_validate(location)


@router.get(
    "/device/{device_uuid}/export",
    summary="Export location history as CSV",
)
async def export_locations_csv(
    device_uuid: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
    start_time: datetime | None = Query(None),
    end_time: datetime | None = Query(None),
) -> StreamingResponse:
    service = LocationService(db)
    locations, _ = await service.get_history(
        device_uuid, current_user.id, start_time, end_time, limit=10000, offset=0
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "id", "device_id", "latitude", "longitude", "altitude",
        "speed", "heading", "accuracy", "provider", "timestamp", "created_at"
    ])
    for loc in locations:
        writer.writerow([
            str(loc.id), str(loc.device_id), loc.latitude, loc.longitude,
            loc.altitude, loc.speed, loc.heading, loc.accuracy,
            loc.provider, loc.timestamp.isoformat(), loc.created_at.isoformat(),
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=locations_{device_uuid}.csv"},
    )
