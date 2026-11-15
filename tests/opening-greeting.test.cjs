const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const read=f=>fs.readFileSync(path.join(__dirname,'../static',f),'utf8');
const flow=read('kiosk-v8.js'),layer=read('kiosk-v19.js');
let finish,mid=0,after=0,spoken;
const c={window:{},mode:'voice',geminiMicPaused:false,geminiActive:()=>false,el:()=>({}),greetView(){},show(){},stopServerRecognition(){},startServerRecognition(){mid++},startRecognition(){after++},speechRecognition:null,say:(text,code,cb)=>{spoken=text;finish=cb}};
vm.createContext(c);vm.runInContext('let generation=0; const oldSay=say;'+layer.slice(layer.indexOf('say=async'),layer.indexOf('document.addEventListener')),c);
vm.runInContext(flow.slice(flow.indexOf('async function startGreeting('),flow.indexOf('\n',flow.indexOf('async function startGreeting('))),c);
(async()=>{await c.startGreeting(true);assert.match(spoken,/नमस्ते.*Hello/);assert.equal(mid,0);assert.equal(after,0);assert.equal(c.window.sahajOpeningGreeting,true);finish();assert.equal(after,1);assert.equal(c.window.sahajOpeningGreeting,false);await c.say('Choose Demo passbook','en',c.startRecognition);assert.equal(mid,0);assert.equal(after,1);assert.equal(c.window.sahajPromptPlaying,true);
const stale=finish;await c.say('How much?','en',c.startRecognition);stale();assert.equal(after,1);assert.equal(c.window.sahajPromptPlaying,true);
finish();assert.equal(after,2);assert.equal(c.window.sahajPromptPlaying,false);console.log('Playback completion opens the answer turn; stale callbacks cannot reopen it.')})()
