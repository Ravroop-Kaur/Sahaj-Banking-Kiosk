"""Voice interfaces (spec section 3). STT only transcribes; interpreting the transcript is a separate step."""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass

OK = "ok"
EMPTY = "empty"
NOT_CONFIGURED = "not_configured"
UNSUPPORTED_LANGUAGE = "unsupported_language"
AUDIO_TOO_LONG = "audio_too_long"
UNAVAILABLE = "unavailable"
INVALID_REQUEST = "invalid_request"


@dataclass(frozen=True)
class VoiceResult:
    status: str
    provider: str
    text: str = ""
    audio: bytes = b""
    content_type: str = ""
    language: str = ""
    detected_language: str = ""
    message: str = ""

    @property
    def ok(self) -> bool:
        return self.status == OK

    def public(self) -> dict:
        """Safe summary for APIs and logs: no audio, no transcript."""
        return {"status": self.status, "provider": self.provider, "language": self.language,
                "detected_language": self.detected_language, "message": self.message}


class SpeechToText(ABC):
    name = "base"

    @abstractmethod
    def transcribe(self, wav: bytes, ui_language: str = "", request_id: str = "") -> VoiceResult: ...


class TextToSpeech(ABC):
    name = "base"

    @abstractmethod
    def synthesize(self, text: str, ui_language: str = "") -> VoiceResult: ...
