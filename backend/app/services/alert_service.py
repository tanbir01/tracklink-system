from __future__ import annotations

import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update, delete, and_

from app.models.alert import Alert
from app.models.device import Device
from app.core.exceptions import NotFoundException, ForbiddenException


class AlertService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_alert(
        self,
        device_id: uuid.UUID | None,
        user_id: uuid.UUID,
        alert_type: str,
        title: str,
        message: str | None,
        metadata: dict | None = None,
    ) -> Alert:
        alert = Alert(
            device_id=device_id,
            user_id=user_id,
            type=alert_type,
            title=title,
            message=message,
            metadata_=metadata or {},
        )
        self.db.add(alert)
        await self.db.flush()

        # Try to broadcast via WebSocket if active
        try:
            from app.services.websocket_service import ws_manager
            from app.schemas.alert import AlertRead
            
            # Use model_validate or dict representation
            alert_data = {
                "id": str(alert.id),
                "device_id": str(alert.device_id) if alert.device_id else None,
                "user_id": str(alert.user_id),
                "type": alert.type,
                "title": alert.title,
                "message": alert.message,
                "is_read": alert.is_read,
                "metadata": alert.metadata_,
                "created_at": alert.created_at.isoformat() if alert.created_at else datetime.now(timezone.utc).isoformat(),
            }
            await ws_manager.broadcast_to_user(
                str(user_id),
                {
                    "type": "alert",
                    "data": alert_data
                }
            )
        except Exception:
            pass  # Fail silent if websocket not online

        return alert

    async def list_alerts(
        self,
        user_id: uuid.UUID,
        is_read: bool | None = None,
        alert_type: str | None = None,
        device_id: uuid.UUID | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[Alert], int, int]:
        # Build query
        query = select(Alert).where(Alert.user_id == user_id)
        if is_read is not None:
            query = query.where(Alert.is_read == is_read)
        if alert_type is not None:
            query = query.where(Alert.type == alert_type)
        if device_id is not None:
            query = query.where(Alert.device_id == device_id)

        # Count total query
        count_query = select(func.count()).select_from(query.subquery())
        total_res = await self.db.execute(count_query)
        total = total_res.scalar_one()

        # Count unread query
        unread_query = select(func.count(Alert.id)).where(
            and_(Alert.user_id == user_id, Alert.is_read == False)
        )
        unread_res = await self.db.execute(unread_query)
        unread_count = unread_res.scalar_one()

        # Fetch records
        query = query.order_by(Alert.created_at.desc()).offset(offset).limit(limit)
        alerts_res = await self.db.execute(query)
        alerts = alerts_res.scalars().all()

        return list(alerts), total, unread_count

    async def mark_read(self, user_id: uuid.UUID, alert_ids: list[uuid.UUID]) -> None:
        await self.db.execute(
            update(Alert)
            .where(and_(Alert.user_id == user_id, Alert.id.in_(alert_ids)))
            .values(is_read=True)
        )
        await self.db.commit()

    async def mark_all_read(self, user_id: uuid.UUID) -> None:
        await self.db.execute(
            update(Alert)
            .where(and_(Alert.user_id == user_id, Alert.is_read == False))
            .values(is_read=True)
        )
        await self.db.commit()

    async def delete_alert(self, alert_id: uuid.UUID, user_id: uuid.UUID) -> None:
        res = await self.db.execute(select(Alert).where(Alert.id == alert_id))
        alert = res.scalar_one_or_none()
        if not alert:
            raise NotFoundException("Alert", alert_id)
        if alert.user_id != user_id:
            raise ForbiddenException()

        await self.db.delete(alert)
        await self.db.commit()

    async def delete_read_alerts(self, user_id: uuid.UUID) -> None:
        await self.db.execute(
            delete(Alert).where(and_(Alert.user_id == user_id, Alert.is_read == True))
        )
        await self.db.commit()
