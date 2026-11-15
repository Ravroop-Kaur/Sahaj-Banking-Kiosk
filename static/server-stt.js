// Server-side speech recognition fallback. Loaded before app.js; shares its global scope.
let serverSTTForced=!!(navigator.brave), serverRec=null; // Brave disables Google-backed Web Speech, so use server transcription from the start
const SERVER_STT={threshold:0.0011,startMs:100,silenceMs:650,maxMs:15000,idleMs:12000,minMs:180};
// Estimate background from the quieter frames. Brief syllables retain their onset.
function voiceActivity(rec,rms){
  if(!rec.speech){
    rec.ambient.push(rms);
    if(rec.ambient.length>35)rec.ambient.shift();
    if(rec.ambient.length>=6){
      const sorted=rec.ambient.slice().sort((a,b)=>a-b);
      rec.noiseFloor=sorted[Math.floor(sorted.length*0.2)];
    }else if(rec.ambient.length>1 && rms>0.009 && Math.max(...rec.ambient)<Math.min(...rec.ambient)*1.25){
      // A stationary loud floor at microphone startup is usually room noise.
      rec.noiseFloor=Math.min(...rec.ambient);
    }
  }
  return rms>Math.max(SERVER_STT.threshold,rec.noiseFloor*(rec.speech?1.25:1.65));
}
// Track the background before denoising. A steady motor can sound voiced to both
// detectors, but it does not rise above its own recent energy floor.
const microphoneFloors=new WeakMap();
function exceedsRoomNoise(history,input,rate){
  let energy=0;
  for(const sample of input)energy+=sample*sample;
  const level=Math.sqrt(energy/input.length);
  history.push(level);
  const capacity=Math.ceil(3*rate/input.length);
  if(history.length>capacity)history.shift();
  if(history.length<2)return true;
  const sorted=history.slice().sort((a,b)=>a-b);
  const floor=sorted[Math.floor((sorted.length-1)*0.15)];
  return level>floor*1.12;
}
function encodeWav16k(chunks,inRate){
  let n=0;for(const c of chunks)n+=c.length;const all=new Float32Array(n);let o=0;for(const c of chunks){all.set(c,o);o+=c.length}
  // Raise quiet clips uniformly, preserving the waveform and avoiding clipping.
  let peak=0;
  for(const value of all)peak=Math.max(peak,Math.abs(value));
  const gain=peak>0?Math.min(12,0.75/peak):1;
  if(gain>1)for(let i=0;i<all.length;i++)all[i]*=gain;
  const ratio=inRate/16000,outLen=Math.floor(all.length/ratio),pcm=new Int16Array(outLen);
  for(let i=0;i<outLen;i++){const a=Math.floor(i*ratio),b=Math.min(all.length,Math.floor((i+1)*ratio));let sum=0,k=0;for(let j=a;j<b;j++){sum+=all[j];k++}const v=Math.max(-1,Math.min(1,k?sum/k:0));pcm[i]=v<0?v*0x8000:v*0x7fff}
  const buf=new ArrayBuffer(44+pcm.length*2),dv=new DataView(buf),w=(off,str)=>{for(let i=0;i<str.length;i++)dv.setUint8(off+i,str.charCodeAt(i))};
  w(0,'RIFF');dv.setUint32(4,36+pcm.length*2,true);w(8,'WAVE');w(12,'fmt ');dv.setUint32(16,16,true);dv.setUint16(20,1,true);dv.setUint16(22,1,true);dv.setUint32(24,16000,true);dv.setUint32(28,32000,true);dv.setUint16(32,2,true);dv.setUint16(34,16,true);w(36,'data');dv.setUint32(40,pcm.length*2,true);
  new Int16Array(buf,44).set(pcm);return new Blob([buf],{type:'audio/wav'});
}
function showAnswerCue(ready){
  const cue=document.getElementById('answerCue');
  if(!cue)return;
  cue.hidden=!ready;
  if(ready)cue.textContent=({hi:'अब बोलें',pa:'ਹੁਣ ਬੋਲੋ',bn:'এখন বলুন',ta:'இப்போது பேசுங்கள்',kn:'ಈಗ ಮಾತನಾಡಿ'}[language]||'Speak now');
}
function stopServerRecognition(){
  showAnswerCue(false);
  const r=serverRec;serverRec=null;if(!r)return;
  r.dead=true;r.detector?.close();r.denoiser?.close();try{r.proc.disconnect()}catch{}try{r.src.disconnect()}catch{}try{r.ctx.close()}catch{}
  if(r.ownStream)try{r.stream.getTracks().forEach(t=>t.stop())}catch{}
  try{clearTimeout(r.timer)}catch{}
}
async function startServerRecognition(){
  if(window.sahajPromptPlaying||window.sahajOpeningGreeting||geminiActive()||serverRec||mode!=='voice'||geminiMicPaused)return;
  speechRestartAllowed=true;
  const Ctx=window.AudioContext||window.webkitAudioContext;
  if(!navigator.mediaDevices?.getUserMedia||!Ctx){showFatalError('microphone-unsupported');return}
  const rec={dead:false,chunks:[],speech:false,speechMs:0,silenceMs:0,totalMs:0,noiseFloor:0.00065,ambient:[],ownStream:false};
  serverRec=rec;
  try{
    let stream=activeMicStream&&activeMicStream.getAudioTracks().some(t=>t.readyState==='live')?activeMicStream:null;
    if(!stream){stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});activeMicStream=stream}
    rec.stream=stream;
    rec.roomLevels=microphoneFloors.get(stream) || [];
    microphoneFloors.set(stream,rec.roomLevels);
    if(rec.dead)return;
    try{rec.ctx=new Ctx({sampleRate:48000})}catch{rec.ctx=new Ctx()}if(rec.ctx.state==='suspended')await rec.ctx.resume();
    try{
      const {createSpeechDetector}=await import('./speech-detector.mjs');
      const detector=await createSpeechDetector(rec.ctx.sampleRate);
      if(rec.dead){detector.close();return}
      rec.detector=detector;
    }catch(error){console.warn('Local speech detector unavailable',error.name)}
    if(rec.dead)return;
    if(rec.ctx.sampleRate===48000){
      try{
        const {createDenoiser}=await import('./mic-denoiser.mjs');
        const denoiser=await createDenoiser();
        if(rec.dead){denoiser.close();return}
        rec.denoiser=denoiser;
      }catch(error){console.warn('Using browser microphone noise suppression',error.name)}
    }
    if(rec.dead)return;
    rec.src=rec.ctx.createMediaStreamSource(stream);
    rec.proc=rec.ctx.createScriptProcessor(2048,1,1);
    const silent=rec.ctx.createGain();silent.gain.value=0;
    rec.proc.onaudioprocess=e=>{
      if(rec.dead)return;
      const input=e.inputBuffer.getChannelData(0);
      const data=rec.denoiser ? rec.denoiser.process(input) : input;
      const ms=data.length/rec.ctx.sampleRate*1000;
      // Never record the kiosk's own voice (speech synthesis / Gemini audio).
      if(geminiSpeaking){rec.chunks=[];rec.speech=false;rec.speechMs=0;rec.silenceMs=0;return}
      let sum=0;for(let i=0;i<data.length;i++)sum+=data[i]*data[i];const rms=Math.sqrt(sum/data.length);
      rec.totalMs+=ms;
      let crossings=0;
      for(let i=1;i<data.length;i++)if((data[i]>=0)!==(data[i-1]>=0))crossings++;
      const crossingRate=crossings*rec.ctx.sampleRate/(2*data.length);
      const voiced=rec.detector ? rec.detector.accepts(data) : crossingRate>=65 && crossingRate<=4600;
      const confidence=rec.denoiser?.speechProbability ?? 1;
      const aboveRoom=exceedsRoomNoise(rec.roomLevels,input,rec.ctx.sampleRate);
      const loud=voiceActivity(rec,rms) && aboveRoom && voiced && confidence>=(rec.speech ? 0.30 : 0.55);
      if(!rec.speech){

        rec.chunks.push(new Float32Array(data));if(rec.chunks.length>Math.ceil(300/ms))rec.chunks.shift(); // keep a little lead-in
        if(loud){rec.speechMs+=ms;if(rec.speechMs>=SERVER_STT.startMs){rec.speech=true;
          if(gnaniAudio || window.speechSynthesis?.speaking || !speechRestartAllowed)window.sahajCancelSpeech?.(true);
          rec.totalMs=0;rec.silenceMs=0}}else rec.speechMs=0;
        if(rec.totalMs>SERVER_STT.idleMs){
          rec.totalMs=0;
          if(!idleEndTimer && activeScreen!=='permissionScreen')armIdleEnd();
        }
      }else{
        rec.chunks.push(new Float32Array(data));
        if(loud){
          rec.speechMs+=ms;
          if(!rec.shownListening && rec.speechMs>=280){
            rec.shownListening=true;setListeningVisual(true);listeningUI(true);
          }
        }
        rec.silenceMs=loud?0:rec.silenceMs+ms;
        if(rec.silenceMs>=SERVER_STT.silenceMs||rec.totalMs>=SERVER_STT.maxMs)finishServerClip(rec,true);
      }
    };
    // Reduce low-frequency fan and handling rumble before detection and encoding.
    const highPass=rec.ctx.createBiquadFilter();
    highPass.type='highpass';highPass.frequency.value=90;
    rec.src.connect(highPass);highPass.connect(rec.proc);rec.proc.connect(silent);silent.connect(rec.ctx.destination);
    setDevBadge('server-stt','recording');armSilenceReask(true);
    
    showAnswerCue(true);
    // Microphone is ready, but preserve the page until voice activity begins.
    listeningUI(false);setListeningVisual(false);
  }catch(error){
    console.warn('[server stt] microphone failed',error);stopServerRecognition();
    if(error&&(error.name==='NotAllowedError'||error.name==='SecurityError'))showFatalError('microphone: '+error.name);
    else showVoiceStatus(errCopy('generic'));
  }
}
async function finishServerClip(rec,hadSpeech){
  if(rec.dead)return;
  const turn=window.sahajSpeechGeneration;
  const chunks=rec.chunks,rate=rec.ctx.sampleRate;
  stopServerRecognition();
  listeningUI(false);setListeningVisual(false);
  const again=()=>{if(speechRestartAllowed&&mode==='voice'&&!geminiMicPaused&&!document.hidden)setTimeout(()=>{if(turn===window.sahajSpeechGeneration && speechRestartAllowed && mode==='voice')startServerRecognition()},200)};
  if(!hadSpeech||!chunks.length){if(!idleEndTimer && activeScreen!=='permissionScreen')armIdleEnd();again();return}
  const blob=encodeWav16k(chunks,rate);
  if(blob.size<16000*2*SERVER_STT.minMs/1000){again();return}
  showVoiceStatus(({en:'Understanding…',hi:'समझ रही हूँ…',pa:'ਸਮਝ ਰਹੀ ਹਾਂ…',bn:'বুঝতে চেষ্টা করছি…',ta:'புரிந்துகொள்கிறேன்…',kn:'ಅರ್ಥಮಾಡಿಕೊಳ್ಳುತ್ತಿದ್ದೇನೆ…'})[speakingLanguage]||'Understanding…');
  clearSilenceReask();transcribingNow=true;
  try{
    const r=await fetch('/api/voice/transcribe?language='+encodeURIComponent(speechLanguageLocked?(speakingLanguage||'en'):''),{method:'POST',headers:{'Content-Type':'audio/wav'},body:blob,signal:AbortSignal.timeout(12000),sahajShowProgress:rec.shownListening});
    if(!r.ok)throw new Error('HTTP '+r.status);
    const d=await r.json();transcribingNow=false;
    const text=(d.text||'').trim();
    if(mode!=='voice'||turn!==window.sahajSpeechGeneration||window.sahajPromptPlaying)return;
    if(d.engine){setDevBadge('server-stt',d.engine);window.sahajVoiceEvidence=Object.assign(window.sahajVoiceEvidence||{},{stt:d.engine});}
    if(!text){
      if(!d.engine&&d.errors?.length)console.warn('[server stt] no engine worked:',d.errors);
      // Without words there is no answer to grade. Keep the current question open.
      speechRestartAllowed=true;again();
      return;
    }
    speechRestartAllowed=false;
    await handleVoice(text,d.detected_language||detectSpokenLanguage(text));
  }catch(error){
    transcribingNow=false;console.warn('[server stt] transcription failed',error);
    showVoiceStatus(errCopy('generic'));
    if(turn===window.sahajSpeechGeneration && mode==='voice' && activeScreen!=='permissionScreen'){if(activeScreen==='openingScreen' && window.SahajOpeningFlow && window.sahajOpeningPrompt)await window.sahajOpeningPrompt(window.SahajOpeningFlow.shortQuestion());else{speechRestartAllowed=true;setTimeout(again,1500);}}
  }
}
