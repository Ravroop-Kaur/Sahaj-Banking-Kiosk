/* Sahaj V6 — simplified visible surface using existing, tested banking handlers. */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 const copy={
  hi:{greeting:'नमस्ते!',question:'मैं आपकी कैसे मदद कर सकती हूँ?',upload:'अपनी पासबुक दिखाएँ',amountWithdraw:'आप कितने पैसे निकालना चाहते हैं?',amountDeposit:'आप कितने पैसे जमा करना चाहते हैं?',listening:'सुन रही हूँ…',hint:'आराम से बोलिए, मैं सुन रही हूँ।',stop:'सुनना बंद करें',status:'आप बोल सकती हैं या नीचे कोई सेवा चुन सकती हैं।',withdraw:'पैसे निकालें',deposit:'पैसे जमा करें',opening:'नया खाता',help:'मैं पैसे निकालने, जमा करने और नए खाते का आवेदन बनाने में मदद कर सकती हूँ। नीचे चुनें या बोलें।'},
  en:{greeting:'Welcome!',question:'How may I help you?',upload:'Show your passbook',amountWithdraw:'How much money would you like to withdraw?',amountDeposit:'How much money would you like to deposit?',listening:'Listening…',hint:'Speak naturally. I am listening.',stop:'Stop listening',status:'Speak or tap a service below.',withdraw:'Withdraw money',deposit:'Deposit money',opening:'Open an account',help:'I can help prepare withdrawal forms, deposit slips and new account applications. Choose a service below or speak.'},
  pa:{greeting:'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ!',question:'ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦੀ ਹਾਂ?',upload:'ਆਪਣੀ ਪਾਸਬੁੱਕ ਦਿਖਾਓ',amountWithdraw:'ਕਿੰਨੇ ਪੈਸੇ ਕਢਵਾਉਣੇ ਹਨ?',amountDeposit:'ਕਿੰਨੇ ਪੈਸੇ ਜਮ੍ਹਾਂ ਕਰਵਾਉਣੇ ਹਨ?',listening:'ਸੁਣ ਰਹੀ ਹਾਂ…',hint:'ਆਰਾਮ ਨਾਲ ਬੋਲੋ।',stop:'ਸੁਣਨਾ ਬੰਦ ਕਰੋ',status:'ਬੋਲੋ ਜਾਂ ਹੇਠਾਂ ਸੇਵਾ ਚੁਣੋ।',withdraw:'ਪੈਸੇ ਕਢਵਾਓ',deposit:'ਪੈਸੇ ਜਮ੍ਹਾਂ ਕਰੋ',opening:'ਨਵਾਂ ਖਾਤਾ',help:'ਮੈਂ ਪੈਸੇ ਕਢਵਾਉਣ, ਜਮ੍ਹਾਂ ਕਰਵਾਉਣ ਅਤੇ ਨਵੇਂ ਖਾਤੇ ਦੀ ਅਰਜ਼ੀ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦੀ ਹਾਂ।'},
  bn:{greeting:'নমস্কার!',question:'আমি কীভাবে সাহায্য করতে পারি?',upload:'পাসবুক দেখান',amountWithdraw:'কত টাকা তুলতে চান?',amountDeposit:'কত টাকা জমা দিতে চান?',listening:'শুনছি…',hint:'স্বাভাবিকভাবে বলুন।',stop:'শোনা বন্ধ করুন',status:'বলুন বা নিচে পরিষেবা বেছে নিন।',withdraw:'টাকা তুলুন',deposit:'টাকা জমা দিন',opening:'নতুন অ্যাকাউন্ট',help:'আমি টাকা তোলা, জমা এবং নতুন অ্যাকাউন্টের আবেদন তৈরিতে সাহায্য করতে পারি।'},
  ta:{greeting:'வணக்கம்!',question:'நான் உங்களுக்கு எப்படி உதவலாம்?',upload:'பாஸ்புக்கைக் காட்டுங்கள்',amountWithdraw:'எவ்வளவு பணம் எடுக்க விரும்புகிறீர்கள்?',amountDeposit:'எவ்வளவு பணம் செலுத்த விரும்புகிறீர்கள்?',listening:'கேட்டுக்கொண்டிருக்கிறேன்…',hint:'இயல்பாகப் பேசுங்கள்.',stop:'கேட்பதை நிறுத்து',status:'பேசுங்கள் அல்லது ஒரு சேவையைத் தேர்ந்தெடுங்கள்.',withdraw:'பணம் எடுக்க',deposit:'பணம் செலுத்த',opening:'புதிய கணக்கு',help:'பணம் எடுப்பு, வைப்பு மற்றும் புதிய கணக்கு விண்ணப்பத்தில் உதவ முடியும்.'},
  kn:{greeting:'ನಮಸ್ಕಾರ!',question:'ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?',upload:'ನಿಮ್ಮ ಪಾಸ್‌ಬುಕ್ ತೋರಿಸಿ',amountWithdraw:'ಎಷ್ಟು ಹಣ ಹಿಂಪಡೆಯಲು ಬಯಸುತ್ತೀರಿ?',amountDeposit:'ಎಷ್ಟು ಹಣ ಜಮೆ ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?',listening:'ಕೇಳುತ್ತಿದ್ದೇನೆ…',hint:'ಸಹಜವಾಗಿ ಮಾತನಾಡಿ.',stop:'ಕೇಳುವುದನ್ನು ನಿಲ್ಲಿಸಿ',status:'ಮಾತನಾಡಿ ಅಥವಾ ಸೇವೆಯನ್ನು ಆಯ್ಕೆ ಮಾಡಿ.',withdraw:'ಹಣ ತೆಗೆಯಿರಿ',deposit:'ಹಣ ಜಮೆ ಮಾಡಿ',opening:'ಹೊಸ ಖಾತೆ',help:'ಹಣ ತೆಗೆಯುವಿಕೆ, ಠೇವಣಿ ಮತ್ತು ಹೊಸ ಖಾತೆಯ ಅರ್ಜಿ ತಯಾರಿಸಲು ಸಹಾಯ ಮಾಡಬಹುದು.'}
 };
 let wanted=null,preferredAmount='';window.sahajExplicitScreenChoice=false;
 const current=()=>copy[typeof language==='string'?language:'hi']||copy.hi;
 function update(){
  const c=current(); const first=language==='en'&&!window.sahajExplicitScreenChoice; $('kioskListeningText').textContent=c.listening;
  $('kioskListeningHint').textContent=c.hint;
  $('kioskStopListening').textContent=c.stop;
  // Voice-service greeting is owned by kiosk-v8.js to preserve the compact English-first layout.


  document.querySelectorAll('[data-kiosk-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.kioskLang===language)));
  const voiceStart=$('voiceContinue'),touch=$('manualContinue');
  if(voiceStart&&touch){const labels={
    hi:['🎙 बोलकर शुरू करें','Speak to start','बटन दबाकर चुनें','Use touch instead'],
    en:['🎙 Speak to start','','Choose by touch',''],
    pa:['🎙 ਬੋਲ ਕੇ ਸ਼ੁਰੂ ਕਰੋ','','ਛੂਹ ਕੇ ਚੁਣੋ',''],
    bn:['🎙 কথা বলে শুরু করুন','','ছুঁয়ে বেছে নিন',''],
    ta:['🎙 பேசித் தொடங்குங்கள்','','தொட்டு தேர்ந்தெடுங்கள்',''],
    kn:['🎙 ಮಾತನಾಡಿ ಪ್ರಾರಂಭಿಸಿ','','ಮುಟ್ಟಿ ಆಯ್ಕೆ ಮಾಡಿ','']};
    const m=labels[language]||labels.hi;
    const display=first?labels.hi:m;
    voiceStart.replaceChildren(document.createTextNode(display[0]));touch.replaceChildren(document.createTextNode(display[2]));
    if(display[1]){const p=document.createElement('span');p.textContent=display[1];voiceStart.append(p)}
    if(display[3]){const p=document.createElement('span');p.textContent=display[3];touch.append(p)}
  }

  if($('permissionScreen').hidden===false){
   $('permissionTitle').innerHTML=first?'<span class="welcome-en">Hello!</span><span class="welcome-hi">नमस्ते!</span>':`<span>${c.greeting}</span>`;
   $('permissionText').innerHTML=first?'<span class="welcome-question-en">How may I help you?</span><span class="welcome-question-hi">मैं आपकी कैसे मदद कर सकती हूँ?</span>':`<span>${c.question}</span>`;
   $('kioskHomeStatus').textContent=first?'Speak or tap a service.':c.status;
  }
  for(const [type,key] of [['withdrawal','withdraw'],['deposit','deposit'],['opening','opening']]){
   const b=document.querySelector(`[data-kiosk-service="${type}"]`);if(!b)continue;
   b.querySelector('strong').textContent=firstPartyLabel(type,c,key);b.querySelector('small').textContent=first?({withdrawal:'पैसे निकालें',deposit:'पैसे जमा करें',opening:'नया खाता'}[type]):'';
  }
 }
 function firstPartyLabel(type,c,key){return language==='en'&&!window.sahajExplicitScreenChoice?({withdrawal:'Withdraw money',deposit:'Deposit money',opening:'New account application'}[type]):c[key];}
 function select(code){window.sahajExplicitScreenChoice=true;language=code;speakingLanguage=code;displayLanguageLocked=true;speechLanguageLocked=true;try{localize()}catch(e){console.warn('Language UI',e)}update();}
 document.querySelectorAll('[data-kiosk-lang]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.kioskLang)));
 // Touch mode does not force people through another language page.
 $('manualContinue').onclick=()=>{$('kioskHomeStatus').textContent=current().help;document.querySelector('[data-kiosk-service="withdrawal"]')?.focus();};
 document.querySelectorAll('[data-simple-amount]').forEach(b=>b.addEventListener('click',()=>{$('simpleAmountInput').value=b.dataset.simpleAmount}));
 $('simpleAmountBack').onclick=()=>{wanted=null;show('permissionScreen')};
 $('simpleAmountNext').onclick=()=>{const n=Number($('simpleAmountInput').value);if(!Number.isFinite(n)||n<=0||n>9999999||Math.round(n*100)!==n*100){$('simpleAmountStatus').textContent=language==='hi'?'कृपया सही राशि लिखें।':'Please enter a valid amount (maximum ₹99,99,999).';return;}preferredAmount=String(n);show('uploadScreen');$('uploadTitle').textContent=current().upload;$('uploadDescription').textContent=language==='hi'?'डेमो के लिए नीचे नमूना पासबुक चुनें।':'For this demo, choose the sample passbook below.';};
 document.querySelectorAll('[data-kiosk-service]').forEach(b=>b.addEventListener('click',()=>{
  const type=b.dataset.kioskService;
  if(type==='help'){$('kioskHomeStatus').textContent=current().help;return;}
  if(type==='opening'){
   wanted=null;mode='manual';speakingLanguage=language;show('openingScreen');
   $('openingSummary').textContent=language==='hi'?'नया खाता खोलने का यह केवल नमूना आवेदन है।':'This is a sample application only. Bank staff must verify it.';
   return;
  }
  wanted=type;preferredAmount='';mode='manual';$('simpleAmountInput').value='';$('simpleAmountStatus').textContent='';
  $('simpleAmountQuestion').textContent=type==='withdrawal'?current().amountWithdraw:current().amountDeposit;
  $('simpleAmountDescription').textContent=({hi:'रुपये में राशि लिखें।',en:'Please enter the amount in rupees.',pa:'ਰੁਪਏ ਵਿੱਚ ਰਕਮ ਲਿਖੋ।',bn:'টাকার পরিমাণ লিখুন।',ta:'ரூபாயில் தொகையை உள்ளிடுங்கள்.',kn:'ರೂಪಾಯಿಗಳಲ್ಲಿ ಮೊತ್ತವನ್ನು ನಮೂದಿಸಿ.'})[language]||'Please enter the amount.';
  $('simpleAmountLabel').textContent=({hi:'राशि (₹)',en:'Amount (₹)',pa:'ਰਕਮ (₹)',bn:'পরিমাণ (₹)',ta:'தொகை (₹)',kn:'ಮೊತ್ತ (₹)'})[language]||'Amount (₹)';
  $('simpleAmountNext').textContent=({hi:'आगे बढ़ें',en:'Continue',pa:'ਅੱਗੇ ਵਧੋ',bn:'এগিয়ে যান',ta:'தொடரவும்',kn:'ಮುಂದುವರಿಸಿ'})[language]||'Continue';
  show('simpleAmountScreen');
 }));
 window.addEventListener('sahaj:screen',e=>{
  const screen=e.detail?.id;
  if(screen==='permissionScreen'){wanted=null;preferredAmount='';update()}
  if(screen==='formsScreen'&&wanted){const type=wanted;wanted=null;const b=document.querySelector(`[data-form="${type}"]`);if(b)queueMicrotask(()=>{if(activeScreen==='formsScreen'){b.click();if(type==='withdrawal'){$('amount').value=preferredAmount;$('requestedAmount').value=preferredAmount;}else{const amount=$('formField_amount');if(amount)amount.value=preferredAmount;}window.dispatchEvent(new Event('sahaj:locale'));}})}
 });
 window.addEventListener('sahaj:locale',update);const overlay=$('kioskListeningOverlay');
 const watch=new MutationObserver(()=>{const active=document.body.classList.contains('is-listening');overlay.hidden=!active;if(active)update()});
 watch.observe(document.body,{attributes:true,attributeFilter:['class']});
 $('kioskStopListening').addEventListener('click',()=>{if(typeof pauseVoiceInput==='function')pauseVoiceInput();overlay.hidden=true});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden)$('kioskStopListening').click()});
 // English is the default for both screen and speech; the user can switch at any time.
 language='en';speakingLanguage='en';try{localize()}catch{}update();
})();
