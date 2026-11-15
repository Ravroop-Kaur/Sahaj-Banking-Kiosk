const assert=require('node:assert/strict');
const answer=require('../static/voice-confirmation.js');
for(const phrase of ['बिल्कुल ठीक है। बना सकते हैं, हाँ बिल्कुल सही है।','बना सकते हैं','बिलकुल ठीक है','हाँ फॉर्म बना दीजिए','go ahead'])assert.equal(answer(phrase,'review'),'yes',phrase);
for(const phrase of ['मत बना दीजिए','क्या बना सकते हैं?','शायद बना सकते हैं'])assert.notEqual(answer(phrase,'review'),'yes',phrase);
assert.equal(answer.panPossession('बना सकते हैं'),'unknown');
