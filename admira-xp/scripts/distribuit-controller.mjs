import {validateFurnitureMove} from './distribuit.mjs';
import {isWallFurniture} from './furniture-geometry.mjs';

// Preview is private to Better. Only a validated, completed gesture is saved.
export function createDistribuitController({bridge,onChange=()=>{}}={}){
  const token=bridge.begin(),roomId=bridge.read().roomId;
  let selectedId=null,draft=null,busy=false,disposed=false,notice='ready';
  const history=[];
  const read=()=>{const scene=bridge.read();if(scene.roomId!==roomId||!scene.active)throw Error('room');return scene;};
  const emit=()=>{if(!disposed)onChange({selectedId,draft,busy,notice,canUndo:history.length>0});};
  function select(id){if(busy||disposed)return;draft=null;selectedId=id==null?null:String(id);notice='selected';emit();}
  function preview(position){
    if(busy||disposed||!selectedId)return {ok:false,reason:'busy'};
    try{
      const scene=read(),item=scene.layout.find(i=>String(i.id)===selectedId);
      if(!item)return {ok:false,reason:'missing'};
      const origin={col:item.col,row:item.row};
      if(!draft)draft={id:selectedId,origin,position:origin,path:[],candidate:origin,result:{ok:true}};
      const result=validateFurnitureMove(scene,selectedId,position,{from:draft.position});
      draft.candidate=position;draft.result=result;
      if(result.ok&&(position.col!==draft.position.col||position.row!==draft.position.row)){
        if(draft.path.length>=4096){notice='long';emit();return {ok:false,reason:'long'};}
        draft.position={...position};draft.path.push({...position});
      }
      notice=result.ok?'preview':result.reason;emit();return result;
    }catch{notice='room';emit();return {ok:false,reason:'room'};}
  }
  function cancel(){if(busy||disposed)return;draft=null;notice='cancelled';emit();}
  async function commit(){
    if(busy||disposed||!draft?.path.length){if(!busy){draft=null;emit();}return false;}
    const movement=draft;busy=true;notice='saving';emit();
    try{
      read();
      await bridge.commit({roomId,id:movement.id,from:movement.origin,...movement.position,path:movement.path});
      history.push(movement);if(history.length>50)history.shift();draft=null;notice='saved';return true;
    }catch(error){draft=null;notice=error.message==='room'?'room':'saveError';return false;}
    finally{busy=false;emit();}
  }
  async function move(position){const result=preview(position);if(!result.ok){draft=null;emit();return false;}return commit();}
  async function undo(){
    if(busy||disposed||!history.length)return false;draft=null;
    const movement=history.at(-1);busy=true;notice='saving';emit();
    try{
      read();const path=[...movement.path.slice(0,-1).reverse(),movement.origin];
      await bridge.commit({roomId,id:movement.id,from:movement.position,...movement.origin,path});
      history.pop();selectedId=movement.id;notice='undone';return true;
    }catch{notice='undoError';return false;}finally{busy=false;emit();}
  }
  function decorate(scene){
    if(disposed)return scene;
    return {...scene,editor:true,actors:[],layout:scene.layout.map(i=>draft&&String(i.id)===draft.id?{...i,...draft.position}:i)};
  }
  function dispose(){if(disposed)return;disposed=true;draft=null;bridge.end(token);}
  return {select,preview,commit,move,undo,cancel,decorate,dispose,read,
    get selected(){return read().layout.find(i=>String(i.id)===selectedId)||null;},
    get movable(){const item=this.selected;return !!item&&!isWallFurniture(item)&&!item.locked;},
    get busy(){return busy;},get draft(){return draft;}};
}
