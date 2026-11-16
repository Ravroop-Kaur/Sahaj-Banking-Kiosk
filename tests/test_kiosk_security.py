from io import BytesIO
import struct
import zlib

import pytest
from fastapi.testclient import TestClient
from PIL import Image
from starlette.websockets import WebSocketDisconnect

import main
import passbook_ocr
from app.integrations.payments.demo_payments import DemoPaymentProvider
from app.services import authentication, consent_manager
from app.integrations.registry import get_identity_provider
from tests.helpers import ready_session


@pytest.fixture
def depositor():
    session = ready_session()
    profile = dict(name="Demo customer", phone="0000000000", branch="Demo branch")
    session.extracted_fields.update(matched_document=session.account_reference, kiosk_profile=profile)
    return session, {"account": session.account_reference, **profile, "amount": "50"}


@pytest.mark.parametrize("route", ["sample-preview", "sample-pdf"])
def test_form_authorization_checks_the_rendered_fields(depositor, route):
    session, fields = depositor
    client = TestClient(main.app)
    headers = {"X-Kiosk-Session": session.session_id}
    url = "/api/forms/" + route
    payload = dict(form_id="deposit", confirmed=True, account_id=session.account_reference)
    for changes, status in [({"account":"990000000002"},403), ({"name":"Different"},422),
                            ({"amount":"0"},422), ({"amount":""},422)]:
        response = client.post(url, json={**payload,"fields":{**fields,**changes}}, headers=headers)
        assert response.status_code == status
    assert client.post(url, json=[], headers=headers).status_code == 422
    assert client.post(url, content=b'{', headers=headers).status_code == 422
    response = client.post(url, json={**payload,"fields":fields}, headers=headers)
    assert response.content.startswith(b"%PDF") and response.headers["cache-control"] == "no-store"


def test_cross_origin_browser_and_chunked_oversize():
    client = TestClient(main.app)
    foreign = {"Origin":"https://unrelated.example"}
    assert client.post("/api/session/start", headers=foreign, json={}).status_code == 403
    with pytest.raises(WebSocketDisconnect) as exc:
        with client.websocket_connect("/api/voice/live",headers=foreign):
            pass
    assert exc.value.code == 1008
    assert client.post("/api/session/start", headers={"Origin":"http://testserver"}, json={}).status_code == 200
    assert client.post("/api/intent", content=iter([b"x"*40000,b"x"*40000])).status_code == 413


def test_retries_belong_to_one_session_and_one_operation():
    payments = DemoPaymentProvider()
    base = dict(account_reference="990000000001", amount="5", idempotency_key="user-retry",session_id="A")
    first = payments.initiate_deposit(base)
    assert first.ok and payments.initiate_deposit(base).data["duplicate"]
    assert not payments.initiate_withdrawal(base).ok
    assert not payments.initiate_deposit(dict(base, amount="9")).ok
    other = payments.initiate_deposit(dict(base,session_id="B"))
    assert other.ok and other.data["transaction_id"] != first.data["transaction_id"]


def test_new_identity_and_revoked_consent_drop_old_access(depositor):
    session, _ = depositor
    result = authentication.verify_identity(session,get_identity_provider(),{"demo_customer_ref":"SYN-CUST-002"})
    assert result.ok and not session.account_access and not session.extracted_fields
    session = ready_session()
    consent_manager.record_consent(session,"data_collection",False)
    assert not session.identity and not session.account_access


def test_oversized_image_is_rejected_before_decoding(tmp_path):
    stream = BytesIO()
    Image.new("L",(1,1)).save(stream,format="PNG")
    # A valid IHDR advertises 64 MP; the payload contains only one pixel.
    # A decoder trying to load pixels first would report a truncated image.
    raw = bytearray(stream.getvalue())
    struct.pack_into(">II", raw, 16, 8000, 8000)
    struct.pack_into(">I", raw, 29, zlib.crc32(raw[12:29]))
    with pytest.raises(ValueError, match="dimensions"):
        passbook_ocr.prepare_image(raw)
    with pytest.raises(main.HTTPException) as exc:
        main._prepare_ocr_variants(raw,tmp_path)
    assert exc.value.status_code == 413
