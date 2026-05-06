"""
NER-Heritage-MCP | Spot@NE Platform
Social Engagement MCP Server - Likes, Reshares, Comments

Exposes a single high-performance tool `log_engagement` that validates
user engagement events, persists them to the database, and triggers
a real-time WebSocket broadcast to all subscribers of the related post.

Run with:
    python social_engagement_mcp.py

Dependencies:
    pip install fastmcp pydantic sqlalchemy psycopg2-binary
"""

import json
import uuid
import logging
from typing import Optional
from enum import Enum

from pydantic import BaseModel, Field, field_validator, ConfigDict
from mcp.server.fastmcp import FastMCP
from utils.common import utc_now_iso
from database import SessionLocal
from models import User, Engagement as DBEngagement, Post

# ─── Logging ─────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("spot-ne-engagement-mcp")

# ─── Server Initialization ───────────────────────────────────────────

mcp = FastMCP(
    name="SpotNE-SocialEngagement",
    instructions=(
        "You are the social engagement processor for Spot@NE. You handle user "
        "interactions on heritage content - likes, reshares, and comments. "
        "Each interaction is validated, recorded, and triggers a real-time "
        "notification to all connected viewers of the target post."
    ),
)

# ─── Action Types ────────────────────────────────────────────────────

class ActionType(str, Enum):
    """Valid engagement action types."""
    LIKE = "like"
    RESHARE = "reshare"
    COMMENT = "comment"


# ─── Pydantic Input Model ───────────────────────────────────────────

class EngagementInput(BaseModel):
    """Validated input for the log_engagement tool."""
    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra="forbid",
    )

    post_id: str = Field(
        ...,
        description="Unique identifier for the target post (e.g., 'post_a1_weaving_demo')",
        min_length=1,
        max_length=128,
    )
    user_id: str = Field(
        ...,
        description="Unique identifier for the user performing the action (e.g., 'user_42')",
        min_length=1,
        max_length=128,
    )
    action_type: ActionType = Field(
        ...,
        description="Type of engagement: 'like', 'reshare', or 'comment'",
    )
    payload: Optional[dict] = Field(
        default=None,
        description=(
            "Additional data for the action. Required for 'comment' actions - "
            "must contain a 'text' key with the comment body. "
            "Example: { \"text\": \"Amazing craftsmanship!\" }"
        ),
    )

    @field_validator("payload")
    @classmethod
    def validate_payload_for_comments(cls, v: Optional[dict], info) -> Optional[dict]:
        """Ensures comment actions include non-empty text in the payload."""
        action_type = info.data.get("action_type")
        if action_type == ActionType.COMMENT:
            if v is None:
                raise ValueError(
                    "Payload is required for 'comment' actions. "
                    "Expected: { \"text\": \"your comment\" }"
                )
            text = v.get("text")
            if not isinstance(text, str) or not text.strip():
                raise ValueError(
                    "Payload must contain a non-empty 'text' field for comments."
                )
            v["text"] = text.strip()
        return v


# ─── WebSocket Broadcast Bridge ─────────────────────────────────────

_broadcast_hook = None

def set_broadcast_hook(hook):
    """
    Registers a callable that the MCP tool invokes to broadcast events.
    The hook signature must be: hook(post_id: str, event: dict) -> None
    """
    global _broadcast_hook
    _broadcast_hook = hook
    log.info("WebSocket broadcast hook registered.")


# ─── MCP Tool ────────────────────────────────────────────────────────

