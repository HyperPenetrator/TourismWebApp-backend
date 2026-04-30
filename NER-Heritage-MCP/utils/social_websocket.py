"""
NER-Heritage-MCP | Spot@NE Platform
Social Engagement WebSocket Manager — Room-Based Real-Time Broadcast

A high-performance, asyncio-native WebSocket connection manager that organizes
clients into "rooms" keyed by post_id. Handles:
    - Room join/leave with automatic cleanup on disconnect
    - Targeted broadcast to all subscribers of a specific post
    - Global broadcast across all rooms (for system-wide events)
    - Graceful error handling so one bad client never crashes the server

Usage:
    from utils.social_websocket import engagement_manager

    # In your WebSocket endpoint handler:
    await engagement_manager.connect(websocket, post_id)
    try:
        while True:
            data = await websocket.receive_text()
            ...
    except WebSocketDisconnect:
        engagement_manager.disconnect(websocket, post_id)

    # From your MCP tool or any async context:
    await engagement_manager.broadcast_to_post(post_id, event_payload)
"""

import asyncio
import json
import logging
from typing import Any

from fastapi import WebSocket

# ─── Logging ─────────────────────────────────────────────────────────────────

log = logging.getLogger("spot-ne-social-ws")

# ─── Connection Manager ──────────────────────────────────────────────────────


class SocialWebSocketManager:
    """
    Manages WebSocket connections grouped by post_id rooms.

    Thread-safe via asyncio (single event loop). Each room is a set of
    WebSocket connections. Broadcasting iterates over the set and silently
    removes any connection that has gone stale.
    """

    def __init__(self) -> None:
        # { post_id: set(WebSocket, ...) }
        self._rooms: dict[str, set[WebSocket]] = {}
        # Reverse lookup for fast disconnect: { id(ws): post_id }
        self._client_room_map: dict[int, str] = {}

    # ── Connection Lifecycle ──────────────────────────────────────────────

    async def connect(self, websocket: WebSocket, post_id: str) -> None:
        """Accepts a WebSocket handshake and registers it in the post's room."""
        await websocket.accept()

        if post_id not in self._rooms:
            self._rooms[post_id] = set()
            log.info(f"Room created for post '{post_id}'.")

        self._rooms[post_id].add(websocket)
        self._client_room_map[id(websocket)] = post_id
        log.info(
            f"Client joined room '{post_id}'. "
            f"Room size: {len(self._rooms[post_id])}."
        )

    def disconnect(self, websocket: WebSocket, post_id: str | None = None) -> None:
        """
        Removes a WebSocket from its room. If post_id is not provided,
        uses the reverse lookup to find it. Cleans up empty rooms.
        """
        resolved_post_id = post_id or self._client_room_map.pop(id(websocket), None)

        if resolved_post_id is None:
            log.warning("Attempted to disconnect unknown client; ignoring.")
            return

        room = self._rooms.get(resolved_post_id)
        if room is not None:
            room.discard(websocket)
            log.info(
                f"Client left room '{resolved_post_id}'. "
                f"Room size: {len(room)}."
            )
            # Garbage-collect empty rooms
            if not room:
                del self._rooms[resolved_post_id]
                log.info(f"Room '{resolved_post_id}' is empty — removed.")

        # Clean up reverse map entry (if not already popped above)
        self._client_room_map.pop(id(websocket), None)

    # ── Broadcasting ──────────────────────────────────────────────────────

    async def broadcast_to_post(self, post_id: str, event: dict[str, Any]) -> int:
        """
        Sends a JSON event to every client subscribed to the given post_id room.

        Returns the number of clients that successfully received the message.
        Silently disconnects any client that raises during send.
        """
        room = self._rooms.get(post_id)
        if not room:
            log.debug(f"No active subscribers for post '{post_id}'; broadcast skipped.")
            return 0

        message = json.dumps(event)
        stale_connections: list[WebSocket] = []
        success_count = 0

        # Fan out concurrently for performance
        async def _safe_send(ws: WebSocket) -> bool:
            try:
                await ws.send_text(message)
                return True
            except Exception:
                return False

        results = await asyncio.gather(
            *[_safe_send(ws) for ws in room],
            return_exceptions=True,
        )

        # Pair results back with the websockets to identify stale ones
        for ws, result in zip(list(room), results):
            if result is True:
                success_count += 1
            else:
                stale_connections.append(ws)

        # Evict stale connections
        for ws in stale_connections:
            self.disconnect(ws, post_id)
            log.warning(f"Evicted stale client from room '{post_id}'.")

        log.info(
            f"Broadcast to '{post_id}': {success_count}/{len(room) + len(stale_connections)} "
            f"clients received the event."
        )
        return success_count

    async def broadcast_global(self, event: dict[str, Any]) -> int:
        """
        Broadcasts an event to ALL connected clients across every room.
        Useful for system-wide announcements.
        Returns total number of successful deliveries.
        """
        total = 0
        for post_id in list(self._rooms.keys()):
            total += await self.broadcast_to_post(post_id, event)
        return total

    # ── Diagnostics ───────────────────────────────────────────────────────

    @property
    def active_rooms(self) -> int:
        """Returns the count of rooms with at least one subscriber."""
        return len(self._rooms)

    @property
    def total_connections(self) -> int:
        """Returns the total number of active WebSocket connections."""
        return sum(len(room) for room in self._rooms.values())

    def room_size(self, post_id: str) -> int:
        """Returns the number of subscribers in a specific room."""
        return len(self._rooms.get(post_id, set()))

    def status_snapshot(self) -> dict[str, Any]:
        """Returns a diagnostic summary of all rooms."""
        return {
            "active_rooms": self.active_rooms,
            "total_connections": self.total_connections,
            "rooms": {
                pid: len(clients) for pid, clients in self._rooms.items()
            },
        }


# ─── Module-Level Singleton ──────────────────────────────────────────────────
# Import this instance from anywhere in the application to share state.

engagement_manager = SocialWebSocketManager()
