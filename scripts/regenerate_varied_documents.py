"""Generate varied, rotated synthetic passbooks plus clearly fake Aadhaar/PAN demo mockups."""
import sqlite3, math
from functools import lru_cache
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parents[1]
DB=ROOT/'data'/'synthetic_banking.sqlite3'
OUT=ROOT/'static'/'synthetic_documents'
PASS=OUT/'passbooks'; AAD=OUT/'demo_aadhaar_cards'; PAN=OUT/'demo_pan_cards'
for p in (PASS,AAD,PAN): p.mkdir(parents=True,exist_ok=True)
REG=['C:/Windows/Fonts/arial.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf']
BOLD=['C:/Windows/Fonts/arialbd.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf','/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf']
@lru_cache(maxsize=256)
def font(n,b=False):
    for path in (BOLD if b else REG):
        try:return ImageFont.truetype(path,n)
        except OSError:pass
    return ImageFont.load_default()
def t(d,xy,s,n=30,fill='#172033',bold=False): d.text(xy,str(s),font=font(n,bold),fill=fill)
def card_base(title,subtitle,sz=(1500,900),bg='#f8fafc'):
    im=Image.new('RGB',sz,bg);d=ImageDraw.Draw(im)
    d.rounded_rectangle((24,24,sz[0]-24,sz[1]-24),radius=30,outline='#244c73',width=5)
    d.rounded_rectangle((24,24,sz[0]-24,175),radius=28,fill='#244c73')
    d.rectangle((24,130,sz[0]-24,175),fill='#244c73')
    t(d,(60,50),title,42,'white',True);t(d,(62,112),subtitle,22,'#e4effa',True)
    d.rounded_rectangle((sz[0]-400,45,sz[0]-55,105),radius=12,fill='#fff0c2')
    t(d,(sz[0]-380,62),'DEMO ONLY • NOT VALID',22,'#7a3c00',True)
    return im,d
with sqlite3.connect(DB) as c:
    c.row_factory=sqlite3.Row
    rows=c.execute('''SELECT c.customer_id,c.full_name,c.phone,c.address,c.date_of_birth,c.occupation,a.account_number,a.account_type,a.branch_name,a.ifsc,a.cif,p.preferred_language FROM customers c JOIN accounts a USING(customer_id) LEFT JOIN demo_preferences p USING(customer_id) ORDER BY c.customer_id''').fetchall()
