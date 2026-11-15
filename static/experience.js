/* Accessible navigation and presentation, isolated from voice/provider logic. */
(() => {
  'use strict';
  const get = id => document.getElementById(id);
  const stage = {openingScreen:1,permissionScreen:0,simpleAmountScreen:1,languageScreen:0,voiceScreen:0,requestScreen:0,uploadScreen:1,accountConfirmScreen:2,formsScreen:3,withdrawalScreen:3,otherFormScreen:3,counterScreen:4};
  const labels = {
    en:['Get started','Choose passbook','Check details','Prepare form',"You're ready"],
    hi:['शुरू करें','पासबुक चुनें','जानकारी जाँचें','फ़ॉर्म तैयार करें','आप तैयार हैं'],
    pa:['ਸ਼ੁਰੂ ਕਰੋ','ਪਾਸਬੁੱਕ ਚੁਣੋ','ਵੇਰਵੇ ਜਾਂਚੋ','ਫਾਰਮ ਬਣਾਓ','ਤੁਸੀਂ ਤਿਆਰ ਹੋ'],
    kn:["ಪ್ರಾರಂಭಿಸಿ", "ಪಾಸ್‌ಬುಕ್ ಆಯ್ಕೆಮಾಡಿ", "ವಿವರ ಪರಿಶೀಲಿಸಿ", "ಫಾರ್ಮ್ ಸಿದ್ಧಪಡಿಸಿ", "ನೀವು ಸಿದ್ಧರಾಗಿದ್ದೀರಿ"],ta:["தொடங்குங்கள்", "பாஸ்புக்கைத் தேர்ந்தெடுக்கவும்", "விவரங்களைச் சரிபார்க்கவும்", "படிவத்தைத் தயாரிக்கவும்", "நீங்கள் தயார்"],bn:["শুরু করুন", "পাসবই বেছে নিন", "বিবরণ যাচাই করুন", "ফর্ম তৈরি করুন", "আপনি প্রস্তুত"]};
  const help = {
    en:['Take your time.','Check every detail before preparing a form. No money moves in this demo.','End & clear session'],
    hi:['आराम से आगे बढ़ें।','फ़ॉर्म बनाने से पहले जानकारी जाँचें। इस डेमो में पैसे नहीं भेजे जाते।','सत्र समाप्त करें'],
    pa:['ਆਰਾਮ ਨਾਲ ਅੱਗੇ ਵਧੋ।','ਫਾਰਮ ਬਣਾਉਣ ਤੋਂ ਪਹਿਲਾਂ ਵੇਰਵੇ ਜਾਂਚੋ। ਇਸ ਡੈਮੋ ਵਿੱਚ ਪੈਸੇ ਨਹੀਂ ਭੇਜੇ ਜਾਂਦੇ।','ਸੈਸ਼ਨ ਖ਼ਤਮ ਕਰੋ'],
    kn:["ನಿಧಾನವಾಗಿ ಮುಂದುವರಿಯಿರಿ.", "ಫಾರ್ಮ್ ಸಿದ್ಧಪಡಿಸುವ ಮೊದಲು ಪ್ರತಿಯೊಂದು ವಿವರವನ್ನು ಪರಿಶೀಲಿಸಿ. ಈ ಡೆಮೊದಲ್ಲಿ ಹಣ ವರ್ಗಾವಣೆಯಾಗುವುದಿಲ್ಲ.", "ಸೆಷನ್ ಮುಗಿಸಿ"],ta:["நிதானமாகத் தொடருங்கள்.", "படிவம் தயாரிக்கும் முன் ஒவ்வொரு விவரத்தையும் சரிபார்க்கவும். இந்த டெமோவில் பணம் மாற்றப்படாது.", "அமர்வை முடிக்கவும்"],bn:["ধীরে ধীরে এগিয়ে যান।", "ফর্ম তৈরির আগে প্রতিটি বিবরণ যাচাই করুন। এই ডেমোতে টাকা স্থানান্তর হয় না।", "সেশন শেষ করুন"]};
  function welcome() {
    if(activeScreen!=='permissionScreen')return;
    document.documentElement.lang=window.SahajHome?window.SahajHome.lang():'en';
    get('fallbackActions').hidden=false;
  }
  function updateLocale() {
    welcome();
    const lang=labels[language]?language:'en';
    [...get('journeySteps').children].forEach((li,i)=>{li.querySelector('span').firstChild.textContent=labels[lang][i];});
    get('journeyNoteTitle').textContent=help[lang][0];get('journeyNote').textContent=help[lang][1];get('restartJourney').textContent=help[lang][2];
    get('journeyTitle').textContent=({en:'A LITTLE HELP. EVERY STEP.',hi:'हर कदम पर आपकी मदद।',pa:'ਹਰ ਕਦਮ ਤੇ ਤੁਹਾਡੀ ਮਦਦ।',kn:"ಪ್ರತಿ ಹಂತದಲ್ಲೂ ನಿಮ್ಮ ಸಹಾಯ.",ta:"ஒவ்வொரு படியிலும் உங்களுக்கு உதவி.",bn:"প্রতিটি ধাপে আপনার সহায়তা।"})[lang];
    // Decorative English descriptions are only shown in the English interface.
    get('journeySteps').querySelectorAll('small').forEach(el=>el.hidden=lang!=='en');
    document.querySelectorAll('[data-lang]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.lang===language)));
    const disclaimer={en:'Simulated counter guidance. No bank transaction has been submitted. End the session when you are ready.',hi:'यह काल्पनिक काउंटर की जानकारी है। कोई बैंक लेनदेन नहीं हुआ। तैयार होने पर सत्र समाप्त करें।',pa:'ਇਹ ਡੈਮੋ ਕਾਊਂਟਰ ਦੀ ਜਾਣਕਾਰੀ ਹੈ। ਕੋਈ ਲੈਣ-ਦੇਣ ਨਹੀਂ ਹੋਇਆ। ਤਿਆਰ ਹੋਣ ਤੇ ਸੈਸ਼ਨ ਖ਼ਤਮ ਕਰੋ।',kn:"ಇದು ಅನುಕರಿತ ಕೌಂಟರ್ ಮಾರ್ಗದರ್ಶನ. ಯಾವುದೇ ಬ್ಯಾಂಕ್ ವಹಿವಾಟು ಸಲ್ಲಿಸಲಾಗಿಲ್ಲ. ಸಿದ್ಧರಾದಾಗ ಸೆಷನ್ ಮುಗಿಸಿ.",ta:"இது உருவகப்படுத்தப்பட்ட கவுண்டர் வழிகாட்டுதல். எந்த வங்கிப் பரிவர்த்தனையும் சமர்ப்பிக்கப்படவில்லை. தயாரானதும் அமர்வை முடிக்கவும்.",bn:"এটি অনুকরণমূলক কাউন্টার নির্দেশনা। কোনো ব্যাংক লেনদেন জমা দেওয়া হয়নি। প্রস্তুত হলে সেশন শেষ করুন।"};
    get('counterDisclaimer').textContent=disclaimer[lang];
    get('withdrawalAmountLabel').firstChild.textContent=words(language).amount+' ';
    get('signatureHelp').textContent=({en:'Review the account details and amount. Download the draft, then sign the printed copy before taking it to the counter.',hi:'खाते की जानकारी और राशि जाँचें। मसौदा डाउनलोड करें, फिर छपी प्रति पर हस्ताक्षर करके काउंटर पर ले जाएँ।',pa:'ਖਾਤੇ ਦੇ ਵੇਰਵੇ ਅਤੇ ਰਕਮ ਜਾਂਚੋ। ਡਰਾਫਟ ਡਾਊਨਲੋਡ ਕਰੋ, ਫਿਰ ਛਪੀ ਕਾਪੀ ਤੇ ਦਸਤਖ਼ਤ ਕਰਕੇ ਕਾਊਂਟਰ ਤੇ ਲੈ ਜਾਓ।',kn:"ಖಾತೆಯ ವಿವರ ಮತ್ತು ಮೊತ್ತವನ್ನು ಪರಿಶೀಲಿಸಿ. ಕರಡನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ, ನಂತರ ಮುದ್ರಿತ ಪ್ರತಿಗೆ ಸಹಿ ಮಾಡಿ ಕೌಂಟರ್‌ಗೆ ಕೊಂಡೊಯ್ಯಿರಿ.",ta:"கணக்கு விவரங்களையும் தொகையையும் சரிபார்க்கவும். வரைவைப் பதிவிறக்கி, அச்சிட்ட நகலில் கையொப்பமிட்டு கவுண்டருக்கு எடுத்துச் செல்லவும்.",bn:"অ্যাকাউন্টের বিবরণ ও পরিমাণ যাচাই করুন। খসড়া ডাউনলোড করুন, তারপর ছাপা কপিতে সই করে কাউন্টারে নিয়ে যান।"})[lang];
    const dialogCopy={en:['Finish this session?','Your current form and account details will be cleared from this screen.','Keep working','End session'],hi:['यह सत्र समाप्त करें?','इस स्क्रीन से वर्तमान फ़ॉर्म और खाते की जानकारी साफ़ हो जाएगी।','जारी रखें','सत्र समाप्त करें'],pa:['ਇਹ ਸੈਸ਼ਨ ਖ਼ਤਮ ਕਰਨਾ ਹੈ?','ਇਸ ਸਕ੍ਰੀਨ ਤੋਂ ਮੌਜੂਦਾ ਫਾਰਮ ਅਤੇ ਖਾਤੇ ਦੇ ਵੇਰਵੇ ਸਾਫ਼ ਹੋ ਜਾਣਗੇ।','ਜਾਰੀ ਰੱਖੋ','ਸੈਸ਼ਨ ਖ਼ਤਮ ਕਰੋ'],kn:["ಈ ಸೆಷನ್ ಮುಗಿಸಬೇಕೇ?", "ನಿಮ್ಮ ಈಗಿನ ಫಾರ್ಮ್ ಮತ್ತು ಖಾತೆಯ ವಿವರಗಳನ್ನು ಈ ಪರದೆಯಿಂದ ಅಳಿಸಲಾಗುತ್ತದೆ.", "ಮುಂದುವರಿಸಿ", "ಸೆಷನ್ ಮುಗಿಸಿ"],ta:["இந்த அமர்வை முடிக்கவா?", "உங்கள் தற்போதைய படிவமும் கணக்கு விவரங்களும் இந்தத் திரையிலிருந்து அழிக்கப்படும்.", "தொடரவும்", "அமர்வை முடிக்கவும்"],bn:["এই সেশন শেষ করবেন?", "আপনার বর্তমান ফর্ম ও অ্যাকাউন্টের বিবরণ এই স্ক্রিন থেকে মুছে যাবে।", "চালিয়ে যান", "সেশন শেষ করুন"]}[lang];
    ['restartTitle','restartDescription','keepWorking','confirmRestart'].forEach((id,i)=>get(id).textContent=dialogCopy[i]);
    const sampleNames={en:['Clear / front','Rotated 90°','Upside down','Slight blur','Low contrast','Cropped / tilted'],hi:['साफ़ तस्वीर','90° घुमाया हुआ','उल्टा','हल्का धुंधला','कम रोशनी','कटा / तिरछा'],pa:['ਸਾਫ਼ ਤਸਵੀਰ','90° ਘੁਮਾਇਆ','ਉਲਟਾ','ਥੋੜ੍ਹਾ ਧੁੰਦਲਾ','ਘੱਟ ਰੌਸ਼ਨੀ','ਕੱਟਿਆ / ਟੇਢਾ'],kn:["ಸ್ಪಷ್ಟ / ಮುಂಭಾಗ", "90° ತಿರುಗಿಸಿದ", "ತಲೆಕೆಳಗಾದ", "ಸ್ವಲ್ಪ ಮಸುಕು", "ಕಡಿಮೆ ಕಾಂಟ್ರಾಸ್ಟ್", "ಕತ್ತರಿಸಿದ / ಓರೆ"],ta:["தெளிவான / முன்புறம்", "90° சுழற்றியது", "தலைகீழ்", "லேசான மங்கல்", "குறைந்த மாறுபாடு", "வெட்டப்பட்டது / சாய்ந்தது"],bn:["স্পষ্ট / সামনে", "৯০° ঘোরানো", "উল্টো", "সামান্য ঝাপসা", "কম কনট্রাস্ট", "কাটা / বাঁকা"]}[lang];
    const passbookCopy={en:['Choose a passbook','Choose the fictional sample passbook, or upload a synthetic test image.'],hi:['पासबुक चुनें','काल्पनिक नमूना पासबुक चुनें, या कोई कृत्रिम परीक्षण छवि अपलोड करें।'],pa:['ਪਾਸਬੁੱਕ ਚੁਣੋ','ਕਾਲਪਨਿਕ ਨਮੂਨਾ ਪਾਸਬੁੱਕ ਚੁਣੋ, ਜਾਂ ਕੋਈ ਨਕਲੀ ਟੈਸਟ ਤਸਵੀਰ ਅਪਲੋਡ ਕਰੋ।'],kn:["ಪಾಸ್‌ಬುಕ್ ಆಯ್ಕೆಮಾಡಿ", "ಕಾಲ್ಪನಿಕ ಮಾದರಿ ಪಾಸ್‌ಬುಕ್ ಆಯ್ಕೆಮಾಡಿ, ಅಥವಾ ಕೃತಕ ಪರೀಕ್ಷಾ ಚಿತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ."],ta:["பாஸ்புக்கைத் தேர்ந்தெடுக்கவும்", "கற்பனை மாதிரி பாஸ்புக்கைத் தேர்ந்தெடுக்கவும், அல்லது செயற்கை சோதனைப் படத்தைப் பதிவேற்றவும்."],bn:["পাসবই বেছে নিন", "কাল্পনিক নমুনা পাসবই বেছে নিন, অথবা একটি কৃত্রিম পরীক্ষামূলক ছবি আপলোড করুন।"]}[lang];
    get('uploadTitle').textContent=passbookCopy[0];get('uploadDescription').textContent=passbookCopy[1];
    document.querySelectorAll('.sample-card').forEach((card,i)=>{card.querySelector('strong').textContent=`${i+1} · ${sampleNames[i]}`;card.querySelector('span').hidden=lang!=='en'});
    get('footerText').textContent=({en:'SYNTHETIC DEMO · No money moves. Never enter real account details, PINs or OTPs.',hi:'काल्पनिक डेमो · कोई लेनदेन नहीं। असली खाते की जानकारी, PIN या OTP न डालें।',pa:'ਕਾਲਪਨਿਕ ਡੈਮੋ · ਕੋਈ ਲੈਣ-ਦੇਣ ਨਹੀਂ। ਅਸਲੀ ਖਾਤੇ ਦੇ ਵੇਰਵੇ, PIN ਜਾਂ OTP ਨਾ ਦਿਓ।',kn:"ಕೃತಕ ಡೆಮೊ · ಯಾವುದೇ ಹಣ ಚಲಿಸುವುದಿಲ್ಲ. ನಿಜವಾದ ಖಾತೆ ವಿವರ, ಪಿನ್ ಅಥವಾ ಓಟಿಪಿ ನಮೂದಿಸಬೇಡಿ.",ta:"செயற்கை டெமோ · பணம் எதுவும் நகராது. உண்மையான கணக்கு விவரங்கள், PIN அல்லது OTP உள்ளிட வேண்டாம்.",bn:"কৃত্রিম ডেমো · কোনো টাকা যায় না। আসল অ্যাকাউন্টের বিবরণ, পিন বা ওটিপি দেবেন না।"})[activeScreen==='permissionScreen'?'en':lang];
    if(activeScreen==='formsScreen')get('passbookNotice').hidden=false;
    const formNames={en:['Withdrawal form','Deposit form','Account details'],hi:['निकासी फ़ॉर्म','जमा फ़ॉर्म','खाते की जानकारी'],pa:['ਕਢਵਾਉਣ ਦਾ ਫਾਰਮ','ਜਮ੍ਹਾਂ ਫਾਰਮ','ਖਾਤੇ ਦੇ ਵੇਰਵੇ'],kn:["ಹಣ ಹಿಂಪಡೆಯುವ ಫಾರ್ಮ್", "ಠೇವಣಿ ಫಾರ್ಮ್", "ಖಾತೆಯ ವಿವರಗಳು"],ta:["பணம் எடுக்கும் படிவம்", "டெபாசிட் படிவம்", "கணக்கு விவரங்கள்"],bn:["টাকা তোলার ফর্ম", "জমার ফর্ম", "অ্যাকাউন্টের বিবরণ"]}[lang];
    document.querySelector('[data-form="withdrawal"] strong').textContent=formNames[0];document.querySelector('[data-form="deposit"] strong').textContent=formNames[1];
    document.querySelector('#withdrawalScreen summary').textContent=formNames[2];
    if(activeScreen==='otherFormScreen'&&selectedFormType==='deposit'){
      get('otherFormTitle').textContent=formNames[1];get('selectedFormImage').hidden=true;
      const names={en:['Account holder name','Account number','Branch','Phone number','Deposit amount (₹)'],hi:['खाताधारक का नाम','खाता संख्या','शाखा','फ़ोन नंबर','जमा राशि (₹)'],pa:['ਖਾਤਾਧਾਰਕ ਦਾ ਨਾਮ','ਖਾਤਾ ਨੰਬਰ','ਸ਼ਾਖਾ','ਫ਼ੋਨ ਨੰਬਰ','ਜਮ੍ਹਾਂ ਰਕਮ (₹)'],kn:["ಖಾತೆದಾರರ ಹೆಸರು", "ಖಾತೆ ಸಂಖ್ಯೆ", "ಶಾಖೆ", "ಫೋನ್ ಸಂಖ್ಯೆ", "ಠೇವಣಿ ಮೊತ್ತ (₹)"],ta:["கணக்குதாரர் பெயர்", "கணக்கு எண்", "கிளை", "தொலைபேசி எண்", "டெபாசிட் தொகை (₹)"],bn:["অ্যাকাউন্টধারীর নাম", "অ্যাকাউন্ট নম্বর", "শাখা", "ফোন নম্বর", "জমার পরিমাণ (₹)"]}[lang];
      ['name','account','branch','phone','amount'].forEach((field,i)=>{const input=get('formField_'+field);if(input)input.parentElement.firstChild.textContent=names[i]});
      if(get('formField_amount'))get('formField_amount').inputMode='decimal';
    }
    get('manualAccountEntry').textContent=({en:'Can’t read the passbook? Type its account number',hi:'पासबुक नहीं पढ़ी गई? खाता संख्या लिखें',pa:'ਪਾਸਬੁੱਕ ਨਹੀਂ ਪੜ੍ਹੀ ਗਈ? ਖਾਤਾ ਨੰਬਰ ਲਿਖੋ',kn:"ಪಾಸ್‌ಬುಕ್ ಓದಲಾಗಲಿಲ್ಲವೇ? ಖಾತೆ ಸಂಖ್ಯೆಯನ್ನು ಟೈಪ್ ಮಾಡಿ",ta:"பாஸ்புக்கைப் படிக்க முடியவில்லையா? கணக்கு எண்ணை தட்டச்சு செய்யவும்",bn:"পাসবই পড়া যায়নি? অ্যাকাউন্ট নম্বর টাইপ করুন"})[lang];
    get('withdrawalBack').textContent=get('otherFormBack').textContent;
  }
  function updateScreen(event) {
    const id=event?.detail?.id||activeScreen;
    const home=id==='permissionScreen';get('workspace').classList.toggle('is-home',home);get('journey').hidden=home;
    get('journeySteps').querySelectorAll('li').forEach((li,i)=>{li.classList.toggle('active',i===stage[id]);li.classList.toggle('done',i<stage[id]);if(i===stage[id])li.setAttribute('aria-current','step');else li.removeAttribute('aria-current')});
    updateLocale();
    const heading=get(id)?.querySelector('h1');if(heading&&!home){heading.tabIndex=-1;requestAnimationFrame(()=>heading.focus({preventScroll:true}))}
  }
  window.addEventListener('sahaj:screen',updateScreen);
  window.addEventListener('sahaj:locale',updateLocale);
  // Permission changes can arrive asynchronously after initial render.
  const originalPermission=applyMicPermissionState;
  applyMicPermissionState=state=>{originalPermission(state);welcome()};
  document.querySelectorAll('[data-lang]').forEach(button=>button.dataset.caption=({en:'English',hi:'Hindi',pa:'Punjabi',kn:'Kannada',ta:'Tamil',bn:'Bengali'})[button.dataset.lang]);
  get('largeText').addEventListener('click',()=>{const enabled=document.body.classList.toggle('large-text');get('largeText').setAttribute('aria-pressed',String(enabled))});
  get('aboutDemo').onclick=async()=>{
    get('aboutDialog').showModal();get('environmentStatus').textContent='Checking local services…';
    const evidence=window.sahajVoiceEvidence||{};
    get('voiceEvidence').textContent=`Last speech responses this session — recognition: ${evidence.stt||'not yet received'}; synthesis: ${evidence.tts||'not yet received'}.`;
    try{const response=await fetch('/api/health',{signal:AbortSignal.timeout(5000)});if(!response.ok)throw Error();const h=await response.json();get('environmentStatus').textContent=`Server: ${h.status==='ok'?'available':'unavailable'} · OCR: ${h.ocr_engine_available?'configured':'needs setup'} · Speech: ${h.speech||'not configured'}.`}
    catch{get('environmentStatus').textContent='Could not reach the server. Check that START_KIOSK.bat is still running.'}
  };
  get('closeAbout').onclick=()=>get('aboutDialog').close();
  get('restartJourney').onclick=()=>get('restartDialog').showModal();
  get('keepWorking').onclick=()=>get('restartDialog').close();
  get('confirmRestart').onclick=()=>{get('restartDialog').close();endSession()};
  get('manualAccountEntry').onclick=()=>{
    get('confirmedAccount').value='';get('accountLookupStatus').textContent='';
    get('matchedCustomer').hidden=true;get('confirmProfileWrap').hidden=true;get('continueToForms').hidden=true;get('confirmProfile').checked=false;
    passbook={name:'',account_id:'',branch:'',phone:'',profile:null};
    const preview=get('confirmPassbookPreview');preview.hidden=!imageFile;if(imageFile)preview.src=get('preview').src;
    show('accountConfirmScreen');get('confirmedAccount').focus();
  };
  document.querySelectorAll('[data-sample]').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('.sample-card').forEach(card=>card.classList.toggle('selected',card.contains(button)));
    get('extract').hidden=true;
  }));
  document.querySelectorAll('[data-amount]').forEach(button=>button.onclick=()=>{get('amount').value=button.dataset.amount;get('amount').dispatchEvent(new Event('input',{bubbles:true}));get('amount').focus()});
  get('confirmedAccount').addEventListener('keydown',event=>{if(event.key==='Enter')get('lookupAccount').click()});
  get('withdrawalBack').onclick=()=>{readyPayload=null;get('withdrawalPdfPreview').hidden=true;get('signatureCue').hidden=true;get('download').hidden=true;get('confirm').checked=false;show('formsScreen')};
  // Invalidate previews immediately after an edit: an old PDF must not appear current.
  ['amount','name','account','phone','branch','confirm','withdrawalType'].forEach(id=>get(id).addEventListener('input',()=>{
    get('withdrawalPdfPreview').hidden=true;get('signatureCue').hidden=true;get('review').hidden=true;
    if(id==='amount'){get('confirm').checked=false;get('profileStatus').textContent=''}
  }));
  // Full browser-session cleanup, including object URLs and cached draft payloads.
  const originalEnd=endSession;
  endSession=()=>{
    passbookReadGeneration++;passbookReading=false;hideLoading();window.sahajVoiceEvidence={};selectedFormType=null;
    readyPayload=null;get('confirmedAccount').value='';get('accountLookupStatus').textContent='';get('matchedCustomer').replaceChildren();
    get('confirmProfile').checked=false;get('confirmProfileWrap').hidden=true;get('continueToForms').hidden=true;
    get('selectedFormFields').replaceChildren();get('samplePdfPreview').hidden=true;get('withdrawalPdfPreview').hidden=true;
    get('sampleSignatureCue').hidden=true;get('signatureCue').hidden=true;
    get('profileStatus').textContent='';get('ocrStatus').textContent='';get('extract').hidden=true;
    ['name','account','phone','branch'].forEach(id=>get(id).value='');
    document.querySelectorAll('iframe[data-object-url]').forEach(frame=>{URL.revokeObjectURL(frame.dataset.objectUrl);delete frame.dataset.objectUrl;frame.removeAttribute('src')});
    ['preview','formPassbookPreview','confirmPassbookPreview'].forEach(id=>{const img=get(id);if(img.src.startsWith('blob:'))URL.revokeObjectURL(img.src);img.removeAttribute('src');img.hidden=true});
    document.querySelectorAll('.sample-card.selected').forEach(card=>card.classList.remove('selected'));
    originalEnd();updateScreen();
  };
  // The original listener captured endSession before this module loaded.
  get('counterDone').onclick=()=>endSession();
  // Surface network errors and prevent duplicate preview/download requests.
  [['prepare','profileStatus'],['download','profileStatus'],['previewSampleForm','otherFormStatus'],['downloadSampleForm','otherFormStatus']].forEach(([id,status])=>{
    const button=get(id),action=button.onclick;
    button.onclick=async event=>{
      if(button.dataset.pending==='true')return;
      const caption=button.textContent;button.dataset.pending='true';button.disabled=true;button.setAttribute('aria-busy','true');
      button.textContent=({en:'Please wait…',hi:'कृपया प्रतीक्षा करें…',pa:'ਕਿਰਪਾ ਕਰਕੇ ਉਡੀਕੋ…',kn:"ದಯವಿಟ್ಟು ಕಾಯಿರಿ…",ta:"தயவுசெய்து காத்திருக்கவும்…",bn:"অনুগ্রহ করে অপেক্ষা করুন…"})[language]||'Please wait…';
      // The original deposit download handler requires its button to be enabled.
      if(id==='downloadSampleForm')button.disabled=false;
      try{await action(event)}catch(error){console.warn('[form action]',error);get(status).textContent=({en:'Could not reach the server. Please try again.',hi:'सर्वर से संपर्क नहीं हो सका। फिर कोशिश करें।',pa:'ਸਰਵਰ ਨਾਲ ਸੰਪਰਕ ਨਹੀਂ ਹੋ ਸਕਿਆ। ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',kn:"ಸರ್ವರ್ ಅನ್ನು ತಲುಪಲಾಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",ta:"சேவையகத்தை அடைய முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",bn:"সার্ভারে পৌঁছানো যায়নি। আবার চেষ্টা করুন।"})[language]||'Please try again.'}
      finally{button.dataset.pending='false';button.removeAttribute('aria-busy');button.textContent=caption;button.disabled=false}
    };
  });
  updateScreen();
})();
