const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const correction=require('../static/service-correction.js');
const parsed=(text)=>correction.parse(text);

const phrases={
 en:{back:'go back',wrong:'No, I chose the wrong service',restart:'start over',change:'change service',switch:'I don\'t want to withdraw money, I want to deposit money',open:'I do not want withdrawal, I want to open a bank account'},
 hi:{back:'मुझे वापस जाना है',wrong:'नहीं, मैंने गलत बोल दिया',restart:'फिर से शुरू करो',change:'सेवा बदलना है',switch:'मुझे पैसे नहीं निकालने, जमा करने हैं',open:'नहीं, निकासी नहीं, नया खाता खोलना है'},
 pa:{back:'ਪਿੱਛੇ ਜਾਓ',wrong:'ਮੈਂ ਗਲਤ ਚੁਣ ਲਿਆ',restart:'ਮੁੜ ਸ਼ੁਰੂ ਕਰੋ',change:'ਹੋਰ ਸੇਵਾ ਚੁਣੋ',switch:'ਮੈਨੂੰ ਪੈਸੇ ਨਹੀਂ ਕੱਢਣੇ, ਜਮ੍ਹਾ ਕਰਨੇ ਨੇ',open:'ਮੈਨੂੰ ਪੈਸੇ ਨਹੀਂ ਕੱਢਣੇ, ਨਵਾਂ ਖਾਤਾ ਖੋਲ੍ਹਣਾ ਹੈ'},
 bn:{back:'পিছনে যাও',wrong:'আমি ভুল বলেছি',restart:'আবার শুরু করো',change:'অন্য পরিষেবা চাই',switch:'আমি টাকা তুলতে চাই না, জমা দিতে চাই',open:'আমি টাকা তুলতে চাই না, নতুন অ্যাকাউন্ট খুলতে চাই'},
 ta:{back:'பின்னால் போ',wrong:'நான் தவறாக சொன்னேன்',restart:'மீண்டும் தொடங்கு',change:'வேறு சேவை தேர்வு',switch:'எனக்கு பணம் எடுக்க வேண்டாம், பணம் செலுத்த வேண்டும்',open:'பணம் எடுக்க வேண்டாம், புதிய கணக்கு வேண்டும்'},
 kn:{back:'ಹಿಂದೆ ಹೋಗು',wrong:'ನಾನು ತಪ್ಪಾಗಿ ಹೇಳಿದೆ',restart:'ಮತ್ತೆ ಪ್ರಾರಂಭಿಸಿ',change:'ಬೇರೆ ಸೇವೆ ಆಯ್ಕೆಮಾಡಿ',switch:'ನನಗೆ ಹಣ ತೆಗೆಯಬೇಡ ಜಮೆ ಮಾಡಬೇಕು',open:'ಹಣ ತೆಗೆಯಬೇಡ, ಹೊಸ ಖಾತೆ ತೆರೆಯಬೇಕು'}
};
for(const [language,p] of Object.entries(phrases)){
 test(`${language}: back, mistake, restart, choose and service corrections`,()=>{
  assert.deepEqual(parsed(p.back),{action:'back'});
  assert.deepEqual(parsed(p.wrong),{action:'choose'});
  assert.deepEqual(parsed(p.restart),{action:'restart'});
  assert.deepEqual(parsed(p.change),{action:'choose'});
  assert.deepEqual(parsed(p.switch),{action:'service',service:'deposit'});
  assert.deepEqual(parsed(p.open),{action:'service',service:'opening'});
 });
 test(`${language}: navigation labels and all recovery actions exist`,()=>{
  const c=correction.copy[language];
  for(const key of ['button','title','back','choose','restart','cancel','choosePrompt','restartPrompt'])
   assert.ok(c[key]?.length>2,`${language} ${key}`);
 });
}
test('recognizes direct service requests in all six scripts',()=>{
 for(const [phrase, service] of [
  ['I need to withdraw cash','withdrawal'],['I want to deposit','deposit'],['Open a new account','opening'],
  ['मुझे पैसे निकालने हैं','withdrawal'],['मैं पैसे जमा करना चाहती हूँ','deposit'],['नया खाता खोलना है','opening'],
  ['ਮੈਨੂੰ ਪੈਸੇ ਕੱਢਣੇ ਨੇ','withdrawal'],['ਮੈਨੂੰ ਪੈਸੇ ਜਮ੍ਹਾ ਕਰਾਉਣੇ ਨੇ','deposit'],['ਨਵਾਂ ਖਾਤਾ ਖੋਲ੍ਹਣਾ ਹੈ','opening'],
  ['আমি টাকা তুলতে চাই','withdrawal'],['আমি টাকা জমা দিতে চাই','deposit'],['নতুন অ্যাকাউন্ট খুলতে চাই','opening'],
  ['எனக்கு பணம் எடுக்க வேண்டும்','withdrawal'],['எனக்கு பணம் செலுத்த வேண்டும்','deposit'],['புதிய கணக்கு தொடங்க வேண்டும்','opening'],
  ['ನನಗೆ ಹಣ ತೆಗೆಯಬೇಕು','withdrawal'],['ನನಗೆ ಹಣ ಜಮೆ ಮಾಡಬೇಕು','deposit'],['ಹೊಸ ಖಾತೆ ತೆರೆಯಬೇಕು','opening'],
  ['enakku panam edukka vendum','withdrawal'],['nanage hana jame madbeku','deposit']
 ])assert.deepEqual(parsed(phrase),{action:'service',service},phrase);
});
test('never chooses a negated-only service or confuses a plain no with a restart',()=>{
 assert.deepEqual(parsed('I don\'t want to withdraw'),{action:'choose'});
 assert.deepEqual(parsed('मुझे निकासी नहीं करनी'),{action:'choose'});
 assert.deepEqual(parsed('பணம் எடுக்க வேண்டாம்'),{action:'choose'});
 assert.equal(parsed('no'),null);
 assert.equal(parsed('नहीं'),null);
 assert.equal(parsed('হ্যাঁ'),null);
 assert.equal(parsed('500'),null);
 assert.equal(parsed('I am an accountant'),null);
});
test('preserves correction priority and recovery controls in current workflow',()=>{
 const flow=fs.readFileSync(path.join(__dirname,'../static/kiosk-v8.js'),'utf8');
 const html=fs.readFileSync(path.join(__dirname,'../static/index.html'),'utf8');
 const opening=fs.readFileSync(path.join(__dirname,'../static/kiosk-opening-simple.js'),'utf8');
 const handler=flow.slice(flow.indexOf('async function handleVoice(raw'));
 assert.ok(handler.indexOf('SahajServiceCorrection?.parse(t)')<handler.indexOf("if(step==='opening')"));
 assert.match(flow,/clearCurrentDraft\(\)/);
 assert.match(flow,/window\.SahajOpeningFlow\?\.abort/);
 assert.match(flow,/function navigateBack\(\)/);
 assert.match(flow,/function installCorrectionControls\(\)/);
 assert.match(html,/service-correction\.js/);
 assert.match(opening,/abort\(\)/);
});

