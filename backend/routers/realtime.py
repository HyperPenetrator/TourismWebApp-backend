from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Request, HTTPException
from fastapi.responses import StreamingResponse
from utils.websocket_manager import manager, sse_manager
from database import SessionLocal
from auth import get_current_user_ws
import json
import random
import time
import asyncio

router = APIRouter()

@router.websocket("/ws/marketplace")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(None)
):
    await manager.connect(websocket, token)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

@router.get("/sse/marketplace")
async def sse_marketplace_endpoint(request: Request):
    async def event_generator():
        queue = await sse_manager.connect()
        try:
            while True:
                if await request.is_disconnected():
                    break
                data = await queue.get()
                yield f"data: {json.dumps(data)}\n\n"
        finally:
            sse_manager.disconnect(queue)

    return StreamingResponse(
        event_generator(), 
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.get("/sse/notifications")
async def sse_notifications_endpoint(request: Request, token: str = Query(None)):
    if not token:
        raise HTTPException(status_code=401, detail="Token required for notifications")
        
    db = SessionLocal()
    try:
        user = await get_current_user_ws(token, db)
    finally:
        db.close()
        
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")

    async def event_generator():
        queue = await sse_manager.connect(user_id=user.id)
        try:
            while True:
                if await request.is_disconnected():
                    break
                data = await queue.get()
                yield f"data: {json.dumps(data)}\n\n"
        finally:
            sse_manager.disconnect(queue)

    return StreamingResponse(
        event_generator(), 
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.websocket("/ws/weaving/{artisan_id}")
async def websocket_weaving_endpoint(websocket: WebSocket, artisan_id: str):
    await websocket.accept()
    progress = random.randint(20, 40)
    try:
        while True:
            progress += random.uniform(0.01, 0.05)
            if progress > 100: progress = 100
            payload = {
                "timestamp": time.time(),
                "artisan_id": artisan_id,
                "metrics": {
                    "weave_complexity": "High - Double Ikat",
                    "current_progress": f"{progress:.2f}%",
                    "shuttle_speed": f"{random.randint(40, 60)} strokes/min",
                    "pattern_integrity": f"{random.uniform(98.5, 99.9):.1f}%",
                    "estimated_completion_time": f"{max(0, 18.5 - (progress/5)):.1f} hours",
                    "status": "Live broadcast active"
                },
                "alerts": [] if random.random() > 0.05 else ["Pattern density variation detected - auto-correcting"]
            }
            await websocket.send_json(payload)
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        pass
    except Exception:
        await websocket.close()

@router.get("/sse/weaving/{artisan_id}")
async def sse_weaving_endpoint(artisan_id: str):
    async def event_generator():
        progress = random.randint(20, 40)
        try:
            while True:
                progress += random.uniform(0.01, 0.05)
                if progress > 100: progress = 100
                payload = {
                    "timestamp": time.time(),
                    "artisan_id": artisan_id,
                    "metrics": {
                        "weave_complexity": "High - Double Ikat",
                        "current_progress": f"{progress:.2f}%",
                        "shuttle_speed": f"{random.randint(40, 60)} strokes/min",
                        "pattern_integrity": f"{random.uniform(98.5, 99.9):.1f}%",
                        "estimated_completion_time": f"{max(0, 18.5 - (progress/5)):.1f} hours",
                        "status": "Live broadcast active"
                    },
                    "alerts": [] if random.random() > 0.05 else ["Pattern density variation detected - auto-correcting"]
                }
                yield f"data: {json.dumps(payload)}\n\n"
                await asyncio.sleep(2)
        except asyncio.CancelledError:
            pass
    return StreamingResponse(
        event_generator(), 
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
