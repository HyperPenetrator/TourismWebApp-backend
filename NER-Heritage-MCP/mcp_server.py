"""
NER-Heritage-MCP | Spot@NE Platform
MCP Server for Gesture-Based Navigation & Feed Intelligence

Exposes FastMCP tools triggered by swipe gestures in the frontend.
Returns lightweight JSON payloads to avoid blocking the UI thread.

Run with:
    python mcp_server.py

Dependencies:
    pip install fastmcp
"""

import json
import random
from mcp.server.fastmcp import FastMCP
from utils.common import utc_now_iso, validate_ids

# ─── Server Initialization ──────────────────────────────────────────────────

mcp = FastMCP(
    name="SpotNE-HeritageEngine",
    instructions=(
        "You are the backend intelligence layer for Spot@NE, a premium eco-tourism "
        "platform for Northeast India. You handle gesture-based user interactions "
        "and surface lightweight data payloads to drive the recommendation feed."
    ),
)

# ─── In-Memory State (replace with DB in production) ───────────────────────

# Simulates a user preference graph: { user_id: { category: affinity_score } }
_preference_graph: dict[str, dict[str, float]] = {}

# Simulates an archive/exclusion list: { user_id: set(target_ids) }
_archive_registry: dict[str, set[str]] = {}



# ─── MCP Tools ─────────────────────────────────────────────────────────────

@mcp.tool(
    description=(
        "Triggered by a 'Swipe Right' gesture on an artisan profile or experience card. "
        "Logs the user's interest and increases their affinity score for the artisan's "
        "category in the preference graph. Returns a lightweight confirmation payload."
    )
)
def process_swipe_right(user_id: str, artisan_id: str) -> str:
    """
    Records a positive interaction (Swipe Right) and updates the user's preference graph.

    Args:
        user_id:    Unique identifier for the authenticated user (e.g., 'user_42').
        artisan_id: Unique identifier for the artisan profile being interacted with (e.g., 'a1').

    Returns:
        JSON string with the interaction status and updated affinity delta.
    """
    is_valid, error_msg = validate_ids(user_id, artisan_id)
    if not is_valid:
        return json.dumps({
            "status": "error",
            "error_code": "INVALID_INPUT",
            "message": error_msg
        })

    # Guard: cannot swipe right on an archived item
    if artisan_id in _archive_registry.get(user_id, set()):
        return json.dumps({
            "status": "error",
            "error_code": "CONFLICT",
            "message": f"Artisan '{artisan_id}' is archived. Remove from archive before deploying interest."
        })

    # Mock: determine artisan category from ID prefix
    # In production, this is a DB lookup
    category_map = {
        "a1": "Handloom & Textile",
        "a2": "Bamboo Craft",
        "a3": "River Island Pottery",
    }
    category = category_map.get(artisan_id, "Cultural Heritage")

    # Update in-memory preference graph
    user_prefs = _preference_graph.setdefault(user_id, {})
    current_affinity = user_prefs.get(category, 0.0)
    affinity_delta = round(random.uniform(0.08, 0.18), 4)
    user_prefs[category] = round(min(current_affinity + affinity_delta, 1.0), 4)

    return json.dumps({
        "status": "success",
        "action": "SWIPE_RIGHT",
        "user_id": user_id,
        "artisan_id": artisan_id,
        "affinity_update": {
            "category": category,
            "previous_score": round(current_affinity, 4),
            "delta": affinity_delta,
            "new_score": user_prefs[category],
        },
        "timestamp": utc_now_iso(),
        "engine_note": "Feed will prioritize similar profiles in next render cycle."
    })


@mcp.tool(
    description=(
        "Triggered by a 'Swipe Left' gesture on an artisan profile or experience card. "
        "Archives the profile for this user, ensuring it is permanently excluded from "
        "their future recommendation feed. Returns a lightweight confirmation payload."
    )
)
def process_swipe_left(user_id: str, artisan_id: str) -> str:
    """
    Records a negative interaction (Swipe Left) and adds the target to the user's archive.

    Args:
        user_id:    Unique identifier for the authenticated user (e.g., 'user_42').
        artisan_id: Unique identifier for the artisan profile to be archived (e.g., 'a2').

    Returns:
        JSON string with the archive status and feed impact summary.
    """
    is_valid, error_msg = validate_ids(user_id, artisan_id)
    if not is_valid:
        return json.dumps({
            "status": "error",
            "error_code": "INVALID_INPUT",
            "message": error_msg
        })

    # Initialize archive for user if not present
    user_archive = _archive_registry.setdefault(user_id, set())

    already_archived = artisan_id in user_archive
    user_archive.add(artisan_id)

    # Also remove any positive interest previously deployed
    user_prefs = _preference_graph.get(user_id, {})
    category_map = {
        "a1": "Handloom & Textile",
        "a2": "Bamboo Craft",
        "a3": "River Island Pottery",
    }
    category = category_map.get(artisan_id, "Cultural Heritage")
    cleared_affinity = user_prefs.pop(category, None)

    return json.dumps({
        "status": "success",
        "action": "SWIPE_LEFT",
        "user_id": user_id,
        "artisan_id": artisan_id,
        "archive_result": {
            "was_already_archived": already_archived,
            "total_archived_count": len(user_archive),
            "cleared_affinity_category": category if cleared_affinity is not None else None,
        },
        "filter_applied": True,
        "timestamp": utc_now_iso(),
        "engine_note": "Profile excluded from feed. Preference graph updated."
    })


# ─── Entry Point ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    # Runs the MCP server over stdio (standard for local MCP clients)
    mcp.run()
