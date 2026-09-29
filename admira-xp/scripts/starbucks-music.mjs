export const STARBUCKS_STORE='starbucks-alsea-paseo-de-gracia';
export const STARBUCKS_FEED=`https://api.admira.store/hilomusical/next?store=${STARBUCKS_STORE}&since=0`;
// Physical wall speaker, above and to the left of the emergency-exit sign.
export const STARBUCKS_SPEAKER={yaw:-126.12658,pitch:9.74027};

export function musicTracks(value){
  if(!Array.isArray(value))return [];
  const seen=new Set();
  return value.flatMap(item=>{
    try{
      const url=new URL(item.url);
      if(url.protocol!=='https:'||url.username||url.password||seen.has(url.href))return [];
      seen.add(url.href);
      return [{url:url.href,title:String(item.title||'Starbucks · Alsea').slice(0,160)}];
    }catch{return [];}
  }).slice(0,100);
}

// One transport per page. Mute changes audibility, never transport position.
// Kept separate from the game's bgMusic, whose mute action pauses playback.
export function createStarbucksMusic({audio,fetchFeed=()=>fetch(STARBUCKS_FEED,{cache:'no-store'})}={}){
  let tracks=[],index=0,started=false,loading=false,error='',request=null,disposed=false;
  let playVersion=0;
  const listeners=new Set(),failed=new Set();
  audio.preload='metadata';audio.loop=false;audio.muted=true;audio.volume=.35;
  const state=()=>({tracks:tracks.length,index,title:tracks[index]?.title||'',started,muted:audio.muted,loading,error});
  const emit=()=>{for(const fn of listeners)fn(state());};
  async function play(){
    const version=++playVersion;
    try{await audio.play();if(disposed||version!==playVersion)return;error='';emit();}
    catch{if(disposed||version!==playVersion)return;started=false;audio.muted=true;error='play';emit();}
  }
  function select(next){index=next;audio.src=tracks[index].url;audio.load();}
  function next(){if(!started||!tracks.length||disposed)return;select((index+1)%tracks.length);void play();emit();}
  function mediaError(){
    if(disposed||!tracks.length)return;
    failed.add(tracks[index].url);
    const nextIndex=tracks.findIndex((t,i)=>i!==index&&!failed.has(t.url));
    if(started&&nextIndex>=0){select(nextIndex);void play();}
    else{++playVersion;started=false;audio.muted=true;error='media';}
    emit();
  }
  audio.addEventListener('ended',next);audio.addEventListener('error',mediaError);
  return {
    state,
    subscribe(fn){listeners.add(fn);fn(state());return ()=>listeners.delete(fn);},
    refresh(){
      if(request||disposed)return request;
      loading=true;emit();
      request=(async()=>{
        try{
          const response=await fetchFeed();if(!response.ok)throw Error('feed');
          const data=await response.json();if(data.ok===false)throw Error('feed');
          const incoming=musicTracks(data.playlist);if(disposed)return;
          // An empty/transient response must not cut off a playing song.
          if(incoming.length){
            const current=tracks[index]?.url,kept=incoming.findIndex(t=>t.url===current);
            tracks=kept<0&&started&&current?[tracks[index],...incoming]:incoming;
            index=kept>=0?kept:0;
            if(!started&&current!==tracks[index].url)select(index);
          }
          if(error==='feed')error='';
        }catch{if(!disposed)error='feed';}
        finally{loading=false;request=null;if(!disposed)emit();}
      })();return request;
    },
    toggle(){
      if(disposed)return;
      if(!tracks.length){void this.refresh();emit();return;}
      if(started){audio.muted=!audio.muted;emit();return;}
      const retry=!!error;failed.clear();started=true;error='';audio.muted=false;
      // Called synchronously by a real click so browsers can grant audio.
      if(retry||audio.src!==tracks[index].url)select(index);
      void play();emit();
    },
    mute(){audio.muted=true;emit();},
    dispose(){disposed=true;++playVersion;audio.pause();audio.removeAttribute('src');audio.load();audio.removeEventListener('ended',next);audio.removeEventListener('error',mediaError);listeners.clear();}
  };
}

let shared;
export function starbucksMusic(){
  if(!shared){
    const audio=new Audio();audio.id='starbucksMusic';audio.hidden=true;document.body.append(audio);
    shared=createStarbucksMusic({audio});
    window.addEventListener('pagehide',()=>shared.mute());
  }
  return shared;
}
