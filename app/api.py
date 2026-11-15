"""Proposed Sahaj application routes (spec section 14). These are NOT bank, UIDAI or NPCI endpoints.
Routes are thin: decisions live in ``app/services``, external systems behind ``app/integrations``. All state lives in the
session, so one customer's data is never visible to the next."""
from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

from app.config.settings import get_settings
from app.integrations import registry
from app.services import (authentication, authorization, consent_manager, document_intelligence, form_generator, voice_service, workflow_engine)
from app.services.audit_logger import get_audit_logger, mask_identifier
from app.services.errors import GateError
from app.services.session_manager import get_session_manager
from ratelimit import rate_limit

router = APIRouter()
DEMO_NOTICE = "Synthetic demo. All customers, documents, balances and transactions are fictional and simulated."
_HTTP_FOR_STATUS = {"not_found": 404, "access_denied": 403, "identity_required": 403, "account_inactive": 409, "insufficient_funds": 409,
                    "ineligible": 409, "invalid_request": 422, "not_configured": 501, "unavailable": 503, "misconfigured": 503, "failed": 502}


def _session(session_id):
    session = get_session_manager().get(session_id)
    if session is None:
        raise HTTPException(404, {"code": "session_not_found", "message": "Session not found or expired. Start a new session."})
    return session


def _gate(exc):
    return HTTPException(exc.status, exc.as_dict())


def _provider_failure(result):
    """A provider that did not succeed is reported with its real status; never shown as success."""
    return HTTPException(_HTTP_FOR_STATUS.get(result.status, 502), {"status": result.status, "message": result.message, "provider": result.provider, "simulated": result.simulated})


class StartRequest(BaseModel):
    language: str = ""


class ClearRequest(BaseModel):
    session_id: str = ""


class ConsentRequest(BaseModel):
    session_id: str
    purpose: str
    granted: bool


class DetectRequest(BaseModel):
    text: str = Field(max_length=1000)
    session_id: str = ""


class SpeakRequest(BaseModel):
    text: str = Field(max_length=1000)
    language: str = "en"
    session_id: str = ""


class IdentityRequest(BaseModel):
    session_id: str
    demo_customer_ref: str = ""


class AccountRequest(BaseModel):
    session_id: str
    account_id: str
    confirmed: bool = False


class EligibilityRequest(BaseModel):
    session_id: str
    transaction_type: str
    amount: str


class ConfirmRequest(BaseModel):
    session_id: str
    confirmed: bool
    amount: str


class InitiateRequest(BaseModel):
    session_id: str
    idempotency_key: str = ""


@router.post("/api/session/start")
def start_session(req: StartRequest):
    session = get_session_manager().create(req.language)
    return {"session_id": session.session_id, "correlation_id": session.correlation_id, "state": session.state, "mode": get_settings().app_mode, "notice": DEMO_NOTICE}


@router.post("/api/session/clear")
def clear_session(req: ClearRequest | None = None):
    """End only the requesting customer's session.

    An unauthenticated 'clear all kiosk sessions' endpoint would let any visitor
    erase other customers' in-progress work on a publicly hosted demo.
    """
    if req is None or not req.session_id:
        raise HTTPException(422, {"code": "session_required", "message": "Supply the session_id returned by /api/session/start."})
    manager = get_session_manager()
    if not manager.clear(req.session_id, "customer_done"):
        raise HTTPException(404, {"code": "session_not_found", "message": "Session not found or expired."})
    return {"status": "cleared", "message": "Session data and extracted details were cleared. Images are never stored by this kiosk."}


@router.get("/api/consent/{purpose}")
def consent_notice(purpose: str):
    s = get_settings()
    label = {"data_collection": "this kiosk", "identity_verification": s.identity_provider + " identity provider", "transaction": s.payment_provider + " payment provider"}.get(purpose, "this kiosk")
    try:
        return consent_manager.consent_notice(purpose, label)
    except GateError as exc:
        raise _gate(exc)


@router.post("/api/consent")
def give_consent(req: ConsentRequest):
    session = _session(req.session_id)
    try:
        entry = consent_manager.record_consent(session, req.purpose, req.granted, "see /api/consent/" + req.purpose)
    except GateError as exc:
        raise _gate(exc)
    return {"purpose": req.purpose, "granted": entry["granted"]}


