"""Voice orchestration (spec 3.3, 3.4): Prisma STT -> (intent elsewhere) -> Timbre TTS. Gnani is primary when VOICE_PROVIDER=gnani;
if it cannot answer (not configured, unsupported language, outage) the existing ``voice_fallback`` chain is used and the
result says so: ``engine`` is ``gnani`` only when Gnani really transcribed, else ``fallback:<engine>``."""
from __future__ import annotations

import voice_fallback
from app.config.settings import get_settings
from app.integrations.voice.base import EMPTY, OK
from app.integrations.voice.gnani_stt import GnaniSTT
from app.integrations.voice.gnani_tts import GnaniTTS
from app.integrations.voice.language_manager import support_matrix
from app.services.audit_logger import get_audit_logger


def primary_provider():
    s = get_settings()
    return "gnani" if s.voice_provider == "gnani" and s.gnani_configured else "gemini"


def _record(session, provider):
    if session is not None:
        session.voice_providers.append(provider)
        del session.voice_providers[:-20]


def transcribe(wav, language="", request_id="", session=None):
    s = get_settings()
    errors, gnani_summary = [], None
    if s.voice_provider == "gnani":
        result = GnaniSTT(s).transcribe(wav, language, request_id)
        gnani_summary = result.public()
        if result.status in (OK, EMPTY):
            _record(session, "gnani")
            return {"text": result.text, "engine": "gnani", "provider": "gnani", "errors": [], "gnani": gnani_summary}
        errors.append(f"gnani: {result.status}")
    fb = voice_fallback.transcribe(wav, language)
    provider = f"fallback:{fb['engine']}" if fb.get("engine") else None
    _record(session, provider or "none")
    get_audit_logger().log("voice.stt", getattr(session, "correlation_id", ""), provider=provider or "none", gnani_status=(gnani_summary or {}).get("status", "not_used"))
    return {"text": fb.get("text", ""), "engine": provider, "provider": provider, "errors": errors + list(fb.get("errors", [])), "gnani": gnani_summary}


def speak(text, language="", session=None):
    result = GnaniTTS(get_settings()).synthesize(text, language)
    _record(session, "gnani-tts" if result.ok else "tts-unavailable")
    return result


def status():
    s = get_settings()
    base = voice_fallback.status()
    base["primary"] = primary_provider()
    base["server_stt_available"] = bool(base.get("server_stt_available") or s.gnani_configured)
    base["gnani"] = {"configured": s.gnani_configured, "stt_model": s.gnani_stt_model, "tts_model": s.gnani_tts_model, "languages": support_matrix(s)}
    base["problems"] = s.problems()
    return base
