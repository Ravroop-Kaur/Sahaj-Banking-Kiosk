"""Generate 60 linked synthetic profiles, passbooks, demo identity cards, bank cards, and clean form templates.
All assets are explicitly fictional and not valid for identification or payments.
"""
from __future__ import annotations
import json, random, sqlite3
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
ROOT = Path(__file__).resolve().parents[1]
random.seed(20261025)
OUT = ROOT / 'static' / 'synthetic_documents'
PASSBOOKS = OUT / 'passbooks'; IDS = OUT / 'demo_id_cards'
for d in (PASSBOOKS, IDS): d.mkdir(parents=True, exist_ok=True)
DB = ROOT / 'data' / 'synthetic_banking.sqlite3'
FONT_CANDIDATES = ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','C:/Windows/Fonts/arial.ttf','/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf']
BOLD_CANDIDATES = ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf','C:/Windows/Fonts/arialbd.ttf','/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf']
def font(size, bold=False):
    for p in (BOLD_CANDIDATES if bold else FONT_CANDIDATES):
        try: return ImageFont.truetype(p, size)
        except OSError: pass
    return ImageFont.load_default()
def text(draw, xy, s, size=24, fill='#172033', bold=False): draw.text(xy, str(s), font=font(size,bold), fill=fill)
def base_card(size, title, subtitle):
    im=Image.new('RGB', size, '#fbfcff'); d=ImageDraw.Draw(im)
    d.rounded_rectangle((24,24,size[0]-24,size[1]-24), radius=26, outline='#173b67', width=4)
    d.rounded_rectangle((24,24,size[0]-24,170), radius=26, fill='#173b67')
    d.rectangle((24,125,size[0]-24,170), fill='#173b67')
    text(d,(55,48),title,38,'#ffffff',True); text(d,(55,105),subtitle,20,'#dcecff')
    d.rounded_rectangle((size[0]-300,40,size[0]-55,88),radius=12,fill='#fff2cf')
    text(d,(size[0]-282,52),'DEMO • NOT VALID',18,'#7b3f00',True)
    return im,d

# Synthetic-only profiles, stable keys, invalid demo phone numbers, no real identity numbers.
first='Aarav Vivaan Aditya Arjun Ishaan Kabir Rohan Rahul Aman Karan Ananya Aditi Diya Isha Meera Priya Simran Jasleen Navya Kavya Farah Zoya Imran Ayaan Sahil Tanya Pooja Nisha Manav Riya Harpreet Gurpreet Jaspreet Sukhdeep Ravinder Baljit Iqra Sana Yash Neha'.split()
last='Sharma Verma Gupta Singh Kaur Kumar Mehta Bhat Dar Lone Wani Mir Rather Choudhary Thakur Malik Gill Sandhu Khan Ahmed Shah Raina Bakshi Dutta Joshi Kapoor Sood Bedi Saini Rathore'.split()
areas=['Demo Lane, Jammu','Sample Road, Srinagar','Fictional Ward 4, Udhampur','Example Street, Anantnag','Demo Colony, Baramulla','Sample Nagar, Kathua']
branches=['DEMO Branch - Jammu Central','DEMO Branch - Srinagar North','DEMO Branch - Udhampur','DEMO Branch - Anantnag','DEMO Branch - Baramulla','DEMO Branch - Kathua']
langs=['Hindi','English','Dogri','Kashmiri','Punjabi']
profiles=[]
for i in range(1,61):
    name=f'{random.choice(first)} {random.choice(last)}'
    p={'i':i,'customer_id':i,'customer_ref':f'SYN-CUST-{i:03d}','name':name,'phone':f'000000{1000+i:04d}',
       'address':f'{random.choice(areas)} (fictional)','dob':f'{random.randint(1950,2002)}-{random.randint(1,12):02d}-{random.randint(1,28):02d}',
       'occupation':random.choice(['Synthetic artisan','Synthetic teacher','Synthetic farmer','Synthetic shopkeeper','Synthetic pensioner','Synthetic student']),
       'account':f'99000000{i:04d}','type':random.choice(['Regular Savings','Pension Savings','Basic Savings']),
       'branch':branches[(i-1)%len(branches)],'ifsc':f'SYNB0000{i:03d}','cif':f'SYN-CIF-{i:04d}',
       'balance_paise':random.randint(100000,25000000),'demo_id':f'DEMO-ID-{i:04d}','demo_pan':f'DEMO-PAN-{i:04d}',
       'demo_bank_card':f'9999 0000 0000 {i:04d}','language':langs[(i-1)%5]}
    profiles.append(p)

