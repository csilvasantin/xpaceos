/* ============================================================================
 * XPL · COMPOSITOR dentro del gemelo  ("IF · THEN · DO THAT")
 * ----------------------------------------------------------------------------
 * Panel flotante para componer reglas XPL SIN salir del gemelo. Guarda en el
 * mismo localStorage('xpl_rules') que lee el adapter (xpl-gemelo.js), así que
 * el efecto se ve al instante en la pantalla condicional.
 *
 * Se carga DESPUÉS de xpl-runtime.js y xpl-gemelo.js.
 * Toggle por CLI:  /ifthendothat on | off | toggle   (alias /componer)
 * ========================================================================== */
(function () {
  'use strict';
  if (!window.XPL) { console.warn('[XPL composer] runtime no cargado'); return; }
  var XPL = window.XPL, LS = 'xpl_rules';

  /* --------- estado --------- */
  var RULES = [], editingId = null, uid = 1, panel = null, open = false;

  function loadRules() {
    try { var s = JSON.parse(localStorage.getItem(LS) || 'null'); if (Array.isArray(s)) return s; } catch (e) {}
    return [];
  }
  function persist() {
    try { localStorage.setItem(LS, JSON.stringify(RULES)); } catch (e) {}
    // refrescar el motor del gemelo en caliente
    if (window.XPLGemelo && window.XPLGemelo.reload) window.XPLGemelo.reload();
  }
  function find(id) { return RULES.find(function (r) { return r.id === id; }); }
  function uniq() { return 'c' + (uid++) + (Date.now() % 9973); }

  /* --------- helpers de catálogo --------- */
  function L(o) { return XPL.label(o, 'es'); }
  function opt(arr, sel) {
    return arr.map(function (o) {
      return '<option value="' + o.id + '"' + (o.id === sel ? ' selected' : '') + '>' +
        (o.icon ? o.icon + ' ' : '') + L(o) + '</option>';
    }).join('');
  }
  // solo acciones que tienen efecto real en el gemelo (pantalla + mundo)
  function gemeloActions() {
    return XPL.ACTIONS.filter(function (a) { return a.scope === 'screen' || a.scope === 'world'; });
  }

  /* --------- builder de una regla --------- */
  function normWhen(r) { var w = XPL.condsOf(r.when); r.when = { join: w.join, conds: w.conds.slice() }; return r.when; }

  function builderHTML(r) {
    var W = XPL.condsOf(r.when);
    var joinLbl = W.join === 'or' ? 'O' : 'Y';
    var whenRows = '';
    W.conds.forEach(function (c, ci) {
      var f = XPL.byId(XPL.FACTS, c.fact) || XPL.FACTS[0];
      var row = '<select data-b="fact" data-ci="' + ci + '">' + opt(XPL.FACTS, c.fact) + '</select>';
      if (f.type === 'num') {
        row += '<select data-b="op" data-ci="' + ci + '">' + opt(XPL.OPS, c.op || '>=') + '</select>' +
          '<input type="number" data-b="val" data-ci="' + ci + '" value="' + (c.value != null ? c.value : 0) + '" style="width:62px">' +
          (f.unit ? '<i class="u">' + f.unit + '</i>' : '');
      } else if (f.type === 'enum') {
        row += '<i class="u">es</i><select data-b="eval" data-ci="' + ci + '">' + opt(f.values, c.value) + '</select>';
      } else {
        row += '<select data-b="bool" data-ci="' + ci + '"><option value="true"' + (c.value !== false ? ' selected' : '') +
          '>sí</option><option value="false"' + (c.value === false ? ' selected' : '') + '>no</option></select>';
      }
      if (W.conds.length > 1) row += '<button class="x" data-rmcond="' + ci + '">✕</button>';
      if (ci > 0) whenRows += '<div class="jn"><button class="lk" data-join="1">' + joinLbl + '</button></div>';
      whenRows += '<div class="rw">' + row + '</div>';
    });
    whenRows += '<div class="rw"><button class="lk" data-addcond="1">+ condición</button></div>';

    var acts = gemeloActions();
    var doRows = '';
    (r.do || []).forEach(function (act, i) {
      var a = XPL.byId(XPL.ACTIONS, act.id) || acts[0];
      var pr = '';
      if (a.param) {
        if (a.param.kind === 'enum') pr = '<select data-b="aval" data-i="' + i + '">' + opt(a.param.values, act.value) + '</select>';
        else pr = '<input type="text" data-b="aval" data-i="' + i + '" value="' + String(act.value || '').replace(/"/g, '&quot;') +
          '" placeholder="' + (a.param.placeholder || '') + '" style="flex:1;min-width:90px">';
      }
      doRows += '<div class="rw"><select data-b="act" data-i="' + i + '">' + opt(acts, act.id) + '</select>' + pr +
        (r.do.length > 1 ? '<button class="x" data-rmact="' + i + '">✕</button>' : '') + '</div>';
    });

    var prio = '<label>prioridad</label><div class="rw"><input type="number" data-b="prio" value="' + (r.priority || 0) +
      '" style="width:60px" min="0" max="99"><i class="u">gana el número más alto</i></div>';

    return '<div class="bld" data-bld="' + r.id + '">' +
      '<label>cuando (IF)</label>' + whenRows +
      '<label>entonces (THEN · DO THAT)</label>' + doRows +
      '<div class="rw"><button class="lk" data-addact="1">+ acción</button></div>' +
      prio +
      '<div class="rw end"><button class="lk" data-dup="1">copiar</button><span class="sp"></span><button class="ok" data-done="1">hecho</button></div>' +
      '</div>';
  }

  function render() {
    var list = panel.querySelector('#xc-list');
    panel.querySelector('#xc-count').textContent = RULES.length;
    if (!RULES.length) {
      list.innerHTML = '<div class="empty">Sin reglas. Crea una con <b>+ regla</b>.<br>' +
        'Ej: <i>CUANDO llueve ENTONCES en las pantallas anunciar botas de agua</i></div>';
      return;
    }
    var html = '';
    RULES.forEach(function (r) {
      var sent = XPL.ruleSentence(r, 'es').replace(/\b(CUANDO|ENTONCES|Y|O|coge|y)\b/g, '<b class="kw">$1</b>');
      html += '<div class="card' + (r.enabled === false ? ' off' : '') + '">' +
        '<div class="hd"><span class="sw' + (r.enabled === false ? '' : ' on') + '" data-tog="' + r.id + '"><i></i></span>' +
        '<input class="nm" value="' + String(r.name || '').replace(/"/g, '&quot;') + '" data-nm="' + r.id + '">' +
        '<button class="x" data-edit="' + r.id + '">✎</button><button class="x" data-del="' + r.id + '">✕</button></div>' +
        '<div class="sent">' + sent + '</div>' +
        (editingId === r.id ? builderHTML(r) : '') + '</div>';
    });
    list.innerHTML = html;
  }

  /* --------- acciones sobre el modelo --------- */
  function addRule() {
    var r = { id: uniq(), name: 'Regla nueva', enabled: true, priority: 1,
      when: { join: 'and', conds: [{ fact: 'rain', value: true }] }, who: { group: 'all', filter: {} },
      do: [{ id: 'showAd', value: 'rainboots' }] };
    RULES.push(r); editingId = r.id; persist(); render();
  }
  function defaultActVal(id) { var a = XPL.byId(XPL.ACTIONS, id); return a && a.param ? (a.param.kind === 'enum' ? a.param.values[0].id : '') : undefined; }

  /* --------- UI: construir panel --------- */
  function build() {
    var st = document.createElement('style');
    st.textContent = [
      '#xpl-composer{position:fixed;top:80px;left:24px;width:360px;height:440px;min-width:300px;min-height:240px;',
      'background:#0f141dF2;border:1px solid #26303f;border-radius:14px;z-index:100060;color:#e8eef7;',
      'font:13px -apple-system,Segoe UI,Roboto,sans-serif;display:none;flex-direction:column;overflow:hidden;',
      'box-shadow:0 18px 50px rgba(0,0,0,.5);resize:both;backdrop-filter:blur(8px)}',
      '#xpl-composer *{box-sizing:border-box}',
      '#xpl-composer .top{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #26303f;cursor:grab;background:#131822}',
      '#xpl-composer .top b{font-size:13px;letter-spacing:.3px}',
      '#xpl-composer .top .tag{color:#5bd6c0;font-family:ui-monospace,monospace;font-size:11px}',
      '#xpl-composer .pill{font-size:11px;color:#8a97ab;border:1px solid #26303f;border-radius:999px;padding:2px 8px}',
      '#xpl-composer .sp{flex:1}',
      '#xpl-composer button{font:inherit;cursor:pointer;border:1px solid #26303f;background:#1a212e;color:#e8eef7;border-radius:9px;padding:5px 9px;font-size:12px}',
      '#xpl-composer button:hover{border-color:#5bd6c0}',
      '#xpl-composer .ok{background:#5bd6c0;color:#06231e;border-color:#5bd6c0;font-weight:700}',
      '#xpl-composer .lk{background:transparent;padding:3px 9px;color:#7aa2ff;font-size:11px}',
      '#xpl-composer .list{flex:1;overflow:auto;padding:10px;display:flex;flex-direction:column;gap:9px}',
      '#xpl-composer .card{background:#1a212e;border:1px solid #26303f;border-radius:11px;overflow:hidden;flex:none}',
      '#xpl-composer .card.off{opacity:.5}',
      '#xpl-composer .hd{display:flex;align-items:center;gap:7px;padding:7px 9px;border-bottom:1px solid #26303f;background:#161d28}',
      '#xpl-composer .nm{flex:1;background:transparent;border:none;color:#e8eef7;font-weight:600;font-size:12.5px;outline:none}',
      '#xpl-composer .sent{padding:8px 10px;font-size:12px;line-height:1.5;color:#cdd8e8}',
      '#xpl-composer .kw{color:#5bd6c0;font-family:ui-monospace,monospace;font-size:10.5px;font-weight:700}',
      '#xpl-composer .sw{position:relative;width:30px;height:17px;border-radius:999px;background:#2a3444;border:1px solid #26303f;flex:none}',
      '#xpl-composer .sw.on{background:#5bd6c0}',
      '#xpl-composer .sw i{position:absolute;top:1px;left:1px;width:13px;height:13px;border-radius:50%;background:#fff;transition:.15s}',
      '#xpl-composer .sw.on i{left:14px}',
      '#xpl-composer .x{color:#8a97ab;border:none;background:transparent;font-size:14px;padding:1px 5px}',
      '#xpl-composer .x:hover{color:#ff6b6b}',
      '#xpl-composer .bld{padding:9px 10px;border-top:1px solid #26303f;background:#0c1119;display:flex;flex-direction:column;gap:7px}',
      '#xpl-composer label{font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:#8a97ab}',
      '#xpl-composer .rw{display:flex;align-items:center;gap:6px;flex-wrap:wrap}',
      '#xpl-composer .rw.end{margin-top:2px}',
      '#xpl-composer .jn{margin:-2px 0}',
      '#xpl-composer select,#xpl-composer input{font:inherit;background:#1a212e;color:#e8eef7;border:1px solid #26303f;border-radius:8px;padding:5px 7px;font-size:12px;outline:none}',
      '#xpl-composer select:focus,#xpl-composer input:focus{border-color:#7aa2ff}',
      '#xpl-composer .u{color:#8a97ab;font-size:11px;font-style:normal}',
      '#xpl-composer .empty{color:#8a97ab;font-size:12px;text-align:center;padding:24px 14px;line-height:1.7}',
      '#xpl-composer .ft{padding:7px 11px;border-top:1px solid #26303f;color:#8a97ab;font-size:11px;display:flex;align-items:center;gap:6px}'
    ].join('');
    document.head.appendChild(st);

    panel = document.createElement('div');
    panel.id = 'xpl-composer';
    panel.innerHTML =
      '<div class="top" id="xc-drag"><b>IF·THEN·<span class="tag">DO THAT</span></b>' +
      '<span class="pill" id="xc-count">0</span><span class="sp"></span>' +
      '<button class="ok" id="xc-add">+ regla</button>' +
      '<button class="lk" id="xc-ex">ejemplos</button>' +
      '<button class="x" id="xc-close">✕</button></div>' +
      '<div class="list" id="xc-list"></div>' +
      '<div class="ft">● los cambios se ven al instante en la pantalla condicional</div>';
    document.body.appendChild(panel);

    panel.querySelector('#xc-add').onclick = addRule;
    panel.querySelector('#xc-close').onclick = function () { setOpen(false); };
    panel.querySelector('#xc-ex').onclick = seed;
    dragify(panel, panel.querySelector('#xc-drag'));
    wire();
  }

  function seed() {
    RULES = [
      { id: uniq(), name: 'Llueve → botas de agua', enabled: true, priority: 3,
        when: { join: 'and', conds: [{ fact: 'rain', value: true }] }, who: { group: 'all', filter: {} }, do: [{ id: 'showAd', value: 'rainboots' }] },
      { id: uniq(), name: 'Calor → helado', enabled: true, priority: 1,
        when: { join: 'and', conds: [{ fact: 'temperature', op: '>=', value: 28 }] }, who: { group: 'all', filter: {} }, do: [{ id: 'showAd', value: 'icecream' }] },
      { id: uniq(), name: 'Noche → happy hour', enabled: true, priority: 1,
        when: { join: 'and', conds: [{ fact: 'night', value: true }] }, who: { group: 'all', filter: {} }, do: [{ id: 'showAd', value: 'happyhour' }] }
    ];
    editingId = null; persist(); render();
  }

  /* --------- eventos (delegación) --------- */
  function wire() {
    var list = panel.querySelector('#xc-list');
    list.addEventListener('click', function (e) {
      var t = e.target, b = t.closest('[data-bld]'), r;
      var tog = t.closest('[data-tog]');
      if (tog) { r = find(tog.dataset.tog); r.enabled = r.enabled === false; persist(); render(); return; }
      if (t.dataset.edit) { editingId = editingId === t.dataset.edit ? null : t.dataset.edit; render(); return; }
      if (t.dataset.del) { RULES = RULES.filter(function (x) { return x.id !== t.dataset.del; }); persist(); render(); return; }
      if (t.dataset.done) { editingId = null; render(); return; }
      if (!b) return; r = find(b.dataset.bld); if (!r) return;
      if (t.dataset.dup != null) { var c = JSON.parse(JSON.stringify(r)); c.id = uniq(); c.name = r.name + ' (copia)'; RULES.push(c); editingId = c.id; persist(); render(); return; }
      if (t.dataset.addcond != null) { normWhen(r).conds.push({ fact: 'temperature', op: '>=', value: 25 }); persist(); render(); return; }
      if (t.dataset.rmcond != null) { normWhen(r).conds.splice(+t.dataset.rmcond, 1); persist(); render(); return; }
      if (t.dataset.join != null) { var w = normWhen(r); w.join = w.join === 'or' ? 'and' : 'or'; persist(); render(); return; }
      if (t.dataset.addact != null) { r.do.push({ id: 'showAd', value: 'promo' }); persist(); render(); return; }
      if (t.dataset.rmact != null) { r.do.splice(+t.dataset.rmact, 1); persist(); render(); return; }
    });
    list.addEventListener('change', function (e) {
      var b = e.target.closest('[data-bld]'); if (!b) return;
      var r = find(b.dataset.bld), t = e.target, k = t.dataset.b;
      var i = t.dataset.i != null ? +t.dataset.i : null, ci = t.dataset.ci != null ? +t.dataset.ci : 0;
      if (k === 'fact') { var w = normWhen(r), f = XPL.byId(XPL.FACTS, t.value), nc = { fact: t.value };
        if (f.type === 'num') { nc.op = '>='; nc.value = f.min != null ? Math.round((f.min + (f.max || 100)) / 2) : 0; }
        else if (f.type === 'enum') nc.value = f.values[0].id; else nc.value = true; w.conds[ci] = nc; }
      else if (k === 'op') normWhen(r).conds[ci].op = t.value;
      else if (k === 'val') normWhen(r).conds[ci].value = +t.value;
      else if (k === 'eval') normWhen(r).conds[ci].value = t.value;
      else if (k === 'bool') normWhen(r).conds[ci].value = (t.value === 'true');
      else if (k === 'prio') r.priority = +t.value || 0;
      else if (k === 'act') { r.do[i] = { id: t.value }; var dv = defaultActVal(t.value); if (dv !== undefined) r.do[i].value = dv; }
      else if (k === 'aval') r.do[i].value = t.value;
      persist(); render();
    });
    list.addEventListener('input', function (e) {
      if (e.target.dataset.nm) { var r = find(e.target.dataset.nm); r.name = e.target.value;
        try { localStorage.setItem(LS, JSON.stringify(RULES)); } catch (x) {} }
    });
  }

  /* --------- drag --------- */
  function dragify(node, handle) {
    var sx, sy, ox, oy, drag = false;
    handle.addEventListener('mousedown', function (e) {
      if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
      drag = true; sx = e.clientX; sy = e.clientY; var r = node.getBoundingClientRect(); ox = r.left; oy = r.top;
      handle.style.cursor = 'grabbing'; e.preventDefault();
    });
    window.addEventListener('mousemove', function (e) {
      if (!drag) return; node.style.left = (ox + e.clientX - sx) + 'px'; node.style.top = (oy + e.clientY - sy) + 'px'; node.style.right = 'auto';
    });
    window.addEventListener('mouseup', function () { drag = false; if (handle) handle.style.cursor = 'grab'; });
  }

  /* --------- abrir/cerrar --------- */
  function setOpen(v) {
    open = v;
    if (!panel) build();
    if (v) { RULES = loadRules(); render(); }
    panel.style.display = v ? 'flex' : 'none';
  }

  /* --------- CLI: /ifthendothat on|off|toggle (alias /componer) --------- */
  function patch() {
    var prev = window.__xtExec;
    if (typeof prev !== 'function') return setTimeout(patch, 500);
    window.__xtExec = function (text) {
      var t = String(text || '').trim();
      if (/^\/(ifthendothat|componer)\b/i.test(t)) {
        var a = (t.split(/\s+/)[1] || 'toggle').toLowerCase();
        setOpen(a === 'on' ? true : a === 'off' ? false : !open);
        return Promise.resolve('ifthendothat');
      }
      return prev.apply(this, arguments);
    };
  }

  /* --------- intercepción del chat in-game ---------------------------------
   * El chat del gemelo (#telegramComposer) llama a la función LOCAL
   * executeTelegramText, que no pasa por nuestras envolturas de window.__xtExec.
   * Capturamos el envío y enrutamos NUESTROS comandos a window.__xtExec
   * (que sí tiene los wrappers de /ifthendothat y /condicional). El resto pasa
   * tal cual al gemelo. */
  var MINE = /^\/(ifthendothat|componer|condicional|condicionados|xpl)\b/i;
  function routeMine(v) {
    var t = String(v || '').trim();
    if (typeof window.__xtExec === 'function') window.__xtExec(t);
    var verb = t.split(/\s+/)[0];
    try { if (typeof window.showEv === 'function') window.showEv('XPL · ' + verb.replace(/^\//, '') + ' ✓', '#5bd6c0'); } catch (e) {}
  }
  function initInputHook() {
    var box = document.getElementById('telegramComposer');
    var btn = document.getElementById('telegramSendBtn');
    if (!box) { return setTimeout(initInputHook, 600); }
    if (box.__xplHooked) return; box.__xplHooked = true;
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey && MINE.test(box.value)) {
        var v = box.value; e.preventDefault(); e.stopImmediatePropagation(); routeMine(v); box.value = '';
      }
    }, true);
    if (btn) btn.addEventListener('click', function (e) {
      if (MINE.test(box.value)) { var v = box.value; e.preventDefault(); e.stopImmediatePropagation(); routeMine(v); box.value = ''; }
    }, true);
    console.log('[XPL] chat in-game enganchado (/ifthendothat, /condicional)');
  }

  function boot() { patch(); initInputHook(); console.log('[XPL] compositor listo · /ifthendothat on|off|toggle'); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  window.XPLComposer = { open: function () { setOpen(true); }, close: function () { setOpen(false); }, toggle: function () { setOpen(!open); } };
})();
