import test from 'node:test';
import assert from 'node:assert/strict';
import {BEST_HARDNESS_ZONES,createBestPeopleLayer,isBestWalkable,projectBestFloor,resolveBestHardness,segmentCrossesBestHardness} from './best-live-people.mjs';

const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9,`${actual} != ${expected}`);

test('the Good grid maps into the four measured floor corners of the approved Best perspective',()=>{
  const point=([x,y])=>[(x*1672-84)/1504,(y*941-.5)/940];
  for(const [col,row,[x,y]] of [[0,0,point([.355,.245])],[14,0,point([.905,.505])],[0,8,point([.085,.525])],[14,8,point([.605,.925])]]){
    const point=projectBestFloor(col,row);near(point.x,x);near(point.y,y);
  }
  const center=projectBestFloor(7,4),expected=point([.4875,.55]);near(center.x,expected[0]);near(center.y,expected[1]);near(center.depth,.5);
  assert.deepEqual(projectBestFloor(-10,-10),projectBestFloor(0,0));
  assert.deepEqual(projectBestFloor(99,99),projectBestFloor(14,8));
});

test('the Best plate has calibrated hard furniture footprints and every resolved foot point stays on open floor',()=>{
  for(const zone of BEST_HARDNESS_ZONES){
    const point={x:zone.reduce((sum,p)=>sum+p[0],0)/zone.length,y:zone.reduce((sum,p)=>sum+p[1],0)/zone.length,depth:.5};
    assert.equal(isBestWalkable(point),false);assert.equal(isBestWalkable(resolveBestHardness(point)),true);
  }
  assert.equal(segmentCrossesBestHardness({x:.46,y:.49},{x:.46,y:.63}),true);
});

test('dynamic furniture removal releases its footprint and crossing path without changing fixed-plate defaults',()=>{
  const zone=BEST_HARDNESS_ZONES[3],point={x:zone.reduce((sum,p)=>sum+p[0],0)/zone.length,y:zone.reduce((sum,p)=>sum+p[1],0)/zone.length,depth:.5};
  const zones=[zone],before=JSON.stringify(zones),from={...point,x:point.x-.07},to={...point,x:point.x+.07};
  assert.equal(isBestWalkable(point,zones),false);
  assert.equal(segmentCrossesBestHardness(from,to,zones),true);
  assert.notDeepEqual(resolveBestHardness(point,zones),point);
  assert.equal(isBestWalkable(point,[]),true);
  assert.equal(segmentCrossesBestHardness(from,to,[]),false);
  assert.equal(resolveBestHardness(point,[]),point);
  assert.equal(isBestWalkable(point),false);
  assert.equal(isBestWalkable({x:-1,y:-1},[]),false);
  assert.equal(JSON.stringify(zones),before);
});

test('an independently calibrated room supplies its own walkable floor, obstacle resolution and movement segments',()=>{
  const floor=Object.freeze([[.7,.1],[.95,.1],[.95,.3],[.7,.3]].map(Object.freeze));
  const from={x:.75,y:.2,depth:.4},to={x:.9,y:.2,depth:.6},zone=[[.8,.15],[.85,.15],[.85,.25],[.8,.25]],before=JSON.stringify({floor,zone});
  assert.equal(isBestWalkable(from,[]),false);assert.equal(isBestWalkable(from,[],floor),true);
  assert.equal(segmentCrossesBestHardness(from,to,[],floor),false);assert.equal(segmentCrossesBestHardness(from,to,[zone],floor),true);
  const resolved=resolveBestHardness({x:.825,y:.2,depth:.5},[zone],floor);assert.equal(isBestWalkable(resolved,[zone],floor),true);
  const farAway=resolveBestHardness({x:.1,y:.9,depth:.5},[],floor);assert.equal(isBestWalkable(farAway,[],floor),true);
  assert.equal(JSON.stringify({floor,zone}),before);
});

const iso={cols:14,rows:8,tileW:80,tileH:28,wallH:165,ox:270,oy:185};
const at=(col,row)=>({x:iso.ox+(col-row)*iso.tileW/2-7,y:iso.oy+(col+row)*iso.tileH/2-20});
function fixture(){
  return {active:true,iso,layout:[],footprints:{},realTrafficActive:false,game:{
    staff:[{...at(3,2),hired:true,name:'Player',shirt:0,hair:3,role:3,dir:1,look:{skin:0,pants:2,shoes:1}}],
    custs:[{...at(6,4),id:12,dir:-1,st:'browse',look:{shirt:2,hair:1,skin:4,pants:3,shoes:2}}],
    passersby:[{...at(15,4),outside:true,dir:1,look:{shirt:4,hair:5,skin:1}}],custIn:1,gameTime:14,doorAnim:0
  }};
}

