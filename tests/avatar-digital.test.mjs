import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {onRequest, sheetAnswer} from '../functions/avatar-ask.js';

const require = createRequire(import.meta.url);
const shell = require('../assets/xpace-shell.js');
const avatar = require('../assets/avatar-digital.js');

test('el shell reconoce solo el interruptor, no el resto de /cli', () => {
  assert.equal(shell.isAvatarCommand('/avatarDigital'), true);
  assert.equal(shell.isAvatarCommand('/digitalAvatar off'), true);
  assert.equal(shell.isAvatarCommand('avatarDigital on'), true);
  assert.equal(shell.isAvatarCommand('/cli ayudante'), true);
  assert.equal(shell.isAvatarCommand('/cli helper mostrar'), true);
  assert.equal(shell.isAvatarCommand('/CLI@bot ayudante'), true);
  assert.equal(shell.isAvatarCommand('/cli distribuir'), false);
  assert.equal(shell.isAvatarCommand('/cli'), false);
  assert.equal(shell.isAvatarCommand('/status'), false);
  assert.equal(shell.isAvatarCommand(''), false);
});

test('on/off/alternar y la línea en el idioma de la página', () => {
  assert.equal(avatar.decide('/avatarDigital'), 'toggle');
  assert.equal(avatar.decide('/avatarDigital encender'), 'on');
  assert.equal(avatar.decide('/cli ayudante apagar'), 'off');
  assert.equal(avatar.decide('/digitalAvatar mostrar'), 'on');
  assert.equal(avatar.decide('/digitalAvatar ocultar'), 'off');
  assert.equal(avatar.decide('/avatarDigital quizas'), 'bad');
  assert.equal(avatar.decide('/marca on'), null);
  assert.equal(avatar.line('on', 'es'), 'Avatar digital activado');
  assert.equal(avatar.line('on', 'en'), 'Digital avatar on');
  assert.equal(avatar.line('off', 'en'), 'Digital avatar off');
  assert.equal(avatar.line('off', 'es'), 'Avatar digital desactivado');
});

test('sin cerebro se contesta con la ficha y no se inventa otra cosa', () => {
  assert.match(sheetAnswer('¿Qué es XpaceOS?', 'es'), /xpaceos\.com/);
  assert.match(sheetAnswer('What is Pixeria?', 'en'), /pixeria\.com/);
  assert.match(sheetAnswer('¿cuánto cuesta el plano premium?', 'es'), /no consta en la ficha/i);
});

test('el proxy devuelve solo texto: el audio del cerebro no sale', async () => {
  const fetchImpl = async () => ({
    ok: true,
    json: async () => ({ok: true, answer: 'XpaceOS es la tienda.', audioBase64: 'A'.repeat(80), mime: 'audio/mpeg'}),
  });
  const request = new Request('https://www.xpaceos.com/avatar-ask', {
    method: 'POST', headers: {'content-type': 'application/json'},
    body: JSON.stringify({question: '¿Qué es XpaceOS?', lang: 'es'}),
  });
  const response = await onRequest({request}, fetchImpl);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.text, 'XpaceOS es la tienda.');
  assert.equal(JSON.stringify(body).includes('audioBase64'), false);
});

test('si el cerebro dice que no consta y la ficha sí lo tiene, manda la ficha', async () => {
  const fetchImpl = async () => ({ok: true, json: async () => ({answer: 'No consta en la ficha.', audioBase64: 'qq'})});
  const request = new Request('https://www.xpaceos.com/avatar-ask', {
    method: 'POST', headers: {'content-type': 'application/json'},
    body: JSON.stringify({question: '¿Qué es XpaceOS?', lang: 'es'}),
  });
  const body = await (await onRequest({request}, fetchImpl)).json();
  assert.match(body.text, /xpaceos\.com/);
  assert.equal(JSON.stringify(body).includes('audioBase64'), false);
});

test('si el cerebro falla, queda la ficha', async () => {
  const request = new Request('https://preview.xpaceos.pages.dev/avatar-ask', {
    method: 'POST', headers: {'content-type': 'application/json'},
    body: JSON.stringify({question: 'yokup', lang: 'en'}),
  });
  const response = await onRequest({request}, async () => { throw new Error('red'); });
  const body = await response.json();
  assert.match(body.text, /yokup\.com/i);
  assert.equal('audioBase64' in body, false);
});
