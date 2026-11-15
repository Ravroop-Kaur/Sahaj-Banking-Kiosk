from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient
import main
from app.kiosk import allowed_documents
from app.services.session_manager import get_session_manager

ROOT = Path(__file__).resolve().parents[1]

def start(client):
    return client.post('/api/kiosk/start', json={'consent': True, 'language': 'en'}).json()['session_id']

def scan(client, sid, kind):
    sample = allowed_documents()[kind]
    return client.post('/api/kiosk/scan', data={'session_id': sid, 'kind': kind},
                       files={'file': ('sample.png', (ROOT/sample['path']).read_bytes(), 'image/png')})

def test_consent_and_protected_lookup():
    with TestClient(main.app) as c:
        assert c.post('/api/kiosk/start', json={'consent': False}).status_code == 403
        assert c.post('/api/demo-profile/lookup', json={'account_id': '990000000001'}).status_code == 403
        sid = start(c)
        assert c.post('/api/demo-profile/lookup', headers={'X-Kiosk-Session': sid}, json={'account_id': '990000000001'}).status_code == 403

def test_exact_ocr_match_grants_only_matching_account_and_clear_revokes():
    async def ocr(_):
        return {'fields': {'account_id': {'value': '990000000001'}}}
    with TestClient(main.app) as c, patch.object(main, 'ocr_passbook', ocr):
        sid = start(c)
        r = scan(c, sid, 'passbook')
        assert r.status_code == 200, r.text
        assert r.json()['profile']['account_id']=='990000000001'
        assert 'challenge' not in r.json()
        assert c.post('/api/kiosk/profile', json={'session_id': sid}).status_code == 200
        assert c.post('/api/demo-profile/lookup', headers={'X-Kiosk-Session': sid}, json={'account_id': '990000000002'}).status_code == 403
        get_session_manager().clear(sid)
        assert c.post('/api/kiosk/profile', json={'session_id': sid}).status_code == 404

def test_mismatched_ocr_never_grants_access():
    async def ocr(_):
        return {'fields': {'account_id': {'value': '990000000002'}}}
    with TestClient(main.app) as c, patch.object(main, 'ocr_passbook', ocr):
        sid = start(c)
        assert scan(c, sid, 'passbook').status_code == 422
        assert not get_session_manager().get(sid).account_access

def test_unknown_document_rejected():
    with TestClient(main.app) as c:
        sid = start(c)
        assert c.post('/api/kiosk/scan', data={'session_id': sid, 'kind': 'identity'}, files={'file': ('bad.png', b'not a document', 'image/png')}).status_code == 422

def test_new_customer_form60_draft_never_creates_account():
    text = ' '.join(allowed_documents()['identity']['fields'].values())
    with TestClient(main.app) as c, patch.object(main, 'run_ocr_engines', return_value=(text, 'test-ocr', [])):
        sid = start(c)
        assert 'fields' in scan(c,sid,'identity').json()
        payload = {'session_id': sid, 'occupation': 'Teacher', 'tax_route': 'form60', 'confirmed': True}
        assert c.post('/api/kiosk/opening-draft', json={**payload, 'confirmed': False}).status_code == 403
        r = c.post('/api/kiosk/opening-draft', json=payload)
        assert r.status_code == 200 and r.content.startswith(b'%PDF')
        session = get_session_manager().get(sid)
        assert not session.account_access and not session.account_reference
        assert c.post('/api/kiosk/opening-draft', json={**payload, 'tax_route': 'pan'}).status_code == 403
        assert scan(c, sid, 'pan').status_code == 200
        assert c.post('/api/kiosk/opening-draft', json={**payload, 'tax_route': 'pan'}).status_code == 200

def test_identity_ocr_mismatch_rejected():
    with TestClient(main.app) as c, patch.object(main, 'run_ocr_engines', return_value=('Different person', 'test-ocr', [])):
        sid = start(c)
        assert scan(c, sid, 'identity').status_code == 422
        assert 'applicant' not in get_session_manager().get(sid).extracted_fields


def test_backup_passbooks_are_allowed_but_still_require_the_correct_ocr_account():
    import asyncio
    from starlette.datastructures import UploadFile
    backups=allowed_documents()['passbook']['fallbacks']
    assert len(backups)==2
    async def read_number(file: UploadFile):
        data=await file.read()
        for row in backups:
            if data==(ROOT/row['path']).read_bytes():
                return {'fields':{'account_id':{'value':row['account_id']}}}
        return {'fields':{'account_id':{'value':''}}}
    with TestClient(main.app) as c, patch.object(main,'ocr_passbook',read_number):
        for row in backups:
            sid=start(c)
            payload={'session_id':sid,'kind':'passbook'}
            file=(ROOT/row['path']).read_bytes()
            r=c.post('/api/kiosk/scan',data=payload,files={'file':('backup.png',file,'image/png')})
            assert r.status_code==200,r.text
            assert r.json()['profile']['account_id']==row['account_id']
            get_session_manager().clear(sid)
        sid=start(c)
        bad=c.post('/api/kiosk/scan',data={'session_id':sid,'kind':'passbook'},files={'file':('fake.png',b'fake image','image/png')})
        assert bad.status_code==422


def test_backup_identity_and_pan_are_exactly_allowlisted_and_keep_applicant_details():
    samples=allowed_documents()
    assert len(samples['identity']['fallbacks'])==len(samples['pan']['fallbacks'])==2
    full_text=' '.join(samples['identity']['fields'].values())
    with TestClient(main.app) as c, patch.object(main,'run_ocr_engines',return_value=(full_text,'test-ocr',1)):
        for index in range(2):
            sid=start(c)
            for kind in ['identity','pan']:
                row=samples[kind]['fallbacks'][index]
                assert row['fields']==samples[kind]['fields']
                image=(ROOT/row['path']).read_bytes()
                r=c.post('/api/kiosk/scan',data={'session_id':sid,'kind':kind},files={'file':('backup.png',image,'image/png')})
                assert r.status_code==200,r.text
            get_session_manager().clear(sid)
