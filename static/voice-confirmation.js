(function(root){
function confirmation(value,context){
 if(context==='review'){
  const raw=String(value||'').normalize('NFKC').toLowerCase();
  if(/[?？]|क्या|शायद|\bkya\b|\bmaybe\b/u.test(raw))return 'unknown';
  const action=/(?:^|[\s,।.!])(?:(?:आप|अब|aap|ab)\s+)*(?:(?:फॉर्म|फ़ॉर्म|फार्म|आवेदन|form)\s+)?(?:बना\s*(?:सकत[ेी]\s*(?:हैं|है|हो)|दीजिए|दीजिये|दो|दें)|बनाइए|बनाइये|bana\s+(?:sakte\s+(?:hain|hai|ho)|dijiye|do)|go ahead|prepare (?:the|my) (?:form|draft))(?=$|[\s,।.!])/gu;
  const rest=raw.replace(action,' ');
  if(rest!==raw){
   if(/मत|नहीं|नही|\b(?:not|no|dont|nahi)\b/u.test(raw))return 'no';
   const remaining=rest.replace(/[,।.!]+/g,' ').trim();
   return remaining?confirmation(remaining):'yes';
  }
 }

 const clauses=String(value||'').split(/[,;.!?।]+/u).map(part=>part.trim()).filter(Boolean);
 if(clauses.length>1){
  const answers=clauses.map(part=>confirmation(part));
  if(answers.every(answer=>answer==='yes'))return 'yes';
  if(answers.every(answer=>answer==='no'))return 'no';
  if(answers.includes('yes') && answers.includes('no'))return 'unknown';
 }
let t=String(value||'').normalize('NFKC').toLowerCase().replace(/[’']/g,'').replace(/[.,!?।]/g,' ').replace(/\s+/g,' ').trim();
t=t.replace(/^(?:(?:okay|ok|जी|ji)\s+)+/,'').replace(/\b(haan|han|yes)(?:\s+\1)+\b/g,'$1').replace(/(हाँ|हां)(?:\s+\1)+/g,'$1');
// Collapse repeated affirmative clauses only when the entire reply is affirmative.
// Address terms add politeness but do not change the decision.
t=t.replace(/(?:^|\s)(?:भाई\s*साहब|भाई\s*साब|भैया|भाई|साहब|साब|sir|bhai\s*sahab|bhai|yaar|यार|मैडम|madam)(?=\s|$)/gu,' ').replace(/\s+/g,' ').trim();
if(/^(?:(?:नहीं|नही|ना|न|no|nope|nahi|nahin|गलत|wrong)(?:\s+(?:जी|ji))?\s*)+$/u.test(t))return 'no';
if(/^(?:(?:हाँ|हां|जी|बिल्कुल|बिलकुल|haan|bilkul)\s+)*(?:मस्त|बढ़िया|बढिया|mast|perfect|great)(?:\s+(?:है|hai|जी))?$/u.test(t))return 'yes';
if(/^(?:हा|ha|हाँ|हां|haan|yes)(?:\s+(?:जी|ji|हा|ha|हाँ|हां|haan|yes))*$/u.test(t))return 'yes';
const repeatedAffirmation=/^(?:(?:हाँजी|हांजी|हाँ|हां|haan|han|yes)(?:\s+(?:जी|ji))?|(?:(?:सब|sab|ये|यह|ye|बिलकुल|बिल्कुल|bilkul)\s+)?(?:सही|sahi|ठीक|theek)(?:\s+(?:है|हैं|hai))?)(?:\s+|$)/u;
let rest=t;
while(rest && repeatedAffirmation.test(rest))rest=rest.replace(repeatedAffirmation,'');
if(t && !rest)return 'yes';
const nativeAnswer = {
 yes: ['ਹਾਂ ਜੀ ਸਹੀ ਹੈ','ਸਹੀ ਹੈ','ਹਾਂ ਸਹੀ ਹੈ','ਹਾਂ ਸਾਰੇ ਵੇਰਵੇ ਸਹੀ ਹਨ','ঠিক আছে','হ্যাঁ ঠিক আছে','সব ঠিক আছে','சரி','ஆம் சரி','ஆமாம்','ಎಲ್ಲವೂ ಸರಿಯಾಗಿದೆ','ಹೌದು ಸರಿಯಾಗಿದೆ','ಸರಿ','स्हेई ऐ'],
 no: ['ਨਹੀਂ','ਨਹੀ','ਗਲਤ','না','ভুল','இல்லை','தவறு','ಇಲ್ಲ','ತಪ್ಪು','नेईं']
};
for(const [answer,phrases] of Object.entries(nativeAnswer)){
 if(phrases.includes(t)) return answer;
}
t=t.replace(/^(?:कि|की|ki)\s+/,'');
if(/^(?:(?:haan|han|ha|हाँ|हां|जी)\s+)*(?:(?:sab|सब|ye|ये|यह|bilkul|बिल्कुल)\s+)*(?:theek|thik|ठीक|sahi|सही|बढ़िया|बढिया|badhiya|badiya)(?:\s+(?:hai|है|हैं|ji|जी))*$/.test(t))return 'yes';
if(/^(?:haan|han)(?: ji)?(?: (?:ye|yeh|yah|sab|sabhi))?(?: (?:bilkul|bilkul))? sahi(?: hai| hain)?$/.test(t))return 'yes';
if(/^(?:हाँ|हां)?\s*(?:ये|यह|सब|सभी)(?: जानकारी)?(?: बिल्कुल)? सही(?: है| हैं)?$/.test(t))return 'yes';
if(/\b(maybe|unsure)\b|शायद/.test(t))return 'unknown';
if(/\b(no|nope|nahi|na|not|incorrect|wrong|change|but)\b|नहीं|नही|^ना$|गलत|बदल|शायद/.test(t))return 'no';
if(/^(yes|yeah|yep|yes please|yes it is correct|yes its correct|yes that is correct|yes thats correct|yes all details are correct|yes everything is correct|yes correct|correct|all details are correct|everything is correct|haan|han|haan ji|ji haan|जी|हाँ|हां|जी हाँ|जी हां|हाँ जी|हां जी|हाँ सही है|हां सही है|हाँ यह सही है|हाँ बिल्कुल|हां बिल्कुल|बिल्कुल|बिलकुल|yes everything is right|yes all correct|yes thats right|thats right|that is correct|हां यह सही है|हाँ सब सही है|हां सब सही है|सही|सही है|जी सही है|हाँ सब ठीक है|हां सब ठीक है|यहाँ ये सही है|sahi|sahi hai|sab sahi hai|सब सही है|ठीक है|ਹਾਂ|ਹਾਂ ਜੀ|হ্যাঁ|ஆம்|ಹೌದು)$/.test(t))return 'yes';
return 'unknown';
}
function panPossession(raw){
 const text=String(raw||'').normalize('NFKC').toLowerCase().replace(/[’']/g,'').replace(/[.,!।]+/g,' ').replace(/\s+/g,' ').trim();
 if(/[?？]|शायद|पता नहीं|मालूम नहीं|(?:dont|do not) know|not sure|maybe|क्या|\bkya\b/u.test(text))return 'unknown';
 const answer=confirmation(text);
 if(answer==='no'||/\b(?:dont|havent|without)\b|पास ना है|पास ना हो/u.test(text))return 'no';
 if(answer==='yes')return 'yes';
 // Consume the whole answer so that "my brother has one" cannot confirm possession.
 const fillers=/^(?:(?:yes|yeah|yep|haan|ha|han|हाँ|हां|हा|जी|ji)\s*)+(?=\s|$)/u;
 const body=text.replace(fillers,'').trim();
 if(!body && text)return 'yes';
 const phrase=/^(?:है|हैं|hai|hain|मेरे पास|mere paas|mere pas|पैन कार्ड|पैन|pan card|i do have (?:it|one|a pan card)|i have (?:it|one|a pan card)|ive got (?:it|one)|i do)(?:\s+|$)/u;
 let rest=body;
 while(rest && phrase.test(rest))rest=rest.replace(phrase,'');
 if(!rest && /(?:है|हैं|\bhai[n]?\b|\bi (?:do|have)|\bive got)/u.test(body))return 'yes';
 if(/^(?:demo pan(?: card)?|डेमो पैन(?: कार्ड)?|ডেমো প্যান|மாதிரி பான்|டெமோ பான்|ಡೆಮೊ ಪ್ಯಾನ್|ਡੈਮੋ ਪੈਨ)$/u.test(body))return 'yes';
 return 'unknown';
}
confirmation.panPossession=panPossession;
if(typeof module!=='undefined')module.exports=confirmation;else root.sahajConfirmation=confirmation;
})(globalThis);