@router.post("/api/voice/speak", dependencies=[Depends(rate_limit)])
async def voice_speak(req: SpeakRequest):
    """Timbre TTS. On any failure the page keeps its text on screen / uses browser voice."""
    session = get_session_manager().get(req.session_id) if req.session_id else None
    result = await run_in_threadpool(voice_service.speak, req.text, req.language, session)
    if result.ok:
        return Response(content=result.audio, media_type=result.content_type or "audio/wav", headers={"X-Voice-Provider": "gnani", "Cache-Control": "no-store"})
    code = 422 if result.status == "invalid_request" else 501 if result.status in ("not_configured", "unsupported_language") else 503
    raise HTTPException(code, result.public())


@router.post("/api/service/detect")
def detect_service(req: DetectRequest):
    result = workflow_engine.detect_service(req.text)
    if req.session_id and result["service_id"]:
        result["states"] = workflow_engine.select_service(_session(req.session_id), result["service_id"])
    return result


@router.get("/api/service/{service_id}/requirements")
def service_requirements(service_id: str):
    try:
        return workflow_engine.requirements_for(service_id)
    except GateError as exc:
        raise _gate(exc)


async def _read_image(file):
    if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(415, "Upload a JPG, PNG, or WebP image.")
    raw = await file.read()
    if not raw:
        raise HTTPException(400, "The uploaded image is empty.")
    if len(raw) > 8 * 1024 * 1024:
        raise HTTPException(413, "Image must be 8 MB or smaller.")
    return raw


async def _ocr(raw, filename):
    import main  # late import: main owns the OCR engine chain and imports this router
    try:
        return await run_in_threadpool(main.run_ocr_engines, raw, filename or ".jpg")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(503, {"code": "ocr_unavailable", "message": "Could not read the document. Re-position it and try again, or ask staff for help."})


@router.post("/api/documents/classify", dependencies=[Depends(rate_limit)])
async def classify_document(file: UploadFile = File(...), expected: str = Form("")):
    raw = await _read_image(file)
    text, engine, _n = await _ocr(raw, file.filename)
    classification = document_intelligence.classify_document(text)
    out = {"engine": engine, "classification": classification, "image_quality": document_intelligence.assess_image_quality(raw)}
    if expected:
        out["check"] = document_intelligence.check_expected_document(expected, classification)
    return out


@router.post("/api/documents/extract", dependencies=[Depends(rate_limit)])
async def extract_document(file: UploadFile = File(...), session_id: str = Form(""), attempt: int = Form(0)):
    """Extract only what the workflow needs (today: passbook account number) with confidence. A suggestion the customer must confirm."""
    raw = await _read_image(file)
    session = _session(session_id) if session_id else None
    if session is not None:
        try:
            consent_manager.require_consent(session, "data_collection")
        except GateError as exc:
            raise _gate(exc)
    text, engine, _n = await _ocr(raw, file.filename)
    quality = document_intelligence.assess_image_quality(raw)
    result = document_intelligence.build_passbook_result(text, engine, quality, attempt=attempt)
    if result["document"]["status"] == "wrong_type":
        return {"status": "wrong_document", "message": result["document"]["message"], "document": result["document"], "image_quality": quality}
    if session is not None and result["field"]["value"]:
        session.extracted_fields["account_id"] = {"value": result["field"]["value"], "confidence": result["field"]["score"], "confirmed": False}
    field = dict(result["field"])
    if field["value"]:
        field["value_masked"] = mask_identifier(field["value"])  # full value is echoed only so the customer can confirm it
    return {"engine": engine, "field": {"name": "account_id", **field}, "document": result["document"], "image_quality": quality,
            "recovery": result.get("recovery"), "notice": "Please confirm the account number. Uncertain readings are never used for a transaction."}


@router.post("/api/documents/confirm")
def confirm_document_field(req: AccountRequest):
    session = _session(req.session_id)
    entry = session.extracted_fields.get("account_id")
    if not entry or entry["value"] != req.account_id:
        raise HTTPException(409, {"code": "no_matching_extraction", "message": "That value was not extracted in this session."})
    entry["confirmed"] = bool(req.confirmed)
    return {"status": "confirmed" if req.confirmed else "rejected"}


