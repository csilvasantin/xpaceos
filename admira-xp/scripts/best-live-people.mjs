import {createLifeSnapshot} from './life-snapshot.mjs';

const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
const DEFAULT_COLS=14,DEFAULT_ROWS=8;
// Four floor anchors measured on the approved mapped Best plate. They follow
// Good's (col,row) axes: back corner, right axis, left axis and front corner.
const FLOOR=Object.freeze({
  origin:[.355,.245],col:[.905,.505],row:[.085,.525],front:[.605,.925]
});

export function projectBestFloor(col,row,cols=DEFAULT_COLS,rows=DEFAULT_ROWS){
  const u=clamp(col/(Number.isFinite(cols)&&cols>0?cols:DEFAULT_COLS));
  const v=clamp(row/(Number.isFinite(rows)&&rows>0?rows:DEFAULT_ROWS));
  const blend=(index)=>(1-u)*(1-v)*FLOOR.origin[index]+u*(1-v)*FLOOR.col[index]+(1-u)*v*FLOOR.row[index]+u*v*FLOOR.front[index];
  return {x:blend(0),y:blend(1),depth:clamp((u+v)/2)};
}

function personMarkup(){
  return '<i class="best-person-shadow"></i><span class="best-person-legs"><i></i><i></i></span><span class="best-person-torso"><i class="best-person-arm left"></i><i class="best-person-arm right"></i></span><span class="best-person-head"><i></i></span>';
}

export function createBestPeopleLayer({container,getState=()=>window.__xtancoVisualState?.(),requestFrame=requestAnimationFrame,cancelFrame=cancelAnimationFrame}={}){
  if(!container)throw new Error('Best people layer requires a container');
  const snapshot=createLifeSnapshot(),people=new Map();
  const layer=document.createElement('div');layer.className='best-people-layer';layer.setAttribute('aria-hidden','true');
  const status=document.createElement('p');status.className='best-people-status';status.setAttribute('role','status');
  container.append(layer,status);
  let frame=0,lastUpdate=-Infinity,disposed=false;

  function removeMissing(active){
    for(const [id,node] of people)if(!active.has(id)){node.remove();people.delete(id);}
  }
  function update(){
    let current=null;
    try{current=snapshot(getState?.());}catch{}
    if(!current){status.textContent='Esperando la simulación del Xtanco…';removeMissing(new Set());return;}
    const active=new Set(),actors=current.actors.filter(actor=>actor&&!actor.outside&&actor.col>=-.5&&actor.row>=-.5&&actor.col<=current.cols+.5&&actor.row<=current.rows+.5);
    for(const actor of actors){
      active.add(actor.id);let node=people.get(actor.id);
      if(!node){node=document.createElement('span');node.className='best-person';node.innerHTML=personMarkup();layer.append(node);people.set(actor.id,node);}
      const point=projectBestFloor(actor.col,actor.row,current.cols,current.rows),scale=(actor.scale||1)*(.78+point.depth*.28);
      node.className=`best-person kind-${actor.kind}${actor.walking?' is-walking':''}${actor.isPlayer?' is-player':''}`;
      node.style.left=`${(point.x*100).toFixed(3)}%`;node.style.top=`${(point.y*100).toFixed(3)}%`;
      node.style.zIndex=String(10+Math.round(point.y*1000));
      node.style.setProperty('--person-scale',scale.toFixed(3));node.style.setProperty('--person-scale-x',(scale*(Math.cos(actor.heading||0)<0?-1:1)).toFixed(3));node.style.setProperty('--person-shirt',actor.color||'#4466cc');
      node.style.setProperty('--person-skin',actor.skin||'#c68642');node.style.setProperty('--person-hair',actor.hair||'#2a1500');
      node.style.setProperty('--person-pants',actor.pants||'#253446');
    }
    removeMissing(active);
    const count=actors.filter(actor=>actor.kind==='customer').length;
    status.textContent=`Personas del gemelo en movimiento · ${count} ${count===1?'cliente simulado':'clientes simulados'}`;
  }
  function tick(now){
    if(disposed)return;
    if(!document.hidden&&now-lastUpdate>=100){lastUpdate=now;update();}
    frame=requestFrame(tick);
  }
  update();frame=requestFrame(tick);
  return {update,get count(){return people.size;},dispose(){if(disposed)return;disposed=true;cancelFrame(frame);people.clear();layer.remove();status.remove();}};
}
