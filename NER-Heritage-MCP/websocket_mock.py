"""
NER-Heritage-MCP | Spot@NE Platform
WebSocket Mock Server — Live Weaving Data Broadcast

Streams realistic, simulated live-weaving telemetry to the LiveWeavingHUD
component in the frontend. Broadcasts to all connected clients every 2 seconds.

Run with:
    python websocket_mock.py

Endpoint: ws://localhost:8001/ws/weaving/{artisan_id}

Dependencies:
    pip install websockets
"""

import asyncio
import json
import random
import logging
from datetime import datetime, timezone
from typing import Optional

import websockets
from websockets.server import WebSocketServerProtocol

# ─── Logging Setup ───────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("spot-ne-ws")

# ─── Constants ──────────────────────────────────────────────────────────────

HOST = "localhost"
PORT = 8001
BROADCAST_INTERVAL_SECONDS = 2.0

# ─── Artisan Profile Data ───────────────────────────────────────────────────

ARTISAN_PROFILES: dict[str, dict] = {
    "a1": {
        "name": "Kiran Devi",
        "location": "Imphal, Manipur",
        "complexity_pool": [
            "Exceptional — Silk Brocade (Muga)",
            "High — Double Ikat",
            "High — Traditional Mekhela Chador",
        ],
        "base_completion_hours": 28,
        "shuttle_speed_range": (35, 65),  # picks per minute
    },
    "a2": {
        "name": "Tenzing Namgyal",
        "location": "Gangtok, Sikkim",
        "complexity_pool": [
            "Medium — Bamboo Mat Interlace",
            "Medium — Diagonal Twill Pattern",
            "High — Structural Bamboo Weave",
        ],
        "base_completion_hours": 14,
        "shuttle_speed_range": (20, 45),
    },
    "a3": {
        "name": "Lakhimi Baruah",
        "location": "Majuli, Assam",
        "complexity_pool": [
            "Medium — Salmora Coil Pottery",
            "High — Mising Tribal Relief",
            "Exceptional — Riverbed Clay Mosaic",
        ],
        "base_completion_hours": 18,
        "shuttle_speed_range": (10, 30),
    },
}

DEFAULT_PROFILE = {
    "name": "Unknown Artisan",
    "location": "Northeast India",
    "complexity_pool": ["Medium — Heritage Weave Pattern"],
    "base_completion_hours": 16,
    "shuttle_speed_range": (25, 50),
}

# ─── Alert Pool ─────────────────────────────────────────────────────────────

ALERT_POOL = [
    "Thread tension variance detected — minor adjustment recommended",
    "Loom speed approaching optimal cadence",
    "Pattern integrity above 98% — excellence threshold reached",
    "Warp thread realignment in progress",
    "Humidity shift: compensating for silk fiber contraction",
]

# ─── Session State ──────────────────────────────────────────────────────────

