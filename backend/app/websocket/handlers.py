"""WebSocket endpoint handlers for AQUASENSE-X live data streaming."""

from __future__ import annotations

import asyncio
import logging
from typing import TYPE_CHECKING

from fastapi import WebSocket, WebSocketDisconnect

from ..websocket.manager import ConnectionManager

if TYPE_CHECKING:
    from ..simulation.engine import SimulationEngine


logger = logging.getLogger(__name__)


class SimulationWebSocketHandler:
    """Connects simulation engine to WebSocket broadcasts."""

    def __init__(self, connection_manager: ConnectionManager, simulation_engine: SimulationEngine) -> None:
        self.manager = connection_manager
        self.engine = simulation_engine
        self._registered = False

    def register(self) -> None:
        """Register the broadcast callback with the simulation engine."""
        if not self._registered:
            self.engine.add_listener(self._broadcast_callback)
            self._registered = True

    def unregister(self) -> None:
        """Unregister the broadcast callback."""
        if self._registered:
            self.engine.remove_listener(self._broadcast_callback)
            self._registered = False

    async def _broadcast_callback(self, state: dict) -> None:
        """Called by the simulation engine on each tick."""
        await self.manager.broadcast({
            "type": "simulation_update",
            "data": state,
        })

    async def handle_websocket(self, websocket: WebSocket) -> None:
        """Main WebSocket connection handler.

        Accepts connection, sends initial state, then maintains connection
        while broadcasting simulation updates.
        """
        await self.manager.connect(websocket)

        try:
            # Send initial state
            await self.manager.send_personal(
                {
                    "type": "connection_established",
                    "message": "Connected to AQUASENSE-X simulation",
                },
                websocket,
            )

            # Send current state
            current_state = self.engine.get_current_state()
            await self.manager.send_personal(
                {
                    "type": "initial_state",
                    "data": current_state,
                },
                websocket,
            )

            # Keep connection alive and handle client messages
            while True:
                try:
                    # Wait for client messages (e.g., ping/pong)
                    data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                    # Echo or handle client commands if needed
                    logger.debug(f"Received WebSocket message: {data}")
                except asyncio.TimeoutError:
                    # Send keepalive ping
                    await self.manager.send_personal({"type": "ping"}, websocket)
                except WebSocketDisconnect:
                    break

        except WebSocketDisconnect:
            logger.info("WebSocket client disconnected normally")
        except Exception as e:
            logger.exception(f"WebSocket error: {e}")
        finally:
            self.manager.disconnect(websocket)


# ---------------------------------------------------------------------------
# FastAPI endpoint (to be imported in main.py or routes)
# ---------------------------------------------------------------------------

async def websocket_endpoint(
    websocket: WebSocket,
    handler: SimulationWebSocketHandler,
) -> None:
    """FastAPI WebSocket endpoint.

    Usage in FastAPI app:

    ```python
    from fastapi import FastAPI, WebSocket

    app = FastAPI()
    ws_handler = SimulationWebSocketHandler(connection_manager, simulation_engine)
    ws_handler.register()

    @app.websocket("/ws/simulation")
    async def websocket_route(websocket: WebSocket):
        await ws_handler.handle_websocket(websocket)
    ```
    """
    await handler.handle_websocket(websocket)
