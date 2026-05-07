import os
import uuid
import shutil
from fastapi import UploadFile, HTTPException

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def save_upload_file(upload_file: UploadFile, destination_dir: str = UPLOAD_DIR) -> str:
    """
    Saves an uploaded file to the specified directory and returns its relative URL.
    """
    if upload_file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=415, detail="Unsupported file type")
    
    ext = upload_file.filename.split(".")[-1] if "." in upload_file.filename else ""
    filename = f"{uuid.uuid4()}.{ext}" if ext else str(uuid.uuid4())
    filepath = os.path.join(destination_dir, filename)
    
    try:
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    finally:
        upload_file.file.close()
        
    return f"/uploads/{filename}"
