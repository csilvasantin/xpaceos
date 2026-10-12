import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {runAndroid,parseAndroid} from '../suite/demo-android.mjs';
const shell=fs.readFileSync(new URL('../assets/xpace-shell.js',import.meta.url),'utf8');
const context=shell.slice(shell.indexOf('  function nativeDemoContext()'),shell.indexOf('  // End native demo context.'));
function provider(selected='',query='',existing){const root={document:{querySelector(){return selected?{value:selected}:null;}},location:{href:'https://www.xpaceos.com/admira-xp/'+query},AdmiraIOSDemoContext:existing};vm.runInNewContext(context,{root,URL});return root;}
test('native command context reads current selector at execution and retains existing adapter',()=>{
 const r=provider('starbucks','?project=old');assert.equal(r.AdmiraAndroidDemoContext().project,'starbucks');
 const adapter=()=>({project:'owner',playlistIds:['bound']});const p=provider('other','',adapter);assert.equal(p.AdmiraIOSDemoContext,adapter);assert.equal(p.AdmiraAndroidDemoContext,adapter);
 assert.equal(provider('','?project=sneakers-store').AdmiraAndroidDemoContext().project,'sneakers-store');
});
test('all three Android commands preserve project and use isolated declarative destinations',async()=>{
 for(const [text,device] of [['/demo android','both'],['/demo android Fold8','fold'],['/demo android watch','watch']]){
  const r=provider('starbucks');let url;r.location.assign=x=>url=x;
  await runAndroid(text,r);const u=new URL(url);assert.equal(u.protocol,'admira-android-demo:');const request=JSON.parse(Buffer.from(u.searchParams.get('request'),'base64url'));
  assert.equal(request.project,'starbucks');assert.equal(request.device,device);assert.equal(request.origin,'https://www.xpaceos.com');
 }
});
test('missing project and malformed target fail before navigation; tag selector remains explicit',async()=>{
 const r=provider();let navigated=false;r.location.assign=()=>navigated=true;await assert.rejects(runAndroid('/demo android',r),/proyecto/);assert.equal(navigated,false);
 assert.throws(()=>parseAndroid('/demo android fold watch'));assert.deepEqual(parseAndroid('/demo android watch #musica').selector,{kind:'tags',tags:['musica']});
});
test('all shipped bootstrap paths stay local and docs remain separate from execution',()=>{
 assert.ok(shell.includes("BASE = '/suite/experto'"));assert.ok(shell.includes('/suite/loader.js?v=20261012-android-five-1'));
 const loader=fs.readFileSync(new URL('../suite/loader.js',import.meta.url),'utf8');assert.equal(loader.includes('https://www.admiranext.com/suite/experto'),false);
 for(const rel of ['help/index.html','help/cli/index.html','admira-xp/help.html','mcp/index.html']){const text=fs.readFileSync(new URL('../'+rel,import.meta.url),'utf8');assert.ok(text.includes('id="native-players"'));assert.ok(text.includes('dddb19c869cc0feb.mp4'));}
 const m=JSON.parse(fs.readFileSync(new URL('../mcp/manifest.json',import.meta.url)));assert.equal(m.native_players.new_mcp_execution_tool,false);assert.equal(m.native_players.shared_audio_clock,false);
});
