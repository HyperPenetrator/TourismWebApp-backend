from datetime import datetime, timezone

def utc_now_iso() -> str:
    """Returns current UTC time in ISO 8601 format."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def validate_ids(*args: str) -> tuple[bool, str]:
    """
    Validates that all provided string IDs are non-empty.
    Returns (is_valid, error_message).
    """
    for arg in args:
        if not isinstance(arg, str) or not arg.strip():
            return False, f"Invalid ID: '{arg}'. All IDs must be non-empty strings."
    return True, ""
