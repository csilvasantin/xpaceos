import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const require=createRequire(import.meta.url),shell=require('../assets/xpace-shell.js'),legacy=require('../assets/avatar-digital.js');
const source=readFileSync(new URL('../assets/xpace-shell.js',import.meta.url),'utf8'),html=readFileSync(new URL('../admira-xp/index.html',import.meta.url),'utf8');
function browser({fallback=false,fail=false}={}){
 const calls=[];let visible=false;
 const avatar={decide: fallback?legacy.decide:text=>/quizas/.test(text)?'bad':'on',async handle(text){calls.push(text);if(fail)throw Error('renderer unavailable');visible=!/off|apagar|ocultar/.test(text);return visible?'Avatar digital activado':'Avatar digital desactivado';}};
 const doc={documentElement:{lang:'es'},currentScript:{src:'https://www.xpaceos.com/assets/xpace-shell.js',dataset:{}},querySelector:()=>null,getElementById:id=>id==='topBar'?{}:null,createElement:()=>({setAttribute(){},remove(){}}),head:{append(script){queueMicrotask(()=>script.onerror());}}};
 const win={document:doc,location:{host:'www.xpaceos.com',href:'https://www.xpaceos.com/admira-xp/',search:''},self:1,top:2};
 if(fallback)win.AvatarDigital=avatar;else win.AdmiraAvatar=avatar;
 const ctx=vm.createContext({window:win,document:doc,URL,URLSearchParams,queueMicrotask});vm.runInContext(source,ctx);
 return {api:win.XpaceShell,calls,get visible(){return visible;}};
}
test('spaced digital commands and existing aliases normalize locally, retaining scene and CLI ownership',()=>{
 for(const [text,expected]of [['/avatar digital off','/avatardigital off'],['/AVATAR Digital ON','/avatardigital ON'],['/avatar@bot digital apagar','/avatardigital apagar'],['/avatarDigital','/avatardigital'],['/admirito','/admirito'],['/avatar status','/avatar'],['/cli helper off','/cli helper off']]){assert.equal(shell.avatarCommandText(text),expected);assert.equal(shell.isAvatarCommand(text),true);}
 for(const text of ['/avatar3d off','/cli distribuir','/marca off','/avatar quizas','/cli good extra'])assert.equal(shell.avatarCommandText(text),null);
});
test('the native adapter confirms rendered state for on and off with canonical commands',async()=>{
 const h=browser();assert.equal((await h.api.avatarCommand('/avatar digital on')).ok,true);assert.equal(h.visible,true);assert.equal((await h.api.avatarCommand('/avatar digital off')).message,'Avatar digital desactivado');assert.equal(h.visible,false);assert.deepEqual(h.calls,['/avatardigital on','/avatardigital off']);
});
test('fallback receives supported on/off commands for spaced and historical aliases',async()=>{
 const h=browser({fallback:true});for(const text of ['/avatar digital on','/avatarON','/avatar on']){assert.equal((await h.api.avatarCommand(text)).ok,true);assert.equal(h.visible,true);}for(const text of ['/avatar digital off','/avatarOFF','/avatar off']){assert.equal((await h.api.avatarCommand(text)).ok,true);assert.equal(h.visible,false);}assert.equal((await h.api.avatarCommand('/avatar better')).ok,false);
});
test('invalid arguments and renderer failures report failure rather than success or remote dispatch',async()=>{
 const h=browser();for(const text of ['/avatar digital quizas','/avatar digital off extra','/avatar digital off\n/marca off']){const result=await h.api.avatarCommand(text);assert.equal(result.ok,false);assert.equal(result.local,true);}assert.deepEqual(h.calls,[]);const broken=browser({fail:true});assert.equal((await broken.api.avatarCommand('/avatar digital on')).ok,false);assert.equal(await h.api.avatarCommand('/avatar3d off'),null);
});
test('native keyless/Advanced and composer paths stop before any remote or scene command',async()=>{
 const h=browser();const local=html.slice(html.indexOf('  async function executeLocalVisualCommand('),html.indexOf('  async function executeTelegramText('));const ctx=vm.createContext({window:{XpaceShell:{...h.api,language:()=>null}},executePeopleVisibilityCommand(){throw Error('Unexpected scene dispatch');}});vm.runInContext(local,ctx);assert.equal((await ctx.executeLocalVisualCommand('/avatar digital off')).kind,'avatar');assert.equal(h.visible,false);
 const composer=html.slice(html.indexOf('  async function sendComposerText('),html.indexOf('    // The visual command belongs',html.indexOf('  async function sendComposerText(')))+'\n}';let state;
 Object.assign(ctx,{hideHelpPanel(){},appendTelegramLog(){},showLastResponse(text,kind){state=kind;},composer:{value:'/avatar digital on'},renderQuickActionButtons(){}});vm.runInContext(composer,ctx);await ctx.sendComposerText('/avatar digital on');assert.equal(h.visible,true);assert.equal(state,'ok');await ctx.sendComposerText('/avatar digital quizas');assert.equal(state,'err');
});
test('native category controls call the same assistant adapter separately from totem actions',()=>{
 const detail=readFileSync(new URL('../admira-xp/scripts/expert-category-detail.js',import.meta.url),'utf8');assert.match(detail,/XpaceShell\.avatarCommand\(text\)/);for(const text of ['/avatar digital on','/avatar digital off','/avatar3d on','/avatar3d off','Turn on totem','Digital avatar · off'])assert.ok(detail.includes(text),text);
});
test('web help, tutorial, CLI and both catalogues declare the same bilingual local contract',()=>{
 for(const file of ['admira-xp/help.html','help/index.html','help/cli/index.html','mcp/index.html']){const text=readFileSync(new URL('../'+file,import.meta.url),'utf8').match(/<section id="avatar-controls">([\s\S]*?)<\/section>/)?.[1];assert.ok(text,file);for(const copy of ['lang="es"','lang="en"','/avatar digital on','/avatar digital off','Telegram','MCP','tótem','totem'])assert.ok(text.includes(copy),copy);}
 for(const file of ['mcp/manifest.json','mcp/funcionalidades.json']){const c=JSON.parse(readFileSync(new URL('../'+file,import.meta.url),'utf8')).avatar_controls;assert.equal(c.local,true);assert.equal(c.new_remote_tool,false);assert.equal(c.independent_scene_command,'/avatar3d on|off');}
});
