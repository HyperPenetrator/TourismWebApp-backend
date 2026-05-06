"""
Upload Spot@NE backend to Hugging Face Spaces.
Usage: python scripts/upload_to_hf.py
"""
import os
import sys

# Add backend to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from huggingface_hub import HfApi, upload_folder

SPACE_ID = "hrishikeshdutta/spot-ne-backend"
BACKEND_DIR = os.path.join(os.path.dirname(__file__), '..', 'backend')

api = HfApi()

# Files/dirs to exclude from upload
IGNORE_PATTERNS = [
    ".venv/*",
    "__pycache__/*",
    ".pytest_cache/*",
    "*.pyc",
    ".env",
    "server.log",
    "spot_ne.db",
    "uploads/*",
    "test_data/*",
]

print(f"Uploading {BACKEND_DIR} to HF Space: {SPACE_ID}")
print(f"Ignoring: {IGNORE_PATTERNS}")

try:
    url = upload_folder(
        folder_path=os.path.abspath(BACKEND_DIR),
        repo_id=SPACE_ID,
        repo_type="space",
        ignore_patterns=IGNORE_PATTERNS,
    )
    print(f"\n[OK] Upload complete!")
    print(f"   Space URL: https://huggingface.co/spaces/{SPACE_ID}")
    print(f"   API URL:   https://hrishikeshdutta-spot-ne-backend.hf.space")
except Exception as e:
    print(f"\n[FAIL] Upload failed: {e}")
    sys.exit(1)
