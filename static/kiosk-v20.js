/* Match automatic Hindi/English detection to visible preferences. */
followSpokenLanguage=function(text){
 if(activeScreen==='openingScreen' && ['review','result'].includes(window.SahajOpeningFlow?.phase))return;
 const value=String(text||'');let detected='';
 if(/[\u0900-\u097f]/.test(value)||/\b(mujhe|paise|nikalna|jama|chahiye)\b/i.test(value))detected='hi';
 else if(/\b(withdraw|deposit|account|money|please|hello|want|need)\b/i.test(value))detected='en';
 if(!detected)return;
 if(!displayLanguageLocked)language=detected;
 if(!speechLanguageLocked)speakingLanguage=detected;
 localize();window.dispatchEvent(new Event('sahaj:language-preference'));
};
