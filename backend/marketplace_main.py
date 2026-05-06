from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.staticfiles import StaticFiles
from routers.marketplace import router as marketplace_router
from utils.websocket_manager import manager
import os

app = FastAPI(title="Artisan Marketplace API")

# Ensure uploads directory exists to prevent startup errors
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include the Marketplace Router
app.include_router(marketplace_router)

from fastapi.responses import RedirectResponse

@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")

@app.websocket("/ws/marketplace")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(None)
):
    """
    WebSocket endpoint that clients connect to for receiving real-time
    updates whenever a new marketplace item is uploaded and indexed.
    """
    await manager.connect(websocket, token)
    print(f"Client connected to Marketplace stream: {websocket.client}")
    try:
        while True:
            # Keep connection alive, listen for optional incoming messages
            data = await websocket.receive_text()
            print(f"Received message from client: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("Client disconnected from Marketplace stream")
    except Exception as e:
        manager.disconnect(websocket)
        print(f"Stream Error: {e}")

from fastapi import Request
from fastapi.responses import StreamingResponse
from utils.websocket_manager import sse_manager
import json

@app.get("/sse/marketplace")
async def sse_marketplace_endpoint(request: Request):
    """
    SSE endpoint for receiving real-time marketplace updates.
    """
    async def event_generator():
        queue = await sse_manager.connect()
        try:
            while True:
                if await request.is_disconnected():
                    break
                data = await queue.get()
                yield f"data: {json.dumps(data)}\n\n"
        finally:
            sse_manager.disconnect(queue)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("marketplace_main:app", host="0.0.0.0", port=8002, reload=True)

