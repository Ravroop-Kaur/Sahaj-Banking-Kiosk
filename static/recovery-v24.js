(()=>{
const dialog=document.createElement('dialog');dialog.id='voiceRecovery';dialog.innerHTML='<h2 id="recoveryTitle"></h2><p id="recoveryText"></p><div class="row"><button id="recoverManual" class="primary">Choose manually</button><button id="recoverEnd" class="secondary">End session</button></div>';document.body.appendChild(dialog);
const style=document.createElement('style');style.textContent='.voice-connecting .shell{filter:blur(2px)}.voice-connecting #voiceWaitHint{top:48%;bottom:auto;background:transparent;border:0;padding:0}.voice-connecting #voiceWaitHint>span:last-child{display:none}.voice-connecting .voice-wait-spinner{width:24px;height:24px;border-color:#d8ddd980;border-top-color:#69766d}#voiceRecovery{max-width:530px}';document.head.appendChild(style);
let timer=null,resume=false;
function clear(){clearTimeout(timer);timer=null;dialog.close()}
function finish(){clear();resume=false;endSession()}
window.sahajRecovery={open(){clearSilenceReask();cancelIdleEnd();speechRestartAllowed=false;geminiMicPaused=true;stopServerRecognition();try{speechRecognition?.abort()}catch{}const hi=language==='hi';document.getElementById('recoveryTitle').textContent=hi?'आवाज़ समझ नहीं आई':'I could not understand';document.getElementById('recoveryText').textContent=hi?'इस चरण में बटन चुनें या सत्र समाप्त करें। 10 सेकंड तक कोई विकल्प न चुनने पर सत्र समाप्त होगा।':'Choose this step manually or end the session. No choice within 10 seconds will end the session.';document.getElementById('recoverManual').textContent=hi?'बटन से चुनें':'Choose manually';document.getElementById('recoverEnd').textContent=hi?'सत्र समाप्त करें':'End session';dialog.showModal();say(hi?'कृपया बटन से चुनें या सत्र समाप्त करें।':'Please choose manually or end the session.',speakingLanguage);timer=setTimeout(finish,10000)}};
document.getElementById('recoverManual').onclick=()=>{clear();resume=true;mode='voice';};document.getElementById('recoverEnd').onclick=finish;
dialog.addEventListener('cancel',event=>{event.preventDefault();finish()});
window.addEventListener('sahaj:step',()=>{if(resume){resume=false;geminiMicPaused=false;mode='voice';speechRestartAllowed=true;}});
window.addEventListener('sahaj:screen',event=>{if(event.detail?.id==='permissionScreen'){clear();resume=false;return;}if(resume){resume=false;geminiMicPaused=false;mode='voice';speechRestartAllowed=true;}});
})();
