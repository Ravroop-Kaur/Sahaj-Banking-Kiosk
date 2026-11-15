"""Execute the real JS handlers in Node with small DOM/network boundaries.

These cover the event-argument regression and the OCR-to-review boundary. They
complement, rather than replace, the real-browser checks in REVIEW_NOTES.md.
Node is optional for running the kiosk; these tests skip when it is unavailable.
"""
import json
import shutil
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
NODE = shutil.which("node")
pytestmark = pytest.mark.skipif(not NODE, reason="Node.js needed for JS regression checks")


def run_js(script):
    result = subprocess.run([NODE, "-"], input=script, text=True, encoding="utf-8",
                            capture_output=True, timeout=10, cwd=ROOT)
    assert result.returncode == 0, result.stderr


def test_manual_start_click_does_not_pass_event_as_navigation_target():
    source = (ROOT / "static/app.js").read_text(encoding="utf-8")
    binding = source.split("$('#manualContinue').onclick=", 1)[1].split(";", 1)[0]
    run_js("""
const assert = require('node:assert/strict');
let destination;
function chooseManualLanguage(target='uploadScreen') { destination=target; }
const clickHandler = """ + binding + """;
clickHandler({type:'click',target:{id:'manualContinue'}});
assert.equal(destination,'uploadScreen','A MouseEvent must never become a screen ID');
""")


@pytest.mark.parametrize("candidate", ["990000000001", ""])
def test_ocr_cannot_silently_select_a_customer(candidate):
    source = (ROOT / "static/app.js").read_text(encoding="utf-8")
    handler = source.split("async function processPassbookImage(){", 1)[1].split("$('#lookupAccount').onclick=", 1)[0]
    run_js("""
const assert = require('node:assert/strict');
const elements = new Map();
const $ = key => { if(!elements.has(key)) elements.set(key,{hidden:true,disabled:false,value:'',textContent:'',src:'blob:synthetic-preview'}); return elements.get(key); };
let passbookReading=false,passbookReadGeneration=0,imageFile={},passbook={},screen='uploadScreen',language='en';
let loading=false;
const loadingCopy=()=>['Reading','Reading'],manualMessage=()=>'',words=()=>({ocrReview:'Check this suggestion'});
const showLoading=()=>loading=true,hideLoading=()=>loading=false,show=id=>screen=id;
const shrinkImageForUpload=async file=>file;
const userError=message=>new Error(message),safeMessage=error=>error.message;
const fetch=()=>{throw Error('OCR must not perform an account lookup before confirmation');};
const candidate=""" + json.dumps(candidate) + """;
const postPassbook=async()=>({response:{ok:true},d:{fields:{account_id:{value:candidate}}}});
async function processPassbookImage(){""" + handler + """
(async()=>{
  await processPassbookImage();
  assert.equal(loading,false);
  assert.equal(passbookReading,false);
  if(candidate){
    assert.equal(screen,'accountConfirmScreen');
    assert.equal($('#confirmedAccount').value,candidate);
    assert.equal(passbook.profile,null);
    assert.equal($('#confirmProfile').checked,false);
  }else{
    assert.equal(screen,'uploadScreen');
    assert.equal($('#extract').disabled,false);
    assert.equal($('#extract').hidden,false);
    assert.ok($('#ocrStatus').textContent);
  }
})().catch(error=>{console.error(error);process.exitCode=1});
""")
