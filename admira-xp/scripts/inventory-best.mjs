import {createLifeSnapshot} from './life-snapshot.mjs';
/** Editable Best uses independent PBR objects; the photographic reference is preserved. */
export function mountInventoryBest(container,onReady=()=>{}){
 let disposed=false,viewer,frame=0,last=0;const snapshot=createLifeSnapshot();
 const canvas=document.createElement('canvas');canvas.className='inventory-best-canvas';canvas.setAttribute('aria-label','Best editable · mobiliario PBR del inventario');canvas.tabIndex=0;
 const label=document.createElement('p');label.className='inventory-best-label';label.textContent='BEST · INVENTARIO PBR · objetos independientes';container.append(canvas,label);container.classList.add('best-inventory-mode');
 const observer=new ResizeObserver(()=>{const r=container.getBoundingClientRect();viewer?.resize(r.width,r.height);});observer.observe(container);
 async function start(){try{
  const {createLifeRenderer}=await import('./life-renderer.mjs?v=blender-1');if(disposed)return;
  function tick(now){if(disposed)return;try{if(!document.hidden){const next=now-last>100||!viewer?snapshot(window.__xtancoVisualState?.()):null;
   if(next){label.textContent='BEST · INVENTARIO PBR · '+next.layout.length+' objetos visibles'+(next.moving?' · mudanza':'')+(viewer?.blenderCounters?' · Mostrador Blender 3D':'');if(!viewer){viewer=createLifeRenderer({canvas,snapshot:next,assetQuality:'best',getPlayer:()=>window.__xtoreWindowPlayer});const r=container.getBoundingClientRect();viewer.resize(r.width,r.height);onReady();}else viewer.update(next);last=now;}
   viewer?.render(now);
  }frame=requestAnimationFrame(tick);}catch{label.textContent='No se pudo dibujar Best editable. Vuelve a Good o Better.';}}
  frame=requestAnimationFrame(tick);
 }catch{label.textContent='Best editable no está disponible en este navegador.';}}void start();
 return ()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();viewer?.dispose();canvas.remove();label.remove();container.classList.remove('best-inventory-mode');};
}
