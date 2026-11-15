const $ = s => document.querySelector(s);
const screens = ['openingScreen','permissionScreen','simpleAmountScreen','v8PassbookScreen','v8AmountScreen','v8BalanceScreen','v9ReviewScreen','v9PreviewScreen','v16DepositPreviewScreen','languageScreen','voiceScreen','uploadScreen','accountConfirmScreen','formsScreen','otherFormScreen','requestScreen','withdrawalScreen','counterScreen'];
let language='en', speakingLanguage='en', speechLanguageLocked=false, displayLanguageLocked=false, languageCommandMode='unified', mode='', activeScreen='permissionScreen', languageReturnScreen='uploadScreen', recognition=null, recorder=null, recordedChunks=[], recordTimer=null, imageFile=null, currentIntent=null, flowStage='hello', passbook={name:'',account_id:'',branch:''}, detectedAmount='', realtimePeer=null, realtimeChannel=null, realtimeStream=null, realtimeBusy=false;
const copy={
 en:{permissionTitle:'Talk to your banking helper',permissionText:'Allow microphone access to speak naturally. You can choose to continue without voice at any time.',voice:'Continue with voice',retry:'Try voice again',manual:'Continue without voice',language:'Choose your language',next:'Continue',upload:'Choose a passbook',uploadDesc:'Choose one of six synthetic passbook examples. Each has a different layout or image condition.',choosePhoto:'Choose a sample passbook',tapPhoto:'Select one of the six synthetic examples below',process:'Read selected passbook',help:'How may I help you?',example:'For example: withdraw cash or deposit money.',withdraw:'I can help prepare a withdrawal draft. How much would you like to withdraw?',unsupported:'This service currently supports only cash withdrawal and cash deposit forms. The requested service is not supported. Please choose withdrawal or deposit, the services currently available at this kiosk.',unclear:'I did not understand that request. Please say or type what you need.',greeting:'How may I help you?',listening:'Listening…',speak:'🎙 Speak',stop:'Stop listening',withdrawal:'Withdrawal draft',amount:'Withdrawal amount (₹)',continueDraft:'Continue withdrawal draft',uploadBook:'Upload passbook photo',reviewDraft:'Review withdrawal draft',download:'Download withdrawal PDF draft',voiceHint:'Tap the microphone and speak. The app will try to infer your language from your words.',permissionDenied:'Microphone access was not granted. Allow it in browser site settings, then retry voice, or continue without voice.',speechUnavailable:'This browser does not provide speech recognition. Retry in a supported browser, or continue without voice.',speechError:'Speech was not recognized. Try again, or switch to manual help.',ocrReview:'OCR suggestions are unverified. Check and correct every value.',unsupportedHint:'This request is outside the withdrawal and deposit forms available in this demo.'},
 hi:{permissionTitle:'बैंकिंग सहायता के लिए बोलें',permissionText:'बात करने के लिए माइक्रोफ़ोन की अनुमति दें। आप चाहें तो बिना आवाज़ भी आगे बढ़ सकते हैं।',voice:'आवाज़ के साथ आगे बढ़ें',retry:'आवाज़ फिर से आज़माएँ',manual:'बिना आवाज़ आगे बढ़ें',language:'अपनी भाषा चुनें',next:'आगे बढ़ें',upload:'पासबुक की तस्वीर अपलोड करें',uploadDesc:'साफ़ JPG या PNG तस्वीर चुनें। काल्पनिक या छिपी जानकारी वाला नमूना लें।',choosePhoto:'पासबुक की तस्वीर चुनें',tapPhoto:'तस्वीर लेने या चुनने के लिए यहाँ दबाएँ',process:'पासबुक की तस्वीर पढ़ें',help:'मैं आपकी कैसे मदद कर सकती हूँ?',example:'जैसे: पैसे निकालना या जमा करना।',withdraw:'मैं निकासी का मसौदा तैयार कर सकती हूँ। आप कितनी राशि निकालना चाहते हैं?',unsupported:'इस डेमो में इस काम का फ़ॉर्म अभी उपलब्ध नहीं है। कृपया बैंक कर्मचारी से मदद लें।',unclear:'मैं समझ नहीं पाई। कृपया बताइए कि आपको क्या काम करना है।',unsupported:'यह सेवा अभी उपलब्ध नहीं है। इस कियोस्क पर केवल नकद निकासी और नकद जमा की सुविधा उपलब्ध है। कृपया उपलब्ध सेवाओं में से निकासी या जमा चुनें।',greeting:'मैं आपकी कैसे मदद कर सकती हूँ?',listening:'सुन रही हूँ…',speak:'🎙 बोलें',stop:'सुनना रोकें',withdrawal:'निकासी का मसौदा',amount:'निकासी की राशि (₹)',continueDraft:'निकासी का मसौदा जारी रखें',uploadBook:'पासबुक की तस्वीर अपलोड करें',reviewDraft:'निकासी का मसौदा देखें',download:'निकासी PDF मसौदा डाउनलोड करें',voiceHint:'माइक्रोफ़ोन दबाकर बोलें। ऐप आपके शब्दों से भाषा पहचानने की कोशिश करेगा।',permissionDenied:'माइक्रोफ़ोन की अनुमति नहीं मिली। ब्राउज़र सेटिंग में अनुमति दें और फिर कोशिश करें, या बिना आवाज़ आगे बढ़ें।',speechUnavailable:'इस ब्राउज़र में आवाज़ पहचान उपलब्ध नहीं है। दूसरे ब्राउज़र में कोशिश करें या बिना आवाज़ आगे बढ़ें।',speechError:'आवाज़ समझ नहीं आई। फिर कोशिश करें या बिना आवाज़ मदद लें।',ocrReview:'निकाले गए विवरण पक्के नहीं हैं। हर जानकारी जाँचें और सुधारें।'},
 pa:{permissionTitle:'ਬੈਂਕ ਦੀ ਮਦਦ ਲਈ ਬੋਲੋ',permissionText:'ਗੱਲ ਕਰਨ ਲਈ ਮਾਈਕ੍ਰੋਫ਼ੋਨ ਦੀ ਇਜਾਜ਼ਤ ਦਿਓ। ਤੁਸੀਂ ਬਿਨਾਂ ਆਵਾਜ਼ ਵੀ ਅੱਗੇ ਜਾ ਸਕਦੇ ਹੋ।',voice:'ਆਵਾਜ਼ ਨਾਲ ਜਾਰੀ ਰੱਖੋ',retry:'ਆਵਾਜ਼ ਫਿਰ ਅਜ਼ਮਾਓ',manual:'ਬਿਨਾਂ ਆਵਾਜ਼ ਅੱਗੇ ਜਾਓ',language:'ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ',next:'ਅੱਗੇ ਜਾਓ',upload:'ਪਾਸਬੁੱਕ ਦੀ ਤਸਵੀਰ ਅੱਪਲੋਡ ਕਰੋ',uploadDesc:'ਸਾਫ਼ JPG ਜਾਂ PNG ਤਸਵੀਰ ਚੁਣੋ। ਕਾਲਪਨਿਕ ਜਾਂ ਲੁਕਾਈ ਜਾਣਕਾਰੀ ਵਾਲਾ ਨਮੂਨਾ ਵਰਤੋ।',choosePhoto:'ਪਾਸਬੁੱਕ ਦੀ ਤਸਵੀਰ ਚੁਣੋ',tapPhoto:'ਤਸਵੀਰ ਲੈਣ ਜਾਂ ਚੁਣਨ ਲਈ ਇੱਥੇ ਦਬਾਓ',process:'ਪਾਸਬੁੱਕ ਦੀ ਤਸਵੀਰ ਪੜ੍ਹੋ',help:'ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦੀ ਹਾਂ?',example:'ਜਿਵੇਂ: ਪੈਸੇ ਕਢਵਾਉਣਾ ਜਾਂ ਜਮ੍ਹਾਂ ਕਰਨਾ।',withdraw:'ਮੈਂ ਕਢਵਾਉਣ ਦਾ ਮਸੌਦਾ ਤਿਆਰ ਕਰ ਸਕਦੀ ਹਾਂ। ਤੁਸੀਂ ਕਿੰਨੀ ਰਕਮ ਕਢਵਾਉਣੀ ਹੈ?',unsupported:'ਇਸ ਡੈਮੋ ਵਿੱਚ ਇਸ ਕੰਮ ਦਾ ਫਾਰਮ ਹਾਲੇ ਨਹੀਂ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਬੈਂਕ ਕਰਮਚਾਰੀ ਤੋਂ ਮਦਦ ਲਵੋ।',unclear:'ਮੈਨੂੰ ਬੇਨਤੀ ਸਮਝ ਨਹੀਂ ਆਈ। ਦੱਸੋ ਤੁਹਾਨੂੰ ਕੀ ਕੰਮ ਕਰਨਾ ਹੈ।',greeting:'ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦੀ ਹਾਂ?',listening:'ਸੁਣ ਰਹੀ ਹਾਂ…',speak:'🎙 ਬੋਲੋ',stop:'ਸੁਣਨਾ ਰੋਕੋ',withdrawal:'ਕਢਵਾਉਣ ਦਾ ਮਸੌਦਾ',amount:'ਕਢਵਾਉਣ ਦੀ ਰਕਮ (₹)',continueDraft:'ਕਢਵਾਉਣ ਦਾ ਮਸੌਦਾ ਜਾਰੀ ਰੱਖੋ',uploadBook:'ਪਾਸਬੁੱਕ ਦੀ ਤਸਵੀਰ ਅੱਪਲੋਡ ਕਰੋ',reviewDraft:'ਕਢਵਾਉਣ ਦਾ ਮਸੌਦਾ ਵੇਖੋ',download:'ਕਢਵਾਉਣ ਦਾ PDF ਮਸੌਦਾ ਡਾਊਨਲੋਡ ਕਰੋ',voiceHint:'ਮਾਈਕ੍ਰੋਫ਼ੋਨ ਦਬਾ ਕੇ ਬੋਲੋ। ਐਪ ਤੁਹਾਡੇ ਸ਼ਬਦਾਂ ਤੋਂ ਭਾਸ਼ਾ ਪਛਾਣਨ ਦੀ ਕੋਸ਼ਿਸ਼ ਕਰੇਗੀ।',permissionDenied:'ਮਾਈਕ੍ਰੋਫ਼ੋਨ ਦੀ ਇਜਾਜ਼ਤ ਨਹੀਂ ਮਿਲੀ। ਬ੍ਰਾਊਜ਼ਰ ਸੈਟਿੰਗਾਂ ਵਿੱਚ ਇਜਾਜ਼ਤ ਦਿਓ, ਫਿਰ ਕੋਸ਼ਿਸ਼ ਕਰੋ ਜਾਂ ਬਿਨਾਂ ਆਵਾਜ਼ ਅੱਗੇ ਜਾਓ।',speechUnavailable:'ਇਸ ਬ੍ਰਾਊਜ਼ਰ ਵਿੱਚ ਬੋਲੀ ਦੀ ਪਛਾਣ ਉਪਲਬਧ ਨਹੀਂ। ਹੋਰ ਬ੍ਰਾਊਜ਼ਰ ਅਜ਼ਮਾਓ ਜਾਂ ਬਿਨਾਂ ਆਵਾਜ਼ ਅੱਗੇ ਜਾਓ।',speechError:'ਆਵਾਜ਼ ਸਮਝ ਨਹੀਂ ਆਈ। ਫਿਰ ਕੋਸ਼ਿਸ਼ ਕਰੋ ਜਾਂ ਹੱਥੀਂ ਮਦਦ ਲਵੋ।',ocrReview:'OCR ਸੁਝਾਅ ਪੱਕੇ ਨਹੀਂ ਹਨ। ਹਰ ਜਾਣਕਾਰੀ ਜਾਂਚੋ ਅਤੇ ਠੀਕ ਕਰੋ।'}
};
extraLangMerge(copy,'copy');

const manualCopy={
 en:{languageTitle:'Choose your language',languageDescription:'Choose a language for all manual steps.',languageNote:'Available languages: Hindi, English, Punjabi, Kannada, Tamil, and Bengali.',sampleHeading:'Choose a sample passbook',sampleDescription:'Six fictional passbooks with different layouts and image conditions. Select one to test OCR.',sampleOne:'Sample passbook 1',sampleTwo:'Sample passbook 2',sampleThree:'Sample passbook 3',accountTitle:'Confirm the account',accountIntro:'Check the number read from the image. Correct it if needed. Only this exact number is searched in the synthetic demo database.',accountLabel:'Account number',lookup:'Look up this demo account',confirm:'I confirm these matching demo details',toForms:'Continue to choose a form',changePhoto:'Choose another passbook photo',formsTitle:'Choose a form',formsIntro:'Select the form you need. Pension and cash withdrawals use the same withdrawal slip.',withdrawForm:'Sahaj Demo Bank · Withdrawal Slip',withdrawSub:'Cash or pension withdrawal',depositForm:'Sahaj Demo Bank · Deposit Slip',depositSub:'Deposit slip',sbiOpenForm:'Sahaj Demo Bank · Account Opening',idfcForm:'Sahaj Demo Bank · Transfer Request',idfcSub:'DD / RTGS / NEFT transfer',dtbForm:'Sahaj Demo Bank · Account Opening',dcbForm:'DCB Bank · Customer Request Form',dcbSub:'Customer request / account update',startOver:'Start over',reviewDetails:'Review or correct details',transactionType:'Withdrawal type',cash:'Cash withdrawal',pension:'Pension withdrawal',withdrawAmount:'Withdrawal amount (₹)',confirmAmount:'I confirm the amount and details shown above.',reviewDraft:'Review withdrawal draft',downloadDraft:'Download withdrawal PDF draft',blankForm:'Download unchanged blank withdrawal form',signatureHelp:'The supplied SBI withdrawal slip is used for cash and pension withdrawals. Confirm the amount and details before downloading. Sign on the neutral signature line beside the phone number. Leave the bank-use signature boxes blank.',sampleSafe:'SYNTHETIC SAMPLE ONLY · NOT VALID FOR BANKING'},
 hi:{languageTitle:'अपनी भाषा चुनें',languageDescription:'मैन्युअल प्रक्रिया के सभी चरणों के लिए भाषा चुनें।',languageNote:'हिन्दी, अंग्रेज़ी, पंजाबी, कन्नड़, तमिल या बंगाली चुनें।',sampleHeading:'नमूना पासबुक आज़माएँ',sampleDescription:'ये काल्पनिक डेमो दस्तावेज़ हैं। OCR जाँचने के लिए नमूना डाउनलोड करें या चुनें।',sampleOne:'नमूना पासबुक 1 · PNG डाउनलोड करें',sampleTwo:'नमूना पासबुक 2 · PNG डाउनलोड करें',sampleThree:'नमूना पासबुक 3 · PNG डाउनलोड करें',accountTitle:'खाते की पुष्टि करें',accountIntro:'तस्वीर से पढ़ा गया नंबर जाँचें और ज़रूरत हो तो सुधारें। डेमो डेटाबेस में केवल इसी नंबर को खोजा जाएगा।',accountLabel:'खाता संख्या',lookup:'यह डेमो खाता खोजें',confirm:'मैं इन डेमो जानकारियों की पुष्टि करता/करती हूँ',toForms:'फ़ॉर्म चुनने के लिए आगे बढ़ें',changePhoto:'दूसरी पासबुक तस्वीर चुनें',formsTitle:'फ़ॉर्म चुनें',formsIntro:'अपनी ज़रूरत का फ़ॉर्म चुनें। पेंशन और नकद निकासी के लिए एक ही निकासी पर्ची है।',withdrawForm:'SBI · निकासी पर्ची',withdrawSub:'नकद या पेंशन निकासी',depositForm:'SBI · जमा पर्ची',depositSub:'जमा पर्ची',sbiOpenForm:'SBI · खाता खोलने का फ़ॉर्म',idfcForm:'IDFC FIRST · एकल लेन-देन अनुरोध',idfcSub:'DD / RTGS / NEFT ट्रांसफ़र',dtbForm:'DTB · खाता खोलने का फ़ॉर्म',dcbForm:'DCB Bank · ग्राहक अनुरोध फ़ॉर्म',dcbSub:'ग्राहक अनुरोध / खाता अपडेट',startOver:'फिर शुरू करें',reviewDetails:'जानकारी देखें या सुधारें',transactionType:'निकासी का प्रकार',cash:'नकद निकासी',pension:'पेंशन निकासी',withdrawAmount:'निकासी की राशि (₹)',confirmAmount:'मैं ऊपर दिखाई गई राशि और जानकारी की पुष्टि करता/करती हूँ।',reviewDraft:'निकासी मसौदा देखें',downloadDraft:'निकासी PDF मसौदा डाउनलोड करें',blankForm:'खाली निकासी फ़ॉर्म डाउनलोड करें',signatureHelp:'नकद और पेंशन निकासी के लिए SBI की दी गई पर्ची का उपयोग होता है। डाउनलोड से पहले राशि और जानकारी जाँचें। फ़ोन नंबर के पास दिए गए हस्ताक्षर वाले स्थान पर हस्ताक्षर करें। बैंक उपयोग वाले हस्ताक्षर बॉक्स खाली छोड़ें।',sampleSafe:'केवल काल्पनिक नमूना · बैंकिंग के लिए मान्य नहीं'},
 pa:{languageTitle:'ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ',languageDescription:'ਹੱਥੀਂ ਵਰਤੋਂ ਦੇ ਸਾਰੇ ਪੜਾਵਾਂ ਲਈ ਭਾਸ਼ਾ ਚੁਣੋ।',languageNote:'ਹਿੰਦੀ, ਅੰਗਰੇਜ਼ੀ, ਪੰਜਾਬੀ, ਕੰਨੜ, ਤਮਿਲ ਜਾਂ ਬੰਗਾਲੀ ਚੁਣੋ।',sampleHeading:'ਨਮੂਨਾ ਪਾਸਬੁੱਕ ਅਜ਼ਮਾਓ',sampleDescription:'ਇਹ ਕਾਲਪਨਿਕ ਡੈਮੋ ਦਸਤਾਵੇਜ਼ ਹਨ। OCR ਜਾਂਚਣ ਲਈ ਨਮੂਨਾ ਡਾਊਨਲੋਡ ਕਰੋ ਜਾਂ ਚੁਣੋ।',sampleOne:'ਨਮੂਨਾ ਪਾਸਬੁੱਕ 1 · PNG ਡਾਊਨਲੋਡ ਕਰੋ',sampleTwo:'ਨਮੂਨਾ ਪਾਸਬੁੱਕ 2 · PNG ਡਾਊਨਲੋਡ ਕਰੋ',sampleThree:'ਨਮੂਨਾ ਪਾਸਬੁੱਕ 3 · PNG ਡਾਊਨਲੋਡ ਕਰੋ',accountTitle:'ਖਾਤੇ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ',accountIntro:'ਤਸਵੀਰ ਤੋਂ ਪੜ੍ਹਿਆ ਨੰਬਰ ਜਾਂਚੋ ਅਤੇ ਲੋੜ ਹੋਵੇ ਤਾਂ ਠੀਕ ਕਰੋ। ਡੈਮੋ ਡਾਟਾਬੇਸ ਵਿੱਚ ਸਿਰਫ਼ ਇਹੀ ਨੰਬਰ ਲੱਭਿਆ ਜਾਵੇਗਾ।',accountLabel:'ਖਾਤਾ ਨੰਬਰ',lookup:'ਇਹ ਡੈਮੋ ਖਾਤਾ ਲੱਭੋ',confirm:'ਮੈਂ ਇਹਨਾਂ ਡੈਮੋ ਵੇਰਵਿਆਂ ਦੀ ਪੁਸ਼ਟੀ ਕਰਦਾ/ਕਰਦੀ ਹਾਂ',toForms:'ਫਾਰਮ ਚੁਣਨ ਲਈ ਅੱਗੇ ਜਾਓ',changePhoto:'ਹੋਰ ਪਾਸਬੁੱਕ ਤਸਵੀਰ ਚੁਣੋ',formsTitle:'ਫਾਰਮ ਚੁਣੋ',formsIntro:'ਆਪਣੀ ਲੋੜ ਦਾ ਫਾਰਮ ਚੁਣੋ। ਪੈਨਸ਼ਨ ਅਤੇ ਨਕਦ ਕਢਵਾਉਣ ਲਈ ਇੱਕੋ ਪਰਚੀ ਵਰਤੀ ਜਾਂਦੀ ਹੈ।',withdrawForm:'SBI · ਕਢਵਾਉਣ ਦੀ ਪਰਚੀ',withdrawSub:'ਨਕਦ ਜਾਂ ਪੈਨਸ਼ਨ ਕਢਵਾਉਣਾ',depositForm:'SBI · ਜਮ੍ਹਾਂ ਪਰਚੀ',depositSub:'ਜਮ੍ਹਾਂ ਪਰਚੀ',sbiOpenForm:'SBI · ਖਾਤਾ ਖੋਲ੍ਹਣ ਦਾ ਫਾਰਮ',idfcForm:'IDFC FIRST · ਇਕੱਲੀ ਲੈਣ-ਦੇਣ ਬੇਨਤੀ',idfcSub:'DD / RTGS / NEFT ਟ੍ਰਾਂਸਫ਼ਰ',dtbForm:'DTB · ਖਾਤਾ ਖੋਲ੍ਹਣ ਦਾ ਫਾਰਮ',dcbForm:'DCB Bank · ਗਾਹਕ ਬੇਨਤੀ ਫਾਰਮ',dcbSub:'ਗਾਹਕ ਬੇਨਤੀ / ਖਾਤਾ ਅੱਪਡੇਟ',startOver:'ਮੁੜ ਸ਼ੁਰੂ ਕਰੋ',reviewDetails:'ਵੇਰਵੇ ਵੇਖੋ ਜਾਂ ਠੀਕ ਕਰੋ',transactionType:'ਕਢਵਾਉਣ ਦੀ ਕਿਸਮ',cash:'ਨਕਦ ਕਢਵਾਉਣਾ',pension:'ਪੈਨਸ਼ਨ ਕਢਵਾਉਣਾ',withdrawAmount:'ਕਢਵਾਉਣ ਦੀ ਰਕਮ (₹)',confirmAmount:'ਮੈਂ ਉੱਪਰ ਦਿੱਤੀ ਰਕਮ ਅਤੇ ਵੇਰਵਿਆਂ ਦੀ ਪੁਸ਼ਟੀ ਕਰਦਾ/ਕਰਦੀ ਹਾਂ।',reviewDraft:'ਕਢਵਾਉਣ ਦਾ ਮਸੌਦਾ ਵੇਖੋ',downloadDraft:'ਕਢਵਾਉਣ ਦਾ PDF ਮਸੌਦਾ ਡਾਊਨਲੋਡ ਕਰੋ',blankForm:'ਖਾਲੀ ਕਢਵਾਉਣ ਦਾ ਫਾਰਮ ਡਾਊਨਲੋਡ ਕਰੋ',signatureHelp:'ਨਕਦ ਅਤੇ ਪੈਨਸ਼ਨ ਕਢਵਾਉਣ ਲਈ ਦਿੱਤੀ SBI ਪਰਚੀ ਵਰਤੀ ਜਾਂਦੀ ਹੈ। ਡਾਊਨਲੋਡ ਤੋਂ ਪਹਿਲਾਂ ਰਕਮ ਅਤੇ ਵੇਰਵੇ ਜਾਂਚੋ। ਫ਼ੋਨ ਨੰਬਰ ਕੋਲ ਲਾਲ SIGN HERE ਬਾਕਸ ਵਿੱਚ ਦਸਤਖ਼ਤ ਕਰੋ। ਬੈਂਕ-ਵਰਤੋਂ ਵਾਲੇ ਦਸਤਖ਼ਤ ਬਾਕਸ ਖਾਲੀ ਛੱਡੋ।',sampleSafe:'ਸਿਰਫ਼ ਕਾਲਪਨਿਕ ਨਮੂਨਾ · ਬੈਂਕਿੰਗ ਲਈ ਵੈਧ ਨਹੀਂ'}
};
extraLangMerge(manualCopy,'manualCopy');
const manualMessages={en:{reading:'Reading passbook locally…',noOcr:'No account number was read confidently. Enter the account number printed in the sample.',ocrCheck:'OCR suggestion: {number}. Check the digits, then look it up.',invalid:'Enter the 8–12 digit account number printed in a synthetic sample passbook.',checking:'Checking this exact account against the demo database…',notFound:'No matching synthetic demo account. Check the number or use one of the sample passbooks.',found:'Record found. Review all details above.',review:'Review the matching customer details and confirm before continuing.',ocrError:'Could not process this image: {error}',databaseError:'Account lookup failed: {error}',nameNotRead:'name not read',matched:'Matching fictional customer details came from the demo database. Confirm before continuing.'},hi:{reading:'पासबुक की जानकारी स्थानीय रूप से पढ़ी जा रही है…',noOcr:'खाता संख्या नहीं पढ़ी जा सकी। नमूने पर छपी संख्या दर्ज करें।',ocrCheck:'OCR सुझाव: {number}। अंक जाँचें, फिर खाता खोजें।',invalid:'काल्पनिक नमूना पासबुक पर छपी 8–12 अंकों की खाता संख्या दर्ज करें।',checking:'इस सटीक खाते को डेमो डेटाबेस में खोजा जा रहा है…',notFound:'इस काल्पनिक डेमो खाते की संख्या नहीं मिली। नंबर जाँचें या नमूना पासबुक चुनें।',found:'रिकॉर्ड मिला। ऊपर दी गई जानकारी जाँचें।',review:'आगे बढ़ने से पहले ग्राहक की जानकारी जाँचकर पुष्टि करें।',ocrError:'तस्वीर पढ़ी नहीं जा सकी: {error}',databaseError:'खाता खोजने में समस्या: {error}',nameNotRead:'नाम नहीं पढ़ा गया',matched:'ग्राहक की काल्पनिक जानकारी डेमो डेटाबेस से मिली है। आगे बढ़ने से पहले पुष्टि करें।'},pa:{reading:'ਪਾਸਬੁੱਕ ਦੀ ਜਾਣਕਾਰੀ ਸਥਾਨਕ ਤੌਰ ਉੱਤੇ ਪੜ੍ਹੀ ਜਾ ਰਹੀ ਹੈ…',noOcr:'ਖਾਤਾ ਨੰਬਰ ਨਹੀਂ ਪੜ੍ਹਿਆ ਗਿਆ। ਨਮੂਨੇ ਉੱਤੇ ਛਪਿਆ ਨੰਬਰ ਦਰਜ ਕਰੋ।',ocrCheck:'OCR ਸੁਝਾਅ: {number}। ਅੰਕ ਜਾਂਚੋ, ਫਿਰ ਖਾਤਾ ਲੱਭੋ।',invalid:'ਕਾਲਪਨਿਕ ਨਮੂਨਾ ਪਾਸਬੁੱਕ ਉੱਤੇ ਛਪਿਆ 8–12 ਅੰਕਾਂ ਦਾ ਖਾਤਾ ਨੰਬਰ ਦਰਜ ਕਰੋ।',checking:'ਇਹ ਖਾਤਾ ਡੈਮੋ ਡਾਟਾਬੇਸ ਵਿੱਚ ਲੱਭਿਆ ਜਾ ਰਿਹਾ ਹੈ…',notFound:'ਇਹ ਕਾਲਪਨਿਕ ਡੈਮੋ ਖਾਤਾ ਨਹੀਂ ਮਿਲਿਆ। ਨੰਬਰ ਜਾਂਚੋ ਜਾਂ ਨਮੂਨਾ ਪਾਸਬੁੱਕ ਵਰਤੋ।',found:'ਰਿਕਾਰਡ ਮਿਲ ਗਿਆ। ਉੱਪਰਲੇ ਵੇਰਵੇ ਜਾਂਚੋ।',review:'ਅੱਗੇ ਜਾਣ ਤੋਂ ਪਹਿਲਾਂ ਗਾਹਕ ਦੇ ਵੇਰਵੇ ਜਾਂਚ ਕੇ ਪੁਸ਼ਟੀ ਕਰੋ।',ocrError:'ਤਸਵੀਰ ਪੜ੍ਹੀ ਨਹੀਂ ਜਾ ਸਕੀ: {error}',databaseError:'ਖਾਤਾ ਲੱਭਣ ਵਿੱਚ ਅਸਫਲ: {error}',nameNotRead:'ਨਾਮ ਨਹੀਂ ਪੜ੍ਹਿਆ ਗਿਆ',matched:'ਕਾਲਪਨਿਕ ਗਾਹਕ ਦੇ ਵੇਰਵੇ ਡੈਮੋ ਡਾਟਾਬੇਸ ਤੋਂ ਮਿਲੇ ਹਨ। ਅੱਗੇ ਜਾਣ ਤੋਂ ਪਹਿਲਾਂ ਪੁਸ਼ਟੀ ਕਰੋ।'}};
extraLangMerge(manualMessages,'manualMessages');
function manualMessage(key,values={}){let value=(manualMessages[language]||manualMessages.en)[key]||manualMessages.en[key]||key;for(const [name,replacement] of Object.entries(values))value=value.replace('{'+name+'}',replacement);return value}
const words=code=>copy[code]||copy.en;
let counterEndTimer=null;
function updateAmountLabel(){
  const label=document.getElementById('amountLabel');if(!label||!label.firstChild)return;
  const dep=currentIntent==='deposit';
  const depositText=pick({en:'Deposit amount (₹)',hi:'जमा राशि (₹)',pa:'ਜਮ੍ਹਾਂ ਰਕਮ (₹)'},language)||'Deposit amount (₹)';
  label.firstChild.textContent=(dep?depositText:words(language).amount)+' ';
}
// Gnani speech recognition and voice playback
// The Gnani key lives on the server. The page only asks /api/voice/speak for audio and POSTs recorded speech to /api/voice/transcribe.
// When Gnani cannot answer (unsupported language, outage, no voice configured) the page uses browser speech and the dev badge names the engine that handled the turn.
const GNANI={primary:false,langs:{}};let gnaniAudio=null;const gnaniDownUntil={};
async function loadVoiceProviders(){try{const r=await fetch('/api/voice/fallback');if(!r.ok)return;const d=await r.json();GNANI.primary=d.primary==='gnani';GNANI.langs=(d.gnani&&d.gnani.languages)||{}}catch(e){console.warn('Voice provider status unavailable',e)}}
function cancelGnaniAudio(){const a=gnaniAudio;gnaniAudio=null;if(a){try{a.pause()}catch{}try{a.onended&&a.onended()}catch{}}}
function gnaniSpeak(text,code){const promptAudio = gnaniSpeak.cache ??= new Map();const speechToken=window.sahajSpeechGeneration;return new Promise(async resolve=>{
  const lang=GNANI.langs[code];
  if(!GNANI.primary||!lang||!lang.tts||!text||text.length>600||Date.now()<(gnaniDownUntil[code]||0)){resolve(false);return}
  try{
    const cacheKey = JSON.stringify([code,text]);
    let audioBlob = promptAudio.get(cacheKey);
    if (!audioBlob) {
      const r=await fetch('/api/voice/speak',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,language:code}),signal:AbortSignal.timeout(20000)});
      if(!r.ok){gnaniDownUntil[code]=Date.now()+60000;resolve(false);return}
      const provider = r.headers.get('X-Voice-Provider');
      window.sahajVoiceEvidence=Object.assign(window.sahajVoiceEvidence||{},{tts:provider||'server (provider not reported)'});
      audioBlob = await r.blob();
      if(provider==='gnani' && speechToken===window.sahajSpeechGeneration && audioBlob.size<=1000000){
        if(promptAudio.size>=12) promptAudio.delete(promptAudio.keys().next().value);
        promptAudio.set(cacheKey,audioBlob);
      }
    }
    if(speechToken!==window.sahajSpeechGeneration){resolve(true);return}const url=URL.createObjectURL(audioBlob),a=new Audio(url);gnaniAudio=a;
    let done=false;const finish=ok=>{if(done)return;done=true;URL.revokeObjectURL(url);if(gnaniAudio===a)gnaniAudio=null;resolve(ok)};
    a.onended=()=>finish(true);a.onerror=()=>finish(false);a.play().then(()=>{window.dispatchEvent(new Event('sahaj:voice-ready'));setDevBadge('server-stt','gnani-tts')}).catch(()=>finish(false));
  }catch(e){gnaniDownUntil[code]=Date.now()+60000;resolve(false)}
})}
function show(id){if(!screens.includes(id))id='permissionScreen';if(activeScreen==='v9PreviewScreen'&&id!=='v9PreviewScreen')window.sahajV11?.cancelSequence?.('withdrawal');if(activeScreen==='v16DepositPreviewScreen'&&id!=='v16DepositPreviewScreen')window.sahajV11?.cancelSequence?.('deposit');if(activeScreen==='openingScreen'&&id!=='openingScreen')window.sahajV11?.cancelSequence?.('opening');activeScreen=id;try{updateAmountLabel()}catch{}screens.forEach(x=>$('#'+x).hidden=x!==id);const switcher=$('#switchLanguage');if(switcher)switcher.hidden=!(mode==='manual'&&!['permissionScreen','languageScreen','voiceScreen','counterScreen'].includes(id));if(id!=='voiceScreen'&&id!=='requestScreen')setListeningVisual(false);window.scrollTo({top:0,behavior:'smooth'});if(id==='counterScreen'){localizeCounter();clearTimeout(counterEndTimer);/* Keep the handoff visible until the customer ends the session. *//* Counter speech is started after screen transition by the kiosk flow. */}window.dispatchEvent(new CustomEvent('sahaj:screen',{detail:{id}}));}
function endSession(){gnaniSpeak.cache?.clear();cancelIdleEnd();clearSilenceReask();silenceReaskCount=0;silenceReaskHinted=false;customerHasSpoken=false;setDevBadge('off');clearTimeout(counterEndTimer);counterEndTimer=null;speechLanguageLocked=false;displayLanguageLocked=false;window.sahajDetectedScreenLanguage=false;disconnectRealtimeVoice();speechRestartAllowed=false;try{speechRecognition?.stop()}catch{}try{window.speechSynthesis?.cancel()}catch{}currentIntent=null;detectedAmount='';flowStage='hello';passbook={name:'',account_id:'',branch:'',phone:'',profile:null};imageFile=null;$('#image').value='';$('#preview').hidden=true;$('#formPassbookPreview').hidden=true;$('#extract').disabled=true;$('#amount').value='';$('#requestedAmount').value='';$('#utterance').value='';$('#confirm').checked=false;$('#review').hidden=true;$('#download').hidden=true;resetIntentActions();mode='';show('permissionScreen');applyMicPermissionState(micPermissionGranted?'granted':'prompt');$('#permissionStatus').textContent='Session ended. Start again when ready.';$('#fallbackActions').hidden=false;}
function voicePrompt(code){return pick({en:'Say hello or namaste to begin. Listening turns on after the greeting; use Stop to pause.',hi:'शुरू करने के लिए नमस्ते कहें। अभिवादन के बाद सुनना शुरू होगा; रोकने के लिए Stop दबाएँ।',pa:'ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਸਤ ਸ੍ਰੀ ਅਕਾਲ ਕਹੋ। ਜਵਾਬ ਤੋਂ ਬਾਅਦ ਸੁਣਨਾ ਸ਼ੁਰੂ ਹੋਵੇਗਾ; ਰੋਕਣ ਲਈ Stop ਦਬਾਓ।'},code)}
const counterCopy={
 en:{title:'Next step: Counter 1',instruction:'Your form has been downloaded. Take the printed form to Counter 1 for withdrawal or deposit assistance.',current:'Counter 1 · Go here next',currentDesc:'Withdrawal and deposit',second:'Counter 2',secondDesc:'Account and other services',disclaimer:'This is a simulated counter directory for the demo. No bank transaction has been submitted. End the session when you are ready.',done:'End session'},
 hi:{title:'अगला चरण: काउंटर 1',instruction:'आपका फ़ॉर्म डाउनलोड हो गया है। निकासी या जमा में सहायता के लिए प्रिंट किया हुआ फ़ॉर्म काउंटर 1 पर ले जाएँ।',current:'काउंटर 1 · यहाँ जाएँ',currentDesc:'निकासी और जमा',second:'काउंटर 2',secondDesc:'खाता और अन्य सेवाएँ',disclaimer:'यह डेमो के लिए नकली काउंटर सूची है। कोई बैंक लेन-देन जमा नहीं किया गया है। तैयार होने पर सत्र समाप्त करें।',done:'सत्र समाप्त करें'},
 pa:{title:'ਅਗਲਾ ਕਦਮ: ਕਾਊਂਟਰ 1',instruction:'ਤੁਹਾਡਾ ਫਾਰਮ ਡਾਊਨਲੋਡ ਹੋ ਗਿਆ ਹੈ। ਨਿਕਾਸੀ ਜਾਂ ਜਮ੍ਹਾਂ ਦੀ ਮਦਦ ਲਈ ਛਪਿਆ ਫਾਰਮ ਕਾਊਂਟਰ 1 ਤੇ ਲੈ ਜਾਓ।',current:'ਕਾਊਂਟਰ 1 · ਇੱਥੇ ਜਾਓ',currentDesc:'ਨਿਕਾਸੀ ਅਤੇ ਜਮ੍ਹਾਂ',second:'ਕਾਊਂਟਰ 2',secondDesc:'ਖਾਤਾ ਅਤੇ ਹੋਰ ਸੇਵਾਵਾਂ',disclaimer:'ਇਹ ਡੈਮੋ ਲਈ ਨਕਲੀ ਕਾਊਂਟਰ ਸੂਚੀ ਹੈ। ਕੋਈ ਬੈਂਕ ਲੈਣ-ਦੇਣ ਜਮ੍ਹਾਂ ਨਹੀਂ ਕੀਤਾ ਗਿਆ। ਤਿਆਰ ਹੋਣ ਤੇ ਸੈਸ਼ਨ ਖ਼ਤਮ ਕਰੋ।',done:'ਸੈਸ਼ਨ ਖਤਮ ਕਰੋ'}};
