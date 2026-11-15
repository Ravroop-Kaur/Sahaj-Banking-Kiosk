const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../static/kiosk-opening-simple.js'),'utf8'),context={};
vm.createContext(context);vm.runInContext(source.slice(source.indexOf('const jobLanguages'),source.indexOf('async function occupationNext')),context);
const cases=[
 ['hi','मैं सिलाई करती हूँ','Tailor','दर्जी'],['hi','मेरा कारोबार है','Business owner','व्यवसायी'],['hi','मैं दुकान चलाता हूँ','Shopkeeper','दुकानदार'],
 ['bn','আমি একজন চিকিৎসক','Doctor','চিকিৎসক'],['bn','আমি ছুতার','Carpenter','ছুতার'],['bn','আমি নৌকা তৈরি করি','Boat builder','নৌকা নির্মাতা'],
 ['pa','ਮੈਂ ਵਕੀਲ ਹਾਂ','Lawyer','ਵਕੀਲ'],['pa','ਮੈਂ ਕਿਸਾਨ ਹਾਂ','Farmer','ਕਿਸਾਨ'],['pa','ਮੈਂ ਡਾਕਟਰ ਹਾਂ','Doctor','ਡਾਕਟਰ'],
 ['ta','நான் ஒரு மாணவர்','Student','மாணவர்'],['ta','நான் செவிலியர்','Nurse','செவிலியர்'],['ta','நான் பொறியாளர்','Engineer','பொறியாளர்'],
 ['kn','ನಾನು ಒಬ್ಬ ರೈತ','Farmer','ರೈತ'],['kn','ನಾನು ಚಾಲಕ','Driver','ಚಾಲಕ'],['kn','ನಾನು ವಕೀಲ','Lawyer','ವಕೀಲ'],
 ['en','I work as a carpenter','Carpenter','Carpenter'],['en','I run my own business','Business owner','Business owner']
];
for(const [lang,input,english,local] of cases){const r=context.localOccupation(input,lang,lang);assert.equal(r?.english,english,input);assert.equal(r.screen,local,input);assert.equal(r.voice,local,input)}
const mixed=context.localOccupation('मैं plumber हूँ','en','hi');assert.equal(mixed.screen,'Plumber');assert.equal(mixed.voice,'प्लंबर');
for(const phrase of ['मेरा private काम है','मैं डॉक्टर नहीं हूँ','My father is a teacher'])assert.equal(context.localOccupation(phrase,'hi','hi'),null,phrase);
console.log('17 occupation examples, one split-language case and three ambiguous or unrelated answers passed.');
