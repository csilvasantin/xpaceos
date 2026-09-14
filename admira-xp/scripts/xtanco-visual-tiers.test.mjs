import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {TIER_STORAGE_KEY,requestedTier,createVisualTiers} from './xtanco-visual-tiers.mjs';

function memoryStorage(entries={}){
  const values=new Map(Object.entries(entries)),reads=[],writes=[];
  return {values,reads,writes,getItem(key){reads.push(key);return values.get(key)??null;},setItem(key,value){writes.push([key,value]);values.set(key,value);}};
}

// Model the Life controller's observable dialog lifecycle, not a second game
// or renderer. The module harness below runs the actual public selector.
function lifeFixture(){
  const listeners=new Set(),calls={open:0,close:0};let opened=false;
  const emit=state=>{opened=state.open;for(const listener of listeners)listener(state);};
  return {calls,listeners,emit,
    openLifeView(){calls.open++;if(opened)return;emit({open:true,busy:true,error:''});emit({open:true,busy:false,error:''});},
    closeLifeView(){calls.close++;emit({open:false,busy:false,error:''});},
    subscribeLifeView(listener){listeners.add(listener);return ()=>listeners.delete(listener);}
  };
}

function routerFixture(options={}){
  const life=lifeFixture(),storage=memoryStorage(),changes=[],bestRequests=[];
  const tiers=createVisualTiers({openBetter:life.openLifeView,closeBetter:life.closeLifeView,subscribeBetter:life.subscribeLifeView,storage,
    onChange:state=>changes.push({...state}),onBestRequested:()=>bestRequests.push(true),...options});
  return {life,storage,changes,bestRequests,tiers};
}

test('explicit visual links override preferences and the former Life URL aliases Better',()=>{
  const matrix=[['good','good'],['better','better'],['life','better'],['best','best'],['','good'],['wireframe','good'],['hybridBest','good'],['BEST','good']];
  for(const stored of [undefined,'good','better','best','life'])for(const [input,expected]of matrix){
    const storage=memoryStorage({[TIER_STORAGE_KEY]:stored,xtanco_visual_quality:'best'});
    assert.equal(requestedTier(`?from=portada&visual=${input}`,storage),expected,`${input} with stored ${stored}`);
    assert.deepEqual(storage.reads,[],'an explicit URL must not depend on storage access');
  }
});

test('only the versioned Better preference can reopen 3D; former hybrid preferences never migrate to Best',()=>{
  assert.equal(TIER_STORAGE_KEY,'xtanco_visual_tier_v2');
  for(const legacy of ['good','better','best']){
    const storage=memoryStorage({xtanco_visual_quality:legacy});
    assert.equal(requestedTier('',storage),'good');assert.deepEqual(storage.reads,[TIER_STORAGE_KEY]);
  }
  for(const [stored,expected]of [['good','good'],['better','better'],['best','good'],['life','good'],['unknown','good']]){
    assert.equal(requestedTier('',memoryStorage({[TIER_STORAGE_KEY]:stored})),expected);
  }
  assert.equal(requestedTier(),'good');
  assert.equal(requestedTier('?visual=life',{getItem(){throw Error('blocked');}}),'better');
  assert.equal(requestedTier('',{getItem(){throw Error('blocked');}}),'good');
});

test('Better opens the live view, and its own close event returns selection and preference to Good',async()=>{
  const f=routerFixture();assert.equal(f.tiers.mode,'good');
  await f.tiers.choose('life');assert.equal(f.life.calls.open,1);assert.equal(f.tiers.mode,'better');
  assert.equal(f.changes.at(-1).busy,false);assert.equal(f.storage.values.get(TIER_STORAGE_KEY),'better');
  f.life.emit({open:false,busy:false,error:''});
  assert.equal(f.tiers.mode,'good');assert.equal(f.changes.at(-1).busy,false);assert.equal(f.storage.values.get(TIER_STORAGE_KEY),'good');
});

test('choosing an already open Better view is idempotent and cannot leave the selector busy',async()=>{
  const f=routerFixture();await f.tiers.choose('better');await f.tiers.choose('better');await f.tiers.choose('life');
  assert.equal(f.life.calls.open,1);assert.equal(f.tiers.mode,'better');assert.equal(f.changes.at(-1).busy,false);
});

test('Best explains its unavailable status without opening or allocating a graphics view',async()=>{
  const f=routerFixture();await f.tiers.choose('best');
  assert.equal(f.life.calls.open,0);assert.equal(f.tiers.mode,'good');assert.equal(f.bestRequests.length,1);
  assert.equal(f.changes.at(-1).busy,false);assert.match(f.changes.at(-1).notice,/Best.*fotorealista.*preparación/);
  assert.equal(f.storage.values.get(TIER_STORAGE_KEY),'good');
  await f.tiers.choose('better');await f.tiers.choose('best');
  assert.equal(f.life.calls.open,1);assert.equal(f.tiers.mode,'good');assert.equal(f.bestRequests.length,2);
});

