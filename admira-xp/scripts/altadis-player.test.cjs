const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {test} = require('node:test');
const player = require('./altadis-player.js');
test('each screen uses its declared file and exact resolution, including LED', () => {
 const s={screen:'shop-1-p1',w:1080,h:1920,files:{adapted:{url:'/altadis/media/shop-1/p1.mp4',width:1080,height:1920}}};
 assert.equal(player.formatFor(s).src,s.files.adapted.url);
 assert.equal(player.formatFor({...s,w:1920}),null);
 const led={w:1536,h:192,files:{adapted:{url:'/led.mp4',width:1536,height:192}}};
 assert.ok(player.formatFor(led));
 assert.equal(player.sourceFor({w:1080,h:1920,files:{adapted:null}},'adapted').status,'pending');
 assert.equal(player.sourceFor({...s,files:{adapted:{url:'javascript:bad',width:1080,height:1920}}},'adapted').status,'invalid-file');
});
test('original keeps its own aspect while the native adapted file fills',()=>{
 assert.deepEqual(player.fitRect(1920,1080,160,90),{x:0,y:0,w:160,h:90});
 assert.ok(player.fitRect(1080,1920,160,90).x>54);
 const s={w:1920,h:1080,files:{original:{url:'/original.mp4',width:1080,height:1920},adapted:null}};
 assert.equal(player.sourceFor(s,'original').src,'/original.mp4');
 assert.equal(player.sourceFor(s,'adapted').src,null);
});
test('all nine locations have 18 distinct pending screen assignments and no video fallback',()=>{
 const d=JSON.parse(readFileSync(new URL('../../altadis/demo.json','file://'+__filename)));
 assert.equal(d.locations.length,9);assert.equal(d.source,null);
 const ids=new Set();
 d.locations.forEach((l,i)=>{
  assert.equal(l.id,'altadis-bcn-'+String(i+1).padStart(3,'0'));assert.equal(l.tourOrder,i+1);assert.equal(l.surfaces.length,2);
  l.surfaces.forEach(s=>{assert.equal(s.media,null);assert.equal(s.files.original,null);assert.equal(s.files.adapted,null);assert.ok(s.expectedFiles.adapted.includes(l.id));assert.ok(!ids.has(s.screen));ids.add(s.screen);});
 });
 assert.equal(ids.size,18);
 assert.doesNotMatch(JSON.stringify(d),/jti|tu sitio de siempre|1790932601282|1790932708532/i);
});
