"""Passbook OCR for hosted (Linux / Render) deployments.

Why this exists: on a small cloud instance the old pipeline could take minutes
(8 image variants x 2 Tesseract modes on a tiny CPU, then a 40 s Gemini call per
model with no retry) and failed outright on one transient Gemini 429/503.

Now:
  * one overall deadline (OCR_DEADLINE_SECONDS, default 35) shared by every engine
  * engines tried in order, default gemini -> vision-api -> tesseract
    (set OCR_ORDER=tesseract,gemini on a server with a strong CPU)
  * Gemini: short per-call timeout, quick retry on 429/5xx, then the next model
  * Tesseract: upright image first, rotations only if needed, per-call time limit
  * an engine only "wins" if its text contains an account-number-like digit run,
    so "UNCERTAIN" / empty answers fall through to the next engine
  * results are cached by image hash, so retrying the same photo is instant

Windows kiosks keep using the existing Windows OCR path in main.py.
"""
from __future__ import annotations

import base64
import hashlib
import json
import os
import re
import shutil
import subprocess
import threading
import time
from collections import OrderedDict
from io import BytesIO
from pathlib import Path
from urllib import error as urlerror, request as urlrequest

import gemini_models

PROMPT = (
    "Read this synthetic demo bank passbook image. It may be rotated or upside down. Extract ONLY the printed "
    "account number (usually 8–18 digits) explicitly labelled Account Number, Account No, or A/C No. Ignore CIF "
    "numbers, phone numbers, balances, dates, and transaction numbers. Output exactly one line: Account Number: "
    "<digits>. If the labelled account number cannot be read confidently, output exactly: Account Number: UNCERTAIN. "
    "Do not guess digits."
)

_ACCOUNT_RE = re.compile(r"(?<!\d)\d{8,18}(?!\d)")
_LABEL_RE = re.compile(r"account\s*(?:number|no\.?|#)|a\s*/\s*c", re.I)


def _env(name: str, default: str = "") -> str:
    return os.getenv(name, "").strip() or default


def has_account_number(text: str) -> bool:
    text = text or ""
    if _ACCOUNT_RE.search(text):
        return True
    # digits split by spaces/dashes ("1234 5678 9012"), only trusted next to an account label
    return bool(_LABEL_RE.search(text)) and bool(re.search(r"(?:\d[\s-]?){12,18}", text))


class Deadline:
    def __init__(self, seconds: float):
        self.end = time.monotonic() + seconds

    def left(self) -> float:
        return self.end - time.monotonic()

    def expired(self) -> bool:
        return self.left() <= 1.0


# ---------------------------------------------------------------- cache

_CACHE: "OrderedDict[str, tuple[float, str, str]]" = OrderedDict()
_CACHE_LOCK = threading.Lock()
_CACHE_TTL = 600
_CACHE_MAX = 32


def _cache_get(key: str):
    with _CACHE_LOCK:
        item = _CACHE.get(key)
        if item and time.time() - item[0] < _CACHE_TTL:
            _CACHE.move_to_end(key)
            return item[1], item[2]
        _CACHE.pop(key, None)
    return None


def _cache_put(key: str, text: str, engine: str) -> None:
    with _CACHE_LOCK:
        _CACHE[key] = (time.time(), text, engine)
        while len(_CACHE) > _CACHE_MAX:
            _CACHE.popitem(last=False)


# ---------------------------------------------------------------- Gemini vision

def _gemini_models() -> list[str]:
    return gemini_models.ocr_models()


