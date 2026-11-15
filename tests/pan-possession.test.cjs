const assert=require('node:assert/strict');
const {panPossession}=require('../static/voice-confirmation.js');
for(const [answer,phrases] of Object.entries({
 yes:['हाँ है','है','हाँ हाँ है है','मेरे पास है','है मेरे पास','yeah yeah yeah है है मेरे पास है','Yeah, I do have it.','I have one','mere paas hai','yeah yeah'],
 no:['मेरे पास नहीं है','no demo pan','I don’t have one'],
 unknown:['पता नहीं','क्या मेरे पास है?','my brother has one','I have a passport','']
}))for(const text of phrases)assert.equal(panPossession(text),answer,text);
