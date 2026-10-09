// Player «Foto real» de un Xpacio: la foto de la tienda con sus pantallas virtuales reproduciendo la playlist,
// cada una deformada con matrix3d desde sus 4 esquinas (transform-origin 0 0). Misma homografía que el
// calibrador (pantallas-esquinas.mjs → quadTransform). modo 'demo' = antes (rectángulo rotado) | después.
// Doc: admira-xp/docs/calibrador-pantallas.md
import * as PE from './pantallas-esquinas.mjs?v=20261009-esquinas-1';

const CW = 1600, CH = 900;
const TXT = {
  es: {titulo: 'Foto real · pantallas virtuales', esquinas: '4 esquinas', rect: 'rectángulo (sin calibrar)', calibrado: 'calibrado en este navegador',
    calibrar: 'Calibrar esquinas', demo: 'Antes · después', live: 'En directo', playlist: 'Playlist del Xpacio', anuncio: 'Anuncio «FREE SHIFT»', contenido: 'Contenido',
    cerrar: 'Cerrar', antes: 'ANTES', antesS: 'Rectángulo rotado · método anterior', despues: 'DESPUÉS', despuesS: '4 esquinas reales · homografía', guia: 'Discontinua verde = marco real',
    zoomIn: 'Zoom a la pantalla grande', zoomOut: 'Vista completa', barrido: 'Repetir barrido', error: 'No se pudo cargar el gemelo: ', sinVideo: 'Playlist no disponible: muestro el anuncio de respaldo.'},
  en: {titulo: 'Real photo · virtual screens', esquinas: '4 corners', rect: 'rectangle (uncalibrated)', calibrado: 'calibrated in this browser',
    calibrar: 'Calibrate corners', demo: 'Before · after', live: 'Live', playlist: 'Xpace playlist', anuncio: '«FREE SHIFT» ad', contenido: 'Content',
    cerrar: 'Close', antes: 'BEFORE', antesS: 'Rotated rectangle · previous method', despues: 'AFTER', despuesS: '4 real corners · homography', guia: 'Green dashes = real bezel',
    zoomIn: 'Zoom on the big screen', zoomOut: 'Full view', barrido: 'Replay sweep', error: 'Could not load the twin: ', sinVideo: 'Playlist unavailable: showing the fallback ad.'},
};
const CSS = `
.fp{position:absolute;inset:0;background:#05090c;color:#e7f2ed;font:13px/1.45 Inter,system-ui,sans-serif;overflow:hidden;display:flex;flex-direction:column}
.fp-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 14px;border-bottom:1px solid #1f3a2d;background:#071015}
.fp-bar h2{margin:0 8px 0 0;font:700 15px/1 Inter,system-ui,sans-serif;letter-spacing:-.01em}
.fp-chip{font:11px ui-monospace,monospace;color:#a8c3b7;border:1px solid #284338;border-radius:4px;padding:4px 8px}
.fp-chip b{color:#33FF99;font-weight:600}
.fp-sp{flex:1}
.fp button,.fp a.fp-btn,.fp select{font:600 12.5px Inter,system-ui,sans-serif;background:#10241b;color:#dbffec;border:1px solid #2f5c45;border-radius:5px;padding:7px 12px;cursor:pointer;text-decoration:none}
.fp button:hover,.fp a.fp-btn:hover{border-color:#33FF99}
.fp button.on{background:#33FF99;color:#04130b;border-color:#33FF99}
.fp-esc{position:relative;flex:1;min-height:0;overflow:hidden}
.fp-mundo{position:absolute;left:0;top:0;transform-origin:0 0;transition:transform .8s cubic-bezier(.2,.7,.2,1)}
.fp-foto{position:absolute;left:0;top:0;width:100%;height:100%;display:block;user-select:none}
.fp-capa{position:absolute;left:0;top:0;height:100%;overflow:hidden}
.fp-lienzo{position:absolute;left:0;top:0}
.fp-pant{position:absolute;left:0;top:0;width:${CW}px;height:${CH}px;transform-origin:0 0;overflow:hidden;background:#000;backface-visibility:hidden}
.fp-pant video,.fp-pant img{width:100%;height:100%;object-fit:cover;display:block}
.fp-antes .fp-pant{outline:12px solid #ffb547;outline-offset:-12px}
.fp-guias{position:absolute;left:0;top:0;pointer-events:none;overflow:visible}
.fp-guias polygon{fill:none;stroke:#33FF99;stroke-width:3;stroke-dasharray:12 8;vector-effect:non-scaling-stroke}
.fp-corte{position:absolute;top:0;bottom:0;width:2px;background:#fff;box-shadow:0 0 0 1px #0008;cursor:ew-resize;display:none}
.fp-corte::after{content:'⇔';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;color:#05090c;border-radius:50%;width:30px;height:30px;display:grid;place-items:center;font:700 15px system-ui}
.fp-demo .fp-corte{display:block}
.fp-et{position:absolute;top:14px;padding:8px 12px;background:#05090ce6;border:1px solid #2a3d35;border-radius:5px;display:none;max-width:44%}
.fp-et b{display:block;font:700 13px Inter,system-ui,sans-serif;letter-spacing:.08em}.fp-et span{color:#a8c3b7;font-size:12px}
.fp-et.a{left:14px;border-left:3px solid #ffb547}.fp-et.d{right:14px;border-right:3px solid #33FF99;text-align:right}
.fp-demo .fp-et{display:block}
.fp-aviso{position:absolute;left:14px;bottom:14px;font:11.5px ui-monospace,monospace;background:#05090ce6;border:1px solid #284338;border-radius:4px;padding:6px 10px;display:none}
.fp-aviso.on{display:block}
`;

