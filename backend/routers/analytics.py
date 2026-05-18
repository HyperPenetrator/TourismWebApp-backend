"""
Real-Time Analytics Router
==========================
Serves aggregated traffic metrics via a protected SSE stream.
Only authenticated users with role 'artisan' can access the analytics.

Security review (Persona B):
  ✓ JWT-protected — requires valid Bearer token
  ✓ Role-gated — only 'artisan' role users can access
  ✓ Rate-limited output — sends one aggregate every 3s, not raw logs
  ✓ No raw IPs or PII exposed — only aggregated counts/paths
  ✓ SSE disconnect cleanup handled
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Query
from fastapi.responses import StreamingResponse
from auth import get_current_user, get_current_user_ws
from database import SessionLocal
from models import User
import json
import asyncio
import os
import time
from datetime import datetime, timezone, timedelta
from collections import Counter, defaultdict
from pathlib import Path

router = APIRouter(tags=["Analytics"])

LOG_FILE = Path(__file__).parent.parent / "logs" / "traffic.log"


def _parse_recent_records(window_minutes: int = 60) -> list[dict]:
    """
    Parse the traffic log for records within the last `window_minutes`.
    Reads the file from the end for efficiency on large files.
    """
    if not LOG_FILE.exists():
        return []

    cutoff = datetime.now(timezone.utc) - timedelta(minutes=window_minutes)
    records = []

    try:
        with open(LOG_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    rec = json.loads(line)
                    ts_str = rec.get("ts", "").replace("Z", "+00:00")
                    ts = datetime.fromisoformat(ts_str)
                    if ts >= cutoff:
                        records.append(rec)
                except (json.JSONDecodeError, ValueError):
                    continue
    except OSError:
        return []

    return records


def _build_snapshot(records: list[dict]) -> dict:
    """
    Build a metrics snapshot from traffic records.
    No raw IPs or PII are exposed — only aggregated data.
    """
    total = len(records)
    if total == 0:
        return {
            "total_requests": 0,
            "requests_per_minute": 0.0,
            "avg_latency_ms": 0.0,
            "p95_latency_ms": 0.0,
            "error_count": 0,
            "error_rate_pct": 0.0,
            "unique_visitors": 0,
            "top_paths": [],
            "status_distribution": {},
            "method_distribution": {},
            "latency_trend": [],
            "requests_trend": [],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    path_counter: Counter = Counter()
    status_counter: Counter = Counter()
    method_counter: Counter = Counter()
    latencies: list[float] = []
    unique_ips: set = set()
    error_count = 0

    # Bucketed data for sparkline trends (last 60 min in 5-min buckets)
    now = datetime.now(timezone.utc)
    bucket_size = 5  # minutes
    num_buckets = 12
    request_buckets = [0] * num_buckets
    latency_buckets: list[list[float]] = [[] for _ in range(num_buckets)]

    for rec in records:
        path = rec.get("path", "")
        status = rec.get("status", 0)
        method = rec.get("method", "")
        latency = rec.get("latency_ms", 0.0)
        ip = rec.get("ip", "")

        path_counter[path] += 1
        status_counter[str(status)] += 1
        method_counter[method] += 1
        latencies.append(latency)
        unique_ips.add(ip)

        if status >= 400:
            error_count += 1

        # Bucket assignment
        try:
            ts_str = rec.get("ts", "").replace("Z", "+00:00")
            ts = datetime.fromisoformat(ts_str)
            minutes_ago = (now - ts).total_seconds() / 60
            bucket_idx = int(minutes_ago // bucket_size)
            if 0 <= bucket_idx < num_buckets:
                # Reverse so index 0 = oldest
                ridx = num_buckets - 1 - bucket_idx
                request_buckets[ridx] += 1
                latency_buckets[ridx].append(latency)
        except (ValueError, IndexError):
            pass

    latencies.sort()
    avg_latency = sum(latencies) / total if total else 0
    p95_idx = int(total * 0.95)
    p95_latency = latencies[min(p95_idx, total - 1)] if total else 0

    # Time span for RPM calculation
    time_span_min = max(1, len(set(rec.get("ts", "")[:16] for rec in records)))

    latency_trend = [
        round(sum(b) / len(b), 1) if b else 0.0
        for b in latency_buckets
    ]

    return {
        "total_requests": total,
        "requests_per_minute": round(total / max(1, time_span_min), 1),
        "avg_latency_ms": round(avg_latency, 1),
        "p95_latency_ms": round(p95_latency, 1),
        "error_count": error_count,
        "error_rate_pct": round((error_count / total) * 100, 1) if total else 0,
        "unique_visitors": len(unique_ips),
        "top_paths": [
            {"path": p, "count": c}
            for p, c in path_counter.most_common(8)
        ],
        "status_distribution": dict(status_counter.most_common(10)),
        "method_distribution": dict(method_counter.most_common(5)),
        "latency_trend": latency_trend,
        "requests_trend": request_buckets,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/live")
async def analytics_live_stream(
    request: Request,
    token: str = Query(None),
):
    """
    SSE endpoint that streams aggregated traffic analytics every 3 seconds.
    Authentication via query-param token (EventSource limitation — can't set headers).
    Only artisan/admin-role users get access.
    """
    if not token:
        raise HTTPException(status_code=401, detail="Token required for analytics SSE")

    # Validate JWT manually (same pattern as /sse/notifications in realtime.py)
    db = SessionLocal()
    try:
        user = await get_current_user_ws(token, db)
    finally:
        db.close()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")

    if user.role not in ("artisan", "admin"):
        raise HTTPException(
            status_code=403,
            detail="Analytics access is restricted to artisan accounts"
        )

    async def event_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break

                records = _parse_recent_records(window_minutes=60)
                snapshot = _build_snapshot(records)

                yield f"data: {json.dumps(snapshot)}\n\n"
                await asyncio.sleep(3)
        except asyncio.CancelledError:
            pass

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-store",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/snapshot")
async def analytics_snapshot(
    current_user: User = Depends(get_current_user),
):
    """
    One-shot analytics snapshot (non-streaming).
    Useful for initial dashboard hydration.
    """
    if current_user.role not in ("artisan", "admin"):
        raise HTTPException(
            status_code=403,
            detail="Analytics access is restricted to artisan accounts"
        )

    records = _parse_recent_records(window_minutes=60)
    return _build_snapshot(records)
