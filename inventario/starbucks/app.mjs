import {mountCounterStage} from '../counter-stage.mjs?v=starbucks-49';
const en=new URLSearchParams(location.search).get('lang')==='en';
if(en){document.documentElement.lang='en';document.querySelector('#subtitle').textContent='10 units · 6 independent models · Yokup inventory';document.querySelector('#basis').textContent='List confirmed by Carlos. Models interpreted from the panorama; dimensions, brands and warranties pending. Chairs and tables have separate 3D files.';}
const names={44:'Preparation counter',45:'Checkout counter',46:'Display case',47:'Mugs and coffee shelves',48:'Round table',49:'Chair'};
const manifest=await fetch('./manifest.json').then(r=>{if(!r.ok)throw Error('Manifest unavailable');return r.json();});
let dispose,queue=Promise.resolve();
for(const unit of manifest.units){
 const button=document.createElement('button'),name=en?names[unit.asset_number]+(/-(0[2-4])$/.test(unit.itil_code)||[48,49].includes(unit.asset_number)?' '+Number(unit.itil_code.slice(-2)):''):unit.name;
 button.textContent=name;const code=document.createElement('small');code.textContent=unit.itil_code;button.append(code);button.dataset.code=unit.itil_code;button.setAttribute('aria-pressed','false');
 button.onclick=()=>{queue=queue.then(async()=>{
  dispose?.();const canvas=document.querySelector('#viewer canvas');canvas.replaceWith(canvas.cloneNode(false));document.querySelectorAll('#units button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  document.querySelector('#selected-name').textContent=name+' · '+unit.itil_code;
  document.querySelector('[data-glb]').href=unit.model3d;document.querySelector('[data-blend]').href=unit.master;
  dispose=await mountCounterStage(document.querySelector('#viewer'),{number:unit.asset_number,name});
 });};document.querySelector('#units').append(button);
}
document.querySelector('#units button').click();window.addEventListener('pagehide',()=>dispose?.());
