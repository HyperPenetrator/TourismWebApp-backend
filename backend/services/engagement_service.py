from sqlalchemy.orm import Session
from models import Engagement
from datetime import datetime, timezone

def log_engagement(
    db: Session,
    user_id: int,
    action_type: str,
    post_id: int = None,
    item_id: int = None,
    text: str = None
) -> dict:
    """
    Persists a user engagement (like, comment, reshare) to the database.
    Returns the updated engagement summary for the target object.
    """
    # 1. Create new engagement record
    db_engagement = Engagement(
        user_id=user_id,
        post_id=post_id,
        item_id=item_id,
        action_type=action_type,
        text=text
    )
    db.add(db_engagement)
    db.commit()
    db.refresh(db_engagement)
    
    # 2. Calculate updated counts
    if post_id:
        likes = db.query(Engagement).filter(Engagement.post_id == post_id, Engagement.action_type == "like").count()
        comments = db.query(Engagement).filter(Engagement.post_id == post_id, Engagement.action_type == "comment").count()
        reshares = db.query(Engagement).filter(Engagement.post_id == post_id, Engagement.action_type == "reshare").count()
        
        return {
            "type": "post",
            "id": post_id,
            "action": action_type,
            "counts": {
                "likes": likes,
                "comments": comments,
                "reshares": reshares
            }
        }
    
    return {"status": "success", "id": db_engagement.id}
