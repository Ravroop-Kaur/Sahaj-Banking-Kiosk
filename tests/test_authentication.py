"""Spec section 17 - Identity: failed verification blocks protected operations."""
from app.integrations.registry import get_bank_provider, get_identity_provider, reset_providers
from app.services import authentication, authorization, consent_manager
from app.services.errors import GateError
from app.services.session_manager import get_session_manager
from tests.helpers import ready_session


def _raises(code, fn, *a):
    try:
        fn(*a)
    except GateError as exc:
        assert exc.code == code, (exc.code, code)
        return
    raise AssertionError(f"expected GateError {code}")


def test_identity_check_needs_consent_first():
    session = get_session_manager().create("en")
    _raises("consent_required", authentication.verify_identity, session, get_identity_provider(), {"demo_customer_ref": "SYN-CUST-001"})


def test_failed_identity_blocks_account_access_and_clears_earlier_state():
    session = ready_session()
    assert authentication.is_identity_verified(session) and session.account_access
    result = authentication.verify_identity(session, get_identity_provider(), {"demo_customer_ref": "NOT-A-CUSTOMER"})
    assert result.status == "failed" and not authentication.is_identity_verified(session)
    assert session.identity is None and session.account_access is False
    _raises("identity_required", authorization.validate_account_access, session, get_bank_provider(), "990000000001", True)


def test_identity_result_is_simulated_and_holds_no_biometric_or_aadhaar_data():
    session = ready_session(validate_account=False)
    assert session.identity.public()["simulated"] is True
    assert set(vars(session.identity)) == {"subject_ref", "method", "provider", "simulated", "verified_at"}


def test_unconfigured_uidai_route_never_succeeds():
    from app.integrations.identity.uidai_provider import UidaiIdentityProvider
    session = get_session_manager().create("en")
    consent_manager.record_consent(session, "identity_verification", True)
    assert authentication.verify_identity(session, UidaiIdentityProvider(), {}).status == "not_configured"
    assert not authentication.is_identity_verified(session)
    reset_providers()
