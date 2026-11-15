/* Small, non-blocking speech loading hint. */
(()=>{
const hint=document.createElement('div');hint.id='voiceWaitHint';hint.hidden=true;hint.setAttribute('role','status');hint.setAttribute('aria-live','polite');hint.innerHTML='<span class="voice-wait-spinner" aria-hidden="true"></span><span>Loading voice…</span>';document.body.appendChild(hint);
const style=document.createElement('style');style.textContent='#voiceWaitHint{position:fixed;bottom:36px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:9px;padding:8px 13px;background:rgba(250,251,249,.9);border:1px solid #dbe0dc;border-radius:18px;color:#68716c;font:12px system-ui,sans-serif;z-index:11000;pointer-events:none}#voiceWaitHint[hidden]{display:none}.voice-wait-spinner{width:14px;height:14px;border:2px solid #d8ddd9;border-top-color:#69766d;border-radius:50%;animation:voiceWaitSpin .85s linear infinite}@keyframes voiceWaitSpin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){.voice-wait-spinner{animation:none}}';document.head.appendChild(style);
let request=0,timer;
const previous=gnaniSpeak;
const hide=()=>{clearTimeout(timer);hint.hidden=true;document.body.classList.remove('voice-connecting')};
gnaniSpeak=async(...args)=>{
 const current=++request;hide();
 timer=setTimeout(()=>{
  if(current!==request||gnaniAudio||document.body.classList.contains('is-processing')||!document.getElementById('loadingOverlay')?.hidden)return;
  hint.hidden=false;document.body.classList.add('voice-connecting');
 },600);
 try{return await previous(...args)}finally{if(current===request)hide()}
};
window.addEventListener('sahaj:voice-ready',hide);
window.addEventListener('sahaj:screen',hide);
document.addEventListener('click',event=>{if(event.target.closest('button,a'))hide()},true);
})();
