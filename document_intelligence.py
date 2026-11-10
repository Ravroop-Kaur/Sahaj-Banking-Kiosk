"""Document intelligence (spec section 5): quality check -> classification -> OCR text -> field mapping -> confidence -> review.
The passbook account-number parsing formerly inline in ``main.py`` lives here with the same behaviour. OCR engines stay in
``passbook_ocr.py`` / ``main.py``. OCR output is a suggestion: the customer confirms it, and uncertain output never starts a
transaction. Recovery ends in staff assistance, not manual credential entry."""
from __future__ import annotations

import json
import re
from io import BytesIO
from pathlib import Path

from app.config.settings import get_settings

CONFIG_PATH = Path(__file__).resolve().parent.parent / "config" / "service_requirements.json"
_ACCOUNT_LABEL = re.compile(r"\b(?:account|a\s*/\s*c)\s*(?:no\.?|number|#|id)\b(.*?)(?=\b(?:customer\s*name|s\s*/\s*d\s*/\s*w\s*/\s*h|address|phone|branch|date|email)\b|$)", re.I)
_DIGIT_RUN = re.compile(r"(?<!\d)\d{8,18}(?!\d)")


def assess_image_quality(raw, settings=None):
    """Advisory only (size, edge-variance sharpness, contrast). Thresholds are starting points; calibrate on real captures."""
    s = settings or get_settings()
    try:
        from PIL import Image, ImageFilter, ImageStat
        image = Image.open(BytesIO(raw))
        width, height = image.size
        gray = image.convert("L")
        gray.thumbnail((1000, 1000))
        sharpness = ImageStat.Stat(gray.filter(ImageFilter.FIND_EDGES)).var[0]
        contrast = ImageStat.Stat(gray).stddev[0]
    except Exception:
        return {"checked": False, "issues": [], "retake_suggested": False}
    issues = []
    if min(width, height) < s.min_image_side_px:
        issues.append("low_resolution")
    if sharpness < s.min_image_sharpness:
        issues.append("blurry")
    if contrast < 25:
        issues.append("low_contrast")
    return {"checked": True, "width": width, "height": height, "sharpness": round(sharpness, 1), "contrast": round(contrast, 1),
            "issues": issues, "retake_suggested": bool(issues)}


def classify_document(text):
    flat = re.sub(r"\s+", " ", text or "").lower()
    types = json.loads(CONFIG_PATH.read_text(encoding="utf-8")).get("document_types", {})
    scores = {}
    for doc_type, spec in types.items():
        hits = sum(1 for kw in spec.get("keywords", []) if re.search(r"(?<![a-z])" + re.escape(kw) + r"(?![a-z])", flat))
        if hits:
            scores[doc_type] = hits
    if not scores:
        return {"document_type": "unknown", "confidence": 0.0, "scores": {}}
    best = max(scores, key=scores.get)
    total = sum(scores.values())
    confidence = round(scores[best] / total, 2) if scores[best] >= 2 else round(0.3 * scores[best] / total, 2)
    return {"document_type": best if scores[best] >= 2 else "unknown", "confidence": confidence, "scores": scores}


def check_expected_document(expected, classification):
    found = classification.get("document_type", "unknown")
    if found == expected:
        return {"status": "accepted", "message": ""}
    if found == "unknown":
        return {"status": "uncertain", "message": f"Could not tell whether this is the {expected.replace('_', ' ')}. Please show it again."}
    return {"status": "wrong_type", "message": f"This looks like a {found.replace('_', ' ')}, but a {expected.replace('_', ' ')} is needed."}


def missing_documents(required, provided):
    have = set(provided)
    return [d for d in required if d not in have]


def extract_account_number(text):
    flat = re.sub(r"\s+", " ", text or "").strip()
    match = _ACCOUNT_LABEL.search(flat)
    digits = list(dict.fromkeys(_DIGIT_RUN.findall(match.group(1)))) if match else []
    if not digits and match:
        joined = re.sub(r"\D", "", match.group(1))
        if 8 <= len(joined) <= 18:
            digits = [joined]
    if len(digits) > 1 and re.search(r"\bcif\s*(?:no\.?|number)\b", flat, re.I):
        return digits[-1]
    if digits:
        return digits[0]
    candidates = list(dict.fromkeys(_DIGIT_RUN.findall(flat)))
    return candidates[0] if len(candidates) == 1 else ""


def score_account_field(value, text, engine="", quality=None):
    if not value:
        return 0.0
    flat = re.sub(r"\s+", " ", text or "")
    score = 0.5
    if _ACCOUNT_LABEL.search(flat):
        score += 0.25
    if 8 <= len(value) <= 18:
        score += 0.1
    if len(set(_DIGIT_RUN.findall(flat))) > 1:
        score -= 0.2
    if (quality or {}).get("issues"):
        score -= 0.2
    return round(max(0.0, min(1.0, score)), 2)


def recovery_step(attempt, has_value):
    """re-position/re-capture -> enhance + retry OCR -> retry OCR -> voice-confirm uncertain value -> staff (stop safely)."""
    ladder = ["reposition_and_recapture", "enhance_and_retry_ocr", "retry_ocr"]
    if attempt < len(ladder):
        return {"step": ladder[attempt], "stop_safely": False}
    if attempt == len(ladder) and has_value:
        return {"step": "confirm_uncertain_field_by_voice", "stop_safely": False}
    return {"step": "staff_assistance", "stop_safely": True}


def build_passbook_result(text, engine, quality=None, settings=None, attempt=0):
    s = settings or get_settings()
    value = extract_account_number(text)
    score = score_account_field(value, text, engine, quality)
    classification = classify_document(text)
    result = {"field": {"value": value, "confidence": "review" if value else "uncertain", "score": score,
                        "meets_threshold": bool(value) and score >= s.ocr_min_field_confidence, "requires_confirmation": True},
              "document": {**classification, "expected": "passbook", **check_expected_document("passbook", classification)}}
    if not value or score < s.ocr_min_field_confidence:
        result["recovery"] = recovery_step(attempt, bool(value))
    return result
