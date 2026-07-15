from __future__ import annotations

import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.models.device import Device
from app.models.location import Location
from app.schemas.location import LocationCreate
from app.core.exceptions import NotFoundException, ForbiddenException
from app.services.geofence_service import GeofenceService
from app.services.alert_service import AlertService


class LocationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def submit_location(self, user_id: uuid.UUID, body: LocationCreate) -> Location:
        res = await self.db.execute(
            select(Device).where(Device.device_id == body.device_id, Device.user_id == user_id)
        )
        device = res.scalar_one_or_none()
        if not device:
            raise NotFoundException(f"Device with device_id '{body.device_id}'")

        # Deduplication check
        dup_res = await self.db.execute(
            select(Location).where(
                and_(
                    Location.device_id == device.id,
                    Location.timestamp == body.timestamp
                )
            )
        )
        existing = dup_res.scalar_one_or_none()
        if existing:
            return existing

        location = Location(
            device_id=device.id,
            latitude=body.latitude,
            longitude=body.longitude,
            altitude=body.altitude,
            speed=body.speed or 0,
            heading=body.heading or 0,
            accuracy=body.accuracy,
            provider=body.provider or 'gps',
            timestamp=body.timestamp,
        )
        self.db.add(location)

        # Update device online status
        device.last_seen = body.timestamp
        device.is_online = True

        await self.db.flush()

        # Trigger geofence checks
        geo_service = GeofenceService(self.db)
        await geo_service.check_device_location(device.id, body.latitude, body.longitude, body.timestamp)

        await self.db.commit()
        await self.db.refresh(location)
        return location

    async def submit_batch(self, user_id: uuid.UUID, locations_data: list[LocationCreate]) -> list[Location]:
        if not locations_data:
            return []

        # Find device (assuming all locations in batch are for the same device)
        device_id_str = locations_data[0].device_id
        res = await self.db.execute(
            select(Device).where(Device.device_id == device_id_str, Device.user_id == user_id)
        )
        device = res.scalar_one_or_none()
        if not device:
            raise NotFoundException(f"Device with device_id '{device_id_str}'")

        inserted_locations = []
        latest_timestamp = None

        # Geofence checks should be run on the final point in the batch to avoid spam
        latest_location = None

        for body in locations_data:
            # Deduplication check
            dup_res = await self.db.execute(
                select(Location).where(
                    and_(
                        Location.device_id == device.id,
                        Location.timestamp == body.timestamp
                    )
                )
            )
            existing = dup_res.scalar_one_or_none()
            if existing:
                inserted_locations.append(existing)
                continue

            location = Location(
                device_id=device.id,
                latitude=body.latitude,
                longitude=body.longitude,
                altitude=body.altitude,
                speed=body.speed or 0,
                heading=body.heading or 0,
                accuracy=body.accuracy,
                provider=body.provider or 'gps',
                timestamp=body.timestamp,
            )
            self.db.add(location)
            inserted_locations.append(location)

            if latest_timestamp is None or body.timestamp > latest_timestamp:
                latest_timestamp = body.timestamp
                latest_location = location

        if latest_timestamp:
            device.last_seen = latest_timestamp
            device.is_online = True

        await self.db.flush()

        # Trigger geofence checks on the latest location of the batch
        if latest_location:
            geo_service = GeofenceService(self.db)
            await geo_service.check_device_location(
                device.id, latest_location.latitude, latest_location.longitude, latest_location.timestamp
            )

        await self.db.commit()
        return inserted_locations

    async def get_history(
        self,
        device_uuid: uuid.UUID,
        user_id: uuid.UUID,
        start_time: datetime | None,
        end_time: datetime | None,
        limit: int,
        offset: int,
    ) -> tuple[list[Location], int]:
        # Verify ownership
        res_dev = await self.db.execute(select(Device).where(Device.id == device_uuid))
        device = res_dev.scalar_one_or_none()
        if not device:
            raise NotFoundException("Device", device_uuid)
        if device.user_id != user_id:
            raise ForbiddenException()

        # Build query
        query = select(Location).where(Location.device_id == device_uuid)
        if start_time:
            query = query.where(Location.timestamp >= start_time)
        if end_time:
            query = query.where(Location.timestamp <= end_time)

        # Count query
        count_query = select(func.count()).select_from(query.subquery())
        total_res = await self.db.execute(count_query)
        total = total_res.scalar_one()

        # Order and paginate
        query = query.order_by(Location.timestamp.asc()).offset(offset).limit(limit)
        locations_res = await self.db.execute(query)
        locations = locations_res.scalars().all()

        return list(locations), total

    async def get_latest(self, device_uuid: uuid.UUID, user_id: uuid.UUID) -> Location:
        # Verify ownership
        res_dev = await self.db.execute(select(Device).where(Device.id == device_uuid))
        device = res_dev.scalar_one_or_none()
        if not device:
            raise NotFoundException("Device", device_uuid)
        if device.user_id != user_id:
            raise ForbiddenException()

        res = await self.db.execute(
            select(Location)
            .where(Location.device_id == device_uuid)
            .order_by(Location.timestamp.desc())
            .limit(1)
        )
        location = res.scalar_one_or_none()
        if not location:
            raise NotFoundException("Location for device", device_uuid)
        return location
