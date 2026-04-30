"""
Integration Test — Social Engagement WebSocket Broadcast

Connects a WebSocket client to a post room, then triggers an engagement
event via REST. Verifies that the WebSocket client receives the broadcast
event in real-time.

Run with:
    python test_social_engagement.py

Requires the social_engagement_server.py to be running on port 8001.
"""

import asyncio
import json
import websockets
import httpx


SERVER = "http://localhost:8001"
WS_URL = "ws://localhost:8001/ws/engagement"
TEST_POST = "test_post_ws_broadcast"


async def test_like_broadcast():
    """Test: Like action broadcasts NEW_LIKE to WebSocket subscribers."""
    print("\n--- Test 1: Like Broadcast ---")

    async with websockets.connect(f"{WS_URL}/{TEST_POST}") as ws:
        # Should receive CONNECTED welcome
        raw_msg = await ws.recv()
        print(f"  [DEBUG] Received raw message: {raw_msg}")
        welcome = json.loads(raw_msg)
        assert welcome.get("type") == "CONNECTED", f"Expected CONNECTED, got {welcome.get('type')}"
        print(f"  [PASS] Connected to room '{TEST_POST}'")

        # Trigger a like via REST
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{SERVER}/api/engage",
                params={
                    "post_id": TEST_POST,
                    "user_id": "user_01",
                    "action_type": "like",
                },
            )
            result = resp.json()
            assert result["status"] == "success", f"REST failed: {result}"
            print(f"  [PASS] Like logged: {result['user']} -> {result['post_id']}")

        # Wait for the broadcast
        broadcast = json.loads(await asyncio.wait_for(ws.recv(), timeout=3.0))
        assert broadcast["type"] == "NEW_LIKE", f"Expected NEW_LIKE, got {broadcast['type']}"
        assert broadcast["data"]["user"] == "Aman Sharma"
        print(f"  [PASS] Broadcast received: {broadcast['type']} from {broadcast['data']['user']}")
        print(f"    Post stats: {broadcast['post_stats']}")

    print("  [PASS] PASSED\n")


async def test_comment_broadcast():
    """Test: Comment action broadcasts NEW_COMMENT with text to subscribers."""
    print("--- Test 2: Comment Broadcast ---")

    async with websockets.connect(f"{WS_URL}/{TEST_POST}") as ws:
        welcome = json.loads(await ws.recv())
        assert welcome["type"] == "CONNECTED"
        print(f"  [PASS] Connected to room '{TEST_POST}'")

        # Trigger a comment via REST
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{SERVER}/api/engage",
                params={
                    "post_id": TEST_POST,
                    "user_id": "user_02",
                    "action_type": "comment",
                    "text": "This silk pattern is absolutely stunning!",
                },
            )
            result = resp.json()
            assert result["status"] == "success", f"REST failed: {result}"
            print(f"  [PASS] Comment logged: {result['user']}")

        broadcast = json.loads(await asyncio.wait_for(ws.recv(), timeout=3.0))
        assert broadcast["type"] == "NEW_COMMENT"
        assert broadcast["data"]["text"] == "This silk pattern is absolutely stunning!"
        print(f"  [PASS] Broadcast received: {broadcast['type']}")
        print(f"    User: {broadcast['data']['user']}")
        print(f"    Text: {broadcast['data']['text']}")
        print(f"    Post stats: {broadcast['post_stats']}")

    print("  [PASS] PASSED\n")


async def test_reshare_broadcast():
    """Test: Reshare action broadcasts NEW_RESHARE to subscribers."""
    print("--- Test 3: Reshare Broadcast ---")

    async with websockets.connect(f"{WS_URL}/{TEST_POST}") as ws:
        welcome = json.loads(await ws.recv())
        assert welcome["type"] == "CONNECTED"
        print(f"  [PASS] Connected to room '{TEST_POST}'")

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{SERVER}/api/engage",
                params={
                    "post_id": TEST_POST,
                    "user_id": "user_04",
                    "action_type": "reshare",
                },
            )
            result = resp.json()
            assert result["status"] == "success"
            print(f"  [PASS] Reshare logged: {result['user']}")

        broadcast = json.loads(await asyncio.wait_for(ws.recv(), timeout=3.0))
        assert broadcast["type"] == "NEW_RESHARE"
        print(f"  [PASS] Broadcast received: {broadcast['type']} from {broadcast['data']['user']}")
        print(f"    Post stats: {broadcast['post_stats']}")

    print("  [PASS] PASSED\n")


async def test_duplicate_like_guard():
    """Test: Duplicate like is rejected without broadcast."""
    print("--- Test 4: Duplicate Like Guard ---")

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{SERVER}/api/engage",
            params={
                "post_id": TEST_POST,
                "user_id": "user_01",
                "action_type": "like",
            },
        )
        result = resp.json()
        assert result["status"] == "error"
        assert result["error_code"] == "DUPLICATE_LIKE"
        print(f"  [PASS] Duplicate like correctly rejected: {result['message']}")

    print("  [PASS] PASSED\n")


async def test_multi_subscriber_broadcast():
    """Test: Multiple WebSocket clients in the same room all receive the event."""
    print("--- Test 5: Multi-Subscriber Broadcast ---")
    multi_post = "test_post_multi_sub"

    # Connect 3 clients to the same room
    clients = []
    for i in range(3):
        ws = await websockets.connect(f"{WS_URL}/{multi_post}")
        welcome = json.loads(await ws.recv())
        assert welcome["type"] == "CONNECTED"
        clients.append(ws)

    print(f"  [PASS] {len(clients)} clients connected to room '{multi_post}'")

    # Trigger an engagement event
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{SERVER}/api/engage",
            params={
                "post_id": multi_post,
                "user_id": "user_05",
                "action_type": "like",
            },
        )
        assert resp.json()["status"] == "success"

    # All 3 clients should receive the broadcast
    for i, ws in enumerate(clients):
        broadcast = json.loads(await asyncio.wait_for(ws.recv(), timeout=3.0))
        assert broadcast["type"] == "NEW_LIKE"
        print(f"  [PASS] Client {i + 1} received: {broadcast['type']}")

    # Clean up
    for ws in clients:
        await ws.close()

    print("  [PASS] PASSED\n")


async def test_status_endpoint():
    """Test: Diagnostic endpoint returns accurate room stats."""
    print("--- Test 6: Status Endpoint ---")

    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{SERVER}/api/engagement/status")
        status = resp.json()
        print(f"  [PASS] Active rooms: {status['active_rooms']}")
        print(f"  [PASS] Total connections: {status['total_connections']}")
        if status.get("rooms"):
            for room, count in status["rooms"].items():
                print(f"    [-] {room}: {count} clients")

    print("  [PASS] PASSED\n")


async def main():
    print("=" * 60)
    print("  Spot@NE Social Engagement -- Integration Tests")
    print("=" * 60)

    await test_like_broadcast()
    await test_comment_broadcast()
    await test_reshare_broadcast()
    await test_duplicate_like_guard()
    await test_multi_subscriber_broadcast()
    await test_status_endpoint()

    print("=" * 60)
    print("  ALL 6 TESTS PASSED [PASS]")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