def read_gemini(image: bytes, deadline: Deadline) -> str:
    key = _env("GEMINI_API_KEY")
    if not key:
        raise RuntimeError("GEMINI_API_KEY is not set")
    payload = json.dumps({
        "contents": [{"role": "user", "parts": [
            {"text": PROMPT},
            {"inlineData": {"mimeType": "image/jpeg", "data": base64.b64encode(image).decode("ascii")}}]}],
        "generationConfig": {"temperature": 0, "maxOutputTokens": 120},
    }).encode("utf-8")
    failures: list[str] = []
    per_call = float(_env("OCR_GEMINI_TIMEOUT", "14"))
    for model in _gemini_models():
        for attempt in (1, 2):  # one quick retry for transient overload / rate limit
            if deadline.expired():
                raise RuntimeError("; ".join(failures[:2]) or "time limit reached")
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
            req = urlrequest.Request(url, data=payload, method="POST",
                                     headers={"Content-Type": "application/json", "x-goog-api-key": key})
            try:
                with urlrequest.urlopen(req, timeout=max(3.0, min(per_call, deadline.left()))) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
            except urlerror.HTTPError as exc:
                detail = ""
                try:
                    detail = (json.loads(exc.read().decode("utf-8")).get("error") or {}).get("message", "")
                except Exception:
                    pass
                failures.append(f"{model}: HTTP {exc.code} {detail[:120]}".replace(key, "***"))
                if exc.code in (429, 500, 502, 503, 504) and attempt == 1:
                    time.sleep(min(1.2, max(0.0, deadline.left() - 1)))
                    continue
                if exc.code in (401, 403) or (exc.code == 400 and "model" not in detail.lower()):
                    raise RuntimeError("; ".join(failures[:2]))  # bad key / bad request: other models fail the same way
                break  # next model
            except (urlerror.URLError, TimeoutError, OSError, ValueError) as exc:
                failures.append(f"{model}: {type(exc).__name__}".replace(key, "***"))
                if attempt == 1 and not deadline.expired():
                    continue
                break
            parts = (((data.get("candidates") or [{}])[0].get("content") or {}).get("parts")) or []
            text = "\n".join(p.get("text", "") for p in parts)
            if has_account_number(text):
                return text
            failures.append(f"{model}: no account number in answer")
            break
    raise RuntimeError("; ".join(failures[:3]) or "no answer")


# ---------------------------------------------------------------- optional second vision provider

