import logging
import asyncio
import json
import random
from typing import Dict, Set, Optional
from datetime import datetime, timezone
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("unified_ws")

app = FastAPI(title="Spot@NE Unified WebSocket Manager")

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

social_manager = SocialManager()

# ─── Weaving Telemetry Logic ────────────────────────────────────────────────

ARTISAN_PROFILES = {
    "a1": {"name": "Kiran Devi", "location": "Imphal, Manipur", "complexity_pool": ["Exceptional — Silk Brocade (Muga)", "High — Double Ikat"], "base_hours": 28, "speed": (35, 65)},
    "a2": {"name": "Tenzing Namgyal", "location": "Gangtok, Sikkim", "complexity_pool": ["Medium — Bamboo Mat Interlace", "High — Structural Bamboo Weave"], "base_hours": 14, "speed": (20, 45)},
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

# ─── Social Endpoints ───────────────────────────────────────────────────────

@app.websocket("/ws/engagement/{post_id}")
async def social_websocket(websocket: WebSocket, post_id: str):
    await social_manager.connect(websocket, post_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        social_manager.disconnect(websocket, post_id)

class BroadcastPayload(BaseModel):
    post_id: str
    event_type: str
    data: dict

@app.post("/api/internal/broadcast")
async def trigger_broadcast(payload: BroadcastPayload):
    message = {"type": payload.event_type, "data": payload.data}
    await social_manager.broadcast_to_post(payload.post_id, message)
    return {"status": "success"}

if __name__ == "__main__":
    logger.info("Starting Unified Spot@NE WebSocket Manager on port 8001...")
    uvicorn.run("social_websocket:app", host="0.0.0.0", port=8001, reload=True)
