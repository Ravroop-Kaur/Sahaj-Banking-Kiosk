"""Single place for Gemini model names so main.py, voice_fallback.py and passbook_ocr.py never drift apart."""
from __future__ import annotations

import os

DEFAULT_FLASH = "gemini-3.6-flash"
OCR_FALLBACKS = ["gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-3.8-flash"]


def _env(name: str) -> str:
    return os.getenv(name, "").strip()


def ocr_models() -> list[str]:
    """GEMINI_OCR_MODEL first (if set), then the shared fallback chain, without duplicates."""
    out: list[str] = []
    for name in [_env("GEMINI_OCR_MODEL"), *OCR_FALLBACKS]:
        if name and name not in out:
            out.append(name)
    return out


def intent_model() -> str:
    return _env("GEMINI_INTENT_MODEL") or DEFAULT_FLASH


def stt_model() -> str:
    return _env("GEMINI_STT_MODEL") or intent_model()
