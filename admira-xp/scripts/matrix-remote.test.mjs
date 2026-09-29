import test from 'node:test';import assert from 'node:assert/strict';import {validMatrixState,watchMatrixState} from './matrix-remote.mjs';
const state=()=>({schemaVersion:1,store:'starbucks-alsea-paseo-de-gracia',revision:1,musicNext:0,controlRevision:{},controls:{},playlists:Object.fromEntries(['wall','tpv','music'].map(k=>[k,{tracks:[]}]))});
test('shared state accepts empty playlists but rejects unsafe media and unsupported functions',()=>{const s=state();assert.equal(validMatrixState(s),true);s.playlists.tpv.tracks=[{id:'a',title:'a',url:'javascript:alert(1)'}];assert.equal(validMatrixState(s),false);s.playlists.tpv.tracks=[];s.controls.run='code';assert.equal(validMatrixState(s),false);});
test('poll applies only newer revisions, keeps last state on failure and disposes pending work',async()=>{
 let calls=0,applied=[],statuses=[];const stop=watchMatrixState({interval:5,onState:s=>applied.push(s.revision),onStatus:s=>statuses.push(s),fetcher:async()=>{calls++;if(calls>2)throw Error('offline');return {ok:true,json:async()=>state()};}});
 await new Promise(r=>setTimeout(r,35));stop();const count=calls;await new Promise(r=>setTimeout(r,15));assert.deepEqual(applied,[1]);assert.ok(statuses.some(s=>s.error));assert.equal(calls,count);
});
