# Sahaj — Banking Made Simple
### Voice-first assistance for everyday banking paperwork

**Banking should begin with a conversation, not a confusing form.**

## The problem

Customers who prefer an Indian language or need help reading and writing can struggle with banking forms. Re-entering details already available in a passbook adds effort and increases the chance of mistakes. Staff must often guide customers through the same steps repeatedly.

## The solution

**Sahaj helps customers turn a spoken banking request into a printable form draft.** It guides withdrawal, deposit, and new savings-account application journeys through spoken instructions, document extraction, automatic prefill, and explicit customer confirmation. Large touch controls and keyboard input remain available when voice assistance cannot complete a step.

**Customer journey:** Speak a request → read the demo document → retrieve matching details → collect missing information → review and confirm → download, sign, and visit the indicated counter.

## How it works

A **Python/FastAPI backend** connects the kiosk interface, OCR, fictional **SQLite** account records, session access checks, and PDF generation. **Gnani Prisma STT and Timbre TTS adapters** provide the primary speech integration. Windows OCR/Tesseract extracts information from supplied synthetic samples. API keys remain on the server.

Withdrawal includes a fictional balance-eligibility check. New-account applications use a separate identity-document path and do not require an existing passbook. The current kiosk uses a single demo passbook; physical scanning is not enabled.

## Why Sahaj matters

- **Less repeated entry:** extraction and account-data retrieval prefill available details.
- **More accessible interaction:** spoken guidance, large amounts, readable review screens, and explicit yes/no confirmation.
- **Practical recovery:** repeat requests, limited retries, touch fallback, and session clearing.
- **A clear next step:** signing guidance and counter directions help customers complete the staff handoff.

## Validation and next steps

Automated checks cover consent, protected account access, document mismatch, withdrawal validation, session clearing, and draft generation. The V17 baseline passed **156 Python and 14 JavaScript tests**; affected V18 contract checks were rerun after the latest changes. Live Gnani audio evaluation, complete language consistency, and accessibility trials remain validation priorities.

**Demo scope:** Sahaj uses fictional records and synthetic documents. It prepares drafts; it does not move money, open accounts, complete official KYC, or access live bank/UIDAI systems. Production deployment requires authorised institutional integrations.

**The vision:** Help customers explain their banking needs in their own words and reach the counter prepared and confident.
