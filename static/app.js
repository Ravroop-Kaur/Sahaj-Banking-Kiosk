const $ = s => document.querySelector(s);
const screens = ['permissionScreen','languageScreen','voiceScreen','uploadScreen','accountConfirmScreen','formsScreen','otherFormScreen','requestScreen','withdrawalScreen','counterScreen'];
let language='hi', speakingLanguage='hi', speechLanguageLocked=false, displayLanguageLocked=false, languageCommandMode='unified', mode='', activeScreen='permissionScreen', languageReturnScreen='uploadScreen', recognition=null, recorder=null, recordedChunks=[], recordTimer=null, imageFile=null, currentIntent=null, flowStage='hello', passbook={name:'',account_id:'',branch:''}, detectedAmount='', realtimePeer=null, realtimeChannel=null, realtimeStream=null, realtimeBusy=false;
const copy={
 en:{permissionTitle:'Talk to your banking helper',permissionText:'Allow microphone access to speak naturally. You can choose to continue without voice at any time.',voice:'Continue with voice',retry:'Try voice again',manual:'Continue without voice',language:'Choose your language',next:'Continue',upload:'Choose a passbook',uploadDesc:'Choose one of six synthetic passbook examples. Each has a different layout or image condition.',choosePhoto:'Choose a sample passbook',tapPhoto:'Select one of the six synthetic examples below',process:'Read selected passbook',help:'How may I help you?',example:'For example: withdraw cash, deposit money, or link Aadhaar.',withdraw:'I can help prepare a withdrawal draft. How much would you like to withdraw?',unsupported:'This service currently supports only cash withdrawal and cash deposit forms. The requested service is not supported. Please choose withdrawal or deposit, the services currently available at this kiosk.',unclear:'I did not understand that request. Please say or type what you need.',greeting:'How may I help you?',listening:'Listening…',speak:'🎙 Speak',stop:'Stop listening',withdrawal:'Withdrawal draft',amount:'Withdrawal amount (₹)',continueDraft:'Continue withdrawal draft',uploadBook:'Upload passbook photo',reviewDraft:'Review withdrawal draft',download:'Download withdrawal PDF draft',voiceHint:'Tap the microphone and speak. The app will try to infer your language from your words.',permissionDenied:'Microphone access was not granted. Allow it in browser site settings, then retry voice, or continue without voice.',speechUnavailable:'This browser does not provide speech recognition. Retry in a supported browser, or continue without voice.',speechError:'Speech was not recognized. Try again, or switch to manual help.',ocrReview:'OCR suggestions are unverified. Check and correct every value.',unsupportedHint:'This request is outside the one form currently available in this demo.'},
 hi:{permissionTitle:'बैंकिंग सहायता के लिए बोलें',permissionText:'बात करने के लिए माइक्रोफ़ोन की अनुमति दें। आप चाहें तो बिना आवाज़ भी आगे बढ़ सकते हैं।',voice:'आवाज़ के साथ आगे बढ़ें',retry:'आवाज़ फिर से आज़माएँ',manual:'बिना आवाज़ आगे बढ़ें',language:'अपनी भाषा चुनें',next:'आगे बढ़ें',upload:'पासबुक की तस्वीर अपलोड करें',uploadDesc:'साफ़ JPG या PNG तस्वीर चुनें। काल्पनिक या छिपी जानकारी वाला नमूना लें।',choosePhoto:'पासबुक की तस्वीर चुनें',tapPhoto:'तस्वीर लेने या चुनने के लिए यहाँ दबाएँ',process:'पासबुक की तस्वीर पढ़ें',help:'मैं आपकी कैसे मदद कर सकती हूँ?',example:'जैसे: पैसे निकालना, जमा करना या आधार जोड़ना।',withdraw:'मैं निकासी का मसौदा तैयार कर सकती हूँ। आप कितनी राशि निकालना चाहते हैं?',unsupported:'इस डेमो में इस काम का फ़ॉर्म अभी उपलब्ध नहीं है। कृपया बैंक कर्मचारी से मदद लें।',unclear:'मैं समझ नहीं पाई। कृपया बताइए कि आपको क्या काम करना है।',unsupported:'यह सेवा अभी उपलब्ध नहीं है। इस कियोस्क पर केवल नकद निकासी और नकद जमा की सुविधा उपलब्ध है। कृपया उपलब्ध सेवाओं में से निकासी या जमा चुनें।',greeting:'मैं आपकी कैसे मदद कर सकती हूँ?',listening:'सुन रही हूँ…',speak:'🎙 बोलें',stop:'सुनना रोकें',withdrawal:'निकासी का मसौदा',amount:'निकासी की राशि (₹)',continueDraft:'निकासी का मसौदा जारी रखें',uploadBook:'पासबुक की तस्वीर अपलोड करें',reviewDraft:'निकासी का मसौदा देखें',download:'निकासी PDF मसौदा डाउनलोड करें',voiceHint:'माइक्रोफ़ोन दबाकर बोलें। ऐप आपके शब्दों से भाषा पहचानने की कोशिश करेगा।',permissionDenied:'माइक्रोफ़ोन की अनुमति नहीं मिली। ब्राउज़र सेटिंग में अनुमति दें और फिर कोशिश करें, या बिना आवाज़ आगे बढ़ें।',speechUnavailable:'इस ब्राउज़र में आवाज़ पहचान उपलब्ध नहीं है। दूसरे ब्राउज़र में कोशिश करें या बिना आवाज़ आगे बढ़ें।',speechError:'आवाज़ समझ नहीं आई। फिर कोशिश करें या बिना आवाज़ मदद लें।',ocrReview:'निकाले गए विवरण पक्के नहीं हैं। हर जानकारी जाँचें और सुधारें।'},
 doi:{permissionTitle:'बैंक दी मदद लेई बोलो',permissionText:'गल-बात लेई माइक्रोफोन दी इजाज़त देओ। तुस चाहो तां बिनां आवाज़ बी अग्गें जाई सकदे ओ।',voice:'आवाज़ कन्नै अग्गें जाओ',retry:'आवाज़ फिर आज़माओ',manual:'बिनां आवाज़ अग्गें जाओ',language:'अपनी भाषा चुनो',next:'अग्गें जाओ',upload:'पासबुक दी फोटो चढ़ाओ',uploadDesc:'साफ़ JPG जां PNG फोटो चुनो। काल्पनिक जां लुकाई जानकारी वाला नमूना बरतो।',choosePhoto:'पासबुक दी फोटो चुनो',tapPhoto:'फोटो खिच्चने जां चुनने लेई इत्थै दबाओ',process:'पासबुक दी फोटो पढ़ो',help:'में तुंदी केह् मदद करी सकनी आं?',example:'मिसाल: पैसे कढ्ढने, जमा करने जां आधार जोड़ना।',withdraw:'में निकासी दा मसौदा बना सकनी आं। तुसें किन्ने पैसे कढ्ढने न?',unsupported:'इस डेमो च इस कम्मै दा फार्म अजें नेईं ऐ। बैंक दे कर्मचारी कोला मदद लओ।',unclear:'मिगी समझ नेईं आई। दस्सो तुसें केह् कम्म करना ऐ।',greeting:'में तुंदी केह् मदद करी सकनी आं?',listening:'सुनना…',speak:'🎙 बोलो',stop:'सुनना रोको',withdrawal:'निकासी दा मसौदा',amount:'निकासी दी रकम (₹)',continueDraft:'निकासी दा मसौदा जारी रक्खो',uploadBook:'पासबुक दी फोटो चढ़ाओ',reviewDraft:'निकासी दा मसौदा दिक्खो',download:'निकासी PDF मसौदा डाउनलोड करो',voiceHint:'माइक्रोफोन दबाइयै बोलो। ऐप तुंदे शब्दें कोला भाषा पन्छानने दी कोशश करग।',permissionDenied:'माइक्रोफोन दी इजाज़त नेईं मिली। ब्राउज़र सेटिंग च इजाज़त देइयै फेर कोशश करो, जां बिनां आवाज़ अग्गें जाओ।',speechUnavailable:'इस ब्राउज़र च आवाज़ पन्छान उपलब्ध नेईं। दूए ब्राउज़र च कोशश करो जां बिनां आवाज़ अग्गें जाओ।',speechError:'आवाज़ समझ नेईं आई। फेर कोशश करो जां बिनां आवाज़ मदद लओ।',ocrReview:'पढ़े गेदे विवरण पक्के नेईं। हर जानकारी जांचो ते सुधारो।'},
 ur:{permissionTitle:'بینکنگ مدد کے لیے بات کریں',permissionText:'بات کرنے کے لیے مائیکروفون کی اجازت دیں۔ آپ چاہیں تو آواز کے بغیر بھی جاری رکھ سکتے ہیں۔',voice:'آواز کے ساتھ جاری رکھیں',retry:'آواز دوبارہ آزمائیں',manual:'آواز کے بغیر جاری رکھیں',language:'اپنی زبان منتخب کریں',next:'جاری رکھیں',upload:'پاس بُکُک تصویر اپلوڈ کٔرِو',uploadDesc:'صاف JPG یا PNG تصویر ژٕرِو۔ فرضی یا مٹٲوُن نمونہٕ استعمال کٔرِو۔',choosePhoto:'پاس بُک تصویر ژٕرِو',tapPhoto:'تصویر کھینچن یا ژارنہٕ خٲطرٕ اِتھ دبٲوِو',process:'پاس بُک تصویر پٲٹھۍ عمل کٔرِو',help:'میں آپ کی کیا مدد کر سکتی ہوں؟',example:'مثال: پیسہٕ واپسی، جمع یا آدھار لنک۔',withdraw:'بہٕ واپسی مسودٕ بناوِتھ ہیکہٕ۔ کتٕم رقم واپَس وُچھِو؟',unsupported:'یہ ڈیمو منز یہ بینک فارم چھُنہٕ۔ مہربٲنی کٔرتھ بینک عملہٕ سۭتۍ رابطہٕ کٔرِو۔',unclear:'مےٚ تُہٕنٛز درخواست سمجھی نہٕ۔ مہربٲنی کٔرتھ وُچھِو تُہۍ کٲم کیاہ چھِو۔',greeting:'میں آپ کی کیا مدد کر سکتی ہوں؟',listening:'سن رہی ہوں…',speak:'🎙 بولیں',stop:'سننا بند کریں',withdrawal:'رقم نکلوانے کا مسودہ',amount:'رقم نکلوانے کی مقدار (₹)',continueDraft:'واپسی مسودٕ جاری تھٲوِو',uploadBook:'پاس بُک تصویر اپلوڈ کٔرِو',reviewDraft:'واپسی مسودٕ وُچھِو',download:'واپسی PDF مسودٕ ڈاؤنلوڈ کٔرِو',voiceHint:'مائیکروفون کے ذریعے بولیں۔ ایپ آپ کی بات سے زبان پہچاننے کی کوشش کرے گی۔',permissionDenied:'مائیکروفون اجازت چھُنہٕ ملی۔ براؤزر سیٹنگس منز اجازت دِیو یا آواز بغیر جاری تھٲوِو۔',speechUnavailable:'یہ براؤزر آواز شناسی چھُنہٕ کران۔ دۄیم براؤزر آزماوِو یا آواز بغیر جاری تھٲوِو۔',speechError:'آواز سمجھی نہٕ۔ دوبارٕ آزماوِو یا دستی مدد ژٕرِو۔',ocrReview:'OCR تفصیل یقینی چھُنہٕ۔ ہر چیز تصدیق کٔرِو۔'},
 pa:{permissionTitle:'ਬੈਂਕ ਦੀ ਮਦਦ ਲਈ ਬੋਲੋ',permissionText:'ਗੱਲ ਕਰਨ ਲਈ ਮਾਈਕ੍ਰੋਫ਼ੋਨ ਦੀ ਇਜਾਜ਼ਤ ਦਿਓ। ਤੁਸੀਂ ਬਿਨਾਂ ਆਵਾਜ਼ ਵੀ ਅੱਗੇ ਜਾ ਸਕਦੇ ਹੋ।',voice:'ਆਵਾਜ਼ ਨਾਲ ਜਾਰੀ ਰੱਖੋ',retry:'ਆਵਾਜ਼ ਫਿਰ ਅਜ਼ਮਾਓ',manual:'ਬਿਨਾਂ ਆਵਾਜ਼ ਅੱਗੇ ਜਾਓ',language:'ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ',next:'ਅੱਗੇ ਜਾਓ',upload:'ਪਾਸਬੁੱਕ ਦੀ ਤਸਵੀਰ ਅੱਪਲੋਡ ਕਰੋ',uploadDesc:'ਸਾਫ਼ JPG ਜਾਂ PNG ਤਸਵੀਰ ਚੁਣੋ। ਕਾਲਪਨਿਕ ਜਾਂ ਲੁਕਾਈ ਜਾਣਕਾਰੀ ਵਾਲਾ ਨਮੂਨਾ ਵਰਤੋ।',choosePhoto:'ਪਾਸਬੁੱਕ ਦੀ ਤਸਵੀਰ ਚੁਣੋ',tapPhoto:'ਤਸਵੀਰ ਲੈਣ ਜਾਂ ਚੁਣਨ ਲਈ ਇੱਥੇ ਦਬਾਓ',process:'ਪਾਸਬੁੱਕ ਦੀ ਤਸਵੀਰ ਪੜ੍ਹੋ',help:'ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦੀ ਹਾਂ?',example:'ਜਿਵੇਂ: ਪੈਸੇ ਕਢਵਾਉਣਾ, ਜਮ੍ਹਾਂ ਕਰਨਾ ਜਾਂ ਆਧਾਰ ਜੋੜਨਾ।',withdraw:'ਮੈਂ ਕਢਵਾਉਣ ਦਾ ਮਸੌਦਾ ਤਿਆਰ ਕਰ ਸਕਦੀ ਹਾਂ। ਤੁਸੀਂ ਕਿੰਨੀ ਰਕਮ ਕਢਵਾਉਣੀ ਹੈ?',unsupported:'ਇਸ ਡੈਮੋ ਵਿੱਚ ਇਸ ਕੰਮ ਦਾ ਫਾਰਮ ਹਾਲੇ ਨਹੀਂ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਬੈਂਕ ਕਰਮਚਾਰੀ ਤੋਂ ਮਦਦ ਲਵੋ।',unclear:'ਮੈਨੂੰ ਬੇਨਤੀ ਸਮਝ ਨਹੀਂ ਆਈ। ਦੱਸੋ ਤੁਹਾਨੂੰ ਕੀ ਕੰਮ ਕਰਨਾ ਹੈ।',greeting:'ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦੀ ਹਾਂ?',listening:'ਸੁਣ ਰਹੀ ਹਾਂ…',speak:'🎙 ਬੋਲੋ',stop:'ਸੁਣਨਾ ਰੋਕੋ',withdrawal:'ਕਢਵਾਉਣ ਦਾ ਮਸੌਦਾ',amount:'ਕਢਵਾਉਣ ਦੀ ਰਕਮ (₹)',continueDraft:'ਕਢਵਾਉਣ ਦਾ ਮਸੌਦਾ ਜਾਰੀ ਰੱਖੋ',uploadBook:'ਪਾਸਬੁੱਕ ਦੀ ਤਸਵੀਰ ਅੱਪਲੋਡ ਕਰੋ',reviewDraft:'ਕਢਵਾਉਣ ਦਾ ਮਸੌਦਾ ਵੇਖੋ',download:'ਕਢਵਾਉਣ ਦਾ PDF ਮਸੌਦਾ ਡਾਊਨਲੋਡ ਕਰੋ',voiceHint:'ਮਾਈਕ੍ਰੋਫ਼ੋਨ ਦਬਾ ਕੇ ਬੋਲੋ। ਐਪ ਤੁਹਾਡੇ ਸ਼ਬਦਾਂ ਤੋਂ ਭਾਸ਼ਾ ਪਛਾਣਨ ਦੀ ਕੋਸ਼ਿਸ਼ ਕਰੇਗੀ।',permissionDenied:'ਮਾਈਕ੍ਰੋਫ਼ੋਨ ਦੀ ਇਜਾਜ਼ਤ ਨਹੀਂ ਮਿਲੀ। ਬ੍ਰਾਊਜ਼ਰ ਸੈਟਿੰਗਾਂ ਵਿੱਚ ਇਜਾਜ਼ਤ ਦਿਓ, ਫਿਰ ਕੋਸ਼ਿਸ਼ ਕਰੋ ਜਾਂ ਬਿਨਾਂ ਆਵਾਜ਼ ਅੱਗੇ ਜਾਓ।',speechUnavailable:'ਇਸ ਬ੍ਰਾਊਜ਼ਰ ਵਿੱਚ ਬੋਲੀ ਦੀ ਪਛਾਣ ਉਪਲਬਧ ਨਹੀਂ। ਹੋਰ ਬ੍ਰਾਊਜ਼ਰ ਅਜ਼ਮਾਓ ਜਾਂ ਬਿਨਾਂ ਆਵਾਜ਼ ਅੱਗੇ ਜਾਓ।',speechError:'ਆਵਾਜ਼ ਸਮਝ ਨਹੀਂ ਆਈ। ਫਿਰ ਕੋਸ਼ਿਸ਼ ਕਰੋ ਜਾਂ ਹੱਥੀਂ ਮਦਦ ਲਵੋ।',ocrReview:'OCR ਸੁਝਾਅ ਪੱਕੇ ਨਹੀਂ ਹਨ। ਹਰ ਜਾਣਕਾਰੀ ਜਾਂਚੋ ਅਤੇ ਠੀਕ ਕਰੋ।'}
};
Object.assign(copy.ur, {
 permissionTitle:'بینکنگ مدد کے لیے بات کریں', permissionText:'بات کرنے کے لیے مائیکروفون کی اجازت دیں۔ آپ چاہیں تو آواز کے بغیر بھی جاری رکھ سکتے ہیں۔',
 voice:'آواز کے ساتھ جاری رکھیں', retry:'آواز دوبارہ آزمائیں', manual:'آواز کے بغیر جاری رکھیں', language:'اپنی زبان منتخب کریں', next:'جاری رکھیں',
 upload:'پاس بک کی تصویر منتخب کریں', uploadDesc:'نمونہ پاس بک کی تصویر منتخب کریں۔', choosePhoto:'پاس بک کی تصویر منتخب کریں', tapPhoto:'نیچے دی گئی تصاویر میں سے ایک منتخب کریں', process:'پاس بک پڑھیں',
 help:'میں آپ کی کیا مدد کر سکتی ہوں؟', example:'مثال: رقم نکلوانا یا جمع کروانا۔', withdraw:'میں رقم نکلوانے کی پرچی تیار کر سکتی ہوں۔ آپ کتنی رقم نکلوانا چاہتے ہیں؟',
 unsupported:'یہ کام اس ڈیمو میں دستیاب نہیں۔ براہِ کرم بینک کے عملے سے مدد لیں۔', unclear:'میں آپ کی بات سمجھ نہیں سکی۔ براہِ کرم دوبارہ بتائیں۔', greeting:'میں آپ کی کیا مدد کر سکتی ہوں؟', listening:'سن رہی ہوں…', speak:'🎙 بولیں', stop:'سننا بند کریں',
 withdrawal:'رقم نکلوانے کی پرچی', amount:'رقم (₹)', continueDraft:'پرچی جاری رکھیں', uploadBook:'پاس بک کی تصویر اپ لوڈ کریں', reviewDraft:'پرچی کا جائزہ لیں', download:'پی ڈی ایف پرچی ڈاؤن لوڈ کریں',
 voiceHint:'مائیکروفون کے ذریعے بولیں۔ ایپ آپ کی بات سے زبان پہچاننے کی کوشش کرے گی۔', permissionDenied:'مائیکروفون کی اجازت نہیں ملی۔ براؤزر کی ترتیبات میں اجازت دیں یا آواز کے بغیر جاری رکھیں۔',
 speechUnavailable:'اس براؤزر میں آواز کی شناخت دستیاب نہیں۔ دوسرا براؤزر آزمائیں یا آواز کے بغیر جاری رکھیں۔', speechError:'آواز سمجھ نہیں آئی۔ دوبارہ کوشش کریں یا دستی مدد لیں۔'
});
const manualCopy={
 en:{languageTitle:'Choose your language',languageDescription:'Choose a language for all manual steps.',languageNote:'Available languages: Hindi, English, Urdu, and Punjabi.',sampleHeading:'Choose a sample passbook',sampleDescription:'Six fictional passbooks with different layouts and image conditions. Select one to test OCR.',sampleOne:'Sample passbook 1',sampleTwo:'Sample passbook 2',sampleThree:'Sample passbook 3',accountTitle:'Confirm the account',accountIntro:'Check the number read from the image. Correct it if needed. Only this exact number is searched in the synthetic demo database.',accountLabel:'Account number',lookup:'Look up this demo account',confirm:'I confirm these matching demo details',toForms:'Continue to choose a form',changePhoto:'Choose another passbook photo',formsTitle:'Choose a form',formsIntro:'Select the form you need. Pension and cash withdrawals use the same withdrawal slip.',withdrawForm:'Sahaj Demo Bank · Withdrawal Slip',withdrawSub:'Cash or pension withdrawal',depositForm:'Sahaj Demo Bank · Deposit Slip',depositSub:'Deposit slip',sbiOpenForm:'Sahaj Demo Bank · Account Opening',idfcForm:'Sahaj Demo Bank · Transfer Request',idfcSub:'DD / RTGS / NEFT transfer',dtbForm:'Sahaj Demo Bank · Account Opening',dcbForm:'DCB Bank · Customer Request Form',dcbSub:'Customer request / account update',startOver:'Start over',reviewDetails:'Review or correct details',transactionType:'Withdrawal type',cash:'Cash withdrawal',pension:'Pension withdrawal',withdrawAmount:'Withdrawal amount (₹)',confirmAmount:'I confirm the amount and details shown above.',reviewDraft:'Review withdrawal draft',downloadDraft:'Download withdrawal PDF draft',blankForm:'Download unchanged blank withdrawal form',signatureHelp:'The supplied SBI withdrawal slip is used for cash and pension withdrawals. Confirm the amount and details before downloading. Sign on the neutral signature line beside the phone number. Leave the bank-use signature boxes blank.',sampleSafe:'SYNTHETIC SAMPLE ONLY · NOT VALID FOR BANKING'},
 hi:{languageTitle:'अपनी भाषा चुनें',languageDescription:'मैन्युअल प्रक्रिया के सभी चरणों के लिए भाषा चुनें।',languageNote:'हिन्दी, अंग्रेज़ी, उर्दू या पंजाबी चुनें।',sampleHeading:'नमूना पासबुक आज़माएँ',sampleDescription:'ये काल्पनिक डेमो दस्तावेज़ हैं। OCR जाँचने के लिए नमूना डाउनलोड करें या चुनें।',sampleOne:'नमूना पासबुक 1 · PNG डाउनलोड करें',sampleTwo:'नमूना पासबुक 2 · PNG डाउनलोड करें',sampleThree:'नमूना पासबुक 3 · PNG डाउनलोड करें',accountTitle:'खाते की पुष्टि करें',accountIntro:'तस्वीर से पढ़ा गया नंबर जाँचें और ज़रूरत हो तो सुधारें। डेमो डेटाबेस में केवल इसी नंबर को खोजा जाएगा।',accountLabel:'खाता संख्या',lookup:'यह डेमो खाता खोजें',confirm:'मैं इन डेमो जानकारियों की पुष्टि करता/करती हूँ',toForms:'फ़ॉर्म चुनने के लिए आगे बढ़ें',changePhoto:'दूसरी पासबुक तस्वीर चुनें',formsTitle:'फ़ॉर्म चुनें',formsIntro:'अपनी ज़रूरत का फ़ॉर्म चुनें। पेंशन और नकद निकासी के लिए एक ही निकासी पर्ची है।',withdrawForm:'SBI · निकासी पर्ची',withdrawSub:'नकद या पेंशन निकासी',depositForm:'SBI · जमा पर्ची',depositSub:'जमा पर्ची',sbiOpenForm:'SBI · खाता खोलने का फ़ॉर्म',idfcForm:'IDFC FIRST · एकल लेन-देन अनुरोध',idfcSub:'DD / RTGS / NEFT ट्रांसफ़र',dtbForm:'DTB · खाता खोलने का फ़ॉर्म',dcbForm:'DCB Bank · ग्राहक अनुरोध फ़ॉर्म',dcbSub:'ग्राहक अनुरोध / खाता अपडेट',startOver:'फिर शुरू करें',reviewDetails:'जानकारी देखें या सुधारें',transactionType:'निकासी का प्रकार',cash:'नकद निकासी',pension:'पेंशन निकासी',withdrawAmount:'निकासी की राशि (₹)',confirmAmount:'मैं ऊपर दिखाई गई राशि और जानकारी की पुष्टि करता/करती हूँ।',reviewDraft:'निकासी मसौदा देखें',downloadDraft:'निकासी PDF मसौदा डाउनलोड करें',blankForm:'खाली निकासी फ़ॉर्म डाउनलोड करें',signatureHelp:'नकद और पेंशन निकासी के लिए SBI की दी गई पर्ची का उपयोग होता है। डाउनलोड से पहले राशि और जानकारी जाँचें। फ़ोन नंबर के पास दिए गए हस्ताक्षर वाले स्थान पर हस्ताक्षर करें। बैंक उपयोग वाले हस्ताक्षर बॉक्स खाली छोड़ें।',sampleSafe:'केवल काल्पनिक नमूना · बैंकिंग के लिए मान्य नहीं'},
 doi:{languageTitle:'अपनी भाशा चुनो',languageDescription:'मैन्युअल कम्म दे सारे चरणें लेई भाशा चुनो।',languageNote:'हिन्दी, अंग्रेज़ी, उर्दू या पंजाबी चुनें।',sampleHeading:'नमूना पासबुक आज़माओ',sampleDescription:'एह् काल्पनिक डेमो कागज़ न। OCR जांचने लेई नमूना डाउनलोड करो जां चुनो।',sampleOne:'नमूना पासबुक 1 · PNG डाउनलोड करो',sampleTwo:'नमूना पासबुक 2 · PNG डाउनलोड करो',sampleThree:'नमूना पासबुक 3 · PNG डाउनलोड करो',accountTitle:'खाते दी पुष्टि करो',accountIntro:'तस्वीर थमां पढ़े नंबर गी जांचो ते लोड़े पौने पर ठीक करो। डेमो डेटाबेस च सिर्फ एह् नंबर खोजेआ जाग।',accountLabel:'खाता नंबर',lookup:'एह् डेमो खाता खोजो',confirm:'में इन डेमो जानकारियें दी पुष्टि करदा/करदी आं',toForms:'फॉर्म चुनने लेई अग्गें जाओ',changePhoto:'दूई पासबुक फोटो चुनो',formsTitle:'फॉर्म चुनो',formsIntro:'लोड़े दा फॉर्म चुनो। पेंशन ते नकद निकासी लेई इक गै निकासी पर्ची ऐ।',withdrawForm:'SBI · निकासी पर्ची',withdrawSub:'नकद जां पेंशन निकासी',depositForm:'SBI · जमा पर्ची',depositSub:'जमा पर्ची',sbiOpenForm:'SBI · खाता खोलने दा फॉर्म',idfcForm:'IDFC FIRST · इक लेन-देन दा अनुरोध',idfcSub:'DD / RTGS / NEFT ट्रांसफर',dtbForm:'DTB · खाता खोलने दा फॉर्म',dcbForm:'DCB Bank · ग्राहक अनुरोध फॉर्म',dcbSub:'ग्राहक अनुरोध / खाता अपडेट',startOver:'फेर शुरू करो',reviewDetails:'जानकारी दिक्खो जां सुधारो',transactionType:'निकासी दी किस्म',cash:'नकद निकासी',pension:'पेंशन निकासी',withdrawAmount:'निकासी दी रकम (₹)',confirmAmount:'में ऊपर दस्सी रकम ते जानकारी दी पुष्टि करदा/करदी आं।',reviewDraft:'निकासी मसौदा दिक्खो',downloadDraft:'निकासी PDF मसौदा डाउनलोड करो',blankForm:'खाली निकासी फॉर्म डाउनलोड करो',signatureHelp:'नकद ते पेंशन निकासी लेई SBI दी पर्ची बरती जंदी ऐ। डाउनलोड करने शा पैह्लें रकम ते जानकारी जांचो। फोन नंबर कोल दित्ती दस्तखत दी थांऽ पर दस्तखत करो। बैंक इस्तेमाल आह्ले दस्तखत बॉक्स खाली छोड़ो।',sampleSafe:'सिर्फ काल्पनिक नमूना · बैंकिंग लेई मान्य नेईं'},
 ur:{languageTitle:'پنٛنۍ زبان ژٕرِو',languageDescription:'دستی عملہٕ ہٕندین تمام مرحلن خٲطرٕ زبان ژٕرِو۔',languageNote:'ہندی، انگریزی، اردو یا پنجابی منتخب کریں۔',sampleHeading:'نمونہٕ پاس بُک آزماوِو',sampleDescription:'یہ فرضی ڈیمو دستاویز چھِ۔ OCR آزماونہٕ خٲطرٕ نمونہٕ ڈاؤنلوڈ یا ژٕرِو۔',sampleOne:'نمونہٕ پاس بُک 1 · PNG ڈاؤنلوڈ',sampleTwo:'نمونہٕ پاس بُک 2 · PNG ڈاؤنلوڈ',sampleThree:'نمونہٕ پاس بُک 3 · PNG ڈاؤنلوڈ',accountTitle:'اکاؤنٹ تصدیق کٔرِو',accountIntro:'تصویر پٲٹھۍ چھِوُن نمبر چیک کٔرِو۔ ضرورت پٲٹھۍ درست کٔرِو۔ ڈیمو ڈیٹابیس منز صرف یہٕ نمبر تلاش کرنہٕ۔',accountLabel:'اکاؤنٹ نمبر',lookup:'یہٕ ڈیمو اکاؤنٹ تلاش کٔرِو',confirm:'بہٕ یہِ ڈیمو تفصیل تصدیق کران چھُس/چھَس',toForms:'فارم ژٕرنہٕ خٲطرٕ جاری تھٲوِو',changePhoto:'دۄیم پاس بُک تصویر ژٕرِو',formsTitle:'فارم ژٕرِو',formsIntro:'ضرورت مُطابق فارم ژٕرِو۔ پنشن تہٕ نقد واپسی خٲطرٕ اکھٕے فارم چھُ۔',withdrawForm:'SBI · واپسی سلپ',withdrawSub:'نقد یا پنشن واپسی',depositForm:'SBI · جمع چالان',depositSub:'جمع پٲٹھی',sbiOpenForm:'SBI · اکاؤنٹ کھولنُک فارم',idfcForm:'IDFC FIRST · اکھ ٹرانزیکشن درخواست',idfcSub:'DD / RTGS / NEFT منتقلی',dtbForm:'DTB · اکاؤنٹ کھولنُک فارم',dcbForm:'DCB Bank · صارف درخواست فارم',dcbSub:'صارف درخواست / اکاؤنٹ اپڈیٹ',startOver:'دوبارٕ شروع کٔرِو',reviewDetails:'تفصیل وُچھِو یا درست کٔرِو',transactionType:'واپسی قٕسم',cash:'نقد واپسی',pension:'پنشن واپسی',withdrawAmount:'واپسی رقم (₹)',confirmAmount:'بہٕ پٲٹھۍ دِژِم رقم تہٕ تفصیل تصدیق کران چھُس/چھَس۔',reviewDraft:'واپسی مسودٕ وُچھِو',downloadDraft:'واپسی PDF مسودٕ ڈاؤنلوڈ کٔرِو',blankForm:'خالی واپسی فارم ڈاؤنلوڈ کٔرِو',signatureHelp:'نقد تہٕ پنشن واپسی خٲطرٕ SBI سلپ استعمال گژھِ۔ ڈاؤنلوڈ کرنہٕ پتہٕ رقم تہٕ تفصیل چیک کٔرِو۔ فون نمبر نزدیک دستخط خٲطرٕ دِژِم جگہ پٮ۪ٹھ دستخط کٔرِو۔ بینک استعمال دستخط باکس خالی تھٲوِو۔',sampleSafe:'صرف فرضی نمونہٕ · بینکنگ خٲطرٕ درست چھُنہٕ'},
 pa:{languageTitle:'ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ',languageDescription:'ਹੱਥੀਂ ਵਰਤੋਂ ਦੇ ਸਾਰੇ ਪੜਾਵਾਂ ਲਈ ਭਾਸ਼ਾ ਚੁਣੋ।',languageNote:'ਹਿੰਦੀ, ਅੰਗਰੇਜ਼ੀ, ਉਰਦੂ ਜਾਂ ਪੰਜਾਬੀ ਚੁਣੋ।',sampleHeading:'ਨਮੂਨਾ ਪਾਸਬੁੱਕ ਅਜ਼ਮਾਓ',sampleDescription:'ਇਹ ਕਾਲਪਨਿਕ ਡੈਮੋ ਦਸਤਾਵੇਜ਼ ਹਨ। OCR ਜਾਂਚਣ ਲਈ ਨਮੂਨਾ ਡਾਊਨਲੋਡ ਕਰੋ ਜਾਂ ਚੁਣੋ।',sampleOne:'ਨਮੂਨਾ ਪਾਸਬੁੱਕ 1 · PNG ਡਾਊਨਲੋਡ ਕਰੋ',sampleTwo:'ਨਮੂਨਾ ਪਾਸਬੁੱਕ 2 · PNG ਡਾਊਨਲੋਡ ਕਰੋ',sampleThree:'ਨਮੂਨਾ ਪਾਸਬੁੱਕ 3 · PNG ਡਾਊਨਲੋਡ ਕਰੋ',accountTitle:'ਖਾਤੇ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ',accountIntro:'ਤਸਵੀਰ ਤੋਂ ਪੜ੍ਹਿਆ ਨੰਬਰ ਜਾਂਚੋ ਅਤੇ ਲੋੜ ਹੋਵੇ ਤਾਂ ਠੀਕ ਕਰੋ। ਡੈਮੋ ਡਾਟਾਬੇਸ ਵਿੱਚ ਸਿਰਫ਼ ਇਹੀ ਨੰਬਰ ਲੱਭਿਆ ਜਾਵੇਗਾ।',accountLabel:'ਖਾਤਾ ਨੰਬਰ',lookup:'ਇਹ ਡੈਮੋ ਖਾਤਾ ਲੱਭੋ',confirm:'ਮੈਂ ਇਹਨਾਂ ਡੈਮੋ ਵੇਰਵਿਆਂ ਦੀ ਪੁਸ਼ਟੀ ਕਰਦਾ/ਕਰਦੀ ਹਾਂ',toForms:'ਫਾਰਮ ਚੁਣਨ ਲਈ ਅੱਗੇ ਜਾਓ',changePhoto:'ਹੋਰ ਪਾਸਬੁੱਕ ਤਸਵੀਰ ਚੁਣੋ',formsTitle:'ਫਾਰਮ ਚੁਣੋ',formsIntro:'ਆਪਣੀ ਲੋੜ ਦਾ ਫਾਰਮ ਚੁਣੋ। ਪੈਨਸ਼ਨ ਅਤੇ ਨਕਦ ਕਢਵਾਉਣ ਲਈ ਇੱਕੋ ਪਰਚੀ ਵਰਤੀ ਜਾਂਦੀ ਹੈ।',withdrawForm:'SBI · ਕਢਵਾਉਣ ਦੀ ਪਰਚੀ',withdrawSub:'ਨਕਦ ਜਾਂ ਪੈਨਸ਼ਨ ਕਢਵਾਉਣਾ',depositForm:'SBI · ਜਮ੍ਹਾਂ ਪਰਚੀ',depositSub:'ਜਮ੍ਹਾਂ ਪਰਚੀ',sbiOpenForm:'SBI · ਖਾਤਾ ਖੋਲ੍ਹਣ ਦਾ ਫਾਰਮ',idfcForm:'IDFC FIRST · ਇਕੱਲੀ ਲੈਣ-ਦੇਣ ਬੇਨਤੀ',idfcSub:'DD / RTGS / NEFT ਟ੍ਰਾਂਸਫ਼ਰ',dtbForm:'DTB · ਖਾਤਾ ਖੋਲ੍ਹਣ ਦਾ ਫਾਰਮ',dcbForm:'DCB Bank · ਗਾਹਕ ਬੇਨਤੀ ਫਾਰਮ',dcbSub:'ਗਾਹਕ ਬੇਨਤੀ / ਖਾਤਾ ਅੱਪਡੇਟ',startOver:'ਮੁੜ ਸ਼ੁਰੂ ਕਰੋ',reviewDetails:'ਵੇਰਵੇ ਵੇਖੋ ਜਾਂ ਠੀਕ ਕਰੋ',transactionType:'ਕਢਵਾਉਣ ਦੀ ਕਿਸਮ',cash:'ਨਕਦ ਕਢਵਾਉਣਾ',pension:'ਪੈਨਸ਼ਨ ਕਢਵਾਉਣਾ',withdrawAmount:'ਕਢਵਾਉਣ ਦੀ ਰਕਮ (₹)',confirmAmount:'ਮੈਂ ਉੱਪਰ ਦਿੱਤੀ ਰਕਮ ਅਤੇ ਵੇਰਵਿਆਂ ਦੀ ਪੁਸ਼ਟੀ ਕਰਦਾ/ਕਰਦੀ ਹਾਂ।',reviewDraft:'ਕਢਵਾਉਣ ਦਾ ਮਸੌਦਾ ਵੇਖੋ',downloadDraft:'ਕਢਵਾਉਣ ਦਾ PDF ਮਸੌਦਾ ਡਾਊਨਲੋਡ ਕਰੋ',blankForm:'ਖਾਲੀ ਕਢਵਾਉਣ ਦਾ ਫਾਰਮ ਡਾਊਨਲੋਡ ਕਰੋ',signatureHelp:'ਨਕਦ ਅਤੇ ਪੈਨਸ਼ਨ ਕਢਵਾਉਣ ਲਈ ਦਿੱਤੀ SBI ਪਰਚੀ ਵਰਤੀ ਜਾਂਦੀ ਹੈ। ਡਾਊਨਲੋਡ ਤੋਂ ਪਹਿਲਾਂ ਰਕਮ ਅਤੇ ਵੇਰਵੇ ਜਾਂਚੋ। ਫ਼ੋਨ ਨੰਬਰ ਕੋਲ ਲਾਲ SIGN HERE ਬਾਕਸ ਵਿੱਚ ਦਸਤਖ਼ਤ ਕਰੋ। ਬੈਂਕ-ਵਰਤੋਂ ਵਾਲੇ ਦਸਤਖ਼ਤ ਬਾਕਸ ਖਾਲੀ ਛੱਡੋ।',sampleSafe:'ਸਿਰਫ਼ ਕਾਲਪਨਿਕ ਨਮੂਨਾ · ਬੈਂਕਿੰਗ ਲਈ ਵੈਧ ਨਹੀਂ'}
};
const manualMessages={en:{reading:'Reading passbook locally…',noOcr:'No account number was read confidently. Enter the account number printed in the sample.',ocrCheck:'OCR suggestion: {number}. Check the digits, then look it up.',invalid:'Enter the 8–12 digit account number printed in a synthetic sample passbook.',checking:'Checking this exact account against the demo database…',notFound:'No matching synthetic demo account. Check the number or use one of the sample passbooks.',found:'Record found. Review all details above.',review:'Review the matching customer details and confirm before continuing.',ocrError:'Could not process this image: {error}',databaseError:'Account lookup failed: {error}',nameNotRead:'name not read',matched:'Matching fictional customer details came from the demo database. Confirm before continuing.'},hi:{reading:'पासबुक की जानकारी स्थानीय रूप से पढ़ी जा रही है…',noOcr:'खाता संख्या नहीं पढ़ी जा सकी। नमूने पर छपी संख्या दर्ज करें।',ocrCheck:'OCR सुझाव: {number}। अंक जाँचें, फिर खाता खोजें।',invalid:'काल्पनिक नमूना पासबुक पर छपी 8–12 अंकों की खाता संख्या दर्ज करें।',checking:'इस सटीक खाते को डेमो डेटाबेस में खोजा जा रहा है…',notFound:'इस काल्पनिक डेमो खाते की संख्या नहीं मिली। नंबर जाँचें या नमूना पासबुक चुनें।',found:'रिकॉर्ड मिला। ऊपर दी गई जानकारी जाँचें।',review:'आगे बढ़ने से पहले ग्राहक की जानकारी जाँचकर पुष्टि करें।',ocrError:'तस्वीर पढ़ी नहीं जा सकी: {error}',databaseError:'खाता खोजने में समस्या: {error}',nameNotRead:'नाम नहीं पढ़ा गया',matched:'ग्राहक की काल्पनिक जानकारी डेमो डेटाबेस से मिली है। आगे बढ़ने से पहले पुष्टि करें।'},doi:{reading:'पासबुक दी जानकारी स्थानीय तौर पर पढ़ी जा करदी ऐ…',noOcr:'खाता नंबर नेईं पढ़ेआ। नमूने पर छपे नंबर गी दर्ज करो।',ocrCheck:'OCR सुझाव: {number}। अंक जांचो ते खाते गी खोजो।',invalid:'काल्पनिक नमूना पासबुक पर छपे 8–12 अंकों दे खाते दा नंबर दर्ज करो।',checking:'इस खाते गी डेमो डेटाबेस च खोजेआ जा करदा ऐ…',notFound:'एह् काल्पनिक डेमो खाता नेईं लब्भा। नंबर जांचो जां नमूना पासबुक बरतो।',found:'रिकॉर्ड लब्भा। ऊपर दी जानकारी जांचो।',review:'अग्गें जाने शा पैह्लें ग्राहक दी जानकारी जांचो ते पुष्टि करो।',ocrError:'फोटो पढ़ी नेईं गेई: {error}',databaseError:'खाता खोजने च असफल: {error}',nameNotRead:'नांऽ नेईं पढ़ेआ',matched:'काल्पनिक ग्राहक दी जानकारी डेमो डेटाबेस थमां ऐ। अग्गें जाने शा पैह्लें पुष्टि करो।'},ur:{reading:'پاس بُک تفصیل مقامی طور پٲٹھۍ پڑھان…',noOcr:'اکاؤنٹ نمبر نہٕ پڑھو۔ نمونہ پٲٹھۍ چھُپووُن نمبر درج کٔرِو۔',ocrCheck:'OCR مشورٕ: {number}۔ نمبر چیک کٔرِو تہٕ تلاش کٔرِو۔',invalid:'فرضی نمونہ پاس بُک پٲٹھۍ چھُپووُن 8–12 ہندسہٕ اکاؤنٹ نمبر درج کٔرِو۔',checking:'یہِ اکاؤنٹ ڈیمو ڈیٹابیس منز تلاش کران…',notFound:'یہِ فرضی ڈیمو اکاؤنٹ نہٕ مِلو۔ نمبر چیک کٔرِو یا نمونہٕ استعمال کٔرِو۔',found:'ریکارڈ مِلو۔ پٲٹھۍ دِژِم تفصیل چیک کٔرِو۔',review:'جاری کرنہٕ پتہٕ صارف تفصیل تصدیق کٔرِو۔',ocrError:'تصویر عمل نہٕ گٔیہ: {error}',databaseError:'اکاؤنٹ تلاش نہٕ گٔیہ: {error}',nameNotRead:'ناو نہٕ پڑھو',matched:'فرضی صارف تفصیل ڈیمو ڈیٹابیس پٲٹھۍ چھِ۔ جاری کرنہٕ پتہٕ تصدیق کٔرِو۔'},pa:{reading:'ਪਾਸਬੁੱਕ ਦੀ ਜਾਣਕਾਰੀ ਸਥਾਨਕ ਤੌਰ ਉੱਤੇ ਪੜ੍ਹੀ ਜਾ ਰਹੀ ਹੈ…',noOcr:'ਖਾਤਾ ਨੰਬਰ ਨਹੀਂ ਪੜ੍ਹਿਆ ਗਿਆ। ਨਮੂਨੇ ਉੱਤੇ ਛਪਿਆ ਨੰਬਰ ਦਰਜ ਕਰੋ।',ocrCheck:'OCR ਸੁਝਾਅ: {number}। ਅੰਕ ਜਾਂਚੋ, ਫਿਰ ਖਾਤਾ ਲੱਭੋ।',invalid:'ਕਾਲਪਨਿਕ ਨਮੂਨਾ ਪਾਸਬੁੱਕ ਉੱਤੇ ਛਪਿਆ 8–12 ਅੰਕਾਂ ਦਾ ਖਾਤਾ ਨੰਬਰ ਦਰਜ ਕਰੋ।',checking:'ਇਹ ਖਾਤਾ ਡੈਮੋ ਡਾਟਾਬੇਸ ਵਿੱਚ ਲੱਭਿਆ ਜਾ ਰਿਹਾ ਹੈ…',notFound:'ਇਹ ਕਾਲਪਨਿਕ ਡੈਮੋ ਖਾਤਾ ਨਹੀਂ ਮਿਲਿਆ। ਨੰਬਰ ਜਾਂਚੋ ਜਾਂ ਨਮੂਨਾ ਪਾਸਬੁੱਕ ਵਰਤੋ।',found:'ਰਿਕਾਰਡ ਮਿਲ ਗਿਆ। ਉੱਪਰਲੇ ਵੇਰਵੇ ਜਾਂਚੋ।',review:'ਅੱਗੇ ਜਾਣ ਤੋਂ ਪਹਿਲਾਂ ਗਾਹਕ ਦੇ ਵੇਰਵੇ ਜਾਂਚ ਕੇ ਪੁਸ਼ਟੀ ਕਰੋ।',ocrError:'ਤਸਵੀਰ ਪੜ੍ਹੀ ਨਹੀਂ ਜਾ ਸਕੀ: {error}',databaseError:'ਖਾਤਾ ਲੱਭਣ ਵਿੱਚ ਅਸਫਲ: {error}',nameNotRead:'ਨਾਮ ਨਹੀਂ ਪੜ੍ਹਿਆ ਗਿਆ',matched:'ਕਾਲਪਨਿਕ ਗਾਹਕ ਦੇ ਵੇਰਵੇ ਡੈਮੋ ਡਾਟਾਬੇਸ ਤੋਂ ਮਿਲੇ ਹਨ। ਅੱਗੇ ਜਾਣ ਤੋਂ ਪਹਿਲਾਂ ਪੁਸ਼ਟੀ ਕਰੋ।'}};
function manualMessage(key,values={}){let value=(manualMessages[language]||manualMessages.en)[key]||manualMessages.en[key]||key;for(const [name,replacement] of Object.entries(values))value=value.replace('{'+name+'}',replacement);return value}
const words=code=>copy[code]||copy.en;
let counterEndTimer=null;
function show(id){activeScreen=id;screens.forEach(x=>$('#'+x).hidden=x!==id);const switcher=$('#switchLanguage');if(switcher)switcher.hidden=!(mode==='manual'&&!['permissionScreen','languageScreen','voiceScreen','counterScreen'].includes(id));if(id!=='voiceScreen'&&id!=='requestScreen')setListeningVisual(false);window.scrollTo({top:0,behavior:'smooth'});if(id==='counterScreen'){localizeCounter();clearTimeout(counterEndTimer);counterEndTimer=setTimeout(endSession,14000);if(mode==='voice')announceCounter()}}
function endSession(){clearTimeout(counterEndTimer);counterEndTimer=null;speechLanguageLocked=false;displayLanguageLocked=false;disconnectRealtimeVoice();speechRestartAllowed=false;try{speechRecognition?.stop()}catch{}try{window.speechSynthesis?.cancel()}catch{}currentIntent=null;detectedAmount='';flowStage='hello';passbook={name:'',account_id:'',branch:'',phone:'',profile:null};imageFile=null;$('#image').value='';$('#preview').hidden=true;$('#formPassbookPreview').hidden=true;$('#extract').disabled=true;$('#amount').value='';$('#requestedAmount').value='';$('#utterance').value='';$('#confirm').checked=false;$('#review').hidden=true;$('#download').hidden=true;resetIntentActions();mode='';show('permissionScreen');applyMicPermissionState(micPermissionGranted?'granted':'prompt');$('#permissionStatus').textContent='Session ended. Start again when ready.';$('#fallbackActions').hidden=false;}
function voicePrompt(code){return{en:'Say hello or namaste to begin. Listening turns on after the greeting; use Stop to pause.',hi:'शुरू करने के लिए नमस्ते कहें। अभिवादन के बाद सुनना शुरू होगा; रोकने के लिए Stop दबाएँ।',doi:'शुरू करने लेई नमस्कार बोलो। जवाब दे बाद सुनना शुरू होग; रोकने लेई Stop दबाओ।',ur:'شروع کرنے کے لیے آداب کہیں۔ سلام کے بعد سننا شروع ہوگا؛ روکنے کے لیے Stop دبائیں۔',pa:'ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਸਤ ਸ੍ਰੀ ਅਕਾਲ ਕਹੋ। ਜਵਾਬ ਤੋਂ ਬਾਅਦ ਸੁਣਨਾ ਸ਼ੁਰੂ ਹੋਵੇਗਾ; ਰੋਕਣ ਲਈ Stop ਦਬਾਓ।'}[code]}
const counterCopy={
 en:{title:'Next step: Counter 1',instruction:'Your form has been downloaded. Take the printed form to Counter 1 for withdrawal or deposit assistance.',current:'Counter 1 · Go here next',currentDesc:'Withdrawal and deposit',second:'Counter 2',secondDesc:'Account and other services',disclaimer:'This is a simulated counter directory for the demo. No bank transaction has been submitted. This screen closes automatically after 10 seconds.',done:'End session'},
 hi:{title:'अगला चरण: काउंटर 1',instruction:'आपका फ़ॉर्म डाउनलोड हो गया है। निकासी या जमा में सहायता के लिए प्रिंट किया हुआ फ़ॉर्म काउंटर 1 पर ले जाएँ।',current:'काउंटर 1 · यहाँ जाएँ',currentDesc:'निकासी और जमा',second:'काउंटर 2',secondDesc:'खाता और अन्य सेवाएँ',disclaimer:'यह डेमो के लिए नकली काउंटर सूची है। कोई बैंक लेन-देन जमा नहीं किया गया है। यह स्क्रीन 10 सेकंड में अपने आप बंद हो जाएगी।',done:'सत्र समाप्त करें'},
 doi:{title:'अगला चरण: काउंटर 1',instruction:'तुहाडा फॉर्म डाउनलोड होई गेआ ऐ। निकासी जां जमा दी मदद लेई प्रिंट कीता फॉर्म काउंटर 1 पर लेई जाओ।',current:'काउंटर 1 · इत्थें जाओ',currentDesc:'निकासी ते जमा',second:'काउंटर 2',secondDesc:'खाता ते होर सेवाएं',disclaimer:'एह् डेमो लेई नकली काउंटर सूची ऐ। कोई बैंक लेन-देन जमा नेईं कीता गेआ। एह् स्क्रीन 10 सेकंड बाद अपने आप बंद होई जाग।',done:'सत्र समाप्त करो'},
 pa:{title:'ਅਗਲਾ ਕਦਮ: ਕਾਊਂਟਰ 1',instruction:'ਤੁਹਾਡਾ ਫਾਰਮ ਡਾਊਨਲੋਡ ਹੋ ਗਿਆ ਹੈ। ਨਿਕਾਸੀ ਜਾਂ ਜਮ੍ਹਾਂ ਦੀ ਮਦਦ ਲਈ ਛਪਿਆ ਫਾਰਮ ਕਾਊਂਟਰ 1 ਤੇ ਲੈ ਜਾਓ।',current:'ਕਾਊਂਟਰ 1 · ਇੱਥੇ ਜਾਓ',currentDesc:'ਨਿਕਾਸੀ ਅਤੇ ਜਮ੍ਹਾਂ',second:'ਕਾਊਂਟਰ 2',secondDesc:'ਖਾਤਾ ਅਤੇ ਹੋਰ ਸੇਵਾਵਾਂ',disclaimer:'ਇਹ ਡੈਮੋ ਲਈ ਨਕਲੀ ਕਾਊਂਟਰ ਸੂਚੀ ਹੈ। ਕੋਈ ਬੈਂਕ ਲੈਣ-ਦੇਣ ਜਮ੍ਹਾਂ ਨਹੀਂ ਕੀਤਾ ਗਿਆ। ਇਹ ਸਕ੍ਰੀਨ 10 ਸਕਿੰਟਾਂ ਬਾਅਦ ਆਪਣੇ ਆਪ ਬੰਦ ਹੋ ਜਾਵੇਗੀ।',done:'ਸੈਸ਼ਨ ਖਤਮ ਕਰੋ'},
 ur:{title:'اگلا مرحلہ: کاؤنٹر 1',instruction:'آپ کا فارم ڈاؤن لوڈ ہو گیا ہے۔ رقم نکلوانے یا جمع کروانے میں مدد کے لیے پرنٹ شدہ فارم کاؤنٹر 1 پر لے جائیں۔',current:'کاؤنٹر 1 · یہاں جائیں',currentDesc:'رقم نکلوانا اور جمع کروانا',second:'کاؤنٹر 2',secondDesc:'اکاؤنٹ اور دیگر خدمات',disclaimer:'یہ ڈیمو کے لیے فرضی کاؤنٹر فہرست ہے۔ کوئی بینک لین دین جمع نہیں کیا گیا۔ یہ اسکرین 10 سیکنڈ بعد خود بند ہو جائے گی۔',done:'سیشن ختم کریں'}
};
function localizeCounter(){const t=counterCopy[language]||counterCopy.en;for(const [id,key] of [['counterTitle','title'],['counterInstruction','instruction'],['counterCurrentTitle','current'],['counterCurrentDesc','currentDesc'],['counterSecondTitle','second'],['counterSecondDesc','secondDesc'],['counterDisclaimer','disclaimer'],['counterDone','done']]){const el=$('#'+id);if(el)el.textContent=t[key]}}
function localize(){const w=words(language);const languageSwitch=$('#switchLanguage');if(languageSwitch)languageSwitch.textContent=({en:'Switch language',hi:'भाषा बदलें',pa:'ਭਾਸ਼ਾ ਬਦਲੋ',ur:'زبان تبدیل کریں',doi:'भाशा बदलो'}[language]||'Switch language');document.documentElement.lang=language;document.documentElement.dir=language==='ur'?'rtl':'ltr';$('#permissionTitle').textContent=w.permissionTitle;$('#permissionText').textContent=w.permissionText;$('#voiceContinue').textContent=w.voice;$('#manualContinue').textContent=w.manual;$('#languageScreen h1').textContent=w.language;$('#languageNext').textContent=w.next;$('#uploadScreen h1').textContent=w.upload;$('#uploadScreen>p').textContent=w.uploadDesc;const uploadTileTitle=$('.upload-tile strong');if(uploadTileTitle)uploadTileTitle.textContent=w.choosePhoto;const uploadTileHint=$('.upload-tile span:last-child');if(uploadTileHint)uploadTileHint.textContent=w.tapPhoto;$('#extract').textContent=w.process;$('#requestTitle').textContent=w.help;$('#requestDescription').textContent=w.example;const confirmLabels={en:['Yes, continue','No, change amount'],hi:['हाँ, आगे बढ़ें','नहीं, राशि बदलें'],pa:['ਹਾਂ, ਅੱਗੇ ਵਧੋ','ਨਹੀਂ, ਰਕਮ ਬਦਲੋ'],ur:['ہاں، جاری رکھیں','نہیں، رقم بدلیں']};const cl=confirmLabels[language]||confirmLabels.en;$('#amountConfirmYes').textContent=cl[0];$('#amountConfirmNo').textContent=cl[1];$('#utterance').placeholder=w.example;$('#requestVoice').textContent=w.speak;$('#requestManual').textContent=w.manual;$('#requestStop').textContent=w.stop;if(mode!=='voice'){$('#voiceGreeting').textContent=w.greeting;$('#voiceHint').textContent=voicePrompt(language)}$('#listen').textContent=w.speak;$('#stop').textContent=w.stop;$('#listening').textContent=language==='en'?'Listening…':language==='ur'?'سن رہی ہوں…':language==='pa'?'ਸੁਣ ਰਹੀ ਹਾਂ…':'सुन रही हूँ…';$('#requestListening').textContent=w.listening;$('#listening').textContent=w.listening;$('#withdrawalScreen h1').textContent=w.withdrawal;$('#amountLabel').firstChild.textContent=w.amount+' ';$('#continueWithdrawal').textContent=w.continueDraft;$('#continueUpload').textContent=w.uploadBook;$('#prepare').textContent=w.reviewDraft;$('#download').textContent=w.download;applyManualLocale();refreshAmountBox();localizeCounter();}
function applyManualLocale(){const t=manualCopy[language]||manualCopy.en;for(const key of ['languageTitle','languageDescription','languageNote','sampleHeading','sampleDescription','sampleOne','sampleTwo','sampleThree','uploadTitle','uploadDescription','accountTitle','accountIntro','accountLabel','formsTitle','formsIntro']){const el=$('#'+key);if(el&&t[key]){if(key==='accountLabel')el.firstChild.textContent=t[key]+' ';else el.textContent=t[key];}}$('#lookupAccount').textContent='Confirm account number & continue';$('#confirmProfileText').textContent=t.confirm;$('#continueToForms').textContent=t.toForms;$('#changePhoto').textContent=t.changePhoto;$('#formsBack').textContent=t.startOver;$('#withdrawalTitle').textContent=words(language).withdrawal;$('#holderLabel').firstChild.textContent=({en:'Account holder name',hi:'खाताधारक का नाम',doi:'खाताधारक दा नांऽ',ur:'اکاؤنٹ ہولڈر کا نام',pa:'ਖਾਤਾਧਾਰਕ ਦਾ ਨਾਮ'}[language])+' ';$('#accountNumberLabel').firstChild.textContent=({en:'Account number',hi:'खाता संख्या',doi:'खाता नंबर',ur:'اکاؤنٹ نمبر',pa:'ਖਾਤਾ ਨੰਬਰ'}[language])+' ';$('#phoneLabel').firstChild.textContent=({en:'Phone number',hi:'फ़ोन नंबर',doi:'फोन नंबर',ur:'فون نمبر',pa:'ਫ਼ੋਨ ਨੰਬਰ'}[language])+' ';$('#branchLabel').firstChild.textContent=({en:'Branch',hi:'शाखा',doi:'शाखा',ur:'برانچ',pa:'ਸ਼ਾਖਾ'}[language])+' ';$('#profileDataNote').textContent=({en:'Customer and account data come from the confirmed demo record. Check OCR suggestions.',hi:'ग्राहक और खाते की जानकारी पुष्टि किए गए डेमो रिकॉर्ड से है। OCR सुझाव जाँचें।',doi:'ग्राहक ते खाते दी जानकारी पक्के डेमो रिकॉर्ड थमां ऐ। OCR सुझाव जांचो।',ur:'صارف اور اکاؤنٹ کی معلومات تصدیق شدہ ڈیمو ریکارڈ سے ہیں۔ OCR کی تجاویز چیک کریں۔',pa:'ਗਾਹਕ ਅਤੇ ਖਾਤੇ ਦੇ ਵੇਰਵੇ ਪੁਸ਼ਟੀ ਕੀਤੇ ਡੈਮੋ ਰਿਕਾਰਡ ਤੋਂ ਹਨ। OCR ਸੁਝਾਅ ਜਾਂਚੋ।'}[language]);$('#transactionLabel').firstChild.textContent=t.transactionType+' ';$('#amountLabel').firstChild.textContent=t.withdrawAmount+' ';$('#confirmAmountText').textContent=t.confirmAmount;$('#prepare').textContent=t.reviewDraft;$('#download').textContent=t.downloadDraft;$('.blank-template').textContent=t.blankForm;$('#withdrawalScreen details summary').textContent=t.reviewDetails;$('#signatureHelp').innerHTML=t.signatureHelp.replace('SIGN HERE','<strong>SIGN HERE</strong>');const footer=$('#footerText');if(footer)footer.textContent=t.sampleSafe;document.querySelectorAll('[data-sample]').forEach(b=>b.textContent=({en:'Use this sample',hi:'इस नमूने का उपयोग करें',doi:'एह् नमूना बरतो',ur:'یہ نمونہ استعمال کریں',pa:'ਇਹ ਨਮੂਨਾ ਵਰਤੋ'}[language]));document.querySelectorAll('[data-sample]').forEach(b=>b.textContent=({en:'Select this passbook',hi:'इस पासबुक को चुनें',doi:'एह् पासबुक चुनो',ur:'یہ پاس بک منتخب کریں',pa:'ਇਹ ਪਾਸਬੁੱਕ ਚੁਣੋ'}[language]));document.querySelectorAll('[data-form]').forEach((button,i)=>{const strong=button.querySelector('strong'),span=button.querySelector('span');const titles=[t.withdrawForm,t.depositForm,t.sbiOpenForm,t.idfcForm,t.dtbForm,t.dcbForm],subs=[t.withdrawSub,t.depositSub,'',t.idfcSub,'',t.dcbSub];if(strong&&titles[i])strong.textContent=titles[i];if(span&&subs[i])span.textContent=subs[i]});$('#withdrawalType').options[0].text=t.cash;$('#withdrawalType').options[1].text=t.pension;$('#formsBack').textContent=t.startOver;
 const ui={en:{switch:'Switch language',preview:'Preview completed form',download:'Download PDF after reviewing preview',back:'Choose another form',passbook:'Account-holder details are filled from the matched account record.',notice:'Enter only the deposit amount. Other fields are filled automatically from the account record.',fields:{name:'Account holder name',account:'Account number',branch:'Branch',phone:'Phone number',amount:'Deposit amount (INR)'}},hi:{switch:'भाषा बदलें',preview:'फ़ॉर्म का पूर्वावलोकन देखें',download:'पूर्वावलोकन जाँचकर PDF डाउनलोड करें',back:'दूसरा फ़ॉर्म चुनें',passbook:'खाताधारक की जानकारी मिलान किए गए खाते से भरी गई है।',notice:'केवल जमा राशि दर्ज करें। बाकी जानकारी खाते से अपने आप भरी जाएगी।',fields:{name:'खाताधारक का नाम',account:'खाता संख्या',branch:'शाखा',phone:'फ़ोन नंबर',amount:'जमा राशि (₹)'}},pa:{switch:'ਭਾਸ਼ਾ ਬਦਲੋ',preview:'ਭਰੇ ਫਾਰਮ ਦੀ ਝਲਕ ਵੇਖੋ',download:'ਝਲਕ ਜਾਂਚ ਕੇ PDF ਡਾਊਨਲੋਡ ਕਰੋ',back:'ਹੋਰ ਫਾਰਮ ਚੁਣੋ',passbook:'ਖਾਤਾਧਾਰਕ ਦੇ ਵੇਰਵੇ ਮਿਲਾਏ ਖਾਤੇ ਤੋਂ ਭਰੇ ਗਏ ਹਨ।',notice:'ਸਿਰਫ਼ ਜਮ੍ਹਾਂ ਰਕਮ ਦਰਜ ਕਰੋ। ਬਾਕੀ ਵੇਰਵੇ ਖਾਤੇ ਤੋਂ ਆਪਣੇ ਆਪ ਭਰੇ ਜਾਣਗੇ।',fields:{name:'ਖਾਤਾਧਾਰਕ ਦਾ ਨਾਮ',account:'ਖਾਤਾ ਨੰਬਰ',branch:'ਸ਼ਾਖਾ',phone:'ਫ਼ੋਨ ਨੰਬਰ',amount:'ਜਮ੍ਹਾਂ ਰਕਮ (₹)'}},ur:{switch:'زبان تبدیل کریں',preview:'فارم کا پیش منظر دیکھیں',download:'پیش منظر دیکھ کر PDF ڈاؤن لوڈ کریں',back:'دوسرا فارم منتخب کریں',passbook:'اکاؤنٹ کی تفصیل تصدیق شدہ ریکارڈ سے بھری گئی ہے۔',notice:'صرف جمع رقم درج کریں۔ باقی معلومات ریکارڈ سے خود بھر دی جائیں گی۔',fields:{name:'اکاؤنٹ ہولڈر کا نام',account:'اکاؤنٹ نمبر',branch:'برانچ',phone:'فون نمبر',amount:'جمع رقم (₹)'}},doi:{switch:'भाशा बदलो',preview:'भरे फॉर्म दा पूर्वावलोकन दिक्खो',download:'पूर्वावलोकन जांचियै PDF डाउनलोड करो',back:'दूआ फॉर्म चुनो',passbook:'खाताधारक दी जानकारी मिलाए खाते थमां भरी गेई ऐ।',notice:'सिर्फ जमा रकम दर्ज करो। बाकी जानकारी खाते थमां अपने आप भरी जाग।',fields:{name:'खाताधारक दा नांऽ',account:'खाता नंबर',branch:'शाखा',phone:'फोन नंबर',amount:'जमा रकम (₹)'}}};
 const u=ui[language]||ui.en;$('#switchLanguage').textContent=u.switch;$('#previewSampleForm').textContent=u.preview;$('#downloadSampleForm').textContent=u.download;$('#otherFormBack').textContent=u.back;if($('#otherFormPassbook').textContent)$('#otherFormPassbook').textContent=u.passbook;if($('#otherFormNotice').textContent)$('#otherFormNotice').textContent=u.notice;document.querySelectorAll('#selectedFormFields input[data-field]').forEach(input=>{const label=input.parentElement;if(label&&label.firstChild&&u.fields[input.dataset.field])label.firstChild.textContent=u.fields[input.dataset.field]});}
