# Sahaj Demo Banking Assistance Kiosk

**Synthetic software demo only.** This project is not connected to a real bank. All customer records and documents are fictional. The Aadhaar-style and PAN-style cards are conspicuously labelled synthetic mockups, not valid government documents or identity credentials. No real identity credentials are created or verified. Never use this demo for real transactions or KYC.

## What this build contains

- FastAPI backend and local SQLite database.
- 60 fictional customers and 60 linked accounts with unique 12-digit account numbers.
- 120 synthetic identification references (DEMO-ID and DEMO-PAN-like values) and 180 illustrative demo transactions.
- 60 high-resolution synthetic passbooks with 10 account-number layouts and 0°/90°/180°/270° orientations, 60 synthetic Aadhaar-style mockups, 60 synthetic PAN-style mockups, and 60 legacy demo ID cards. Every requested document set maps to a customer/account record.
- The kiosk UI offers only Withdrawal and Deposit forms. Account opening, transfers, customer-detail updates, and identity-document workflows are removed because they require additional information or sensitive handling.
- Sample flow: choose a supplied passbook -> read the account number -> user confirms the account number -> exact SQLite lookup in the background -> choose Withdrawal or Deposit -> required account-holder fields are filled automatically -> enter only the transaction amount -> preview/download the PDF draft -> simulated Counter 3 handoff. No customer-profile summary or Aadhaar/PAN details are displayed.
- The database may retain synthetic identity references for internal test data, but the lookup API does not return them to the UI.

## Start on Windows

1. Extract the ZIP to a folder you can write to.
2. Double-click `START_KIOSK.bat`.
3. Wait for the backend to start. It opens `http://127.0.0.1:8766` in your browser.
4. The first run installs Python dependencies. Internet access is needed for that install.

You can also start manually from this folder:

```powershell
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8766
```

Health check: `http://127.0.0.1:8766/api/health`

## Dataset files

- `data/synthetic_banking.sqlite3` — canonical relational database.
- `data/exports/customers.csv`
- `data/exports/accounts.csv`
- `data/exports/synthetic_identifications.csv`
- `data/exports/demo_preferences.csv`
- `data/exports/demo_transactions.csv`
- `data/exports/account_customer_document_lookup.csv`
- `data/synthetic_dataset.json` and `data/synthetic_document_manifest.json`
- `static/synthetic_documents/passbooks/` — 60 passbooks.
- `static/synthetic_documents/demo_aadhaar_cards/` — 60 clearly labelled Aadhaar-style synthetic mockups (not Aadhaar).
- `static/synthetic_documents/demo_pan_cards/` — 60 clearly labelled PAN-style synthetic mockups (not PAN).
- `static/synthetic_documents/demo_id_cards/` — 60 legacy synthetic identity mockups.
- `GET /api/counters` — counter 1/2/3 service mapping for the simulated handoff.

The account number is the only OCR field used as the database lookup key. The other account details come from SQLite after the user confirms the extracted number. OCR is a suggestion, not proof of identity. A missing or uncertain field must be confirmed or left blank rather than invented.

## Rebuild generated data and templates

```powershell
python seed_demo.py
```

This regenerates the 60 linked profiles and documents, the clean form templates, and CSV exports. It does not connect to a real financial institution.

## Security and scope

- Do not enter real Aadhaar numbers, PINs, OTPs, passwords, CVVs, or real banking credentials.
- Keep the SQLite database on the backend. Use parameterized queries.
- Generated PDFs are draft forms only. The app does not submit forms or initiate transactions.

## Gemini natural-language and realtime voice

