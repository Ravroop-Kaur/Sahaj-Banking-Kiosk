from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def test_opening_is_one_question_at_a_time():
    html=(ROOT/'static/index.html').read_text()
    js=(ROOT/'static/kiosk-opening-simple.js').read_text()
    for step in ('simpleOpeningOccupationStep','simpleOpeningConfirmStep','simpleOpeningPanStep','simpleOpeningStaffStep','simpleOpeningReviewStep'):
        assert f'id="{step}"' in html
    assert "showPhase('pan')" in js
    assert "showPhase('staff')" in js
    assert "panChoice!=='pan'" in js

def test_guidance_waits_for_speech_then_two_seconds():
    js=(ROOT/'static/app.js').read_text()
    assert 'await announceGuide(key)' in js
    assert 'setTimeout(resolve,2000)' in js
    assert 'cancelSequence' in js
    assert 'v16DepositPreviewScreen' in js

def test_real_synthetic_opening_form_has_blank_photo_and_signature_areas():
    source=(ROOT/'app/kiosk.py').read_text()
    assert "draw.rectangle((930,225,1170,495)" in source
    assert "draw.rectangle((680,1160,1160,1300)" in source
    assert 'CUSTOMER SIGNATURE: SIGN HERE' in source
    assert 'PHOTO: PASTE HERE' in source

def test_passbook_says_demo_to_proceed():
    js=(ROOT/'static/kiosk-v8.js').read_text()
    assert 'Please choose Demo passbook to proceed' in js
    assert 'Scanning a passbook is not available right now' in js
