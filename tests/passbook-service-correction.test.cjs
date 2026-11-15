const test = require('node:test');
const assert = require('node:assert/strict');
const {parse,chosePassbook} = require('../static/service-correction.js');

const phrases = {
  en: ['Put money into my account at Punjab Bank', 'I actually want to withdraw money, not deposit'],
  hi: ['Punjab Bank mein paise jama karane hain', 'पंजाब बैंक से पैसे निकालने हैं, जमा नहीं करने'],
  pa: ['ਪੰਜਾਬ ਬੈਂਕ ਵਿੱਚ ਪੈਸੇ ਜਮ੍ਹਾਂ ਕਰਵਾਉਣੇ ਨੇ', 'ਮੈਨੂੰ ਪੈਸੇ ਕੱਢਣੇ ਨੇ ਜਮ੍ਹਾਂ ਨਹੀਂ ਕਰਨੇ'],
  bn: ['পাঞ্জাব ব্যাংকে টাকা জমা দিতে চাই', 'আমি টাকা তুলতে চাই, জমা দিতে চাই না'],
  ta: ['பஞ்சாப் வங்கியில் பணம் செலுத்த வேண்டும்', 'பணம் எடுக்க வேண்டும், பணம் செலுத்த வேண்டாம்'],
  kn: ['ಪಂಜಾಬ್ ಬ್ಯಾಂಕಿನಲ್ಲಿ ಹಣ ಜಮೆ ಮಾಡಬೇಕು', 'ಹಣ ತೆಗೆಯಬೇಕು, ಜಮೆ ಬೇಡ'],
};

for (const [language, [deposit, withdrawal]] of Object.entries(phrases)) {
  test(language + ' cash request on the document-selection step', () => {
    for (const [text, service] of [[deposit,'deposit'],[withdrawal,'withdrawal']]) {
      assert.deepEqual(parse(text),{action:'service',service});
      assert.equal(chosePassbook(text),false);
    }
  });
}
test('a payment word or number inside a sentence cannot choose a document', () => {
  for (const text of ['money','someone','1000','I want one hundred','पैसे जमा कराने हैं']) {
    assert.equal(chosePassbook(text),false,text);
  }
  for (const text of ['option one','demo passbook','डेमो पासबुक','ਡੈਮੋ ਪਾਸਬੁੱਕ','ডেমো পাসবই','டெமோ பாஸ்புக்','ಡೆಮೊ ಪಾಸ್‌ಬುಕ್']) {
    assert.equal(chosePassbook(text),true,text);
  }
});
