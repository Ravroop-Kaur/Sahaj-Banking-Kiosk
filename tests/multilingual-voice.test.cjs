const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = name => fs.readFileSync(path.join(__dirname, '..', 'static', name), 'utf8');
const app = read('app.js');
const flow = read('kiosk-v8.js');

function languageContext() {
  let redraws = 0;
  const context = {
    language: 'en', speakingLanguage: 'en',
    speechLanguageLocked: false, displayLanguageLocked: false,
    SUPPORTED_UI: ['en', 'hi', 'pa', 'bn', 'ta', 'kn'],
    isAmountOnlyVoiceTurn: text => /^(?:\d+|yes|no|ਹਾਂ|হ্যাঁ)$/.test(text.trim()),
    localize: () => { redraws++; },
    window: {}, console,
  };
  vm.createContext(context);
  const code = app.slice(app.indexOf('function languageFromLocale(locale){'), app.indexOf('function opener(code){'));
  assert.ok(code.startsWith('function languageFromLocale'));
  vm.runInContext(code, context);
  context.redraws = () => redraws;
  return context;
}

test('native and colloquial utterances identify all regional voice languages', () => {
  const samples = [
    ['ਮੈਨੂੰ ਪੈਸੇ ਕੱਢਣੇ ਨੇ', 'pa'],
    ['मुझे पैसे कड़ने हैं', 'pa'],
    ['menu paise kadhne ne', 'pa'],
    ['আমাকে টাকা তুলতে হবে', 'bn'],
    ['ami taka tulte chai', 'bn'],
    ['எனக்கு பணம் எடுக்க வேண்டும்', 'ta'],
    ['enakku panam edukka vendum', 'ta'],
    ['enakku panam selutha vendum', 'ta'],
    ['ನನಗೆ ಹಣ ತೆಗೆಯಬೇಕು', 'kn'],
    ['मुझे पैसे निकालने हैं', 'hi'],
    ['I need to withdraw money', 'en'],
  ];
  for (const [phrase, expected] of samples) {
    assert.equal(languageContext().detectSpokenLanguage(phrase), expected, phrase);
  }
});

test('regional speech changes voice and screen together across all four languages', () => {
  for (const [phrase, expected] of [
    ['ਮੈਨੂੰ ਪੈਸੇ ਕੱਢਣੇ ਨੇ', 'pa'],
    ['আমাকে টাকা তুলতে হবে', 'bn'],
    ['எனக்கு பணம் எடுக்க வேண்டும்', 'ta'],
    ['ನನಗೆ ಹಣ ತೆಗೆಯಬೇಕು', 'kn'],
  ]) {
    const ctx = languageContext();
    ctx.followSpokenLanguage(phrase);
    assert.equal(ctx.speakingLanguage, expected);
    assert.equal(ctx.language, expected);
    assert.equal(ctx.window.sahajDetectedScreenLanguage, true);
    assert.equal(ctx.redraws(), 1);
  }
});

test('explicitly chosen voice and screen languages are respected separately', () => {
  const ctx = languageContext();
  ctx.speakingLanguage = 'pa';
  ctx.speechLanguageLocked = true;
  ctx.language = 'en';
  ctx.displayLanguageLocked = true;
  ctx.followSpokenLanguage('আমি টাকা তুলতে চাই', 'bn-IN');
  assert.equal(ctx.speakingLanguage, 'pa');
  assert.equal(ctx.language, 'en');
  assert.equal(ctx.redraws(), 0);
});

test('short confirmations and amounts do not unexpectedly change languages', () => {
  const ctx = languageContext();
  ctx.followSpokenLanguage('মনে টাকা তুলবো', 'bn-IN');
  ctx.followSpokenLanguage('yes');
  ctx.followSpokenLanguage('500');
  assert.equal(ctx.speakingLanguage, 'bn');
  assert.equal(ctx.language, 'bn');
});

