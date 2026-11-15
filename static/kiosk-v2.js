/* Consent and sample-account form flow. */
(()=>{
const el=id=>document.getElementById(id), journey=window.voiceJourney;
let sid='',opening='',occupation='',taxRoute='',openingUrl='',openingFields=null;
const nativeFetch=window.fetch.bind(window);
window.fetch=(input,options={})=>{
  if(typeof input==='string'&&(input.startsWith('/api/forms/')||input==='/api/demo-profile/lookup')){
    const headers=new Headers(options.headers||{});if(sid)headers.set('X-Kiosk-Session',sid);options={...options,headers};
  }return nativeFetch(input,options);
};
async function api(path,data){const r=await fetch('/api/kiosk/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,session_id:sid})});const d=await r.json();if(!r.ok)throw Error(typeof d.detail==='string'?d.detail:'Please rescan or ask staff.');return d;}
async function askConsent(message){return window.kioskConsent?window.kioskConsent(message):false;}
async function consent(){if(!sid)sid=(await api('start',{consent:true,language})).session_id;}
async function scan(kind,file,selected=null){
  if(selected&&!selected())return null;
  if(!sid){
    if(!selected && !(await askConsent('Use synthetic documents only. Allow processing and simulated identity checks for this session?')))return null;
    const started=(await api('start',{consent:true,language})).session_id;
    if(selected&&!selected()){
      await nativeFetch('/api/session/clear',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session_id:started})}).catch(console.warn);
      return null;
    }
    sid=started;
  }
  const fd=new FormData();fd.append('session_id',sid);fd.append('kind',kind);fd.append('file',file);
  showLoading('Reading the synthetic document…','Checking the exact sample and preparing the next step');
  try{const r=await fetch('/api/kiosk/scan',{method:'POST',body:fd});const d=await r.json();if(!r.ok){const error=Error(d.detail||'Please rescan.');error.status=r.status;throw error;}return d;}finally{if(!selected||selected())hideLoading();}
}
async function sample(kind){return window.SahajDemoSamples.load(kind,file=>scan(kind,file));}
function displayProfile(d){passbook={...d.profile,profile:d.profile};el('confirmedAccount').value=d.profile.account_id;el('passbookNotice').textContent=`SIMULATED — NOT UIDAI VERIFIED. Exact lookup: ${d.lookup_ms} ms.`;}
window.SahajDemoSamples.loadPassbook=async(isCurrent=()=>true)=>{
 const d=await window.SahajDemoSamples.load('passbook',file=>scan('passbook',file,isCurrent));
 if(!isCurrent())return null;
 if(d?.profile)displayProfile(d);
 return d;
};
window.sahajDiscardDocumentSession=()=>{
 const ending=sid;sid='';opening='';occupation='';taxRoute='';openingFields=null;
 if(openingUrl)URL.revokeObjectURL(openingUrl);openingUrl='';
 if(ending)nativeFetch('/api/session/clear',{keepalive:true,method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session_id:ending})}).catch(console.warn);
};
const originalPrompt=journey.a.prompt;
journey.a.prompt=async(key,values={})=>{
 const additions={request:'नमस्ते! मैं आपकी कैसे मदद कर सकती हूँ? Hello! How may I help you? You can withdraw, deposit or ask for a new account form.',consent:'May I process the synthetic document and run simulated identity and account checks? Say yes or no. No real identity verification or money movement occurs.','consent-declined':'No document will be processed. Say yes if you wish to continue, or say finish.',passbook:'Please scan your passbook. For this demo, say scan to use the single synthetic sample.',done:'Your draft is downloaded. Sign the printed form and take it to the displayed counter. Say finish to end.'};
 let text=(window.kioskCopy[speakingLanguage]||window.kioskCopy.en)[key]||additions[key];
 if(!text){
  const previousSay=say;
  say=async(t,c,onend)=>{el('spokenPrompt').textContent=t;return previousSay(t,c,onend)};
  try{return await originalPrompt(key,values)}finally{say=previousSay;}
 }
 if(typeof TR==='function')text=TR(speakingLanguage,text);
 el('spokenPrompt').textContent=text;el('voicePanel').hidden=false;
 speechRestartAllowed=false;stopServerRecognition();try{speechRecognition?.abort()}catch{}
 await say(text,speakingLanguage,()=>{speechRestartAllowed=true;startRecognition()});
};
journey.a.consent=consent;
const priorIntent=journey.a.intent;
journey.a.intent=async text=>{if(/what (can|do) you (do|help)|what services|how (can|do) you help|क्या.?क्या|क्या कर सकती|क्या कर सकते|किसमें मदद|কি কি|என்ன உதவி|ಏನು ಸಹಾಯ|ਕੀ ਮਦਦ/i.test(text))return {intent:'help'};const result=await priorIntent(text);const service={withdrawal:'cash_withdrawal',deposit:'cash_deposit'}[result.intent];if(service){const r=await fetch('/api/service/'+service+'/requirements');if(!r.ok)throw Error('Service requirements unavailable. Please ask staff.');journey.requirements=await r.json();}return result;};
const priorCommand=journey.a.command;
journey.a.command=t=>/download|डाउनलोड|ਡਾਊਨਲੋਡ|ಡೌನ್|பதிவிறக்க|ডাউনলোড/i.test(t)?'download':/^(repeat|again|दोहराओ|ਦੁਹਰਾਓ|ಮತ್ತೆ|மீண்டும்|আবার)$/i.test(t)?'repeat':/^(start over|restart|फिर से शुरू)$/i.test(t)?'restart':/^(go back|back|पीछे)$/i.test(t)?'change':priorCommand(t);

