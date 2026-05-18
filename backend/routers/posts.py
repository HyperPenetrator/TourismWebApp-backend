from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session
from database import get_db, SessionLocal
from models import Post, Engagement, User
from auth import get_current_user
from services.engagement_service import log_engagement
from utils.websocket_manager import manager
from sqlalchemy import func as sa_func
import json

router = APIRouter()

@router.get("")
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

@router.post("/{post_id}/engage")
async def engage_post(
    post_id: str,
    background_tasks: BackgroundTasks,
    action: str = Query(...),
    text: str = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Handle social actions (like, comment, reshare) and broadcast updates."""
    if text:
        # Basic sanitization to prevent stored XSS
        import re
        text = re.sub(r'<[^>]*>', '', text).strip()
        
    if action not in ["like", "comment", "reshare"]:
        raise HTTPException(status_code=400, detail="Invalid action type")
        
    # Convert post_id to int if possible (for DB lookups)
    try:
        numeric_post_id = int(post_id)
    except ValueError:
        # If it's a string like "e3", it's mock data.
        # We can't log it in the DB easily without matching records,
        # but we can return a mock success to keep the UI happy.
        update_data = {
            "type": "post",
            "id": post_id,
            "action": action,
            "counts": {
                "likes": 42 + (1 if action == "like" else 0),
                "comments": 8 + (1 if action == "comment" else 0),
                "reshares": 15 + (1 if action == "reshare" else 0)
            }
        }
        broadcast_payload = {"event": "engagement_update", "data": update_data}
        background_tasks.add_task(manager.broadcast, broadcast_payload)
        return {"status": "success", "data": update_data, "note": "mock_data_engagement"}

    # 1. Log engagement for real DB posts
    try:
        update_data = log_engagement(
            db=db,
            user_id=current_user.id,
            action_type=action,
            post_id=numeric_post_id,
            text=text
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    # 2. Broadcast update to all clients
    # The payload will inform clients to update specific post counts
    broadcast_payload = {
        "event": "engagement_update",
        "data": update_data
    }
    background_tasks.add_task(manager.broadcast, broadcast_payload)
    
    return {"status": "success", "data": update_data}
