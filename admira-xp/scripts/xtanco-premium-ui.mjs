import {openLifeView,closeLifeView,subscribeLifeView} from './life-ui.mjs';
import {createVisualTiers,requestedTier} from './xtanco-visual-tiers.mjs';

const actions=document.querySelector('#telegramDock .tg-actions');
const controls=document.createElement('div');controls.id='xtanco-visual-quality';
controls.setAttribute('role','group');controls.setAttribute('aria-label','Calidad visual · modo experto');
controls.innerHTML='<button type="button" data-visual-mode="good" aria-pressed="true" title="Good · estilo 8-bit · gemelo clásico y controles operativos">Good</button><button type="button" data-visual-mode="better" aria-pressed="false" title="Better · estilo 16-bit · gemelo 3D isométrico">Better</button><button type="button" data-visual-mode="best" aria-pressed="false" aria-disabled="true" aria-describedby="xtanco-best-status" title="Best · estilo 32-bit / hiperrealista · en preparación">Best</button><span id="xtanco-best-status" class="quality-status" role="status" hidden></span>';
actions?.prepend(controls);
const status=controls.querySelector('.quality-status');
// The compact expert dock clips its contents. Keep its accessible explanation
// outside that clipping box, while aria-describedby still links it to Best.
document.body.append(status);
let storage;try{storage=window.localStorage;}catch{}
// The legacy attribute also styles exterior traffic. Never activate its former
// Matrix wireframe when selecting the new, independent public Better tier.
document.body.dataset.xtancoVisual='good';
const tiers=createVisualTiers({openBetter:openLifeView,closeBetter:closeLifeView,subscribeBetter:subscribeLifeView,storage,
  onChange({mode,busy,notice}){
    document.body.dataset.xtancoTier=mode;controls.setAttribute('aria-busy',String(busy));
    for(const button of controls.querySelectorAll('[data-visual-mode]'))button.setAttribute('aria-pressed',String(button.dataset.visualMode===mode));
    status.textContent=busy?'Abriendo Better…':notice;status.hidden=!status.textContent;
  },
  onBestRequested(){
    // A direct ?visual=best link explains availability in the actual expert UI.
    if(document.body.classList.contains('xp-left-hidden'))document.getElementById('pfExpert')?.click();
  }
});
for(const button of controls.querySelectorAll('[data-visual-mode]'))button.onclick=event=>{event.stopPropagation();void tiers.choose(button.dataset.visualMode);};
for(const type of ['keydown','keyup','keypress'])controls.addEventListener(type,event=>event.stopPropagation());
// Compatibility façade: original operation callbacks stay on their own canvas.
// No public tier can load the retired wireframe or hybrid renderer.
window.__xtancoPremiumView={begin:()=>false,paint:()=>{},operationContext:()=>null,
  open:(mode='better')=>tiers.choose(mode),close:()=>tiers.choose('good'),get mode(){return 'good';}};
window.__xtancoVisualTiers=tiers;
void tiers.choose(requestedTier(location.search,storage));
