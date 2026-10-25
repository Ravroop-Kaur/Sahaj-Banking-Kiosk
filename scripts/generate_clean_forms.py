from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parents[1]
CFG=ROOT/'field_mappings.json'
config=json.loads(CFG.read_text(encoding='utf-8'))
try:
    regular=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',24); bold=ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf',24)
except OSError:
    try: regular=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',24); bold=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',24)
    except OSError: regular=bold=ImageFont.load_default()
def ft(sz,b=False):
    try:
        return ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf' if b else 'C:/Windows/Fonts/arial.ttf',sz)
    except OSError:
        try: return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if b else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',sz)
        except OSError:return ImageFont.load_default()

def make(path,title,subtitle,size,rows,digits=()):
    # page coordinates in points are the base size; raster image is 3x for sharp printing.
    S=3; W,H=size[0]*S,size[1]*S
    im=Image.new('RGB',(W,H),'#ffffff'); d=ImageDraw.Draw(im)
    d.rounded_rectangle((12,12,W-12,H-12),radius=24,outline='#234d75',width=5)
    header=min(88,size[1]*0.24)
    d.rectangle((15,15,W-15,int(header*S)),fill='#173e66')
    d.text((size[0]*.06*S, 18*S),title,font=ft(max(24,min(48,int(size[0]*.022*S))),True),fill='white')
    d.text((size[0]*.06*S, 57*S),subtitle,font=ft(max(13,min(22,int(size[0]*.009*S)))),fill='#dcecff')
    d.text((size[0]*.55*S, 57*S),'SYNTHETIC DEMO • NOT OFFICIAL',font=ft(max(10,min(16,int(size[0]*.007*S))),True),fill='#ffedbd')
    top=int(header+18); bottom=size[1]-42
    step=(bottom-top)/max(1,len(rows))
    fields={}; digit_fields={}
    for i,(key,label,kind) in enumerate(rows):
        y=top+i*step
        d.text((35*S,int(y*S)),label,font=ft(max(14,min(21,int(size[0]*.009*S))),True),fill='#334155')
        line_y=int((y+step*.84)*S)
        if kind=='digits':
            cells=12 if key in ('account','account_id') else 10
            x0=35; cellw=min(15,(size[0]-70)/cells)
            box_top=int((y+step*.48)*S); box_h=int(step*.31*S)
            for j in range(cells):
                x=int((x0+j*cellw)*S)
                d.rectangle((x,box_top,int((x0+(j+1)*cellw)*S),box_top+box_h),outline='#8d9bad',width=2)
            digit_fields[key]={'first_digit_x':x0+cellw*.34,'step_x':cellw,'baseline_y':size[1]-(y+step*.70),'font_size':max(5,int(size[0]*.018)),'cells':cells}
        else:
            d.line((35*S,line_y,(size[0]-35)*S,line_y),fill='#9aa8b8',width=2)
            fields[key]=[35, size[1]-(y+step*.84)+2, max(5,int(size[0]*.012)), size[0]-70]
    d.line((35*S,(size[1]-28)*S,(size[0]-35)*S,(size[1]-28)*S),fill='#d1dae5',width=2)
    d.text((35*S,(size[1]-25)*S),'Draft only • Review values before use • No real bank connection',font=ft(max(7,int(size[0]*.012*S))),fill='#667085')
    p=ROOT/'static'/path; p.parent.mkdir(parents=True,exist_ok=True); im.save(p,format='JPEG',quality=99,subsampling=0,optimize=True)
    return {'template':'static/'+path,'page':{'width':size[0],'height':size[1]},'fields':fields,'digit_fields':digit_fields}

