/* V7: independent visible/speech preferences, never change PDF template automatically. */
(()=>{'use strict';
 const get=id=>document.getElementById(id);
 const title={hi:'हिन्दी',en:'English',pa:'ਪੰਜਾਬੀ',bn:'বাংলা',ta:'தமிழ்',kn:'ಕನ್ನಡ'};
 const ui=get('kioskDisplayLanguage'),voice=get('kioskSpeechLanguage'),panel=get('kioskLanguagePanel'),toggle=get('kioskLanguageToggle');
 function refresh(){
   if(typeof language==='undefined')return;
   voice.value=speakingLanguage;
   if(window.SahajHome)window.SahajHome.apply();
   else{ui.value=language;get('kioskCurrentLanguage').textContent='Screen: '+(title[language]||language)+' · Voice: '+(title[speakingLanguage]||speakingLanguage);}
   document.querySelectorAll('[data-kiosk-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.kioskLang===language)));
 }
 toggle.addEventListener('click',()=>{panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));refresh()});
 get('kioskLanguageClose').addEventListener('click',()=>{panel.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.focus()});
 ui.addEventListener('change',()=>{
   if(ui.value==='auto')return;
   window.sahajExplicitScreenChoice=true;language=ui.value;displayLanguageLocked=true;languageCommandMode='display';
   try{localize()}catch(e){console.warn('display language',e)}
   window.dispatchEvent(new Event('sahaj:language-preference'));refresh();
 });
 voice.addEventListener('change',()=>{
   speakingLanguage=voice.value;speechLanguageLocked=true;languageCommandMode='speech';
   window.dispatchEvent(new Event('sahaj:language-preference'));refresh();
 });
 window.addEventListener('sahaj:locale',refresh);
 window.addEventListener('sahaj:screen',refresh);
 window.addEventListener('sahaj:language-preference',refresh);
 window.SahajLanguagePreferences={refresh};
 const voiceServices=get('kioskVoiceServices');
 if(voiceServices && !voiceServices.querySelector("[data-v8-service]")){
   document.querySelectorAll('#permissionScreen [data-kiosk-service]').forEach(source=>{
     const button=source.cloneNode(true);button.removeAttribute('data-kiosk-service');
     button.addEventListener('click',()=>source.click());voiceServices.appendChild(button);
   });
   window.addEventListener('sahaj:locale',()=>{
     [...voiceServices.children].forEach((b,i)=>{const orig=document.querySelectorAll('#permissionScreen [data-kiosk-service]')[i];if(orig){b.querySelector('strong').textContent=orig.querySelector('strong').textContent;b.querySelector('small').textContent=orig.querySelector('small').textContent;}});
   });
 }
 refresh();
})();
