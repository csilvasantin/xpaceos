/* Shared local visibility and reversible furniture removal records. */
(function(root){
'use strict';
const prefix='xpaceos:inventari:v1:',removalPrefix='xpaceos:inventory-removals:v1:',listeners=new Set();
const valid=s=>typeof s==='string'&&s.length>0&&s.length<180&&!['__proto__','constructor','prototype'].includes(s);
function read(space){try{const d=JSON.parse(root.localStorage.getItem(prefix+space)||'{}');return d&&typeof d==='object'&&!Array.isArray(d)?d:{};}catch{return {};}}
function removals(space){const raw=root.localStorage.getItem(removalPrefix+space);if(!raw)return {removed:{},undo:null};const value=JSON.parse(raw);if(!value||!value.removed||typeof value.removed!=='object'||Array.isArray(value.removed))throw Error('Registro de inventario no válido');return value;}
function retained(space,layout){let removed;try{removed=removals(space).removed;}catch{return layout;}return layout.filter(i=>!Object.hasOwn(removed,i.id));}
function visible(space,id){return !valid(id)||read(space)[id]?.visible!==false;}
function save(space,id,value){if(!valid(space)||!valid(id)||typeof value!=='boolean')throw Error('Elemento no válido');const d=read(space);d[id]={visible:value,updatedAt:Date.now()};root.localStorage.setItem(prefix+space,JSON.stringify(d));emit(space);}
function restore(space){if(!valid(space))throw Error('Xpacio no válido');root.localStorage.removeItem(prefix+space);emit(space);}
function emit(space){for(const fn of listeners){try{fn(space);}catch{}}try{root.dispatchEvent?.(new Event('xpaceos-inventory-change'));}catch{}}
root.addEventListener?.('storage',e=>{if(e.key?.startsWith(prefix))emit(e.key.slice(prefix.length));if(e.key?.startsWith(removalPrefix))emit(e.key.slice(removalPrefix.length));});
root.XpaceInventory={removals,retained,notify:emit,writeRemovals(space,value){if(!valid(space))throw Error("Xpacio no válido");root.localStorage.setItem(removalPrefix+space,JSON.stringify(value));},visible,setVisible:save,restore,read,subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},
 filter(space,layout){const d=read(space);return retained(space,layout).filter(i=>d[i.id]?.visible!==false);},
 publish(space,layout){try{const value=JSON.stringify(layout);const key='xpaceos:inventory-layout:'+space;if(root.localStorage.getItem(key)!==value)root.localStorage.setItem(key,value);}catch{}},
 layout(space){try{const d=JSON.parse(root.localStorage.getItem('xpaceos:inventory-layout:'+space));return Array.isArray(d)?d:null;}catch{return null;}}};
})(typeof window==='undefined'?globalThis:window);
