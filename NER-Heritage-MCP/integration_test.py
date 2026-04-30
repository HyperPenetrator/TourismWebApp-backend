import asyncio
import websockets
import json
import subprocess
import time
import os
import signal

async def test_ws():
    uri = "ws://localhost:8001/ws/weaving/a1"
    print(f"Connecting to {uri}...")
    async with websockets.connect(uri) as websocket:
        print("Connected! Waiting for message...")
        message = await websocket.recv()
        data = json.loads(message)
        print("Received data successfully:")
        print(json.dumps(data, indent=2))
        assert "metrics" in data
        assert data["artisan_id"] == "a1"
        print("Integration test PASSED")

if __name__ == "__main__":
    # Start the server in the background
    print("Starting WebSocket server...")
    server_process = subprocess.Popen(["python", "NER-Heritage-MCP/websocket_mock.py"])
    
    # Wait for server to start
    time.sleep(2)
    
    try:
        asyncio.run(test_ws())
    finally:
        print("Shutting down server...")
        server_process.terminate()
        server_process.wait()
