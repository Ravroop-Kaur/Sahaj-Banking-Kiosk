import asyncio
from io import BytesIO
from pathlib import Path
from starlette.datastructures import Headers
from starlette.datastructures import UploadFile
from demo_database import find_account, connect
from main import lookup, PrepareRequest, prepare, create_sample_form_pdf, SampleFormRequest, _blank_withdrawal_pdf

ROOT = Path(__file__).parent

def test_dataset_has_60_linked_demo_profiles():
    with connect() as db:
        assert db.execute("SELECT COUNT(*) FROM customers").fetchone()[0] == 60
        assert db.execute("SELECT COUNT(*) FROM accounts").fetchone()[0] == 60
        assert db.execute("SELECT COUNT(*) FROM synthetic_identifications").fetchone()[0] >= 120
        assert db.execute("SELECT COUNT(*) FROM demo_preferences").fetchone()[0] == 60
        assert db.execute("SELECT COUNT(DISTINCT account_number) FROM accounts").fetchone()[0] == 60

def test_demo_profile_match_missing_uncertain():
    record=find_account("990000000001")
    result=lookup({"account_id":"990000000001"})
    assert result["status"] == "matched"
    assert result["profile"]["name"] == record["full_name"]
    assert "identifications" not in result["profile"]
    assert "demo_aadhaar_card_url" not in result["profile"]
    assert "demo_pan_card_url" not in result["profile"]
    assert lookup({"account_id":"123456789012"})["status"] == "not_found"
    assert lookup({"account_id":"abc"})["status"] == "uncertain"

def test_confirmed_withdrawal_and_pdf():
    record=find_account("990000000001")
    req=PrepareRequest(transaction="cash withdrawal",amount="500.25",name=record["full_name"],account_id="990000000001",phone=record["phone"],branch=record["branch_name"],confirmed=True)
    assert prepare(req)["pdf_available"] is True
    from main import _withdrawal_pdf
    pdf=_withdrawal_pdf(req)
    assert pdf.startswith(b"%PDF-")
    assert len(pdf)>10000

def test_generated_documents_exist_and_are_high_resolution():
    for folder in ["passbooks","demo_id_cards","demo_aadhaar_cards","demo_pan_cards"]:
        files=list((ROOT/"static"/"synthetic_documents"/folder).glob("*.png"))
        assert len(files)==60
        from PIL import Image
        with Image.open(files[0]) as im: assert max(im.width, im.height) >= 1400

def test_sample_form_pdf_prefills_reviewed_values():
    req=SampleFormRequest(form_id="dcb-request",fields={"name":"Demo Person","account":"9000012345","branch":"Demo Srinagar","request":"Change address","newContact":"123 Demo Street"},confirmed=True)
    pdf=create_sample_form_pdf(req).body
    assert pdf.startswith(b"%PDF-") and len(pdf)>10000

def test_account_number_only_is_used_for_lookup():
    # The profile returned is fetched from SQLite using the exact confirmed account key.
    p=lookup({"account_id":"990000000005"})["profile"]
    assert p["account_id"] == "990000000005"
    assert p["name"] == find_account("990000000005")["full_name"]

def test_blank_withdrawal_pdf_is_valid_pdf_bytes():
    pdf=_blank_withdrawal_pdf()
    assert pdf.startswith(b"%PDF-") and len(pdf)>10000

def test_ocr_returns_only_confirmable_account_number():
    from main import ocr_passbook
    from starlette.datastructures import Headers, UploadFile
    path = ROOT / "static" / "synthetic_documents" / "passbooks" / "passbook-001.png"
    upload = UploadFile(filename=path.name, file=BytesIO(path.read_bytes()), headers=Headers({"content-type": "image/png"}))
    result = asyncio.run(ocr_passbook(upload))
    assert result["fields"]["account_id"]["value"] == "990000000001"
    assert set(result["fields"]) == {"account_id"}
    assert "text" not in result

def test_varied_passbook_layouts_and_demo_aadhaar_pan_mockups_exist():
    from PIL import Image
    passbooks = sorted((ROOT / "static" / "synthetic_documents" / "passbooks").glob("*.png"))
    aadhaar = sorted((ROOT / "static" / "synthetic_documents" / "demo_aadhaar_cards").glob("*.png"))
    pan = sorted((ROOT / "static" / "synthetic_documents" / "demo_pan_cards").glob("*.png"))
    assert len(passbooks) == len(aadhaar) == len(pan) == 60
    dimensions = set()
    for path in passbooks:
        with Image.open(path) as image:
            dimensions.add(image.size)
    assert len(dimensions) >= 2  # landscape and portrait rotations are both represented
    assert all(path.stat().st_size > 10000 for path in aadhaar + pan)

def test_form_preview_and_counter_directory_endpoints():
    from main import preview_sample_form_pdf, counters
    req = SampleFormRequest(form_id="deposit", fields={"name":"Demo Person", "account":"990000000001", "branch":"DEMO Branch", "phone":"0000001001", "amount":"100"}, confirmed=True)
    preview = preview_sample_form_pdf(req)
    assert preview.media_type == "application/pdf"
    assert preview.headers["content-disposition"].startswith("inline;")
    result = counters()
    assert "counter_1" in result and "counter_2" in result and "counter_3" in result


def test_ocr_handles_different_passbook_positions_and_rotations():
    from main import ocr_passbook
    from starlette.datastructures import Headers, UploadFile
    for i in range(1, 9):
        path = ROOT / "static" / "synthetic_documents" / "passbooks" / f"passbook-{i:03d}.png"
        upload = UploadFile(filename=path.name, file=BytesIO(path.read_bytes()), headers=Headers({"content-type": "image/png"}))
        result = asyncio.run(ocr_passbook(upload))
        assert result["fields"]["account_id"]["value"] == f"99000000{i:04d}", f"failed OCR for {path.name}"
        assert set(result["fields"]) == {"account_id"}


