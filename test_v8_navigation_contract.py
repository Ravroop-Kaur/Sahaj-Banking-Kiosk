"""V8 kiosk navigation and fictional-balance guardrails."""
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT/'static/index.html').read_text()
JS = (ROOT/'static/kiosk-v8.js').read_text()
APP = (ROOT/'static/app.js').read_text()

def test_original_home_separate_from_voice_services():
    assert 'Banking, with a<br>little more' in HTML
    assert 'id="voiceContinue"' in HTML
    voice = HTML.split('id="voiceScreen"', 1)[1].split('</section>', 1)[0]
    assert 'id="voiceContinue"' not in voice
    assert voice.count('data-v8-service=') == 4
    assert all(item in APP for item in ['v8PassbookScreen', 'v8AmountScreen', 'v8BalanceScreen'])

def test_passbook_before_amount_and_balance_from_authorized_lookup():
    assert "step='passbook'" in JS and "step='amount'" in JS
    assert "'/api/demo-profile/lookup'" in JS
    assert "lookup.profile.balance===undefined" in JS
    assert "n>Number(passbook.profile?.balance||0)" in JS
    assert "function revealBalance()" in JS
    assert "passbook.profile.balance" in JS
    assert "id=\"v8Scan\"" in HTML and 'disabled aria-disabled="true"' in HTML
