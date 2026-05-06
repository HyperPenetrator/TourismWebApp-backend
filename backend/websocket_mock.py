from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
import asyncio
import random
import json
import time

app = FastAPI(title="NE Threads - Live Weaving Metrics Stream")

@app.get("/")
async def root():
    return {"status": "online", "service": "Artisan Dossier Stream"}

@app.websocket("/ws/weaving/{artisan_id}")
async def websocket_endpoint(websocket: WebSocket, artisan_id: str):
    """
    WebSocket endpoint that streams live weaving metrics to the HUD.
    """
    await websocket.accept()
    print(f"HUD Connection Established: Artisan {artisan_id}")
    
    # Initial state
    progress = random.randint(20, 40)
    
    try:
        while True:
            # Simulate real-time progress increments
            progress += random.uniform(0.01, 0.05)
            if progress > 100: progress = 100
            
            # Generate tactical metrics payload
            payload = {
                "timestamp": time.time(),
                "artisan_id": artisan_id,
                "metrics": {
                    "weave_complexity": "High - Double Ikat",
                    "current_progress": f"{progress:.2f}%",
                    "shuttle_speed": f"{random.randint(40, 60)} strokes/min",
                    "pattern_integrity": f"{random.uniform(98.5, 99.9):.1f}%",
                    "estimated_completion_time": f"{max(0, 18.5 - (progress/5)):.1f} hours",
                    "status": "Live broadcast active"
                },
                "alerts": [] if random.random() > 0.05 else ["Pattern density variation detected - auto-correcting"]
            }
            
            await websocket.send_json(payload)
            
            # 2-second interval as requested
            await asyncio.sleep(2)
            
    except WebSocketDisconnect:
        print(f"HUD Connection Terminated: Artisan {artisan_id}")
    except Exception as e:
        print(f"Stream Error: {e}")
        await websocket.close()

@app.get("/sse/weaving/{artisan_id}")
async def sse_weaving_endpoint(artisan_id: str):
    """
    SSE endpoint for streaming live weaving metrics.
    Uses Server-Sent Events for simpler, firewall-friendly streaming.
    """
    async def event_generator():
        progress = random.randint(20, 40)
        try:
            while True:
                # Simulate real-time progress increments
                progress += random.uniform(0.01, 0.05)
                if progress > 100:
                    progress = 100

                # Generate tactical metrics payload
                payload = {
                    "timestamp": time.time(),
                    "artisan_id": artisan_id,
                    "metrics": {
                        "weave_complexity": "High - Double Ikat",
                        "current_progress": f"{progress:.2f}%",
                        "shuttle_speed": f"{random.randint(40, 60)} strokes/min",
                        "pattern_integrity": f"{random.uniform(98.5, 99.9):.1f}%",
                        "estimated_completion_time": f"{max(0, 18.5 - (progress/5)):.1f} hours",
                        "status": "Live broadcast active"
                    },
                    "alerts": [] if random.random() > 0.05 else ["Pattern density variation detected - auto-correcting"]
                }

                yield f"data: {json.dumps(payload)}\n\n"
                await asyncio.sleep(2)
        except asyncio.CancelledError:
            pass

    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
