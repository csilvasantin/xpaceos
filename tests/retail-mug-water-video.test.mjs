import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRetailRulebook,createRetailRulePlayer,defaultWaterRule,validRetailRule,RETAIL_EVENTS,RETAIL_EVENT_LABELS} from '../admira-xp/scripts/retail-rules.mjs';
import {POS_PRODUCTS,addBasketProduct,restoreBasket} from '../admira-xp/scripts/pos-basket.mjs';
import {parseVisualCommand} from '../admira-xp/scripts/xtanco-visual-command.mjs';
// 8-oct-2026 · preparación de los clips de Neo: IF «Cojo una taza» y vídeo/imagen al dejar el agua.
function memory(){const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};}
const clip={id:'neo-taza',type:'video',title:'Neo coge la taza',url:'https://api.admira.store/stock/asset/neo-taza'};
const still={id:'neo-agua',type:'image',title:'Agua de proximidad',url:'https://api.admira.store/stock/asset/neo-agua'};
async function book(){const b=createRetailRulebook({storage:memory(),fetcher:async()=>({ok:true,json:async()=>({items:[clip,still]})})});await b.refresh();return b;}
function harness(b){const log=[],spoken=[];
 const visualFactory=(dest,{muted})=>({prepare(a){log.push(['prepare',dest,a.kind,muted]);},play:async()=>{log.push(['play',dest]);},stop(){log.push(['stop',dest]);},dispose(){},subscribe:()=>()=>{}});
 const p=createRetailRulePlayer({book:b,audio:null,music:{suppress:()=>()=>{}},visualFactory,speakerFactory:action=>({play:async()=>{spoken.push(action.text?.es||action.value);},stop(){}})});
 return {p,log,spoken,plays:()=>log.filter(x=>x[0]==='play')};}
const mugRule=(over={})=>({id:'mug-video',enabled:true,priority:1,when:{join:'and',conds:[{fact:'mugPicked',value:true}]},do:[{id:'playVideo',filter:'#video',value:clip.id,screens:['starbucks-wall-01']}],...over});

test('mugPicked is an IF event «Cojo una taza» and a Vídeo DO plays once per gesture on its screen',async()=>{
 assert.ok(RETAIL_EVENTS.includes('mugPicked'));assert.equal(RETAIL_EVENT_LABELS.mugPicked.es,'Cojo una taza');assert.equal(RETAIL_EVENT_LABELS.mugPicked.en,'I pick up a mug');
 const b=await book();assert.equal(b.select('mugPicked'),null,'the default muffin and water rules do not react to the mug');
 b.save([...b.state().rules,mugRule()]);assert.equal(b.select('mugPicked').url,clip.url);assert.equal(b.select('muffinPicked').kind,'music');
 const h=harness(b);h.p.prepare();await h.p.fire('mugPicked');await h.p.fire('mugPicked');
 assert.deepEqual(h.plays(),[['play','starbucks-wall-01']]);assert.ok(h.log.some(x=>x[0]==='prepare'&&x[2]==='video'&&x[3]===false),'a lone video keeps its audio');
 h.p.prepare();await h.p.fire('mugPicked');assert.equal(h.plays().length,2,'the next gesture plays it again');h.p.dispose();
});
test('waterDelivered plays Vídeo and Imagen DOs on every bottle, muted under the voiceover, primed in the gesture or built on the fly',async()=>{
 const b=await book(),water=defaultWaterRule();
 water.do.push({id:'playVideo',filter:'#video',value:clip.id,screens:['starbucks-tpv-01']},{id:'showImage',filter:'#imagen',value:still.id,screens:['starbucks-wall-02']});
 assert.equal(validRetailRule(water),true);b.save([water]);
 const h=harness(b);h.p.prepare();
 assert.deepEqual(h.log.filter(x=>x[0]==='prepare').map(x=>x.slice(1)),[['starbucks-tpv-01','video',true],['starbucks-wall-02','image',true]],'primed inside the pointerdown gesture, video muted because the voiceover speaks');
 await h.p.fire('waterDelivered');assert.deepEqual(h.plays().map(x=>x[1]).sort(),['starbucks-tpv-01','starbucks-wall-02']);assert.equal(h.spoken.length,1);
 await h.p.fire('waterDelivered');assert.equal(h.plays().length,4,'a second bottle without a new pointerdown (/demo 14) still plays');assert.equal(h.spoken.length,2);
 assert.ok(h.log.some(x=>x[0]==='stop'),'the previous bottle reaction is replaced, not stacked');h.p.dispose();
});
test('water ignores Pixeria music/voice DOs it never offered and keeps the muffin song playing',async()=>{
 const b=await book(),water=defaultWaterRule();water.do=[{id:'playSong',filter:'#musica',value:'xtore-pos-muffin-demo'}];b.save([water]);
 const h=harness(b);await h.p.fire('waterDelivered');assert.equal(h.plays().length,0);assert.equal(h.spoken.length,0);
});
test('composer, POS and CLI wiring: water offers Vídeo/Imagen, the mug is a basket product and /demo coger taza is local',()=>{
 const composer=fs.readFileSync(new URL('../admira-xp/scripts/retail-rule-composer.mjs',import.meta.url),'utf8');
 assert.match(composer,/fact==='waterDelivered'\?\['tts','offer','image','video'\]/);
 const pos=fs.readFileSync(new URL('../admira-xp/scripts/matrix-pos-experience.mjs',import.meta.url),'utf8');
 assert.match(pos,/rulePlayer\.fire\('mugPicked'\)/);assert.match(pos,/POS_MUG_CORNERS/);assert.match(pos,/api\.mug=\{/);
 assert.equal(POS_PRODUCTS.mug.title,'Taza Starbucks');assert.deepEqual(addBasketProduct(restoreBasket(null),'mug').lines,[{id:'mug',quantity:1}]);
 for(const c of ['/demo coger taza','/demo coge taza','/demo pick mug'])assert.equal(parseVisualCommand(c).guided,'mug',c);
 assert.equal(parseVisualCommand('/demo taza').guided,'suite','/demo taza keeps opening the PlayerTaza camera');
});
