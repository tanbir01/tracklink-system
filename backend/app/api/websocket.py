"""
WebSocket endpoint with JWT authentication.
Broadcasts: location_update, device_status, alert, device_online, device_offline.
"""

from __future__ import annotations

import json
import logging
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import JWTError
from sqlalchemy import select

from app.core.security import decode_access_token
from app.database import async_session_factory
from app.models.user import User
from app.services.websocket_service import ws_manager

logger = logging.getLogger("tracklink.ws")
router = APIRouter()


async def authenticate_websocket(websocket: WebSocket) -> User | None:
    """
    Authenticate a WebSocket connection using JWT token from query parameter.

    Expected: ws://host/ws?token=<JWT_ACCESS_TOKEN>
    """
    token = websocket.query_params.get("token")
    if not token:
        return None

    try:
        payload = decode_access_token(token)
        user_id_str = payload.get("sub")
        if not user_id_str:
            return None
        user_id = uuid.UUID(user_id_str)
    except (JWTError, ValueError):
        return None

    async with async_session_factory() as session:
        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user and user.is_active:
            return user
    return None


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    """
    WebSocket endpoint for real-time communication.

    Auth: pass JWT token as ?token= query parameter.
    The server pushes events as JSON messages:
    {
        "type": "location_update" | "device_status" | "alert" | "device_online" | "device_offline",
        "data": { ... }
    }
    """
    user = await authenticate_websocket(websocket)
    if user is None:
        await websocket.close(code=4001, reason="Authentication required")
        return

    user_id = str(user.id)
    await ws_manager.connect(websocket, user_id)
    logger.info("WebSocket connected: user=%s", user_id)

    try:
        while True:
            # Keep the connection alive; clients can send ping/pong or heartbeat
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
                msg_type = data.get("type", "")
                if msg_type == "ping":
                    await websocket.send_json({"type": "pong"})
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected: user=%s", user_id)
    except Exception as e:
        logger.error("WebSocket error for user=%s: %s", user_id, e)
    finally:
        ws_manager.disconnect(websocket, user_id)
