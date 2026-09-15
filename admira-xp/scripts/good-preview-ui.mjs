import {createTierControls} from './visual-tier-controls.mjs?v=tiers-live-9';

const listeners=new Set();
let dialog,controls,frame=0,lastFocus,requestId,removeAbort;
const announce=(busy=false,error='',reason='')=>{for(const listener of listeners)listener({open:!!dialog,busy,error,reason,requestId});};
export function subscribeGoodView(listener){listeners.add(listener);return ()=>listeners.delete(listener);}

export function closeGoodView(reason=''){
  if(!dialog)return;
  cancelAnimationFrame(frame);removeAbort?.();removeAbort=null;controls?.dispose();controls=null;
  dialog.close();dialog.remove();dialog=null;lastFocus?.focus?.();announce(false,'',typeof reason==='string'?reason:'');
}

export function openGoodView(options={}){
  if(dialog||options.signal?.aborted)return;
  const source=document.getElementById('c');requestId=options.requestId;lastFocus=document.activeElement;
  dialog=document.createElement('dialog');dialog.className='best-dialog good-dialog visual-tier-dialog';dialog.setAttribute('aria-labelledby','good-title');
  dialog.innerHTML=`<header class="best-header"><div><p class="best-eyebrow">XPACEOS · 01.- GOOD · 8 BITS</p><h1 id="good-title">El mismo Xtanco. La vista original.</h1></div><button type="button" class="best-close" aria-label="Salir del comparador">Salir del comparador ↗</button></header>
    <div class="best-navigation"></div>
    <figure class="best-stage visual-tier-stage"><canvas class="good-canvas" width="800" height="500" aria-label="Vista original en vivo del Xtanco"></canvas><p class="good-stage-note">GOOD · GEMELO EN VIVO</p><p class="best-image-error" role="alert" hidden>No se ha encontrado la vista original del Xtanco.</p></figure>
    <footer class="best-footer"><p><b>Mismo Xtanco · mismo encuadre 8:5.</b> Cambia a Better o Best desde el selector sin alterar el tamaño del espacio.</p><a href="/help/funcionalidades/" target="_blank" rel="noopener">01–30 · Funcionalidades ↗</a></footer>`;
  controls=createTierControls({context:'Cambiar calidad desde Good',choose:mode=>window.__xtancoVisualTiers?.choose(mode,{preserveFrame:true})});
  dialog.querySelector('.best-navigation').append(controls.element);document.body.append(dialog);dialog.showModal();window.__xtancoReleaseInputs?.();
  dialog.querySelector('.best-close').onclick=()=>closeGoodView();dialog.addEventListener('cancel',event=>{event.preventDefault();closeGoodView();});
  for(const type of ['click','dblclick','pointerdown','pointerup','pointermove','mousedown','mouseup','mousemove','touchstart','touchmove','touchend','wheel','contextmenu','keydown','keyup','keypress'])dialog.addEventListener(type,event=>{
    event.stopPropagation();if(type==='keydown'&&event.key==='Escape'){event.preventDefault();closeGoodView();}
  });
  const abort=()=>closeGoodView('switch');options.signal?.addEventListener('abort',abort,{once:true});removeAbort=()=>options.signal?.removeEventListener('abort',abort);
  const target=dialog.querySelector('.good-canvas'),error=dialog.querySelector('.best-image-error'),context=target.getContext('2d');
  if(!source||!context){error.hidden=false;announce(false,'No se ha encontrado la vista original del Xtanco.');return;}
  function paint(){
    if(!dialog)return;
    try{context.clearRect(0,0,target.width,target.height);context.drawImage(source,0,0,target.width,target.height);error.hidden=true;}
    catch{error.hidden=false;}
    frame=requestAnimationFrame(paint);
  }
  paint();announce();
}

window.addEventListener('pagehide',()=>closeGoodView('pagehide'));
