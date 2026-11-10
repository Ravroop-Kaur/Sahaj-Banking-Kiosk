const test=require('node:test');
const assert=require('node:assert/strict');
const Journey=require('../static/voice-journey.js');
function setup(){
 const calls=[];const noop=()=>{};
 const actions={stage:noop,prompt:async k=>calls.push(k),transcript:noop,language:()=>false,
 command:t=>t==='finish'?'end':t==='download'?'download':'',yes:t=>t==='yes',no:t=>t==='no',
 intent:async t=>({intent:t.includes('deposit')?'deposit':'withdrawal',amount:t.match(/\d+/)?.[0]}),
 consent:async()=>calls.push('consented'),passbooks:noop,passbookNumber:t=>t==='scan'?1:0,
 readPassbook:async()=>'990000000001',lookup:async()=>({name:'Synthetic Person'}),
 amountScreen:noop,showAmount:noop,invalidate:noop,amount:t=>t.match(/\d+/)?.[0],
 prepare:async()=>{calls.push('prepared');return'ready'},download:async()=>true,
 fallback:noop,end:noop,error:e=>{throw e}};
 return {journey:new Journey(actions),calls,actions};
}
test('withdrawal retains spoken amount, waits for consent and explicit review',async()=>{
 const {journey:j,calls}=setup();await j.handle('withdraw 5000');assert.equal(j.stage,'consent');
 await j.handle('maybe');assert.ok(!calls.includes('consented'));
 await j.handle('yes');await j.handle('scan');assert.equal(j.stage,'amount-confirmed');assert.equal(j.amount,'5000');
 await j.handle('');await j.handle('hmm');assert.ok(!calls.includes('prepared'));
 await j.handle('yes');assert.equal(j.stage,'download');await j.handle('download');assert.equal(j.stage,'done');
});
test('deposit asks only for missing amount and lets customer correct it',async()=>{
 const {journey:j}=setup();await j.handle('deposit');await j.handle('yes');await j.handle('scan');assert.equal(j.stage,'amount');
 await j.handle('2000');await j.handle('no');assert.equal(j.stage,'amount');assert.equal(j.amount,'');
 await j.handle('3000');assert.equal(j.amount,'3000');
});
test('declining consent never scans or grants session consent',async()=>{
 const {journey:j,calls}=setup();await j.handle('withdraw 100');await j.handle('no');await j.handle('scan');
 assert.equal(j.stage,'consent');assert.ok(!calls.includes('consented'));
});
test('session reset cancels late OCR completion',async()=>{
 const {journey:j,actions}=setup();let resolve;actions.readPassbook=()=>new Promise(r=>resolve=r);
 await j.handle('withdraw 100');await j.handle('yes');const pending=j.handle('scan');j.reset();resolve('990000000001');await pending;
 assert.equal(j.stage,'request');assert.equal(j.profile,null);
});
test('asking what the kiosk can do explains services without starting a banking operation',async()=>{
 const {journey:j,actions,calls}=setup();actions.intent=async()=>({intent:'help'});
 await j.handle('what can you do');
 assert.equal(j.stage,'request');assert.ok(calls.includes('services'));assert.ok(!calls.includes('consented'));
});
test('clearly unsupported service is identified as unavailable, not unintelligible',async()=>{
 const {journey:j,actions,calls}=setup();actions.intent=async()=>({intent:'unsupported'});
 await j.handle('I need a loan');assert.ok(calls.includes('unsupported'));assert.equal(j.stage,'request');
});
test('genuinely unclear input gets a simple retry',async()=>{
 const {journey:j,actions,calls}=setup();actions.intent=async()=>({intent:'unclear'});
 await j.handle('???');assert.ok(calls.includes('unclear'));assert.equal(j.stage,'request');
});
