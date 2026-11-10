> Historical reference from the supplied archive. Some UI behavior and test counts changed. Use the root README and REVIEW_NOTES for the current version.

# SAHAJ — Gnani AI Great Indian AI Internship Challenge submission guide

**Submission deadline: Tuesday 10 November 2026, 11:59 PM IST.** Official source: https://www.gnani.ai/internship

## 1. What you can credibly submit today

**Pitch:** SAHAJ is a voice-first, multilingual banking-assistance kiosk prototype for customers who struggle with printed banking forms. It understands a cash-deposit or cash-withdrawal request, reads an account number from a *synthetic* passbook, asks the customer to confirm details, prepares a paper-form PDF draft, and directs them to a simulated staff counter. **No real money moves; no real ID verification or bank connectivity occurs.**

**Gnani technologies actually wired in the project:** Prisma v3.0 speech-to-text REST (`/api/voice/transcribe`), Timbre v2.5 text-to-speech REST (`/api/voice/speak`). Fallbacks (Gemini/browser) exist and must be labelled honestly. Model use requires a working personal `GNANI_API_KEY`; this package has no credential and no live API verification. Refer to the actual request's `engine` and the server's `X-Voice-Provider` response before claiming that the demo uses Gnani audio.

**Implemented & test-covered:** FastAPI app, 60 fictional banking profiles, 60 synthetic passbooks in varied layouts plus six challenging photo examples, local/remote OCR engine routing, account confirmation, form preview/PDF, simulated counter handoff; multilingual display and voice code paths; modular providers, consent and transaction APIs. **Important distinction:** the customer-facing web page still uses its legacy flow; the newer consent/session/identity/transaction APIs have test coverage but are **not fully linked into the UI**. Identity and payment provider replacements are placeholders, not banking integrations.

**Regression test result:** `python -m pytest -q` -> **127 passed** in the packaged copy in the assistant's Python environment, with mocked API responses. This does not verify your live Gnani key, deployment or microphone/browser behavior.

**Local OCR baseline:** `OCR_BASELINE_LOCAL_TESSERACT.json` shows 6 of 6 synthetic challenge images read with the correct account number using Tesseract-only on a local Linux container. That is a small **synthetic demonstration set**, not a statistically valid real-world accuracy number. Quote it exactly if you use it; never say '100% accurate' without this qualifier.

## 2. Immediate priority order

| Priority | Action | Why it matters | How to verify |
|---|---|---|---|
| P0 | Add your valid `GNANI_API_KEY` in a local `.env` and verify **both** Hindi/Punjabi STT and at least one Timbre TTS response | The official challenge requires authentic Gnani model usage | `/api/voice/fallback` reports `primary=gnani`; browser network request returns `/api/voice/transcribe` with `engine=gnani`, and `/api/voice/speak` returns playable audio and `X-Voice-Provider: gnani` |
| P0 | Record an actual 45–60 second *working* end-to-end flow and show the real result | The short public video earns interest and proves it works | Play back your exported video, ensure no cuts conceal unworking steps |
| P0 | Publish on LinkedIn and/or X **before** final submission, using **both** mandatory hashtags, then nominate the URL in your submission | Verified public engagement determines interview shortlisting, separately from project-category awards | Check public visibility, link opens when signed out, hashtags are spelled correctly |
| P0 | Submit the written project description, Gnani models used, individual contributions, demo video and nominated public-post links **before 11:59 PM IST** | Eligibility is independent of quality | Confirm the submission succeeded; do not assume a LinkedIn post alone counts |
| P1 | Show helpful error handling: bad/blurred image -> re-capture; amount above synthetic balance -> safe warning; end session -> clean start | Demonstrates responsible real-world design | Record short supplementary clips or screenshots from real app behavior |
| P1 | Test on the *actual browser and microphone* used for the final demo, including Hindi and Punjabi | Mock tests are not end-to-end tests | See true Gnani `engine`, listen to TTS, confirm exact rupee amount |
| P2 | Connect consent/session APIs to the frontend and prevent demo-profile lookup without an authorized session | Needed for a credible future real-world product, but risky to rework on deadline day | Browser e2e with identity, consent, account lookup and session isolation |
| P2 | Add accessibility evaluation and calibrated OCR/voice benchmark with real consented users | Turns an impressive prototype into measurable research | Report participant count, languages, per-case success/failure and task completion times |

## 3. Video storyboard — keep it genuinely real

**0–6 s — Hook.** “Bank forms should not require perfect English or literacy. Meet SAHAJ.” Show a customer confronting the form and the kiosk. Use captions and a human narrator if helpful.

**6–18 s — Gnani voice.** Show the actual site and say “मुझे पाँच हज़ार रुपये निकालने हैं” or an actual Punjabi/Hinglish request; show its transcript and the Gnani engine label. Choose a request you tested successfully. Do not replace the recognizer's transcript with a manually typed caption that appears to be machine output.

**18–33 s — Computer vision / consent to draft.** Select one synthetic passbook sample, show OCR suggestion and customer confirmation. Caption: “Synthetic sample passbook, not real account data.” Use a screen recording of the working action.

**33–48 s — Result.** Enter/confirm the rupee amount, preview the completed withdrawal or deposit PDF draft, and show the simulated counter handoff. State clearly that no funds are transferred.