test('provider English/Hindi mistakes are overridden by recognizable Tamil and Kannada phrases', () => {
  for (const [phrase, provider, language] of [
    ['enakku panam edukka vendum', 'en-IN', 'ta'],
    ['nanage hana tegeyabeku', 'hi-IN', 'kn'],
  ]) {
    const ctx=languageContext();
    ctx.followSpokenLanguage(phrase,provider);
    assert.equal(ctx.speakingLanguage, language);
    assert.equal(ctx.language, language);
  }
});

test('unknown provider language does not reset the selected language to English', () => {
  const ctx = languageContext();
  ctx.followSpokenLanguage('ਮੈਨੂੰ ਪੈਸੇ ਕੱਢਣੇ ਨੇ', 'unknown');
  assert.equal(ctx.speakingLanguage, 'pa');
  assert.equal(ctx.language, 'pa');
});

const svc = {};
vm.createContext(svc);
vm.runInContext(flow.slice(flow.indexOf('function requestedService(text){'), flow.indexOf('async function switchService(kind){')), svc);
test('banking request recognition understands Punjabi, Bengali, Tamil and Kannada', () => {
  const samples = [
    ['ਮੈਨੂੰ ਪੈਸੇ ਕੱਢਣੇ ਨੇ', 'withdrawal'],
    ['मुझे पैसे कड़ने हैं', 'withdrawal'],
    ['আমাকে টাকা তুলতে হবে', 'withdrawal'],
    ['আমি টাকা জমা দিতে চাই', 'deposit'],
    ['எனக்கு பணம் எடுக்க வேண்டும்', 'withdrawal'],
    ['எனக்கு பணம் செலுத்த வேண்டும்', 'deposit'],
    ['enakku panam edukka vendum', 'withdrawal'],
    ['enakku panam selutha vendum', 'deposit'],
    ['ನನಗೆ ಹಣ ಹಿಂಪಡೆಯಬೇಕು', 'withdrawal'],
    ['ನನಗೆ ಹಣ ಜಮೆ ಮಾಡಬೇಕು', 'deposit'],
    ['nanage hana tegeyabeku', 'withdrawal'],
    ['nanage hana jame madbeku', 'deposit'],
    ['ami taka joma dite chai', 'deposit'],
  ];
  for (const [phrase, expected] of samples) assert.equal(svc.requestedService(phrase), expected, phrase);
});

test('Tamil and Kannada Roman-script yes/no replies work during confirmations', () => {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(flow.slice(flow.indexOf('function yes(text){'), flow.indexOf('let failedReplies=0;')), ctx);
  for (const phrase of ['aama', 'seri', 'haudu', 'howdu', 'sari']) assert.equal(ctx.yes(phrase), true, phrase);
  for (const phrase of ['illai', 'vendam', 'illa', 'beda']) assert.equal(ctx.no(phrase), true, phrase);
});

test('older intent handling recognizes regional Roman-script withdrawal and deposit', () => {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(app.slice(app.indexOf('function localIntent(text){'), app.indexOf('function isAmountOnlyVoiceTurn(t){')), ctx);
  for (const [phrase, kind] of [
    ['enakku panam edukka vendum', 'withdrawal'],
    ['enakku panam selutha vendum', 'deposit'],
    ['nanage hana tegeyabeku', 'withdrawal'],
    ['nanage hana jame madbeku', 'deposit'],
  ]) assert.equal(ctx.localIntent(phrase), kind, phrase);
});

test('auto recognition is not narrowed to English before the first utterance', () => {
  const stt = read('server-stt.js');
  assert.match(stt, /speechLanguageLocked\s*\?\s*\(speakingLanguage\|\|'en'\)\s*:\s*''/);
  assert.match(stt, /d\.detected_language\s*\|\|\s*detectSpokenLanguage\(text\)/);
  const laterOverride = read('kiosk-v20.js');
  assert.match(laterOverride, /_multilingualFollowSpokenLanguage\(text,providerLanguage\)/);
});
