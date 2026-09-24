import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
function fixture(){
 const helpers=html.slice(html.indexOf('const MAX_RESET_AUDIENCE='),html.indexOf('function camModeLabel()'));
 const camera=html.slice(html.indexOf('function camApplyToStore(){'),html.indexOf('// EXACTO: en CADA sondeo'));
 const cap=html.slice(html.indexOf('function getCurrentCustomerCap(){'),html.indexOf('function getCurrentCustomerSpawnMult(){'));
 let next=1,saves=0;const audience={counts:{person:36,car:5,motorcycle:2,bicycle:6}};
 const c={G:{custs:[],staff:[{hired:true}],turns:{servingId:null},peopleOverride:null,sales:10},state:1,S:{GAME:1},CAM:{mode:'real',connected:true,occupancy:99},MAX_PEOPLE_OVERRIDE:80,MAX_CUSTOMERS_IN_STORE:7,window:{},xtoreSessionMode:()=>true,xtoreSessionAudience:()=>audience,camBrainLine:()=> 'REAL',updateHtmlBar(){},saveGame(){saves++;},getCustomerFlowProfile:()=>({cap:7})};
 c.camForceExact=n=>{c.G.peopleOverride=n;c.G.custs.length=n;};
 c.spawnCust=(vip,sponsor,force,synthetic)=>{assert.equal(synthetic,true);if(c.G.custs.length>=c.getCurrentCustomerCap())return null;const p={id:next++,tx:20,ty:30,st:'walk'};c.G.custs.push(p);return p;};
 vm.createContext(c);vm.runInContext(helpers+camera+cap,c);return {c,audience,saves:()=>saves};
}
test('100 creates exactly 100 virtual visitors, stays above camera cap80 and survives new camera updates',()=>{
 const {c,audience}=fixture();const before=JSON.stringify(audience);
 const r=c.resetAudienceCommand('100');assert.equal(r.ok,true);assert.equal(c.G.custs.length,100);assert.equal(c.getCurrentCustomerCap(),100);
 assert.ok(c.G.custs.every(p=>p.x===20&&p.y===30&&p.st==='browse'));
 c.camApplyToStore();assert.equal(c.G.custs.length,100);assert.equal(JSON.stringify(audience),before);
 c.G.custs.pop();c.camApplyToStore();assert.equal(c.G.custs.length,100);
});
test('0 clears queued and buying visitors immediately, clears checkout and keeps staff and sales',()=>{
 const {c}=fixture();c.G.custs=[{id:1,st:'queue'},{id:2,st:'buy'},{id:3,st:'leave'}];c.G.turns.servingId=2;
 assert.equal(c.resetAudienceCommand('0').ok,true);assert.equal(c.G.custs.length,0);assert.equal(c.G.turns.servingId,null);
 assert.equal(c.G.staff[0].hired,true);assert.equal(c.G.sales,10);c.camApplyToStore();assert.equal(c.G.custs.length,0);
});
test('auto releases manual control to the measured session, and saved manual targets restore',()=>{
 const {c}=fixture();c.resetAudienceCommand('100');c.G=JSON.parse(JSON.stringify(c.G));assert.equal(c.manualAudienceTarget(),100);
 assert.equal(c.resetAudienceCommand('auto').ok,true);assert.equal(c.manualAudienceTarget(),null);assert.equal(c.getCurrentCustomerCap(),36);assert.equal(c.G.custs.length,36);
});
test('invalid input never silently clamps, truncates or mutates a population',()=>{
 const {c}=fixture();c.resetAudienceCommand('3');
 for(const arg of ['-1','101','3.5','100people','1 2','NaN','Infinity','1e2']){assert.equal(c.resetAudienceCommand(arg).ok,false,arg);assert.equal(c.G.custs.length,3);assert.equal(c.manualAudienceTarget(),3);}
 assert.equal(c.resetAudienceCommand('').ok,true);assert.equal(c.G.custs.length,3);
 c.G.storeClosed=true;assert.equal(c.resetAudienceCommand('100').ok,false);assert.equal(c.G.custs.length,3);
});

test('retries transient blocked placements without an unbounded loop',()=>{
 const {c}=fixture();const spawn=c.spawnCust;let attempts=0;
 c.spawnCust=(...args)=>++attempts%5===0?null:spawn(...args);
 c.resetAudienceCommand('100');assert.equal(c.G.custs.length,100);
 c.resetAudienceCommand('0');attempts=0;c.spawnCust=()=>{attempts++;return null;};
 c.resetAudienceCommand('100');assert.equal(c.G.custs.length,0);assert.equal(attempts,300);
});
