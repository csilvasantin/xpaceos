import {createDistribuitController} from './distribuit-controller.mjs';
import {isWallFurniture} from './furniture-geometry.mjs';

export function mountDistribuit({dialog,viewer,bridge,onClose=()=>{}}){
  const en=document.documentElement.lang==='en',t=(es,english)=>en?english:es;
  const host=document.createElement('aside');host.className='distribuit-panel';host.setAttribute('aria-label','Distribuit');
  host.innerHTML=`<header><strong>Distribuit · 16 bits</strong><button type="button" data-action="close" aria-label="${t('Cerrar editor','Close editor')}">×</button></header>
    <p>${t('Selecciona y arrastra un mueble. Flechas: ¼ de casilla. Mayús + arrastre: cámara.','Select and drag furniture. Arrow keys: ¼ tile. Shift + drag: camera.')}</p>
    <label>${t('Mueble','Furniture')}<select aria-label="${t('Seleccionar mueble','Select furniture')}"><option value="">${t('Seleccionar…','Select…')}</option></select></label>
    <div class="distribuit-coordinates"><label>${t('Columna','Column')}<input data-axis="col" type="number" step="0.25" aria-label="${t('Columna','Column')}"></label><label>${t('Fila','Row')}<input data-axis="row" type="number" step="0.25" aria-label="${t('Fila','Row')}"></label><button type="button" data-action="move">${t('Mover','Move')}</button></div>
    <div class="distribuit-arrows" aria-label="${t('Desplazar en el suelo','Move on the floor')}"><button type="button" data-step="0,-0.25" aria-label="${t('Fila anterior','Previous row')}">↑</button><button type="button" data-step="-0.25,0" aria-label="${t('Columna anterior','Previous column')}">←</button><button type="button" data-step="0,0.25" aria-label="${t('Fila siguiente','Next row')}">↓</button><button type="button" data-step="0.25,0" aria-label="${t('Columna siguiente','Next column')}">→</button><button type="button" data-action="undo">${t('Deshacer','Undo')}</button></div>
    <label class="distribuit-map"><input type="checkbox" checked> ${t('Ver mapa de dureza','Show hardness map')}</label>
    <p class="distribuit-status" role="status" aria-live="polite"></p>`;
  const canvas=dialog.querySelector('canvas'),previousLabel=canvas.getAttribute('aria-label');
  canvas.setAttribute('aria-label',t('Editor de muebles: arrastra para mover; flechas para desplazar; Escape para cancelar.','Furniture editor: drag or arrow keys to move; Escape to cancel.'));
  dialog.querySelector('.life-stage').append(host);dialog.classList.add('distribuit-open');
  const select=host.querySelector('select'),col=host.querySelector('[data-axis="col"]'),row=host.querySelector('[data-axis="row"]'),map=host.querySelector('[type="checkbox"]');
  const messages={ready:t('El suelo limita el movimiento. Guardado al soltar.','The floor limits movement. Saved on release.'),selected:t('Arrastra o usa las flechas para mover.','Drag or use the arrows to move.'),fixed:t('Este elemento está fijado a la pared o bloqueado.','This element is wall mounted or locked.'),bounds:t('No cabe dentro del espacio.','It does not fit inside the space.'),occupied:t('Ese lugar está ocupado por otro mueble.','Another piece of furniture occupies that position.'),path:t('Hay un mueble en el recorrido. Rodéalo.','Furniture blocks the path. Go around it.'),preview:t('Posición válida · suelta para guardar.','Valid position · release to save.'),saving:t('Guardando…','Saving…'),saved:t('Distribución guardada.','Layout saved.'),undone:t('Movimiento deshecho y guardado.','Move undone and saved.'),cancelled:t('Movimiento cancelado.','Move cancelled.'),saveError:t('No se pudo guardar. Se conserva la posición anterior.','Could not save. The previous position is retained.'),undoError:t('No se puede deshacer: ha cambiado el espacio o hay un obstáculo.','Cannot undo: the space changed or an obstacle intervenes.'),room:t('Ha cambiado el espacio. Cierra y vuelve a abrir Distribuit.','The space changed. Close and reopen Distribuit.'),long:t('Suelta para guardar antes de seguir moviendo.','Release to save before continuing.')};
  let controller;
  const refresh=state=>{
    const scene=bridge.read(),item=scene.layout.find(i=>String(i.id)===state.selectedId),position=state.draft?.position||item;
    select.value=state.selectedId||'';
    const fixed=item&&(isWallFurniture(item)||item.locked);
    for(const input of [col,row]){input.disabled=!item||fixed||state.busy;if(document.activeElement!==input)input.value=position?.[input.dataset.axis]??'';}
    for(const button of host.querySelectorAll('[data-step],[data-action="move"]'))button.disabled=!item||fixed||state.busy;
    host.querySelector('[data-action="undo"]').disabled=state.busy||!state.canUndo;
    host.querySelector('[data-action="close"]').disabled=state.busy;
    select.disabled=state.busy;host.dataset.status=state.notice;
    host.querySelector('.distribuit-status').textContent=fixed?messages.fixed:messages[state.notice]||state.notice;
    viewer.setEditorOverlay({scene,selectedId:state.selectedId,showMap:map.checked,candidate:state.draft?.candidate,valid:state.draft?.result.ok});
    if(controller)viewer.update(controller.decorate(viewer.snapshot));
  };
  try{controller=createDistribuitController({bridge,onChange:refresh});}catch(error){canvas.setAttribute('aria-label',previousLabel);host.remove();dialog.classList.remove('distribuit-open');throw error;}
  try{
  for(const item of bridge.read().layout){const option=document.createElement('option');option.value=String(item.id);option.textContent=(item.label||item.type)+' · '+item.id+(isWallFurniture(item)||item.locked?' 🔒':'');select.append(option);}
  const pick=id=>{controller.select(id);viewer.selectItem(id);};
  const step=(dc,dr)=>{const item=controller.selected;if(item)void controller.move({col:item.col+dc,row:item.row+dr});};
  select.onchange=()=>{pick(select.value||null);dialog.querySelector('canvas').focus();};
  host.querySelector('[data-action="close"]').onclick=onClose;
  host.querySelector('[data-action="undo"]').onclick=()=>void controller.undo();
  host.querySelector('[data-action="move"]').onclick=()=>void controller.move({col:col.value===''?NaN:Number(col.value),row:row.value===''?NaN:Number(row.value)});
  for(const button of host.querySelectorAll('[data-step]'))button.onclick=()=>step(...button.dataset.step.split(',').map(Number));
  map.onchange=()=>refresh({selectedId:controller.selected?.id,notice:'selected',busy:controller.busy,canUndo:!host.querySelector('[data-action="undo"]').disabled,draft:controller.draft});
  viewer.setEditor({onPreview:position=>controller.preview(position),onCommit:()=>void controller.commit(),onCancel:()=>controller.cancel()});
  refresh({notice:'ready',busy:false,canUndo:false});
  function keydown(event){
    if(event.key==='Escape'){event.preventDefault();if(controller.busy)return true;if(controller.draft)controller.cancel();else onClose();return true;}
    if(/^(INPUT|SELECT|TEXTAREA)$/.test(event.target.tagName))return false;
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();void controller.undo();return true;}
    const moves={ArrowLeft:[-.25,0],ArrowRight:[.25,0],ArrowUp:[0,-.25],ArrowDown:[0,.25]};
    if(moves[event.key]){event.preventDefault();step(...moves[event.key]);return true;}return false;
  }
  return {select:data=>controller.select(data?.item?.id??null),decorateSnapshot:scene=>controller.decorate(scene),keydown,
    dispose(){canvas.setAttribute('aria-label',previousLabel);viewer.setEditor(null);viewer.setEditorOverlay(null);controller.dispose();host.remove();dialog.classList.remove('distribuit-open');}};
  }catch(error){viewer.setEditor(null);viewer.setEditorOverlay(null);controller.dispose();canvas.setAttribute('aria-label',previousLabel);host.remove();dialog.classList.remove('distribuit-open');throw error;}
}
