from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, SessionLocal
from models import Post, Engagement
from sqlalchemy import func as sa_func

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