journey.a.passbookNumber=t=>/scan|continue|yes|स्कैन|हाँ|स्कैन करो|ஸ்கேன்|ಸ್ಕ್ಯಾನ್|স্ক্যান|ਸਕੈਨ/i.test(t)?1:passbookChoiceFromSpeech(t)===1?1:0;
journey.a.readPassbook=async()=>{const d=await sample('passbook');if(!d)return'';displayProfile(d);return d.profile.account_id};
journey.a.lookup=async()=>{const d=await api('profile',{});return d.profile};
journey.a.passbooks=()=>{show('uploadScreen');el('voicePanel').hidden=false;};
journey.a.amountScreen=()=>{show('requestScreen');el('voicePanel').hidden=false;};
const oldHandle=journey.handle.bind(journey);
const openingIntent=/open.*account|new.*account|नया.*खाता|खाता.*खोल|ಹೊಸ.*ಖಾತೆ|கணக்கு.*திற|নতুন.*অ্যাকাউন্ট|ਨਵਾਂ.*ਖਾਤਾ/i;
async function speakKey(key,fallback){return speak((window.kioskCopy[speakingLanguage]||{})[key]||fallback);}
async function speak(text){el('voicePanel').hidden=false;el('spokenPrompt').textContent=text;await say(text,speakingLanguage,()=>{speechRestartAllowed=true;startRecognition()});}
journey.handle=async text=>{
 const token=journey.epoch;
 if(/^(finish|end session|खत्म|समाप्त|ਮੁਕੰਮਲ|ਮੁਕਾਓ|ಮುಗಿಸಿ|முடி|முடிக்கவும்|শেষ)$/i.test(text)){endSession();return;}
 if(openingIntent.test(text)&&!opening){const r=await fetch('/api/service/account_opening/requirements');if(!r.ok){await speak('Account applications are unavailable. Please ask staff.');return;}journey.requirements=await r.json();opening='consent';show('openingScreen');await speakKey('openingConsent','I can prepare a new savings account application. May I use the synthetic identity sample for a simulated check? Say yes or no.');return;}
 if(/^(start over|restart)$/i.test(text)){endSession();return;}
 if(!opening)return oldHandle(text);
 if(/^(go back|back)$/i.test(text)){opening='tax';await speak('Do you have a PAN card? You can say PAN. If you do not, say Form sixty.');return;}

 if(journey.busy)return;
 journey.busy=true;
 try{
  if(/repeat|again|दोहराओ/i.test(text)){await speak(el('spokenPrompt').textContent);return;}
  if(negative(text)){opening='consent';await speak('We can start the application again. May I process the synthetic identity sample? Say yes or no.');return;}
  if(opening==='consent'){
    if(!affirmative(text)){await speak('Please say yes or no.');return;}
    await consent();if(token!==journey.epoch)return;const d=await sample('identity');if(!d||token!==journey.epoch)return;
    openingFields=d.fields;el('openingSummary').textContent=Object.values(d.fields).join(' · ');opening='tax';await speakKey('tax',`The synthetic sample belongs to ${d.fields.name}. OCR was cross-checked with the synthetic sample. This is not real KYC. Say PAN or Form sixty for the tax-document route.`);return;
  }
  if(opening==='tax'){
    if(/pan|पैन|ਪੈਨ|பான்|ಪ್ಯಾನ್|প্যান/i.test(text)){await sample('pan');if(token!==journey.epoch)return;taxRoute='pan';}
    else if(/60|sixty|साठ|form|ਸੱਠ|ಅರವತ್ತು|அறுபது|ষাট/i.test(text))taxRoute='form60';
    else{await speak('Do you have a PAN card? Say PAN, or say no PAN for Form sixty.');return;}
    opening='occupation';await speakKey('occupation','What is your occupation?');return;
  }
  if(opening==='occupation'){occupation=String(text).trim().slice(0,100);opening='review';await speak(`${(window.kioskCopy[speakingLanguage]||{}).openingReview||'Review the synthetic application. Is this correct? Say yes or no.'} ${openingFields.name}. ${openingFields.dob}. ${openingFields.address}. ${taxRoute}. ${occupation}.`);return;}
  if(opening==='review'&&affirmative(text)){
    const r=await fetch('/api/kiosk/opening-draft',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session_id:sid,occupation,tax_route:taxRoute,confirmed:true})});
    if(token!==journey.epoch)return;if(!r.ok)throw Error('The application could not be prepared. Please ask staff.');
    if(openingUrl)URL.revokeObjectURL(openingUrl);const blob=await r.blob();if(token!==journey.epoch)return;openingUrl=URL.createObjectURL(blob);el('samplePdfPreview').src=openingUrl;el('samplePdfPreview').hidden=false;show('otherFormScreen');el('otherFormTitle').textContent='Savings application — staff KYC required';el('selectedFormFields').replaceChildren();el('selectedFormImage').hidden=true;el('previewSampleForm').hidden=true;el('downloadSampleForm').hidden=true;opening='download';await speakKey('openingReady','Your application draft is ready for review. Say download to save it.');return;
  }
  if(opening==='download'&&/download|डाउनलोड|ಡೌನ್|பதிவிறக்க|ডাউনলোড/i.test(text)){
    const a=document.createElement('a');a.href=openingUrl;a.download='savings-application-draft.pdf';a.click();await loadCounter('account_opening');show('counterScreen');opening='done';await speakKey('openingDone','Take the signed application to Counter 2. Staff must complete KYC and account opening. Say finish to end.');return;
  }
  await speak(el('spokenPrompt').textContent);
 }catch(error){if(token===journey.epoch){await speak(error.message);journey.a.fallback();}}finally{journey.busy=false;}
};
el('spokenYes').onclick=()=>journey.handle('yes');el('spokenNo').onclick=()=>journey.handle('no');el('spokenRepeat').onclick=()=>opening?speak(el('spokenPrompt').textContent):journey.repeat();el('spokenHelp').onclick=()=>speak('Please ask a bank staff member for assistance. This demo has not submitted a transaction.');
document.querySelector('[data-sample]').onclick=async()=>{if(mode==='voice'&&journey.stage==='passbook')return journey.handle('scan');try{const screen=activeScreen;const d=await sample('passbook');if(d && screen===activeScreen){displayProfile(d);show('formsScreen')}}catch(e){el('ocrStatus').textContent=e.message}};
el('image').onchange=async()=>{const f=el('image').files[0];if(!f)return;try{const d=await scan('passbook',f);if(d){displayProfile(d);show('formsScreen')}}catch(e){el('ocrStatus').textContent=e.message}};
const oldEnd=endSession;endSession=()=>{const ending=sid;sid='';opening='';occupation='';taxRoute='';openingFields=null;if(openingUrl)URL.revokeObjectURL(openingUrl);openingUrl='';el('voicePanel').hidden=true;el('spokenPrompt').textContent='';oldEnd();if(ending)nativeFetch('/api/session/clear',{keepalive:true,method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session_id:ending})}).catch(console.warn);};
el('openingStart').onclick=()=>{speakingLanguage=language;return journey.handle('open new account')};
 el('fallbackReply').onsubmit=async event=>{event.preventDefault();const input=el('replyText');const text=input.value.trim();if(!text)return;input.value='';await journey.handle(text);};
