import test from 'node:test';
import assert from 'node:assert/strict';
import {createStarbucksMusic,musicTracks,STARBUCKS_FEED} from './starbucks-music.mjs';
class AudioStub extends EventTarget{
 constructor(){super();this.src='';this.currentTime=0;this.playCalls=0;this.pauseCalls=0;this.loadCalls=0;}
 load(){this.currentTime=0;this.loadCalls++;}
 play(){this.playCalls++;this.paused=false;return this.reject?Promise.reject(Error()):Promise.resolve();}
 pause(){this.pauseCalls++;this.paused=true;}
 removeAttribute(){this.src='';}
}
const songs=[1,2,3].map(n=>({url:`https://audio.example/${n}.mp3`,title:`Track ${n}`}));
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function setup(){const audio=new AudioStub();let feed=songs;const music=createStarbucksMusic({audio,fetchFeed:async()=>({ok:true,json:async()=>({ok:true,playlist:feed})})});return {audio,music,setFeed(value){feed=value;}};}
test('playlist uses an isolated Starbucks feed and rejects invalid media URLs',()=>{
 assert.match(STARBUCKS_FEED,/store=starbucks-alsea-paseo-de-gracia&since=0/);
 assert.deepEqual(musicTracks([...songs,songs[0],{url:'javascript:alert(1)'},{url:'https://user:secret@example.com/a'},null]),songs);
});
test('loading does not autoplay; mute/unmute never pause, reload or reset position',async()=>{
 const {audio,music}=setup();await music.refresh();assert.equal(audio.playCalls,0);assert.equal(audio.muted,true);
 music.toggle();await tick();audio.currentTime=43;const loads=audio.loadCalls;
 music.toggle();assert.equal(audio.muted,true);assert.equal(audio.currentTime,43);assert.equal(audio.pauseCalls,0);assert.equal(audio.loadCalls,loads);
 audio.currentTime=49;music.toggle();assert.equal(audio.muted,false);assert.equal(audio.currentTime,49);assert.equal(audio.playCalls,1);music.dispose();
});
test('playlist advances and loops while muted, retaining mute on the next song',async()=>{
 const {audio,music}=setup();await music.refresh();music.toggle();await tick();music.toggle();
 for(const n of [2,3,1]){audio.dispatchEvent(new Event('ended'));await tick();assert.equal(audio.src,`https://audio.example/${n}.mp3`);assert.equal(audio.muted,true);assert.equal(audio.paused,false);}
 music.dispose();
});
test('refresh and leaving the view retain the running track and time',async()=>{
 const {audio,music,setFeed}=setup();await music.refresh();music.toggle();await tick();audio.currentTime=12;
 setFeed([songs[2],songs[0],songs[1]]);await music.refresh();assert.equal(audio.currentTime,12);assert.equal(music.state().index,1);
 music.mute();assert.equal(audio.pauseCalls,0);assert.equal(music.state().started,true);
 setFeed([]);await music.refresh();assert.equal(audio.currentTime,12);assert.equal(music.state().tracks,3);music.dispose();
});
test('empty playlist and blocked playback never report playing; explicit retry works',async()=>{
 const {audio,music,setFeed}=setup();setFeed([]);await music.refresh();music.toggle();await tick();assert.equal(music.state().started,false);assert.equal(audio.playCalls,0);
 setFeed(songs);await music.refresh();audio.reject=true;music.toggle();await tick();assert.equal(music.state().error,'play');assert.equal(audio.muted,true);
 audio.reject=false;music.toggle();await tick();assert.equal(music.state().started,true);assert.equal(audio.muted,false);music.dispose();
});
test('failed tracks skip without an infinite loop when every URL fails',async()=>{
 const {audio,music}=setup();await music.refresh();music.toggle();await tick();
 for(let i=0;i<3;i++){audio.dispatchEvent(new Event('error'));await tick();}
 assert.equal(audio.playCalls,3);assert.equal(music.state().started,false);assert.equal(music.state().error,'media');assert.equal(audio.muted,true);music.dispose();
});

test('published Stock selection survives an empty/expired feed and remains playable when offline',async()=>{
 const audio=new AudioStub();let feed=null;
 const music=createStarbucksMusic({audio,publishedTracks:[songs[0]],fetchFeed:async()=>{if(feed===null)throw Error('offline');return {ok:true,json:async()=>({playlist:feed})};}});
 assert.equal(music.state().tracks,1);assert.equal(audio.playCalls,0);await music.refresh();
 music.toggle();await tick();assert.equal(audio.src,songs[0].url);assert.equal(audio.muted,false);
 audio.currentTime=70;feed=[];await music.refresh();assert.equal(audio.currentTime,70);assert.equal(music.state().tracks,1);
 feed=[songs[0],songs[1]];await music.refresh();assert.equal(music.state().tracks,2);assert.equal(audio.currentTime,70);
 music.toggle();audio.dispatchEvent(new Event('ended'));await tick();assert.equal(audio.src,songs[1].url);assert.equal(audio.muted,true);music.dispose();
});
