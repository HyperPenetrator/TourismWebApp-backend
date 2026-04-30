from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, BackgroundTasks
from utils.websocket_manager import manager
import shutil
import os
import uuid
import time
import json

router = APIRouter(prefix="/marketplace", tags=["Marketplace"])

# Ensure uploads directory exists
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}

@router.post("/upload")
async def upload_item(
    background_tasks: BackgroundTasks,
    image: UploadFile = File(...),
    description: str = Form(...),
    price: float = Form(...),
    tags: str = Form(...)  # Comma separated tags
):
    """
    Handles multipart form uploads for marketplace items.
    Accepts JPEG, PNG, and WebP formats.
    """
    if image.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {image.content_type}. Supported types: JPEG, PNG, WebP"
        )
    
    # Generate a unique filename while preserving extension
    ext = image.filename.split(".")[-1] if "." in image.filename else ""
    filename = f"{uuid.uuid4()}.{ext}" if ext else str(uuid.uuid4())
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    # Save the file locally
    try:
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save image: {str(e)}"
        )
    finally:
        image.file.close()

    image_url = f"/uploads/{filename}"
    tag_list = [t.strip() for t in tags.split(",") if t.strip()]

    from marketplace_mcp import index_marketplace_item
    
    # Invoke the MCP tool function to validate and index
    index_result_str = index_marketplace_item(image_url, description, price, tag_list)
    index_result = json.loads(index_result_str)
    
    if index_result.get("status") == "error":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=index_result.get("message")
        )
        
    item_payload = {
        "event": "new_item",
        "data": index_result["item"]
    }
    
    # Broadcast the new item to all connected WebSocket clients
    background_tasks.add_task(manager.broadcast, item_payload)

    return {
        "status": "success", 
        "message": "Item uploaded and broadcasted successfully", 
        "item": item_payload["data"]
    }
