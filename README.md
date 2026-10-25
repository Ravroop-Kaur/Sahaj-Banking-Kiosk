# Sahaj Demo Banking Assistance Kiosk

**Synthetic software demo only.** This project is not connected to a real bank. All customer records and documents are fictional. The Aadhaar-style and PAN-style cards are conspicuously labelled synthetic mockups, not valid government documents or identity credentials. Never use this demo for real transactions or KYC, and never enter real Aadhaar numbers, PINs, OTPs, passwords, CVVs or banking credentials.

## What it does

A voice-first kiosk that helps a customer prepare a paper **Withdrawal** or **Deposit** form.

Flow: choose a passbook -> the account number is read (OCR) -> customer confirms it -> exact SQLite lookup -> choose Withdrawal or Deposit -> account-holder fields are filled automatically -> customer gives only the amount -> preview/download the PDF draft -> simulated Counter handoff.

- FastAPI backend and local SQLite database (60 fictional customers and linked accounts, 180 demo transactions).
- 60 synthetic passbooks (10 layouts, 4 orientations) plus Aadhaar-style, PAN-style and legacy ID mockups, each mapped to a customer/account.
- Account opening, transfers, customer-detail updates and identity workflows are intentionally not offered.
- Only the account number is used as the lookup key. OCR is a suggestion, not proof of identity; uncertain fields must be confirmed or left blank.
- The app never submits forms or moves money. Withdrawals above the matched demo balance are rejected, and the customer is offered the balance and asked for a lower amount.
- Downloaded drafts carry a second page directing the customer to Counter 3 for staff review. The on-screen preview stays a single page, and the signature guidance is a browser-only overlay (check alignment in the target browser, since PDF viewers vary).

## Quick start

**Windows:** extract the ZIP, double-click `START_KIOSK.bat`, wait for the browser to open `http://127.0.0.1:8766`. The first run installs dependencies (internet needed).

**Manual (any OS, Python 3.10+):**

```bash
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8766
```

Health check: `http://127.0.0.1:8766/api/health`. Docker: build the included `Dockerfile` (installs Tesseract, runs as a non-root user, has a health check).

## Configuration (`.env`)

