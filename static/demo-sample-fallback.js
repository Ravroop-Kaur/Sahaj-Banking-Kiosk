/* Try a backup only when a fictional sample cannot be loaded or read. */
(()=>{'use strict';
const paths={
 passbook:[
  '/static/synthetic_documents/passbook_challenges/01-clear-front.png',
  '/static/synthetic_documents/passbooks/passbook-008.png',
  '/static/synthetic_documents/passbooks/passbook-015.png'
 ],
 identity:[
  '/static/kiosk/identity.png',
  '/static/kiosk/identity-backup-1.png',
  '/static/kiosk/identity-backup-2.png'
 ],
 pan:[
  '/static/kiosk/pan.png',
  '/static/kiosk/pan-backup-1.png',
  '/static/kiosk/pan-backup-2.png'
 ]
};
async function load(kind,processFile){
 if(!Object.hasOwn(paths,kind))throw Error('Unknown demo document');
 let lastError;
 for(const path of paths[kind]){
  try{
   const response=await fetch(path,{cache:'no-store'});
   if(!response.ok)throw Error('Sample image unavailable');
   const blob=await response.blob();
   if(!blob.size)throw Error('Sample image is empty');
   const file=new File([blob],path.split('/').pop(),{type:'image/png'});
   const result=await processFile(file);
   if(result===null)return null;
   if(!result)throw Error('Sample could not be read');
   return result;
  }catch(error){
   if([401,403,409].includes(error?.status))throw error;
   lastError=error;
  }
 }
 console.warn('Demo sample failed',kind,lastError);
 throw Error('Could not read the demo '+(kind==='identity'?'Aadhaar':kind)+' sample. Please try again or ask staff.');
}
window.SahajDemoSamples={load};
})();
