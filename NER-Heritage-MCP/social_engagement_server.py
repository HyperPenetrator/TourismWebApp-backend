"""
NER-Heritage-MCP | Spot@NE Platform
Social Engagement Server — FastAPI + WebSocket + MCP Integration

This server exposes:
    1. WebSocket endpoint:  ws://localhost:8001/ws/engagement/{post_id}
       - Clients subscribe to real-time engagement events for a specific post.

    2. REST endpoint:       POST /api/engage
       - Directly invokes the MCP `log_engagement` tool from HTTP.
       - On success, the WebSocket manager broadcasts the event to all
         subscribers of the target post.

    3. Diagnostic endpoint: GET /api/engagement/status
       - Returns room counts and connection stats.

Run with:
    python social_engagement_server.py

    OR

    uvicorn social_engagement_server:app --host 0.0.0.0 --port 8001 --reload
"""

import asyncio
import json
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from utils.social_websocket import engagement_manager, feed_manager, WeavingSession, _weaving_sessions
from social_engagement_mcp import log_engagement, EngagementInput, ActionType, set_broadcast_hook

# ─── Logging ─────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("spot-ne-engagement-server")

# ─── Broadcast Hook ─────────────────────────────────────────────────────────
# The MCP tool is synchronous (FastMCP convention), but the WebSocket manager
# is async. This bridge schedules the broadcast on the running event loop
# so the MCP tool doesn't need to be async itself.

_event_loop: asyncio.AbstractEventLoop | None = None


def _broadcast_bridge(post_id: str, event: dict) -> None:
    """
    Sync-to-async bridge. Called by the MCP tool to schedule a broadcast
    onto the FastAPI event loop.
    """
    if _event_loop is not None and _event_loop.is_running():
        asyncio.run_coroutine_threadsafe(
            engagement_manager.broadcast_to_post(post_id, event),
            _event_loop,
        )
    else:
        log.warning("Event loop not available — broadcast skipped.")


# ─── Lifespan ────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Register the broadcast hook and capture the event loop reference."""
    global _event_loop
    _event_loop = asyncio.get_running_loop()
    set_broadcast_hook(_broadcast_bridge)
    log.info("Social Engagement Server started.")
    log.info("WebSocket endpoint: ws://localhost:8001/ws/engagement/{post_id}")
    log.info("REST endpoint:      POST /api/engage")
    yield
    log.info("Social Engagement Server shutting down.")


# ─── FastAPI App ─────────────────────────────────────────────────────────────

app = FastAPI(
    title="Spot@NE Social Engagement Server",
    description=(
        "Real-time social engagement backend for the Spot@NE heritage platform. "
        "Handles likes, reshares, comments with instant WebSocket broadcast."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# ─── WebSocket Endpoint — Social Engagement ──────────────────────────────────

@app.websocket("/ws/engagement/{post_id}")
async def ws_engagement(websocket: WebSocket, post_id: str):
    """
    Real-time engagement feed for a specific post.

    Clients connect here to receive live events (NEW_LIKE, NEW_RESHARE,
    NEW_COMMENT) whenever any user interacts with the specified post.

    The connection stays open indefinitely until the client disconnects.
    On connect, the server sends a welcome event with current post stats.
    """
    await engagement_manager.connect(websocket, post_id)

    # Send a welcome message with connection metadata
    welcome = {
        "type": "CONNECTED",
        "data": {
            "post_id": post_id,
            "message": f"Subscribed to engagement events for post '{post_id}'.",
            "room_size": engagement_manager.room_size(post_id),
        },
    }
    try:
        await websocket.send_text(json.dumps(welcome))
    except Exception:
        engagement_manager.disconnect(websocket, post_id)
        return

    # Keep the connection alive — listen for client pings or messages
    try:
        while True:
            # We don't expect client messages, but we must await to detect disconnect
            data = await websocket.receive_text()
            # Optional: handle client-sent heartbeats
            if data == "ping":
                await websocket.send_text(json.dumps({"type": "PONG"}))
    except WebSocketDisconnect:
        engagement_manager.disconnect(websocket, post_id)
        log.info(f"Client cleanly disconnected from post '{post_id}'.")
    except Exception as e:
        engagement_manager.disconnect(websocket, post_id)
        log.warning(f"Client dropped from post '{post_id}': {e}")

from fastapi import Request
from fastapi.responses import StreamingResponse

@app.get("/sse/engagement/{post_id}")
async def sse_engagement(request: Request, post_id: str):
    """
    Real-time engagement feed for a specific post via SSE.
    """
    async def event_generator():
        queue = await engagement_manager.connect_sse(post_id)
        
        # Send welcome event
        welcome = {
            "type": "CONNECTED",
            "data": {
                "post_id": post_id,
                "message": f"Subscribed to engagement events for post '{post_id}' via SSE.",
                "room_size": engagement_manager.room_size(post_id),
            },
        }
        yield f"data: {json.dumps(welcome)}\n\n"
        
        try:
            while True:
                if await request.is_disconnected():
                    break
                data = await queue.get()
                yield f"data: {json.dumps(data)}\n\n"
        finally:
            engagement_manager.disconnect_sse(queue, post_id)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

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

@app.get("/sse/marketplace")
@app.get("/sse/feed")
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


# ─── REST Endpoint — Engage ──────────────────────────────────────────────────

@app.post("/api/engage")
async def api_engage(
    post_id: str,
    user_id: str,
    action_type: str,
    text: str | None = None,
):
    """
    REST gateway for triggering the MCP `log_engagement` tool from HTTP.

    Query params:
        - post_id:     Target post ID
        - user_id:     Acting user ID
        - action_type: 'like', 'reshare', or 'comment'
        - text:        (optional) Comment text, required when action_type='comment'

    Returns:
        JSON response from the MCP tool.
    """
    payload = None
    if action_type == "comment":
        if not text:
            return {"status": "error", "message": "Comment text is required."}
        payload = {"text": text}

    try:
        engagement_input = EngagementInput(
            post_id=post_id,
            user_id=user_id,
            action_type=ActionType(action_type),
            payload=payload,
        )
    except Exception as e:
        return {"status": "error", "message": str(e)}

    result_json = log_engagement(engagement_input)
    return json.loads(result_json)


# ─── Diagnostic Endpoint ─────────────────────────────────────────────────────

@app.get("/api/engagement/status")
async def engagement_status():
    """Returns a diagnostic snapshot of all active WebSocket rooms."""
    return engagement_manager.status_snapshot()


# ─── Health Check ────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "service": "Spot@NE Social Engagement Server",
        "status": "online",
        "version": "1.0.0",
        "endpoints": {
            "websocket": "ws://localhost:8001/ws/engagement/{post_id}",
            "rest_engage": "POST /api/engage",
            "status": "GET /api/engagement/status",
        },
    }


# ─── Entry Point ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
