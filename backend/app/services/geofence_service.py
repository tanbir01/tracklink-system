from __future__ import annotations

import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.models.geofence import Geofence, DeviceGeofence
from app.models.device import Device
from app.schemas.geofence import GeofenceCreate, GeofenceUpdate
from app.core.exceptions import NotFoundException, ForbiddenException
from app.utils.geo import haversine_distance


class GeofenceService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_geofence(self, user_id: uuid.UUID, body: GeofenceCreate) -> Geofence:
        geofence = Geofence(
            user_id=user_id,
            name=body.name,
            latitude=body.latitude,
            longitude=body.longitude,
            radius_meters=body.radius_meters,
            is_enabled=True,
        )
        self.db.add(geofence)
        await self.db.commit()
        await self.db.refresh(geofence)
        return geofence

    async def list_geofences(self, user_id: uuid.UUID) -> tuple[list[Geofence], int]:
        res = await self.db.execute(
            select(Geofence).where(Geofence.user_id == user_id).order_by(Geofence.created_at.desc())
        )
        fences = res.scalars().all()
        return list(fences), len(fences)

    async def get_geofence(self, geofence_id: uuid.UUID, user_id: uuid.UUID) -> Geofence:
        res = await self.db.execute(select(Geofence).where(Geofence.id == geofence_id))
        geofence = res.scalar_one_or_none()
        if not geofence:
            raise NotFoundException("Geofence", geofence_id)
        if geofence.user_id != user_id:
            raise ForbiddenException()
        return geofence

    async def update_geofence(self, geofence_id: uuid.UUID, user_id: uuid.UUID, body: GeofenceUpdate) -> Geofence:
        geofence = await self.get_geofence(geofence_id, user_id)
        if body.name is not None:
            geofence.name = body.name
        if body.latitude is not None:
            geofence.latitude = body.latitude
        if body.longitude is not None:
            geofence.longitude = body.longitude
        if body.radius_meters is not None:
            geofence.radius_meters = body.radius_meters
        await self.db.commit()
        await self.db.refresh(geofence)
        return geofence

    async def toggle_geofence(self, geofence_id: uuid.UUID, user_id: uuid.UUID, is_enabled: bool) -> Geofence:
        geofence = await self.get_geofence(geofence_id, user_id)
        geofence.is_enabled = is_enabled
        await self.db.commit()
        await self.db.refresh(geofence)
        return geofence

    async def delete_geofence(self, geofence_id: uuid.UUID, user_id: uuid.UUID) -> None:
        geofence = await self.get_geofence(geofence_id, user_id)
        await self.db.delete(geofence)
        await self.db.commit()

    async def check_device_location(
        self, device_id: uuid.UUID, latitude: float, longitude: float, timestamp: datetime
    ) -> None:
        # Get device
        dev_res = await self.db.execute(select(Device).where(Device.id == device_id))
        device = dev_res.scalar_one_or_none()
        if not device:
            return

        # Get all enabled geofences for this device's owner
        fence_res = await self.db.execute(
            select(Geofence).where(Geofence.user_id == device.user_id, Geofence.is_enabled == True)
        )
        geofences = fence_res.scalars().all()

        from app.services.alert_service import AlertService
        alert_service = AlertService(self.db)

        for fence in geofences:
            distance = haversine_distance(latitude, longitude, fence.latitude, fence.longitude)
            is_inside = distance <= fence.radius_meters
            current_state = "inside" if is_inside else "outside"

            # Check previous state
            state_res = await self.db.execute(
                select(DeviceGeofence).where(
                    and_(
                        DeviceGeofence.device_id == device_id,
                        DeviceGeofence.geofence_id == fence.id
                    )
                )
            )
            device_fence = state_res.scalar_one_or_none()

            if not device_fence:
                # First time seeing location relative to this geofence
                device_fence = DeviceGeofence(
                    device_id=device_id,
                    geofence_id=fence.id,
                    last_state=current_state,
                    updated_at=timestamp,
                )
                self.db.add(device_fence)
                # No alert generated since we just established baseline
            else:
                old_state = device_fence.last_state
                if old_state != current_state:
                    # Transition occurred!
                    device_fence.last_state = current_state
                    device_fence.updated_at = timestamp

                    # Trigger alert
                    if current_state == "inside":
                        await alert_service.create_alert(
                            device_id=device_id,
                            user_id=device.user_id,
                            alert_type="geofence_enter",
                            title="Geofence Entered",
                            message=f"Device '{device.name}' entered geofence '{fence.name}'.",
                            metadata={"geofence_id": str(fence.id), "distance": distance},
                        )
                    else:
                        await alert_service.create_alert(
                            device_id=device_id,
                            user_id=device.user_id,
                            alert_type="geofence_exit",
                            title="Geofence Exited",
                            message=f"Device '{device.name}' exited geofence '{fence.name}'.",
                            metadata={"geofence_id": str(fence.id), "distance": distance},
                        )

        await self.db.flush()
