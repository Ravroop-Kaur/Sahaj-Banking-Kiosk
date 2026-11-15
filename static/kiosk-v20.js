// A brief approval during review carries little evidence of a language change.
const _multilingualFollowSpokenLanguage=followSpokenLanguage;
followSpokenLanguage=function(text,providerLanguage=''){
 if(activeScreen==='openingScreen' && ['review','result'].includes(window.SahajOpeningFlow?.phase)){
   const answer=window.sahajConfirmation?.(text,'review');
   if(answer==='yes'||answer==='no')return;
 }
 return _multilingualFollowSpokenLanguage(text,providerLanguage);
};
