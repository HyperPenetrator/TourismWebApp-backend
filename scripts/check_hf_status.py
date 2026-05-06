"""Check HF Space build status."""
from huggingface_hub import HfApi

api = HfApi()
info = api.space_info("hrishikeshdutta/spot-ne-backend")
r = info.runtime
print(f"Stage: {r.stage}")
if r.raw and r.raw.get("errorMessage"):
    msg = r.raw["errorMessage"]
    # Print last 300 chars for the relevant error
    print(f"Error (tail): ...{msg[-300:]}")
else:
    print("No errors")
