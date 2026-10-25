import asyncio, json, re
from io import BytesIO
from pathlib import Path
from starlette.datastructures import Headers
from starlette.datastructures import UploadFile
from demo_database import find_account, connect, DB_PATH
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
    assert result["profile"]["identifications"]["DEMO_ID"]["value"]
    assert result["profile"]["demo_aadhaar_card_url"].endswith("demo-aadhaar-001.png")
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