# Idempotent upsert; preserve DB constraints and existing application queries.
conn=sqlite3.connect(DB); conn.execute('PRAGMA foreign_keys=ON')
conn.executescript('''CREATE TABLE IF NOT EXISTS customers (customer_id INTEGER PRIMARY KEY, customer_ref TEXT NOT NULL UNIQUE, full_name TEXT NOT NULL, phone TEXT NOT NULL UNIQUE, address TEXT NOT NULL, date_of_birth TEXT NOT NULL, occupation TEXT NOT NULL DEFAULT 'Synthetic demo occupation');
CREATE TABLE IF NOT EXISTS accounts (account_number TEXT PRIMARY KEY, customer_id INTEGER NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE, account_type TEXT NOT NULL, branch_name TEXT NOT NULL, ifsc TEXT NOT NULL, cif TEXT NOT NULL UNIQUE, balance_paise INTEGER NOT NULL CHECK(balance_paise>=0), status TEXT NOT NULL DEFAULT 'ACTIVE');
CREATE TABLE IF NOT EXISTS synthetic_identifications (customer_id INTEGER NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE, id_type TEXT NOT NULL, id_value TEXT NOT NULL UNIQUE, label TEXT NOT NULL DEFAULT 'SYNTHETIC DEMO VALUE - NOT VALID FOR IDENTIFICATION', PRIMARY KEY(customer_id,id_type));
CREATE TABLE IF NOT EXISTS demo_preferences (customer_id INTEGER PRIMARY KEY REFERENCES customers(customer_id) ON DELETE CASCADE, preferred_language TEXT NOT NULL, demo_bank_card_number TEXT NOT NULL UNIQUE, demo_only INTEGER NOT NULL DEFAULT 1 CHECK(demo_only=1));''')
for p in profiles:
    conn.execute('INSERT INTO customers VALUES(?,?,?,?,?,?,?) ON CONFLICT(customer_id) DO UPDATE SET customer_ref=excluded.customer_ref,full_name=excluded.full_name,phone=excluded.phone,address=excluded.address,date_of_birth=excluded.date_of_birth,occupation=excluded.occupation',(p['customer_id'],p['customer_ref'],p['name'],p['phone'],p['address'],p['dob'],p['occupation']))
    conn.execute('INSERT INTO accounts VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(account_number) DO UPDATE SET customer_id=excluded.customer_id,account_type=excluded.account_type,branch_name=excluded.branch_name,ifsc=excluded.ifsc,cif=excluded.cif,balance_paise=excluded.balance_paise,status=excluded.status',(p['account'],p['customer_id'],p['type'],p['branch'],p['ifsc'],p['cif'],p['balance_paise'],'ACTIVE'))
    for typ,val in [('DEMO_ID',p['demo_id']),('DEMO_PAN',p['demo_pan'])]:
        conn.execute('INSERT INTO synthetic_identifications(customer_id,id_type,id_value) VALUES(?,?,?) ON CONFLICT(customer_id,id_type) DO UPDATE SET id_value=excluded.id_value,label=excluded.label',(p['customer_id'],typ,val))
    conn.execute('INSERT INTO demo_preferences VALUES(?,?,?,1) ON CONFLICT(customer_id) DO UPDATE SET preferred_language=excluded.preferred_language,demo_bank_card_number=excluded.demo_bank_card_number',(p['customer_id'],p['language'],p['demo_bank_card']))
conn.commit(); conn.close()

