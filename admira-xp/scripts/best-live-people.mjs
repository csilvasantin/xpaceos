import {createLifeSnapshot} from './life-snapshot.mjs';

const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
const DEFAULT_COLS=14,DEFAULT_ROWS=8;
export const BEST_SCENE_ASSET='assets/best-xtanco-avenida-admira-framelock-20260915.png';
const platePoint=([x,y])=>[(x*1672-84)/1504,(y*941-.5)/940];

// Four floor anchors measured on the approved Best plate. They follow Good's
// (col,row) axes and therefore keep all tiers on the same canonical 14x8 room.
const FLOOR=Object.freeze({
  origin:platePoint([.355,.245]),col:platePoint([.905,.505]),row:platePoint([.085,.525]),front:platePoint([.605,.925])
});
const FLOOR_POLYGON=Object.freeze([FLOOR.origin,FLOOR.col,FLOOR.front,FLOOR.row]);

// Feet must never enter these calibrated hard footprints. They mirror the
// fixed furniture visible in the Best plate; the logical grid remains the
// authority and these zones align that grid with the photographic rendering.
export const BEST_HARDNESS_ZONES=Object.freeze([
  Object.freeze([[.086,.445],[.218,.492],[.242,.555],[.112,.520]]), // counter
  Object.freeze([[.180,.550],[.300,.600],[.325,.664],[.205,.620]]), // magazines
  Object.freeze([[.292,.594],[.392,.638],[.408,.704],[.312,.668]]), // manager desk
  Object.freeze([[.365,.545],[.515,.595],[.552,.760],[.397,.716]]), // DJ booth + body clearance
  Object.freeze([[.423,.505],[.484,.532],[.500,.612],[.438,.582]]), // central screen
  Object.freeze([[.345,.350],[.671,.473],[.695,.560],[.348,.426]]), // back fixtures
  Object.freeze([[.610,.748],[.658,.770],[.674,.858],[.620,.835]])  // turn kiosk
].map(zone=>Object.freeze(zone.map(platePoint))));

export function projectBestFloor(col,row,cols=DEFAULT_COLS,rows=DEFAULT_ROWS){
  const u=clamp(col/(Number.isFinite(cols)&&cols>0?cols:DEFAULT_COLS));
  const v=clamp(row/(Number.isFinite(rows)&&rows>0?rows:DEFAULT_ROWS));
  const blend=(index)=>(1-u)*(1-v)*FLOOR.origin[index]+u*(1-v)*FLOOR.col[index]+(1-u)*v*FLOOR.row[index]+u*v*FLOOR.front[index];
  return {x:blend(0),y:blend(1),depth:clamp((u+v)/2)};
}

function pointInPolygon(point,polygon){
  let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const [xi,yi]=polygon[i],[xj,yj]=polygon[j];
    if((yi>point.y)!==(yj>point.y)&&point.x<(xj-xi)*(point.y-yi)/(yj-yi)+xi)inside=!inside;
  }
  return inside;
}
export function isBestWalkable(point){
  return pointInPolygon(point,FLOOR_POLYGON)&&!BEST_HARDNESS_ZONES.some(zone=>pointInPolygon(point,zone));
}
export function resolveBestHardness(point){
  if(isBestWalkable(point))return point;
  let best=null;
  for(let radius=.006;radius<=.24;radius+=.006){
    for(let step=0;step<48;step++){
      const angle=step*Math.PI*2/48,candidate={x:point.x+Math.cos(angle)*radius,y:point.y+Math.sin(angle)*radius,depth:point.depth};
      if(isBestWalkable(candidate)&&(!best||Math.hypot(candidate.x-point.x,candidate.y-point.y)<best.distance))best={...candidate,distance:Math.hypot(candidate.x-point.x,candidate.y-point.y)};
    }
    if(best)return {x:best.x,y:best.y,depth:clamp((best.x+best.y)/2)};
  }
  return {x:.70,y:.66,depth:.68};
}
export function segmentCrossesBestHardness(from,to){
  if(!from||!to)return false;
  const distance=Math.hypot(to.x-from.x,to.y-from.y),steps=Math.max(2,Math.ceil(distance/.006));
  for(let i=1;i<steps;i++)if(!isBestWalkable({x:from.x+(to.x-from.x)*i/steps,y:from.y+(to.y-from.y)*i/steps}))return true;
  return false;
}

function logicalPosition(actor,scene){
  const blocked=new Set(scene.hardness?.blocked||[]),rounded=`${Math.round(actor.col)},${Math.round(actor.row)}`;
  if(!blocked.has(rounded))return {col:actor.col,row:actor.row};
  const wanted={col:Math.round(actor.col),row:Math.round(actor.row)};
  for(let radius=1;radius<=Math.max(scene.cols,scene.rows);radius++){
    let best=null;
    for(let dc=-radius;dc<=radius;dc++)for(let dr=-radius;dr<=radius;dr++){
      if(Math.max(Math.abs(dc),Math.abs(dr))!==radius)continue;
      const col=wanted.col+dc,row=wanted.row+dr;
      if(col<0||row<0||col>=scene.cols||row>=scene.rows||blocked.has(`${col},${row}`))continue;
      const score=Math.abs(dc)+Math.abs(dr);
      if(!best||score<best.score)best={col,row,score};
    }
    if(best)return best;
  }
  return null;
}

