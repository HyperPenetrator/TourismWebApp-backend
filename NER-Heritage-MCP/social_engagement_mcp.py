"""
NER-Heritage-MCP | Spot@NE Platform
Social Engagement MCP Server — Likes, Reshares, Comments

Exposes a single high-performance tool `log_engagement` that validates
user engagement events, persists them to a mock database, and triggers
a real-time WebSocket broadcast to all subscribers of the related post.

Run with:
    python social_engagement_mcp.py

Dependencies:
    pip install fastmcp pydantic
"""

import json
import uuid
import logging
from typing import Optional
from enum import Enum

from pydantic import BaseModel, Field, field_validator, ConfigDict
from mcp.server.fastmcp import FastMCP
from utils.common import utc_now_iso

# ─── Logging ─────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("spot-ne-engagement-mcp")

# ─── Server Initialization ──────────────────────────────────────────────────

mcp = FastMCP(
    name="SpotNE-SocialEngagement",
    instructions=(
        "You are the social engagement processor for Spot@NE. You handle user "
        "interactions on heritage content — likes, reshares, and comments. "
        "Each interaction is validated, recorded, and triggers a real-time "
        "notification to all connected viewers of the target post."
    ),
)

# ─── Action Types ────────────────────────────────────────────────────────────

class ActionType(str, Enum):
    """Valid engagement action types."""
    LIKE = "like"
    RESHARE = "reshare"
    COMMENT = "comment"


# ─── Pydantic Input Model ───────────────────────────────────────────────────

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
            "Additional data for the action. Required for 'comment' actions — "
            "must contain a 'text' key with the comment body. "
            "Example: { \"text\": \"Amazing craftsmanship!\" }"
        ),
    )

    @field_validator("payload")
    @classmethod
    def validate_payload_for_comments(cls, v: Optional[dict], info) -> Optional[dict]:
        """Ensures comment actions include non-empty text in the payload."""
        # We access action_type from the data dict during validation
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
            # Normalize: strip whitespace from comment text
            v["text"] = text.strip()
        return v


# ─── Mock Database ──────────────────────────────────────────────────────────

# In-memory engagement log: list of processed events
_engagement_store: list[dict] = []

# Per-post engagement counters
_post_stats: dict[str, dict[str, int]] = {}

# Per-user engagement tracking (to detect duplicate likes)
_user_likes: dict[str, set[str]] = {}  # { user_id: set(post_ids) }

# Mock user display names
_user_display_names: dict[str, str] = {
    "user_01": "Aman Sharma",
    "user_02": "Priya Gogoi",
    "user_03": "Ritu Devi",
    "user_04": "Vikram Nongthombam",
    "user_05": "Meena Baruah",
}

def _get_display_name(user_id: str) -> str:
    """Returns a mock display name for a user, or a generated fallback."""
    return _user_display_names.get(user_id, f"User-{user_id[-4:]}")




# ─── WebSocket Broadcast Bridge ─────────────────────────────────────────────
# This is a callable hook that the FastAPI server sets at startup.
# It allows the MCP tool (which runs synchronously) to schedule
# an async WebSocket broadcast without importing FastAPI directly.

_broadcast_hook = None

def set_broadcast_hook(hook):
    """
    Registers a callable that the MCP tool invokes to broadcast events.
    The hook signature must be: hook(post_id: str, event: dict) -> None
    """
    global _broadcast_hook
    _broadcast_hook = hook
    log.info("WebSocket broadcast hook registered.")


# ─── MCP Tool ────────────────────────────────────────────────────────────────

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

    Validates the input, records it in the mock database, updates post statistics,
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
    post_id = params.post_id
    user_id = params.user_id
    action = params.action_type
    timestamp = utc_now_iso()
    event_id = str(uuid.uuid4())[:12]

    # ── Duplicate Like Guard ──────────────────────────────────────────
    if action == ActionType.LIKE:
        user_like_set = _user_likes.setdefault(user_id, set())
        if post_id in user_like_set:
            return json.dumps({
                "status": "error",
                "error_code": "DUPLICATE_LIKE",
                "message": f"User '{user_id}' has already liked post '{post_id}'.",
                "suggestion": "Use 'unlike' action to toggle, or ignore.",
            })
        user_like_set.add(post_id)

    # ── Update Post Stats ─────────────────────────────────────────────
    stats = _post_stats.setdefault(post_id, {"likes": 0, "reshares": 0, "comments": 0})
    stat_key = f"{action.value}s"  # like -> likes, comment -> comments
    stats[stat_key] = stats.get(stat_key, 0) + 1

    # ── Build Engagement Record ───────────────────────────────────────
    display_name = _get_display_name(user_id)
    record = {
        "event_id": event_id,
        "post_id": post_id,
        "user_id": user_id,
        "display_name": display_name,
        "action": action.value,
        "timestamp": timestamp,
    }

    if action == ActionType.COMMENT:
        record["comment_text"] = params.payload["text"]

    _engagement_store.append(record)
    log.info(f"[{action.value.upper()}] {display_name} → post '{post_id}' (event: {event_id})")

    # ── Build WebSocket Broadcast Event ───────────────────────────────
    ws_event_type_map = {
        ActionType.LIKE: "NEW_LIKE",
        ActionType.RESHARE: "NEW_RESHARE",
        ActionType.COMMENT: "NEW_COMMENT",
    }

    ws_event = {
        "type": ws_event_type_map[action],
        "data": {
            "event_id": event_id,
            "user": display_name,
            "user_id": user_id,
            "timestamp": timestamp,
        },
        "post_stats": stats.copy(),
    }

    if action == ActionType.COMMENT:
        ws_event["data"]["text"] = params.payload["text"]

    # Fire broadcast if the hook is registered
    if _broadcast_hook is not None:
        try:
            _broadcast_hook(post_id, ws_event)
            log.info(f"Broadcast dispatched for post '{post_id}'.")
        except Exception as e:
            log.error(f"Broadcast hook failed: {e}")
    else:
        log.warning("No broadcast hook registered — WebSocket event not sent.")

    # ── Return Response ───────────────────────────────────────────────
    return json.dumps({
        "status": "success",
        "event_id": event_id,
        "action": action.value,
        "post_id": post_id,
        "user": display_name,
        "timestamp": timestamp,
        "post_stats": stats,
        "broadcast_sent": _broadcast_hook is not None,
    })


# ─── Entry Point (stdio transport for MCP clients) ──────────────────────────

if __name__ == "__main__":
    mcp.run()
