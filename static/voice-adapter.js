(()=>{
const el=id=>document.getElementById(id);
const prompts={unsupported:'That service is not available at this kiosk. Please contact a bank staff member. I can help prepare withdrawal forms, deposit slips, and new-account applications.',unclear:'I did not catch the request. Please try again or tap a service on screen.',services:'I can help prepare withdrawal forms, deposit slips, and new account applications. Which would you like?',request:'How may I help you?',passbook:'Say the passbook number, from one to six.',amount:'How much? Please say the amount.', 'invalid-amount':'Please say a positive amount, up to two decimal places.', 'ocr-error':'I could not read that image. Say another passbook number.', 'no-match':'That account was not found. Please say another passbook number.',balance:'That exceeds the available balance. Please say a lower amount.', 'prepare-error':'The draft could not be prepared. Please say the amount again.', 'download-error':'Download failed. Say download to retry.',done:'Your draft is downloaded. Sign the printed copy and take it to Counter 1. Say finish to end.',fallback:'Touch controls are available if you need them.', 'speech-error':'Voice could not complete that step. Please try again or use the fallback controls.'};
window.voiceJourney=new SahajVoiceJourney({
 stage:s=>{flowStage=s;},
 prompt:async(k,v)=>{let text=(window.kioskCopy?.[speakingLanguage]?.[k] || prompts[k] || k);if(k==='account')text=`I read account number ${v.account.split('').join(' ')}. Is that correct? Say yes or no.`;if(k==='profile')text=`The fictional account belongs to ${v.name}, ${v.branch}. Is this correct? Say yes or no.`;if(k==='confirm-amount')text=amountConfirmation(v.amount,speakingLanguage);if(k==='download')text=`Your ${v.service} draft for ${v.amount} rupees is ready. Say download to save it, or change amount.`;showVoiceStatus(text);speechRestartAllowed=false;stopServerRecognition();try{speechRecognition?.abort()}catch{}
  if(k==='request'&&!customerHasSpoken&&speakingLanguage==='hi'){
    await say('नमस्ते! मैं आपकी कैसे मदद करूँ?','hi');
    await say('Hello! How may I help you?','en',()=>{speechRestartAllowed=true;startRecognition()});
  }else await say(text,speakingLanguage,()=>{speechRestartAllowed=true;startRecognition()});},
 transcript:t=>{customerHasSpoken=true;lastActivityAt=Date.now();clearSilenceReask();},language:parseLanguagePreferenceCommand,
 command:t=>/^(finish|end session|समाप्त|खत्म)$/i.test(t)?'end':/^(repeat|again|दोहराओ)$/i.test(t)?'repeat':/download|डाउनलोड|ਡਾਊਨਲੋਡ|ڈاؤن لوڈ/i.test(t)?'download':/change amount|राशि बदल/i.test(t)?'change':/manual|touch controls/i.test(t)?'manual':'',
 yes:affirmative,no:negative,amount:spokenNumberValue,passbookNumber:passbookChoiceFromSpeech,
 intent:async t=>{const opening=/new account|open (?:an? )?account|account opening|नया खाता|खाता खोल|अकाउंट खोल|ਨਵਾਂ ਖਾਤਾ|ਖਾਤਾ ਖੋਲ੍ਹ|নতুন অ্যাকাউন্ট|অ্যাকাউন্ট খুল|புதிய கணக்கு|கணக்கு திற|ಹೊಸ ಖಾತೆ|ಖಾತೆ ತೆರೆಯ/i.test(t);const intent=opening?'opening':localIntent(t);return{intent,amount:spokenNumberValue(t)}},
 openAccount:()=>{show('openingScreen');const c=window.kioskCopy?.[speakingLanguage];say(c?.openingConsent||'I can help prepare a sample new account application. Please read the consent message on screen.',speakingLanguage);},
 passbooks:()=>show('uploadScreen'),
 readPassbook:async n=>{await document.querySelectorAll('[data-sample]')[n-1].onclick();return activeScreen==='accountConfirmScreen'?el('confirmedAccount').value:''},
 lookup:async account=>{el('confirmedAccount').value=account;await el('lookupAccount').onclick();return passbook.profile},
 confirmProfile:()=>{el('confirmProfile').checked=true;},
 amountScreen:()=>show('requestScreen'),showAmount:a=>{show('requestScreen');showAmountBox(a)},
 invalidate:()=>{readyPayload=null;el('download').hidden=true;el('withdrawalPdfPreview').hidden=true;resetSamplePreview()},
 prepare:async(service,amount)=>{currentIntent=service;detectedAmount=amount;if(service==='withdrawal'){showWithdrawal();el('amount').value=amount;el('confirm').checked=true;await el('prepare').onclick();if(!el('balancePrompt').hidden)return'balance';return !el('download').hidden?'ready':'error'}document.querySelector('[data-form="deposit"]').onclick();el('formField_amount').value=amount;await el('previewSampleForm').onclick();return !el('downloadSampleForm').disabled?'ready':'error'},
 download:async service=>{await el(service==='withdrawal'?'download':'downloadSampleForm').onclick();return activeScreen==='counterScreen'},
 fallback:()=>{el('fallbackActions').hidden=false;document.querySelector('#fallbackActions details')?.setAttribute('open','');el('voiceManual').hidden=false;el('requestManual').hidden=false},
 end:()=>endSession(),restart:()=>{endSession();mode='voice';show('voiceScreen')},error:console.warn
});
const previousEnd=endSession;endSession=()=>{window.voiceJourney.reset();previousEnd()};
})();
