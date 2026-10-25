"""Server-side voice fallback for the kiosk.

Used when Gemini Live cannot connect AND the browser has no working built-in
speech recognizer (Brave, Firefox, locked-down kiosk browsers...).

The browser records a short WAV clip and POSTs it to /api/voice/transcribe.
Speech-to-text engines are tried in order until one works:

  1. Gemini generateContent with inline audio (plain HTTPS, often works when the
     Live WebSocket does not)
  2. Deepgram (set DEEPGRAM_API_KEY)
  3. Groq or OpenAI Whisper (set GROQ_API_KEY or OPENAI_API_KEY)
  4. Local faster-whisper (pip install faster-whisper; works fully offline)

Change the order with VOICE_STT_ORDER, e.g. VOICE_STT_ORDER=deepgram,gemini,whisper-api

chat_json() gives the intent classifier the same kind of chain:
Gemini -> Groq/OpenAI chat. If every engine fails, main.py's deterministic
keyword classifier still answers, so the kiosk never dead-ends.

Only the standard library is required; every engine is optional.
"""
from __future__ import annotations

import base64
import io
import json
import os
import re
import threading
import uuid
from urllib import error as urlerror, request as urlrequest

import gemini_models

MAX_AUDIO_BYTES = 4 * 1024 * 1024  # ~2 minutes of 16 kHz mono 16-bit audio

_STT_PROMPT = (
    "Transcribe this short audio clip of a bank customer speaking to a kiosk. "
    "The language is Hindi, English, Punjabi, Urdu, Dogri, or a mix. Write Hindi in "
    "Devanagari script, Punjabi in Gurmukhi, Urdu in Urdu script. Write spoken numbers "
    "as the customer said them. Return ONLY the transcript text. If there is no clear "
    "speech, return an empty string."
)


def looks_like_wav(data: bytes) -> bool:
    return len(data) > 44 and data[:4] == b"RIFF" and data[8:12] == b"WAVE"


def _env(name: str) -> str:
    return os.getenv(name, "").strip()


def _gemini_key() -> str:
    return _env("GEMINI_API_KEY")


def _openai_compatible() -> tuple[str, str, str, str] | None:
    """(base_url, key, stt_model, chat_model) for Groq (preferred, free tier) or OpenAI."""
    if _env("GROQ_API_KEY"):
        return ("https://api.groq.com/openai/v1", _env("GROQ_API_KEY"),
                _env("GROQ_STT_MODEL") or "whisper-large-v3-turbo",
                _env("GROQ_CHAT_MODEL") or "llama-3.3-70b-versatile")
    if _env("OPENAI_API_KEY"):
        return ("https://api.openai.com/v1", _env("OPENAI_API_KEY"),
                _env("OPENAI_STT_MODEL") or "whisper-1",
                _env("OPENAI_CHAT_MODEL") or "gpt-4o-mini")
    return None


def _http(request: urlrequest.Request, timeout: float) -> dict:
    with urlrequest.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read(2 * 1024 * 1024).decode("utf-8"))


def _post_json(url: str, payload: dict, headers: dict | None = None, timeout: float = 20) -> dict:
    h = {"Content-Type": "application/json"}
    h.update(headers or {})
    req = urlrequest.Request(url, data=json.dumps(payload, ensure_ascii=False).encode("utf-8"), headers=h, method="POST")
    return _http(req, timeout)


def _clean_transcript(text: str) -> str:
    text = (text or "").strip().strip('"').strip()
    text = re.sub(r"\s+", " ", text)
    # Models sometimes describe silence instead of returning nothing.
    if re.fullmatch(r"[\[(<*]?\s*(no (clear )?speech|silence|inaudible|empty|none|n/?a)\s*[\])>*.]?", text, flags=re.I):
        return ""
    return text


# ---------------------------------------------------------------- speech to text

def stt_gemini(wav: bytes, language: str = "") -> str | None:
    key = _gemini_key()
    if not key:
        return None
    model = gemini_models.stt_model()
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    prompt = _STT_PROMPT + (f" Expected language hint: {language}." if language else "")
    payload = {
        "contents": [{"role": "user", "parts": [
            {"text": prompt},
            {"inlineData": {"mimeType": "audio/wav", "data": base64.b64encode(wav).decode()}},
        ]}],
        "generationConfig": {"temperature": 0},
    }
    body = _post_json(url, payload, {"x-goog-api-key": key}, timeout=25)
    return _clean_transcript("".join(p.get("text", "") for p in body["candidates"][0]["content"]["parts"]))


def _multipart(fields: dict[str, str], filename: str, file_bytes: bytes, content_type: str) -> tuple[bytes, str]:
    boundary = uuid.uuid4().hex
    out = io.BytesIO()
    for name, value in fields.items():
        out.write(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode())
    out.write(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{filename}"\r\n'
              f'Content-Type: {content_type}\r\n\r\n'.encode())
    out.write(file_bytes)
    out.write(f"\r\n--{boundary}--\r\n".encode())
    return out.getvalue(), f"multipart/form-data; boundary={boundary}"


_LANG_CODES = {"hi": "hi", "en": "en", "pa": "pa", "ur": "ur"}


def stt_openai_compatible(wav: bytes, language: str = "") -> str | None:
    cfg = _openai_compatible()
    if not cfg:
        return None
    base, key, model, _chat = cfg
    fields = {"model": model, "response_format": "json", "temperature": "0"}
    if language in _LANG_CODES:
        fields["language"] = _LANG_CODES[language]
    fields["prompt"] = "Bank kiosk. Withdraw or deposit money. निकालना, जमा, रुपये, पासबुक, पेंशन."
    data, ctype = _multipart(fields, "clip.wav", wav, "audio/wav")
    req = urlrequest.Request(f"{base}/audio/transcriptions", data=data, method="POST",
                             headers={"Content-Type": ctype, "Authorization": f"Bearer {key}"})
    return _clean_transcript(_http(req, 25).get("text", ""))


