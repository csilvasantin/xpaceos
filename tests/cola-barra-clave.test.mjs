// Barra cerrada (Carlos, 7-oct-2026): el relé de la cola pide la clave de barra (x-cola-clave) para escribir.
// El gemelo la guarda SOLO en el dispositivo (localStorage xpace:cola-barra), ↺ Reset la manda y, sin clave o con 401,
// avisa en «Pedidos · TPV» en vez de fallar en silencio. Relé SIMULADO: aquí no se llama a producción.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const code = read('admira-xp/scripts/totem-kiosko.js');
const CLAVE = 'Barra-Prueba-7731';
const RELAY = 'https://mcp-ainimation.admira.store';

function relé({ estado, avanzar = () => ({ status: 200 }), caido = false } = {}) {
  const llamadas = [];
  const fetch = async (url, opts = {}) => {
    llamadas.push({ url, method: opts.method || 'GET', headers: { ...(opts.headers || {}) }, body: opts.body });
    if (caido) throw new Error('sin red');
    if (url.startsWith(RELAY + '/cola/estado')) return { ok: true, status: 200, json: async () => estado };
    if (url.startsWith(RELAY + '/cola/avanzar')) { const r = avanzar(opts); return { ok: r.status < 300, status: r.status, json: async () => ({}) }; }
    return { ok: false, status: 404, json: async () => ({}) };
  };
  return { fetch, llamadas };
}

function gemelo({ store = {}, hash = '', fetch, lang = 'es', sessionLog = null } = {}) {
  const ticks = [], toasts = [], eventos = [], replaced = [], listeners = {};
  const mem = new Map(Object.entries(store));
  const localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
  const byId = {};
  const el = (tag) => {
    const cls = new Set(), l = {}, kids = {};
    const n = {
      tagName: String(tag || 'div').toUpperCase(), style: {}, textContent: '', innerHTML: '', hidden: false, value: '', title: '',
      classList: { add: (c) => cls.add(c), remove: (c) => cls.delete(c), contains: (c) => cls.has(c), toggle: (c, v) => { (v === undefined ? !cls.has(c) : v) ? cls.add(c) : cls.delete(c); } },
      appendChild(c) { if (c && c.id) byId[c.id] = c; return c; },
      addEventListener: (t, f) => { (l[t] = l[t] || []).push(f); },
      fire: (t, e) => (l[t] || []).forEach((f) => f(e || { stopPropagation() {}, preventDefault() {} })),
      setAttribute() {}, removeAttribute() {}, querySelector: (s) => (kids[s] = kids[s] || el('x')), querySelectorAll: () => [],
      closest: () => null, getBoundingClientRect: () => ({ width: 0, height: 0 }),
    };
    return n;
  };
  const doc = {
    readyState: 'complete', body: el('body'), head: el('head'), documentElement: el('html'), activeElement: null,
    addEventListener() {}, createElement: el, getElementById: (id) => byId[id] || null, querySelector: () => null, querySelectorAll: () => [],
  };
  const location = { search: '', hash, pathname: '/admira-xp/', href: 'https://www.xpaceos.com/admira-xp/' + hash };
  const w = {
    document: doc, location, localStorage,
    history: { state: null, replaceState: (s, t, u) => { replaced.push(u); location.hash = u.includes('#') ? u.slice(u.indexOf('#')) : ''; } },
    addEventListener: (t, f) => { (listeners[t] = listeners[t] || []).push(f); },
    dispatchEvent: (e) => eventos.push(e), XpaceStarbucks: { active: () => true, screenQuads: {} },
    setInterval: (f) => { ticks.push(f); return ticks.length; }, setTimeout() {}, fetch,
  };
  if (sessionLog) w.AdmiraXP_SessionLog = sessionLog;
  w.window = w;
  const ctx = vm.createContext({
    window: w, document: doc, URLSearchParams, URL, Intl, console, lang, DS_PIN: {}, location, localStorage, fetch,
    CustomEvent: function (type, init) { this.type = type; this.detail = init && init.detail; },
    showEv: (m, c) => toasts.push({ m, c }), setInterval: w.setInterval, setTimeout() {},
  });
  vm.runInContext(code, ctx);
  const panel = () => byId.kioskOrders || null;
  const aviso = () => { const b = panel(); if (!b) return { hidden: true, text: '' }; const kw = b.querySelector('.kw'); return { hidden: kw.hidden, text: kw.querySelector('.kwt').textContent }; };
  const cmd = (a) => w.totemKioskCommand(a);
  return { w, mem, toasts, eventos, replaced, ticks, listeners, panel, aviso, cmd, api: w.XpaceTotemKiosk };
}

