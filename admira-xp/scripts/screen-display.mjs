// Spatial slices are independent of playback: changing layout never seeks or reloads media.
export const SCREEN_DISPLAY_KEY='xpaceos.starbucks.wall-display.v1';
export const SCREEN_DISPLAY_MODES={individual:[[1],[2],[3],[4],[5],[6]],groups:[[1,2,3],[4],[5,6]],total:[[1,2,3,4,5,6]]};
const listeners=new Set();
let current;
export function getScreenDisplayMode(){
 if(current)return current;
 try{const saved=globalThis.localStorage?.getItem(SCREEN_DISPLAY_KEY);if(Object.hasOwn(SCREEN_DISPLAY_MODES,saved))return current=saved;}catch{}
 return current='individual';
}
export function setScreenDisplayMode(mode){
 if(!Object.hasOwn(SCREEN_DISPLAY_MODES,mode))throw new Error('Invalid screen display mode');
 current=mode;try{globalThis.localStorage?.setItem(SCREEN_DISPLAY_KEY,mode);}catch{}
 for(const fn of listeners)fn(mode);return mode;
}
export function subscribeScreenDisplay(fn){listeners.add(fn);return ()=>listeners.delete(fn);}
export function screenSlice(id,mode){
 const number=Number(/^starbucks-wall-(0[1-6])$/.exec(id)?.[1]);
 const group=SCREEN_DISPLAY_MODES[mode]?.find(g=>g.includes(number));
 if(!group)return null;
 return {group:group.join('-'),width:group.length*100,left:-group.indexOf(number)*100,fit:group.length===1?'contain':'cover'};
}
export function parseScreenDisplayCommand(text){
 const m=String(text||'').trim().match(/^\/(sincro|sync|sincrototal|synctotal)(?:@\w+)?(?:\s+([\s\S]*))?$/i);
 if(!m)return null;
 const command=m[1].toLowerCase(),arg=(m[2]||'').trim().toLowerCase();
 if(['sincrototal','synctotal'].includes(command))return arg?{invalid:true}:{mode:'total'};
 if(['','on','grupos','groups'].includes(arg))return {mode:'groups'};
 if(['off','individual','individuales'].includes(arg))return {mode:'individual'};
 if(['total','all'].includes(arg))return {mode:'total'};
 return {invalid:true};
}
