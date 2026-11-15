"""Spec section 17 - Voice. Gnani is exercised through fake transports: no network, no real key."""
import json

from app.config.settings import load_settings
from app.integrations.voice import _http
from app.integrations.voice.gnani_stt import GnaniSTT, wav_duration_seconds
from app.integrations.voice.gnani_tts import GnaniTTS, normalize_for_english_tts
from app.integrations.voice.language_manager import stt_language_code, support_matrix
from app.services import voice_service
from tests.helpers import ROOT, env, wav

KEY = "TEST-SECRET-KEY-123"
S = load_settings({"GNANI_API_KEY": KEY, "GNANI_TTS_VOICE_EN_IN": "TestVoice"})


def _json(payload, status=200):
    return lambda url, body, headers, timeout: _http.HttpResponse(status, json.dumps(payload).encode())


def test_hindi_request_is_transcribed_and_not_interpreted():
    r = GnaniSTT(S, _json({"success": True, "transcript": " पैसे निकालने हैं ", "detected_language_code": "hi-IN"})).transcribe(wav(), "hi")
    assert r.ok and r.text == "पैसे निकालने हैं" and r.detected_language == "hi" and not hasattr(r, "intent")


def test_english_request_and_banking_context_are_sent():
    seen = {}

    def transport(url, body, headers, timeout):
        seen.update(body=body, headers=headers)
        return _http.HttpResponse(200, json.dumps({"success": True, "transcript": "withdraw five thousand rupees"}).encode())

    assert GnaniSTT(S, transport).transcribe(wav(), "en", request_id="req-1").ok
    assert b"prisma-v3.0" in seen["body"] and b"keyterms" in seen["body"]
    assert seen["headers"]["X-API-Key-ID"] == KEY and seen["headers"]["X-API-Request-ID"] == "req-1"


def test_urdu_is_gone_and_kannada_tamil_bengali_are_supported():
    for code, locale in (("kn", "kn-IN"), ("ta", "ta-IN"), ("bn", "bn-IN")):
        assert stt_language_code(code, "prisma-v3.0") is not None
        matrix = support_matrix(S)
        assert matrix[code]["stt"] is True and matrix[code]["tts"] is True
    assert "ur" not in support_matrix(S)
    assert GnaniSTT(S, _json({})).transcribe(wav(), "ur").status == "unsupported_language"


def test_silence_is_empty_not_an_error():
    assert GnaniSTT(S, _json({"success": True, "transcript": ""})).transcribe(wav(), "hi").status == "empty"


def test_clip_over_30_seconds_is_not_sent():
    calls = []
    r = GnaniSTT(S, lambda *a: calls.append(a)).transcribe(wav(31), "hi")
    assert r.status == "audio_too_long" and not calls and wav_duration_seconds(wav(31)) > 30


def test_outage_gives_clear_status_retries_and_never_leaks_the_key():
    attempts = []

    def down(url, body, headers, timeout):
        attempts.append(1)
        raise _http.NetworkError(f"connection refused {KEY}")

    r = GnaniSTT(S, down, sleep=lambda s: None).transcribe(wav(), "hi")
    assert r.status == "unavailable" and len(attempts) == 2
    assert KEY not in r.message and KEY not in json.dumps(r.public())


def test_bad_credentials_are_not_retried():
    attempts = []

    def deny(*a):
        attempts.append(1)
        return _http.HttpResponse(401, b"{}")

    assert GnaniSTT(S, deny, sleep=lambda s: None).transcribe(wav(), "hi").status == "not_configured" and len(attempts) == 1


def test_no_key_means_not_configured():
    assert GnaniSTT(load_settings({})).transcribe(wav(), "hi").status == "not_configured"
    assert GnaniTTS(load_settings({})).synthesize("hello", "hi").status == "not_configured"


