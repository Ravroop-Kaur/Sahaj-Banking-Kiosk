(() => {
  const dialog=document.createElement('dialog');
  dialog.setAttribute('aria-labelledby','demoFaceHeading');
  dialog.style.cssText='max-width:min(28rem,90vw);padding:1.5rem;border:1px solid #bdcfc5;border-radius:16px';
  dialog.innerHTML='<h2 id="demoFaceHeading"></h2><p></p><button type="button" class="primary"></button> <button type="button" class="quiet"></button>';
  document.body.append(dialog);
  const [yes,no]=dialog.querySelectorAll('button');
  const copy=code=>code==='hi'
    ? ['डेमो पहचान जाँच','काल्पनिक चेहरे का मिलान करें? हाँ या ना कहें, या नीचे चुनें। कैमरे की ज़रूरत नहीं है।','हाँ, जाँच करें','रुकें']
    : ['Demo face check','Compare the fictional face with the demo identity? Say yes or no, or choose below. No camera is needed.','Verify demo face','Stop'];
  let settle=null,verifying=false;
  function finish(ok){if(!settle)return;const resolve=settle;settle=null;dialog.close();resolve(ok)}
  yes.dataset.faceAnswer='yes';
  no.dataset.faceAnswer='no';
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('button[data-face-answer]');
    if(!settle||!button||!dialog.contains(button))return;
    event.preventDefault();
    event.stopImmediatePropagation();
    finish(button.dataset.faceAnswer==='yes');
  },true);
  dialog.addEventListener('cancel',()=>finish(false));
  window.demoFace={
    get active(){return Boolean(settle)||verifying},
    answer(text){if(verifying)return true;if(!settle)return false;const value=window.sahajConfirmation(text);if(value==='yes'||value==='no')finish(value==='yes');else window.sahajOpeningPrompt?.(copy(speakingLanguage)[1]);return true},
    async check(session,challenge,kind){
      const words=copy(language);dialog.querySelector('h2').textContent=words[0];dialog.querySelector('p').textContent=words[1];yes.textContent=words[2];no.textContent=words[3];
      const consent=await new Promise(resolve=>{settle=resolve;dialog.showModal();if(mode==='voice')window.sahajOpeningPrompt?.(copy(speakingLanguage)[1])});
      window.sahajCancelSpeech?.();
      if(consent){
        verifying=true;
        dialog.querySelector('h2').textContent=language==='hi'?'डेमो चेहरा जाँचा जा रहा है':'Checking the demo face';
        dialog.querySelector('p').textContent=language==='hi'?'काल्पनिक पहचान से मिलान हो रहा है।':'Comparing the sample with the linked demo identity.';
        yes.hidden=no.hidden=true;dialog.showModal();
      }
      try{
      const r=await fetch('/api/kiosk/verify-face',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session_id:session,challenge,consent,sample_face:kind==='passbook'?'passbook-holder':'opening-applicant'})});
      if(!r.ok)throw Error('Demo identity verification incomplete. Rescan or ask staff.');
      const result=await r.json();
      dialog.querySelector('h2').textContent=language==='hi'?'डेमो पहचान का मिलान हुआ':'Demo identity matched';
      dialog.querySelector('p').textContent=language==='hi'?'जाँच पूरी हुई।':'Verification complete.';
      await new Promise(resolve=>setTimeout(resolve,650));
      return result;
      }finally{verifying=false;if(dialog.open)dialog.close();yes.hidden=no.hidden=false}
    }
  };
})();
