import test from 'node:test';
import assert from 'node:assert/strict';
import {perimetro} from '../functions/_perimetro.js';

const env = {PERIMETRO_SIGNING_KEY:'k'.repeat(64)};
const sid = 'ab'.repeat(32);
const exp = Math.floor(Date.now() / 1000) + 3600;
const ticket = 'a'.repeat(40) + '.' + 'b'.repeat(40);

function mock(url) {
  const target = String(url);
  if (target.includes('/api/lectura/canjear?site=xpaceos')) {
    return Promise.resolve({ok:true, status:200, json:async () => ({ok:true, sid, exp, site:'xpaceos', role:'viewer'})});
  }
  if (target.includes('/api/lectura/sesion')) {
    return Promise.resolve({ok:true, status:200, json:async () => ({ok:true, site:'xpaceos', role:'viewer'})});
  }
  if (target.includes('/api/lectura/reconocer')) {
    return Promise.resolve({ok:true, status:200, json:async () => ({lectura:true})});
  }
  return Promise.reject(new Error('red inesperada'));
}

test('el enlace deja una cookie y abre el gemelo; una escritura da 403', async () => {
  const opened = await perimetro({
    request:new Request('https://www.xpaceos.com/auth/lectura?t=' + ticket),
    env, next:async () => new Response('no')
  }, mock);
  assert.equal(opened.status, 302);
  assert.equal(opened.headers.get('location'), '/admira-xp/?autostart=cafeteria&visual=better&marca=365&loc=365-demo-bcn-tetuan&store=365-demo-bcn-tetuan');
  assert.equal(opened.headers.get('referrer-policy'), 'no-referrer');
  const cookie = opened.headers.get('set-cookie');
  assert.match(cookie, /__Host-perimetro_session=/);
  assert.match(cookie, /HttpOnly/);
  const page = await perimetro({
    request:new Request('https://www.xpaceos.com/admira-xp/?store=365-demo-bcn-tetuan', {headers:{Cookie:cookie, 'Sec-Fetch-Dest':'document', Accept:'text/html'}}),
    env, next:async () => new Response('<html>gemelo</html>', {headers:{'content-type':'text/html'}})
  }, mock);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /gemelo/);
  const write = await perimetro({
    request:new Request('https://www.xpaceos.com/admira-xp/advertising-image', {method:'POST', headers:{Cookie:cookie, 'Content-Type':'application/json'}, body:'{}'}),
    env, next:async () => { throw new Error('la escritura no debe llegar al generador'); }
  }, mock);
  assert.equal(write.status, 403);
  const byKey = await perimetro({
    request:new Request('https://www.admira.store/admira-xp/advertising-image', {method:'POST', headers:{'X-Admira-Machine-Key':'mbl_' + 'z'.repeat(40), 'Content-Type':'application/json'}, body:'{}'}),
    env, next:async () => { throw new Error('la clave no puede escribir'); }
  }, mock);
  assert.equal(byKey.status, 403);
});

test('abrir el gemelo en el navegador sin esa cookie sigue pidiendo Google', async () => {
  const r = await perimetro({
    request:new Request('https://www.xpaceos.com/admira-xp/', {headers:{'Sec-Fetch-Dest':'document', Accept:'text/html'}}),
    env, next:async () => new Response('no')
  }, async () => { throw new Error('sin red'); });
  assert.equal(r.status, 302);
  assert.match(r.headers.get('location'), /\/auth\/login/);
});
