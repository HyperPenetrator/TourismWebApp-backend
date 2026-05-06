from fastapi import WebSocket, WebSocketDisconnect
from typing import List
from auth import get_current_user_ws
from database import SessionLocal

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: dict[int, WebSocket] = {}  # user_id -> websocket

    async def connect(self, websocket: WebSocket, token: str = None):
        await websocket.accept()
        self.active_connections.append(websocket)

        # Authenticate if token provided
        if token:
            db = SessionLocal()
            try:
                user = await get_current_user_ws(token, db)
                if user:
                    self.user_connections[user.id] = websocket
                    websocket.state.user_id = user.id
            finally:
                db.close()

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        # Remove from user connections if present
        user_id = getattr(websocket.state, 'user_id', None)
        if user_id and user_id in self.user_connections:
            del self.user_connections[user_id]

    async def send_to_user(self, user_id: int, message: dict):
        """Send a message to a specific user by their ID."""
        if user_id in self.user_connections:
            try:
                await self.user_connections[user_id].send_json(message)
            except Exception:
                self.disconnect(self.user_connections[user_id])

    async def broadcast(self, message: dict):
        """
        Broadcasts a JSON payload to all active WebSocket and SSE connections.
        Handles dropped or disconnected clients seamlessly.
        """
        # Broadcast to WebSockets
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except WebSocketDisconnect:
                disconnected.append(connection)
            except RuntimeError:
                # Can occur if connection is closed unexpectedly
                disconnected.append(connection)
            except Exception as e:
                print(f"Unexpected error broadcasting to client: {e}")
                disconnected.append(connection)
        
        # Clean up any dropped WebSocket connections
        for conn in disconnected:
            self.disconnect(conn)
            
        # Broadcast to SSE
        await sse_manager.broadcast(message)

import asyncio

class SSEManager:
    def __init__(self):
        self.active_queues: List[asyncio.Queue] = []
        self.user_queues: dict[int, List[asyncio.Queue]] = {}

    async def connect(self, user_id: int = None) -> asyncio.Queue:
        queue = asyncio.Queue()
        self.active_queues.append(queue)
        if user_id is not None:
            if user_id not in self.user_queues:
                self.user_queues[user_id] = []
            self.user_queues[user_id].append(queue)
            # Store user_id on queue for cleanup
            queue.user_id = user_id
        return queue

    def disconnect(self, queue: asyncio.Queue):
        if queue in self.active_queues:
            self.active_queues.remove(queue)
        
        user_id = getattr(queue, 'user_id', None)
        if user_id and user_id in self.user_queues:
            if queue in self.user_queues[user_id]:
                self.user_queues[user_id].remove(queue)

    async def broadcast(self, message: dict):
        for queue in self.active_queues:
            await queue.put(message)

    async def send_to_user(self, user_id: int, message: dict):
        if user_id in self.user_queues:
            for queue in self.user_queues[user_id]:
                await queue.put(message)

manager = ConnectionManager()
sse_manager = SSEManager()
