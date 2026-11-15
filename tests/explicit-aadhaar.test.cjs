const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const s=fs.readFileSync(path.join(__dirname,'../static/kiosk-opening-simple.js'),'utf8');
let scans=0,prompts=0,retries=0;
const ctx={activeScreen:'openingScreen',phase:'identity',working:false,speakingLanguage:'hi',queueMicrotask,reset(){},prompt(){prompts++},begin(){scans++},phasePrompt(){return 'डेमो आधार चुनें या बोलें डेमो आधार।'},window:{sahajRetryReply(){retries++}}};
vm.createContext(ctx);vm.runInContext(s.slice(s.indexOf('function start(){'),s.indexOf("$('simpleOpeningSample').onclick")),ctx);
(async()=>{ctx.start();await Promise.resolve();assert.equal(prompts,1);assert.equal(scans,0);
for(const text of ['हाँ','yes','आधार','sample','डेमो पासबुक','डेमो आधार नहीं चाहिए','कौन सा डेमो आधार?','डेमो आधार चुनें या बोलें डेमो आधार।','Choose or say Demo Aadhaar to continue.'])await ctx.handleVoice(text);
assert.equal(scans,0);assert.equal(retries,9);
for(const text of ['हाँ, डेमो आधार','Demo Aadhaar','use the demo Aadhaar card','ডেমো আধার','ਮਾਦிரி இல்லை','மாதிரி ஆதார்','ಡೆಮೊ ಆಧಾರ್','ਡੈਮੋ ਆਧਾਰ'].filter(x=>!x.includes('இல்லை')))await ctx.handleVoice(text);
assert.equal(scans,7);ctx.working=true;await ctx.handleVoice('demo aadhaar');assert.equal(scans,7);console.log('Opening prompt, explicit selection, refusal, prompt echo and busy-state checks passed')})()
