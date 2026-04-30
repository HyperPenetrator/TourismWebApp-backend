"""
NER-Heritage-MCP | Spot@NE Platform
MCP Server for Social Engagement Logging

Exposes a tool to log likes, reshares, and comments. 
Validates data, mocks database storage, and triggers a real-time 
WebSocket broadcast via the internal FastAPI manager endpoint.

Run with:
    python engagement_mcp.py
"""

import json
import logging
import urllib.request
from datetime import datetime, timezone

from mcp.server.fastmcp import FastMCP

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("engagement_mcp")

mcp = FastMCP(
    name="SpotNE-EngagementEngine",
    instructions="You handle real-time social interactions (likes, comments, reshares) for the Spot@NE platform."
)

# Internal endpoint for the FastAPI WebSocket manager
WS_MANAGER_URL = "http://localhost:8001/api/internal/broadcast"

# Mock Database
_mock_db = {
    "likes": [],
    "comments": [],
    "reshares": []
}

def _utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

@mcp.tool()
def log_engagement(post_id: str, user_id: str, action_type: str, payload: str = "") -> str:
    """
    Logs a social engagement action and triggers a real-time broadcast.
    
    Args:
        post_id: Unique identifier for the post.
        user_id: Unique identifier for the user performing the action.
        action_type: Must be 'like', 'reshare', or 'comment'.
        payload: The text content if action_type is 'comment'. Otherwise, can be empty.
    
    Returns:
        JSON string confirming the logging and broadcast status.
    """
    # 1. Validation
    valid_actions = {"like", "reshare", "comment"}
    if action_type not in valid_actions:
        return json.dumps({
            "status": "error",
            "message": f"Invalid action_type. Must be one of {valid_actions}"
        })
        
    if action_type == "comment" and not payload.strip():
        return json.dumps({
            "status": "error",
            "message": "Payload (comment text) cannot be empty for a 'comment' action."
        })

    # 2. Mock Database Save
    record = {
        "post_id": post_id,
        "user_id": user_id,
        "timestamp": _utc_now()
    }
    
    event_type = ""
    event_data = {"user": user_id, "timestamp": record["timestamp"]}
    
    if action_type == "like":
        _mock_db["likes"].append(record)
        event_type = "NEW_LIKE"
    elif action_type == "reshare":
        _mock_db["reshares"].append(record)
        event_type = "NEW_RESHARE"
    elif action_type == "comment":
        record["text"] = payload
        _mock_db["comments"].append(record)
        event_type = "NEW_COMMENT"
        event_data["text"] = payload

    logger.info(f"Saved {action_type} from {user_id} on post {post_id} to mock DB.")

    # 3. Trigger WebSocket Broadcast
    broadcast_success = False
    broadcast_error = ""
    
    try:
        req_data = json.dumps({
            "post_id": post_id,
            "event_type": event_type,
            "data": event_data
        }).encode("utf-8")
        
        req = urllib.request.Request(
            WS_MANAGER_URL, 
            data=req_data, 
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        
        with urllib.request.urlopen(req, timeout=2.0) as response:
            if response.status == 200:
                broadcast_success = True
                logger.info(f"Successfully triggered WebSocket broadcast for {event_type}")
    except Exception as e:
        logger.error(f"Failed to trigger WS broadcast (is social_websocket.py running?): {e}")
        broadcast_error = str(e)

    # 4. Return result
    return json.dumps({
        "status": "success",
        "action_type": action_type,
        "post_id": post_id,
        "db_saved": True,
        "broadcast_triggered": broadcast_success,
        "broadcast_error": broadcast_error if not broadcast_success else None
    })

if __name__ == "__main__":
    # Start the FastMCP server over stdio
    mcp.run()
