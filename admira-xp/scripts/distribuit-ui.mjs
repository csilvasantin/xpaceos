import {createDistribuitController} from './distribuit-controller.mjs?v=distribuir-2';
import {furniturePose,SCALE_LIMITS} from './distribuit.mjs?v=distribuir-2';
import {isWallFurniture} from './furniture-geometry.mjs';

export function mountDistribuit({dialog,viewer,bridge,onClose=()=>{}}){
  const en=document.documentElement.lang==='en',t=(es,english)=>en?english:es;
  const host=document.createElement('aside');host.className='distribuit-panel';host.setAttribute('aria-label',t('Distribuir','Distribute'));
  host.innerHTML=`<header><strong>${t('Distribuir','Distribute')} · 16 bits</strong><button type="button" data-action="close" aria-label="${t('Cerrar editor','Close editor')}">×</button></header>
    <p>${t('Selecciona y arrastra un mueble. Flechas: ¼ de casilla. Mayús + arrastre: cámara.','Select and drag furniture. Arrow keys: ¼ tile. Shift + drag: camera.')}</p>
    <label>${t('Mueble','Furniture')}<select aria-label="${t('Seleccionar mueble','Select furniture')}"><option value="">${t('Seleccionar…','Select…')}</option></select></label>
    <div class="distribuit-coordinates"><label>${t('Columna','Column')}<input data-axis="col" type="number" step="0.25" aria-label="${t('Columna','Column')}"></label><label>${t('Fila','Row')}<input data-axis="row" type="number" step="0.25" aria-label="${t('Fila','Row')}"></label><button type="button" data-action="move">${t('Mover','Move')}</button></div>
    <div class="distribuit-arrows" aria-label="${t('Desplazar en el suelo','Move on the floor')}"><button type="button" data-step="0,-0.25" aria-label="${t('Fila anterior','Previous row')}">↑</button><button type="button" data-step="-0.25,0" aria-label="${t('Columna anterior','Previous column')}">←</button><button type="button" data-step="0,0.25" aria-label="${t('Fila siguiente','Next row')}">↓</button><button type="button" data-step="0.25,0" aria-label="${t('Columna siguiente','Next column')}">→</button><button type="button" data-action="undo">${t('Deshacer','Undo')}</button></div>
    <div class="distribuit-transform"><span>${t('Girar','Rotate')}</span><button type="button" data-turn="-1" aria-label="${t('Girar 90 grados a la izquierda','Rotate 90 degrees left')}">↶ 90°</button><output data-rotation>0°</output><button type="button" data-turn="1" aria-label="${t('Girar 90 grados a la derecha','Rotate 90 degrees right')}">↷ 90°</button></div>
    <div class="distribuit-transform"><label for="distribuit-scale">${t('Escala','Scale')}</label><button type="button" data-scale="-10" aria-label="${t('Reducir escala','Decrease scale')}">−</button><input id="distribuit-scale" type="number" min="25" max="300" step="10" aria-label="${t('Escala en porcentaje','Scale percent')}"><span>%</span><button type="button" data-scale="10" aria-label="${t('Aumentar escala','Increase scale')}">+</button></div>
    <label class="distribuit-map"><input type="checkbox" checked> ${t('Ver mapa de dureza','Show hardness map')}</label>
    <p class="distribuit-status" role="status" aria-live="polite"></p>`;
  const canvas=dialog.querySelector('canvas'),previousLabel=canvas.getAttribute('aria-label');
  canvas.setAttribute('aria-label',t('Editor de muebles: arrastra para mover; flechas para desplazar; Escape para cancelar.','Furniture editor: drag or arrow keys to move; Escape to cancel.'));
  dialog.querySelector('.life-stage').append(host);dialog.classList.add('distribuit-open');
  const scale=host.querySelector('#distribuit-scale'),rotation=host.querySelector('[data-rotation]');
  const select=host.querySelector('select'),col=host.querySelector('[data-axis="col"]'),row=host.querySelector('[data-axis="row"]'),map=host.querySelector('[type="checkbox"]');
  const messages={invalid:t('Introduce valores numéricos válidos.','Enter valid numeric values.'),scale:t('La escala debe estar entre 25% y 300%.','Scale must be between 25% and 300%.'),ready:t('Mover, girar y escalar respetan el suelo y los muebles.','Move, rotate and scale respect the floor and furniture.'),selected:t('Arrastra, gira o escala. Giro sobre el punto de origen.','Drag, rotate or scale. Rotation uses the furniture origin.'),fixed:t('Este elemento está fijado a la pared o bloqueado.','This element is wall mounted or locked.'),bounds:t('No cabe dentro del espacio.','It does not fit inside the space.'),occupied:t('Ese lugar está ocupado por otro mueble.','Another piece of furniture occupies that position.'),path:t('Hay un mueble en el recorrido. Rodéalo.','Furniture blocks the path. Go around it.'),preview:t('Posición válida · suelta para guardar.','Valid position · release to save.'),saving:t('Guardando…','Saving…'),saved:t('Distribución guardada.','Layout saved.'),undone:t('Cambio deshecho y guardado.','Change undone and saved.'),cancelled:t('Movimiento cancelado.','Move cancelled.'),saveError:t('No se pudo guardar. Se conserva la posición anterior.','Could not save. The previous position is retained.'),undoError:t('No se puede deshacer: ha cambiado el espacio o hay un obstáculo.','Cannot undo: the space changed or an obstacle intervenes.'),room:t('Ha cambiado el espacio. Cierra y vuelve a abrir Distribuir.','The space changed. Close and reopen Distribute.'),long:t('Suelta para guardar antes de seguir moviendo.','Release to save before continuing.')};
  let controller;
  const refresh=state=>{
    const scene=bridge.read(),item=scene.layout.find(i=>String(i.id)===state.selectedId),position=state.draft?.position||item;
    select.value=state.selectedId||'';
    const fixed=item&&(isWallFurniture(item)||item.locked);
    for(const input of [col,row]){input.disabled=!item||fixed||state.busy;if(document.activeElement!==input)input.value=position?.[input.dataset.axis]??'';}
    for(const button of host.querySelectorAll('[data-step],[data-turn],[data-scale],[data-action="move"]'))button.disabled=!item||fixed||state.busy;
    scale.disabled=!item||fixed||state.busy;if(document.activeElement!==scale||(!state.busy&&!state.draft))scale.value=position?Math.round((position.sx??1)*10000)/100:'';
    rotation.textContent=position?(((position.rot??0)%4+4)%4)*90+'°':'—';
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
  for(const button of host.querySelectorAll('[data-turn]'))button.onclick=()=>{const item=controller.selected;if(item)void controller.move({rot:((item.rot??0)+Number(button.dataset.turn)+4)%4});};
  const resize=percent=>{
    const item=controller.selected;if(!item)return;
    const pose=furniturePose(item),sx=percent/100;
    void controller.move({sx,sy:pose.sy*sx/pose.sx});
  };
  scale.onchange=()=>resize(scale.value===''?NaN:Number(scale.value));
  scale.onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();resize(scale.value===''?NaN:Number(scale.value));}};
  for(const button of host.querySelectorAll('[data-scale]'))button.onclick=()=>{const item=controller.selected;if(item)resize(Math.max(SCALE_LIMITS.min*100,Math.min(SCALE_LIMITS.max*100,Math.round((item.sx??1)*100)+Number(button.dataset.scale))));};
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