test('a pagehide release preserves Better preference for reload but a deliberate close saves Good',async()=>{
  const f=routerFixture();await f.tiers.choose('better');
  f.life.emit({open:false,busy:false,error:'',reason:'pagehide'});
  assert.equal(f.storage.values.get(TIER_STORAGE_KEY),'better');
  await f.tiers.choose('better');await f.tiers.choose('good');
  assert.equal(f.tiers.mode,'good');assert.equal(f.storage.values.get(TIER_STORAGE_KEY),'good');
});

test('unavailable storage cannot block navigation and failed opening falls back to Good with a retry notice',async()=>{
  const f=routerFixture({storage:{setItem(){throw Error('quota unavailable');}},openBetter(){throw Error('initialization failed');}});
  await assert.doesNotReject(()=>f.tiers.choose('better'));
  assert.equal(f.tiers.mode,'good');assert.equal(f.changes.at(-1).busy,false);assert.match(f.changes.at(-1).notice,/reintentar/);
  await assert.doesNotReject(()=>f.tiers.choose('best'));
});

test('an open Better error is visible, and disposal detaches its subscription and closes resources',async()=>{
  const f=routerFixture();await f.tiers.choose('better');f.life.emit({open:true,busy:false,error:'WebGL no disponible'});
  assert.equal(f.tiers.mode,'better');assert.equal(f.changes.at(-1).notice,'WebGL no disponible');
  const changes=f.changes.length;f.tiers.dispose();assert.equal(f.life.listeners.size,0);assert.equal(f.life.calls.close,1);
  f.life.emit({open:true,busy:false,error:''});assert.equal(f.changes.length,changes);
});

const selectorSource=fs.readFileSync(new URL('./xtanco-premium-ui.mjs',import.meta.url),'utf8');
function selectorHarness({search='',storage=memoryStorage(),expertHidden=true,storageBlocked=false}={}){
  const created=[],queries=[],life=lifeFixture();
  class Element {
    constructor(tag){this.tag=tag;this.dataset={};this.attrs={};this.children=[];this.listeners={};this.hidden=false;this.textContent='';
      const classes=new Set();this.classList={add:value=>classes.add(value),remove:value=>classes.delete(value),contains:value=>classes.has(value)};}
    setAttribute(key,value){this.attrs[key]=String(value);}
    set innerHTML(value){
      this.markup=value;this.children=[];
      for(const match of value.matchAll(/<(button|span)\b([^>]*)>([^<]*)<\/\1>/g)){
        const node=new Element(match[1]);node.parent=this;node.textContent=match[3];
        for(const attr of match[2].matchAll(/([\w-]+)="([^"]*)"/g)){
          node.setAttribute(attr[1],attr[2]);if(attr[1]==='data-visual-mode')node.dataset.visualMode=attr[2];
        }
        node.hidden=/\bhidden\b/.test(match[2]);this.children.push(node);
      }
    }
    querySelectorAll(selector){assert.equal(selector,'[data-visual-mode]');return this.children.filter(node=>node.dataset.visualMode);}
    querySelector(selector){assert.equal(selector,'.quality-status');return this.children.find(node=>node.attrs.class==='quality-status')??null;}
    remove(){if(this.parent){const siblings=this.parent.children,index=siblings.indexOf(this);if(index>=0)siblings.splice(index,1);}this.parent=null;}
    prepend(node){node.remove();node.parent=this;this.children.unshift(node);}
    append(node){node.remove();node.parent=this;this.children.push(node);}
    addEventListener(type,listener){(this.listeners[type]??=[]).push(listener);}
    click(){const event={stopPropagation(){this.stopped=true;}};this.onclick?.(event);return event;}
  }
  const body=new Element('body'),actions=new Element('expert-actions'),expert=new Element('button');body.dataset.xtancoVisual='better';
  body.append(actions);body.append(expert);
  if(expertHidden)body.classList.add('xp-left-hidden');let expertClicks=0;
  expert.onclick=()=>{expertClicks++;body.classList.remove('xp-left-hidden');};
  const document={body,querySelector(selector){queries.push(selector);return selector==='#telegramDock .tg-actions'?actions:null;},
    createElement(tag){created.push(tag);return new Element(tag);},getElementById(id){
      if(id==='pfExpert')return expert;
      const find=node=>node.attrs.id===id?node:node.children.map(find).find(Boolean);
      return find(body)??null;
    }};
  const window={};Object.defineProperty(window,'localStorage',{get(){if(storageBlocked)throw Error('denied');return storage;}});
  const context=vm.createContext({document,window,location:{search},createVisualTiers,requestedTier,...life});
  vm.runInContext(selectorSource.replace(/^import .*;\n/gm,''),context);
  const controls=actions.children[0];assert.ok(controls,'the selector must be inserted in the expert actions');
  return {body,actions,controls,document,window,storage,life,created,queries,
    get expertClicks(){return expertClicks;},get status(){return document.getElementById('xtanco-best-status');},
    button:tier=>controls.querySelectorAll('[data-visual-mode]').find(node=>node.dataset.visualMode===tier)};
}