# Generate high-resolution (3x) synthetic passbooks with the account number easy to OCR.
for p in profiles:
    W,H=1800,1200; im=Image.new('RGB',(W,H),'#ffffff'); d=ImageDraw.Draw(im)
    d.rounded_rectangle((35,35,W-35,H-35),radius=28,outline='#174a7e',width=8)
    d.rectangle((40,40,W-40,245),fill='#174a7e')
    text(d,(90,75),'SAHAJ DEMO BANK',58,'#ffffff',True); text(d,(92,155),'SYNTHETIC PASSBOOK • NOT A REAL BANK DOCUMENT',28,'#d9eaff',True)
    d.rounded_rectangle((1330,70,1680,140),radius=16,fill='#fff1ca'); text(d,(1360,91),'DEMO ONLY',28,'#7c3f00',True)
    text(d,(90,300),'ACCOUNT HOLDER NAME',24,'#516178',True); text(d,(90,340),p['name'],42,'#172033',True)
    text(d,(90,475),'ACCOUNT NUMBER:',34,'#516178',True); text(d,(600,465),p['account'],58,'#0b3d73',True)
    d.line((90,560,1710,560),fill='#c7d4e3',width=4)
    text(d,(90,620),'CUSTOMER REFERENCE',22,'#516178',True); text(d,(90,660),p['customer_ref'],32)
    text(d,(920,620),'ACCOUNT TYPE',22,'#516178',True); text(d,(920,660),p['type'],32)
    text(d,(90,750),'BRANCH',22,'#516178',True); text(d,(90,790),p['branch'],30)
    text(d,(920,750),'IFSC (SYNTHETIC)',22,'#516178',True); text(d,(920,790),p['ifsc'],30)
    text(d,(90,890),'This image is generated for software testing only. No real account exists.',24,'#7b8798')
    text(d,(90,950),'OCR should extract ONLY the account number, then look it up in the demo database.',24,'#7b8798')
    im.save(PASSBOOKS/f'passbook-{p["i"]:03d}.png',quality=100,optimize=True)

    # Fake identity card; deliberately not an Aadhaar reproduction and clearly invalid.
    im,d=base_card((1500,900),'SAHAJ DEMO ID','SYNTHETIC IDENTITY RECORD • NOT GOVERNMENT ISSUED')
    text(d,(70,220),'PHOTO',20,'#667085',True); d.rounded_rectangle((70,255,350,610),radius=16,fill='#e5eaf1',outline='#aab5c5',width=3); text(d,(122,400),'NO REAL',26,'#667085',True); text(d,(125,440),'PERSON',26,'#667085',True)
    text(d,(410,245),'NAME',23,'#516178',True); text(d,(410,285),p['name'],38,'#172033',True)
    text(d,(410,365),'DEMO ID REFERENCE',23,'#516178',True); text(d,(410,405),p['demo_id'],38,'#173b67',True)
    text(d,(410,485),'DATE OF BIRTH (SYNTHETIC)',23,'#516178',True); text(d,(410,525),p['dob'],32)
    text(d,(410,605),'ADDRESS',23,'#516178',True); text(d,(410,645),p['address'],28)
    text(d,(70,750),'NOT AN AADHAAR CARD • NOT VALID FOR KYC OR IDENTIFICATION',27,'#a12828',True)
    im.save(IDS/f'demo-id-{p["i"]:03d}.png',quality=100,optimize=True)

# Make clean printable form templates at 3x image resolution; labels and blank fields are vector-rendered.
def form_canvas(title, subtitle, size, fields):
    scale=3; w,h=size[0]*scale,size[1]*scale
    im=Image.new('RGB',(w,h),'white'); d=ImageDraw.Draw(im)
    d.rectangle((18,18,w-18,h-18),outline='#1d4268',width=5)
    d.rectangle((20,20,w-20,125*scale),fill='#1d4268')
    text(d,(35*scale,30*scale),title,18*scale,'#ffffff',True)
    text(d,(35*scale,70*scale),subtitle,7*scale,'#dcecff')
    text(d,(size[0]*scale-220,35*scale),'SYNTHETIC DEMO • NOT OFFICIAL',6*scale,'#ffedbd',True)
    y=145
    for label, key, kind in fields:
        text(d,(35*scale,y*scale),label,6*scale,'#334155',True)
        if kind=='digits':
            n=12 if 'account' in key else 10
            x=35*scale; top=(y+12)*scale; bw=15*scale if n==12 else 18*scale
            for k in range(n): d.rectangle((x+k*bw,top,x+(k+1)*bw,top+24*scale),outline='#8b9bad',width=2)
        else:
            d.line((35*scale,(y+32)*scale,(size[0]-35)*scale,(y+32)*scale),fill='#9aa8b8',width=2)
        y+=52
    d.line((35*scale,(size[1]-45)*scale,(size[0]-35)*scale,(size[1]-45)*scale),fill='#cbd5e1',width=2)
    text(d,(35*scale,(size[1]-35)*scale),'Draft only. Review all details and submit directly to your bank.',6*scale,'#7b8798')
    return im
