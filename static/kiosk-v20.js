// Preserve the multilingual detector from app.js while keeping the existing review guard.
const _multilingualFollowSpokenLanguage=followSpokenLanguage;
followSpokenLanguage=function(text,providerLanguage=''){
 if(activeScreen==='openingScreen' && ['review','result'].includes(window.SahajOpeningFlow?.phase))return;
 return _multilingualFollowSpokenLanguage(text,providerLanguage);
};
