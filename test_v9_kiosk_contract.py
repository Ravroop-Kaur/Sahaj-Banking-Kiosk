from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'static'


def test_v9_screens_registered_and_preview_uses_real_pdf_frame():
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    js = (ROOT / 'kiosk-v8.js').read_text(encoding='utf-8')
    app = (ROOT / 'app.js').read_text(encoding='utf-8')
    assert 'id="v9ReviewScreen"' in html
    assert 'id="v9PreviewScreen"' in html
    assert 'v9ReviewScreen' in app and 'v9PreviewScreen' in app
    assert "el('v9PdfHost').appendChild(frame)" in js
    assert "await el('prepare').onclick()" in js  # the existing validated server flow


def test_spoken_lower_amount_is_checked_before_yes_no_during_balance_flow():
    js = (ROOT / 'kiosk-v8.js').read_text(encoding='utf-8')
    assert "if(step==='balance-question'){const n=spokenNumberValue(t);if(n){failedReplies=0;submitAmount(n);return}if(yes(t)" in js
    assert "if(step==='balance-visible'){const n=spokenNumberValue(t);if(n){failedReplies=0;submitAmount(n);return}" in js
    assert "if(step==='review'){if(no(t)" in js


def test_review_has_accessible_large_amount_and_immediate_preview():
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    css = (ROOT / 'kiosk-v9.css').read_text(encoding='utf-8')
    assert 'id="v9ReviewAmount"' in html
    assert 'id="v9ReviewYes"' in html
    assert 'id="v9PreviewDownload"' in html
    assert 'height:calc(100dvh - 146px)' in css
