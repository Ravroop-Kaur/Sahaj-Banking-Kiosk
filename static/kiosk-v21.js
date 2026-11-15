/* Discreet operator indicator: reports observed calls, never configuration as success. */
(()=>{
const badge=document.createElement('span');badge.id='voiceConnectionBadge';badge.textContent='Voice idle';badge.setAttribute('aria-label','Voice connection status');
document.querySelector('.app-header .brand').after(badge);
const style=document.createElement('style');style.textContent='#voiceConnectionBadge{font:11px system-ui,sans-serif;color:#69766f;white-space:nowrap;margin-right:auto;padding:4px 7px;border:1px solid #d9dfda;border-radius:12px}#voiceConnectionBadge[data-state="live"]{color:#28664c}#voiceConnectionBadge[data-state="failed"]{color:#8b5148}@media(max-width:540px){#voiceConnectionBadge{font-size:9px;padding:3px;margin-left:0}}';document.head.appendChild(style);
function state(value){badge.dataset.state=value;badge.textContent={idle:'Voice idle',live:'Gnani live',fallback:'Fallback',failed:'Live failed',connecting:'Connecting…'}[value]}
const priorFetch=window.fetch.bind(window);
window.fetch=async(input,options)=>{const path=typeof input==='string'?input:input.url;const voice=/\/api\/voice\/(speak|transcribe)(?:$|\?)/.test(path);if(!voice)return priorFetch(input,options);state('connecting');try{const response=await priorFetch(input,options);if(!response.ok){state('failed');return response;}if(path.includes('/transcribe')){const data=await response.clone().json();state(/gnani/i.test(data.engine||data.provider||'')?'live':'fallback');}else{state(/gnani/i.test(response.headers.get('X-Voice-Provider')||'')?'live':'fallback');}return response;}catch(error){state('failed');throw error;}};
const previousGnani=gnaniSpeak;gnaniSpeak=async(...args)=>{const ok=await previousGnani(...args);if(!ok)state('fallback');return ok;};
const previousEnd=endSession;endSession=(...args)=>{const wasHindi=language==='hi';
 const result=previousEnd(...args);state('idle');
 sessionStorage.setItem('sahajEndedNotice',wasHindi?'सत्र समाप्त हो गया है।':'Session ended.');
 location.replace(location.pathname);
 return result;};
function englishHome(){if(activeScreen!=='permissionScreen')return;const langs=document.querySelector('.welcome-language');const text='हिन्दी · English · ਪੰਜਾਬੀ · ಕನ್ನಡ · தமிழ் · বাংলা';if(langs.textContent!==text)langs.textContent=text;}
window.addEventListener('sahaj:screen',()=>queueMicrotask(englishHome));window.addEventListener('sahaj:locale',()=>queueMicrotask(englishHome));
new MutationObserver(englishHome).observe(document.querySelector('.welcome-language'),{childList:true,subtree:true});englishHome();
})();

const endedNotice=sessionStorage.getItem('sahajEndedNotice');
if(endedNotice){sessionStorage.removeItem('sahajEndedNotice');document.getElementById('permissionStatus').textContent=endedNotice;}
