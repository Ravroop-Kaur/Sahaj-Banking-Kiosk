const test = require('node:test');
const assert = require('node:assert/strict');
const { parse } = require('../static/service-correction.js');

// Each row is a complete customer reply, as delivered by speech recognition.
const scenarios = {
  english: [
    ['No, I picked the wrong service, take me back', 'menu'],
    ['Change service', 'menu'],
    ["I don't want to withdraw money I want to open a bank account", 'opening'],
    ['I want to deposit, not withdraw', 'deposit'],
    ['withdraw instead of opening a new bank account', 'withdrawal'],
    ['do not withdraw money', 'menu'],
    ['I accidentally chose withdrawal', 'menu'],
    ['I want to deposit, I picked withdrawal by mistake', 'deposit'],
  ],
  hindi: [
    ['नहीं नहीं मैंने गलत बोल दिया फिर वापस जाओ', 'menu'],
    ['सेवा बदलें', 'menu'],
    ['फिर से स्टार्ट करो', 'restart'],
    ['मैं पैसे निकालना नहीं चाहता मुझे जमा करना है', 'deposit'],
    ['नहीं मुझे जमा नहीं करना नया खाता खोलना है', 'opening'],
    ['पैसे निकालने हैं जमा नहीं करने', 'withdrawal'],
    ['maine galat bol diya wapas jao', 'menu'],
    ['मुझे पैसे निकालने नहीं हैं,नया खाता खोलना है', 'opening'],
  ],
  punjabi: [
    ['ਨਹੀਂ ਜੀ ਮੈਂ ਗਲਤ ਕਹਿ ਦਿੱਤਾ ਵਾਪਸ ਜਾਓ', 'menu'],
    ['ਸੇਵਾ ਬਦਲੋ', 'menu'],
    ['ਮੈਂ ਪੈਸੇ ਕੱਢਣੇ ਨਹੀਂ ਮੈਂ ਪੈਸੇ ਜਮ੍ਹਾਂ ਕਰਵਾਉਣੇ ਨੇ', 'deposit'],
    ['ਮੈਨੂੰ ਪੈਸੇ ਕੱਢਣੇ ਨੇ ਖਾਤਾ ਖੋਲ੍ਹਣਾ ਨਹੀਂ', 'withdrawal'],
    ['ਮੈਨੂੰ ਪੈਸੇ ਜਮ੍ਹਾਂ ਨਹੀਂ ਕਰਵਾਉਣੇ ਨਵਾਂ ਖਾਤਾ ਖੋਲ੍ਹਣਾ ਹੈ', 'opening'],
    ['ਮੁੜ ਤੋਂ ਸ਼ੁਰੂ ਕਰੋ', 'restart'],
    ['main paise kaddhne ne jama nahi karne', 'withdrawal'],
  ],
  bengali: [
    ['আমি ভুল বলেছি ফিরে যান', 'menu'],
    ['পরিষেবা বদলান', 'menu'],
    ['আমি টাকা তুলতে চাই না টাকা জমা দিতে চাই', 'deposit'],
    ['আমি টাকা তুলতে চাই নতুন অ্যাকাউন্ট খুলতে চাই না', 'withdrawal'],
    ['টাকা জমা দিতে চাই না আমি নতুন অ্যাকাউন্ট খুলতে চাই', 'opening'],
    ['ami taka tulte chai joma dite chai na', 'withdrawal'],
  ],
  tamil: [
    ['நான் தவறாக சொன்னேன் திரும்பி போ', 'menu'],
    ['சேவையை மாற்று', 'menu'],
    ['பணம் எடுக்க வேண்டாம் பணம் செலுத்த வேண்டும்', 'deposit'],
    ['பணம் எடுக்க வேண்டும் புதிய கணக்கு திறக்க வேண்டாம்', 'withdrawal'],
    ['பணம் செலுத்த வேண்டாம் புதிய கணக்கு திறக்க வேண்டும்', 'opening'],
    ['enakku panam edukka vendum deposit vendam', 'withdrawal'],
  ],
  kannada: [
    ['ನಾನು ತಪ್ಪಾಗಿ ಹೇಳಿದೆ ಹಿಂದಕ್ಕೆ ಹೋಗಿ', 'menu'],
    ['ಸೇವೆಯನ್ನು ಬದಲಿಸಿ', 'menu'],
    ['ಹಣ ತೆಗೆಯಲು ಬೇಡ ಹಣ ಜಮೆ ಮಾಡಬೇಕು', 'deposit'],
    ['ಹಣ ತೆಗೆಯಬೇಕು ಹೊಸ ಖಾತೆ ತೆರೆಯಲು ಬೇಡ', 'withdrawal'],
    ['ಹಣ ಜಮಾ ಮಾಡುವುದು ಬೇಡ ಹೊಸ ಖಾತೆ ತೆರೆಯಬೇಕು', 'opening'],
    ['nanage hana tegeyabeku jame madalu beda', 'withdrawal'],
  ],
};

for (const [language, replies] of Object.entries(scenarios)) {
  test('service corrections in ' + language, () => {
    for (const [reply, expected] of replies) {
      assert.deepEqual(parse(reply), ['menu','restart'].includes(expected)
        ? { action: expected==='restart'?'restart':'choose' } : { action: 'service', service: expected }, reply);
    }
  });
}

test('stage-specific answers stay with the current question', () => {
  for (const phrase of ['my name is wrong', 'नहीं राशि गलत है', 'no', 'ਨਹੀਂ', 'ಹೌದು',
    'I am an accountant', 'I go back to work next week', 'demo passbook', 'five hundred']) {
    assert.equal(parse(phrase), null, phrase);
  }
});

test('a fixed deposit does not route into the cash deposit or withdrawal flow', () => {
  for (const phrase of ["I don't want a fixed deposit", 'can I withdraw my fixed deposit?',
    'I want a recurring deposit', 'I want to withdraw from a term deposit']) {
    assert.deepEqual(parse(phrase), { action: 'unsupported' }, phrase);
  }
  assert.deepEqual(parse('not a fixed deposit I want to deposit cash'),
    { action: 'service', service: 'deposit' });
});
