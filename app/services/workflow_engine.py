"""Configuration-driven workflow engine (spec 4 and 13). Plans come from ``app/config/service_requirements.json``;
a state is not entered until the gates before it hold."""
from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path

from app.services import form_generator
from app.services.audit_logger import get_audit_logger
from app.services.authentication import is_identity_verified
from app.services.consent_manager import has_consent
from app.services.errors import GateError

CONFIG_PATH = Path(__file__).resolve().parent.parent / "config" / "service_requirements.json"
STATES = ["IDLE", "SERVICE_SELECTION", "DOCUMENT_REQUEST", "DOCUMENT_SCANNING", "DATA_EXTRACTION", "CUSTOMER_CONFIRMATION",
          "IDENTITY_VERIFICATION", "ACCOUNT_VALIDATION", "TRANSACTION_CONFIRMATION", "BANK_PROCESSING",
          "FORM_OR_RESULT_DISPLAY", "COUNTER_GUIDANCE", "SESSION_COMPLETE"]
INTENT_TO_SERVICE = {"withdrawal": "cash_withdrawal", "deposit": "cash_deposit"}  # /api/intent labels -> service ids


@lru_cache(maxsize=1)
def _config():
    return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))


def reload_config():
    _config.cache_clear()


def services():
    return _config()["services"]


def get_service(service_id):
    return services().get(service_id)


def plan_for(service_id):
    service = get_service(service_id)
    if service is None:
        raise GateError("unknown_service", f"Unknown service {service_id!r}.", 404)
    plan = ["IDLE", "SERVICE_SELECTION"]
    if service.get("required_documents"):
        plan += ["DOCUMENT_REQUEST", "DOCUMENT_SCANNING", "DATA_EXTRACTION", "CUSTOMER_CONFIRMATION"]
    if service.get("identity_verification") or service.get("kyc_required"):
        plan.append("IDENTITY_VERIFICATION")
    if service.get("bank_integration_required") and service.get("existing_account_required", True):  # not for services that create an account
        plan.append("ACCOUNT_VALIDATION")
    if service.get("transaction_confirmation"):
        plan += ["TRANSACTION_CONFIRMATION", "BANK_PROCESSING"]
    plan.append("FORM_OR_RESULT_DISPLAY")
    if form_generator.counter_for(service_id):
        plan.append("COUNTER_GUIDANCE")
    plan.append("SESSION_COMPLETE")
    return plan


def requirements_for(service_id):
    service = get_service(service_id)
    if service is None:
        raise GateError("unknown_service", f"Unknown service {service_id!r}.", 404)
    return {"service_id": service_id, "label": service["label"], "required_documents": list(service.get("required_documents", [])),
            "identity_verification": bool(service.get("identity_verification") or service.get("kyc_required")),
            "kyc_required": bool(service.get("kyc_required")), "bank_integration_required": bool(service.get("bank_integration_required")),
            "existing_account_required": bool(service.get("existing_account_required", True)),
            "transaction_confirmation": bool(service.get("transaction_confirmation")),
            "signature_required": bool(service.get("signature_required")), "demo_supported": bool(service.get("demo_supported")),
            "states": plan_for(service_id)}


def detect_service(utterance):
    """Multilingual alias match to a stable service id; otherwise a clarification question (never a guess)."""
    text = re.sub(r"\s+", " ", (utterance or "").lower()).strip()
    matches = {sid: [a for a in svc.get("aliases", []) if a.lower() in text] for sid, svc in services().items()}
    matches = {k: v for k, v in matches.items() if v}
    if len(matches) == 1:
        sid = next(iter(matches))
        return {"service_id": sid, "label": services()[sid]["label"], "confidence": "high", "needs_clarification": False, "question": "", "options": []}
    candidates = list(matches) or [s for s in services() if services()[s].get("demo_supported")] or list(services())
    return {"service_id": None, "label": "", "confidence": "low", "needs_clarification": True,
            "question": "Which service do you need: " + ", ".join(services()[s]["label"].lower() for s in candidates) + "?",
            "options": [{"service_id": s, "label": services()[s]["label"]} for s in candidates]}


def select_service(session, service_id):
    if get_service(service_id) is None:
        raise GateError("unknown_service", f"Unknown service {service_id!r}.", 404)
    session.service_id, session.state = service_id, "SERVICE_SELECTION"
    get_audit_logger().log("workflow.service_selected", session.correlation_id, service_id=service_id)
    return plan_for(service_id)


def _gate_failures(session, plan, target):
    idx = plan.index(target)
    failures = []

    def passed(state):
        return state in plan and idx > plan.index(state)

    if "DOCUMENT_SCANNING" in plan and idx >= plan.index("DOCUMENT_SCANNING") and not has_consent(session, "data_collection"):
        failures.append(GateError("consent_required", "Consent for data collection is required before documents are scanned.", 403))
    if passed("DATA_EXTRACTION") and not session.extracted_fields:
        failures.append(GateError("no_extracted_data", "No document data has been extracted yet.", 409))
    if passed("CUSTOMER_CONFIRMATION") and not all(f.get("confirmed") for f in session.extracted_fields.values()):
        failures.append(GateError("customer_confirmation_required", "The customer must confirm every extracted field first.", 409))
    if passed("IDENTITY_VERIFICATION") and not is_identity_verified(session):
        failures.append(GateError("identity_required", "Identity verification has not succeeded.", 403))
    if passed("ACCOUNT_VALIDATION") and not (session.account_access and session.account_confirmed):
        failures.append(GateError("account_access_required", "Account access has not been validated.", 403))
    if passed("TRANSACTION_CONFIRMATION") and not session.transaction_confirmed:
        failures.append(GateError("confirmation_required", "The customer has not explicitly confirmed the transaction.", 409))
    if "BANK_PROCESSING" in plan and idx >= plan.index("BANK_PROCESSING") and not has_consent(session, "transaction"):
        failures.append(GateError("consent_required", "Transaction consent is required.", 403))
    if passed("BANK_PROCESSING") and session.transaction is None:
        failures.append(GateError("no_provider_result", "No provider result has been recorded for this transaction.", 409))
    return failures


def advance(session):
    if not session.service_id:
        raise GateError("no_service", "Select a service first.", 409)
    plan = plan_for(session.service_id)
    current = session.state if session.state in plan else "SERVICE_SELECTION"
    if current == "SESSION_COMPLETE":
        raise GateError("session_complete", "The session is already complete.", 409)
    target = plan[plan.index(current) + 1]
    failures = _gate_failures(session, plan, target)
    if failures:
        get_audit_logger().log("workflow.blocked", session.correlation_id, state=current, target=target, reason=failures[0].code)
        raise failures[0]
    session.state = target
    get_audit_logger().log("workflow.advanced", session.correlation_id, state=target)
    return target


def stop(session, reason):
    get_audit_logger().log("workflow.stopped", session.correlation_id, state=session.state, reason=reason)
    session.state = "SESSION_COMPLETE"
