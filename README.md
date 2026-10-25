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
GEMINI_INTENT_MODEL=gemini-2.5-flash
GEMINI_LIVE_MODEL=models/gemini-2.5-flash-native-audio-preview-12-2025
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
