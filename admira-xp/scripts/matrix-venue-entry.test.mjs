import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';
import {matrixVenue} from './xtanco-visual-tiers.mjs';
// FLT-102615 · early boot + Matrix entry: the Sneakers Store keeps its loc; everything else still enters Starbucks.
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8'),boot=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].find(match=>match[1].includes('window.__xpaceMatrixEntry=true'))[1],start=html.indexOf('window.__xtancoEnterStarbucks=()=>{'),entry=html.slice(start,html.indexOf('window.__xtancoVisualState',start));
function harness(search){let url=new URL('https://www.xpaceos.com/admira-xp/'+search);const classes=new Set(),entered=[];const location={get href(){return url.href;},get search(){return url.search;},get pathname(){return url.pathname;},get hash(){return url.hash;}};const window={dispatchEvent:event=>entered.push(event.type)},history={state:{},replaceState(_state,_title,next){url=new URL(next,url);}},document={documentElement:{classList:{add:(...values)=>values.forEach(v=>classes.add(v)),remove:(...values)=>values.forEach(v=>classes.delete(v))}},addEventListener(){},getElementById:()=>null};const context={window,document,location,history,URL,URLSearchParams,Event,clearTimeout,setTimeout,isStarbucksVenue:()=>url.searchParams.get('loc')==='alsea-sbux-021',autoEnterVertical:id=>entered.push(id)};vm.createContext(context);vm.runInContext(boot+'\n'+entry,context);return {window,entered,classes,get url(){return url;}};}
test('Sneakers Store · Santa Rosa 19 boots straight into its own Matrix without being sent to Starbucks',()=>{
  const sneakers='sneakers-store-santa-rosa-19';
  for(const search of ['?quality=matrix&loc='+sneakers+'&project=sneakers-store','?loc='+sneakers,'?visual=matrix&loc='+sneakers+'&project=sneakers-store&circuit=sneakerstore#keep','?project=sneakers-store&quality=matrix']){
    const h=harness(search);
    assert.equal(h.window.__xpaceMatrixEntry,true,search);assert.ok(h.classes.has('matrix-boot'),search);
    assert.equal(h.window.__xpaceMatrixVenue(),sneakers,search);assert.equal(h.window.__xpaceMatrixVenue(search),matrixVenue(search));
    assert.equal(h.window.__xtancoEnterStarbucks(),true,search);
    assert.equal(h.url.searchParams.get('loc'),sneakers,search);assert.equal(h.url.searchParams.get('project'),'sneakers-store',search);
    assert.ok(!h.entered.includes('cafeteria'),search);
  }
});
test('generic Matrix entry still enters the Starbucks demo',()=>{
  for(const search of ['','?quality=matrix','?project=starbucks&venue=demo-starbucks&quality=matrix']){
    const h=harness(search);assert.equal(h.window.__xpaceMatrixEntry,true);h.window.__xtancoEnterStarbucks();
    assert.equal(h.url.searchParams.get('loc'),'alsea-sbux-021');assert.equal(h.url.searchParams.get('project'),'starbucks');assert.ok(h.entered.includes('cafeteria'));
  }
});
