"""Session-bound synthetic kiosk workflow. No live identity or banking operations."""
from pathlib import Path
from time import perf_counter
from hashlib import sha256
import json
import re
from io import BytesIO
from fastapi import APIRouter, File, Form, UploadFile, HTTPException, Depends
from fastapi.responses import Response
from starlette.concurrency import run_in_threadpool
from app.api import _session
from app.services.session_manager import get_session_manager
from app.services import consent_manager, authentication, authorization, form_generator
from app.integrations.registry import get_identity_provider, get_bank_provider
from demo_database import find_account

from ratelimit import rate_limit
router=APIRouter(prefix='/api/kiosk', dependencies=[Depends(rate_limit)])
ROOT=Path(__file__).resolve().parents[1]
NOTICE='SIMULATED — NOT UIDAI VERIFIED. Synthetic documents only; no money moves.'

@router.post('/start')
def start(data:dict):
    if data.get('consent') is not True:raise HTTPException(403,'Explicit consent is required.')
    session=get_session_manager().create(data.get('language','en'))
    for purpose in ['data_collection','identity_verification']:
        consent_manager.record_consent(session,purpose,True,NOTICE)
    return {'session_id':session.session_id,'notice':NOTICE}

def allowed_documents():
    return json.loads((ROOT/'data/kiosk_samples.json').read_text(encoding='utf-8'))

@router.post('/scan')
async def scan(session_id:str=Form(...),kind:str=Form(...),file:UploadFile=File(...)):
    session=_session(session_id)
    consent_manager.require_consent(session,'data_collection')
    raw=await file.read(8*1024*1024+1)
    if len(raw)>8*1024*1024 or file.content_type not in {'image/png','image/jpeg','image/webp'}:
        raise HTTPException(415,'Use a synthetic PNG, JPEG or WebP under 8 MB.')
    sample=allowed_documents().get(kind)
    if not sample or sha256(raw).hexdigest()!=sha256((ROOT/sample['path']).read_bytes()).hexdigest():
        raise HTTPException(422,'Use the supplied synthetic sample. Unknown or altered documents require staff review.')
    start_time=perf_counter()
    import main
    if kind=='passbook':
        from starlette.datastructures import Headers
        image=UploadFile(BytesIO(raw),filename=file.filename,headers=Headers({'content-type':file.content_type}))
        result=await main.ocr_passbook(image)
        number=str(result.get('fields',{}).get('account_id',{}).get('value',''))
        if number!=sample['account_id']:raise HTTPException(422,'OCR did not agree with the synthetic sample. Rescan or ask staff.')
        lookup_start=perf_counter();record=find_account(number);lookup_ms=(perf_counter()-lookup_start)*1000
        if not record:raise HTTPException(404,'No exact demo account match.')
        # Exact sample allowlist + OCR cross-check establish only a simulated fixture identity.
        identity=authentication.verify_identity(session,get_identity_provider(),{'demo_customer_ref':record['customer_ref']})
        if not identity.ok:raise HTTPException(403,'Simulated identity check failed.')
        access=authorization.validate_account_access(session,get_bank_provider(),number,True)
        if not access.ok:raise HTTPException(403,'Simulated account access denied.')
        session.extracted_fields['kiosk_profile']={
            'account_id':number,'name':record['full_name'],'branch':record['branch_name'],'phone':record['phone']}
        return {'profile':session.extracted_fields['kiosk_profile'],'notice':NOTICE,'source':'OCR plus exact synthetic fixture cross-check',
                'lookup_ms':round(lookup_ms,3),'total_ms':round((perf_counter()-start_time)*1000,1)}
    text,engine,_=await run_in_threadpool(main.run_ocr_engines,raw,file.filename)
    normal=lambda value:re.sub(r'[^a-z0-9]','',str(value).lower())
    if any(normal(value) not in normal(text) for value in sample['fields'].values()):
        raise HTTPException(422,'The OCR details do not agree with the synthetic document. Rescan or ask staff.')
    if kind=='pan':
        applicant=session.extracted_fields.get('applicant')
        if not applicant or any(applicant[k]!=sample['fields'][k] for k in ['name','dob']):
            raise HTTPException(409,'Identity and PAN details conflict. Staff review required.')
        session.extracted_fields['pan_checked']=True
    else:session.extracted_fields['applicant']=dict(sample['fields'])
    return {'fields':sample['fields'],'source':'OCR cross-checked against exact synthetic fixture','engine':engine,
            'confidence':None,'notice':NOTICE,'total_ms':round((perf_counter()-start_time)*1000,1)}

