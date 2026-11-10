"""Form selection, mandatory-field checks, labelling and counter guidance (spec 10 and 11). PDF drawing stays in ``main.py``.
Counter numbers come from ``data/counter_directory.json``."""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from app.services.errors import GateError

CONFIG_DIR = Path(__file__).resolve().parent.parent / "config"
FIELD_MAPPINGS = Path(__file__).resolve().parents[2] / "field_mappings.json"

DRAFT_LABEL = {"draft": True, "submitted": False, "signature_recorded": False, "bank_transaction_completed": False,
               "notice": "Prepared form draft only. It has not been submitted, signed or processed by any bank."}

MANDATORY_FIELDS = {
    "withdrawal": ("name", "account_id", "phone", "amount"),
    "deposit": ("name", "branch", "amount"),
    "dcb-request": ("name", "branch", "request"),
    "account-opening": ("name", "branch", "address", "phone"),
    "sbi-account-opening": ("name", "branch", "address"),
    "transaction": ("branch", "beneficiary", "beneficiaryAccount", "amount"),
}

# Existing form ids -> the service whose counter applies.
FORM_SERVICE = {"withdrawal": "cash_withdrawal", "deposit": "cash_deposit", "dcb-request": "mobile_address_update",
                "account-opening": "account_opening", "sbi-account-opening": "account_opening", "transaction": "transfer_request"}


def service_for_form(form_or_service_id):
    return FORM_SERVICE.get(form_or_service_id, form_or_service_id)


@lru_cache(maxsize=1)
def _counters():
    return json.loads((FIELD_MAPPINGS.parent / "data" / "counter_directory.json").read_text(encoding="utf-8"))


def reload_counters():
    _counters.cache_clear()


def all_counters():
    return dict(_counters().get("default", {}))


def counter_for(service_id, branch_id=None):
    data = _counters()
    entry = (data.get("branches", {}).get(branch_id) or {}).get(service_id) if branch_id else None
    entry = entry or data.get("default", {}).get(service_id)
    return dict(entry) if entry else None


def counter_guidance(service_id, services, branch_id=None):
    counter, service = counter_for(service_id, branch_id), services.get(service_id)
    if counter is None:
        return None
    service = service or {"label": service_id.replace("_", " ").capitalize()}
    return {"service_id": service_id, "service_name": service["label"], "counter": counter["counter"],
            "counter_label": counter["label"], "instruction": counter["instruction"],
            "required_documents": list(service.get("required_documents", [])),
            "signature_required": bool(service.get("signature_required")), "staff_assistance": bool(counter.get("staff_assistance"))}


def counter_page_lines(service_id):
    counter = counter_for(service_id) or counter_for("cash_withdrawal")
    n = counter["counter"]
    return (f"NEXT STEP: COUNTER {n}", f"Take the printed draft to Counter {n} ({counter['label']}).",
            "This is a synthetic demo form. No bank transaction has occurred.")


@lru_cache(maxsize=1)
def _known_form_ids():
    data = json.loads(FIELD_MAPPINGS.read_text(encoding="utf-8"))
    return frozenset({"withdrawal", *data.get("sample_forms", {}).keys()})


def template_for(service_id, services, bank_id="demo"):
    """Never reuses another service's or another bank's form."""
    service = services.get(service_id)
    if service is None:
        raise GateError("unknown_service", f"Unknown service {service_id!r}.", 404)
    form_id = service.get("form_id")
    if not form_id:
        raise GateError("no_form_for_service", f"{service['label']} has no form; use counter guidance.", 422)
    if bank_id != "demo":
        raise GateError("no_bank_template", f"No form template is configured for bank {bank_id!r}.", 422)
    if form_id not in _known_form_ids():
        raise GateError("template_missing", f"Form template {form_id!r} is not configured.", 500)
    return form_id


def missing_mandatory_fields(form_id, fields):
    return [n for n in MANDATORY_FIELDS.get(form_id, ()) if not str((fields or {}).get(n, "")).strip()]


def validate_mandatory(form_id, fields):
    missing = missing_mandatory_fields(form_id, fields)
    if missing:
        raise GateError("missing_fields", "Required form fields are missing: " + ", ".join(missing) + ".", 422)


def signature_guidance(service_id, services):
    required = bool(services.get(service_id, {}).get("signature_required"))
    return {"signature_required": required, "thumb_impression_allowed": required,
            "message": "Sign (or give a thumb impression) in the highlighted area of the printed form." if required else "",
            "signature_recorded": False}
