import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('./matrix-preview-ui.mjs',import.meta.url),'utf8');
function harness({cached=false,broken=false,showFailure=false,peopleFailure=false}={}){
  let document,releases=0;
  const layers=[];
  class Element{
    constructor(tag){this.tag=tag;this.children=[];this.queries=new Map();this.listeners={};this.attrs={};const classes=new Set();this.classList={add:name=>classes.add(name),contains:name=>classes.has(name)};}
    setAttribute(name,value){this.attrs[name]=String(value);}
    querySelector(selector){
      if(!this.queries.has(selector)){
        const child=new Element(selector);child.parent=this;
        if(selector==='.best-reference-filled'){child.complete=cached;child.naturalWidth=broken?0:1504;}
        this.queries.set(selector,child);this.children.push(child);
      }
      return this.queries.get(selector);
    }
    append(child){child.parent=this;this.children.push(child);}
    addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
    show(){if(showFailure)throw Error('dialog failure');this.open=true;}
    close(){this.open=false;}
    remove(){this.removed=true;if(this.parent)this.parent.children=this.parent.children.filter(child=>child!==this);this.parent=null;}
    focus(){document.activeElement=this;}
    getBoundingClientRect(){return {width:1000,height:625};}
    emit(type,props={}){
      const event={type,stopped:false,prevented:false,stopPropagation(){this.stopped=true;},preventDefault(){this.prevented=true;},...props};
      for(let node=this;node;node=node.parent){for(const fn of node.listeners[type]||[])fn(event);if(event.stopped)break;}
      return event;
    }
  }
  const body=new Element('body'),previous=new Element('previous'),window=new Element('window');body.parent=window;
  document={body,activeElement:previous,createElement:tag=>new Element(tag)};
  window.__xtancoReleaseInputs=()=>releases++;
  const createBestPeopleLayer=({container})=>{
    if(peopleFailure)throw Error('people failure');
    const layer={container,disposed:false,dispose(){this.disposed=true;}};layers.push(layer);return layer;
  };
  const context=vm.createContext({document,window,createBestPeopleLayer});
  vm.runInContext(source.replace(/^import .*;\n/gm,'').replace(/export function /g,'function ')+';globalThis.audit={openMatrixView,closeMatrixView,subscribeMatrixView,get dialog(){return dialog;}};',context);
  return {body,window,document,previous,layers,get releases(){return releases;},get dialog(){return context.audit.dialog;},open:options=>context.audit.openMatrixView(options),close:reason=>context.audit.closeMatrixView(reason),subscribe:fn=>context.audit.subscribeMatrixView(fn)};
}

test('Matrix restores the original Avenida Admira plate as an independent fixed composition',()=>{
  const h=harness();h.open({requestId:8});
  assert.equal(h.dialog.className,'matrix-dialog best-dialog visual-tier-surface');
  assert.match(h.dialog.innerHTML,/04\.- MATRIX · AVENIDA ADMIRA/);
  assert.match(h.dialog.innerHTML,/ESCENA FIJA · VISITANTES EN VIVO/);
  for(const name of ['framelock','mudanza']){
    const file=`best-xtanco-avenida-admira-${name}-20260915.png`;
    assert.ok(h.dialog.innerHTML.includes(file));assert.ok(fs.existsSync(new URL(`../assets/${file}`,import.meta.url)));
  }
  assert.doesNotMatch(source,/mountInventoryBest|XpaceInventory|URLSearchParams/);
  assert.equal(h.releases,1);assert.equal(h.dialog.open,true);assert.equal(h.layers.length,0);
});

test('image readiness creates one live people layer and retains its request identity',()=>{
  const h=harness(),states=[];h.subscribe(state=>states.push({...state}));h.open({requestId:41});
  const image=h.dialog.querySelector('.best-reference-filled');image.onload();image.onload();h.open({requestId:42});
  assert.equal(h.layers.length,1);assert.deepEqual(states.map(s=>s.busy),[true,false]);
  assert.ok(states.every(s=>s.requestId===41));assert.equal(states.at(-1).error,'');
});

test('cached images settle readiness immediately and cached failures report an error',()=>{
  for(const broken of [false,true]){
    const h=harness({cached:true,broken}),states=[];h.subscribe(state=>states.push({...state}));h.open({requestId:3});
    assert.deepEqual(states.map(s=>s.busy),[true,false]);assert.equal(h.layers.length,broken?0:1);
    assert.equal(!!states.at(-1).error,broken);
    if(broken){assert.match(states.at(-1).error,/Avenida Admira/);assert.equal(h.dialog.querySelector('.best-image-error').hidden,false);}
  }
});

test('abort prevents opening or cleans the active view, and stale image callbacks cannot affect its replacement',()=>{
  const h=harness(),aborted=new AbortController();aborted.abort();h.open({signal:aborted.signal});assert.equal(h.dialog,undefined);
  const active=new AbortController();h.open({signal:active.signal,requestId:5});
  const old=h.dialog,image=old.querySelector('.best-reference-filled'),staleLoad=image.onload,staleError=image.onerror;
  image.onload();active.abort();assert.equal(h.dialog,null);assert.equal(h.layers[0].disposed,true);assert.equal(old.removed,true);
  assert.equal(image.onload,null);assert.equal(image.onerror,null);
  const states=[];h.subscribe(s=>states.push({...s}));h.open({requestId:6});staleLoad();staleError();
  assert.equal(h.layers.length,1);assert.equal(states.length,1);assert.equal(states[0].busy,true);assert.equal(states[0].requestId,6);
});

test('scene input stays local and Escape closes without altering the shared scene',()=>{
  const h=harness();h.open();let leaked=0;
  for(const type of ['click','dblclick','pointerdown','pointerup','pointermove','mousedown','mouseup','mousemove','touchstart','touchmove','touchend','wheel','contextmenu','keydown','keyup','keypress']){
    h.body.addEventListener(type,()=>leaked++);assert.equal(h.dialog.querySelector('.best-stage').emit(type,{key:'q'}).stopped,true,type);
  }
  assert.equal(leaked,0);assert.equal(h.dialog.emit('keydown',{key:'Escape'}).prevented,true);
  assert.equal(h.dialog,null);assert.equal(h.document.activeElement,h.previous);
});

test('pagehide releases visitors and observers, preserving its close reason',()=>{
  const h=harness({cached:true}),states=[],unsubscribe=h.subscribe(s=>states.push({...s}));h.open();
  const dialog=h.dialog;h.window.emit('pagehide');h.close('pagehide');
  assert.equal(h.layers[0].disposed,true);assert.equal(dialog.removed,true);assert.equal(states.at(-1).reason,'pagehide');
  assert.equal(states.at(-1).open,false);unsubscribe();const count=states.length;h.open();h.close();assert.equal(states.length,count);
});

test('opening failure removes its dialog and restores focus before propagating the error',()=>{
  const h=harness({showFailure:true});assert.throws(()=>h.open(),/dialog failure/);
  assert.equal(h.dialog,null);assert.equal(h.body.children.length,0);assert.equal(h.document.activeElement,h.previous);assert.equal(h.layers.length,0);
});

test('people-layer failure settles with an explicit error instead of reporting live visitors',()=>{
  const h=harness({cached:true,peopleFailure:true}),states=[];h.subscribe(s=>states.push({...s}));h.open();
  assert.equal(states.at(-1).busy,false);assert.match(states.at(-1).error,/visitantes de Matrix/);assert.equal(h.layers.length,0);
});