function languageFromLocale(locale){locale=(locale||'').toLowerCase();if(locale.startsWith('hi'))return'hi';if(locale.startsWith('pa'))return'pa';if(locale.startsWith('ur'))return'ur';if(locale.startsWith('doi'))return'doi';return'en'}
function detectLanguage(text){if(/\b(?:sat\s+sri\s+akal|sat\s+sri\s+akaal|satsriakal)\b/i.test(text)||/[\u0a00-\u0a7f]/.test(text))return'pa';if(/[\u0600-\u06ff\u0750-\u077f]/.test(text))return'ur';if(/\b(?:namaste|namaskar|mujhe|mujhko|paise|paisa|nikal|nikalne|nikalna|jama|karna|hai|hain|chahiye)\b/i.test(text)||/[\u0900-\u097f]/.test(text))return'hi';return'en'}
// Which language was actually spoken? Returns '' when the words give no real evidence (digits, "yes", "rupees"...), so those never flip the screen.
function detectSpokenLanguage(text){
  const t=(text||'').normalize('NFC');
  if(/[\u0a00-\u0a7f]/.test(t))return'pa';
  if(/[\u0600-\u06ff\u0750-\u077f]/.test(t))return'ur';
  if(/[\u0900-\u097f]/.test(t))return'hi';
  if(/\b(?:sat\s+sri\s+akaa?l|satsriakal)\b/i.test(t))return'pa';
  if(/\b(?:namaste|namaskar|mujhe|mujhko|mera|meri|paise|paisa|rupaye|rupaiye|nikal\w*|jama|karna|karni|karo|chahiye|chahta|chahti|kitna|kitne|batao|bataiye|khata|haan|nahi|nahin|hai|hain|kya|aap|dikhao|dikhaiye|dikhana|dikha|dekho|dekhiye|dijiye|kijiye|chahte|batana|rupaye|paise|mera|meri|apna|apni|abhi|dobara|phir|shuru|wapas|theek|accha|achha|balance\s+dikha\w*)\b/i.test(t))return'hi';
  const filler=/^(?:yes|no|ok|okay|yeah|yep|nope|sure|fine|please|thanks?|thank|you|rupees?|rs|zero|one|two|three|four|five|six|seven|eight|nine|ten|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|lakh|lac|crore|crores|and|only)$/i;
  const words=(t.match(/[A-Za-z]{2,}/g)||[]).filter(w=>!filler.test(w));if(language==='en')return words.length?'en':'';return words.length>=4?'en':'';
}
// The screen follows the language the customer speaks, until they explicitly ask for a screen language ("screen in Punjabi"); then it stays put.
function followSpokenLanguage(spoken){
  const detected=detectSpokenLanguage(spoken);if(!detected)return;
  if(!speechLanguageLocked)speakingLanguage=detected;
  if(displayLanguageLocked||lastLanguageChange?.display||detected===language)return;
  language=detected;try{localize()}catch(e){console.error('Localization after spoken-language change failed:',e)}
  if(flowStage==='amount-confirmed'&&detectedAmount&&activeScreen==='requestScreen')renderAmountBox($('#requestResult'),detectedAmount);
}
function opener(code){return{en:'Hello!',hi:'नमस्ते!',doi:'नमस्कार!',ur:'آداب!',pa:'ਸਤ ਸ੍ਰੀ ਅਕਾਲ!'}[code]||'Hello!'}
function recognitionLocale(code){return{en:'en-IN',hi:'hi-IN',ur:'ur-PK',pa:'pa-Guru-IN',doi:'hi-IN'}[code]||'en-IN'}
function synthLocale(code){return{en:'en-IN',hi:'hi-IN',ur:'ur-PK',pa:'pa-IN',doi:'hi-IN'}[code]||'en-IN'}
function amountReply(code,amount){return{en:`I heard ₹${amount}. Say another amount to change it, or continue the draft on screen.`,hi:`आपने ₹${amount} कहा। बदलने के लिए नई राशि बोलें, या स्क्रीन पर मसौदा आगे बढ़ाएँ।`,doi:`तुसें ₹${amount} आखेआ। बदलने लेई नमीं रकम बोलो, जां स्क्रीन पर मसौदा अग्गें बढ़ाओ।`,ur:`تُہۍ ₹${amount} وُچھِو۔ بدلٲونہٕ خٲطرٕ نو رقم وُچھِو، یا سکرین پٲٹھۍ مسودٕ جاری تھٲوِو۔`,pa:`ਤੁਸੀਂ ₹${amount} ਕਿਹਾ। ਬਦਲਣ ਲਈ ਨਵੀਂ ਰਕਮ ਬੋਲੋ, ਜਾਂ ਸਕ੍ਰੀਨ ਉੱਤੇ ਮਸੌਦਾ ਅੱਗੇ ਵਧਾਓ।`}[code]}
function amountClarify(code){return{en:'Please say the amount using digits, or type it in the amount box.',hi:'राशि अंक में बोलें या राशि वाले खाने में टाइप करें।',doi:'रकम अंकें च बोलो जां रकम आले खाने च टाइप करो।',ur:'رقم ہندسہٕ منز وُچھِو یا رقم خانہٕ منز ٹائپ کٔرِو۔',pa:'ਰਕਮ ਅੰਕਾਂ ਵਿੱਚ ਬੋਲੋ ਜਾਂ ਰਕਮ ਵਾਲੇ ਖਾਨੇ ਵਿੱਚ ਲਿਖੋ।'}[code]}
function isAffirmative(text){return/^(yes|yeah|correct|ठीक|हाँ|हां|हांजी|हां जी|ਹਾਂ|ਹਾਂਜੀ|آری|درست)[!?.\s]*$/i.test(text.trim())}
function isGreeting(text){return/^(hello|hi|namaste|namaskar|नमस्ते|नमस्कार|ਸਤ\s*ਸ੍ਰੀ\s*ਅਕਾਲ|آداب)[!?.\s]*$/i.test(text.trim())}
async function say(text,code=speakingLanguage,onend=null){if(!text){onend?.();return}if(geminiActive()){geminiNote('Tell the customer exactly this: '+text);if(onend&&onend!==startRecognition)onend();return}speechCancelled=false;if(mode==='voice'){listeningUI(false);setListeningVisual(false);$('#listening').hidden=true;$('#requestListening').hidden=true;showVoiceStatus(fixedStatus('speaking'));$('#requestTranscript').hidden=true;$('#requestResult').hidden=true;$('#voiceChat').replaceChildren()}if(window.speechSynthesis&&window.SpeechSynthesisUtterance){window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=synthLocale(code);try{const vs=await getVoicesWhenReady();const v=chooseVoice(vs,[synthLocale(code)]);if(v)u.voice=v;else if(code==='pa'||code==='ur'){/* No Punjabi/Urdu voice installed in this browser: keep the text on screen instead of mispronouncing it. */showVoiceStatus(text);onend?.();return}}catch(e){console.debug('Voice lookup failed',e)}u.onstart=()=>{setListeningVisual(false);$('#listening').hidden=true;$('#requestListening').hidden=true};u.onend=()=>{setListeningVisual(false);if(!speechCancelled)onend?.()};u.onerror=()=>{setListeningVisual(false);if(!speechCancelled)onend?.()};window.speechSynthesis.speak(u)}else onend?.();}
function showVoiceStatus(message){$('#voiceStatus').textContent=message;$('#requestStatus').textContent=message}
// App-owned status strings must follow the selected display language. Never put raw model
// transcript text into status labels: Gemini may return Urdu script during a Hindi session.
function fixedStatus(kind){const c=language;const labels={
 listening:{en:'Listening…',hi:'सुन रही हूँ…',pa:'ਸੁਣ ਰਹੀ ਹਾਂ…',ur:'سن رہی ہوں…'},
 speaking:{en:'Speaking…',hi:'बोल रही हूँ…',pa:'ਬੋਲ ਰਹੀ ਹਾਂ…',ur:'بات کر رہی ہوں…'},
 fallback:{en:'Voice assistance is continuing.',hi:'आवाज़ की सहायता जारी है।',pa:'ਆਵਾਜ਼ ਰਾਹੀਂ ਮਦਦ ਜਾਰੀ ਹੈ।',ur:'آواز کے ذریعے مدد جاری ہے۔'},
 choosePassbook:{en:'Please choose your passbook on the screen.',hi:'कृपया स्क्रीन पर अपनी पासबुक चुनें।',pa:'ਕਿਰਪਾ ਕਰਕੇ ਸਕ੍ਰੀਨ ਉੱਤੇ ਆਪਣੀ ਪਾਸਬੁੱਕ ਚੁਣੋ।',ur:'براہِ کرم اسکرین پر اپنی پاس بک منتخب کریں۔'}
};return (labels[kind]||labels.listening)[c]||(labels[kind]||labels.listening).en}
function setStatusFromModelText(_text){/* Intentionally ignored: app status is controlled by the selected UI language. */}
function showLoading(title,detail='Please wait while the kiosk processes this step.'){const overlay=$('#loadingOverlay');if(!overlay)return;$('#loadingTitle').textContent=title;$('#loadingDetail').textContent=detail;overlay.hidden=false;document.body.setAttribute('aria-busy','true')}
function hideLoading(){const overlay=$('#loadingOverlay');if(overlay)overlay.hidden=true;document.body.removeAttribute('aria-busy')}
function setListeningVisual(active,{greeting=false}={}){const actuallyListening=!!active&&!greeting&&!window.speechSynthesis?.speaking&&!geminiMicPaused&&!geminiSpeaking;document.body.classList.toggle('is-listening',actuallyListening);document.body.classList.remove('greeting-mode');const badge=$('#listening');if(badge){badge.hidden=!actuallyListening;badge.textContent=language==='en'?'Listening…':language==='ur'?'سن رہی ہوں…':language==='pa'?'ਸੁਣ ਰਹੀ ਹਾਂ…':'सुन رہی हूँ…'}const requestBadge=$('#requestListening');if(requestBadge)requestBadge.hidden=!actuallyListening;}
function loadingCopy(kind){const c={en:{gemini:['Connecting…','Setting up voice assistance'],passbook:['Reading your passbook…','Extracting details and matching the demo account']},hi:{gemini:['कनेक्ट हो रहा है…','आवाज़ की सहायता तैयार हो रही है'],passbook:['पासबुक पढ़ी जा रही है…','जानकारी निकाली जा रही है और खाते का मिलान हो रहा है']},ur:{gemini:['رابطہ قائم ہو رہا ہے…','آواز کی مدد تیار کی جا رہی ہے'],passbook:['پاس بک پڑھی جا رہی ہے…','تفصیل نکال کر ڈیمو اکاؤنٹ سے ملائی جا رہی ہے']},pa:{gemini:['ਕਨੈਕਟ ਹੋ ਰਿਹਾ ਹੈ…','ਆਵਾਜ਼ ਸਹਾਇਤਾ ਤਿਆਰ ਹੋ ਰਹੀ ਹੈ'],passbook:['ਪਾਸਬੁੱਕ ਪੜ੍ਹੀ ਜਾ ਰਹੀ ਹੈ…','ਵੇਰਵੇ ਕੱਢ ਕੇ ਡੈਮੋ ਖਾਤੇ ਨਾਲ ਮਿਲਾਏ ਜਾ ਰਹੇ ਹਨ']}};return(c[language]||c.en)[kind]||c.en.passbook}

