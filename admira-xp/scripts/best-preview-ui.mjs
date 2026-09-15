import {createBestPeopleLayer} from './best-live-people.mjs?v=tiers-live-11';
const listeners=new Set();
let dialog,people,lastFocus,requestId,removeAbort,busy=false;
const announce=(error='',reason='')=>{for(const fn of listeners)fn({open:!!dialog,busy,error,reason,requestId});};
export function subscribeBestView(fn){listeners.add(fn);return ()=>listeners.delete(fn);}
export function closeBestView(reason=''){
  if(!dialog)return;
  removeAbort?.();removeAbort=null;people?.dispose();people=null;
  dialog.close();dialog.remove();dialog=null;busy=false;lastFocus?.focus?.();announce('',typeof reason==='string'?reason:'');
}
export function openBestView(options={}){
  if(dialog||options.signal?.aborted)return;
  requestId=options.requestId;lastFocus=document.activeElement;busy=true;
  dialog=document.createElement('dialog');dialog.className='best-dialog visual-tier-surface';dialog.setAttribute('aria-label','Best · representación hiperrealista del Xtanco');
  dialog.innerHTML=`<figure class="best-stage"><div class="best-live-scene"><img class="best-reference" src="assets/best-xtanco-avenida-admira-framelock-20260915.png" alt="Referencia hiperrealista del Xtanco en Avenida Admira, sin marcos de puerta ni personas fijas, preparada para mostrar los visitantes de la simulación."></div><p class="visual-surface-badge">03.- BEST · 32 BITS</p><figcaption>PERSONAS EN VIVO · AVENIDA ADMIRA</figcaption><p class="best-image-error" role="alert" hidden>No se ha podido cargar la referencia. Puedes volver a Good o Better desde el menú experto o el CLI.</p></figure>`;
  window.__xtancoSyncVisualSurface?.();document.body.append(dialog);dialog.show();dialog.getBoundingClientRect();dialog.classList.add('is-visible');window.__xtancoReleaseInputs?.();
  for(const type of ['click','dblclick','pointerdown','pointerup','pointermove','mousedown','mouseup','mousemove','touchstart','touchmove','touchend','wheel','contextmenu','keydown','keyup','keypress'])dialog.addEventListener(type,event=>{
    event.stopPropagation();if(type==='keydown'&&event.key==='Escape'){event.preventDefault();closeBestView();}
  });
  const current=dialog,image=dialog.querySelector('img');
  image.onload=()=>{if(dialog!==current)return;busy=false;dialog.querySelector('.best-image-error').hidden=true;
    people?.dispose();people=createBestPeopleLayer({container:dialog.querySelector('.best-live-scene')});announce();};
  image.onerror=()=>{if(dialog!==current)return;busy=false;dialog.querySelector('.best-image-error').hidden=false;announce('No se ha podido cargar la imagen conceptual de Best.');};
  const abort=()=>{if(dialog===current)closeBestView('switch');};
  options.signal?.addEventListener('abort',abort,{once:true});removeAbort=()=>options.signal?.removeEventListener('abort',abort);
  announce();
  // A cached image may already be usable when handlers are attached. Merely
  // complete is insufficient: broken images can be complete with width zero.
  if(image.complete&&image.naturalWidth>0)image.onload();
}
window.addEventListener('pagehide',()=>closeBestView('pagehide'));
