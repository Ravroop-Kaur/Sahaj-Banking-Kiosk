# Sahaj Demo Banking Assistance Kiosk

**Synthetic software demo only.** This project is not connected to a real bank. All customer records and documents are fictional. The Aadhaar-style and PAN-style cards are conspicuously labelled synthetic mockups, not valid government documents or identity credentials. No real identity credentials are created or verified. Never use this demo for real transactions or KYC.

## What this build contains

- FastAPI backend and local SQLite database.
- 60 fictional customers and 60 linked accounts with unique 12-digit account numbers.
- 120 synthetic identification references (DEMO-ID and DEMO-PAN-like values) and 180 illustrative demo transactions.
- 60 high-resolution synthetic passbooks with 10 account-number layouts and 0°/90°/180°/270° orientations, 60 synthetic Aadhaar-style mockups, 60 synthetic PAN-style mockups, and 60 legacy demo ID cards. Every requested document set maps to a customer/account record.
- Clean, original high-resolution Sahaj Demo Bank form templates for withdrawal, deposit, transfer, account opening, and customer updates. The UI groups these into Withdrawal, Deposit, and Other Form categories.
- OCR flow: upload passbook -> OCR account number only -> user confirms the account number -> exact SQLite lookup -> review the matching customer -> choose a form -> fill mapped fields from the matched record -> review an on-screen PDF preview, download the PDF draft, then automatically display the simulated Counter 3 handoff.
- Account-opening form fields include the linked synthetic ID/PAN-like references where those fields are available.
- Sarvam speech is optional. The app runs without a Sarvam API key; speech endpoints require a valid key.

## Start on Windows

1. Extract the ZIP to a folder you can write to.
2. Double-click `START_KIOSK.bat`.
3. Wait for the backend to start. It opens `http://127.0.0.1:8766` in your browser.
4. The first run installs Python dependencies. Internet access is needed for that install.
5. If using Sarvam speech, add your key to `.env` (copy `.env.example` first). Never share `.env` or commit it to Git.

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
- Sarvam API keys stay in `.env` on the backend; never put them in browser JavaScript.
- Generated PDFs are draft forms only. The app does not submit forms or initiate transactions.