Copy `.env.example` to `.env` and add a key from [Google AI Studio](https://aistudio.google.com/apikey). Restart after any change. The key stays on the server and is never sent to the browser.

```dotenv
GEMINI_API_KEY=your_key_here
GEMINI_INTENT_MODEL=gemini-3.6-flash
GEMINI_OCR_MODEL=gemini-3.6-flash
GEMINI_LIVE_MODEL=gemini-3.8-live
GEMINI_LIVE_VOICE=Kore
```

Model names are centralised in `gemini_models.py`. Everything else (STT providers, OCR order, rate limits) is documented in `.env.example`.

## Voice

### Gemini Live (primary)

The browser streams microphone audio to a local WebSocket proxy (`/api/voice/live`), which forwards it to Gemini Live. Gemini speaks the replies and detects end of turn. The proxy tries `GEMINI_LIVE_MODEL`, then any `GEMINI_LIVE_FALLBACK_MODELS`, then `gemini-3.8-live`, `gemini-3.1-flash-live-preview`, `gemini-2.5-flash-native-audio-preview-12-2025`.

**Text turns during a session (important).** The page sends text prompts mid-conversation (silence re-ask, language changes, balance prompt, "say this sentence"). Gemini 3.x Live models only accept a `clientContent` text turn at the very start of a session; later ones make Google close the session (code 1007) and the kiosk falls back to browser voice. `live_protocol.py` therefore forwards the opening greeting unchanged and converts every later text turn to `realtimeInput.text` for those models. The older `gemini-2.5-*native-audio*` models keep the original message. When Google closes a session, the terminal logs the close code and the last messages the browser sent.

**Behaviour**
- Languages: Hindi, English, Punjabi, Urdu (screen language and spoken language are independent). Say e.g. "screen in Hindi and speak English" or "switch to Urdu". The screen follows the language being spoken, except after an explicit screen-language request (cleared when the session ends).
- Replies address the customer in gender-neutral respectful form.
- **Choosing a passbook by voice:** on the passbook screen the customer can say the number or position in Hindi, English, Punjabi or Urdu, e.g. "third one", "passbook number 3", "तीसरी", "teesri wali", "ਤੀਜੀ", "تیسری". The kiosk picks that card itself (the noun "passbook"/"passport" is not needed, and the last number named wins). Gemini is told not to claim a selection, describe the form or mention signing until the kiosk sends the matching event.
- Amounts are read from the whole spoken sentence (transcript pieces are joined, so "1" + "0" + ",000 rupees" = 10,000). If a transcript was still cut short, the screen is corrected from the amount Gemini speaks back, only upwards and only for that same sentence.
- **Talking over Gemini:** while Gemini speaks the mic is held back to avoid echo, but if the customer's voice is clearly louder than the echo, Gemini is cut off and the customer's first words are sent on. Tune `BARGE_IN_RMS` (default `0.045`) and `BARGE_IN_FRAMES` in `static/app.js`: raise if Gemini cuts itself off on loud speakers, lower if a quiet customer cannot interrupt. A headset or lower volume helps. Barge-in is ignored for the first seconds after the greeting starts.
- **"I didn't catch that":** after 6 s of silence or unintelligible speech (on the home screen, at the amount, yes/no and balance questions, and on the passbook screen) the kiosk repeats the current question in the customer's language, up to 3 times, then shows an on-screen hint and keeps listening quietly. If there is still no speech, tap or key press for `IDLE_END_MS` (default 60 s, in `static/reask.js`) after that hint, the session ends and the start screen returns with a short "no response" message. Tune `SILENCE_REASK_MS` and `SILENCE_REASK_MAX` in `static/reask.js`.
- Stop listening cancels speech and queued audio immediately; Speak resumes; Start over cancels everything and returns to the greeting.
- The final counter instruction is spoken locally from the translated string, not generated by Gemini.

### Fallbacks when Gemini Live cannot connect

Tried in order for every utterance:

1. Gemini Live.
2. Browser speech recognition (Chrome, Edge, Safari).
3. Server speech recognition when the browser has none (Brave, Firefox, kiosk browsers) or it errors: the page records 16 kHz WAV and POSTs it to `/api/voice/transcribe`. Engines: Gemini, Deepgram, Groq/OpenAI Whisper, local `faster-whisper` (reorder with `VOICE_STT_ORDER`).

Intent understanding (`/api/intent`) uses Gemini, then Groq/OpenAI if keyed, then a built-in multilingual keyword classifier, so withdraw/deposit still work with no model. Replies are spoken with browser speech synthesis (limited to Hindi and English on most browsers; if no Punjabi/Urdu voice is installed the text is shown instead) and always shown on screen. The browser-voice greeting is spoken in Hindi, then English. If the browser/OS has no Hindi voice installed, the Hindi line is read in Roman letters ("Namaste! Main aapki kaise madad kar sakti hoon?") by the Indian-English voice; for proper Hindi speech install a Hindi voice (Windows: Settings > Time & language > Speech > Add voices > Hindi; Chrome also offers an online "Google हिन्दी" voice). Later Hindi replies in this mode still need a real Hindi voice. If Live fails during passbook selection, the fallback does not replay the greeting or start recognition over that screen.

Check what is active at `/api/voice/fallback`.

### Diagnosing Gemini problems

- Open `http://127.0.0.1:8766/api/voice/check` and read the `problem` field.
- Watch the kiosk terminal for `[Gemini Live] Google closed the session: code=... reason=...; last browser messages: ...`.
- A small developer badge (bottom-left) shows `voice: live` or the fallback reason. Set `SHOW_DEV_BADGE=false` in `static/app.js` to hide it. Add `?debug` to the URL for on-screen diagnostics.

## Passbook OCR

Engines run in order `gemini, vision-api, tesseract` (`OCR_ORDER`); an engine only counts if it actually returned an account number. The browser shrinks photos to about 1800 px JPEG before upload, with a 50 s limit and one retry. The server has an overall limit (`OCR_DEADLINE_SECONDS`, default 35), Gemini calls time out at 14 s with a quick retry on 429/5xx, and the same photo is cached for 10 minutes. On Windows the kiosk uses Windows OCR. QR lookup is not enabled because existing passbooks cannot be assumed to carry a bank QR code.

**Hosting (e.g. Render):** set `GEMINI_API_KEY` in the service environment (`.env` is not deployed); optionally add `GROQ_API_KEY` as a backup vision provider. Free instances sleep after ~15 min idle (first request 30-60 s) and have little CPU, so Gemini is the default and Tesseract only a backup; use the Dockerfile if you want Tesseract. Set `TRUST_PROXY=1` behind a proxy (the Dockerfile does).

## Rate limiting

`/api/voice/transcribe`, `/api/intent` and `/api/ocr/passbook` call paid APIs, so each client is limited to `RATE_LIMIT_PER_MIN` requests per minute per endpoint (default 60, `0` disables). Over the limit the server answers `429` with `Retry-After`.

## Data and regeneration

- `data/synthetic_banking.sqlite3` is the canonical database; CSV exports are in `data/exports/`; `data/synthetic_dataset.json` and `data/synthetic_document_manifest.json` describe the dataset.
- Documents: `static/synthetic_documents/` (`passbooks/`, `demo_aadhaar_cards/`, `demo_pan_cards/`, `demo_id_cards/`).
- `GET /api/counters` returns the Counter 1/2/3 mapping for the simulated handoff.
- Regenerate profiles, documents, clean form templates and exports with `python seed_demo.py` (never touches a real institution).
- The SQLite file may hold synthetic identity references for test data; the lookup API does not return them to the UI. Use parameterized queries only.

## Project layout

| Path | Purpose |
|---|---|
| `main.py` | FastAPI app: API, PDF generation, Live WebSocket proxy |
| `live_protocol.py` | Adapts the page's Gemini messages to each Live model family |
| `voice_fallback.py`, `gemini_models.py`, `passbook_ocr.py`, `ratelimit.py`, `demo_database.py` | Voice STT chain, model names, OCR chain, rate limiter, demo DB |
| `static/app.js`, `static/reask.js`, `static/server-stt.js` | Browser code (one shared global scope, loaded in this order from `index.html`: `server-stt.js`, `reask.js`, `app.js`) |
| `scripts/` | Dataset, document and form generators |

## Tests

```bash
pip install -r requirements-dev.txt
python -m pytest
```

`test_live_protocol.py`, `test_voice_fallback.py` and `test_passbook_ocr.py` also run with plain `python -m unittest` and no extra packages.