def test_tts_uses_the_voice_for_that_language_only():
    seen = {}

    def transport(url, body, headers, timeout):
        seen.update(json.loads(body))
        return _http.HttpResponse(200, b"RIFF....WAVE")

    assert GnaniTTS(S, transport).synthesize("नमस्ते", "hi").ok and seen["voice"] == "Nalini" and seen["language"] == "hi-IN"
    assert GnaniTTS(S, transport).synthesize("hello", "en").ok and seen["voice"] == "TestVoice"
    assert GnaniTTS(S, transport).synthesize("ਸਤ ਸ੍ਰੀ ਅਕਾਲ", "pa").ok and seen["voice"] == "Mehuli" and seen["language"] == "pa-IN"
    assert GnaniTTS(S, transport).synthesize("ಸ್ವಾಗತ", "kn").ok and seen["language"] == "kn-IN" and seen["voice"] == "Saanvi"
    assert GnaniTTS(S, transport).synthesize("வணக்கம்", "ta").ok and seen["language"] == "ta-IN" and seen["voice"] == "Asmita"
    assert GnaniTTS(S, transport).synthesize("নমস্কার", "bn").ok and seen["language"] == "bn-IN" and seen["voice"] == "Kirra"
    assert GnaniTTS(S, transport).synthesize("آداب", "ur").status == "unsupported_language"


def test_tts_empty_audio_and_slow_service_do_not_block():
    assert GnaniTTS(S, lambda *a: _http.HttpResponse(200, b""), sleep=lambda s: None).synthesize("hi", "hi").status == "unavailable"

    def slow(*a):
        raise _http.NetworkError("timed out")

    assert GnaniTTS(S, slow, sleep=lambda s: None).synthesize("hi", "hi").status == "unavailable"


def test_amounts_and_account_numbers_are_spoken_as_words_in_english():
    spoken = normalize_for_english_tts("Withdraw ₹5,000 from account 990000000001?")
    assert "five thousand rupees" in spoken and "nine nine zero" in spoken and "₹" not in spoken
    assert "one lakh twenty five thousand" in normalize_for_english_tts("Rs. 1,25,000")


def _with_fallback(fn):
    import voice_fallback
    original = voice_fallback.transcribe
    voice_fallback.transcribe = lambda wav_bytes, language="": {"text": "withdraw", "engine": "gemini", "errors": []}
    try:
        fn()
    finally:
        voice_fallback.transcribe = original


def test_fallback_is_labelled_and_never_claims_gnani():
    def run():
        with env(VOICE_PROVIDER="gnani", GNANI_API_KEY=None):
            r = voice_service.transcribe(wav(), "hi")
        assert r["engine"] == "fallback:gemini" and r["gnani"]["status"] == "not_configured"
        with env(VOICE_PROVIDER="gnani", GNANI_API_KEY=KEY):  # a language Gnani cannot serve
            r = voice_service.transcribe(wav(), "ur")
        assert r["engine"] == "fallback:gemini" and r["gnani"]["status"] == "unsupported_language"
    _with_fallback(run)


def test_gemini_provider_setting_keeps_previous_behaviour():
    def run():
        with env(VOICE_PROVIDER="gemini"):
            r = voice_service.transcribe(wav(), "hi")
        assert r["gnani"] is None and r["engine"] == "fallback:gemini"
    _with_fallback(run)


def test_primary_provider_and_key_never_reach_the_browser():
    with env(VOICE_PROVIDER="gnani", GNANI_API_KEY=KEY):
        status = voice_service.status()
        assert status["primary"] == "gnani" and KEY not in json.dumps(status)
    assert KEY not in json.dumps(load_settings({"GNANI_API_KEY": KEY}).public_status()) and KEY not in repr(S)
    for path in (ROOT / "static").glob("*.js"):
        text = path.read_text(encoding="utf-8")
        assert "X-API-Key-ID" not in text and "vachana.ai" not in text and "GNANI_API_KEY" not in text, path.name
