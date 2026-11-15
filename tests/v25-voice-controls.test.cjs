const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const confirmation = require('../static/voice-confirmation.js');
for (const text of ['Yes.', 'Yes it is correct.', 'Yes it’s correct.', 'हाँ', 'जी हाँ', 'हाँ सब सही है', 'haan ji']) {
  assert.equal(confirmation(text), 'yes', text);
}
for (const text of ['not correct', 'no', 'नहीं', 'yes but wrong']) {
  assert.equal(confirmation(text), 'no', text);
}
assert.equal(confirmation('hmm'), 'unknown');
const source = fs.readFileSync(path.join(__dirname, '../static/app.js'), 'utf8');
const start = source.indexOf('function parseLanguagePreferenceCommand(');
const end = source.indexOf('const LANGUAGE_NATIVE_NAMES=', start);
for (const text of [
  'I want the screen to be in English and want to talk in Hindi',
  'Keep the screen in English and speak in Hindi',
  'स्क्रीन अंग्रेजी में और बात हिंदी में',
  'Speak in Hindi but show the screen in English',
  'screen in English voice in Hindi',
  'स्क्रीन इंग्लिश और वॉइस हिंदी',
  'स्क्रीन इंग्लिश वॉयस हिंदी'
]) {
  const context = {language:'hi', speakingLanguage:'en', localize(){}, console};
  vm.createContext(context);
  vm.runInContext(source.slice(start, end), context);
  assert.equal(context.parseLanguagePreferenceCommand(text), true, text);
  assert.equal(context.language, 'en', text);
  assert.equal(context.speakingLanguage, 'hi', text);
  assert.equal(context.displayLanguageLocked, true);
  assert.equal(context.speechLanguageLocked, true);
}
console.log('PASS: 12 confirmation cases and 7 mixed-language preference cases');
