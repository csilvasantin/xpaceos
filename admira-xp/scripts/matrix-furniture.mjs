import {createLifeSnapshot} from './life-snapshot.mjs?v=visitors-24';
import {assetForInstance} from '../../inventario/model.mjs?v=catalog-43';
import {projectMatrixFloor} from './matrix-floor.mjs?v=matrix-furniture-1';
import {MATRIX_ATLAS_URL,MATRIX_ATLAS_SIZE,MATRIX_ARCHITECTURE_DETAILS,photoPieceFor} from './matrix-photo-pieces.mjs?v=matrix-furniture-1';

const MANIFEST_URL=new URL('../assets/matrix-furniture/catalog/manifest.json',import.meta.url);
const SVG='http://www.w3.org/2000/svg';
const [AW,AH]=MATRIX_ATLAS_SIZE;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const finite=(n,fallback)=>Number.isFinite(n)?n:fallback;
let sequence=0,assetsPromise;

function loadImage(url){return new Promise((resolve,reject)=>{
  const image=new Image();const timer=setTimeout(()=>finish(Error('Tiempo de carga agotado')),25000);
  function finish(error){clearTimeout(timer);image.onload=null;image.onerror=null;error?reject(error):resolve(image);}
  image.onload=()=>finish();image.onerror=()=>finish(Error('Imagen no disponible'));image.src=url;
});}
function loadAssets(){
  assetsPromise ||= Promise.all([
    fetch(MANIFEST_URL,{signal:AbortSignal.timeout(25000)}).then(r=>{if(!r.ok)throw Error('Catálogo Matrix no disponible');return r.json();}),
    loadImage(MATRIX_ATLAS_URL)
  ]).then(([catalog])=>{
    if(!Array.isArray(catalog.items)||catalog.items.length!==43)throw Error('Catálogo Matrix incompleto');
    return catalog;
  }).catch(error=>{assetsPromise=null;throw error;});
  return assetsPromise;
}

function bounds(polygons){
  const points=polygons.flat(),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  const x=Math.min(...xs),y=Math.min(...ys);return {x,y,width:Math.max(...xs)-x,height:Math.max(...ys)-y};
}
function rotation(item){return ((Math.round(finite(item.rot,0))%4)+4)%4;}
function scale(item){return {x:clamp(Math.abs(finite(item.sx,1)),.1,6),y:clamp(Math.abs(finite(item.sy,1)),.1,6)};}
function anchorFor(item,photo,scene){
  const actual=projectMatrixFloor(item.col,item.row,scene.cols,scene.rows);
  if(!photo?.wall)return actual;
  // Wall cutouts keep their mounting height while following layout changes.
  const original=projectMatrixFloor(photo.base[0],photo.base[1],scene.cols,scene.rows);
  return {x:actual.x+photo.target[0]-original.x,y:actual.y+photo.target[1]-original.y,depth:actual.depth};
}

/** Pure, read-only presentation plan. IDs stay instance IDs, not array indices. */
export function planMatrixFurniture(scene,catalog){
  if(!scene)return [];
  const byIdentity=new Map(catalog.items.map(p=>[p.inventoryId,p]));
  const placements=[];
  for(const item of scene.layout||[]){
    if(!item||!Number.isFinite(item.col)||!Number.isFinite(item.row))continue;
    const record=byIdentity.get(assetForInstance(item));
    if(!record){placements.push({id:item.id,number:null,label:item.label||item.type,unsupported:true});continue;}
    const rot=rotation(item),photo=rot===0?photoPieceFor(item,record.number):null;
    const anchor=anchorFor(item,photo,scene),s=scale(item);
    const common={id:String(item.id),number:record.number,label:item.label||record.name||`Mueble ${record.number}`,anchor,
      flip:!!item.flipX,sx:s.x,sy:s.y,wall:!!photo?.wall||['led','tft','aroma'].includes(item.type),item};
    if(photo){
      const box=bounds(photo.polygons),factor=photo.scale;
      placements.push({...common,kind:'photo',photo,box,
        left:anchor.x-(photo.anchor[0]-box.x)/AW*factor,
        top:anchor.y-(photo.anchor[1]-box.y)/AH*factor,
        width:box.width/AW*factor,height:box.height/AH*factor,
        origin:[(photo.anchor[0]-box.x)/box.width,(photo.anchor[1]-box.y)/box.height]});
    }else{
      const view=record.views.find(v=>v.rotation===rot);
      if(!view){placements.push({...common,unsupported:true});continue;}
      const origin=projectMatrixFloor(0,0,scene.cols,scene.rows),col=projectMatrixFloor(1,0,scene.cols,scene.rows);
      const targetPixelsPerUnit=Math.abs(col.x-origin.x)*AW*Math.SQRT2;
      // Pixeria stores the intended display height in the shared scene. Its
      // Blender source uses a normalized model height, so restore that scale.
      const modelHeight=record.bounds_gltf?.max?.[1]-record.bounds_gltf?.min?.[1];
      const customScale=item.type==='custom'&&Number.isFinite(item.ph)&&modelHeight>0?clamp(item.ph/modelHeight,.1,6):1;
      const factor=targetPixelsPerUnit/view.pixelsPerGridUnit*customScale;
      const ay=anchor.y-(common.wall?finite(item.wallY,1.8)*targetPixelsPerUnit/AH:0);
      const url=new URL(view.url,new URL('../',import.meta.url)).href;
      placements.push({...common,kind:'sprite',view,url,
        left:anchor.x-view.anchor[0]/AW*factor,top:ay-view.anchor[1]/AH*factor,
        width:view.width/AW*factor,height:view.height/AH*factor,
        origin:[view.anchor[0]/view.width,view.anchor[1]/view.height]});
    }
  }
  return placements;
}

