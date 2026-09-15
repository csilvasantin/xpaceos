import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createVisualTiers} from './xtanco-visual-tiers.mjs';
import {executeVisualCommand} from './xtanco-visual-command.mjs';

const source=fs.readFileSync(new URL('./best-preview-ui.mjs',import.meta.url),'utf8');
const controlSource=fs.readFileSync(new URL('./visual-tier-controls.mjs',import.meta.url),'utf8');
const styleSource=fs.readFileSync(new URL('./best-preview.css',import.meta.url),'utf8');
function harness({modalFailure=false,imageComplete=false,imageNaturalWidth=0}={}){
  let document,releaseCount=0;
  const created=[],selected=[],liveLayers=[];
  class Element{
    constructor(tag){this.tag=tag;this.attrs={};this.dataset={};this.children=[];this.queries=new Map();this.listeners={};this.hidden=false;const classes=new Set();this.classList={add:value=>classes.add(value),contains:value=>classes.has(value)};}
    setAttribute(key,value){this.attrs[key]=String(value);}
    set innerHTML(value){
      this.markup=value;
      if(this.tag!=='div')return;
      this.children=[...value.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].map(match=>{
        const button=new Element('button');button.parent=this;button.textContent=match[2].replace(/<[^>]+>/g,'');
        for(const attr of match[1].matchAll(/([\w-]+)="([^"]*)"/g)){button.attrs[attr[1]]=attr[2];if(attr[1]==='data-visual-mode')button.dataset.visualMode=attr[2];}
        return button;
      });
    }
    get innerHTML(){return this.markup;}
    querySelector(selector){
      if(!this.queries.has(selector)){
        const child=new Element(selector==='img'?'img':selector);child.parent=this;
        if(selector==='img'){child.complete=imageComplete;child.naturalWidth=imageNaturalWidth;}
        if(selector==='.best-image-error')child.hidden=true;
        this.queries.set(selector,child);this.children.push(child);
      }
      return this.queries.get(selector);
    }
    querySelectorAll(selector){assert.equal(selector,'[data-visual-mode]');return this.children.filter(child=>child.dataset.visualMode);}
    addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
    append(child){child.remove();child.parent=this;this.children.push(child);}
    remove(){if(this.parent){const index=this.parent.children.indexOf(this);if(index>=0)this.parent.children.splice(index,1);}this.parent=null;this.removed=true;}
    show(){if(modalFailure)throw Error('show failed');this.open=true;}
    close(){this.open=false;}
    focus(){document.activeElement=this;}
    getBoundingClientRect(){return {width:1000,height:625};}
    getContext(){throw Error('Best preview must not allocate graphics');}
    emit(type,props={}){
      const event={type,target:this,stopped:false,prevented:false,stopPropagation(){this.stopped=true;},preventDefault(){this.prevented=true;},...props};
      for(let node=this;node;node=node.parent){node[`on${type}`]?.(event);for(const fn of node.listeners[type]||[])fn(event);if(event.stopped)break;}
      return event;
    }
  }
  const body=new Element('body'),previous=new Element('previous'),window=new Element('window');body.parent=window;
  document={body,activeElement:previous,createElement(tag){created.push(tag);return new Element(tag);}};
  window.__xtancoReleaseInputs=()=>releaseCount++;
  window.__xtancoVisualTiers={choose:tier=>selected.push(tier)};
  function createBestPeopleLayer(options){
    const layer={options,disposed:false,dispose(){this.disposed=true;}};liveLayers.push(layer);return layer;
  }
  const context=vm.createContext({document,window,createBestPeopleLayer,fetch(){throw Error('No fetch or operational network calls');}});
  vm.runInContext(controlSource.replace(/export function /g,'function '),context);
  vm.runInContext(source.replace(/^import .*;\n/gm,'').replace(/export function /g,'function ')+';globalThis.audit={openBestView,closeBestView,subscribeBestView,get dialog(){return dialog;}};',context);
  return {body,window,document,previous,created,selected,liveLayers,context,get releases(){return releaseCount;},get dialog(){return context.audit.dialog;},
    open:options=>context.audit.openBestView(options),close:reason=>context.audit.closeBestView(reason),subscribe:fn=>context.audit.subscribeBestView(fn)};
}

