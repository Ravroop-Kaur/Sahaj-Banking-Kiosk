const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const dir=path.join(__dirname,'../static'),read=f=>fs.readFileSync(path.join(dir,f),'utf8'),c={};
const jobs=read('kiosk-opening-simple.js'),vad=read('server-stt.js');
vm.createContext(c);vm.runInContext(jobs.slice(jobs.indexOf('const jobLanguages'),jobs.indexOf('async function occupationNext')),c);
for(const [phrase,en,voice] of [['I actor हूँ','Actor','एक्टर'],['मैं एक्टर हूँ','Actor','एक्टर'],['मैं teacher हूँ','Teacher','टीचर'],['मैं शिक्षक हूँ','Teacher','शिक्षक']]){
const r=c.localOccupation(phrase,'en','hi');assert.equal(r?.english,en);assert.equal(r.voice,voice);}
const answer=require(path.join(dir,'voice-confirmation.js'));
for(const phrase of ['haan haan sahi hai','haan sahi hai, haan sahi hai','हाँ सही है, हाँ सही है।'])assert.equal(answer(phrase),'yes');
for(const phrase of ['हाँ सही नहीं है','हाँ शायद','हाँ है सब ये'])assert.notEqual(answer(phrase),'yes');
vm.runInContext(vad.slice(vad.indexOf('const SERVER_STT'),vad.indexOf('function encodeWav16k')),c);
function rms(level){const samples=Float32Array.from({length:2048},(_,i)=>level*Math.SQRT2*Math.sin(i*Math.PI/16));return Math.sqrt(samples.reduce((a,x)=>a+x*x,0)/samples.length)}
for(const [background,speech] of [[.0004,.0018],[.001,.005],[.012,.024]]){
const rec={ambient:[],speech:false,noiseFloor:.0015};let consecutive=0;
for(let i=0;i<40;i++){consecutive=c.voiceActivity(rec,rms(background))?consecutive+1:0;assert.ok(consecutive<2);}
assert.ok(c.voiceActivity(rec,rms(speech)));assert.ok(c.voiceActivity(rec,rms(speech)));rec.speech=true;assert.ok(!c.voiceActivity(rec,rms(background)));}
console.log('Passed mixed-language occupations, repeated confirmations, quiet onset, and stationary noise checks');
