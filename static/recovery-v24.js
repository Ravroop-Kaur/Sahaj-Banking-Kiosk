(()=>{
const dialog=document.createElement('dialog');dialog.id='voiceRecovery';dialog.innerHTML='<h2 id="recoveryTitle"></h2><p id="recoveryText"></p><div class="row"><button id="recoverManual" class="primary">Choose manually</button><button id="recoverEnd" class="secondary">End session</button></div>';document.body.appendChild(dialog);
const style=document.createElement('style');style.textContent='.voice-connecting .shell{filter:blur(2px)}.voice-connecting #voiceWaitHint{top:48%;bottom:auto;background:transparent;border:0;padding:0}.voice-connecting #voiceWaitHint>span:last-child{display:none}.voice-connecting .voice-wait-spinner{width:24px;height:24px;border-color:#d8ddd980;border-top-color:#69766d}#voiceRecovery{max-width:530px}';document.head.appendChild(style);
let timer=null,resume=false;
function clear(){clearTimeout(timer);timer=null;dialog.close()}
function finish(){clear();resume=false;endSession()}
window.sahajRecovery={open(){clearSilenceReask();cancelIdleEnd();speechRestartAllowed=false;geminiMicPaused=true;stopServerRecognition();try{speechRecognition?.abort()}catch{}const messages={
 en:['I could not understand','Choose this step manually or end the session. No choice within 10 seconds will end the session.','Choose manually','End session','Please choose manually or end the session.'],
 hi:['आवाज़ समझ नहीं आई','इस चरण में बटन चुनें या सत्र समाप्त करें। 10 सेकंड तक कोई विकल्प न चुनने पर सत्र समाप्त होगा।','बटन से चुनें','सत्र समाप्त करें','कृपया बटन से चुनें या सत्र समाप्त करें।'],
 pa:['ਮਾਫ਼ ਕਰਨਾ, ਸਮਝ ਨਹੀਂ ਆਇਆ','ਇਹ ਕਦਮ ਬਟਨ ਨਾਲ ਚੁਣੋ ਜਾਂ ਸੈਸ਼ਨ ਖਤਮ ਕਰੋ। 10 ਸਕਿੰਟਾਂ ਵਿੱਚ ਚੋਣ ਨਾ ਕਰਨ ਤੇ ਸੈਸ਼ਨ ਖਤਮ ਹੋ ਜਾਵੇਗਾ।','ਬਟਨ ਨਾਲ ਚੁਣੋ','ਸੈਸ਼ਨ ਖਤਮ ਕਰੋ','ਕਿਰਪਾ ਕਰਕੇ ਬਟਨ ਨਾਲ ਚੁਣੋ ਜਾਂ ਸੈਸ਼ਨ ਖਤਮ ਕਰੋ।'],
 bn:['দুঃখিত, বুঝতে পারিনি','এই ধাপটি বোতাম দিয়ে বেছে নিন অথবা সেশন শেষ করুন। ১০ সেকেন্ডের মধ্যে কিছু না বাছলে সেশন শেষ হবে।','বোতাম দিয়ে বেছে নিন','সেশন শেষ করুন','অনুগ্রহ করে বোতাম দিয়ে বেছে নিন অথবা সেশন শেষ করুন।'],
 ta:['மன்னிக்கவும், புரியவில்லை','இந்தப் படியை பொத்தான் மூலம் தேர்ந்தெடுக்கவும் அல்லது அமர்வை முடிக்கவும். பத்து விநாடிகளில் தேர்வு செய்யாவிட்டால் அமர்வு முடியும்.','பொத்தான் மூலம் தேர்வு','அமர்வை முடி','பொத்தானைத் தேர்ந்தெடுக்கவும் அல்லது அமர்வை முடிக்கவும்.'],
 kn:['ಕ್ಷಮಿಸಿ, ಅರ್ಥವಾಗಲಿಲ್ಲ','ಈ ಹಂತವನ್ನು ಗುಂಡಿಯ ಮೂಲಕ ಆಯ್ಕೆಮಾಡಿ ಅಥವಾ ಅಧಿವೇಶನ ಮುಗಿಸಿ. ಹತ್ತು ಸೆಕೆಂಡುಗಳಲ್ಲಿ ಆಯ್ಕೆ ಮಾಡದಿದ್ದರೆ ಅಧಿವೇಶನ ಮುಗಿಯುತ್ತದೆ.','ಗುಂಡಿ ಆಯ್ಕೆಮಾಡಿ','ಅಧಿವೇಶನ ಮುಗಿಸಿ','ಗುಂಡಿ ಆಯ್ಕೆಮಾಡಿ ಅಥವಾ ಅಧಿವೇಶನ ಮುಗಿಸಿ.']};
 const screenText=messages[language]||messages.en,voiceText=messages[speakingLanguage]||messages.en;
 document.getElementById('recoveryTitle').textContent=screenText[0];document.getElementById('recoveryText').textContent=screenText[1];document.getElementById('recoverManual').textContent=screenText[2];document.getElementById('recoverEnd').textContent=screenText[3];dialog.showModal();say(voiceText[4],speakingLanguage);timer=setTimeout(finish,10000)}};
document.getElementById('recoverManual').onclick=()=>{clear();resume=true;mode='voice';};document.getElementById('recoverEnd').onclick=finish;
dialog.addEventListener('cancel',event=>{event.preventDefault();finish()});
window.addEventListener('sahaj:step',()=>{if(resume){resume=false;geminiMicPaused=false;mode='voice';speechRestartAllowed=true;}});
window.addEventListener('sahaj:screen',event=>{if(event.detail?.id==='permissionScreen'){clear();resume=false;return;}if(resume){resume=false;geminiMicPaused=false;mode='voice';speechRestartAllowed=true;}});
})();
