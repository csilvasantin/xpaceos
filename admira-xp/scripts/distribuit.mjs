import {furnitureBounds,isSolidFurniture,isWallFurniture} from './furniture-geometry.mjs';
const EPS=1e-7;
const overlap=(a,b)=>a.minCol<b.maxCol-EPS&&a.maxCol>b.minCol+EPS&&a.minRow<b.maxRow-EPS&&a.maxRow>b.minRow+EPS;
const area=(a,b)=>Math.max(0,Math.min(a.maxCol,b.maxCol)-Math.max(a.minCol,b.minCol))*Math.max(0,Math.min(a.maxRow,b.maxRow)-Math.max(a.minRow,b.minRow));
function sweptOverlap(start,end,box){
  const dx=end.minCol-start.minCol,dz=end.minRow-start.minRow;
  let lo=0,hi=1;
  for(const [delta,min,max,bmin,bmax] of [[dx,start.minCol,start.maxCol,box.minCol,box.maxCol],[dz,start.minRow,start.maxRow,box.minRow,box.maxRow]]){
    if(Math.abs(delta)<EPS){if(max<=bmin+EPS||min>=bmax-EPS)return false;}
    else{const t1=(bmin+EPS-max)/delta,t2=(bmax-EPS-min)/delta;lo=Math.max(lo,Math.min(t1,t2));hi=Math.min(hi,Math.max(t1,t2));if(lo>=hi)return false;}
  }
  return lo<hi&&hi>0&&lo<1;
}
export function validateFurnitureMove(scene,id,destination,{from,swept=true}={}){
  const item=scene?.layout?.find(value=>String(value.id)===String(id));
  if(!item)return {ok:false,reason:'missing'};
  if(isWallFurniture(item)||item.locked===true)return {ok:false,reason:'fixed'};
  if(!Number.isFinite(destination?.col)||!Number.isFinite(destination?.row))return {ok:false,reason:'invalid'};
  const next={...item,col:destination.col,row:destination.row},end=furnitureBounds(next,scene.footprints);
  if(end.minCol<-EPS||end.minRow<-EPS||end.maxCol>scene.cols+EPS||end.maxRow>scene.rows+EPS)return {ok:false,reason:'bounds',bounds:end};
  const start=furnitureBounds({...item,...from},scene.footprints);
  const obstacles=scene.layout.filter(other=>String(other.id)!==String(id)&&isSolidFurniture(other)).map(other=>furnitureBounds(other,scene.footprints));
  for(const cell of scene.hardness?.fixed||[]){
    const [col,row]=String(cell).split(',').map(Number);if(Number.isFinite(col)&&Number.isFinite(row))obstacles.push({id:'hardness:'+cell,minCol:col,maxCol:col+1,minRow:row,maxRow:row+1});
  }
  for(const obstacle of obstacles){
    if(overlap(end,obstacle))return {ok:false,reason:'occupied',obstacle:obstacle.id,bounds:end};
    // Existing legacy layouts can contain intersecting pieces. Permit a safe
    // escape that reduces their overlap, without allowing a new intersection.
    const escaping=overlap(start,obstacle)&&area(end,obstacle)<area(start,obstacle)
      &&(end.minCol-start.minCol)*(start.minCol+start.maxCol-obstacle.minCol-obstacle.maxCol)>=-EPS
      &&(end.minRow-start.minRow)*(start.minRow+start.maxRow-obstacle.minRow-obstacle.maxRow)>=-EPS;
    if(swept&&sweptOverlap(start,end,obstacle)&&!escaping)return {ok:false,reason:'path',obstacle:obstacle.id,bounds:end};
  }
  return {ok:true,position:{col:destination.col,row:destination.row},bounds:end};
}
export function validateFurniturePath(scene,id,path){
  const item=scene?.layout?.find(value=>String(value.id)===String(id));
  if(!item||!Array.isArray(path)||!path.length||path.length>4096)return {ok:false,reason:'invalid'};
  let from={col:item.col,row:item.row},result;
  for(const point of path){result=validateFurnitureMove(scene,id,point,{from});if(!result.ok)return result;from=point;}
  return result;
}
export function parseDistribuitCommand(text){
  const match=String(text||'').trim().match(/^\/?(?:cli\s+)?(?:distribuit|distribute)(?:\s+(off|close|cerrar|salir|on))?$/i);
  return match?{close:/^(off|close|cerrar|salir)$/i.test(match[1]||'')}:null;
}
export async function executeDistribuitCommand(text,{router,open,close,lang='es'}={}){
  const parsed=parseDistribuitCommand(text);if(!parsed)return null;
  if(parsed.close){close?.();return {ok:true,local:true,kind:'distribuit',message:lang==='en'?'Distribuit closed.':'Distribuit cerrado.'};}
  const ready=await router?.choose('better');
  if(!ready?.ok||ready.mode!=='better')return {ok:false,local:true,kind:'distribuit',message:lang==='en'?'Better could not open for editing.':'No se pudo abrir Better para editar.'};
  const started=await open?.();
  return {ok:!!started,local:true,kind:'distribuit',message:lang==='en'?(started?'Distribuit · select furniture and drag it.':'The furniture editor is unavailable.'):(started?'Distribuit · selecciona un mueble y arrástralo.':'El editor de muebles no está disponible.')};
}
