"""Audit logging with built-in redaction (spec section 12). Events carry a correlation id; credential-like keys are
replaced, identifier-like keys masked, long digit runs in free text masked. Goes to the ``sahaj.audit`` logger and a
small in-memory ring buffer that no API exposes."""
from __future__ import annotations

import json
import logging
import re
import threading
import time
from collections import deque

_logger = logging.getLogger("sahaj.audit")
SECRET_KEY_PARTS = ("api_key", "apikey", "x-api-key", "password", "passwd", "biometric", "fingerprint", "aadhaar", "aadhar",
                    "pan_number", "secret", "token", "authorization", "credential", "card_number")
SECRET_KEY_WORDS = {"pin", "otp", "iris", "cvv"}  # whole-token match so "pin" does not hit "mapping"
IDENTIFIER_KEY_PARTS = ("account", "phone", "mobile", "customer_ref", "subject_ref", "ifsc", "cif")
_LONG_DIGITS = re.compile(r"\d[\d\s-]{6,}\d")


def mask_identifier(value, keep=4):
    text = re.sub(r"\s", "", str(value or ""))
    if not text:
        return ""
    return "*" * len(text) if len(text) <= keep else "*" * (len(text) - keep) + text[-keep:]


def _is_secret_key(lowered):
    return any(p in lowered for p in SECRET_KEY_PARTS) or bool(SECRET_KEY_WORDS & set(re.split(r"[^a-z0-9]+", lowered)))


def redact(value, key=""):
    lowered = key.lower()
    if _is_secret_key(lowered):
        return "[REDACTED]"
    if isinstance(value, dict):
        return {str(k): redact(v, str(k)) for k, v in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [redact(v, key) for v in value]
    identifier_key = any(p in lowered for p in IDENTIFIER_KEY_PARTS)
    if isinstance(value, bool) or value is None:
        return value
    if isinstance(value, (int, float)):
        return mask_identifier(value) if identifier_key else value
    return mask_identifier(value) if identifier_key else _LONG_DIGITS.sub(lambda m: mask_identifier(m.group(0)), str(value))[:500]


class AuditLogger:
    def __init__(self, capacity=500):
        self._events = deque(maxlen=capacity)
        self._lock = threading.Lock()

    def log(self, event, correlation_id="", **fields):
        record = {"ts": round(time.time(), 3), "event": str(event)[:80], "correlation_id": str(correlation_id)[:64], "fields": redact(fields)}
        with self._lock:
            self._events.append(record)
        try:
            _logger.info(json.dumps(record, ensure_ascii=False))
        except Exception:
            pass
        return record

    def recent(self, event=None):
        with self._lock:
            items = list(self._events)
        return [e for e in items if event is None or e["event"] == event]

    def clear(self):
        with self._lock:
            self._events.clear()


_audit = AuditLogger()


def get_audit_logger():
    return _audit
