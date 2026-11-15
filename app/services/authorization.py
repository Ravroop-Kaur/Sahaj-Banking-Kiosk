"""Decisions 2 and 3 of 3: ACCOUNT ACCESS and TRANSACTION AUTHORISATION (spec section 6). Never moves money."""
from __future__ import annotations

from decimal import Decimal, InvalidOperation

from app.services.audit_logger import get_audit_logger, mask_identifier
from app.services.authentication import is_identity_verified
from app.services.consent_manager import require_consent
from app.services.errors import GateError


def validate_account_access(session, bank, account_reference, customer_confirmed):
    if not is_identity_verified(session):
        raise GateError("identity_required", "Identity must be verified before account access is checked.", 403)
    if not customer_confirmed:  # uncertain OCR must be confirmed by the customer before use
        raise GateError("account_not_confirmed", "The customer must confirm the account number before it is used.", 409)
    result = bank.lookup_account(session.identity, account_reference)
    if result.ok:
        status = bank.check_account_status(account_reference)
        if not status.ok:
            result = status
    session.account_access = result.ok
    session.account_confirmed = bool(customer_confirmed) and result.ok
    session.account_reference = account_reference if result.ok else ""
    get_audit_logger().log("account.validate", session.correlation_id, provider=bank.name, status=result.status,
                           account=mask_identifier(account_reference), simulated=result.simulated)
    return result


def _amount(value):
    try:
        amount = Decimal(str(value))
    except (InvalidOperation, ValueError):
        raise GateError("invalid_amount", "Amount must be a positive number.", 422)
    if not amount.is_finite() or amount <= 0:
        raise GateError("invalid_amount", "Amount must be a positive number.", 422)
    return amount


def _require_access(session):
    if not is_identity_verified(session):
        raise GateError("identity_required", "Identity must be verified first.", 403)
    if not session.account_access or not session.account_confirmed or not session.account_reference:
        raise GateError("account_access_required", "Account access has not been validated for this session.", 403)


def check_eligibility(session, bank, transaction_type, amount):
    _require_access(session)
    value = _amount(amount)
    result = bank.check_transaction_eligibility(session.account_reference, transaction_type, str(value))
    session.transaction_confirmed = False
    if not result.ok:
        session.pending_transaction = None
        get_audit_logger().log("transaction.eligibility", session.correlation_id, provider=bank.name, status=result.status)
        return result, None
    readback = {"type": transaction_type, "amount": str(value), "text": f"{transaction_type.replace('_', ' ')} of rupees {value}. Please confirm."}
    session.pending_transaction = readback
    get_audit_logger().log("transaction.eligibility", session.correlation_id, provider=bank.name, status=result.status, type=transaction_type, amount=str(value))
    return result, readback


def confirm_transaction(session, confirmed, amount):
    pending = session.pending_transaction
    if not pending:
        raise GateError("nothing_to_confirm", "Check eligibility and read the amount back before asking for confirmation.", 409)
    if not confirmed:
        session.transaction_confirmed = False
        raise GateError("not_confirmed", "The customer has not confirmed the transaction.", 409)
    if _amount(amount) != Decimal(pending["amount"]):
        session.transaction_confirmed = False
        raise GateError("amount_mismatch", "The confirmed amount differs from the amount that was read back.", 409)
    session.transaction_confirmed = True
    get_audit_logger().log("transaction.confirmed", session.correlation_id, type=pending["type"], amount=pending["amount"])


def authorize_transaction(session, bank):
    _require_access(session)
    require_consent(session, "transaction")
    pending = session.pending_transaction
    if not pending or not session.transaction_confirmed:
        raise GateError("confirmation_required", "The customer must explicitly confirm the amount before the transaction starts.", 409)
    result = bank.check_transaction_eligibility(session.account_reference, pending["type"], pending["amount"])  # balance/status can change
    if not result.ok:
        raise GateError(f"bank_{result.status}", result.message or "The bank check did not pass.", 503 if result.status in ("unavailable", "not_configured") else 409)
    return {"type": pending["type"], "amount": pending["amount"], "account_reference": session.account_reference}
