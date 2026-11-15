/* Home screen language.
 *
 * Default (nobody has chosen a screen language): the original Hindi + English mix.
 * After a manual choice in the 🌐 panel (or a spoken "change the screen to ..." command):
 * the whole home screen, header and footer appear in that ONE language only.
 *
 * This is the single owner of the home-screen text. Older scripts (kiosk-v8, kiosk-v2,
 * kiosk-v19, kiosk-v21, experience) call SahajHome.apply() instead of writing their own
 * hard-coded strings, so nothing overwrites the chosen language any more.
 */
(()=>{'use strict';
const $=id=>document.getElementById(id);

/* Strings for every screen language. `hi` and `en` are also used to build the default mix. */
const T={
 en:{title:'Bank forms,<br>filled by <em>voice.</em>',
  text:'Speak in your language or choose a form. Print it, then take it to the bank counter.',
  voice:'Start with voice',touch:'Use touch or keyboard →',
  cards:['Withdrawal form','Deposit form','New account form'],
  mic:'Microphone permission is requested only when you choose voice.',
  caption:'BANK FORM ASSISTANT',about:'About Sahaj',large:'Use larger text',
  screen:'Screen',voiceWord:'Voice',
  note:'Printed bank forms use the original English template. Screen and voice languages can differ.',done:'✓ Done',
  footer:'Synthetic demo only. Never enter PINs, passwords, OTPs, Aadhaar numbers, or real customer data.',
  sim:' · SIMULATED — NOT UIDAI VERIFIED'},
 hi:{title:'बैंक फ़ॉर्म,<br><em>आवाज़</em> से भरें।',
  text:'अपनी भाषा में बोलें या फ़ॉर्म चुनें। उसे प्रिंट करें और बैंक काउंटर पर ले जाएँ।',
  voice:'बोलकर शुरू करें',touch:'टच या कीबोर्ड से आगे बढ़ें →',
  cards:['निकासी फ़ॉर्म','जमा फ़ॉर्म','नया खाता फ़ॉर्म'],
  mic:'माइक्रोफ़ोन की अनुमति केवल तभी माँगी जाती है जब आप आवाज़ चुनते हैं।',
  caption:'बैंक फ़ॉर्म सहायक',about:'सहज के बारे में',large:'बड़े अक्षर इस्तेमाल करें',
  screen:'स्क्रीन',voiceWord:'आवाज़',
  note:'छपे हुए बैंक फ़ॉर्म मूल अंग्रेज़ी टेम्पलेट में ही रहते हैं। स्क्रीन और आवाज़ की भाषा अलग हो सकती है।',done:'✓ हो गया',
  footer:'केवल काल्पनिक डेमो। कभी PIN, पासवर्ड, OTP, आधार नंबर या असली ग्राहक डेटा न डालें।',
  sim:' · सिम्युलेटेड — UIDAI द्वारा सत्यापित नहीं'},
 pa:{title:'ਬੈਂਕ ਫਾਰਮ,<br><em>ਆਵਾਜ਼</em> ਨਾਲ ਭਰੋ।',
  text:'ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ ਬੋਲੋ ਜਾਂ ਫਾਰਮ ਚੁਣੋ। ਇਸਨੂੰ ਪ੍ਰਿੰਟ ਕਰੋ ਅਤੇ ਬੈਂਕ ਕਾਊਂਟਰ ਤੇ ਲੈ ਜਾਓ।',
  voice:'ਬੋਲ ਕੇ ਸ਼ੁਰੂ ਕਰੋ',touch:'ਛੂਹ ਜਾਂ ਕੀਬੋਰਡ ਨਾਲ ਅੱਗੇ ਵਧੋ →',
  cards:['ਪੈਸੇ ਕਢਵਾਉਣ ਦਾ ਫਾਰਮ','ਪੈਸੇ ਜਮ੍ਹਾਂ ਕਰਨ ਦਾ ਫਾਰਮ','ਨਵੇਂ ਖਾਤੇ ਦਾ ਫਾਰਮ'],
  mic:'ਮਾਈਕ੍ਰੋਫ਼ੋਨ ਦੀ ਇਜਾਜ਼ਤ ਸਿਰਫ਼ ਉਦੋਂ ਮੰਗੀ ਜਾਂਦੀ ਹੈ ਜਦੋਂ ਤੁਸੀਂ ਆਵਾਜ਼ ਚੁਣਦੇ ਹੋ।',
  caption:'ਬੈਂਕ ਫਾਰਮ ਸਹਾਇਕ',about:'ਸਹਜ ਬਾਰੇ',large:'ਵੱਡੇ ਅੱਖਰ ਵਰਤੋ',
  screen:'ਸਕ੍ਰੀਨ',voiceWord:'ਆਵਾਜ਼',
  note:'ਛਪੇ ਹੋਏ ਬੈਂਕ ਫਾਰਮ ਅਸਲ ਅੰਗਰੇਜ਼ੀ ਟੈਮਪਲੇਟ ਵਿੱਚ ਹੀ ਰਹਿੰਦੇ ਹਨ। ਸਕ੍ਰੀਨ ਅਤੇ ਆਵਾਜ਼ ਦੀ ਭਾਸ਼ਾ ਵੱਖਰੀ ਹੋ ਸਕਦੀ ਹੈ।',done:'✓ ਹੋ ਗਿਆ',
  footer:'ਸਿਰਫ਼ ਕਾਲਪਨਿਕ ਡੈਮੋ। ਕਦੇ ਵੀ PIN, ਪਾਸਵਰਡ, OTP, ਆਧਾਰ ਨੰਬਰ ਜਾਂ ਅਸਲੀ ਗਾਹਕ ਡੇਟਾ ਨਾ ਪਾਓ।',
  sim:' · ਨਕਲੀ — UIDAI ਵੱਲੋਂ ਤਸਦੀਕਸ਼ੁਦਾ ਨਹੀਂ'},
 bn:{title:'ব্যাংকের ফর্ম,<br><em>কথা বলেই</em> পূরণ করুন।',
  text:'আপনার ভাষায় বলুন বা একটি ফর্ম বেছে নিন। প্রিন্ট করে ব্যাংকের কাউন্টারে নিয়ে যান।',
  voice:'কথা বলে শুরু করুন',touch:'স্পর্শ বা কিবোর্ড ব্যবহার করুন →',
  cards:['টাকা তোলার ফর্ম','টাকা জমার ফর্ম','নতুন অ্যাকাউন্টের ফর্ম'],
  mic:'আপনি ভয়েস বেছে নিলেই কেবল মাইক্রোফোনের অনুমতি চাওয়া হয়।',
  caption:'ব্যাংক ফর্ম সহায়ক',about:'সহজ সম্পর্কে',large:'বড় অক্ষর ব্যবহার করুন',
  screen:'স্ক্রিন',voiceWord:'ভয়েস',
  note:'ছাপা ব্যাংক ফর্ম মূল ইংরেজি টেমপ্লেটেই থাকে। স্ক্রিন ও ভয়েসের ভাষা আলাদা হতে পারে।',done:'✓ হয়ে গেছে',
  footer:'শুধুমাত্র কাল্পনিক ডেমো। কখনও PIN, পাসওয়ার্ড, OTP, আধার নম্বর বা আসল গ্রাহকের তথ্য দেবেন না।',
  sim:' · সিমুলেটেড — UIDAI যাচাইকৃত নয়'},
 ta:{title:'வங்கிப் படிவங்கள்,<br><em>குரலால்</em> நிரப்புங்கள்.',
  text:'உங்கள் மொழியில் பேசுங்கள் அல்லது ஒரு படிவத்தைத் தேர்ந்தெடுங்கள். அதை அச்சிட்டு வங்கிக் கவுண்டருக்கு எடுத்துச் செல்லுங்கள்.',
  voice:'பேசித் தொடங்குங்கள்',touch:'தொடுதல் அல்லது விசைப்பலகையைப் பயன்படுத்துங்கள் →',
  cards:['பணம் எடுக்கும் படிவம்','பணம் செலுத்தும் படிவம்','புதிய கணக்குப் படிவம்'],
  mic:'நீங்கள் குரலைத் தேர்ந்தெடுக்கும்போது மட்டுமே மைக்ரோஃபோன் அனுமதி கேட்கப்படும்.',
  caption:'வங்கிப் படிவ உதவியாளர்',about:'சஹஜ் பற்றி',large:'பெரிய எழுத்துகளைப் பயன்படுத்துங்கள்',
  screen:'திரை',voiceWord:'குரல்',
  note:'அச்சிடப்பட்ட வங்கிப் படிவங்கள் அசல் ஆங்கில வடிவிலேயே இருக்கும். திரை மற்றும் குரல் மொழிகள் வேறுபடலாம்.',done:'✓ முடிந்தது',
  footer:'கற்பனை டெமோ மட்டுமே. PIN, கடவுச்சொல், OTP, ஆதார் எண் அல்லது உண்மையான வாடிக்கையாளர் தரவை ஒருபோதும் உள்ளிடாதீர்கள்.',
  sim:' · உருவகப்படுத்தப்பட்டது — UIDAI சரிபார்ப்பு அல்ல'},
 kn:{title:'ಬ್ಯಾಂಕ್ ಫಾರ್ಮ್‌ಗಳು,<br><em>ಧ್ವನಿಯಿಂದ</em> ಭರ್ತಿ.',
  text:'ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಮಾತನಾಡಿ ಅಥವಾ ಫಾರ್ಮ್ ಆಯ್ಕೆಮಾಡಿ. ಅದನ್ನು ಮುದ್ರಿಸಿ, ಬ್ಯಾಂಕ್ ಕೌಂಟರ್‌ಗೆ ತೆಗೆದುಕೊಂಡು ಹೋಗಿ.',
  voice:'ಮಾತನಾಡಿ ಪ್ರಾರಂಭಿಸಿ',touch:'ಸ್ಪರ್ಶ ಅಥವಾ ಕೀಬೋರ್ಡ್ ಬಳಸಿ →',
  cards:['ಹಣ ಹಿಂಪಡೆಯುವ ಫಾರ್ಮ್','ಹಣ ಜಮಾ ಫಾರ್ಮ್','ಹೊಸ ಖಾತೆಯ ಫಾರ್ಮ್'],
  mic:'ನೀವು ಧ್ವನಿಯನ್ನು ಆಯ್ಕೆ ಮಾಡಿದಾಗ ಮಾತ್ರ ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿ ಕೇಳಲಾಗುತ್ತದೆ.',
  caption:'ಬ್ಯಾಂಕ್ ಫಾರ್ಮ್ ಸಹಾಯಕ',about:'ಸಹಜ್ ಬಗ್ಗೆ',large:'ದೊಡ್ಡ ಅಕ್ಷರಗಳನ್ನು ಬಳಸಿ',
  screen:'ಪರದೆ',voiceWord:'ಧ್ವನಿ',
  note:'ಮುದ್ರಿತ ಬ್ಯಾಂಕ್ ಫಾರ್ಮ್‌ಗಳು ಮೂಲ ಇಂಗ್ಲಿಷ್ ಟೆಂಪ್ಲೇಟ್‌ನಲ್ಲೇ ಇರುತ್ತವೆ. ಪರದೆ ಮತ್ತು ಧ್ವನಿ ಭಾಷೆಗಳು ಬೇರೆಯಾಗಿರಬಹುದು.',done:'✓ ಮುಗಿಯಿತು',
  footer:'ಕೃತಕ ಪ್ರಾತ್ಯಕ್ಷಿಕೆ ಮಾತ್ರ. PIN, ಪಾಸ್‌ವರ್ಡ್, OTP, ಆಧಾರ್ ಸಂಖ್ಯೆ ಅಥವಾ ನಿಜವಾದ ಗ್ರಾಹಕ ಮಾಹಿತಿಯನ್ನು ಎಂದಿಗೂ ನಮೂದಿಸಬೇಡಿ.',
  sim:' · ಅನುಕರಣೆ — UIDAI ಪರಿಶೀಲಿಸಿಲ್ಲ'}
};

/* The original default screen: Hindi + English together. */
const MIX={
 title:'Bank forms,<br>filled by <em>voice.</em>',
 text:'Speak in your language or choose a form. Print it, then take it to the bank counter.',
 voice:'Start with voice · बोलकर शुरू करें',touch:'Use touch or keyboard →',
 cards:[['Withdrawal form','निकासी फ़ॉर्म'],['Deposit form','जमा फ़ॉर्म'],['New account form','नया खाता फ़ॉर्म']],
 mic:'Microphone permission is requested only when you choose voice.',
 caption:'BANK FORM ASSISTANT',about:'About Sahaj',large:'Use larger text',
 screen:'Screen · स्क्रीन',voiceWord:'Voice · आवाज़',
 note:T.en.note,done:T.en.done,footer:T.en.footer,sim:T.en.sim,
 toggle:'हिन्दी / English'
};
const NAMES={hi:'हिन्दी',en:'English',pa:'ਪੰਜਾਬੀ',bn:'বাংলা',ta:'தமிழ்',kn:'ಕನ್ನಡ'};
const FORMS=['withdrawal','deposit','opening'];

/* A screen language counts as chosen once the person picked it in the panel, or asked for it by voice. */
function explicit(){
 if(window.sahajExplicitScreenChoice===true||window.sahajDetectedScreenLanguage===true)return true;
 try{return typeof displayLanguageLocked!=='undefined'&&displayLanguageLocked===true}catch{return false}
}
function currentLang(){
 let l='en';try{l=language}catch{}
 return T[l]?l:'en';
}
function setText(el,v){if(el&&el.textContent!==v)el.textContent=v}
function setHTML(el,v){if(el&&el.innerHTML!==v)el.innerHTML=v}

function apply(){
 const one=explicit();
 const code=currentLang();
 const t=one?T[code]:MIX;

 /* Home screen body */
 setHTML($('permissionTitle'),t.title);
 setText($('permissionText'),t.text);
 setText($('voiceContinue'),t.voice);
 setText($('manualContinue'),t.touch);
 const mic=document.querySelector('#permissionScreen .mic-note');setText(mic,t.mic);

 /* Supported-languages strip: only part of the default mix. */
 const strip=document.querySelector('#permissionScreen .welcome-language');
 if(strip)strip.style.display=one?'none':'';

 /* Service cards: English + Hindi caption by default, one language when chosen. */
 document.querySelectorAll('#permissionScreen [data-home-form]').forEach(card=>{
  const i=FORMS.indexOf(card.dataset.homeForm);if(i<0)return;
  const strong=card.querySelector('strong'),small=card.querySelector('small');
  if(one){setText(strong,t.cards[i]);if(small){small.hidden=true;small.style.display='none'}}
  else{setText(strong,t.cards[i][0]);if(small){setText(small,t.cards[i][1]);small.hidden=false;small.style.display=''}}
  small&&small.setAttribute('lang','hi');
  card.setAttribute('lang',one?code:'en');
 });

 /* Header */
 setText(document.querySelector('.app-header .brand-caption'),t.caption);
 setText($('aboutDemo'),t.about);
 const large=$('largeText');if(large)large.setAttribute('aria-label',t.large);

 /* Language panel */
 setText(document.querySelector('label[for="kioskDisplayLanguage"]'),t.screen);
 setText(document.querySelector('label[for="kioskSpeechLanguage"]'),t.voiceWord);
 setText($('kioskDocumentNote'),t.note);
 setText($('kioskLanguageClose'),t.done);
 const ui=$('kioskDisplayLanguage');
 if(ui){const want=one?code:'auto';if(ui.value!==want)ui.value=want}
 const cur=$('kioskCurrentLanguage');
 if(cur){
  let spk='en';try{spk=speakingLanguage}catch{}
  const speechPicked=(()=>{try{return speechLanguageLocked===true}catch{return false}})();
  const label=one?(speechPicked&&spk!==code?`${T[code].screen}: ${NAMES[code]} · ${T[code].voiceWord}: ${NAMES[spk]||spk}`:NAMES[code])
   :speechPicked?`${MIX.toggle} · ${MIX.voiceWord.split(' ')[0]}: ${NAMES[spk]||spk}`:MIX.toggle;
  setText(cur,label);
 }

 /* Footer: default mix keeps the existing behaviour; a chosen language shows only that language. */
 if(one)setText($('footerText'),t.footer+t.sim);

 /* <html lang> follows the visible language so screen readers and fonts pick the right script. */
 document.documentElement.lang=one?code:'en';
}

function schedule(){apply();queueMicrotask(apply);setTimeout(apply,0)}
['sahaj:locale','sahaj:screen','sahaj:language-preference'].forEach(e=>window.addEventListener(e,schedule));

/* "Auto" option = back to the Hindi + English default, handled here so the panel can return to it. */
const ui=$('kioskDisplayLanguage');
if(ui){
 if(!ui.querySelector('option[value="auto"]')){
  const o=document.createElement('option');o.value='auto';o.textContent='हिन्दी + English';ui.insertBefore(o,ui.firstChild);
 }
 ui.addEventListener('change',()=>{
  if(ui.value!=='auto')return;
  window.sahajExplicitScreenChoice=false;
  try{displayLanguageLocked=false;window.sahajDetectedScreenLanguage=false;language='en';localize()}catch(e){console.warn('auto language',e)}
  window.dispatchEvent(new Event('sahaj:language-preference'));
  schedule();
 },true);
}

window.SahajHome={apply,isExplicit:explicit,lang:()=>explicit()?currentLang():'en'};
apply();
})();