test('the overlay follows live actor positions, excludes outdoor traffic and disposes every DOM resource',()=>{
  const originalDocument=globalThis.document,frames=[],cancelled=[];
  class Element{
    constructor(tag){this.tag=tag;this.children=[];this.parent=null;this.style={values:{},setProperty:(name,value)=>{this.style.values[name]=value;}};}
    setAttribute(name,value){(this.attrs??={})[name]=String(value);}
    append(...children){for(const child of children){child.parent=this;this.children.push(child);}}
    remove(){if(this.parent){const index=this.parent.children.indexOf(this);if(index>=0)this.parent.children.splice(index,1);}this.parent=null;this.removed=true;}
  }
  globalThis.document={hidden:false,createElement:tag=>new Element(tag)};
  try{
    const state=fixture(),container=new Element('scene');
    const people=createBestPeopleLayer({container,getState:()=>state,requestFrame:callback=>(frames.push(callback),frames.length),cancelFrame:id=>cancelled.push(id)});
    const layer=container.children.find(node=>node.className==='best-people-layer'),status=container.children.find(node=>node.className==='best-people-status');
    assert.equal(people.count,1);assert.equal(layer.children.length,1);assert.match(status.textContent,/1 cliente simulado/);
    assert.match(status.textContent,/colisiones activas/);assert.equal(container.children.filter(node=>node.className==='best-depth-occluder').length,0);
    assert.equal(layer.children.some(node=>node.className.includes('passerby')),false);
    assert.match(layer.children[0].innerHTML,/best-person-(?:male-rust|female-denim)-20260915\.png/);
    const customer=layer.children.find(node=>node.className.includes('kind-customer')),left=customer.style.left;
    Object.assign(state.game.custs[0],at(7,4));people.update();
    assert.notEqual(customer.style.left,left);assert.match(customer.className,/is-walking/);
    people.dispose();people.dispose();assert.equal(container.children.length,0);assert.equal(cancelled.length,1);
  }finally{globalThis.document=originalDocument;}
});

test('children use real child cutouts and deterministic age variation instead of scaled adult sprites',()=>{
  const originalDocument=globalThis.document,frames=[];
  class Element{
    constructor(tag){this.tag=tag;this.children=[];this.parent=null;this.style={values:{},setProperty:(name,value)=>{this.style.values[name]=value;}};}
    setAttribute(){} append(...children){for(const child of children){child.parent=this;this.children.push(child);}}
    remove(){if(this.parent){const index=this.parent.children.indexOf(this);if(index>=0)this.parent.children.splice(index,1);}this.parent=null;}
  }
  globalThis.document={hidden:false,createElement:tag=>new Element(tag)};
  try{
    const state=fixture();Object.assign(state.game.custs[0].look,{age:'nino',gender:'f'});state.hardness={cols:14,rows:8,blocked:['6,4']};
    const container=new Element('scene'),people=createBestPeopleLayer({container,getState:()=>state,requestFrame:callback=>(frames.push(callback),frames.length),cancelFrame:()=>{}});
    const child=container.children.find(node=>node.className==='best-people-layer').children[0];
    assert.match(child.className,/is-child/);assert.match(child.innerHTML,/best-person-child-ochre-20260915\.png/);
    assert.ok(Number(child.style.values['--person-scale'])<.8);assert.equal(isBestWalkable({x:parseFloat(child.style.left)/100,y:parseFloat(child.style.top)/100}),true);
    people.dispose();
  }finally{globalThis.document=originalDocument;}
});

