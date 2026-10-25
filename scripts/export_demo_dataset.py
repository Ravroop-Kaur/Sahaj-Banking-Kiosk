"""Create a repeatable fictional transaction table and CSV exports for the linked demo dataset."""
from pathlib import Path
import csv, random, sqlite3, json
ROOT=Path(__file__).resolve().parents[1]; DB=ROOT/'data'/'synthetic_banking.sqlite3'; OUT=ROOT/'data'/'exports'; OUT.mkdir(parents=True,exist_ok=True)
rng=random.Random(20261025)
conn=sqlite3.connect(DB); conn.execute('PRAGMA foreign_keys=ON')
conn.executescript('''CREATE TABLE IF NOT EXISTS demo_transactions(transaction_id TEXT PRIMARY KEY,account_number TEXT NOT NULL REFERENCES accounts(account_number),transaction_date TEXT NOT NULL,transaction_type TEXT NOT NULL CHECK(transaction_type IN ('DEMO_CREDIT','DEMO_DEBIT')),amount_paise INTEGER NOT NULL CHECK(amount_paise>0),description TEXT NOT NULL,demo_only INTEGER NOT NULL DEFAULT 1 CHECK(demo_only=1));''')
accounts=[r[0] for r in conn.execute('SELECT account_number FROM accounts ORDER BY account_number')]
for account in accounts:
    for j in range(1,4):
        tx=f'DEMO-TXN-{account[-4:]}-{j:02d}'
        conn.execute('INSERT OR REPLACE INTO demo_transactions VALUES(?,?,?,?,?,?,1)',(tx,account,f'2026-{rng.randint(1,10):02d}-{rng.randint(1,28):02d}',rng.choice(['DEMO_CREDIT','DEMO_DEBIT']),rng.randint(10000,1200000),rng.choice(['Synthetic cash deposit','Synthetic cash withdrawal','Synthetic utility payment','Synthetic transfer'])))
conn.commit()
tables=['customers','accounts','synthetic_identifications','demo_preferences','demo_transactions']
for table in tables:
    cur=conn.execute('SELECT customer_id, preferred_language, demo_only FROM demo_preferences' if table == 'demo_preferences' else f'SELECT * FROM {table}'); headers=[d[0] for d in cur.description]; rows=cur.fetchall()
    with (OUT/f'{table}.csv').open('w',newline='',encoding='utf-8-sig') as f:
        w=csv.writer(f); w.writerow(headers); w.writerows(rows)
    print(table,len(rows))
# Unified lookup export for easy inspection; SQLite remains source of truth.
rows=conn.execute('''SELECT c.customer_id,c.customer_ref,c.full_name,c.phone,c.address,c.date_of_birth,c.occupation,a.account_number,a.account_type,a.branch_name,a.ifsc,a.cif,a.balance_paise,a.status,p.preferred_language,i.id_value AS demo_id_value
FROM customers c JOIN accounts a USING(customer_id) LEFT JOIN demo_preferences p USING(customer_id) LEFT JOIN synthetic_identifications i ON i.customer_id=c.customer_id AND i.id_type='DEMO_ID' ORDER BY c.customer_id''').fetchall()
headers=[d[0] for d in conn.execute('''SELECT c.customer_id,c.customer_ref,c.full_name,c.phone,c.address,c.date_of_birth,c.occupation,a.account_number,a.account_type,a.branch_name,a.ifsc,a.cif,a.balance_paise,a.status,p.preferred_language,i.id_value AS demo_id_value FROM customers c JOIN accounts a USING(customer_id) LEFT JOIN demo_preferences p USING(customer_id) LEFT JOIN synthetic_identifications i ON i.customer_id=c.customer_id AND i.id_type='DEMO_ID' LIMIT 0''').description]
with (OUT/'account_customer_document_lookup.csv').open('w',newline='',encoding='utf-8-sig') as f:
    w=csv.writer(f); w.writerow(headers); w.writerows(rows)
# manifest ties each generated asset filename to its account number.
manifest=[]
for cid,acct,name in conn.execute('SELECT c.customer_id,a.account_number,c.full_name FROM customers c JOIN accounts a USING(customer_id) ORDER BY c.customer_id'):
    manifest.append({'customer_id':cid,'account_number':acct,'full_name':name,'passbook':f'static/synthetic_documents/passbooks/passbook-{cid:03d}.png','synthetic_aadhaar_mockup':f'static/synthetic_documents/demo_aadhaar_cards/demo-aadhaar-{cid:03d}.png','synthetic_pan_mockup':f'static/synthetic_documents/demo_pan_cards/demo-pan-{cid:03d}.png','legacy_demo_id_card':f'static/synthetic_documents/demo_id_cards/demo-id-{cid:03d}.png','valid_for_real_use':False})
(ROOT/'data'/'synthetic_document_manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
conn.close()
