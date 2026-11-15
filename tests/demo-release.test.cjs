const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../static/kiosk-v8.js'),'utf8');
function functionSource(name,next){return source.slice(source.indexOf('function '+name+'('),source.indexOf('\n'+next,source.indexOf('function '+name+'(')));}
const nodes={};const ctx={Number,Math,language:'en',mode:'manual',service:'deposit',step:'amount',passbook:{profile:{balance:1000}},el:id=>nodes[id]??=( {} ),status(){},showBalanceQuestion(){ctx.result='balance'},showReview(n){ctx.result=n}};
vm.createContext(ctx);vm.runInContext(functionSource('submitAmount','function withdrawalReviewCopy'),ctx);
ctx.submitAmount('5000');assert.equal(ctx.result,5000,'deposits are independent of balance');
ctx.service='withdrawal';ctx.submitAmount('5000');assert.equal(ctx.result,'balance');
ctx.submitAmount('1.10');assert.equal(ctx.result,1.1,'valid decimal amounts must not fail floating-point comparison');
for(const amount of ['0','-1','Infinity','1.001']){ctx.result=null;ctx.submitAmount(amount);assert.equal(ctx.result,null,amount);}
const replies={briefQuestion:()=>"Say yes or no.",failedReplies:0,speakingLanguage:'en',promptVoice:async()=>{},window:{sahajRecovery:{open(){replies.opened=(replies.opened||0)+1}}}};
vm.createContext(replies);vm.runInContext('async '+functionSource('retryReply','async function handleVoice'),replies);
(async()=>{await replies.retryReply();await replies.retryReply();assert.equal(replies.opened,undefined);await replies.retryReply();assert.equal(replies.opened,1);assert.equal(replies.failedReplies,0);console.log('PASS: balance rules, decimal validation, invalid amounts, recovery after three failures');})();