extraLangMerge(counterCopy,'counterCopy');
// Counter numbers are configured on the server (app/config/counter_directory.json). The translated copy was written for Counter 1,
// so the number is substituted from the server's answer rather than hardcoded per screen.
let counterInfo={number:1,label:'',staff:false};
const COUNTER_WORD=/(Counter|\u0915\u093e\u0909\u0902\u091f\u0930|\u0a15\u0a3e\u0a0a\u0a02\u0a1f\u0a30|কাউন্টার|கவுண்டர்|ಕೌಂಟರ್|\u06a9\u0627\u0624\u0646\u0679\u0631)\s*[-–]?\s*[1১](?!\d)/g;
function withCounter(str){return String(str).replace(COUNTER_WORD,(m,w)=>w+' '+counterInfo.number)}
async function loadCounter(serviceOrForm){counterInfo={number:serviceOrForm==='account_opening'?2:1,label:'',staff:false};try{const r=await fetch('/api/counters/'+encodeURIComponent(serviceOrForm));if(r.ok){const d=await r.json();counterInfo={number:d.counter,label:d.counter_label||'',staff:!!d.staff_assistance}}}catch(e){console.warn('Counter lookup failed; showing default guidance',e)}}

const v11Timers={withdrawal:0,deposit:0,opening:0};
function clearV11Timer(key){if(v11Timers[key]){clearTimeout(v11Timers[key]);v11Timers[key]=0;}}
function v11GuideCopy(form,code=language){
 const map={
  hi:{withdrawal:{title:'क्या करना है',chips:[['sign','हरा = हस्ताक्षर']],items:['प्रिंट किए गए फ़ॉर्म के हरे बॉक्स में आपको हस्ताक्षर करने हैं।','आपका फ़ॉर्म शीघ्र डाउनलोड होगा।'],auto:'फ़ॉर्म 2 सेकंड में डाउनलोड होगा।'},deposit:{title:'क्या करना है',chips:[['sign','हरा = हस्ताक्षर']],items:['प्रिंट किए गए फ़ॉर्म के हरे बॉक्स में आपको हस्ताक्षर करने हैं।','बाकी जानकारी डेमो रिकॉर्ड से भरी गई है।','आपका फ़ॉर्म शीघ्र डाउनलोड होगा।'],auto:'फ़ॉर्म 2 सेकंड में डाउनलोड होगा।'},opening:{title:'क्या करना है',chips:[['photo','लाल = फोटो'],['sign','हरा = हस्ताक्षर'],['attach','नीला = संलग्न करें']],items:['लाल बॉक्स में ग्राहक की फोटो चिपकानी है।','प्रिंट किए गए फ़ॉर्म के हरे बॉक्स में आपको हस्ताक्षर करने हैं।','आधार की प्रति और पैन की प्रति साथ लाएँ।'],auto:'फ़ॉर्म 2 सेकंड में डाउनलोड होगा।'}},
  en:{withdrawal:{title:'What to do next',chips:[['sign','Green = sign here']],items:['Please sign in the green box on the printed form.','Your form will download shortly.'],auto:'Your form will download in 2 seconds.'},deposit:{title:'What to do next',chips:[['sign','Green = sign here']],items:['Please sign in the green box on the printed form.','Other details are filled from the demo record.','Your form will download shortly.'],auto:'Your form will download in 2 seconds.'},opening:{title:'What to do next',chips:[['photo','Red = paste photo'],['sign','Green = sign here'],['attach','Blue = attach documents']],items:['Paste the customer photograph in the red box.','Please sign in the green box on the printed form.','Please attach an Aadhaar copy and a PAN copy.'],auto:'Your form will download in 2 seconds.'}}
 };
 if(code==='pa')return {title:'ਦਸਤਖ਼ਤ ਕਰੋ',chips:[['sign','ਹਰਾ = ਇੱਥੇ ਦਸਤਖ਼ਤ ਕਰੋ']],items:['ਛਪੇ ਫਾਰਮ ਦੇ ਹਰੇ ਬਾਕਸ ਵਿੱਚ ਦਸਤਖ਼ਤ ਕਰੋ।','ਤੁਹਾਡਾ ਫਾਰਮ ਜਲਦੀ ਡਾਊਨਲੋਡ ਹੋਵੇਗਾ।'],auto:'ਫਾਰਮ ਜਲਦੀ ਡਾਊਨਲੋਡ ਹੋਵੇਗਾ।'};return (map[code]||map.en)[form]||map.en.withdrawal;
}
function v11GuideHtml(form){const c=v11GuideCopy(form);const chips=c.chips.map(([cls,label])=>`<span class="v11-chip ${cls}">${label}</span>`).join('');const items=c.items.map(x=>`<li>${x}</li>`).join('');return `<h3>${c.title}</h3><div class="v11-legend">${chips}</div><ul>${items}</ul>`;}
function setPreviewGuide(form,{guideId,statusId,signId,photoId}={}){
 const guide=document.getElementById(guideId||''); if(guide){guide.innerHTML=v11GuideHtml(form); guide.hidden=false;}
 const status=document.getElementById(statusId||''); if(status)status.textContent=v11GuideCopy(form).auto;
 const sign=document.getElementById(signId||''); if(sign)sign.hidden=!['withdrawal','deposit','opening'].includes(form);
 const photo=document.getElementById(photoId||''); if(photo)photo.hidden=form!=='opening';
 const legacy=document.getElementById('sampleSignatureCue'); if(legacy)legacy.hidden=form!=='deposit';
}
async function announceGuide(form){
 const c=v11GuideCopy(form,speakingLanguage);
 // The instructions remain visible while being read. Do not advance after a fixed
 // timer started at page load: wait until the spoken guidance completes.
 const items=[...c.items];
 if(form==='opening' && window.SahajOpeningFlow?.noPan && items.length>=3)items[2]=speakingLanguage==='hi'?'पैन नहीं होने की घोषणा इसी ड्राफ्ट में है।':'Your draft includes the no-PAN declaration.';
 if(form==='opening' && speakingLanguage!=='pa')items.push(speakingLanguage==='hi'?'आपका फ़ॉर्म अपने आप डाउनलोड होगा।':'Your form will download automatically.');
 const sentence=items.join(' ');
 if(typeof say!=='function')return;
 await new Promise(resolve=>{
   let done=false;
   const finish=()=>{if(done)return;done=true;clearTimeout(watchdog);resolve()};
   const watchdog=setTimeout(finish,Math.max(10000,Math.min(30000,sentence.length*130)));
   Promise.resolve(say(sentence,speakingLanguage,finish)).catch(finish);
 });
}
const v16SequenceTokens={withdrawal:0,deposit:0,opening:0};
function cancelSequence(key){v16SequenceTokens[key]=(v16SequenceTokens[key]||0)+1;clearV11Timer(key)}
async function queueAfterGuidance(key,action,statusId,isCurrent=()=>true){
 const token=++v16SequenceTokens[key];clearV11Timer(key);
 const status=document.getElementById(statusId);
 if(status)status.textContent=language==='hi'?'कृपया फ़ॉर्म देखें। हस्ताक्षर की जगह हरे रंग में दिखाई गई है।':'Please review the full form and the colored guidance.';
 await announceGuide(key);
 if(token!==v16SequenceTokens[key]||!isCurrent())return;
 if(status)status.textContent=language==='hi'?'आपका फ़ॉर्म 2 सेकंड में डाउनलोड के लिए भेजा जाएगा।':'Your form will be sent for download in 2 seconds.';
 await new Promise(resolve=>{v11Timers[key]=setTimeout(resolve,2000)});
 if(token!==v16SequenceTokens[key]||!isCurrent())return;
 if(status)status.textContent=language==='hi'?'अब डाउनलोड शुरू करने की कोशिश की जा रही है।':'Requesting your download now…';
 try{await action()}catch(e){if(status)status.textContent='Automatic download could not start. Please use Download now.';console.warn('Download request failed',e)}
}
window.sahajV11={setPreviewGuide,announceGuide,queueAfterGuidance,cancelSequence,clearV11Timer,v11GuideCopy};
function localizeCounter(){const t=counterCopy[language]||counterCopy.en;for(const [id,key] of [['counterTitle','title'],['counterInstruction','instruction'],['counterCurrentTitle','current'],['counterCurrentDesc','currentDesc'],['counterSecondTitle','second'],['counterSecondDesc','secondDesc'],['counterDisclaimer','disclaimer'],['counterDone','done']]){const el=$('#'+id);if(el)el.textContent=withCounter(t[key])}
  // The stock instruction mentions withdrawal/deposit help; for any other counter use a neutral sentence (have a native speaker review pa/ur).
  if(counterInfo.number!==1){const g={en:'Your form has been downloaded. Take the printed form to Counter 1.',hi:'आपका फ़ॉर्म डाउनलोड हो गया है। प्रिंट किया हुआ फ़ॉर्म काउंटर 1 पर ले जाएँ।',pa:'ਤੁਹਾਡਾ ਫਾਰਮ ਡਾਊਨਲੋਡ ਹੋ ਗਿਆ ਹੈ। ਛਪਿਆ ਹੋਇਆ ਫਾਰਮ ਕਾਊਂਟਰ 1 ਤੇ ਲੈ ਜਾਓ।'};const el=$('#counterInstruction');if(el)el.textContent=withCounter(g[language]||TR(language,g.en))}
  const desc=$('#counterCurrentDesc'),second=$('#counterSecondTitle')?.parentElement;if(counterInfo.number!==1){if(desc)desc.textContent=(language==='en'&&counterInfo.label)?counterInfo.label:'';if(second)second.hidden=true}else if(second)second.hidden=false}
function localize(){const w=words(language);const languageSwitch=$('#switchLanguage');if(languageSwitch)languageSwitch.textContent=(pick({en:'Switch language',hi:'भाषा बदलें',pa:'ਭਾਸ਼ਾ ਬਦਲੋ'},language)||'Switch language');document.documentElement.lang=language;document.documentElement.dir='ltr';$('#languageScreen h1').textContent=w.language;$('#languageNext').textContent=w.next;$('#uploadScreen h1').textContent=w.upload;$('#uploadScreen>p').textContent=w.uploadDesc;const uploadTileTitle=$('.upload-tile strong');if(uploadTileTitle)uploadTileTitle.textContent=w.choosePhoto;const uploadTileHint=$('.upload-tile span:last-child');if(uploadTileHint)uploadTileHint.textContent=w.tapPhoto;$('#extract').textContent=w.process;$('#requestTitle').textContent=w.help;$('#requestDescription').textContent=w.example;$('#utterance').placeholder=w.example;$('#requestVoice').textContent=w.speak;$('#requestManual').textContent=w.manual;$('#requestStop').textContent=w.stop;if(mode!=='voice'){$('#voiceGreeting').textContent=w.greeting;$('#voiceHint').textContent=voicePrompt(language)}$('#listen').textContent=w.speak;$('#stop').textContent=w.stop;$('#listening').textContent=listenWord(language);$('#requestListening').textContent=w.listening;$('#listening').textContent=w.listening;$('#withdrawalScreen h1').textContent=w.withdrawal;$('#amountLabel').firstChild.textContent=w.amount+' ';$('#continueWithdrawal').textContent=w.continueDraft;$('#continueUpload').textContent=w.uploadBook;$('#prepare').textContent=w.reviewDraft;$('#download').textContent=w.download;applyManualLocale();refreshAmountBox();localizeCounter();try{updateAmountLabel()}catch{}window.dispatchEvent(new Event('sahaj:locale'));}
function applyManualLocale(){const t=manualCopy[language]||manualCopy.en;for(const key of ['languageTitle','languageDescription','languageNote','sampleHeading','sampleDescription','sampleOne','sampleTwo','sampleThree','uploadTitle','uploadDescription','accountTitle','accountIntro','accountLabel','formsTitle','formsIntro']){const el=$('#'+key);if(el&&t[key]){if(key==='accountLabel')el.firstChild.textContent=t[key]+' ';else el.textContent=t[key];}}$('#lookupAccount').textContent='Confirm account number & continue';$('#confirmProfileText').textContent=t.confirm;$('#continueToForms').textContent=t.toForms;$('#changePhoto').textContent=t.changePhoto;$('#formsBack').textContent=t.startOver;$('#withdrawalTitle').textContent=words(language).withdrawal;$('#holderLabel').firstChild.textContent=(pick({en:'Account holder name',hi:'खाताधारक का नाम',pa:'ਖਾਤਾਧਾਰਕ ਦਾ ਨਾਮ'},language))+' ';$('#accountNumberLabel').firstChild.textContent=(pick({en:'Account number',hi:'खाता संख्या',pa:'ਖਾਤਾ ਨੰਬਰ'},language))+' ';$('#phoneLabel').firstChild.textContent=(pick({en:'Phone number',hi:'फ़ोन नंबर',pa:'ਫ਼ੋਨ ਨੰਬਰ'},language))+' ';$('#branchLabel').firstChild.textContent=(pick({en:'Branch',hi:'शाखा',pa:'ਸ਼ਾਖਾ'},language))+' ';$('#profileDataNote').textContent=(pick({en:'Customer and account data come from the confirmed demo record. Check OCR suggestions.',hi:'ग्राहक और खाते की जानकारी पुष्टि किए गए डेमो रिकॉर्ड से है। OCR सुझाव जाँचें।',pa:'ਗਾਹਕ ਅਤੇ ਖਾਤੇ ਦੇ ਵੇਰਵੇ ਪੁਸ਼ਟੀ ਕੀਤੇ ਡੈਮੋ ਰਿਕਾਰਡ ਤੋਂ ਹਨ। OCR ਸੁਝਾਅ ਜਾਂਚੋ।'},language));$('#transactionLabel').firstChild.textContent=t.transactionType+' ';$('#amountLabel').firstChild.textContent=t.withdrawAmount+' ';$('#confirmAmountText').textContent=t.confirmAmount;$('#prepare').textContent=t.reviewDraft;$('#download').textContent=t.downloadDraft;$('.blank-template').textContent=t.blankForm;$('#withdrawalScreen details summary').textContent=t.reviewDetails;$('#signatureHelp').innerHTML=t.signatureHelp.replace('SIGN HERE','<strong>SIGN HERE</strong>');const footer=$('#footerText');if(footer)footer.textContent=t.sampleSafe;document.querySelectorAll('[data-sample]').forEach(b=>b.textContent=(pick({en:'Use this sample',hi:'इस नमूने का उपयोग करें',pa:'ਇਹ ਨਮੂਨਾ ਵਰਤੋ'},language)));document.querySelectorAll('[data-sample]').forEach(b=>b.textContent=(pick({en:'Select this passbook',hi:'इस पासबुक को चुनें',pa:'ਇਹ ਪਾਸਬੁੱਕ ਚੁਣੋ'},language)));document.querySelectorAll('[data-form]').forEach((button,i)=>{const strong=button.querySelector('strong'),span=button.querySelector('span');const titles=[t.withdrawForm,t.depositForm,t.sbiOpenForm,t.idfcForm,t.dtbForm,t.dcbForm],subs=[t.withdrawSub,t.depositSub,'',t.idfcSub,'',t.dcbSub];if(strong&&titles[i])strong.textContent=titles[i];if(span&&subs[i])span.textContent=subs[i]});$('#withdrawalType').options[0].text=t.cash;$('#withdrawalType').options[1].text=t.pension;$('#formsBack').textContent=t.startOver;
 const ui={en:{switch:'Switch language',preview:'Preview completed form',download:'Download PDF after reviewing preview',back:'Choose another form',passbook:'Account-holder details are filled from the matched account record.',notice:'Enter only the deposit amount. Other fields are filled automatically from the account record.',fields:{name:'Account holder name',account:'Account number',branch:'Branch',phone:'Phone number',amount:'Deposit amount (INR)'}},hi:{switch:'भाषा बदलें',preview:'फ़ॉर्म का पूर्वावलोकन देखें',download:'पूर्वावलोकन जाँचकर PDF डाउनलोड करें',back:'दूसरा फ़ॉर्म चुनें',passbook:'खाताधारक की जानकारी मिलान किए गए खाते से भरी गई है।',notice:'केवल जमा राशि दर्ज करें। बाकी जानकारी खाते से अपने आप भरी जाएगी।',fields:{name:'खाताधारक का नाम',account:'खाता संख्या',branch:'शाखा',phone:'फ़ोन नंबर',amount:'जमा राशि (₹)'}},pa:{switch:'ਭਾਸ਼ਾ ਬਦਲੋ',preview:'ਭਰੇ ਫਾਰਮ ਦੀ ਝਲਕ ਵੇਖੋ',download:'ਝਲਕ ਜਾਂਚ ਕੇ PDF ਡਾਊਨਲੋਡ ਕਰੋ',back:'ਹੋਰ ਫਾਰਮ ਚੁਣੋ',passbook:'ਖਾਤਾਧਾਰਕ ਦੇ ਵੇਰਵੇ ਮਿਲਾਏ ਖਾਤੇ ਤੋਂ ਭਰੇ ਗਏ ਹਨ।',notice:'ਸਿਰਫ਼ ਜਮ੍ਹਾਂ ਰਕਮ ਦਰਜ ਕਰੋ। ਬਾਕੀ ਵੇਰਵੇ ਖਾਤੇ ਤੋਂ ਆਪਣੇ ਆਪ ਭਰੇ ਜਾਣਗੇ।',fields:{name:'ਖਾਤਾਧਾਰਕ ਦਾ ਨਾਮ',account:'ਖਾਤਾ ਨੰਬਰ',branch:'ਸ਼ਾਖਾ',phone:'ਫ਼ੋਨ ਨੰਬਰ',amount:'ਜਮ੍ਹਾਂ ਰਕਮ (₹)'}}};
 const u=ui[language]||(EXTRA_UI.includes(language)?XT[language].ui:null)||ui.en;$('#switchLanguage').textContent=u.switch;$('#previewSampleForm').textContent=u.preview;$('#downloadSampleForm').textContent=u.download;$('#otherFormBack').textContent=u.back;if($('#otherFormPassbook').textContent)$('#otherFormPassbook').textContent=u.passbook;if($('#otherFormNotice').textContent)$('#otherFormNotice').textContent=u.notice;document.querySelectorAll('#selectedFormFields input[data-field]').forEach(input=>{const label=input.parentElement;if(label&&label.firstChild&&u.fields[input.dataset.field])label.firstChild.textContent=u.fields[input.dataset.field]});}