test('Best remains dormant until opened and creates a clean plate with a read-only people overlay, never GPU/media players',()=>{
  const h=harness();assert.deepEqual(h.created,[]);assert.equal(h.dialog,undefined);
  h.open({requestId:1});assert.deepEqual(h.created,['dialog']);assert.equal(h.dialog.open,true);assert.equal(h.releases,1);
  assert.match(h.dialog.className,/visual-tier-surface/);assert.equal(h.dialog.classList.contains('is-visible'),true);
  assert.match(h.dialog.innerHTML,/PERSONAS EN VIVO · AVENIDA ADMIRA/);
  assert.match(source,/createBestPeopleLayer/,'the live layer owns the calibrated hardness map');
  assert.match(h.dialog.innerHTML,/<img[^>]+best-xtanco-avenida-admira-framelock-20260915\.png/);
  assert.doesNotMatch(h.dialog.innerHTML,/<(?:canvas|video|audio|iframe)\b/i);
  assert.match(source,/createBestPeopleLayer/);assert.doesNotMatch(source,/createLifeRenderer|WebGL|setInterval|__xtExec/);
  assert.match(styleSource,/\.best-person\{[^}]*width:10%;height:25\.5%/,'adult figures stay calibrated against the furniture');
  assert.doesNotMatch(styleSource,/\.best-depth-occluder\{/,'depth masks must never cut a moving visitor into pieces');
  assert.match(styleSource,/aspect-ratio:8\/5/,'all visual tiers share Good’s native frame ratio');
  assert.match(styleSource,/\.best-person-sprite\{[^}]*height:100%/,'photorealistic sprites fill the calibrated body height');
  h.dialog.querySelector('img').emit('load');assert.equal(h.liveLayers.length,1);
  assert.equal(h.liveLayers[0].options.container,h.dialog.querySelector('.best-live-scene'));
});

test('Best emits the request identity, opens idempotently, restores focus and removes subscriptions',()=>{
  const h=harness(),states=[],unsubscribe=h.subscribe(state=>states.push({...state}));
  h.open({requestId:44});const dialog=h.dialog;h.open({requestId:45});
  assert.equal(h.dialog,dialog);assert.equal(states.length,1);assert.equal(states[0].requestId,44);assert.equal(states[0].open,true);
  assert.equal(states[0].busy,true);assert.equal(h.releases,1);
  dialog.querySelector('img').emit('load');assert.equal(states.length,2);assert.equal(states[1].busy,false);assert.equal(states[1].requestId,44);
  const liveLayer=h.liveLayers[0];assert.equal(liveLayer.disposed,false);
  h.close('switch');h.close('switch');assert.equal(states.length,3);assert.equal(states[2].requestId,44);assert.equal(states[2].reason,'switch');assert.equal(states[2].busy,false);
  assert.equal(liveLayer.disposed,true);
  assert.equal(h.dialog,null);assert.equal(dialog.open,false);assert.equal(dialog.removed,true);assert.equal(h.document.activeElement,h.previous);
  unsubscribe();h.open({requestId:46});h.close();assert.equal(states.length,3);
});

test('an already aborted request never opens; abort of an active view cleans it without affecting later opens',()=>{
  const h=harness(),first=new AbortController();first.abort();h.open({signal:first.signal,requestId:1});assert.deepEqual(h.created,[]);
  const second=new AbortController();h.open({signal:second.signal,requestId:2});second.abort();assert.equal(h.dialog,null);
  const third=new AbortController();h.open({signal:third.signal,requestId:3});const dialog=h.dialog;
  second.abort();assert.equal(h.dialog,dialog);h.close();third.abort();assert.equal(h.dialog,null);
});

test('pointer, touch, wheel and keyboard events cannot leak into the underlying game',()=>{
  const h=harness();h.open();let leaked=0;
  const events=['click','dblclick','pointerdown','pointerup','pointermove','mousedown','mouseup','mousemove','touchstart','touchmove','touchend','wheel','contextmenu','keydown','keyup','keypress'];
  for(const type of events)h.body.addEventListener(type,()=>leaked++);
  for(const type of events)assert.equal(h.dialog.querySelector('img').emit(type,{key:'q'}).stopped,true,type);
  assert.equal(leaked,0);assert.equal(h.dialog.open,true);
  const escape=h.dialog.emit('keydown',{key:'Escape'});assert.equal(escape.prevented,true);assert.equal(h.dialog,null);assert.equal(leaked,0);
});

test('Escape and pagehide close the surface without hiding the permanent application chrome',()=>{
  const h=harness(),states=[];h.subscribe(state=>states.push({...state}));
  h.open({requestId:1});const escape=h.dialog.emit('keydown',{key:'Escape'});assert.equal(escape.prevented,true);assert.equal(h.dialog,null);assert.equal(states.at(-1).reason,'');
  h.open({requestId:3});h.window.emit('pagehide');assert.equal(h.dialog,null);assert.equal(states.at(-1).reason,'pagehide');assert.equal(states.at(-1).requestId,3);
});

test('image failure remains explicit and stale image load or error events cannot corrupt the next dialog',()=>{
  const h=harness(),states=[];h.subscribe(state=>states.push({...state}));h.open({requestId:1});
  const oldImage=h.dialog.querySelector('img');oldImage.emit('error');assert.equal(h.dialog.querySelector('.best-image-error').hidden,false);
  assert.match(states.at(-1).error,/imagen conceptual/);assert.equal(states.at(-1).requestId,1);assert.equal(states.at(-1).open,true);assert.equal(states.at(-1).busy,false);
  h.close();h.open({requestId:2});const count=states.length;oldImage.emit('error');oldImage.emit('load');assert.equal(states.length,count);
  assert.equal(states.at(-1).busy,true,'opening again must await its own image');
  assert.equal(h.dialog.querySelector('.best-image-error').hidden,true);
});

test('only a complete cached image with positive natural width can skip waiting for its load event',()=>{
  for(const [complete,width,ready]of [[true,640,true],[true,0,false],[false,640,false]]){
    const h=harness({imageComplete:complete,imageNaturalWidth:width}),states=[];h.subscribe(state=>states.push({...state}));h.open();
    assert.equal(states[0].busy,true);assert.equal(states.at(-1).busy,!ready);assert.equal(states.length,ready?2:1);h.close();
  }
});

test('/modo best waits for the real image and reports failure or cancellation without a false success',{timeout:2000},async()=>{
  for(const completion of ['load','error','close','switch']){
    const h=harness(),router=createVisualTiers({openBest:h.open,closeBest:h.close,subscribeBest:h.subscribe,openBetter(){},closeBetter(){}});
    let settled=false;const command=executeVisualCommand('/modo best',{router}).then(result=>{settled=true;return result;});
    await Promise.resolve();await Promise.resolve();assert.equal(settled,false);assert.equal(router.mode,'best');assert.equal(router.busy,true);
    const oldImage=h.dialog.querySelector('img');
    if(completion==='close')h.close();else if(completion==='switch')await router.choose('better');else oldImage.emit(completion);
    const result=await command;assert.equal(result.ok,completion==='load');
    if(completion==='load'){assert.equal(result.preview,true);assert.equal(result.availability,'preview');assert.equal(result.busy,false);}
    if(completion==='error'){assert.equal(router.busy,false);assert.match(router.error,/imagen conceptual/);assert.ok(h.dialog);}
    if(completion==='close'||completion==='switch'){
      assert.equal(result.cancelled,true);oldImage.emit('load');oldImage.emit('error');assert.equal(router.mode,completion==='close'?'good':'better');
    }
    assert.deepEqual(h.created,['dialog']);router.dispose();
  }
});

test('Best contains only the visual surface; tier controls and CLI remain in the permanent Expert dock',()=>{
  const h=harness();h.open();
  assert.doesNotMatch(h.dialog.innerHTML,/data-visual-mode|best-header|best-footer|Salir del comparador/);
  assert.match(h.dialog.innerHTML,/03\.- BEST · 32 BITS/);assert.deepEqual(h.selected,[]);
});

test('the real router returns to Good and cleans a failed dialog initialization',async()=>{
  const h=harness({modalFailure:true});
  const router=createVisualTiers({openBest:h.open,closeBest:h.close,subscribeBest:h.subscribe});
  const result=await router.choose('best');assert.equal(result.ok,false);assert.equal(router.mode,'good');assert.equal(h.dialog,null);
  assert.equal(h.body.children.length,0);assert.equal(h.document.activeElement,h.previous);router.dispose();
});

test('switching from Best through the external Expert selector closes it and opens only Better',async()=>{
  const h=harness();let listener,betterOpen=0,betterClose=0;
  const router=createVisualTiers({openBest:h.open,closeBest:h.close,subscribeBest:h.subscribe,
    subscribeBetter(fn){listener=fn;return ()=>{};},
    openBetter({requestId}){betterOpen++;listener({open:true,busy:false,requestId});},
    closeBetter(){betterClose++;listener({open:false,busy:false});},
    onChange:state=>h.context.updateTierControls(state)});
  h.window.__xtancoVisualTiers=router;
  const first=router.choose('best');h.dialog.querySelector('img').emit('load');await first;const oldDialog=h.dialog;
  await router.choose('better');
  assert.equal(h.dialog,null);assert.equal(oldDialog.removed,true);assert.equal(router.mode,'better');assert.equal(betterOpen,1);
  const second=router.choose('best');h.dialog.querySelector('img').emit('load');await second;assert.equal(betterClose,1);assert.equal(router.availability,'preview');
  await router.choose('good');assert.equal(router.mode,'good');assert.equal(h.dialog,null);router.dispose();
});