const pedidos = (extra = {}) => ({ ok: true, recibido: [{ id: 'p1', numero: 'A001', nombre: 'Ana' }], preparando: [{ id: 'p2', numero: 'A002' }], listo: [], ...extra });

test('/totem clave guarda la clave en este dispositivo y nunca la enseña (solo ••••1234)', () => {
  const g = gemelo({ fetch: relé().fetch });
  const r = g.cmd('clave ' + CLAVE);
  assert.equal(r.ok, true);
  assert.equal(g.mem.get('xpace:cola-barra'), CLAVE, 'localStorage xpace:cola-barra');
  assert.ok(!r.message.includes(CLAVE), 'la respuesta no repite la clave');
  assert.match(r.message, /••••7731/);
  const est = g.cmd('clave');
  assert.match(est.message, /clave de barra: guardada ••••7731/);
  assert.ok(!est.message.includes(CLAVE));
  assert.match(g.cmd('').message, /clave de barra: guardada ••••7731/, '/totem dice si hay clave');
  assert.match(g.cmd('xyz').message, /\/totem clave <clave>\|off/, 'el uso lista /totem clave');
  assert.equal(g.api.clave.guardada(), true);
  assert.equal(g.api.clave.mascara(), '••••7731');
});

test('/totem clave off la borra; una clave corta no asoma ni por la máscara; la máscara no vale como clave', () => {
  const g = gemelo({ store: { 'xpace:cola-barra': CLAVE }, fetch: relé().fetch });
  assert.equal(g.cmd('clave off').ok, true);
  assert.equal(g.mem.has('xpace:cola-barra'), false);
  assert.match(g.cmd('clave').message, /clave de barra: no guardada/);
  g.cmd('clave abc');
  assert.equal(g.api.clave.mascara(), '••••');
  assert.ok(!g.cmd('clave').message.includes('abc'));
  const r = g.cmd('clave ••••');
  assert.equal(r.ok, false); assert.equal(g.mem.get('xpace:cola-barra'), 'abc');
});

test('↺ Reset con clave manda x-cola-clave en cada POST /cola/avanzar (la lectura pública no la lleva)', async () => {
  const rel = relé({ estado: pedidos({ acceso: { kiosko: 'abierto', barra: 'cerrada', detalle: false } }) });
  const g = gemelo({ store: { 'xpace:cola-barra': CLAVE }, fetch: rel.fetch });
  const n = await g.api.reset();
  assert.equal(n, 2);
  const posts = rel.llamadas.filter((c) => c.method === 'POST');
  assert.equal(posts.length, 2);
  for (const p of posts) { assert.equal(p.headers['x-cola-clave'], CLAVE); assert.equal(p.headers['content-type'], 'application/json'); assert.equal(JSON.parse(p.body).a, 'recogido'); }
  const gets = rel.llamadas.filter((c) => c.method === 'GET');
  assert.ok(gets.length >= 1); for (const c of gets) assert.equal(c.headers['x-cola-clave'], undefined);
  assert.equal(g.api.aviso(), '');
  assert.ok(g.toasts.some((t) => /Cola a cero · 2 pedidos cerrados/.test(t.m)));
  assert.ok(!JSON.stringify(g.toasts).includes(CLAVE));
});

