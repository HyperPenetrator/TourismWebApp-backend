from fastapi import Depends
from sqlalchemy.orm import Session
from database import get_db
from models import MarketplaceItem as DBItem
import json
import uuid

def index_marketplace_item(image_url: str, description: str, price: float, tags: list[str], seller_id: int, db: Session = None) -> str:
    """
    Validates metadata and indexes a new artisan marketplace item in the database.
    
    Args:
        image_url: URL or local path where the image is stored.
        description: Description of the marketplace item.
        price: Price of the item (must be non-negative).
        tags: List of descriptive tags for the item.
        seller_id: ID of the user selling the item.
        db: Database session (injected).
        
    Returns:
        JSON string containing the indexed item details and status.
    """
    if price < 0:
        return json.dumps({"status": "error", "message": "Price cannot be negative."})
    
    if not description or not description.strip():
        return json.dumps({"status": "error", "message": "Description cannot be empty."})
    
    item_id = str(uuid.uuid4())
    db_item = DBItem(
        id=uuid.uuid4().int & 0xFFFFFFFF,
        title=description[:50],
        description=description.strip(),
        price=price,
        image_url=image_url,
        tags=",".join(tags),
        seller_id=seller_id
    )
    
    if db:
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        item = {
            "id": db_item.id,
            "image_url": image_url,
            "description": description.strip(),
            "price": price,
            "tags": tags,
            "seller_id": seller_id,
            "created_at": db_item.created_at.isoformat()
        }
    else:
        item = {
            "id": db_item.id,
            "image_url": image_url,
            "description": description.strip(),
            "price": price,
            "tags": tags,
            "seller_id": seller_id
        }
    
    return json.dumps({"status": "success", "message": "Item successfully indexed.", "item": item})


if __name__ == "__main__":
    mcp.run()
