# Sahaj Kiosk v24 — user-friendly connection and failure messages

Base: v23 / `Sahaj_Kiosk_Restored_Gemini_and_Language_Fix`

## Changes
- The voice startup overlay now says only “Connecting…” (localized); it no longer names Gemini.
- When Gemini Live fails, normal kiosk users no longer see a provider-specific fallback message or the raw connection reason. The app continues using the browser fallback where possible.
- Detailed connection diagnostics remain in the browser console and Render logs. A small developer diagnostic line is shown only when the URL includes `?debug=1`.
- If browser speech recognition is unsupported or fails with a fatal service/network/permission error after the primary voice service has failed, the app shows a red, localized error screen with a restart button instead of exposing the technical exception.
- Microphone permission errors no longer print the raw exception to the user.

## Validation
- `node --check static/app.js`: passed.
- `python -m py_compile main.py`: passed.
- Full `pytest -q` run did not complete in this environment: it timed out while running the computationally expensive OCR rotation test. Do not interpret this as a test pass.
- No live microphone, Gemini Live, Render deployment, or browser fallback test was performed here.
