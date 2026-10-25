# Sahaj Kiosk v23 changes

Base: `Sahaj_Kiosk_Voice_Fixes_v22.zip`

## Changes
- Prevent Gemini model text/transcripts from overwriting app-controlled voice status labels. Status labels now remain in the selected display language, reducing Hindi/Urdu script mixing in listening/status UI.
- Changed Gemini failure handling so a mid-workflow disconnect does not restart the welcome greeting. The browser fallback resumes the current stage prompt in the selected spoken language; when the user is at passbook selection, it stays quiet and tells them to choose the passbook on screen.
- Cancelled the greeting watchdog when Gemini fails, preventing a delayed second greeting from playing after fallback has started.
- Added explicit **Yes, continue** and **No, change amount** buttons during amount confirmation as a voice-recognition fallback. The buttons use the selected screen language and invoke the existing flow logic.
- Confirmed no Grok/xAI integration references were present in the v22 source files; no Grok code or configuration needed removal from this base.

## Validation
- `node --check static/app.js` passed.
- `python -m py_compile main.py` passed.
- `pytest -q`: 22 passed.

## Not verified
- No live microphone, Gemini Live, Render deployment, or OCR image test was run in this environment.
- This release does not add a separate third-party conversational AI provider. That needs a provider choice and its server-side API key. Gemini Vision OCR remains separate from Gemini Live and still depends on the Gemini API/key when no local OCR engine is available.
