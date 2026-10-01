// Guardián del shell cuadrático común de XpaceOS (FLT-101337).
// Toda página .html del sitio carga /assets/xpace-shell.css y /assets/xpace-shell.js con
// el sello vigente (el ?v= de la portada), es el gemelo (que trae la barra en línea) o
// figura en SHELL_EXCEPTIONS con su motivo. Una página nueva sin shell hace fallar el test.
// Ver admira-xp/docs/shell-cuadratico.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const repo = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const shell = require(join(repo, 'assets/xpace-shell.js'));
const read = path => readFileSync(join(repo, path), 'utf8');

const TWIN = 'admira-xp/index.html';
// Páginas sin la barra, cada una con su motivo. Revisadas una a una (1-oct-2026).
export const SHELL_EXCEPTIONS = {
  // Pantalla completa: escenarios, visores y apps inmersivas; una barra encima cortaría la escena.
  'nvidia/index.html': 'Pantalla completa: incrusta el gemelo a toda pantalla en un iframe para el stand NVIDIA.',
  'Xcaixa/index.html': 'Pantalla completa: Xperience inmersiva Xpacio Sucursal con su propio HUD.',
  'Xsuperman/index.html': 'Pantalla completa: Xperience inmersiva Xpacio Planeta 7 con su propio HUD.',
  'xpacios/grok/index.html': 'Pantalla completa: Xpacio Grok heredado de Pixeria, tras su verja; escena a toda pantalla.',
  'xpacios/xtanco-barcelona/index.html': 'Pantalla completa: Xpacio heredado de Pixeria, tras su verja; escena a toda pantalla.',
  'xpacios/xtanco-valencia/index.html': 'Pantalla completa: Xpacio heredado de Pixeria, tras su verja; escena a toda pantalla.',
  'xpacios/crear/index.html': 'Pantalla completa: generador de Xpacios heredado de Pixeria, tras su verja.',
  'xpacios/crear/phone.html': 'Pantalla completa: captura desde el móvil para el generador (abre con QR).',
  'xperiencias/batcueva/index.html': 'Pantalla completa: Xperiencia inmersiva La Batcueva.',
  'xperiencias/sheldon/index.html': 'Pantalla completa: Xperiencia inmersiva Sheldon.',
  'xperiencias/soledad/index.html': 'Pantalla completa: Xperiencia inmersiva Soledad.',
  'scan/pelicula.html': 'Pantalla completa: reproductor de la película del gemelo de XpaceScan.',
  'scan/visor.html': 'Pantalla completa: visor isométrico 3D del gemelo de XpaceScan.',
  'admira-xp/emulador/index.html': 'Pantalla completa: emulador Street View de admira.tv sobre el MUPI real.',
  // Redirecciones inmediatas: no pintan nada.
  'CPM.html': 'Redirección inmediata a /cpm/.',
  'Nvidia.html': 'Redirección inmediata a /nvidia/.',
  'game.html': 'Redirección inmediata al gemelo /admira-xp/.',
  'arcade/index.html': 'Redirección inmediata al arcade del gemelo.',
  'inventari/index.html': 'Redirección inmediata a /inventario/.',
  'xpacios/cafebreria/index.html': 'Redirección inmediata al Xpacio Cafebrería del gemelo.',
  // Fragmentos.
  'admira-xp/tools/walk-sprites/bake.html': 'Fragmento: herramienta interna de horneado de sprites, sin interfaz de página.',
};

function htmlFiles(dir = repo, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) htmlFiles(full, out);
    else if (name.endsWith('.html')) out.push(relative(repo, full).split('\\').join('/'));
  }
  return out.sort();
}

