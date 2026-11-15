"""Gnani Timbre text-to-speech over REST (spec 3.2). Shape follows the docs consulted
(``POST /api/v1/tts/inference``, JSON, header ``X-API-Key-ID``, binary audio); verify model/voice/audio settings against current docs.

Voice is chosen per language from configuration; none configured -> ``unsupported_language``. Bounded timeout and retry.
For English, rupee amounts are spelled out and long digit runs read digit by digit."""
from __future__ import annotations

import json
import re
import time

from app.config.settings import get_settings
from app.integrations.voice import _http
from app.integrations.voice.base import (INVALID_REQUEST, NOT_CONFIGURED, OK, UNAVAILABLE, UNSUPPORTED_LANGUAGE, TextToSpeech, VoiceResult)
from app.integrations.voice.language_manager import normalize_ui_language, tts_voice_for

MAX_TEXT_CHARS = 600
_SMALL = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen",
          "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"]
_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]


def _under_thousand(n):
    words = []
    if n >= 100:
        words += [_SMALL[n // 100], "hundred"]
        n %= 100
    if n >= 20:
        words.append(_TENS[n // 10])
        n %= 10
    if n:
        words.append(_SMALL[n])
    return " ".join(words)


def number_to_words_en(n):
    if n == 0:
        return "zero"
    parts = []
    for divisor, label in ((10_000_000, "crore"), (100_000, "lakh"), (1000, "thousand")):
        if n >= divisor:
            q, n = divmod(n, divisor)
            parts += [_under_thousand(q), label]
    if n:
        parts.append(_under_thousand(n))
    return " ".join(parts)


def _spell(raw):
    digits = re.sub(r"\D", "", raw.split(".")[0])
    if not digits:
        return raw
    if len(digits) >= 8:
        return " ".join(_SMALL[int(d)] for d in digits)
    return number_to_words_en(int(digits))


def _money_to_words_en(raw):
    """Preserve paise: saying Rs 100.50 as just 'one hundred rupees' is unsafe."""
    whole, dot, fractional = raw.replace(",", "").partition(".")
    words = _spell(whole) + " rupees"
    if dot and fractional and len(fractional) <= 2:
        paise = int(fractional.ljust(2, "0"))
        if paise:
            words += " and " + number_to_words_en(paise) + " paise"
    elif dot and fractional:
        # More than 2 decimal places are not a valid rupee/paise amount. Do not silently truncate.
        words += " point " + " ".join(_SMALL[int(d)] for d in fractional)
    return words


def normalize_for_english_tts(text):
    text = re.sub(r"(?:₹|\bRs\.?|\bINR)\s*(\d[\d,]*(?:\.\d+)?)", lambda m: _money_to_words_en(m.group(1)), text, flags=re.IGNORECASE)
    return re.sub(r"\d[\d,]*(?:\.\d+)?", lambda m: _spell(m.group(0)), text)


class GnaniTTS(TextToSpeech):
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

    def synthesize(self, text, ui_language=""):
        s = self.settings
        if not s.gnani_configured:
            return self._result(NOT_CONFIGURED, "GNANI_API_KEY is not set.")
        text = re.sub(r"\s+", " ", text or "").strip()
        if not text:
            return self._result(INVALID_REQUEST, "No text to speak.")
        if len(text) > MAX_TEXT_CHARS:
            return self._result(INVALID_REQUEST, f"Text is longer than {MAX_TEXT_CHARS} characters.")
        choice = tts_voice_for(ui_language, s)
        if choice is None:
            return self._result(UNSUPPORTED_LANGUAGE, f"No Timbre voice is configured for language {ui_language!r}.", language=ui_language)
        locale, voice = choice
        if normalize_ui_language(ui_language) == "en":
            text = normalize_for_english_tts(text)
        payload = {"text": text, "voice": voice, "model": s.gnani_tts_model, "language": locale,
                   "audio_config": {"encoding": "linear_pcm", "container": "wav", "num_channels": 1,
                                    "sample_rate": s.gnani_tts_sample_rate, "sample_width": 2}}
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        headers = {"X-API-Key-ID": s.gnani_api_key, "Content-Type": "application/json"}
        last = "no attempt"
        for attempt in range(s.gnani_retries + 1):
            try:
                response = self._post(s.gnani_tts_url, body, headers, s.gnani_timeout_seconds)
            except _http.NetworkError as exc:
                last = f"network error: {exc}"
            else:
                if response.status == 200:
                    if response.body:
                        return self._result(OK, language=locale, audio=response.body, content_type="audio/wav")
                    last = "empty audio"
                elif response.status in (400, 422):
                    return self._result(INVALID_REQUEST, f"Gnani rejected the text-to-speech request (HTTP {response.status}).", language=locale)
                elif response.status in (401, 402, 403):
                    return self._result(NOT_CONFIGURED, f"Gnani refused the credentials or account (HTTP {response.status}).", language=locale)
                else:
                    last = f"HTTP {response.status}"
            if attempt < s.gnani_retries:
                self._sleep(0.4 * (attempt + 1))
        return self._result(UNAVAILABLE, f"Gnani text-to-speech did not return usable audio ({last}).", language=locale)
