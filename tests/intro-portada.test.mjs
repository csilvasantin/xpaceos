// Intro en vídeo de la portada (17-oct-2026): una vez por sesión, se salta, respeta «reducir movimiento»
// y el idioma, y sirve 1080p o 720p. Contrato: admira-xp/docs/intro-portada.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync, statSync} from 'node:fs';

const require = createRequire(import.meta.url);
const intro = require('../assets/intro-portada.js');
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('la portada carga la intro con versión y sin bloquear el render', () => {
  const html = read('index.html');
  assert.match(html, /<script defer src="\/assets\/intro-portada\.js\?v=[^"]+"><\/script>/);
  assert.ok(html.indexOf('/assets/xpace-lang.js') < html.indexOf('/assets/intro-portada.js'), 'el idioma se resuelve antes');
});

test('sale la primera vez en español y no se repite en la misma sesión', () => {
  assert.equal(intro.shouldShow({search: '', lang: 'es', reducedMotion: false, seen: false}), true);
  assert.equal(intro.shouldShow({search: '', lang: 'es', reducedMotion: false, seen: true}), false);
});

test('no sale con «reducir movimiento» ni en inglés; ?intro=0 la quita y ?intro=1 la fuerza', () => {
  assert.equal(intro.shouldShow({search: '', lang: 'es', reducedMotion: true, seen: false}), false);
  assert.equal(intro.shouldShow({search: '', lang: 'en', reducedMotion: false, seen: false}), false);
  assert.equal(intro.shouldShow({search: '?intro=0', lang: 'es', reducedMotion: false, seen: false}), false);
  assert.equal(intro.shouldShow({search: '?intro=1', lang: 'en', reducedMotion: true, seen: true}), true);
});

test('1080p en pantallas grandes y 720p en el resto', () => {
  assert.equal(intro.pickSource(1920, 1), intro.SOURCES[1080]);
  assert.equal(intro.pickSource(1440, 2), intro.SOURCES[1080]);
  assert.equal(intro.pickSource(390, 3), intro.SOURCES[720]);
  assert.equal(intro.pickSource(1280, 1), intro.SOURCES[720]);
});

test('los vídeos existen y pesan menos de 10 MB', () => {
  for (const src of Object.values(intro.SOURCES)) {
    const size = statSync(new URL('..' + src, import.meta.url)).size;
    assert.ok(size > 100_000 && size < 10_000_000, src + ' pesa ' + size);
  }
});

test('se puede saltar con botón o Esc, en los dos idiomas, y no tapa la portada si el vídeo no arranca', () => {
  const src = read('assets/intro-portada.js');
  assert.match(src, /Saltar intro/);
  assert.match(src, /Skip intro/);
  assert.match(src, /e\.key === 'Escape'/);
  assert.match(src, /video\.addEventListener\('ended', close\)/);
  assert.match(src, /video\.addEventListener\('error', close\)/);
  assert.match(src, /p\.catch\(close\)/);
  assert.match(src, /setItem\(SEEN_KEY, '1'\)/);
});