def read_vision_api(image: bytes, deadline: Deadline) -> str:
    """Groq / OpenAI vision as a backup when Gemini is down. Needs GROQ_API_KEY or OPENAI_API_KEY."""
    if _env("GROQ_API_KEY"):
        base, key = "https://api.groq.com/openai/v1", _env("GROQ_API_KEY")
        model = _env("OCR_VISION_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")
    elif _env("OPENAI_API_KEY"):
        base, key = "https://api.openai.com/v1", _env("OPENAI_API_KEY")
        model = _env("OCR_VISION_MODEL", "gpt-4o-mini")
    else:
        raise RuntimeError("no vision API key")
    body = json.dumps({
        "model": model, "temperature": 0, "max_tokens": 80,
        "messages": [{"role": "user", "content": [
            {"type": "text", "text": PROMPT},
            {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64," + base64.b64encode(image).decode("ascii")}}]}],
    }).encode("utf-8")
    req = urlrequest.Request(f"{base}/chat/completions", data=body, method="POST",
                             headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"})
    try:
        with urlrequest.urlopen(req, timeout=max(3.0, min(14.0, deadline.left()))) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        text = data["choices"][0]["message"]["content"] or ""
    except (urlerror.URLError, TimeoutError, OSError, ValueError, KeyError, IndexError) as exc:
        raise RuntimeError(f"{type(exc).__name__}") from exc
    if not has_account_number(text):
        raise RuntimeError("no account number in answer")
    return text


# ---------------------------------------------------------------- Tesseract (budgeted)

def tesseract_available() -> bool:
    return bool(shutil.which("tesseract"))


def read_tesseract(image: bytes, deadline: Deadline) -> str:
    exe = shutil.which("tesseract")
    if not exe:
        raise RuntimeError("tesseract is not installed")
    from PIL import Image, ImageEnhance, ImageOps
    base = Image.open(BytesIO(image)).convert("RGB")
    if max(base.size) < 1600:  # small photo: upscale so digits are large enough
        scale = min(3.0, 1600 / max(max(base.size), 1))
        base = base.resize((round(base.width * scale), round(base.height * scale)), Image.Resampling.LANCZOS)
    env = dict(os.environ, OMP_THREAD_LIMIT="1")
    candidates: list[str] = []

    def variant(angle: int, threshold: bool):
        img = base.rotate(angle, expand=True) if angle else base
        g = ImageEnhance.Sharpness(ImageEnhance.Contrast(ImageOps.autocontrast(ImageOps.grayscale(img), cutoff=1)).enhance(1.7)).enhance(2.0)
        return g.point(lambda p: 255 if p > 172 else 0) if threshold else g

    # upright first, then upside down, then sideways
    plan = [(0, False, "6"), (0, True, "6"), (180, False, "6"), (0, False, "11"), (180, True, "6"), (90, False, "6"), (270, False, "6")]
    tmp = Path(os.environ.get("TMPDIR", "/tmp")) / f"ocr-{os.getpid()}-{threading.get_ident()}.png"
    try:
        for angle, threshold, psm in plan:
            if deadline.expired():
                break
            variant(angle, threshold).save(tmp, format="PNG")
            try:
                out = subprocess.run([exe, str(tmp), "stdout", "-l", "eng", "--oem", "3", "--psm", psm], capture_output=True,
                                     text=True, encoding="utf-8", errors="replace", env=env,
                                     timeout=max(2.0, min(9.0, deadline.left()))).stdout
            except subprocess.TimeoutExpired:
                continue
            candidates.append(out)
            flat = re.sub(r"\s+", " ", out).lower()
            has_label = bool(re.search(r"account\s*(?:number|no\.?|#)", flat))
            twelve = bool(re.search(r"(?<!\d)\d{12}(?!\d)", out))
            if twelve and (has_label or angle == 0):
                return out
    finally:
        try:
            tmp.unlink()
        except OSError:
            pass
    best = [c for c in candidates if has_account_number(c)]
    if best:
        return best[0]
    raise RuntimeError("tesseract found no account number")


# ---------------------------------------------------------------- orchestration

ENGINES = {
    "gemini": (read_gemini, "Gemini vision"),
    "vision-api": (read_vision_api, "Vision API"),
    "tesseract": (read_tesseract, "Local Tesseract OCR"),
}


def prepare_image(raw: bytes, max_side: int = 1800) -> bytes:
    """Fix EXIF rotation, flatten to RGB, shrink to max_side, re-encode as JPEG."""
    from PIL import Image, ImageOps
    img = ImageOps.exif_transpose(Image.open(BytesIO(raw)))
    if img.width * img.height > 50_000_000:
        raise ValueError("Image dimensions are too large to process safely.")
    img.load()
    img = img.convert("RGB")
    img.thumbnail((max_side, max_side))
    out = BytesIO()
    img.save(out, format="JPEG", quality=88)
    return out.getvalue()


def engine_order() -> list[str]:
    order = [n.strip() for n in _env("OCR_ORDER").split(",") if n.strip() in ENGINES]
    return order or ["gemini", "vision-api", "tesseract"]


def recognize(image: bytes) -> tuple[str, str]:
    """Return (text, engine_label). Raises RuntimeError with a readable reason if every engine fails."""
    key = hashlib.sha256(image).hexdigest()
    cached = _cache_get(key)
    if cached:
        return cached
    deadline = Deadline(float(_env("OCR_DEADLINE_SECONDS", "35")))
    failures: list[str] = []
    for name in engine_order():
        if deadline.expired():
            failures.append("time limit reached")
            break
        fn, label = ENGINES[name]
        if name == "tesseract" and not tesseract_available():
            continue
        if name == "gemini" and not _env("GEMINI_API_KEY"):
            continue
        if name == "vision-api" and not (_env("GROQ_API_KEY") or _env("OPENAI_API_KEY")):
            continue
        try:
            text = fn(image, deadline)
        except Exception as exc:  # one broken engine must not stop the others
            failures.append(f"{name}: {exc}")
            print(f"[Passbook OCR] {name} failed: {exc}", flush=True)
            continue
        _cache_put(key, text, label)
        return text, label
    if not failures:
        raise RuntimeError("Passbook reading is not configured on this server: add GEMINI_API_KEY (the .env file is not "
                           "deployed, set it in the host's environment variables) or deploy with the Dockerfile that installs Tesseract.")
    raise RuntimeError("Could not read the passbook (" + "; ".join(failures[:3]) + ")")