def test_everyday_language_intent_classification():
    from main import intent, IntentRequest
    cases = [
        ("I need to take some money out", "withdrawal"),
        ("मुझे अपनी पेंशन निकालनी है", "withdrawal"),
        ("मुझे पैसे निकालने हैं", "withdrawal"),
        ("I want to put some money into my account", "deposit"),
        ("मुझे खाते में पैसे जमा करने हैं", "deposit"),
    ]
    for utterance, expected in cases:
        assert intent(IntentRequest(text=utterance)) ["intent"] == expected


def test_intent_classifier_understands_varied_everyday_language_fallback():
    from main import intent, IntentRequest
    cases = [
        ("Can you help me get some cash?", "withdrawal"),
        ("I need to take a little money from my account", "withdrawal"),
        ("मुझे पैसे निकालने हैं", "withdrawal"),
        ("Mujhe apni pension leni hai", "withdrawal"),
        ("I want to put some cash into my account", "deposit"),
        ("Mere account mein paise jama karne hain", "deposit"),
        ("मुझे खाते में पैसे जमा करने हैं", "deposit"),
    ]
    for utterance, expected in cases:
        result = intent(IntentRequest(text=utterance, language="en"))
        assert result["intent"] == expected, (utterance, result)


def test_intent_classifier_does_not_guess_ambiguous_or_conflicting_requests():
    from main import intent, IntentRequest
    assert intent(IntentRequest(text="I need help with my money"))["intent"] == "unclear"
    result = intent(IntentRequest(text="I want to withdraw some money and deposit some too"))
    assert result["intent"] == "unclear"
    assert result["amount"] == ""

def test_intent_classifier_only_extracts_explicit_amounts():
    from main import intent, IntentRequest
    result = intent(IntentRequest(text="I am 72 years old and need to withdraw cash"))
    assert result["intent"] == "withdrawal"
    assert result["amount"] == ""
    assert intent(IntentRequest(text="Please withdraw 500 rupees"))["amount"] == "500"


def test_withdrawal_pdf_does_not_draw_red_signature_marker():
    from main import _withdrawal_pdf
    record=find_account("990000000001")
    req=PrepareRequest(transaction="cash withdrawal",amount="500",name=record["full_name"],account_id="990000000001",phone=record["phone"],branch=record["branch_name"],confirmed=True)
    pdf=_withdrawal_pdf(req)
    assert b"SIGN HERE" not in pdf
    assert b"0.78 0.16 0.12 RG" not in pdf


def test_language_picker_lists_only_requested_languages_and_account_confirm_is_not_shown_after_ocr():
    html=(ROOT/"static"/"index.html").read_text(encoding="utf-8")
    assert 'data-lang="hi"' in html and 'data-lang="en"' in html and 'data-lang="ur"' in html and 'data-lang="pa"' in html
    assert 'Dogri is shown in Devanagari and Kashmiri in Perso-Arabic script.' not in html
    js=(ROOT/"static"/"app.js").read_text(encoding="utf-8")
    assert "show('accountConfirmScreen')" not in js

def test_lookup_exposes_only_balance_needed_for_withdrawal_guard():
    result = lookup({"account_id": "990000000001"})
    assert result["status"] == "matched"
    assert float(result["profile"]["balance"]) == float(find_account("990000000001")["balance"])
    assert "identifications" not in result["profile"]

def test_withdrawal_over_balance_is_rejected_with_localizable_balance_code():
    from fastapi import HTTPException
    record = find_account("990000000001")
    req = PrepareRequest(transaction="cash withdrawal", amount=str(float(record["balance"]) + 1), name=record["full_name"], account_id="990000000001", phone=record["phone"], branch=record["branch_name"], confirmed=True)
    try:
        prepare(req)
    except HTTPException as exc:
        assert exc.status_code == 409
        assert exc.detail["code"] == "INSUFFICIENT_BALANCE"
        assert float(exc.detail["balance"]) == float(record["balance"])
    else:
        raise AssertionError("Withdrawal above synthetic balance must be rejected")

def test_downloaded_withdrawal_pdf_includes_separate_counter_instruction_page():
    from main import create_pdf
    record = find_account("990000000001")
    req = PrepareRequest(transaction="cash withdrawal", amount="500", name=record["full_name"], account_id="990000000001", phone=record["phone"], branch=record["branch_name"], confirmed=True)
    pdf = create_pdf(req).body
    assert b"/Count 2" in pdf
    assert b"NEXT STEP: COUNTER 1" in pdf


def test_exported_accounts_include_varied_balance_column():
    import csv
    from pathlib import Path
    root = Path(__file__).resolve().parent
    with (root / "data" / "exports" / "accounts.csv").open(encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
    assert len(rows) == 60
    assert "balance" in rows[0]
    balances = {int(float(row["balance"])) for row in rows}
    assert {1000, 5000, 10000, 30000, 50000, 100000, 200000}.issubset(balances)


def test_voice_mode_checks_withdrawal_balance_after_passbook_lookup():
    from pathlib import Path
    js = (Path(__file__).resolve().parent / "static" / "app.js").read_text(encoding="utf-8")
    assert "Your account does not have enough balance for that withdrawal." in js
    assert "flowStage='balance-check'" in js
    assert "Number(detectedAmount)>Number(passbook.profile.balance||0)" in js
