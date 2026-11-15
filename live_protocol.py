"""Adapts the kiosk page's messages to what each Gemini Live model family accepts.

Why this exists
---------------
The page talks to Gemini with two kinds of messages:

* ``realtimeInput``  - the microphone audio, sent continuously.
* ``clientContent``  - a text turn ("APP EVENT: say this sentence ...", the silence re-ask,
  language changes, the balance prompt, ...).

Gemini 3.x Live models only accept ``clientContent`` to *seed history at the very start* of a
session. Once audio is streaming, a text turn has to be sent as ``realtimeInput.text``; a
``clientContent`` turn at that point makes Google close the whole Live session, and the kiosk
drops to browser voice. (The older ``gemini-2.5-*native-audio*`` models accept both.)

The first message after setup (the greeting) is forwarded unchanged. Every later
``clientContent`` is rewritten to ``realtimeInput.text`` for models that need it.
"""
from __future__ import annotations

import json
from typing import Optional


def accepts_mid_session_client_content(model: str) -> bool:
    """True for the older native-audio family, which still allows text turns during a session."""
    name = (model or "").removeprefix("models/")
    return "native-audio" in name or name.startswith("gemini-2.")


def kind_of(raw) -> str:
    """Short label for a browser->Gemini message, used only for logs and diagnostics."""
    if isinstance(raw, (bytes, bytearray)):
        return "binary"
    if isinstance(raw, str) and raw.startswith('{"realtimeInput":{"audio"'):
        return "audio"  # fast path: mic frames arrive ~12x per second, no need to parse them
    try:
        payload = json.loads(raw)
    except (TypeError, ValueError):
        return "invalid-json"
    if not isinstance(payload, dict):
        return "invalid-json"
    if "setup" in payload:
        return "setup"
    if "clientContent" in payload:
        return "clientContent"
    rt = payload.get("realtimeInput")
    if isinstance(rt, dict):
        if "text" in rt:
            return "realtimeInput.text"
        if "audio" in rt:
            return "audio"
        return "realtimeInput." + (next(iter(rt), "empty"))
    return next(iter(payload), "empty")


def _turn_text(client_content) -> str:
    """Join the text of every part of every turn. Tolerates any JSON shape (returns '' if there is no text)."""
    if not isinstance(client_content, dict):
        return ""
    turns = client_content.get("turns")
    pieces = []
    for turn in turns if isinstance(turns, list) else []:
        parts = turn.get("parts") if isinstance(turn, dict) else None
        for part in parts if isinstance(parts, list) else []:
            text = part.get("text") if isinstance(part, dict) else None
            if isinstance(text, str) and text.strip():
                pieces.append(text.strip())
    return "\n".join(pieces)


def adapt_client_frame(raw: str, model: str, is_first_after_setup: bool) -> tuple[str, str]:
    """Return ``(frame_to_send_to_google, kind_label)`` for one text frame from the browser.

    ``is_first_after_setup`` is True only for the first message of a connection (the greeting).
    """
    kind = kind_of(raw)
    if kind != "clientContent" or is_first_after_setup or accepts_mid_session_client_content(model):
        return raw, kind
    try:
        payload = json.loads(raw)
    except ValueError:  # cannot happen after kind_of, kept for safety
        return raw, kind
    text = _turn_text(payload.get("clientContent"))
    if not text:
        return raw, kind  # nothing to say; let Google decide rather than silently dropping
    return json.dumps({"realtimeInput": {"text": text}}, ensure_ascii=False), "clientContent->realtimeInput.text"


def describe_close(code: Optional[int], reason: str, last_kinds: list[str]) -> str:
    """One log line that ties Google's close code to what the browser had just sent."""
    recent = ", ".join(last_kinds[-4:]) or "nothing"
    return f"Google closed the session: code={code} reason={reason!r}; last browser messages: {recent}"
