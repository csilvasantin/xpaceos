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
  assert.ok(isPublicPath('/avatar-ask'));
  assert.ok(!isPublicPath('/avatar-ask-falso'));
  assert.ok(!isPublicPath('/'));
  assert.ok(!isPublicPath('/admira-xpfalso/'));
});

test('la pregunta del avatar no exige sesión y no abre la portada', async () => {
  assert.equal((await perimetro(ctx('https://www.xpaceos.com/avatar-ask', {Accept:'application/json'}), noFetch)).status, 200);
  assert.equal((await perimetro(ctx('https://abc.xpaceos.pages.dev/avatar-ask', {Accept:'*/*'}), noFetch)).status, 200);
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

test('/auth/permisos sin sesión manda al login', async () => {
  const r = await perimetro(ctx('https://www.xpaceos.com/auth/permisos'), noFetch);
  assert.equal(r.status, 302);
  assert.match(r.headers.get('location'), /\/auth\/login/);
});

async function sesion(email, aud = 'xpaceos') {
  const b64 = (s) => Buffer.from(s).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = b64(JSON.stringify({v:1, aud, email, sub:'1', iat:now, exp:now + 3600}));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.PERIMETRO_SIGNING_KEY), {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  const sig = Buffer.from(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('perimetro:' + payload))).toString('base64url');
  return `__Host-perimetro_session=${payload}.${sig}`;
}
const lista = (grants) => async (url, opts = {}) => {
  const u = new URL(url);
  if (u.pathname === '/access') {
    const email = u.searchParams.get('email');
    const owner = email === 'csilva@admira.com';
    return Response.json({ok:true, allowed:owner || grants.includes(email), superuser:owner});
  }
  if (u.pathname === '/sites') return Response.json({ok:true, owners:['csilva@admira.com'], users:['ana@admira.com', 'luis@admira.com'], sites:{xpaceos:grants}});
  if (u.pathname === '/site-grant') { const b = JSON.parse(opts.body); grants.push(b.email); return Response.json({ok:true}); }
  throw new Error('inesperado ' + url);
};

test('con sesión y permiso, la portada sale; con sesión de otra web, no', async () => {
  const f = lista(['ana@admira.com']);
  const ok = await perimetro(ctx('https://www.xpaceos.com/', {Cookie:await sesion('ana@admira.com')}), f);
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get('cache-control'), 'private, no-store');
  const otra = await perimetro(ctx('https://www.xpaceos.com/', {Cookie:await sesion('ana@admira.com', 'admira-store')}), f);
  assert.equal(otra.status, 302);
});

test('sesión válida pero sin casilla → login', async () => {
  const r = await perimetro(ctx('https://www.xpaceos.com/', {Cookie:await sesion('luis@admira.com')}), lista([]));
  assert.equal(r.status, 302);
});

test('/auth/permisos: superuser ve las casillas y puede dar acceso; usuario normal, 403', async () => {
  const grants = [];
  const f = lista(grants);
  const page = await perimetro(ctx('https://www.xpaceos.com/auth/permisos', {Cookie:await sesion('csilva@admira.com')}), f);
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /luis@admira\.com/);
  assert.match(html, /owner · siempre/);
  const form = new FormData(); form.set('email', 'luis@admira.com'); form.set('allow', '1');
  const post = await perimetro({request:new Request('https://www.xpaceos.com/auth/permisos', {method:'POST', body:form, headers:{Cookie:await sesion('csilva@admira.com'), Origin:'https://www.xpaceos.com'}}), env, next:async () => new Response('x')}, f);
  assert.equal(post.status, 200);
  assert.deepEqual(grants, ['luis@admira.com']);
  const csrf = await perimetro({request:new Request('https://www.xpaceos.com/auth/permisos', {method:'POST', body:form, headers:{Cookie:await sesion('csilva@admira.com'), Origin:'https://evil.example'}}), env, next:async () => new Response('x')}, f);
  assert.equal(csrf.status, 403);
  grants.push('ana@admira.com');
  const normal = await perimetro(ctx('https://www.xpaceos.com/auth/permisos', {Cookie:await sesion('ana@admira.com')}), f);
  assert.equal(normal.status, 403);
});
