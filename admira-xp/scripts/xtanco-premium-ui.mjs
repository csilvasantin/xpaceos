import {movableWindow} from './floating-window.mjs';
import {createSceneSnapshot} from './xtanco-scene-snapshot.mjs';

const actions=document.querySelector('#telegramDock .tg-actions');
const expert=document.getElementById('pfExpert');
const entry=document.createElement('button');entry.type='button';entry.textContent='Better / Best';entry.id='xtanco-premium-entry';actions?.append(entry);
const panel=document.createElement('section');panel.id='xtanco-premium';panel.hidden=true;panel.setAttribute('aria-label','Xtanco · Better y Best');
panel.innerHTML=`<header class="premium-handle"><div><span class="premium-eyebrow">XPACEOS · XTANCO</span><strong>Una tienda. Dos miradas.</strong></div><button class="premium-close" aria-label="Cerrar vista premium">×</button></header>
<div class="premium-toolbar"><div class="premium-modes" role="group" aria-label="Acabado visual"><button data-premium-mode="better" aria-pressed="false">Better <span>Wireframe</span></button><button data-premium-mode="best" aria-pressed="true">Best <span>Premium</span></button></div><p class="premium-live">Arrastra para girar · rueda para acercar</p><button class="premium-fit">Reencuadrar</button></div>
<div class="premium-stage"><canvas aria-label="Vista tridimensional del Xtanco"></canvas><p class="premium-loading" role="status">Preparando la tienda…</p></div>
<footer><span class="premium-scene-status" role="status"></span><details><summary>Sobre esta vista</summary><p>Interior: personas de la simulación. Exterior: el contador de Puerta Cam. Better y Best comparten tienda, player y reglas condicionales. Los ajustes y la operación siguen disponibles en Experto.</p></details></footer>`;
document.body.append(panel);
// Let focused controls keep native keyboard behavior without firing game shortcuts.
for(const type of ['keydown','keyup','keypress']){
  panel.addEventListener(type,event=>event.stopPropagation());
  entry.addEventListener(type,event=>event.stopPropagation());
}
let renderer=null,loading=null,mode='best',lastFrame=0,failed=false;
const stage=panel.querySelector('.premium-stage'),canvas=panel.querySelector('canvas'),message=panel.querySelector('.premium-loading');
const snapshot=createSceneSnapshot();
const movable=movableWindow(panel,panel.querySelector('header'),{key:'xtanco-premium-position',closeButton:panel.querySelector('.premium-close'),onClose:close});
function close(){panel.hidden=true;entry.focus();renderer?.dispose();renderer=null;lastFrame=0;}
function showMessage(text){message.textContent=text;message.hidden=false;}
async function prepare(){
  if(renderer||loading)return;
  failed=false;showMessage('Preparando la tienda…');
  loading=import('./premium-renderer.mjs').then(({createPremiumRenderer})=>{
    if(panel.hidden)return;
    renderer=createPremiumRenderer({canvas,mode,getPlayer:()=>window.__xtoreWindowPlayer});
    lastFrame=0;
  }).catch(error=>{failed=true;showMessage('No se pudo abrir la vista 3D. Cierra y vuelve a abrir para reintentar.');console.warn('[Xtanco premium]',error.message);}).finally(()=>{loading=null;});
  await loading;
}
function choose(next){
  mode=next==='better'?'better':'best';panel.dataset.mode=mode;
  for(const button of panel.querySelectorAll('[data-premium-mode]'))button.setAttribute('aria-pressed',String(button.dataset.premiumMode===mode));
  renderer?.setMode(mode);
}
function open(next='best'){
  if(document.body.classList.contains('xp-left-hidden'))expert?.click();
  panel.hidden=false;movable.restore();choose(next);void prepare();
}
entry.onclick=()=>{if(panel.hidden)open(mode);else close();};
for(const button of panel.querySelectorAll('[data-premium-mode]'))button.onclick=()=>choose(button.dataset.premiumMode);
panel.querySelector('.premium-fit').onclick=()=>renderer?.fit();
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();failed=true;showMessage('La vista 3D se ha detenido. Cierra y vuelve a abrir para reintentar.');});
window.addEventListener('pagehide',()=>{renderer?.dispose();renderer=null;lastFrame=0;});
window.addEventListener('pageshow',()=>{if(!panel.hidden)void prepare();});
window.__xtancoPremiumView={open,close,frame(time){
  if(panel.hidden||document.hidden||!panel.getClientRects().length||time-lastFrame<1000/30)return;
  lastFrame=time;
  const state=window.__xtancoVisualState?.();
  const scene=snapshot(state);
  if(!scene){showMessage('Abre una tienda Xtanco para ver Better y Best.');return;}
  if(!renderer||failed)return;
  try{
    const rect=stage.getBoundingClientRect();renderer.resize(Math.max(1,rect.width),Math.max(1,rect.height),Math.min(devicePixelRatio||1,1.5));
    renderer.update(scene);renderer.render(time);message.hidden=true;
    const exterior=window.__xtoreWindowPlayer?.exteriorStatistics?.()?.person;
    panel.querySelector('.premium-scene-status').textContent=`Interior · ${scene.inside} en tienda    /    Exterior · ${exterior==null?'sin señal':exterior+' pasos'}`;
  }catch(error){failed=true;showMessage('Vista 3D no disponible. La tienda continúa en la vista original.');console.warn('[Xtanco premium]',error.message);}
}};
const requested=new URLSearchParams(location.search).get('visual');
if(requested==='better'||requested==='best')open(requested);
