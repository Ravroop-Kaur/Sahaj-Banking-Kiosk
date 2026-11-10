"""Per-customer kiosk sessions (spec 12 and 13). Unguessable ids, no global "current customer", expiry + wipe,
in-memory only, images never stored."""
from __future__ import annotations

import secrets
import threading
import time
import uuid
from dataclasses import dataclass, field

from app.config.settings import get_settings
from app.services.audit_logger import get_audit_logger

MAX_SESSIONS = 200


@dataclass
class Session:
    session_id: str
    correlation_id: str
    created_at: float
    last_seen: float
    language: str = ""
    state: str = "IDLE"
    service_id: str = ""
    consents: dict = field(default_factory=dict)
    identity: object = None
    identity_status: str = ""
    extracted_fields: dict = field(default_factory=dict)
    account_reference: str = ""
    account_confirmed: bool = False
    account_access: bool = False
    pending_transaction: dict | None = None
    transaction_confirmed: bool = False
    transaction: dict | None = None
    voice_providers: list = field(default_factory=list)

    def wipe(self):
        self.consents.clear()
        self.identity = None
        self.identity_status = ""
        self.extracted_fields.clear()
        self.account_reference = ""
        self.account_confirmed = False
        self.account_access = False
        self.pending_transaction = None
        self.transaction_confirmed = False
        self.transaction = None
        self.service_id = ""
        self.language = ""
        self.voice_providers.clear()
        self.state = "SESSION_COMPLETE"


class SessionManager:
    def __init__(self, clock=time.monotonic):
        self._clock = clock
        self._sessions = {}
        self._lock = threading.Lock()

    def create(self, language=""):
        now = self._clock()
        session = Session(secrets.token_urlsafe(24), uuid.uuid4().hex[:16], now, now, language=(language or "")[:8])
        with self._lock:
            self._expire_locked(now)
            while len(self._sessions) >= MAX_SESSIONS:
                self._drop_locked(min(self._sessions.values(), key=lambda s: s.last_seen).session_id, "capacity")
            self._sessions[session.session_id] = session
        get_audit_logger().log("session.created", session.correlation_id)
        return session

    def get(self, session_id):
        now = self._clock()
        with self._lock:
            self._expire_locked(now)
            session = self._sessions.get(str(session_id or ""))
            if session is not None:
                session.last_seen = now
            return session

    def clear(self, session_id, reason="completed"):
        with self._lock:
            return self._drop_locked(str(session_id or ""), reason)

    def clear_all(self, reason="kiosk_reset"):
        with self._lock:
            ids = list(self._sessions)
            for sid in ids:
                self._drop_locked(sid, reason)
            return len(ids)

    def active_count(self):
        with self._lock:
            self._expire_locked(self._clock())
            return len(self._sessions)

    def _expire_locked(self, now):
        timeout = get_settings().session_timeout_seconds
        for sid in [sid for sid, s in self._sessions.items() if now - s.last_seen > timeout]:
            self._drop_locked(sid, "timeout")

    def _drop_locked(self, session_id, reason):
        session = self._sessions.pop(session_id, None)
        if session is None:
            return False
        correlation = session.correlation_id
        session.wipe()
        get_audit_logger().log("session.cleared", correlation, reason=reason)
        return True


_manager = SessionManager()


def get_session_manager():
    return _manager
