import {createScreenPlaylist} from './screen-playlist.mjs?v=playlist-play-1';
import {assignedPlaylist,emptyDeviceLayout} from './device-layout.mjs?v=devices-1';
// One local playback clock per playlist. Pause partitions keep wall/POS controls independent.
export function createDevicePlayback({onState=()=>{}}={}){
 let entries=[],layout=emptyDeviceLayout(),defaults={},disposed=false,reconciling=false;const buckets=new Map(),paused=new Set();
 const notify=()=>{if(!disposed&&!reconciling)onState();};
 function reconcile(){if(disposed)return;reconciling=true;const next=new Map();
  for(const entry of entries){const pid=assignedPlaylist(layout,entry.id),key=pid+':'+(paused.has(entry.id)?'paused':'playing');if(!next.has(key))next.set(key,{pid,entries:[],tracks:(layout.playlists[pid]||defaults[pid])?.tracks||[]});next.get(key).entries.push(entry);}
  for(const [key,b] of buckets)if(!next.has(key)||next.get(key).entries.map(e=>e.id).join()!==b.ids||next.get(key).entries.some((e,i)=>e.video!==b.entries[i]?.video)){b.player.dispose();buckets.delete(key);}
  for(const [key,b] of next){let old=buckets.get(key);const json=JSON.stringify(b.tracks);if(old){if(old.tracks!==json){old.player.replaceTracks(b.tracks);old.tracks=json;}continue;}
   const videos=b.entries.map(e=>e.video);if(!b.tracks.length)for(const v of videos){v.pause();v.removeAttribute('src');v.load();}else if(key.endsWith(':paused'))for(const v of videos)if(!b.tracks.some(t=>t.url===v.getAttribute('src'))){v.src=b.tracks[0].url;v.load();v.pause();}const player=createScreenPlaylist({videos,tracks:b.tracks,initialURL:videos[0]?.getAttribute('src'),onState:notify});old={player,ids:b.entries.map(e=>e.id).join(),entries:b.entries,tracks:json};buckets.set(key,old);if(!key.endsWith(':paused'))void player.play();
  }reconciling=false;notify();
 }
 return {
  update({devices=entries,config=layout,catalog=defaults}={}){entries=devices;layout=config;defaults=catalog;reconcile();},
  setPlaying(ids,value){for(const id of ids)value?paused.delete(id):paused.add(id);reconcile();if(value)for(const b of buckets.values())if(b.entries.some(e=>ids.includes(e.id))&&!b.player.state().playing)void b.player.play();},
  async jump(playlistId,trackId){
   const tracks=(layout.playlists[playlistId]||defaults[playlistId])?.tracks||[];
   if(!tracks.some(t=>t.id===trackId||t.stockId===trackId))throw Error('Unknown track');
   const members=entries.filter(e=>assignedPlaylist(layout,e.id)===playlistId);
   if(!members.length)throw Error('No active devices use this playlist');
   for(const e of members)paused.delete(e.id);reconcile();
   const bucket=buckets.get(playlistId+':playing');
   return bucket.player.jump(trackId);
  },
  state(ids){const chosen=[...buckets.values()].filter(b=>b.entries.some(e=>ids.includes(e.id)));return {playing:chosen.some(b=>b.player.state().playing),error:chosen.some(b=>b.player.state().error),count:entries.filter(e=>ids.includes(e.id)).length};},
  dispose(){disposed=true;for(const b of buckets.values())b.player.dispose();buckets.clear();}
 };
}