function listeningUI(active){$('#listening').hidden=!active;$('#stop').hidden=!active;$('#listen').hidden=active;$('#requestListening').hidden=!active;$('#requestStop').hidden=!active;$('#requestVoice').hidden=active||mode!=='voice'}
function resetIntentActions(){if($('#amountConfirmActions'))$('#amountConfirmActions').hidden=true;for(const id of ['continueWithdrawal','continueUpload','requestVoice','requestManual'])$('#'+id).hidden=true;$('#withdrawalAmountBlock').hidden=true;$('#requestResult').hidden=true;hideRequestBalance();}
async function interpret(text,source='manual',alreadySpoken=false){const clean=text.trim();if(!clean)return;if(source==='voice'){localize();$('#requestTranscript').hidden=true;$('#requestResult').hidden=true;$('#voiceChat').replaceChildren();}const response=await fetch('/api/intent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:clean,language})});const data=await response.json();currentIntent=data.intent;resetIntentActions();let w=words(language);
 let reply=data.intent==='withdrawal'?(data.amount?amountReply(language,data.amount):w.withdraw):(data.intent==='deposit'?'I can prepare a deposit slip. First, choose your passbook and account.':(data.intent==='unsupported'?w.unsupported:(data.intent==='greeting'?w.greeting:w.unclear)));if(source==='voice'){$('#requestResult').hidden=true;$('#requestTranscript').hidden=true;show('requestScreen');$('#requestVoice').hidden=false;$('#requestManual').hidden=false;showVoiceStatus('Speaking…');say(reply,language,startRecognition)}else{$('#requestResult').textContent=reply;$('#requestResult').hidden=false}
 if(data.intent==='withdrawal'){$('#withdrawalAmountBlock').hidden=false;$('#continueWithdrawal').hidden=false;flowStage='amount';detectedAmount=data.amount||'';$('#requestedAmount').value=detectedAmount;if(mode==='voice'&&!imageFile)$('#continueUpload').hidden=false;else $('#continueUpload').hidden=true;}
 else if(data.intent==='deposit'){flowStage='request';$('#continueUpload').hidden=!(!imageFile);if(imageFile){$('#requestResult').textContent='Deposit request understood. Continue to the available forms.';$('#requestResult').hidden=false;}}
 else if(data.intent==='unsupported'){if(source==='voice')showVoiceStatus('Speaking…');}
}
function addBubble(text,cls=''){/* Voice-first kiosk intentionally does not render speech transcripts. */}
function normalizeSpokenDigits(t){return t.replace(/[०-९]/g,c=>String(c.charCodeAt(0)-0x0966)).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-0x0660)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-0x06F0)).replace(/[੦-੯]/g,c=>String(c.charCodeAt(0)-0x0A66))}
function spokenNumberValue(text){const half=halfNumberValue(text);if(half)return half;
 let raw=normalizeSpokenDigits((text||'').toLowerCase()).replace(/\u095b/g,'ज').replace(/\u093c/g,'').replace(/[₹]/g,' ');
 // Join grouped digits first: 10,000 / 1,00,000 / 10 000 must stay ONE number.
 while(/(\d),(\d{2,3})(?!\d)/.test(raw))raw=raw.replace(/(\d),(\d{2,3})(?!\d)/,'$1$2');
 raw=raw.replace(/(\d{1,3})\s(\d{3})(?!\d)/g,'$1$2');
  // Sum each explicit numeric scale in compound amounts such as "2 crore 50 lakh".
  const scalePattern=/(\d+(?:\.\d+)?)\s*(crores?|करोड़|करोड|ਕਰੋੜ|کروڑ|lakhs?|lacs?|लाख|ਲੱਖ|لاکھ|thousand|hazar|hazaar|हजार|ਹਜ਼ਾਰ|ہزار|hundred|सौ|ਸੌ|سو|k(?![a-z]))/ig;
  const scaleValues={crore:10000000,crores:10000000,'करोड़':10000000,'करोड':10000000,'ਕਰੋੜ':10000000,'کروڑ':10000000,lakh:100000,lakhs:100000,lac:100000,lacs:100000,'लाख':100000,'ਲੱਖ':100000,'لاکھ':100000,thousand:1000,hazar:1000,hazaar:1000,'हजार':1000,'ਹਜ਼ਾਰ':1000,'ہزار':1000,hundred:100,'सौ':100,'ਸੌ':100,'سو':100,k:1000};
  const scaled=[...raw.matchAll(scalePattern)];
  if(scaled.length){const v=Math.round(scaled.reduce((sum,m)=>sum+parseFloat(m[1])*(scaleValues[m[2].toLowerCase()]||1),0));if(v>0&&v<=1000000000)return String(v)}
 const s=raw.replace(/[।,!?]/g,' ').replace(/हज़ारों/g,'हजार').replace(/पाँच/g,'पांच').replace(/फाइव/g,'five').replace(/थाउज़ंड|थाउजेंड|थाउजंड/g,'thousand').replace(/रुपए|रुपया|रुपये/g,'rupees').trim();
 const digit=s.match(/\b(\d{1,7}(?:\.\d{1,2})?)\b/);if(digit&&Number(digit[1])>0)return digit[1];
 const tokens=s.split(/\s+/);
 const units={zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90,
 'शून्य':0,'एक':1,'दो':2,'तीन':3,'चार':4,'पाँच':5,'पांच':5,'छह':6,'छः':6,'सात':7,'आठ':8,'नौ':9,'दस':10,'ग्यारह':11,'बारह':12,'तेरह':13,'चौदह':14,'पंद्रह':15,'पन्द्रह':15,'सोलह':16,'सत्रह':17,'अठारह':18,'उन्नीस':19,'बीस':20,'तीस':30,'चालीस':40,'पचास':50,'साठ':60,'सत्तर':70,'अस्सी':80,'नब्बे':90,'इक्कीस':21,'बाईस':22,'तेईस':23,'चौबीस':24,'पच्चीस':25,'छब्बीस':26,'सत्ताईस':27,'अट्ठाईस':28,'अठाईस':28,'उनतीस':29,'इकतीस':31,'बत्तीस':32,'तैंतीस':33,'चौंतीस':34,'पैंतीस':35,'छत्तीस':36,'सैंतीस':37,'अड़तीस':38,'उनतालीस':39,'इकतालीस':41,'बयालीस':42,'तैंतालीस':43,'चवालीस':44,'पैंतालीस':45,'छियालीस':46,'सैंतालीस':47,'अड़तालीस':48,'उनचास':49,'इक्यावन':51,'बावन':52,'तिरपन':53,'चौवन':54,'पचपन':55,'छप्पन':56,'सत्तावन':57,'अट्ठावन':58,'उनसठ':59,'पैंसठ':65,'पचहत्तर':75,'पचासी':85,'पंचानवे':95,'twenty-five':25,'fifty-five':55,
 'ਇੱਕ':1,'ਦੋ':2,'ਤਿੰਨ':3,'ਚਾਰ':4,'ਪੰਜ':5,'ਛੇ':6,'ਸੱਤ':7,'ਅੱਠ':8,'ਨੌਂ':9,'ਦਸ':10,'ਵੀਹ':20,'ਤੀਹ':30,'ਚਾਲੀ':40,'ਪੰਜਾਹ':50,
 'ایک':1,'دو':2,'تین':3,'چار':4,'پانچ':5,'چھ':6,'سات':7,'آٹھ':8,'نو':9,'دس':10,'بیس':20,'تیس':30,'چالیس':40,'پچاس':50};
 const scales={hundred:100,'सौ':100,'ਸੌ':100,'سو':100,'हजार':1000,'ਹਜ਼ਾਰ':1000,'ہزار':1000,thousand:1000,lakh:100000,lac:100000,'लाख':100000,'ਲੱਖ':100000,'لاکھ':100000,crore:10000000,crores:10000000,'करोड़':10000000,'करोड':10000000,'ਕਰੋੜ':10000000,'کروڑ':10000000};
 let total=0,group=0,found=false;
 for(const t of tokens){if(t in units){group+=units[t];found=true}else if(t in scales){const scale=scales[t];group=Math.max(1,group)*scale;if(scale>=1000){total+=group;group=0}found=true}else if(['rupees','rupee','rs','रुपये','रुपए','रुपया','रुपयों','रुपए।','रुपये।','रुपये,','रुपये।','रुपये'].includes(t)||['है','हैं','हूँ','हूं','की','राशि','रुपये','रुपए','पैसे','कृपया','amount','please','only'].includes(t))continue;}
 const value=total+group;return found&&value>0&&value<=1000000000?String(value):'';
}
function amountWords(amount,code){
 const n=Number(amount);if(!Number.isFinite(n))return String(amount);
 const onesEn=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
 const tensEn=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
 const onesHi=['शून्य','एक','दो','तीन','चार','पाँच','छह','सात','आठ','नौ','दस','ग्यारह','बारह','तेरह','चौदह','पंद्रह','सोलह','सत्रह','अठारह','उन्नीस'];
 const tensHi=['','','बीस','तीस','चालीस','पचास','साठ','सत्तर','अस्सी','नब्बे'];
 const hi20=['','','बाईस'];
 function small(x,hi){const o=hi?onesHi:onesEn,t=hi?tensHi:tensEn;if(x<20)return o[x];if(x<100){const rem=x%10;return rem?(hi?(t[Math.floor(x/10)]+' '+o[rem]):(t[Math.floor(x/10)]+'-'+o[rem])):t[x/10]}return ''}
 function words(x,hi){if(x<100)return small(x,hi);if(x<1000)return (small(Math.floor(x/100),hi)+(hi?' सौ ':' hundred ')+(x%100?words(x%100,hi):'' )).trim();if(x<100000)return (words(Math.floor(x/1000),hi)+(hi?' हज़ार ':' thousand ')+(x%1000?words(x%1000,hi):'')).trim();if(x<10000000)return (words(Math.floor(x/100000),hi)+(hi?' लाख ':' lakh ')+(x%100000?words(x%100000,hi):'')).trim();if(x<1000000000)return (words(Math.floor(x/10000000),hi)+(hi?' करोड़ ':' crore ')+(x%10000000?words(x%10000000,hi):'')).trim();return String(x)}
 const hi=code==='hi';return (hi?words(Math.round(n),true):words(Math.round(n),false))+(hi?' रुपये':' rupees');
}
function affirmative(text){return /^(हाँ|हां|जी हाँ|जी हां|हाँ सही|सही है|ठीक है|yes|yeah|yep|correct|right|that is right|continue|go ahead|आगे बढ़िए|आगे बढ़ें|जारी रखें|haan|han|ji|theek hai|ਹਾਂ|ਜੀ ਹਾਂ|ہاں|جی ہاں)[।.!\s]*$/i.test(text.trim())}
function negative(text){return /^(नहीं|नही|ना|गलत|नहीं सही|no|nope|wrong|not correct|nahin|nahi|na|ਨਹੀਂ|ਗਲਤ|نہیں|غلط)[।.!\s]*$/i.test(text.trim())}
function localIntent(text){const t=text.toLowerCase();if(/निकाल|निकासी|पैसे बाहर|पैसे निकाल|रकम निकाल|पैसा निकाल|paise nikal|paisa nikal|nikalna hai|withdraw|cash out|take out|withdrawal|پیسے نکال|رقم نکال|ਪੈਸੇ ਕਢ|ਪੈਸੇ ਕਢਵਾ/.test(t))return'withdrawal';if(/जमा|खाते में डाल|पैसे डाल|paise jama|paisa jama|jama kar|deposit|put money in|add money|رقم جمع|پیسے جمع|ਪੈਸੇ ਜਮ੍ਹਾ/.test(t))return'deposit';if(/अकाउंट खोल|खाता खोल|नया खाता|बैलेंस चेक|बैलेंस बत|आधार जोड़|आधार लिंक|पता बदल|मोबाइल नंबर बदल|पैसे ट्रांसफर|मुझे अकाउंट|account open|open account|account opening|new account|check balance|balance inquiry|aadhaar|aadhar|pan card|update address|change address|transfer money|send money|open a bank account|credit card|loan apply|apply for loan|मुझे लोन|लोन चाहिए/.test(t))return'unsupported';return''}
function amountConfirmation(amount,code){const spoken=amountWords(amount,code);return code==='hi'?`आपने ${spoken} कहा। क्या यह राशि सही है? हाँ या नहीं कहें।`:code==='pa'?`ਤੁਸੀਂ ${spoken} ਕਿਹਾ। ਕੀ ਇਹ ਰਕਮ ਸਹੀ ਹੈ? ਹਾਂ ਜਾਂ ਨਹੀਂ ਕਹੋ।`:code==='ur'?`آپ نے ${spoken} کہا۔ کیا یہ رقم درست ہے؟ ہاں یا نہیں کہیں۔`:`You said ${spoken}. Is that amount correct? Please say yes or no.`}
async function handleVoice(text,detected=''){
 const spoken=(text||'').trim();if($('#amountConfirmActions')&&(affirmative(spoken)||negative(spoken)))$('#amountConfirmActions').hidden=true;if(!spoken){showVoiceStatus(words(language).speechError);return}if(parseLanguagePreferenceCommand(spoken)){const response=languageChangeConfirmation();showVoiceStatus(response);await say(response,['hi','en','pa','ur'].includes(language)?language:'hi',()=>{speechRestartAllowed=true;const q=stagePrompt(speakingLanguage);q?say(q,speakingLanguage,startRecognition):startRecognition()});return}
 const amountOnly=/^(?:(?:₹|rs\.?|rupees?)\s*)?(?:[\d,]+(?:\.\d{1,2})?|five|fifteen|fifty|five thousand|five hundred|two thousand|three thousand|four thousand|six thousand|seven thousand|eight thousand|nine thousand|ten thousand|two crore|one crore|पाँच|पांच|पाँच सौ|पांच सौ|पाँच हजार|पांच हजार|पाँच हज़ार|पांच हज़ार|दो हजार|दो हज़ार|तीन हजार|तीन हज़ार|चार हजार|चार हज़ार|छह हजार|छह हज़ार|सात हजार|सात हज़ार|आठ हजार|आठ हज़ार|नौ हजार|नौ हज़ार|दस हजार|दस हज़ार)(?:\s+(?:rupees?|रुपये?|रुपए|रुपया|हजार|हज़ार|thousand|hundred|crore|crores|करोड़|करोड|ਕਰੋੜ|کروڑ))?[.!\s]*$/i.test(spoken);if(!amountOnly)followSpokenLanguage(spoken);
 $('#requestTranscript').hidden=true;$('#requestResult').hidden=true;$('#voiceChat').replaceChildren();
 if(isGreeting(spoken)){const prompt=speakingLanguage==='hi'?'जी, बताइए। आपको क्या काम करना है?':speakingLanguage==='pa'?'ਜੀ, ਦੱਸੋ। ਤੁਹਾਨੂੰ ਕੀ ਕੰਮ ਹੈ?':speakingLanguage==='ur'?'جی، بتائیے، آپ کو کیا کام ہے؟':'Sure. What would you like help with?';await say(prompt,speakingLanguage,startRecognition);return}
 if(flowStage==='balance-check'){
   if(affirmative(spoken)){
     const balanceText=speakingLanguage==='hi'?`आपके खाते में अभी ${amountWords(lastKnownBalance,speakingLanguage)} हैं।`:speakingLanguage==='pa'?`ਤੁਹਾਡੇ ਖਾਤੇ ਵਿੱਚ ਇਸ ਵੇਲੇ ${amountWords(lastKnownBalance,speakingLanguage)} ਹਨ।`:speakingLanguage==='ur'?`آپ کے اکاؤنٹ میں اس وقت ${amountWords(lastKnownBalance,speakingLanguage)} ہیں۔`:`Your current balance is ${amountWords(lastKnownBalance,speakingLanguage)}.`;
     $('#currentBalanceText').hidden=true;showBalanceBox(lastKnownBalance);$('#balancePrompt').hidden=false;flowStage='amount';const nextAmountPrompt=speakingLanguage==='hi'?'अब कृपया निकालने के लिए कम राशि बताइए।':speakingLanguage==='pa'?'ਹੁਣ ਕਿਰਪਾ ਕਰਕੇ ਕਢਵਾਉਣ ਲਈ ਘੱਟ ਰਕਮ ਦੱਸੋ।':speakingLanguage==='ur'?'اب براہِ کرم نکلوانے کے لیے کم رقم بتائیں۔':'Now please tell me a lower amount to withdraw.';await say(balanceSpeech(speakingLanguage),speakingLanguage,startRecognition);return;
   }
   if(negative(spoken)){flowStage='amount';hideRequestBalance();$('#balancePrompt').hidden=true;$('#amount').focus();const prompt=speakingLanguage==='hi'?'ठीक है। कृपया कम राशि दर्ज करें।':speakingLanguage==='pa'?'ਠੀਕ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਘੱਟ ਰਕਮ ਦਰਜ ਕਰੋ।':speakingLanguage==='ur'?'ٹھیک ہے۔ براہِ کرم کم رقم درج کریں۔':'Okay. Please enter a lower amount.';await say(prompt,speakingLanguage,startRecognition);return;}
   const prompt=speakingLanguage==='hi'?'क्या आप अपना मौजूदा बैलेंस देखना चाहते हैं? हाँ या नहीं कहें।':speakingLanguage==='pa'?'ਕੀ ਤੁਸੀਂ ਮੌਜੂਦਾ ਬਕਾਇਆ ਵੇਖਣਾ ਚਾਹੁੰਦੇ ਹੋ? ਹਾਂ ਜਾਂ ਨਹੀਂ ਕਹੋ।':speakingLanguage==='ur'?'کیا آپ موجودہ بیلنس دیکھنا چاہتے ہیں؟ ہاں یا نہیں کہیں۔':'Would you like to see your current balance? Please say yes or no.';await say(prompt,speakingLanguage,startRecognition);return;
 }
 if(currentIntent==='withdrawal'&&flowStage==='amount-confirmed'){
   if(affirmative(spoken)){
     if(passbook.profile&&Number(detectedAmount)>Number(passbook.profile.balance||0)){lastKnownBalance=String(passbook.profile.balance||'0');flowStage='balance-check';const prompt=speakingLanguage==='hi'?'आपके खाते में इतनी राशि नहीं है। क्या आप अपना मौजूदा बैलेंस देखना चाहते हैं? हाँ या नहीं कहें।':speakingLanguage==='pa'?'ਤੁਹਾਡੇ ਖਾਤੇ ਵਿੱਚ ਇੰਨੀ ਰਕਮ ਨਹੀਂ ਹੈ। ਕੀ ਤੁਸੀਂ ਮੌਜੂਦਾ ਬਕਾਇਆ ਵੇਖਣਾ ਚਾਹੁੰਦੇ ਹੋ? ਹਾਂ ਜਾਂ ਨਹੀਂ ਕਹੋ।':speakingLanguage==='ur'?'آپ کے اکاؤنٹ میں اتنی رقم نہیں ہے۔ کیا آپ موجودہ بیلنس دیکھنا چاہتے ہیں؟ ہاں یا نہیں کہیں۔':'Your account does not have enough balance for that withdrawal. Would you like to see your current balance? Please say yes or no.';setBalancePrompt(prompt);await say(prompt,speakingLanguage,startRecognition);return}
     if(passbook.profile){flowStage='request';showWithdrawal();speechRestartAllowed=false;try{speechRecognition?.stop()}catch{}return}
     flowStage='passbook';show('uploadScreen');const prompt=speakingLanguage==='hi'?'ठीक है। अब अपनी पासबुक चुनिए।':speakingLanguage==='pa'?'ਠੀਕ ਹੈ। ਹੁਣ ਆਪਣੀ ਪਾਸਬੁੱਕ ਚੁਣੋ।':speakingLanguage==='ur'?'ٹھیک ہے۔ اب اپنی پاس بک منتخب کریں۔':'All right. Please choose your passbook.';await say(prompt,speakingLanguage);speechRestartAllowed=false;try{speechRecognition?.stop()}catch{}return}
   if(negative(spoken)){flowStage='amount';detectedAmount='';$('#requestedAmount').value='';const prompt=speakingLanguage==='hi'?'ठीक है। सही राशि फिर से बताइए।':speakingLanguage==='pa'?'ਠੀਕ ਹੈ। ਸਹੀ ਰਕਮ ਦੁਬਾਰਾ ਦੱਸੋ।':speakingLanguage==='ur'?'ٹھیک ہے۔ درست رقم دوبارہ بتائیں۔':'No problem. Please say the correct amount again.';await say(prompt,speakingLanguage,startRecognition);return}
   const revised=spokenNumberValue(spoken);if(revised){detectedAmount=revised;$('#requestedAmount').value=revised;{const p=say(amountConfirmation(revised,speakingLanguage),speakingLanguage,startRecognition);showAmountBox(revised);await p}return}
   const prompt=speakingLanguage==='hi'?'क्या राशि सही है? हाँ या नहीं कहें।':speakingLanguage==='pa'?'ਕੀ ਰਕਮ ਸਹੀ ਹੈ? ਹਾਂ ਜਾਂ ਨਹੀਂ ਕਹੋ।':speakingLanguage==='ur'?'کیا رقم درست ہے؟ ہاں یا نہیں کہیں۔':'Is the amount correct? Please say yes or no.';await say(prompt,speakingLanguage,startRecognition);return;
 }
 if(currentIntent==='withdrawal'&&flowStage==='amount'){
   const amount=spokenNumberValue(spoken);if(amount){detectedAmount=amount;$('#requestedAmount').value=amount;flowStage='amount-confirmed';$('#withdrawalAmountBlock').hidden=false;$('#continueWithdrawal').hidden=true;show('requestScreen');{const p=say(amountConfirmation(amount,speakingLanguage),speakingLanguage,startRecognition);showAmountBox(amount);await p}return}
   const prompt=speakingLanguage==='hi'?'कितनी राशि निकालनी है? आप राशि बोल सकते हैं, जैसे दो हज़ार रुपये।':speakingLanguage==='pa'?'ਕਿੰਨੀ ਰਕਮ ਕਢਵਾਉਣੀ ਹੈ? ਰਕਮ ਬੋਲੋ, ਜਿਵੇਂ ਦੋ ਹਜ਼ਾਰ ਰੁਪਏ।':speakingLanguage==='ur'?'کتنی رقم نکلوانی ہے؟ رقم بولیں، مثلاً دو ہزار روپے۔':'How much would you like to withdraw? For example, two thousand rupees.';await say(prompt,speakingLanguage,startRecognition);return;
 }
 if(currentIntent==='deposit'&&flowStage==='amount-confirmed'){
   if(affirmative(spoken)){flowStage='passbook';show('uploadScreen');const prompt=speakingLanguage==='hi'?'ठीक है। अब अपनी पासबुक चुनिए।':speakingLanguage==='ur'?'ٹھیک ہے۔ اب اپنی پاس بک منتخب کریں۔':speakingLanguage==='pa'?'ਠੀਕ ਹੈ। ਹੁਣ ਆਪਣੀ ਪਾਸਬੁੱਕ ਚੁਣੋ।':'All right. Please choose your passbook.';await say(prompt,speakingLanguage);speechRestartAllowed=false;try{speechRecognition?.stop()}catch{}return}
   if(negative(spoken)){flowStage='amount';detectedAmount='';const prompt=speakingLanguage==='hi'?'ठीक है। सही जमा राशि फिर से बताइए।':'Please say the correct deposit amount again.';await say(prompt,speakingLanguage,startRecognition);return}
 }
 try{
   const obvious=localIntent(spoken);let data;
   if(obvious==='withdrawal'||obvious==='deposit')data={intent:obvious,amount:spokenNumberValue(spoken)};else if(obvious==='unsupported')data={intent:'unsupported'};
   else {const response=await fetch('/api/intent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:spoken,language})});data=await response.json();}
   currentIntent=data.intent;
   if(data.intent==='withdrawal'||data.intent==='deposit'){
     detectedAmount=data.amount||spokenNumberValue(spoken)||'';$('#requestedAmount').value=detectedAmount;$('#withdrawalAmountBlock').hidden=false;$('#continueWithdrawal').hidden=true;$('#continueUpload').hidden=true;flowStage=detectedAmount?'amount-confirmed':'amount';show('requestScreen');
     if(detectedAmount){const p=say(amountConfirmation(detectedAmount,speakingLanguage),speakingLanguage,startRecognition);showAmountBox(detectedAmount);await p}else{const prompt=data.intent==='withdrawal'?(speakingLanguage==='hi'?'कितनी राशि निकालनी है?':speakingLanguage==='pa'?'ਕਿੰਨੀ ਰਕਮ ਕਢਵਾਉਣੀ ਹੈ?':speakingLanguage==='ur'?'کتنی رقم نکلوانی ہے؟':'How much would you like to withdraw?'):(speakingLanguage==='hi'?'कितनी राशि जमा करनी है?':speakingLanguage==='pa'?'ਕਿੰਨੀ ਰਕਮ ਜਮ੍ਹਾਂ ਕਰਨੀ ਹੈ?':speakingLanguage==='ur'?'کتنی رقم جمع کروانی ہے؟':'How much would you like to deposit?');await say(prompt,speakingLanguage,startRecognition)}
     return;
   }
   let reply;
   if(data.intent==='unsupported')reply=speakingLanguage==='hi'?'यह सेवा अभी उपलब्ध नहीं है। इस कियोस्क पर केवल नकद निकासी और नकद जमा की सुविधा उपलब्ध है। कृपया उपलब्ध सेवाओं में से निकासी या जमा चुनें।':speakingLanguage==='ur'?'یہ سروس فی الحال دستیاب نہیں ہے۔ اس کیوسک پر صرف نقد رقم نکلوانے اور نقد رقم جمع کروانے کی سہولت موجود ہے۔ براہِ کرم دستیاب خدمات میں سے رقم نکلوانے یا جمع کروانے کا انتخاب کریں۔':speakingLanguage==='pa'?'ਇਹ ਸੇਵਾ ਇਸ ਵੇਲੇ ਉਪਲਬਧ ਨਹੀਂ ਹੈ। ਇਸ ਕਿਓਸਕ ਤੇ ਸਿਰਫ਼ ਨਕਦ ਕਢਵਾਉਣ ਅਤੇ ਨਕਦ ਜਮ੍ਹਾਂ ਕਰਨ ਦੀ ਸਹੂਲਤ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਉਪਲਬਧ ਸੇਵਾਵਾਂ ਵਿੱਚੋਂ ਨਿਕਾਸੀ ਜਾਂ ਜਮ੍ਹਾਂ ਚੁਣੋ।':'This service is currently unavailable. This kiosk supports only cash withdrawal and cash deposit. Please choose withdrawal or deposit from the available services.';
   else reply=speakingLanguage==='hi'?'आप क्या कहना चाहते हैं? कृपया एक बार फिर बताइए।':speakingLanguage==='pa'?'ਤੁਸੀਂ ਕੀ ਕਹਿਣਾ ਚਾਹੁੰਦੇ ਹੋ? ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਦੱਸੋ।':speakingLanguage==='ur'?'آپ کیا کہنا چاہتے ہیں؟ براہِ کرم دوبارہ بتائیں۔':'What would you like to say? Please tell me again.';
   flowStage='request';show('requestScreen');$('#requestResult').textContent=reply;$('#requestResult').hidden=false;await say(reply,speakingLanguage,startRecognition);
 }catch(error){flowStage='request';show('requestScreen');const reply=speakingLanguage==='hi'?'आप क्या कहना चाहते हैं? कृपया एक बार फिर बताइए।':speakingLanguage==='pa'?'ਤੁਸੀਂ ਕੀ ਕਹਿਣਾ ਚਾਹੁੰਦੇ ਹੋ? ਕਿਰਪਾ ਕਰਕੇ ਇੱਕ ਵਾਰ ਫਿਰ ਦੱਸੋ।':speakingLanguage==='ur'?'آپ کیا کہنا چاہتے ہیں؟ براہِ کرم ایک بار پھر بتائیں۔':'What would you like to say? Please tell me again.';showVoiceStatus('');await say(reply,speakingLanguage,startRecognition)}
}
let geminiSocket=null, micAudioContext=null, micProcessor=null, micSource=null, playbackContext=null, playbackCursor=0, geminiAudioSources=[], geminiReady=false, geminiMicPaused=false, micPermissionGranted=false, activeMicStream=null, playbackFinishTimer=null, geminiSpeaking=false, geminiUserAudioActive=false, geminiConnectInProgress=false, geminiSetupDone=false, geminiMuteUntil=0;
// Talking over Gemini ("barge-in"). While Gemini speaks, mic audio is held back (it would be echo). If the customer's voice is clearly louder
// than echo in BARGE_IN_FRAMES of the last 5 mic frames (~85 ms each), Gemini is cut off at once and the held-back audio is sent so no words are lost.
// Raise BARGE_IN_RMS if Gemini cuts itself off on loud speakers; lower it if a quiet customer cannot interrupt.
const BARGE_IN_RMS=0.045, BARGE_IN_FRAMES=3, BARGE_IN_PREROLL=7;
let geminiGenerating=false, geminiDropAudio=false, geminiBargedInAt=0, bargeInHits=[], bargeInPreRoll=[], geminiOutText='';
function pcmToBase64(floatSamples){const pcm=new Int16Array(floatSamples.length);for(let i=0;i<floatSamples.length;i++){const v=Math.max(-1,Math.min(1,floatSamples[i]));pcm[i]=v<0?v*32768:v*32767}const bytes=new Uint8Array(pcm.buffer);let binary='';for(let i=0;i<bytes.length;i++)binary+=String.fromCharCode(bytes[i]);return btoa(binary)}
function downsampleTo16k(input,sourceRate){if(sourceRate===16000)return input;const ratio=sourceRate/16000,outLength=Math.floor(input.length/ratio),out=new Float32Array(outLength);for(let i=0;i<outLength;i++){const start=Math.floor(i*ratio),end=Math.min(Math.floor((i+1)*ratio),input.length);let sum=0;for(let j=start;j<end;j++)sum+=input[j];out[i]=sum/Math.max(1,end-start)}return out}
function cancelGeminiPlayback(){clearTimeout(playbackFinishTimer);for(const source of geminiAudioSources){try{source.stop(0)}catch{}try{source.disconnect()}catch{}}geminiAudioSources=[];playbackCursor=playbackContext?.currentTime||0;geminiSpeaking=false;geminiUserAudioActive=false;}
function sendGeminiMic(samples){if(geminiSocket?.readyState!==WebSocket.OPEN)return;geminiSocket.send(JSON.stringify({realtimeInput:{audio:{mimeType:'audio/pcm;rate=16000',data:pcmToBase64(samples)}}}))}
function handleGeminiBargeIn(){geminiBargedInAt=Date.now();scheduleConfirmReask();geminiTurn.closed=true;try{window.speechSynthesis?.cancel()}catch{}cancelGeminiPlayback();if(geminiGenerating)geminiDropAudio=true;geminiMuteUntil=0;geminiSpeaking=false}
function handleGeminiInterrupted(){cancelGeminiPlayback();geminiGenerating=false;geminiDropAudio=false;geminiMuteUntil=0;geminiOutText='';geminiTurn.closed=true}
function cancelAllSpeechAndGeminiAudio(){speechCancelled=true;try{window.speechSynthesis?.cancel()}catch{}cancelGeminiPlayback();setListeningVisual(false);$('#listening').hidden=true;$('#requestListening').hidden=true;}
function queueGeminiAudio(base64){try{const raw=atob(base64),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);const pcm=new Int16Array(bytes.buffer),samples=new Float32Array(pcm.length);for(let i=0;i<pcm.length;i++)samples[i]=pcm[i]/32768;const buffer=playbackContext.createBuffer(1,samples.length,24000);buffer.copyToChannel(samples,0);const source=playbackContext.createBufferSource();source.buffer=buffer;source.connect(playbackContext.destination);geminiAudioSources.push(source);source.onended=()=>{geminiAudioSources=geminiAudioSources.filter(x=>x!==source);try{source.disconnect()}catch{}};const now=playbackContext.currentTime;playbackCursor=Math.max(playbackCursor,now+0.03);source.start(playbackCursor);playbackCursor+=buffer.duration}catch(error){console.warn('Could not play Gemini audio',error)}}
let voiceFallbackStarted=false;
function showGeminiDiagnostic(reason){
  // Developer-only diagnostics are opt-in via ?debug=1. Normal kiosk users never see provider names or raw errors.
  console.warn('[Sahaj diagnostic] Gemini Live unavailable:', reason||'unknown');
  if(new URLSearchParams(window.location.search).get('debug')!=='1')return;
  let el=document.getElementById('geminiDiagnostic');
  if(!el){el=document.createElement('p');el.id='geminiDiagnostic';el.className='developer-diagnostic';el.setAttribute('role','status');const hint=document.getElementById('voiceHint');(hint?.parentNode||document.body).insertBefore(el,hint?hint.nextSibling:null)}
  el.textContent='Developer diagnostics · Voice provider fallback active: '+(reason||'unknown');el.hidden=false;
  fetch('/api/gemini/check').then(r=>r.json()).then(d=>{if(d&&d.problem)el.textContent='Developer diagnostics · Voice provider fallback active · '+d.problem;else if(d&&d.ok)el.textContent='Developer diagnostics · Voice provider fallback active · key/model check passed; see server logs for connection details'}).catch(()=>{});
}
function showFatalError(){
  hideLoading();cancelAllSpeechAndGeminiAudio();try{speechRecognition?.stop()}catch{};
  document.body.classList.remove('is-listening','greeting-mode');
  document.querySelectorAll('.screen').forEach(el=>el.hidden=true);
  const screen=document.getElementById('fatalErrorScreen');if(screen){screen.hidden=false;const copy={en:['An error occurred','Please restart the kiosk and try again.','Restart kiosk'],hi:['कुछ गड़बड़ हो गई','कृपया कियोस्क को फिर से शुरू करके कोशिश करें।','फिर से शुरू करें'],ur:['ایک خرابی پیش آ گئی','براہِ کرم کیوسک دوبارہ شروع کریں اور پھر کوشش کریں۔','دوبارہ شروع کریں'],pa:['ਕੋਈ ਗੜਬੜ ਹੋ ਗਈ','ਕਿਰਪਾ ਕਰਕੇ ਕਿਓਸਕ ਮੁੜ ਚਾਲੂ ਕਰਕੇ ਕੋਸ਼ਿਸ਼ ਕਰੋ।','ਮੁੜ ਚਾਲੂ ਕਰੋ']};const c=copy[language]||copy.en;document.getElementById('fatalErrorTitle').textContent=c[0];document.getElementById('fatalErrorMessage').textContent=c[1];document.getElementById('restartKiosk').textContent=c[2]}
  document.body.setAttribute('data-fatal-error','true');
}

function fallbackToBrowserVoice(reason='Gemini voice is unavailable.') {
  if(voiceFallbackStarted || mode!=='voice') return;
  voiceFallbackStarted=true;geminiConnectInProgress=false;geminiSpeaking=false;geminiUserAudioActive=false;
  clearTimeout(greetingWatchdogTimer);hideLoading();cancelAllSpeechAndGeminiAudio();setListeningVisual(false);
  console.warn('[Gemini fallback]',reason);
  try{disconnectRealtimeVoice()}catch(error){console.warn('Gemini cleanup failed',error)}
  const documentStep = flowStage==='passbook' || activeScreen==='uploadScreen';
  // Do not restart the welcome greeting after a mid-flow failure. Preserve the user's
  // current step and use only the selected spoken language for browser speech.
  if(documentStep){
    showVoiceStatus(fixedStatus('choosePassbook'));
    $('#voiceManual').hidden=false;
    showGeminiDiagnostic(String(reason||''));
    return;
  }
  showVoiceStatus(fixedStatus('fallback'));
  showGeminiDiagnostic(String(reason||''));
  const prompt = flowStage==='hello'
    ? ({en:'Hello! How may I help you?',hi:'नमस्ते! मैं आपकी कैसे मदद कर सकती हूँ?',pa:'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦੀ ਹਾਂ?',ur:'السلام علیکم! میں آپ کی کیا مدد کر سکتی ہوں؟'})[speakingLanguage] || 'Hello! How may I help you?'
    : stagePrompt(speakingLanguage);
  if(prompt){
    // Mark the greeting as handled before speaking so the watchdog cannot repeat it.
    if(flowStage==='hello')flowStage='request';
    say(prompt,speakingLanguage,()=>{speechRestartAllowed=true;startRecognition()});
  }else{
    speechRestartAllowed=true;
    startRecognition();
  }
}
async function connectRealtimeVoice(stream){
  if(geminiConnectInProgress)return;geminiConnectInProgress=true;
  realtimeStream=stream;geminiSetupDone=false;geminiMuteUntil=0;geminiGenerating=false;geminiDropAudio=false;bargeInHits=[];bargeInPreRoll=[];geminiOutText='';geminiTurn=newGeminiTurn();lastAmountTurn=null;geminiReady=false;geminiMicPaused=false;geminiSpeaking=false;geminiUserAudioActive=false;playbackCursor=0;const geminiLoading=loadingCopy('gemini');showLoading(geminiLoading[0],geminiLoading[1]);setListeningVisual(false,{greeting:true});
  primeAudioContexts();await Promise.race([Promise.all([micAudioContext.resume(),playbackContext.resume()]),sleep(1500)]);
  const scheme=location.protocol==='https:'?'wss:':'ws:';geminiSocket=new WebSocket(`${scheme}//${location.host}/api/gemini/live`);
  geminiSocket.onopen=()=>{geminiSocket.send(JSON.stringify({setup:{model:'models/gemini-3.8-live',generationConfig:{responseModalities:['AUDIO'],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:'Kore'}}}},inputAudioTranscription:{},outputAudioTranscription:{},systemInstruction:{parts:[{text:`You are Sahaj, a patient multilingual Indian banking-form assistant for older adults. Greet the customer immediately before waiting for any customer speech. Greet bilingually in a calm, welcoming voice: “नमस्ते! मैं आपकी क्या मदद कर सकती हूँ? Hello! How may I help you?” Then ask what banking task the customer needs. Keep the greeting brief and natural. Greet exactly ONCE at the very start of the session and never repeat the greeting unless the customer asks you to; if you hear only silence, noise, an echo, or unclear sounds, stay completely silent and keep listening. Understand Hindi, English, Romanized Hindi, and mixed language. The greeting alone may be bilingual. For every later reply, speak in ONE language only, matching the customer's latest request. If the customer speaks Hindi or Romanized Hindi, speak Hindi and use Devanagari script only; do not use Urdu words or Urdu script. If the customer speaks English, reply in English only. Use Urdu script only when the customer clearly speaks Urdu, and Punjabi Gurmukhi only when the customer speaks Punjabi. Never mix Hindi and Urdu in one response. Hindi, English, Punjabi and Urdu are ALL fully supported: if the customer asks to change the screen language or the spoken language to any of them, agree, confirm briefly in the new language, and continue; never say a language is unavailable. GENDER: you do not know the customer's gender, so never use feminine forms for the customer. Address the customer with respectful plural/neutral forms: Hindi "आप ... सकते हैं", "आप बोल सकते हैं" (NEVER "सकती हैं"); Punjabi "ਤੁਸੀਂ ... ਸਕਦੇ ਹੋ"; Urdu "آپ ... سکتے ہیں". Speak in simple everyday language and keep replies concise. Help prepare fictional withdrawal or deposit paper drafts only. Never claim to access a real bank, authenticate identity, or move money. Never ask for PINs, OTPs, passwords, full Aadhaar numbers, or secrets. Ask the amount if a withdrawal/deposit amount is missing; never guess. If intent is ambiguous, ask a short clarification. The app separately classifies intent and moves the screens. KIOSK FLOW you must follow: (1) when the customer says withdrawal or deposit, the screen moves to the amount step: ask how much if the amount is missing. (2) When you hear an amount, repeat it clearly in words and ask the customer to say yes or no. (3) After yes, say the screen is moving to passbook selection and ask the customer to choose their passbook photo on the screen. (4) Do not ask for anything else. (5) Messages that start with APP EVENT come from the kiosk, not the customer: say their meaning briefly in the customer's language, then listen. Never claim a form was downloaded until an APP EVENT says so. Before the download, only ask the customer to sign inside the highlighted box; never mention a counter until a message says the form has been downloaded. BALANCE EXCEPTION: when the app has just asked whether the customer wants to see their current balance because the requested amount is higher than the balance, a yes means the app will show the balance on screen; in that moment never say the balance service is unavailable, just say you are showing it. IMPORTANT SERVICE LIMIT: this kiosk supports ONLY cash withdrawal and cash deposit form assistance. If the customer asks to open an account (including Hindi requests such as मुझे अकाउंट खोलना है or खाता खोलना है), check balance, transfer/send money, update Aadhaar/PAN/address/phone, or asks for any other service, do NOT say you did not understand. Politely explain in the customer's language that the service is currently unavailable and only cash withdrawal and cash deposit are supported, then ask them to choose withdrawal or deposit. For Hindi say: 'यह सेवा अभी उपलब्ध नहीं है। इस कियोस्क पर केवल नकद निकासी और नकद जमा की सुविधा उपलब्ध है। कृपया निकासी या जमा में से चुनें।' For English say: 'This service is currently unavailable. This kiosk supports only cash withdrawal and cash deposit. Please choose withdrawal or deposit.' Use equivalent formal wording in Punjabi and Urdu.`}]},realtimeInputConfig:{automaticActivityDetection:{disabled:false, silenceDurationMs:900, prefixPaddingMs:300}}}}))};
  geminiSocket.onmessage=event=>{let m;try{m=JSON.parse(event.data)}catch{return}if(m.proxyError){fallbackToBrowserVoice(m.proxyError);return}if(m.setupComplete&&!geminiSetupDone){geminiSetupDone=true;geminiReady=true;geminiConnectInProgress=false;hideLoading();setListeningVisual(false);$('#voiceStatus').textContent='';$('#listen').hidden=true;$('#stop').hidden=true;$('#listening').hidden=true;micSource=micAudioContext.createMediaStreamSource(stream);micProcessor=micAudioContext.createScriptProcessor(4096,1,1);micProcessor.onaudioprocess=e=>{if(!geminiReady||geminiMicPaused||geminiSocket?.readyState!==WebSocket.OPEN)return;const mono=e.inputBuffer.getChannelData(0);let energy=0;for(let i=0;i<mono.length;i++)energy+=mono[i]*mono[i];const rms=Math.sqrt(energy/Math.max(1,mono.length));const resampled=downsampleTo16k(mono,micAudioContext.sampleRate);
      if(geminiSpeaking||Date.now()<geminiMuteUntil||window.speechSynthesis?.speaking){
        /* Gemini is talking: do not stream the mic (echo), but listen for the customer talking over it. */
        if(geminiSpeaking&&Date.now()-lastModelAudioAt>3000&&!(playbackContext&&playbackContext.currentTime<playbackCursor-0.05))geminiSpeaking=false;bargeInHits=[];bargeInPreRoll=[];return;bargeInPreRoll.push(new Float32Array(resampled));if(bargeInPreRoll.length>BARGE_IN_PREROLL)bargeInPreRoll.shift();
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
    const parts=geminiDropAudio?[]:(m.serverContent?.modelTurn?.parts||[]);if(parts.length){geminiGenerating=true;geminiTurn.modelSpoke=true;lastModelAudioAt=Date.now();clearTimeout(playbackFinishTimer);geminiSpeaking=true;geminiUserAudioActive=false;setListeningVisual(false);$('#listening').hidden=true;$('#requestListening').hidden=true;$('#voiceStatus').textContent='';}for(const part of parts){if(part.inlineData?.mimeType?.startsWith('audio/pcm'))queueGeminiAudio(part.inlineData.data);if(part.text){setStatusFromModelText(part.text)}}
    if(m.serverContent?.turnComplete){geminiGenerating=false;geminiDropAudio=false;const modelSaid=geminiOutText,amountTurn=lastAmountTurn;geminiOutText='';geminiTurn.closed=true;maybeAdvanceFromModel(modelSaid);if(amountTurn&&spokenNumberValue(modelSaid)){amountTurn.modelSaid=modelSaid;reconcileAmountWithModelSpeech(amountTurn,modelSaid);setTimeout(()=>reconcileAmountWithModelSpeech(amountTurn,modelSaid),1800)}$('#voiceStatus').textContent='';clearTimeout(playbackFinishTimer);const waitMs=playbackContext?Math.max(0,(playbackCursor-playbackContext.currentTime)*1000)+180:180;playbackFinishTimer=setTimeout(()=>{geminiSpeaking=false;geminiMuteUntil=(Date.now()-geminiBargedInAt>4000)?Date.now()+500:0;geminiUserAudioActive=false;setListeningVisual(false);$('#listening').hidden=true;$('#requestListening').hidden=true;showVoiceStatus('');armSilenceReask()},waitMs)}
    if(m.error)fallbackToBrowserVoice(m.error.message||'Gemini voice connection issue; switching to browser voice.');
  };
  geminiSocket.onerror=()=>{fallbackToBrowserVoice('Could not connect to Gemini Live; switching to browser speech recognition and synthesis.')};
  geminiSocket.onclose=()=>{geminiConnectInProgress=false;const wasReady=geminiReady;geminiReady=false;if(!voiceFallbackStarted&&mode==='voice')fallbackToBrowserVoice(wasReady?'Gemini Live disconnected; switching to browser voice.':'Gemini Live closed before setup completed; switching to browser voice.')};
  setTimeout(()=>{if(!geminiReady&&mode==='voice'&&!voiceFallbackStarted)fallbackToBrowserVoice('Gemini Live connection timed out; switching to browser voice.')},12000);
}
function geminiActive(){return !!(geminiReady&&geminiSocket&&geminiSocket.readyState===WebSocket.OPEN&&!voiceFallbackStarted)}
function geminiNote(text){
  if(!geminiActive())return false;
  geminiSocket.send(JSON.stringify({clientContent:{turns:[{role:'user',parts:[{text:'APP EVENT (not spoken by the customer): '+text+' Say this briefly and naturally in the customer\'s current spoken language, then stop and listen.'}]}],turnComplete:true}}));
  return true;
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
// One spoken sentence ("turn") reaches us as many small transcript pieces, sometimes seconds apart and after Gemini has already started
// answering. All pieces of a turn are kept together and the WHOLE turn is re-read each time a piece arrives, so "1" + "0" + ",000 rupees"
// always ends up as 10,000 instead of being acted on piece by piece.
function newGeminiTurn(){return{text:'',kind:'',lastAt:0,lastText:'',closed:false,modelSpoke:false,amount:'',modelSaid:''}}
let geminiTurn=newGeminiTurn(),geminiTurnTimer=null,geminiDriveChain=Promise.resolve(),lastAmountTurn=null;
const GEMINI_FINAL_KINDS=['language','advance','reset','balance','other'];
let amountQuestionDoneAt=0,lastUserChunkAt=0;
function queueGeminiUserText(chunk){
  const now=Date.now(),gap=now-geminiTurn.lastAt;lastUserChunkAt=now;silenceReaskCount=0;clearTimeout(silenceReaskTimer);
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
function isBareScaleWord(text){const rest=normalizeSpokenDigits((text||'').toLowerCase()).replace(/\u095b/g,'ज').replace(/\u093c/g,'').replace(/thousand|hazaar|hazar|हजार|ਹਜ਼ਾਰ|ہزار|lakhs?|lac|लाख|ਲੱਖ|لاکھ|hundred|सौ|ਸੌ|سو|rupees?|rs|रुपये|रुपए|रुपया|ਰੁਪਏ|روپے/g,'').replace(/[\s.,।!?]/g,'');return rest===''&&/\S/.test(text||'')}
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
      const prompt=language==='hi'?'आपके खाते में इतनी राशि नहीं है। क्या आप अपना मौजूदा बैलेंस देखना चाहते हैं? हाँ या नहीं कहें।':language==='pa'?'ਤੁਹਾਡੇ ਖਾਤੇ ਵਿੱਚ ਇੰਨੀ ਰਕਮ ਨਹੀਂ ਹੈ। ਕੀ ਤੁਸੀਂ ਮੌਜੂਦਾ ਬਕਾਇਆ ਵੇਖਣਾ ਚਾਹੁੰਦੇ ਹੋ? ਹਾਂ ਜਾਂ ਨਹੀਂ ਕਹੋ।':language==='ur'?'آپ کے اکاؤنٹ میں اتنی رقم نہیں ہے۔ کیا آپ موجودہ بیلنس دیکھنا چاہتے ہیں؟ ہاں یا نہیں کہیں۔':'Your account does not have enough balance for that withdrawal. Would you like to see your current balance? Please say yes or no.';
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
    if(flowStage==='passbook'||flowStage==='request')return'none';
  }
  return await syncGeminiIntent(spoken,li);
}
async function syncGeminiIntent(spoken,knownIntent=''){
  try{
    if(!['hi','ur','pa','en'].includes(language))language='hi';localize();
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
      const msg=language==='hi'?'यह सेवा अभी उपलब्ध नहीं है। इस कियोस्क पर केवल नकद निकासी और नकद जमा की सुविधा उपलब्ध है। कृपया निकासी या जमा में से चुनें।':language==='ur'?'یہ سروس فی الحال دستیاب نہیں ہے۔ اس کیوسک پر صرف نقد رقم نکلوانے اور نقد رقم جمع کروانے کی سہولت ہے۔ براہِ کرم رقم نکلوانے یا جمع کروانے میں سے انتخاب کریں۔':language==='pa'?'ਇਹ ਸੇਵਾ ਇਸ ਵੇਲੇ ਉਪਲਬਧ ਨਹੀਂ ਹੈ। ਇਸ ਕਿਓਸਕ ਤੇ ਸਿਰਫ਼ ਨਕਦ ਕਢਵਾਉਣ ਅਤੇ ਨਕਦ ਜਮ੍ਹਾਂ ਕਰਨ ਦੀ ਸਹੂਲਤ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਨਿਕਾਸੀ ਜਾਂ ਜਮ੍ਹਾਂ ਵਿੱਚੋਂ ਚੁਣੋ।':'This service is currently unavailable. This kiosk supports only cash withdrawal and cash deposit. Please choose withdrawal or deposit.';
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
  }catch(error){$('#voiceStatus').textContent='I could not process that request. Please say it again. '+error.message}
  finally{realtimeBusy=false;}
}
function disconnectRealtimeVoice(){speechRestartAllowed=false;try{speechRecognition?.stop()}catch{}geminiReady=false;try{geminiSocket?.close()}catch{}try{micProcessor?.disconnect()}catch{}try{micSource?.disconnect()}catch{}try{micAudioContext?.close()}catch{}try{playbackContext?.close()}catch{}realtimeStream?.getTracks().forEach(track=>track.stop());geminiSocket=null;micProcessor=null;micSource=null;micAudioContext=null;playbackContext=null;realtimeStream=null;}
let speechRecognition=null, speechListening=false, speechRestartAllowed=false, recognitionRetryIndex=0, speechCancelled=false;
let deepgramAvailable = null;
let deepgramRecorder = null;
let deepgramStream = null;
let deepgramChunks = [];
let deepgramBusy = false;
let deepgramStopTimer = null;

async function startDeepgramRecognition(){
  if(deepgramBusy || mode!=='voice') return;
  if(!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder){
    deepgramAvailable=false;
    startBrowserRecognition();
    return;
  }
  deepgramBusy=true;
  try{
    if(deepgramAvailable===null){
      const config=await fetch('/api/speech/config',{cache:'no-store'}).then(r=>r.ok?r.json():({deepgram_available:false}));
      deepgramAvailable=!!config.deepgram_available;
    }
    if(!deepgramAvailable){deepgramBusy=false;startBrowserRecognition();return}
    deepgramStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
    const mimeType=['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus'].find(t=>MediaRecorder.isTypeSupported?.(t))||'';
    deepgramRecorder=new MediaRecorder(deepgramStream,mimeType?{mimeType}:undefined);
    deepgramChunks=[];
    deepgramRecorder.ondataavailable=e=>{if(e.data?.size)deepgramChunks.push(e.data)};
    deepgramRecorder.onerror=e=>{
      console.warn('[Deepgram STT] recorder failed',e.error||e);
      cleanupDeepgramRecorder();deepgramBusy=false;deepgramAvailable=false;startBrowserRecognition();
    };
    deepgramRecorder.onstop=async()=>{
      clearTimeout(deepgramStopTimer);deepgramStopTimer=null;
      const recorder=deepgramRecorder;
      const blob=new Blob(deepgramChunks,{type:recorder?.mimeType||'audio/webm'});
      cleanupDeepgramRecorder();
      if(!blob.size){deepgramBusy=false;deepgramAvailable=false;startBrowserRecognition();return}
      try{
        showVoiceStatus(fixedStatus('listening'));
        const form=new FormData();form.append('file',blob,'utterance.webm');
        const response=await fetch('/api/speech/transcribe',{method:'POST',body:form});
        if(!response.ok)throw new Error('transcription unavailable ('+response.status+')');
        const result=await response.json();
        const transcript=(result.transcript||'').trim();
        if(!transcript)throw new Error('empty transcript');
        console.info('[Speech fallback] Deepgram transcript received.');
        deepgramBusy=false;
        handleVoice(transcript,detectLanguage(transcript));
      }catch(error){
        console.warn('[Deepgram STT fallback]',error);
        deepgramBusy=false;deepgramAvailable=false;
        startBrowserRecognition();
      }
    };
    deepgramRecorder.start(250);
    speechListening=true;listeningUI(true);setListeningVisual(true);showVoiceStatus(fixedStatus('listening'));
    // One short utterance per request; the workflow restarts recognition after responding.
    deepgramStopTimer=setTimeout(()=>{try{if(deepgramRecorder?.state==='recording')deepgramRecorder.stop()}catch(e){console.warn('[Deepgram STT] stop failed',e)}},6500);
  }catch(error){
    console.warn('[Deepgram STT] microphone/API setup failed',error);
    cleanupDeepgramRecorder();deepgramBusy=false;deepgramAvailable=false;
    startBrowserRecognition();
  }
}
function cleanupDeepgramRecorder(){
  clearTimeout(deepgramStopTimer);deepgramStopTimer=null;
  try{deepgramStream?.getTracks().forEach(track=>track.stop())}catch{}
  deepgramStream=null;deepgramRecorder=null;deepgramChunks=[];speechListening=false;setListeningVisual(false);
}
function startRecognition(){
  if(geminiActive())return;
  if(deepgramAvailable!==false){startDeepgramRecognition();return}
  startBrowserRecognition();
}
function startBrowserRecognition(){

  if(geminiActive())return;
  const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SpeechRecognition){console.error('[Sahaj fatal] Browser speech recognition is unsupported; Gemini fallback is already unavailable.');showFatalError();return}
  try{
    if(speechRecognition){try{speechRecognition.stop()}catch{}}
    speechRecognition=new SpeechRecognition();
    speechRecognition.lang=recognitionLocale(speakingLanguage||'hi');
    speechRecognition.continuous=false;
    speechRecognition.interimResults=true;
    speechRecognition.maxAlternatives=3;
    speechRestartAllowed=true;
    speechRecognition.onstart=()=>{speechListening=true;listeningUI(true);setListeningVisual(true);showVoiceStatus(fixedStatus('listening'))};
    speechRecognition.onresult=event=>{const result=event.results?.[event.results.length-1];if(!result||result.isFinal===false)return;const alternatives=Array.from(result).map(x=>(x.transcript||'').trim()).filter(Boolean);const transcript=alternatives.sort((a,b)=>{const score=t=>(/^(yes|yeah|yep|haan|han|हाँ|हां|जी|no|nope|nahi|नहीं|नही|ना|ਹਾਂ|ਨਹੀਂ|ہاں|نہیں)$/i.test(t)?8:0)+(localIntent(t)?6:0)+(spokenNumberValue(t)?4:0)+(/[ऀ-ॿ]/.test(t)?2:0)+(t.length>2?1:0);return score(b)-score(a)})[0]||'';if(transcript){speechRestartAllowed=false;handleVoice(transcript,detectLanguage(transcript));}};
    speechRecognition.onerror=event=>{speechListening=false;setListeningVisual(false);console.warn('[Sahaj browser speech recognition]',event.error);$('#listening').hidden=true;if(event.error==='no-speech'){showVoiceStatus(language==='hi'?'आवाज़ साफ़ नहीं सुनाई दी। कृपया सामान्य आवाज़ में फिर से बोलें।':language==='pa'?'ਆਵਾਜ਼ ਸਾਫ਼ ਨਹੀਂ ਸੁਣੀ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਬੋਲੋ।':language==='ur'?'آواز صاف سنائی نہیں دی۔ براہِ کرم دوبارہ بولیں۔':'I could not hear that clearly. Please speak normally and try again.');return}speechRestartAllowed=false;if(event.error==='not-allowed'||event.error==='service-not-allowed'||event.error==='network'||event.error==='audio-capture'){showFatalError()}else{showFatalError()}};
    speechRecognition.onend=()=>{speechListening=false;setListeningVisual(false);if(speechRestartAllowed&&mode==='voice'&&!document.hidden){setTimeout(()=>{if(speechRestartAllowed&&mode==='voice'){try{speechRecognition.start()}catch(e){console.debug('Recognition restart:',e.message);setListeningVisual(false)} }},250)}else{$('#listening').hidden=true}};
    speechRecognition.start();
  }catch(error){console.error('[Sahaj browser recognition start failed]',error);showFatalError()}
}
function getVoicesWhenReady(){
  return new Promise(resolve=>{
    if(!window.speechSynthesis){resolve([]);return}
    const existing=window.speechSynthesis.getVoices();
    if(existing.length){resolve(existing);return}
    let finished=false;
    const finish=()=>{if(finished)return;finished=true;window.speechSynthesis.removeEventListener?.('voiceschanged',finish);resolve(window.speechSynthesis.getVoices())};
    window.speechSynthesis.addEventListener?.('voiceschanged',finish,{once:true});
    setTimeout(finish,1200);
  });
}
function chooseVoice(voices, languageTags){
  for(const tag of languageTags){const found=voices.find(v=>(v.lang||'').toLowerCase()===tag.toLowerCase());if(found)return found}
  for(const tag of languageTags){const prefix=tag.split('-')[0].toLowerCase();const found=voices.find(v=>(v.lang||'').toLowerCase().startsWith(prefix+'-')|| (v.lang||'').toLowerCase()===prefix);if(found)return found}
  return null;
}
function speakUtterance(text,lang,voice){
  return new Promise(resolve=>{
    const u=new SpeechSynthesisUtterance(text);u.lang=lang;if(voice)u.voice=voice;
    let done=false;const finish=()=>{if(done)return;done=true;resolve()};u.onend=finish;u.onerror=finish;
    window.speechSynthesis.speak(u);
  });
}
async function speakInitialGreeting(){
  showVoiceStatus('');
  setListeningVisual(false,{greeting:true});
  if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){showVoiceStatus('इस ब्राउज़र में आवाज़ उपलब्ध नहीं है। अब बोलें।');startRecognition();return}
  window.speechSynthesis.cancel();
  const voices=await getVoicesWhenReady();
  const hindiVoice=chooseVoice(voices,['hi-IN','hi']);
  const englishVoice=chooseVoice(voices,['en-IN','en-GB','en-US','en']);
  if(!hindiVoice){showVoiceStatus('हिंदी आवाज़ इस कंप्यूटर पर उपलब्ध नहीं है। Windows Settings में Hindi speech voice जोड़ें; अभी अंग्रेज़ी अभिवादन होगा।');}
  if(hindiVoice){await speakUtterance('नमस्ते! मैं आपकी कैसे मदद कर सकती हूँ?','hi-IN',hindiVoice)}
  await speakUtterance('Hello! How may I help you?','en-IN',englishVoice);
  flowStage='request';
  setListeningVisual(false);startRecognition();
}
async function askMicrophone(){
 primeAudioContexts();
 if(!navigator.mediaDevices?.getUserMedia){$('#permissionStatus').textContent='Microphone access is unavailable here. Use browser site settings, or continue without voice.';$('#fallbackActions').hidden=false;return}
 try{
  const stream=activeMicStream&&activeMicStream.getAudioTracks().some(t=>t.readyState==='live')?activeMicStream:await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});activeMicStream=stream;micPermissionGranted=true;geminiMicPaused=false;
  mode='voice';flowStage='hello';voiceFallbackStarted=false;language=language||'hi';speakingLanguage=['hi','en','pa','ur'].includes(language)?language:'hi';speechLanguageLocked=false;displayLanguageLocked=false;localize();show('voiceScreen');$('#voiceManual').hidden=false;
  $('#voiceGreeting').innerHTML='<span class="greeting-big">नमस्ते</span><span class="greeting-big greeting-english">Hello</span>';
  $('#voiceHint').innerHTML='मैं आपकी क्या मदद कर सकती हूँ?<br>How may I help you?';
  const geminiLoading=loadingCopy('gemini');showLoading(geminiLoading[0],geminiLoading[1]);setListeningVisual(false);$('#voiceStatus').textContent='';$('#listen').hidden=true;$('#stop').hidden=true;$('#listening').hidden=true;
  try{await connectRealtimeVoice(stream)}catch(error){fallbackToBrowserVoice('Gemini could not start: '+error.message)}
 }catch(error){console.warn('[Sahaj microphone permission]',error);$('#permissionStatus').textContent=language==='hi'?'माइक्रोफ़ोन उपलब्ध नहीं है। अनुमति जाँचें और फिर कोशिश करें।':language==='ur'?'مائیکروفون دستیاب نہیں۔ اجازت چیک کریں اور دوبارہ کوشش کریں۔':language==='pa'?'ਮਾਈਕ੍ਰੋਫ਼ੋਨ ਉਪਲਬਧ ਨਹੀਂ। ਇਜਾਜ਼ਤ ਜਾਂਚੋ ਅਤੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।':'Microphone access is unavailable. Check permission and try again.';$('#fallbackActions').hidden=false;show('permissionScreen')}
}
function showManualUpload(){mode='manual';localize();show('uploadScreen')}
function chooseManualLanguage(returnScreen='uploadScreen'){mode='manual';languageReturnScreen=returnScreen;$('#fallbackActions').hidden=true;$('#permissionStatus').textContent='';show('languageScreen');document.querySelectorAll('[data-lang]').forEach(x=>x.classList.toggle('selected',x.dataset.lang===language));try{localize()}catch(error){console.error('Manual language screen localization failed:',error);$('#languageTitle').textContent='Choose your language';$('#languageDescription').textContent='Choose a language for manual help.';$('#languageNext').textContent='Continue'}}
function pauseVoiceInput(){geminiMicPaused=true;speechRestartAllowed=false;cancelAllSpeechAndGeminiAudio();try{speechRecognition?.stop()}catch{}setListeningVisual(false);$('#listening').hidden=true;$('#requestListening').hidden=true;$('#stop').hidden=true;$('#requestStop').hidden=true;$('#listen').hidden=false;$('#requestVoice').hidden=mode!=='voice';showVoiceStatus(language==='hi'?'सुनना रोक दिया गया है। दोबारा बोलने के लिए बोलें बटन दबाएँ।':language==='ur'?'سننا روک دیا گیا ہے۔ دوبارہ بولنے کے لیے بولیں دبائیں۔':language==='pa'?'ਸੁਣਨਾ ਰੋਕ ਦਿੱਤਾ ਹੈ। ਮੁੜ ਬੋਲਣ ਲਈ ਬੋਲੋ ਦਬਾਓ।':'Listening paused. Press Speak to resume.')}function resumeVoiceInput(){if(mode!=='voice')return;geminiMicPaused=false;if(voiceFallbackStarted){speechRestartAllowed=true;startRecognition();return}if(geminiReady&&geminiSocket?.readyState===WebSocket.OPEN){$('#listen').hidden=true;$('#requestVoice').hidden=true;$('#stop').hidden=false;$('#requestStop').hidden=false;showVoiceStatus('');setListeningVisual(false);$('#listening').hidden=true;$('#requestListening').hidden=true;return}if(activeMicStream&&activeMicStream.getAudioTracks().some(t=>t.readyState==='live')){askMicrophone();return}askMicrophone()}
$('#voiceContinue').onclick=askMicrophone;$('#manualContinue').onclick=chooseManualLanguage;
$('#stop').onclick=()=>pauseVoiceInput();
$('#languageNext').onclick=()=>{mode='manual';const target=languageReturnScreen||'uploadScreen';show(target);try{localize()}catch(error){console.error('Manual screen localization failed:',error)}};document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{language=b.dataset.lang;speakingLanguage=['hi','en','pa','ur'].includes(language)?language:'hi';document.querySelectorAll('[data-lang]').forEach(x=>x.classList.toggle('selected',x===b));localize()});$('#switchLanguage').onclick=()=>chooseManualLanguage(activeScreen);
$('#listen').onclick=()=>resumeVoiceInput();$('#requestStop').onclick=()=>pauseVoiceInput();
document.addEventListener('visibilitychange',()=>{if(document.hidden)recognition?.stop()});
// Recognition callbacks are installed per one-shot recording so the listening state is always explicit.
$('#listen').onclick=()=>resumeVoiceInput();
$('#voiceManual').onclick=()=>{disconnectRealtimeVoice();chooseManualLanguage()};$('#requestManual').onclick=()=>{disconnectRealtimeVoice();chooseManualLanguage()};
function profileSummary(p){const l={en:['Customer','Account','Phone','Type','Branch','DOB','Address','Occupation','Balance','Demo ref'],hi:['ग्राहक','खाता','फ़ोन','प्रकार','शाखा','जन्म तिथि','पता','व्यवसाय','शेष राशि','डेमो संदर्भ'],doi:['ग्राहक','खाता','फोन','किस्म','शाखा','जन्म तारीख','पता','रोजगार','बाकी रकम','डेमो संदर्भ'],ur:['صارف','اکاؤنٹ','فون','قسم','برانچ','پیدائش','پتہٕ','پیشہ','بیلنس','ڈیمو حوالہ'],pa:['ਗਾਹਕ','ਖਾਤਾ','ਫ਼ੋਨ','ਕਿਸਮ','ਸ਼ਾਖਾ','ਜਨਮ ਮਿਤੀ','ਪਤਾ','ਕਿੱਤਾ','ਬਕਾਇਆ','ਡੈਮੋ ਹਵਾਲਾ']}[language];const values=[p.name,p.account_id,p.phone,p.account_type,p.branch,p.date_of_birth,p.address,p.occupation,`₹${p.balance}`,p.customer_ref];return l.map((label,i)=>`${label}: ${values[i]}`).join(' · ')}
let lastLanguageChange=null;
function parseLanguagePreferenceCommand(text){
 // Understands language-change requests in English, Hindi (Devanagari + Roman), Punjabi (Gurmukhi + Devanagari) and Urdu (Arabic script + Devanagari).
 const norm=s=>(s||'').normalize('NFC').toLowerCase().replace(/[\u200b-\u200d\ufeff]/g,'').replace(/\s+/g,' ').trim();
 const t=norm(text);if(!t)return false;
 const NAMES={
  en:['english','inglish','ingleesh','angrezi','angreji','angrej','अंग्रेज़ी','अंग्रेजी','अँग्रेजी','अंग्रेज़','अंग्रेज','इंग्लिश','इंग्लीश','इंगलिश','इंग्लिस','ਅੰਗਰੇਜ਼ੀ','ਅੰਗਰੇਜ਼','ਅੰਗ੍ਰੇਜ਼ੀ','ਇੰਗਲਿਸ਼','ਇੰਗਲਿਸ','انگریزی','انگلش','انگلیش'],
  hi:['hindi','हिंदी','हिन्दी','हिंदि','ਹਿੰਦੀ','ہندی','ہندی'],
  pa:['punjabi','panjabi','पंजाबी','पंजाबि','ਪੰਜਾਬੀ','پنجابی'],
  ur:['urdu','उर्दू','उर्दु','उरदू','ਉਰਦੂ','ਉਰਦੁ','اردو']
 };
 const DISPLAY=['screen','display','text','written','writing','script','स्क्रीन','सक्रीन','पर्दा','पर्दे','लिखा','लिखित','लिखावट','लिखाई','टेक्स्ट','ਸਕ੍ਰੀਨ','ਸਕਰੀਨ','ਲਿਖਤ','ਲਿਖਿਆ','سکرین','اسکرین','سکرین','متن','تحریر','لکھا','show','दिखाओ','दिखाइए','दिखाइये','दिखाएं','दिखाएँ','दिखा','दिखे','दिखाना','ਦਿਖਾਓ','ਦਿਖਾਉ','ਦਿਖਾ','دکھاؤ','دکھاو','دکھائیں','دکھا'];
 const SPEECH=['speak','speaking','talk','voice','say','spoken','bol','bolo','bolna','baat','awaaz','awaz','बोल','बात','आवाज़','आवाज','आवाज','ਬੋਲ','ਗੱਲ','ਗੱਲਬਾਤ','ਆਵਾਜ਼','ਅਵਾਜ਼','بول','بات','گفتگو','آواز'];
 const CHANGE=['language','bhasha','bhaasha','zabaan','zaban','zubaan','switch','change','set ','convert','make it','make the','back to','go to','use ','भाषा','भाशा','ज़बान','जबान','बदल','बदलो','बदलें','बदलिए','करनी','करना','करो','कीजिए','कीजिये','कर दो','कर दीजिए','चाहिए','चाहता','चाहती','वापस','में','ਭਾਸ਼ਾ','ਬੋਲੀ','ਬਦਲ','ਕਰੋ','ਕਰਨੀ','ਕਰਨਾ','ਚਾਹੀਦੀ','ਚਾਹੀਦਾ','ਵਾਪਸ','ਵਿੱਚ','زبان','تبدیل','کریں','کرنی','کرنا','چاہیے','چاہئے','واپس','میں'];
 const has=(s,list)=>list.some(w=>s.includes(norm(w)));
 const lastLang=s=>{let best=null,pos=-1;for(const [code,list] of Object.entries(NAMES)){for(const n of list){const i=s.lastIndexOf(norm(n));if(i>=0&&(i>pos||(i===pos&&n.length>(best?.len||0)))){pos=i;best={code,len:n.length}}}}return best?best.code:null};
 const clauses=t.split(/\s*(?:[,;।|.!?]|(?:^|\s)(?:and|but|while|और|लेकिन|जबकि|तथा|ਅਤੇ|ਪਰ|ਜਦਕਿ|اور|لیکن)(?=\s|$))\s*/).filter(Boolean);
 let display=null,speech=null;
 for(const c of clauses){
  const code=lastLang(c);if(!code)continue;
  const d=has(c,DISPLAY),s=has(c,SPEECH);
  // A bare language name ("Punjabi") or a name with a change/“in <language>” cue counts as a request.
  const bare=c.split(' ').length<=2;
  if(!(d||s||bare||has(c,CHANGE)))continue;
  if(d&&!s)display=code;else if(s&&!d)speech=code;else{display=code;speech=code}
 }
 if(!display&&!speech)return false;
 if(display){language=display;displayLanguageLocked=true}
 if(speech){speakingLanguage=speech;speechLanguageLocked=true}
 languageCommandMode=(display&&speech)?(display===speech?'unified':'separate'):(display?'display':'speech');
 lastLanguageChange={display,speech};
 try{localize()}catch(e){console.error('Localization after language change failed:',e)}
 return true;
}
const LANGUAGE_NATIVE_NAMES={
 hi:{hi:'हिंदी',en:'अंग्रेज़ी',pa:'पंजाबी',ur:'उर्दू'},
 en:{hi:'Hindi',en:'English',pa:'Punjabi',ur:'Urdu'},
 pa:{hi:'ਹਿੰਦੀ',en:'ਅੰਗਰੇਜ਼ੀ',pa:'ਪੰਜਾਬੀ',ur:'ਉਰਦੂ'},
 ur:{hi:'ہندی',en:'انگریزی',pa:'پنجابی',ur:'اردو'}
};
function languageChangeConfirmation(){
 const ui=['hi','en','pa','ur'].includes(language)?language:'hi';
 const n=LANGUAGE_NATIVE_NAMES[ui];
 const d=n[language]||n.en,v=n[speakingLanguage]||n.en;
 const same=language===speakingLanguage;
 const T={
  hi:{same:a=>`ठीक है, हम ${a} में बात करेंगे।`,diff:(a,b)=>`ठीक है, स्क्रीन ${a} में और बोलना ${b} में रहेगा।`},
  en:{same:a=>`Okay, we'll talk in ${a}.`,diff:(a,b)=>`Okay, the screen will be in ${a} and I'll speak in ${b}.`},
  pa:{same:a=>`ਠੀਕ ਹੈ, ਅਸੀਂ ${a} ਵਿੱਚ ਗੱਲ ਕਰਾਂਗੇ।`,diff:(a,b)=>`ਠੀਕ ਹੈ, ਸਕ੍ਰੀਨ ${a} ਵਿੱਚ ਅਤੇ ਬੋਲਣਾ ${b} ਵਿੱਚ ਰਹੇਗਾ।`},
  ur:{same:a=>`ٹھیک ہے، ہم ${a} میں بات کریں گے۔`,diff:(a,b)=>`ٹھیک ہے، اسکرین ${a} میں اور بولنا ${b} میں رہے گا۔`}
 }[ui];
 return same?T.same(d):T.diff(d,v);
}
function sendGeminiLanguageInstruction(){
 if(!geminiReady||geminiSocket?.readyState!==WebSocket.OPEN)return;
 const names={en:'English',hi:'Hindi',pa:'Punjabi',ur:'Urdu',doi:'Dogri'};
 const displayName=names[language]||'English';const speechName=names[speakingLanguage]||'English';
 const neutral=' Never assume the customer\'s gender: address the customer with gender-neutral/respectful plural forms (Hindi: "आप ... सकते हैं", never "सकती हैं"; Punjabi: "ਤੁਸੀਂ ... ਸਕਦੇ ਹੋ"; Urdu: "آپ ... سکتے ہیں").';
 let instruction;
 if(languageCommandMode==='separate')instruction=`The user explicitly requested separate languages. Keep all visible UI/form text in ${displayName}; speak in ${speechName}. Briefly confirm only this specific arrangement in ${speechName}. Do not change either preference unless explicitly asked. Continue the current conversation and form without resetting.`;
 else if(languageCommandMode==='display')instruction=`The user changed ONLY the visible screen language to ${displayName}. The app has already changed the screen. Keep speaking in ${speechName}. Briefly confirm in ${speechName} that the screen is now in ${displayName}. Never say the language is unsupported: Hindi, English, Punjabi and Urdu are all supported. Continue the current conversation and form without resetting.`;
 else if(languageCommandMode==='speech')instruction=`The user asked you to speak in ${speechName}. From now on speak ONLY in ${speechName} (Hindi in Devanagari, Punjabi in Gurmukhi, Urdu in Urdu script). Briefly confirm in ${speechName}. Never say the language is unsupported. Continue the current conversation and form without resetting.`;
 else instruction=`The user asked to switch to ${displayName}. Set BOTH the visible UI/form language and spoken response language to ${displayName}. Briefly confirm naturally in ${displayName} (for Hindi: “ठीक है, हम हिंदी में बात करेंगे।” For English: “Okay, we’ll speak in English.” For Punjabi and Urdu, confirm naturally in that language). Never say the language is unsupported: Hindi, English, Punjabi and Urdu are all supported. Do NOT mention separate screen and speech languages. Continue the current conversation and form without resetting.`;
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
    await sleep(9000);
    const dl=$('#downloadSampleForm');if(activeScreen==='otherFormScreen'&&dl&&!dl.disabled)dl.click();
  }catch(e){console.warn('Deposit auto flow failed',e)}
}
async function processPassbookImage(){
 if(!imageFile)return;
 const passbookLoading=loadingCopy('passbook');showLoading(passbookLoading[0],passbookLoading[1]);$('#extract').disabled=true;$('#ocrStatus').textContent=manualMessage('reading');
 const fd=new FormData();fd.append('file',imageFile);
 try{
  const response=await fetch('/api/ocr/passbook',{method:'POST',body:fd});const d=await response.json();
  if(!response.ok)throw new Error(d.detail||'Could not read the passbook.');
  const candidate=String(d.fields?.account_id?.value||'').trim();
  if(!/^\d{8,18}$/.test(candidate))throw new Error(d.notice||'Could not read the account number clearly. Please choose another passbook photo.');
  $('#ocrStatus').textContent='Reading passbook and finding the matching demo account…';
  const lookupResponse=await fetch('/api/demo-profile/lookup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({account_id:candidate})});
  const match=await lookupResponse.json();
  if(!lookupResponse.ok||match.status!=='matched')throw new Error('Could not match the account read from this passbook. Please choose another passbook photo.');
  passbook={...match.profile,ocr_name:d.fields?.name?.value||'',ocr_notice:d.notice||words(language).ocrReview,profile:match.profile};
  $('#confirmedAccount').value='';$('#accountLookupStatus').textContent='';$('#matchedCustomer').hidden=true;$('#matchedCustomer').textContent='';
  $('#passbookNotice').textContent='Passbook read successfully. Required account details were retrieved in the background.';$('#passbookNotice').hidden=false;
  if(mode==='voice'&&currentIntent==='withdrawal'&&detectedAmount&&Number(detectedAmount)>Number(passbook.profile.balance||0)){
    lastKnownBalance=String(passbook.profile.balance||'0');flowStage='balance-check';show('requestScreen');
    const prompt=language==='hi'?`आपके खाते में इतनी राशि नहीं है। क्या आप अपना मौजूदा बैलेंस देखना चाहते हैं? हाँ या नहीं कहें।`:language==='pa'?`ਤੁਹਾਡੇ ਖਾਤੇ ਵਿੱਚ ਇੰਨੀ ਰਕਮ ਨਹੀਂ ਹੈ। ਕੀ ਤੁਸੀਂ ਆਪਣਾ ਮੌਜੂਦਾ ਬਕਾਇਆ ਵੇਖਣਾ ਚਾਹੁੰਦੇ ਹੋ? ਹਾਂ ਜਾਂ ਨਹੀਂ ਕਹੋ।`:language==='ur'?`آپ کے اکاؤنٹ میں اتنی رقم نہیں ہے۔ کیا آپ اپنا موجودہ بیلنس دیکھنا چاہتے ہیں؟ ہاں یا نہیں کہیں۔`:`Your account does not have enough balance for that withdrawal. Would you like to see your current balance? Please say yes or no.`;
    setBalancePrompt(prompt);await say(prompt,language,startRecognition);return;
  }
  if(mode==='voice'&&currentIntent==='withdrawal'){
    if(!detectedAmount){flowStage='amount';show('requestScreen');$('#withdrawalAmountBlock').hidden=false;$('#continueUpload').hidden=true;$('#continueWithdrawal').hidden=true;const prompt=language==='hi'?'पासबुक मिल गई। कितनी राशि निकालनी है?':language==='ur'?'پاس بک مل گئی۔ کتنی رقم نکلوانی ہے؟':language==='pa'?'ਪਾਸਬੁੱਕ ਮਿਲ ਗਈ। ਕਿੰਨੀ ਰਕਮ ਕਢਵਾਉਣੀ ਹੈ?':'Passbook matched. How much would you like to withdraw?';await say(prompt,language,startRecognition);return;}
    showWithdrawal();return;
  }
  if(mode==='voice'&&currentIntent==='deposit'){
    $('#otherFormTypeWrap').hidden=true;chooseOtherSubtype('deposit');$('#otherFormPassbook').textContent='Account-holder details are filled from the matched account record.';$('#otherFormNotice').textContent='Enter the deposit amount, then preview the completed form. The preview marks where to sign.';$('#selectedFormFields').querySelectorAll('input').forEach(input=>{if(input.dataset.field!=='amount')input.readOnly=true});show('otherFormScreen');autoCompleteDeposit();return;
  }
  show('formsScreen');
 }catch(error){$('#ocrStatus').textContent=error.message;$('#extract').disabled=false;}finally{hideLoading();}
}
$('#lookupAccount').onclick=async()=>{const account=$('#confirmedAccount').value.trim();$('#continueToForms').hidden=true;$('#confirmProfileWrap').hidden=true;$('#matchedCustomer').hidden=true;$('#confirmProfile').checked=false;if(!/^\d{8,12}$/.test(account)){$('#accountLookupStatus').textContent=manualMessage('invalid');return}$('#lookupAccount').disabled=true;$('#accountLookupStatus').textContent=manualMessage('checking');try{const response=await fetch('/api/demo-profile/lookup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({account_id:account})});const data=await response.json();if(!response.ok||data.status!=='matched'){passbook.profile=null;$('#accountLookupStatus').textContent=manualMessage('notFound');return}const p=data.profile;passbook={...passbook,...p,account_id:p.account_id,name:p.name,phone:p.phone,branch:p.branch,profile:p};$('#matchedCustomer').replaceChildren();$('#matchedCustomer').hidden=true;$('#confirmProfileWrap').hidden=true;$('#continueToForms').hidden=true;$('#accountLookupStatus').textContent='Account number matched. Opening available forms…';show('formsScreen')}catch(error){$('#accountLookupStatus').textContent=manualMessage('databaseError',{error:error.message})}finally{$('#lookupAccount').disabled=false}};
$('#confirmedAccount').oninput=()=>{passbook.profile=null;$('#matchedCustomer').hidden=true;$('#confirmProfileWrap').hidden=true;$('#confirmProfile').checked=false;$('#continueToForms').hidden=true};
$('#continueToForms').onclick=()=>{if(!passbook.profile||!$('#confirmProfile').checked){$('#accountLookupStatus').textContent=manualMessage('review');return}$('#passbookNotice').textContent=manualMessage('matched');$('#passbookNotice').hidden=false;show('formsScreen')};
$('#changePhoto').onclick=()=>{$('#image').value='';imageFile=null;$('#preview').hidden=true;$('#formPassbookPreview').hidden=true;$('#matchedCustomer').hidden=true;$('#confirmProfileWrap').hidden=true;showManualUpload()};
$('#image').onchange=()=>{const f=$('#image').files[0];if(!f)return;if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>8*1024*1024){$('#ocrStatus').textContent='Choose JPG or PNG under 8 MB. / 8 MB से छोटी JPG या PNG चुनें।';$('#image').value='';return}imageFile=f;$('#preview').src=URL.createObjectURL(f);$('#preview').hidden=false;$('#formPassbookPreview').src=$('#preview').src;$('#formPassbookPreview').hidden=false;processPassbookImage()};
document.querySelectorAll('[data-sample]').forEach(button=>button.onclick=async()=>{try{const response=await fetch(button.dataset.sample);if(!response.ok)throw new Error('Sample image could not be loaded.');const blob=await response.blob(),fileName=button.dataset.sample.split('/').pop();imageFile=new File([blob],fileName,{type:'image/png'});$('#image').value='';$('#preview').src=URL.createObjectURL(imageFile);$('#preview').hidden=false;$('#formPassbookPreview').src=$('#preview').src;$('#formPassbookPreview').hidden=false;processPassbookImage()}catch(error){$('#ocrStatus').textContent=error.message}});
$('#extract').onclick=processPassbookImage;
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
document.querySelectorAll('[data-form]').forEach(button=>button.onclick=()=>{const type=button.dataset.form;if(type==='withdrawal'){currentIntent='withdrawal';flowStage='amount';showWithdrawal();return}$('#otherFormTypeWrap').hidden=true;chooseOtherSubtype('deposit');$('#otherFormTitle').textContent='Deposit Form';$('#otherFormPassbook').textContent='Account-holder details are filled from the matched account record.';$('#otherFormNotice').textContent='Enter only the deposit amount. Other fields are filled automatically from the account record.';$('#selectedFormFields').querySelectorAll('input').forEach(input=>{if(input.dataset.field!=='amount')input.readOnly=true});show('otherFormScreen')});
$('#otherFormType').onchange=()=>chooseOtherSubtype($('#otherFormType').value);
$('#otherFormConfirm').onchange=()=>{if(!$('#otherFormConfirm').checked)resetSamplePreview()};
$('#previewSampleForm').onclick=async()=>{if(!selectedFormType)return;if(selectedFormType!=='deposit'&&!$('#otherFormConfirm').checked){$('#otherFormStatus').textContent='This form is not available in the simplified kiosk flow.';return}if(selectedFormType==='deposit'&&!currentFormFields().amount){$('#otherFormStatus').textContent='Enter the deposit amount to continue.';return}const payload={form_id:selectedFormType,fields:currentFormFields(),confirmed:true};$('#previewSampleForm').disabled=true;$('#otherFormStatus').textContent='Generating the form preview…';try{const response=await fetch('/api/forms/sample-preview',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!response.ok){const issue=await response.json();throw new Error(issue.detail||'Could not generate preview.')}const blob=await response.blob(),url=URL.createObjectURL(blob),frame=$('#samplePdfPreview');if(frame.dataset.objectUrl)URL.revokeObjectURL(frame.dataset.objectUrl);frame.dataset.objectUrl=url;frame.dataset.form=selectedFormType;frame.src=selectedFormType==='deposit'?url+'#toolbar=0&navpanes=0&scrollbar=0&view=Fit':url;frame.hidden=false;$('#sampleSignatureCue').dataset.form=selectedFormType;$('#sampleSignatureCue').hidden=(selectedFormType!=='deposit');$('#downloadSampleForm').disabled=false;$('#otherFormStatus').textContent='Preview is shown below. Inspect it before downloading.';setTimeout(()=>frame.scrollIntoView({behavior:'smooth',block:'center'}),250)}catch(error){$('#otherFormStatus').textContent=error.message}finally{$('#previewSampleForm').disabled=false}};
$('#downloadSampleForm').onclick=async()=>{if(!selectedFormType||$('#downloadSampleForm').disabled)return;if(selectedFormType!=='deposit'&&!$('#otherFormConfirm').checked){$('#otherFormStatus').textContent='This form is not available in the simplified kiosk flow.';return}if(selectedFormType==='deposit'&&!currentFormFields().amount){$('#otherFormStatus').textContent='Enter the deposit amount to continue.';return}const payload={form_id:selectedFormType,fields:currentFormFields(),confirmed:true};$('#downloadSampleForm').disabled=true;$('#otherFormStatus').textContent='Preparing download…';try{const response=await fetch('/api/forms/sample-pdf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!response.ok){const issue=await response.json();throw new Error(issue.detail||'Could not prepare the form.')}const blob=await response.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=formDefinitions[selectedFormType].title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-draft.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);$('#counterInstruction').textContent='Your '+formDefinitions[selectedFormType].title.toLowerCase()+' has been downloaded. Take the printed draft to Counter 1 for withdrawal/deposit staff. No bank transaction has been submitted.';show('counterScreen')}catch(error){$('#otherFormStatus').textContent=error.message;$('#downloadSampleForm').disabled=false}};
$('#otherFormBack').onclick=()=>{resetSamplePreview();show('formsScreen')};
$('#counterDone').onclick=endSession;$('#formsBack').onclick=()=>{mode='manual';$('#image').value='';imageFile=null;$('#preview').hidden=true;$('#formPassbookPreview').hidden=true;showManualUpload()};
$('#send').onclick=()=>{const typed=$('#utterance').value;if(parseLanguagePreferenceCommand(typed)){$('#utterance').value='';$('#requestResult').textContent=languageChangeConfirmation();$('#requestResult').hidden=false;return}interpret(typed).catch(()=>{$('#requestResult').textContent='Could not understand. Please try again.';$('#requestResult').hidden=false})};$('#utterance').onkeydown=e=>{if(e.key==='Enter')$('#send').click()};
$('#requestVoice').onclick=()=>{if(mode==='voice'&&geminiReady&&geminiSocket?.readyState===WebSocket.OPEN){resumeVoiceInput();return}mode='voice';speechRestartAllowed=true;startRecognition()};
$('#continueUpload').onclick=()=>{detectedAmount=$('#requestedAmount').value.trim();show('uploadScreen')};
function showWithdrawal(){if(!$('#amount').value&&detectedAmount)$('#amount').value=detectedAmount;$('#name').value=passbook.name;$('#account').value=passbook.account_id;$('#phone').value=passbook.phone;$('#branch').value=passbook.branch;show('withdrawalScreen');if(mode==='voice')autoCompleteWithdrawal()}
let autoCompleteRunning=false;
async function autoCompleteWithdrawal(){
  if(autoCompleteRunning)return;autoCompleteRunning=true;
  try{
    $('#confirm').checked=true;$('#confirm').dispatchEvent(new Event('input',{bubbles:true}));
    $('#download').hidden=true;$('#prepare').click();
    for(let i=0;i<50&&$('#download').hidden;i++){await sleep(300);if($('#profileStatus').textContent.trim())break}
    if($('#download').hidden)return; // validation problem or low balance: the on-screen message / balance prompt takes over
    announceSign();
    await sleep(9000);
    if(activeScreen==='withdrawalScreen'&&!$('#download').hidden)$('#download').click();
  }catch(e){console.warn('Auto download failed',e)}finally{autoCompleteRunning=false}
}
$('#continueWithdrawal').onclick=()=>{detectedAmount=$('#requestedAmount').value.trim();if(mode==='voice'&&!imageFile){$('#requestResult').textContent='Please upload your passbook photo before preparing the withdrawal draft.';$('#continueUpload').hidden=false;return}showWithdrawal()};

let readyPayload=null, lastKnownBalance='';['amount','name','account','phone','branch','confirm','withdrawalType'].forEach(id=>$('#'+id).addEventListener('input',()=>{readyPayload=null;$('#download').hidden=true;if(id==='amount')$('#balancePrompt').hidden=true;}));
$('#showBalance').onclick=async()=>{const text=language==='hi'?`आपके खाते में अभी ${amountWords(lastKnownBalance,language)} हैं।`:language==='pa'?`ਤੁਹਾਡੇ ਖਾਤੇ ਵਿੱਚ ਇਸ ਵੇਲੇ ${amountWords(lastKnownBalance,language)} ਹਨ।`:language==='ur'?`آپ کے اکاؤنٹ میں اس وقت ${amountWords(lastKnownBalance,language)} ہیں۔`:`Your current balance is ${amountWords(lastKnownBalance,language)}.`;$('#currentBalanceText').hidden=true;showBalanceBox(lastKnownBalance);if(mode==='voice'){const next=language==='hi'?'अब कृपया निकालने के लिए कम राशि बताइए।':language==='ur'?'اب براہِ کرم نکلوانے کے لیے کم رقم بتائیں۔':language==='pa'?'ਹੁਣ ਕਿਰਪਾ ਕਰਕੇ ਕਢਵਾਉਣ ਲਈ ਘੱਟ ਰਕਮ ਦੱਸੋ।':'Now please tell me a lower amount to withdraw.';flowStage='amount';await say(balanceSpeech(speakingLanguage),speakingLanguage,startRecognition)}};
$('#changeAmount').onclick=()=>{$('#balancePrompt').hidden=true;$('#currentBalanceText').hidden=true;$('#amount').focus();flowStage='amount';if(mode==='voice'){const prompt=language==='hi'?'कृपया कम राशि दर्ज करें।':'Please enter a lower amount.';say(prompt,language,startRecognition)}};
$('#prepare').onclick=async()=>{
 const payload={transaction:$('#withdrawalType').value,amount:$('#amount').value.trim(),name:$('#name').value.trim(),account_id:$('#account').value.trim(),phone:$('#phone').value.trim(),branch:$('#branch').value.trim(),confirmed:$('#confirm').checked};
 $('#balancePrompt').hidden=true;$('#currentBalanceText').hidden=true;$('#profileStatus').textContent='';
 let r,d;try{r=await fetch('/api/forms/prepare',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});d=await r.json()}catch(error){$('#profileStatus').textContent='Could not validate the draft. Please try again.';return}
 readyPayload=r.ok?payload:null;$('#download').hidden=true;$('#withdrawalPdfPreview').hidden=true;$('#signatureCue').hidden=true;$('#review').hidden=true;$('#review').textContent='';
 if(!r.ok){
   if(r.status===409&&d.detail&&typeof d.detail==='object'&&d.detail.code==='INSUFFICIENT_BALANCE'){
     lastKnownBalance=String(d.detail.balance||'0');flowStage='balance-check';
     const prompt=language==='hi'?`आपके खाते में इतनी राशि नहीं है। क्या आप अपना मौजूदा बैलेंस देखना चाहते हैं?`:language==='pa'?`ਤੁਹਾਡੇ ਖਾਤੇ ਵਿੱਚ ਇੰਨੀ ਰਕਮ ਨਹੀਂ ਹੈ। ਕੀ ਤੁਸੀਂ ਮੌਜੂਦਾ ਬਕਾਇਆ ਵੇਖਣਾ ਚਾਹੁੰਦੇ ਹੋ?`:language==='ur'?`آپ کے اکاؤنٹ میں اتنی رقم نہیں ہے۔ کیا آپ موجودہ بیلنس دیکھنا چاہتے ہیں؟`:`Your account does not have enough balance for that withdrawal. Would you like to see your current balance?`;
     $('#balancePromptText').textContent=prompt;$('#showBalance').textContent=language==='hi'?'हाँ, बैलेंस दिखाएँ':language==='pa'?'ਹਾਂ, ਬਕਾਇਆ ਦਿਖਾਓ':language==='ur'?'ہاں، بیلنس دکھائیں':'Yes, show my balance';$('#changeAmount').textContent=language==='hi'?'नहीं, राशि बदलें':language==='pa'?'ਨਹੀਂ, ਰਕਮ ਬਦਲੋ':language==='ur'?'نہیں، رقم بدلیں':'No, change amount';$('#balancePrompt').hidden=false;
     if(mode==='voice')await say(prompt,language,startRecognition);return;
   }
   $('#profileStatus').textContent=typeof d.detail==='string'?d.detail:'Could not prepare this draft.';return;
 }
 const pr=await fetch('/api/forms/withdrawal-preview',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
 if(!pr.ok){$('#profileStatus').textContent='Form details validated, but preview failed: '+(await pr.json()).detail;return}
 const blob=await pr.blob(),url=URL.createObjectURL(blob),frame=$('#withdrawalPdfPreview');if(frame.dataset.objectUrl)URL.revokeObjectURL(frame.dataset.objectUrl);frame.dataset.objectUrl=url;frame.src=url;frame.hidden=false;$('#signatureCue').dataset.form='withdrawal';$('#signatureCue').hidden=false;$('#download').hidden=false;$('#review').textContent=language==='hi'?'नीचे पूरा फ़ॉर्म देखें, फिर डाउनलोड करें।':'Review the completed form below before downloading.';$('#review').hidden=false;
 setTimeout(()=>frame.scrollIntoView({behavior:'smooth',block:'center'}),250);
};
$('#download').onclick=async()=>{if(!readyPayload)return;const r=await fetch('/api/forms/pdf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(readyPayload)});if(!r.ok){$('#profileStatus').textContent=(await r.json()).detail;return}const blob=await r.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='withdrawal-draft.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);$('#counterInstruction').textContent='Your withdrawal form has been downloaded. Take the printed draft to Counter 1 for withdrawal/deposit staff. No bank transaction has been submitted.';show('counterScreen')};
$('#backToStart').onclick=()=>{cancelAllSpeechAndGeminiAudio();hideLoading();currentIntent=null;detectedAmount='';flowStage='hello';passbook={name:'',account_id:'',branch:'',phone:'',profile:null};imageFile=null;$('#image').value='';$('#preview').hidden=true;$('#formPassbookPreview').hidden=true;$('#extract').disabled=true;$('#amount').value='';$('#withdrawalType').value='cash withdrawal';$('#requestedAmount').value='';$('#utterance').value='';$('#requestResult').hidden=true;$('#passbookNotice').hidden=true;$('#voiceChat').replaceChildren();$('#confirm').checked=false;$('#review').textContent='';$('#review').hidden=true;$('#download').hidden=true;resetIntentActions();if(mode==='voice'){show('voiceScreen');setListeningVisual(false);if(geminiConnectInProgress){$('#voiceStatus').textContent='';return}if(geminiSocket?.readyState===WebSocket.OPEN&&geminiReady){geminiMicPaused=false;geminiSpeaking=false;geminiUserAudioActive=false;try{playbackContext?.suspend();playbackContext?.resume()}catch{}const prompt=startOverPrompt(speakingLanguage);geminiMuteUntil=Date.now()+2500;startGreetingWatchdog(prompt,speakingLanguage);geminiSocket.send(JSON.stringify({clientContent:{turns:[{role:'user',parts:[{text:'Restart the conversation without reconnecting or showing a connection/loading dialog. The customer pressed the Start over button. Say exactly this, in the spoken language only, then listen. Do not list services or add anything else. Do not speak in Urdu unless Urdu is selected. Do not mix Hindi and Urdu: '+prompt+'. Keep listening active after the greeting. Do not ask for microphone permission again.'}]}],turnComplete:true}}));}else if(voiceFallbackStarted){const greeting=startOverPrompt(speakingLanguage);showVoiceStatus('');say(greeting,speakingLanguage,startRecognition)}else if(activeMicStream&&activeMicStream.getAudioTracks().some(t=>t.readyState==='live')){geminiMicPaused=false;showVoiceStatus('');fallbackToBrowserVoice('Gemini connection is no longer available; switching to browser voice without asking for microphone permission again.')}else if(micPermissionGranted){showVoiceStatus('Microphone permission is already granted.');askMicrophone()}else{show('permissionScreen')}}else showManualUpload()};
language=languageFromLocale(navigator.language);localize();$('#permissionTitle').innerHTML='Allow microphone access<br>माइक्रोफ़ोन की अनुमति दें';$('#permissionText').innerHTML='Tap below and choose Allow to speak with your banking helper.<br>बात करने के लिए नीचे दबाएँ और Allow चुनें।';$('#voiceContinue').textContent='Allow microphone · माइक्रोफ़ोन की अनुमति दें';$('#manualContinue').textContent='Continue without voice · बिना आवाज़ जारी रखें';$('#fallbackActions').hidden=false;show('permissionScreen');
// Ask for the microphone only when the browser has not already been given permission.
function applyMicPermissionState(state){
  micPermissionGranted=state==='granted'||(micPermissionGranted&&state!=='denied'&&state!=='prompt');
  if(state==='granted'){micPermissionGranted=true;$('#permissionTitle').innerHTML='Ready to talk<br>बात करने के लिए तैयार';$('#permissionText').innerHTML='Microphone is already allowed. Tap below to start.<br>माइक्रोफ़ोन पहले से चालू है। शुरू करने के लिए नीचे दबाएँ।';$('#voiceContinue').textContent='Start with voice · आवाज़ से शुरू करें'}
  else{micPermissionGranted=false;$('#permissionTitle').innerHTML='Allow microphone access<br>माइक्रोफ़ोन की अनुमति दें';$('#permissionText').innerHTML='Tap below and choose Allow to speak with your banking helper.<br>बात करने के लिए नीचे दबाएँ और Allow चुनें।';$('#voiceContinue').textContent='Allow microphone · माइक्रोफ़ोन की अनुमति दें';
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
  if(state!=='granted'||activeScreen!=='permissionScreen'||mode)return;
  // Permission already given: go straight to voice without showing the permission screen again.
  try{primeAudioContexts()}catch{}
  await new Promise(r=>setTimeout(r,150));
  if(playbackContext&&playbackContext.state==='running')askMicrophone(); // otherwise the browser needs one tap to allow sound; the "Start with voice" button stays shown
})();


// ---- Yellow amount box: always in the SCREEN language (never the spoken one) ----
function showAmountBox(amount){const box=$('#requestResult');if(!box)return;renderAmountBox(box,amount);box.hidden=false;const actions=$('#amountConfirmActions');if(actions)actions.hidden=!(mode==='voice'&&flowStage==='amount-confirmed')}
$('#amountConfirmYes').onclick=()=>{if(flowStage==='amount-confirmed')handleVoice('yes')};
$('#amountConfirmNo').onclick=()=>{if(flowStage==='amount-confirmed')handleVoice('no')};
function refreshAmountBox(){if(flowStage==='amount-confirmed'&&detectedAmount&&activeScreen==='requestScreen'){const box=$('#requestResult');if(box&&!box.hidden)renderAmountBox(box,detectedAmount)}}
// ---- End of flow: first ask for the signature (before download), only afterwards send the customer to the counter ----
const SIGN_PROMPT={en:'Your form is ready. Please sign inside the highlighted box on the form. It will download in a few seconds.',hi:'आपका फ़ॉर्म तैयार है। कृपया फ़ॉर्म में हाइलाइट किए गए बॉक्स में हस्ताक्षर करें। यह कुछ सेकंड में डाउनलोड होगा।',pa:'ਤੁਹਾਡਾ ਫਾਰਮ ਤਿਆਰ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਫਾਰਮ ਵਿੱਚ ਹਾਈਲਾਈਟ ਕੀਤੇ ਬਾਕਸ ਵਿੱਚ ਦਸਤਖ਼ਤ ਕਰੋ। ਇਹ ਕੁਝ ਸਕਿੰਟਾਂ ਵਿੱਚ ਡਾਊਨਲੋਡ ਹੋਵੇਗਾ।',ur:'آپ کا فارم تیار ہے۔ براہِ کرم فارم میں نمایاں کیے گئے خانے میں دستخط کریں۔ یہ چند سیکنڈ میں ڈاؤن لوڈ ہوگا۔'};
const COUNTER_PROMPT={en:'Your form has been downloaded. Please move to Counter 1.',hi:'आपका फ़ॉर्म डाउनलोड हो गया है। कृपया काउंटर 1 पर जाइए।',pa:'ਤੁਹਾਡਾ ਫਾਰਮ ਡਾਊਨਲੋਡ ਹੋ ਗਿਆ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਕਾਊਂਟਰ 1 ਤੇ ਜਾਓ।',ur:'آپ کا فارم ڈاؤن لوڈ ہو گیا ہے۔ براہِ کرم کاؤنٹر 1 پر جائیں۔'};
function announceSign(){const c=SIGN_PROMPT[speakingLanguage]?speakingLanguage:'en';say(SIGN_PROMPT[c],c)}
function announceCounter(){const c=COUNTER_PROMPT[speakingLanguage]?speakingLanguage:'en';const text=COUNTER_PROMPT[c];if(window.speechSynthesis&&window.SpeechSynthesisUtterance){window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=synthLocale(c);getVoicesWhenReady().then(vs=>{const v=chooseVoice(vs,[synthLocale(c)]);if(v)u.voice=v;window.speechSynthesis.speak(u)}).catch(()=>window.speechSynthesis.speak(u))}else showVoiceStatus(text)}

// After a language change, repeat the question for the current step in the spoken language so the conversation never stalls.
function stagePrompt(code){
  const c=['en','hi','pa','ur'].includes(code)?code:'hi';
  const T=(en,hi,pa,ur)=>({en,hi,pa,ur}[c]);
  if(flowStage==='amount-confirmed'&&detectedAmount)return amountConfirmation(detectedAmount,c);
  if(flowStage==='amount')return currentIntent==='deposit'
    ?T('How much would you like to deposit?','कितनी राशि जमा करनी है?','ਕਿੰਨੀ ਰਕਮ ਜਮ੍ਹਾਂ ਕਰਨੀ ਹੈ?','کتنی رقم جمع کروانی ہے؟')
    :T('How much would you like to withdraw?','कितनी राशि निकालनी है?','ਕਿੰਨੀ ਰਕਮ ਕਢਵਾਉਣੀ ਹੈ?','کتنی رقم نکلوانی ہے؟');
  if(flowStage==='passbook')return T('Please choose your passbook.','कृपया अपनी पासबुक चुनिए।','ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੀ ਪਾਸਬੁੱਕ ਚੁਣੋ।','براہِ کرم اپنی پاس بک منتخب کریں۔');
  if(flowStage==='hello'||flowStage==='request')return T('How may I help you? You can say withdraw cash or deposit money.','आपको क्या काम करना है? आप पैसे निकालना या जमा करना बोल सकते हैं।','ਤੁਹਾਨੂੰ ਕੀ ਕੰਮ ਹੈ? ਤੁਸੀਂ ਪੈਸੇ ਕਢਵਾਉਣਾ ਜਾਂ ਜਮ੍ਹਾਂ ਕਰਨਾ ਬੋਲ ਸਕਦੇ ਹੋ।','آپ کو کیا کام ہے؟ آپ رقم نکلوانا یا جمع کروانا بول سکتے ہیں۔');
  return '';
}

function startOverPrompt(code){const c=['en','hi','pa','ur'].includes(code)?code:'hi';return{en:'Let us start again. How may I help you?',hi:'फिर से शुरू करते हैं। आपको क्या काम करना है?',pa:'ਮੁੜ ਸ਼ੁਰੂ ਕਰਦੇ ਹਾਂ। ਤੁਹਾਨੂੰ ਕੀ ਕੰਮ ਹੈ?',ur:'دوبارہ شروع کرتے ہیں۔ آپ کو کیا کام ہے؟'}[c]}
function endsAffirmative(text){return /(?:^|[\s,.।!?])(?:yes|yeah|yep|haan|han|ji|theek hai|हाँ|हां|जी हाँ|जी हां|ठीक है|ਹਾਂ|ਜੀ ਹਾਂ|ہاں|جی ہاں)[।.!\s]*$/i.test((text||'').trim())}

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
function looseYes(t){return /^(?:ye|yea|yeah|yes|ya|yup|ha|haa|haan|han|hmm+|ok|okay|sure|ji|\u0939\u093e|\u0939\u093e\u0901|\u0939\u093e\u0902|\u0939\u093e\u0928|\u091c\u0940|\u0920\u0940\u0915|\u0a39\u0a3e\u0a02|\u0a1c\u0a40|\u06c1\u0627\u06ba|\u062c\u06cc)(?:\s+(?:ji|\u091c\u0940|\u0939\u0948|hai|\u0a39\u0a48|\u06c1\u06d2))?[\u0964.!?\s]*$/i.test((t||'').trim())}
function looseNo(t){return /^(?:no|nope|nah|na|nahi|nahin|\u0928\u0939\u0940\u0902|\u0928\u0939\u0940|\u0928\u093e|\u0a28\u0a39\u0a40\u0a02|\u0646\u06c1\u06cc\u06ba)(?:\s+(?:ji|\u091c\u0940))?[\u0964.!?\s]*$/i.test((t||'').trim())}
// If the customer cut the confirmation question short and nothing usable was understood, ask it again instead of staying silent.
function scheduleConfirmReask(){
  if(flowStage!=='amount-confirmed'||!detectedAmount)return;
  clearTimeout(confirmReaskTimer);const amountAtCut=String(detectedAmount);
  confirmReaskTimer=setTimeout(()=>{
    if(flowStage==='amount-confirmed'&&String(detectedAmount)===amountAtCut&&!geminiSpeaking&&!geminiUserAudioActive&&activeScreen==='requestScreen'){
      const c=['en','hi','pa','ur'].includes(speakingLanguage)?speakingLanguage:'hi';
      say(amountConfirmation(detectedAmount,c),c);
    }
  },5000);
}

let micLoudFrames=0,micLastLoudAt=0,lastModelAudioAt=0;
function indianNumber(n){const v=Number(n);return Number.isFinite(v)?v.toLocaleString('en-IN'):String(n)}
function amountBoxLabel(code,kind){const L={amount:{en:'Amount heard',hi:'सुनी गई राशि',pa:'ਸੁਣੀ ਗਈ ਰਕਮ',ur:'سنی گئی رقم'},balance:{en:'Your current balance',hi:'आपका मौजूदा बैलेंस',pa:'ਤੁਹਾਡਾ ਮੌਜੂਦਾ ਬਕਾਇਆ',ur:'آپ کا موجودہ بیلنس'}};return (L[kind][code]||L[kind].en)}
function bigNumberBox(label,amount,code){const wrap=document.createElement('div');wrap.className='big-amount';const a=document.createElement('small');a.textContent=label;const n=document.createElement('strong');n.textContent='₹ '+indianNumber(amount);const w=document.createElement('span');w.textContent=amountWords(String(amount),code);wrap.append(a,n,w);return wrap}
function renderAmountBox(box,amount){if(!box)return;const c=['en','hi','pa','ur'].includes(language)?language:'hi';const p=document.createElement('p');p.textContent=amountConfirmation(amount,c);const n=document.createElement('p');n.className='amount-small';n.textContent='₹ '+indianNumber(amount);box.replaceChildren(p,n)}
function showBalanceBox(balance){const c=['en','hi','pa','ur'].includes(language)?language:'hi';const card=bigNumberBox(amountBoxLabel(c,'balance'),balance,c);
  if(activeScreen==='requestScreen'||activeScreen==='voiceScreen'){const rb=$('#requestBalance'),host=$('#requestBalanceBig');if(rb&&host){host.replaceChildren(card);host.hidden=false;rb.hidden=false;const pp=$('#requestBalancePrompt');if(pp)pp.textContent='';$('#requestBalanceActions').hidden=true;$('#requestResult').hidden=true;try{rb.scrollIntoView({behavior:'smooth',block:'center'})}catch{}return}}
  const host=$('#balanceBig');if(!host)return;host.replaceChildren(card);host.hidden=false;try{host.scrollIntoView({behavior:'smooth',block:'center'})}catch{}}
function halfNumberValue(text){const t=(text||'').toLowerCase();const unit=/(lakhs?|lacs?|\u0932\u093e\u0916|thousand|hazaar|hazar|\u0939\u091c\u093e\u0930|\u0939\u095b\u093e\u0930)/;const m=t.match(new RegExp('(\u0921\u0947\u0922\u093c?|dedh|one and a half|1\\.5|\u0922\u093e\u0908|dhai|two and a half|2\\.5)\\s*'+unit.source));if(!m)return'';const big=/lakh|lac|\u0932\u093e\u0916/.test(m[2]);const one=/\u0921\u0947\u0922|dedh|one and a half|1\.5/.test(m[1]);return String((one?1.5:2.5)*(big?100000:1000))}
// If Gemini never produces audio after a (re)start greeting, speak it with the browser voice so the screen never just sits on "Namaste".
function browserSpeak(text,lang){try{if(!window.speechSynthesis)return;const u=new SpeechSynthesisUtterance(text);u.lang=lang;window.speechSynthesis.speak(u)}catch{}}
let greetingWatchdogTimer=null;
function startGreetingWatchdog(text,code){const t0=Date.now();bargeInBlockedUntil=t0+9000;clearTimeout(greetingWatchdogTimer);greetingWatchdogTimer=setTimeout(()=>{if(lastModelAudioAt>=t0||mode!=='voice'||flowStage!=='hello'||voiceFallbackStarted)return;const greeting=code==='bi'?text.split('|')[0]:text;browserSpeak(greeting,synthLocale(speakingLanguage))},7000)}

let bargeInBlockedUntil=0;
function balanceSpeech(code){const c=['en','hi','pa','ur'].includes(code)?code:'hi';return{
  en:'I am showing your balance on the screen. Now please tell me a lower amount to withdraw.',
  hi:'आपका बैलेंस स्क्रीन पर दिखा रहे हैं। अब कृपया निकालने के लिए कम राशि बताइए।',
  pa:'ਤੁਹਾਡਾ ਬਕਾਇਆ ਸਕ੍ਰੀਨ ਤੇ ਦਿਖਾ ਰਹੇ ਹਾਂ। ਹੁਣ ਕਿਰਪਾ ਕਰਕੇ ਕਢਵਾਉਣ ਲਈ ਘੱਟ ਰਕਮ ਦੱਸੋ।',
  ur:'آپ کا بیلنس اسکرین پر دکھا رہے ہیں۔ اب براہِ کرم نکلوانے کے لیے کم رقم بتائیں۔'}[c]}

// The balance question and the balance itself live on the request screen (the withdrawal screen is not visible at this point).
function hideRequestBalance(){const rb=$('#requestBalance');if(rb)rb.hidden=true;const h=$('#requestBalanceBig');if(h)h.hidden=true;const a=$('#requestBalanceActions');if(a)a.hidden=false}
function setBalancePrompt(prompt){
  $('#balancePromptText').textContent=prompt;$('#balancePrompt').hidden=false;
  const rb=$('#requestBalance');if(!rb)return;
  const c=['en','hi','pa','ur'].includes(language)?language:'hi';
  $('#requestBalancePrompt').textContent=prompt;$('#requestBalanceBig').hidden=true;$('#requestBalanceActions').hidden=false;
  $('#requestBalanceYes').textContent={en:'Yes, show my balance',hi:'हाँ, बैलेंस दिखाएँ',pa:'ਹਾਂ, ਬਕਾਇਆ ਦਿਖਾਓ',ur:'ہاں، بیلنس دکھائیں'}[c];
  $('#requestBalanceNo').textContent={en:'No, change amount',hi:'नहीं, राशि बदलें',pa:'ਨਹੀਂ, ਰਕਮ ਬਦਲੋ',ur:'نہیں، رقم بدلیں'}[c];
  $('#requestResult').hidden=true;rb.hidden=false;
}
$('#requestBalanceYes').onclick=()=>$('#showBalance').click();
$('#requestBalanceNo').onclick=()=>{hideRequestBalance();$('#changeAmount').click()};
$('#changeAmount').addEventListener('click',hideRequestBalance);

// If the customer says nothing for 5 seconds after a question, repeat that question (up to 3 times in a row).
let silenceReaskTimer=null,silenceReaskCount=0,silenceReaskStage='';
function silencePrompt(stage,code){
  const L={
    amount:{en:'Please tell me the amount.',hi:'कृपया राशि बताइए।',pa:'ਕਿਰਪਾ ਕਰਕੇ ਰਕਮ ਦੱਸੋ।',ur:'براہِ کرم رقم بتائیں۔'},
    request:{en:'Would you like to withdraw or deposit cash?',hi:'आप नकद निकासी करना चाहते हैं या जमा?',pa:'ਤੁਸੀਂ ਨਕਦ ਨਿਕਾਸੀ ਕਰਨੀ ਚਾਹੁੰਦੇ ਹੋ ਜਾਂ ਜਮ੍ਹਾਂ?',ur:'آپ نقد رقم نکلوانا چاہتے ہیں یا جمع کروانا؟'}};
  if(stage==='amount-confirmed')return amountConfirmation(detectedAmount,code);
  return (L[stage]||{})[code]||(L[stage]||{}).en||'';
}
function armSilenceReask(){
  clearTimeout(silenceReaskTimer);
  if(mode!=='voice'||!['amount','amount-confirmed','request'].includes(flowStage)||activeScreen!=='requestScreen')return;
  if(flowStage!==silenceReaskStage){silenceReaskStage=flowStage;silenceReaskCount=0}
  if(silenceReaskCount>=3)return;
  const armedAt=Date.now(),stage=flowStage,amountAtArm=String(detectedAmount);
  silenceReaskTimer=setTimeout(()=>{
    if(mode!=='voice'||flowStage!==stage||String(detectedAmount)!==amountAtArm||activeScreen!=='requestScreen')return;
    if(geminiSpeaking||geminiGenerating||geminiUserAudioActive||lastUserChunkAt>armedAt||lastModelAudioAt>armedAt)return;
    silenceReaskCount++;
    const c=['en','hi','pa','ur'].includes(speakingLanguage)?speakingLanguage:'hi';
    const text=silencePrompt(stage,c);if(text)say(text,c);
  },5000);
}

$('#restartKiosk')?.addEventListener('click',()=>window.location.reload());
