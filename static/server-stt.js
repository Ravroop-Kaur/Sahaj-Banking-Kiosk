// Server-side speech recognition fallback. Loaded before app.js; shares its global scope.
// ---------- Server-side speech recognition fallback (works in any browser with a microphone) ----------
let serverSTTForced=!!(navigator.brave), serverRec=null; // Brave disables Google-backed Web Speech, so use server transcription from the start
const SERVER_STT={threshold:0.015,startMs:120,silenceMs:1300,maxMs:15000,idleMs:12000,minMs:350};
function encodeWav16k(chunks,inRate){
  let n=0;for(const c of chunks)n+=c.length;const all=new Float32Array(n);let o=0;for(const c of chunks){all.set(c,o);o+=c.length}
  const ratio=inRate/16000,outLen=Math.floor(all.length/ratio),pcm=new Int16Array(outLen);
  for(let i=0;i<outLen;i++){const a=Math.floor(i*ratio),b=Math.min(all.length,Math.floor((i+1)*ratio));let sum=0,k=0;for(let j=a;j<b;j++){sum+=all[j];k++}const v=Math.max(-1,Math.min(1,k?sum/k:0));pcm[i]=v<0?v*0x8000:v*0x7fff}
  const buf=new ArrayBuffer(44+pcm.length*2),dv=new DataView(buf),w=(off,str)=>{for(let i=0;i<str.length;i++)dv.setUint8(off+i,str.charCodeAt(i))};
  w(0,'RIFF');dv.setUint32(4,36+pcm.length*2,true);w(8,'WAVE');w(12,'fmt ');dv.setUint32(16,16,true);dv.setUint16(20,1,true);dv.setUint16(22,1,true);dv.setUint32(24,16000,true);dv.setUint32(28,32000,true);dv.setUint16(32,2,true);dv.setUint16(34,16,true);w(36,'data');dv.setUint32(40,pcm.length*2,true);
  new Int16Array(buf,44).set(pcm);return new Blob([buf],{type:'audio/wav'});
}
function stopServerRecognition(){
  const r=serverRec;serverRec=null;if(!r)return;
  r.dead=true;try{r.proc.disconnect()}catch{}try{r.src.disconnect()}catch{}try{r.ctx.close()}catch{}
  if(r.ownStream)try{r.stream.getTracks().forEach(t=>t.stop())}catch{}
  try{clearTimeout(r.timer)}catch{}
}
async function startServerRecognition(){
  if(geminiActive()||serverRec||mode!=='voice'||geminiMicPaused)return;
  speechRestartAllowed=true;
  const Ctx=window.AudioContext||window.webkitAudioContext;
  if(!navigator.mediaDevices?.getUserMedia||!Ctx){showFatalError('microphone-unsupported');return}
  const rec={dead:false,chunks:[],speech:false,speechMs:0,silenceMs:0,totalMs:0,noiseFloor:0.004,ownStream:false};
  serverRec=rec;
  try{
    let stream=activeMicStream&&activeMicStream.getAudioTracks().some(t=>t.readyState==='live')?activeMicStream:null;
    if(!stream){stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});activeMicStream=stream}
    rec.stream=stream;
    if(rec.dead)return;
    rec.ctx=new Ctx();if(rec.ctx.state==='suspended')await rec.ctx.resume();
    rec.src=rec.ctx.createMediaStreamSource(stream);
    rec.proc=rec.ctx.createScriptProcessor(4096,1,1);
    const silent=rec.ctx.createGain();silent.gain.value=0;
    rec.proc.onaudioprocess=e=>{
      if(rec.dead)return;
      const data=e.inputBuffer.getChannelData(0),ms=data.length/rec.ctx.sampleRate*1000;
      // Never record the kiosk's own voice (speech synthesis / Gemini audio).
      if(window.speechSynthesis?.speaking||geminiSpeaking){rec.chunks=[];rec.speech=false;rec.speechMs=0;rec.silenceMs=0;return}
      let sum=0;for(let i=0;i<data.length;i++)sum+=data[i]*data[i];const rms=Math.sqrt(sum/data.length);
      rec.totalMs+=ms;
      const loud=rms>Math.max(SERVER_STT.threshold,rec.noiseFloor*3);
      if(!rec.speech){
        rec.noiseFloor=rec.noiseFloor*0.95+rms*0.05;
        rec.chunks.push(new Float32Array(data));if(rec.chunks.length>4)rec.chunks.shift(); // keep a little lead-in
        if(loud){rec.speechMs+=ms;if(rec.speechMs>=SERVER_STT.startMs){rec.speech=true;rec.totalMs=0;rec.silenceMs=0;setListeningVisual(true);listeningUI(true)}}else rec.speechMs=0;
        if(rec.totalMs>SERVER_STT.idleMs){finishServerClip(rec,false)}
      }else{
        rec.chunks.push(new Float32Array(data));
        rec.silenceMs=loud?0:rec.silenceMs+ms;
        if(rec.silenceMs>=SERVER_STT.silenceMs||rec.totalMs>=SERVER_STT.maxMs)finishServerClip(rec,true);
      }
    };
    rec.src.connect(rec.proc);rec.proc.connect(silent);silent.connect(rec.ctx.destination);
    setDevBadge('server-stt','recording');armSilenceReask(true);
    showVoiceStatus(speakingLanguage==='hi'?'सुन रही हूँ…':speakingLanguage==='pa'?'ਸੁਣ ਰਹੀ ਹਾਂ…':speakingLanguage==='ur'?'سن رہی ہوں…':'Listening…');
    listeningUI(true);setListeningVisual(true);
  }catch(error){
    console.warn('[server stt] microphone failed',error);stopServerRecognition();
    if(error&&(error.name==='NotAllowedError'||error.name==='SecurityError'))showFatalError('microphone: '+error.name);
    else showVoiceStatus(errCopy('generic'));
  }
}
async function finishServerClip(rec,hadSpeech){
  if(rec.dead)return;
  const chunks=rec.chunks,rate=rec.ctx.sampleRate;
  stopServerRecognition();
  listeningUI(false);setListeningVisual(false);
  const again=()=>{if(speechRestartAllowed&&mode==='voice'&&!geminiMicPaused&&!document.hidden)setTimeout(startServerRecognition,200)};
  if(!hadSpeech||!chunks.length){again();return}
  const blob=encodeWav16k(chunks,rate);
  if(blob.size<16000*2*SERVER_STT.minMs/1000){again();return}
  showVoiceStatus(speakingLanguage==='hi'?'समझ रही हूँ…':speakingLanguage==='pa'?'ਸਮਝ ਰਹੀ ਹਾਂ…':speakingLanguage==='ur'?'سمجھ رہی ہوں…':'Understanding…');
  try{
    const r=await fetch('/api/voice/transcribe?language='+encodeURIComponent(speakingLanguage||''),{method:'POST',headers:{'Content-Type':'audio/wav'},body:blob});
    if(!r.ok)throw new Error('HTTP '+r.status);
    const d=await r.json();
    const text=(d.text||'').trim();
    if(d.engine)setDevBadge('server-stt',d.engine);
    if(!text){
      if(!d.engine&&d.errors?.length)console.warn('[server stt] no engine worked:',d.errors);
      showVoiceStatus(speakingLanguage==='hi'?'आवाज़ साफ़ नहीं सुनाई दी। कृपया फिर से बोलें।':speakingLanguage==='pa'?'ਆਵਾਜ਼ ਸਾਫ਼ ਨਹੀਂ ਸੁਣੀ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਬੋਲੋ।':speakingLanguage==='ur'?'آواز صاف سنائی نہیں دی۔ براہِ کرم دوبارہ بولیں۔':'I could not hear that clearly. Please speak again.');
      repromptNow();return;
    }
    speechRestartAllowed=false;
    handleVoice(text,detectLanguage(text));
  }catch(error){
    console.warn('[server stt] transcription failed',error);
    showVoiceStatus(errCopy('generic'));
    setTimeout(again,1500);
  }
}