test('the selector belongs only to Expert and Best is aria-disabled with a visible availability explanation',()=>{
  const h=selectorHarness({search:'?visual=best'});
  assert.deepEqual(h.queries,['#telegramDock .tg-actions']);assert.equal(h.controls.parent,h.actions);
  assert.equal(h.controls.attrs.role,'group');assert.match(h.controls.attrs['aria-label'],/experto/);
  assert.equal(h.button('best').attrs['aria-disabled'],'true');assert.equal(h.button('best').attrs['aria-pressed'],'false');
  assert.equal(h.button('best').attrs['aria-describedby'],'xtanco-best-status');assert.equal(h.status.attrs.id,'xtanco-best-status');
  assert.equal(h.status.hidden,false);assert.match(h.status.textContent,/fotorealista.*preparación/);
  assert.equal(h.expertClicks,1);assert.equal(h.body.classList.contains('xp-left-hidden'),false);
  assert.equal(h.life.calls.open,0);assert.deepEqual(h.created,['div'],'unavailable Best must not create GPU canvases');
});

test('the Best explanation escapes dock clipping while retaining its accessible association and visibility lifecycle',async()=>{
  const h=selectorHarness({search:'?visual=best'}),status=h.status;
  assert.equal(status.parent,h.body,'the explanation must live outside the overflow-clipped expert dock');
  assert.equal(h.controls.querySelector('.quality-status'),null,'reparenting must remove the old nested node');
  assert.equal(h.document.getElementById(h.button('best').attrs['aria-describedby']),status);
  assert.equal(status.attrs.role,'status');assert.equal(status.hidden,false);
  assert.equal(h.body.children.filter(node=>node.attrs.id==='xtanco-best-status').length,1);
  await h.window.__xtancoVisualTiers.choose('good');assert.equal(status.hidden,true);
  h.button('best').click();assert.equal(status.hidden,false);assert.equal(h.status,status);
});

test('public Better preserves the legacy Good renderer facade and exterior traffic styling',async()=>{
  const h=selectorHarness({search:'?visual=life'}),facade=h.window.__xtancoPremiumView;
  assert.equal(h.body.dataset.xtancoTier,'better');assert.equal(h.button('better').attrs['aria-pressed'],'true');
  assert.equal(h.controls.attrs['aria-busy'],'false');
  for(const tier of ['good','better','best']){
    await facade.open(tier);
    assert.equal(h.body.dataset.xtancoVisual,'good');assert.equal(facade.mode,'good');
    assert.equal(facade.begin(),false);assert.equal(facade.operationContext('device'),null);assert.equal(facade.paint(),undefined);
  }
  await facade.open();assert.equal(h.body.dataset.xtancoTier,'better');
  h.life.emit({open:false,busy:false,error:''});assert.equal(h.button('good').attrs['aria-pressed'],'true');
  await facade.close();assert.equal(h.body.dataset.xtancoTier,'good');
});

test('expert buttons consume game keyboard events and update actual pressed state when Better closes',()=>{
  const h=selectorHarness();assert.equal(h.button('better').click().stopped,true);
  assert.equal(h.body.dataset.xtancoTier,'better');assert.equal(h.button('better').attrs['aria-pressed'],'true');
  for(const type of ['keydown','keyup','keypress']){
    const event={stopped:false,stopPropagation(){this.stopped=true;}};
    for(const handler of h.controls.listeners[type]||[])handler(event);assert.equal(event.stopped,true);
  }
  h.life.closeLifeView();assert.equal(h.button('good').attrs['aria-pressed'],'true');assert.equal(h.button('better').attrs['aria-pressed'],'false');
});

test('selector boots safely with denied storage or stale legacy Best and never imports the retired controller',()=>{
  for(const options of [{storageBlocked:true},{storage:memoryStorage({xtanco_visual_quality:'best'})}]){
    const h=selectorHarness(options);assert.equal(h.body.dataset.xtancoTier,'good');assert.equal(h.life.calls.open,0);
  }
  const imports=[...selectorSource.matchAll(/^import .* from ['"]([^'"]+)['"]/gm)].map(match=>match[1]);
  assert.deepEqual(imports,['./life-ui.mjs','./xtanco-visual-tiers.mjs']);
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.equal([...html.matchAll(/<script\b[^>]*src="scripts\/xtanco-premium-ui\.mjs[^\"]*"/g)].length,1);
  assert.doesNotMatch(html,/<script\b[^>]*src="scripts\/life-ui\.mjs/);
});
