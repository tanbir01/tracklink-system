"""
Device management API routes: CRUD + status updates.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.device import DeviceCreate, DeviceListRead, DeviceRead, DeviceUpdate
from app.schemas.device_status import DeviceStatusCreate, DeviceStatusRead
from app.services.device_service import DeviceService

router = APIRouter(prefix="/devices", tags=["Devices"])


@router.post(
    "",
    response_model=DeviceRead,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new device",
)
async def create_device(
    body: DeviceCreate,
    db: DbSession,
    current_user: CurrentUser,
) -> DeviceRead:
    service = DeviceService(db)
    device = await service.create_device(current_user.id, body)
    return DeviceRead.model_validate(device)


@router.get(
    "",
    response_model=DeviceListRead,
    summary="List all user devices",
)
async def list_devices(
    db: DbSession,
    current_user: CurrentUser,
) -> DeviceListRead:
    service = DeviceService(db)
    devices, total = await service.list_devices(current_user.id)
    return DeviceListRead(
        devices=[DeviceRead.model_validate(d) for d in devices],
        total=total,
    )


@router.get(
    "/{device_uuid}",
    response_model=DeviceRead,
    summary="Get a specific device",
)
async def get_device(
    device_uuid: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> DeviceRead:
    service = DeviceService(db)
    device = await service.get_device(device_uuid, current_user.id)
    return DeviceRead.model_validate(device)


@router.put(
    "/{device_uuid}",
    response_model=DeviceRead,
    summary="Update device details",
)
async def update_device(
    device_uuid: uuid.UUID,
    body: DeviceUpdate,
    db: DbSession,
    current_user: CurrentUser,
) -> DeviceRead:
    service = DeviceService(db)
    device = await service.update_device(device_uuid, current_user.id, body)
    return DeviceRead.model_validate(device)


@router.delete(
    "/{device_uuid}",
    status_code=status.HTTP_200_OK,
    summary="Delete a device",
)
async def delete_device(
    device_uuid: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> None:
    service = DeviceService(db)
    await service.delete_device(device_uuid, current_user.id)


@router.post(
    "/status",
    response_model=DeviceStatusRead,
    status_code=status.HTTP_201_CREATED,
    summary="Submit device status update",
)
async def submit_device_status(
    body: DeviceStatusCreate,
    db: DbSession,
    current_user: CurrentUser,
) -> DeviceStatusRead:
    service = DeviceService(db)
    device_status = await service.update_status(current_user.id, body)
    return DeviceStatusRead.model_validate(device_status)


@router.get(
    "/{device_uuid}/status",
    response_model=DeviceStatusRead,
    summary="Get latest device status",
)
async def get_device_status(
    device_uuid: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> DeviceStatusRead:
    service = DeviceService(db)
    device_status = await service.get_latest_status(device_uuid, current_user.id)
    return DeviceStatusRead.model_validate(device_status)
