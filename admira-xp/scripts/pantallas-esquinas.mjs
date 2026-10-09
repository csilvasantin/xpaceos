// Pantallas virtuales por 4 esquinas sobre la foto de un Xpacio (calibrador y player comparten esto).
// Una sola homografía en todo XpaceOS: quadTransform de matrix-mapping.mjs (también la usa la
// panorámica 360 de Starbucks). Doc: admira-xp/docs/calibrador-pantallas.md.
//
// Modelo de datos del gemelo (compatible hacia atrás):
//   {xpacio, foto:{url, ancho, alto, original?}, k1?, pantallas:[{id, nombre,
//     esquinas?:[[x,y]×4 normalizadas 0..1, orden SI·SD·ID·II], k1?, esquinasFoto?,
//     rect?:{x,y,w,h,rot}  ← método antiguo (rectángulo rotado); se convierte al vuelo a 4 esquinas
//     media?:{url, tipo:'video'|'imagen'} }]}
// · esquinas: sobre la foto tal como se ve con k1 (con k1 = 0, la foto original).
// · esquinasFoto: las mismas esquinas en la foto sin corregir (solo si k1 ≠ 0). El player pinta la foto
//   original, así que usa esquinasFoto cuando existe.
import {quadTransform} from './matrix-mapping.mjs';

export const VERSION_CALIBRACION = 1;
export const ORDEN_ESQUINAS = ['SI', 'SD', 'ID', 'II'];
export const CLAVE_LOCAL = 'admira.calibrador.v1:';
export const XPACIO_SNEAKERS = 'sneakers-store-santa-rosa-19';
// Gemelos con foto y pantallas virtuales calibrables (id → datos del gemelo, relativo a la raíz del sitio).
export const XPACIOS_FOTO = Object.freeze({
  [XPACIO_SNEAKERS]: {datos: '/xpacios/sneakerstore/pantallas.json', gemelo: '/xpacios/sneakerstore/', nombre: 'Sneakers Store · Santa Rosa 19'},
});
const ALIAS = {sneakerstore: XPACIO_SNEAKERS, 'sneakers-store': XPACIO_SNEAKERS, 'free-shift-demo': XPACIO_SNEAKERS};
export function resolverXpacio(id) { const k = String(id || '').trim().toLowerCase(); return XPACIOS_FOTO[k] ? k : (ALIAS[k] || null); }

const fin = v => typeof v === 'number' && Number.isFinite(v);
export function esquinasValidas(e) { return Array.isArray(e) && e.length === 4 && e.every(p => Array.isArray(p) && p.length >= 2 && fin(+p[0]) && fin(+p[1])); }
export function esConvexo(q) {
  let s = 0;
  for (let i = 0; i < 4; i++) {
    const a = q[i], b = q[(i + 1) % 4], c = q[(i + 2) % 4], z = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (Math.abs(z) < 1e-12) return false; if (!s) s = Math.sign(z); else if (Math.sign(z) !== s) return false;
  }
  return true;
}

// Método antiguo → 4 esquinas. rect = {x, y, w, h, rot} con (x, y) la esquina superior izquierda SIN rotar
// (como left/top en CSS) y rot en grados alrededor del centro (transform-origin por defecto). Admite cx/cy
// (centro) y rotation/angle. Coordenadas normalizadas 0..1; si alguna pasa de 1,5 se toman como píxeles de la foto.
export function rectAEsquinas(rect, foto = {}) {
  if (!rect) return null;
  const px = ['x', 'y', 'w', 'h', 'cx', 'cy'].some(k => fin(rect[k]) && Math.abs(rect[k]) > 1.5);
  const W = px ? (foto.ancho || 1) : 1, H = px ? (foto.alto || 1) : 1;
  const w = +rect.w / W, h = +rect.h / H;
  const cx = fin(rect.cx) ? rect.cx / W : +rect.x / W + w / 2, cy = fin(rect.cy) ? rect.cy / H : +rect.y / H + h / 2;
  const deg = +(rect.rot ?? rect.rotation ?? rect.angle ?? 0), a = deg * Math.PI / 180;
  if (![w, h, cx, cy, a].every(fin) || w <= 0 || h <= 0) return null;
  // La rotación se hace en píxeles reales (si la foto no es cuadrada, rotar en 0..1 deformaría).
  const AW = foto.ancho || 1, AH = foto.alto || 1, c = Math.cos(a), s = Math.sin(a);
  return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([dx, dy]) => {
    const X = dx * AW, Y = dy * AH; return [cx + (X * c - Y * s) / AW, cy + (X * s + Y * c) / AH];
  });
}
// 4 esquinas → rectángulo rotado equivalente (lo que haría el método antiguo). Se usa en /demo «antes».
export function rectDesdeEsquinas(esq, foto = {}) {
  const AW = foto.ancho || 1, AH = foto.alto || 1, q = esq.map(([x, y]) => [x * AW, y * AH]);
  const d = (p, r) => Math.hypot(r[0] - p[0], r[1] - p[1]);
  const cx = q.reduce((a, p) => a + p[0], 0) / 4, cy = q.reduce((a, p) => a + p[1], 0) / 4;
  const w = (d(q[0], q[1]) + d(q[3], q[2])) / 2, h = (d(q[0], q[3]) + d(q[1], q[2])) / 2, rot = Math.atan2(q[1][1] - q[0][1], q[1][0] - q[0][0]) * 180 / Math.PI;
  return {cx: cx / AW, cy: cy / AH, w: w / AW, h: h / AH, rot};
}