export async function montarFotoPlayer(host, {xpacio = PE.XPACIO_SNEAKERS, lang = 'es', modo = 'live', alCerrar = null, base = ''} = {}) {
  const L = TXT[lang === 'en' ? 'en' : 'es'];
  if (!document.getElementById('fp-css')) { const st = document.createElement('style'); st.id = 'fp-css'; st.textContent = CSS; document.head.append(st); }
  const root = document.createElement('div'); root.className = 'fp'; root.dataset.listo = '0';
  root.innerHTML = `<div class="fp-bar"><h2>${L.titulo}</h2><span class="fp-chip" data-r="nombre"></span><span class="fp-chip" data-r="metodo"></span>
    <span class="fp-sp"></span><button data-r="live">${L.live}</button><button data-r="demo">${L.demo}</button>
    <select data-r="contenido" aria-label="${L.contenido}"><option value="playlist">${L.playlist}</option><option value="anuncio">${L.anuncio}</option></select>
    <a class="fp-btn" data-r="calibrar" target="_blank" rel="noopener">${L.calibrar} ↗</a><button data-r="zoom" hidden></button>${alCerrar ? `<button data-r="cerrar" aria-label="${L.cerrar}">×</button>` : ''}</div>
    <div class="fp-esc"><div class="fp-mundo"><img class="fp-foto" alt="">
      <div class="fp-capa fp-antes"><div class="fp-lienzo"></div></div><div class="fp-capa fp-despues"><div class="fp-lienzo"></div></div>
      <svg class="fp-guias"></svg><div class="fp-corte" role="slider" aria-label="antes | después" tabindex="0"></div></div>
      <div class="fp-et a"><b>${L.antes}</b><span>${L.antesS} · ${L.guia}</span></div><div class="fp-et d"><b>${L.despues}</b><span>${L.despuesS}</span></div>
      <div class="fp-aviso" data-r="aviso"></div></div>`;
  host.append(root);
  const $ = r => root.querySelector(`[data-r="${r}"]`), esc = root.querySelector('.fp-esc'), mundo = root.querySelector('.fp-mundo');
  const antes = root.querySelector('.fp-antes'), despues = root.querySelector('.fp-despues'), corte = root.querySelector('.fp-corte'), guias = root.querySelector('.fp-guias');
  let G, W = 1, H = 1, split = .5, zoom = false, anim = 0, contenido = 'playlist', pista = null, vivo = true;
  const aviso = m => { $('aviso').textContent = m || ''; $('aviso').classList.toggle('on', !!m); };
  try { G = await PE.cargarGemelo(xpacio, {base}); } catch (e) { aviso(L.error + e.message); return {root, destruir: () => root.remove()}; }
  W = G.foto.ancho; H = G.foto.alto;
  $('nombre').textContent = G.nombre || G.xpacio;
  $('calibrar').href = `${base}/admira-xp/calibrador-pantallas.html?xpacio=${encodeURIComponent(G.xpacio)}&idioma=${lang === 'en' ? 'en' : 'es'}`;
  const img = root.querySelector('.fp-foto'); img.src = base + G.foto.url;
  mundo.style.width = W + 'px'; mundo.style.height = H + 'px';
  [antes, despues].forEach(c => { c.querySelector('.fp-lienzo').style.cssText = `width:${W}px;height:${H}px`; });
  guias.setAttribute('width', W); guias.setAttribute('height', H); guias.setAttribute('viewBox', `0 0 ${W} ${H}`);
  try {
    const pl = G.contenido?.playlist && await (await fetch(G.contenido.playlist, {cache: 'no-cache'})).json();
    pista = pl?.tracks?.find(t => /\.(mp4|webm)(\?|$)/i.test(t.url || '')) || null;
  } catch (e) { pista = null; }
  if (!pista) { contenido = 'anuncio'; $('contenido').value = 'anuncio'; }
  function media() {
    if (contenido === 'playlist' && pista) return `<video src="${pista.url}" muted loop autoplay playsinline crossorigin="anonymous" title="${String(pista.title || '').replace(/"/g, '&quot;')}"></video>`;
    return `<img src="${base + (G.contenido?.respaldo?.url || '/admira-xp/assets/calibrador/free-shift-anuncio.jpg')}" alt="">`;
  }
  function montar() {
    [antes, despues].forEach(c => { c.querySelector('.fp-lienzo').innerHTML = G.pantallas.map(p => `<div class="fp-pant" data-id="${p.id}">${media()}</div>`).join(''); });
    root.querySelectorAll('video').forEach(v => { v.play?.().catch(() => {}); v.onerror = () => { if (contenido === 'playlist') { aviso(L.sinVideo); contenido = 'anuncio'; $('contenido').value = 'anuncio'; montar(); } }; });
    colocar();
  }
  function colocar() {
    const demo = modo === 'demo', qs = G.pantallas.map(p => PE.esquinasEnFoto(p, G.foto));
    despues.querySelectorAll('.fp-pant').forEach((el, i) => { el.style.transform = PE.matriz3d(qs[i], W, H, CW, CH) || 'scale(0)'; });
    antes.querySelectorAll('.fp-pant').forEach((el, i) => { el.style.transform = PE.transformRect(qs[i], W, H, CW, CH); });
    guias.innerHTML = demo ? qs.map(q => `<polygon points="${q.map(([x, y]) => x * W + ',' + y * H).join(' ')}"/>`).join('') : '';
    const xs = split * W;
    antes.style.display = demo ? '' : 'none'; antes.style.width = xs + 'px';
    despues.style.left = (demo ? xs : 0) + 'px'; despues.style.width = (demo ? W - xs : W) + 'px';
    despues.querySelector('.fp-lienzo').style.left = (demo ? -xs : 0) + 'px';
    guias.style.clipPath = `inset(0 ${W - xs}px 0 0)`;
    corte.style.left = xs - 1 + 'px';
    const cal = G.pantallas.some(p => p.origen === 'calibrador'), rect = G.pantallas.every(p => p.origen === 'rect');
    $('metodo').innerHTML = rect ? L.rect : `<b>${L.esquinas}</b>` + (cal ? ' · ' + L.calibrado : '');
    $('live').classList.toggle('on', !demo); $('demo').classList.toggle('on', demo); root.classList.toggle('fp-demo', demo);
    $('zoom').hidden = !demo; $('zoom').textContent = zoom ? L.zoomOut : L.zoomIn;
  }
  const mayor = () => { let m = 0, best = -1; G.pantallas.forEach((p, i) => { const r = PE.rectDesdeEsquinas(PE.esquinasEnFoto(p, G.foto), G.foto); if (r.w * r.h > best) { best = r.w * r.h; m = i; } }); return m; };
  function vista() {
    const bw = esc.clientWidth, bh = esc.clientHeight; if (!bw || !bh) return;
    let s = Math.min(bw / W, bh / H), tx = (bw - W * s) / 2, ty = (bh - H * s) / 2;
    if (zoom && modo === 'demo') {
      const q = PE.esquinasEnFoto(G.pantallas[mayor()], G.foto).map(([x, y]) => [x * W, y * H]);
      const x0 = Math.min(...q.map(p => p[0])), x1 = Math.max(...q.map(p => p[0])), y0 = Math.min(...q.map(p => p[1])), y1 = Math.max(...q.map(p => p[1]));
      const pad = 1.18; s = Math.min(bw / ((x1 - x0) * pad), bh / ((y1 - y0) * pad));
      tx = bw / 2 - (x0 + x1) / 2 * s; ty = bh / 2 - (y0 + y1) / 2 * s;
    }
    mundo.style.transform = `translate(${tx}px,${ty}px) scale(${s})`;
  }
  // Barrido de entrada: la cortina cruza la pantalla grande de izquierda a derecha y se queda en el centro.
  function barrido() {
    cancelAnimationFrame(anim);
    const q = PE.esquinasEnFoto(G.pantallas[mayor()], G.foto), xa = Math.min(...q.map(p => p[0])), xb = Math.max(...q.map(p => p[0])), mid = (xa + xb) / 2;
    const t0 = performance.now(), D = 2600;
    const paso = now => { const k = Math.min(1, (now - t0) / D), e = k < .6 ? k / .6 : 1 - (k - .6) / .4;
      split = k < .6 ? xb + (xa - xb) * (1 - e) : mid + (xb - mid) * e; if (k >= 1) split = mid; colocar(); if (k < 1 && vivo) anim = requestAnimationFrame(paso); };
    split = xa; colocar(); anim = requestAnimationFrame(paso);
  }
  function setModo(m) { modo = m === 'demo' ? 'demo' : 'live'; zoom = modo === 'demo'; if (modo === 'demo') barrido(); else { cancelAnimationFrame(anim); split = .5; } colocar(); vista(); }
  $('live').onclick = () => setModo('live'); $('demo').onclick = () => setModo('demo');
  $('zoom').onclick = () => { zoom = !zoom; colocar(); vista(); };
  $('contenido').onchange = e => { contenido = e.target.value; montar(); };
  if (alCerrar) $('cerrar').onclick = () => alCerrar();
  // Arrastrar la cortina
  let arr = false;
  corte.onpointerdown = e => { arr = true; corte.setPointerCapture(e.pointerId); cancelAnimationFrame(anim); };
  corte.onpointermove = e => { if (!arr) return; const r = mundo.getBoundingClientRect(); split = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); colocar(); };
  corte.onpointerup = () => { arr = false; };
  corte.onkeydown = e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { split = Math.max(0, Math.min(1, split + (e.key === 'ArrowLeft' ? -.02 : .02))); colocar(); } };
  // El calibrador guarda en localStorage: si está abierto en otra pestaña, las pantallas se recolocan al momento.
  const alGuardar = async e => { if (e.key === PE.CLAVE_LOCAL + G.xpacio) { try { G = await PE.cargarGemelo(G.xpacio, {base}); colocar(); } catch (_) {} } };
  addEventListener('storage', alGuardar);
  const ro = new ResizeObserver(vista); ro.observe(esc);
  montar(); setModo(modo);
  await new Promise(r => img.complete ? r() : (img.onload = img.onerror = r));
  vista(); root.dataset.listo = '1';
  return {root, gemelo: () => G, setModo, destruir() { vivo = false; cancelAnimationFrame(anim); ro.disconnect(); removeEventListener('storage', alGuardar); root.remove(); }};
}