forms={
 'deposit':('templates/deposit_challan.jpeg','Sahaj Demo Bank — Deposit Slip','CASH DEPOSIT DRAFT',(722,289),[('name','Account holder name','text'),('account','Account number','digits'),('branch','Branch','text'),('phone','Phone (demo only)','digits'),('amount','Deposit amount INR','text')]),
 'transaction':('templates/idfc_transaction.jpeg','Sahaj Demo Bank — Transfer Request','TRANSFER / NEFT / RTGS DRAFT',(458,669),[('account','Debit account number','digits'),('branch','Branch','text'),('beneficiary','Beneficiary name','text'),('beneficiaryAccount','Beneficiary account','text'),('ifsc','Beneficiary IFSC','text'),('amount','Transfer amount INR','text')]),
 'sbi-account-opening':('templates/sbi_account_opening.jpeg','Sahaj Demo Bank — Account Opening','NEW ACCOUNT APPLICATION DRAFT',(298,480),[('name','Applicant name','text'),('branch','Branch','text'),('dob','Date of birth','text'),('address','Address','text'),('mobile','Mobile (demo only)','digits'),('occupation','Occupation','text'),('demoId','Synthetic demo ID reference','text'),('demoPan','Synthetic demo PAN-like reference','text')]),
 'account-opening':('templates/dtb_account_opening.jpeg','Sahaj Demo Bank — Account Opening','NEW ACCOUNT APPLICATION DRAFT',(298,480),[('name','Applicant name','text'),('branch','Branch','text'),('address','Address','text'),('phone','Phone (demo only)','text'),('email','Email','text'),('demoId','Synthetic demo ID reference','text'),('demoPan','Synthetic demo PAN-like reference','text')]),
 'dcb-request':('templates/dcb_customer_request.jpeg','Sahaj Demo Bank — Customer Request','CUSTOMER DETAILS UPDATE DRAFT',(768,1024),[('name','Customer name','text'),('account','Account number','digits'),('branch','Branch','text'),('request','Requested update','text'),('newContact','New contact details','text')]),
}
for fid,(rel,title,sub,size,rows) in forms.items():
    config['sample_forms'][fid]=make(rel,title,sub,size,rows)
# Withdrawal custom clean form. Map coordinates are PDF page coordinates, while image is 3x raster.
size=(581,373); S=3; W,H=size[0]*S,size[1]*S
im=Image.new('RGB',(W,H),'white'); d=ImageDraw.Draw(im)
d.rectangle((12,12,W-12,H-12),outline='#234d75',width=5); d.rectangle((15,15,W-15,95*S),fill='#173e66')
d.text((30*S,27*S),'SAHAJ DEMO BANK — WITHDRAWAL REQUEST',font=ft(22*S,True),fill='white')
d.text((30*S,65*S),'CASH / PENSION WITHDRAWAL DRAFT • SYNTHETIC DEMO ONLY',font=ft(8*S),fill='#dcecff')
# calibrated labels, fields, and cell boxes
labels=[('Account holder name',35,115),('Account number',35,158),('Amount in figures (INR)',35,211),('Amount in words',35,252),('Phone (demo only)',35,300)]
for label,x,y in labels: d.text((x*S,y*S),label,font=ft(7*S,True),fill='#334155')
d.line((35*S,146*S,540*S,146*S),fill='#9aa8b8',width=2)
for i in range(12): d.rectangle(((300+i*16.4)*S,164*S,(300+(i+1)*16.4)*S,189*S),outline='#8d9bad',width=2)
d.line((35*S,239*S,540*S,239*S),fill='#9aa8b8',width=2); d.line((35*S,280*S,540*S,280*S),fill='#9aa8b8',width=2)
for i in range(10): d.rectangle(((120+i*18)*S,309*S,(120+(i+1)*18)*S,332*S),outline='#8d9bad',width=2)
d.text((35*S,346*S),'Draft only • Review all details • No transaction has occurred',font=ft(6*S),fill='#667085')
path=ROOT/'static/withdrawal_template.jpg'; im.save(path,format='JPEG',quality=99,subsampling=0,optimize=True)
config['withdrawal']={'template':'static/withdrawal_template.jpg','page':{'width':581,'height':373},'text_fields':{'name':{'x':35,'y':227,'font_size':8,'max_width':500},'date':{'x':430,'y':352,'font_size':7,'max_width':100},'amount_figures':{'x':35,'y':134,'font_size':8,'max_width':500},'amount_words':{'x':35,'y':93,'font_size':7,'max_width':500},'draft_label':{'x':450,'y':352,'font_size':7,'max_width':90}},'digit_fields':{'account_id':{'first_digit_x':302,'step_x':16.4,'baseline_y':190,'font_size':8,'cells':12},'phone':{'first_digit_x':121,'step_x':18,'baseline_y':41,'font_size':7,'cells':10}},'signature_marker':{'x':360,'y':65,'width':170,'height':18,'label_x':400,'label_y':72,'font_size':7}}
CFG.write_text(json.dumps(config,indent=2),encoding='utf-8')
print('Regenerated clean 3x form templates and calibrated field maps.')
