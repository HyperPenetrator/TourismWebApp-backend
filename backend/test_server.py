import websockets
import asyncio
import requests
import json
import uuid
import pytest

BASE = "http://localhost:8000"

# Unique credentials per test run to avoid "already registered" conflicts
_uid = uuid.uuid4().hex[:8]
_USERNAME = f"test_{_uid}"
_EMAIL = f"test_{_uid}@example.com"
_PASSWORD = "pass123"


@pytest.fixture(scope="module")
def token():
    """Register + login, return a valid JWT token for downstream tests."""
    # Register (may 400 if user exists — that's fine, we just need the login)
    requests.post(
        f"{BASE}/api/auth/register",
        json={"username": _USERNAME, "email": _EMAIL, "password": _PASSWORD},
    )
    # Login
    resp = requests.post(
        f"{BASE}/api/auth/login",
        json={"username": _USERNAME, "password": _PASSWORD},
    )
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return resp.json()["access_token"]


def test_rest(token):
    """Verify auth endpoints work and the token is valid."""
    print("Testing REST endpoints...")
    # Use the token to hit /me
    resp = requests.get(
        f"{BASE}/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    print(f"GET /api/auth/me: {resp.status_code}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["username"] == _USERNAME


@pytest.mark.anyio
async def test_websocket(token):
    """Verify WebSocket marketplace feed accepts connections."""
    print("\nTesting WebSocket with auth...")
    uri = f"ws://localhost:8000/ws/marketplace?token={token}"
    try:
        async with websockets.connect(uri) as ws:
            print("WebSocket connected!")
            await ws.send("test message")
            print("Message sent successfully")
            await asyncio.sleep(1)
            print("WebSocket auth test PASSED!")
    except Exception as e:
        pytest.fail(f"WebSocket error: {e}")


if __name__ == "__main__":
    # Manual run outside pytest
    requests.post(
        f"{BASE}/api/auth/register",
        json={"username": _USERNAME, "email": _EMAIL, "password": _PASSWORD},
    )
    resp = requests.post(
        f"{BASE}/api/auth/login",
        json={"username": _USERNAME, "password": _PASSWORD},
    )
    t = resp.json()["access_token"]
    print(f"Token: {t[:30]}...")
    asyncio.run(test_websocket(t))
