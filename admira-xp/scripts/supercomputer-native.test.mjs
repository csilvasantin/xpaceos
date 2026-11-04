import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createLifeScene} from './life-scene.mjs';
import {Vector3} from './premium-three.mjs';

const canvasFactory=()=>({width:0,height:0,getContext:()=>new Proxy({},{get:(t,k)=>t[k]??(()=>{}),set:(t,k,v)=>(t[k]=v,true)})});
test('native supercomputer matches METAHUMAN physical contract',()=>{
  const cat=JSON.parse(readFileSync(new URL('../../inventario/catalog.json',import.meta.url)));
  for(const id of ['native:supercomputer','native:supercomputer-metahuman','native:supercomputer-pc-cocina'])assert.equal(cat.native.find(n=>n.id===id)?.type,'supercomputer');
  const model=createLifeScene({cols:6,rows:4,wallHeight:3,layout:[{id:'supercomputer-metahuman',type:'supercomputer',col:2,row:1}],actors:[]},{canvasFactory});
  const pos=n=>model.scene.getObjectByName(n).getWorldPosition(new Vector3());
  const back=[1,2,3].map(i=>pos(`fan:back:${i}`)),bottom=[1,2,3].map(i=>pos(`fan:bottom:${i}`)),mb=pos('supercomputer:motherboard');
  assert.ok(back[0].y>back[1].y&&back[1].y>back[2].y);assert.ok(bottom[0].x<bottom[1].x&&bottom[1].x<bottom[2].x);
  for(const b of back)assert.ok(Math.abs(b.z-mb.z)<.1,'vertical fans at BACK with motherboard');
  for(const b of bottom)assert.ok(b.y<.15&&b.z>mb.z+.2,'horizontal block at BOTTOM, separated');
  const faces=[];model.scene.traverse(o=>{if(o.userData.fanSlot)faces.push(o.userData.fanSlot);});assert.deepEqual(faces.sort(),['fan1','fan2','fan3','fan4','fan5','fan6']);
  model.dispose();
});
