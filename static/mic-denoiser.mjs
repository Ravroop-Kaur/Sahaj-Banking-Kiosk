import init from './vendor/rnnoise/rnnoise.mjs';

let runtime;
export async function createDenoiser(options){
  runtime ??= init(options);
  const lib=await runtime;
  const size=lib._rnnoise_get_frame_size();
  const state=lib._rnnoise_create(0);
  const ptr=lib._malloc(size*4);
  if(!state || !ptr){
    if(state)lib._rnnoise_destroy(state);
    if(ptr)lib._free(ptr);
    throw Error('Could not initialize microphone denoiser');
  }
  const frame=lib.HEAPF32.subarray(ptr>>2,(ptr>>2)+size);
  let filled=0;
  return {
    speechProbability:0,
    process(input){
      let confidence=0;
      const output=new Float32Array(Math.floor((filled+input.length)/size)*size);
      let written=0;
      for(const sample of input){
        frame[filled++]=Math.max(-32768,Math.min(32767,sample*65536));
        if(filled!==size)continue;
        confidence+=lib._rnnoise_process_frame(state,ptr,ptr);
        for(let i=0;i<size;i++)output[written++]=frame[i]/65536;
        filled=0;
      }
      this.speechProbability=written ? confidence/(written/size) : 0;
      return output;
    },
    close(){lib._rnnoise_destroy(state);lib._free(ptr)}
  };
}