Sahaj uses the Google Gemini API for both flexible intent classification and live voice conversation. Create an API key in [Google AI Studio](https://aistudio.google.com/apikey), then put it in the server-side `.env` file:

```dotenv
GEMINI_API_KEY=your_key_here
GEMINI_INTENT_MODEL=gemini-3.6-flash
GEMINI_OCR_MODEL=gemini-3.6-flash
GEMINI_LIVE_MODEL=gemini-3.8-live
GEMINI_LIVE_VOICE=Kore
```

Restart `START_KIOSK.bat` after changing `.env`. The browser connects to the local FastAPI WebSocket proxy; the permanent Gemini API key is not sent to frontend JavaScript. Gemini Live handles streaming audio, spoken responses, and automatic end-of-turn detection. The intent endpoint classifies everyday English, Devanagari Hindi, romanized Hindi, and mixed Hindi-English into `withdrawal`, `deposit`, `greeting`, `unsupported`, or `unclear`. Low-confidence or conflicting financial requests are handled cautiously.

If Gemini is not configured or the model is unavailable, the kiosk retains its manual route and deterministic multilingual intent fallback. Model availability and quota depend on your Google AI Studio project. This prototype only prepares paper-form drafts; it does not connect to a bank or move money. Never speak PINs, OTPs, passwords, or other secrets.



### Voice behavior in this build

The voice screen asks for microphone permission, speaks the initial Hindi and English greeting using browser speech synthesis, then starts browser speech recognition. Recognized speech is passed to the kiosk intent endpoint (Gemini intent classification when configured, deterministic fallback otherwise). This avoids depending on the current Gemini Live WebSocket audio path for microphone transcription. Browser speech recognition requires a supported Chromium browser and may use the browser vendor's online recognition service.

## Latest preview and balance safeguards
- Completed-form preview automatically scrolls into view after it is generated.
- The signature guidance is a browser-only overlay and is not printed on the form. It is positioned separately for withdrawal and deposit previews; exact alignment should be checked in the target browser because embedded PDF viewers vary.
- Withdrawal amounts above the matched synthetic SQLite balance are rejected. The interface asks in the selected language whether the customer wants to see the current demo balance, then prompts for a lower amount.
- Downloaded withdrawal and deposit drafts include a separate second page directing the customer to Counter 3 for staff review. The form preview itself remains a single-page form without the instruction overlay.


## Language switching and voice recovery

- Manual mode includes a **Switch language** control on the current workflow screen. Changing the UI language returns to that same screen and keeps the selected passbook, account, form, and entered values.
- In Gemini Live mode, the spoken language can be changed conversationally. For example, “Keep the text in English but speak Hindi,” “Switch to Punjabi,” or “Switch back to English.” Display language and spoken language are independent preferences.
- If Gemini Live fails, the kiosk explains that browser-based speaking support is limited to Hindi and English, while preserving the bilingual Namaste/Hello greeting. The server logs upstream Live API error code/status/message for diagnosis. The fallback does not repeatedly reconnect Gemini when the Speak button is pressed.
- Stop listening cancels current browser speech and queued Gemini audio immediately. Speak resumes listening on the existing screen. Start over cancels active speech/audio before returning to the greeting.

## Language switching and Gemini diagnostics

- Say or type, for example, "मुझे स्क्रीन की भाषा पंजाबी करनी है", "screen in Hindi and speak English", "switch to Urdu". Hindi, English, Punjabi and Urdu work with or without Gemini. Names are understood in Roman, Devanagari, Gurmukhi and Urdu script.
- Browser-voice fallback uses `pa-Guru-IN` / `ur-PK` for listening. If the browser has no Punjabi or Urdu *voice* installed, the text is shown on screen instead of being spoken.
- If Gemini will not connect, open http://127.0.0.1:8766/api/voice/check and read the `problem` field. The kiosk terminal also prints Google's close code and reason.
- The proxy tries `GEMINI_LIVE_MODEL`, then `gemini-3.8-live`, `gemini-3.1-flash-live-preview`, `gemini-2.5-flash-native-audio-preview-12-2025`.
- The customer is addressed in gender-neutral respectful form ("आप ... सकते हैं").

## Voice fixes: amounts, screen language, interrupting Gemini

- **Amounts are read from the whole sentence.** Gemini's transcript of what the customer said arrives in small pieces (sometimes seconds apart, after Gemini has started answering). All pieces of one sentence are now kept together and re-read as a whole, so "1" + "0" + ",000 rupees" becomes 10,000. As a second safety net, if the transcript was still cut short, the screen is repaired from the amount Gemini itself speaks back ("ten thousand rupees") — only ever raising 10 → 10,000 style truncations, only for that same sentence, and never overriding a correction.
- **The screen follows the language being spoken.** Speaking Hindi (Devanagari or Roman) switches the screen to Hindi, English to English, and so on. Digits, "yes/no" and "rupees" never switch it. The screen stays fixed only after the customer explicitly asks for a screen language ("screen in Punjabi", "switch to English"); that lock is cleared when the session ends.
- **Talking over Gemini stops it.** While Gemini speaks, the mic is still held back to avoid echo, but if the customer's voice is clearly louder than echo, Gemini's audio is cut immediately and the customer's words (including the first ~0.5 s) are sent on. Tune `BARGE_IN_RMS` (default `0.045`) at the top of the Gemini section in `static/app.js`: raise it if Gemini cuts itself off on loud speakers, lower it if a quiet customer cannot interrupt. A headset or lower speaker volume makes interruption most reliable. This applies to Gemini Live; the browser-voice fallback still cannot be interrupted.


## Passbook-stage disconnect and counter announcement fix (v19)
- If Gemini Live expires while a passbook is being selected or processed, the fallback no longer replays the initial greeting or starts browser speech recognition over the passbook screen. The OCR and account lookup workflow can continue independently.
- The Gemini-failure status and greeting hint use the selected language instead of a Hindi/English mixed greeting. Browser recognition still depends on browser support; Brave may not provide reliable Web Speech recognition in every configuration. Test in Chrome as a comparison.
- The final counter instruction is spoken locally from the exact translated string rather than asking Gemini to generate it, preventing a response that says only a number.
- OCR remains in place: the deployed host needs Tesseract/Windows OCR or a configured Gemini API key for the vision fallback. QR lookup is not enabled because existing passbooks cannot be assumed to contain a bank-supported QR code.

## Voice fallback when Gemini Live cannot connect

Order of attempts for every customer utterance:

1. **Gemini Live** (streaming voice, as before).
2. **Browser speech recognition**, if the browser has a working one (Chrome, Edge, Safari).
3. **Server speech recognition**, used automatically when the browser has none (Brave, Firefox, kiosk browsers), when it never starts, or when it errors with `network` / `service-not-allowed`. The page records the microphone itself, detects end of speech, and POSTs a 16 kHz WAV to `/api/voice/transcribe`. The server tries Gemini (plain HTTPS), then Deepgram, then Groq/OpenAI Whisper, then local `faster-whisper` (reorder with `VOICE_STT_ORDER`).

Understanding the request (`/api/intent`) uses Gemini, then Groq/OpenAI if a key is set, and finally the built-in keyword classifier, so a withdrawal or deposit is still recognised with no model at all. Replies are spoken with the browser's speech synthesis and always shown on screen.

Setup: add any one of `GEMINI_API_KEY`, `DEEPGRAM_API_KEY`, `GROQ_API_KEY`, `OPENAI_API_KEY` or install `faster-whisper` (see `.env.example`). Check what is active at `/api/voice/fallback`. Tests: `python -m pytest test_voice_fallback.py`.

### "I didn't catch that" re-ask

If the customer says nothing for 6 seconds (on the home screen or at any question: what to do, amount, yes/no confirmation, balance), or the speech could not be understood, the kiosk says "I didn't catch that." followed by the same question again, in the customer's language. This works with Gemini Live, browser recognition and server recognition. It repeats up to 3 times in a row, then shows a hint to use the on-screen buttons and keeps listening quietly. Tune `SILENCE_REASK_MS` and `SILENCE_REASK_MAX` in `static/app.js`.


## Passbook OCR on Render (why it was slow or flaky, and what changed)

On a small hosted instance the old code could run 16+ Tesseract passes on a tiny CPU, or wait 40 s per Gemini model with no retry, and one transient Gemini 429/503 meant a failed read. Now (Linux/Render; the Windows kiosk keeps its Windows OCR):

- The browser shrinks the photo to about 1800 px JPEG before upload (3-8 MB becomes a few hundred KB), with a 50 s limit and one automatic retry on a server/backend error.
- The server has one overall time limit (`OCR_DEADLINE_SECONDS`, default 35). Engines run in order `gemini, vision-api, tesseract`; each only counts as a success if it actually returned an account number, otherwise the next one is tried.
- Gemini calls have a 14 s timeout and a quick retry on 429/5xx, then fall to the next model. Tesseract tries the upright image first and rotations only if needed.
- The same photo is cached for 10 minutes, so retrying it is instant.

Render checklist:
1. Set `GEMINI_API_KEY` in the service's Environment settings (the `.env` file is not deployed). Optionally add `GROQ_API_KEY` as a backup vision provider.
2. Free instances sleep after ~15 minutes idle, so the first request after a pause is slow (30-60 s). Use a paid instance, or an uptime pinger on `/api/health`, for a kiosk that must always respond.
3. Free instances have very little CPU: prefer Gemini first (the default). Tesseract there is only a backup. Deploy with the included Dockerfile if you want Tesseract available at all.
4. Run `python -m unittest test_passbook_ocr` to check the OCR chain.


## Rate limiting, project layout and tests

- `/api/voice/transcribe`, `/api/intent` and `/api/ocr/passbook` call paid APIs, so each client is limited to `RATE_LIMIT_PER_MIN` requests per minute per endpoint (default 60, `0` disables). Set `TRUST_PROXY=1` behind Render or another proxy (the Dockerfile already does). Over the limit the server answers `429` with a `Retry-After` header.
- Gemini model names live in `gemini_models.py` (override with `GEMINI_OCR_MODEL`, `GEMINI_INTENT_MODEL`, `GEMINI_STT_MODEL`).
- The browser code is split: `static/server-stt.js` (server speech recognition), `static/reask.js` ("I didn't catch that" re-ask) and `static/app.js` (everything else). They share one global scope and load in that order from `index.html`.
- The Docker image runs as a non-root user and has a health check on `/api/health`.
- Run tests with `pip install -r requirements-dev.txt` then `python -m pytest`.
