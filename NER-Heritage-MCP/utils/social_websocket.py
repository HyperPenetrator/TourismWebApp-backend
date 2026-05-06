import logging
import asyncio
import json
import random
import base64
from typing import Dict, Set, Optional
from datetime import datetime, timezone
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("unified_ws")

app = FastAPI(title="Spot@NE Unified WebSocket Manager")

# Add CORS middleware for REST endpoints (like /upload)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FeedManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.sse_queues: Set[asyncio.Queue] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"[MARKETPLACE] Client connected to live feed. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"[MARKETPLACE] Client disconnected. Total: {len(self.active_connections)}")

    async def connect_sse(self) -> asyncio.Queue:
        queue = asyncio.Queue()
        self.sse_queues.add(queue)
        logger.info(f"[MARKETPLACE] SSE Client connected. Total: {len(self.sse_queues)}")
        return queue

    def disconnect_sse(self, queue: asyncio.Queue):
        self.sse_queues.discard(queue)
        logger.info(f"[MARKETPLACE] SSE Client disconnected. Total: {len(self.sse_queues)}")

    async def broadcast(self, message: dict):
        # Broadcast to WebSockets
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.add(connection)
        for dead in disconnected:
            self.disconnect(dead)
            
        # Broadcast to SSE
        for queue in self.sse_queues:
            await queue.put(message)

feed_manager = FeedManager()