@mcp.tool(
    name="log_engagement",
    annotations={
        "title": "Log Social Engagement Event",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": False,
        "openWorldHint": False,
    },
)
def log_engagement(params: EngagementInput) -> str:
    """
    Logs a social engagement event (like, reshare, or comment) for a heritage post.

    Validates the input, records it in the database, updates post statistics,
    and triggers a real-time WebSocket broadcast to all viewers of the post.

    Args:
        params (EngagementInput): Validated engagement data containing:
            - post_id (str): Target post identifier
            - user_id (str): Acting user identifier
            - action_type (ActionType): 'like', 'reshare', or 'comment'
            - payload (Optional[dict]): For comments, must contain { "text": "..." }

    Returns:
        str: JSON-formatted response with event details and updated post stats.

    Error responses:
        - DUPLICATE_LIKE: User has already liked this post
        - VALIDATION_ERROR: Invalid input data
    """
    db = SessionLocal()
    try:
        # Convert string user_id to int if it's numeric
        try:
            user_id_int = int(params.user_id) if params.user_id.isdigit() else None
        except:
            user_id_int = None

        # Check for duplicate like
        if params.action_type == ActionType.LIKE and user_id_int:
            existing = db.query(DBEngagement).filter(
                DBEngagement.user_id == user_id_int,
                DBEngagement.post_id == params.post_id,
                DBEngagement.action_type == "like"
            ).first()
            if existing:
                return json.dumps({
                    "status": "error",
                    "error_code": "DUPLICATE_LIKE",
                    "message": f"User '{params.user_id}' has already liked post '{params.post_id}'.",
                })

        # Get display name
        display_name = params.user_id
        if user_id_int:
            user = db.query(User).filter(User.id == user_id_int).first()
            if user:
                display_name = user.username

        # Create engagement record
        event_id = str(uuid.uuid4())[:12]
        engagement = DBEngagement(
            post_id=int(params.post_id) if params.post_id.isdigit() else None,
            user_id=user_id_int,
            action_type=params.action_type.value,
            text=params.payload.get("text") if params.payload else None,
        )
        db.add(engagement)

        # Update post stats (using in-memory for quick access, could be a DB query)
        stats = {"likes": 0, "reshares": 0, "comments": 0}
        engagements = db.query(DBEngagement).filter(
            DBEngagement.post_id == engagement.post_id
        ).all()
        for eng in engagements:
            if eng.action_type == "like":
                stats["likes"] += 1
            elif eng.action_type == "reshare":
                stats["reshares"] += 1
            elif eng.action_type == "comment":
                stats["comments"] += 1

        db.commit()

        log.info(f"[{params.action_type.value.upper()}] {display_name} -> post '{params.post_id}' (event: {event_id})")

        # Build WebSocket event
        ws_event_type_map = {
            ActionType.LIKE: "NEW_LIKE",
            ActionType.RESHARE: "NEW_RESHARE",
            ActionType.COMMENT: "NEW_COMMENT",
        }

        ws_event = {
            "type": ws_event_type_map[params.action_type],
            "data": {
                "event_id": event_id,
                "user": display_name,
                "user_id": params.user_id,
                "timestamp": utc_now_iso(),
            },
            "post_stats": stats,
        }

        if params.action_type == ActionType.COMMENT and params.payload:
            ws_event["data"]["text"] = params.payload["text"]

        # Fire broadcast if the hook is registered
        if _broadcast_hook is not None:
            try:
                _broadcast_hook(params.post_id, ws_event)
                log.info(f"Broadcast dispatched for post '{params.post_id}'.")
            except Exception as e:
                log.error(f"Broadcast hook failed: {e}")
        else:
            log.warning("No broadcast hook registered - WebSocket event not sent.")

        return json.dumps({
            "status": "success",
            "event_id": event_id,
            "action": params.action_type.value,
            "post_id": params.post_id,
            "user": display_name,
            "timestamp": utc_now_iso(),
            "post_stats": stats,
            "broadcast_sent": _broadcast_hook is not None,
        })

    except Exception as e:
        db.rollback()
        log.error(f"Error logging engagement: {e}")
        return json.dumps({"status": "error", "message": str(e)})
    finally:
        db.close()


# ─── Entry Point (stdio transport for MCP clients) ──────────────────

if __name__ == "__main__":
    mcp.run()

