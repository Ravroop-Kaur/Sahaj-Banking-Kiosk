"""Small in-memory per-client rate limiter for the endpoints that spend paid API quota.

RATE_LIMIT_PER_MIN  requests allowed per client per endpoint per minute (default 60, 0 disables)
TRUST_PROXY=1       use the first X-Forwarded-For address (set this on Render / behind a proxy)
"""
from __future__ import annotations

import os
import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

WINDOW_SECONDS = 60.0
_hits: dict[tuple[str, str], deque] = defaultdict(deque)
_lock = threading.Lock()


def _limit() -> int:
    try:
        return int(os.getenv("RATE_LIMIT_PER_MIN", "60"))
    except ValueError:
        return 60


def client_id(request: Request) -> str:
    if os.getenv("TRUST_PROXY", "").strip() in {"1", "true", "yes"}:
        forwarded = request.headers.get("x-forwarded-for", "")
        if forwarded:
            return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def reset() -> None:
    with _lock:
        _hits.clear()


def rate_limit(request: Request) -> None:
    """FastAPI dependency: raises 429 when a client exceeds the per-minute budget for this path."""
    limit = _limit()
    if limit <= 0:
        return
    key = (client_id(request), request.url.path)
    now = time.monotonic()
    with _lock:
        q = _hits[key]
        while q and now - q[0] > WINDOW_SECONDS:
            q.popleft()
        if len(q) >= limit:
            retry = max(1, int(WINDOW_SECONDS - (now - q[0])))
            raise HTTPException(status_code=429, detail="Too many requests. Please wait a moment.", headers={"Retry-After": str(retry)})
        q.append(now)
        if len(_hits) > 5000:  # drop idle keys so the table cannot grow without bound
            for k in [k for k, v in _hits.items() if not v or now - v[-1] > WINDOW_SECONDS]:
                _hits.pop(k, None)