test('a cancelled passbook scan cannot restore a previously selected account',async()=>{
 const vm=require('node:vm');
 const source=fs.readFileSync(path.join(__dirname,'../static/kiosk-v2.js'),'utf8');
 const start=source.indexOf('async function sample(kind)');
 const end=source.indexOf('const originalPrompt=',start);
 let resolveScan;
 const previous={name:'No account',profile:null};
 const ctx={
  window:{SahajDemoSamples:{load:()=>new Promise(resolve=>{resolveScan=resolve})}},
  passbook:previous,
  el:()=>({value:'',textContent:''}),
  sid:'',opening:'',occupation:'',taxRoute:'',openingFields:null,openingUrl:'',
  URL:{revokeObjectURL:()=>{}},
  nativeFetch:()=>Promise.resolve(),console
 };
 vm.createContext(ctx);
 vm.runInContext(source.slice(start,end),ctx);
 let current=true;
 const pending=ctx.window.SahajDemoSamples.loadPassbook(()=>current);
 current=false;
 resolveScan({profile:{name:'Late account',account_id:'12345678'}});
 assert.equal(await pending,null);
 assert.equal(ctx.passbook,previous);
});

test('switching services keeps the same verified demo account but clears the old amount and preview',async()=>{
 const vm=require('node:vm');
 const flow=fs.readFileSync(path.join(__dirname,'../static/kiosk-v8.js'),'utf8');
 const start=flow.indexOf('function cancelCurrentWork(');
 const end=flow.indexOf('async function handleVoice(',start);
 assert.ok(start>0&&end>start);
 const calls=[];
 const elements=new Map();
 const ctx={
  scanTurn:0,busy:true,failedReplies:2,reviewAmount:500,detectedAmount:'500',readyPayload:{amount:500},
  counterEndTimer:null,step:'review',service:'withdrawal',activeScreen:'v9ReviewScreen',
  language:'pa',speakingLanguage:'pa',mode:'manual',imageFile:null,currentIntent:'withdrawal',flowStage:'review',
  passbook:{profile:{name:'Test Customer',account_id:'12345678',balance:1500}},
  window:{sahajCancelSpeech:()=>calls.push('stop-speech'),sahajDiscardDocumentSession:()=>calls.push('clear-session'),
   sahajV11:{cancelSequence:()=>{}},SahajOpeningFlow:{abort:()=>calls.push('abort-opening')},
   voiceJourney:{reset:()=>{}} ,SahajServiceCorrection:correction},
  clearTimeout:()=>{},hideLoading:()=>{},resetSamplePreview:()=>calls.push('clear-preview'),
  el:id=>{if(!elements.has(id))elements.set(id,{value:'',hidden:false});return elements.get(id)},
  show:id=>{ctx.activeScreen=id},greetView:()=>{},localizeV8:()=>{},
  status:()=>{},currentQuestion:()=>'Which service?',promptVoice:async()=>{},
  chooseService:async kind=>{ctx.service=kind;ctx.step=kind==='opening'?'opening':'passbook';},
  showAmount:()=>{ctx.step='amount'},console
 };
 vm.createContext(ctx);
 vm.runInContext(flow.slice(start,end),ctx);
 await ctx.navigateCorrection({action:'service',service:'deposit'});
 assert.equal(ctx.service,'deposit');assert.equal(ctx.step,'amount');
 assert.equal(ctx.passbook.profile.account_id,'12345678');
 assert.equal(ctx.reviewAmount,0);assert.equal(ctx.detectedAmount,'');
 assert.equal(ctx.readyPayload,null);assert.equal(ctx.busy,false);
 assert.ok(calls.includes('clear-preview'));
 assert.ok(!calls.includes('clear-session'),'verified profile is reused only for withdrawal/deposit');
 await ctx.navigateCorrection({action:'service',service:'opening'});
 assert.equal(ctx.service,'opening');assert.equal(ctx.step,'opening');
 assert.equal(ctx.passbook.profile,null);
 assert.ok(calls.includes('clear-session'));
 assert.equal(ctx.language,'pa');assert.equal(ctx.speakingLanguage,'pa');
});

