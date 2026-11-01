"""WebSocket connection manager for AQUASENSE-X real-time updates."""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

from fastapi import WebSocket, WebSocketDisconnect


logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages active WebSocket connections and broadcasts updates."""

    def __init__(self) -> None:
        self.active_connections: list[WebSocket] = []
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        async with self._lock:
            self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket) -> None:
        """Unregister a WebSocket connection."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, data: dict[str, Any]) -> None:
        """Broadcast data to all connected clients.

        Automatically removes stale connections if send fails.
        """
        if not self.active_connections:
            return

        message = json.dumps(data)
        disconnected: list[WebSocket] = []

        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except WebSocketDisconnect:
                disconnected.append(connection)
            except RuntimeError as e:
                if "WebSocket is not connected" in str(e):
                    disconnected.append(connection)
                else:
                    logger.exception(f"Error broadcasting to WebSocket: {e}")
            except Exception as e:
                logger.exception(f"Unexpected error broadcasting to WebSocket: {e}")

        # Clean up disconnected clients
        for ws in disconnected:
            self.disconnect(ws)

    async def send_personal(self, message: dict[str, Any], websocket: WebSocket) -> None:
        """Send a message to a specific client."""
        try:
            await websocket.send_json(message)
        except (WebSocketDisconnect, RuntimeError):
            self.disconnect(websocket)

    @property
    def connection_count(self) -> int:
        return len(self.active_connections)
