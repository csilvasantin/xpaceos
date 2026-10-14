import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../suite/loader.js',import.meta.url),'utf8');
test('shell loader mounts one canonical engine with its native console selectors',()=>{
 const nodes=[];const panel={querySelector:s=>['#xsCli','#xsCliForm','#xsLog'].includes(s)?{}:null};
 const document={querySelector:s=>s==='#xpaceShell'?panel:null,createElement:tag=>({tag,dataset:{},setAttribute(){}}),head:{appendChild:n=>nodes.push(n)}};const window={};
 vm.runInNewContext(source,{window,document});vm.runInNewContext(source,{window,document});
 const script=nodes.find(n=>n.tag==='script'),css=nodes.find(n=>n.tag==='link');assert.equal(nodes.length,2);assert.equal(script.dataset.panel,'#xpaceShell');assert.equal(script.dataset.input,'#xsCli');assert.equal(script.dataset.min,'hide');assert.match(script.src,/^https:\/\/www\.admiranext\.com\/suite\/experto\.js/);assert.match(css.href,/^https:\/\/www\.admiranext\.com\/suite\/experto\.css/);
});
test('an existing engine is not mounted twice',()=>{vm.runInNewContext(source,{window:{AdmiraExperto:{}},document:{querySelector(){throw Error('must not mount another engine');}}});});