test('sin clave y con la barra cerrada, ↺ Reset no escribe y avisa claro en «Pedidos · TPV»', async () => {
  const rel = relé({ estado: pedidos({ acceso: { kiosko: 'abierto', barra: 'cerrada', detalle: false } }) });
  const g = gemelo({ fetch: rel.fetch });
  const r = g.cmd('reset');
  assert.match(r.message, /\/totem clave <clave>/);
  await new Promise((ok) => setImmediate(ok));
  assert.equal(rel.llamadas.filter((c) => c.method === 'POST').length, 0, 'sin clave no hay POST (sería un 401 seguro)');
  assert.equal(g.api.aviso(), 'sin-clave');
  const a = g.aviso();
  assert.equal(a.hidden, false);
  assert.match(a.text, /La barra está cerrada: guarda la clave con \/totem clave <clave>/);
  assert.ok(g.panel().classList.contains('on'), 'el panel se abre para que se vea el aviso');
  assert.ok(g.toasts.some((t) => /La barra está cerrada/.test(t.m)));
  assert.equal(g.eventos.find((e) => e.type === 'xpace:cola-reset').detail.aviso, 'sin-clave');
  // guardar la clave desde el propio panel (campo de contraseña) quita el aviso
  const box = g.panel(); box.querySelector('.kci').value = CLAVE; box.querySelector('.kc').fire('submit');
  assert.equal(g.mem.get('xpace:cola-barra'), CLAVE); assert.equal(box.querySelector('.kci').value, '');
  assert.equal(g.api.aviso(), ''); assert.equal(g.aviso().hidden, true);
});

test('con 401 avisa: sin clave → «guarda la clave»; con clave mala → «no acepta la clave guardada» y no vacía la lista', async () => {
  const sinAcceso = pedidos();
  const g1 = gemelo({ fetch: relé({ estado: sinAcceso, avanzar: () => ({ status: 401 }) }).fetch });
  await g1.api.reset();
  assert.equal(g1.api.aviso(), 'sin-clave');
  const rel = relé({ estado: sinAcceso, avanzar: () => ({ status: 401 }) });
  const g2 = gemelo({ store: { 'xpace:cola-barra': 'mala-clave-0000' }, fetch: rel.fetch });
  await g2.api.reset();
  assert.equal(g2.api.aviso(), 'rechazada');
  assert.match(g2.aviso().text, /no acepta la clave guardada \(401\): guarda la buena con \/totem clave <clave>/);
  assert.ok(rel.llamadas.filter((c) => c.method === 'POST').every((c) => c.headers['x-cola-clave'] === 'mala-clave-0000'));
  assert.ok(!g2.toasts.some((t) => /Cola a cero/.test(t.m)), 'no dice «cola a cero» si la barra la rechazó');
});

test('relé caído: el Reset avisa en vez de fingir que se hizo', async () => {
  const g = gemelo({ store: { 'xpace:cola-barra': CLAVE }, fetch: relé({ caido: true }).fetch });
  assert.equal(await g.api.reset(), 0);
  assert.equal(g.api.aviso(), 'rele');
  assert.match(g.aviso().text, /relé de la cola no responde/);
});

test('#cola-barra=<clave> la guarda una vez y la quita del fragmento (conserva el resto)', () => {
  const g = gemelo({ hash: '#vista=matrix&cola-barra=' + encodeURIComponent(CLAVE), fetch: relé().fetch });
  assert.equal(g.mem.get('xpace:cola-barra'), CLAVE);
  assert.deepEqual(g.replaced, ['/admira-xp/#vista=matrix']);
  assert.ok(!g.replaced.join('').includes(CLAVE));
  assert.ok(g.toasts.some((t) => /••••7731/.test(t.m)) && !JSON.stringify(g.toasts).includes(CLAVE));
  const solo = gemelo({ hash: '#cola-barra=' + CLAVE, fetch: relé().fetch });
  assert.deepEqual(solo.replaced, ['/admira-xp/']);
  const off = gemelo({ store: { 'xpace:cola-barra': CLAVE }, hash: '#cola-barra=off', fetch: relé().fetch });
  assert.equal(off.mem.has('xpace:cola-barra'), false);
});