test('editable Matrix reads current furniture per update, preserves source state and releases every frame and node',()=>{
  const originalDocument=globalThis.document,frames=new Map(),cancelled=[];let nextFrame=0;
  class Element{
    constructor(){this.children=[];this.parent=null;this.style={setProperty(){}};}
    setAttribute(){} append(...children){for(const child of children){child.parent=this;this.children.push(child);}}
    remove(){if(this.parent)this.parent.children.splice(this.parent.children.indexOf(this),1);this.parent=null;}
  }
  globalThis.document={hidden:false,createElement:()=>new Element()};
  try{
    const state=fixture(),before=JSON.stringify(state),container=new Element(),point=projectBestFloor(6,4);
    const zone=Object.freeze([[point.x-.035,point.y-.035],[point.x+.035,point.y-.035],[point.x+.035,point.y+.035],[point.x-.035,point.y+.035]].map(Object.freeze));
    let zones=Object.freeze([zone]),calls=0;
    const people=createBestPeopleLayer({container,getState:()=>state,getFurnitureZones:scene=>{
      calls++;assert.equal(scene.source,'xtanco-running-game');assert.notEqual(scene,state);return zones;
    },requestFrame:callback=>{frames.set(++nextFrame,callback);return nextFrame;},cancelFrame:id=>{cancelled.push(id);frames.delete(id);}});
    const layer=container.children.find(node=>node.className==='best-people-layer'),person=layer.children[0];
    const coordinate=()=>({x:parseFloat(person.style.left)/100,y:parseFloat(person.style.top)/100});
    assert.equal(calls,1);assert.equal(people.count,1);assert.ok(Math.hypot(coordinate().x-point.x,coordinate().y-point.y)>.03);
    zones=[];people.update();
    assert.equal(calls,2);assert.equal(layer.children[0],person);
    assert.ok(Math.abs(coordinate().x-point.x)<.00001);assert.ok(Math.abs(coordinate().y-point.y)<.00001);
    assert.doesNotMatch(person.className,/is-repositioning/);
    assert.equal(person.style.zIndex,String(10+Math.round(point.y*1000)));
    assert.equal(JSON.stringify(state),before);
    // /mudanza already clears actors in the shared read-only snapshot.
    state.moving=true;people.update();assert.equal(people.count,0);assert.equal(layer.children.length,0);
    people.dispose();people.dispose();people.update();
    assert.equal(container.children.length,0);assert.equal(frames.size,0);assert.equal(cancelled.length,1);assert.equal(calls,3);
  }finally{globalThis.document=originalDocument;}
});

test('invalid or unavailable dynamic zones never revive photograph obstacles and logical collisions remain active',()=>{
  const originalDocument=globalThis.document;
  class Element{
    constructor(){this.children=[];this.parent=null;this.style={setProperty(){}};}
    setAttribute(){} append(...children){for(const child of children){child.parent=this;this.children.push(child);}}
    remove(){if(this.parent)this.parent.children.splice(this.parent.children.indexOf(this),1);this.parent=null;}
  }
  globalThis.document={hidden:false,createElement:()=>new Element()};
  try{
    for(const getFurnitureZones of [()=>undefined,()=>{throw Error('loading');},()=>[null,[],[[NaN,0],[1,1],[0,1]]]]){
      const state=fixture(),point=projectBestFloor(6,4),container=new Element();
      const people=createBestPeopleLayer({container,getState:()=>state,getFurnitureZones,requestFrame:()=>1,cancelFrame:()=>{}});
      const person=container.children.find(node=>node.className==='best-people-layer').children[0];
      assert.equal(person.style.left,`${(point.x*100).toFixed(3)}%`);assert.equal(person.style.top,`${(point.y*100).toFixed(3)}%`);
      state.hardness={cols:14,rows:8,blocked:['6,4']};people.update();
      assert.ok(person.style.left!==`${(point.x*100).toFixed(3)}%`||person.style.top!==`${(point.y*100).toFixed(3)}%`);
      people.dispose();assert.equal(container.children.length,0);
    }
  }finally{globalThis.document=originalDocument;}
});

test('a supplied floor projector drives visitor feet and transitions without pulling them back onto the legacy photograph',()=>{
  const originalDocument=globalThis.document,calls=[];
  class Element{
    constructor(){this.children=[];this.parent=null;this.style={setProperty(){}};}
    setAttribute(){} append(...children){for(const child of children){child.parent=this;this.children.push(child);}}
    remove(){if(this.parent)this.parent.children.splice(this.parent.children.indexOf(this),1);this.parent=null;}
  }
  globalThis.document={hidden:false,createElement:()=>new Element()};
  try{
    const state=fixture(),container=new Element(),floorPolygon=[[.7,.1],[.95,.1],[.95,.3],[.7,.3]];
    const projectFloor=(col,row,cols,rows)=>{calls.push([col,row,cols,rows]);return {x:.72+col*.012,y:.12+row*.015,depth:(col/cols+row/rows)/2};};
    const people=createBestPeopleLayer({container,getState:()=>state,getFurnitureZones:()=>[],projectFloor,floorPolygon,requestFrame:()=>1,cancelFrame:()=>{}});
    const person=container.children.find(node=>node.className==='best-people-layer').children[0];
    assert.deepEqual(calls,[[6,4,14,8]]);assert.equal(person.style.left,'79.200%');assert.equal(person.style.top,'18.000%');
    Object.assign(state.game.custs[0],at(7,4));people.update();
    assert.deepEqual(calls.at(-1),[7,4,14,8]);assert.equal(person.style.left,'80.400%');assert.equal(person.style.top,'18.000%');assert.doesNotMatch(person.className,/is-repositioning/);
    assert.equal(person.style.zIndex,'190');people.dispose();assert.equal(container.children.length,0);
  }finally{globalThis.document=originalDocument;}
});
