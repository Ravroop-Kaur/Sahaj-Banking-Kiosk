/* A voice command can reject one service and request another in the same breath.
   Keep the positions of the mentions so each negation applies to its own service. */
(() => {
  const services = {
    withdrawal: [
      /\bwithdraw(?:al|ing)?\b|\btake out (?:some )?(?:cash|money)\b|\bget cash\b/,
      /निकाल[\p{L}\p{M}]*|निकासी|कड़[\p{L}\p{M}]*|कढ[\p{L}\p{M}]*|काढ़[\p{L}\p{M}]*/,
      /ਕੱਢ[\p{L}\p{M}]*|ਕਢ[\p{L}\p{M}]*|ਨਿਕਾਸੀ|\b(?:kadh|kadd|kadne|kadhne)\w*\b/,
      /তুল[\p{L}\p{M}]*|উত্তোলন|\b(?:tulte|tulbo|tulun|tolte)\b/,
      /எடுக்க[\p{L}\p{M}]*|எடு[\p{L}\p{M}]*|\b(?:edukka|eduka|edukkanum|eduk|edukka vendum)\b/,
      /ತೆಗೆಯ[\p{L}\p{M}]*|ತೆಗ[\p{L}\p{M}]*|ಹಿಂಪಡೆಯ[\p{L}\p{M}]*|\b(?:tegeyabeku|tege|tegedu|himpadey)\w*\b/,
      /\bnikal\w*\b|\bpaise\s+(?:nikal|kadh)\w*/,
      /\b(?:withdraw\w*|cash out|take (?:some |my )?(?:cash|money) out|take out (?:some |my )?(?:cash|money))\b/,
      /निकाल[\p{L}\p{M}]*|निकासी|निकलव[\p{L}\p{M}]*|कड़[\p{L}\p{M}]*|कढ[\p{L}\p{M}]*|कड्ढ[\p{L}\p{M}]*|\b(?:nikal|nikaal|kadh|kaddh)\w*/,
      /ਕੱਢ[\p{L}\p{M}]*|ਕਢ[\p{L}\p{M}]*|ਕਢਵ[\p{L}\p{M}]*|ਕਢਾ[\p{L}\p{M}]*/,
      /টাকা (?:তোল|তুল|বের|নিতে)[\p{L}\p{M}]*|উত্তোলন|\b(?:taka (?:tol|tul)|tulbo|tulte)\w*/,
      /பணம் (?:எடு|எடுக்|வாங்க)[\p{L}\p{M}]*|திரும்பப் பெற[\p{L}\p{M}]*|\b(?:edukk|eduka)\w*/,
      /ಹಣ(?:ವನ್ನು)? (?:ತೆಗೆ|ತೆಗಿ)[\p{L}\p{M}]*|ಹಿಂಪಡೆ[\p{L}\p{M}]*|\b(?:tegeya|tegedu|himpadey)\w*/,
    ],
    deposit: [
      /\b(?:jamaa|jamma|jamaah?|jamha)\b/u,
      /\bcash in to (?:my |the )?account\b|बैंक में पैसे डाल|ব্যাংকে টাকা রাখা|வங்கியில் பணம் கட்ட|ಬ್ಯಾಂಕಿಗೆ ಹಣ ಕಟ್ಟು/u,
      /\bdeposit\b|\bput (?:some )?(?:money|cash) (?:in|into)\b/,
      /जमा|\bjama\b|\bpaise\s+jama\b/,
      /ਜਮ੍ਹਾ(?:ਂ)?|ਜਮਾਂ|ਜਮਾ|ਪਾਉਣ|\bjam[mh]a\b/,
      /জমা|ডিপোজিট|\b(?:joma|taka joma)\b/,
      /செலுத்த[\p{L}\p{M}]*|வைப்ப[\p{L}\p{M}]*|டெபாசிட்|போட[\p{L}\p{M}]*|\b(?:seluth\w*|panam\s+pod\w*)\b/,
      /ಜಮೆ|ಜಮಾ|ಠೇವಣಿ|ಹಾಕ[\p{L}\p{M}]*|\b(?:jame|haak\w*|hak\w*)\b/,
      /\b(?:deposit\w*|put (?:some |my )?(?:cash|money) in|add money)\b/,
      /जमा|डिपॉजिट|पैसे डाल[\p{L}\p{M}]*|\b(?:jamaa?|joma)\b/,
      /ਜਮ੍ਹਾਂ|ਜਮ੍ਹਾ|ਜਮਾਂ|ਜਮਾ|ਪੈਸੇ ਪਾ[\p{L}\p{M}]*/,
      /জমা|টাকা রাখ[\p{L}\p{M}]*/,
      /செலுத்த[\p{L}\p{M}]*|டெபாசிட்|பணம் போட[\p{L}\p{M}]*|\b(?:seluth|panam pod)\w*/,
      /ಜಮ[ಾೆ]|ಠೇವಣಿ|ಹಣ(?:ವನ್ನು)? ಹಾಕ[\p{L}\p{M}]*|\b(?:jame|hana haa?k\w*)\b/,
    ],
    opening: [
      /\bopen(?:ing)?\s+(?:(?:a|an|the|new)\s+)?(?:bank\s+)?account\b|\bnew\s+(?:bank\s+)?account\b|\baccount\s+opening\b/,
      /(?:नया|नए|नयी)\s+(?:बैंक\s+)?(?:खाता|अकाउंट)|(?:खाता|अकाउंट)\s+(?:खोल|खुलवा)[\p{L}\p{M}]*|(?:खोल|खुलवा)[\p{L}\p{M}]*\s+(?:नया\s+)?(?:खाता|अकाउंट)/,
      /ਨਵ[ਾਂੀ]\s+(?:ਬੈਂਕ\s+)?(?:ਖਾਤਾ|ਅਕਾਊਂਟ)|(?:ਖਾਤਾ|ਅਕਾਊਂਟ)\s+ਖੋਲ[\p{L}\p{M}]*|\b(?:nava|nawan)\s+khata\b/,
      /নতুন\s+(?:(?:ব্যাঙ্ক|ব্যাংক)\s+)?(?:অ্যাকাউন্ট|একাউন্ট|খাতা)|(?:অ্যাকাউন্ট|খাতা)\s+খুল[\p{L}\p{M}]*|\bnotun\s+(?:account|khata)\b/,
      /புதிய\s+கணக்கு|கணக்கு\s+(?:திற[\p{L}\p{M}]*|தொடங்க[\p{L}\p{M}]*)|\b(?:pudhiya|puthiya)\s+kanakku\b/,
      /ಹೊಸ\s+ಖಾತೆ|ಖಾತೆ\s+ತೆರ[\p{L}\p{M}]*|\bhosa\s+khate\b/,
      /\b(?:naya|nayaa)\s+(?:khata|account)\b|\bkhata\s+khol\w*\b/,
      /\b(?:open(?:ing)? (?:an? |the )?(?:new |savings? )?(?:bank )?account|new (?:bank )?account|account opening)\b/,
      /(?:नया|नए|नयी) (?:बैंक )?(?:खाता|अकाउंट|एकाउंट|account)|(?:खाता|अकाउंट|एकाउंट|account) (?:खोल|खुलवा)[\p{L}\p{M}]*|\b(?:naya|nava|nawa) (?:bank )?(?:kha?ata|account)\b|\b(?:kha?ata|account) (?:khol|khul)\w*/,
      /ਨਵਾਂ (?:ਬੈਂਕ )?(?:ਖਾਤਾ|ਅਕਾਊਂਟ)|(?:ਖਾਤਾ|ਅਕਾਊਂਟ) (?:ਖੋਲ|ਖੁਲ)[\p{L}\p{M}]*/,
      /নতুন (?:ব্যাংক )?(?:অ্যাকাউন্ট|একাউন্ট|খাতা)|(?:অ্যাকাউন্ট|একাউন্ট|খাতা) (?:খোল|খুল)[\p{L}\p{M}]*|\b(?:notun|natun) (?:bank )?(?:account|khata)\b/,
      /புதி(?:ய|தாக) (?:வங்கி(?:க்)? )?கணக்க[\p{L}\p{M}]*|கணக்க[\p{L}\p{M}]* (?:திற|தொடங்க)[\p{L}\p{M}]*|\b(?:pudhiya|puthiya|pudhu) (?:kanakku|account)\b/,
      /ಹೊಸ (?:ಬ್ಯಾಂಕ್ )?ಖಾತೆ[\p{L}\p{M}]*|ಖಾತೆ[\p{L}\p{M}]* (?:ತೆರೆ|ಆರಂಭ)[\p{L}\p{M}]*|\bhosa (?:khaate|khate|account)\b/,
    ],
  };

  const menuPhrases = [
    /\b(?:go back|take me back)\b(?! to (?!the (?:menu|services|start)|service selection))|\b(?:start (?:over|again)|restart|(?:change|switch|choose another|choose a different) (?:the |my |this |to another )?service|wrong (?:service|option|one|button)|(?:misspoke|said (?:it|that) wrong|made a mistake)|(?:picked|selected|chose) (?:the )?wrong)\b/,
    /वाप[सि] (?:जा|चल|ले|कर)|पीछे (?:जा|चल)|(?:फिर से|दोबारा|शुरू से) (?:शुरू|स्टार्ट|कर)|गलत (?:बोल|कह|कर दिया|चुन|चयन|सेवा|विकल्प|दबा)|सेवा बदल|\b(?:wa?pas|vaapas|vapas|wapas|pichhe) (?:ja|chal)\w*|\b(?:galat (?:bol|keh|chun|kar diya)|phir se (?:shuru|start))\b/,
    /ਵਾਪ[ਸਿ] (?:ਜਾ|ਚਲ|ਲੈ)|ਪਿੱਛੇ (?:ਜਾ|ਚਲ)|(?:ਮੁੜ|ਦੁਬਾਰਾ|ਫੇਰ) (?:ਤੋਂ )?ਸ਼?[ੁੂ]ਰੂ|[ਗਗ਼]ਲਤ (?:ਕਹਿ|ਬੋਲ|ਚੁਣ|ਦੱਸ|ਸੇਵਾ)|ਸੇਵਾ ਬਦਲ|\b(?:pichhe|pichhe nu) (?:ja|chalo)|\b(?:galat (?:keh|chun)|fer (?:ton )?shuru)/,
    /ফিরে (?:যা|চল)|পিছনে যা|পেছনে যা|আবার শুরু|ভুল (?:বল|বলে|করেছি|করে ফেলেছি|বেছ|চয়ন|পরিষেবা)|(?:সেবা|পরিষেবা) (?:বদল|পাল্টা)|\b(?:phire|fire) (?:jan|jao)|\babar shuru/,
    /பின்(?:னால்|னே|னாடி)? (?:போ|செல்)|திரும்பி? (?:போ|செல்)|மீண்டும் (?:தொடங்கு|ஆரம்பி)|தப்பா(?:க)? (?:சொல்|சொன்|தேர்வு)|தவறா(?:க|ன) (?:சொல்|சொன்|தேர்ந்|தேர்வு|சேவை)|சேவையை மாற்று|\b(?:thirumbi|tirumbi|pinnadi) (?:po|sel)|\bmeendum (?:thodangu|aarambi)/,
    /ಹಿಂದ[ಕೆಗ]ೆ? (?:ಹೋಗ|ಬನ್ನಿ)|ಹಿಂದಕ್ಕೆ (?:ಹೋಗ|ಬನ್ನಿ)|ಮತ್ತೆ (?:ಪ್ರಾರಂಭ|ಶುರು|ಆರಂಭ)|ತಪ್ಪಾ(?:ಗಿ|ದ) (?:ಹೇಳ|ಆಯ್ಕೆ|ಸೇವೆ)|ತಪ್ಪು (?:ಹೇಳ|ಸೇವೆ)|ಸೇವೆ(?:ಯನ್ನು)? ಬದಲ|\b(?:hinde|hindakke) (?:hogu|hogi)|\bmatte (?:shuru|prarambha)/,
  ];

  const restart = /\b(?:start over|start again|restart|begin again|reset (?:the )?(?:session|conversation)|shuru se|fir se shuru|phir se shuru)\b|फिर से (?:शुरू|स्टार्ट)|दोबारा (?:शुरू|स्टार्ट)|दुबारा (?:शुरू|स्टार्ट)|शुरू से|नए सिरे से|ਮੁੜ\s*(?:ਤੋਂ\s*)?ਸ਼ੁਰੂ|ਦੁਬਾਰਾ\s*ਸ਼ੁਰੂ|ਫੇਰ\s*ਸ਼ੁਰੂ|আবার\s*শুরু|নতুন\s*করে\s*শুরু|மீண்டும்\s*(?:தொடங்க|ஆரம்பி)|முதலில்\s*இருந்து|ಮತ್ತೆ\s*(?:ಪ್ರಾರಂಭ|ಆರಂಭ)|ಮೊದಲಿನಿಂದ/iu;
  const back = /\b(?:go back|go to previous|previous step|take me back|back please|back|pichhe|peeche|wapas|vaapas|wapis|vapas)\b|वापस|वापिस|पीछे\s*(?:जाओ|चलो|ले)|ਪਿੱਛੇ|ਵਾਪਸ|পিছনে|পেছনে|ফিরে\s*(?:যাও|যেতে)|பின்னால்|திரும்பி\s*(?:போ|செல்)|முந்தைய\s*(?:பக்கம்|படி)|ಹಿಂದೆ|ಹಿಂದಿನ\s*ಹಂತ|ವಾಪಸ್/iu;
  const wrong = /\b(?:wrong (?:service|choice|option)|i (?:made a mistake|said (?:it|that) wrong|chose (?:the )?wrong)|mistake|galat (?:bola|bol diya|chun|kar diya)|galti ho)\b|गलत\s*(?:बोल|कर|चुन|चयन)|गलती\s*(?:हो|हुई|कर)|ग़लत|ਗਲਤ|ਗਲਤੀ|ভুল\s*(?:বল|বেছ|হয়ে|কর)|தவறாக|தப்பா|தவறு|ತಪ್ಪಾಗಿ|ತಪ್ಪು/iu;
  const change = /\b(?:change|switch|choose (?:a )?different|another|other)\s+(?:(?:my|the|a)\s+)?(?:service|option|form)\b|(?:सेवा|सर्विस|विकल्प)\s*(?:बदल|चेंज)|(?:दूसरी|अलग)\s*(?:सेवा|सर्विस)|(?:ਸੇਵਾ|ਚੋਣ)\s*ਬਦਲ|ਹੋਰ\s*ਸੇਵਾ|(?:সেবা|পরিষেবা)\s*(?:বদল|পরিবর্তন)|অন্য\s*পরিষেবা|(?:சேவை|விருப்பம்)\s*மாற்ற|வேறு\s*சேவை|(?:ಸೇವೆ|ಆಯ್ಕೆ)\s*ಬದಲ|ಬೇರೆ\s*ಸೇವೆ/iu;
  const patterns = Object.entries(services).map(([service, expressions]) => [
    service,
    new RegExp(expressions.map(expression => expression.source).join('|'), 'gu'),
  ]);
  const unsupportedDeposit = /\b(?:fixed|term|recurring) deposits?\b|(?:सावधि|आवर्ती|मियादी) जमा|फिक्स्ड डिपॉजिट|ਮਿਆਦੀ ਜਮ੍ਹਾਂ|স্থায়ী আমানত|நிரந்தர வைப்பு|ನಿಶ್ಚಿತ ಠೇವಣಿ/gu;
  const negativeBefore = /(?:\b(?:do not|don't|dont|not|instead of|rather than|no more|cancel|(?:accidentally|mistakenly) (?:chose|picked|selected|said))|गलती से|ਗਲਤੀ ਨਾਲ)\s+(?:(?:want|wish|need|mean|meant|like|to|make|making|the|a|an|cash|money)\s+)*$/u;
  // Indic negatives commonly follow the verb. Stop at a clause boundary so
  // "deposit, I don't want to withdraw" retains the first positive request.
  const negativeAfter = [
    /^(?:\s+(?:money|cash|form))*\s+(?:is wrong|was wrong|was a mistake|by mistake|by accident|accidentally|is incorrect)\b/,
    /^(?:\s+(?:फॉर्म|नए|को|में|करना|करनी|करने|करवाना|करवाने|कर|खोलना|खोलने|है|मुझे|पैसे|form|karna|karni|karne|kholna|kar|hai))*\s+(?:नहीं|नही|मत|की जगह|के बजाय|nahi\w*|mat\b)/,
    /^(?:\s+(?:ਕਰਨਾ|ਕਰਨੇ|ਕਰਵਾਉਣੇ|ਕਰਵਾਉਣਾ|ਕਰਾਉਣਾ|ਕਰ|ਖੋਲ੍ਹਣਾ|ਪੈਸੇ|ਮੈਨੂੰ|ਨੇ))*\s+(?:ਨਹੀਂ|ਨਹੀ|ਦੀ ਥਾਂ)/,
    /^(?:\s+(?:করতে|করা|দিতে|করব|চাই|হবে|খুলতে|খুলব))*\s+(?:না(?:ই)?(?:\s|$)|নয়|নয়|বদলে|করব না)/,
    /^(?:\s+(?:செய்ய|திறக்க|தொடங்க|வைக்க|பண்ண|எடுக்க))*\s+(?:வேண்டாம்|வேணாம்|இல்லை|பதிலாக|vendam|venaam)/,
    /^(?:\s+(?:ಮಾಡಲು|ಮಾಡೋದು|ಮಾಡುವುದು|ಮಾಡೋಕೆ|ಮಾಡ|ತೆರೆಯಲು))*\s+(?:ಬೇಡ|ಅಲ್ಲ|ಬದಲು|beda)/,
    /^(?:\s+(?:dite|korte|chai|khulte|karna|karne|karvau\w*|paise|paisa|madalu|maadalu|tereyalu|seyya|seiyya|thirakka))*\s+(?:na|na[hiy]+|vendam|venaam|beda|alla)\b/,
  ];
  const boundary = /[,;.!?।]|\b(?:but|instead i|actually|however)\b|लेकिन|बल्कि|ਪਰੰਤੂ|কিন্তু|ஆனால்|ಆದರೆ/u;

  function parse(raw) {
    const text = String(raw || '').normalize('NFKC').toLowerCase()
      .replace(/[’‘]/g, "'").replace(/[\u200b-\u200d]/g, '').replace(/\s+/g, ' ').trim();
    if (restart.test(text)) return { action: 'restart' };
    const commandText = text.replace(unsupportedDeposit, ' ');
    const hasUnsupported = commandText !== text;
    const mentions = [];
    for (const [service, pattern] of patterns) {
      for (const match of commandText.matchAll(pattern)) {
        mentions.push({ service, start: match.index, end: match.index + match[0].length });
      }
    }
    mentions.sort((a, b) => a.start - b.start || b.end - a.end);
    // Several scripts and transliterations share aliases for the same service.
    // Evaluate each occurrence once, with its longest matching phrase.
    for (let i = mentions.length - 1; i > 0; i--) {
      const previous = mentions[i - 1], current = mentions[i];
      if (previous.service === current.service && previous.end > current.start) {
        previous.end = Math.max(previous.end, current.end);
        mentions.splice(i, 1);
      }
    }
    if (!mentions.length) {
      // A customer may be correcting a field on the review screen.
      const field = /\b(?:name|amount|occupation|date of birth)\b|नाम|राशि|पेशा|ਨਾਮ|ਰਕਮ|ਕਿੱਤਾ|নাম|পরিমাণ|পেশা|பெயர்|தொகை|தொழில்|ಹೆಸರು|ಮೊತ್ತ|ವೃತ್ತಿ/u;
      if (wrong.test(commandText) && field.test(commandText) && !change.test(commandText)) return null;
      if (wrong.test(commandText) || change.test(commandText)) return {action:'choose'};
      if (back.test(commandText) && !/\bback to (?:my )?work\b/u.test(commandText)) return {action:'back'};
      if (menuPhrases.some(pattern => pattern.test(commandText))) return {action:'choose'};
      return hasUnsupported ? { action: 'unsupported' } : null;
    }
    const choices = [];
    for (let index = 0; index < mentions.length; index++) {
      const mention = mentions[index];
      const before = commandText.slice(mentions[index - 1]?.end || 0, mention.start).split(boundary).pop();
      const after = commandText.slice(mention.end, mentions[index + 1]?.start).split(boundary)[0];
      const prefixNegation = /(?:नहीं|नही|ਨਹੀਂ|নয়|না)\s*$/u.test(before) && !index;
      const embeddedNegation = /(?:ಬೇಡ|வேண்டாம்)$/u.test(commandText.slice(mention.start,mention.end));
      if (prefixNegation || embeddedNegation || negativeBefore.test(before) || negativeAfter.some(pattern => pattern.test(after))) continue;
      choices.push(mention.service);
    }
    const replacingProduct = /\b(?:not|don't|instead|rather than|actually|but)\b|नहीं|बल्कि|ਨਹੀਂ|চাই না|வேண்டாம்|ಬೇಡ/u.test(text);
    if (hasUnsupported && (!choices.length || !replacingProduct)) {
      return { action: 'unsupported' };
    }
    return choices.length ? { action: 'service', service: choices[choices.length - 1] } : { action: 'choose' };
  }

  const copy={
    en:{short:'Back',button:'← Correct / Back',title:'What would you like to do?',back:'Go back one step',choose:'Choose another service',restart:'Start over',cancel:'Keep working',choosePrompt:'No problem. Please choose the service you need.',restartPrompt:'Let us start again.',},
    hi:{short:'वापस',button:'← सुधारें / वापस',title:'आप क्या करना चाहते हैं?',back:'एक कदम पीछे जाएँ',choose:'दूसरी सेवा चुनें',restart:'फिर से शुरू करें',cancel:'यहीं जारी रखें',choosePrompt:'कोई बात नहीं। अब सही सेवा चुनिए।',restartPrompt:'फिर से शुरू करते हैं।'},
    pa:{short:'ਪਿੱਛੇ',button:'← ਸੋਧੋ / ਪਿੱਛੇ',title:'ਤੁਸੀਂ ਕੀ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?',back:'ਇੱਕ ਕਦਮ ਪਿੱਛੇ ਜਾਓ',choose:'ਦੂਜੀ ਸੇਵਾ ਚੁਣੋ',restart:'ਮੁੜ ਸ਼ੁਰੂ ਕਰੋ',cancel:'ਇੱਥੇ ਹੀ ਜਾਰੀ ਰੱਖੋ',choosePrompt:'ਕੋਈ ਗੱਲ ਨਹੀਂ। ਹੁਣ ਆਪਣੀ ਸੇਵਾ ਚੁਣੋ।',restartPrompt:'ਮੁੜ ਸ਼ੁਰੂ ਕਰਦੇ ਹਾਂ।'},
    bn:{short:'ফিরুন',button:'← সংশোধন / ফিরে যান',title:'আপনি কী করতে চান?',back:'এক ধাপ পিছনে যান',choose:'অন্য পরিষেবা বেছে নিন',restart:'আবার শুরু করুন',cancel:'এখানেই চালিয়ে যান',choosePrompt:'কোনো সমস্যা নেই। এবার আপনার পরিষেবা বেছে নিন।',restartPrompt:'আবার শুরু করি।'},
    ta:{short:'பின்செல்',button:'← திருத்து / பின்செல்',title:'நீங்கள் என்ன செய்ய விரும்புகிறீர்கள்?',back:'ஒரு படி பின்னால் செல்',choose:'வேறு சேவையைத் தேர்ந்தெடு',restart:'மீண்டும் தொடங்கு',cancel:'இங்கே தொடரவும்',choosePrompt:'பரவாயில்லை. இப்போது வேண்டிய சேவையைத் தேர்ந்தெடுங்கள்.',restartPrompt:'மீண்டும் தொடங்கலாம்.'},
    kn:{short:'ಹಿಂದೆ',button:'← ಸರಿಪಡಿಸಿ / ಹಿಂದೆ',title:'ನೀವು ಏನು ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?',back:'ಒಂದು ಹಂತ ಹಿಂದೆ ಹೋಗಿ',choose:'ಬೇರೆ ಸೇವೆ ಆಯ್ಕೆಮಾಡಿ',restart:'ಮತ್ತೆ ಪ್ರಾರಂಭಿಸಿ',cancel:'ಇಲ್ಲಿಯೇ ಮುಂದುವರಿಸಿ',choosePrompt:'ಪರವಾಗಿಲ್ಲ. ಈಗ ಬೇಕಾದ ಸೇವೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.',restartPrompt:'ಮತ್ತೆ ಪ್ರಾರಂಭಿಸೋಣ.'}
  };
  function wantsDownload(text){
    const command=String(text||'').normalize('NFKC').trim().toLowerCase();
    if(/\b(?:no|not|don't|dont|cancel)\b|नहीं|मत |ਨਹੀਂ|ਨਾ ਕਰੋ|করবেন না|চাই না|வேண்டாம்|ಬೇಡ/u.test(command))return false;
    return /\b(?:download|print)\b|डाउनलोड|प्रिंट|ਪ੍ਰਿੰਟ|ਡਾਊਨਲੋਡ|ডাউনলোড|প্রিন্ট|பதிவிறக்|அச்சிடு|டவுன்லோட்|ಡೌನ್[‌]?ಲೋಡ್|ಮುದ್ರಿಸು/u.test(command);
  }
  // A sample can be named in a sentence. Bare option numbers must stand alone.
  function chosePassbook(raw){
    const text=String(raw||'').normalize('NFKC').toLowerCase()
      .replace(/[\u200b-\u200d]/gu,'').replace(/[.!?,।]+/gu,' ').trim();
    if(/\b(?:not|no|don't|dont|nahi|nahin)\b|नहीं|मत |ਨਹੀਂ|করব না|চাই না|வேண்டாம்|ಬೇಡ/u.test(text))return false;
    if(/^(?:(?:option|number|the)\s+)?(?:one|first|1|पहला|पहली|ਪਹਿਲਾ|প্রথম|முதல்|ಮೊದಲ)(?:\s+(?:one|option|please))?$/u.test(text))return true;
    return /\b(?:pass\s*books?|passwords?|demo|sample)\b|पास\s*बुक|पासवर्ड|नमूना|डेमो|ডেমো|পাসবই|পাসবুক|பாஸ்புக்|டெமோ|மாதிரி|ಪಾಸ್ಬುಕ್|ಡೆಮೋ|ಡೆಮೊ|ਡੈਮੋ|ਪਾਸਬੁੱਕ|ਨਮੂਨਾ/u.test(text);
  }
  const api={parse,copy,wantsDownload,chosePassbook};
  if(typeof window!=='undefined')window.SahajServiceCorrection=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})();
