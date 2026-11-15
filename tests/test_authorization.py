"""Spec section 17 - Account access and transaction authorisation are separate decisions."""
from app.integrations.banking.bank_cbs import BankCBSProvider
from app.integrations.banking.demo_bank import DemoBankProvider
from app.integrations.registry import get_bank_provider, reset_providers
from app.services import authorization
from app.services.errors import GateError
from tests.helpers import ready_session, temp_db


def _code(fn, *a):
    try:
        fn(*a)
    except GateError as exc:
        return exc.code
    return None


def test_identity_success_alone_does_not_grant_access_to_an_unrelated_account():
    session = ready_session(validate_account=False)
    r = authorization.validate_account_access(session, get_bank_provider(), "990000000002", True)
    assert r.status == "access_denied" and session.account_access is False and session.account_reference == ""


def test_account_validation_is_performed_by_the_bank_provider():
    session = ready_session(validate_account=False)

    class Recorder(DemoBankProvider):
        calls = []

        def lookup_account(self, identity, ref):
            self.calls.append("lookup")
            return super().lookup_account(identity, ref)

        def check_account_status(self, ref):
            self.calls.append("status")
            return super().check_account_status(ref)

    bank = Recorder()
    assert authorization.validate_account_access(session, bank, "990000000001", True).ok and bank.calls == ["lookup", "status"]


def test_ocr_value_must_be_confirmed_by_the_customer_before_use():
    session = ready_session(validate_account=False)
    assert _code(authorization.validate_account_access, session, get_bank_provider(), "990000000001", False) == "account_not_confirmed"


def test_inactive_or_blocked_accounts_are_handled_safely():
    with temp_db({"990000000001": "BLOCKED"}) as path:
        session = ready_session(validate_account=False)
        r = authorization.validate_account_access(session, DemoBankProvider(path), "990000000001", True)
        assert r.status == "account_inactive" and session.account_access is False


def test_unavailable_provider_fails_safe_and_never_falls_back_to_demo_data():
    session = ready_session(validate_account=False)
    r = authorization.validate_account_access(session, BankCBSProvider(), "990000000001", True)
    assert r.status == "not_configured" and session.account_access is False and r.simulated is False
    reset_providers()


def test_transaction_cannot_start_without_the_customers_explicit_confirmation():
    session = ready_session()
    bank = get_bank_provider()
    result, readback = authorization.check_eligibility(session, bank, "cash_withdrawal", "500")
    assert result.ok and "500" in readback["text"]
    assert _code(authorization.authorize_transaction, session, bank) == "confirmation_required"
    assert _code(authorization.confirm_transaction, session, True, "5000") == "amount_mismatch"
    assert _code(authorization.confirm_transaction, session, False, "500") == "not_confirmed"
    authorization.confirm_transaction(session, True, "500")
    assert authorization.authorize_transaction(session, bank)["amount"] == "500"


def test_transaction_consent_is_required_too():
    session = ready_session(consents=("data_collection", "identity_verification"))
    bank = get_bank_provider()
    authorization.check_eligibility(session, bank, "cash_withdrawal", "100")
    authorization.confirm_transaction(session, True, "100")
    assert _code(authorization.authorize_transaction, session, bank) == "consent_required"


def test_protected_steps_need_account_access_first():
    session = ready_session(validate_account=False)
    assert _code(authorization.check_eligibility, session, get_bank_provider(), "cash_withdrawal", "100") == "account_access_required"
