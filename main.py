"""Local synthetic banking kiosk MVP with Gemini Live voice support."""
import asyncio
from datetime import date
from pathlib import Path
import os
import re
import tempfile
import sys
import json
import shutil
import subprocess
from io import BytesIO

from fastapi import FastAPI, File, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from dotenv import load_dotenv
from fastapi.responses import HTMLResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from urllib import error as urlerror, request as urlrequest
from demo_database import DB_PATH, find_account, initialize_database

ROOT = Path(__file__).parent
load_dotenv(ROOT / ".env")
VENDORED_PYTHON = ROOT / "vendor" / "python"
if VENDORED_PYTHON.exists():
    sys.path.insert(0, str(VENDORED_PYTHON))
app = FastAPI(title="Banking Assistance Kiosk MVP")
app.mount("/static", StaticFiles(directory=ROOT / "static"), name="static")
MAPPING_CONFIG = json.loads((ROOT / "field_mappings.json").read_text(encoding="utf-8"))
WITHDRAWAL_MAP = MAPPING_CONFIG["withdrawal"]
FORM_TEMPLATES = {key: (ROOT / item["template"], f"{key}.pdf") for key, item in MAPPING_CONFIG["sample_forms"].items()}
FORM_FIELD_MAP = {key: item.get("fields", {}) for key, item in MAPPING_CONFIG["sample_forms"].items()}
FORM_ALLOWED_FIELDS = {key: set(item.get("fields", {})) | set(item.get("digit_fields", {})) | set(item.get("cell_text_fields", {})) | set(item.get("check_fields", {})) for key, item in MAPPING_CONFIG["sample_forms"].items()}
FORM_DIGIT_MAP = {key: item.get("digit_fields", {}) for key, item in MAPPING_CONFIG["sample_forms"].items()}
FORM_CELL_TEXT_MAP = {key: item.get("cell_text_fields", {}) for key, item in MAPPING_CONFIG["sample_forms"].items()}
FORM_CHECK_MAP = {key: item.get("check_fields", {}) for key, item in MAPPING_CONFIG["sample_forms"].items()}
initialize_database()

class IntentRequest(BaseModel):
    text: str = Field(max_length=1000)
    language: str = "en"

class PrepareRequest(BaseModel):
    transaction: str
    amount: str
    name: str
    account_id: str
    phone: str = ""
    branch: str = ""
    confirmed: bool = False

class SampleFormRequest(BaseModel):
    form_id: str
    fields: dict[str, str] = Field(default_factory=dict)
    confirmed: bool = False


@app.get("/", response_class=HTMLResponse)
def home():
    return (ROOT / "static" / "index.html").read_text(encoding="utf-8")

@app.get("/api/health")
def health():
    initialize_database()
    return {"status": "ok", "ocr": "local-windows-ocr-or-tesseract", "speech": "gemini-configured" if os.getenv("GEMINI_API_KEY") else "gemini-key-required", "pdf_template": "synthetic-clean-forms", "bank_integration": False, "database": str(DB_PATH), "synthetic_database": True}

@app.websocket("/api/gemini/live")
async def gemini_live_proxy(client: WebSocket):
    """Proxy Gemini Live traffic so the Google API key is never sent to the browser."""
    await client.accept()
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        await client.send_json({"proxyError": "Gemini voice is not configured. Add GEMINI_API_KEY to the server .env file."})
        await client.close(code=1011)
        return
    try:
        from websockets.legacy.client import connect as websocket_connect
        from urllib.parse import quote
        url = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=" + quote(api_key)
        async with websocket_connect(url, max_size=12 * 1024 * 1024, open_timeout=15) as upstream:
            async def browser_to_gemini():
                while True:
                    message = await client.receive_text()
                    await upstream.send(message)
            async def gemini_to_browser():
                async for message in upstream:
                    # Gemini may send either text JSON frames or binary frames.
                    # Starlette's send_text expects str; calling it with bytes raises
                    # the exact "'bytes' object has no attribute 'encode'" error.
                    if isinstance(message, bytes):
                        await client.send_bytes(message)
                    else:
                        await client.send_text(message)
            tasks = [asyncio.create_task(browser_to_gemini()), asyncio.create_task(gemini_to_browser())]
            done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
            for task in pending:
                task.cancel()
            for task in done:
                exc = task.exception()
                if exc and not isinstance(exc, WebSocketDisconnect):
                    raise exc
    except WebSocketDisconnect:
        pass
    except Exception as exc:
        # Log the underlying error to the launcher terminal so connection failures can be diagnosed.
        import traceback
        print(f"[Gemini Live proxy] {type(exc).__name__}: {exc}", flush=True)
        traceback.print_exc()
        try:
            # Include a short diagnostic detail in the UI; never include the API key or request URL.
            detail = str(exc).replace("\n", " ").strip()[:240]
            suffix = f": {detail}" if detail else ""
            await client.send_json({"proxyError": f"Gemini Live connection failed ({type(exc).__name__}){suffix}. Check the kiosk terminal for details."})
            await client.close(code=1011)
        except Exception:
            pass