test('la orden tecleada no deja la clave en el historial del CLI ni en el log de sesión', () => {
  const commands = ['/status', '/totem clave ' + CLAVE];
  const sessionLog = { commands, logCommand(c) { this.commands.push(String(c)); } };
  const g = gemelo({ store: { xpaceos_expert_history_v1: JSON.stringify(['/status', '/totem clave ' + CLAVE]) }, sessionLog, fetch: relé().fetch });
  g.cmd('clave ' + CLAVE);
  assert.deepEqual(JSON.parse(g.mem.get('xpaceos_expert_history_v1')), ['/status', '/totem clave']);
  assert.deepEqual(sessionLog.commands, ['/status', '/totem clave ••••']);
  sessionLog.logCommand('/totem clave otra-clave-9999');
  assert.equal(sessionLog.commands.at(-1), '/totem clave ••••', 'lo que llegue después también va tapado');
  sessionLog.logCommand('/totem clave off');
  assert.equal(sessionLog.commands.at(-1), '/totem clave off');
});

test('/cola/estado público solo trae el nombre de pila: el aviso «NOMBRE, tu pedido…» sigue funcionando', async () => {
  let estado = { ok: true, recibido: [], preparando: [], listo: [{ numero: 'A014', nombre: 'Lucía' }], acceso: { barra: 'cerrada', detalle: false } };
  const g = gemelo({ fetch: async () => ({ ok: true, status: 200, json: async () => estado }) });
  const tic = async () => { for (const f of g.ticks) { try { await f(); } catch (_) {} } await new Promise((ok) => setImmediate(ok)); };
  await tic(); // los listos que ya había al abrir no se anuncian
  estado = { ...estado, listo: [{ numero: 'A014', nombre: 'Lucía' }, { numero: 'A015', nombre: 'Marta' }, { numero: 'A016' }] };
  await tic();
  const avisos = g.w.__gemeloColaAvisos.map((a) => a.text);
  assert.equal(avisos[0], 'Marta, tu pedido Starbucks está preparado');
  assert.equal(g.api.colaTexto({ numero: 'A016' }), 'Pedido A016, tu pedido Starbucks está preparado');
  assert.equal(g.api.colaTexto({ numero: 'A017', nombre: 'José Luis' }), 'José Luis, tu pedido Starbucks está preparado');
});

test('/totem clave está en /help del gemelo, en la ayuda, la ayuda CLI, el tutorial, la guía y el manifiesto MCP', () => {
  const twin = read('admira-xp/index.html');
  const sec = twin.match(/\{title:[^\n]*Cola del quiosco · barra[^\n]*\}/);
  assert.ok(sec, 'sección de /help');
  for (const item of ['/totem reset', '/totem clave <clave>', '/totem clave off']) assert.ok(sec[0].includes("'" + item + "'"), item);
  assert.match(twin, /scripts\/totem-kiosko\.js\?v=cola-barra-1/);
  for (const f of ['admira-xp/help.html', 'help/index.html', 'help/cli/index.html', 'admira-xp/docs/cola-barra-clave.md']) {
    const t = read(f); for (const re of [/\/totem clave/, /#cola-barra=/, /x-cola-clave/]) assert.ok(re.test(t), f + " · " + re);
  }
  const m = JSON.parse(read('mcp/manifest.json'));
  assert.ok(m.queue_counter_key && m.queue_counter_key.cli.includes('/totem clave <clave>'));
  assert.ok(m.queue_windows_reset_audio.cli.includes('/totem clave <clave>|off'));
});
