import {createTierControls} from './visual-tier-controls.mjs?v=tiers-live-8';
import {createBestPeopleLayer} from './best-live-people.mjs?v=tiers-live-8';
const listeners=new Set();
let dialog,controls,people,lastFocus,requestId,removeAbort,busy=false;
const announce=(error='',reason='')=>{for(const fn of listeners)fn({open:!!dialog,busy,error,reason,requestId});};
export function subscribeBestView(fn){listeners.add(fn);return ()=>listeners.delete(fn);}
export function closeBestView(reason=''){
  if(!dialog)return;
  removeAbort?.();removeAbort=null;controls?.dispose();controls=null;people?.dispose();people=null;
  dialog.close();dialog.remove();dialog=null;busy=false;lastFocus?.focus?.();announce('',typeof reason==='string'?reason:'');
}
export function openBestView(options={}){
  if(dialog||options.signal?.aborted)return;
  requestId=options.requestId;lastFocus=document.activeElement;busy=true;
  dialog=document.createElement('dialog');dialog.className='best-dialog';dialog.setAttribute('aria-labelledby','best-title');
  dialog.innerHTML=`<header class="best-header"><div><p class="best-eyebrow">XPACEOS · 03.- BEST · 32 BITS</p><h1 id="best-title">El mismo Xtanco. El siguiente nivel.</h1></div><button type="button" class="best-close" aria-label="Volver a Good">Volver a Good ↗</button></header>
    <div class="best-navigation"></div>
    <figure class="best-stage"><div class="best-live-scene"><img class="best-reference" src="assets/best-xtanco-avenida-admira-cleanplate-20260915.png" alt="Referencia hiperrealista del Xtanco en Avenida Admira, sin marco de puerta ni personas fijas, preparada para mostrar los visitantes de la simulación."></div><figcaption>PERSONAS EN VIVO · AVENIDA ADMIRA</figcaption><p class="best-image-error" role="alert" hidden>No se ha podido cargar la referencia. Puedes volver a Good o Better desde el selector.</p></figure>
    <footer class="best-footer"><p><b>Mismo Xtanco · personas sincronizadas con la simulación.</b> Los visitantes respetan el mapa real de dureza y las oclusiones del mobiliario visible.</p><a href="assets/best-xtanco-concept-20260915.png" target="_blank" rel="noopener">Ver propuesta original ↗</a><a href="/help/funcionalidades/" target="_blank" rel="noopener">01–30 · Funcionalidades ↗</a><small>8 / 16 / 32 bits son niveles de estilo visual, no profundidad de color.</small></footer>`;
  controls=createTierControls({context:'Cambiar calidad desde Best',choose:mode=>window.__xtancoVisualTiers?.choose(mode)});
  dialog.querySelector('.best-navigation').append(controls.element);
  document.body.append(dialog);dialog.showModal();window.__xtancoReleaseInputs?.();
  dialog.querySelector('.best-close').onclick=()=>closeBestView();
  dialog.addEventListener('cancel',event=>{event.preventDefault();closeBestView();});
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
