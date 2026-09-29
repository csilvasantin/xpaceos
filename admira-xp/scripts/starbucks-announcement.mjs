export const CLOSING_ANNOUNCEMENT={id:'starbucks-cierre-22h',text:'Hoy por motivos de fiesta local, nuestro horario de cierre es a las 22 horas. Gracias.',url:new URL('../assets/audio/starbucks-cierre-22h.m4a',import.meta.url).href,language:'es-ES',voice:'macOS Mónica (free local synthesis)'};
export const ANNOUNCEMENT_SPEAKER={yaw:-23.289684,pitch:21.400960};
export function createAnnouncement({audio,music,onState=()=>{}}){
 let playing=false,pending=false,error='',disposed=false,version=0,release=null;
 audio.src=CLOSING_ANNOUNCEMENT.url;audio.preload='metadata';audio.volume=1;
 const emit=()=>onState({playing,pending,error});
 function stop(){++version;audio.pause();audio.currentTime=0;playing=false;pending=false;release?.();release=null;emit();}
 async function play(){
  if(disposed)return;stop();error='';pending=true;const ticket=++version;release=music.suppress();emit();
  try{await audio.play();if(disposed||ticket!==version)return;pending=false;playing=true;emit();}
  catch{if(disposed||ticket!==version)return;stop();error='play';emit();}
 }
 const ended=()=>stop(),failed=()=>{stop();error='media';emit();};audio.addEventListener('ended',ended);audio.addEventListener('error',failed);
 return {play,stop,toggle:()=>playing||pending?stop():void play(),state:()=>({playing,pending,error}),dispose(){disposed=true;stop();audio.removeEventListener('ended',ended);audio.removeEventListener('error',failed);audio.removeAttribute('src');audio.load();}};
}
