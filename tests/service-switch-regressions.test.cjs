const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {wantsDownload,parse} = require('../static/service-correction.js');

test('spoken download commands in six languages, including refusals', () => {
  for (const text of ['download', 'डाउनलोड करें', 'ਡਾਊਨਲੋਡ ਕਰੋ', 'ডাউনলোড করুন', 'பதிவிறக்கவும்', 'ಡೌನ್ಲೋಡ್ ಮಾಡಿ']) {
    assert.equal(wantsDownload(text), true, text);
  }
  for (const text of ["don't download", 'डाउनलोड मत करो', 'ਡਾਊਨਲੋਡ ਨਾ ਕਰੋ', 'ডাউনলোড করবেন না', 'பதிவிறக்க வேண்டாம்', 'ಡೌನ್ಲೋಡ್ ಬೇಡ']) {
    assert.equal(wantsDownload(text), false, text);
  }
});

test('a deposit preview finishing after a service switch cannot reopen the old form', async () => {
  const source = fs.readFileSync(require.resolve('../static/app.js'), 'utf8');
  const start = source.indexOf("$('#previewSampleForm').onclick=");
  const end = source.indexOf("$('#downloadSampleForm').onclick=",start);
  const nodes = new Map();
  const node = id => { if (!nodes.has(id)) nodes.set(id, {}); return nodes.get(id); };
  let release;
  const waiting = new Promise(resolve => {release=resolve;});
  const context = {
    $:node, selectedFormType:'deposit', currentFormFields:()=>({amount:'500'}),
    fetch:()=>waiting, window:{SahajV8:{version:1}}, URL, Blob,
  };
  vm.runInNewContext(source.slice(start,end),context);
  const pending=node('#previewSampleForm').onclick();
  context.window.SahajV8.version++;
  release({ok:true,blob:async()=>new Blob(['stale'])});
  await pending;
  assert.equal(nodes.has('#samplePdfPreview'),false);
});

test('a correction to a field stays on the current form', () => {
  for (const text of ['my name is wrong','मेरा नाम गलत है','ਮੇਰਾ ਨਾਮ ਗਲਤ ਹੈ','আমার নাম ভুল','என் பெயர் தவறு','ನನ್ನ ಹೆಸರು ತಪ್ಪು']) {
    assert.equal(parse(text),null,text);
  }
});
