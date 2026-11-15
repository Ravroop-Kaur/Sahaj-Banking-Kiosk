import { getDocument, GlobalWorkerOptions } from './vendor/pdfjs/pdf.min.mjs';
GlobalWorkerOptions.workerSrc='/static/vendor/pdfjs/pdf.worker.min.mjs';
export async function renderPaper(frame,url){
  const host=frame.parentElement;
  host.querySelector('canvas')?.remove();
  const doc=await getDocument({url,isEvalSupported:false,useSystemFonts:true}).promise;
  try{
    const page=await doc.getPage(1);
    const viewport=page.getViewport({scale:2});
    const canvas=document.createElement('canvas');
    canvas.width=viewport.width;canvas.height=viewport.height;
    canvas.setAttribute('role','img');canvas.setAttribute('aria-label',host.getAttribute('aria-label')||'Completed deposit form');
    await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
    if(frame.parentElement!==host || !frame.src.startsWith(url))return;
    host.querySelector('canvas')?.remove();host.append(canvas);frame.hidden=true;
  }finally{await doc.destroy()}
}
