import init from './vendor/fvad/fvad.mjs';

// Each microphone recording has separate adaptive state. The compiled module is shared.
let runtime;
export async function createSpeechDetector(sampleRate, options){
  runtime ??= init(options);
  const wasm=await runtime;
  const detector=wasm._fvad_new();
  const frameSize=160; // 10 ms at 16 kHz
  const buffer=wasm._malloc(frameSize*2);
  if(!detector || !buffer){
    if(detector)wasm._fvad_free(detector);
    if(buffer)wasm._free(buffer);
    throw Error('Cannot allocate the speech detector');
  }
  wasm._fvad_set_mode(detector,2);
  wasm._fvad_set_sample_rate(detector,16000);
  let phase=0,sum=0,count=0,filled=0;
  return {
    accepts(samples){
      let frames=0,voiced=0;
      const pcm=wasm.HEAP16.subarray(buffer>>1,(buffer>>1)+frameSize);
      for(const sample of samples){
        sum+=sample;count++;phase+=16000;
        if(phase<sampleRate)continue;
        phase-=sampleRate;
        pcm[filled++]=Math.round(Math.max(-1,Math.min(1,4*sum/count))*32767);
        sum=0;count=0;
        if(filled===frameSize){
          if(wasm._fvad_process(detector,buffer,frameSize)===1)voiced++;
          frames++;filled=0;
        }
      }
      return frames>0 && voiced*2>=frames;
    },
    close(){wasm._fvad_free(detector);wasm._free(buffer)}
  };
}