const PERSON_SPRITES=Object.freeze({
  male:'assets/best-person-male-rust-20260915.png',
  female:'assets/best-person-female-denim-20260915.png',
  childMale:'assets/best-person-child-green-20260915.png',
  childFemale:'assets/best-person-child-ochre-20260915.png'
});
const stableNumber=value=>String(value||'').split('').reduce((sum,char)=>(sum*31+char.charCodeAt(0))>>>0,17);
function isChild(actor){return actor.age==='nino'||actor.scale<.8;}
function spriteFor(actor){
  if(isChild(actor))return actor.gender==='f'?PERSON_SPRITES.childFemale:actor.gender==='m'?PERSON_SPRITES.childMale:(stableNumber(actor.id)%2?PERSON_SPRITES.childFemale:PERSON_SPRITES.childMale);
  if(actor.gender==='f')return PERSON_SPRITES.female;
  if(actor.gender==='m')return PERSON_SPRITES.male;
  return stableNumber(actor.id)%2?PERSON_SPRITES.female:PERSON_SPRITES.male;
}
function personMarkup(actor){
  return `<i class="best-person-shadow"></i><img class="best-person-sprite" src="${spriteFor(actor)}" alt="">`;
}
export function createBestPeopleLayer({container,getState=()=>window.__xtancoVisualState?.(),requestFrame=requestAnimationFrame,cancelFrame=cancelAnimationFrame}={}){
  if(!container)throw new Error('Best people layer requires a container');
  const snapshot=createLifeSnapshot(),people=new Map(),positions=new Map();
  const layer=document.createElement('div');layer.className='best-people-layer';layer.setAttribute('aria-hidden','true');
  const status=document.createElement('p');status.className='best-people-status';status.setAttribute('role','status');
  container.append(layer,status);
  let frame=0,lastUpdate=-Infinity,disposed=false;

  function removeMissing(active){
    for(const [id,node] of people)if(!active.has(id)){node.remove();people.delete(id);positions.delete(id);}
  }
  function update(){
    let current=null;
    try{current=snapshot(getState?.());}catch{}
    if(!current){status.textContent='Esperando la simulación del Xtanco…';removeMissing(new Set());return;}
    const active=new Set(),actors=current.actors.filter(actor=>actor?.kind==='customer'&&!actor.outside&&actor.col>=0&&actor.row>=0&&actor.col<current.cols&&actor.row<current.rows);
    for(const actor of actors){
      const logical=logicalPosition(actor,current);if(!logical)continue;
      active.add(actor.id);let node=people.get(actor.id);
      if(!node){node=document.createElement('span');node.className='best-person';node.innerHTML=personMarkup(actor);layer.append(node);people.set(actor.id,node);}
      const desired=projectBestFloor(logical.col,logical.row,current.cols,current.rows),point=resolveBestHardness(desired),previous=positions.get(actor.id);
      const repositioning=segmentCrossesBestHardness(previous,point),child=isChild(actor),variation=child ? .88+(stableNumber(actor.id)%9)*.02 : .96+(stableNumber(actor.id)%6)*.02;
      const scale=(actor.scale||1)*variation*(.78+point.depth*.28);
      node.className=`best-person kind-${actor.kind}${actor.walking?' is-walking':''}${actor.isPlayer?' is-player':''}${child?' is-child':''}${repositioning?' is-repositioning':''}`;
      node.style.left=`${(point.x*100).toFixed(3)}%`;node.style.top=`${(point.y*100).toFixed(3)}%`;
      node.style.zIndex=String(10+Math.round(point.y*1000));
      node.style.setProperty('--person-scale',scale.toFixed(3));node.style.setProperty('--person-scale-x',(scale*(Math.cos(actor.heading||0)<0?-1:1)).toFixed(3));node.style.setProperty('--person-shirt',actor.color||'#4466cc');
      node.style.setProperty('--person-skin',actor.skin||'#c68642');node.style.setProperty('--person-hair',actor.hair||'#2a1500');
      node.style.setProperty('--person-pants',actor.pants||'#253446');positions.set(actor.id,point);
    }
    removeMissing(active);
    const count=active.size;
    status.textContent=`Personas del gemelo en movimiento · ${count} ${count===1?'cliente simulado':'clientes simulados'} · colisiones activas`;
  }
  function tick(now){
    if(disposed)return;
    if(!document.hidden&&now-lastUpdate>=100){lastUpdate=now;update();}
    frame=requestFrame(tick);
  }
  update();frame=requestFrame(tick);
  return {update,get count(){return people.size;},dispose(){if(disposed)return;disposed=true;cancelFrame(frame);people.clear();positions.clear();layer.remove();status.remove();}};
}
