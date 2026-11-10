from pathlib import Path

def test_review_hydrates_authoritative_form_fields_before_server_prepare():
    js=(Path(__file__).resolve().parents[1]/"static/kiosk-v8.js").read_text()
    part=js.split("async function prepareReviewed(){",1)[1].split("function yes(",1)[0]
    for fragment in ["el('name').value=p.name", "el('account').value=String(p.account_id)", "el('phone').value=p.phone", "el('branch').value=p.branch", "el('amount').value=String(reviewAmount)", "el('confirm').checked=true", "await el('prepare').onclick()"]:
        assert fragment in part
    assert part.index("el('account').value") < part.index("await el('prepare').onclick()")
