import logging
import asyncio
import json
import random
import base64
from typing import Dict, Set, Optional
from datetime import datetime, timezone
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
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

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"[MARKETPLACE] Client connected to live feed. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"[MARKETPLACE] Client disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.add(connection)
        for dead in disconnected:
            self.disconnect(dead)

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

    async def connect(self, websocket: WebSocket, post_id: str):
        await websocket.accept()
        if post_id not in self.active_connections:
            self.active_connections[post_id] = set()
        self.active_connections[post_id].add(websocket)
        logger.info(f"[SOCIAL] Client connected to post '{post_id}'. Room size: {len(self.active_connections[post_id])}")

    def disconnect(self, websocket: WebSocket, post_id: str):
        if post_id in self.active_connections:
            self.active_connections[post_id].discard(websocket)
            if not self.active_connections[post_id]:
                del self.active_connections[post_id]

    async def broadcast_to_post(self, post_id: str, message: dict):
        if post_id in self.active_connections:
            disconnected_sockets = set()
            for connection in self.active_connections[post_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected_sockets.add(connection)
            for dead_socket in disconnected_sockets:
                self.disconnect(dead_socket, post_id)

    def room_size(self, post_id: str) -> int:
        """Returns the number of active subscribers for a specific post."""
        return len(self.active_connections.get(post_id, set()))

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

# ─── Marketplace Feed Logic ─────────────────────────────────────────────────

MARKETPLACE_SAMPLE_ITEMS = [
    {"description": "Hand-carved Bamboo Flute — Signature Series", "list_price": 45, "tags": ["Bamboo", "Music"]},
    {"description": "Organic Assam Silk Scarf — Hand-dyed", "list_price": 85, "tags": ["Silk", "Textiles"]},
    {"description": "Traditional Naga Warrior Spear — Ceremonial", "list_price": 250, "tags": ["Heritage", "Art"]},
    {"description": "Majuli Clay Pottery Set — Hand-coiled", "list_price": 120, "tags": ["Pottery", "Majuli"]},
]

# Create a background task to simulate activity
async def simulate_marketplace_activity():
    while True:
        await asyncio.sleep(random.uniform(15, 30))  # Less frequent to emphasize user uploads
        if feed_manager.active_connections:
            sample = random.choice(MARKETPLACE_SAMPLE_ITEMS)
            new_item = {
                "id": f"item_{random.randint(1000, 9999)}",
                "image_url": f"https://picsum.photos/seed/{random.randint(1, 1000)}/800/800",
                "description": sample["description"],
                "list_price": sample["list_price"],
                "tags": sample["tags"],
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            await feed_manager.broadcast(new_item)

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

# ─── Social Endpoints ───────────────────────────────────────────────────────

@app.websocket("/ws/engagement/{post_id}")
async def social_websocket(websocket: WebSocket, post_id: str):
    await engagement_manager.connect(websocket, post_id)
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
    logger.info("Starting Unified Spot@NE WebSocket Manager on port 8001...")
    uvicorn.run(app, host="0.0.0.0", port=8001)
