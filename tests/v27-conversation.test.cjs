const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../static/kiosk-v8.js'),'utf8');
const extract=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
const nodes={};let heard=[],selected=[],listens=0;
const c={console,T:{hi:{notEnough:'Show balance?'}},activeScreen:'voiceScreen',endSession(){c.ended=true},language:'hi',speakingLanguage:'hi',mode:'voice',step:'service',failedReplies:0,
 customerHasSpoken:false,speechRestartAllowed:false,geminiMicPaused:true,speechRecognition:null,
 service:'withdrawal',window:{sahajCancelSpeech(){},SahajServiceCorrection:require('../static/service-correction.js')},el:id=>nodes[id]??={},status(){},stopServerRecognition(){},
 say:async(text,code,done)=>{heard.push(text);done?.()},startRecognition(){listens++},
 spokenWords:()=>({help:'Services',notEnough:'Show balance?',edit:'Change amount'}),
 parseLanguagePreferenceCommand:()=>false,followSpokenLanguage(){},localizeV8(){},
 localIntent:t=>/निकाल|withdraw/.test(t)?'withdrawal':'',
 chooseService:async kind=>{selected.push(kind);c.step='passbook'},retryReply:async()=>{throw Error('Unexpected retry')},
 passbookGuides:{hi:'Choose demo passbook'},reviewCopy:()=>({prefix:'Confirm details'}),
 words:()=>({notEnough:'Show balance?'}),money:n=>String(n),passbook:{profile:{balance:1000}},
 show(){},yes:t=>t==='yes',no:t=>t==='no',spokenNumberValue:()=>null,
 showAmount(){c.step='amount'}
};
vm.createContext(c);
vm.runInContext(extract('function greetView','async function promptVoice'),c);
for(const language of ['en','hi']){c.language=language;c.customerHasSpoken=true;c.greetView();assert.match(nodes.voiceGreeting.innerHTML,/नमस्ते/);assert.match(nodes.voiceGreeting.innerHTML,/Hello/);}
vm.runInContext(extract('async function promptVoice','async function startGreeting'),c);
vm.runInContext(extract('function isServiceHelp','// Existing adapter'),c);
vm.runInContext(extract('function balancePrompt','function submitAmount'),c);
// This unit harness supplies the navigation side effects; the actual kiosk
// uses the new correction controller and cancels pending work before routing.
c.navigateCorrection=async command=>{
 if(command?.action!=='service')return false;
 if(c.step==='service'){await c.chooseService(command.service);return true}
 if(c.step==='review'){await c.switchService(command.service);return true}
 return false;
};
(async()=>{
 for(const phrase of ['कि मतलब नया अकाउंट खोलना है','मुझे बैंक अकाउंट खुलवाना है','naya account kholna hai','मुझे नया bank account चाहिए']){
  c.step='service';await c.handleVoice(phrase);assert.equal(selected.at(-1),'opening');
 }
 assert.equal(c.wantsNewAccount('मुझे नया अकाउंट नहीं खोलना'),false);
 for(const question of ['आप मेरी क्या क्या मदद कर सकते हैं?','आपके पास कौन सी सेवाएं उपलब्ध हैं?','आपके पास कौन सी सेवाएं available हैं?','What services are available?','अब क्या कर सकते हैं?','आपके पास कौन से कौन से सुविधाएं हैं?','What you can do?']){
  c.step='service';await c.handleVoice(question);assert.match(heard.at(-1),/Services/);assert.equal(c.geminiMicPaused,false);assert.equal(c.speechRestartAllowed,true);
  await c.handleVoice('मुझे पैसे निकालने हैं');assert.equal(selected.at(-1),'withdrawal');
 }
 assert.equal(c.requestedService('nahi nahi mujhe deposit karna hai'),'deposit');
 assert.equal(c.requestedService("I don't want to deposit"),'');
 assert.equal(c.requestedService('deposit karna nahi hai'),'');
 assert.equal(c.requestedService('I want to withdraw no I want to deposit money'),'deposit');
 c.switchService=async kind=>{c.service=kind;c.step='amount'};c.step='review';c.service='withdrawal';await c.handleVoice('nahi nahi mujhe deposit karna hai');assert.equal(c.service,'deposit');assert.equal(c.step,'amount');
 c.showBalanceQuestion();assert.equal(nodes.v8BalanceAnswer.hidden,true);
 await c.handleVoice('yes');assert.equal(nodes.v8BalanceAnswer.hidden,false);
 c.showBalanceQuestion();await c.handleVoice('no');assert.equal(c.step,'amount');assert.equal(nodes.v8BalanceAnswer.hidden,true);
 c.window.sahajConfirmation=require('../static/voice-confirmation.js');let prepared=0;c.prepareReviewed=async()=>{prepared++};
 for(const reply of ['हाँ ये सही है','haan ye sahi hai','हाँ हाँ','yes yes']){c.step='review';await c.handleVoice(reply);}
 assert.equal(prepared,4);c.step='review';await c.handleVoice('no');assert.equal(c.step,'amount');
 c.step='passbook';c.parseLanguagePreferenceCommand=()=>true;c.languageChangeConfirmation=()=> 'Preferences updated.';
 await c.handleVoice('screen English voice Hindi');assert.match(heard.at(-1),/Preferences updated.*Choose demo passbook/);
 c.activeScreen='counterScreen';await c.handleVoice('एंड');assert.equal(c.ended,true);assert.ok(listens>=7);
 console.log('PASS: service questions, mid-flow switch, review confirmations, microphone rearm, balance consent, question replay');
})();
