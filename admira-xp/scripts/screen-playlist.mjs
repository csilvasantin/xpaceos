// All virtual screens follow the first video's clock; no audio output or physical writes.
export function createScreenPlaylist({videos,tracks,onState=()=>{}}){
 let index=0,disposed=false,playing=false,error=false,generation=0;
 const emit=()=>onState({playing,error,index,count:videos.length,title:tracks[index]?.title||''});
 for(const v of videos){v.muted=true;v.playsInline=true;v.loop=false;v.preload='auto';}
 const sync=()=>{const lead=videos[0];if(!playing||!lead||lead.readyState<2)return;for(const v of videos.slice(1)){if(v.readyState>=2&&Math.abs(v.currentTime-lead.currentTime)>.2)v.currentTime=lead.currentTime;}};
 const timer=setInterval(sync,500);
 async function play(){
  if(disposed||!tracks.length||!videos.length)return;
  const ticket=++generation;error=false;
  for(const v of videos)if(v.getAttribute('src')!==tracks[index].url){v.src=tracks[index].url;v.load();}
  const results=await Promise.allSettled(videos.map(v=>v.play()));
  if(disposed||ticket!==generation)return;
  error=results.some(r=>r.status==='rejected');playing=!error;
  if(error)for(const v of videos)v.pause();else sync();emit();
 }
 function pause(){++generation;playing=false;for(const v of videos)v.pause();emit();}
 const ended=()=>{if(!playing||disposed)return;index=(index+1)%tracks.length;for(const v of videos){v.src=tracks[index].url;v.load();}void play();};
 const failed=()=>{pause();error=true;emit();};
 videos[0]?.addEventListener('ended',ended);for(const v of videos)v.addEventListener('error',failed);
 emit();
 return {play,pause,state:()=>({playing,error,index}),dispose(){disposed=true;++generation;clearInterval(timer);videos[0]?.removeEventListener('ended',ended);for(const v of videos){v.removeEventListener('error',failed);v.pause();}}};
}