test('start over clears account details but keeps independent screen and voice preferences',async()=>{
 const vm=require('node:vm');
 const flow=fs.readFileSync(path.join(__dirname,'../static/kiosk-v8.js'),'utf8');
 const start=flow.indexOf('function cancelCurrentWork(');
 const end=flow.indexOf('async function handleVoice(',start);
 const nodes={};let heard='';
 const ctx={
  scanTurn:0,busy:false,failedReplies:0,reviewAmount:500,detectedAmount:'500',readyPayload:{amount:500},
  counterEndTimer:null,step:'amount',service:'withdrawal',activeScreen:'v8AmountScreen',
  language:'en',speakingLanguage:'ta',mode:'voice',passbook:{profile:{account_id:'12345678'}},
  window:{sahajCancelSpeech(){},sahajDiscardDocumentSession(){},sahajV11:{cancelSequence(){}},
   SahajServiceCorrection:correction,voiceJourney:{reset(){}}},
  clearTimeout(){},hideLoading(){},resetSamplePreview(){},
  el:id=>nodes[id]??={value:'500',hidden:false},show:id=>{ctx.activeScreen=id},
  greetView(){},localizeV8(){},status(){},currentQuestion:()=> 'Tamil service question',
  promptVoice:async msg=>{heard=msg},console
 };
 vm.createContext(ctx);
 vm.runInContext(flow.slice(start,end),ctx);
 await ctx.navigateCorrection({action:'restart'});
 assert.equal(ctx.service,'');assert.equal(ctx.step,'service');
 assert.equal(ctx.passbook.profile,null);assert.equal(ctx.activeScreen,'voiceScreen');
 assert.equal(ctx.language,'en');assert.equal(ctx.speakingLanguage,'ta');
 assert.ok(heard.startsWith(correction.copy.ta.restartPrompt),heard);
});
