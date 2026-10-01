import test from 'node:test';
import assert from 'node:assert/strict';
import {perimetro, siteForHost, isPublicPath, safeReturnTo} from '../functions/_perimetro.js';

const env = {PERIMETRO_SIGNING_KEY:'k'.repeat(64), WHITELIST_SITE_TOKEN:'t'.repeat(64)};
const ctx = (url, headers = {}) => ({
  request:new Request(url, {headers}), env,
  next:async () => new Response('<html>contenido</html>', {headers:{'content-type':'text/html'}})
});
const noFetch = async () => { throw new Error('sin red en el test'); };

test('cada dominio es su web; pages.dev y previews también; lo demás no', () => {
  assert.equal(siteForHost('www.xpaceos.com').id, 'xpaceos');
  assert.equal(siteForHost('www.admira.store').id, 'admira-store');
  assert.equal(siteForHost('abc123.xpaceos.pages.dev').id, 'xpaceos');
  assert.equal(siteForHost('evil-xpaceos.pages.dev'), null);
  assert.equal(siteForHost('ejemplo.com'), null);
});

test('rutas públicas acordadas: gemelo, xpacios y MCP', () => {
  assert.ok(isPublicPath('/admira-xp/'));
  assert.ok(isPublicPath('/admira-xp/index.html'));
  assert.ok(isPublicPath('/xpacios/cafebreria/'));
  assert.ok(isPublicPath('/mcp/'));
  assert.ok(!isPublicPath('/'));
  assert.ok(!isPublicPath('/admira-xpfalso/'));
});

test('sin sesión, la portada redirige al login y no entrega el HTML', async () => {
  const r = await perimetro(ctx('https://www.xpaceos.com/inventario/', {Accept:'*/*'}), noFetch);
  assert.equal(r.status, 302);
  assert.equal(r.headers.get('location'), 'https://www.xpaceos.com/auth/login?return_to=%2Finventario%2F');
});

test('el apex manda al login del canónico', async () => {
  const r = await perimetro(ctx('https://admira.store/'), noFetch);
  assert.equal(r.headers.get('location'), 'https://www.admira.store/auth/login?return_to=%2F');
});

test('el gemelo y los assets salen sin sesión', async () => {
  assert.equal((await perimetro(ctx('https://www.xpaceos.com/admira-xp/'), noFetch)).status, 200);
  assert.equal((await perimetro(ctx('https://www.xpaceos.com/assets/logo.png'), noFetch)).status, 200);
});

test('una cookie falsificada no abre nada', async () => {
  const r = await perimetro(ctx('https://www.xpaceos.com/', {Cookie:'__Host-perimetro_session=eyJ2IjoxfQ.firmafalsa'}), noFetch);
  assert.equal(r.status, 302);
});

test('host desconocido → 421', async () => {
  assert.equal((await perimetro(ctx('https://otro.example/'), noFetch)).status, 421);
});

test('la página de login lleva el callback del propio host', async () => {
  const r = await perimetro(ctx('https://www.admira.store/auth/login?return_to=%2Fx'), noFetch);
  assert.equal(r.status, 401);
  const html = await r.text();
  assert.match(html, /data-login_uri="https:\/\/www\.admira\.store\/auth\/callback"/);
  assert.match(r.headers.get('set-cookie'), /__Host-perimetro_nonce=/);
});

test('callback sin credencial válida no da sesión', async () => {
  const form = new FormData(); form.set('credential', 'a.b.c');
  const request = new Request('https://www.xpaceos.com/auth/callback', {method:'POST', body:form});
  const r = await perimetro({request, env, next:async () => new Response('x')}, noFetch);
  assert.equal(r.status, 401);
  assert.doesNotMatch(r.headers.get('set-cookie') || '', /__Host-perimetro_session=[^;]/);
});

test('return_to no puede salir del sitio', () => {
  assert.equal(safeReturnTo('//evil.com'), '/');
  assert.equal(safeReturnTo('https://evil.com'), '/');
  assert.equal(safeReturnTo('/%2F%2Fevil.com'), '/');
  assert.equal(safeReturnTo('/auth/callback'), '/');
  assert.equal(safeReturnTo('/xpacios/?a=1'), '/xpacios/?a=1');
});