_DEEPGRAM_LANG = {"hi": "hi", "en": "en"}


def stt_deepgram(wav: bytes, language: str = "") -> str | None:
    key = _env("DEEPGRAM_API_KEY")
    if not key:
        return None
    model = _env("DEEPGRAM_MODEL") or "nova-3"
    # nova-3 "multi" handles Hindi/English code-switching; override with DEEPGRAM_LANGUAGE if needed.
    lang = _env("DEEPGRAM_LANGUAGE") or _DEEPGRAM_LANG.get(language, "multi")
    url = f"https://api.deepgram.com/v1/listen?model={model}&language={lang}&smart_format=true&punctuate=true"
    req = urlrequest.Request(url, data=wav, method="POST",
                             headers={"Authorization": f"Token {key}", "Content-Type": "audio/wav"})
    body = _http(req, 20)
    return _clean_transcript(body["results"]["channels"][0]["alternatives"][0].get("transcript", ""))


_local_model = None
_local_lock = threading.Lock()


def local_whisper_available() -> bool:
    try:
        import faster_whisper  # noqa: F401
        return True
    except Exception:
        return False


def stt_local(wav: bytes, language: str = "") -> str | None:
    global _local_model
    if not local_whisper_available():
        return None
    from faster_whisper import WhisperModel
    with _local_lock:
        if _local_model is None:
            _local_model = WhisperModel(_env("WHISPER_MODEL") or "small", device="cpu", compute_type="int8")
        segments, _info = _local_model.transcribe(
            io.BytesIO(wav), language=_LANG_CODES.get(language), vad_filter=True, beam_size=1,
            initial_prompt="Bank kiosk. Withdraw or deposit money. निकालना, जमा, रुपये, पासबुक, पेंशन.")
        return _clean_transcript(" ".join(s.text for s in segments))


_ALL_STT = {"gemini": stt_gemini, "deepgram": stt_deepgram, "whisper-api": stt_openai_compatible, "whisper-local": stt_local}
_DEFAULT_STT_ORDER = ["gemini", "deepgram", "whisper-api", "whisper-local"]


def stt_engines() -> list[tuple[str, object]]:
    order = [n.strip() for n in _env("VOICE_STT_ORDER").split(",") if n.strip() in _ALL_STT]
    order += [n for n in _DEFAULT_STT_ORDER if n not in order]
    return [(n, _ALL_STT[n]) for n in order]


def transcribe(wav: bytes, language: str = "") -> dict:
    """Try each configured engine. Never raises; returns {"text", "engine", "errors"}."""
    errors: list[str] = []
    for name, fn in stt_engines():
        try:
            text = fn(wav, language)
        except (urlerror.URLError, TimeoutError, OSError, ValueError, KeyError, IndexError, TypeError, RuntimeError) as exc:
            errors.append(f"{name}: {type(exc).__name__}")
            continue
        except Exception as exc:  # a broken optional engine must not take the kiosk down
            errors.append(f"{name}: {type(exc).__name__}")
            continue
        if text is None:  # engine not configured
            continue
        return {"text": text, "engine": name, "errors": errors}
    return {"text": "", "engine": None, "errors": errors or ["no speech-to-text engine configured"]}


# ---------------------------------------------------------------- JSON chat chain

def _chat_gemini(system: str, user: str) -> dict | None:
    key = _gemini_key()
    if not key:
        return None
    model = gemini_models.intent_model()
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    body = _post_json(url, {
        "systemInstruction": {"parts": [{"text": system}]},
        "contents": [{"role": "user", "parts": [{"text": user}]}],
        "generationConfig": {"temperature": 0, "responseMimeType": "application/json"},
    }, {"x-goog-api-key": key}, timeout=12)
    return json.loads("".join(p.get("text", "") for p in body["candidates"][0]["content"]["parts"]))


def _chat_openai_compatible(system: str, user: str) -> dict | None:
    cfg = _openai_compatible()
    if not cfg:
        return None
    base, key, _stt, model = cfg
    body = _post_json(f"{base}/chat/completions", {
        "model": model, "temperature": 0, "response_format": {"type": "json_object"},
        "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
    }, {"Authorization": f"Bearer {key}"}, timeout=15)
    return json.loads(body["choices"][0]["message"]["content"])


CHAT_ENGINES = [("gemini", _chat_gemini), ("llm-api", _chat_openai_compatible)]


def chat_json(system: str, user: str) -> dict | None:
    """First engine that returns a JSON object wins; None if none work."""
    for _name, fn in CHAT_ENGINES:
        try:
            parsed = fn(system, user)
        except Exception:
            continue
        if isinstance(parsed, dict):
            return parsed
    return None


# ---------------------------------------------------------------- status

def status() -> dict:
    return {
        "server_stt_available": bool(_gemini_key() or _env("DEEPGRAM_API_KEY") or _openai_compatible() or local_whisper_available()),
        "engines": {
            "gemini": bool(_gemini_key()),
            "deepgram": bool(_env("DEEPGRAM_API_KEY")),
            "whisper_api": bool(_openai_compatible()),
            "whisper_local": local_whisper_available(),
        },
        "max_audio_bytes": MAX_AUDIO_BYTES,
    }