// Sello vigente: el ?v= con el que la portada carga el shell.
const portada = read('index.html');
const VERSION = (portada.match(/\/assets\/xpace-shell\.js\?v=([^"'&\s]+)/) || [])[1];

// Problemas de una página adoptada (vacío = cumple).
export function shellProblems(html, version = VERSION) {
  const problems = [];
  const head = (html.match(/<head[\s\S]*?<\/head>/i) || [''])[0];
  const css = head.match(/<link\b[^>]*href="\/assets\/xpace-shell\.css\?v=([^"]+)"[^>]*>/i);
  const js = head.match(/<script\b[^>]*src="\/assets\/xpace-shell\.js\?v=([^"]+)"[^>]*><\/script>/i);
  if (!css) problems.push('no carga /assets/xpace-shell.css en el <head>');
  else if (css[1] !== version) problems.push(`xpace-shell.css con ?v=${css[1]} (vigente ${version})`);
  if (!js) problems.push('no carga /assets/xpace-shell.js en el <head>');
  else {
    if (js[1] !== version) problems.push(`xpace-shell.js con ?v=${js[1]} (vigente ${version})`);
    if (!/\bdefer\b/.test(js[0])) problems.push('xpace-shell.js sin defer');
  }
  if (css) {
    // Después de todo el CSS propio del <head>: el shell se aísla de sus selectores.
    const after = head.slice(head.indexOf(css[0]) + css[0].length);
    if (/<style\b|<link\b[^>]*rel="stylesheet"/i.test(after)) problems.push('xpace-shell.css no va después del CSS propio');
  }
  // Alturas de la cabecera vieja: la barra mide var(--xs-bar-h).
  if (/calc\(\s*100d?vh\s*-\s*\d+px/i.test(html)) problems.push('altura fija «100vh - Npx»: usa var(--xs-bar-h)');
  return problems;
}

const pages = htmlFiles();

test('hay sello vigente del shell y el componente existe', () => {
  assert.match(VERSION || '', /^\d{8}-[a-z0-9-]+$/, 'la portada debe cargar el shell con ?v=AAAAMMDD-…');
  assert.ok(read('assets/xpace-shell.css').includes('#topBar.xs-bar'));
});

test('cada página carga el shell, es el gemelo o es una excepción con motivo', () => {
  const failures = [];
  for (const page of pages) {
    if (page === TWIN || page in SHELL_EXCEPTIONS) continue;
    const problems = shellProblems(read(page));
    if (problems.length) failures.push(`${page}: ${problems.join('; ')}`);
  }
  assert.deepEqual(failures, [], 'Páginas sin shell (adóptalo o añade la excepción con su motivo):\n' + failures.join('\n'));
});

test('las excepciones existen, tienen motivo y no cargan el shell', () => {
  for (const [page, reason] of Object.entries(SHELL_EXCEPTIONS)) {
    assert.ok(pages.includes(page), `excepción de una página que ya no existe: ${page}`);
    assert.ok(typeof reason === 'string' && reason.length > 20, `${page}: motivo vacío`);
    assert.doesNotMatch(read(page), /\/assets\/xpace-shell\.js/, `${page} carga el shell: quítala de SHELL_EXCEPTIONS`);
  }
});

test('una página nueva sin shell hace fallar al guardián', () => {
  const nueva = '<!doctype html><html><head><title>Nueva</title><style>body{margin:0}</style></head><body><header><nav><a href="/">Inicio</a></nav></header></body></html>';
  assert.ok(shellProblems(nueva).length >= 2);
  const adoptada = `<!doctype html><html><head><style>body{margin:0}</style><link rel="stylesheet" href="/assets/xpace-shell.css?v=${VERSION}"><script defer src="/assets/xpace-shell.js?v=${VERSION}"></script></head><body></body></html>`;
  assert.deepEqual(shellProblems(adoptada), []);
  const vieja = adoptada.replaceAll(VERSION, '20200101-viejo');
  assert.equal(shellProblems(vieja).length, 2, 'un ?v= antiguo también falla');
  const desordenada = adoptada.replace('<style>body{margin:0}</style>', '') .replace('</head>', '<style>body{margin:0}</style></head>');
  assert.match(shellProblems(desordenada).join(), /después del CSS propio/);
  assert.match(shellProblems(adoptada.replace('<body>', '<body><main style="height:calc(100vh - 64px)">')).join(), /100vh - Npx/);
});

test('el gemelo conserva su barra en línea con los mismos glifos y clases', () => {
  const game = read(TWIN);
  assert.match(game, /<div id="topBar">/);
  assert.match(game, /<button\b[^>]*id="pfOptions"[^>]*data-quad-toggle="left"[^>]*>☰<\/button>/);
  assert.match(game, /<button\b[^>]*data-quad-toggle="right"[^>]*>▤<\/button>/);
  assert.match(game, /<button\b[^>]*id="pfExpert"[^>]*>⌘<\/button>/);
  assert.match(game, /<nav class="quad-menu quad-left is-collapsed"/);
  assert.match(game, /<nav class="quad-menu quad-right is-collapsed"/);
  // Carga el shell común en modo barra en línea (API, /marca y marca blanca) con el sello vigente.
  assert.ok(game.includes(`<script defer src="/assets/xpace-shell.js?v=${VERSION}" data-shell="inline"></script>`), 'el gemelo carga xpace-shell.js con el sello vigente');
  // Ejecuta una vez la orden que le pasa el shell común (sessionStorage, nunca la URL).
  assert.match(game, /sessionStorage\.getItem\('xpaceos_expert_pending_v1'\)/);
  assert.match(game, /sessionStorage\.removeItem\('xpaceos_expert_pending_v1'\)/);
});

test('el componente genera el mismo marcado que el gemelo', () => {
  const {html, bar} = shell.markup({section: {es: '/ ayuda', en: '/ help'}, advanced: [{href: '#a', es: 'A', en: 'A'}]}, {lang: 'es'});
  assert.match(bar, /^<div id="topBar" class="show xs-bar" data-xpace-shell>/);
  assert.match(html, /<button\b[^>]*id="pfOptions"[^>]*data-quad-toggle="left"[^>]*>☰<\/button>/);
  assert.match(html, /<button\b[^>]*data-quad-toggle="right"[^>]*>▤<\/button>/);
  assert.match(html, /<button\b[^>]*id="pfExpert"[^>]*>⌘<\/button>/);
  assert.match(html, /<nav class="quad-menu quad-left xs-panel is-collapsed" id="xsOptions"/);
  assert.match(html, /<nav class="quad-menu quad-right xs-panel is-collapsed" id="xsAdvanced"/);
  assert.match(html, /<section class="quad-menu quad-bottom xs-expert is-collapsed" id="xsExpert"/);
  assert.match(html, /XpaceOS/);
  assert.match(html, /\/ ayuda/);
  const en = shell.markup({}, {lang: 'en'}).html;
  assert.match(en, /aria-label="Options"/);
  assert.match(en, /Advanced options/);
  assert.doesNotMatch(shell.markup({options: [{href: 'javascript:alert(1)', es: 'x'}]}).html, /javascript:/);
  assert.match(shell.markup({section: '<img src=x onerror=alert(1)>'}).html, /&lt;img/);
});

test('CLI: parseo, verbos del gemelo y orden canónica', () => {
  assert.deepEqual(shell.parseCommand(' /Marca  starbucks '), {raw: '/Marca  starbucks', slash: true, verb: 'marca', args: 'starbucks'});
  assert.equal(shell.parseCommand('   '), null);
  assert.equal(shell.parseCommand('/status@AdmiraXPBot').verb, 'status');
  for (const verb of ['distribuir', 'matrix', 'status', 'music', 'layout', 'inventario', 'sincro']) assert.ok(shell.isTwinVerb(verb), verb);
  assert.ok(!shell.isTwinVerb('marca'));
  assert.equal(shell.twinCommand(shell.parseCommand('/matrix')), 'matrix');
  assert.equal(shell.twinCommand(shell.parseCommand('better')), 'better');
  assert.equal(shell.twinCommand(shell.parseCommand('/cli distribuir')), '/cli distribuir');
  assert.equal(shell.twinCommand(shell.parseCommand('status')), '/status');
});

test('los verbos del gemelo cubren su /help (helpSections)', () => {
  const game = read(TWIN);
  const start = game.indexOf('function helpSections(){');
  const block = game.slice(start, game.indexOf('function showHelpPanel', start));
  const items = [...block.matchAll(/items:\[([^\]]*)\]/g)].flatMap(m => [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]));
  const roots = new Set(items.map(item => item.split(/\s+/)[0].replace(/^\//, '').toLowerCase()).filter(r => /^[a-z0-9]+$/.test(r)));
  const local = new Set([...shell.SHELL_VERBS, 'start']);
  const missing = [...roots].filter(r => !shell.isTwinVerb(r) && !local.has(r));
  assert.deepEqual(missing, [], 'Añade a TWIN_VERBS de assets/xpace-shell.js los verbos nuevos del gemelo');
});

test('traspaso al gemelo por sessionStorage: una vez y caduca a los 2 minutos', () => {
  const store = new Map();
  const storage = {getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k)};
  assert.ok(shell.savePending(storage, '/distribuir', 1000));
  assert.ok(store.has(shell.PENDING_KEY));
  assert.equal(shell.takePending(storage, 1000 + 60_000), '/distribuir');
  assert.equal(shell.takePending(storage, 1000 + 60_000), null, 'solo una vez');
  shell.savePending(storage, 'matrix', 1000);
  assert.equal(shell.takePending(storage, 1000 + 2 * 60_000 + 1), null, 'caducada');
  assert.equal(store.size, 0);
  assert.ok(!shell.savePending(storage, '', 1));
  assert.ok(!shell.savePending(null, '/status', 1));
  assert.equal(shell.PENDING_KEY, 'xpaceos_expert_pending_v1');
});

test('Tab completa verbos e ids de marca', () => {
  assert.deepEqual(shell.complete('/ma', ['marca', 'matrix', 'help']), {value: '/ma', options: ['marca', 'matrix']});
  assert.equal(shell.complete('/marc', ['marca', 'matrix']).value, '/marca ');
  assert.equal(shell.complete('/marca sta', ['marca'], ['admira', 'starbucks']).value, '/marca starbucks');
  assert.deepEqual(shell.complete('/marca o', ['marca'], ['admira']).options, ['off']);
  assert.deepEqual(shell.complete('/status x', ['status'], ['admira']).options, []);
});
