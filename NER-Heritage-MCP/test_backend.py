import json
import unittest
import asyncio
import websockets
from mcp_server import process_swipe_right, process_swipe_left, _preference_graph, _archive_registry
from websocket_mock import WeavingSession, ARTISAN_PROFILES

class TestSpotNEMCP(unittest.TestCase):
    def setUp(self):
        # Reset global state before each test
        _preference_graph.clear()
        _archive_registry.clear()

    def test_swipe_right_success(self):
        """Test that swiping right increases affinity for the correct category."""
        user_id = "test_user"
        artisan_id = "a1" # Handloom & Textile
        
        response_json = process_swipe_right(user_id, artisan_id)
        response = json.loads(response_json)
        
        self.assertEqual(response["status"], "success")
        self.assertEqual(response["action"], "SWIPE_RIGHT")
        self.assertEqual(response["affinity_update"]["category"], "Handloom & Textile")
        self.assertGreater(response["affinity_update"]["new_score"], 0)

    def test_swipe_left_success(self):
        """Test that swiping left archives the artisan and clears affinity."""
        user_id = "test_user"
        artisan_id = "a1"
        
        # First build some affinity
        process_swipe_right(user_id, artisan_id)
        self.assertIn("Handloom & Textile", _preference_graph[user_id])
        
        # Now swipe left
        response_json = process_swipe_left(user_id, artisan_id)
        response = json.loads(response_json)
        
        self.assertEqual(response["status"], "success")
        self.assertEqual(response["action"], "SWIPE_LEFT")
        self.assertIn(artisan_id, _archive_registry[user_id])
        # Affinity should be cleared
        self.assertNotIn("Handloom & Textile", _preference_graph[user_id])

    def test_swipe_right_on_archived(self):
        """Test that swiping right on an archived artisan returns a conflict error."""
        user_id = "test_user"
        artisan_id = "a1"
        
        # Archive first
        process_swipe_left(user_id, artisan_id)
        
        # Try to swipe right
        response_json = process_swipe_right(user_id, artisan_id)
        response = json.loads(response_json)
        
        self.assertEqual(response["status"], "error")
        self.assertEqual(response["error_code"], "CONFLICT")

    def test_validation(self):
        """Test input validation for empty IDs."""
        self.assertIn("INVALID_INPUT", process_swipe_right("", "a1"))
        self.assertIn("INVALID_INPUT", process_swipe_left("u1", "  "))

class TestSpotNEWebSocket(unittest.TestCase):
    def test_session_logic(self):
        """Test the logic of the WeavingSession data generation."""
        session = WeavingSession("a1")
        initial_progress = session.progress
        
        # Advance once
        payload = session.advance()
        
        self.assertEqual(payload["artisan_id"], "a1")
        self.assertIn("current_progress", payload["metrics"])
        self.assertGreater(session.progress, initial_progress)
        self.assertEqual(payload["artisan_name"], "Kiran Devi")

async def test_websocket_connection():
    """Asynchronous test to verify actual WebSocket communication."""
    print("\nTesting WebSocket Connection (ws://localhost:8001/ws/weaving/a1)...")
    try:
        async with websockets.connect("ws://localhost:8001/ws/weaving/a1") as websocket:
            message = await websocket.recv()
            data = json.loads(message)
            print(f"Received sample payload: {json.dumps(data, indent=2)}")
            return True
    except Exception as e:
        print(f"WebSocket connection test failed: {e}")
        return False

if __name__ == "__main__":
    # Run synchronous unit tests
    print("Running Unit Tests...")
    suite = unittest.TestLoader().loadTestsFromTestCase(TestSpotNEMCP)
    unittest.TextTestRunner(verbosity=2).run(suite)
    
    suite_ws = unittest.TestLoader().loadTestsFromTestCase(TestSpotNEWebSocket)
    unittest.TextTestRunner(verbosity=2).run(suite_ws)

    print("\nNote: Integration test for WebSocket requires the server to be running.")
    print("To run full integration test, start 'python websocket_mock.py' in another terminal first.")
