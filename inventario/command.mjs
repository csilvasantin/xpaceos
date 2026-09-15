import {loadCatalog,instancesFor} from './model.mjs?v=catalog-43';

export function parseInventoryCommand(raw){
 const text=String(raw||'').trim();
 if(!/^\/?(?:inventario|eliminar)(?:@\w+)?(?:\s|$)/i.test(text))return null;
 const body=text.replace(/^\/?inventario(?:@\w+)?\s*/i,'').trim();
 if(!body)return {action:'list'};
 if(/^deshacer$/i.test(body))return {action:'undo'};
 const match=body.match(/^\/?eliminar(?:@\w+)?\s+(?:el\s+)?([1-9]\d*)$/i);
 if(match&&Number.isSafeInteger(Number(match[1])))return {action:'remove',number:Number(match[1])};
 return {action:'help'};
}
const help='Escribe /inventario para enumerar las piezas; eliminar el 1 retira el Mostrador del Xpacio actual; /inventario deshacer recupera la última eliminación. El catálogo y sus números se conservan. Si hay varias unidades del mismo modelo, se retiran todas. Guardado en este navegador.';
const locks=new Set();
export async function executeInventoryCommand(raw,{store,space,getLayout,applyLayout,load=loadCatalog}={}){
 const cmd=parseInventoryCommand(raw);if(!cmd)return null;
 const result=(ok,message)=>({ok,local:true,kind:'inventory',message});
 if(cmd.action==='help')return result(false,help);
 try{
  const {assets}=await load();
  const layout=getLayout?.()||[];
  if(cmd.action==='list')return result(true,`INVENTARIO · ${assets.length} piezas · ${space||'sin Xpacio activo'}\n`+assets.map(a=>`${a.number}. ${a.name} · ${instancesFor(a,layout).length} en el espacio`).join('\n')+'\n\n'+help);
  if(!space||!store||!getLayout||!applyLayout)return result(false,'Abre un Xpacio antes de modificar su mobiliario.');
  if(locks.has(space))return result(false,'Hay un cambio de inventario en curso. Espera a que termine.');
  locks.add(space);
  try{
   const before=store.removals(space),next=structuredClone(before);
   let updated,message;
   if(cmd.action==='remove'){
    const asset=assets.find(a=>a.number===cmd.number);
    if(!asset)return result(false,`No existe el mueble ${cmd.number}. Consulta /inventario.`);
    const items=instancesFor(asset,getLayout());
    if(!items.length)return result(false,`${asset.number}. ${asset.name} no está colocado en este Xpacio. No se ha eliminado nada.`);
    for(const item of items)next.removed={...next.removed,[item.id]:structuredClone(item)};
    next.undo={number:asset.number,name:asset.name,items:structuredClone(items)};
    const ids=new Set(items.map(i=>i.id));updated=getLayout().filter(i=>!ids.has(i.id));
    message=`Retirado: ${asset.number}. ${asset.name} · ${items.length} unidad(es) del Xpacio ${space}. Guardado en este navegador. El catálogo conserva la pieza. Para recuperarla: /inventario deshacer.`;
   }else{
    const undo=next.undo;if(!undo?.items?.length)return result(false,'No hay ninguna eliminación que deshacer en este Xpacio.');
    const current=getLayout();if(undo.items.some(item=>current.some(i=>i.id===item.id)))return result(false,'No se puede deshacer: una pieza actual utiliza el mismo identificador. No se ha sobrescrito nada.');
    for(const item of undo.items)delete next.removed[item.id];
    updated=[...current,...undo.items];next.undo=null;
    message=`Restaurado: ${undo.number}. ${undo.name} · ${undo.items.length} unidad(es), con su posición original en ${space}.`;
   }
   // Persist the intent before touching the live scene. Roll back on adapter failure.
   store.writeRemovals(space,next);
   try{await applyLayout(updated);}catch(error){store.writeRemovals(space,before);throw error;}
   store.publish(space,updated);store.notify(space);
   return result(true,message);
  }finally{locks.delete(space);}
 }catch{return result(false,'No se pudo guardar el cambio o cargar el inventario. Comprueba el almacenamiento del navegador y vuelve a intentarlo.');}
}
