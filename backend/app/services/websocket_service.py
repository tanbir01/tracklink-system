from __future__ import annotations

import logging
from typing import Dict, List
from fastapi import WebSocket

logger = logging.getLogger("tracklink.ws")

class WebSocketManager:
    def __init__(self):
        # Maps user_id (str) to a list of active WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        logger.info("WebSocket connection added for user %s. Total active connections: %d", user_id, len(self.active_connections[user_id]))

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info("WebSocket connection removed for user %s", user_id)

    async def broadcast_to_user(self, user_id: str, message: dict):
        if user_id in self.active_connections:
            connections = self.active_connections[user_id]
            for connection in list(connections):
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error("Failed to send websocket message to user %s: %s", user_id, e)
                    # Attempt to clean up failed connection
                    try:
                        self.disconnect(connection, user_id)
                    except Exception:
                        pass


# Singleton instance
ws_manager = WebSocketManager()
