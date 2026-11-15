/* Shared cancellation, stable landing, and request feedback. */
(()=>{
let generation=0;const oldSay=say;
function cancel(keepRecording=false){window.sahajPromptPlaying=false;window.sahajOpeningGreeting=false;generation++;window.sahajSpeechGeneration=generation;speechRestartAllowed=false;cancelAllSpeechAndGeminiAudio();if(keepRecording!==true)stopServerRecognition();try{speechRecognition?.abort()}catch{}}
window.sahajCancelSpeech=cancel;
say=async(text,code,onend)=>{
 const token=++generation;
 window.sahajSpeechGeneration=token;
 window.sahajPromptPlaying=true;
 speechRestartAllowed=false;
 stopServerRecognition();
 try{speechRecognition?.abort()}catch{}
 return oldSay(text,code,()=>{
   if(token!==generation)return;
   window.sahajPromptPlaying=false;
   onend?.();
 });
};
document.addEventListener('click',event=>{if(event.target.closest('button,a,input[type="checkbox"]')&&!event.target.closest('#kioskLanguageControl'))cancel()},true);
window.addEventListener('sahaj:screen',()=>{cancel();queueMicrotask(home)});
function home(){if(window.SahajHome){window.SahajHome.apply();return}if(activeScreen!=='permissionScreen')return;const title=document.getElementById('permissionTitle');const wanted='Bank forms,<br>filled by <em>voice.</em>';if(title.innerHTML!==wanted)title.innerHTML=wanted;}
home();
const nativeFetch=window.fetch.bind(window);let pending=0;
const hint=document.createElement('div');hint.id='processingHint';hint.setAttribute('aria-label','Understanding your request');hint.setAttribute('role','status');hint.hidden=true;document.body.appendChild(hint);
window.fetch=async(input,options)=>{const url=typeof input==='string'?input:input.url;if(url.startsWith('/api/')&&!options?.signal)options={...options,signal:AbortSignal.timeout(30000)};const track=options?.sahajShowProgress!==false && /\/api\/(voice\/transcribe)/.test(url);if(track){pending++;hint.hidden=false;document.body.classList.add('is-processing')}try{return await nativeFetch(input,options)}finally{if(track&&!--pending){hint.hidden=true;document.body.classList.remove('is-processing')}}};
})();
