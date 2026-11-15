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
    question = js.split("if(step==='balance-question'){", 1)[1].split("if(step==='balance-visible')", 1)[0]
    assert question.index('submitAmount(n)') < question.index('sahajConfirmation')
    assert 'showAmount()' in question and 'revealBalance()' in question
    assert "if(step==='balance-visible'){const n=spokenNumberValue(t)" in js
    assert "sahajConfirmation(t,'review')" in js


def test_review_has_accessible_large_amount_and_immediate_preview():
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    css = (ROOT / 'kiosk-v9.css').read_text(encoding='utf-8')
    assert 'id="v9ReviewAmount"' in html
    assert 'id="v9ReviewYes"' in html
    assert 'id="v9PreviewDownload"' in html
    assert 'height:calc(100dvh - 146px)' in css
