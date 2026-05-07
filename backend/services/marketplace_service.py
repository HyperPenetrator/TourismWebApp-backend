from sqlalchemy.orm import Session
from models import MarketplaceItem as DBItem
import uuid
from datetime import datetime, timezone

def create_marketplace_item(
    db: Session,
    image_url: str,
    description: str,
    price: float,
    tags: list[str],
    seller_id: int
) -> dict:
    """
    Business logic for creating a marketplace item.
    Validates data and persists to DB.
    """
    if price < 0:
        raise ValueError("Price cannot be negative.")
    
    if not description or not description.strip():
        raise ValueError("Description cannot be empty.")
    
    db_item = DBItem(
        id=uuid.uuid4().int & 0xFFFFFFFF,
        title=description[:50],
        description=description.strip(),
        price=price,
        image_url=image_url,
        tags=",".join(tags),
        seller_id=seller_id
    )
    
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    return {
        "id": db_item.id,
        "title": db_item.title,
        "description": db_item.description,
        "price": db_item.price,
        "image_url": db_item.image_url,
        "tags": tags,
        "seller_id": db_item.seller_id,
        "created_at": db_item.created_at.isoformat() if db_item.created_at else datetime.now(timezone.utc).isoformat()
    }