layouts=['top','bottom','left-band','right-band','top-right','bottom-left','center','two-column','header-under-name','footer-band']
for row in rows:
    p=dict(row); i=p['customer_id']; layout=layouts[(i-1)%len(layouts)]
    W,H=1800,1200; im=Image.new('RGB',(W,H),'#ffffff');d=ImageDraw.Draw(im)
    d.rounded_rectangle((24,24,W-24,H-24),radius=28,outline='#1d4b75',width=7)
    # Vary header style, placement, and information grouping.
    palette=[('#174a7e','#eaf2fa'),('#24665b','#e9f5f0'),('#5b477d','#f1edfa'),('#8b4b32','#fff0e8')][(i-1)%4]
    header,light=palette
    d.rectangle((30,30,W-30,205),fill=header)
    t(d,(75,58),'SAHAJ DEMO BANK',54,'white',True)
    t(d,(78,130),'SYNTHETIC PASSBOOK • NOT A REAL BANK DOCUMENT',25,'#e4effa',True)
    t(d,(1350,70),'DEMO ONLY',28,'#7a3c00',True)
    t(d,(85,260),'ACCOUNT HOLDER NAME',24,'#526174',True);t(d,(85,300),p['full_name'],40,'#172033',True)
    # Account number changes position across passbook styles; label remains near its value.
    positions={
      'top':(85,405),'bottom':(85,930),'left-band':(80,650),'right-band':(1060,650),
      'top-right':(1030,300),'bottom-left':(85,990),'center':(500,620),
      'two-column':(930,440),'header-under-name':(85,365),'footer-band':(600,990)
    }
    x,y=positions[layout]
    if layout=='left-band':
        d.rounded_rectangle((50,390,520,840),radius=20,fill=light,outline=header,width=4)
    elif layout=='right-band':
        d.rounded_rectangle((1015,390,1735,840),radius=20,fill=light,outline=header,width=4)
    elif layout=='footer-band':
        d.rectangle((35,900,1765,1125),fill=light)
    elif layout=='top':
        d.rectangle((55,380,1745,525),fill=light)
    elif layout=='bottom':
        d.rectangle((55,880,1745,1065),fill=light)
    elif layout=='top-right':
        d.rounded_rectangle((1000,250,1735,455),radius=18,fill=light,outline=header,width=3)
    elif layout=='bottom-left':
        d.rounded_rectangle((55,930,870,1110),radius=18,fill=light,outline=header,width=3)
    elif layout=='center':
        d.rounded_rectangle((430,550,1370,765),radius=18,fill=light,outline=header,width=3)
    elif layout=='two-column':
        d.rounded_rectangle((880,385,1730,570),radius=18,fill=light,outline=header,width=3)
    elif layout=='header-under-name':
        d.rectangle((55,350,1745,510),fill=light)
    t(d,(x,y),'ACCOUNT NUMBER / A/C NO.',22,'#526174',True)
    t(d,(x,y+42),p['account_number'],48,header,True)
    # Remaining details are deliberately not needed by OCR; they exist in SQLite.
    other_y=540 if layout not in ('bottom','bottom-left','footer-band') else 600
    if layout not in ('left-band','right-band','top-right','bottom-left','footer-band'):
        t(d,(85,other_y),'CUSTOMER REFERENCE',21,'#526174',True);t(d,(85,other_y+35),f'SYN-CUST-{i:03d}',30)
        t(d,(900,other_y),'ACCOUNT TYPE',21,'#526174',True);t(d,(900,other_y+35),p['account_type'],30)
    t(d,(80,1080),'FICTIONAL TEST DOCUMENT • NO REAL ACCOUNT EXISTS',22,'#7a8796',True)
    # Rotate the complete document in pixels for varied 90/180/270 degree input orientations.
    rotation=[0,90,180,270][(i-1)%4]
    if rotation: im=im.rotate(rotation,expand=True,resample=Image.Resampling.BICUBIC,fillcolor='white')
    im.save(PASS/f'passbook-{i:03d}.png',optimize=True)

    # Mock Aadhaar-style demo card: not an official Aadhaar design and has no valid number/QR.
    im,d=card_base('SAHAJ DEMO IDENTITY RECORD','AADHAAR-STYLE TEST MOCKUP • NOT GOVERNMENT ISSUED',bg='#fffdf7')
    d.rectangle((55,215,340,650),fill='#e9edf3',outline='#9aa7b8',width=3)
    t(d,(112,390),'NO REAL',29,'#667085',True);t(d,(105,430),'PERSON',29,'#667085',True)
    t(d,(400,235),'NAME',24,'#526174',True);t(d,(400,275),p['full_name'],38,'#172033',True)
    t(d,(400,355),'DEMO REFERENCE (NOT AN AADHAAR NUMBER)',23,'#526174',True);t(d,(400,400),f'DEMO-ID-{i:04d}',40,'#174a7e',True)
    t(d,(400,485),'DATE OF BIRTH (SYNTHETIC)',22,'#526174',True);t(d,(400,525),p['date_of_birth'],31)
    t(d,(400,595),'ADDRESS (FICTIONAL)',22,'#526174',True);t(d,(400,635),p['address'],27)
    d.rectangle((55,720,1445,825),fill='#ffebe8',outline='#b42318',width=3)
    t(d,(80,748),'NOT A REAL AADHAAR CARD • NOT VALID FOR KYC OR IDENTIFICATION',28,'#a12828',True)
    im.save(AAD/f'demo-aadhaar-{i:03d}.png',optimize=True)

    # PAN-style demo mockup, with deliberately invalid demo reference rather than a PAN number.
    im,d=card_base('SAHAJ DEMO TAX ID RECORD','PAN-STYLE TEST MOCKUP • NOT AN INCOME TAX DOCUMENT',bg='#f7fbff')
    t(d,(80,245),'NAME',24,'#526174',True);t(d,(80,285),p['full_name'],38,'#172033',True)
    t(d,(80,390),'DEMO PAN REFERENCE (NOT A PAN)',24,'#526174',True);t(d,(80,435),f'DEMO-PAN-{i:04d}',42,'#174a7e',True)
    t(d,(80,540),'DATE OF BIRTH (SYNTHETIC)',22,'#526174',True);t(d,(80,580),p['date_of_birth'],30)
    t(d,(80,670),'ACCOUNT LINK KEY',22,'#526174',True);t(d,(80,710),p['account_number'],34,'#172033',True)
    d.rectangle((55,775,1445,825),fill='#ffebe8',outline='#b42318',width=2)
    t(d,(75,787),'NOT A REAL PAN CARD • NOT VALID FOR TAX OR KYC USE',24,'#a12828',True)
    im.save(PAN/f'demo-pan-{i:03d}.png',optimize=True)
print(f'Generated {len(rows)} passbooks with varied layout/rotation, {len(rows)} Aadhaar-style mocks and {len(rows)} PAN-style mocks.')
