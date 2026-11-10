"""Gnani Prisma speech-to-text over REST (spec 3.1). Shapes follow the Gnani docs consulted
(``POST /stt/v3``, multipart ``audio_file`` + ``language_code``, header ``X-API-Key-ID``, JSON ``transcript``); verify against current docs.

Key stays on the server and is scrubbed from every message. Empty transcript = "no speech". Clips over 30 s are not sent.
Realtime WebSocket streaming (``GNANI_STT_WS_URL``) is evaluated but not implemented; the kiosk records short utterances."""
from __future__ import annotations

import json
import re
import struct
import time

from app.config.settings import get_settings
from app.integrations.voice import _http
from app.integrations.voice.base import (AUDIO_TOO_LONG, EMPTY, INVALID_REQUEST, NOT_CONFIGURED, OK, UNAVAILABLE,
                                         UNSUPPORTED_LANGUAGE, SpeechToText, VoiceResult)
from app.integrations.voice.language_manager import stt_language_code, ui_language_from_locale

MAX_CLIP_SECONDS = 30.0
BANKING_KEYTERMS = ["पासबुक", "निकासी", "जमा", "रुपये", "खाता", "पेंशन", "passbook", "withdraw", "deposit", "pension", "account", "ਪਾਸਬੁੱਕ", "ਜਮ੍ਹਾ"]
STT_TOPIC = "A customer speaking to a bank kiosk about withdrawing or depositing cash, a passbook and amounts in rupees."


def wav_duration_seconds(wav):
    try:
        if len(wav) < 44 or wav[:4] != b"RIFF" or wav[8:12] != b"WAVE":
            return None
        pos, byte_rate = 12, None
        while pos + 8 <= len(wav):
            chunk_id = wav[pos:pos + 4]
            size = struct.unpack("<I", wav[pos + 4:pos + 8])[0]
            if chunk_id == b"fmt " and pos + 20 <= len(wav):
                byte_rate = struct.unpack("<I", wav[pos + 16:pos + 20])[0]
            elif chunk_id == b"data":
                size = min(size, len(wav) - pos - 8)
                return size / byte_rate if byte_rate else None
            pos += 8 + size + (size & 1)
    except struct.error:
        return None
    return None


class GnaniSTT(SpeechToText):
    name = "gnani"

    def __init__(self, settings=None, transport=None, sleep=time.sleep):
        self._settings, self._post, self._sleep = settings, transport or _http.post, sleep

    @property
    def settings(self):
        return self._settings or get_settings()

    def _scrub(self, text):
        key = self.settings.gnani_api_key
        return text.replace(key, "***") if key else text

    def _result(self, status, message="", **kw):
        return VoiceResult(status=status, provider=self.name, message=self._scrub(message), **kw)

    def transcribe(self, wav, ui_language="", request_id=""):
        s = self.settings
        if not s.gnani_configured:
            return self._result(NOT_CONFIGURED, "GNANI_API_KEY is not set.")
        if not wav:
            return self._result(INVALID_REQUEST, "No audio received.")
        language_code = stt_language_code(ui_language, s.gnani_stt_model)
        if language_code is None:
            return self._result(UNSUPPORTED_LANGUAGE, f"Gnani Prisma does not cover language {ui_language!r}.", language=ui_language)
        seconds = wav_duration_seconds(wav)
        if seconds is not None and seconds > MAX_CLIP_SECONDS:
            return self._result(AUDIO_TOO_LONG, "Clip is longer than Gnani's 30 second limit.", language=language_code)
        fields = {"language_code": language_code, "format": "transcribe"}  # ITN: "five thousand rupees" -> ₹5,000
        if s.gnani_stt_model == "prisma-v3.0":
            fields["model"] = "prisma-v3.0"
            if s.gnani_stt_use_context:
                fields["keyterms"] = json.dumps(BANKING_KEYTERMS, ensure_ascii=False)
                fields["topic"] = STT_TOPIC
        body, ctype = _http.multipart(fields, "audio_file", "clip.wav", wav, "audio/wav")
        headers = {"X-API-Key-ID": s.gnani_api_key, "Content-Type": ctype}
        if request_id:
            headers["X-API-Request-ID"] = str(request_id)[:64]
        last = "no attempt"
        for attempt in range(s.gnani_retries + 1):
            try:
                response = self._post(s.gnani_stt_url, body, headers, s.gnani_timeout_seconds)
            except _http.NetworkError as exc:
                last = f"network error: {exc}"
            else:
                outcome = self._interpret(response, language_code)
                if outcome is not None:
                    return outcome
                last = f"HTTP {response.status}"
            if attempt < s.gnani_retries:
                self._sleep(0.4 * (attempt + 1))
        return self._result(UNAVAILABLE, f"Gnani speech-to-text did not respond usefully ({last}).", language=language_code)

    def _interpret(self, response, language_code):
        status = response.status
        try:
            payload = json.loads(response.body.decode("utf-8")) if response.body else {}
        except (UnicodeDecodeError, ValueError):
            payload = {}
        if status == 200 and isinstance(payload, dict):
            transcript = payload.get("transcript")
            if payload.get("success") is False or not isinstance(transcript, str):
                return self._result(UNAVAILABLE, "Gnani returned an unexpected response.", language=language_code)
            text = re.sub(r"\s+", " ", transcript).strip()
            detected = ui_language_from_locale(str(payload.get("detected_language_code") or ""))
            if not text:
                return self._result(EMPTY, "No speech detected.", language=language_code, detected_language=detected)
            return self._result(OK, language=language_code, text=text, detected_language=detected)
        error_type = ""
        if isinstance(payload, dict):
            err = payload.get("error")
            if isinstance(err, dict):
                error_type = str(err.get("type") or "")
            elif isinstance(payload.get("code"), str):
                error_type = payload["code"]
        if status == 400:
            if error_type == "MAX_AUDIO_DURATION_EXCEEDED":
                return self._result(AUDIO_TOO_LONG, "Clip is longer than Gnani's limit.", language=language_code)
            if error_type in {"INVALID_LANGUAGE_CODE", "MODEL_UNSUPPORTED_LANGUAGE"}:
                return self._result(UNSUPPORTED_LANGUAGE, "Gnani does not accept that language for this model.", language=language_code)
            if error_type == "EMPTY_AUDIO":
                return self._result(EMPTY, "No audio content.", language=language_code)
            return self._result(INVALID_REQUEST, f"Gnani rejected the request ({error_type or 'HTTP 400'}).", language=language_code)
        if status in (401, 402, 403):
            return self._result(NOT_CONFIGURED, f"Gnani refused the credentials or account (HTTP {status}). Check GNANI_API_KEY, credit and scopes.", language=language_code)
        if status == 429 or status >= 500:
            return None
        return self._result(UNAVAILABLE, f"Gnani returned HTTP {status}.", language=language_code)
