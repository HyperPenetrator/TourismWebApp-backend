from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, BackgroundTasks, Depends
from auth import get_current_user, get_current_user_ws
from models import User, MarketplaceItem, Notification
from database import get_db
from marketplace_mcp import index_marketplace_item
from utils.websocket_manager import manager
from sqlalchemy.orm import Session
import shutil
import os
import uuid
import json
from datetime import datetime

router = APIRouter(tags=["Marketplace"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_item(
    background_tasks: BackgroundTasks,
    image: UploadFile = File(...),
    description: str = Form(...),
    price: float = Form(...),
    tags: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if image.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=415, detail="Unsupported file type")
    
    ext = image.filename.split(".")[-1] if "." in image.filename else ""
    filename = f"{uuid.uuid4()}.{ext}" if ext else str(uuid.uuid4())
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    try:
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save image: {str(e)}")
    finally:
        image.file.close()
    
    image_url = f"/uploads/{filename}"
    tag_list = [t.strip() for t in tags.split(",") if t.strip()]
    
    result_str = index_marketplace_item(image_url, description, price, tag_list, current_user.id, db)
    result = json.loads(result_str)
    
    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("message"))
    
    item_payload = {"event": "new_item", "data": result["item"]}
    background_tasks.add_task(manager.broadcast, item_payload)
    
    return {"status": "success", "message": "Item uploaded and broadcasted", "item": result["item"]}

@router.get("/items")
async def list_items(db: Session = Depends(get_db), skip: int = 0, limit: int = 50):
    items = db.query(MarketplaceItem).order_by(MarketplaceItem.created_at.desc()).offset(skip).limit(limit).all()
    return [
        {
            "id": item.id,
            "title": item.title,
            "description": item.description,
            "list_price": item.price,
            "image_url": item.image_url,
            "tags": item.tags.split(",") if item.tags else [],
            "seller_id": item.seller_id,
            "created_at": item.created_at.isoformat() if item.created_at else None
        } for item in items
    ]

@router.get("/my-items")
async def my_items(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50
):
    """Fetch all marketplace items uploaded by the currently logged-in user."""
    items = (
        db.query(MarketplaceItem)
        .filter(MarketplaceItem.seller_id == current_user.id)
        .order_by(MarketplaceItem.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [
        {
            "id": item.id,
            "title": item.title,
            "description": item.description,
            "list_price": item.price,
            "image_url": item.image_url,
            "tags": item.tags.split(",") if item.tags else [],
            "seller_id": item.seller_id,
            "created_at": item.created_at.isoformat() if item.created_at else None
        } for item in items
    ]

@router.post("/secure-item/{item_id}")
async def secure_item(
    item_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from utils.websocket_manager import sse_manager
    
    item = db.query(MarketplaceItem).filter(MarketplaceItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    seller = db.query(User).filter(User.id == item.seller_id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
    
    # --- Persist notification to database ---
    msg = f"Good news! {current_user.username} just ordered your item: '{item.title}'"
    db_notification = Notification(
        user_id=seller.id,
        message=msg,
        type="new_order",
        item_id=item.id,
        buyer_username=current_user.username,
        read=False,
    )
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)

    # --- Push real-time SSE event to author ---
    sse_event = {
        "event": "new_order",
        "data": {
            "id": str(db_notification.id),
            "message": msg,
            "item_id": item.id,
            "buyer": current_user.username,
            "timestamp": db_notification.created_at.isoformat() if db_notification.created_at else datetime.utcnow().isoformat(),
            "read": False,
        }
    }
    background_tasks.add_task(sse_manager.send_to_user, seller.id, sse_event)
    
    return {"status": "success", "message": "Order placed and author notified"}