// Lente k1 (barril/cojín). Coordenadas centradas y normalizadas por la semidiagonal: foto = u·(1 + k1·|u|²).
function norm(x, y, W, H) { const R = Math.hypot(W, H) / 2; return [(x * W - W / 2) / R, (y * H - H / 2) / R]; }
function denorm(u, v, W, H) { const R = Math.hypot(W, H) / 2; return [(u * R + W / 2) / W, (v * R + H / 2) / H]; }
export function aFoto(x, y, k1, W, H) { const [u, v] = norm(x, y, W, H), f = 1 + k1 * (u * u + v * v); return denorm(u * f, v * f, W, H); }
export function deFoto(x, y, k1, W, H) { const [ru, rv] = norm(x, y, W, H); let u = ru, v = rv; for (let i = 0; i < 30; i++) { const f = 1 + k1 * (u * u + v * v); u = ru / f; v = rv / f; } return denorm(u, v, W, H); }

// Normaliza los datos del gemelo: toda pantalla sale con esquinas (las antiguas, convertidas desde rect).
export function normalizarGemelo(datos) {
  if (!datos || !Array.isArray(datos.pantallas)) throw new Error('Gemelo sin pantallas[]');
  const foto = datos.foto || datos.imagen && {ancho: datos.imagen.ancho, alto: datos.imagen.alto} || {};
  const k1 = fin(+datos.k1) ? +datos.k1 : 0;
  const pantallas = datos.pantallas.map((p, i) => {
    let esquinas = esquinasValidas(p.esquinas) ? p.esquinas.map(e => [+e[0], +e[1]]) : null, origen = 'esquinas';
    if (!esquinas && p.rect) { esquinas = rectAEsquinas(p.rect, foto); origen = 'rect'; }
    if (!esquinas) throw new Error('Pantalla sin esquinas ni rect: ' + (p.id || i));
    const out = {...p, id: String(p.id || 'pantalla-' + (i + 1)), nombre: String(p.nombre || p.id || 'Pantalla ' + (i + 1)), esquinas, k1: fin(+p.k1) ? +p.k1 : k1, origen};
    if (esquinasValidas(p.esquinasFoto)) out.esquinasFoto = p.esquinasFoto.map(e => [+e[0], +e[1]]);
    return out;
  });
  return {...datos, xpacio: String(datos.xpacio || ''), foto, k1, pantallas};
}
// Superpone la calibración guardada en este navegador (mismo xpacio) sobre los datos del gemelo.
export function fusionarCalibracion(gemelo, cal) {
  if (!cal || !Array.isArray(cal.pantallas) || (cal.xpacio && gemelo.xpacio && cal.xpacio !== gemelo.xpacio)) return gemelo;
  const porId = new Map(cal.pantallas.filter(p => esquinasValidas(p.esquinas)).map(p => [String(p.id), p]));
  const k1 = fin(+cal.k1) ? +cal.k1 : gemelo.k1;
  return {...gemelo, k1, calibradoEn: cal.guardadoEn || null, pantallas: gemelo.pantallas.map(p => {
    const c = porId.get(p.id); if (!c) return p;
    const out = {...p, esquinas: c.esquinas.map(e => [+e[0], +e[1]]), k1, origen: 'calibrador'};
    if (esquinasValidas(c.esquinasFoto)) out.esquinasFoto = c.esquinasFoto; else delete out.esquinasFoto;
    return out;
  })};
}
// Esquinas en la foto ORIGINAL (la que pinta el player).
export function esquinasEnFoto(p, foto) {
  if (esquinasValidas(p.esquinasFoto)) return p.esquinasFoto;
  if (!p.k1) return p.esquinas;
  return p.esquinas.map(([x, y]) => aFoto(x, y, p.k1, foto.ancho || 1, foto.alto || 1));
}
// matrix3d para un nodo de cw×ch (transform-origin: 0 0) que debe caer en las 4 esquinas, dadas en 0..1
// sobre una foto pintada a ancho×alto píxeles. null si el cuadrilátero no es válido.
export function matriz3d(esquinas, ancho, alto, cw, ch) {
  const m = quadTransform(esquinas.map(([x, y]) => ({x: x * ancho, y: y * alto})), cw, ch);
  return m ? 'matrix3d(' + m.map(v => +v.toPrecision(10)).join(',') + ')' : null;
}
// Lo que el método antiguo pintaba: el mismo nodo como rectángulo rotado.
export function transformRect(esquinas, ancho, alto, cw, ch) {
  const r = rectDesdeEsquinas(esquinas, {ancho, alto});
  return `translate(${r.cx * ancho}px,${r.cy * alto}px) rotate(${r.rot}deg) scale(${r.w * ancho / cw},${r.h * alto / ch}) translate(${-cw / 2}px,${-ch / 2}px)`;
}
export function leerLocal(xpacio, storage = globalThis.localStorage) {
  try { const j = JSON.parse(storage.getItem(CLAVE_LOCAL + xpacio) || 'null'); return j && Array.isArray(j.pantallas) ? j : null; } catch { return null; }
}
export async function cargarGemelo(id, {base = '', fetcher = globalThis.fetch, storage = globalThis.localStorage, local = true} = {}) {
  const xp = resolverXpacio(id); if (!xp) throw new Error('Xpacio sin foto calibrable: ' + id);
  const r = await fetcher(base + XPACIOS_FOTO[xp].datos, {cache: 'no-cache'}); if (!r.ok) throw new Error('No se pudo leer el gemelo ' + xp);
  const g = normalizarGemelo(await r.json());
  return local ? fusionarCalibracion(g, leerLocal(xp, storage)) : g;
}
