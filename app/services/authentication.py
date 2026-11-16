"""Decision 1 of 3: IDENTITY (spec section 6). Asks the provider and records the answer. Opens no account."""
from __future__ import annotations

from app.integrations.common import OK
from app.services.audit_logger import get_audit_logger
from app.services.consent_manager import require_consent


def verify_identity(session, provider, evidence):
    require_consent(session, "identity_verification")
    result = provider.verify(evidence)
    identity = result.data.get("identity") if result.ok else None
    if identity is None or (session.identity is not None and session.identity != identity):
        session.clear_authorization()
    session.identity_status = result.status
    session.identity = identity
    get_audit_logger().log("identity.verify", session.correlation_id, provider=provider.name, status=result.status, simulated=result.simulated)
    return result


def is_identity_verified(session):
    return session.identity is not None and session.identity_status == OK
