// V2 spec regression checks (source-level; no browser or Python needed). Run: node tests/v2-spec.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const S = f => fs.readFileSync(path.join(__dirname, '..', 'static', f), 'utf8');
const app = S('app.js'), a11y = S('kiosk-a11y.js'), v2 = S('kiosk-v2.js'), html = S('index.html'), css = S('kiosk-a11y.css');

test('"hmm" is not accepted as YES (spec §12)', () => {
  const m = app.match(/function looseYes\(t\)\{return (\/.*?\/[a-z]*)\.test/s);
  assert.ok(m, 'looseYes not found');
  assert.ok(!/hmm/i.test(m[1]));
});
test('no window.confirm() in kiosk scripts; accessible YES/NO consent is used (spec §1.3)', () => {
  for (const f of fs.readdirSync(path.join(__dirname, '..', 'static')).filter(x => x.endsWith('.js')))
    assert.ok(!/\bconfirm\(/.test(S(f)), f + ' still calls confirm()');
  assert.match(v2, /askConsent\(/);
  assert.match(a11y, /window\.kioskConsent/);
  assert.match(a11y, /no\.focus\(\)/); // focus starts on NO: safest default
});
test('counter text does not promise an automatic 10 s close', () => {
  assert.ok(!/10\s*(s\b|sec)/i.test(html.match(/id="counterInstruction"[^<]*/)?.[0] || ''));
  assert.ok(!/automatically clos/i.test(app.match(/counter[^\n]{0,400}/i)?.[0] || ''));
});
test('Go back never clears data and is wired in both places (spec §1.1)', () => {
  assert.match(html, /id="goBack"/); assert.match(html, /id="spokenBack"/);
  assert.ok(!/clear|reset|=\s*''/.test(a11y.slice(a11y.indexOf('function goBack'), a11y.indexOf('function goBack') + 600)));
});
test('visible "Step n of N" line exists (spec §1.2)', () => {
  assert.match(a11y, /Step \$\{n\} of \$\{t\}/); assert.match(css, /\.step-line/);
});
test('balance is labelled as demo balance with a source line', () => {
  assert.match(app, /SYNTHETIC DEMO BALANCE/); assert.match(app, /demo bank record/);
});

test('unsupported other-form options are hidden, inert and disabled', () => {
  const wrap = html.match(/<label id="otherFormTypeWrap"[^>]*>/)[0];
  assert.match(wrap, /hidden/); assert.match(wrap, /inert/);
  const select = html.match(/<select id="otherFormType"[\s\S]*?<\/select>/)[0];
  assert.match(select, /<select id="otherFormType" disabled>/);
  assert.ok(!/<option(?![^>]*disabled)/.test(select), 'every option must be disabled');
  assert.match(a11y, /otherFormTypeWrap/);
});
