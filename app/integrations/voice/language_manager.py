"""Maps the kiosk's UI languages to what Gnani supports (spec 1, 3, 17).

UI: Hindi, English, Punjabi, Kannada, Tamil, Bengali. All are covered by Gnani Prisma (speech-to-text) and Timbre (voice).
A language Gnani cannot serve reports "not supported" and the kiosk uses its fallback. Re-verify against current docs/account.
"""
from __future__ import annotations

from app.config.settings import get_settings

GNANI_LOCALES = {"hi": "hi-IN", "en": "en-IN", "pa": "pa-IN", "kn": "kn-IN", "ta": "ta-IN", "bn": "bn-IN"}
UI_LANGUAGES = ("hi", "en", "pa", "kn", "ta", "bn")
_V3_HINTS = {"hi": "hi-IN,en-IN", "en": "en-IN,hi-IN", "pa": "pa-IN,en-IN", "kn": "kn-IN,en-IN", "ta": "ta-IN,en-IN", "bn": "bn-IN,en-IN"}  # Hindi/English code-switching is common


def normalize_ui_language(value):
    code = (value or "").strip().lower().replace("_", "-")
    return code.split("-")[0] if code else ""


def locale_for(ui_language):
    return GNANI_LOCALES.get(normalize_ui_language(ui_language))


def ui_language_from_locale(locale):
    return normalize_ui_language(locale)


def stt_language_code(ui_language, model):
    """Prisma ``language_code`` or None if unsupported. v3.0: hint list / ``indic-auto``; v2.5: one language."""
    code = normalize_ui_language(ui_language)
    v3 = (model or "").strip() == "prisma-v3.0"
    if not code:
        return "indic-auto" if v3 else "hi-IN"
    if code not in GNANI_LOCALES:
        return None
    return _V3_HINTS[code] if v3 else GNANI_LOCALES[code]


def tts_voice_for(ui_language, settings=None):
    """(locale, voice) only when a voice is configured for that language; one voice is never assumed to fit all."""
    s = settings or get_settings()
    locale = locale_for(ui_language)
    if not locale:
        return None
    voice = s.gnani_tts_voices.get(locale)
    return (locale, voice) if voice else None


def support_matrix(settings=None):
    s = settings or get_settings()
    matrix = {}
    for lang in UI_LANGUAGES:
        locale, tts = locale_for(lang), tts_voice_for(lang, s)
        if not locale:
            note = "Not covered by Gnani Prisma/Timbre; the kiosk uses its fallback voice service."
        elif not tts:
            note = "No Timbre voice is configured for this language; set GNANI_TTS_VOICE_<LANG>_<REGION> (e.g. GNANI_TTS_VOICE_EN_IN) after checking the voice catalogue."
        else:
            note = ""
        matrix[lang] = {"gnani_locale": locale, "stt": bool(locale) and s.gnani_configured, "tts": bool(tts) and s.gnani_configured,
                        "tts_voice": tts[1] if tts else None, "note": note}
    return matrix
