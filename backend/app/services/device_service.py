from __future__ import annotations

import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.device import Device
from app.models.device_status import DeviceStatus
from app.schemas.device import DeviceCreate, DeviceUpdate
from app.schemas.device_status import DeviceStatusCreate
from app.core.exceptions import NotFoundException, DuplicateException, ForbiddenException


class DeviceService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_device(self, user_id: uuid.UUID, body: DeviceCreate) -> Device:
        # Check if device_id string is already registered
        res = await self.db.execute(select(Device).where(Device.device_id == body.device_id))
        existing = res.scalar_one_or_none()
        if existing:
            if existing.user_id == user_id:
                return existing
            else:
                raise DuplicateException("Device", "device_id")

        device = Device(
            user_id=user_id,
            device_id=body.device_id,
            name=body.name,
            model=body.model,
            manufacturer=body.manufacturer,
            android_version=body.android_version,
            is_online=False,
        )
        self.db.add(device)
        await self.db.commit()
        await self.db.refresh(device)
        return device

    async def list_devices(self, user_id: uuid.UUID) -> tuple[list[Device], int]:
        res = await self.db.execute(select(Device).where(Device.user_id == user_id).order_name(Device.name if hasattr(Device, 'name') else Device.id))
        # Wait, order_name doesn't exist, let's use order_by(Device.created_at.desc())
        res = await self.db.execute(
            select(Device).where(Device.user_id == user_id).order_by(Device.created_at.desc())
        )
        devices = res.scalars().all()
        return list(devices), len(devices)

    async def get_device(self, device_uuid: uuid.UUID, user_id: uuid.UUID) -> Device:
        res = await self.db.execute(select(Device).where(Device.id == device_uuid))
        device = res.scalar_one_or_none()
        if not device:
            raise NotFoundException("Device", device_uuid)
        if device.user_id != user_id:
            raise ForbiddenException()
        return device

    async def update_device(self, device_uuid: uuid.UUID, user_id: uuid.UUID, body: DeviceUpdate) -> Device:
        device = await self.get_device(device_uuid, user_id)
        if body.name is not None:
            device.name = body.name
        if body.model is not None:
            device.model = body.model
        if body.manufacturer is not None:
            device.manufacturer = body.manufacturer
        if body.android_version is not None:
            device.android_version = body.android_version
        await self.db.commit()
        await self.db.refresh(device)
        return device

    async def delete_device(self, device_uuid: uuid.UUID, user_id: uuid.UUID) -> None:
        device = await self.get_device(device_uuid, user_id)
        await self.db.delete(device)
        await self.db.commit()

    async def update_status(self, user_id: uuid.UUID, body: DeviceStatusCreate) -> DeviceStatus:
        res = await self.db.execute(
            select(Device).where(Device.device_id == body.device_id, Device.user_id == user_id)
        )
        device = res.scalar_one_or_none()
        if not device:
            raise NotFoundException(f"Device with device_id string '{body.device_id}'")

        timestamp = body.timestamp or datetime.now(timezone.utc)
        status = DeviceStatus(
            device_id=device.id,
            battery_percent=body.battery_percent,
            is_charging=body.is_charging,
            wifi_connected=body.wifi_connected,
            mobile_data=body.mobile_data,
            connection_type=body.connection_type,
            network_operator=body.network_operator,
            signal_strength=body.signal_strength,
            timestamp=timestamp,
        )
        self.db.add(status)

        # Update device online status
        device.last_seen = timestamp
        device.is_online = True
        
        await self.db.commit()
        await self.db.refresh(status)
        return status

    async def get_latest_status(self, device_uuid: uuid.UUID, user_id: uuid.UUID) -> DeviceStatus:
        # Verify ownership
        await self.get_device(device_uuid, user_id)

        res = await self.db.execute(
            select(DeviceStatus)
            .where(DeviceStatus.device_id == device_uuid)
            .order_by(DeviceStatus.timestamp.desc())
            .limit(1)
        )
        status = res.scalar_one_or_none()
        if not status:
            raise NotFoundException("DeviceStatus for device", device_uuid)
        return status
