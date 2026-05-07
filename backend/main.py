from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routers import marketplace, auth, notifications
from database import engine, Base
from utils.websocket_manager import manager
import os

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Spot@NE API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
        "https://hrishikeshdutta-spot-ne.vercel.app",
        "https://tourism-frontend-rho.vercel.app",
        "https://hrishikeshdutta-spot-ne-backend.hf.space",
        "https://tourism-web-app-backend.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(marketplace.router, prefix="/api/marketplace", tags=["Marketplace"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])

import os

# Serve static files from the uploads directory
base_dir = os.path.dirname(os.path.abspath(__file__))
uploads_dir = os.path.join(base_dir, "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

@app.get("/")
async def root():
    return {"status": "online", "service": "Spot@NE API"}

@app.websocket("/ws/marketplace")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(None)
):
    await manager.connect(websocket, token)
    print(f"Client connected to Marketplace stream: {websocket.client}")
    try:
        while True:
            data = await websocket.receive_text()
            print(f"Received message from client: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("Client disconnected from Marketplace stream")
    except Exception as e:
        manager.disconnect(websocket)
        print(f"Stream Error: {e}")

from fastapi.responses import StreamingResponse
from utils.websocket_manager import sse_manager
import json

@app.get("/sse/marketplace")
async def sse_marketplace_endpoint(request: Request):
    async def event_generator():
        queue = await sse_manager.connect()
        try:
            while True:
                # Check if client is still connected
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

from database import SessionLocal
from auth import get_current_user_ws

@app.get("/sse/notifications")
async def sse_notifications_endpoint(request: Request, token: str = Query(None)):
    if not token:
        from fastapi import HTTPException
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

from models import Post, Engagement
from sqlalchemy import func as sa_func

@app.get("/api/posts")
async def get_posts(skip: int = 0, limit: int = 20):
    """Fetch historical posts with engagement counts for initial feed hydration."""
    db = SessionLocal()
    try:
        posts = (
            db.query(Post)
            .order_by(Post.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        result = []
        for post in posts:
            likes = db.query(Engagement).filter(
                Engagement.post_id == post.id,
                Engagement.action_type == "like"
            ).count()
            reshares = db.query(Engagement).filter(
                Engagement.post_id == post.id,
                Engagement.action_type == "reshare"
            ).count()
            comments = db.query(Engagement).filter(
                Engagement.post_id == post.id,
                Engagement.action_type == "comment"
            ).count()
            result.append({
                "id": post.id,
                "content": post.content,
                "image_url": post.image_url,
                "category_tag": post.category_tag,
                "user_id": post.user_id,
                "created_at": post.created_at.isoformat() if post.created_at else None,
                "engagement": {
                    "likes": likes,
                    "reshares": reshares,
                    "comments": comments,
                }
            })
        return result
    finally:
        db.close()

# --- Weaving Mock Endpoints (Integrated from websocket_mock.py) ---
import random
import time
import asyncio

@app.websocket("/ws/weaving/{artisan_id}")
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
    except Exception as e:
        await websocket.close()

@app.get("/sse/weaving/{artisan_id}")
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
