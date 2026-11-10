"""Environment-driven settings for Sahaj (spec sections 15 and 18).

Read from the environment on every ``get_settings()`` call. Nothing here touches the network.
Secrets (``GNANI_API_KEY``) stay out of ``repr()`` and ``public_status()``.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Mapping

APP_MODES = ("demo", "production")
DEMO_PROVIDER_IDS = {"demo"}

# Documented defaults from the Gnani docs consulted; verify against current docs and your account.
DEFAULT_GNANI_STT_URL = "https://api.vachana.ai/stt/v3"
DEFAULT_GNANI_STT_WS_URL = "wss://api.vachana.ai/stt/v3/stream"
DEFAULT_GNANI_TTS_URL = "https://api.vachana.ai/api/v1/tts/inference"
DEFAULT_GNANI_STT_MODEL = "prisma-v3.0"
DEFAULT_GNANI_TTS_MODEL = "timbre-v2.5"
# Timbre v2.5 voices from the Gnani Voice Catalog (one preferred language each). Override with GNANI_TTS_VOICE_<LANG>_<REGION>.
DEFAULT_GNANI_TTS_VOICES = {"hi-IN": "Nalini", "en-IN": "Kaveri", "pa-IN": "Mehuli", "kn-IN": "Saanvi", "ta-IN": "Asmita", "bn-IN": "Kirra"}


class ConfigError(ValueError):
    """A configuration value that must never be silently corrected."""


def _env(env, name, default=""):
    return (env.get(name) or "").strip() or default


def _int(env, name, default):
    raw = _env(env, name)
    try:
        return int(raw) if raw else default
    except ValueError:
        return default


def _float(env, name, default):
    raw = _env(env, name)
    try:
        return float(raw) if raw else default
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    app_mode: str = "demo"
    bank_provider: str = "demo"
    identity_provider: str = "demo"
    payment_provider: str = "demo"
    voice_provider: str = "gnani"  # "gnani" = Prisma+Timbre primary; "gemini" = previous behaviour
    gnani_api_key: str = field(default="", repr=False)
    gnani_stt_url: str = DEFAULT_GNANI_STT_URL
    gnani_stt_ws_url: str = DEFAULT_GNANI_STT_WS_URL
    gnani_stt_model: str = DEFAULT_GNANI_STT_MODEL
    gnani_tts_url: str = DEFAULT_GNANI_TTS_URL
    gnani_tts_model: str = DEFAULT_GNANI_TTS_MODEL
    gnani_tts_sample_rate: int = 48000
    gnani_tts_voices: Mapping[str, str] = field(default_factory=lambda: dict(DEFAULT_GNANI_TTS_VOICES))
    gnani_timeout_seconds: float = 20.0
    gnani_stt_use_context: bool = True  # Prisma v3.0 key-term hints; test with and without
    gnani_retries: int = 1
    session_timeout_seconds: int = 300
    ocr_min_field_confidence: float = 0.85  # starting points; calibrate against real captures
    min_image_side_px: int = 600
    min_image_sharpness: float = 800.0

    @property
    def is_demo(self) -> bool:
        return self.app_mode == "demo"

    @property
    def gnani_configured(self) -> bool:
        return bool(self.gnani_api_key)

    def problems(self) -> list:
        issues = []
        if self.app_mode == "production":
            for label, value in (("BANK_PROVIDER", self.bank_provider), ("IDENTITY_PROVIDER", self.identity_provider),
                                 ("PAYMENT_PROVIDER", self.payment_provider)):
                if value in DEMO_PROVIDER_IDS:
                    issues.append(f"APP_MODE=production but {label}={value}: demo providers are not allowed in production.")
        if self.voice_provider == "gnani" and not self.gnani_configured:
            issues.append("VOICE_PROVIDER=gnani but GNANI_API_KEY is not set.")
        return issues

    def public_status(self) -> dict:
        return {"app_mode": self.app_mode, "bank_provider": self.bank_provider, "identity_provider": self.identity_provider,
                "payment_provider": self.payment_provider, "voice_provider": self.voice_provider,
                "gnani_configured": self.gnani_configured, "problems": self.problems()}


def load_settings(env: Mapping[str, str] | None = None) -> Settings:
    env = os.environ if env is None else env
    mode = _env(env, "APP_MODE", "demo").lower()
    if mode not in APP_MODES:
        raise ConfigError(f"APP_MODE must be one of {', '.join(APP_MODES)} (got {mode!r}).")
    voices = dict(DEFAULT_GNANI_TTS_VOICES)
    prefix = "GNANI_TTS_VOICE_"
    for key, value in env.items():
        if key.startswith(prefix) and value.strip():
            parts = key[len(prefix):].replace("_", "-").split("-")
            if len(parts) == 2:
                voices[f"{parts[0].lower()}-{parts[1].upper()}"] = value.strip()
    return Settings(
        app_mode=mode,
        bank_provider=_env(env, "BANK_PROVIDER", "demo").lower(),
        identity_provider=_env(env, "IDENTITY_PROVIDER", "demo").lower(),
        payment_provider=_env(env, "PAYMENT_PROVIDER", "demo").lower(),
        voice_provider=_env(env, "VOICE_PROVIDER", "gnani").lower(),
        gnani_api_key=_env(env, "GNANI_API_KEY"),
        gnani_stt_url=_env(env, "GNANI_STT_URL", DEFAULT_GNANI_STT_URL),
        gnani_stt_ws_url=_env(env, "GNANI_STT_WS_URL", DEFAULT_GNANI_STT_WS_URL),
        gnani_stt_model=_env(env, "GNANI_STT_MODEL", DEFAULT_GNANI_STT_MODEL),
        gnani_tts_url=_env(env, "GNANI_TTS_URL", DEFAULT_GNANI_TTS_URL),
        gnani_tts_model=_env(env, "GNANI_TTS_MODEL", DEFAULT_GNANI_TTS_MODEL),
        gnani_tts_sample_rate=_int(env, "GNANI_TTS_SAMPLE_RATE", 48000),
        gnani_tts_voices=voices,
        gnani_timeout_seconds=_float(env, "GNANI_TIMEOUT_SECONDS", 20.0),
        gnani_stt_use_context=_env(env, "GNANI_STT_USE_CONTEXT", "1").lower() not in {"0", "false", "no", "off"},
        gnani_retries=max(0, min(3, _int(env, "GNANI_RETRIES", 1))),
        session_timeout_seconds=max(30, _int(env, "SESSION_TIMEOUT_SECONDS", 300)),
        ocr_min_field_confidence=_float(env, "OCR_MIN_FIELD_CONFIDENCE", 0.85),
        min_image_side_px=_int(env, "MIN_IMAGE_SIDE_PX", 600),
        min_image_sharpness=_float(env, "MIN_IMAGE_SHARPNESS", 800.0),
    )


def get_settings() -> Settings:
    return load_settings()
