const assert=require('node:assert/strict');const vm=require('node:vm');
const fs=require('node:fs');const source=fs.readFileSync('static/app.js','utf8');const start=source.indexOf('function gnaniSpeak(');const end=source.indexOf('\nfunction ',start+1);
let played=false;let timeout;
const context={GNANI:{primary:true,langs:{en:{tts:true}}},gnaniDownUntil:{},Event,window:{sahajSpeechGeneration:1,dispatchEvent(){}},gnaniAudio:null,Date,Promise,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL:()=>{}},AbortSignal:{timeout:ms=>{timeout=ms;return {}}},setDevBadge:()=>{},console,
fetch:async()=>({ok:true,headers:{get:()=> 'gnani'},blob:async()=>({})}),Audio:class{play(){played=true;setTimeout(()=>this.onended(),0);return Promise.resolve()}}};
vm.createContext(context);vm.runInContext(source.slice(start,end),context);
(async()=>{assert.equal(await context.gnaniSpeak('Hello','en'),true);assert.equal(played,true);assert.ok(timeout>=10000);played=false;context.fetch=async()=>{context.window.sahajSpeechGeneration++;return {ok:true,headers:{get:()=> 'gnani'},blob:async()=>({})}};await context.gnaniSpeak('Old prompt','en');assert.equal(played,false);console.log('PASS: successful audio plays; late cancelled audio does not; timeout allows provider latency');})();