function update(){
 const c=window.kioskCopy[language]||window.kioskCopy.en;
 for(const [id,key] of [['spokenYes','yes'],['spokenNo','no'],['spokenRepeat','repeat'],['spokenHelp','help']])el(id).textContent=c[key];
 if(opening){const step=el('journeySteps').children[1];step.querySelector('span').firstChild.textContent='Scan identity';step.querySelector('small').textContent='No passbook needed';}
 el('sampleHeading').textContent='One synthetic passbook';el('sampleDescription').textContent='Use the sample below. No real customer documents.';

 el('voicePanel').hidden=mode!=='voice'&&!opening;
 el('manualAccountEntry').hidden=true;if(!(window.SahajHome&&window.SahajHome.isExplicit()))el('footerText').textContent+=' · SIMULATED — NOT UIDAI VERIFIED';
 el('uploadTitle').textContent=words(language).upload;
 el('uploadDescription').textContent=typeof TR==='function'?TR(language,'Scan the single synthetic passbook sample, or upload that sample image.'):'Scan the single synthetic passbook sample.';
 if(EXTRA_UI.includes(language)){const t=XT[language].manualCopy;for(const id of ['languageTitle','languageDescription','languageNote','formsTitle','formsIntro','accountTitle','accountIntro'])if(t[id])el(id).textContent=t[id];}
 el('languageNote').textContent='हिन्दी · English · ਪੰਜਾਬੀ · ಕನ್ನಡ · தமிழ் · বাংলা';
 if(language==='en'&&!(window.SahajHome&&window.SahajHome.isExplicit()))el('permissionText').textContent='Speak your request. Scan one synthetic document. Confirm by voice and leave with a printable draft.';
 const languageList=document.querySelector('.welcome-language');if(languageList)languageList.textContent='हिन्दी · English · ਪੰਜਾਬੀ · ಕನ್ನಡ · தமிழ் · বাংলা';
}
window.addEventListener('sahaj:screen',update);window.addEventListener('sahaj:locale',update);update();
})();
