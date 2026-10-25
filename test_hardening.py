"""Tests for rate limiting, shared model names, the voice fallback chain wiring and the split JS files."""
import io
import json
import shutil
import struct
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent


def _wav(ms=500):
    n = 16 * ms
    data = b"\x00\x00" * n
    return b"RIFF" + struct.pack("<I", 36 + len(data)) + b"WAVEfmt " + struct.pack("<IHHIIHH", 16, 1, 1, 16000, 32000, 2, 16) + b"data" + struct.pack("<I", len(data)) + data


@pytest.fixture()
def client(monkeypatch):
    pytest.importorskip("httpx")
    from fastapi.testclient import TestClient
    import ratelimit
    import main
    ratelimit.reset()
    monkeypatch.setenv("RATE_LIMIT_PER_MIN", "3")
    monkeypatch.delenv("TRUST_PROXY", raising=False)
    yield TestClient(main.app)
    ratelimit.reset()


def test_intent_is_rate_limited(client):
    codes = [client.post("/api/intent", json={"text": "I want to withdraw 500 rupees"}).status_code for _ in range(5)]
    assert codes[:3] == [200, 200, 200]
    assert codes[3:] == [429, 429]
    assert client.post("/api/intent", json={"text": "withdraw"}).headers.get("retry-after")


def test_rate_limit_can_be_disabled(client, monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_PER_MIN", "0")
    assert all(client.post("/api/intent", json={"text": "deposit 100"}).status_code == 200 for _ in range(8))


def test_forwarded_header_only_trusted_when_enabled(client, monkeypatch):
    for _ in range(3):
        client.post("/api/intent", json={"text": "hi"}, headers={"x-forwarded-for": "1.1.1.1"})
    # Not trusted: all calls share one client, so the 4th is blocked even with a different header.
    assert client.post("/api/intent", json={"text": "hi"}, headers={"x-forwarded-for": "2.2.2.2"}).status_code == 429
    monkeypatch.setenv("TRUST_PROXY", "1")
    assert client.post("/api/intent", json={"text": "hi"}, headers={"x-forwarded-for": "3.3.3.3"}).status_code == 200


def test_transcribe_validates_before_spending_quota(client):
    assert client.post("/api/voice/transcribe", content=b"").status_code == 400
    assert client.post("/api/voice/transcribe", content=b"not a wav file at all, definitely not").status_code == 415


def test_stt_failure_still_returns_json_and_intent_falls_back_to_keywords(client, monkeypatch):
    """No keys configured: transcription reports no engine, and a clear request is still understood without any model."""
    for k in ("GEMINI_API_KEY", "DEEPGRAM_API_KEY", "GROQ_API_KEY", "OPENAI_API_KEY"):
        monkeypatch.delenv(k, raising=False)
    monkeypatch.setenv("VOICE_STT_ORDER", "gemini,deepgram,whisper-api")
    r = client.post("/api/voice/transcribe?language=en", content=_wav(), headers={"Content-Type": "audio/wav"})
    assert r.status_code == 200 and not r.json().get("text")
    d = client.post("/api/intent", json={"text": "I want to withdraw 2000 rupees", "language": "en"}).json()
    assert d["intent"] == "withdrawal" and d["amount"] == "2000"


def test_model_names_come_from_one_place(monkeypatch):
    import gemini_models, passbook_ocr
    monkeypatch.delenv("GEMINI_OCR_MODEL", raising=False)
    assert passbook_ocr._gemini_models() == gemini_models.ocr_models() == gemini_models.OCR_FALLBACKS
    monkeypatch.setenv("GEMINI_OCR_MODEL", "my-model")
    assert gemini_models.ocr_models()[0] == "my-model" and len(set(gemini_models.ocr_models())) == 4
    monkeypatch.setenv("GEMINI_INTENT_MODEL", "x")
    monkeypatch.delenv("GEMINI_STT_MODEL", raising=False)
    assert gemini_models.stt_model() == "x"
    for name in ("main.py", "voice_fallback.py", "passbook_ocr.py"):
        assert "gemini-3.6-flash" not in (ROOT / name).read_text(encoding="utf-8"), name


def test_api_key_never_goes_in_a_url_for_rest_calls():
    src = (ROOT / "main.py").read_text(encoding="utf-8")
    assert "?key={api_key}" not in src


def test_html_loads_split_scripts_in_order():
    html = (ROOT / "static" / "index.html").read_text(encoding="utf-8")
    a, b, c = (html.index(f'/static/{n}.js') for n in ("server-stt", "reask", "app"))
    assert a < b < c
    for n in ("server-stt", "reask", "app"):
        assert (ROOT / "static" / f"{n}.js").exists()


@pytest.mark.skipif(not shutil.which("node"), reason="node not installed")
def test_browser_scripts_parse_together():
    combined = "\n".join((ROOT / "static" / n).read_text(encoding="utf-8") for n in ("server-stt.js", "reask.js", "app.js"))
    import tempfile
    with tempfile.TemporaryDirectory() as d:
        f = Path(d) / "all.js"
        f.write_text(combined, encoding="utf-8")
        p = subprocess.run(["node", "--check", str(f)], capture_output=True, text=True)
    assert p.returncode == 0, p.stderr
