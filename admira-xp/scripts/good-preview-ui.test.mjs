import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('./good-preview-ui.mjs',import.meta.url),'utf8');

test('Good opens inside the shared 8:5 comparison shell and keeps tier changes in that frame',()=>{
  const frames=[],cancelled=[],choices=[],draws=[],controlOptions=[];
  class Element{
    constructor(tag){this.tag=tag;this.children=[];this.queries=new Map();this.listeners={};this.hidden=false;this.parent=null;}
    setAttribute(name,value){(this.attrs??={})[name]=String(value);}
    set innerHTML(value){this.markup=value;}
    get innerHTML(){return this.markup;}
    querySelector(selector){
      if(!this.queries.has(selector)){
        const node=new Element(selector);node.parent=this;
        if(selector==='.good-canvas')node.getContext=()=>({clearRect(){},drawImage(...args){draws.push(args);}});
        if(selector==='.best-image-error')node.hidden=true;
        this.queries.set(selector,node);this.children.push(node);
      }
      return this.queries.get(selector);
    }
    addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
    append(...nodes){for(const node of nodes){node.remove?.();node.parent=this;this.children.push(node);}}
    remove(){if(this.parent){const i=this.parent.children.indexOf(this);if(i>=0)this.parent.children.splice(i,1);}this.parent=null;this.removed=true;}
    showModal(){this.open=true;} close(){this.open=false;} focus(){}
  }
  const body=new Element('body'),canvas=new Element('source');canvas.width=800;canvas.height=500;
  const document={body,activeElement:new Element('previous'),createElement:tag=>new Element(tag),getElementById:id=>id==='c'?canvas:null};
  const window={__xtancoVisualTiers:{choose:(mode,options)=>choices.push([mode,options])},__xtancoReleaseInputs(){},addEventListener(){}};
  const createTierControls=options=>{controlOptions.push(options);return {element:new Element('tiers'),dispose(){}};};
  const context=vm.createContext({document,window,createTierControls,requestAnimationFrame:fn=>(frames.push(fn),frames.length),cancelAnimationFrame:id=>cancelled.push(id)});
  vm.runInContext(source.replace(/^import .*;\n/gm,'').replace(/export function /g,'function ')+';globalThis.audit={openGoodView,closeGoodView,get dialog(){return dialog;}};',context);
  context.audit.openGoodView({requestId:7});const dialog=context.audit.dialog;
  assert.match(dialog.className,/visual-tier-dialog/);assert.match(dialog.innerHTML,/visual-tier-stage/);assert.match(dialog.innerHTML,/mismo encuadre 8:5/);
  assert.equal(draws.length,1);controlOptions[0].choose('better');assert.equal(choices.length,1);assert.equal(choices[0][0],'better');assert.equal(choices[0][1].preserveFrame,true);
  context.audit.closeGoodView();assert.equal(dialog.removed,true);assert.equal(cancelled.length,1);
});
