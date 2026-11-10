"""Workflow engine: configuration-driven plans, gates and service detection (spec sections 4 and 13)."""
from app.services import consent_manager, workflow_engine as w
from app.services.errors import GateError
from app.services.session_manager import get_session_manager
from tests.helpers import ready_session


def test_every_utterance_maps_to_a_stable_service_or_asks_for_clarification():
    assert w.detect_service("I want to withdraw 5000 rupees")["service_id"] == "cash_withdrawal"
    assert w.detect_service("मुझे खाते में पैसे जमा करने हैं")["service_id"] == "cash_deposit"
    assert w.detect_service("I want to open a new account")["service_id"] == "account_opening"
    unclear = w.detect_service("withdraw and deposit")
    assert unclear["service_id"] is None and unclear["needs_clarification"] and unclear["question"].endswith("?")
    assert w.detect_service("hello")["needs_clarification"]


def test_a_basic_information_request_never_enters_a_payment_flow():
    for service in ("balance_enquiry", "mini_statement", "passbook_replacement"):
        assert "BANK_PROCESSING" not in w.plan_for(service) and "TRANSACTION_CONFIRMATION" not in w.plan_for(service)
    assert "BANK_PROCESSING" in w.plan_for("cash_withdrawal")


def test_account_opening_does_not_validate_an_existing_account():
    plan = w.plan_for("account_opening")
    assert "IDENTITY_VERIFICATION" in plan and "ACCOUNT_VALIDATION" not in plan


def test_states_stay_in_the_specified_order():
    order = {s: i for i, s in enumerate(w.STATES)}
    for service in w.services():
        idx = [order[s] for s in w.plan_for(service)]
        assert idx == sorted(idx)


def _step(session):
    try:
        return w.advance(session)
    except GateError as exc:
        return exc.code


def test_withdrawal_stops_at_each_missing_gate():
    session = get_session_manager().create("en")
    w.select_service(session, "cash_withdrawal")
    assert _step(session) == "DOCUMENT_REQUEST" and _step(session) == "consent_required"
    consent_manager.record_consent(session, "data_collection", True)
    assert _step(session) == "DOCUMENT_SCANNING" and _step(session) == "DATA_EXTRACTION" and _step(session) == "no_extracted_data"
    session.extracted_fields["account_id"] = {"value": "990000000001", "confidence": 0.9, "confirmed": False}
    assert _step(session) == "CUSTOMER_CONFIRMATION" and _step(session) == "customer_confirmation_required"
    session.extracted_fields["account_id"]["confirmed"] = True
    assert _step(session) == "IDENTITY_VERIFICATION" and _step(session) == "identity_required"


def test_full_happy_path_reaches_the_form_and_counter_steps():
    from app.integrations.registry import get_bank_provider
    from app.services import authorization
    session = ready_session()
    w.select_service(session, "cash_withdrawal")
    session.extracted_fields["account_id"] = {"value": "990000000001", "confidence": 0.9, "confirmed": True}
    authorization.check_eligibility(session, get_bank_provider(), "cash_withdrawal", "200")
    authorization.confirm_transaction(session, True, "200")
    session.transaction = {"transaction_id": "SIM-TEST"}
    seen = []
    while len(seen) < 20:
        seen.append(_step(session))
        if seen[-1] in ("SESSION_COMPLETE", "session_complete"):
            break
    assert seen[-1] == "SESSION_COMPLETE" and "BANK_PROCESSING" in seen and "COUNTER_GUIDANCE" in seen


def test_stop_ends_the_flow_safely():
    session = get_session_manager().create("en")
    w.select_service(session, "cash_deposit")
    w.stop(session, "required value could not be read")
    assert session.state == "SESSION_COMPLETE" and _step(session) == "session_complete"


def test_counters_and_templates_are_configuration_not_code():
    from app.services import form_generator as f
    g = f.counter_guidance("cash_withdrawal", w.services())
    assert g["counter"] == 1 and g["signature_required"] is True
    assert f.counter_guidance("account_opening", w.services())["counter"] == 2
    assert f.template_for("cash_withdrawal", w.services()) == "withdrawal"
    for bad, code in (("balance_enquiry", "no_form_for_service"), ("nope", "unknown_service")):
        try:
            f.template_for(bad, w.services())
        except GateError as exc:
            assert exc.code == code
    try:
        f.template_for("cash_withdrawal", w.services(), bank_id="other_bank")
    except GateError as exc:
        assert exc.code == "no_bank_template"
    assert f.missing_mandatory_fields("withdrawal", {"name": "A"}) == ["account_id", "phone", "amount"]
    assert f.DRAFT_LABEL["submitted"] is False and f.signature_guidance("cash_withdrawal", w.services())["signature_recorded"] is False


def test_pdf_counter_page_uses_the_configured_number():
    import main
    assert b"COUNTER 2" in main._counter_page_stream("account_opening") and b"COUNTER 1" in main._counter_page_stream("cash_withdrawal")
