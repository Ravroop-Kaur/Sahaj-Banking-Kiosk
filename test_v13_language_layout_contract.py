"""Regression guard against the V12 Hindi-default and clipped-screen regressions."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "static"


def test_default_language_is_english_for_screen_and_speech():
    js = (ROOT / "app.js").read_text(encoding="utf8")
    simple = (ROOT / "kiosk-simple.js").read_text(encoding="utf8")
    assert "let language='en', speakingLanguage='en'" in js
    assert "language='en';speakingLanguage='en';" in simple
    assert "language='hi';speakingLanguage='hi';" not in simple


def test_live_voice_screen_is_english_first_and_language_aware():
    js = (ROOT / "kiosk-v8.js").read_text(encoding="utf8")
    assert 'v14-en-greeting' in js
    assert 'v14-hi-greeting' in js
    assert "await say('नमस्ते! मैं आपकी कैसे मदद कर सकती हूँ? Hello! How may I help you?','hi'" in js
    assert 'customerHasSpoken=true;localizeV8()' in js
    assert 'greetView()' in js


def test_single_viewport_styles_loaded_last():
    html = (ROOT / "index.html").read_text(encoding="utf8")
    css = (ROOT / "kiosk-v13.css").read_text(encoding="utf8")
    assert 'kiosk-v14.css?v=18.0' in html and 'kiosk-v16.css?v=18.0' in html
    assert 'kiosk-v15.css?v=18.0' in html
    assert html.index('kiosk-v15.css') > html.index('kiosk-v14.css')
    assert html.index('kiosk-v14.css') > html.index('kiosk-v13.css') > html.index('kiosk-v9.css')
    assert 'grid-template-rows:minmax(0,1fr) auto' in css
    assert '#voiceScreen:not([hidden])' in css
    assert 'overflow:hidden !important' in css