@router.post("/api/identity/verify")
def identity_verify(req: IdentityRequest):
    session = _session(req.session_id)
    provider = registry.get_identity_provider()
    try:
        result = authentication.verify_identity(session, provider, {"demo_customer_ref": req.demo_customer_ref})
    except GateError as exc:
        raise _gate(exc)
    if not result.ok:
        raise _provider_failure(result)
    return {"status": result.status, "message": result.message, "provider": result.provider, "simulated": result.simulated, "identity": session.identity.public()}


@router.post("/api/account/validate")
def account_validate(req: AccountRequest):
    session = _session(req.session_id)
    try:
        result = authorization.validate_account_access(session, registry.get_bank_provider(), req.account_id, req.confirmed)
    except GateError as exc:
        raise _gate(exc)
    if not result.ok:
        raise _provider_failure(result)
    return {"status": result.status, "provider": result.provider, "simulated": result.simulated, "account": mask_identifier(req.account_id)}


@router.post("/api/transaction/eligibility")
def transaction_eligibility(req: EligibilityRequest):
    session = _session(req.session_id)
    try:
        result, readback = authorization.check_eligibility(session, registry.get_bank_provider(), req.transaction_type, req.amount)
    except GateError as exc:
        raise _gate(exc)
    if not result.ok:
        raise _provider_failure(result)
    return {"status": result.status, "simulated": result.simulated, "readback": readback, "message": "Read this back to the customer and obtain explicit confirmation."}


@router.post("/api/transaction/confirm")
def transaction_confirm(req: ConfirmRequest):
    session = _session(req.session_id)
    try:
        authorization.confirm_transaction(session, req.confirmed, req.amount)
    except GateError as exc:
        raise _gate(exc)
    return {"status": "confirmed"}


@router.post("/api/transaction/initiate")
def transaction_initiate(req: InitiateRequest):
    """Success is reported only when the payment provider says so."""
    session = _session(req.session_id)
    bank, payments = registry.get_bank_provider(), registry.get_payment_provider()
    try:
        authorized = authorization.authorize_transaction(session, bank)
    except GateError as exc:
        raise _gate(exc)
    key = req.idempotency_key.strip() or f"{session.session_id}:{authorized['type']}:{authorized['amount']}"
    request = {"session_id": session.session_id, "account_reference": authorized["account_reference"], "amount": authorized["amount"], "idempotency_key": key}
    result = payments.initiate_deposit(request) if authorized["type"] in ("cash_deposit", "deposit") else payments.initiate_withdrawal(request)
    get_audit_logger().log("transaction.initiate", session.correlation_id, provider=payments.name, status=result.status, simulated=result.simulated)
    if not result.ok:
        raise _provider_failure(result)
    session.transaction = {"transaction_id": result.data.get("transaction_id"), "state": result.data.get("state"), "simulated": result.simulated}
    return {"status": result.status, "simulated": result.simulated, "provider": result.provider, "message": result.message,
            "transaction_id": result.data.get("transaction_id"), "state": result.data.get("state"), "duplicate": bool(result.data.get("duplicate"))}


@router.get("/api/transaction/{transaction_id}/status")
def transaction_status(transaction_id: str, session_id: str = ""):
    session = _session(session_id)
    if not session.transaction or session.transaction.get("transaction_id") != transaction_id:
        raise HTTPException(404, {"code": "transaction_not_found", "message": "No transaction with that id belongs to this session."})
    result = registry.get_payment_provider().get_transaction_status(transaction_id)
    if not result.ok:
        raise _provider_failure(result)
    return {"status": result.status, "simulated": result.simulated, "transaction_id": transaction_id, "state": result.data.get("state")}


@router.get("/api/counters/{service_id}")
def counter_guidance(service_id: str, branch: str = ""):
    """Counter guidance for a service id or form id (e.g. ``cash_withdrawal`` or ``deposit``)."""
    sid = form_generator.service_for_form(service_id)
    info = form_generator.counter_guidance(sid, workflow_engine.services(), branch or None)
    if info is None:
        raise HTTPException(404, {"code": "no_counter", "message": f"No counter is configured for {service_id!r}."})
    info["signature"] = form_generator.signature_guidance(sid, workflow_engine.services())
    return info
