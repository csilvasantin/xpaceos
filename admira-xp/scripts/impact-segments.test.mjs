// Run the actual HUD handler in a DOM fixture, never inject counts into a live camera.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const helper=html.slice(html.indexOf('function impactsPrime(scope)'),html.indexOf('\nfunction recSnapshot()'));
const begin=html.indexOf("      if(['impactos','impacts','impresiones','cpm'].includes(cmd)){");
const handler=html.slice(begin,html.indexOf('      // ── /mupicam',begin));
function fixture(){
 const buttons=['instore','dooh'].map(mode=>({dataset:{impactMode:mode},style:{},setAttribute(k,v){this[k]=v;}}));
 const body={innerHTML:''},hud={style:{},querySelectorAll:()=>buttons};let tick;
 const impacts={on:false,cpm:8,dwellRef:3,timer:null,SCREENS:[{id:'inside',src:'in',label:'Interior',dwell:3},{id:'outside',src:'ext',label:'Escaparate',dwell:1}],day:{inside:{est:100,look:50},outside:{est:900,look:90}},aud:{hours:{9:{int:5,ext:0},10:{int:1,ext:999}}}};
 const context=vm.createContext({IMPACTS:impacts,G:{custIn:6,custs:[{}],gameTime:9},window:{__xtoreWindowPlayer:{exteriorStatistics:()=>null}},document:{getElementById:id=>id==='impactsHud'?hud:body},setInterval:fn=>{tick=fn;return 1;},clearInterval(){},impactsEnsureDay(){},lang:'es'});
 vm.runInContext(helper+'\nfunction run(cmd,arg){'+handler+'}',context);
 return {context,buttons,body,impacts,run:arg=>context.run('impactos',arg),tick:()=>tick()};
}
test('Instore starts selected and totals, prime hour and revenue exclude exterior',()=>{
 const f=fixture();f.run('on');assert.equal(f.buttons[0]['aria-pressed'],'true');
 assert.match(f.body.innerHTML,/TOTAL impactos<\/span><b>100<\/b>/);
 assert.doesNotMatch(f.body.innerHTML,/Escaparate|PUBLI EXTERIOR|999/);
 assert.equal(f.context.impactsPrime('in').hour,9);assert.equal(f.context.impactsPrime().hour,10);
 assert.equal(f.context.impactsTotals('in').revenue,.8);assert.equal(f.context.impactsTotals().imp,1000);
 assert.ok(f.context.impactsDyn('in').revenueDyn<f.context.impactsDyn().revenueDyn);
});
test('DooH updates all categories without mixing simulations; selection survives refresh and reset goes back to Instore on reopen',()=>{
 const f=fixture();f.run('on');f.buttons[1].onclick();assert.match(f.body.innerHTML,/Sin señal actual/);
 f.context.window.__xtoreWindowPlayer.exteriorStatistics=()=>({person:18,car:5,motorcycle:3,bicycle:2,scooter:1});f.tick();
 for(const key of ['person','car','motorcycle','bicycle','scooter'])assert.match(f.body.innerHTML,new RegExp('data-dooh-category="'+key+'"'));
 assert.match(f.body.innerHTML,/Observación manual/);assert.doesNotMatch(f.body.innerHTML,/CPM|TOTAL impactos|simulación/);
 assert.equal(f.buttons[1]['aria-pressed'],'true');
 f.context.window.__xtoreWindowPlayer.exteriorStatistics=()=>null;f.tick();assert.match(f.body.innerHTML,/Sin señal actual/);assert.equal((f.body.innerHTML.match(/>—</g)||[]).length,5);
 f.run('on');assert.equal(f.buttons[0]['aria-pressed'],'true');f.buttons[1].onclick();f.tick();assert.equal(f.buttons[1]['aria-pressed'],'true');
});
test('all inline application scripts still parse',()=>{
 for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){
  if(/type\s*=\s*["'](?:module|application\/)/.test(m[1]))continue;
  new vm.Script(m[2]);
 }
});
