from __future__ import annotations

import argparse
import os
from pathlib import Path


def load_local_env() -> None:
    """Load simple KEY=VALUE entries from this project’s .env without extra dependencies."""
    env_file = Path(__file__).resolve().parents[1] / ".env"
    if not env_file.exists():
        return
    for raw_line in env_file.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        name, value = line.split("=", 1)
        name, value = name.strip(), value.strip().strip("\"'")
        if name and value:
            os.environ.setdefault(name, value)


def main() -> int:
    parser = argparse.ArgumentParser(description="Transcribe one short audio clip with Sarvam Saaras v4.")
    parser.add_argument("audio", type=Path, help="Path to a short audio file (for example, .wav or .webm)")
    args = parser.parse_args()

    load_local_env()
    api_key = os.environ.get("SARVAM_API_KEY", "").strip()
    if not api_key:
        parser.error("Set SARVAM_API_KEY in this project's .env or in the process environment.")
    if not args.audio.is_file():
        parser.error(f"Audio file not found: {args.audio}")

    from sarvamai import SarvamAI

    client = SarvamAI(api_subscription_key=api_key)
    with args.audio.open("rb") as audio_file:
        result = client.speech_to_text.transcribe(
            file=audio_file,
            model="saaras:v4",
            mode="transcribe",
        )

    print(f"Transcript: {result.transcript}")
    print(f"Detected language: {result.language_code or 'unknown'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
