// "I didn't catch that" silence re-ask. Loaded before app.js; shares its global scope.
// When the customer says nothing for a few seconds, or we could not make out what they said, do not just repeat the question:
// say "I didn't catch that" and then ask the same question again (up to 3 times in a row, then stay quietly listening).
var transcribingNow=false,customerHasSpoken=false,silenceReaskTimer=null,silenceReaskCount=0,silenceReaskStage='',silenceReaskPending=false,silenceReaskHinted=false;
var SILENCE_REASK_MS=6000,SILENCE_REASK_MAX=3,REASK_STAGES=['hello','request','amount','amount-confirmed','balance-check'];
var DIDNT_CATCH={en:"I didn't catch that.",hi:'मुझे सुनाई नहीं दिया।',pa:'ਮੈਨੂੰ ਸੁਣਾਈ ਨਹੀਂ ਦਿੱਤਾ।',ur:'مجھے سنائی نہیں دیا۔'};
function silencePrompt(stage,code){
  const q=stagePrompt(code);
  if(stage==='amount-confirmed'&&q)return q; // the amount was heard and is on screen: only ask yes/no, never "I didn't catch that"
  return q?DIDNT_CATCH[code]+' '+q:DIDNT_CATCH[code];
}
function clearSilenceReask(){clearTimeout(silenceReaskTimer);silenceReaskTimer=null;silenceReaskPending=false}
function reaskContextOk(){return mode==='voice'&&!geminiMicPaused&&REASK_STAGES.includes(flowStage)&&(activeScreen==='requestScreen'||activeScreen==='voiceScreen')}
// keep=true: leave an already running countdown alone (the browser recognizer restarts itself every few seconds).
function armSilenceReask(keep=false){
  if(keep&&silenceReaskPending)return;
  clearSilenceReask();
  if(!reaskContextOk())return;
  if(flowStage!==silenceReaskStage){silenceReaskStage=flowStage;silenceReaskCount=0;silenceReaskHinted=false}
  if(silenceReaskCount>=SILENCE_REASK_MAX&&silenceReaskHinted)return;
  const armedAt=Date.now(),stage=flowStage,amountAtArm=String(detectedAmount);
  silenceReaskPending=true;
  silenceReaskTimer=setTimeout(()=>{
    silenceReaskPending=false;silenceReaskTimer=null;
    if(!reaskContextOk()||flowStage!==stage||String(detectedAmount)!==amountAtArm)return;
    if(transcribingNow||(typeof geminiTurn!=='undefined'&&geminiTurn&&geminiTurn.text&&!geminiTurn.closed)){armSilenceReask();return}
    if(geminiSpeaking||geminiGenerating||geminiUserAudioActive||lastUserChunkAt>armedAt||lastModelAudioAt>armedAt||Date.now()-lastUserChunkAt<4000)return;
    if(window.speechSynthesis?.speaking||serverRec?.speech){armSilenceReask();return}
    repromptNow();
  },SILENCE_REASK_MS);
}
// Say "I didn't catch that" + the current question right now (silence timeout, or an empty/unclear transcript).
function repromptNow(){
  if(!reaskContextOk())return;
  if(transcribingNow)return;
  if(flowStage==='amount'&&detectedAmount&&$('#requestResult')&&!$('#requestResult').hidden&&String($('#requestedAmount').value)===String(detectedAmount))flowStage='amount-confirmed';
  if(flowStage!==silenceReaskStage){silenceReaskStage=flowStage;silenceReaskCount=0;silenceReaskHinted=false}
  clearSilenceReask();
  if(silenceReaskCount>=SILENCE_REASK_MAX){
    silenceReaskHinted=true;showVoiceStatus(speakingLanguage==='hi'?'कृपया स्क्रीन के बटन इस्तेमाल करें, या फिर से बोलें।':speakingLanguage==='pa'?'ਕਿਰਪਾ ਕਰਕੇ ਸਕ੍ਰੀਨ ਦੇ ਬਟਨ ਵਰਤੋ, ਜਾਂ ਦੁਬਾਰਾ ਬੋਲੋ।':speakingLanguage==='ur'?'براہِ کرم اسکرین کے بٹن استعمال کریں، یا دوبارہ بولیں۔':'Please use the buttons on the screen, or speak again.');
    if(!geminiActive()&&speechRestartAllowed)startRecognition();
    return;
  }
  silenceReaskCount++;
  // Home screen and the customer has not said anything yet, so their language is unknown: ask in Hindi, then English.
  if(!customerHasSpoken&&activeScreen==='voiceScreen'&&(flowStage==='hello'||flowStage==='request')){
    const hiText=silencePrompt(flowStage,'hi'),enText=silencePrompt(flowStage,'en');
    if(geminiActive()){
      geminiSocket.send(JSON.stringify({clientContent:{turns:[{role:'user',parts:[{text:'APP EVENT (not spoken by the customer): The customer has not spoken yet, so say these two sentences in this order and nothing else: first the Hindi sentence in Hindi (Devanagari script), then the English sentence in English. Do not translate or add anything. Then stop and listen. Hindi sentence: '+hiText+' English sentence: '+enText}]}],turnComplete:true}}));
      return;
    }
    speechRestartAllowed=false;try{speechRecognition?.abort()}catch{}stopServerRecognition();
    say(hiText,'hi',()=>say(enText,'en',()=>{speechRestartAllowed=true;startRecognition()}));
    return;
  }
  const c=['en','hi','pa','ur'].includes(speakingLanguage)?speakingLanguage:'hi';
  const text=silencePrompt(flowStage,c);
  if(geminiActive()){say(text,c);return}
  // Browser / server recognition: stop listening while the kiosk speaks, then listen again.
  speechRestartAllowed=false;try{speechRecognition?.abort()}catch{}stopServerRecognition();
  say(text,c,()=>{speechRestartAllowed=true;startRecognition()});
}