def _prepare_ocr_variants(raw: bytes, folder: Path, file_suffix: str = ".jpg") -> list[Path]:
    """Create local OCR attempts tolerant of camera rotation, blur, and low contrast."""
    try:
        from PIL import Image, ImageEnhance, ImageOps
        image = ImageOps.exif_transpose(Image.open(BytesIO(raw)))
        image.load()
        if image.width * image.height > 50_000_000:
            raise HTTPException(413, "Image dimensions are too large to process safely.")
        image = image.convert("RGB")
        min_side = min(image.size)
        scale = min(3.0, max(1.0, 1600 / max(min_side, 1)))
        if scale > 1:
            image = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
        variants = []
        for angle in (0, 90, 180, 270):
            oriented = image.rotate(angle, expand=True) if angle else image
            enhanced = ImageEnhance.Sharpness(ImageEnhance.Contrast(ImageOps.autocontrast(ImageOps.grayscale(oriented), cutoff=1)).enhance(1.7)).enhance(2.0)
            variants.extend([(f"gray_{angle}", enhanced), (f"threshold_{angle}", enhanced.point(lambda pixel: 255 if pixel > 172 else 0))])
        paths = []
        for name, variant in variants:
            path = folder / f"{name}.png"
            variant.save(path, format="PNG", optimize=True)
            paths.append(path)
        return paths
    except HTTPException:
        raise
    except Exception:
        # Windows System.Drawing is a second local preprocessing path if Pillow is unavailable.
        suffix = Path(file_suffix).suffix.lower()
        if suffix not in {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff"}:
            raise RuntimeError("This Windows OCR fallback cannot decode that image format.")
        source = folder / f"uploaded{suffix}"
        source.write_bytes(raw)
        script = ROOT / "static" / "ocr" / "preprocess_windows.ps1"
        subprocess.run(["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", str(script),
                        "-SourcePath", str(source), "-OutputDirectory", str(folder)],
                       capture_output=True, text=True, timeout=60, check=True)
        paths = sorted(folder.glob("gray_*.png")) + sorted(folder.glob("contrast_*.png"))
        if not paths:
            raise RuntimeError("Windows local image preprocessing produced no OCR variants.")
        return paths

def _recognize_local_variants(folder: Path) -> tuple[str, str]:
    """Run fast local OCR first on upright variants; broaden only if account number is not found."""
    tesseract = shutil.which("tesseract")
    if tesseract:
        candidates = []
        paths = sorted(folder.glob("*.png"))
        preferred = [p for p in paths if p.name in {"gray_0.png", "threshold_0.png", "gray_180.png", "threshold_180.png"}]
        ordered = preferred + [p for p in paths if p not in preferred]
        seen = set()
        for path in ordered:
            for psm in ("6", "11"):
                result = subprocess.run([tesseract, str(path), "stdout", "-l", "eng", "--oem", "3", "--psm", psm],
                                        capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=20)
                candidate = result.stdout
                candidates.append(candidate)
                normalized = re.sub(r"\s+", " ", candidate).lower()
                has_label = bool(re.search(r"account\s*(?:number|no\.?|#)", normalized))
                has_twelve_digits = bool(re.search(r"(?<!\d)\d{12}(?!\d)", candidate))
                if has_label and has_twelve_digits:
                    return candidate, "Local Tesseract OCR"
                if psm == "6" and path.name in {"gray_0.png", "threshold_0.png"} and has_twelve_digits:
                    # A strong 12-digit candidate is enough to avoid spending time on every rotation.
                    return candidate, "Local Tesseract OCR"
        engine = "Local Tesseract OCR"
    elif sys.platform == "win32" and shutil.which("powershell.exe"):
        script = ROOT / "static" / "ocr" / "windows_ocr.ps1"
        result = subprocess.run(["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", str(script), "-ImageDirectory", str(folder)],
                                capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=90, check=True)
        variants = json.loads(result.stdout.strip())
        candidates = [item.get("text", "") for item in variants]
        engine = "Windows OCR (local)"
    else:
        raise RuntimeError("No local OCR engine is available on this computer.")

    def score(text: str) -> tuple[int, int, int, int]:
        normalized = re.sub(r"\s+", " ", text).lower()
        tokens = re.findall(r"[A-Za-z0-9]{2,}", text)
        account_like = re.findall(r"(?<!\d)\d{8,18}(?!\d)", text)
        labelled = 1 if re.search(r"account\s*(?:number|no\.?|#)", normalized) else 0
        twelve_digit = sum(1 for value in account_like if len(value) == 12)
        return labelled, twelve_digit, len(account_like), len(tokens) + len(text.strip())
    return max(candidates, key=score, default=""), engine

@app.post("/api/ocr/passbook")
async def ocr_passbook(file: UploadFile = File(...)):
    allowed = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed:
        raise HTTPException(415, "Upload a JPG, PNG, or WebP image.")
    raw = await file.read()
    if len(raw) > 8 * 1024 * 1024:
        raise HTTPException(413, "Image must be 8 MB or smaller.")
    if not raw:
        raise HTTPException(400, "The uploaded image is empty.")
    try:
        with tempfile.TemporaryDirectory(prefix="kiosk-ocr-") as work:
            folder = Path(work)
            variants = _prepare_ocr_variants(raw, folder, file.filename or ".jpg")
            text, engine = _recognize_local_variants(folder)
        flat_text = re.sub(r"\s+", " ", text).strip()
        account_match = re.search(r"\b(?:account|a\s*/\s*c)\s*(?:no\.?|number|#|id)\b(.*?)(?=\b(?:customer\s*name|s\s*/\s*d\s*/\s*w\s*/\s*h|address|phone|branch|date|email)\b|$)", flat_text, re.I)
        account_groups = re.findall(r"(?<!\d)\d{8,18}(?!\d)", account_match.group(1)) if account_match else []
        account_digits = list(dict.fromkeys(account_groups))
        if not account_digits and account_match:
            joined = re.sub(r"\D", "", account_match.group(1))
            if 8 <= len(joined) <= 18:
                account_digits = [joined]
        if len(account_digits) > 1 and re.search(r"\bcif\s*(?:no\.?|number)\b", flat_text, re.I):
            account_id = account_digits[-1]
        elif account_digits:
            account_id = account_digits[0]
        else:
            account_candidates = list(dict.fromkeys(re.findall(r"(?<!\d)\d{8,18}(?!\d)", flat_text)))
            account_id = account_candidates[0] if len(account_candidates) == 1 else ""

        def labelled_value(pattern: str, stops: str, max_words: int = 6) -> str:
            match = re.search(pattern + r"\s*[:\-]?\s*(.*?)(?=\b(?:" + stops + r")\b|$)", flat_text, re.I)
            if not match:
                return ""
            tokens = re.findall(r"[A-Za-z][A-Za-z.'-]*", match.group(1))
            return " ".join(tokens[:max_words]).strip(" .-'")

        # Deliberately expose only the account number. All other customer/account fields
        # must be fetched from SQLite after the user confirms this exact key.
        if account_id:
            notice = "Account number extracted locally. Confirm the digits; all other details will come from the matching SQLite demo record."
        else:
            notice = "No account number could be read confidently. Try a clearer photo or type the number manually. No other details were extracted for lookup."
        return {"engine": engine, "fields": {
            "account_id": {"value": account_id, "confidence": "review" if account_id else "uncertain"}},
            "quality": {"attempts": len(variants), "orientations": [0, 90, 180, 270], "local_only": True}, "notice": notice}
    except HTTPException:
        raise
    except Exception as exc:
        return {"engine": "local OCR unavailable", "text": "", "fields": {
            "name": {"value": "", "confidence": "unavailable"},
            "account_id": {"value": "", "confidence": "unavailable"},
            "branch": {"value": "", "confidence": "unavailable"}},
            "quality": {"attempts": 0, "local_only": True},
            "notice": f"Local OCR could not process this image ({type(exc).__name__}). Confirm details manually; no image was sent externally."}

def _intent_from_model(text: str, language: str) -> dict | None:
    """Use Gemini for flexible Hindi/English intent parsing.

    The model classifies only the requested form. It cannot trigger a real transaction,
    look up accounts, or invent an amount. Missing/invalid model output falls back safely.
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None
    model = os.getenv("GEMINI_INTENT_MODEL", "gemini-2.5-flash").strip() or "gemini-2.5-flash"
    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    system_prompt = (
        "You classify a customer's spoken banking request for a demo form-preparation kiosk. "
        "Understand ordinary everyday language, Hindi in Devanagari or Romanized Hindi, English, "
        "and mixed Hindi-English. Classify only into withdrawal, deposit, greeting, unsupported, "
        "or unclear. Withdrawal includes taking out cash, receiving pension, or asking for money "
        "from one's account. Deposit means putting cash/money into an account. Do not infer a "
        "transaction from unrelated small talk. If two intents conflict or the request is not clear, "
        "choose unclear. Never guess an amount: return amount only when the user explicitly states "
        "a numeric amount or an unambiguous amount in words; otherwise use empty string. Do not "
        "interpret account numbers, dates, ages, phone numbers, or unrelated numbers as amounts. "
        "This is only for preparing a paper draft; no money is moved. Return ONLY valid JSON with "
        "keys intent, transaction, confidence, amount, message. intent must be one of the allowed "
        "labels. confidence must be high, medium, or low. transaction is cash withdrawal, pension "
        "withdrawal, deposit, or empty. amount is a plain numeric string or empty. message is short."
    )
    payload = {
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "contents": [{"role": "user", "parts": [{"text": json.dumps({"text": text, "language_hint": language}, ensure_ascii=False)}]}],
        "generationConfig": {"temperature": 0, "responseMimeType": "application/json"},
    }
    request = urlrequest.Request(
        endpoint,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlrequest.urlopen(request, timeout=12) as response:
            body = json.loads(response.read(1024 * 1024).decode("utf-8"))
        content = "".join(part.get("text", "") for part in body["candidates"][0]["content"]["parts"])
        parsed = json.loads(content)
        allowed = {"withdrawal", "deposit", "greeting", "unsupported", "unclear"}
        label = parsed.get("intent")
        if label not in allowed:
            return None
        confidence = parsed.get("confidence", "low")
        if confidence not in {"high", "medium", "low"}:
            confidence = "low"
        amount = str(parsed.get("amount") or "").strip().replace(",", "")
        if amount and not re.fullmatch(r"\d{1,7}(?:\.\d{1,2})?", amount):
            amount = ""
        # A low-confidence financial classification must not auto-select a form.
        if label in {"withdrawal", "deposit"} and confidence == "low":
            label = "unclear"
            amount = ""
        transaction = parsed.get("transaction", "")
        if label == "withdrawal":
            transaction = "pension withdrawal" if transaction == "pension withdrawal" else "cash withdrawal"
        elif label == "deposit":
            transaction = "deposit"
        else:
            transaction = ""
        return {
            "intent": label,
            "transaction": transaction,
            "confidence": confidence,
            "amount": amount if label in {"withdrawal", "deposit"} else "",
            "message": str(parsed.get("message") or "")[:240],
            "engine": "llm",
        }
    except (urlerror.URLError, TimeoutError, OSError, ValueError, KeyError, TypeError, IndexError):
        # The deterministic classifier below remains available if the model is offline.
        return None


def _extract_explicit_amount(text: str) -> str:
    """Extract only amounts with a currency marker or an action/amount cue nearby."""
    s = re.sub(r"\s+", " ", text.lower()).strip()
    number = r"([0-9]{1,7}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)"
    patterns = [
        rf"(?:₹|rs\.?\s*|rupees?\s*|inr\s*){number}",
        rf"{number}\s*(?:rupees?|rs\.?|inr|रुपये|रुपए|रुपया|रुपयों)",
        rf"(?:withdraw|withdrawal|deposit|take out|put in|निकाल|जमा|कढ|ਕਢ|جمع|نکال)[^0-9]{{0,24}}{number}",
        rf"{number}[^0-9]{{0,16}}(?:withdraw|withdrawal|deposit|निकाल|जमा|कढ|ਕਢ|جمع|نکال)",
    ]
    for pattern in patterns:
        match = re.search(pattern, s, flags=re.IGNORECASE)
        if match:
            return match.group(1).replace(",", "")
    return ""


def _fallback_intent(text: str) -> dict:
    """Deterministic multilingual fallback; ambiguous requests never select a form."""
    s = re.sub(r"\s+", " ", text.lower()).strip()
    amount = _extract_explicit_amount(s)
    withdrawal_terms = [
        "withdraw", "withdrawal", "take out", "take some money", "get cash", "get some cash", "need cash", "cash out", "take a little money",
        "money out", "cash from my account", "give me cash", "get my pension", "receive my pension",
        "pension", "take my money", "cash please", "निकाल", "निकासी", "काढ", "पैसे काढ", "पैसे निकाल",
        "पैसा निकाल", "पैसे चाहिए", "पैसे चाहिये", "रुपये चाहिए", "रुपए चाहिए", "पेंशन", "कढ",
        "ਕਢ", "ਕਢਵ", "ਪੈਸੇ ਕਢ", "پیسے نکال", "رقم نکال", "واپسی", "paise nikal", "paisa nikal",
        "paise nikalne", "pension nikal", "pension leni", "paisa chahiye", "paise chahiye",
        "paise kadh", "cash kadh", "paisa kadhwana", "nikalna hai", "nikalwane hain",
    ]
    deposit_terms = [
        "deposit", "put money in", "add money", "pay into", "put cash", "cash in", "credit my account",
        "money into my account", "put it in my account", "save money in my account", "जमा", "डालना",
        "खाते में पैसे", "खाते में जमा", "पैसे जमा", "रुपये जमा", "जमा करव", "ਜਮ੍ਹਾ", "ਖਾਤੇ ਵਿੱਚ ਪੈਸੇ",
        "جمع", "پیسے جمع", "رقم جمع", "paise jama", "paisa jama", "jama karna", "jama karwane",
        "account mein paise dal", "khate mein paise dal", "paise bharne", "cash jama",
    ]
    greetings = ["hello", "hi", "hey", "namaste", "namaskar", "adaab", "sat sri akal", "नमस्ते", "नमस्कार", "ਸਤ ਸ੍ਰੀ ਅਕਾਲ", "آداب"]
    withdraw = any(w in s for w in withdrawal_terms)
    deposit = any(w in s for w in deposit_terms)
    pension = any(w in s for w in ["pension", "पेंशन", "پنشن", "ਪੈਨਸ਼ਨ", "पेन्शन"])
    if withdraw and deposit:
        return {"intent": "unclear", "confidence": "low", "amount": "", "message": "Do you want to withdraw money or deposit money?", "engine": "fallback"}
    if withdraw:
        return {"intent": "withdrawal", "transaction": "pension withdrawal" if pension else "cash withdrawal", "confidence": "medium", "amount": amount, "message": "Withdrawal request understood. The amount must be stated or entered explicitly.", "engine": "fallback"}
    if deposit:
        return {"intent": "deposit", "transaction": "deposit", "confidence": "medium", "amount": amount, "message": "Deposit request understood. The amount must be stated or entered explicitly.", "engine": "fallback"}
    if any(w in s for w in greetings):
        return {"intent": "greeting", "confidence": "high", "amount": "", "message": "Hello. Tell me what you would like to do with your account.", "engine": "fallback"}
    # Explicitly flag conflicting cues and unsupported account services rather than guessing.
    unsupported_terms = ["open an account", "account opening", "new account", "change my address", "update my details", "change phone", "aadhaar", "aadhar", "pan card", "check balance", "balance inquiry", "transfer money", "send money"]
    if any(w in s for w in unsupported_terms):
        return {"intent": "unsupported", "confidence": "medium", "amount": "", "message": "This kiosk currently prepares only withdrawal and deposit drafts. Please ask bank staff for this request.", "engine": "fallback"}
    return {"intent": "unclear", "confidence": "low", "amount": "", "message": "Please tell me whether you want to withdraw money or deposit money. You can speak naturally in Hindi or English.", "engine": "fallback"}


@app.post("/api/intent")
def intent(req: IntentRequest):
    text = re.sub(r"\s+", " ", req.text).strip()
    if not text:
        return {"intent": "unclear", "confidence": "low", "amount": "", "message": "Please tell me what you need.", "engine": "fallback"}
    result = _intent_from_model(text, req.language)
    # Prefer deterministic, phrase-matched support for common Hindi/Urdu/Punjabi
    # requests when the model returns an unclear result for an otherwise clear phrase.
    fallback = _fallback_intent(text)
    if result is None:
        return fallback
    # Deterministic phrase matches take precedence over model guesses for the two
    # supported tasks. This prevents clear Hindi / Punjabi / Urdu requests from
    # being rejected when the model is uncertain or labels them unsupported.
    if fallback.get("intent") in {"withdrawal", "deposit"}:
        return fallback
    if result.get("intent") in {"unclear", "greeting"} and fallback.get("intent") == "unsupported":
        return fallback
    return result

@app.post("/api/demo-profile/lookup")
def lookup(data: dict):
    account_id = str(data.get("account_id", ""))
    if not re.fullmatch(r"\d{8,18}", account_id):
        return {"status": "uncertain", "profile": None, "message": "Confirm an 8–18 digit account identifier first."}
    record = find_account(account_id)
    if record is None:
        return {"status": "not_found", "profile": None, "message": "No synthetic demo account matches that exact number. Check the digits or use one of the generated sample passbooks."}
    # Least-privilege response: return only fields used to populate the two supported forms.
    # Sensitive identity references and unrelated profile fields remain server-side.
    profile = {
        "account_id": record["account_number"], "name": record["full_name"],
        "phone": record["phone"], "branch": record["branch_name"], "balance": record["balance"]
    }
    return {"status": "matched", "profile": profile, "message": "Account matched. Required form fields are retrieved from the database without displaying a customer profile."}

@app.post("/api/forms/prepare")
def prepare(req: PrepareRequest):
    if req.transaction not in {"cash withdrawal", "pension withdrawal"}:
        raise HTTPException(422, "This MVP supports only cash or pension withdrawal drafts.")
    if not re.fullmatch(r"\d{1,7}(?:\.\d{1,2})?", req.amount) or float(req.amount) <= 0:
        raise HTTPException(422, "Enter a positive amount using digits, up to two decimal places.")
    if not re.fullmatch(r"\d{8,12}", req.account_id) or not req.name:
        raise HTTPException(422, "Enter a confirmed name and an 8–12 digit account number that fits the supplied slip.")
    record = find_account(req.account_id)
    if record is None:
        raise HTTPException(404, "No matching synthetic demo account was found. Check the account number and try again.")
    if req.name.strip() != record["full_name"] or req.phone != record["phone"]:
        raise HTTPException(422, "Confirm the customer name and phone number returned for this exact synthetic account.")
    if float(req.amount) > float(record["balance"]):
        raise HTTPException(409, detail={"code": "INSUFFICIENT_BALANCE", "balance": record["balance"]})
    if req.branch and req.branch != record["branch_name"]:
        raise HTTPException(422, "The branch does not match this account's synthetic database record.")
    if not req.name.isascii():
        raise HTTPException(422, "This PDF template supports English characters only. Enter the bank's English spelling; otherwise complete the name by hand on the printed draft.")
    if not req.confirmed:
        raise HTTPException(422, "Confirm transaction, amount, and customer details before preparing a draft.")
    return {"status": "ready_for_review", "transaction": req.transaction, "amount": req.amount, "name": record["full_name"], "account_id": record["account_number"], "phone": record["phone"], "branch": record["branch_name"], "date": date.today().isoformat(), "pdf_available": True,
            "message": "Review details. The attached SBI withdrawal slip template is used for the draft; verify all values and fill signature by hand."}

def _pdf_literal(value: str) -> str:
    # Built-in Helvetica is used to keep this dependency-free; non-ASCII must be reviewed/handwritten.
    ascii_value = value.encode("ascii", "replace").decode("ascii")
    return ascii_value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _jpeg_info(data: bytes) -> tuple[int, int, str]:
    """Read JPEG frame dimensions/color components without raster dependencies."""
    if not data.startswith(b"\xff\xd8"):
        raise ValueError("Sample template must be a JPEG image.")
    i = 2
    sof_markers = {0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF}
    while i + 4 < len(data):
        if data[i] != 0xFF:
            i += 1
            continue
        while i < len(data) and data[i] == 0xFF:
            i += 1
        if i >= len(data):
            break
        marker = data[i]
        i += 1
        if marker in {0xD8, 0xD9} or 0xD0 <= marker <= 0xD7:
            continue
        if i + 2 > len(data):
            break
        segment_len = int.from_bytes(data[i:i+2], "big")
        if marker in sof_markers and i + 9 <= len(data):
            height = int.from_bytes(data[i+3:i+5], "big")
            width = int.from_bytes(data[i+5:i+7], "big")
            components = data[i+7]
            color_space = {1: "/DeviceGray", 3: "/DeviceRGB", 4: "/DeviceCMYK"}.get(components)
            if width and height and color_space:
                return width, height, color_space
        if segment_len < 2:
            break
        i += segment_len
    raise ValueError("Could not read the supplied JPEG dimensions.")

def _amount_words(value: str) -> str:
    small = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"]
    tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]
    def under_thousand(n: int) -> str:
        words = []
        if n >= 100:
            words.extend([small[n // 100], "hundred"]); n %= 100
        if n >= 20:
            words.append(tens[n // 10]); n %= 10
        if n:
            words.append(small[n])
        return " ".join(words)
    n = int(float(value)); parts = []
    for divisor, label in [(10000000, "crore"), (100000, "lakh"), (1000, "thousand")]:
        if n >= divisor:
            q, n = divmod(n, divisor); parts.extend([under_thousand(q), label])
    if n:
        parts.append(under_thousand(n))
    result = " ".join(parts) or "zero"
    paise = round((float(value) - int(float(value))) * 100)
    result += " rupees"
    if paise:
        result += " and " + under_thousand(paise) + " paise"
    return result + " only"

def _withdrawal_pdf(req: PrepareRequest, include_counter_page: bool = False) -> bytes:
    if not req.confirmed or req.transaction not in {"cash withdrawal", "pension withdrawal"} or not re.fullmatch(r"\d{1,7}(?:\.\d{1,2})?", req.amount) or float(req.amount) <= 0 or not req.name or not re.fullmatch(r"\d{8,12}", req.account_id):
        raise HTTPException(422, "Confirm the supported transaction, positive amount, name, and 8–12 digit account number first.")
    record = find_account(req.account_id)
    if record is None:
        raise HTTPException(404, "No matching synthetic demo account was found. Check the account number and try again.")
    if req.name.strip() != record["full_name"] or req.phone != record["phone"]:
        raise HTTPException(422, "The name and phone number must match the confirmed SQLite account record.")
    if float(req.amount) > float(record["balance"]):
        raise HTTPException(409, detail={"code": "INSUFFICIENT_BALANCE", "balance": record["balance"]})
    if not req.name.isascii():
        raise HTTPException(422, "This PDF template supports English characters only. Enter the bank's English spelling; otherwise complete the name by hand on the printed draft.")
    if not re.fullmatch(r"\d{10}", req.phone):
        raise HTTPException(422, "The sample withdrawal form needs a confirmed 10-digit phone number from the matched database record.")
    # The supplied blank form and all insertion coordinates are configured in field_mappings.json.
    page = WITHDRAWAL_MAP["page"]
    jpg = (ROOT / WITHDRAWAL_MAP["template"]).read_bytes()
    image_width, image_height, _ = _jpeg_info(jpg)
    amount = f"{float(req.amount):,.2f}"
    values = {"name": req.name, "date": date.today().strftime("%d/%m/%Y"), "amount_figures": amount,
              "amount_words": _amount_words(req.amount), "draft_label": "DRAFT"}
    stream = bytearray(f"q\n{page['width']} 0 0 {page['height']} 0 0 cm\n/Im0 Do\nQ\n".encode("ascii"))
    for field, value in values.items():
        spec = WITHDRAWAL_MAP["text_fields"][field]
        stream.extend(f"BT /F1 {spec['font_size']} Tf {spec['x']} {spec['y']} Td ({_pdf_literal(value)}) Tj ET\n".encode("ascii"))
    for field, value in (("account_id", req.account_id), ("phone", req.phone)):
        spec = WITHDRAWAL_MAP["digit_fields"][field]
        if len(value) > spec["cells"]:
            raise HTTPException(422, f"The {field.replace('_', ' ')} does not fit the supplied blank form.")
        for index, digit in enumerate(value):
            x = spec["first_digit_x"] + index * spec["step_x"]
            stream.extend(f"BT /F1 {spec['font_size']} Tf {x:.1f} {spec['baseline_y']} Td ({digit}) Tj ET\n".encode("ascii"))
    objects = [b"<< /Type /Catalog /Pages 2 0 R >>",
               b"<< /Type /Pages /Kids [3 0 R 7 0 R] /Count 2 >>" if include_counter_page else b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
               f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {page['width']} {page['height']}] /Resources << /XObject << /Im0 4 0 R >> /Font << /F1 5 0 R >> >> /Contents 6 0 R >>".encode("ascii"),
               b"<< /Type /XObject /Subtype /Image /Width " + str(image_width).encode() + b" /Height " + str(image_height).encode() + b" /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + str(len(jpg)).encode() + b" >>\nstream\n" + jpg + b"\nendstream",
               b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
               b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + bytes(stream) + b"endstream"]
    if include_counter_page:
        counter_stream = ("BT /F1 24 Tf 72 690 Td (NEXT STEP: COUNTER 1) Tj ET\n"
                          "BT /F1 14 Tf 72 645 Td (Take the printed draft to Counter 1 for withdrawal/deposit staff.) Tj ET\n"
                          "BT /F1 12 Tf 72 615 Td (This is a synthetic demo form. No bank transaction has occurred.) Tj ET\n").encode("ascii")
        objects.extend([b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 8 0 R >>",
                        b"<< /Length " + str(len(counter_stream)).encode() + b" >>\nstream\n" + counter_stream + b"endstream"])
    out = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"); offsets = [0]
    for idx, obj in enumerate(objects, 1):
        offsets.append(len(out)); out.extend(f"{idx} 0 obj\n".encode()); out.extend(obj); out.extend(b"\nendobj\n")
    xref = len(out); out.extend(f"xref\n0 {len(offsets)}\n0000000000 65535 f \n".encode())
    for off in offsets[1:]: out.extend(f"{off:010d} 00000 n \n".encode())
    out.extend(f"trailer\n<< /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF".encode())
    return bytes(out)

@app.post("/api/forms/pdf")
def create_pdf(req: PrepareRequest):
    return Response(content=_withdrawal_pdf(req, include_counter_page=True), media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=withdrawal-draft.pdf"})


def _blank_withdrawal_pdf() -> bytes:
    """Embed the untouched, supplied blank form at its calibrated page dimensions."""
    page = WITHDRAWAL_MAP["page"]
    jpg = (ROOT / WITHDRAWAL_MAP["template"]).read_bytes()
    image_width, image_height, _ = _jpeg_info(jpg)
    stream = f"q\n{page['width']} 0 0 {page['height']} 0 0 cm\n/Im0 Do\nQ\n".encode("ascii")
    objects = [b"<< /Type /Catalog /Pages 2 0 R >>",
               b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
               f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {page['width']} {page['height']}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>".encode("ascii"),
               b"<< /Type /XObject /Subtype /Image /Width " + str(image_width).encode() + b" /Height " + str(image_height).encode() + b" /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + str(len(jpg)).encode() + b" >>\nstream\n" + jpg + b"\nendstream",
               b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"endstream"]
    out = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"); offsets = [0]
    for index, obj in enumerate(objects, 1):
        offsets.append(len(out)); out.extend(f"{index} 0 obj\n".encode()); out.extend(obj); out.extend(b"\nendobj\n")
    xref = len(out); out.extend(f"xref\n0 {len(offsets)}\n0000000000 65535 f \n".encode())
    for offset in offsets[1:]: out.extend(f"{offset:010d} 00000 n \n".encode())
    out.extend(f"trailer\n<< /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF".encode())
    return bytes(out)


@app.get("/api/forms/templates/withdrawal")
def download_blank_withdrawal_template():
    return Response(content=_blank_withdrawal_pdf(), media_type="application/pdf",
                    headers={"Content-Disposition": "attachment; filename=synthetic-demo-withdrawal-blank.pdf"})

def _sample_template_pdf(path: Path, overlays: dict[str, str] | None = None, form_id: str = "", include_counter_page: bool = False) -> bytes:
    jpg = path.read_bytes()
    image_width, image_height, color_space = _jpeg_info(jpg)
    page_spec = MAPPING_CONFIG.get("sample_forms", {}).get(form_id, {}).get("page", {"width": image_width, "height": image_height})
    width, height = page_spec["width"], page_spec["height"]
    stream = bytearray(f"q\n{width} 0 0 {height} 0 0 cm\n/Im0 Do\nQ\n".encode("ascii"))
    for key, value in (overlays or {}).items():
        mapping = FORM_FIELD_MAP.get(form_id, {}).get(key)
        value = re.sub(r"[\r\n\t]+", " ", str(value)).strip()
        if not mapping or not value:
            continue
        x, y, base_size, max_width = mapping
        size = min(base_size, max(5, max_width / max(1, len(value) * 0.55)))
        stream.extend(f"BT /F1 {size:.1f} Tf {x} {y} Td ({_pdf_literal(value)}) Tj ET\n".encode("ascii"))
    for key, spec in FORM_DIGIT_MAP.get(form_id, {}).items():
        value = re.sub(r"\D", "", str((overlays or {}).get(key, "")))
        if len(value) > spec["cells"]:
            raise HTTPException(422, f"The {key.replace('_', ' ')} does not fit the supplied form's digit cells.")
        for index, digit in enumerate(value):
            x = spec["first_digit_x"] + index * spec["step_x"]
            stream.extend(f"BT /F1 {spec['font_size']} Tf {x:.1f} {spec['baseline_y']} Td ({digit}) Tj ET\n".encode("ascii"))
    for key, spec in FORM_CELL_TEXT_MAP.get(form_id, {}).items():
        value = str((overlays or {}).get(key, "")).strip()
        pieces = value.split()
        parts = {"first": pieces[0] if pieces else "", "middle": " ".join(pieces[1:-1]), "last": pieces[-1] if len(pieces) > 1 else ""}
        for segment in spec.get("segments", []):
            text_value = parts.get(segment["part"], "")
            if len(text_value) > segment["cells"]:
                raise HTTPException(422, f"The {key.replace('_', ' ')} does not fit the supplied form's character cells.")
            for index, char in enumerate(text_value):
                if not char.isascii() or not (char.isalnum() or char in " .'-"):
                    continue
                x = segment["first_digit_x"] + index * segment["step_x"]
                stream.extend(f"BT /F1 {segment['font_size']} Tf {x:.1f} {segment['baseline_y']} Td ({_pdf_literal(char)}) Tj ET\n".encode("ascii"))
    for field, choices in FORM_CHECK_MAP.get(form_id, {}).items():
        request_text = str((overlays or {}).get(field, "")).lower().replace("aadhaar card", "aadhaar")
        for choice, (x, y) in choices.items():
            if choice in request_text:
                stream.extend(f"q 1.1 w {x} {y} m {x+10} {y+10} l {x+10} {y} m {x} {y+10} l S Q\n".encode("ascii"))
    objects = [b"<< /Type /Catalog /Pages 2 0 R >>",
               b"<< /Type /Pages /Kids [3 0 R 7 0 R] /Count 2 >>" if include_counter_page else b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
               f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {width} {height}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 6 0 R >>".encode("ascii"),
               b"<< /Type /XObject /Subtype /Image /Width " + str(image_width).encode() + b" /Height " + str(image_height).encode() + b" /ColorSpace " + color_space.encode() + b" /BitsPerComponent 8 /Filter /DCTDecode /Length " + str(len(jpg)).encode() + b" >>\nstream\n" + jpg + b"\nendstream",
               b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
               b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + bytes(stream) + b"endstream"]
    # Page resources require both the raster form and the standard font used by overlays.
    objects[2] = f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {width} {height}] /Resources << /XObject << /Im0 4 0 R >> /Font << /F1 5 0 R >> >> /Contents 6 0 R >>".encode("ascii")
    if include_counter_page:
        counter_stream = ("BT /F1 24 Tf 72 690 Td (NEXT STEP: COUNTER 1) Tj ET\n"
                          "BT /F1 14 Tf 72 645 Td (Take the printed draft to Counter 1 for withdrawal/deposit staff.) Tj ET\n"
                          "BT /F1 12 Tf 72 615 Td (This is a synthetic demo form. No bank transaction has occurred.) Tj ET\n").encode("ascii")
        objects.extend([b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 8 0 R >>",
                        b"<< /Length " + str(len(counter_stream)).encode() + b" >>\nstream\n" + counter_stream + b"endstream"])
    out = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"); offsets = [0]
    for idx, obj in enumerate(objects, 1):
        offsets.append(len(out)); out.extend(f"{idx} 0 obj\n".encode()); out.extend(obj); out.extend(b"\nendobj\n")
    xref = len(out); out.extend(f"xref\n0 {len(offsets)}\n0000000000 65535 f \n".encode())
    for off in offsets[1:]: out.extend(f"{off:010d} 00000 n \n".encode())
    out.extend(f"trailer\n<< /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF".encode())
    return bytes(out)

def _blank_template_pdf(path: Path) -> bytes:
    return _sample_template_pdf(path)

@app.get("/api/forms/templates/{form_id}")
def download_blank_template(form_id: str):
    template = FORM_TEMPLATES.get(form_id)
    if not template:
        raise HTTPException(404, "No supplied sample template exists for that form.")
    path, filename = template
    return Response(content=_blank_template_pdf(path), media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{filename}"'})

def _render_sample_pdf(req: SampleFormRequest, include_counter_page: bool = False) -> tuple[bytes, str]:
    template = FORM_TEMPLATES.get(req.form_id)
    allowed_fields = FORM_ALLOWED_FIELDS.get(req.form_id)
    if not template or not allowed_fields:
        raise HTTPException(404, "No synthetic sample form exists for that selection.")
    if not req.confirmed:
        raise HTTPException(422, "Review and confirm the displayed values before preparing the draft.")
    if set(req.fields) - set(allowed_fields):
        raise HTTPException(422, "The selected form contains an unsupported field.")
    for key, value in req.fields.items():
        if len(value) > 80 or any(ord(char) < 32 for char in value):
            raise HTTPException(422, "Review the field values; each value must be 80 characters or fewer.")
        if value and not value.isascii():
            raise HTTPException(422, "This sample PDF supports English characters only. Use the bank's English spelling or complete the field by hand.")
    account = req.fields.get("account", "").strip()
    if account and not re.fullmatch(r"\d{8,18}", account):
        raise HTTPException(422, "Confirm an 8–18 digit account number before preparing the form.")
    amount = req.fields.get("amount", "").strip()
    if amount and not re.fullmatch(r"\d{1,9}(?:\.\d{1,2})?", amount):
        raise HTTPException(422, "Enter an amount using digits and up to two decimal places.")
    for key, spec in FORM_DIGIT_MAP.get(req.form_id, {}).items():
        digits = re.sub(r"\D", "", req.fields.get(key, ""))
        if len(digits) > spec["cells"]:
            raise HTTPException(422, f"The {key.replace('_', ' ')} does not fit the form's digit cells.")
    path, filename = template
    return _sample_template_pdf(path, req.fields, req.form_id, include_counter_page=include_counter_page), filename.replace(".pdf", "-draft.pdf")

@app.post("/api/forms/sample-preview")
def preview_sample_form_pdf(req: SampleFormRequest):
    content, filename = _render_sample_pdf(req)
    return Response(content=content, media_type="application/pdf", headers={"Content-Disposition": f'inline; filename="{filename}"'})

@app.post("/api/forms/sample-pdf")
def create_sample_form_pdf(req: SampleFormRequest):
    content, filename = _render_sample_pdf(req, include_counter_page=True)
    return Response(content=content, media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{filename}"'})

@app.post("/api/forms/withdrawal-preview")
def preview_withdrawal_form(req: PrepareRequest):
    return Response(content=_withdrawal_pdf(req), media_type="application/pdf", headers={"Content-Disposition": 'inline; filename="withdrawal-draft-preview.pdf"'})

@app.get("/api/counters")
def counters():
    directory = ROOT / "data" / "counter_directory.json"
    if not directory.exists():
        raise HTTPException(500, "The synthetic counter directory is missing.")
    return json.loads(directory.read_text(encoding="utf-8"))

@app.post("/api/session/clear")
def clear_session():
    return {"status": "cleared", "message": "No session details or uploaded images are retained by this MVP."}
