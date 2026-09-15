import {createBestPeopleLayer} from './best-live-people.mjs?v=tiers-live-12';

// The approved Avenida Admira composition remains independent of Best's live
// 3D inventory. Only its visitors read the running Xtanco simulation.
const listeners=new Set();
let dialog,people,lastFocus,requestId,removeAbort,busy=false,viewError='';
const announce=(reason='')=>{for(const fn of listeners)fn({open:!!dialog,busy,error:viewError,reason,requestId});};
export function subscribeMatrixView(fn){listeners.add(fn);return ()=>listeners.delete(fn);}

export function closeMatrixView(reason=''){
  if(!dialog)return;
  const current=dialog;dialog=null;
  removeAbort?.();removeAbort=null;people?.dispose();people=null;
  const image=current.querySelector('.best-reference-filled');image.onload=null;image.onerror=null;
  current.close();current.remove();busy=false;viewError='';lastFocus?.focus?.();
  announce(typeof reason==='string'?reason:'');
}

export function openMatrixView(options={}){
  if(dialog||options.signal?.aborted)return;
  requestId=options.requestId;lastFocus=document.activeElement;busy=true;viewError='';
  dialog=document.createElement('dialog');
  dialog.className='matrix-dialog best-dialog visual-tier-surface';
  dialog.setAttribute('aria-label','Matrix · Avenida Admira · escena fija con visitantes en vivo');
  dialog.innerHTML=`<figure class="best-stage">
    <div class="best-live-scene">
      <img class="best-reference best-reference-filled" src="assets/best-xtanco-avenida-admira-framelock-20260915.png" alt="Xtanco fotorrealista con la placa Avenida Admira, mobiliario y composición originales.">
      <img class="best-reference best-reference-empty" src="assets/best-xtanco-avenida-admira-mudanza-20260915.png" alt="El mismo Xtanco en Avenida Admira vacío, con suelo y paredes.">
    </div>
    <p class="visual-surface-badge">04.- MATRIX · AVENIDA ADMIRA</p>
    <figcaption><span class="best-filled-caption">ESCENA FIJA · VISITANTES EN VIVO</span><span class="best-empty-caption">MUDANZA · SUELO Y PAREDES</span></figcaption>
    <p class="best-image-error" role="alert" hidden>No se ha podido cargar Matrix. Puedes cambiar de vista desde el menú avanzado o el CLI.</p>
  </figure>`;
  const current=dialog,image=current.querySelector('.best-reference-filled');
  const showError=message=>{
    if(dialog!==current)return;
    busy=false;viewError=message;current.querySelector('.best-image-error').textContent=message;
    current.querySelector('.best-image-error').hidden=false;announce();
  };
  image.onload=()=>{
    if(dialog!==current||people)return;
    try{people=createBestPeopleLayer({container:current.querySelector('.best-live-scene')});}
    catch{showError('No se pudieron cargar los visitantes de Matrix. Puedes cambiar de vista desde el menú avanzado o el CLI.');return;}
    busy=false;viewError='';current.querySelector('.best-image-error').hidden=true;announce();
  };
  image.onerror=()=>showError('No se ha podido cargar la escena de Avenida Admira. Puedes cambiar de vista desde el menú avanzado o el CLI.');
  for(const type of ['click','dblclick','pointerdown','pointerup','pointermove','mousedown','mouseup','mousemove','touchstart','touchmove','touchend','wheel','contextmenu','keydown','keyup','keypress']){
    current.addEventListener(type,event=>{
      event.stopPropagation();
      if(type==='keydown'&&event.key==='Escape'){event.preventDefault();closeMatrixView();}
    });
  }
  current.addEventListener('cancel',event=>{event.preventDefault();closeMatrixView();});
  const abort=()=>{if(dialog===current)closeMatrixView('switch');};
  options.signal?.addEventListener('abort',abort,{once:true});
  removeAbort=()=>options.signal?.removeEventListener('abort',abort);
  try{
    window.__xtancoSyncVisualSurface?.();document.body.append(current);current.show();
    current.getBoundingClientRect();current.classList.add('is-visible');window.__xtancoReleaseInputs?.();
  }catch(error){closeMatrixView('error');throw error;}
  announce();
  // Cached successes and cached failures may complete before their handlers run.
  if(image.complete){if(image.naturalWidth>0)image.onload();else image.onerror();}
}

window.addEventListener('pagehide',()=>closeMatrixView('pagehide'));
