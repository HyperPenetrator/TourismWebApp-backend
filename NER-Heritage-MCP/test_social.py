import asyncio
import websockets
import json
import subprocess
import time
import os
import signal
import urllib.request

# Configuration
WS_URI = "ws://localhost:8002/ws/engagement/post_test"
INTERNAL_API_URL = "http://localhost:8002/api/internal/broadcast"

connected_event = asyncio.Event()

async def mock_client():
    """Simulates a frontend client connecting to a post's engagement room."""
    print(f"Client connecting to {WS_URI}...")
    try:
        async with websockets.connect(WS_URI) as websocket:
            print("Client connected! Ready for broadcast...")
            connected_event.set()
            
            # Receive the broadcast
            message = await websocket.recv()
            data = json.loads(message)
            print("Client RECEIVED broadcast successfully:")
            print(json.dumps(data, indent=2))
            
            # Verification
            assert data["type"] == "NEW_COMMENT"
            assert data["data"]["text"] == "This is a test comment!"
            print("\nVerification successful: Broadcast content matches expectation.")
            return True
    except Exception as e:
        print(f"Client connection or receive failed: {e}")
        return False

def trigger_engagement():
    """Simulates the MCP tool processing an engagement action."""
    print("\nTriggering engagement action (log_engagement mock)...")
    payload = {
        "post_id": "post_test",
        "event_type": "NEW_COMMENT",
        "data": {
            "user": "test_user",
            "timestamp": "2026-05-01T00:00:00Z",
            "text": "This is a test comment!"
        }
    }
    
    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        INTERNAL_API_URL,
        data=req_data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req, timeout=5.0) as response:
            if response.status == 200:
                print("MCP tool successfully triggered internal broadcast.")
                return True
    except Exception as e:
        print(f"Failed to trigger broadcast: {e}")
        return False

async def main():
    # 1. Start the WebSocket Manager
    print("Starting Social WebSocket Manager on port 8002...")
    env = os.environ.copy()
    env["PYTHONPATH"] = "NER-Heritage-MCP/utils"
    server_process = subprocess.Popen(
        ["python", "-m", "uvicorn", "social_websocket:app", "--port", "8002"],
        env=env
    )
    
    # 2. Give server time to boot
    await asyncio.sleep(3)
    
    try:
        # 3. Start mock client and wait for it to connect
        client_task = asyncio.create_task(mock_client())
        
        # Wait for client to be fully connected
        await asyncio.wait_for(connected_event.wait(), timeout=10)
        
        # 4. Trigger the engagement (simulating log_engagement tool)
        trigger_engagement()
        
        # 5. Wait for client to receive and finish
        success = await asyncio.wait_for(client_task, timeout=10)
    except Exception as e:
        print(f"Test timed out or failed: {e}")
        success = False
    finally:
        # 6. Cleanup
        print("\nShutting down servers...")
        server_process.terminate()
        server_process.wait()
    
    if success:
        print("\nLOCAL TEST PASSED: Social Engagement Pipeline works end-to-end.")
    else:
        print("\nLOCAL TEST FAILED.")

if __name__ == "__main__":
    asyncio.run(main())
