/* ============================================================================
 * XPL · adapter del GEMELO (XpaceOS)
 * ----------------------------------------------------------------------------
 * Conecta el lenguaje XPL (xpl-runtime.js) con el gemelo real:
 *   - lee el mundo desde window.G  (clima, hora, gente, satisfacción…)
 *   - pinta un overlay de señalización contextual (las "pantallas")
 *   - enchufa acciones de mundo: command→__xtExec, setWeather→G.weather, jingle→sonido
 *   - comparte las reglas con el editor (xpl.html) vía localStorage('xpl_rules')
 *
 * Se carga al final del index.html del gemelo, DESPUÉS de xpl-runtime.js:
 *   <script src="scripts/xpl-runtime.js"></script>
 *   <script src="scripts/xpl-gemelo.js"></script>
 *
 * No toca la lógica del juego: solo lee G y añade un overlay + un chip de estado.
 * Comandos CLI (vía el dispatcher): /xpl on | off | toggle | reload | status
 * ========================================================================== */
(function () {
  'use strict';
  if (!window.XPL) { console.warn('[XPL] runtime no cargado'); return; }

  var LS_RULES = 'xpl_rules';      // reglas compartidas con el editor
  var LS_ON    = 'xpl_gemelo_on';  // overlay encendido/apagado

  /* ---------------------------------------------------------------------------
   * 1) WORLD ADAPTER  — XPL pregunta, G responde
   * ------------------------------------------------------------------------- */
  function hour() {
    var g = window.G;
    return g && typeof g.gameTime === 'number' ? Math.floor(g.gameTime) % 24 : new Date().getHours();
  }
  function isNight() {
    var h = hour();
    return h < 8 || h >= 21;
  }
  // El gemelo no guarda temperatura: la estimamos (hora + clima + estación real).
  function estTemp() {
    var g = window.G, h = hour();
    var base = 14 + Math.round(8 * Math.sin((h - 9) / 24 * Math.PI * 2)); // ~6..22 según hora
    var m = new Date().getMonth();
    var seasonAdj = (m >= 5 && m <= 8) ? 8 : (m === 11 || m <= 1) ? -7 : 0; // verano/invierno
    var rainAdj = (g && g.weather && g.weather.type === 'rain') ? -4 : 0;
    return base + seasonAdj + rainAdj;
  }
  function seasonNow() {
    var m = new Date().getMonth();
    return (m >= 2 && m <= 4) ? 'spring' : (m >= 5 && m <= 7) ? 'summer' : (m >= 8 && m <= 10) ? 'autumn' : 'winter';
  }
  function peopleNow() {
    var g = window.G; if (!g) return 0;
    if (typeof g.passersby === 'number') return g.passersby;
    if (Array.isArray(g.custs)) return g.custs.length;
    return 0;
  }

  var screen = { ad: null, tone: 'calm' };

  var world = {
    fact: function (id) {
      var g = window.G || {};
      switch (id) {
        case 'rain':        return !!(g.weather && g.weather.type === 'rain');
        case 'temperature': return estTemp();
        case 'wind':        return !!(g.weather && g.weather.type === 'wind');
        case 'season':      return seasonNow();
        case 'hour':        return hour();
        case 'dayPart':     { var h = hour(); if (isNight()) return 'night';
                              return h < 12 ? 'morning' : h < 15 ? 'noon' : h < 21 ? 'afternoon' : 'night'; }
        case 'night':       return isNight();
        case 'weekend':     { var d = new Date().getDay(); return d === 0 || d === 6; }
        case 'holiday':     return !!g.holiday;
        case 'people':      return peopleNow();
        case 'rush':        return !!(g.rush || peopleNow() >= 12);
        case 'doorOpen':    return g.doorOpen !== false && !isNight();
        case 'thief':       return !!g.thief;
        case 'satisfaction':return typeof g.satisfaction === 'number' ? g.satisfaction : 70;
        case 'money':       return typeof g.money === 'number' ? g.money : 0;
      }
      return 0;
    },
    npcs: function () { return []; }, // efectos sobre NPCs: aún no cableados en el gemelo
    act: function (id, value /*, npc */) {
      var g = window.G;
      switch (id) {
        case 'showAd':      screen.ad = value; break;
        case 'clearScreen': screen.ad = null; break;
        case 'screenTone':  screen.tone = value; break;
        case 'setWeather':  if (g) { g.weather = { type: value === 'sun' ? 'sun' : value, timer: 600 }; } break;
        case 'jingle':      beep(value); break;
        case 'command':     if (typeof window.__xtExec === 'function' && value) window.__xtExec(String(value)); break;
        // equip/say/mood/dance/goInside (scope npc) -> sin targets, no hacen nada aquí
      }
    }
  };

  /* ---------------------------------------------------------------------------
   * 2) SONIDO (jingle) — WebAudio simple
   * ------------------------------------------------------------------------- */
  var actx = null;
  function beep(kind) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var notes = kind === 'alert' ? [880, 660] : kind === 'promo' ? [523, 659, 784] : [880];
      notes.forEach(function (f, i) {
        var o = actx.createOscillator(), gn = actx.createGain();
        o.frequency.value = f; o.type = 'sine'; o.connect(gn); gn.connect(actx.destination);
        var t = actx.currentTime + i * 0.12;
        gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
        gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
        o.start(t); o.stop(t + 0.2);
      });
    } catch (e) {}
  }

  /* ---------------------------------------------------------------------------
   * 3) OVERLAY DE SEÑALIZACIÓN  (la "pantalla" contextual del gemelo)
   * ------------------------------------------------------------------------- */
  var el, chip, on = localStorage.getItem(LS_ON) !== '0';

  function buildUI() {
    // ---- pantalla flotante (movible) ----
    el = document.createElement('div');
    el.id = 'xpl-signage';
    el.style.cssText = [
      'position:fixed', 'right:18px', 'bottom:64px', 'width:200px', 'height:118px',
      'border-radius:14px', 'overflow:hidden', 'z-index:100050', 'cursor:grab',
      'box-shadow:0 8px 30px rgba(0,0,0,.45)', 'border:2px solid rgba(255,255,255,.12)',
      'font-family:-apple-system,Segoe UI,Roboto,sans-serif', 'display:none', 'user-select:none',
      'transition:background .4s'
    ].join(';');
    el.innerHTML =
      '<div id="xpl-sg-body" style="position:absolute;inset:0;display:flex;flex-direction:column;' +
      'align-items:center;justify-content:center;gap:4px;color:#fff;text-align:center">' +
      '<div id="xpl-sg-icon" style="font-size:46px;line-height:1"></div>' +
      '<div id="xpl-sg-label" style="font:700 11px ui-monospace,monospace;letter-spacing:1px"></div></div>' +
      '<div style="position:absolute;top:5px;left:7px;font:700 8px ui-monospace,monospace;color:#fff9;letter-spacing:1px">XPACEOS · LIVE</div>';
    document.body.appendChild(el);
    dragify(el);

    // ---- chip de estado ----
    chip = document.createElement('div');
    chip.id = 'xpl-chip';
    chip.style.cssText = [
      'position:fixed', 'right:18px', 'bottom:18px', 'z-index:100051',
      'display:flex', 'align-items:center', 'gap:7px', 'padding:6px 11px',
      'border-radius:999px', 'background:#0b0e14d9', 'border:1px solid #26303f',
      'color:#cdd8e8', 'font:600 12px -apple-system,Segoe UI,sans-serif',
      'cursor:pointer', 'backdrop-filter:blur(6px)'
    ].join(';');
    chip.title = 'XPL — señalización contextual · clic: encender/apagar';
    chip.innerHTML = '<span id="xpl-dot" style="width:8px;height:8px;border-radius:50%;background:#5bd6c0"></span>' +
      '<b>XPL</b><span id="xpl-chip-ad" style="color:#8a97ab">—</span>' +
      '<a href="xpl.html" title="editar reglas" style="color:#7aa2ff;text-decoration:none;margin-left:2px">✎</a>';
    chip.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') return; // dejar pasar el lápiz
      setOn(!on);
    });
    document.body.appendChild(chip);
  }

  function dragify(node) {
    var sx, sy, ox, oy, drag = false;
    node.addEventListener('mousedown', function (e) {
      drag = true; sx = e.clientX; sy = e.clientY;
      var r = node.getBoundingClientRect(); ox = r.left; oy = r.top;
      node.style.cursor = 'grabbing'; e.preventDefault();
    });
    window.addEventListener('mousemove', function (e) {
      if (!drag) return;
      node.style.left = (ox + e.clientX - sx) + 'px';
      node.style.top = (oy + e.clientY - sy) + 'px';
      node.style.right = 'auto'; node.style.bottom = 'auto';
    });
    window.addEventListener('mouseup', function () { drag = false; node.style.cursor = 'grab'; });
  }

  function renderOverlay() {
    if (!el) return;
    var ad = screen.ad ? window.XPL.byId(window.XPL.ADS, screen.ad) : null;
    var dot = document.getElementById('xpl-dot');
    var chipAd = document.getElementById('xpl-chip-ad');
    if (dot) dot.style.background = on ? '#5bd6c0' : '#5a6678';
    if (!on || !ad) {
      el.style.display = 'none';
      if (chipAd) chipAd.textContent = on ? '—' : 'off';
      return;
    }
    el.style.display = 'block';
    el.style.background = ad.bg;
    document.getElementById('xpl-sg-icon').textContent = ad.icon;
    document.getElementById('xpl-sg-label').textContent = ad.es.toUpperCase();
    if (chipAd) chipAd.textContent = ad.icon + ' ' + ad.es;
    // tono: animación sutil
    el.style.animation = screen.tone === 'hype'
      ? 'xplPulse .9s ease-in-out infinite' : 'none';
  }

  // keyframes
  var st = document.createElement('style');
  st.textContent = '@keyframes xplPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}';
  document.head.appendChild(st);

  function setOn(v) {
    on = v; localStorage.setItem(LS_ON, v ? '1' : '0'); renderOverlay();
  }

  /* ---------------------------------------------------------------------------
   * 4) MOTOR — corre cada segundo leyendo G
   * ------------------------------------------------------------------------- */
  var engine = window.XPL.createEngine(world);

  function loadRules() {
    var raw = localStorage.getItem(LS_RULES);
    if (raw) { try { return JSON.parse(raw); } catch (e) {} }
    // semilla por defecto (señalización contextual básica)
    return [
      { id: 'seed-rain', name: 'Llueve → botas de agua', priority: 3, enabled: true,
        when: { join: 'and', conds: [{ fact: 'rain', value: true }] }, who: { group: 'all', filter: {} },
        do: [{ id: 'showAd', value: 'rainboots' }] },
      { id: 'seed-hot', name: 'Calor → helado', priority: 1, enabled: true,
        when: { join: 'and', conds: [{ fact: 'temperature', op: '>=', value: 28 }] }, who: { group: 'all', filter: {} },
        do: [{ id: 'showAd', value: 'icecream' }] },
      { id: 'seed-night', name: 'Noche → happy hour', priority: 1, enabled: true,
        when: { join: 'and', conds: [{ fact: 'night', value: true }] }, who: { group: 'all', filter: {} },
        do: [{ id: 'showAd', value: 'happyhour' }] }
    ];
  }
  function syncRules() { engine.setRules(loadRules()); }

  function tick() {
    if (!window.G) return;
    screen.ad = null; // se "apaga" si ninguna regla 'while' lo pone
    engine.tick();
    renderOverlay();
  }

  // recargar reglas cuando el editor (otra pestaña) las guarda
  window.addEventListener('storage', function (e) { if (e.key === LS_RULES) syncRules(); });

  /* ---------------------------------------------------------------------------
   * 5) COMANDOS CLI:  /xpl on|off|toggle|reload|status   (vía el dispatcher)
   * ------------------------------------------------------------------------- */
  function patchDispatcher() {
    var prev = window.__xtExec;
    if (typeof prev !== 'function') return;
    window.__xtExec = function (text) {
      var t = String(text || '').trim();
      if (/^\/xpl\b/i.test(t)) { handleCmd(t); return Promise.resolve('xpl'); }
      return prev.apply(this, arguments);
    };
  }
  function handleCmd(t) {
    var arg = (t.split(/\s+/)[1] || 'toggle').toLowerCase();
    if (arg === 'on') setOn(true);
    else if (arg === 'off') setOn(false);
    else if (arg === 'toggle') setOn(!on);
    else if (arg === 'reload') { syncRules(); }
    else if (arg === 'status') {
      console.log('[XPL]', { on: on, ad: screen.ad, rules: engine.rules.length });
    }
  }

  /* ---------------------------------------------------------------------------
   * 6) ARRANQUE — espera a que exista window.G
   * ------------------------------------------------------------------------- */
  function boot() {
    if (!window.G) { return setTimeout(boot, 400); }
    buildUI();
    syncRules();
    patchDispatcher();
    setInterval(tick, 1000);
    tick();
    console.log('[XPL] adapter del gemelo activo · /xpl on|off|toggle|reload|status');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.XPLGemelo = { world: world, get screen() { return screen; }, setOn: setOn, reload: syncRules };
})();
