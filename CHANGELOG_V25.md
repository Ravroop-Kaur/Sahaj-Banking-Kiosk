# v25 — Deepgram speech fallback and Render OCR resilience

- Added `/api/speech/config` and `/api/speech/transcribe`; the Deepgram key remains server-side.
- Added a Deepgram short-utterance speech-to-text layer before browser recognition when Gemini Live is unavailable.
- Reuses Sahaj's existing deterministic multilingual workflow to interpret transcripts; Deepgram is not presented as a reasoning model.
- Added `apt.txt` for Render native-build Tesseract installation.
- Made OCR prefer local Tesseract when installed; Gemini Vision is attempted if local OCR cannot confidently read the labelled account number. If Gemini fails, available local OCR text is retained for manual correction.
- Added Render environment setup notes.
- Validation: JavaScript syntax and Python compilation passed. Live provider calls and actual Render installation still require deployment testing.
