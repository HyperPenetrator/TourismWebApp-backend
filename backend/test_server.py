import websockets
import asyncio
import requests
import json

def test_rest():
    print("Testing REST endpoints...")
    # Register
    resp = requests.post('http://localhost:8000/api/auth/register',
        json={'username': 'test_ws', 'email': 'test_ws@example.com', 'password': 'pass123'})
    print(f"Register: {resp.status_code}")
    
    # Login
    resp = requests.post('http://localhost:8000/api/auth/login',
        json={'username': 'test_ws', 'password': 'pass123'})
    print(f"Login: {resp.status_code}")
    token = resp.json()['access_token']
    print(f"Token: {token[:30]}...")
    return token

async def test_websocket(token):
    print("\nTesting WebSocket with auth...")
    uri = f'ws://localhost:8000/ws/marketplace?token={token}'
    try:
        async with websockets.connect(uri) as ws:
            print("WebSocket connected!")
            await ws.send('test message')
            print("Message sent successfully")
            await asyncio.sleep(1)
            print("WebSocket auth test PASSED!")
    except Exception as e:
        print(f"WebSocket error: {e}")

if __name__ == "__main__":
    token = test_rest()
    asyncio.run(test_websocket(token))
