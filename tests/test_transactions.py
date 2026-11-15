"""Spec section 17 - Transactions and privacy/session handling."""
import json

from app.config.settings import load_settings
from app.integrations import registry
from app.integrations.common import VerifiedIdentity
from app.integrations.payments.demo_payments import DemoPaymentProvider
from app.services import audit_logger, authorization
from app.services.session_manager import SessionManager, get_session_manager
from tests.helpers import env, ready_session


def _req(key="k1", amount="500", account="990000000001"):
    return {"idempotency_key": key, "account_reference": account, "amount": amount}


def test_amount_over_demo_balance_is_rejected():
    session = ready_session()
    result, readback = authorization.check_eligibility(session, registry.get_bank_provider(), "cash_withdrawal", "99999999")
    assert result.status == "insufficient_funds" and readback is None and session.pending_transaction is None


def test_demo_payment_is_labelled_simulated_and_moves_no_money():
    p = DemoPaymentProvider()
    r = p.initiate_withdrawal(_req())
    assert r.ok and r.simulated and r.data["transaction_id"].startswith("SIM-") and "No money has moved" in r.message
    assert registry.get_bank_provider().get_account_details("990000000001").data["balance"] == "1000.00"


def test_repeated_requests_do_not_create_duplicate_transactions():
    p = DemoPaymentProvider()
    a, b = p.initiate_withdrawal(_req()), p.initiate_withdrawal(_req())
    assert a.data["transaction_id"] == b.data["transaction_id"] and b.data["duplicate"] is True and len(p._transactions) == 1


def test_failed_provider_response_is_never_shown_as_success():
    p = DemoPaymentProvider()
    r = p.initiate_withdrawal(_req(amount="99999999"))
    assert not r.ok and r.status == "failed" and not p._transactions
    assert registry.get_payment_provider(load_settings({"PAYMENT_PROVIDER": "authorised_aeps"})).initiate_withdrawal(_req()).status == "not_configured"


def test_status_and_reversal_follow_the_provider():
    p = DemoPaymentProvider()
    tid = p.initiate_deposit(_req(key="d1")).data["transaction_id"]
    assert p.get_transaction_status(tid).data["state"] == "simulated_completed"
    assert p.handle_reversal(tid).data["state"] == "simulated_reversed" and p.get_transaction_status(tid).data["state"] == "simulated_reversed"
    assert p.get_transaction_status("SIM-NOPE").status == "not_found"


def test_demo_providers_refuse_to_run_in_production_and_never_substitute_success():
    with env(APP_MODE="production"):
        assert registry.get_bank_provider().get_account_details("990000000001").status == "misconfigured"
        assert DemoPaymentProvider().initiate_withdrawal(_req()).status == "misconfigured"
        s = load_settings({"APP_MODE": "production"})
        assert any("demo providers" in x for x in s.problems())
        assert registry.get_bank_provider(load_settings({"APP_MODE": "production", "BANK_PROVIDER": "bank_cbs"})).get_account_details("1").status == "not_configured"


def test_session_data_is_cleared_and_not_shared():
    a = ready_session()
    b = get_session_manager().create("hi")
    assert a.session_id != b.session_id and b.identity is None and b.consents == {}
    assert get_session_manager().clear(a.session_id) and get_session_manager().get(a.session_id) is None
    assert a.identity is None and a.consents == {} and a.account_reference == ""


def test_idle_sessions_expire_and_are_wiped():
    t = [0.0]
    manager = SessionManager(clock=lambda: t[0])
    s = manager.create("en")
    s.identity = VerifiedIdentity("X", "m", "demo")
    t[0] = 10_000
    assert manager.get(s.session_id) is None and s.identity is None


def test_logs_do_not_contain_credentials_or_unmasked_identifiers():
    log = audit_logger.get_audit_logger()
    log.clear()
    log.log("t", "c1", api_key="SECRET", account_number="990000000001", note="call 9876543210", otp="123456", mapping="ok", amount="500")
    dumped = json.dumps(log.recent("t"))
    assert "SECRET" not in dumped and "990000000001" not in dumped and "9876543210" not in dumped and "123456" not in dumped
    assert "0001" in dumped and '"mapping": "ok"' in dumped


def test_demo_records_are_labelled_fictional_or_simulated():
    import main
    assert "synthetic" in main.health()["pdf_template"] or main.health()["synthetic_database"] is True
    assert main.health()["bank_integration"] is False
