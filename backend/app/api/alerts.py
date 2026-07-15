"""
Alert API routes: list, mark read, delete.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Query, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.alert import AlertListResponse, AlertMarkRead, AlertRead
from app.services.alert_service import AlertService

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get(
    "",
    response_model=AlertListResponse,
    summary="List alerts for current user",
)
async def list_alerts(
    db: DbSession,
    current_user: CurrentUser,
    is_read: bool | None = Query(None, description="Filter by read status"),
    alert_type: str | None = Query(None, alias="type", description="Filter by alert type"),
    device_id: uuid.UUID | None = Query(None, description="Filter by device UUID"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> AlertListResponse:
    service = AlertService(db)
    alerts, total, unread_count = await service.list_alerts(
        user_id=current_user.id,
        is_read=is_read,
        alert_type=alert_type,
        device_id=device_id,
        limit=limit,
        offset=offset,
    )
    return AlertListResponse(
        alerts=[AlertRead.model_validate(a) for a in alerts],
        total=total,
        unread_count=unread_count,
    )


@router.patch(
    "/read",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Mark alerts as read",
)
async def mark_alerts_read(
    body: AlertMarkRead,
    db: DbSession,
    current_user: CurrentUser,
) -> None:
    service = AlertService(db)
    await service.mark_read(current_user.id, body.alert_ids)


@router.patch(
    "/read-all",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Mark all alerts as read",
)
async def mark_all_read(
    db: DbSession,
    current_user: CurrentUser,
) -> None:
    service = AlertService(db)
    await service.mark_all_read(current_user.id)


@router.delete(
    "/{alert_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an alert",
)
async def delete_alert(
    alert_id: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> None:
    service = AlertService(db)
    await service.delete_alert(alert_id, current_user.id)


@router.delete(
    "",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete all read alerts",
)
async def delete_read_alerts(
    db: DbSession,
    current_user: CurrentUser,
) -> None:
    service = AlertService(db)
    await service.delete_read_alerts(current_user.id)