# Keep template page coordinate dimensions in config; renderer embeds 3x pixel images at original page dimensions.
forms={
 'withdrawal_template.jpg': ('Sahaj Demo Bank — Withdrawal Request','CASH / PENSION WITHDRAWAL DRAFT',(581,373),[('Account holder name','name','text'),('Account number','account_id','digits'),('Amount in INR','amount_figures','text'),('Amount in words','amount_words','text'),('Phone (demo only)','phone','digits')]),
 'templates/deposit_challan.jpeg': ('Sahaj Demo Bank — Deposit Slip','CASH DEPOSIT DRAFT',(722,289),[('Account holder name','name','text'),('Account number','account','digits'),('Branch','branch','text'),('Phone (demo only)','phone','digits'),('Deposit amount INR','amount','text')]),
 'templates/idfc_transaction.jpeg': ('Sahaj Demo Bank — Transfer Request','TRANSFER / NEFT / RTGS DRAFT',(458,669),[('Debit account number','account','digits'),('Beneficiary name','beneficiary','text'),('Beneficiary account','beneficiaryAccount','text'),('Beneficiary IFSC','ifsc','text'),('Amount INR','amount','text')]),
 'templates/sbi_account_opening.jpeg': ('Sahaj Demo Bank — Account Opening','NEW ACCOUNT APPLICATION DRAFT',(298,386),[('Applicant name','name','text'),('Date of birth','dob','text'),('Address','address','text'),('Mobile (demo only)','mobile','digits'),('Occupation','occupation','text')]),
 'templates/dtb_account_opening.jpeg': ('Sahaj Demo Bank — Account Opening','NEW ACCOUNT APPLICATION DRAFT',(298,386),[('Applicant name','name','text'),('Branch','branch','text'),('Address','address','text'),('Phone (demo only)','phone','text'),('Email','email','text')]),
 'templates/dcb_customer_request.jpeg': ('Sahaj Demo Bank — Customer Request','CUSTOMER DETAILS UPDATE DRAFT',(768,1024),[('Customer name','name','text'),('Account number','account','digits'),('Branch','branch','text'),('Request','request','text'),('New contact','newContact','text')])
}
for rel,(title,sub,size,fields) in forms.items():
    path=ROOT/'static'/rel; path.parent.mkdir(parents=True,exist_ok=True)
    im=form_canvas(title,sub,size,fields); im.save(path,format='JPEG',quality=98,subsampling=0,optimize=True)

# Add page dimensions to config for high-res images embedded at physical page size.
config_path=ROOT/'field_mappings.json'; config=json.loads(config_path.read_text(encoding='utf-8'))
for key,rel in [('deposit','templates/deposit_challan.jpeg'),('transaction','templates/idfc_transaction.jpeg'),('sbi-account-opening','templates/sbi_account_opening.jpeg'),('account-opening','templates/dtb_account_opening.jpeg'),('dcb-request','templates/dcb_customer_request.jpeg')]:
    config['sample_forms'][key]['page']={'width':forms[rel][2][0],'height':forms[rel][2][1]}
config_path.write_text(json.dumps(config,indent=2),encoding='utf-8')
# Export complete linked data for inspectability; SQLite remains canonical.
with sqlite3.connect(DB) as c:
    c.row_factory=sqlite3.Row
    rows=c.execute('''SELECT c.customer_id,c.customer_ref,c.full_name,c.phone,c.address,c.date_of_birth,c.occupation,a.account_number,a.account_type,a.branch_name,a.ifsc,a.cif,a.balance_paise,a.status,p.preferred_language FROM customers c JOIN accounts a USING(customer_id) LEFT JOIN demo_preferences p USING(customer_id) ORDER BY c.customer_id''').fetchall()
    data=[]
    for r in rows:
        x=dict(r); x['balance_inr_demo_only']=round(x.pop('balance_paise')/100,2)
        x['is_fictional_demo_record']=True
        x['demo_id']=f'DEMO-ID-{x["customer_id"]:04d}'; x['demo_pan']=f'DEMO-PAN-{x["customer_id"]:04d}'
        data.append(x)
(ROOT/'data'/'synthetic_dataset.json').write_text(json.dumps(data,indent=2),encoding='utf-8')
print(f'Built {len(profiles)} linked profiles and initial document sets. Passbooks={len(list(PASSBOOKS.glob("*.png")))}')
