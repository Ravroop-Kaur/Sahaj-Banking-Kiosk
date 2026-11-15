"""Consent capture (spec section 12): explicit, per purpose, recorded per session."""
from __future__ import annotations

from datetime import datetime, timezone

from app.services.audit_logger import get_audit_logger
from app.services.errors import GateError

PURPOSES = {
    "data_collection": {"collects": "Images and details read from the documents you show the kiosk.",
                        "why": "To fill in your form and show you the right next step."},
    "identity_verification": {"collects": "The result of an identity check. Biometric data is never stored by this kiosk.",
                              "why": "To confirm who you are before anything on your account is shown or changed."},
    "transaction": {"collects": "The amount you confirm and the outcome returned by the provider.",
                    "why": "To process the request you have just reviewed and confirmed."},
}


def consent_notice(purpose, provider_label):
    if purpose not in PURPOSES:
        raise GateError("unknown_consent_purpose", f"Unknown consent purpose {purpose!r}.", 422)
    return {"purpose": purpose, **PURPOSES[purpose], "processed_by": provider_label}


def record_consent(session, purpose, granted, provider_label=""):
    if purpose not in PURPOSES:
        raise GateError("unknown_consent_purpose", f"Unknown consent purpose {purpose!r}.", 422)
    entry = {"granted": bool(granted), "at": datetime.now(timezone.utc).isoformat(timespec="seconds"), "processed_by": provider_label}
    session.consents[purpose] = entry
    get_audit_logger().log("consent.recorded", session.correlation_id, purpose=purpose, granted=bool(granted))
    return entry


def has_consent(session, purpose):
    return bool(session.consents.get(purpose, {}).get("granted"))


def require_consent(session, purpose):
    if not has_consent(session, purpose):
        raise GateError("consent_required", f"The customer has not given consent for: {purpose.replace('_', ' ')}.", 403)
