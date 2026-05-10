from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks, Depends
from auth import get_current_user
from models import User, MarketplaceItem, Notification
from database import get_db
from services.marketplace_service import create_marketplace_item
from utils.file_service import save_upload_file
from utils.websocket_manager import manager, sse_manager
from sqlalchemy.orm import Session
from datetime import datetime, timezone

router = APIRouter(tags=["Marketplace"])

@router.post("/upload")
async def upload_item(
    image: UploadFile = File(...),
    description: str = Form(...),
    price: float = Form(...),
    tags: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks = None
):
    # 1. Save Image
    image_url = save_upload_file(image)
    
    # 2. Parse Tags
    tag_list = [t.strip() for t in tags.split(",") if t.strip()]
    
    # 3. Create Item via Service
    try:
        item_data = create_marketplace_item(
            db=db,
            image_url=image_url,
            description=description,
            price=price,
            tags=tag_list,
            seller_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # 4. Broadcast to Feed
    item_payload = {"event": "new_item", "data": item_data}
    background_tasks.add_task(manager.broadcast, item_payload)
    
    return {"status": "success", "message": "Item uploaded and broadcasted", "item": item_data}

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
    item = db.query(MarketplaceItem).filter(MarketplaceItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    seller = db.query(User).filter(User.id == item.seller_id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
    
    # --- Persist notification ---
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

    # --- Push real-time SSE event ---
    sse_event = {
        "event": "new_order",
        "data": {
            "id": str(db_notification.id),
            "message": msg,
            "item_id": item.id,
            "buyer": current_user.username,
            "timestamp": db_notification.created_at.isoformat() if db_notification.created_at else datetime.now(timezone.utc).isoformat(),
            "read": False,
        }
    }
    background_tasks.add_task(sse_manager.send_to_user, seller.id, sse_event)
    
    return {"status": "success", "message": "Order placed and author notified"}