function languageFromLocale(locale){locale=(locale||'').toLowerCase();if(locale.startsWith('hi'))return'hi';if(locale.startsWith('pa'))return'pa';if(locale.startsWith('kn'))return'kn';if(locale.startsWith('ta'))return'ta';if(locale.startsWith('bn'))return'bn';return locale.startsWith('en')?'en':''}
function detectLanguage(text){if(/\b(?:sat\s+sri\s+akal|sat\s+sri\s+akaal|satsriakal)\b/i.test(text)||/[\u0a00-\u0a7f]/.test(text))return'pa';if(/[\u0c80-\u0cff]/.test(text))return'kn';if(/[\u0b80-\u0bff]/.test(text))return'ta';if(/[\u0980-\u09ff]/.test(text))return'bn';if(/\b(?:namaste|namaskar|mujhe|mujhko|paise|paisa|nikal|nikalne|nikalna|jama|karna|hai|hain|chahiye)\b/i.test(text)||/[\u0900-\u097f]/.test(text))return'hi';return'en'}
// Which language was actually spoken? Returns '' when the words give no real evidence (digits, "yes", "rupees"...), so those never flip the screen.
function detectSpokenLanguage(text){
  const t=String(text||'').normalize('NFC').trim();
  if(!t||isAmountOnlyVoiceTurn(t))return '';
  // Punjabi is sometimes transcribed in Devanagari, especially when the model is biased to Hindi.
  if(/(?:कड्ढ|कड्ड|कढ़|कड़|कढ|कड्ड|ਕਢ|ਕੱਢ)/u.test(t))return 'pa';
  if(/[\u0a00-\u0a7f]/u.test(t))return 'pa';
  if(/[\u0980-\u09ff]/u.test(t))return 'bn';
  if(/[\u0b80-\u0bff]/u.test(t))return 'ta';
  if(/[\u0c80-\u0cff]/u.test(t))return 'kn';
  if(/\b(?:sat\s*sri\s*akaal|satsriakal|mainu|menu|chahida|chahide|kaddhna|kadhne|kadhvauna|paise\s+kadh)\b/i.test(t))return 'pa';
  if(/\b(?:ami|amar|amake|taka|tulbo|tulte|tulতে|jom[a-z]*|joma|chai|lagbe|bangla|bengali)\b/i.test(t))return 'bn';
  if(/\b(?:enakku|ennaku|enaku|edukka|eduka|edukkanum|selutha|seluthanum|tamil|tamizh)\b/i.test(t)||/\b(?:panam|kaasu|kasu)\s+(?:eduk\w*|seluth\w*|poda|podanum)\b/i.test(t))return 'ta';
  if(/\b(?:nanage|nange|nanag[e]?|tegeyabeku|tegeyalu|tegedukolli|himpadey\w*|kannada)\b/i.test(t)||/\b(?:hana|hanavannu)\s+(?:tege\w*|jame|jama|haak\w*|hak\w*)\b/i.test(t)||/\b(?:jame|jama)\s+mad\w*\b/i.test(t))return 'kn';
  if(/[\u0900-\u097f]/u.test(t))return 'hi';
  if(/\b(?:namaste|namaskar|mujhe|mujhko|mera|meri|paise|paisa|rupaye|nikal\w*|jama|karna|karni|chahiye|haan|nahi|hai|hain|kya|aap)\b/i.test(t))return 'hi';
  const fillers=/^(?:yes|no|ok|okay|yeah|yep|please|thanks?|rupees?|rs|one|two|three|four|five|six|seven|eight|nine|ten|twenty|hundred|thousand|lakh|crore)$/i;
  const words=(t.match(/[A-Za-z]{2,}/g)||[]).filter(w=>!fillers.test(w));
  return /\b(?:help|withdraw|deposit|want|need|account|money|can|could|what|how|open|cash|hello)\b/i.test(t)||words.length>=3?'en':'';
}
function followSpokenLanguage(spoken,providerLanguage=''){
  if(isAmountOnlyVoiceTurn(spoken))return;
  const reported=languageFromLocale(providerLanguage);
  const inferred=detectSpokenLanguage(spoken);
  // An empty provider hint must not default to English.
  // Prefer an unmistakable regional phrase when a recognizer mislabels it as English or Hindi.
  const strongRegional=inferred&& !['en','hi'].includes(inferred);
  const detected=strongRegional&&['en','hi'].includes(reported)?inferred:(providerLanguage&&SUPPORTED_UI.includes(reported)?reported:inferred);
  if(!detected||!SUPPORTED_UI.includes(detected))return;
  if(!speechLanguageLocked)speakingLanguage=detected;
  if(!displayLanguageLocked && language!==detected){
    language=detected;
    window.sahajDetectedScreenLanguage=true;
    try{localize()}catch(error){console.warn('Could not update language',error)}
  }
}
function opener(code){return pick({en:'Hello!',hi:'नमस्ते!',pa:'ਸਤ ਸ੍ਰੀ ਅਕਾਲ!'},code)||'Hello!'}
function recognitionLocale(code){return{en:'en-IN',hi:'hi-IN',pa:'pa-Guru-IN',kn:'kn-IN',ta:'ta-IN',bn:'bn-IN'}[code]||'en-IN'}
function synthLocale(code){return{en:'en-IN',hi:'hi-IN',pa:'pa-IN',kn:'kn-IN',ta:'ta-IN',bn:'bn-IN'}[code]||'en-IN'}
function amountReply(code,amount){return pick({en:`I heard ₹${amount}. Say another amount to change it, or continue the draft on screen.`,hi:`आपने ₹${amount} कहा। बदलने के लिए नई राशि बोलें, या स्क्रीन पर मसौदा आगे बढ़ाएँ।`,pa:`ਤੁਸੀਂ ₹${amount} ਕਿਹਾ। ਬਦਲਣ ਲਈ ਨਵੀਂ ਰਕਮ ਬੋਲੋ, ਜਾਂ ਸਕ੍ਰੀਨ ਉੱਤੇ ਮਸੌਦਾ ਅੱਗੇ ਵਧਾਓ।`},code)}
function amountClarify(code){return pick({en:'Please say the amount using digits, or type it in the amount box.',hi:'राशि अंक में बोलें या राशि वाले खाने में टाइप करें।',pa:'ਰਕਮ ਅੰਕਾਂ ਵਿੱਚ ਬੋਲੋ ਜਾਂ ਰਕਮ ਵਾਲੇ ਖਾਨੇ ਵਿੱਚ ਲਿਖੋ।'},code)}
function isAffirmative(text){return/^(yes|yeah|correct|ठीक|हाँ|हां|हांजी|हां जी|ਹਾਂ|ਹਾਂਜੀ|ಹೌದು|ಸರಿ|ஆம்|ஆமாம்|சரி|হ্যাঁ|হাঁ|ঠিক আছে|ঠিক)[!?.\s]*$/i.test(text.trim())}
function isGreeting(text){return/^(hello|hi|namaste|namaskar|नमस्ते|नमस्कार|ਸਤ\s*ਸ੍ਰੀ\s*ਅਕਾਲ|ನಮಸ್ಕಾರ|ನಮಸ್ತೆ|வணக்கம்|নমস্কার|নমস্তে)[!?.\s]*$/i.test(text.trim())}
async function say(text,code=speakingLanguage,onend=null){clearSilenceReask();if(!text){onend?.();return}if(geminiActive()){geminiNote('Tell the customer exactly this: '+text,code);if(onend&&onend!==startRecognition)onend();return}speechCancelled=false;if(mode==='voice'){listeningUI(false);setListeningVisual(false);$('#listening').hidden=true;$('#requestListening').hidden=true;showVoiceStatus('Speaking…');$('#requestTranscript').hidden=true;$('#requestResult').hidden=true;$('#voiceChat').replaceChildren()}if(await gnaniSpeak(text,code)){setListeningVisual(false);if(!speechCancelled)onend?.();return}if(window.speechSynthesis&&window.SpeechSynthesisUtterance){window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=synthLocale(code);try{const vs=await getVoicesWhenReady();const v=chooseVoice(vs,[synthLocale(code)]);if(v)u.voice=v;else if(['pa',...EXTRA_UI].includes(code)){/* No browser voice installed for this language: keep the text on screen instead of mispronouncing it. */showVoiceStatus(text);onend?.();return}}catch(e){console.debug('Voice lookup failed',e)}u.onstart=()=>{setListeningVisual(false);$('#listening').hidden=true;$('#requestListening').hidden=true};let sayDone=false,sayWd=null;const sayFinish=()=>{if(sayDone)return;sayDone=true;clearTimeout(sayWd);setListeningVisual(false);if(!speechCancelled)onend?.()};sayWd=setTimeout(()=>{if(sayDone)return;try{window.speechSynthesis.cancel()}catch{}sayFinish()},Math.max(5000,text.length*130));u.onend=sayFinish;u.onerror=sayFinish;window.speechSynthesis.speak(u)}else onend?.();}
function showVoiceStatus(message){if(['Listening…','सुन रही हूँ…','ਸੁਣ ਰਹੀ ਹਾਂ…',...EXTRA_UI.map(c=>XT[c].meta.listening)].includes(String(message||'').trim()))message='';$('#voiceStatus').textContent=message;$('#requestStatus').textContent=message}
function showLoading(title,detail='Please wait while the kiosk processes this step.'){const overlay=$('#loadingOverlay');if(!overlay)return;$('#loadingTitle').textContent=title;$('#loadingDetail').textContent=detail;overlay.hidden=false;document.body.setAttribute('aria-busy','true')}
function hideLoading(){const overlay=$('#loadingOverlay');if(overlay)overlay.hidden=true;document.body.removeAttribute('aria-busy')}
function setListeningVisual(active,{greeting=false}={}){const actuallyListening=!!active&&!greeting&&!window.speechSynthesis?.speaking&&!geminiMicPaused&&!geminiSpeaking;document.body.classList.toggle('is-listening',actuallyListening);document.body.classList.remove('greeting-mode');const badge=$('#listening');if(badge){badge.hidden=!actuallyListening;badge.textContent=listenWord(language)}const requestBadge=$('#requestListening');if(requestBadge)requestBadge.hidden=!actuallyListening;}
function loadingCopy(kind){const c={en:{gemini:['Connecting…','Setting up voice assistance'],passbook:['Reading your passbook…','Extracting details and matching the demo account']},hi:{gemini:['जुड़ रहे हैं…','आवाज़ की सहायता तैयार हो रही है'],passbook:['पासबुक पढ़ी जा रही है…','जानकारी निकाली जा रही है और खाते का मिलान हो रहा है']},pa:{gemini:['ਜੁੜ ਰਹੇ ਹਾਂ…','ਆਵਾਜ਼ ਸਹਾਇਤਾ ਤਿਆਰ ਹੋ ਰਹੀ ਹੈ'],passbook:['ਪਾਸਬੁੱਕ ਪੜ੍ਹੀ ਜਾ ਰਹੀ ਹੈ…','ਵੇਰਵੇ ਕੱਢ ਕੇ ਡੈਮੋ ਖਾਤੇ ਨਾਲ ਮਿਲਾਏ ਜਾ ਰਹੇ ਹਨ']}};return((c[language]||(EXTRA_UI.includes(language)?XT[language].loading:null)||c.en)[kind])||c.en.passbook}
function listeningUI(active){$('#listening').hidden=!active;$('#stop').hidden=!active;$('#listen').hidden=active;$('#requestListening').hidden=!active;$('#requestStop').hidden=!active;$('#requestVoice').hidden=active||mode!=='voice'}
function resetIntentActions(){for(const id of ['continueWithdrawal','continueUpload','requestVoice','requestManual'])$('#'+id).hidden=true;$('#withdrawalAmountBlock').hidden=true;$('#requestResult').hidden=true;hideRequestBalance();}
async function interpret(text,source='manual',alreadySpoken=false){const clean=text.trim();if(!clean)return;if(source==='voice'){localize();$('#requestTranscript').hidden=true;$('#requestResult').hidden=true;$('#voiceChat').replaceChildren();}const response=await fetch('/api/intent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:clean,language})});const data=await response.json();currentIntent=data.intent;resetIntentActions();let w=words(language);
 let reply=data.intent==='withdrawal'?(data.amount?amountReply(language,data.amount):w.withdraw):(data.intent==='deposit'?'I can prepare a deposit slip. First, choose your passbook and account.':(data.intent==='unsupported'?w.unsupported:(data.intent==='greeting'?w.greeting:w.unclear)));if(source==='voice'){$('#requestResult').hidden=true;$('#requestTranscript').hidden=true;show('requestScreen');$('#requestVoice').hidden=false;$('#requestManual').hidden=false;showVoiceStatus('Speaking…');say(reply,language,startRecognition)}else{$('#requestResult').textContent=reply;$('#requestResult').hidden=false}
 if(data.intent==='withdrawal'){$('#withdrawalAmountBlock').hidden=false;$('#continueWithdrawal').hidden=false;flowStage='amount';detectedAmount=data.amount||'';$('#requestedAmount').value=detectedAmount;if(mode==='voice'&&!imageFile)$('#continueUpload').hidden=false;else $('#continueUpload').hidden=true;}
 else if(data.intent==='deposit'){flowStage='request';$('#continueUpload').hidden=!(!imageFile);if(imageFile){$('#requestResult').textContent='Deposit request understood. Continue to the available forms.';$('#requestResult').hidden=false;}}
 else if(data.intent==='unsupported'){if(source==='voice')showVoiceStatus('Speaking…');}
}
function addBubble(text,cls=''){/* Voice-first kiosk intentionally does not render speech transcripts. */}
function normalizeSpokenDigits(t){return t.replace(/[०-९]/g,c=>String(c.charCodeAt(0)-0x0966)).replace(/[੦-੯]/g,c=>String(c.charCodeAt(0)-0x0A66)).replace(/[೦-೯]/g,c=>String(c.charCodeAt(0)-0x0CE6)).replace(/[௦-௯]/g,c=>String(c.charCodeAt(0)-0x0BE6)).replace(/[০-৯]/g,c=>String(c.charCodeAt(0)-0x09E6))}
function spokenNumberValue(text){const half=halfNumberValue(text);if(half)return half;
 let raw=normalizeSpokenDigits((text||'').toLowerCase()).replace(/\u095b/g,'ज').replace(/\u093c/g,'').replace(/[₹]/g,' ');
 // Join grouped digits first: 10,000 / 1,00,000 / 10 000 must stay ONE number.
 while(/(\d),(\d{2,3})(?!\d)/.test(raw))raw=raw.replace(/(\d),(\d{2,3})(?!\d)/,'$1$2');
 raw=raw.replace(/(\d{1,3})\s(\d{3})(?!\d)/g,'$1$2');
  // Sum each explicit numeric scale in compound amounts such as "2 crore 50 lakh".
  const scalePattern=/(\d+(?:\.\d+)?)\s*(billions?|millions?|crores?|करोड़|करोड|ਕਰੋੜ|lakhs?|lacs?|लाख|ਲੱਖ|thousand|hazar|hazaar|हजार|ਹਜ਼ਾਰ|ಸಾವಿರ|ஆயிரம்|হাজার|ಲಕ್ಷ|லட்சம்|লক্ষ|লাখ|hundred|सौ|ਸੌ|k(?![a-z]))/ig;
  const scaleValues={million:1000000,millions:1000000,billion:1000000000,billions:1000000000,crore:10000000,crores:10000000,'करोड़':10000000,'करोड':10000000,'ਕਰੋੜ':10000000,lakh:100000,lakhs:100000,lac:100000,lacs:100000,'लाख':100000,'ਲੱਖ':100000,thousand:1000,hazar:1000,hazaar:1000,'हजार':1000,'ਹਜ਼ਾਰ':1000,'ಸಾವಿರ':1000,'ஆயிரம்':1000,'হাজার':1000,'ಲಕ್ಷ':100000,'லட்சம்':100000,'লক্ষ':100000,'লাখ':100000,hundred:100,'सौ':100,'ਸੌ':100,k:1000};
  const scaled=[...raw.matchAll(scalePattern)];
  if(scaled.length){const v=Math.round(scaled.reduce((sum,m)=>sum+parseFloat(m[1])*(scaleValues[m[2].toLowerCase()]||1),0));if(v>0&&v<=1000000000)return String(v)}
 const s=raw.replace(/[।,!?]/g,' ').replace(/हज़ारों/g,'हजार').replace(/पाँच/g,'पांच').replace(/फाइव/g,'five').replace(/थाउज़ंड|थाउजेंड|थाउजंड/g,'thousand').replace(/रुपए|रुपया|रुपये/g,'rupees').trim();
 const digit=s.match(/\b(\d{1,10}(?:\.\d{1,2})?)\b/);if(digit&&Number(digit[1])>0)return digit[1];
 const tokens=s.split(/\s+/);
 const units={zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90,
 'शून्य':0,'एक':1,'दो':2,'तीन':3,'चार':4,'पाँच':5,'पांच':5,'छह':6,'छः':6,'सात':7,'आठ':8,'नौ':9,'दस':10,'ग्यारह':11,'बारह':12,'तेरह':13,'चौदह':14,'पंद्रह':15,'पन्द्रह':15,'सोलह':16,'सत्रह':17,'अठारह':18,'उन्नीस':19,'बीस':20,'तीस':30,'चालीस':40,'पचास':50,'साठ':60,'सत्तर':70,'अस्सी':80,'नब्बे':90,'इक्कीस':21,'बाईस':22,'तेईस':23,'चौबीस':24,'पच्चीस':25,'छब्बीस':26,'सत्ताईस':27,'अट्ठाईस':28,'अठाईस':28,'उनतीस':29,'इकतीस':31,'बत्तीस':32,'तैंतीस':33,'चौंतीस':34,'पैंतीस':35,'छत्तीस':36,'सैंतीस':37,'अड़तीस':38,'उनतालीस':39,'इकतालीस':41,'बयालीस':42,'तैंतालीस':43,'चवालीस':44,'पैंतालीस':45,'छियालीस':46,'सैंतालीस':47,'अड़तालीस':48,'उनचास':49,'इक्यावन':51,'बावन':52,'तिरपन':53,'चौवन':54,'पचपन':55,'छप्पन':56,'सत्तावन':57,'अट्ठावन':58,'उनसठ':59,'पैंसठ':65,'पचहत्तर':75,'पचासी':85,'पंचानवे':95,'twenty-five':25,'fifty-five':55,
 'ਇੱਕ':1,'ਦੋ':2,'ਤਿੰਨ':3,'ਚਾਰ':4,'ਪੰਜ':5,'ਛੇ':6,'ਸੱਤ':7,'ਅੱਠ':8,'ਨੌਂ':9,'ਦਸ':10,'ਵੀਹ':20,'ਤੀਹ':30,'ਚਾਲੀ':40,'ਪੰਜਾਹ':50,'ਇੱਕੀ':21,'ਪੱਚੀ':25,'ਸੌ':100,'দুই':2,'এক':1,'তিন':3,'চার':4,'পাঁচ':5,'ছয়':6,'সাত':7,'আট':8,'নয়':9,'দশ':10,'বিশ':20,'পঞ্চাশ':50,'একশো':100,'ஒன்று':1,'இரண்டு':2,'மூன்று':3,'நான்கு':4,'ஐந்து':5,'பத்து':10,'நூறு':100,'ಒಂದು':1,'ಎರಡು':2,'ಮೂರು':3,'ನಾಲ್ಕು':4,'ಐದು':5,'ಹತ್ತು':10,'ನೂರು':100,
 };
 const scales={million:1000000,millions:1000000,billion:1000000000,billions:1000000000,hundred:100,'सौ':100,'ਸੌ':100,'हजार':1000,'ਹਜ਼ਾਰ':1000,'ಸಾವಿರ':1000,'ஆயிரம்':1000,'হাজার':1000,'ಲಕ್ಷ':100000,'லட்சம்':100000,'লক্ষ':100000,'লাখ':100000,thousand:1000,lakh:100000,lac:100000,'लाख':100000,'ਲੱਖ':100000,crore:10000000,crores:10000000,'करोड़':10000000,'करोड':10000000,'ਕਰੋੜ':10000000,};
 let total=0,group=0,found=false;
 for(const t of tokens){if(t in units){group+=units[t];found=true}else if(t in scales){const scale=scales[t];group=Math.max(1,group)*scale;if(scale>=1000){total+=group;group=0}found=true}else if(['rupees','rupee','rs','रुपये','रुपए','रुपया','रुपयों','रुपए।','रुपये।','रुपये,','रुपये।','रुपये'].includes(t)||['है','हैं','हूँ','हूं','की','राशि','रुपये','रुपए','पैसे','कृपया','amount','please','only'].includes(t))continue;}
 const value=total+group;return found&&value>0&&value<=1000000000?String(value):'';
}
function amountWords(amount,code){
 const n=Number(amount);if(!Number.isFinite(n))return String(amount);if(EXTRA_UI.includes(code)||code==='pa')return new Intl.NumberFormat('en-IN',{maximumFractionDigits:2}).format(n)+' '+(code==='pa'?'ਰੁਪਏ':XT[code].meta.currency);
 const onesEn=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
 const tensEn=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
 const onesHi=['शून्य','एक','दो','तीन','चार','पाँच','छह','सात','आठ','नौ','दस','ग्यारह','बारह','तेरह','चौदह','पंद्रह','सोलह','सत्रह','अठारह','उन्नीस'];
 const tensHi=['','','बीस','तीस','चालीस','पचास','साठ','सत्तर','अस्सी','नब्बे'];
 const hi20=['','','बाईस'];
 function small(x,hi){const o=hi?onesHi:onesEn,t=hi?tensHi:tensEn;if(x<20)return o[x];if(x<100){const rem=x%10;return rem?(hi?(t[Math.floor(x/10)]+' '+o[rem]):(t[Math.floor(x/10)]+'-'+o[rem])):t[x/10]}return ''}
 function words(x,hi){if(x<100)return small(x,hi);if(x<1000)return (small(Math.floor(x/100),hi)+(hi?' सौ ':' hundred ')+(x%100?words(x%100,hi):'' )).trim();if(x<100000)return (words(Math.floor(x/1000),hi)+(hi?' हज़ार ':' thousand ')+(x%1000?words(x%1000,hi):'')).trim();if(x<10000000)return (words(Math.floor(x/100000),hi)+(hi?' लाख ':' lakh ')+(x%100000?words(x%100000,hi):'')).trim();if(x<1000000000)return (words(Math.floor(x/10000000),hi)+(hi?' करोड़ ':' crore ')+(x%10000000?words(x%10000000,hi):'')).trim();return String(x)}
 const hi=code==='hi';return (hi?words(Math.round(n),true):words(Math.round(n),false))+(hi?' रुपये':' rupees');
}
function affirmative(text){return /^(हाँ|हां|जी हाँ|जी हां|हाँ सही|सही है|ठीक है|yes|yeah|yep|correct|right|that is right|continue|go ahead|आगे बढ़िए|आगे बढ़ें|जारी रखें|haan|han|ji|theek hai|ਹਾਂ|ਜੀ ਹਾਂ|ಹೌದು|ಸರಿ|ஆம்|ஆமாம்|சரி|হ্যাঁ|হাঁ|ঠিক আছে|ঠিক|aama|aamam|amaam|seri|haudu|howdu|sari|hyan)[।.!\s]*$/i.test(text.trim())}
function negative(text){return /^(नहीं|नही|ना|गलत|नहीं सही|no|nope|wrong|not correct|nahin|nahi|na|ਨਹੀਂ|ਗਲਤ|ಇಲ್ಲ|ಬೇಡ|ತಪ್ಪು|இல்லை|வேண்டாம்|தவறு|না|নয়|ভুল|illai|vendam|illa|beda)[।.!\s]*$/i.test(text.trim())}
function localIntent(text){const t=text.toLowerCase();if(/निकाल|निकासी|कड़|कढ|कड्ढ|कड्ड|पैसे बाहर|पैसे निकाल|रकम निकाल|पैसा निकाल|paise nikal|paisa nikal|paise kadh|kadhwana|nikalna hai|withdraw|cash out|take out|withdrawal|ਕਢ|ਕੱਢ|ਪੈਸੇ ਕਢਵਾ|ತೆಗೆ|ಹಿಂಪಡೆ|எடு|திரும்பப் பெற|তুল|উত্তোলন|টাকা বের|টাকা নিতে|taka\s+tul\w*|tulbo|tulte|edukka|eduka|edukkanum|tegeyabeku|tegeyalu|tegedukolli|himpadey\w*/.test(t))return'withdrawal';if(/जमा|खाते में डाल|पैसे डाल|paise jama|paisa jama|jama kar|deposit|put money in|add money|ਜਮ੍ਹਾ|ਜਮਾਂ|ਪੈਸੇ ਪਾਉਣ|ಜಮಾ|ಠೇವಣಿ|ಹಣ ಹಾಕ|செலுத்த|டெபாசிட்|பணம் போட|জমা|টাকা জমা|টাকা রাখতে|joma|selutha|seluthanum|panam\s+pod\w*|hana\s+haak\w*|hana\s+hak\w*|jame/.test(t))return'deposit';if(/loan|लोन|ऋण|balance|बैलेंस|transfer|ट्रांसफर|भेजना|send money|atm|card|पासबुक अपडेट|passbook update|cheque|चेक|fixed deposit|एफडी|insurance|बीमा|statement|स्टेटमेंट|bank statement|অ্যাকাউন্ট ব্যালেন্স|ঋণ|கடன்|காசோலை|ಸಾಲ|ਕਾਰਡ/.test(t))return'unsupported';if(/अकाउंट खोल|खाता खोल|नया खाता|बैलेंस चेक|बैलेंस बत|आधार जोड़|आधार लिंक|पता बदल|मोबाइल नंबर बदल|पैसे ट्रांसफर|मुझे अकाउंट|account open|open account|account opening|new account|check balance|balance inquiry|aadhaar|aadhar|pan card|update address|change address|transfer money|send money|open a bank account|credit card|loan apply|apply for loan|मुझे लोन|लोन चाहिए/.test(t))return'unsupported';return''}
function isAmountOnlyVoiceTurn(t){return /^(?:₹?\s*[\d,]+(?:\.\d{1,2})?|yes|no|हाँ|नहीं|হ্যাঁ|না|ஆம்|இல்லை|ಹೌದು|ಇಲ್ಲ|ਹਾਂ|ਨਹੀਂ)[.!\s]*$/i.test((t||'').trim())}
function amountConfirmation(amount,code){const spoken=amountWords(amount,code);return code==='hi'?`आपने ${spoken} कहा। क्या यह राशि सही है? हाँ या नहीं कहें।`:code==='pa'?`ਤੁਸੀਂ ${spoken} ਕਿਹਾ। ਕੀ ਇਹ ਰਕਮ ਸਹੀ ਹੈ? ਹਾਂ ਜਾਂ ਨਹੀਂ ਕਹੋ।`:code==='bn'?`আপনি ${spoken} বলেছেন। পরিমাণটি কি ঠিক? হ্যাঁ বা না বলুন।`:code==='ta'?`நீங்கள் ${spoken} சொன்னீர்கள். தொகை சரியா? ஆம் அல்லது இல்லை என்று சொல்லுங்கள்.`:code==='kn'?`ನೀವು ${spoken} ಎಂದಿರಿ. ಮೊತ್ತ ಸರಿಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಎಂದು ಹೇಳಿ.`:`You said ${spoken}. Is that amount correct? Please say yes or no.`}
async function handleVoice(text,detected=''){
 if(window.voiceJourney&&mode==='voice'){return window.voiceJourney.handle(text);}
 const spoken=(text||'').trim();if(!spoken){showVoiceStatus(words(language).speechError);repromptNow();return}customerHasSpoken=true;lastActivityAt=Date.now();clearSilenceReask();silenceReaskCount=0;silenceReaskHinted=false;if(flowStage==='passbook'&&activeScreen==='uploadScreen'){const n=passbookChoiceFromSpeech(spoken);if(n){selectPassbookByNumber(n);return}}if(parseLanguagePreferenceCommand(spoken)){const response=languageChangeConfirmation();showVoiceStatus(response);await say(response,SUPPORTED_UI.includes(language)?language:'hi',()=>{speechRestartAllowed=true;const q=stagePrompt(speakingLanguage);q?say(q,speakingLanguage,startRecognition):startRecognition()});return}
 const amountOnly=/^(?:(?:₹|rs\.?|rupees?)\s*)?(?:[\d,]+(?:\.\d{1,2})?|five|fifteen|fifty|five thousand|five hundred|two thousand|three thousand|four thousand|six thousand|seven thousand|eight thousand|nine thousand|ten thousand|two crore|one crore|पाँच|पांच|पाँच सौ|पांच सौ|पाँच हजार|पांच हजार|पाँच हज़ार|पांच हज़ार|दो हजार|दो हज़ार|तीन हजार|तीन हज़ार|चार हजार|चार हज़ार|छह हजार|छह हज़ार|सात हजार|सात हज़ार|आठ हजार|आठ हज़ार|नौ हजार|नौ हज़ार|दस हजार|दस हज़ार)(?:\s+(?:rupees?|रुपये?|रुपए|रुपया|हजार|हज़ार|thousand|hundred|crore|crores|करोड़|करोड|ਕਰੋੜ))?[.!\s]*$/i.test(spoken);if(!amountOnly)followSpokenLanguage(spoken);
 $('#requestTranscript').hidden=true;$('#requestResult').hidden=true;$('#voiceChat').replaceChildren();
 if(isGreeting(spoken)){const prompt=speakingLanguage==='hi'?'जी, बताइए। आपको क्या काम करना है?':speakingLanguage==='pa'?'ਜੀ, ਦੱਸੋ। ਤੁਹਾਨੂੰ ਕੀ ਕੰਮ ਹੈ?':TR(speakingLanguage,'Sure. What would you like help with?');await say(prompt,speakingLanguage,startRecognition);return}
 {const sw=localIntent(spoken);if((sw==='withdrawal'||sw==='deposit')&&currentIntent&&currentIntent!==sw&&['amount','amount-confirmed'].includes(flowStage)){detectedAmount='';$('#requestedAmount').value='';$('#requestResult').hidden=true;flowStage='request'}}
 if(flowStage==='balance-check'){
   if(affirmative(spoken)){
     const balanceText=speakingLanguage==='hi'?`आपके खाते में अभी ${amountWords(lastKnownBalance,speakingLanguage)} हैं।`:speakingLanguage==='pa'?`ਤੁਹਾਡੇ ਖਾਤੇ ਵਿੱਚ ਇਸ ਵੇਲੇ ${amountWords(lastKnownBalance,speakingLanguage)} ਹਨ।`:TR(speakingLanguage,`Your current balance is ${amountWords(lastKnownBalance,speakingLanguage)}.`);
     $('#currentBalanceText').hidden=true;showBalanceBox(lastKnownBalance);$('#balancePrompt').hidden=false;flowStage='amount';const nextAmountPrompt=speakingLanguage==='hi'?'अब कृपया निकालने के लिए कम राशि बताइए।':speakingLanguage==='pa'?'ਹੁਣ ਕਿਰਪਾ ਕਰਕੇ ਕਢਵਾਉਣ ਲਈ ਘੱਟ ਰਕਮ ਦੱਸੋ।':TR(speakingLanguage,'Now please tell me a lower amount to withdraw.');await say(balanceSpeech(speakingLanguage),speakingLanguage,startRecognition);return;
   }
   if(negative(spoken)){flowStage='amount';hideRequestBalance();$('#balancePrompt').hidden=true;$('#amount').focus();const prompt=speakingLanguage==='hi'?'ठीक है। कृपया कम राशि दर्ज करें।':speakingLanguage==='pa'?'ਠੀਕ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਘੱਟ ਰਕਮ ਦਰਜ ਕਰੋ।':TR(speakingLanguage,'Okay. Please enter a lower amount.');await say(prompt,speakingLanguage,startRecognition);return;}
   const prompt=speakingLanguage==='hi'?'क्या आप अपना मौजूदा बैलेंस देखना चाहते हैं? हाँ या नहीं कहें।':speakingLanguage==='pa'?'ਕੀ ਤੁਸੀਂ ਮੌਜੂਦਾ ਬਕਾਇਆ ਵੇਖਣਾ ਚਾਹੁੰਦੇ ਹੋ? ਹਾਂ ਜਾਂ ਨਹੀਂ ਕਹੋ।':TR(speakingLanguage,'Would you like to see your current balance? Please say yes or no.');await say(prompt,speakingLanguage,startRecognition);return;
 }
 if(currentIntent==='withdrawal'&&flowStage==='amount-confirmed'){
   if(affirmative(spoken)){
     if(passbook.profile&&Number(detectedAmount)>Number(passbook.profile.balance||0)){lastKnownBalance=String(passbook.profile.balance||'0');flowStage='balance-check';const prompt=speakingLanguage==='hi'?'आपके खाते में इतनी राशि नहीं है। क्या आप अपना मौजूदा बैलेंस देखना चाहते हैं? हाँ या नहीं कहें।':speakingLanguage==='pa'?'ਤੁਹਾਡੇ ਖਾਤੇ ਵਿੱਚ ਇੰਨੀ ਰਕਮ ਨਹੀਂ ਹੈ। ਕੀ ਤੁਸੀਂ ਮੌਜੂਦਾ ਬਕਾਇਆ ਵੇਖਣਾ ਚਾਹੁੰਦੇ ਹੋ? ਹਾਂ ਜਾਂ ਨਹੀਂ ਕਹੋ।':TR(speakingLanguage,'Your account does not have enough balance for that withdrawal. Would you like to see your current balance? Please say yes or no.');setBalancePrompt(prompt);await say(prompt,speakingLanguage,startRecognition);return}
     if(passbook.profile){flowStage='request';showWithdrawal();speechRestartAllowed=false;try{speechRecognition?.stop()}catch{}return}
     flowStage='passbook';show('uploadScreen');const prompt=speakingLanguage==='hi'?'ठीक है। अब अपनी पासबुक चुनिए।':speakingLanguage==='pa'?'ਠੀਕ ਹੈ। ਹੁਣ ਆਪਣੀ ਪਾਸਬੁੱਕ ਚੁਣੋ।':TR(speakingLanguage,'All right. Please choose your passbook.');speechRestartAllowed=true;await say(prompt,speakingLanguage,startRecognition);return}
   if(negative(spoken)){flowStage='amount';detectedAmount='';$('#requestedAmount').value='';const prompt=speakingLanguage==='hi'?'ठीक है। सही राशि फिर से बताइए।':speakingLanguage==='pa'?'ਠੀਕ ਹੈ। ਸਹੀ ਰਕਮ ਦੁਬਾਰਾ ਦੱਸੋ।':TR(speakingLanguage,'No problem. Please say the correct amount again.');await say(prompt,speakingLanguage,startRecognition);return}
   const revised=spokenNumberValue(spoken);if(revised){detectedAmount=revised;$('#requestedAmount').value=revised;{const p=say(amountConfirmation(revised,speakingLanguage),speakingLanguage,startRecognition);showAmountBox(revised);await p}return}
   const prompt=speakingLanguage==='hi'?'क्या राशि सही है? हाँ या नहीं कहें।':speakingLanguage==='pa'?'ਕੀ ਰਕਮ ਸਹੀ ਹੈ? ਹਾਂ ਜਾਂ ਨਹੀਂ ਕਹੋ।':TR(speakingLanguage,'Is the amount correct? Please say yes or no.');await say(prompt,speakingLanguage,startRecognition);return;
 }
 if((currentIntent==='withdrawal'||currentIntent==='deposit')&&flowStage==='amount'){
   const amount=spokenNumberValue(spoken);if(amount){detectedAmount=amount;$('#requestedAmount').value=amount;flowStage='amount-confirmed';$('#withdrawalAmountBlock').hidden=false;$('#continueWithdrawal').hidden=true;show('requestScreen');{const p=say(amountConfirmation(amount,speakingLanguage),speakingLanguage,startRecognition);showAmountBox(amount);await p}return}
   if(currentIntent==='deposit'){await say(stagePrompt(speakingLanguage),speakingLanguage,startRecognition);return}
   const prompt=speakingLanguage==='hi'?'कितनी राशि निकालनी है? आप राशि बोल सकते हैं, जैसे दो हज़ार रुपये।':speakingLanguage==='pa'?'ਕਿੰਨੀ ਰਕਮ ਕਢਵਾਉਣੀ ਹੈ? ਰਕਮ ਬੋਲੋ, ਜਿਵੇਂ ਦੋ ਹਜ਼ਾਰ ਰੁਪਏ।':TR(speakingLanguage,'How much would you like to withdraw? For example, two thousand rupees.');await say(prompt,speakingLanguage,startRecognition);return;
 }
 if(currentIntent==='deposit'&&flowStage==='amount-confirmed'){
   if(affirmative(spoken)){flowStage='passbook';show('uploadScreen');const prompt=speakingLanguage==='hi'?'ठीक है। अब अपनी पासबुक चुनिए।':speakingLanguage==='pa'?'ਠੀਕ ਹੈ। ਹੁਣ ਆਪਣੀ ਪਾਸਬੁੱਕ ਚੁਣੋ।':TR(speakingLanguage,'All right. Please choose your passbook.');speechRestartAllowed=true;await say(prompt,speakingLanguage,startRecognition);return}
   if(negative(spoken)){flowStage='amount';detectedAmount='';const prompt=speakingLanguage==='hi'?'ठीक है। सही जमा राशि फिर से बताइए।':'Please say the correct deposit amount again.';await say(prompt,speakingLanguage,startRecognition);return}
 }
 try{
   const obvious=localIntent(spoken);let data;
   if(obvious==='withdrawal'||obvious==='deposit')data={intent:obvious,amount:spokenNumberValue(spoken)};else if(obvious==='unsupported')data={intent:'unsupported'};
   else {const response=await fetch('/api/intent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:spoken,language})});data=await response.json();}
   currentIntent=data.intent;
   if(data.intent==='withdrawal'||data.intent==='deposit'){
     detectedAmount=data.amount||spokenNumberValue(spoken)||'';$('#requestedAmount').value=detectedAmount;$('#withdrawalAmountBlock').hidden=false;$('#continueWithdrawal').hidden=true;$('#continueUpload').hidden=true;flowStage=detectedAmount?'amount-confirmed':'amount';show('requestScreen');
     if(detectedAmount){const p=say(amountConfirmation(detectedAmount,speakingLanguage),speakingLanguage,startRecognition);showAmountBox(detectedAmount);await p}else{const prompt=data.intent==='withdrawal'?(speakingLanguage==='hi'?'कितनी राशि निकालनी है?':speakingLanguage==='pa'?'ਕਿੰਨੀ ਰਕਮ ਕਢਵਾਉਣੀ ਹੈ?':TR(speakingLanguage,'How much would you like to withdraw?')):(speakingLanguage==='hi'?'कितनी राशि जमा करनी है?':speakingLanguage==='pa'?'ਕਿੰਨੀ ਰਕਮ ਜਮ੍ਹਾਂ ਕਰਨੀ ਹੈ?':TR(speakingLanguage,'How much would you like to deposit?'));await say(prompt,speakingLanguage,startRecognition)}
     return;
   }
   let reply;
   if(data.intent==='unsupported')reply=speakingLanguage==='hi'?'यह सेवा अभी उपलब्ध नहीं है। इस कियोस्क पर केवल नकद निकासी और नकद जमा की सुविधा उपलब्ध है। कृपया उपलब्ध सेवाओं में से निकासी या जमा चुनें।':speakingLanguage==='pa'?'ਇਹ ਸੇਵਾ ਇਸ ਵੇਲੇ ਉਪਲਬਧ ਨਹੀਂ ਹੈ। ਇਸ ਕਿਓਸਕ ਤੇ ਸਿਰਫ਼ ਨਕਦ ਕਢਵਾਉਣ ਅਤੇ ਨਕਦ ਜਮ੍ਹਾਂ ਕਰਨ ਦੀ ਸਹੂਲਤ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਉਪਲਬਧ ਸੇਵਾਵਾਂ ਵਿੱਚੋਂ ਨਿਕਾਸੀ ਜਾਂ ਜਮ੍ਹਾਂ ਚੁਣੋ।':TR(speakingLanguage,'This service is currently unavailable. This kiosk supports only cash withdrawal and cash deposit. Please choose withdrawal or deposit from the available services.');
   else reply=speakingLanguage==='hi'?'आप क्या कहना चाहते हैं? कृपया एक बार फिर बताइए।':speakingLanguage==='pa'?'ਤੁਸੀਂ ਕੀ ਕਹਿਣਾ ਚਾਹੁੰਦੇ ਹੋ? ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਦੱਸੋ।':TR(speakingLanguage,'What would you like to say? Please tell me again.');
   flowStage='request';show('requestScreen');$('#requestResult').textContent=reply;$('#requestResult').hidden=false;await say(reply,speakingLanguage,startRecognition);
 }catch(error){flowStage='request';show('requestScreen');const reply=speakingLanguage==='hi'?'आप क्या कहना चाहते हैं? कृपया एक बार फिर बताइए।':speakingLanguage==='pa'?'ਤੁਸੀਂ ਕੀ ਕਹਿਣਾ ਚਾਹੁੰਦੇ ਹੋ? ਕਿਰਪਾ ਕਰਕੇ ਇੱਕ ਵਾਰ ਫਿਰ ਦੱਸੋ।':TR(speakingLanguage,'What would you like to say? Please tell me again.');showVoiceStatus('');await say(reply,speakingLanguage,startRecognition)}
}
let geminiSocket=null, micAudioContext=null, micProcessor=null, micSource=null, playbackContext=null, playbackCursor=0, geminiAudioSources=[], geminiReady=false, geminiMicPaused=false, micPermissionGranted=false, activeMicStream=null, playbackFinishTimer=null, geminiSpeaking=false, geminiUserAudioActive=false, geminiConnectInProgress=false, geminiSetupDone=false, geminiMuteUntil=0;
// Talking over Gemini ("barge-in"). While Gemini speaks, mic audio is held back (it would be echo). If the customer's voice is clearly louder
// than echo in BARGE_IN_FRAMES of the last 5 mic frames (~85 ms each), Gemini is cut off at once and the held-back audio is sent so no words are lost.
// Raise BARGE_IN_RMS if Gemini cuts itself off on loud speakers; lower it if a quiet customer cannot interrupt.
const BARGE_IN_RMS=0.045, BARGE_IN_FRAMES=3, BARGE_IN_PREROLL=7;
let bargeInBlockedUntil=0; // set by startGreetingWatchdog: barge-in is ignored until this time so the greeting's own echo cannot cut it off
let geminiGenerating=false, geminiDropAudio=false, geminiBargedInAt=0, bargeInHits=[], bargeInPreRoll=[], geminiOutText='';
function pcmToBase64(floatSamples){const pcm=new Int16Array(floatSamples.length);for(let i=0;i<floatSamples.length;i++){const v=Math.max(-1,Math.min(1,floatSamples[i]));pcm[i]=v<0?v*32768:v*32767}const bytes=new Uint8Array(pcm.buffer);let binary='';for(let i=0;i<bytes.length;i++)binary+=String.fromCharCode(bytes[i]);return btoa(binary)}
function downsampleTo16k(input,sourceRate){if(sourceRate===16000)return input;const ratio=sourceRate/16000,outLength=Math.floor(input.length/ratio),out=new Float32Array(outLength);for(let i=0;i<outLength;i++){const start=Math.floor(i*ratio),end=Math.min(Math.floor((i+1)*ratio),input.length);let sum=0;for(let j=start;j<end;j++)sum+=input[j];out[i]=sum/Math.max(1,end-start)}return out}
function cancelGeminiPlayback(){clearTimeout(playbackFinishTimer);for(const source of geminiAudioSources){try{source.stop(0)}catch{}try{source.disconnect()}catch{}}geminiAudioSources=[];playbackCursor=playbackContext?.currentTime||0;geminiSpeaking=false;geminiUserAudioActive=false;}
function sendGeminiMic(samples){if(geminiSocket?.readyState!==WebSocket.OPEN)return;geminiSocket.send(JSON.stringify({realtimeInput:{audio:{mimeType:'audio/pcm;rate=16000',data:pcmToBase64(samples)}}}))}
function handleGeminiBargeIn(){geminiBargedInAt=Date.now();scheduleConfirmReask();geminiTurn.closed=true;try{window.speechSynthesis?.cancel()}catch{}cancelGeminiPlayback();if(geminiGenerating)geminiDropAudio=true;geminiMuteUntil=0;geminiSpeaking=false}
function handleGeminiInterrupted(){cancelGeminiPlayback();geminiGenerating=false;geminiDropAudio=false;geminiMuteUntil=0;geminiOutText='';geminiTurn.closed=true}
function cancelAllSpeechAndGeminiAudio(){try{cancelGnaniAudio()}catch{}speechCancelled=true;try{window.speechSynthesis?.cancel()}catch{}cancelGeminiPlayback();setListeningVisual(false);$('#listening').hidden=true;$('#requestListening').hidden=true;}
function queueGeminiAudio(base64){try{const raw=atob(base64),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);const pcm=new Int16Array(bytes.buffer),samples=new Float32Array(pcm.length);for(let i=0;i<pcm.length;i++)samples[i]=pcm[i]/32768;const buffer=playbackContext.createBuffer(1,samples.length,24000);buffer.copyToChannel(samples,0);const source=playbackContext.createBufferSource();source.buffer=buffer;source.connect(playbackContext.destination);geminiAudioSources.push(source);source.onended=()=>{geminiAudioSources=geminiAudioSources.filter(x=>x!==source);try{source.disconnect()}catch{}};const now=playbackContext.currentTime;playbackCursor=Math.max(playbackCursor,now+0.03);source.start(playbackCursor);playbackCursor+=buffer.duration}catch(error){console.warn('Could not play Gemini audio',error)}}
let voiceFallbackStarted=false;
// Error messages
// Customers never see raw errors. Details go to the console and to the small developer badge (bottom-left); a red full-screen error is shown only when nothing else can work.
const SHOW_DEV_BADGE=false; // set to false to hide the developer badge completely
const ERR_COPY={
  en:{generic:'Something went wrong. Please try again.',fatalTitle:'Something went wrong',fatalText:'Please restart and try again.',restart:'Restart'},
  hi:{generic:'कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करें।',fatalTitle:'कुछ गड़बड़ हो गई',fatalText:'कृपया दोबारा शुरू करें।',restart:'दोबारा शुरू करें'},
  
  pa:{generic:'ਕੁਝ ਗੜਬੜ ਹੋ ਗਈ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',fatalTitle:'ਕੁਝ ਗੜਬੜ ਹੋ ਗਈ',fatalText:'ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਸ਼ੁਰੂ ਕਰੋ।',restart:'ਦੁਬਾਰਾ ਸ਼ੁਰੂ ਕਰੋ'}
};
extraLangMerge(ERR_COPY,'ERR_COPY');
function errCopy(key){return (ERR_COPY[language]||ERR_COPY.en)[key]}
function userError(message){const e=new Error(message);e.userFacing=true;return e}
function safeMessage(error){console.warn('[handled error]',error);return error&&error.userFacing?error.message:errCopy('generic')}
async function apiDetail(response){try{const d=await response.json();return response.status<500&&typeof d.detail==='string'?d.detail:errCopy('generic')}catch{return errCopy('generic')}}
function reasonTag(reason){const r=String(reason||'');
  if(/Gnani Prisma\/Timbre is the configured/i.test(r))return'gnani-primary';if(/not configured|API_KEY/i.test(r))return'no-api-key';if(/timed out/i.test(r))return'timeout';if(/closed before setup/i.test(r))return'closed-before-setup';
  if(/disconnected/i.test(r))return'disconnected';if(/could not connect/i.test(r))return'socket-error';if(/could not start/i.test(r)||/connection failed/i.test(r))return'start-failed';return'live-failed'}
function setDevBadge(state,reason=''){
  window.__voiceState={state,reason,at:new Date().toISOString()};
  let el=document.getElementById('devBadge');
  if(!SHOW_DEV_BADGE||state==='off'){if(el)el.hidden=true;return}
  if(!el){el=document.createElement('div');el.id='devBadge';document.body.appendChild(el)}
  const labels={connecting:'voice: connecting…',live:'voice: live',browser:'voice: browser fallback · '+reasonTag(reason),'server-stt':'voice: server speech recognition · '+reasonTag(reason),fatal:'voice: FAILED · '+reasonTag(reason)};
  el.className='dev-badge dev-'+state;el.textContent=labels[state]||state;el.title=reason?String(reason):'';el.hidden=false;
}
function showFatalError(reason){
  console.error('[fatal]',reason);setDevBadge('fatal',String(reason||''));
  try{hideLoading()}catch{}try{cancelAllSpeechAndGeminiAudio()}catch{}try{disconnectRealtimeVoice()}catch{}
  const o=document.getElementById('fatalOverlay');if(!o){return}
  $('#fatalTitle').textContent=errCopy('fatalTitle');$('#fatalText').textContent=errCopy('fatalText');$('#fatalRestart').textContent=errCopy('restart');o.hidden=false;
}
window.addEventListener('error',e=>{console.error('[uncaught]',e.error||e.message);if(mode==='voice')showFatalError('uncaught: '+(e.message||''))});
window.addEventListener('unhandledrejection',e=>{console.warn('[unhandled rejection]',e.reason)});
function showGeminiDiagnostic(reason){
  if(!new URLSearchParams(location.search).has('debug')){console.warn('[voice diagnostic]',reason);return}
  let el=document.getElementById('geminiDiagnostic');
  if(!el){el=document.createElement('p');el.id='geminiDiagnostic';el.style.cssText='font-size:.85rem;opacity:.8;max-width:46rem;margin:.5rem auto;word-break:break-word';const hint=document.getElementById('voiceHint');(hint?.parentNode||document.body).insertBefore(el,hint?hint.nextSibling:null)}
  el.textContent='Reason: '+(reason||'unknown');el.hidden=false;
  fetch('/api/voice/check').then(r=>r.json()).then(d=>{if(d&&d.problem)el.textContent='Reason: '+(reason||'unknown')+' — Diagnosis: '+d.problem;else if(d&&d.ok)el.textContent='Reason: '+(reason||'unknown')+' — Your key and models look valid; see the kiosk terminal for the Gemini Live close code.'}).catch(()=>{});
}
function fallbackToBrowserVoice(reason='Gemini voice is unavailable.') {
  if(voiceFallbackStarted || mode!=='voice') return;
  voiceFallbackStarted=true;geminiConnectInProgress=false;geminiSpeaking=false;geminiUserAudioActive=false;
  hideLoading();cancelAllSpeechAndGeminiAudio();setListeningVisual(false);
  console.warn('[voice fallback]',reason);
  try{disconnectRealtimeVoice()}catch(error){console.warn('Gemini cleanup failed',error)}
  // A Live session may expire while a passbook is being selected or scanned. Never
  // restart the greeting or browser recognition over the document workflow.
  const documentStep = flowStage==='passbook' || activeScreen==='uploadScreen';
  const greetingText = ({en:'Hello! How may I help you?',hi:'नमस्ते! मैं आपकी कैसे मदद कर सकती हूँ?',pa:'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦੀ ਹਾਂ?'})[speakingLanguage] || 'Hello! How may I help you?';
  if(flowStage==='hello'&&!documentStep){
    // Still at the opening greeting: keep it bilingual (Hindi + English), exactly like the Gemini screen.
    $('#voiceGreeting').innerHTML='<span class="v14-hi-greeting">नमस्ते!</span><span class="v14-en-greeting">Hello!</span>';
    $('#voiceHint').innerHTML='<span class="v14-hi-question">मैं आपकी कैसे मदद कर सकती हूँ?</span><span class="v14-en-question">How may I help you?</span>';
  }else{
    $('#voiceGreeting').textContent=greetingText;
    $('#voiceHint').textContent=({en:'Speak your request.',hi:'अपनी बात बताइए।',pa:'ਆਪਣੀ ਗੱਲ ਦੱਸੋ।'})[speakingLanguage] || 'Speak your request.';
  }
  setDevBadge('browser',String(reason||''));
  showVoiceStatus('');
  showGeminiDiagnostic(String(reason||''));
  if(documentStep)return;
  if(flowStage==='hello'){speakInitialGreeting();return}
  if(['request','amount','amount-confirmed','balance-check'].includes(flowStage)){speechRestartAllowed=true;startRecognition()}
}
async function connectRealtimeVoice(stream){
  if(geminiConnectInProgress)return;geminiConnectInProgress=true;
  realtimeStream=stream;geminiSetupDone=false;geminiMuteUntil=0;geminiGenerating=false;geminiDropAudio=false;bargeInHits=[];bargeInPreRoll=[];geminiOutText='';geminiTurn=newGeminiTurn();lastAmountTurn=null;geminiReady=false;geminiMicPaused=false;geminiSpeaking=false;geminiUserAudioActive=false;playbackCursor=0;const geminiLoading=loadingCopy('gemini');if(!geminiResuming)showLoading(geminiLoading[0],geminiLoading[1]);setDevBadge('connecting');setListeningVisual(false,{greeting:true});
  primeAudioContexts();await Promise.race([Promise.all([micAudioContext.resume(),playbackContext.resume()]),sleep(1500)]);
  const scheme=location.protocol==='https:'?'wss:':'ws:';geminiSocket=new WebSocket(`${scheme}//${location.host}/api/voice/live`);
  geminiSocket.onopen=()=>{geminiSocket.send(JSON.stringify({setup:{model:'models/gemini-3.8-live',generationConfig:{responseModalities:['AUDIO'],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:'Kore'}}}},inputAudioTranscription:{},outputAudioTranscription:{},sessionResumption:geminiResumeHandle?{handle:geminiResumeHandle}:{},contextWindowCompression:{slidingWindow:{}},systemInstruction:{parts:[{text:`You are Sahaj, a patient multilingual Indian banking-form assistant for older adults. Greet the customer immediately before waiting for any customer speech. Greet bilingually in a calm, welcoming voice: “नमस्ते! मैं आपकी क्या मदद कर सकती हूँ? Hello! How may I help you?” Then ask what banking task the customer needs. Keep the greeting brief and natural. Greet exactly ONCE at the very start of the session and never repeat the greeting unless the customer asks you to; if you hear only silence, noise, an echo, or unclear sounds, stay completely silent and keep listening. Understand Hindi, English, Romanized Hindi, and mixed language. The greeting alone may be bilingual. For every later reply, speak in ONE language only, matching the customer's latest request. NEVER repeat a sentence in a second language and never add a Hindi or English translation after your reply. If you did not hear or understand the customer, say "I didn't catch that" and repeat the question ONCE, in the single language the customer last spoke (or the selected screen language if they have not spoken yet). If the customer speaks Hindi or Romanized Hindi, speak Hindi and use Devanagari script only. If the customer speaks English, reply in English only. Use Punjabi Gurmukhi only when the customer speaks Punjabi, and Kannada, Tamil or Bengali script only when the customer speaks that language. Never mix languages in one response. Hindi, English, Punjabi, Kannada, Tamil and Bengali are ALL fully supported: if the customer asks to change the screen language or the spoken language to any of them, agree, confirm briefly in the new language, and continue; never say a language is unavailable. GENDER: you do not know the customer's gender, so never use feminine forms for the customer. Address the customer with respectful plural/neutral forms: Hindi "आप ... सकते हैं", "आप बोल सकते हैं" (NEVER "सकती हैं"); Punjabi "ਤੁਸੀਂ ... ਸਕਦੇ ਹੋ". Speak in simple everyday language and keep replies concise. Help prepare fictional withdrawal or deposit paper drafts only. Never claim to access a real bank, authenticate identity, or move money. Never ask for PINs, OTPs, passwords, full Aadhaar numbers, or secrets. Ask the amount if a withdrawal/deposit amount is missing; never guess. If intent is ambiguous, ask a short clarification. The app separately classifies intent and moves the screens. KIOSK FLOW you must follow: (1) when the customer says withdrawal or deposit, the screen moves to the amount step: ask how much if the amount is missing. (2) When you hear an amount, repeat it clearly in words and ask the customer to say yes or no. (3) After yes, say the screen is moving to passbook selection and ask the customer to choose one of the six passbooks on the screen, either by tapping it or by saying its number (for example 'the third one'). The kiosk itself picks the passbook when it hears a number: never say a passbook was chosen, never describe the form and never mention signing until an APP EVENT says so. (4) Do not ask for anything else. (5) Messages that start with APP EVENT come from the kiosk, not the customer: say their meaning briefly in the customer's language, then listen. Never claim a form was downloaded until an APP EVENT says so. Only when an APP EVENT says the form preview is on screen, ask the customer to sign inside the highlighted box; never mention a counter until a message says the form has been downloaded. BALANCE EXCEPTION: when the app has just asked whether the customer wants to see their current balance because the requested amount is higher than the balance, a yes means the app will show the balance on screen; in that moment never say the balance service is unavailable, just say you are showing it. IMPORTANT SERVICE LIMIT: this kiosk supports ONLY cash withdrawal and cash deposit form assistance. If the customer asks to open an account (including Hindi requests such as मुझे अकाउंट खोलना है or खाता खोलना है), check balance, transfer/send money, update Aadhaar/PAN/address/phone, or asks for any other service, do NOT say you did not understand. Politely explain in the customer's language that the service is currently unavailable and only cash withdrawal and cash deposit are supported, then ask them to choose withdrawal or deposit. For Hindi say: 'यह सेवा अभी उपलब्ध नहीं है। इस कियोस्क पर केवल नकद निकासी और नकद जमा की सुविधा उपलब्ध है। कृपया निकासी या जमा में से चुनें।' For English say: 'This service is currently unavailable. This kiosk supports only cash withdrawal and cash deposit. Please choose withdrawal or deposit.' Use equivalent formal wording in Punjabi, Kannada, Tamil and Bengali.`}]},realtimeInputConfig:{automaticActivityDetection:{disabled:false, silenceDurationMs:900, prefixPaddingMs:300}}}}))};
  geminiSocket.onmessage=event=>{let m;try{m=JSON.parse(event.data)}catch{return}if(m.proxyError){if(geminiTryReconnect('proxy: '+m.proxyError))return;fallbackToBrowserVoice(m.proxyError);return}if(m.sessionResumptionUpdate&&m.sessionResumptionUpdate.newHandle&&m.sessionResumptionUpdate.resumable!==false)geminiResumeHandle=m.sessionResumptionUpdate.newHandle;if(m.goAway)console.info('[gemini] server will close soon',m.goAway);if(m.setupComplete&&!geminiSetupDone){geminiSetupDone=true;geminiEverReady=true;clearTimeout(geminiStableTimer);geminiStableTimer=setTimeout(()=>{geminiReconnects=0},60000);setDevBadge('live');geminiReady=true;geminiConnectInProgress=false;hideLoading();setListeningVisual(false);$('#voiceStatus').textContent='';$('#listen').hidden=true;$('#stop').hidden=true;$('#listening').hidden=true;if(geminiResuming){geminiResuming=false;return}micSource=micAudioContext.createMediaStreamSource(stream);micProcessor=micAudioContext.createScriptProcessor(4096,1,1);micProcessor.onaudioprocess=e=>{if(!geminiReady||geminiMicPaused||geminiSocket?.readyState!==WebSocket.OPEN)return;const mono=e.inputBuffer.getChannelData(0);let energy=0;for(let i=0;i<mono.length;i++)energy+=mono[i]*mono[i];const rms=Math.sqrt(energy/Math.max(1,mono.length));const resampled=downsampleTo16k(mono,micAudioContext.sampleRate);
      if(geminiSpeaking||Date.now()<geminiMuteUntil||window.speechSynthesis?.speaking){
        /* Gemini is talking: do not stream the mic (echo), but listen for the customer talking over it. */
        if(geminiSpeaking&&Date.now()-lastModelAudioAt>3000&&!(playbackContext&&playbackContext.currentTime<playbackCursor-0.05))geminiSpeaking=false;
        /* Right after the greeting starts, ignore barge-in for a few seconds (bargeInBlockedUntil) so the opening echo cannot cut it off. Otherwise fall through to the barge-in detection below. */
        if(Date.now()<bargeInBlockedUntil){bargeInHits=[];bargeInPreRoll=[];return}
        bargeInPreRoll.push(new Float32Array(resampled));if(bargeInPreRoll.length>BARGE_IN_PREROLL)bargeInPreRoll.shift();
        bargeInHits.push(rms>BARGE_IN_RMS?1:0);if(bargeInHits.length>5)bargeInHits.shift();
        if(bargeInHits.reduce((a,b)=>a+b,0)<BARGE_IN_FRAMES)return;
        handleGeminiBargeIn();for(const frame of bargeInPreRoll)sendGeminiMic(frame);bargeInPreRoll=[];bargeInHits=[];
        geminiUserAudioActive=true;setListeningVisual(true);$('#listening').hidden=false;$('#requestListening').hidden=false;return}
      bargeInPreRoll=[];bargeInHits=[];
      const loud=rms>0.012,nowT=performance.now();if(loud){micLoudFrames++;micLastLoudAt=nowT}else micLoudFrames=0;let userIsSpeaking=geminiUserAudioActive;if(!geminiUserAudioActive&&micLoudFrames>=3)userIsSpeaking=true;else if(geminiUserAudioActive&&nowT-micLastLoudAt>900)userIsSpeaking=false;if(userIsSpeaking!==geminiUserAudioActive){geminiUserAudioActive=userIsSpeaking;setListeningVisual(userIsSpeaking);$('#listening').hidden=!userIsSpeaking;$('#requestListening').hidden=!userIsSpeaking;}
      sendGeminiMic(resampled)};
    micSource.connect(micProcessor);const silentGain=micAudioContext.createGain();silentGain.gain.value=0;micProcessor.connect(silentGain);silentGain.connect(micAudioContext.destination);$('#voiceStatus').textContent='';startGreetingWatchdog('\u0928\u092e\u0938\u094d\u0924\u0947! \u092e\u0948\u0902 \u0906\u092a\u0915\u0940 \u0915\u094d\u092f\u093e \u092e\u0926\u0926 \u0915\u0930 \u0938\u0915\u0924\u0940 \u0939\u0942\u0901?|Hello! How may I help you?','bi');geminiSocket.send(JSON.stringify({clientContent:{turns:[{role:'user',parts:[{text:'Immediately greet the customer in a calm bilingual voice: नमस्ते! मैं आपकी क्या मदद कर सकती हूँ? Hello! How may I help you? Then wait for the customer to describe the banking task. Continue listening automatically after the greeting. Understand Hindi written or spoken naturally, English, Romanized Hindi, and mixed Hindi-English. When speaking Hindi, always use Hindi language and Devanagari script; never transliterate Hindi into Latin letters.'}]}],turnComplete:true}}));}
    if(m.serverContent?.interrupted)handleGeminiInterrupted();
    const rawTranscript=(m.inputTranscription?.text||m.serverContent?.inputTranscription?.text||m.serverContent?.inputAudioTranscription?.text||'');if(rawTranscript.trim())queueGeminiUserText(rawTranscript);const spokenByModel=(m.serverContent?.outputTranscription?.text||m.outputTranscription?.text||'');if(spokenByModel){geminiOutText+=spokenByModel;maybeAdvanceFromModel(geminiOutText);if(lastAmountTurn&&spokenNumberValue(geminiOutText))reconcileAmountWithModelSpeech(lastAmountTurn,geminiOutText)}
    const parts=geminiDropAudio?[]:(m.serverContent?.modelTurn?.parts||[]);if(parts.length){geminiGenerating=true;geminiTurn.modelSpoke=true;lastModelAudioAt=Date.now();clearTimeout(playbackFinishTimer);geminiSpeaking=true;geminiUserAudioActive=false;setListeningVisual(false);$('#listening').hidden=true;$('#requestListening').hidden=true;$('#voiceStatus').textContent='';}for(const part of parts){if(part.inlineData?.mimeType?.startsWith('audio/pcm'))queueGeminiAudio(part.inlineData.data);if(part.text){$('#voiceStatus').textContent=part.text}}
    if(m.serverContent?.turnComplete){geminiGenerating=false;geminiDropAudio=false;const modelSaid=geminiOutText,amountTurn=lastAmountTurn;geminiOutText='';geminiTurn.closed=true;maybeAdvanceFromModel(modelSaid);if(amountTurn&&spokenNumberValue(modelSaid)){amountTurn.modelSaid=modelSaid;reconcileAmountWithModelSpeech(amountTurn,modelSaid);setTimeout(()=>reconcileAmountWithModelSpeech(amountTurn,modelSaid),1800)}$('#voiceStatus').textContent='';clearTimeout(playbackFinishTimer);const waitMs=playbackContext?Math.max(0,(playbackCursor-playbackContext.currentTime)*1000)+180:180;playbackFinishTimer=setTimeout(()=>{geminiSpeaking=false;geminiMuteUntil=(Date.now()-geminiBargedInAt>4000)?Date.now()+500:0;geminiUserAudioActive=false;setListeningVisual(false);$('#listening').hidden=true;$('#requestListening').hidden=true;showVoiceStatus('');armSilenceReask()},waitMs)}
    if(m.error){if(geminiTryReconnect('error: '+(m.error.message||'')))return;fallbackToBrowserVoice(m.error.message||'Gemini voice connection issue; switching to browser voice.')}
  };
  geminiSocket.onerror=()=>{if(geminiTryReconnect('socket error'))return;fallbackToBrowserVoice('Could not connect to Gemini Live; switching to browser speech recognition and synthesis.')};
  geminiSocket.onclose=ev=>{if(ev&&ev.target&&ev.target!==geminiSocket)return;console.warn('[gemini] socket closed',ev&&ev.code,ev&&ev.reason);geminiConnectInProgress=false;const wasReady=geminiReady;geminiReady=false;if(voiceFallbackStarted||mode!=='voice')return;if(geminiTryReconnect('closed '+(ev&&ev.code)))return;fallbackToBrowserVoice(wasReady?'Gemini Live disconnected; switching to browser voice.':'Gemini Live closed before setup completed; switching to browser voice.')};
  setTimeout(()=>{if(!geminiReady&&mode==='voice'&&!voiceFallbackStarted)fallbackToBrowserVoice('Gemini Live connection timed out; switching to browser voice.')},12000);
}
let geminiResumeHandle='',geminiReconnects=0,geminiResuming=false,geminiReconnectTimer=null,geminiEverReady=false,geminiStableTimer=null;
function geminiTryReconnect(why){
  if(voiceFallbackStarted||mode!=='voice'||!realtimeStream||!geminiEverReady)return false;
  if(geminiReconnectTimer)return true;
  if(geminiReconnects>=3||!realtimeStream.getAudioTracks().some(t=>t.readyState==='live'))return false;
  geminiReconnects++;geminiReady=false;clearTimeout(geminiStableTimer);
  console.warn('[gemini] connection lost ('+why+'); reconnecting, attempt '+geminiReconnects+' of 3');
  const old=geminiSocket;
  geminiReconnectTimer=setTimeout(()=>{
    geminiReconnectTimer=null;if(voiceFallbackStarted||mode!=='voice')return;
    geminiResuming=true;geminiConnectInProgress=false;
    try{if(old){old.onclose=null;old.onerror=null;old.close()}}catch{}
    connectRealtimeVoice(realtimeStream).catch(e=>{geminiResuming=false;fallbackToBrowserVoice('Gemini reconnect failed: '+(e&&e.message))});
  },500*geminiReconnects);
  return true;
}
function geminiActive(){return !!(geminiReady&&geminiSocket&&geminiSocket.readyState===WebSocket.OPEN&&!voiceFallbackStarted)}
function geminiNote(text,code){
  if(!geminiActive())return false;
  const c=SUPPORTED_UI.includes(code)?code:(SUPPORTED_UI.includes(speakingLanguage)?speakingLanguage:'hi');
  const lang={en:'English',hi:'Hindi, in Devanagari script',pa:'Punjabi, in Gurmukhi script',kn:'Kannada, in Kannada script',ta:'Tamil, in Tamil script',bn:'Bengali, in Bengali script'}[c];
  const sentence=String(text||'').replace(/^Tell the customer exactly this:\s*/,'');
  geminiSocket.send(JSON.stringify({clientContent:{turns:[{role:'user',parts:[{text:'APP EVENT (not spoken by the customer): Say the following sentence exactly once, in '+lang+' ONLY. Do not translate it. Do not repeat it in any other language. Do not add a greeting or any extra words. Then stop and listen. Sentence: '+sentence}]}],turnComplete:true}}));
  return true;
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
// One spoken sentence ("turn") reaches us as many small transcript pieces, sometimes seconds apart and after Gemini has already started
// answering. All pieces of a turn are kept together and the WHOLE turn is re-read each time a piece arrives, so "1" + "0" + ",000 rupees"
// always ends up as 10,000 instead of being acted on piece by piece.
function newGeminiTurn(){return{text:'',kind:'',lastAt:0,lastText:'',closed:false,modelSpoke:false,amount:'',modelSaid:''}}
let geminiTurn=newGeminiTurn(),geminiTurnTimer=null,geminiDriveChain=Promise.resolve(),lastAmountTurn=null;
const GEMINI_FINAL_KINDS=['language','advance','reset','balance','passbook','other'];
let amountQuestionDoneAt=0,lastUserChunkAt=0;
function queueGeminiUserText(chunk){
  if(String(chunk||'').trim())customerHasSpoken=true;const now=Date.now(),gap=now-geminiTurn.lastAt;lastUserChunkAt=now;silenceReaskCount=0;clearTimeout(silenceReaskTimer);
  if(geminiTurn.text&&(GEMINI_FINAL_KINDS.includes(geminiTurn.kind)||((geminiTurn.closed||geminiTurn.modelSpoke)&&gap>1800)||gap>5000))geminiTurn=newGeminiTurn();
  geminiTurn.text+=chunk;geminiTurn.lastAt=now;
  const turn=geminiTurn;clearTimeout(geminiTurnTimer);geminiTurnTimer=setTimeout(()=>runGeminiTurn(turn),800);
}
function runGeminiTurn(turn){
  geminiDriveChain=geminiDriveChain.then(async()=>{
    const text=turn.text.replace(/\s+/g,' ').trim();
    if(!text||text===turn.lastText||GEMINI_FINAL_KINDS.includes(turn.kind))return;   // an action already taken for this sentence is never repeated
    turn.lastText=text;
    turn.kind=(await geminiDrive(text))||'none';
    if((turn.kind==='amount'||turn.kind==='intent')&&flowStage==='amount-confirmed'&&detectedAmount){turn.amount=String(detectedAmount);lastAmountTurn=turn;if(geminiOutText&&spokenNumberValue(geminiOutText))reconcileAmountWithModelSpeech(turn,geminiOutText)}
  }).catch(e=>console.warn('Gemini flow error',e));
}
// Pieces that can only be the END of a number said a moment ago (",000 rupees", "0"), or a lone "thousand/hazaar" with no number before it.
function isNumberTail(text){return/^\s*(?:[,.]\s*\d|0+(?!\d))/.test(text||'')}
function isBareScaleWord(text){const rest=normalizeSpokenDigits((text||'').toLowerCase()).replace(/\u095b/g,'ज').replace(/\u093c/g,'').replace(/thousand|hazaar|hazar|हजार|ਹਜ਼ਾਰ|lakhs?|lac|लाख|ਲੱਖ|hundred|सौ|ਸੌ|rupees?|rs|रुपये|रुपए|रुपया|ਰੁਪਏ/g,'').replace(/[\s.,।!?]/g,'');return rest===''&&/\S/.test(text||'')}
// Gemini hears the audio directly and SPEAKS the amount back ("ten thousand rupees"). If the separate transcript of the customer's words
// was cut short (screen shows 10 or 1), repair the screen from what Gemini just said. Only ever raises the amount to an extension of what
// is shown (10 -> 10000), and only for the amount that exact sentence produced, so it can never overwrite a correction.
function reconcileAmountWithModelSpeech(turn,modelSaid){
  if(!turn||!turn.amount||!modelSaid||flowStage!=='amount-confirmed'||String(detectedAmount)!==turn.amount)return;
  const said=spokenNumberValue(modelSaid),shown=turn.amount,stem=shown.replace(/0+$/,'')||shown;
  if(said&&said!==shown&&Number(said)>Number(shown)&&said.startsWith(stem)){applyAmountToScreen(said,modelSaid);turn.amount=said}
}
let lastAmountText='',lastAmountAt=0;
function applyAmountToScreen(amount,heard=''){hideRequestBalance();lastAmountText=heard||lastAmountText;lastAmountAt=Date.now();detectedAmount=amount;$('#requestedAmount').value=amount;$('#amount').value=amount;flowStage='amount-confirmed';$('#withdrawalAmountBlock').hidden=false;$('#continueWithdrawal').hidden=true;$('#continueUpload').hidden=true;show('requestScreen');showAmountBox(amount);if(earlyYesAt&&Date.now()-earlyYesAt<8000&&String(amount)===String(lastModelAmount)){earlyYesAt=0;setTimeout(()=>{if(flowStage==='amount-confirmed')geminiAdvanceAfterAmount()},300)}}
function geminiAdvanceAfterAmount(){
  if(currentIntent==='withdrawal'&&passbook.profile){
    if(Number(detectedAmount)>Number(passbook.profile.balance||0)){
      lastKnownBalance=String(passbook.profile.balance||'0');flowStage='balance-check';show('requestScreen');
      const prompt=language==='hi'?'आपके खाते में इतनी राशि नहीं है। क्या आप अपना मौजूदा बैलेंस देखना चाहते हैं? हाँ या नहीं कहें।':language==='pa'?'ਤੁਹਾਡੇ ਖਾਤੇ ਵਿੱਚ ਇੰਨੀ ਰਕਮ ਨਹੀਂ ਹੈ। ਕੀ ਤੁਸੀਂ ਮੌਜੂਦਾ ਬਕਾਇਆ ਵੇਖਣਾ ਚਾਹੁੰਦੇ ਹੋ? ਹਾਂ ਜਾਂ ਨਹੀਂ ਕਹੋ।':TR(language,'Your account does not have enough balance for that withdrawal. Would you like to see your current balance? Please say yes or no.');
      setBalancePrompt(prompt);geminiNote('Tell the customer exactly this: '+prompt);return;
    }
    flowStage='request';showWithdrawal();return;
  }
  flowStage='passbook';show('uploadScreen');
}
async function geminiDrive(spoken){
  if(parseLanguagePreferenceCommand(spoken)){sendGeminiLanguageInstruction();return'language'}
  if(flowStage==='balance-check'){const tail=spoken.slice(-70);
    if(!spokenNumberValue(tail)||/balance|\u092c\u0948\u0932\u0947\u0902\u0938|\u0a2c\u0a15\u0a3e\u0a07\u0a06|\u0628\u06cc\u0644\u0646\u0633/i.test(tail))if(affirmative(tail)||endsAffirmative(tail)||looseYes(tail)||/balance|\u092c\u0948\u0932\u0947\u0902\u0938|\u0936\u0947\u0937|\u0a2c\u0a15\u0a3e\u0a07\u0a06|\u0628\u06cc\u0644\u0646\u0633|\u0926\u093f\u0916\u093e|show|dikha|dekh/i.test(tail)){$('#showBalance').click();return'balance'}
    if(!spokenNumberValue(tail)&&(negative(tail)||looseNo(tail))){$('#changeAmount').click();return'balance'}
  }
  followSpokenLanguage(spoken);
  const li=localIntent(spoken);
  const newRequest=(li==='withdrawal'||li==='deposit'||li==='unsupported')&&(li!==currentIntent||flowStage==='hello'||flowStage==='request');
  if(!newRequest&&(currentIntent==='withdrawal'||currentIntent==='deposit')){
    if(flowStage==='balance-check'){if(affirmative(spoken)){$('#showBalance').click();return'balance'}if(negative(spoken)){$('#changeAmount').click();return'balance'}return'none'}
    if(flowStage==='amount-confirmed'){
      if(affirmative(spoken)||endsAffirmative(spoken)||looseYes(spoken)){if(lastAmountTurn)reconcileAmountWithModelSpeech(lastAmountTurn,lastAmountTurn.modelSaid);geminiAdvanceAfterAmount();return'advance'}
      if(negative(spoken)||looseNo(spoken)){flowStage='amount';detectedAmount='';$('#requestedAmount').value='';$('#requestResult').hidden=true;return'reset'}
    }
    if(flowStage==='amount-confirmed'&&lastAmountTurn&&Date.now()-lastAmountAt<15000){
      // A late leftover piece of the amount just heard: glue it to that sentence (",000 rupees" after "10"), or ignore a lone "thousand".
      if(isNumberTail(spoken)){lastAmountTurn.text+=spoken;const v=spokenNumberValue(lastAmountTurn.text.replace(/\s+/g,' ').trim());if(v&&v!==String(detectedAmount)){applyAmountToScreen(v,spoken);lastAmountTurn.amount=v}return'amount'}
      if(isBareScaleWord(spoken))return'none';
    }
    if(flowStage==='amount'&&!spokenNumberValue(spoken)&&(affirmative(spoken)||endsAffirmative(spoken)||looseYes(spoken))&&lastModelAmount){earlyYesAt=Date.now();return'none'}
    if(flowStage==='amount'||flowStage==='amount-confirmed'){
      const amt=spokenNumberValue(spoken);
      if(amt){if(amt!==String(detectedAmount)||flowStage!=='amount-confirmed')applyAmountToScreen(amt,spoken);return'amount'}
      return'none'}
    if(flowStage==='passbook'){const n=passbookChoiceFromSpeech(spoken);if(n){selectPassbookByNumber(n);return'passbook'}return'none'}
    if(flowStage==='request')return'none';
  }
  return await syncGeminiIntent(spoken,li);
}
async function syncGeminiIntent(spoken,knownIntent=''){
  try{
    if(!SUPPORTED_UI.includes(language))language='hi';localize();
    let data;
    if(knownIntent==='withdrawal'||knownIntent==='deposit')data={intent:knownIntent,amount:spokenNumberValue(spoken)};
    else if(knownIntent==='unsupported')data={intent:'unsupported'};
    else{const response=await fetch('/api/intent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:spoken,language})});data=await response.json()}
    if(data.intent==='withdrawal'||data.intent==='deposit'){
      currentIntent=data.intent;
      const amount=spokenNumberValue(spoken)||data.amount||'';
      $('#withdrawalAmountBlock').hidden=false;$('#continueWithdrawal').hidden=true;$('#continueUpload').hidden=true;
      if(amount)applyAmountToScreen(amount,spoken);
      else{detectedAmount='';$('#requestedAmount').value='';flowStage='amount';show('requestScreen');$('#requestResult').hidden=true}
      return'intent'
    }else if(data.intent==='unsupported'){
      currentIntent='unsupported';flowStage='request';show('requestScreen');
      const msg=language==='hi'?'यह सेवा अभी इस कियोस्क पर उपलब्ध नहीं है। कृपया बैंक कर्मचारी से संपर्क करें। मैं पैसे निकालने, जमा करने और नए खाते के आवेदन में मदद कर सकती हूँ।':language==='pa'?'ਇਹ ਸੇਵਾ ਇਸ ਵੇਲੇ ਉਪਲਬਧ ਨਹੀਂ ਹੈ। ਇਸ ਕਿਓਸਕ ਤੇ ਸਿਰਫ਼ ਨਕਦ ਕਢਵਾਉਣ ਅਤੇ ਨਕਦ ਜਮ੍ਹਾਂ ਕਰਨ ਦੀ ਸਹੂਲਤ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਨਿਕਾਸੀ ਜਾਂ ਜਮ੍ਹਾਂ ਵਿੱਚੋਂ ਚੁਣੋ।':TR(language,'This service is currently unavailable. This kiosk supports only cash withdrawal and cash deposit. Please choose withdrawal or deposit.');
      $('#requestResult').textContent=msg;$('#requestResult').hidden=false;
      return'other'
    }
    return'none'
  }catch(error){console.warn('Gemini intent sync failed',error);return'none'}
}

async function processRealtimeTranscript(spoken){
  if(realtimeBusy)return;realtimeBusy=true;
  try{
    localize();
    if(currentIntent==='withdrawal' && flowStage==='amount'){
      const amountMatch=spoken.match(/(?:₹|rs\.?\s*)?([0-9]{1,7}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i);
      if(amountMatch){detectedAmount=amountMatch[1].replace(/,/g,'');$('#requestedAmount').value=detectedAmount;$('#continueWithdrawal').hidden=false;flowStage='amount-confirmed';$('#requestResult').textContent=amountReply(language,detectedAmount);$('#requestResult').hidden=false;}
      return;
    }
    const response=await fetch('/api/intent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:spoken,language})});
    const data=await response.json();
    if(['withdrawal','deposit','unsupported','unclear'].includes(data.intent)){
      await interpret(spoken,'manual',true);
      if(data.intent==='withdrawal'&&!data.amount){flowStage='amount';$('#withdrawalAmountBlock').hidden=false;$('#continueWithdrawal').hidden=false;}
      if(data.intent==='deposit'){flowStage='deposit';}
    }
  }catch(error){console.warn('[voice request failed]',error);$('#voiceStatus').textContent=errCopy('generic')}
  finally{realtimeBusy=false;}
}
function disconnectRealtimeVoice(){clearTimeout(geminiReconnectTimer);geminiReconnectTimer=null;clearTimeout(geminiStableTimer);geminiResuming=false;geminiEverReady=false;geminiResumeHandle='';clearSilenceReask();speechRestartAllowed=false;stopServerRecognition();try{speechRecognition?.stop()}catch{}geminiReady=false;try{geminiSocket?.close()}catch{}try{micProcessor?.disconnect()}catch{}try{micSource?.disconnect()}catch{}try{micAudioContext?.close()}catch{}try{playbackContext?.close()}catch{}realtimeStream?.getTracks().forEach(track=>track.stop());activeMicStream?.getTracks().forEach(track=>track.stop());activeMicStream=null;geminiSocket=null;micProcessor=null;micSource=null;micAudioContext=null;playbackContext=null;realtimeStream=null;}
let speechRecognition=null, speechListening=false, speechRestartAllowed=false, recognitionRetryIndex=0, speechCancelled=false;
function startRecognition(){
  if(window.sahajPromptPlaying||window.sahajOpeningGreeting)return;
  if(mode!=='voice')return;
  if(geminiActive())return;
  const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  // No (working) browser recognizer, e.g. Brave, Firefox, kiosk browsers: record in the page and let the server transcribe.
  if(serverRec||transcribingNow)return;
  if(serverSTTForced||GNANI.primary||!SpeechRecognition){startServerRecognition();return}
  try{
    if(speechRecognition){try{speechRecognition.stop()}catch{}}
    speechRecognition=new SpeechRecognition();
    const thisRecognition=speechRecognition;let recognitionStarted=false;
    // Some browsers (Brave) expose SpeechRecognition but never start it.
    setTimeout(()=>{if(!recognitionStarted&&speechRecognition===thisRecognition&&mode==='voice'&&!serverSTTForced&&!geminiMicPaused&&speechRestartAllowed){console.warn('Browser speech recognition never started; using server speech recognition');serverSTTForced=true;try{thisRecognition.abort()}catch{}startServerRecognition()}},4000);
    speechRecognition.lang=recognitionLocale(speakingLanguage||'hi');
    speechRecognition.continuous=false;
    speechRecognition.interimResults=true;
    speechRecognition.maxAlternatives=3;
    speechRestartAllowed=true;
    speechRecognition.onspeechstart=()=>{listeningUI(true);setListeningVisual(true)};
    speechRecognition.onspeechend=()=>{listeningUI(false);setListeningVisual(false)};
    speechRecognition.onstart=()=>{if(window.sahajPromptPlaying){thisRecognition.abort();return}showAnswerCue(true);recognitionStarted=true;armSilenceReask(true);speechListening=true;listeningUI(false);setListeningVisual(false);showVoiceStatus(speakingLanguage==='hi'?'सुन रही हूँ…':speakingLanguage==='pa'?'ਸੁਣ ਰਹੀ ਹਾਂ…':TR(speakingLanguage,'Listening…'))};
    speechRecognition.onresult=event=>{if(window.sahajPromptPlaying||speechRecognition!==thisRecognition)return;const result=event.results?.[event.results.length-1];if(!result||result.isFinal===false)return;const alternatives=Array.from(result).map(x=>(x.transcript||'').trim()).filter(Boolean);const transcript=alternatives.sort((a,b)=>{const score=t=>(/^(yes|yeah|yep|haan|han|हाँ|हां|जी|no|nope|nahi|नहीं|नही|ना|ਹਾਂ|ਨਹੀਂ|ಹೌದು|ಸರಿ|ஆம்|ஆமாம்|சரி|হ্যাঁ|হাঁ|ঠিক আছে|ঠিক|ಇಲ್ಲ|ಬೇಡ|ತಪ್ಪು|இல்லை|வேண்டாம்|தவறு|না|নয়|ভুল)$/i.test(t)?8:0)+(localIntent(t)?6:0)+(spokenNumberValue(t)?4:0)+(/[ऀ-ॿ]/.test(t)?2:0)+(t.length>2?1:0);return score(b)-score(a)})[0]||'';if(transcript){speechRestartAllowed=false;handleVoice(transcript,detectSpokenLanguage(transcript));}};
    speechRecognition.onerror=event=>{speechListening=false;setListeningVisual(false);console.warn('Browser speech recognition:',event.error);$('#listening').hidden=true;if(event.error==='not-allowed'&&!micPermissionGranted&&!activeMicStream){speechRestartAllowed=false;showFatalError('speech-recognition: '+event.error)}else if(event.error==='not-allowed'||event.error==='service-not-allowed'||event.error==='network'||event.error==='language-not-supported'||event.error==='audio-capture'){console.warn('Browser speech recognition unusable ('+event.error+'); using server speech recognition');serverSTTForced=true;speechRestartAllowed=true;setTimeout(()=>{if(mode==='voice'&&!geminiMicPaused)startServerRecognition()},0)}else if(event.error==='no-speech'){showVoiceStatus(language==='hi'?'आवाज़ साफ़ नहीं सुनाई दी। कृपया सामान्य आवाज़ में फिर से बोलें।':language==='pa'?'ਆਵਾਜ਼ ਸਾਫ਼ ਨਹੀਂ ਸੁਣੀ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਬੋਲੋ।':TR(language,'I could not hear that clearly. Please speak normally and try again.'))}else if(event.error!=='aborted'){showVoiceStatus(errCopy('generic'))}};
    speechRecognition.onend=()=>{if(speechRecognition!==thisRecognition)return;showAnswerCue(false);speechListening=false;setListeningVisual(false);if(speechRestartAllowed&&mode==='voice'&&!document.hidden){setTimeout(()=>{if(speechRestartAllowed&&mode==='voice'){try{speechRecognition.start()}catch(e){console.debug('Recognition restart:',e.message);setListeningVisual(false)} }},250)}else{$('#listening').hidden=true}};
    speechRecognition.start();
  }catch(error){showFatalError('recognition-start: '+error.message)}
}
function getVoicesWhenReady(){
  return new Promise(resolve=>{
    if(!window.speechSynthesis){resolve([]);return}
    const existing=window.speechSynthesis.getVoices();
    if(existing.length){resolve(existing);return}
    let finished=false;
    const finish=()=>{if(finished)return;finished=true;window.speechSynthesis.removeEventListener?.('voiceschanged',finish);resolve(window.speechSynthesis.getVoices())};
    window.speechSynthesis.addEventListener?.('voiceschanged',finish,{once:true});
    setTimeout(finish,3000);
  });
}
function chooseVoice(voices, languageTags){
  const norm=l=>(l||'').toLowerCase().replace(/_/g,'-'); // Android reports "hi_IN"
  for(const tag of languageTags){const found=voices.find(v=>norm(v.lang)===norm(tag));if(found)return found}
  for(const tag of languageTags){const prefix=norm(tag).split('-')[0];const found=voices.find(v=>norm(v.lang).startsWith(prefix+'-')||norm(v.lang)===prefix);if(found)return found}
  // Some browsers leave the language empty but name the voice ("Microsoft Kalpana - Hindi (India)", "Google हिन्दी").
  const names={hi:/hindi|हिन्दी|हिंदी/i,pa:/punjabi|ਪੰਜਾਬੀ/i,en:/english/i};
  for(const tag of languageTags){const re=names[norm(tag).split('-')[0]];const found=re&&voices.find(v=>re.test(v.name||''));if(found)return found}
  return null;
}
function speakUtterance(text,lang,voice){
  return new Promise(resolve=>{
    const u=new SpeechSynthesisUtterance(text);u.lang=lang;if(voice)u.voice=voice;
    let done=false,wd=null;const finish=()=>{if(done)return;done=true;clearTimeout(wd);resolve()};wd=setTimeout(()=>{try{window.speechSynthesis.cancel()}catch{}finish()},Math.max(5000,text.length*130));u.onend=finish;u.onerror=finish;
    window.speechSynthesis.speak(u);
  });
}
async function speakInitialGreeting(){
  showVoiceStatus('');
  setListeningVisual(false,{greeting:true});
  if(await gnaniSpeak('नमस्ते! मैं आपकी कैसे मदद कर सकती हूँ?','hi')){if(!(await gnaniSpeak('Hello! How may I help you?','en'))&&window.speechSynthesis&&window.SpeechSynthesisUtterance){const gv=await getVoicesWhenReady();await speakUtterance('Hello! How may I help you?','en-IN',chooseVoice(gv,['en-IN','en-GB','en-US','en']))}flowStage='request';setListeningVisual(false);startRecognition();return}
  if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){console.warn('speechSynthesis unavailable');startRecognition();return}
  window.speechSynthesis.cancel();
  const voices=await getVoicesWhenReady();
  const hindiVoice=chooseVoice(voices,['hi-IN','hi']);
  const englishVoice=chooseVoice(voices,['en-IN','en-GB','en-US','en']);
  // With no Hindi voice installed, an Indian-English voice reads the same greeting in Roman letters, so the customer still hears Hindi.
  if(hindiVoice)await speakUtterance('नमस्ते! मैं आपकी कैसे मदद कर सकती हूँ?','hi-IN',hindiVoice);
  else console.warn('No Hindi speech voice installed; Hindi greeting remains on screen rather than being mispronounced.');
  await speakUtterance('Hello! How may I help you?','en-IN',englishVoice);
  flowStage='request';
  setListeningVisual(false);startRecognition();
}
async function askMicrophone(){
 primeAudioContexts();
 if(!navigator.mediaDevices?.getUserMedia){$('#permissionStatus').textContent='Microphone access is unavailable here. Use browser site settings, or continue without voice.';$('#fallbackActions').hidden=false;return}
 try{
  const stream=activeMicStream&&activeMicStream.getAudioTracks().some(t=>t.readyState==='live')?activeMicStream:await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});activeMicStream=stream;micPermissionGranted=true;geminiMicPaused=false;
  mode='voice';flowStage='hello';voiceFallbackStarted=false;language=language||'en';speakingLanguage=SUPPORTED_UI.includes(speakingLanguage)?speakingLanguage:'en';localize();show('voiceScreen');window.sahajOpeningGreeting=true;$('#voiceManual').hidden=false;
  $('#voiceGreeting').innerHTML='<span class="v14-hi-greeting">नमस्ते!</span><span class="v14-en-greeting">Hello!</span>';
  $('#voiceHint').innerHTML='<span class="v14-hi-question">मैं आपकी कैसे मदद कर सकती हूँ?</span><span class="v14-en-question">How may I help you?</span>';
  const geminiLoading=loadingCopy('gemini');showLoading(geminiLoading[0],geminiLoading[1]);setListeningVisual(false);$('#voiceStatus').textContent='';$('#listen').hidden=true;$('#stop').hidden=true;$('#listening').hidden=true;
  try{await loadVoiceProviders();if(window.voiceJourney){hideLoading();serverSTTForced=true;voiceFallbackStarted=true;await window.voiceJourney.start();return}if(GNANI.primary){hideLoading();serverSTTForced=true;fallbackToBrowserVoice('Gnani Prisma/Timbre is the configured voice service')}else await connectRealtimeVoice(stream)}catch(error){fallbackToBrowserVoice('Voice could not start: '+error.message)}
 }catch(error){console.warn('[microphone]',error);$('#permissionStatus').textContent=words(language).permissionDenied;$('#fallbackActions').hidden=false;show('permissionScreen')}
}
function showManualUpload(){mode='manual';localize();show('uploadScreen')}
function chooseManualLanguage(returnScreen='uploadScreen'){mode='manual';languageReturnScreen=typeof returnScreen==='string'&&screens.includes(returnScreen)?returnScreen:'uploadScreen';$('#fallbackActions').hidden=true;$('#permissionStatus').textContent='';show('languageScreen');document.querySelectorAll('[data-lang]').forEach(x=>x.classList.toggle('selected',x.dataset.lang===language));try{localize()}catch(error){console.error('Manual language screen localization failed:',error);$('#languageTitle').textContent='Choose your language';$('#languageDescription').textContent='Choose a language for manual help.';$('#languageNext').textContent='Continue'}}
function pauseVoiceInput(){clearSilenceReask();geminiMicPaused=true;speechRestartAllowed=false;stopServerRecognition();cancelAllSpeechAndGeminiAudio();try{speechRecognition?.stop()}catch{}setListeningVisual(false);$('#listening').hidden=true;$('#requestListening').hidden=true;$('#stop').hidden=true;$('#requestStop').hidden=true;$('#listen').hidden=false;$('#requestVoice').hidden=mode!=='voice';showVoiceStatus(language==='hi'?'सुनना रोक दिया गया है। दोबारा बोलने के लिए बोलें बटन दबाएँ।':language==='pa'?'ਸੁਣਨਾ ਰੋਕ ਦਿੱਤਾ ਹੈ। ਮੁੜ ਬੋਲਣ ਲਈ ਬੋਲੋ ਦਬਾਓ।':'Listening paused. Press Speak to resume.')}function resumeVoiceInput(){if(mode!=='voice')return;geminiMicPaused=false;if(voiceFallbackStarted){speechRestartAllowed=true;startRecognition();return}if(geminiReady&&geminiSocket?.readyState===WebSocket.OPEN){$('#listen').hidden=true;$('#requestVoice').hidden=true;$('#stop').hidden=false;$('#requestStop').hidden=false;showVoiceStatus('');setListeningVisual(false);$('#listening').hidden=true;$('#requestListening').hidden=true;return}if(activeMicStream&&activeMicStream.getAudioTracks().some(t=>t.readyState==='live')){askMicrophone();return}askMicrophone()}
$('#voiceContinue').onclick=askMicrophone;$('#manualContinue').onclick=()=>chooseManualLanguage();
$('#stop').onclick=()=>pauseVoiceInput();
$('#languageNext').onclick=()=>{mode='manual';const target=languageReturnScreen||'uploadScreen';show(target);try{localize()}catch(error){console.error('Manual screen localization failed:',error)}};document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{language=b.dataset.lang;speakingLanguage=SUPPORTED_UI.includes(language)?language:'hi';document.querySelectorAll('[data-lang]').forEach(x=>x.classList.toggle('selected',x===b));localize()});$('#switchLanguage').onclick=()=>chooseManualLanguage(activeScreen);
$('#listen').onclick=()=>resumeVoiceInput();$('#requestStop').onclick=()=>pauseVoiceInput();
document.addEventListener('visibilitychange',()=>{if(document.hidden)recognition?.stop()});
// Recognition callbacks are installed per one-shot recording so the listening state is always explicit.
$('#listen').onclick=()=>resumeVoiceInput();
$('#voiceManual').onclick=()=>{disconnectRealtimeVoice();chooseManualLanguage()};$('#requestManual').onclick=()=>{disconnectRealtimeVoice();chooseManualLanguage()};
function profileSummary(p){const l={en:['Customer','Account','Phone','Type','Branch','DOB','Address','Occupation','Balance','Demo ref'],hi:['ग्राहक','खाता','फ़ोन','प्रकार','शाखा','जन्म तिथि','पता','व्यवसाय','शेष राशि','डेमो संदर्भ'],pa:['ਗਾਹਕ','ਖਾਤਾ','ਫ਼ੋਨ','ਕਿਸਮ','ਸ਼ਾਖਾ','ਜਨਮ ਮਿਤੀ','ਪਤਾ','ਕਿੱਤਾ','ਬਕਾਇਆ','ਡੈਮੋ ਹਵਾਲਾ']}[language];const values=[p.name,p.account_id,p.phone,p.account_type,p.branch,p.date_of_birth,p.address,p.occupation,`₹${p.balance}`,p.customer_ref];return l.map((label,i)=>`${label}: ${values[i]}`).join(' · ')}
let lastLanguageChange=null;
function parseLanguagePreferenceCommand(text){
 // Understands language-change requests in English, Hindi (Devanagari + Roman), Punjabi (Gurmukhi + Devanagari), Kannada, Tamil and Bengali (own scripts + Devanagari names).
 const norm=s=>(s||'').normalize('NFC').toLowerCase().replace(/[\u200b-\u200d\ufeff]/g,'').replace(/\s+/g,' ').trim();
 const t=norm(text);if(!t)return false;
 const NAMES={
  en:['english','inglish','ingleesh','angrezi','angreji','angrej','अंग्रेज़ी','अंग्रेजी','अँग्रेजी','अंग्रेज़','अंग्रेज','इंग्लिश','इंग्लीश','इंगलिश','इंग्लिस','ਅੰਗਰੇਜ਼ੀ','ਅੰਗਰੇਜ਼','ਅੰਗ੍ਰੇਜ਼ੀ','ਇੰਗਲਿਸ਼','ਇੰਗਲਿਸ'],
  hi:['hindi','हिंदी','हिन्दी','हिंदि','ਹਿੰਦੀ'],
  pa:['punjabi','panjabi','पंजाबी','पंजाबि','ਪੰਜਾਬੀ'],
  kn:['kannada','kannad','कन्नड़','कन्नड','ਕੰਨੜ','ಕನ್ನಡ'],
  ta:['tamil','tamizh','तमिल','ਤਮਿਲ','தமிழ்'],
  bn:['bengali','bangla','bangali','बंगाली','बांग्ला','ਬੰਗਾਲੀ','বাংলা','বাঙালি']};
 const DISPLAY=['screen','display','text','written','writing','script','स्क्रीन','सक्रीन','पर्दा','पर्दे','लिखा','लिखित','लिखावट','लिखाई','टेक्स्ट','ਸਕ੍ਰੀਨ','ਸਕਰੀਨ','ਲਿਖਤ','ਲਿਖਿਆ','show','दिखाओ','दिखाइए','दिखाइये','दिखाएं','दिखाएँ','दिखा','दिखे','दिखाना','ਦਿਖਾਓ','ਦਿਖਾਉ','ਦਿਖਾ'];
 const SPEECH=['speak','speaking','talk','voice','वॉइस','वॉइस','वॉयस','say','spoken','bol','bolo','bolna','baat','awaaz','awaz','बोल','बात','आवाज़','आवाज','आवाज','ਬੋਲ','ਗੱਲ','ਗੱਲਬਾਤ','ਆਵਾਜ਼','ਅਵਾਜ਼'];
 const CHANGE=['ಭಾಷೆ','ಬದಲ','மொழி','மாற்ற','ভাষা','বদল','পরিবর্তন','language','bhasha','bhaasha','zabaan','zaban','zubaan','switch','change','set ','convert','make it','make the','back to','go to','use ','भाषा','भाशा','ज़बान','जबान','बदल','बदलो','बदलें','बदलिए','करनी','करना','करो','कीजिए','कीजिये','कर दो','कर दीजिए','चाहिए','चाहता','चाहती','वापस','में','ਭਾਸ਼ਾ','ਬੋਲੀ','ਬਦਲ','ਕਰੋ','ਕਰਨੀ','ਕਰਨਾ','ਚਾਹੀਦੀ','ਚਾਹੀਦਾ','ਵਾਪਸ','ਵਿੱਚ'];
 const has=(s,list)=>list.some(w=>s.includes(norm(w)));
 const lastLang=s=>{let best=null,pos=-1;for(const [code,list] of Object.entries(NAMES)){for(const n of list){const i=s.lastIndexOf(norm(n));if(i>=0&&(i>pos||(i===pos&&n.length>(best?.len||0)))){pos=i;best={code,len:n.length}}}}return best?best.code:null};
 const clauses=t.split(/\s*(?:[,;।|.!?]|(?:^|\s)(?:and|but|while|और|लेकिन|जबकि|तथा|ਅਤੇ|ਪਰ|ਜਦਕਿ)(?=\s|$))\s*/).filter(Boolean);
 let display=null,speech=null;
 for(const c of clauses){
  const code=lastLang(c);if(!code)continue;
  const d=has(c,DISPLAY),s=has(c,SPEECH);
  // A bare language name ("Punjabi") or a name with a change/“in <language>” cue counts as a request.
  const bare=c.split(' ').length<=2;
  if(!(d||s||bare||has(c,CHANGE)))continue;
  if(d&&!s)display=code;else if(s&&!d)speech=code;else{display=code;speech=code}
 }
 // Split role clauses even when speech recognition omits "and" or punctuation.
 const rolePattern=/(?:screen|display|स्क्रीन|सक्रीन|voice|speak(?:ing)?|talk|वॉइस|वॉयस|आवाज़|आवाज|बोलना|बात)/gi;
 const roles=Array.from(t.matchAll(rolePattern));
 if(roles.length>1){for(let i=0;i<roles.length;i++){
  const role=roles[i][0],part=t.slice(roles[i].index+role.length,roles[i+1]?.index??t.length);
  const code=lastLang(part);if(!code)continue;
  if(/screen|display|स्क्रीन|सक्रीन/i.test(role))display=code;else speech=code;
 }}
 if(!display&&!speech)return false;
 if(display){language=display;displayLanguageLocked=true}
 if(speech){speakingLanguage=speech;speechLanguageLocked=true}
 languageCommandMode=(display&&speech)?(display===speech?'unified':'separate'):(display?'display':'speech');
 lastLanguageChange={display,speech};
 try{localize()}catch(e){console.error('Localization after language change failed:',e)}
 return true;
}
const LANGUAGE_NATIVE_NAMES={hi:{hi:'हिंदी',en:'अंग्रेज़ी',pa:'पंजाबी',kn:'कन्नड़',ta:'तमिल',bn:'बंगाली'},en:{hi:'Hindi',en:'English',pa:'Punjabi',kn:'Kannada',ta:'Tamil',bn:'Bengali'},pa:{hi:'ਹਿੰਦੀ',en:'ਅੰਗਰੇਜ਼ੀ',pa:'ਪੰਜਾਬੀ',kn:'ਕੰਨੜ',ta:'ਤਮਿਲ',bn:'ਬੰਗਾਲੀ'},kn:{hi:'ಹಿಂದಿ',en:'ಇಂಗ್ಲಿಷ್',pa:'ಪಂಜಾಬಿ',kn:'ಕನ್ನಡ',ta:'ತಮಿಳು',bn:'ಬಂಗಾಳಿ'},ta:{hi:'இந்தி',en:'ஆங்கிலம்',pa:'பஞ்சாபி',kn:'கன்னடம்',ta:'தமிழ்',bn:'வங்காளம்'},bn:{hi:'হিন্দি',en:'ইংরেজি',pa:'পাঞ্জাবি',kn:'কন্নড়',ta:'তামিল',bn:'বাংলা'}};
function languageChangeConfirmation(){
 const ui=SUPPORTED_UI.includes(speakingLanguage)?speakingLanguage:'en';
 const n=LANGUAGE_NATIVE_NAMES[ui];
 const d=n[language]||n.en,v=n[speakingLanguage]||n.en;
 const same=language===speakingLanguage;
 const T={
  hi:{same:a=>`ठीक है, हम ${a} में बात करेंगे।`,diff:(a,b)=>`ठीक है, स्क्रीन ${a} में और बोलना ${b} में रहेगा।`},
  en:{same:a=>`Okay, we'll talk in ${a}.`,diff:(a,b)=>`Okay, the screen will be in ${a} and I'll speak in ${b}.`},
  pa:{same:a=>`ਠੀਕ ਹੈ, ਅਸੀਂ ${a} ਵਿੱਚ ਗੱਲ ਕਰਾਂਗੇ।`,diff:(a,b)=>`ਠੀਕ ਹੈ, ਸਕ੍ਰੀਨ ${a} ਵਿੱਚ ਅਤੇ ਬੋਲਣਾ ${b} ਵਿੱਚ ਰਹੇਗਾ।`},
  kn:{same:a=>`ಸರಿ, ನಾವು ${a} ಭಾಷೆಯಲ್ಲಿ ಮಾತನಾಡೋಣ.`,diff:(a,b)=>`ಸರಿ, ಪರದೆ ${a} ಭಾಷೆಯಲ್ಲಿ ಮತ್ತು ಮಾತು ${b} ಭಾಷೆಯಲ್ಲಿ ಇರುತ್ತದೆ.`},
  ta:{same:a=>`சரி, நாம் ${a} மொழியில் பேசுவோம்.`,diff:(a,b)=>`சரி, திரை ${a} மொழியிலும் பேச்சு ${b} மொழியிலும் இருக்கும்.`},
  bn:{same:a=>`ঠিক আছে, আমরা ${a} ভাষায় কথা বলব।`,diff:(a,b)=>`ঠিক আছে, পর্দা ${a} ভাষায় আর কথা ${b} ভাষায় থাকবে।`}}[ui];
 return same?T.same(d):T.diff(d,v);
}
function sendGeminiLanguageInstruction(){
 if(!geminiReady||geminiSocket?.readyState!==WebSocket.OPEN)return;
 const names={en:'English',hi:'Hindi',pa:'Punjabi',kn:'Kannada',ta:'Tamil',bn:'Bengali'};
 const displayName=names[language]||'English';const speechName=names[speakingLanguage]||'English';
 const neutral=' Never assume the customer\'s gender: address the customer with gender-neutral/respectful plural forms (Hindi: "आप ... सकते हैं", never "सकती हैं"; Punjabi: "ਤੁਸੀਂ ... ਸਕਦੇ ਹੋ").';
 let instruction;
 if(languageCommandMode==='separate')instruction=`The user explicitly requested separate languages. Keep all visible UI/form text in ${displayName}; speak in ${speechName}. Briefly confirm only this specific arrangement in ${speechName}. Do not change either preference unless explicitly asked. Continue the current conversation and form without resetting.`;
 else if(languageCommandMode==='display')instruction=`The user changed ONLY the visible screen language to ${displayName}. The app has already changed the screen. Keep speaking in ${speechName}. Briefly confirm in ${speechName} that the screen is now in ${displayName}. Never say the language is unsupported: Hindi, English, Punjabi, Kannada, Tamil and Bengali are all supported. Continue the current conversation and form without resetting.`;
 else if(languageCommandMode==='speech')instruction=`The user asked you to speak in ${speechName}. From now on speak ONLY in ${speechName} (Hindi in Devanagari, Punjabi in Gurmukhi, Kannada in Kannada script, Tamil in Tamil script, Bengali in Bengali script). Briefly confirm in ${speechName}. Never say the language is unsupported. Continue the current conversation and form without resetting.`;
 else instruction=`The user asked to switch to ${displayName}. Set BOTH the visible UI/form language and spoken response language to ${displayName}. Briefly confirm naturally in ${displayName} (for Hindi: “ठीक है, हम हिंदी में बात करेंगे।” For English: “Okay, we’ll speak in English.” For other languages, confirm naturally in that language). Never say the language is unsupported: Hindi, English, Punjabi, Kannada, Tamil and Bengali are all supported. Do NOT mention separate screen and speech languages. Continue the current conversation and form without resetting.`;
 geminiSocket.send(JSON.stringify({clientContent:{turns:[{role:'user',parts:[{text:`LANGUAGE PREFERENCE UPDATE: ${instruction}${neutral}${(()=>{const q=stagePrompt(speakingLanguage);return q?` Right after confirming, in the same turn, ask the customer this question in ${speechName}: "${q}"`:''})()}`}]}],turnComplete:true}}));
}
function speakFallbackNoticeThenGreeting(notice,code){
 const hindiVoiceCode='hi-IN', englishVoiceCode='en-IN';
 if(window.speechSynthesis&&window.SpeechSynthesisUtterance){
   window.speechSynthesis.cancel();
   const voices=window.speechSynthesis.getVoices();
   const hiVoice=chooseVoice(voices,['hi-IN','hi']);
   const enVoice=chooseVoice(voices,['en-IN','en-GB','en-US','en']);
   const first=new SpeechSynthesisUtterance(notice);first.lang=code==='hi'?hindiVoiceCode:englishVoiceCode;
   first.onend=()=>{
     const greetHindi=new SpeechSynthesisUtterance('नमस्ते! मैं आपकी क्या मदद कर सकती हूँ?');greetHindi.lang=hindiVoiceCode;if(hiVoice)greetHindi.voice=hiVoice;
     greetHindi.onend=()=>{const greetEnglish=new SpeechSynthesisUtterance('Hello! How may I help you?');greetEnglish.lang=englishVoiceCode;if(enVoice)greetEnglish.voice=enVoice;greetEnglish.onend=()=>{speechRestartAllowed=true;startRecognition()};greetEnglish.onerror=()=>{speechRestartAllowed=true;startRecognition()};window.speechSynthesis.speak(greetEnglish)};
     greetHindi.onerror=()=>{const greetEnglish=new SpeechSynthesisUtterance('Hello! How may I help you?');greetEnglish.lang=englishVoiceCode;if(enVoice)greetEnglish.voice=enVoice;greetEnglish.onend=()=>{speechRestartAllowed=true;startRecognition()};window.speechSynthesis.speak(greetEnglish)};
     window.speechSynthesis.speak(greetHindi);
   };
   first.onerror=()=>{speechRestartAllowed=true;startRecognition()};
   if(notice)window.speechSynthesis.speak(first);else first.onend();
 }else{speechRestartAllowed=true;startRecognition()}
}

async function autoCompleteDeposit(){
  try{
    await sleep(400);
    const amountInput=$('#selectedFormFields')?.querySelector('input[data-field="amount"]');
    if(amountInput&&detectedAmount){amountInput.value=detectedAmount;amountInput.dispatchEvent(new Event('input',{bubbles:true}))}
    const pv=$('#previewSampleForm');if(pv&&!pv.disabled)pv.click();
    announceSign();
    // The customer downloads after reviewing the preview.
  }catch(e){console.warn('Deposit auto flow failed',e)}
}
// Phone photos are 3-8 MB. Shrink to ~1800px JPEG before upload: much faster on slow links and much less work for the server's OCR.
async function shrinkImageForUpload(file){
  try{
    if(!file||!file.type||!file.type.startsWith('image/')||!window.createImageBitmap)return file;
    const bmp=await createImageBitmap(file,{imageOrientation:'from-image'});
    const max=1800,scale=Math.min(1,max/Math.max(bmp.width,bmp.height));
    if(scale>=1&&file.size<1.5*1024*1024){bmp.close?.();return file}
    const canvas=document.createElement('canvas');canvas.width=Math.round(bmp.width*scale);canvas.height=Math.round(bmp.height*scale);
    canvas.getContext('2d').drawImage(bmp,0,0,canvas.width,canvas.height);bmp.close?.();
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.88));
    return blob&&blob.size<file.size?new File([blob],'passbook.jpg',{type:'image/jpeg'}):file;
  }catch(error){console.warn('[ocr] could not shrink image, sending original',error);return file}
}
// Upload with a time limit and one automatic retry (a transient Gemini/network hiccup should not make the customer start over).
async function postPassbook(file){
  const attemptOnce=async()=>{
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),50000);
    try{
      const fd=new FormData();fd.append('file',file);
      const response=await fetch('/api/ocr/passbook',{method:'POST',body:fd,signal:ctl.signal});
      const d=await response.json().catch(()=>({}));
      return{response,d};
    }catch(error){
      if(error&&error.name==='AbortError')throw userError('Reading the passbook is taking too long. Please try again, or type the account number.');
      throw error;
    }finally{clearTimeout(timer)}
  };
  const readOk=r=>r.response.ok&&/^\d{8,18}$/.test(String(r.d.fields?.account_id?.value||'').trim());
  let first;const t0=Date.now();
  try{first=await attemptOnce()}catch(error){
    if(error&&error.userFacing)throw error;
    $('#ocrStatus').textContent='Still reading… trying once more.';return await attemptOnce();
  }
  // Retry only for failures that may be transient (server error / OCR backend unavailable), not for a clear "could not read this photo".
  const transient=(first.response.status>=500||first.d.engine==='OCR unavailable')&&Date.now()-t0<20000; // already waited long: do not double it
  if(readOk(first)||!transient)return first;
  $('#ocrStatus').textContent='Still reading… trying once more.';
  try{const second=await attemptOnce();return readOk(second)?second:(first.d.notice&&!second.d.notice?first:second)}catch{return first}
}
async function processPassbookImage(){
 if(!imageFile)return;
 passbookReading=true;const generation=++passbookReadGeneration;
 const passbookLoading=loadingCopy('passbook');showLoading(passbookLoading[0],passbookLoading[1]);$('#extract').disabled=true;$('#ocrStatus').textContent=manualMessage('reading');
 try{
  const {response,d}=await postPassbook(await shrinkImageForUpload(imageFile));
  if(generation!==passbookReadGeneration)return;
  if(!response.ok)throw userError(typeof d.detail==='string'&&response.status<500?d.detail:errCopy('generic'));
  const candidate=String(d.fields?.account_id?.value||'').trim();
  if(!/^\d{8,18}$/.test(candidate))throw userError(d.notice||'Could not read the account number clearly. Please choose another passbook photo.');
  passbook={name:'',account_id:candidate,branch:'',phone:'',profile:null,ocr_notice:d.notice||words(language).ocrReview};
  $('#confirmedAccount').value=candidate;
  const ocrScore=Number(d.fields?.account_id?.score);
  const needsExtraReview=!Number.isFinite(ocrScore)||ocrScore<0.85||d.quality?.image?.retake_suggested;
  $('#accountLookupStatus').textContent=needsExtraReview
    ? `Compare each digit with the passbook photo first. OCR is a suggestion, not verification. For a second check, read in groups: ${candidate.match(/.{1,4}/g).join('  ')}`
    : 'Compare the account number with the passbook photo before continuing.';
  $('#matchedCustomer').hidden=true;$('#confirmProfileWrap').hidden=true;$('#continueToForms').hidden=true;
  $('#confirmProfile').checked=false;
  const comparison=$('#confirmPassbookPreview');comparison.src=$('#preview').src;comparison.hidden=false;
  show('accountConfirmScreen');
 }catch(error){if(generation===passbookReadGeneration){$('#ocrStatus').textContent=safeMessage(error);$('#extract').disabled=false;$('#extract').hidden=false;}}finally{if(generation===passbookReadGeneration){hideLoading();passbookReading=false;}}
}
$('#lookupAccount').onclick=async()=>{const account=$('#confirmedAccount').value.trim();$('#continueToForms').hidden=true;$('#confirmProfileWrap').hidden=true;$('#matchedCustomer').hidden=true;$('#confirmProfile').checked=false;if(!/^\d{8,18}$/.test(account)){$('#accountLookupStatus').textContent=manualMessage('invalid');return}$('#lookupAccount').disabled=true;$('#accountLookupStatus').textContent=manualMessage('checking');try{const response=await fetch('/api/demo-profile/lookup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({account_id:account})});const data=await response.json();if(!response.ok||data.status!=='matched'){passbook.profile=null;$('#accountLookupStatus').textContent=manualMessage('notFound');return}const p=data.profile;passbook={...passbook,...p,account_id:p.account_id,name:p.name,phone:p.phone,branch:p.branch,profile:p};$('#matchedCustomer').textContent=[p.name, p.account_id, p.branch].filter(Boolean).join(' · ');$('#matchedCustomer').hidden=false;$('#confirmProfileWrap').hidden=false;$('#continueToForms').hidden=false;$('#accountLookupStatus').textContent=manualMessage('matched');$('#confirmProfile').focus()}catch(error){$('#accountLookupStatus').textContent=manualMessage('databaseError',{error:error.message})}finally{$('#lookupAccount').disabled=false}};
$('#confirmedAccount').oninput=()=>{passbook.profile=null;$('#matchedCustomer').hidden=true;$('#confirmProfileWrap').hidden=true;$('#confirmProfile').checked=false;$('#continueToForms').hidden=true};
$('#continueToForms').onclick=()=>{if(!passbook.profile||!$('#confirmProfile').checked){$('#accountLookupStatus').textContent=manualMessage('review');return}$('#passbookNotice').textContent=manualMessage('matched');$('#passbookNotice').hidden=false;show('formsScreen')};
$('#changePhoto').onclick=()=>{$('#image').value='';imageFile=null;$('#preview').hidden=true;$('#formPassbookPreview').hidden=true;$('#matchedCustomer').hidden=true;$('#confirmProfileWrap').hidden=true;showManualUpload()};
$('#image').onchange=()=>{const f=$('#image').files[0];if(!f)return;if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>8*1024*1024){$('#ocrStatus').textContent='Choose JPG or PNG under 8 MB. / 8 MB से छोटी JPG या PNG चुनें।';$('#image').value='';return}imageFile=f;$('#preview').src=URL.createObjectURL(f);$('#preview').hidden=false;$('#formPassbookPreview').src=$('#preview').src;$('#formPassbookPreview').hidden=false;processPassbookImage()};
// Voice selection for sample passbooks
const PASSBOOK_ORDINALS={
  1:['ಮೊದಲ','ಮೊದಲನೆ','ಮೊದಲನೇ','முதல்','முதலாவது','প্রথম','প্রথমটি','first','pehla','pehli','pahla','pahli','पहला','पहली','पहले','ਪਹਿਲਾ','ਪਹਿਲੀ'],
  2:['ಎರಡನೆ','ಎರಡನೇ','இரண்டாவது','দ্বিতীয়','দ্বিতীয়টি','second','doosra','dusra','doosri','dusri','दूसरा','दूसरी','दूजा','ਦੂਜਾ','ਦੂਜੀ'],
  3:['ಮೂರನೆ','ಮೂರನೇ','மூன்றாவது','তৃতীয়','তৃতীয়টি','third','teesra','tisra','teesri','tisri','तीसरा','तीसरी','ਤੀਜਾ','ਤੀਜੀ'],
  4:['ನಾಲ್ಕನೆ','ನಾಲ್ಕನೇ','நான்காவது','চতুর্থ','চতুর্থটি','fourth','chautha','chauthi','चौथा','चौथी','ਚੌਥਾ','ਚੌਥੀ'],
  5:['ಐದನೆ','ಐದನೇ','ஐந்தாவது','পঞ্চম','পঞ্চমটি','fifth','paanchwa','panchwa','paanchvi','पाँचवाँ','पांचवां','पाँचवीं','पांचवीं','पाँचवा','पांचवा','ਪੰਜਵਾਂ','ਪੰਜਵੀਂ'],
  6:['ಆರನೆ','ಆರನೇ','ஆறாவது','ষষ্ঠ','ষষ্ঠটি','sixth','chhatha','chhata','chhathi','छठा','छठी','छठवां','ਛੇਵਾਂ','ਛੇਵੀਂ']
};
const PASSBOOK_CARDINALS={
  1:['ಒಂದು','ஒன்று','এক','one','ek','एक','ਇੱਕ','ਇਕ','1'],
  2:['ಎರಡು','இரண்டு','দুই','দুটি','two','do','दो','ਦੋ','2'],
  3:['ಮೂರು','மூன்று','তিন','তিনটি','three','teen','tin','तीन','ਤਿੰਨ','3'],
  4:['ನಾಲ್ಕು','நான்கு','চার','চারটি','four','char','chaar','चार','ਚਾਰ','4'],
  5:['ಐದು','ஐந்து','পাঁচ','পাঁচটি','five','paanch','panch','पाँच','पांच','ਪੰਜ','5'],
  6:['ಆರು','ஆறு','ছয়','ছয়টি','six','chhe','chhah','chheh','chhe','छह','छः','छे','ਛੇ','6']
};
// Returns 1-6 for the passbook the customer named, or 0. The last number named wins ("not the first, the third one").
// Ordinals ("third") beat plain numbers so that "third one" is 3, not 1.
function passbookChoiceFromSpeech(text){
  const tokens=normalizeSpokenDigits(String(text||'').normalize('NFC').toLowerCase()).split(/[\s,.;:!?।|"'()\-]+/).filter(Boolean);
  const last=table=>{let found=0;for(const t of tokens)for(const [n,list] of Object.entries(table))if(list.includes(t))found=Number(n);return found};
  const ordinal=last(PASSBOOK_ORDINALS);if(ordinal)return ordinal;
  // A number said in an unrelated sentence ("five thousand") is not a passbook choice; require a short phrase or an explicit "number"/"passbook".
  const short=tokens.length<=5||tokens.some(t=>['number','no','nambar','nombar','नंबर','नम्बर','ਨੰਬਰ','passbook','passport','पासबुक','ਪਾਸਬੁੱਕ','ನಂಬರ್','ಪಾಸ್‌ಬುಕ್','நம்பர்','பாஸ்புக்','নম্বর','পাসবই'].includes(t));
  if(!short)return 0;
  if(tokens.some(t=>['hundred','thousand','hazaar','hazar','lakh','हजार','हज़ार','लाख','सौ','rupees','rupaye','रुपये','रुपए'].includes(t)))return 0;
  return last(PASSBOOK_CARDINALS);
}
let passbookPickedAt=0,passbookReading=false,passbookReadGeneration=0;
function selectPassbookByNumber(n){
  if(Date.now()-passbookPickedAt<4000)return;
  const button=document.querySelectorAll('[data-sample]')[n-1];if(!button||activeScreen!=='uploadScreen')return;
  passbookPickedAt=Date.now();
  if(!geminiActive()){speechRestartAllowed=false;try{speechRecognition?.stop()}catch{}try{stopServerRecognition()}catch{}}
  button.click();
}
document.querySelectorAll('[data-sample]').forEach(button=>button.onclick=async()=>{try{const response=await fetch(button.dataset.sample);if(!response.ok)throw userError(errCopy('generic'));const blob=await response.blob(),fileName=button.dataset.sample.split('/').pop();imageFile=new File([blob],fileName,{type:'image/png'});$('#image').value='';$('#preview').src=URL.createObjectURL(imageFile);$('#preview').hidden=false;$('#formPassbookPreview').src=$('#preview').src;$('#formPassbookPreview').hidden=false;await processPassbookImage()}catch(error){$('#ocrStatus').textContent=safeMessage(error)}});
$('#extract').onclick=processPassbookImage;
let selectedFormType=null;
const formDefinitions={
 deposit:{title:'Deposit Form',image:'/static/templates/deposit_challan.jpeg',fields:[['name','Account holder name',passbook.name],['account','Account number',passbook.account_id],['branch','Branch',passbook.branch],['phone','Phone number',passbook.phone],['amount','Deposit amount (INR)','']]},
 transaction:{title:'Other Form · Transfer Request',image:'/static/templates/idfc_transaction.jpeg',fields:[['account','Debit account number',passbook.account_id],['branch','Branch',passbook.branch],['beneficiary','Beneficiary name',''],['beneficiaryAccount','Beneficiary account',''],['ifsc','Beneficiary IFSC',''],['amount','Transfer amount (INR)','']]},
 'sbi-account-opening':{title:'Other Form · Identity Record Update',image:'/static/templates/sbi_account_opening.jpeg',fields:[['name','Applicant name',passbook.name],['branch','Branch',passbook.branch],['dob','Date of birth',passbook.profile?.date_of_birth||''],['address','Address',passbook.profile?.address||''],['mobile','Phone number',passbook.phone],['occupation','Occupation',passbook.profile?.occupation||''],['demoId','Synthetic Aadhaar-style reference',passbook.profile?.identifications?.DEMO_ID?.value||''],['demoPan','Synthetic PAN-style reference',passbook.profile?.identifications?.DEMO_PAN?.value||'']]},
 'account-opening':{title:'Other Form · Account Opening',image:'/static/templates/dtb_account_opening.jpeg',fields:[['name','Applicant name',passbook.name],['branch','Branch',passbook.branch],['address','Address',passbook.profile?.address||''],['phone','Phone number',passbook.phone],['email','Email address',''],['demoId','Synthetic Aadhaar-style reference',passbook.profile?.identifications?.DEMO_ID?.value||''],['demoPan','Synthetic PAN-style reference',passbook.profile?.identifications?.DEMO_PAN?.value||'']]},
 'dcb-request':{title:'Other Form · Customer Details Update',image:'/static/templates/dcb_customer_request.jpeg',fields:[['name','Customer name',passbook.name],['account','Account number',passbook.account_id],['branch','Branch',passbook.branch],['request','Requested update',''],['newContact','New contact details','']]}
};
function renderFormFields(definition){const root=$('#selectedFormFields');root.replaceChildren();const profile=passbook.profile||{};const passbookValues={name:passbook.name,account:passbook.account_id,branch:passbook.branch,phone:passbook.phone,mobile:passbook.phone,dob:profile.date_of_birth||'',address:profile.address||'',occupation:profile.occupation||'',ifsc:profile.ifsc||'',demoId:profile.identifications?.DEMO_ID?.value||'',demoPan:profile.identifications?.DEMO_PAN?.value||''};for(const [id,label,value] of definition.fields){const wrap=document.createElement('label');wrap.className='form-detail-field';wrap.textContent=label;const input=document.createElement('input');input.id='formField_'+id;input.value=(passbookValues[id]||value||'');input.autocomplete='off';input.dataset.field=id;input.addEventListener('input',()=>{resetSamplePreview();$('#otherFormStatus').textContent='Values changed. Preview the updated form again before downloading.'});wrap.append(input);root.append(wrap)}}
function currentFormFields(){const fields={};document.querySelectorAll('#selectedFormFields input').forEach(input=>fields[input.dataset.field]=input.value.trim());return fields}
function resetSamplePreview(){const frame=$('#samplePdfPreview');if(frame.dataset.objectUrl)URL.revokeObjectURL(frame.dataset.objectUrl);frame.dataset.objectUrl='';frame.removeAttribute('src');frame.hidden=true;$('#sampleSignatureCue').hidden=true;$('#downloadSampleForm').disabled=true}
function chooseOtherSubtype(type){selectedFormType=type;const def=formDefinitions[type];if(!def)return;resetSamplePreview();$('#otherFormTitle').textContent=def.title;$('#selectedFormImage').src=def.image;$('#selectedFormImage').hidden=false;$('#otherFormStatus').textContent='Enter the transaction amount, then preview the completed form.';$('#otherFormConfirm').checked=(type==='deposit');$('#otherFormConfirmWrap').hidden=true;renderFormFields(def)}
document.querySelectorAll('[data-form]').forEach(button=>button.onclick=()=>{const type=button.dataset.form;if(type==='withdrawal'){selectedFormType='withdrawal';currentIntent='withdrawal';flowStage='amount';showWithdrawal();return}$('#otherFormTypeWrap').hidden=true;chooseOtherSubtype('deposit');$('#otherFormTitle').textContent='Deposit Form';$('#otherFormPassbook').textContent='Account-holder details are filled from the matched account record.';$('#otherFormNotice').textContent='Enter only the deposit amount. Other fields are filled automatically from the account record.';$('#selectedFormFields').querySelectorAll('input').forEach(input=>{if(input.dataset.field!=='amount')input.readOnly=true});show('otherFormScreen')});
$('#otherFormType').onchange=()=>chooseOtherSubtype($('#otherFormType').value);
$('#otherFormConfirm').onchange=()=>{if(!$('#otherFormConfirm').checked)resetSamplePreview()};
$('#previewSampleForm').onclick=async()=>{if(!selectedFormType)return;if(selectedFormType!=='deposit'&&!$('#otherFormConfirm').checked){$('#otherFormStatus').textContent='This form is not available in the simplified kiosk flow.';return}if(selectedFormType==='deposit'&&!currentFormFields().amount){$('#otherFormStatus').textContent='Enter the deposit amount to continue.';return}const payload={form_id:selectedFormType,fields:currentFormFields(),confirmed:true};$('#previewSampleForm').disabled=true;$('#otherFormStatus').textContent='Generating the form preview…';try{const response=await fetch('/api/forms/sample-preview',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!response.ok){throw userError(await apiDetail(response))}const blob=await response.blob(),url=URL.createObjectURL(blob),frame=$('#samplePdfPreview');if(frame.dataset.objectUrl)URL.revokeObjectURL(frame.dataset.objectUrl);frame.dataset.objectUrl=url;frame.dataset.form=selectedFormType;frame.src=url+'#toolbar=0&navpanes=0&scrollbar=0&view=FitH';frame.hidden=false;$('#sampleSignatureCue').dataset.form=selectedFormType;$('#sampleSignatureCue').hidden=(selectedFormType!=='deposit');$('#downloadSampleForm').disabled=false; if(window.sahajV11){document.getElementById('v16DepositPdfHost').appendChild(frame);document.getElementById('v16DepositFull').href=url;show('v16DepositPreviewScreen');import('./paper-preview.mjs').then(m=>m.renderPaper(frame,url)).catch(console.warn);window.sahajV11.setPreviewGuide('deposit',{guideId:'v16DepositGuide',statusId:'v16DepositAutoStatus',signId:'v16DepositSignCue'});window.sahajV11.queueAfterGuidance('deposit',()=>{if(activeScreen==='v16DepositPreviewScreen'&&!document.getElementById('downloadSampleForm').disabled)document.getElementById('downloadSampleForm').click()},'v16DepositAutoStatus',()=>activeScreen==='v16DepositPreviewScreen');} $('#otherFormStatus').textContent='Preview is shown below. Inspect it before downloading.';/* Keep the page stable while the preview loads. */}catch(error){$('#otherFormStatus').textContent=safeMessage(error)}finally{$('#previewSampleForm').disabled=false}};
$('#downloadSampleForm').onclick=async()=>{if(!selectedFormType||$('#downloadSampleForm').disabled)return;if(selectedFormType!=='deposit'&&!$('#otherFormConfirm').checked){$('#otherFormStatus').textContent='This form is not available in the simplified kiosk flow.';return}if(selectedFormType==='deposit'&&!currentFormFields().amount){$('#otherFormStatus').textContent='Enter the deposit amount to continue.';return}const payload={form_id:selectedFormType,fields:currentFormFields(),confirmed:true};$('#downloadSampleForm').disabled=true;$('#otherFormStatus').textContent='Preparing download…';try{const response=await fetch('/api/forms/sample-pdf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!response.ok){throw userError(await apiDetail(response))}const blob=await response.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=formDefinitions[selectedFormType].title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-draft.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);$('#counterInstruction').textContent=(language==='hi'?'आपका फॉर्म डाउनलोड हो गया है। कृपया काउंटर 1 पर जाएँ।':'Download requested. Check your downloads, print the form, and move to Counter 1.');await loadCounter('cash_deposit');show('counterScreen');$('#counterInstruction').textContent=language==='hi'?'डाउनलोड शुरू करने की कोशिश की गई है। कृपया फ़ाइल प्रिंट करके काउंटर 1 पर जाएँ।':'Download requested. Check your downloads, print the form, and go to Counter 1.'}catch(error){$('#otherFormStatus').textContent=safeMessage(error);$('#downloadSampleForm').disabled=false}};
$('#otherFormBack').onclick=()=>{resetSamplePreview();show('formsScreen')};
$('#counterDone').onclick=endSession;$('#formsBack').onclick=()=>{mode='manual';$('#image').value='';imageFile=null;$('#preview').hidden=true;$('#formPassbookPreview').hidden=true;showManualUpload()};
$('#send').onclick=()=>{const typed=$('#utterance').value;if(parseLanguagePreferenceCommand(typed)){$('#utterance').value='';$('#requestResult').textContent=languageChangeConfirmation();$('#requestResult').hidden=false;return}interpret(typed).catch(()=>{$('#requestResult').textContent='Could not understand. Please try again.';$('#requestResult').hidden=false})};$('#utterance').onkeydown=e=>{if(e.key==='Enter')$('#send').click()};
$('#requestVoice').onclick=()=>{if(mode==='voice'&&geminiReady&&geminiSocket?.readyState===WebSocket.OPEN){resumeVoiceInput();return}mode='voice';speechRestartAllowed=true;startRecognition()};
$('#continueUpload').onclick=()=>{detectedAmount=$('#requestedAmount').value.trim();show('uploadScreen')};
function showWithdrawal(){if(!$('#amount').value&&detectedAmount)$('#amount').value=detectedAmount;$('#name').value=passbook.name;$('#account').value=passbook.account_id;$('#phone').value=passbook.phone;$('#branch').value=passbook.branch;show('withdrawalScreen');if(mode==='voice'&&!window.voiceJourney)autoCompleteWithdrawal()}
let autoCompleteRunning=false;
async function autoCompleteWithdrawal(){
  if(autoCompleteRunning)return;autoCompleteRunning=true;
  try{
    $('#confirm').checked=true;$('#confirm').dispatchEvent(new Event('input',{bubbles:true}));
    $('#download').hidden=true;$('#prepare').click();
    for(let i=0;i<50&&$('#download').hidden;i++){await sleep(300);if($('#profileStatus').textContent.trim())break}
    if($('#download').hidden)return; // validation problem or low balance: the on-screen message / balance prompt takes over
    announceSign();
    // Download remains an explicit customer action after preview.
  }catch(e){console.warn('Auto download failed',e)}finally{autoCompleteRunning=false}
}
$('#continueWithdrawal').onclick=()=>{detectedAmount=$('#requestedAmount').value.trim();if(mode==='voice'&&!imageFile){$('#requestResult').textContent='Please upload your passbook photo before preparing the withdrawal draft.';$('#continueUpload').hidden=false;return}showWithdrawal()};

let readyPayload=null, lastKnownBalance='';['amount','name','account','phone','branch','confirm','withdrawalType'].forEach(id=>$('#'+id).addEventListener('input',()=>{readyPayload=null;$('#download').hidden=true;if(id==='amount')$('#balancePrompt').hidden=true;}));
$('#showBalance').onclick=async()=>{const text=language==='hi'?`आपके खाते में अभी ${amountWords(lastKnownBalance,language)} हैं।`:language==='pa'?`ਤੁਹਾਡੇ ਖਾਤੇ ਵਿੱਚ ਇਸ ਵੇਲੇ ${amountWords(lastKnownBalance,language)} ਹਨ।`:TR(language,`Your current balance is ${amountWords(lastKnownBalance,language)}.`);$('#currentBalanceText').hidden=true;showBalanceBox(lastKnownBalance);if(mode==='voice'){const next=language==='hi'?'अब कृपया निकालने के लिए कम राशि बताइए।':language==='pa'?'ਹੁਣ ਕਿਰਪਾ ਕਰਕੇ ਕਢਵਾਉਣ ਲਈ ਘੱਟ ਰਕਮ ਦੱਸੋ।':TR(language,'Now please tell me a lower amount to withdraw.');flowStage='amount';await say(balanceSpeech(speakingLanguage),speakingLanguage,startRecognition)}};
$('#changeAmount').onclick=()=>{$('#balancePrompt').hidden=true;$('#currentBalanceText').hidden=true;$('#amount').focus();flowStage='amount';if(mode==='voice'){const prompt=language==='hi'?'कृपया कम राशि दर्ज करें।':'Please enter a lower amount.';say(prompt,language,startRecognition)}};
$('#prepare').onclick=async()=>{
 const payload={transaction:$('#withdrawalType').value,amount:$('#amount').value.trim(),name:$('#name').value.trim(),account_id:$('#account').value.trim(),phone:$('#phone').value.trim(),branch:$('#branch').value.trim(),confirmed:$('#confirm').checked};
 $('#balancePrompt').hidden=true;$('#currentBalanceText').hidden=true;$('#profileStatus').textContent='';
 let r,d;try{r=await fetch('/api/forms/prepare',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});d=await r.json()}catch(error){$('#profileStatus').textContent='Could not validate the draft. Please try again.';return}
 readyPayload=r.ok?payload:null;$('#download').hidden=true;$('#withdrawalPdfPreview').hidden=true;$('#signatureCue').hidden=true;$('#review').hidden=true;$('#review').textContent='';
 if(!r.ok){
   if(r.status===409&&d.detail&&typeof d.detail==='object'&&d.detail.code==='INSUFFICIENT_BALANCE'){
     lastKnownBalance=String(d.detail.balance||'0');flowStage='balance-check';
     const prompt=language==='hi'?`आपके खाते में इतनी राशि नहीं है। क्या आप अपना मौजूदा बैलेंस देखना चाहते हैं?`:language==='pa'?`ਤੁਹਾਡੇ ਖਾਤੇ ਵਿੱਚ ਇੰਨੀ ਰਕਮ ਨਹੀਂ ਹੈ। ਕੀ ਤੁਸੀਂ ਮੌਜੂਦਾ ਬਕਾਇਆ ਵੇਖਣਾ ਚਾਹੁੰਦੇ ਹੋ?`:TR(language,`Your account does not have enough balance for that withdrawal. Would you like to see your current balance?`);
     $('#balancePromptText').textContent=prompt;$('#showBalance').textContent=language==='hi'?'हाँ, बैलेंस दिखाएँ':language==='pa'?'ਹਾਂ, ਬਕਾਇਆ ਦਿਖਾਓ':TR(language,'Yes, show my balance');$('#changeAmount').textContent=language==='hi'?'नहीं, राशि बदलें':language==='pa'?'ਨਹੀਂ, ਰਕਮ ਬਦਲੋ':TR(language,'No, change amount');$('#balancePrompt').hidden=false;
     if(mode==='voice')await say(prompt,language,startRecognition);return;
   }
   $('#profileStatus').textContent=typeof d.detail==='string'?d.detail:errCopy('generic');return;
 }
 const pr=await fetch('/api/forms/withdrawal-preview',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
 if(!pr.ok){$('#profileStatus').textContent=await apiDetail(pr);return}
 const blob=await pr.blob(),url=URL.createObjectURL(blob),frame=$('#withdrawalPdfPreview');if(frame.dataset.objectUrl)URL.revokeObjectURL(frame.dataset.objectUrl);frame.dataset.objectUrl=url;frame.src=url;frame.hidden=false;$('#signatureCue').dataset.form='withdrawal';$('#signatureCue').hidden=false;$('#download').hidden=false;if(window.sahajV11){window.sahajV11.setPreviewGuide('withdrawal',{guideId:'v9PreviewGuide',statusId:'v9PreviewAutoStatus',signId:'v11WithdrawalSignHotspot'});} $('#review').textContent=language==='hi'?'नीचे पूरा फ़ॉर्म देखें, फिर डाउनलोड करें।':'Review the completed form below before downloading.';$('#review').hidden=false;
 /* Keep the page stable while the preview loads. */;
};
$('#download').onclick=async()=>{if(!readyPayload)return;const r=await fetch('/api/forms/pdf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(readyPayload)});if(!r.ok){$('#profileStatus').textContent=await apiDetail(r);return}const blob=await r.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='withdrawal-draft.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);$('#counterInstruction').textContent=(language==='hi'?'आपका निकासी फॉर्म डाउनलोड हो गया है। कृपया काउंटर 1 पर जाएँ।':'Download requested. Check your downloads, print the form, and move to Counter 1.');await loadCounter('cash_withdrawal');show('counterScreen');$('#counterInstruction').textContent=language==='hi'?'डाउनलोड शुरू करने की कोशिश की गई है। कृपया फ़ाइल प्रिंट करके काउंटर 1 पर जाएँ।':'Download requested. Check your downloads, print the form, and go to Counter 1.'};
$('#backToStart').onclick=()=>{customerHasSpoken=false;cancelAllSpeechAndGeminiAudio();hideLoading();currentIntent=null;detectedAmount='';flowStage='hello';passbook={name:'',account_id:'',branch:'',phone:'',profile:null};imageFile=null;$('#image').value='';$('#preview').hidden=true;$('#formPassbookPreview').hidden=true;$('#extract').disabled=true;$('#amount').value='';$('#withdrawalType').value='cash withdrawal';$('#requestedAmount').value='';$('#utterance').value='';$('#requestResult').hidden=true;$('#passbookNotice').hidden=true;$('#voiceChat').replaceChildren();$('#confirm').checked=false;$('#review').textContent='';$('#review').hidden=true;$('#download').hidden=true;resetIntentActions();if(mode==='voice'){show('voiceScreen');setListeningVisual(false);if(geminiConnectInProgress){$('#voiceStatus').textContent='';return}if(geminiSocket?.readyState===WebSocket.OPEN&&geminiReady){geminiMicPaused=false;geminiSpeaking=false;geminiUserAudioActive=false;try{playbackContext?.suspend();playbackContext?.resume()}catch{}const prompt=startOverPrompt(speakingLanguage);geminiMuteUntil=Date.now()+2500;startGreetingWatchdog(prompt,speakingLanguage);geminiSocket.send(JSON.stringify({clientContent:{turns:[{role:'user',parts:[{text:'Restart the conversation without reconnecting or showing a connection/loading dialog. The customer pressed the Start over button. Say exactly this, in the spoken language only, then listen. Do not list services or add anything else. Speak only in the selected language. Do not mix languages: '+prompt+'. Keep listening active after the greeting. Do not ask for microphone permission again.'}]}],turnComplete:true}}));}else if(voiceFallbackStarted){const greeting=startOverPrompt(speakingLanguage);showVoiceStatus('');say(greeting,speakingLanguage,startRecognition)}else if(activeMicStream&&activeMicStream.getAudioTracks().some(t=>t.readyState==='live')){geminiMicPaused=false;showVoiceStatus('');fallbackToBrowserVoice('Gemini connection is no longer available; switching to browser voice without asking for microphone permission again.')}else if(micPermissionGranted){showVoiceStatus('Microphone permission is already granted.');askMicrophone()}else{show('permissionScreen')}}else showManualUpload()};
language='en';speakingLanguage='en';localize();$('#fallbackActions').hidden=false;show('permissionScreen');
// Ask for the microphone only when the browser has not already been given permission.
function applyMicPermissionState(state){
  micPermissionGranted=state==='granted'||(micPermissionGranted&&state!=='denied'&&state!=='prompt');
  if(state==='granted'){micPermissionGranted=true;}
  else{micPermissionGranted=false;
    if(state==='denied')$('#permissionStatus').textContent='Microphone is blocked for this site. Enable it in browser site settings, or continue without voice.'}
}
async function detectMicPermission(){
  // Permissions API (Chrome/Edge/Firefox); Safari and some browsers throw, so fall back to device labels, which are only visible once permission was given.
  try{const st=await navigator.permissions.query({name:'microphone'});try{st.onchange=()=>applyMicPermissionState(st.state)}catch{}if(st.state==='granted'||st.state==='denied')return st.state}catch{}
  try{const d=await navigator.mediaDevices.enumerateDevices();if(d.some(x=>x.kind==='audioinput'&&x.label))return'granted'}catch{}
  return'prompt';
}
(async()=>{
  const state=await detectMicPermission();applyMicPermissionState(state);
  // A previous permission grant never starts recording without a new user action.
})();


// Amount label follows the selected screen language.
function showAmountBox(amount){const box=$('#requestResult');if(!box)return;renderAmountBox(box,amount);box.hidden=false}
function refreshAmountBox(){if(flowStage==='amount-confirmed'&&detectedAmount&&activeScreen==='requestScreen'){const box=$('#requestResult');if(box&&!box.hidden)renderAmountBox(box,detectedAmount)}}
// Show signing guidance before the download and counter steps.
const SIGN_PROMPT={en:'Your form is ready. Please sign inside the highlighted box on the form. Review it, then press Download. Sign the printed copy.',hi:'आपका फ़ॉर्म तैयार है। कृपया फ़ॉर्म में हाइलाइट किए गए बॉक्स में हस्ताक्षर करें। जाँचकर डाउनलोड दबाएँ। छपी प्रति पर हस्ताक्षर करें।',pa:'ਤੁਹਾਡਾ ਫਾਰਮ ਤਿਆਰ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਫਾਰਮ ਵਿੱਚ ਹਾਈਲਾਈਟ ਕੀਤੇ ਬਾਕਸ ਵਿੱਚ ਦਸਤਖ਼ਤ ਕਰੋ। ਜਾਂਚ ਕੇ ਡਾਊਨਲੋਡ ਦਬਾਓ। ਛਪੀ ਕਾਪੀ ਤੇ ਦਸਤਖ਼ਤ ਕਰੋ।',kn:'ನಿಮ್ಮ ಫಾರ್ಮ್ ಸಿದ್ಧವಾಗಿದೆ. ದಯವಿಟ್ಟು ಫಾರ್ಮ್‌ನಲ್ಲಿ ಹೈಲೈಟ್ ಮಾಡಿದ ಪೆಟ್ಟಿಗೆಯಲ್ಲಿ ಸಹಿ ಮಾಡಿ. ಪರಿಶೀಲಿಸಿ, ನಂತರ ಡೌನ್‌ಲೋಡ್ ಒತ್ತಿರಿ. ಮುದ್ರಿತ ಪ್ರತಿಗೆ ಸಹಿ ಮಾಡಿ.',ta:'உங்கள் படிவம் தயார். தயவுசெய்து படிவத்தில் குறிக்கப்பட்ட பெட்டியில் கையொப்பமிடுங்கள். சரிபார்த்து, பதிவிறக்கு என்பதை அழுத்தவும். அச்சிட்ட நகலில் கையொப்பமிடுங்கள்.',bn:'আপনার ফর্ম প্রস্তুত। অনুগ্রহ করে ফর্মের চিহ্নিত বাক্সে সই করুন। যাচাই করে ডাউনলোড চাপুন। ছাপা কপিতে সই করুন।'};
const COUNTER_PROMPT={en:'Download requested. Check your downloads, print the form, and move to Counter 1.',hi:'आपका फ़ॉर्म डाउनलोड हो गया है। कृपया काउंटर 1 पर जाइए।',pa:'ਤੁਹਾਡਾ ਫਾਰਮ ਡਾਊਨਲੋਡ ਹੋ ਗਿਆ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਕਾਊਂਟਰ 1 ਤੇ ਜਾਓ।',kn:'ನಿಮ್ಮ ಫಾರ್ಮ್ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ. ದಯವಿಟ್ಟು ಕೌಂಟರ್ 1 ಕ್ಕೆ ಹೋಗಿ.',ta:'உங்கள் படிவம் பதிவிறக்கப்பட்டது. தயவுசெய்து கவுண்டர் 1-க்குச் செல்லவும்.',bn:'আপনার ফর্ম ডাউনলোড হয়েছে। অনুগ্রহ করে কাউন্টার ১-এ যান।'};
function announceSign(){const c=SIGN_PROMPT[speakingLanguage]?speakingLanguage:'en';say(SIGN_PROMPT[c],c)}
function announceCounter(){const c=COUNTER_PROMPT[speakingLanguage]?speakingLanguage:'en';const text=withCounter(COUNTER_PROMPT[c]);gnaniSpeak(text,c).then(ok=>{if(ok)return;if(window.speechSynthesis&&window.SpeechSynthesisUtterance){window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=synthLocale(c);getVoicesWhenReady().then(vs=>{const v=chooseVoice(vs,[synthLocale(c)]);if(v)u.voice=v;window.speechSynthesis.speak(u)}).catch(()=>window.speechSynthesis.speak(u))}else showVoiceStatus(text)})}

// After a language change, repeat the question for the current step in the spoken language so the conversation never stalls.
function stagePrompt(code){
 const c=SUPPORTED_UI.includes(code)?code:'en';
 if(flowStage==='amount-confirmed'&&detectedAmount)return amountConfirmation(detectedAmount,c);
 const prompts={
  en:{balance:'Would you like to see your current balance? Please say yes or no.',withdraw:'How much would you like to withdraw?',deposit:'How much would you like to deposit?',passbook:'Please choose Demo passbook to continue.',request:'How may I help you? You can say withdraw cash or deposit money.'},
  hi:{balance:'क्या आप अपना मौजूदा बैलेंस देखना चाहते हैं? हाँ या नहीं कहें।',withdraw:'कितनी राशि निकालनी है?',deposit:'कितनी राशि जमा करनी है?',passbook:'आगे बढ़ने के लिए डेमो पासबुक चुनें।',request:'आपको क्या काम है? आप पैसे निकालना या जमा करना बोल सकते हैं।'},
  pa:{balance:'ਕੀ ਤੁਸੀਂ ਆਪਣਾ ਬਕਾਇਆ ਦੇਖਣਾ ਚਾਹੁੰਦੇ ਹੋ? ਹਾਂ ਜਾਂ ਨਹੀਂ ਕਹੋ।',withdraw:'ਤੁਸੀਂ ਕਿੰਨੀ ਰਕਮ ਕਢਵਾਉਣੀ ਚਾਹੁੰਦੇ ਹੋ?',deposit:'ਤੁਸੀਂ ਕਿੰਨੀ ਰਕਮ ਜਮ੍ਹਾਂ ਕਰਵਾਉਣੀ ਚਾਹੁੰਦੇ ਹੋ?',passbook:'ਅੱਗੇ ਵਧਣ ਲਈ ਡੈਮੋ ਪਾਸਬੁੱਕ ਚੁਣੋ।',request:'ਤੁਹਾਨੂੰ ਕੀ ਕੰਮ ਹੈ? ਤੁਸੀਂ ਪੈਸੇ ਕਢਵਾਉਣਾ ਜਾਂ ਜਮ੍ਹਾਂ ਕਰਵਾਉਣਾ ਕਹਿ ਸਕਦੇ ਹੋ।'},
  bn:{balance:'আপনি কি আপনার বর্তমান ব্যালেন্স দেখতে চান? হ্যাঁ বা না বলুন।',withdraw:'আপনি কত টাকা তুলতে চান?',deposit:'আপনি কত টাকা জমা দিতে চান?',passbook:'এগিয়ে যেতে ডেমো পাসবই বেছে নিন।',request:'আমি কীভাবে সাহায্য করতে পারি? টাকা তুলতে বা জমা দিতে চাই বলতে পারেন।'},
  ta:{balance:'உங்கள் கணக்கு இருப்பைப் பார்க்க வேண்டுமா? ஆம் அல்லது இல்லை என்று சொல்லுங்கள்.',withdraw:'எவ்வளவு பணம் எடுக்க விரும்புகிறீர்கள்?',deposit:'எவ்வளவு பணம் செலுத்த விரும்புகிறீர்கள்?',passbook:'தொடர மாதிரி பாஸ்புக்கைத் தேர்வு செய்யுங்கள்.',request:'நான் எப்படி உதவலாம்? பணம் எடுக்க அல்லது செலுத்த வேண்டும் என்று சொல்லலாம்.'},
  kn:{balance:'ನಿಮ್ಮ ಖಾತೆಯ ಬಾಕಿಯನ್ನು ನೋಡಬೇಕೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಎಂದು ಹೇಳಿ.',withdraw:'ಎಷ್ಟು ಹಣ ಹಿಂಪಡೆಯಲು ಬಯಸುತ್ತೀರಿ?',deposit:'ಎಷ್ಟು ಹಣ ಜಮೆ ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?',passbook:'ಮುಂದುವರಿಯಲು ಡೆಮೊ ಪಾಸ್‌ಬುಕ್ ಆಯ್ಕೆಮಾಡಿ.',request:'ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ? ಹಣ ತೆಗೆಯಲು ಅಥವಾ ಜಮೆ ಮಾಡಲು ಹೇಳಬಹುದು.'}
 }[c];
 if(flowStage==='balance-check')return prompts.balance;
 if(flowStage==='amount')return currentIntent==='deposit'?prompts.deposit:prompts.withdraw;
 if(flowStage==='passbook')return prompts.passbook;
 if(flowStage==='hello'||flowStage==='request')return prompts.request;
 return '';
}

function startOverPrompt(code){const c=SUPPORTED_UI.includes(code)?code:'en';return ({en:'Let us start again. How may I help you?',hi:'फिर से शुरू करते हैं। आपको क्या काम है?',pa:'ਮੁੜ ਸ਼ੁਰੂ ਕਰਦੇ ਹਾਂ। ਤੁਹਾਨੂੰ ਕੀ ਕੰਮ ਹੈ?',bn:'আবার শুরু করি। আপনাকে কীভাবে সাহায্য করতে পারি?',ta:'மீண்டும் தொடங்கலாம். நான் எப்படி உதவலாம்?',kn:'ಮತ್ತೆ ಪ್ರಾರಂಭಿಸೋಣ. ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?'})[c]}
function endsAffirmative(text){return /(?:^|[\s,.।!?])(?:yes|yeah|yep|haan|han|ji|theek hai|हाँ|हां|जी हाँ|जी हां|ठीक है|ਹਾਂ|ਜੀ ਹਾਂ|ಹೌದು|ಸರಿ|ஆம்|ஆமாம்|சரி|হ্যাঁ|হাঁ|ঠিক আছে|ঠিক)[।.!\s]*$/i.test((text||'').trim())}

// Gemini hears the customer's "yes" directly, but its transcript of that "yes" is unreliable. When Gemini says it is moving to the passbook
// step (and is not asking a question), move the screen too so voice and screen never disagree.
let lastModelAmount='';
function maybeAdvanceFromModel(text){
  if(!text||mode!=='voice'||!['amount','amount-confirmed','request'].includes(flowStage)||activeScreen!=='requestScreen')return;
  if(currentIntent!=='withdrawal'&&currentIntent!=='deposit')return;
  const v=spokenNumberValue(text);if(v)lastModelAmount=v;
  if(!/passbook|\u092a\u093e\u0938\u092c\u0941\u0915|\u0a2a\u0a3e\u0a38\u0a2c\u0a41\u0a71\u0a15|\u067e\u0627\u0633\s?\u0628\u06a9/i.test(text))return;
  if(/\?|\u061f|\u0938\u0939\u0940 \u0939\u0948|\u0a38\u0a39\u0a40 \u0a39\u0a48|\u062f\u0631\u0633\u062a|correct|yes or no/i.test(text))return;
  if(!detectedAmount&&lastModelAmount){detectedAmount=lastModelAmount;$('#requestedAmount').value=lastModelAmount;$('#amount').value=lastModelAmount}
  if(!detectedAmount)return;
  try{geminiAdvanceAfterAmount()}catch(e){console.warn('Advance from model speech failed',e)}
}
// Audio must be unlocked inside the click that starts voice mode, before the microphone permission dialog uses up the user gesture.
function primeAudioContexts(){
  try{const AC=window.AudioContext||window.webkitAudioContext;
    if(!micAudioContext||micAudioContext.state==='closed')micAudioContext=new AC();
    if(!playbackContext||playbackContext.state==='closed')playbackContext=new AC();
    micAudioContext.resume?.().catch(()=>{});playbackContext.resume?.().catch(()=>{});
    const once=()=>{micAudioContext?.resume?.().catch(()=>{});playbackContext?.resume?.().catch(()=>{});document.removeEventListener('pointerdown',once,true);document.removeEventListener('keydown',once,true)};
    document.addEventListener('pointerdown',once,true);document.addEventListener('keydown',once,true);
  }catch(e){console.warn('Audio priming failed',e)}
}

let earlyYesAt=0,confirmReaskTimer=null;
function looseYes(t){return /^(?:ye|yea|yeah|yes|ya|yup|ha|haa|haan|han|ok|okay|sure|ji|\u0939\u093e|\u0939\u093e\u0901|\u0939\u093e\u0902|\u0939\u093e\u0928|\u091c\u0940|\u0920\u0940\u0915|\u0a39\u0a3e\u0a02|\u0a1c\u0a40|\u06c1\u0627\u06ba|\u062c\u06cc)(?:\s+(?:ji|\u091c\u0940|\u0939\u0948|hai|\u0a39\u0a48|\u06c1\u06d2))?[\u0964.!?\s]*$/i.test((t||'').trim())}
function looseNo(t){return /^(?:no|nope|nah|na|nahi|nahin|\u0928\u0939\u0940\u0902|\u0928\u0939\u0940|\u0928\u093e|\u0a28\u0a39\u0a40\u0a02|\u0646\u06c1\u06cc\u06ba)(?:\s+(?:ji|\u091c\u0940))?[\u0964.!?\s]*$/i.test((t||'').trim())}
// If the customer cut the confirmation question short and nothing usable was understood, ask it again instead of staying silent.
function scheduleConfirmReask(){
  if(flowStage!=='amount-confirmed'||!detectedAmount)return;
  clearTimeout(confirmReaskTimer);const amountAtCut=String(detectedAmount);
  confirmReaskTimer=setTimeout(()=>{
    if(flowStage==='amount-confirmed'&&String(detectedAmount)===amountAtCut&&!geminiSpeaking&&!geminiUserAudioActive&&activeScreen==='requestScreen'){
      const c=SUPPORTED_UI.includes(speakingLanguage)?speakingLanguage:'hi';
      say(amountConfirmation(detectedAmount,c),c);
    }
  },5000);
}

let micLoudFrames=0,micLastLoudAt=0,lastModelAudioAt=0;
function indianNumber(n){const v=Number(n);return Number.isFinite(v)?v.toLocaleString('en-IN'):String(n)}
function amountBoxLabel(code,kind){const L={amount:{en:'Amount heard',hi:'सुनी गई राशि',pa:'ਸੁਣੀ ਗਈ ਰਕਮ'},balance:{en:'Your demo balance',hi:'आपका डेमो बैलेंस',pa:'ਤੁਹਾਡਾ ਡੈਮੋ ਬਕਾਇਆ'}};return (L[kind][code]||L[kind].en)}
function bigNumberBox(label,amount,code,note){const wrap=document.createElement('div');wrap.className='big-amount';const a=document.createElement('small');a.textContent=label;const n=document.createElement('strong');n.textContent='₹ '+indianNumber(amount);const w=document.createElement('span');w.textContent=amountWords(String(amount),code);wrap.append(a,n,w);if(note){const d=document.createElement('em');d.className='source-note';d.textContent=note;wrap.append(d)}return wrap}
function renderAmountBox(box,amount){if(!box)return;const c=SUPPORTED_UI.includes(language)?language:'hi';const p=document.createElement('p');p.textContent=amountConfirmation(amount,c);const n=document.createElement('p');n.className='amount-small';n.textContent='₹ '+indianNumber(amount);box.replaceChildren(p,n)}
function showBalanceBox(balance){const c=SUPPORTED_UI.includes(language)?language:'hi';const card=bigNumberBox(amountBoxLabel(c,'balance'),balance,c,'SYNTHETIC DEMO BALANCE · demo bank record · '+new Date().toLocaleString('en-IN'));
  if(activeScreen==='requestScreen'||activeScreen==='voiceScreen'){const rb=$('#requestBalance'),host=$('#requestBalanceBig');if(rb&&host){host.replaceChildren(card);host.hidden=false;rb.hidden=false;const pp=$('#requestBalancePrompt');if(pp)pp.textContent='';$('#requestBalanceActions').hidden=true;$('#requestResult').hidden=true;try{rb.scrollIntoView({behavior:'smooth',block:'center'})}catch{}return}}
  const host=$('#balanceBig');if(!host)return;host.replaceChildren(card);host.hidden=false;try{host.scrollIntoView({behavior:'smooth',block:'center'})}catch{}}
function halfNumberValue(text){const t=(text||'').toLowerCase();const unit=/(lakhs?|lacs?|\u0932\u093e\u0916|thousand|hazaar|hazar|\u0939\u091c\u093e\u0930|\u0939\u095b\u093e\u0930)/;const m=t.match(new RegExp('(\u0921\u0947\u0922\u093c?|dedh|one and a half|1\\.5|\u0922\u093e\u0908|dhai|two and a half|2\\.5)\\s*'+unit.source));if(!m)return'';const big=/lakh|lac|\u0932\u093e\u0916/.test(m[2]);const one=/\u0921\u0947\u0922|dedh|one and a half|1\.5/.test(m[1]);return String((one?1.5:2.5)*(big?100000:1000))}
// If Gemini never produces audio after a (re)start greeting, speak it with the browser voice so the screen never just sits on "Namaste".
const HINDI_GREETING_ROMAN='Namaste! Main aapki kaise madad kar sakti hoon?';
function browserSpeak(text,lang){try{if(!window.speechSynthesis)return;const voices=window.speechSynthesis.getVoices();let voice=chooseVoice(voices,[lang]);
  if(!voice&&lang.toLowerCase().startsWith('hi')){text=HINDI_GREETING_ROMAN;lang='en-IN';voice=chooseVoice(voices,['en-IN','en-GB','en-US','en'])} // no Hindi voice installed
  const u=new SpeechSynthesisUtterance(text);u.lang=lang;if(voice)u.voice=voice;window.speechSynthesis.speak(u)}catch{}}
function startGreetingWatchdog(text,code){const t0=Date.now();bargeInBlockedUntil=t0+9000;setTimeout(()=>{if(lastModelAudioAt>=t0||mode!=='voice'||flowStage!=='hello')return;if(code==='bi'){const[h,e]=text.split('|');browserSpeak(h,'hi-IN');browserSpeak(e,'en-IN')}else browserSpeak(text,synthLocale(code))},7000)}

function balanceSpeech(code){const c=SUPPORTED_UI.includes(code)?code:'hi';return pick({
  en:'I am showing your balance on the screen. Now please tell me a lower amount to withdraw.',
  hi:'आपका बैलेंस स्क्रीन पर दिखा रहे हैं। अब कृपया निकालने के लिए कम राशि बताइए।',
  pa:'ਤੁਹਾਡਾ ਬਕਾਇਆ ਸਕ੍ਰੀਨ ਤੇ ਦਿਖਾ ਰਹੇ ਹਾਂ। ਹੁਣ ਕਿਰਪਾ ਕਰਕੇ ਕਢਵਾਉਣ ਲਈ ਘੱਟ ਰਕਮ ਦੱਸੋ।'},c)}

// The balance question and the balance itself live on the request screen (the withdrawal screen is not visible at this point).
function hideRequestBalance(){const rb=$('#requestBalance');if(rb)rb.hidden=true;const h=$('#requestBalanceBig');if(h)h.hidden=true;const a=$('#requestBalanceActions');if(a)a.hidden=false}
function setBalancePrompt(prompt){
  $('#balancePromptText').textContent=prompt;$('#balancePrompt').hidden=false;
  const rb=$('#requestBalance');if(!rb)return;
  const c=SUPPORTED_UI.includes(language)?language:'hi';
  $('#requestBalancePrompt').textContent=prompt;$('#requestBalanceBig').hidden=true;$('#requestBalanceActions').hidden=false;
  $('#requestBalanceYes').textContent=pick({en:'Yes, show my balance',hi:'हाँ, बैलेंस दिखाएँ',pa:'ਹਾਂ, ਬਕਾਇਆ ਦਿਖਾਓ'},c);
  $('#requestBalanceNo').textContent=pick({en:'No, change amount',hi:'नहीं, राशि बदलें',pa:'ਨਹੀਂ, ਰਕਮ ਬਦਲੋ'},c);
  $('#requestResult').hidden=true;rb.hidden=false;
}
$('#requestBalanceYes').onclick=()=>$('#showBalance').click();
$('#requestBalanceNo').onclick=()=>{hideRequestBalance();$('#changeAmount').click()};
$('#changeAmount').addEventListener('click',hideRequestBalance);


// Keep deposit preview controls visible without scrolling.
document.getElementById('v16DepositDownload').onclick=()=>document.getElementById('downloadSampleForm').click();
document.getElementById('v16DepositBack').onclick=()=>show('otherFormScreen');

// Keep download failures visible on the preview where the customer can retry.
for(const [buttonId,statusId] of [['download','v9PreviewAutoStatus'],['downloadSampleForm','v16DepositAutoStatus']]){
 const button=document.getElementById(buttonId),original=button.onclick;let downloading=false;
 button.onclick=async()=>{if(downloading)return;downloading=true;try{await original();}catch(error){const status=document.getElementById(statusId);status.textContent=language==='hi'?'डाउनलोड शुरू नहीं हुआ। कृपया फिर से डाउनलोड दबाएँ।':'Download could not start. Please try Download again.';status.hidden=false;button.disabled=false;}finally{downloading=false;}};
}