class WeavingSession:
    """Tracks simulated weaving progress across broadcasts for one artisan."""

    def __init__(self, artisan_id: str) -> None:
        self.artisan_id = artisan_id
        self.profile = ARTISAN_PROFILES.get(artisan_id, DEFAULT_PROFILE)
        self.progress: float = random.uniform(5.0, 25.0)  # Start partially done
        self.complexity: str = random.choice(self.profile["complexity_pool"])
        self.alert_cooldown: int = 0  # Ticks until next potential alert

    def advance(self) -> dict:
        """Advances weaving progress and generates a telemetry snapshot."""
        # Progress ticks forward 0.3–0.9% per broadcast
        self.progress = min(self.progress + random.uniform(0.3, 0.9), 100.0)

        # Occasionally rotate complexity label (artisan changes pattern)
        if random.random() < 0.04:
            self.complexity = random.choice(self.profile["complexity_pool"])

        shuttle_speed = random.randint(*self.profile["shuttle_speed_range"])
        pattern_integrity = round(random.uniform(94.5, 99.8), 2)

        # Remaining time estimate
        remaining_fraction = (100.0 - self.progress) / 100.0
        estimated_hours = round(
            self.profile["base_completion_hours"] * remaining_fraction
            * random.uniform(0.95, 1.05),  # ±5% natural variance
            1,
        )

        # Alert logic — fire one every ~10–20 ticks
        alert: Optional[str] = None
        if self.alert_cooldown <= 0 and random.random() < 0.15:
            alert = random.choice(ALERT_POOL)
            self.alert_cooldown = random.randint(8, 20)
        else:
            self.alert_cooldown = max(0, self.alert_cooldown - 1)

        return {
            "timestamp": int(datetime.now(timezone.utc).timestamp()),
            "artisan_id": self.artisan_id,
            "artisan_name": self.profile["name"],
            "location": self.profile["location"],
            "metrics": {
                "weave_complexity": self.complexity,
                "current_progress": f"{self.progress:.2f}%",
                "shuttle_speed": f"{shuttle_speed} ppm",
                "pattern_integrity": f"{pattern_integrity}%",
                "estimated_completion_time": f"{estimated_hours} hours",
                "status": "Live broadcast active" if self.progress < 100 else "Session complete",
            },
            "alerts": [alert] if alert else [],
        }


# ─── Active Sessions Registry ────────────────────────────────────────────────

_sessions: dict[str, WeavingSession] = {}


def _get_or_create_session(artisan_id: str) -> WeavingSession:
    """Returns an existing session or creates a new one for the given artisan."""
    if artisan_id not in _sessions:
        _sessions[artisan_id] = WeavingSession(artisan_id)
        log.info(f"New weaving session started for artisan '{artisan_id}'.")
    return _sessions[artisan_id]


# ─── WebSocket Handler ───────────────────────────────────────────────────────

async def handle_connection(websocket: WebSocketServerProtocol) -> None:
    """
    Handles a single WebSocket client connection.

    Expected path: /ws/weaving/{artisan_id}
    Falls back to artisan 'a1' if path is malformed.
    """
    path = websocket.request.path if hasattr(websocket, "request") else getattr(websocket, "path", "/ws/weaving/a1")

    # Extract artisan_id from path
    path_parts = path.strip("/").split("/")
    artisan_id = path_parts[-1] if len(path_parts) >= 3 else "a1"
    if artisan_id not in ARTISAN_PROFILES:
        log.warning(f"Unknown artisan_id '{artisan_id}' — falling back to 'a1'.")
        artisan_id = "a1"

    client_addr = websocket.remote_address
    log.info(f"Client connected: {client_addr} → artisan '{artisan_id}'")

    session = _get_or_create_session(artisan_id)

    try:
        while True:
            payload = session.advance()
            await websocket.send(json.dumps(payload))
            await asyncio.sleep(BROADCAST_INTERVAL_SECONDS)
    except websockets.exceptions.ConnectionClosedOK:
        log.info(f"Client disconnected cleanly: {client_addr}")
    except websockets.exceptions.ConnectionClosedError as e:
        log.warning(f"Client disconnected with error: {client_addr} — {e}")
    except Exception as e:
        log.error(f"Unexpected error for client {client_addr}: {e}")


# ─── Entry Point ─────────────────────────────────────────────────────────────

async def main() -> None:
    log.info(f"Spot@NE WebSocket server starting on ws://{HOST}:{PORT}")
    log.info("Accepting connections at: /ws/weaving/<artisan_id>")
    log.info(f"Valid artisan IDs: {list(ARTISAN_PROFILES.keys())}")
    log.info(f"Broadcast interval: {BROADCAST_INTERVAL_SECONDS}s")

    async with websockets.serve(handle_connection, HOST, PORT):
        log.info("Server is live. Waiting for connections...")
        await asyncio.Future()  # Runs forever until interrupted


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        log.info("Spot@NE WebSocket server shut down gracefully.")
