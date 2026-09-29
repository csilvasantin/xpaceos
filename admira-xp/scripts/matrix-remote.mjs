export const MATRIX_STATE_URL='https://mcp.admira.store/matrix/starbucks';
export function validMatrixState(s){
 if(!s||s.schemaVersion!==1||s.store!=='starbucks-alsea-paseo-de-gracia'||!Number.isInteger(s.revision)||s.revision<0||!s.controlRevision||!Number.isInteger(s.musicNext)||s.musicNext<0)return false;
 for(const name of ['wall','tpv','music']){const p=s.playlists?.[name];if(!p||!Array.isArray(p.tracks)||p.tracks.length>100)return false;
  for(const t of p.tracks){try{const u=new URL(t.url);if(u.protocol!=='https:'||u.username||u.password||typeof t.title!=='string'||typeof t.id!=='string')return false;}catch{return false;}}
 }
 if(!s.controls||typeof s.controls!=='object')return false;
 return Object.entries(s.controls).every(([k,v])=>['wallPlaying','tpvPlaying','numbersVisible'].includes(k)?typeof v==='boolean':k==='wallMode'?['individual','groups','total'].includes(v):k==='musicMuted'&&v===true);
}
export function watchMatrixState({onState,onStatus=()=>{},fetcher=fetch,interval=5000}){
 let stopped=false,timer,request,revision=-1;
 async function poll(){
  request=new AbortController();const timeout=setTimeout(()=>request.abort(),8000);
  try{const r=await fetcher(MATRIX_STATE_URL,{cache:'no-store',signal:request.signal});if(!r.ok)throw Error('fetch');const state=await r.json();if(!validMatrixState(state))throw Error('state');if(stopped)return;
   if(state.revision>revision){onState(state);revision=state.revision;}onStatus({revision,error:false});
  }catch{if(!stopped)onStatus({revision,error:true});}
  finally{clearTimeout(timeout);if(!stopped)timer=setTimeout(poll,interval);}
 }
 void poll();return ()=>{stopped=true;clearTimeout(timer);request?.abort();};
}
