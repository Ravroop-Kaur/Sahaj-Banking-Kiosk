# Sahaj — Banking made simple

**Speak. Review. Sign.** Sahaj is a voice-first, multilingual banking paperwork assistant built as a project for the Great Indian Internship offered by Gnani AI.

It helps a customer prepare a withdrawal slip, deposit slip, or new savings-account application draft through spoken guidance and synthetic document extraction. Touch and keyboard controls are available when voice cannot complete a step.

> This is a synthetic demonstration. It does not move money, open bank accounts, perform official KYC, or connect to a live bank or UIDAI system. Use only the included fictional samples.

**[Read the one-page solution summary](SOLUTION.md)**

## The problem

Bank forms can be difficult for customers who are unfamiliar with banking terminology, prefer an Indian language, or need help reading and writing. A conventional form also makes the customer enter details that already exist in their passbook.

Sahaj guides the customer through one task at a time, extracts available information, requests missing details, and prepares a draft for bank staff to review.

## What the prototype supports

- **Withdrawal:** select the single demo passbook, extract and cross-check the account, retrieve the fictional profile, enter or speak an amount, review the details, and generate a withdrawal draft. A demo-balance check handles insufficient funds.
- **Deposit:** retrieve the fictional account details, collect the deposit amount, and generate a deposit-slip draft.
- **New-account application:** use synthetic identity and PAN samples to prepare an application draft. Unsupported document routes are directed to staff; official KYC remains a staff responsibility.
- **Voice interaction:** backend adapters for Gnani Prisma speech-to-text and Timbre text-to-speech, spoken confirmations, repeat requests, and recovery controls.
- **Accessible presentation:** large amounts and controls, English/Hindi service cards, a visible account review, signing guidance, and counter handoff after the download request.
- **Language controls:** screen and voice language can be selected separately. Regional-language coverage varies across screens and providers; full language parity is still a development task.
- **Session protection:** explicit demo consent, session-bound account access, rate limits, synthetic-document restrictions, and session clearing.

The current kiosk offers **Demo passbook** as its supported capture path. The physical scanner option is marked unavailable. Additional document images are retained as development fixtures rather than shown as a large customer-facing gallery.

## Run locally

### Windows

1. Install Python 3.10 or newer and enable **Add Python to PATH**.
2. Extract the entire project folder.
3. Copy `.env.example` to `.env` and add your own provider credentials locally.
4. Double-click `START_KIOSK.bat`. The first run installs dependencies and requires an internet connection.
5. Open **http://127.0.0.1:8766** if the browser does not open automatically. Keep the server window open.

Stop any older kiosk process using port 8766 before starting a new copy.

### Manual setup

```sh
python -m venv .venv
```

Activate the environment:

```powershell
# Windows PowerShell
.venv\Scripts\Activate.ps1
```

```sh
# macOS / Linux
source .venv/bin/activate
```

Then run:

```sh
python -m pip install -r requirements.txt
python run_kiosk.py
```

Local OCR needs Windows OCR or an installed Tesseract executable. Installing `pytesseract` alone does not install Tesseract. Microphone access requires browser permission and a supported secure context, such as localhost or HTTPS.

## Configure voice

Set these values in your private `.env`:

```dotenv
APP_MODE=demo
BANK_PROVIDER=demo
IDENTITY_PROVIDER=demo
PAYMENT_PROVIDER=demo
VOICE_PROVIDER=gnani
GNANI_API_KEY=your_key_here
```

See `.env.example` for optional model, voice, and fallback settings. Confirm the models, voices, languages, and quotas available to your Gnani account. Keys stay on the backend; **never commit `.env` or put credentials in browser JavaScript**.

Provider adapters are implemented, but configuration alone does not prove that a live speech request succeeded. Verify microphone input and playback using your own provisioned account before presenting the project.

## Suggested demo

1. Choose **Start with voice**, allow microphone access, and request a withdrawal. Touch controls are available through **Use touch or keyboard**.
2. At the passbook step, say **“Demo passbook”** or select the demo sample.
3. Speak or enter **₹500** when the amount is requested.
4. Review the displayed account holder, amount, and masked account reference. Confirm only when the details are correct.
5. Review the prepared form. Sign in the green box on the printed copy. The app requests an automatic download after the guidance; use the download button if your browser blocks it.
6. Follow the counter directions and end the session.

For a second demonstration, request an amount above the fictional balance to show the insufficient-funds path. New-account applications start through their own service option and do not require an existing passbook.

## How it works

```text
Microphone / touch input
        ↓
Speech transcription → service and workflow state
        ↓
Synthetic document OCR → exact demo-record cross-check
        ↓
Session access checks → missing-field collection
        ↓
Customer review and explicit confirmation
        ↓
PDF draft → signing guidance → download request → counter handoff
```

| Component | Implementation |
| --- | --- |
| Interface | HTML, CSS, JavaScript; accessible kiosk screens |
| Backend | Python and FastAPI |
| Primary speech adapters | Gnani Prisma STT and Timbre TTS |
| OCR | Windows OCR / Tesseract, with optional configured remote OCR |
| Fictional account storage | SQLite |
| Documents | Image-based PDF generation and mapped form fields |
| Provider separation | Demo identity, bank, payment, and voice interfaces |

## Repository guide

- `main.py` — application entry point, legacy form routes, OCR, and PDF generation.
- `app/` — session services, workflow requirements, access checks, and provider adapters.
- `app/kiosk.py` — synthetic kiosk document and application-draft routes.
- `static/` — kiosk screens, styles, voice controllers, and sample assets.
- `data/` — fictional records, sample configuration, and counter directory.
- `tests/` — backend and JavaScript regression checks.
- `.env.example` — configuration placeholders.
- `SOLUTION.md` — concise submission overview.

## Validation and current limits

Automated checks cover account access, consent, document mismatch, session clearing, withdrawal validation, form generation, and workflow contracts. The V17 baseline passed 156 Python and 14 JavaScript tests. After the V18 language and recovery changes, affected contract checks were updated and rerun; live microphone/Gnani audio was not verified in that patch.

Run the checks from the project root:

```sh
python -m pip install -r requirements-dev.txt
python -X utf8 -m pytest -q
node --test tests/voice-journey.test.cjs tests/v2-spec.test.cjs
```

Node.js is needed for the JavaScript tests only. Some existing frontend tests inspect source contracts; they do not replace browser or real-audio testing.

This prototype still needs live speech evaluation across accents and noise conditions, consistent translation of every supported screen, user accessibility testing, and production-grade deployment review. Physical scanning and live banking/identity integrations require separate implementation and authorised institutional access.