@app.post("/upload")
async def upload_item(request: Request):
    """Handles multipart/form-data uploads and broadcasts to the feed."""
    logger.info("[MARKETPLACE] Received item upload request")
    try:
        form = await request.form()
        description = form.get("description", "")
        price = form.get("price", "0")
        tags_str = form.get("tags", "[]")
        file = form.get("file")
        
        # Tags are sent as JSON string array
        try:
            tags = json.loads(tags_str)
        except:
            tags = []
            
        image_url = f"https://picsum.photos/seed/{random.randint(1, 1000)}/800/800"
        if hasattr(file, "file"):
            content = await file.read()
            b64_content = base64.b64encode(content).decode()
            content_type = getattr(file, "content_type", "image/jpeg")
            image_url = f"data:{content_type};base64,{b64_content}"
            
        new_item = {
            "id": f"item_{random.randint(1000, 9999)}",
            "image_url": image_url,
            "description": description,
            "list_price": float(price),
            "tags": tags,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Broadcast to all feed listeners
        await feed_manager.broadcast(new_item)
        
        return {"status": "success", "item": new_item}
    except Exception as e:
        logger.error(f"[MARKETPLACE] Upload error: {e}")
        return {"status": "error", "detail": str(e)}

# ─── Social Engagement Logic ────────────────────────────────────────────────

class SocialManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.user_connections: Dict[str, Dict[int, WebSocket]] = {}  # post_id -> {user_id: ws}
        self.sse_queues: Dict[str, Set[asyncio.Queue]] = {} # post_id -> {queues}

    async def connect(self, websocket: WebSocket, post_id: str, user_id: int = None):
        await websocket.accept()
        if post_id not in self.active_connections:
            self.active_connections[post_id] = set()
        self.active_connections[post_id].add(websocket)
        if user_id:
            if post_id not in self.user_connections:
                self.user_connections[post_id] = {}
            self.user_connections[post_id][user_id] = websocket
            websocket.state.user_id = user_id
        logger.info(f"[SOCIAL] Client connected to post '{post_id}'. Room size: {len(self.active_connections[post_id])}")

    def disconnect(self, websocket: WebSocket, post_id: str):
        if post_id in self.active_connections:
            self.active_connections[post_id].discard(websocket)
            # Remove from user_connections if present
            user_id = getattr(websocket.state, 'user_id', None)
            if user_id and post_id in self.user_connections:
                self.user_connections[post_id].pop(user_id, None)
            if not self.active_connections[post_id]:
                del self.active_connections[post_id]
                if post_id in self.user_connections:
                    del self.user_connections[post_id]

    async def connect_sse(self, post_id: str) -> asyncio.Queue:
        queue = asyncio.Queue()
        if post_id not in self.sse_queues:
            self.sse_queues[post_id] = set()
        self.sse_queues[post_id].add(queue)
        logger.info(f"[SOCIAL] SSE Client connected to post '{post_id}'. Room size: {len(self.sse_queues[post_id])}")
        return queue

    def disconnect_sse(self, queue: asyncio.Queue, post_id: str):
        if post_id in self.sse_queues:
            self.sse_queues[post_id].discard(queue)
            if not self.sse_queues[post_id]:
                del self.sse_queues[post_id]

    async def broadcast_to_post(self, post_id: str, message: dict):
        # Broadcast to WebSockets
        if post_id in self.active_connections:
            disconnected_sockets = set()
            for connection in self.active_connections[post_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected_sockets.add(connection)
            for dead_socket in disconnected_sockets:
                self.disconnect(dead_socket, post_id)
        
        # Broadcast to SSE
        if post_id in self.sse_queues:
            for queue in self.sse_queues[post_id]:
                await queue.put(message)

    def room_size(self, post_id: str) -> int:
        """Returns the number of active subscribers for a specific post."""
        ws_size = len(self.active_connections.get(post_id, set()))
        sse_size = len(self.sse_queues.get(post_id, set()))
        return ws_size + sse_size

    def status_snapshot(self) -> dict:
        """Returns a diagnostic summary of all active rooms."""
        return {
            "active_rooms": len(self.active_connections),
            "total_connections": sum(len(conns) for conns in self.active_connections.values()),
            "rooms": {pid: len(conns) for pid, conns in self.active_connections.items()}
        }

engagement_manager = SocialManager()

# ─── Weaving Telemetry Logic ────────────────────────────────────────────────

ARTISAN_PROFILES = {
    "a1": {"name": "Kiran Devi", "location": "Imphal, Manipur", "complexity_pool": ["Exceptional — Silk Brocade (Muga)", "High — Double Ikat"], "base_hours": 28, "speed": (35, 65)},
    "a2": {"name": "Tenzing Namgyal", "location": "Gangtok, Sikkim", "complexity_pool": ["Medium — Bamboo Mat Interlace", "High — Structural Bamboo Weave"], "base_hours": 14, "speed": (20, 45)},
    "a3": {"name": "Lakhimi Baruah", "location": "Majuli, Assam", "complexity_pool": ["Medium — Salmora Coil Pottery", "Exceptional — Riverbed Clay Mosaic"], "base_hours": 18, "speed": (10, 30)},
}
ALERT_POOL = ["Thread tension variance detected", "Loom speed approaching optimal cadence", "Pattern integrity above 98%"]

class WeavingSession:
    def __init__(self, artisan_id: str):
        self.artisan_id = artisan_id
        self.profile = ARTISAN_PROFILES.get(artisan_id, ARTISAN_PROFILES["a1"])
        self.progress = random.uniform(10.0, 40.0)
        self.complexity = random.choice(self.profile["complexity_pool"])
        self.cooldown = 0

    def advance(self) -> dict:
        self.progress = min(self.progress + random.uniform(0.2, 0.5), 100.0)
        shuttle_speed = random.randint(*self.profile["speed"])
        integrity = round(random.uniform(96.0, 99.9), 2)
        remaining = round(self.profile["base_hours"] * ((100 - self.progress)/100), 1)
        
        alert = None
        if self.cooldown <= 0 and random.random() < 0.2:
            alert = random.choice(ALERT_POOL)
            self.cooldown = 10
        else:
            self.cooldown = max(0, self.cooldown - 1)

        return {
            "timestamp": int(datetime.now(timezone.utc).timestamp()),
            "artisan_id": self.artisan_id,
            "metrics": {
                "weave_complexity": self.complexity,
                "current_progress": f"{self.progress:.2f}%",
                "shuttle_speed": f"{shuttle_speed} ppm",
                "pattern_integrity": f"{integrity}%",
                "estimated_completion_time": f"{remaining} hours",
                "status": "Live broadcast active"
            },
            "alerts": [alert] if alert else []
        }

_weaving_sessions: Dict[str, WeavingSession] = {}

@app.websocket("/ws/weaving/{artisan_id}")
async def weaving_websocket(websocket: WebSocket, artisan_id: str):
    await websocket.accept()
    if artisan_id not in _weaving_sessions:
        _weaving_sessions[artisan_id] = WeavingSession(artisan_id)
    
    logger.info(f"[WEAVING] Client connected for artisan '{artisan_id}'")
    try:
        while True:
            payload = _weaving_sessions[artisan_id].advance()
            await websocket.send_json(payload)
            await asyncio.sleep(2.0)
    except WebSocketDisconnect:
        logger.info(f"[WEAVING] Client disconnected for artisan '{artisan_id}'")
    except Exception as e:
        logger.error(f"[WEAVING] Error: {e}")



@app.get("/sse/weaving/{artisan_id}")
async def sse_weaving(request: Request, artisan_id: str):
    """SSE endpoint for weaving telemetry."""
    if artisan_id not in _weaving_sessions:
        _weaving_sessions[artisan_id] = WeavingSession(artisan_id)
    
    async def event_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break
                payload = _weaving_sessions[artisan_id].advance()
                yield f"data: {json.dumps(payload)}\n\n"
                await asyncio.sleep(2.0)
        except asyncio.CancelledError:
            pass

    return StreamingResponse(event_generator(), media_type="text/event-stream")

# ─── Marketplace Feed Logic ─────────────────────────────────────────────────

MARKETPLACE_SAMPLE_ITEMS = [
    {
        "description": "Horn of Buffalo", 
        "list_price": 2450, 
        "tags": ["ethnic", "assam"],
        "image_url": "http://localhost:3000/images/1.jpeg"
    },
    {
        "description": "Hand-Made mask", 
        "list_price": 1850, 
        "tags": ["handmade", "mask"],
        "image_url": "http://localhost:3000/images/2.jpeg"
    },
    {
        "description": "Muga Dress", 
        "list_price": 5500, 
        "tags": ["woven", "assam"],
        "image_url": "http://localhost:3000/images/3.jpeg"
    },
]

# Create a background task to simulate activity
async def simulate_marketplace_activity():
    # Wait for the first client to connect before starting the sequence
    while not feed_manager.active_connections:
        await asyncio.sleep(1)
    
    # Send each sample item exactly once
    for sample in MARKETPLACE_SAMPLE_ITEMS:
        await asyncio.sleep(5)  # Wait 5 seconds between items
        new_item = {
            "id": f"item_{random.randint(1000, 9999)}",
            "image_url": sample.get("image_url"),
            "description": sample["description"],
            "list_price": sample["list_price"],
            "tags": sample["tags"],
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await feed_manager.broadcast(new_item)
    
    # Simulation ends here. No more items until user uploads via /upload.
    logger.info("[MARKETPLACE] Initial sequence completed. Simulation stopped.")

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(simulate_marketplace_activity())

@app.websocket("/ws/feed")
async def marketplace_websocket(websocket: WebSocket):
    await feed_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        feed_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"[MARKETPLACE] Error: {e}")
        feed_manager.disconnect(websocket)

@app.get("/sse/feed")
@app.get("/sse/marketplace")
async def sse_marketplace_feed(request: Request):
    """SSE endpoint for marketplace feed updates."""
    async def event_generator():
        queue = await feed_manager.connect_sse()
        try:
            while True:
                if await request.is_disconnected():
                    break
                data = await queue.get()
                yield f"data: {json.dumps(data)}\n\n"
        finally:
            feed_manager.disconnect_sse(queue)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/sse/engagement/{post_id}")
async def sse_engagement(request: Request, post_id: str):
    """SSE endpoint for social engagement updates."""
    async def event_generator():
        queue = await engagement_manager.connect_sse(post_id)
        try:
            while True:
                if await request.is_disconnected():
                    break
                data = await queue.get()
                yield f"data: {json.dumps(data)}\n\n"
        finally:
            engagement_manager.disconnect_sse(queue, post_id)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

# ─── Social Endpoints ───────────────────────────────────────────────────────

@app.websocket("/ws/engagement/{post_id}")
async def social_websocket(
    websocket: WebSocket,
    post_id: str,
    token: str = Query(None)
):
    user_id = None
    if token:
        from auth import get_current_user_ws
        from database import SessionLocal
        db = SessionLocal()
        try:
            user = await get_current_user_ws(token, db)
            if user:
                user_id = user.id
        finally:
            db.close()

    await engagement_manager.connect(websocket, post_id, user_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        engagement_manager.disconnect(websocket, post_id)
    except Exception:
        engagement_manager.disconnect(websocket, post_id)

class BroadcastPayload(BaseModel):
    post_id: str
    event_type: str
    data: dict

@app.post("/api/internal/broadcast")
async def trigger_broadcast(payload: BroadcastPayload):
    message = {"type": payload.event_type, "data": payload.data}
    await engagement_manager.broadcast_to_post(payload.post_id, message)
    return {"status": "success"}

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 7860))
    logger.info(f"Starting Unified Spot@NE WebSocket Manager on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