@router.post('/profile')
def profile(data:dict):
    session=_session(data.get('session_id',''))
    authorization._require_access(session)
    return {'status':'matched','profile':session.extracted_fields.get('kiosk_profile')}

@router.post('/opening-draft')
def opening(data:dict):
    session=_session(data.get('session_id',''))
    consent_manager.require_consent(session,'data_collection')
    fields=session.extracted_fields.get('applicant')
    if not fields or data.get('confirmed') is not True:raise HTTPException(403,'Scan the synthetic identity sample and explicitly confirm the application.')
    occupation=str(data.get('occupation','')).strip()
    if not occupation or len(occupation)>100:raise HTTPException(422,'Provide an occupation of at most 100 characters.')
    if data.get('tax_route') not in ['form60','pan']:raise HTTPException(422,'Choose synthetic PAN or Form 60 for staff review.')
    if data['tax_route']=='pan' and not session.extracted_fields.get('pan_checked'):raise HTTPException(403,'Scan the matching synthetic PAN first.')
    from PIL import Image,ImageDraw,ImageFont
    page=Image.new('RGB',(1240,1754),'white');draw=ImageDraw.Draw(page)
    font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',25) if Path('C:/Windows/Fonts/arial.ttf').exists() else ImageFont.load_default(size=25)
    counter=form_generator.counter_for('account_opening')
    lines=['SAHAJ SAVINGS ACCOUNT APPLICATION DRAFT','DEMO — NOT VALID FOR BANK TRANSACTION','STAFF KYC AND REVIEW REQUIRED','',*[f'{k}: {v}' for k,v in fields.items()],f'Occupation: {occupation}',f'Tax document route: {data["tax_route"]} — staff verification required','Account number: __________________','CIF number: __________________','Nominee: __________________ (complete with staff)','Customer signature: __________________',f'Counter {counter["counter"]} — {counter["label"]}',NOTICE]
    import textwrap
    y=85
    for line in lines:
        for part in textwrap.wrap(line,76) or ['']:draw.text((80,y),part,font=font,fill='black');y+=46
    # These fields are deliberately empty. Customers attach photographs and sign
    # the printed application themselves; the kiosk never adds either.
    draw.rectangle((930,225,1170,495),outline='#c52b39',width=7)
    draw.text((950,245),'PHOTO: PASTE HERE',font=font,fill='#9e2531')
    draw.rectangle((680,1160,1160,1300),outline='#1b8b4d',width=7)
    draw.text((715,1190),'CUSTOMER SIGNATURE: SIGN HERE',font=font,fill='#196a42')
    draw.text((80,1380),'ATTACHMENTS: Aadhaar copy + PAN copy (or staff-assisted Form 60)',font=font,fill='#274e78')
    draw.text((80,1440),'Attach documents only to the printed form with bank staff.',font=font,fill='black')
    out=BytesIO();page.save(out,format='PDF',resolution=150)
    return Response(out.getvalue(),media_type='application/pdf',headers={'Content-Disposition':'attachment; filename="savings-application-draft.pdf"','Cache-Control':'no-store'})

@router.post('/pan')
def pan(data:dict):
    raise HTTPException(409,'Scan the synthetic PAN using /api/kiosk/scan.')
