import {createLifeSnapshot} from './life-snapshot.mjs?v=visitors-24';
import {visitorProfileById} from './visitor-profiles.mjs?v=visitors-24';

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
export function isBestWalkable(point,zones=BEST_HARDNESS_ZONES,floorPolygon=FLOOR_POLYGON){
  return pointInPolygon(point,floorPolygon)&&!zones.some(zone=>pointInPolygon(point,zone));
}
export function resolveBestHardness(point,zones=BEST_HARDNESS_ZONES,floorPolygon=FLOOR_POLYGON){
  if(isBestWalkable(point,zones,floorPolygon))return point;
  let best=null;
  for(let radius=.006;radius<=.24;radius+=.006){
    for(let step=0;step<48;step++){
      const angle=step*Math.PI*2/48,candidate={x:point.x+Math.cos(angle)*radius,y:point.y+Math.sin(angle)*radius,depth:point.depth};
      if(isBestWalkable(candidate,zones,floorPolygon)&&(!best||Math.hypot(candidate.x-point.x,candidate.y-point.y)<best.distance))best={...candidate,distance:Math.hypot(candidate.x-point.x,candidate.y-point.y)};
    }
    if(best)return {x:best.x,y:best.y,depth:clamp((best.x+best.y)/2)};
  }
  // Preserve the approved fixed plate fallback for existing callers. A custom
  // room must never fall back to a coordinate from another photographic room.
  if(floorPolygon===FLOOR_POLYGON)return {x:.70,y:.66,depth:.68};
  const center={x:floorPolygon.reduce((sum,p)=>sum+p[0],0)/floorPolygon.length,y:floorPolygon.reduce((sum,p)=>sum+p[1],0)/floorPolygon.length,depth:point.depth};
  if(isBestWalkable(center,zones,floorPolygon))return center;
  const minX=Math.min(...floorPolygon.map(p=>p[0])),maxX=Math.max(...floorPolygon.map(p=>p[0]));
  const minY=Math.min(...floorPolygon.map(p=>p[1])),maxY=Math.max(...floorPolygon.map(p=>p[1]));
  for(let row=1;row<40;row++)for(let col=1;col<40;col++){
    const candidate={x:minX+(maxX-minX)*col/40,y:minY+(maxY-minY)*row/40,depth:point.depth};
    if(isBestWalkable(candidate,zones,floorPolygon))return candidate;
  }
  return center;
}
export function segmentCrossesBestHardness(from,to,zones=BEST_HARDNESS_ZONES,floorPolygon=FLOOR_POLYGON){
  if(!from||!to)return false;
  const distance=Math.hypot(to.x-from.x,to.y-from.y),steps=Math.max(2,Math.ceil(distance/.006));
  for(let i=1;i<steps;i++)if(!isBestWalkable({x:from.x+(to.x-from.x)*i/steps,y:from.y+(to.y-from.y)*i/steps},zones,floorPolygon))return true;
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
function isChild(actor){return ['nino','child'].includes(actor.age)||actor.scale<.8;}
function spriteFor(actor){
  if(isChild(actor))return actor.gender==='f'?PERSON_SPRITES.childFemale:actor.gender==='m'?PERSON_SPRITES.childMale:(stableNumber(actor.id)%2?PERSON_SPRITES.childFemale:PERSON_SPRITES.childMale);
  if(actor.gender==='f')return PERSON_SPRITES.female;
  if(actor.gender==='m')return PERSON_SPRITES.male;
  return stableNumber(actor.id)%2?PERSON_SPRITES.female:PERSON_SPRITES.male;
}
function profileFor(actor){
  if(typeof actor.visitorProfileId!=='string')return null;
  const profile=visitorProfileById(actor.visitorProfileId),sprite=profile?.sprite;
  if(!sprite||typeof sprite.atlas!=='string'||!sprite.atlas
    ||![sprite.column,sprite.row,sprite.columns,sprite.rows].every(Number.isInteger)
    ||sprite.columns<=0||sprite.rows<=0||sprite.column<0||sprite.row<0
    ||sprite.column>=sprite.columns||sprite.row>=sprite.rows)return null;
  return profile;
}
function cropFor(sprite){
  const crop=sprite?.crop;
  if(!Array.isArray(crop)||crop.length!==4||!crop.every(Number.isFinite)
    ||!Number.isFinite(sprite.atlasWidth)||!Number.isFinite(sprite.atlasHeight))return null;
  const [x,y,width,height]=crop;
  return x>=0&&y>=0&&width>0&&height>0&&x+width<=sprite.atlasWidth&&y+height<=sprite.atlasHeight?crop:null;
}
// Dynamic furniture presentations supply their currently visible footprints.
// Missing/failed dynamic data adds no photographic obstacle: the simulation's
// logical hardness still applies, and an old photo must not resurrect furniture
// that the user has removed. Callers without this option retain the fixed plate.
function furnitureZones(getFurnitureZones,scene){
  if(typeof getFurnitureZones!=='function')return BEST_HARDNESS_ZONES;
  try{
    const zones=getFurnitureZones(scene);
    return Array.isArray(zones)?zones.filter(zone=>Array.isArray(zone)&&zone.length>=3
      &&zone.every(point=>Array.isArray(point)&&point.length>=2&&Number.isFinite(point[0])&&Number.isFinite(point[1]))):[];
  }catch{return [];}
}
export function createBestPeopleLayer({container,getState=()=>window.__xtancoVisualState?.(),getFurnitureZones,projectFloor=projectBestFloor,floorPolygon=FLOOR_POLYGON,requestFrame=requestAnimationFrame,cancelFrame=cancelAnimationFrame}={}){
  if(!container)throw new Error('Best people layer requires a container');
  const snapshot=createLifeSnapshot(),people=new Map(),positions=new Map(),appearances=new Map();
  const layer=document.createElement('div');layer.className='best-people-layer';layer.setAttribute('aria-hidden','true');
  const status=document.createElement('p');status.className='best-people-status';status.setAttribute('role','status');
  container.append(layer,status);
  let frame=0,lastUpdate=-Infinity,disposed=false;

  function refreshStatus(){
    if(disposed)return;
    const count=people.size,visible=[...appearances.values()].filter(appearance=>appearance.ready);
    const distinct=new Set(visible.map(appearance=>appearance.displayedProfileId)).size;
    const loading=[...appearances.values()].filter(appearance=>!appearance.ready&&!appearance.failed).length;
    const fallback=visible.filter(appearance=>appearance.fallback).length;
    const failed=[...appearances.values()].filter(appearance=>appearance.failed).length;
    status.textContent=`Personas del gemelo en movimiento · ${count} ${count===1?'cliente simulado':'clientes simulados'} · ${distinct} ${distinct===1?'perfil distinto':'perfiles distintos'}${loading?` · ${loading} cargando`:''}${fallback?` · ${fallback} con imagen de reserva`:''}${failed?` · ${failed} sin imagen`:''} · colisiones activas`;
    status.setAttribute('data-distinct-profiles',String(distinct));
    status.setAttribute('data-fallback-count',String(fallback));
  }
  function cleanupAppearance(id){
    const appearance=appearances.get(id);
    if(!appearance)return;
    appearance.image.onload=null;appearance.image.onerror=null;
    appearance.visual.remove();appearances.delete(id);
  }
  function updateAppearance(node,actor){
    const profile=profileFor(actor),sprite=profile?.sprite,crop=cropFor(sprite);
    const legacy=spriteFor(actor),signature=profile
      ?`${profile.id}:${sprite.atlas}:${sprite.column}:${sprite.row}:${sprite.columns}:${sprite.rows}:${crop?.join(',')||''}:${sprite.atlasWidth||''}:${sprite.atlasHeight||''}:${legacy}`:`legacy:${legacy}`;
    if(appearances.get(actor.id)?.signature===signature)return;
    cleanupAppearance(actor.id);
    const image=document.createElement('img');image.alt='';image.decoding='async';
    const visual=profile?document.createElement('span'):image;
    const appearance={signature,node,image,visual,ready:false,failed:false,fallback:!profile,displayedProfileId:''};
    appearances.set(actor.id,appearance);
    const stillActive=()=>!disposed&&appearances.get(actor.id)===appearance;
    const identify=(id,label)=>{
      appearance.displayedProfileId=id;
      node.setAttribute('data-visitor-profile-id',id);
      node.setAttribute('data-visitor-profile-label',label);
    };
    const loaded=()=>{
      if(!stillActive())return;
      appearance.ready=true;appearance.failed=false;
      if(profile&&!crop&&!appearance.fallback&&image.naturalWidth>0&&image.naturalHeight>0){
        visual.style.setProperty('--visitor-cell-aspect',String(image.naturalWidth/sprite.columns/(image.naturalHeight/sprite.rows)));
      }
      refreshStatus();
    };
    const failed=()=>{
      if(!stillActive())return;
      appearance.ready=false;appearance.failed=true;node.setAttribute('data-visitor-image-state','failed');refreshStatus();
    };
    image.onload=()=>{if(!stillActive())return;node.setAttribute('data-visitor-image-state',appearance.fallback?'fallback':'ready');loaded();};
    node.setAttribute('data-visitor-requested-profile-id',profile?.id||'');
    node.setAttribute('data-visitor-image-state','loading');
    if(profile){
      visual.className='best-person-sprite matrix-visitor-frame';
      image.className='matrix-visitor-atlas';
      if(crop){
        // A measured alpha contour normalizes the full body, including shorter
        // children, before the simulation applies its canonical age scale.
        const [x,y,width,height]=crop;
        visual.style.setProperty('--visitor-cell-aspect',String(width/height));
        image.style.width=`${sprite.atlasWidth/width*100}%`;image.style.height=`${sprite.atlasHeight/height*100}%`;
        image.style.left=`${-x/width*100}%`;image.style.top=`${-y/height*100}%`;
      }else{
        image.style.width=`${sprite.columns*100}%`;image.style.height=`${sprite.rows*100}%`;
        image.style.left=`${-sprite.column*100}%`;image.style.top=`${-sprite.row*100}%`;
      }
      visual.append(image);identify(profile.id,profile.label||profile.id);
      image.onerror=()=>{
        if(!stillActive())return;
        appearance.fallback=true;appearance.ready=false;appearance.failed=false;
        visual.className='best-person-sprite matrix-visitor-frame is-fallback';
        visual.style.setProperty('--visitor-cell-aspect',String(2/3));
        image.className='matrix-visitor-fallback';
        image.style.width='100%';image.style.height='100%';image.style.left='0';image.style.top='0';
        identify(`legacy:${legacy}`,isChild(actor)?'Infantil · imagen de reserva':'Visitante · imagen de reserva');
        node.setAttribute('data-visitor-image-state','fallback-loading');image.onerror=failed;image.src=legacy;refreshStatus();
      };
      image.src=sprite.atlas;
    }else{
      image.className='best-person-sprite';image.onerror=failed;
      identify(`legacy:${legacy}`,isChild(actor)?'Infantil · imagen de reserva':'Visitante · imagen de reserva');image.src=legacy;
    }
    node.append(visual);
  }

  function removeMissing(active){
    for(const [id,node] of people)if(!active.has(id)){cleanupAppearance(id);node.remove();people.delete(id);positions.delete(id);}
  }
  function update(){
    if(disposed)return;
    let current=null;
    try{current=snapshot(getState?.());}catch{}
    if(!current){
      removeMissing(new Set());status.textContent='Esperando la simulación del Xtanco…';
      status.setAttribute('data-distinct-profiles','0');status.setAttribute('data-fallback-count','0');return;
    }
    const zones=furnitureZones(getFurnitureZones,current);
    const active=new Set(),actors=current.actors.filter(actor=>actor?.kind==='customer'&&!actor.outside&&actor.col>=0&&actor.row>=0&&actor.col<current.cols&&actor.row<current.rows);
    for(const actor of actors){
      const logical=logicalPosition(actor,current);if(!logical)continue;
      active.add(actor.id);let node=people.get(actor.id);
      if(!node){
        node=document.createElement('span');node.className='best-person';
        const shadow=document.createElement('i');shadow.className='best-person-shadow';node.append(shadow);
        node.setAttribute('data-actor-id',actor.id);layer.append(node);people.set(actor.id,node);
      }
      updateAppearance(node,actor);
      const desired=projectFloor(logical.col,logical.row,current.cols,current.rows),point=resolveBestHardness(desired,zones,floorPolygon),previous=positions.get(actor.id);
      const repositioning=segmentCrossesBestHardness(previous,point,zones,floorPolygon),child=isChild(actor),variation=child ? .88+(stableNumber(actor.id)%9)*.02 : .96+(stableNumber(actor.id)%6)*.02;
      const scale=(actor.scale||1)*variation*(.78+point.depth*.28);
      node.className=`best-person kind-${actor.kind}${actor.walking?' is-walking':''}${actor.isPlayer?' is-player':''}${child?' is-child':''}${repositioning?' is-repositioning':''}`;
      node.style.left=`${(point.x*100).toFixed(3)}%`;node.style.top=`${(point.y*100).toFixed(3)}%`;
      node.style.zIndex=String(10+Math.round(point.y*1000));
      node.style.setProperty('--person-scale',scale.toFixed(3));node.style.setProperty('--person-scale-x',(scale*(Math.cos(actor.heading||0)<0?-1:1)).toFixed(3));node.style.setProperty('--person-shirt',actor.color||'#4466cc');
      node.style.setProperty('--person-skin',actor.skin||'#c68642');node.style.setProperty('--person-hair',actor.hair||'#2a1500');
      node.style.setProperty('--person-pants',actor.pants||'#253446');positions.set(actor.id,point);
      // Negative, stable offsets prevent people who enter together from bobbing
      // in lockstep; heading and movement still come from the shared simulation.
      const gait=stableNumber(actor.id),phase=(Math.imul(gait^(gait>>>16),0x45d9f3b)>>>0)%997;
      node.style.setProperty('--visitor-walk-phase',`${-phase/997}s`);
      node.style.setProperty('--visitor-walk-duration',`${.46+(gait%9)*.025}s`);
    }
    removeMissing(active);
    refreshStatus();
  }
  function tick(now){
    if(disposed)return;
    if(!document.hidden&&now-lastUpdate>=100){lastUpdate=now;update();}
    frame=requestFrame(tick);
  }
  update();frame=requestFrame(tick);
  return {update,get count(){return people.size;},dispose(){if(disposed)return;disposed=true;cancelFrame(frame);for(const id of appearances.keys())cleanupAppearance(id);people.clear();positions.clear();layer.remove();status.remove();}};
}
