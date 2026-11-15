/* Demo kiosk flow. No real banking transactions. */
(()=>{'use strict';
const el=id=>document.getElementById(id);
const T={
 hi:{passbook:'डेमो पासबुक चुनें',demo:'डेमो पासबुक',scan:'पासबुक स्कैन करें',notYet:'अभी उपलब्ध नहीं',sample:'नकली नमूना पासबुक इस्तेमाल करें',amount:'आप कितने पैसे निकालना चाहते हैं?',depositAmount:'आप कितने पैसे जमा करना चाहते हैं?',amountLabel:'राशि (₹)',next:'आगे बढ़ें',notEnough:'इस डेमो खाते में इतने पैसे नहीं हैं। क्या आप अपना बैलेंस देखना चाहते हैं?',balance:'आपका डेमो बैलेंस',yes:'हाँ, बैलेंस दिखाएँ',no:'राशि बदलें',edit:'कम राशि निकालें',notice:'यह काल्पनिक डेमो खाता है, वास्तविक बैंक बैलेंस नहीं।',loaded:'नमूना पासबुक पढ़ ली गई है।',failed:'नमूना पासबुक नहीं पढ़ी जा सकी। फिर से कोशिश करें।',help:'मैं निकासी, जमा और नए खाते के आवेदन में मदद कर सकती हूँ।',unsupported:'यह सेवा अभी उपलब्ध नहीं है। कृपया बैंक कर्मचारी से संपर्क करें। मैं निकासी, जमा और नए खाते के आवेदन में मदद कर सकती हूँ।'},
 en:{passbook:'Choose Demo passbook',demo:'Demo passbook',scan:'Scan passbook',notYet:'Not supported right now',sample:'Use a fictional sample',amount:'How much money would you like to withdraw?',depositAmount:'How much money would you like to deposit?',amountLabel:'Amount (₹)',next:'Continue',notEnough:'There is not enough money in this demo account. Would you like to see your balance?',balance:'Your demo balance',yes:'Yes, show my balance',no:'Change amount',edit:'Withdraw a smaller amount',notice:'This is a fictional demo account, not a real bank balance.',loaded:'The sample passbook is ready.',failed:'Could not read the sample. Please try again.',help:'I can help with withdrawal, deposit and a new account application.',unsupported:'This service is not available here. Please contact bank staff. I can help with withdrawal, deposit and a new account application.'},
 bn:{passbook:'ডেমো পাসবই বেছে নিন',demo:'ডেমো পাসবুক',scan:'পাসবুক স্ক্যান করুন',notYet:'এখন উপলব্ধ নয়',sample:'কাল্পনিক নমুনা ব্যবহার করুন',amount:'কত টাকা তুলতে চান?',depositAmount:'কত টাকা জমা দিতে চান?',amountLabel:'টাকার পরিমাণ (₹)',next:'এগিয়ে যান',notEnough:'এই ডেমো অ্যাকাউন্টে পর্যাপ্ত টাকা নেই। ব্যালেন্স দেখতে চান?',balance:'আপনার ডেমো ব্যালেন্স',yes:'হ্যাঁ, ব্যালেন্স দেখান',no:'পরিমাণ বদলান',edit:'কম টাকা তুলুন',notice:'এটি কাল্পনিক ডেমো অ্যাকাউন্ট, আসল ব্যাঙ্ক ব্যালেন্স নয়।',loaded:'নমুনা পাসবুক পড়া হয়েছে।',failed:'নমুনা পড়া যায়নি। আবার চেষ্টা করুন।',help:'আমি টাকা তোলা, জমা ও নতুন অ্যাকাউন্টের আবেদন করতে সাহায্য করতে পারি।',unsupported:'এই পরিষেবা এখন উপলব্ধ নয়। অনুগ্রহ করে ব্যাঙ্ক কর্মীর সঙ্গে যোগাযোগ করুন।'},
 pa:{passbook:'ਡੈਮੋ ਪਾਸਬੁੱਕ ਚੁਣੋ',demo:'ਡੈਮੋ ਪਾਸਬੁੱਕ',scan:'ਪਾਸਬੁੱਕ ਸਕੈਨ ਕਰੋ',notYet:'ਹਾਲੇ ਉਪਲਬਧ ਨਹੀਂ',sample:'ਕਾਲਪਨਿਕ ਨਮੂਨਾ ਵਰਤੋ',amount:'ਤੁਸੀਂ ਕਿੰਨੇ ਪੈਸੇ ਕਢਵਾਉਣਾ ਚਾਹੁੰਦੇ ਹੋ?',depositAmount:'ਤੁਸੀਂ ਕਿੰਨੇ ਪੈਸੇ ਜਮ੍ਹਾਂ ਕਰਵਾਉਣਾ ਚਾਹੁੰਦੇ ਹੋ?',amountLabel:'ਰਕਮ (₹)',next:'ਅੱਗੇ ਵਧੋ',notEnough:'ਇਸ ਡੈਮੋ ਖਾਤੇ ਵਿੱਚ ਕਾਫ਼ੀ ਪੈਸੇ ਨਹੀਂ ਹਨ। ਕੀ ਤੁਸੀਂ ਬਕਾਇਆ ਵੇਖਣਾ ਚਾਹੁੰਦੇ ਹੋ?',balance:'ਤੁਹਾਡਾ ਡੈਮੋ ਬਕਾਇਆ',yes:'ਹਾਂ, ਬਕਾਇਆ ਦਿਖਾਓ',no:'ਰਕਮ ਬਦਲੋ',edit:'ਘੱਟ ਰਕਮ ਕਢਵਾਓ',notice:'ਇਹ ਕਾਲਪਨਿਕ ਡੈਮੋ ਖਾਤਾ ਹੈ, ਅਸਲੀ ਬੈਂਕ ਬਕਾਇਆ ਨਹੀਂ।',loaded:'ਨਮੂਨਾ ਪਾਸਬੁੱਕ ਪੜ੍ਹ ਲਈ ਗਈ ਹੈ।',failed:'ਨਮੂਨਾ ਪੜ੍ਹਿਆ ਨਹੀਂ ਜਾ ਸਕਿਆ।',help:'ਮੈਂ ਪੈਸੇ ਕਢਵਾਉਣ, ਜਮ੍ਹਾਂ ਕਰਨ ਅਤੇ ਨਵੇਂ ਖਾਤੇ ਲਈ ਮਦਦ ਕਰ ਸਕਦੀ ਹਾਂ।',unsupported:'ਇਹ ਸੇਵਾ ਹਾਲੇ ਉਪਲਬਧ ਨਹੀਂ। ਕਿਰਪਾ ਕਰਕੇ ਬੈਂਕ ਕਰਮਚਾਰੀ ਨਾਲ ਸੰਪਰਕ ਕਰੋ।'},
 ta:{passbook:'மாதிரி பாஸ்புக்கைத் தேர்வு செய்யவும்',demo:'மாதிரி பாஸ்புக்',scan:'பாஸ்புக்கை ஸ்கேன் செய்க',notYet:'தற்போது வசதி இல்லை',sample:'கற்பனை மாதிரியைப் பயன்படுத்தவும்',amount:'எவ்வளவு பணம் எடுக்க விரும்புகிறீர்கள்?',depositAmount:'எவ்வளவு பணம் செலுத்த விரும்புகிறீர்கள்?',amountLabel:'தொகை (₹)',next:'தொடரவும்',notEnough:'இந்த மாதிரி கணக்கில் போதிய இருப்பு இல்லை. இருப்பைப் பார்க்க விரும்புகிறீர்களா?',balance:'உங்கள் மாதிரி இருப்பு',yes:'ஆம், இருப்பைக் காட்டு',no:'தொகையை மாற்று',edit:'குறைந்த தொகையை எடு',notice:'இது மாதிரி கணக்கு மட்டுமே; உண்மையான வங்கி இருப்பு அல்ல.',loaded:'மாதிரி பாஸ்புக் வாசிக்கப்பட்டது.',failed:'மாதிரியை வாசிக்க முடியவில்லை.',help:'பணம் எடுப்பது, செலுத்துவது மற்றும் புதிய கணக்கு விண்ணப்பத்திற்கு உதவ முடியும்.',unsupported:'இந்த சேவை தற்போது கிடைக்கவில்லை. வங்கி ஊழியரை அணுகவும்.'},
 kn:{passbook:'ಡೆಮೊ ಪಾಸ್‌ಬುಕ್ ಆಯ್ಕೆಮಾಡಿ',demo:'ಡೆಮೊ ಪಾಸ್‌ಬುಕ್',scan:'ಪಾಸ್‌ಬುಕ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ',notYet:'ಈಗ ಲಭ್ಯವಿಲ್ಲ',sample:'ಕಾಲ್ಪನಿಕ ಮಾದರಿ ಬಳಸಿ',amount:'ಎಷ್ಟು ಹಣ ಹಿಂಪಡೆಯಲು ಬಯಸುತ್ತೀರಿ?',depositAmount:'ಎಷ್ಟು ಹಣ ಜಮೆ ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?',amountLabel:'ಮೊತ್ತ (₹)',next:'ಮುಂದುವರಿಸಿ',notEnough:'ಈ ಡೆಮೊ ಖಾತೆಯಲ್ಲಿ ಸಾಕಷ್ಟು ಹಣವಿಲ್ಲ. ಬಾಕಿ ಮೊತ್ತ ನೋಡಬೇಕೇ?',balance:'ನಿಮ್ಮ ಡೆಮೊ ಬಾಕಿ',yes:'ಹೌದು, ಬಾಕಿ ತೋರಿಸಿ',no:'ಮೊತ್ತ ಬದಲಿಸಿ',edit:'ಕಡಿಮೆ ಹಣ ಹಿಂಪಡೆಯಿರಿ',notice:'ಇದು ಕಾಲ್ಪನಿಕ ಡೆಮೊ ಖಾತೆ, ನಿಜವಾದ ಬ್ಯಾಂಕ್ ಬಾಕಿಯಲ್ಲ.',loaded:'ಮಾದರಿ ಪಾಸ್‌ಬುಕ್ ಓದಲಾಗಿದೆ.',failed:'ಮಾದರಿಯನ್ನು ಓದಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.',help:'ಹಣ ಹಿಂಪಡೆಯಲು, ಜಮೆ ಮಾಡಲು ಮತ್ತು ಹೊಸ ಖಾತೆಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಸಹಾಯ ಮಾಡಬಹುದು.',unsupported:'ಈ ಸೇವೆ ಈಗ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಬ್ಯಾಂಕ್ ಸಿಬ್ಬಂದಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.'}
};
let service='',step='home',busy=false,voiceStarted=false,entryVoice=false,reviewAmount=0;window.SahajV8={get step(){return step},get service(){return service}};
const words=()=>T[language]||T.en;
const spokenWords=()=>T[speakingLanguage]||T.en;
const passbookGuides={
 en:'Scanning a passbook is not available right now. Please choose Demo passbook to proceed, or say Demo passbook.',
 hi:'अभी पासबुक स्कैन की सुविधा उपलब्ध नहीं है। आगे बढ़ने के लिए डेमो पासबुक चुनें या बोलें डेमो पासबुक।',
 pa:'ਪਾਸਬੁੱਕ ਸਕੈਨ ਕਰਨ ਦੀ ਸਹੂਲਤ ਹਾਲੇ ਨਹੀਂ ਹੈ। ਅੱਗੇ ਵਧਣ ਲਈ ਡੈਮੋ ਪਾਸਬੁੱਕ ਚੁਣੋ ਜਾਂ ਡੈਮੋ ਪਾਸਬੁੱਕ ਕਹੋ।',
 bn:'পাসবই স্ক্যান এখন উপলব্ধ নয়। এগোতে ডেমো পাসবই বেছে নিন অথবা ডেমো পাসবই বলুন।',
 ta:'பாஸ்புக் ஸ்கேன் வசதி தற்போது இல்லை. தொடர டெமோ பாஸ்புக்கைத் தேர்ந்தெடுக்கவும் அல்லது டெமோ பாஸ்புக் என்று கூறவும்.',
 kn:'ಪಾಸ್‌ಬುಕ್ ಸ್ಕ್ಯಾನ್ ಸೌಲಭ್ಯ ಈಗ ಲಭ್ಯವಿಲ್ಲ. ಮುಂದುವರಿಯಲು ಡೆಮೊ ಪಾಸ್‌ಬುಕ್ ಆಯ್ಕೆಮಾಡಿ ಅಥವಾ ಡೆಮೊ ಪಾಸ್‌ಬುಕ್ ಎಂದು ಹೇಳಿ.'
};
const passbookGuide=()=>passbookGuides[language]||passbookGuides.en;

const money=n=>'₹ '+Number(n).toLocaleString('en-IN',{maximumFractionDigits:2});
function status(id,msg){el(id).textContent=msg||''}
function localizeV8(){const copy = withdrawalReviewCopy(language);
 const preview = regionalReview[language] || copy;
 el('v16DepositPreviewHeading').textContent = preview.ready.replace(/withdrawal/gi,'deposit').replace(/निकासी/g,'जमा');
 el('v16DepositDownload').textContent = preview.download;
 el('v16DepositBack').textContent = preview.change;
 document.querySelector('#v16DepositPreviewScreen > p').textContent = regionalReview[language]?.details || (language==='pa' ? copy.details : language==='hi' ? 'प्रिंट किए गए फ़ॉर्म पर हस्ताक्षर करें।' : 'Sign the printed form.');
 if(step==='review'&&activeScreen==='v9ReviewScreen')showReview(reviewAmount,true);if(activeScreen==='permissionScreen'){restoreHome();queueMicrotask(()=>{if(activeScreen==='permissionScreen')restoreHome()});}const c=words();if(el('voiceScreen')&&!el('voiceScreen').hidden)greetView();el('v8PassbookTitle').textContent=c.passbook;el('v8PassbookDesc').textContent=passbookGuide();el('v8ScanText').textContent=c.scan;el('v8ScanSub').textContent=c.notYet;el('v8DemoText').textContent=c.demo;el('v8DemoSub').textContent=c.sample;el('v8AmountTitle').textContent=service==='deposit'?c.depositAmount:c.amount;el('v8AmountLabel').textContent=c.amountLabel;el('v8AmountNext').textContent=c.next;el('v8BalanceQuestion').textContent=c.notEnough;el('v8BalanceCaption').textContent=c.balance;el('v8BalanceNotice').textContent=c.notice;el('v8BalanceYes').textContent=c.yes;el('v8BalanceNo').textContent=c.no;el('v8BalanceEdit').textContent=c.edit;el('v8SelectedService').textContent=service==='deposit'?({en:'DEPOSIT',hi:'पैसे जमा करें',pa:'ਪੈਸੇ ਜਮ੍ਹਾਂ ਕਰੋ',bn:'টাকা জমা দিন',ta:'பணம் செலுத்துதல்',kn:'ಹಣ ಜಮೆ'})[language]||'DEPOSIT':({en:'WITHDRAWAL',hi:'पैसे निकालें',pa:'ਪੈਸੇ ਕਢਵਾਓ',bn:'টাকা তুলুন',ta:'பணம் எடுத்தல்',kn:'ಹಣ ತೆಗೆಯಿರಿ'})[language]||'WITHDRAWAL';
  document.querySelectorAll('[data-v8-service]').forEach(btn=>{btn.classList.toggle('selected',btn.dataset.v8Service===service);const map={withdrawal:['निकासी फ़ॉर्म','Withdrawal form'],deposit:['जमा फ़ॉर्म','Deposit form'],opening:['नया खाता','New account application'],help:['क्या मदद मिलेगी?','What can Sahaj do?']};const key=btn.dataset.v8Service;const translations={hi:{withdrawal:'निकासी फ़ॉर्म',deposit:'जमा फ़ॉर्म',opening:'नया खाता',help:'क्या मदद मिलेगी?'},en:{withdrawal:'Withdrawal form',deposit:'Deposit form',opening:'Open an account',help:'What can Sahaj do?'},bn:{withdrawal:'টাকা তুলুন',deposit:'টাকা জমা দিন',opening:'নতুন অ্যাকাউন্ট',help:'কী সাহায্য পাব?'},pa:{withdrawal:'ਪੈਸੇ ਕਢਵਾਓ',deposit:'ਪੈਸੇ ਜਮ੍ਹਾਂ ਕਰੋ',opening:'ਨਵਾਂ ਖਾਤਾ',help:'ਕੀ ਮਦਦ ਮਿਲੇਗੀ?'},ta:{withdrawal:'பணம் எடுக்க',deposit:'பணம் செலுத்த',opening:'புதிய கணக்கு',help:'என்ன உதவி?'},kn:{withdrawal:'ಹಣ ತೆಗೆಯಿರಿ',deposit:'ಹಣ ಜಮೆ ಮಾಡಿ',opening:'ಹೊಸ ಖಾತೆ',help:'ಯಾವ ಸಹಾಯ?'}};// Initial English mode: large English service name with smaller Hindi beneath.
 // After customer changes language, use that language as the main service label.
 const main=['en','hi'].includes(language)?map[key][1]:(translations[language]||translations.en)[key];
 btn.querySelector('strong').textContent=main;
 btn.querySelector('small').textContent=language==='en'?map[key][0]:(language==='hi'?map[key][0]:'');});
  el('kioskListeningText').textContent=({hi:'सुन रही हूँ…',en:'Listening…',bn:'শুনছি…',pa:'ਸੁਣ ਰਹੀ ਹਾਂ…',ta:'கேட்டுக்கொண்டிருக்கிறேன்…',kn:'ಕೇಳುತ್ತಿದ್ದೇನೆ…'})[(!customerHasSpoken&&!displayLanguageLocked?'en':speakingLanguage)]||'Listening…';
  el('kioskListeningHint').textContent=({hi:'आराम से बोलिए।',en:'Speak naturally.',bn:'স্বাভাবিকভাবে বলুন।',pa:'ਆਰਾਮ ਨਾਲ ਬੋਲੋ।',ta:'இயல்பாகப் பேசுங்கள்.',kn:'ಸಹಜವಾಗಿ ಮಾತನಾಡಿ.'})[(!customerHasSpoken&&!displayLanguageLocked?'en':speakingLanguage)]||'Speak naturally.';
}
function greetView(){
 const lang=language||'en';
 const titles={en:'Hello!',hi:'नमस्ते!',pa:'ਸਤ ਸ੍ਰੀ ਅਕਾਲ!',bn:'নমস্কার!',ta:'வணக்கம்!',kn:'ನಮಸ್ಕಾರ!'};
 const subtitles={en:'How may I help you?',hi:'मैं आपकी कैसे मदद कर सकती हूँ?',pa:'ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦੀ ਹਾਂ?',bn:'আমি আপনাকে কীভাবে সাহায্য করতে পারি?',ta:'நான் உங்களுக்கு எப்படி உதவலாம்?',kn:'ನಾನು ನಿಮಗೆ ಹೇಗೆ உதவಬಹುದು?'};
 const headline=el('voiceGreeting'),desc=el('voiceHint');
 // Initial bilingual greeting retains the original LEFT Hindi / RIGHT English layout.
 // English is simply more prominent; never infer Hindi preference from this greeting.
 if(lang==='en'||lang==='hi'){
  headline.innerHTML='<span class="v14-hi-greeting">नमस्ते!</span><span class="v14-en-greeting">Hello!</span>';
  desc.innerHTML='<span class="v14-hi-question">मैं आपकी कैसे मदद कर सकती हूँ?</span><span class="v14-en-question">How may I help you?</span>';
 }else {headline.textContent=titles[lang]||titles.en;desc.textContent=subtitles[lang]||subtitles.en;}
}
async function promptVoice(text,after=null){if(mode!=='voice')return;window.sahajCancelSpeech?.();geminiMicPaused=false;status('voiceStatus',text);speechRestartAllowed=false;stopServerRecognition();try{speechRecognition?.abort()}catch{}await say(text,speakingLanguage,()=>{speechRestartAllowed=true;startRecognition();after?.()});}
async function startGreeting(initial=false){el('voiceManual').hidden=false;greetView();show('voiceScreen');window.sahajOpeningGreeting=initial;step='service';voiceStarted=true;customerHasSpoken=false;flowStage='request';speechRestartAllowed=false;stopServerRecognition();try{speechRecognition?.abort()}catch{}const selectedVoice=typeof speakingLanguage==='string'?speakingLanguage:'en';const voiceLocked=typeof speechLanguageLocked!=='undefined'&&speechLanguageLocked===true;const finished=()=>{window.sahajOpeningGreeting=false;speechRestartAllowed=true;startRecognition()};if(selectedVoice==='en'&&!voiceLocked){await say('नमस्ते! मैं आपकी कैसे मदद कर सकती हूँ? Hello! How may I help you?','hi',finished);return;}const greetings={en:'Hello! How may I help you?',hi:'नमस्ते! मैं आपकी कैसे मदद कर सकती हूँ?',pa:'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦੀ ਹਾਂ?',bn:'নমস্কার! আমি আপনাকে কীভাবে সাহায্য করতে পারি?',ta:'வணக்கம்! நான் உங்களுக்கு எப்படி உதவலாம்?',kn:'ನಮಸ್ಕಾರ! ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?'};await say(greetings[selectedVoice]||greetings.en,selectedVoice,finished);}

function restoreHome(){if(window.SahajHome){window.SahajHome.apply();return}el('permissionTitle').innerHTML='Bank forms,<br>filled by <em>voice.</em>';el('permissionText').textContent='Speak in your language or choose a form. Print it, then take it to the bank counter.';el('voiceContinue').textContent='Start with voice · बोलकर शुरू करें';el('manualContinue').textContent='Use touch or keyboard →';}
function home(){service='';step='home';busy=false;endSession();restoreHome();}
async function chooseService(kind){failedReplies=0;if(kind==='help'){status('voiceStatus',words().help);if(mode==='voice')await promptVoice(spokenWords().help+' '+currentQuestion());return}
 if(kind==='opening'){service=kind;step='opening';show('openingScreen');window.SahajOpeningFlow?.start();return}
 service=kind;step='passbook';status('v8PassbookStatus','');localizeV8();if(activeScreen==='voiceScreen'){const b=document.querySelector(`[data-v8-service="${kind}"]`);b?.classList.add('selected');await new Promise(r=>setTimeout(r,0));}
 show('v8PassbookScreen');const guide=passbookGuide();el('v8PassbookDesc').textContent=guide;if(mode==='voice')await promptVoice(passbookGuides[speakingLanguage]||passbookGuides.en);}
let scanTurn=0;
window.sahajBackRequest=text=>/(?:go back|take me back|previous step|वापस|वापिस|पीछे जाओ|wap[ai]s|vaap[ai]s|गलत बोल दिया)/i.test(text);
async function chooseDemo(){if(busy)return;const turn=++scanTurn;busy=true;if(mode==='voice')stopServerRecognition();status('v8PassbookStatus',({en:'Reading demo passbook…',hi:'डेमो पासबुक पढ़ी जा रही है…',pa:'ਡੈਮੋ ਪਾਸਬੁੱਕ ਪੜ੍ਹੀ ਜਾ ਰਹੀ ਹੈ…',bn:'ডেমো পাসবই পড়া হচ্ছে…',ta:'மாதிரி பாஸ்புக் வாசிக்கப்படுகிறது…',kn:'ಡೆಮೊ ಪಾಸ್‌ಬುಕ್ ಓದಲಾಗುತ್ತಿದೆ…'})[language]||'Reading demo passbook…');try{
  // The customer explicitly selected a fictional sample. Do not prompt a second time to process it.
  const old=window.kioskConsent;window.kioskConsent=async()=>true;
  try{passbook.profile=null;const result=await window.SahajDemoSamples.loadPassbook();if(!result?.profile)throw Error('Demo passbook is unavailable')}finally{window.kioskConsent=old}
  if(turn!==scanTurn)return;
  if(!passbook.profile||!passbook.profile.account_id)throw Error('No matching synthetic account');
  // Balance is not returned by the scan endpoint. Fetch it using the authenticated,
  // session-bound account lookup rather than guessing or showing zero.
  const result=await fetch('/api/demo-profile/lookup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({account_id:passbook.profile.account_id})});
  const lookup=await result.json();if(turn!==scanTurn)return;
  if(!result.ok||lookup.status!=='matched'||!lookup.profile||lookup.profile.balance===undefined)throw Error('Authorized demo balance lookup failed');
  passbook={...passbook,...lookup.profile,profile:lookup.profile};
  showAmount();
 }catch(error){if(turn!==scanTurn)return;console.warn('Demo passbook',error);show('v8PassbookScreen');status('v8PassbookStatus',words().failed)}finally{if(turn===scanTurn)busy=false}}
function showAmount(){step='amount';localizeV8();el('v8AmountInput').value='';const name=passbook.profile?.name||'';const accountLabel=({en:'DEMO ACCOUNT',hi:'डेमो खाता',pa:'ਡੈਮੋ ਖਾਤਾ',bn:'ডেমো অ্যাকাউন্ট',ta:'மாதிரி கணக்கு',kn:'ಡೆಮೊ ಖಾತೆ'})[language]||'DEMO ACCOUNT';el('v8AccountSummary').textContent=name?name+' · '+accountLabel:accountLabel;status('v8AmountStatus','');show('v8AmountScreen');if(mode==='voice')promptVoice(service==='deposit'?spokenWords().depositAmount:spokenWords().amount);}
function balancePrompt(code){const hint={en:'Please say yes or no.',hi:'कृपया हाँ या ना कहें।',pa:'ਹਾਂ ਜਾਂ ਨਹੀਂ ਕਹੋ।',bn:'হ্যাঁ বা না বলুন।',kn:'ಹೌದು ಅಥವಾ ಇಲ್ಲ ಎಂದು ಹೇಳಿ.',ta:'ஆம் அல்லது இல்லை என்று சொல்லுங்கள்.'};return (T[code]||T.en).notEnough+' '+(hint[code]||hint.en);}
function availableBalancePrompt(){
 const amount=money(passbook.profile.balance);
 const prompts={
  en:`Your balance is ${amount}. Please say a withdrawal amount within that balance.`,
  hi:`आपके खाते में ${amount} हैं। कृपया इतनी या इससे कम राशि बताइए।`,
  pa:`ਤੁਹਾਡਾ ਬਕਾਇਆ ${amount} ਹੈ। ਇੰਨੀ ਜਾਂ ਇਸ ਤੋਂ ਘੱਟ ਰਕਮ ਦੱਸੋ।`,
  bn:`আপনার ব্যালেন্স ${amount}। এই পরিমাণ বা তার চেয়ে কম টাকা বলুন।`,
  kn:`ನಿಮ್ಮ ಶಿಲ್ಕು ${amount}. ಇಷ್ಟು ಅಥವಾ ಇದಕ್ಕಿಂತ ಕಡಿಮೆ ಮೊತ್ತವನ್ನು ಹೇಳಿ.`,
  ta:`உங்கள் இருப்பு ${amount}. இந்தத் தொகை அல்லது இதைவிடக் குறைவான தொகையைச் சொல்லுங்கள்.`
 };
 return prompts[speakingLanguage]||prompts.en;
}
function showBalanceQuestion(){step='balance-question';localizeV8();el('v8BalanceQuestion').textContent=balancePrompt(language);el('v8BalanceNumber').textContent=money(passbook.profile?.balance||0);el('v8BalanceAnswer').hidden=true;el('v8BalanceActions').hidden=false;el('v8BalanceEdit').hidden=true;show('v8BalanceScreen');if(mode==='voice')promptVoice(balancePrompt(speakingLanguage));}
function revealBalance(){step='balance-visible';localizeV8();el('v8BalanceNumber').textContent=money(passbook.profile.balance);el('v8BalanceAnswer').hidden=false;el('v8BalanceQuestion').textContent=words().balance;el('v8BalanceActions').hidden=true;el('v8BalanceEdit').hidden=false;show('v8BalanceScreen');if(mode==='voice')promptVoice(availableBalancePrompt());}
function submitAmount(value){const n=Number(value);if(!Number.isFinite(n)||n<=0||n>1000000000||Math.abs(Math.round(n*100)-n*100)>0.000001){status('v8AmountStatus',({en:'Please enter a valid amount.',hi:'कृपया सही राशि बताइए।',pa:'ਕਿਰਪਾ ਕਰਕੇ ਸਹੀ ਰਕਮ ਦੱਸੋ।',bn:'অনুগ্রহ করে সঠিক পরিমাণ বলুন।',ta:'சரியான தொகையைச் சொல்லுங்கள்.',kn:'ದಯವಿಟ್ಟು ಸರಿಯಾದ ಮೊತ್ತವನ್ನು ಹೇಳಿ.'})[language]||'Please enter a valid amount.');if(mode==='voice')retryReply();return}
 el('v8AmountInput').value=String(n);detectedAmount=String(n);if(service==='withdrawal'&&n>Number(passbook.profile?.balance||0)){showBalanceQuestion();return}
 step='form';if(service==='withdrawal'){el('amount').value=String(n);el('requestedAmount').value=String(n);el('confirm').checked=false;showReview(n);}else{showReview(n)} }

function withdrawalReviewCopy(code=language){if(code==='pa')return {title:'ਕਿਰਪਾ ਕਰਕੇ ਨਿਕਾਸੀ ਦੇ ਵੇਰਵੇ ਜਾਂਚੋ',prefix:'ਸਾਰੇ ਵੇਰਵੇ ਜਾਂਚੋ। ਜੇ ਸਹੀ ਹਨ ਤਾਂ ਹਾਂ ਕਹੋ।',service:'ਨਕਦ ਨਿਕਾਸੀ',labels:['ਨਾਮ','ਸੇਵਾ','ਰਕਮ','ਖਾਤਾ','ਡੈਮੋ ਬਕਾਇਆ'],yes:'ਹਾਂ, ਸਾਰੇ ਵੇਰਵੇ ਸਹੀ ਹਨ',change:'ਰਕਮ ਬਦਲੋ',ready:'ਤੁਹਾਡਾ ਫਾਰਮ ਤਿਆਰ ਹੈ',preview:'ਆਪਣਾ ਫਾਰਮ ਵੇਖੋ',details:'ਹਰੇ ਬਾਕਸ ਵਿੱਚ ਦਸਤਖ਼ਤ ਕਰੋ',download:'ਫਾਰਮ ਡਾਊਨਲੋਡ ਕਰੋ',back:'ਸ਼ੁਰੂ ਤੇ ਜਾਓ'};return code==='hi'?{
 title:'कृपया निकासी की जानकारी जाँचें',prefix:'कृपया जानकारी ध्यान से जाँच लें। अगर सब सही है, तो कहें: हाँ, यह सही है।',service:'नकद निकासी',labels:['नाम','सेवा','राशि','खाता','डेमो बैलेंस'],yes:'✓ हाँ, सारी जानकारी सही है',change:'राशि बदलें',ready:'आपका निकासी फ़ॉर्म तैयार है',preview:'जी, अपना निकासी फ़ॉर्म यहाँ देखें।',details:'निकासी की जानकारी',download:'फ़ॉर्म डाउनलोड करें',back:'शुरू में जाएँ'}:{title:'Please check your withdrawal details',prefix:'Please check the details. If everything is correct, say: Yes, it is correct.',service:'Cash withdrawal',labels:['Name','Service','Amount','Account','Demo balance'],yes:'✓ Yes, everything is correct',change:'Change amount',ready:'Your withdrawal form is ready.',preview:'your withdrawal form is ready to review.',details:'Withdrawal details',download:'Print / Download form',back:'Back to start'};}
const regionalReview = {
  "bn": {
    "title": "বিবরণ যাচাই করুন",
    "prefix": "সব তথ্য ঠিক থাকলে হ্যাঁ বলুন।",
    "withdrawal": "নগদ উত্তোলন",
    "deposit": "নগদ জমা",
    "labels": [
      "নাম",
      "পরিষেবা",
      "পরিমাণ",
      "অ্যাকাউন্ট",
      "ডেমো ব্যালেন্স"
    ],
    "yes": "হ্যাঁ, সব ঠিক আছে",
    "change": "পরিমাণ বদলান",
    "ready": "আপনার ফর্ম প্রস্তুত",
    "preview": "ফর্মটি দেখুন",
    "details": "ছাপানো ফর্মের সবুজ ঘরে সই করুন।",
    "download": "ফর্ম ডাউনলোড করুন",
    "back": "শুরুতে ফিরুন"
  },
  "ta": {
    "title": "விவரங்களைச் சரிபார்க்கவும்",
    "prefix": "எல்லாம் சரியாக இருந்தால் ஆம் என்று சொல்லுங்கள்.",
    "withdrawal": "பணம் எடுத்தல்",
    "deposit": "பணம் செலுத்துதல்",
    "labels": [
      "பெயர்",
      "சேவை",
      "தொகை",
      "கணக்கு",
      "மாதிரி இருப்பு"
    ],
    "yes": "ஆம், சரி",
    "change": "தொகையை மாற்றவும்",
    "ready": "உங்கள் படிவம் தயார்",
    "preview": "படிவத்தைப் பார்க்கவும்",
    "details": "அச்சிட்ட படிவத்தின் பச்சைப் பெட்டியில் கையொப்பமிடவும்.",
    "download": "படிவத்தைப் பதிவிறக்கவும்",
    "back": "முகப்புக்குச் செல்லவும்"
  },
  "kn": {
    "title": "ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ",
    "prefix": "ಎಲ್ಲವೂ ಸರಿಯಾಗಿದ್ದರೆ ಹೌದು ಎಂದು ಹೇಳಿ.",
    "withdrawal": "ನಗದು ಹಿಂಪಡೆಯುವುದು",
    "deposit": "ನಗದು ಜಮೆ",
    "labels": [
      "ಹೆಸರು",
      "ಸೇವೆ",
      "ಮೊತ್ತ",
      "ಖಾತೆ",
      "ಮಾದರಿ ಬಾಕಿ"
    ],
    "yes": "ಹೌದು, ಸರಿಯಾಗಿದೆ",
    "change": "ಮೊತ್ತ ಬದಲಿಸಿ",
    "ready": "ನಿಮ್ಮ ನಮೂನೆ ಸಿದ್ಧವಾಗಿದೆ",
    "preview": "ನಮೂನೆಯನ್ನು ನೋಡಿ",
    "details": "ಮುದ್ರಿಸಿದ ನಮೂನೆಯ ಹಸಿರು ಚೌಕದಲ್ಲಿ ಸಹಿ ಮಾಡಿ.",
    "download": "ನಮೂನೆ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
    "back": "ಮುಖಪುಟಕ್ಕೆ ಹೋಗಿ"
  }
};
function reviewCopy(code=language){
 const regional = regionalReview[code];
 if (regional) return {...regional, service: regional[service]};
const c=withdrawalReviewCopy(code);if(service==='deposit'){for(const k of ['title','prefix','service','ready','preview','details'])c[k]=c[k].replace(/withdrawal/gi,'deposit').replace(/निकासी/g,'जमा').replace(/ਨਿਕਾਸੀ/g,'ਜਮ੍ਹਾਂ');}return c;}
function safeAccount(){const a=String(passbook.profile?.account_id||passbook.account_id||'');return a?'••••'+a.slice(-4):'Demo account';}
function showReview(n,refreshOnly=false){reviewAmount=Number(n);step='review';const c=reviewCopy(),name=passbook.profile?.name||passbook.name||'Demo customer';el('v9ReviewHeading').textContent=c.title;el('v9ReviewMessage').textContent=(name+' '+(language==='hi'?'': '— ')+c.prefix);[...['v9LabelName','v9LabelService','v9LabelAmount','v9LabelAccount','v9LabelBalance']].forEach((id,i)=>el(id).textContent=c.labels[i]);el('v9ReviewName').textContent=name;el('v9ReviewService').textContent=c.service;el('v9ReviewAmount').textContent=money(n);el('v9ReviewAccount').textContent=safeAccount();el('v9ReviewBalance').textContent=money(passbook.profile?.balance||0);el('v9ReviewYes').textContent=c.yes;el('v9ReviewChange').textContent=c.change;if(!refreshOnly){status('v9ReviewStatus','');show('v9ReviewScreen');}if(!refreshOnly&&mode==='voice'&&!['hi','en'].includes(speakingLanguage)){const spoken=reviewCopy(speakingLanguage);promptVoice([name,spoken.service,money(n),spoken.prefix].join('. '));return;}if(!refreshOnly&&mode==='voice')promptVoice((speakingLanguage==='hi'?'खाताधारक का नाम '+name+' है। आप '+money(n)+(service==='deposit'?' जमा करना चाहते हैं। ':' निकालना चाहते हैं। '):'The account holder is '+name+'. You want to '+(service==='deposit'?'deposit ':'withdraw ')+money(n)+'. ')+reviewCopy(speakingLanguage).prefix);}
function showPreparedPreview(){if(step!=='preparing')return;step='preview';const c=reviewCopy(),name=passbook.profile?.name||passbook.name||'Demo customer';el('v9PreviewHeading').textContent=c.ready;el('v9PreviewMessage').textContent=name+' — '+money(reviewAmount)+' — '+c.preview;el('v9PreviewDetailsTitle').textContent=c.details;el('v9PreviewLabelName').textContent=c.labels[0];el('v9PreviewLabelAmount').textContent=c.labels[2];el('v9PreviewLabelAccount').textContent=c.labels[3];el('v9PreviewName').textContent=name;el('v9PreviewAmount').textContent=money(reviewAmount);el('v9PreviewAccount').textContent=safeAccount();el('v9PreviewDownload').textContent=c.download;const frame=el('withdrawalPdfPreview');frame.hidden=false;el('v9PdfHost').appendChild(frame);frame.src=frame.dataset.objectUrl+'#toolbar=0&navpanes=0&scrollbar=0&view=FitH';el('v16OpenWithdrawalPreview').href=frame.dataset.objectUrl;el('v16OpenWithdrawalPreview').hidden=false;show('v9PreviewScreen');import('./paper-preview.mjs').then(m=>m.renderPaper(frame,frame.dataset.objectUrl)).catch(console.warn);if(window.sahajV11){window.sahajV11.setPreviewGuide('withdrawal',{guideId:'v9PreviewGuide',statusId:'v9PreviewAutoStatus'});window.sahajV11.queueAfterGuidance('withdrawal',()=>{if(step==='preview')document.getElementById('v9PreviewDownload').click()},'v9PreviewAutoStatus',()=>step==='preview');}}
async function prepareReviewed(){
 if(step!=='review')return;
 if(service==='deposit'){step='preparing';try{document.querySelector('[data-form="deposit"]').onclick();el('formField_amount').value=String(reviewAmount);await el('previewSampleForm').onclick();if(activeScreen==='v16DepositPreviewScreen'){step='preview';return;}throw Error(el('otherFormStatus').textContent);}catch(error){showReview(reviewAmount);status('v9ReviewStatus',error.message||'Could not prepare the form. Please try again.');}return;}
 // Copy confirmed synthetic profile data into the form used for server validation.
 const p=passbook.profile;
 if(!p||!/^\d{8,12}$/.test(String(p.account_id||''))||!p.name||!p.phone){
  status('v9ReviewStatus',language==='hi'?'डेमो खाते की जानकारी अधूरी है। फिर से पासबुक चुनें।':'Demo account information is incomplete. Please choose the demo passbook again.');return;
 }
 el('name').value=p.name;
 el('account').value=String(p.account_id);
 el('phone').value=p.phone;
 el('branch').value=p.branch||'';
 el('amount').value=String(reviewAmount);
 el('withdrawalType').value='cash withdrawal';
 el('confirm').checked=true;
 step='preparing';status('v9ReviewStatus','');try{await el('prepare').onclick();}catch(error){showReview(reviewAmount);status('v9ReviewStatus','Could not prepare the form. Please try again.');return;}
 if(step==='preparing'&&!el('download').hidden&&el('withdrawalPdfPreview').dataset.objectUrl)showPreparedPreview();
}
function yes(text){return /^(yes|yeah|yep|haan|han|ha|हाँ|हां|जी|बिलकुल|হ্যাঁ|ஆம்|ಹೌದು|ਹਾਂ|aama|aamam|seri|haudu|howdu|sari|hyan|हां जी|show|दिखा|दिखाओ|बताओ|balance|बैलेंस|ব্যালেন্স|இருப்பு|ਬਕਾਇਆ|ಬಾಕಿ)/i.test(text.trim())}
function no(text){return /^(no|nah|nahi|na|नहीं|नही|ना|না|இல்லை|ಇಲ್ಲ|ਨਹੀਂ|illai|vendam|illa|beda)/i.test(text.trim())}
let failedReplies=0;
function briefQuestion(){
 const hi=speakingLanguage==='hi';
 const bank={service:hi?'निकासी, जमा या नया खाता?':'Withdraw, deposit, or open an account?',passbook:hi?'डेमो पासबुक बोलें या चुनें।':'Say or choose Demo passbook.',amount:hi?'कितनी राशि?':'What amount?',review:hi?'जानकारी सही है? हाँ या ना कहें।':'Are the details correct? Yes or no?', 'balance-question':hi?'बैलेंस देखना है? हाँ या ना?':'Show your balance? Yes or no?',preview:hi?'फ़ॉर्म डाउनलोड करें?':'Download the form?'};
 if(step==='opening')return window.SahajOpeningFlow?.shortQuestion?.()||currentQuestion();
 return ['en','hi'].includes(speakingLanguage)?bank[step]||currentQuestion():currentQuestion();
}
async function retryReply(hint){failedReplies++;if(failedReplies>=3){failedReplies=0;window.sahajRecovery?.open();return;}const prefix={hi:'समझ नहीं आया। ',en:'I missed that. ',pa:'ਮਾਫ਼ ਕਰਨਾ, ਸਮਝ ਨਹੀਂ ਆਇਆ। ',bn:'দুঃখিত, বুঝতে পারিনি। ',ta:'மன்னிக்கவும், புரியவில்லை. ',kn:'ಕ್ಷಮಿಸಿ, ಅರ್ಥವಾಗಲಿಲ್ಲ. '}[speakingLanguage]||'';await promptVoice(prefix+(typeof hint==='string'?hint:briefQuestion()));}

function isServiceHelp(text){return /ਕੀ.*(?:ਕਰ ਸਕ|ਮਦਦ|ਸੇਵਾ)|ਕਿਹੜੀਆਂ.*ਸੇਵਾਵਾਂ|কী.*(?:করতে|সেবা|সাহায্য)|কোন.*পরিষেবা|என்ன.*(?:சேவை|உதவி|செய்ய)|என்னென்ன.*சேவை|ಯಾವ.*ಸೇವೆ|ಏನು.*(?:ಮಾಡ|ಸಹಾಯ)|केह्.*(?:सेवा|मदद)|what.*(?:can|do).*you|what.*you.*(?:can|do)|क्या.*कर.*सक|kya.*kar.*sak|कौन.*(?:सुविधा|सेवा|सर्विस)|what.*services|which.*services|how can you help|कौन\s*सी.*(?:सेवा|सर्विस)|क्या.*(?:मदद|सेवा|सर्विस)|सेवाएं.*(?:उपलब्ध|available)|सेवाएँ.*(?:उपलब्ध|available)|kya.*madad|kaun.*(?:seva|service)/i.test(text);}
function currentQuestion(){const c=spokenWords();switch(step){
 case 'home':case 'service':return ({hi:'आप कौन सी सेवा चाहते हैं: पैसे निकालना, पैसे जमा करना या नया खाता?',en:'Which service would you like: withdrawal, deposit, or a new account?',pa:'ਤੁਸੀਂ ਕੀ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ? ਪੈਸੇ ਕਢਵਾਉਣੇ, ਜਮ੍ਹਾਂ ਕਰਵਾਉਣੇ ਜਾਂ ਨਵਾਂ ਖਾਤਾ ਖੋਲ੍ਹਣਾ?',bn:'আপনি কী করতে চান? টাকা তুলতে, জমা দিতে, নাকি নতুন অ্যাকাউন্ট খুলতে?',ta:'நீங்கள் என்ன செய்ய விரும்புகிறீர்கள்? பணம் எடுக்கவா, செலுத்தவா, புதிய கணக்கு தொடங்கவா?',kn:'ನೀವು ಏನು ಮಾಡಲು ಬಯಸುತ್ತೀರಿ? ಹಣ ತೆಗೆಯಲು, ಜಮೆ ಮಾಡಲು ಅಥವಾ ಹೊಸ ಖಾತೆ ತೆರೆಯಲು?'})[speakingLanguage]||'Which service would you like?';
 case 'passbook':return passbookGuides[speakingLanguage]||passbookGuides.en;
 case 'amount':return service==='deposit'?c.depositAmount:c.amount;
 case 'review':return reviewCopy(speakingLanguage).prefix;
 case 'balance-question':return balancePrompt(speakingLanguage);
 case 'balance-visible':return availableBalancePrompt();
 case 'opening':return window.SahajOpeningFlow?.question?.()||'';
 default:return '';
}}
function wantsNewAccount(raw){
 const text=raw.normalize('NFKC').toLowerCase();
 if(/(?:खोल\S*|khol\w*)\s+(?:नहीं|नही|nahi)|(?:नहीं|नही|nahi)\s+(?:खोल|khol)|(?:don't|dont|do not) want to open/u.test(text))return false;
 const account='(?:खाता|खाते|अकाउंट|अकाउण्ट|एकाउंट|एकाउण्ट|account|khata|khaata)';
 const opening='(?:खोल[^\\s।,.]*|खुलवा[^\\s।,.]*|khol\\w*|khulwa\\w*|open)';
 const phrase=new RegExp('(?:नया|नए|नयी|naya|nayaa|new)\\s+(?:(?:बैंक|bank)\\s+)?'+account+'|'+account+'\\s+(?:(?:को|भी|ही)\\s+)?'+opening+'|'+opening+'\\s+(?:(?:a|an|the|new|bank|नया|बैंक)\\s+)*'+account,'u');
 return phrase.test(text)||/নতুন\s*(?:অ্যাকাউন্ট|account|খাতা)|புதிய கணக்கு|ಹೊಸ ಖಾತೆ|ਨਵਾਂ ਖਾਤਾ/i.test(text);
}
function requestedService(text){
 // Last explicit service wins in corrections such as "withdraw ... no, deposit".
 const matches=Array.from(text.toLowerCase().matchAll(/withdraw(?:al)?|निकाल\S*|निकासी|कड़\S*|कढ\S*|कड्ढ|nikal\w*|kadh\w*|deposit|जमा|jama|ਜਮ੍ਹਾ(?:ਂ)?|ਜਮਾਂ|ਪਾਉਣ|ಜಮಾ|ಜಮೆ|ಠೇವಣಿ|ಹಣ ಹಾಕ|செலுத்த|டெபாசிட்|பணம் போட|জমা|টাকা রাখতে|ਕਢ|ਕੱਢ|ತೆಗೆ|ಹಿಂಪಡೆ|எடு|তুল|উত্তোলন|টাকা বের|tulbo|tulte|tulun|taka\s+tol|taka\s+tul|joma|enakku\s+panam\s+eduk\w*|edukka|eduka|edukkanum|enakku\s+panam\s+seluth\w*|selutha|seluthanum|panam\s+poda|panam\s+podanum|nanage\s+hana\s+tege\w*|tegeyabeku|tegeyalu|tegedukolli|himpadey\w*|hana\s+haak\w*|hana\s+hak\w*|jame|jame\s+mad\w*/g));
 if(!matches.length)return '';
 const match=matches[matches.length-1];
 const before=text.slice(0,match.index);
 if(/(?:do not|don't|dont|not)\s+(?:want\s+)?(?:to\s+)?$/i.test(before))return '';
 const tail=text.slice(match.index+match[0].length);
 if(/^(?:\s+(?:करना|करने|karna|karne|कर|है|hai))*\s*(?:नहीं|नही|nahi|not)\s*(?:है|hai)?[.!।\s]*$/i.test(tail))return '';
 return /deposit|जमा|jama|ਜਮ੍ਹਾ|ਜਮਾਂ|ਪਾਉਣ|ಜಮಾ|ಜಮೆ|ಠೇವಣಿ|ಹಣ ಹಾಕ|செலுத்த|டெபாசிட்|பணம் போட|জমা|টাকা রাখতে|joma|selutha|seluthanum|panam\s+poda|panam\s+podanum|hana\s+haak|hana\s+hak|jame/.test(match[0])?'deposit':'withdrawal';
}
async function switchService(kind){
 window.sahajV11?.cancelSequence?.(service);
 window.sahajCancelSpeech?.();
 service=kind;reviewAmount=0;detectedAmount='';readyPayload=null;
 el('download').hidden=true;resetSamplePreview();failedReplies=0;
 if(passbook.profile?.account_id)showAmount();else await chooseService(kind);
}
async function handleVoice(raw,detected=''){if(window.sahajOpeningGreeting)return;if(window.demoFace?.answer(raw))return;const t=String(raw||'').trim();if(!t)return;lastActivityAt=Date.now();window.cancelIdleEnd?.();customerHasSpoken=true;if(/^(?:end|end session|finish|stop|done|ਖਤਮ|ਸਮਾਪਤ|শেষ|বন্ধ|முடி|முடிக்கவும்|முடிவு|ಮುಗಿಸಿ|ಅಂತ್ಯ|एंड|एण्ड|समाप्त|खत्म|बंद)(?:\s+(?:session|सत्र|करो|करें|कर दो))*[.!।\s]*$/i.test(t)){endSession();return;}if(window.sahajBackRequest?.(t)){
  ++scanTurn;busy=false;if(typeof hideLoading==='function')hideLoading();window.sahajCancelSpeech?.();window.sahajV11?.cancelSequence?.(service);
  if(step==='amount')await chooseService(service);
  else if(['review','balance-question','balance-visible','preview'].includes(step))showAmount();
  else if(step==='opening' && window.SahajOpeningFlow?.back())return;
  else await startGreeting();
  return;
 }
 if(activeScreen==='counterScreen'){await promptVoice(({en:'Say end to finish the session.',hi:'सत्र समाप्त करने के लिए एंड कहें।',pa:'ਸੈਸ਼ਨ ਖਤਮ ਕਰਨ ਲਈ ਖਤਮ ਕਹੋ।',bn:'সেশন শেষ করতে শেষ বলুন।',ta:'முடிக்க, முடி என்று சொல்லுங்கள்.',kn:'ಅಧಿವೇಶನ ಮುಗಿಸಲು ಮುಗಿಸಿ ಎಂದು ಹೇಳಿ.'})[speakingLanguage]||'Say end to finish the session.');return;}if(parseLanguagePreferenceCommand(t)){localizeV8();failedReplies=0;await promptVoice(languageChangeConfirmation()+' '+currentQuestion());return;}if(detected)followSpokenLanguage(t,detected);else followSpokenLanguage(t);localizeV8();const intent=requestedService(t)||localIntent(t);
 if(isServiceHelp(t)){failedReplies=0;await promptVoice(spokenWords().help+' '+currentQuestion());return}
 if(['withdrawal','deposit'].includes(requestedService(t))&&!['home','service','opening','preparing'].includes(step)&&intent!==service){await switchService(intent);return;}
 if(step==='service'||step==='home'){if(intent==='withdrawal'||intent==='deposit'){await chooseService(intent);return}if(wantsNewAccount(t)){await chooseService('opening');return}if(intent==='unsupported')await promptVoice(spokenWords().unsupported);else await retryReply();return}
 if(step==='opening'){if(window.SahajOpeningFlow?.handleVoice){await window.SahajOpeningFlow.handleVoice(t);}return;}
 if(step==='passbook'){if(/passbook|pass book|password|पासबुक|पास बुक|पासवर्ड|demo|sample|नमूना|डेमो|ডেমো|পাসবই|পাসবুক|பாஸ்புக்|டெமோ|மாதிரி|ಪಾಸ್‌ಬುಕ್|ಡೆಮೋ|ಡೆಮೊ|ਡੈਮੋ|ਪਾਸਬੁੱਕ|ਨਮੂਨਾ|one|पहला|first|1/i.test(t)){failedReplies=0;await chooseDemo();}else await retryReply();return}
 if(step==='review'){const answer=window.sahajConfirmation(t,'review');if(answer==='no'){failedReplies=0;showAmount();return;}if(answer==='yes'){failedReplies=0;await prepareReviewed();return;}await retryReply();return;}
 if(step==='preview'){if(/download|print|डाउनलोड|प्रिंट/i.test(t)){el(service==='deposit'?'downloadSampleForm':'download').click();return}await promptVoice(reviewCopy().ready);return}
 if(step==='amount'){const n=spokenNumberValue(t);if(n){failedReplies=0;submitAmount(n);return}await retryReply();return}
 if(step==='balance-question'){const n=spokenNumberValue(t);if(n){failedReplies=0;submitAmount(n);return}if(window.sahajConfirmation?.(t)==='no'||no(t)){showAmount();return}if(window.sahajConfirmation?.(t)==='yes'||yes(t)||/balance|बैलेंस|बैलेंस दिखा|बैलेंस बत|show me|दिखा|बकाया/i.test(t)){revealBalance();return}if(no(t)){showAmount();return}await retryReply();return}
 if(step==='balance-visible'){const n=spokenNumberValue(t);if(n){failedReplies=0;submitAmount(n);return}if(/change|less|smaller|कम|बदल|amount|राशि|টাকা|தொகை/i.test(t)){showAmount();return}await promptVoice(availableBalancePrompt());return}
}
// Existing adapter receives all microphone transcripts; replace its journey with the compact kiosk transition.
if(window.voiceJourney){window.voiceJourney.start=()=>startGreeting(true);window.voiceJourney.handle=handleVoice;}
el('manualContinue').onclick=()=>{mode='manual';el('voiceManual').hidden=true;show('voiceScreen');step='service';greetView();status('voiceStatus','');};
el('voiceManual').onclick=()=>{if(typeof pauseVoiceInput==='function')pauseVoiceInput();mode='manual';el('voiceManual').hidden=true;status('voiceStatus','');};
document.querySelectorAll('[data-v8-service]').forEach(b=>b.addEventListener('click',()=>chooseService(b.dataset.v8Service)));
document.querySelectorAll('[data-home-form]').forEach(button=>{
 button.addEventListener('click',()=>{
  el('manualContinue').click();
  chooseService(button.dataset.homeForm);
 });
});
el('v8Demo').onclick=chooseDemo;
document.querySelectorAll('[data-v8-amount]').forEach(b=>b.onclick=()=>{el('v8AmountInput').value=b.dataset.v8Amount});
el('v8AmountNext').onclick=()=>submitAmount(el('v8AmountInput').value);
el('v8AmountInput').addEventListener('keydown',e=>{if(e.key==='Enter')submitAmount(el('v8AmountInput').value)});
el('v8AmountBack').onclick=()=>chooseService(service);
el('v8BalanceYes').onclick=revealBalance;el('v8BalanceNo').onclick=showAmount;el('v8BalanceEdit').onclick=showAmount;
new MutationObserver(()=>{if(step==='preparing'&&el('profileStatus').textContent.trim()){step='review';show('v9ReviewScreen');status('v9ReviewStatus',el('profileStatus').textContent)}}).observe(el('profileStatus'),{childList:true,characterData:true,subtree:true});
el('v16DepositBack').onclick=showAmount;
el('v9ReviewYes').onclick=prepareReviewed;el('v9ReviewChange').onclick=showAmount;el('v9PreviewDownload').onclick=()=>el('download').click();el('withdrawalPdfPreview').addEventListener('load',()=>{if(step==='preparing'&&el('withdrawalPdfPreview').src.startsWith('blob:'))showPreparedPreview()});
document.querySelectorAll('.v8-home').forEach(b=>b.onclick=home);
el('kioskStopListening').onclick=()=>{pauseVoiceInput();el('kioskListeningOverlay').hidden=true};
const watch=new MutationObserver(()=>{el('kioskListeningOverlay').hidden=!document.body.classList.contains('is-listening');if(document.body.classList.contains('is-listening'))localizeV8()});watch.observe(document.body,{attributes:true,attributeFilter:['class']});
window.addEventListener('sahaj:language-preference',localizeV8);window.addEventListener('sahaj:locale',localizeV8);
window.addEventListener('sahaj:screen',e=>{if(e.detail?.id==='permissionScreen'){++scanTurn;busy=false;service='';failedReplies=0;step='home';restoreHome();queueMicrotask(()=>{if(activeScreen==='permissionScreen')restoreHome()})}});
// Start the counter instruction after screen-change listeners cancel the old audio.
window.addEventListener('sahaj:screen',event=>{
 if(event.detail?.id!=='counterScreen')return;
 step='counter';
 queueMicrotask(()=>{
  if(activeScreen!=='counterScreen')return;
  const arm=()=>{clearTimeout(counterEndTimer);counterEndTimer=setTimeout(()=>{if(activeScreen==='counterScreen')endSession()},30000)};
  const hi=speakingLanguage==='hi';
  const ending=({hi:'सत्र समाप्त करने के लिए एंड कहें या सत्र समाप्त करें बटन दबाएँ।',en:'Say end or press End session.',pa:'ਸੈਸ਼ਨ ਖਤਮ ਕਰਨ ਲਈ ਖਤਮ ਕਹੋ ਜਾਂ ਸੈਸ਼ਨ ਖਤਮ ਕਰੋ ਦਬਾਓ।',bn:'সেশন শেষ করতে শেষ বলুন অথবা সেশন শেষ করুন চাপুন।',ta:'முடிக்க, முடி என்று சொல்லுங்கள் அல்லது அமர்வை முடி என்பதை அழுத்துங்கள்.',kn:'ಮುಗಿಸಲು ಮುಗಿಸಿ ಎಂದು ಹೇಳಿ ಅಥವಾ ಮುಕ್ತಾಯ ಬಟನ್ ಒತ್ತಿರಿ.'})[speakingLanguage]||'Say end or press End session.';
  el('counterDisclaimer').textContent=({en:'Say end or press End session.',hi:'एंड कहें या सत्र समाप्त करें बटन दबाएँ।',pa:'ਖਤਮ ਕਹੋ ਜਾਂ ਸੈਸ਼ਨ ਖਤਮ ਕਰੋ ਦਬਾਓ।',bn:'শেষ বলুন অথবা সেশন শেষ করুন চাপুন।',ta:'முடி என்று சொல்லுங்கள் அல்லது அமர்வை முடி என்பதை அழுத்துங்கள்.',kn:'ಮುಗಿಸಿ ಎಂದು ಹೇಳಿ ಅಥವಾ ಮುಕ್ತಾಯ ಬಟನ್ ಒತ್ತಿರಿ.'})[language]||'Say end or press End session.';
  // Bound the wait even if the audio provider never completes playback.
  clearTimeout(counterEndTimer);counterEndTimer=setTimeout(()=>{if(activeScreen==='counterScreen')endSession()},90000);
  const staffDirections={en:'Take your printed application and declaration to Counter 2.',hi:'प्रिंट किया हुआ आवेदन और घोषणा काउंटर 2 पर ले जाएँ।',pa:'ਫਾਰਮ 60 ਲਈ ਕਾਊਂਟਰ 2 ਤੇ ਜਾਓ।',bn:'ফর্ম ৬০ এর জন্য কাউন্টার ২ এ যান।',kn:'ಫಾರ್ಮ್ 60 ಗಾಗಿ ಕೌಂಟರ್ 2 ಕ್ಕೆ ಹೋಗಿ.',ta:'படிவம் 60 உதவிக்கு கவுண்டர் 2 செல்லவும்.'};
  const directions=counterInfo.form60?(staffDirections[speakingLanguage]||staffDirections.en):withCounter(COUNTER_PROMPT[speakingLanguage]||COUNTER_PROMPT.en);
  if(counterInfo.form60)el('counterInstruction').textContent=staffDirections[language]||staffDirections.en;
  if(mode==='voice')promptVoice(directions+' '+ending,arm);else arm();
 });
});
window.sahajOpeningPrompt=(text)=>promptVoice(text);
window.sahajRetryReply=retryReply;
window.sahajResetRetries=()=>{failedReplies=0};
window.sahajExplicitScreenChoice=false;
localizeV8();restoreHome();
})();
