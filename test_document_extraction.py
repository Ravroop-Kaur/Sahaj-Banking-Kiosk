"""Spec section 17 - Documents."""
import io

from PIL import Image, ImageFilter

from app.services import document_intelligence as di
from app.services.workflow_engine import requirements_for
from tests.helpers import ROOT

PASSBOOK_TEXT = "State Bank DEMO Passbook Account Number: 990000000001 Customer Name: Nisha CIF No 5551234 Branch Jammu"


def _png(image):
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def test_correct_passbook_is_detected_and_account_field_extracted():
    r = di.build_passbook_result(PASSBOOK_TEXT, "test")
    assert r["document"]["status"] == "accepted" and r["field"]["value"] == "990000000001"
    assert r["field"]["requires_confirmation"] is True and r["field"]["meets_threshold"] is True


def test_cif_number_is_not_mistaken_for_the_account_number():
    assert di.extract_account_number("CIF Number 123456789012 Account No 990000000007 Customer Name X") == "990000000007"


def test_wrong_document_type_is_rejected_or_redirected():
    aadhaar = di.classify_document("AADHAAR synthetic demo identity card permanent")
    check = di.check_expected_document("passbook", aadhaar)
    assert aadhaar["document_type"] == "identity_document" and check["status"] == "wrong_type"
    assert di.check_expected_document("passbook", di.classify_document("blah blah"))["status"] == "uncertain"


def test_blurry_image_triggers_recapture():
    sharp = Image.open(ROOT / "static" / "synthetic_documents" / "passbooks" / "passbook-001.png").convert("RGB")
    assert "blurry" not in di.assess_image_quality(_png(sharp))["issues"]
    blurred = di.assess_image_quality(_png(sharp.filter(ImageFilter.GaussianBlur(14))))
    assert "blurry" in blurred["issues"] and blurred["retake_suggested"] is True


def test_low_confidence_fields_require_confirmation_and_follow_the_recovery_ladder():
    r = di.build_passbook_result("Account Number 990000000001 or 990000000002 CIF", "test", {"issues": ["blurry"]})
    assert r["field"]["meets_threshold"] is False and r["field"]["requires_confirmation"] is True
    assert r["recovery"]["step"] == "reposition_and_recapture"
    assert [di.recovery_step(i, True)["step"] for i in range(4)] == ["reposition_and_recapture", "enhance_and_retry_ocr", "retry_ocr", "confirm_uncertain_field_by_voice"]
    assert di.recovery_step(5, True) == {"step": "staff_assistance", "stop_safely": True}


def test_nothing_read_stops_safely_with_staff_assistance():
    r = di.build_passbook_result("completely unreadable", "test")
    assert r["field"]["value"] == "" and r["field"]["confidence"] == "uncertain" and di.recovery_step(4, False)["stop_safely"] is True


def test_missing_documents_are_identified():
    needs = requirements_for("account_opening")["required_documents"]
    assert di.missing_documents(needs, ["identity_document"]) == ["address_document", "photograph"]
