import {mountCounterStage} from '../counter-stage.mjs?v=water-rack-50';
const params=new URLSearchParams(location.search),en=params.get('lang')==='en';
if(en){
 document.documentElement.lang='en';
 document.querySelector('#subtitle').textContent='11 units · 7 independent models · Yokup inventory';
 document.querySelector('#basis').textContent='Models interpreted from the panorama and photos; measurements and warranties pending. The rack contains 19 blue PET bottles with white caps and PBR textures as visual filling. Brand identified by Carlos; this is not a stock count.';
 document.querySelector('#units').setAttribute('aria-label','Furniture units');
 document.querySelector('canvas').setAttribute('aria-label','3D model: drag to orbit');
 for(const [selector,label] of [['[data-view="front"]','Front'],['[data-view="back"]','Back'],['[data-view="side"]','Side'],['[data-bottle-glb]','Bottle GLB ↓'],['[data-bottle-blend]','Bottle Blender ↓']])document.querySelector(selector).textContent=label;
}
const names={44:'Preparation counter',45:'Checkout counter',46:'Display case',47:'Mugs and coffee shelves',48:'Round table',49:'Chair',50:'Solán de Cabras water rack'};
const manifest=await fetch('./manifest.json').then(r=>{if(!r.ok)throw Error('Manifest unavailable');return r.json();});
let dispose,queue=Promise.resolve();
const buttons=[];
for(const unit of manifest.units){
 const button=document.createElement('button'),name=en?names[unit.asset_number]+([48,49].includes(unit.asset_number)?' '+Number(unit.itil_code.slice(-2)):''):unit.name;
 button.textContent=name;const code=document.createElement('small');code.textContent=unit.itil_code;button.append(code);button.dataset.code=unit.itil_code;button.setAttribute('aria-pressed','false');
 button.onclick=()=>{queue=queue.then(async()=>{
  dispose?.();const canvas=document.querySelector('#viewer canvas');canvas.replaceWith(canvas.cloneNode(false));
  document.querySelectorAll('#units button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  document.querySelector('#selected-name').textContent=name+' · '+unit.itil_code;
  document.querySelector('[data-glb]').href=unit.model3d;document.querySelector('[data-blend]').href=unit.master;
  const filling=unit.visual_filling;
  document.querySelector('#unit-basis').textContent=filling?(en?'Photo/360 interpretation with nominal dimensions. The 19 editable bottles form a visual composition; actual stock is unknown. Embedded PBR textures; approximate label.':'Interpretación de foto/360 con dimensiones nominales. Las 19 botellas editables forman una composición visual; las existencias reales son desconocidas. Texturas PBR embebidas y etiqueta aproximada.') : '';
  for(const [selector,url] of [['[data-bottle-glb]',filling?.model3d],['[data-bottle-blend]',filling?.master]]){const link=document.querySelector(selector);link.hidden=!url;if(url)link.href=url;else link.removeAttribute('href');}
  const next=new URL(location.href);next.searchParams.set('item',unit.itil_code);history.replaceState(null,'',next);
  for(const link of document.querySelectorAll('nav a[href^="?lang="]')){const target=new URL(link.href);target.searchParams.set('item',unit.itil_code);link.href=target;}
  dispose=await mountCounterStage(document.querySelector('#viewer'),{number:unit.asset_number,name});
 }).catch(error=>{document.querySelector('#model-status').textContent=(en?'Model unavailable: ':'Modelo no disponible: ')+error.message;});};
 document.querySelector('#units').append(button);buttons.push({unit,button});
}
const requested=params.get('item');
(buttons.find(({unit})=>unit.itil_code===requested||unit.instance_id===requested)||buttons[0]).button.click();
window.addEventListener('pagehide',()=>dispose?.());
