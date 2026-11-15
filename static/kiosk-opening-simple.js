/* Account-opening form, one question at a time. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
let previewUrl='';
let sid='',pdfUrl='',working=false,phase='identity',occupation='',panChoice='';
const steps=['simpleOpeningStart','simpleOpeningOccupationStep','simpleOpeningConfirmStep','simpleOpeningPanStep','simpleOpeningStaffStep','simpleOpeningReviewStep','simpleOpeningResult'];
const isHi=()=>language==='hi';
const messages={identity:['Physical scanning is unavailable. Choose or say Demo Aadhaar to continue.','असली आधार स्कैन अभी उपलब्ध नहीं है। डेमो आधार चुनें या बोलें डेमो आधार।'],occupation:['What work do you do?','आप क्या काम करते हैं?'],confirm:['Is this your profession? Say yes or no.','क्या यही आपका काम है? हाँ या ना कहें।'],pan:['Do you have a PAN card? Say yes or no.','क्या आपके पास पैन कार्ड है? हाँ या ना कहें।'],review:['Please check the fictional details. Say yes to prepare the application, or no to change your profession.','नमूने की जानकारी जाँचें। सही होने पर हाँ कहें। काम बदलने के लिए ना कहें।'],staff:['PAN is not available. Staff can help with Form 60. Say yes for directions.','PAN नहीं है। Form 60 की प्रक्रिया के लिए कर्मचारी सहायता करेंगे। दिशा जानने के लिए हाँ कहें।']};
const regionalPrompts = {
  "pa": {
    "identity": "ਡੈਮੋ ਆਧਾਰ ਚੁਣੋ ਜਾਂ ਡੈਮੋ ਆਧਾਰ ਕਹੋ।",
    "occupation": "ਤੁਸੀਂ ਕੀ ਕੰਮ ਕਰਦੇ ਹੋ?",
    "confirm": "ਕੀ ਇਹ ਤੁਹਾਡਾ ਕੰਮ ਹੈ? ਹਾਂ ਜਾਂ ਨਹੀਂ ਕਹੋ।",
    "pan": "ਕੀ ਤੁਹਾਡੇ ਕੋਲ ਪੈਨ ਕਾਰਡ ਹੈ? ਹਾਂ ਜਾਂ ਨਹੀਂ ਕਹੋ।",
    "review": "ਵੇਰਵੇ ਜਾਂਚੋ। ਫਾਰਮ ਬਣਾਉਣ ਲਈ ਹਾਂ ਜਾਂ ਕੰਮ ਬਦਲਣ ਲਈ ਨਹੀਂ ਕਹੋ।",
    "staff": "ਫਾਰਮ 60 ਲਈ ਕਰਮਚਾਰੀ ਨੂੰ ਮਿਲੋ।"
  },
  "bn": {
    "identity": "ডেমো আধার বেছে নিন অথবা ডেমো আধার বলুন।",
    "occupation": "আপনি কী কাজ করেন?",
    "confirm": "এটাই কি আপনার পেশা? হ্যাঁ বা না বলুন।",
    "pan": "আপনার কি প্যান কার্ড আছে? হ্যাঁ বা না বলুন।",
    "review": "বিবরণ যাচাই করুন। ফর্ম তৈরি করতে হ্যাঁ বা পেশা বদলাতে না বলুন।",
    "staff": "ফর্ম ৬০ এর জন্য কর্মীর সঙ্গে কথা বলুন।"
  },
  "kn": {
    "identity": "ಡೆಮೊ ಆಧಾರ್ ಆಯ್ಕೆಮಾಡಿ ಅಥವಾ ಡೆಮೊ ಆಧಾರ್ ಎಂದು ಹೇಳಿ.",
    "occupation": "ನೀವು ಯಾವ ಕೆಲಸ ಮಾಡುತ್ತೀರಿ?",
    "confirm": "ಇದು ನಿಮ್ಮ ವೃತ್ತಿಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಎಂದು ಹೇಳಿ.",
    "pan": "ನಿಮ್ಮ ಬಳಿ ಪ್ಯಾನ್ ಕಾರ್ಡ್ ಇದೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಎಂದು ಹೇಳಿ.",
    "review": "ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ. ನಮೂನೆ ರಚಿಸಲು ಹೌದು ಅಥವಾ ವೃತ್ತಿ ಬದಲಿಸಲು ಇಲ್ಲ ಎಂದು ಹೇಳಿ.",
    "staff": "ಫಾರ್ಮ್ 60 ಕುರಿತು ಸಿಬ್ಬಂದಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ."
  },
  "ta": {
    "identity": "மாதிரி ஆதாரைத் தேர்ந்தெடுக்கவும் அல்லது டெமோ ஆதார் என்று சொல்லவும்.",
    "occupation": "நீங்கள் என்ன வேலை செய்கிறீர்கள்?",
    "confirm": "இது உங்கள் தொழிலா? ஆம் அல்லது இல்லை என்று சொல்லுங்கள்.",
    "pan": "உங்களிடம் பான் அட்டை உள்ளதா? ஆம் அல்லது இல்லை என்று சொல்லுங்கள்.",
    "review": "விவரங்களைச் சரிபார்க்கவும். படிவத்தை உருவாக்க ஆம் அல்லது தொழிலை மாற்ற இல்லை என்று சொல்லுங்கள்.",
    "staff": "படிவம் 60 குறித்த உதவிக்கு ஊழியரை அணுகவும்."
  }
};
function phasePrompt(code) {
 return regionalPrompts[code]?.[phase] || messages[phase]?.[code==='hi'?1:0];
}
function status(t){$('simpleOpeningStatus').textContent=t||''}
let phaseVersion=0;
function showPhase(name){phaseVersion++;window.sahajResetRetries?.();phase=name;const id={identity:'simpleOpeningStart',occupation:'simpleOpeningOccupationStep',confirm:'simpleOpeningConfirmStep',pan:'simpleOpeningPanStep',staff:'simpleOpeningStaffStep',review:'simpleOpeningReviewStep',result:'simpleOpeningResult'}[name];for(const step of steps)$(step).hidden=step!==id;status('')}
function prompt(){window.dispatchEvent(new Event('sahaj:step'));const pair=messages[phase];if(!pair)return;const question=phasePrompt(speakingLanguage);const sentence=phase==='confirm' && jobLabels ? jobLabels.voice+'. '+question : question;if(phase==='confirm'||phase==='pan'){const title=$(phase==='confirm'?'simpleOpeningConfirmStep':'simpleOpeningPanStep').querySelector('h2');if(title)title.textContent=phasePrompt(language);}status('');if(mode==='voice'&&window.sahajOpeningPrompt)window.sahajOpeningPrompt(sentence)}
async function post(url,data){const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});if(!r.ok){let detail='The sample could not be processed. Ask a staff member.';try{const d=await r.json();if(typeof d.detail==='string')detail=d.detail}catch{}throw Error(detail)}return r}
async function scan(kind){
 const doc=kind==='identity'?'Aadhaar':'PAN';
 showLoading(isHi()?(doc==='PAN'?'डेमो पैन पढ़ा जा रहा है…':'डेमो आधार पढ़ा जा रहा है…'):'Reading demo '+doc+'…',isHi()?'जानकारी जाँची जा रही है।':'Checking the sample details.');
 try{return await readSample(kind)}finally{hideLoading()}
}
async function readSample(kind){return window.SahajDemoSamples.load(kind,async file=>{const f=new FormData();f.append('session_id',sid);f.append('kind',kind);f.append('file',file);const r=await fetch('/api/kiosk/scan',{method:'POST',body:f});if(!r.ok){const error=Error('Could not read the fictional identity sample');error.status=r.status;throw error;}return r.json()})}
async function clear(){if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=''}if(window.sahajV11)window.sahajV11.cancelSequence?.('opening');if(sid){const id=sid;sid='';await fetch('/api/session/clear',{keepalive:true,method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session_id:id})}).catch(()=>{})}if(pdfUrl){URL.revokeObjectURL(pdfUrl);pdfUrl=''}}
async function begin(){if(working||phase!=='identity'||activeScreen!=='openingScreen')return;
 $('simpleOpeningConsent').checked=true;
 const version=phaseVersion;working=true;if(mode==='voice')stopServerRecognition();$('simpleOpeningSample').disabled=true;$('simpleOpeningSampleStatus').textContent='Reading fictional Aadhaar sample…';try{sid=(await(await post('/api/kiosk/start',{consent:true,language})).json()).session_id;const data=await scan('identity');if(version!==phaseVersion)return;const f=data.fields||{};$('simpleOpeningPerson').textContent=f.name||'—';$('openingReviewDob').textContent=f.dob||'—';showPhase('occupation');prompt()}catch(e){$('simpleOpeningSampleStatus').textContent=e.message;await clear()}finally{working=false;$('simpleOpeningSample').disabled=false}}
let jobLabels=null;
let occupationTurn=0;
// Common answers work locally. Other descriptions go through the occupation interpreter.
const jobLanguages=['en','hi','pa','bn','ta','kn'];
const jobTerms=[
 'Actor|अभिनेता|ਅਦਾਕਾਰ|অভিনেতা|நடிகர்|ನಟ|अभिनेता|actress|एक्टर|ऐक्टर|एक्ट्रेस|अभिनेत्री|अभिनय करता हूँ|अभिनय करती हूँ',
 'Teacher|शिक्षक|ਅਧਿਆਪਕ|শিক্ষক|ஆசிரியர்|ಶಿಕ್ಷಕ|अध्यापक|शिक्षिका|अध्यापिका|टीचर|shikshak|टीचर',
 'Business owner|व्यवसायी|ਕਾਰੋਬਾਰੀ|ব্যবসায়ী|தொழில்முனைவோர்|ಉದ್ಯಮಿ|कारोबारी|धंधा|धन्धा|dhanda|कारोबार|व्यापार|ব্যবসা|ਕਾਰੋਬਾਰ|சொந்த தொழில்|own business|business',
 'Plumber|प्लंबर|ਪਲੰਬਰ|প্লাম্বার|குழாய் பழுதுபார்ப்பவர்|ಪ್ಲಂಬರ್|प्लम्बर|பிளம்பர்',
 'Farmer|किसान|ਕਿਸਾਨ|কৃষক|விவசாயி|ರೈತ|करसान|खेती करता हूँ|खेती करती हूँ|किसानी|চাষি',
 'Student|विद्यार्थी|ਵਿਦਿਆਰਥੀ|শিক্ষার্থী|மாணவர்|ವಿದ್ಯಾರ್ಥಿ|विद्यार्थी|छात्र|छात्रा',
 'Carpenter|बढ़ई|ਤਰਖਾਣ|ছুতার|தச்சர்|ಬಡಗಿ|तरखान|बढ़ई',
 'Tailor|दर्जी|ਦਰਜ਼ੀ|দর্জি|தையல்காரர்|ದರ್ಜಿ|दर्जी|सिलाई करता हूँ|सिलाई करती हूँ',
 'Driver|चालक|ਡਰਾਈਵਰ|চালক|ஓட்டுநர்|ಚಾಲಕ|ड्राइवर|गाड़ी चलाता हूँ|गाड़ी चलाती हूँ',
 'Electrician|इलेक्ट्रीशियन|ਇਲੈਕਟ੍ਰੀਸ਼ਨ|ইলেকট্রিশিয়ান|மின்சாரப் பணியாளர்|ಎಲೆಕ್ಟ್ರಿಷಿಯನ್|इलेक्ट्रीशियन',
 'Doctor|चिकित्सक|ਡਾਕਟਰ|চিকিৎসক|மருத்துவர்|ವೈದ್ಯ|डाक्टर|डॉक्टर|ডাক্তার',
 'Nurse|नर्स|ਨਰਸ|নার্স|செவிலியர்|ದಾದಿ|नर्स',
 'Shopkeeper|दुकानदार|ਦੁਕਾਨਦਾਰ|দোকানদার|கடைக்காரர்|ಅಂಗಡಿಯವರು|दुकानदार|दुकान चलाता हूँ|दुकान चलाती हूँ',
 'Engineer|इंजीनियर|ਇੰਜੀਨੀਅਰ|প্রকৌশলী|பொறியாளர்|ಎಂಜಿನಿಯರ್|इंजीनियर',
 'Lawyer|वकील|ਵਕੀਲ|আইনজীবী|வழக்கறிஞர்|ವಕೀಲ|वकील',
 'Boat builder|नाव निर्माता|ਕਿਸ਼ਤੀ ਨਿਰਮਾਤਾ|নৌকা নির্মাতা|படகு கட்டுபவர்|ದೋಣಿ ನಿರ್ಮಾತೃ|किश्ती बनाने आह्ला|নৌকা তৈরি করি',
 'Private sector employee|निजी क्षेत्र में कर्मचारी|ਨਿੱਜੀ ਖੇਤਰ ਦਾ ਕਰਮਚਾਰੀ|বেসরকারি কর্মচারী|தனியார் நிறுவன ஊழியர்|ಖಾಸಗಿ ವಲಯದ ಉದ್ಯೋಗಿ|निजी कर्मचारी|प्राइवेट नौकरी करता हूँ|प्राइवेट नौकरी करती हूँ|private नौकरी'
].map(row=>row.split('|'));
function localOccupation(text,screen,voice){
 const normalize=phrase=>phrase.normalize('NFC').trim().toLowerCase().replace(/[।.!?]+$/u,'').trim()
  .replace(/^(?:कि\s+)?(?:मैं|मै|मेरा|मेरी|main|mera|i am|i'm|i work as|i run|i|आइ|आई|আমি|আমি একজন|ਮੈਂ|ನಾನು|நான்)\s+/iu,'')
  .replace(/^(?:एक|ek|an?|my own|একজন|ਇੱਕ|ಒಬ್ಬ|ஒரு)\s+/iu,'')
  .replace(/\s+(?:हूँ|हूं|है|hai|hoon|hu|hun|ਹਾਂ|ஆக இருக்கிறேன்)$/iu,'').trim();
 const key=normalize(text);
 const row=jobTerms.find(terms=>terms.some(term=>normalize(term)===key));
 if(!row)return null;
 const borrowed={plumber:'प्लंबर',teacher:'टीचर','टीचर':'टीचर',actor:'एक्टर','एक्टर':'एक्टर','ऐक्टर':'एक्टर'};
 const usedEnglish=key===row[0].toLowerCase() && /[^\x00-\x7f]/.test(text);
 const label=code=>code==='hi' && borrowed[key] ? borrowed[key] : usedEnglish && code!=='en' ? key : row[jobLanguages.indexOf(code)]||row[0];
 return {english:row[0],screen:label(screen),voice:label(voice)};
}
// Offline fallback for an explicitly stated English job title in a carrier sentence.
function statedJobTitle(text){
 const answer=text.trim().replace(/[.!।]+$/u,'').trim();
 const title='([A-Za-z]+(?:[ -][A-Za-z]+){0,5})';
 const frames=[
  '^(?:I work as|I am employed as|my occupation is|my job title is|I am|I’m|I\'m) (?:an? )?',
  '^(?:मैं|मै|main|mai|আমি|ਮੈਂ|நான்|ನಾನು) (?:एक |ek |একজন |ਇੱਕ |ஒரு |ಒಬ್ಬ )?'
 ];
 for(const frame of frames){
  const match=answer.match(new RegExp(frame+title+'(?: (?:हूँ|हूं|होँ|hu|hun|hoon|ਹਾਂ))?$','iu'));
  if(!match)continue;
  const job=match[1].replace(/\s+(?:hun|hu|hoon)$/i,'');
  if(/\b(?:not|no|never|formerly|retired from|want|was|used|maybe|unsure|sure|private|something|working|looking|between|and|or|but|happy|tired|fine|okay)\b/i.test(job))return null;
  // Role suffixes admit previously unseen titles without accepting arbitrary descriptions.
  if(!/(?:ist|ian|eer|ographer|ologist|maker|wright|smith|designer|developer|analyst|specialist|manager|director|consultant|technician|architect|officer|coordinator|mechanic|artist|pilot|chef|nurse|surgeon|editor|producer)$/i.test(job))return null;
  const english=job[0].toUpperCase()+job.slice(1);
  return {english,screen:english,voice:english};
 }
 return null;
}
async function occupationNext(){
 const text=$('simpleOpeningOccupation').value.trim();
 const version=phaseVersion, turn=++occupationTurn;
 const screen=language,voice=speakingLanguage;
 const retry={en:'What work do you do day to day?',hi:'आप रोज़ किस तरह का काम करते हैं?',pa:'ਤੁਸੀਂ ਰੋਜ਼ ਕੀ ਕੰਮ ਕਰਦੇ ਹੋ?',bn:'আপনি প্রতিদিন কী কাজ করেন?',ta:'தினமும் என்ன வேலை செய்கிறீர்கள்?',kn:'ನೀವು ಪ್ರತಿದಿನ ಯಾವ ಕೆಲಸ ಮಾಡುತ್ತೀರಿ?'};
 let result=localOccupation(text,screen,voice);
 try{
   if(!result && text){
     $('v16OccupationNext').disabled=true;
     result=await (await post('/api/kiosk/occupation',{text,screen,voice})).json();
   }
 }catch{result=null}
 finally{if(turn===occupationTurn)$('v16OccupationNext').disabled=false}
 if(version!==phaseVersion||turn!==occupationTurn)return;
 if(!result?.english)result=statedJobTitle(text);
 if(!result?.english){status(retry[screen]||retry.en);if(mode==='voice')window.sahajOpeningPrompt?.(retry[voice]||retry.en);return;}
 jobLabels=result;occupation=result.english;
 $('v16OccupationChosen').textContent=result.screen;
 showPhase('confirm');prompt();
}
function confirmedOccupation(ok){if(!ok){showPhase('occupation');prompt();return}showPhase('pan');prompt()}
function panAnswer(has){panChoice=has?'pan':'form60';document.querySelectorAll('input[name="simplePan"]').forEach(x=>x.checked=x.value===panChoice);$('openingReviewPan').textContent=has?'Demo PAN card':(language==='hi'?'पैन नहीं है · घोषणा का ड्राफ्ट':'No PAN · declaration draft');$('v16ReviewProfession').textContent=jobLabels.screen;showPhase('review');prompt()}
// The kiosk PDF generator embeds the complete printed page as one JPEG.
async function openingPageImage(pdf){
 const bytes=new Uint8Array(await pdf.arrayBuffer());
 const header=new TextDecoder('latin1').decode(bytes.subarray(0,8192));
 const image=header.match(/\/Subtype\s*\/Image\b[^]*?\/Filter\s*\/DCTDecode\b[^]*?stream\r?\n/);
 if(!image)return null;
 const length=image[0].match(/\/Length\s+(\d+)/);
 const start=image.index+image[0].length;
 if(!length||bytes[start]!==255||bytes[start+1]!==216)return null;
 return pdf.slice(start,start+Number(length[1]),'image/jpeg');
}
async function prepare(){if(working||phase!=='review')return;if(!sid||!['pan','form60'].includes(panChoice)){status('Staff assistance required for this request.');return}const version=phaseVersion;working=true;if(mode==='voice')stopServerRecognition();$('simpleOpeningPrepare').disabled=true;status('Preparing sample application…');try{if(panChoice==='pan')await scan('pan');const r=await post('/api/kiosk/opening-draft',{session_id:sid,occupation,tax_route:panChoice,confirmed:true});const blob=await r.blob();const page=await openingPageImage(blob);if(version!==phaseVersion)return;if(pdfUrl)URL.revokeObjectURL(pdfUrl);pdfUrl=URL.createObjectURL(blob);const link=$('simpleOpeningDownload');link.href=pdfUrl;const frame=$('simpleOpeningPreview');frame.src=pdfUrl+'#toolbar=0&navpanes=0&view=Fit';frame.hidden=Boolean(page);if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=page?URL.createObjectURL(page):'';const image=$('openingPageImage');image.hidden=!page;if(page)image.src=previewUrl;showPhase('result');if(window.sahajV11){window.sahajV11.setPreviewGuide('opening',{guideId:'simpleOpeningGuide',statusId:'simpleOpeningAutoStatus'});window.sahajV11.queueAfterGuidance('opening',async()=>{if(phase==='result')link.click()},'simpleOpeningAutoStatus',()=>phase==='result');}}catch(e){status(e.message)}finally{working=false;$('simpleOpeningPrepare').disabled=false}}
async function counter2(){
 await loadCounter('account_opening');
 counterInfo.form60=panChoice==='form60';
 show('counterScreen');
}
function reset(){working=false;$('simpleOpeningSample').disabled=false;jobLabels=null;occupationTurn++;$('v16OccupationNext').disabled=false;phase='identity';occupation='';panChoice='';$('simpleOpeningConsent').checked=false;$('simpleOpeningOccupation').value='';$('simpleOpeningSampleStatus').textContent='';document.querySelectorAll('input[name="simplePan"]').forEach(x=>x.checked=false);showPhase('identity')}
function start(){reset();queueMicrotask(()=>{if(activeScreen==='openingScreen'&&phase==='identity'&&!working)prompt()})}
function shortQuestion(){
 const hi=speakingLanguage==='hi';
 if(!hi && speakingLanguage!=='en')return phasePrompt(speakingLanguage);
 return ({identity:hi?'डेमो आधार बोलें या चुनें।':'Say or choose Demo Aadhaar.',occupation:hi?'आप क्या काम करते हैं?':'What work do you do?',confirm:hi?'पेशा सही है? हाँ या ना?':'Is the occupation correct? Yes or no?',pan:hi?'पैन कार्ड है? हाँ या ना?':'Do you have PAN? Yes or no?',review:hi?'जानकारी सही है? हाँ या ना?':'Are the details correct? Yes or no?',result:hi?'फ़ॉर्म डाउनलोड करें?':'Download the form?'})[phase]||phasePrompt(speakingLanguage);
}
function recognizedYes(t){return window.sahajConfirmation(t)==='yes'}
function recognizedNo(t){return window.sahajConfirmation(t)==='no'}
function choseDemoAadhaar(raw){
 const text=String(raw||'').normalize('NFKC').toLowerCase().replace(/[.,!।]/gu,' ').replace(/\s+/gu,' ').trim();
 // Require a selection, not a mention in a question, negation, or kiosk prompt.
 const sample='(?:demo|sample|डेमो|डेमाे|ਨਮੂਨਾ|ਡੈਮੋ|ডেমো|নমুনা|ಡೆಮೊ|ಮಾದರಿ|டெமோ|மாதிரி)';
 const id='(?:a{1,2}dh?a{1,2}r|aadhar|आधार्|आधार(?: कार्ड)?|ਆਧਾਰ|আধার|ಆಧಾರ್|ஆதார்)';
 const lead='(?:(?:yes|ok|okay|please|use|choose|select|the|हाँ|हां|जी|haan|मुझे|मैं) )*';
 const tail='(?: (?:please|sample|card|वाला|वाली|चाहिए|चुनो|चुनिए|चुनना है|इस्तेमाल करो|करो|करें|जी))*';
 return new RegExp('^'+lead+sample+' '+id+tail+'$','u').test(text);
}
async function handleVoice(raw){const t=String(raw||'').trim();if(!t)return;switch(phase){case'identity':
 if(working)return;
 if(choseDemoAadhaar(t))await begin();
 else await window.sahajRetryReply?.();
 break;case'occupation':$('simpleOpeningOccupation').value=t;await occupationNext();break;case'confirm':if(recognizedYes(t))confirmedOccupation(true);else if(recognizedNo(t))confirmedOccupation(false);else await window.sahajRetryReply?.();break;case'pan':{
 const answer=window.sahajConfirmation.panPossession(t);
 if(answer==='unknown')await window.sahajRetryReply?.();
 else panAnswer(answer==='yes');
 break;
}case'review':if(window.sahajConfirmation(t,'review')==='yes'){await prepare()}else if(window.sahajConfirmation(t,'review')==='no'){showPhase('occupation');prompt()}else await window.sahajRetryReply?.();break;case'result':if(/download|print|डाउनलोड|प्रिंट/i.test(t))$('simpleOpeningDownload').click();else await window.sahajRetryReply?.();break;case'staff':if(recognizedYes(t)||/counter|काउंटर|কাউন্টার|கவுண்டர்|ಕೌಂಟರ್|ਕਾਊਂਟਰ|go|जाओ|ठीक/i.test(t))await counter2();else await window.sahajRetryReply?.();break;}}
$('simpleOpeningSample').onclick=begin;$('simpleOpeningBegin').onclick=begin;$('v16OccupationNext').onclick=occupationNext;$('simpleOpeningOccupation').addEventListener('keydown',e=>{if(e.key==='Enter')occupationNext()});$('v16OccupationYes').onclick=()=>confirmedOccupation(true);$('v16OccupationNo').onclick=()=>confirmedOccupation(false);$('v16PanYes').onclick=()=>panAnswer(true);$('v16PanNo').onclick=()=>panAnswer(false);$('v16StaffFinish').onclick=counter2;$('v16StaffBack').onclick=()=>{showPhase('pan');prompt()};$('simpleOpeningPrepare').onclick=prepare;$('openingEditWork').onclick=()=>{showPhase('occupation');prompt()};
$('simpleOpeningDownload').addEventListener('click',counter2);
$('simpleOpeningFinish').onclick=async()=>{await clear();endSession()};$('simpleOpeningBack').onclick=async()=>{await clear();endSession()};
window.addEventListener('sahaj:screen',e=>{if(e.detail?.id==='permissionScreen'){clear();reset()}});
window.SahajOpeningFlow={start,handleVoice,back(){
 const previous={occupation:'identity',confirm:'occupation',pan:'confirm',staff:'pan',review:'pan',result:'review'}[phase];
 if(!previous){phaseVersion++;return false;}
 window.sahajV11?.cancelSequence?.('opening');showPhase(previous);prompt();return true;
},choseDemoAadhaar,shortQuestion,question:()=>phasePrompt(speakingLanguage)||'',get phase(){return phase},get noPan(){return panChoice==='form60'}};reset();
})();
