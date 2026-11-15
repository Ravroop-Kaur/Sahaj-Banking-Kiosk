/* Back navigation keeps the current form data. */
(() => {
  'use strict';
  const get = id => document.getElementById(id);
  const label = {en:'Go back', hi:'पीछे जाएँ', pa:'ਪਿੱਛੇ ਜਾਓ', kn:'ಹಿಂದೆ ಹೋಗಿ', ta:'பின்செல்', bn:'ফিরে যান'};
  // The previous screen for each screen. Screens after the form is downloaded or before the journey starts have no "back".
  function previous(id) {
    switch (id) {
      case 'languageScreen': return 'permissionScreen';
      case 'simpleAmountScreen': return 'permissionScreen';
      case 'openingScreen': return 'languageScreen';
      case 'voiceScreen': return 'permissionScreen';
      case 'requestScreen': return mode === 'voice' ? 'voiceScreen' : 'languageScreen';
      case 'uploadScreen': return mode === 'voice' ? 'requestScreen' : 'languageScreen';
      case 'accountConfirmScreen': return 'uploadScreen';
      case 'formsScreen': return 'accountConfirmScreen';
      case 'withdrawalScreen':
      case 'otherFormScreen': return 'formsScreen';
      default: return null; // permissionScreen, counterScreen
    }
  }
  function refresh() {
    const lang = label[language] ? language : 'en';
    const enabled = !!previous(activeScreen);
    ['goBack', 'spokenBack'].forEach(id => {
      const button = get(id);
      if (!button) return;
      button.textContent = id === 'goBack' ? '← ' + label[lang] : label[lang];
      button.disabled = !enabled;
    });
  }
  function goBack() {
    const target = previous(activeScreen);
    if (!target) return;
    // In the voice journey, route through its own "go back" command so its state stays in step with the screen.
    if (mode === 'voice' && window.voiceJourney && typeof window.voiceJourney.handle === 'function') {
      window.voiceJourney.handle('go back', speakingLanguage);
      return;
    }
    try { window.speechSynthesis?.cancel(); } catch {}
    show(target);
  }
  ['goBack', 'spokenBack'].forEach(id => { const button = get(id); if (button) button.addEventListener('click', goBack); });
  window.addEventListener('sahaj:screen', refresh);
  window.addEventListener('sahaj:locale', refresh);
  refresh();
})();

/* Consent dialog and progress display. */
(() => {
  'use strict';
  const get = id => document.getElementById(id);
  const text = {
    en: {yes: 'YES · Continue', no: 'NO · Do not continue', step: (n, t) => `Step ${n} of ${t}`},
    hi: {yes: 'हाँ · जारी रखें', no: 'नहीं · जारी न रखें', step: (n, t) => `चरण ${n} / ${t}`},
    pa: {yes: 'ਹਾਂ · ਜਾਰੀ ਰੱਖੋ', no: 'ਨਹੀਂ · ਜਾਰੀ ਨਾ ਰੱਖੋ', step: (n, t) => `ਕਦਮ ${n} / ${t}`},
    kn: {yes: 'ಹೌದು · ಮುಂದುವರಿಸಿ', no: 'ಇಲ್ಲ · ಮುಂದುವರಿಸಬೇಡಿ', step: (n, t) => `ಹಂತ ${n} / ${t}`},
    ta: {yes: 'ஆம் · தொடரவும்', no: 'இல்லை · தொடர வேண்டாம்', step: (n, t) => `படி ${n} / ${t}`},
    bn: {yes: 'হ্যাঁ · চালিয়ে যান', no: 'না · চালাবেন না', step: (n, t) => `ধাপ ${n} / ${t}`}
  };
  const lang = () => (typeof language === 'string' && text[language]) ? language : 'en';

  // Large YES/NO dialog; resolves true/false. Escape or closing counts as NO. Nothing is processed before YES.
  window.kioskConsent = message => new Promise(resolve => {
    const dialog = document.createElement('dialog');
    dialog.id = 'consentDialog';
    dialog.setAttribute('aria-labelledby', 'consentDialogText');
    const p = document.createElement('p'); p.id = 'consentDialogText'; p.textContent = message;
    const row = document.createElement('div'); row.className = 'row consent-actions';
    const yes = document.createElement('button'); yes.type = 'button'; yes.className = 'primary'; yes.textContent = text[lang()].yes;
    const no = document.createElement('button'); no.type = 'button'; no.className = 'secondary'; no.textContent = text[lang()].no;
    let answer = false;
    yes.onclick = () => { answer = true; dialog.close(); };
    no.onclick = () => { answer = false; dialog.close(); };
    dialog.addEventListener('close', () => { dialog.remove(); resolve(answer); });
    row.append(yes, no); dialog.append(p, row); document.body.append(dialog);
    dialog.showModal(); no.focus();
  });

  function updateStepLine() {
    const items = [...(get('journeySteps')?.children || [])];
    const index = items.findIndex(li => li.classList.contains('active'));
    document.querySelectorAll('.step-line').forEach(node => node.remove());
    if (index < 0) return;
    const screen = document.querySelector('.screen-stack > .screen:not([hidden])');
    if (!screen || screen.id === 'permissionScreen') return;
    const line = document.createElement('p');
    line.className = 'step-line';
    line.textContent = text[lang()].step(index + 1, items.length);
    screen.prepend(line);
  }
  // Run after experience.js has set the active step for the new screen.
  window.addEventListener('sahaj:screen', () => setTimeout(updateStepLine, 0));
  window.addEventListener('sahaj:locale', () => setTimeout(updateStepLine, 0));
})();

/* Hide banking services that are not part of this demo. */
(() => {
  'use strict';
  const wrap = document.getElementById('otherFormTypeWrap');
  if (!wrap) return;
  const lock = () => { if (!wrap.hidden) wrap.hidden = true; };
  new MutationObserver(lock).observe(wrap, {attributes: true, attributeFilter: ['hidden']});
  lock();
})();
