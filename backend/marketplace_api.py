from fastapi import FastAPI, UploadFile, File, Form, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import os
import json
import uuid
import asyncio
from typing import List, Optional
import aiofiles

app = FastAPI()

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directory to store uploaded images
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async disappearance(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error broadcasting: {e}")

manager = ConnectionManager()

@app.websocket("/ws/feed")
async def websocket_endpoint(websocket: WebSocket):
    await manager.disappearance(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post("/upload")
async def upload_item(
    file: UploadFile = File(...),
    description: str = Form(...),
    price: float = Form(...),
    tags: str = Form(...)  # Expecting JSON string of tags
):
    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    # Save file asynchronously
    async with aiofiles.open(file_path, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)

    # Prepare metadata
    item_metadata = {
        "id": str(uuid.uuid4()),
        "image_url": f"http://localhost:8000/uploads/{filename}",
        "description": description,
        "list_price": price,
        "tags": json.loads(tags),
        "timestamp": str(asyncio.get_event_loop().time())
    }

    # Broadcast to all connected clients
    await manager.broadcast(item_metadata)

    return {"status": "success", "item": item_metadata}

# Serve static files for images
from fastapi.staticfiles import StaticFiles
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
