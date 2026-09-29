import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const js = readFileSync(new URL('./demo.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('./demo.css', import.meta.url), 'utf8');
const xlsx = readFileSync(new URL('./plantilla-cafeteria.xlsx', import.meta.url));

for (const os of ['Windows', 'Linux', 'macOS', 'Android', 'iOS']) assert.match(html, new RegExp(os));
for (const word of ['pantalla', 'tablet', 'telefono', 'horizontal', 'vertical', 'anamorfico', 'lineal', 'aleatoria', 'sincronizada']) {
  assert.match(html, new RegExp(word));
}
assert.match(html, /Importar Excel/);
assert.match(html, /plantilla-cafeteria\.xlsx/);
assert.match(html, /data-tier="good"/);
assert.match(html, /data-tier="better"/);
assert.match(html, /data-tier="best"/);
assert.match(html, /data-objeto="taza"/);
assert.match(html, /data-objeto="vitrina"/);
assert.match(html, /data-objeto="cartel"/);
assert.match(html, /id="entra"/);
assert.match(html, /id="split"/);
assert.match(js, /1790609061411-86drpb/);
assert.match(js, /1790608402098-xubtdh/);
assert.match(js, /split'\) === '1'|get\('split'\) === '1'/);
assert.match(css, /grid-template-columns/);
assert.equal(xlsx.subarray(0, 2).toString(), 'PK');
assert.doesNotMatch(html + js, /suno/i);
assert.doesNotMatch(js, /signage\/push/);

const xml = await sheetXml(Uint8Array.from(xlsx).buffer);
for (const os of ['Windows', 'Linux', 'macOS', 'Android', 'iOS']) assert.match(xml, new RegExp(os));
assert.match(xml, /EJEMPLO/);
assert.match(xml, /anamorfico/);
console.log('demo-alsea ok');

async function sheetXml(buf) {
  const view = new DataView(buf);
  const dec = new TextDecoder();
  let o = 0;
  while (o + 30 < buf.byteLength && view.getUint32(o, true) === 0x04034b50) {
    const method = view.getUint16(o + 8, true);
    const size = view.getUint32(o + 18, true);
    const nameLen = view.getUint16(o + 26, true);
    const extra = view.getUint16(o + 28, true);
    const name = dec.decode(new Uint8Array(buf, o + 30, nameLen));
    const start = o + 30 + nameLen + extra;
    const comp = new Uint8Array(buf, start, size);
    let raw = comp;
    if (method === 8) {
      const stream = new Blob([comp]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      raw = new Uint8Array(await new Response(stream).arrayBuffer());
    }
    if (name.endsWith('sheet1.xml')) return dec.decode(raw);
    o = start + size;
  }
  throw new Error('sheet missing');
}