export function placementZone(p){
  if(p.unsupported||p.wall)return null;
  const x=p.anchor.x,y=p.anchor.y,w=Math.max(.015,p.width*.60*p.sx),h=Math.max(.012,Math.min(.06,p.height*.12*p.sy));
  return [[x-w*.5,y-h],[x+w*.5,y-h*.5],[x+w*.4,y+h*.2],[x-w*.4,y+h*.2]];
}
function photoContent(photo,box,prefix){
  const svg=document.createElementNS(SVG,'svg');svg.setAttribute('viewBox',`${box.x} ${box.y} ${box.width} ${box.height}`);svg.setAttribute('aria-hidden','true');
  const defs=document.createElementNS(SVG,'defs'),clip=document.createElementNS(SVG,'clipPath');clip.id=prefix;
  for(const points of photo.polygons){const polygon=document.createElementNS(SVG,'polygon');polygon.setAttribute('points',points.map(p=>p.join(',')).join(' '));clip.append(polygon);}
  defs.append(clip);svg.append(defs);
  const image=document.createElementNS(SVG,'image');image.setAttribute('href',MATRIX_ATLAS_URL);image.setAttribute('width',AW);image.setAttribute('height',AH);image.setAttribute('preserveAspectRatio','none');image.setAttribute('clip-path',`url(#${prefix})`);svg.append(image);return svg;
}
function applyPlacement(node,p){
  Object.assign(node.style,{left:`${p.left*100}%`,top:`${p.top*100}%`,width:`${p.width*100}%`,height:`${p.height*100}%`,
    transformOrigin:`${p.origin[0]*100}% ${p.origin[1]*100}%`,transform:`scale(${p.sx*(p.flip?-1:1)},${p.sy})`,zIndex:String(10+Math.round(p.anchor.y*1000))});
}

