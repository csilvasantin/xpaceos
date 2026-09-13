import test from 'node:test';
import assert from 'node:assert/strict';
import {SCREEN,MirrorSession,playbackState,targetTime,allowedOrigin} from './xtore-window-core.mjs';
const p={id:'bicycle',url:'https://stock.admira.store/video.mp4',type:'video',title:'Bici',position:90,duration:180,paused:false,rate:1,ts:10000,loop:false};
test('only the selected window, origin, session and virtual screen can drive a mirror',()=>{
 const peer={},s=new MirrorSession({peer,origin:'https://admira.tv',session:'abc',now:()=>10000});
 const message={source:peer,origin:'https://admira.tv',data:{source:'admira-xtore-twin',screen:SCREEN,session:'abc',event:'playback',seq:1,ts:10000}};
 for(const bad of [{source:{}},{origin:'https://evil.test'},{data:{...message.data,screen:'other'}},{data:{...message.data,session:'other'}}])assert.equal(s.receive({...message,...bad}),null);
 assert.equal(s.receive(message).event,'playback');assert.equal(s.receive(message),null);
 assert.equal(s.receive({...message,data:{...message.data,seq:2,ts:5000}}),null);
 assert.equal(s.receive({...message,data:{...message.data,seq:2,ts:12000}}),null);
});
test('stale and unsafe media cannot keep showing an old conditional decision',()=>{
 assert.ok(playbackState(p,11000));assert.equal(playbackState(p,12501),null);
 for(const bad of [{url:'javascript:alert(1)'},{url:'http://localhost/private'},{url:'https://user:secret@stock.admira.store/a'},{type:'interactive'},{position:NaN},{position:-1},{rate:100},{paused:'false'},{ts:15000}])assert.equal(playbackState({...p,...bad},10000),null);
});
test('mirror follows the source time, preserves bicycle midpoint and never restarts on presence renewal',()=>{
 assert.equal(targetTime(p,10500),90.5);
 assert.equal(targetTime({...p,position:91,ts:11000},11500),91.5);
 assert.equal(targetTime({...p,paused:true},12000),90);
 assert.equal(targetTime({...p,position:179.9},12000),179.95);
 assert.equal(targetTime({...p,position:0,loop:true},10000),0);
});
test('production only accepts Admira origins; local test origins cannot be enabled remotely',()=>{
 assert.equal(allowedOrigin('https://admira.tv','https://xpaceos.com'),true);
 assert.equal(allowedOrigin('https://admira.tv.evil.test','https://xpaceos.com'),false);
 assert.equal(allowedOrigin('http://localhost:8791','https://xpaceos.com'),false);
 assert.equal(allowedOrigin('http://localhost:8791','http://localhost:8792'),true);
});
