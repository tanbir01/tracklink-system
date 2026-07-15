"""
Geofence API routes: CRUD + toggle enable/disable.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.geofence import (
    GeofenceCreate,
    GeofenceListResponse,
    GeofenceRead,
    GeofenceToggle,
    GeofenceUpdate,
)
from app.services.geofence_service import GeofenceService

router = APIRouter(prefix="/geofences", tags=["Geofences"])


@router.post(
    "",
    response_model=GeofenceRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a geofence",
)
async def create_geofence(
    body: GeofenceCreate,
    db: DbSession,
    current_user: CurrentUser,
) -> GeofenceRead:
    service = GeofenceService(db)
    geofence = await service.create_geofence(current_user.id, body)
    return GeofenceRead.model_validate(geofence)


@router.get(
    "",
    response_model=GeofenceListResponse,
    summary="List all geofences",
)
async def list_geofences(
    db: DbSession,
    current_user: CurrentUser,
) -> GeofenceListResponse:
    service = GeofenceService(db)
    geofences, total = await service.list_geofences(current_user.id)
    return GeofenceListResponse(
        geofences=[GeofenceRead.model_validate(g) for g in geofences],
        total=total,
    )


@router.get(
    "/{geofence_id}",
    response_model=GeofenceRead,
    summary="Get a specific geofence",
)
async def get_geofence(
    geofence_id: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> GeofenceRead:
    service = GeofenceService(db)
    geofence = await service.get_geofence(geofence_id, current_user.id)
    return GeofenceRead.model_validate(geofence)


@router.put(
    "/{geofence_id}",
    response_model=GeofenceRead,
    summary="Update a geofence",
)
async def update_geofence(
    geofence_id: uuid.UUID,
    body: GeofenceUpdate,
    db: DbSession,
    current_user: CurrentUser,
) -> GeofenceRead:
    service = GeofenceService(db)
    geofence = await service.update_geofence(geofence_id, current_user.id, body)
    return GeofenceRead.model_validate(geofence)


@router.patch(
    "/{geofence_id}/toggle",
    response_model=GeofenceRead,
    summary="Toggle geofence enabled/disabled",
)
async def toggle_geofence(
    geofence_id: uuid.UUID,
    body: GeofenceToggle,
    db: DbSession,
    current_user: CurrentUser,
) -> GeofenceRead:
    service = GeofenceService(db)
    geofence = await service.toggle_geofence(geofence_id, current_user.id, body.is_enabled)
    return GeofenceRead.model_validate(geofence)


@router.delete(
    "/{geofence_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a geofence",
)
async def delete_geofence(
    geofence_id: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> None:
    service = GeofenceService(db)
    await service.delete_geofence(geofence_id, current_user.id)