export function mountMatrixFurniture(container,{getState=()=>window.__xtancoVisualState?.(),requestFrame=requestAnimationFrame,cancelFrame=cancelAnimationFrame,onReady=()=>{},onSelect=()=>{},load=loadAssets}={}){
  if(!container)throw Error('Falta el contenedor Matrix');
  const snapshot=createLifeSnapshot(),nodes=new Map(),prefix=`matrix-furniture-${++sequence}`,layer=document.createElement('div'),status=document.createElement('p');
  layer.className='matrix-furniture-layer';status.className='matrix-furniture-status';status.setAttribute('role','status');status.textContent='Preparando el mobiliario de Matrix…';container.append(layer,status);
  let catalog,disposed=false,frame=0,last=-Infinity,reported=false,selected=null,zones=[],count=0;
  const decorators=[];
  function report(error=''){if(disposed||reported)return;reported=true;onReady(error);}
  function select(p){selected=p.id;onSelect({id:p.id,number:p.number,label:p.label});}
  function updateStatus(){
    const entries=[...nodes.values()],failed=entries.filter(n=>n.failed).length,loading=entries.filter(n=>!n.loaded&&!n.failed).length;
    count=entries.filter(n=>n.loaded).length;
    zones=entries.filter(n=>n.loaded&&!n.failed).map(n=>placementZone(n.current)).filter(Boolean);
    status.textContent=`MATRIX · ${count} muebles visibles · inventario compartido${loading?` · ${loading} cargando`:''}${failed?` · ${failed} sin representación`:''}`;
    if(!loading)report(failed?'No se han podido cargar todos los muebles de Matrix.':'');
  }
  function update(){
    if(disposed||!catalog)return;
    let scene;try{scene=snapshot(getState?.());}catch{}
    if(!scene){for(const entry of nodes.values())entry.node?.remove();nodes.clear();zones=[];count=0;for(const node of decorators)node.hidden=true;if(selected!==null){selected=null;onSelect(null);}status.textContent='Esperando al Xtanco para mostrar su inventario…';return;}
    const plan=planMatrixFurniture(scene,catalog),active=new Set(plan.map(p=>p.id));zones=plan.map(placementZone).filter(Boolean);
    for(const [id,entry]of nodes)if(!active.has(id)){entry.node?.remove();nodes.delete(id);if(selected===id){selected=null;onSelect(null);}}
    for(const p of plan){
      const signature=p.unsupported?'unsupported':p.kind==='photo'?`photo:${p.number}:${p.photo===photoPieceFor({id:'plant3'},9)?'plant3':'base'}`:`sprite:${p.url}`;
      let entry=nodes.get(p.id);
      if(entry&&entry.signature!==signature){entry.node?.remove();nodes.delete(p.id);entry=null;}
      if(!entry){
        entry={signature,loaded:false,failed:!!p.unsupported,node:null,current:p};nodes.set(p.id,entry);
        if(p.unsupported)continue;
        const node=document.createElement('button');node.type='button';node.className='matrix-furniture-item';node.dataset.inventoryNumber=String(p.number);node.dataset.instanceId=p.id;
        node.setAttribute('aria-label',`${p.number}. ${p.label}`);node.title=`${p.number}. ${p.label}`;node.addEventListener('click',event=>{event.stopPropagation();select(entry.current);});
        if(p.kind==='photo'){node.append(photoContent(p.photo,p.box,`${prefix}-${++sequence}`));entry.loaded=true;}
        else{
          const image=document.createElement('img');image.alt='';image.draggable=false;
          const own=entry;
          image.onload=()=>{if(disposed||nodes.get(p.id)!==own)return;own.loaded=true;updateStatus();};
          image.onerror=()=>{if(disposed||nodes.get(p.id)!==own)return;own.failed=true;node.hidden=true;updateStatus();};image.src=p.url;node.append(image);
        }
        entry.node=node;layer.append(node);
      }
      entry.current=p;if(entry.node){entry.node.setAttribute('aria-label',`${p.number}. ${p.label}`);entry.node.title=`${p.number}. ${p.label}`;applyPlacement(entry.node,p);}
    }
    if(!decorators.length){
      for(const photo of MATRIX_ARCHITECTURE_DETAILS){const box=bounds(photo.polygons),node=document.createElement('div');node.className='matrix-furniture-item matrix-architecture-detail';node.append(photoContent(photo,box,`${prefix}-detail-${++sequence}`));
        applyPlacement(node,{anchor:{x:photo.target[0],y:photo.target[1]},left:photo.target[0]-(photo.anchor[0]-box.x)/AW*photo.scale,top:photo.target[1]-(photo.anchor[1]-box.y)/AH*photo.scale,width:box.width/AW*photo.scale,height:box.height/AH*photo.scale,origin:[(photo.anchor[0]-box.x)/box.width,(photo.anchor[1]-box.y)/box.height],sx:1,sy:1});node.style.pointerEvents='none';layer.append(node);decorators.push(node);}
    }
    for(const node of decorators)node.hidden=scene.moving;
    updateStatus();
  }
  function tick(now){if(disposed)return;if(!document.hidden&&now-last>=100){last=now;update();}frame=requestFrame(tick);}
  Promise.resolve().then(load).then(value=>{if(disposed)return;catalog=value;update();frame=requestFrame(tick);},()=>{if(disposed)return;status.textContent='No se ha podido cargar el mobiliario Matrix. Cambia de vista y reintenta.';report('No se ha podido cargar el mobiliario Matrix.');});
  return {update,get count(){return count;},get zones(){return zones;},dispose(){if(disposed)return;disposed=true;cancelFrame(frame);for(const e of nodes.values()){const img=e.node?.querySelector('img');if(img){img.onload=null;img.onerror=null;}}nodes.clear();zones=[];count=0;if(selected!==null){selected=null;onSelect(null);}layer.remove();status.remove();}};
}
