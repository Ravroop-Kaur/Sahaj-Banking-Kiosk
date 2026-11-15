"""V15: English headings / Hindi subtitles on bilingual entry screen."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]/"static"
def test_initial_service_labels_keep_hindi():
    js=(ROOT/"kiosk-v8.js").read_text(encoding="utf-8")
    assert "language==='en'?map[key][0]" in js
    assert "btn.querySelector('strong').textContent=main" in js
    assert 'पैसे निकालें' in js and 'पैसे जमा करें' in js
def test_v15_only_adds_css_for_home_and_service_screens():
    css=(ROOT/"kiosk-v15.css").read_text(encoding="utf-8")
    assert '#permissionScreen.v8-original .voice-art' in css
    assert '#voiceScreen .v8-voice-head' in css
    assert 'v14-hi-question' in css and 'v14-en-question' in css
