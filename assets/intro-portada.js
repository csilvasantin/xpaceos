/* XpaceOS · intro de la portada / homepage intro (NeoMacStudio, 17-oct-2026).
   Vídeo «Todo en orden» (15 s, sin sonido) a pantalla completa al entrar en la portada.
   - Sale una vez por sesión (sessionStorage 'xpaceos_intro_a'), se salta con «Saltar intro» o Esc
     y se cierra sola al terminar o si el vídeo no arranca.
   - En el idioma de la portada: español o inglés («All in order», 17-oct-2026), con los mismos tiempos.
   - No sale con «reducir movimiento».
   - ?intro=0 la quita; ?intro=1 la fuerza (para enseñarla).
   - 1080p en pantallas grandes, 720p en el resto.
   Contrato / contract: admira-xp/docs/intro-portada.md */
(function (root, factory) {
  const api = factory(root);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root && root.document) api.start(root);
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const SEEN_KEY = 'xpaceos_intro_a';
  const SOURCES = {
    es: {1080: '/assets/video/intro-xpaceos-a-1080.mp4', 720: '/assets/video/intro-xpaceos-a-720.mp4'},
    en: {1080: '/assets/video/intro-xpaceos-a-en-1080.mp4', 720: '/assets/video/intro-xpaceos-a-en-720.mp4'}
  };
  const has = lang => Object.prototype.hasOwnProperty.call(SOURCES, lang);
  const LABELS = {
    es: {skip: 'Saltar intro', aria: 'Intro de XpaceOS: antes de abrir fallan las pantallas, la música, el aroma y el wifi, y XpaceOS los deja en orden.'},
    en: {skip: 'Skip intro', aria: 'XpaceOS intro: before opening, screens, music, scent and wifi fail, and XpaceOS puts them back in order.'}
  };

  // Decide si se enseña: ?intro=1 manda sobre todo; ?intro=0, ya vista, menos movimiento o un idioma sin vídeo la quitan.
  function shouldShow(o) {
    const intro = new URLSearchParams(o.search || '').get('intro');
    if (intro === '1') return true;
    if (intro === '0') return false;
    return has(o.lang) && !o.reducedMotion && !o.seen;
  }
  // El vídeo del idioma (español si no hay otro); píxeles reales de ancho: desde 1600 va la de 1080p.
  function pickSource(width, dpr, lang) {
    const set = has(lang) ? SOURCES[lang] : SOURCES.es;
    return (Number(width) || 0) * (Number(dpr) || 1) >= 1600 ? set[1080] : set[720];
  }

  const CSS = `
.xp-intro{position:fixed;inset:0;z-index:100000;background:#02080d;display:flex;align-items:center;justify-content:center;opacity:1;transition:opacity .6s ease}
.xp-intro.is-closing{opacity:0}
.xp-intro video{width:100%;height:100%;object-fit:contain;background:#02080d}
.xp-intro-skip{position:absolute;right:max(20px,env(safe-area-inset-right,0px));bottom:max(24px,env(safe-area-inset-bottom,0px));padding:10px 16px;border:1px solid rgba(120,243,255,.45);border-radius:8px;background:rgba(2,8,13,.6);color:#dff8ff;font:600 13px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;cursor:pointer}
.xp-intro-skip:hover{border-color:#78f3ff}
.xp-intro-skip:focus-visible{outline:2px solid #ffd866;outline-offset:3px}
.xp-intro-bar{position:absolute;left:0;bottom:0;height:3px;width:0;background:#78f3ff}`;

  function storage(win, kind) { try { return win[kind]; } catch (_) { return null; } }

  function start(win) {
    const doc = win.document;
    const session = storage(win, 'sessionStorage');
    let seen = false;
    try { seen = !!(session && session.getItem(SEEN_KEY)); } catch (_) {}
    const lang = win.XpaceLang ? win.XpaceLang.resolve({url: win.location.href, storage: storage(win, 'localStorage'), fallback: 'es'}) : 'es';
    const reducedMotion = !!(win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (!shouldShow({search: win.location.search, lang, reducedMotion, seen})) return;
    const t = LABELS[lang] || LABELS.es;

    const style = doc.createElement('style');
    style.textContent = CSS;
    const box = doc.createElement('div');
    box.className = 'xp-intro';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', t.aria);
    const video = doc.createElement('video');
    video.muted = true; video.defaultMuted = true; video.playsInline = true; video.autoplay = true;
    video.setAttribute('muted', ''); video.setAttribute('playsinline', ''); video.preload = 'auto';
    video.src = pickSource(win.innerWidth, win.devicePixelRatio, lang);
    const skip = doc.createElement('button');
    skip.type = 'button'; skip.className = 'xp-intro-skip'; skip.textContent = t.skip + ' ✕';
    const bar = doc.createElement('div');
    bar.className = 'xp-intro-bar';
    box.append(video, skip, bar);

    const html = doc.documentElement, overflow = html.style.overflow;
    let closed = false, watchdog = 0;
    function close() {
      if (closed) return;
      closed = true;
      clearTimeout(watchdog);
      try { session && session.setItem(SEEN_KEY, '1'); } catch (_) {}
      win.removeEventListener('keydown', onKey);
      html.style.overflow = overflow;
      box.classList.add('is-closing');
      win.setTimeout(() => { try { video.pause(); } catch (_) {} box.remove(); style.remove(); }, 650);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }

    skip.addEventListener('click', close);
    win.addEventListener('keydown', onKey);
    video.addEventListener('ended', close);
    video.addEventListener('error', close);
    video.addEventListener('timeupdate', () => { if (video.duration) bar.style.width = (100 * video.currentTime / video.duration) + '%'; });
    // Si en 4 s no ha empezado (red lenta, autoplay bloqueado), no tapa la portada.
    watchdog = win.setTimeout(() => { if (!(video.currentTime > 0)) close(); }, 4000);

    (doc.head || html).appendChild(style);
    const mount = () => {
      doc.body.appendChild(box);
      html.style.overflow = 'hidden';
      const p = video.play();
      if (p && p.catch) p.catch(close);
      try { skip.focus({preventScroll: true}); } catch (_) {}
    };
    if (doc.body) mount(); else doc.addEventListener('DOMContentLoaded', mount, {once: true});
  }

  return {SEEN_KEY, SOURCES, shouldShow, pickSource, start};
});