**48–60 s — Differentiator.** Demonstrate **one** failure-recovery case (for example, amount higher than available synthetic balance) or the Punjabi voice change, then conclude: “SAHAJ: access with dignity, built for Indian languages.” End frame: “Gnani Prisma v3.0 + Timbre v2.5” only if validated using actual Gnani responses.

If a true run takes longer than 60 seconds, cut out dead space and label speed-ups transparently. Do **not** fabricate outputs.

## 4. Recommended award positioning

- **Real Deal Award:** strongest conceptual fit — practical help for customers unfamiliar with paperwork. Prove usefulness with an actual working journey and clear real-world constraints.
- **Main Character Award:** possible if your **Punjabi** Gnani speech experience really works end-to-end, with accurate localized UI; don't promise Dogri or Urdu Gnani audio if the current adapters cannot deliver it.
- **Demo Day Drop Award:** especially actionable today with a focused 60-second video.
- **Mixed Vibes Award:** secondary possibility if you demonstrate true code-mixed Hindi/English speech and test transcript correctness, not just separate language selection.

See official category criteria: https://www.gnani.ai/internship

## 5. What would make SAHAJ much stronger after submission

1. **Confidence-based adaptive assistance.** Show extracted account-number confidence, explain what was unclear, ask for a retake, and provide one-tap human handoff without revealing a customer balance. Move from “OCR fills fields” to “AI recognizes when it should not guess.”
2. **Genuine end-to-end governed workflows.** Connect the existing consent, session, identity, access-control and readback APIs into the browser. Block any balance display or sensitive data lookup until authorized; use explicit account-holder confirmation. Current legacy `demo-profile/lookup` accepts a synthetic account number alone, so it must never be presented as safe for real bank data.
3. **Rural/noisy environment evaluation.** Compare speech success with fan/bank hall noise, older speakers, regional accents and code-mixed amounts. Use consented original test speech or synthetic audio where suitable; report per-language word error rate, intent correctness, and critical amount errors.
4. **Accessible kiosk UX.** Large-print/screen reader mode, high-contrast, easy tap targets, spoken instructions repeat, skip/passbook alternative, timeout warning, bilingual printed summary and physical counter guidance. Test with actual target users.
5. **Privacy/security by design.** Harden account authorization, kiosk reset, file retention, data minimization and server audit records. Never use real IDs/balances in public demonstrations. Avoid implying bank, NPCI or UIDAI endorsement.
6. **Quantified impact.** Compare forms filled with and without SAHAJ for a small consented pilot; publish median task time, successful forms, help requests and error rates with exact denominators. Do not invent outcomes.

## 6. Submission-ready description (adapt to what you *actually* demo)

> **SAHAJ — Speak. Scan. Confirm. Prepare.** An accessible, multilingual assistant that helps a customer prepare paper cash-withdrawal and deposit forms at a bank counter. It is designed for Indian-language speech and customers who need help with complex forms. Gnani AI Prisma speech-to-text and Timbre text-to-speech power the voice interface when configured, while OCR reads a synthetic passbook and asks the customer to verify the account number. The kiosk generates a reviewable PDF draft and directs the customer to simulated human assistance. SAHAJ never moves real money. The prototype combines a working guided flow, multilingual interface, explicit user confirmation and safe fallback paths, with a modular architecture for future bank integrations.

Edit the model names and descriptions to reflect the **actual successful API requests** on your demo machine.

## 7. Suggested public post (customize the demo claim; never exaggerate)

**What if visiting a bank didn't require filling a difficult form alone?**

I built **SAHAJ**, a multilingual, voice-first banking assistance kiosk prototype for the #GreatIndianAIInternshipChallenge by Gnani AI.

A customer can ask for a withdrawal or deposit in an Indian language, scan a **synthetic** passbook, confirm the detected account number and generate a printable form draft — with clear guidance on the next counter step. It does **not** perform real banking transactions.

Built with Gnani AI **Prisma v3.0** for speech recognition and **Timbre v2.5** for speech synthesis [include only if your actual demo verifies them], plus FastAPI, OCR and synthetic SQLite test data.

The part I care about most: financial assistance should be accessible even when someone is uncomfortable with English forms or technology.

Here is my actual working demo: [attach video]. I would value feedback on the voice experience and accessibility.

#GnaniAI #GreatIndianAIInternshipChallenge

**Rules:** Gnani requires genuine engagement; do not buy engagement, use bots or join exchange groups. The post must be public **before** submission and nominated in the submission form. Application deadline: 10 Nov 2026 at 11:59 PM IST. https://www.gnani.ai/internship

## 8. Reproducible local check

```bash
python -m pip install -r requirements-dev.txt
python -m pytest -q
cp .env.example .env      # on Windows, copy with File Explorer or 'copy'
# Add your own GNANI_API_KEY to .env; do not share it or commit the file.
python -m uvicorn main:app --host 127.0.0.1 --port 8766
```

Open `http://127.0.0.1:8766/api/health` and `http://127.0.0.1:8766/api/voice/fallback`, then open the main page and test the microphone with the exact browser. The `.env.example` values are placeholders, not working API keys. If the voice endpoint reports fallback engines, do not label the result as Gnani in the video.

Reference docs: https://docs.gnani.ai/api/introduction/quick-start and https://docs.gnani.ai/api/TTS/available-voices
