from fastapi.responses import StreamingResponse
from typing import List, Dict, AsyncGenerator
import json
import asyncio

class SSEConnectionManager:
    def __init__(self):
        self.active_connections: List[Dict] = []  # Each dict: {id, queue, artisan_id?}

    async def connect(self, artisan_id: str = None) -> AsyncGenerator:
        queue = asyncio.Queue()
        conn = {"id": id(queue), "queue": queue, "artisan_id": artisan_id}
        self.active_connections.append(conn)
        return self._event_generator(queue, conn)

    def disconnect(self, conn: Dict):
        if conn in self.active_connections:
            self.active_connections.remove(conn)

    async def _event_generator(self, queue: asyncio.Queue, conn: Dict) -> AsyncGenerator:
        try:
            while True:
                data = await queue.get()
                yield f"data: {json.dumps(data)}\n\n"
        except asyncio.CancelledError:
            self.disconnect(conn)

    async def broadcast(self, message: dict, filter_artisan_id: str = None):
        disconnected = []
        for conn in self.active_connections:
            if filter_artisan_id and conn.get("artisan_id") != filter_artisan_id:
                continue
            try:
                await conn["queue"].put(message)
            except Exception:
                disconnected.append(conn)
        for conn in disconnected:
            self.disconnect(conn)

marketplace_manager = SSEConnectionManager()
weaving_managers: Dict[str, SSEConnectionManager] = {}
