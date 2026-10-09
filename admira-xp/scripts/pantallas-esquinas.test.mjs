import test from 'node:test';
import assert from 'node:assert/strict';
import {rectAEsquinas, rectDesdeEsquinas, normalizarGemelo, fusionarCalibracion, matriz3d, esConvexo, esquinasEnFoto, aFoto, deFoto, resolverXpacio, XPACIO_SNEAKERS} from './pantallas-esquinas.mjs';
import {readFileSync} from 'node:fs';
const near = (a, b, e = 1e-6) => assert.ok(Math.abs(a - b) < e, `${a} ≈ ${b}`);

test('rect sin rotar → 4 esquinas en orden SI·SD·ID·II', () => {
  const q = rectAEsquinas({x: .1, y: .2, w: .3, h: .4, rot: 0});
  assert.deepEqual(q.map(p => p.map(v => +v.toFixed(6))), [[.1, .2], [.4, .2], [.4, .6], [.1, .6]]);
});
test('rect rotado en píxeles ida y vuelta (foto no cuadrada)', () => {
  const foto = {ancho: 3226, alto: 1168}, q = rectAEsquinas({x: 2000, y: 300, w: 900, h: 400, rot: -14}, foto);
  assert.ok(esConvexo(q)); const r = rectDesdeEsquinas(q, foto);
  near(r.rot, -14, 1e-9); near(r.w * 3226, 900, 1e-6); near(r.h * 1168, 400, 1e-6); near(r.cx * 3226, 2450, 1e-6); near(r.cy * 1168, 500, 1e-6);
});
test('gemelo antiguo (solo rect) sigue pintando: se convierte al vuelo', () => {
  const g = normalizarGemelo({xpacio: 'x', foto: {ancho: 1000, alto: 500}, pantallas: [{id: 'a', rect: {x: 100, y: 100, w: 200, h: 100, rot: 10}}]});
  assert.equal(g.pantallas[0].origen, 'rect'); assert.equal(g.pantallas[0].esquinas.length, 4);
  assert.match(matriz3d(g.pantallas[0].esquinas, 1000, 500, 1600, 900), /^matrix3d\(/);
});
test('matriz3d lleva el rectángulo del contenido exactamente a las esquinas', () => {
  const esq = [[.1, .2], [.5, .1], [.55, .7], [.12, .8]], W = 1200, H = 800, cw = 1600, ch = 900;
  const m = matriz3d(esq, W, H, cw, ch).slice(9, -1).split(',').map(Number);
  const ap = (x, y) => { const X = m[0] * x + m[4] * y + m[12], Y = m[1] * x + m[5] * y + m[13], Wh = m[3] * x + m[7] * y + m[15]; return [X / Wh, Y / Wh]; };
  [[0, 0], [cw, 0], [cw, ch], [0, ch]].forEach(([x, y], i) => { const [u, v] = ap(x, y); near(u, esq[i][0] * W, 1e-6); near(v, esq[i][1] * H, 1e-6); });
  assert.equal(matriz3d([[0, 0], [1, 1], [1, 0], [0, 1]], W, H, cw, ch), null);
});
test('calibración local solo se aplica al mismo xpacio y por id', () => {
  const g = normalizarGemelo({xpacio: 'a', foto: {ancho: 10, alto: 10}, pantallas: [{id: 'p1', esquinas: [[0, 0], [1, 0], [1, 1], [0, 1]]}]});
  const otra = fusionarCalibracion(g, {xpacio: 'b', pantallas: [{id: 'p1', esquinas: [[.1, .1], [.9, .1], [.9, .9], [.1, .9]]}]});
  assert.deepEqual(otra.pantallas[0].esquinas[0], [0, 0]);
  const misma = fusionarCalibracion(g, {xpacio: 'a', k1: 0, pantallas: [{id: 'p1', esquinas: [[.1, .1], [.9, .1], [.9, .9], [.1, .9]]}]});
  assert.deepEqual(misma.pantallas[0].esquinas[0], [.1, .1]); assert.equal(misma.pantallas[0].origen, 'calibrador');
});
test('lente k1: ida y vuelta y esquinasFoto', () => {
  const [x, y] = aFoto(.9, .2, -.12, 3226, 1168), [u, v] = deFoto(x, y, -.12, 3226, 1168); near(u, .9, 1e-9); near(v, .2, 1e-9);
  const p = {esquinas: [[.9, .2], [.95, .2], [.95, .3], [.9, .3]], k1: -.12};
  near(esquinasEnFoto(p, {ancho: 3226, alto: 1168})[0][0], x, 1e-12);
});
test('datos del gemelo Sneakers Store: 3 pantallas válidas y convexas', () => {
  const g = normalizarGemelo(JSON.parse(readFileSync(new URL('../../xpacios/sneakerstore/pantallas.json', import.meta.url))));
  assert.equal(g.xpacio, XPACIO_SNEAKERS); assert.equal(g.pantallas.length, 3);
  g.pantallas.forEach(p => { assert.ok(esConvexo(p.esquinas)); assert.equal(p.origen, 'esquinas'); });
  assert.equal(resolverXpacio('sneakerstore'), XPACIO_SNEAKERS); assert.equal(resolverXpacio('starbucks'), null);
});
