const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const script = fs.readFileSync('static/demo-sample-fallback.js', 'utf8');

function createLoader(fetchImpl) {
  const scope = {window: {}, fetch: fetchImpl,
    File: class {constructor(blobs, name, props) {this.blobs=blobs;this.name=name;this.type=props.type;}},
    console: {warn() {}}};
  vm.runInNewContext(script, scope);
  return scope.window.SahajDemoSamples.load;
}
const sample = () => ({ok:true, blob:async()=>({size:10})});

test('primary passbook is used when it works, without requesting backups', async()=>{
  const requested=[];
  const load=createLoader(async url=>{requested.push(url);return sample()});
  const result=await load('passbook', async file=>({loaded:file.name}));
  assert.equal(result.loaded,'01-clear-front.png');
  assert.equal(requested.length,1);
});

test('automatically tries remaining passbooks after download and OCR failures', async()=>{
  const requested=[];
  const load=createLoader(async url=>{
    requested.push(url);
    if(url.includes('01-clear-front'))return {ok:false};
    return sample();
  });
  const chosen=await load('passbook', async file=>{
    if(file.name==='passbook-008.png'){const error=new Error('OCR mismatch');error.status=422;throw error;}
    return {loaded:file.name};
  });
  assert.equal(chosen.loaded,'passbook-015.png');
  assert.equal(requested.length,3);
});

test('Aadhaar and PAN backups keep the same document types', async()=>{
  const requested=[];
  const load=createLoader(async url=>{requested.push(url);return sample()});
  for (const kind of ['identity','pan']){
    const found=await load(kind,async file=>{
      if(!file.name.includes('backup-2')){const e=new Error('Cannot read');e.status=422;throw e;}
      return file.name;
    });
    assert.equal(found,kind+'-backup-2.png');
  }
  assert.equal(requested.length,6);
});

test('does not retry another identity if permission or document mismatch is denied', async()=>{
  const requests=[];
  const load=createLoader(async url=>{requests.push(url);return sample()});
  await assert.rejects(load('pan',async()=>{const error=Error('PAN does not match identity');error.status=409;throw error;}),/PAN does not match identity/);
  assert.equal(requests.length,1);
});

test('consent refusal is not bypassed by loading a different sample', async()=>{
  const requests=[];
  const load=createLoader(async url=>{requests.push(url);return sample()});
  assert.equal(await load('identity',async()=>null),null);
  assert.equal(requests.length,1);
});

test('all failed samples report a safe failure', async()=>{
  const load=createLoader(async()=>({ok:false}));
  await assert.rejects(load('passbook',async()=>({})),/Could not read the demo passbook sample/);
});
