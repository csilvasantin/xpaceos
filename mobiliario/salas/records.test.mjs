import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ALSEA, FIELDS, XTANCO, health } from './records.mjs';

const registry = JSON.parse(fs.readFileSync(new URL('../../inventario/registry.json', import.meta.url)));
const numbers = new Set(Object.values(registry.numbers));

test('cada ficha tiene los doce atributos y un número del registro', () => {
  for (const item of [...ALSEA, ...XTANCO]) {
    for (const field of FIELDS) assert.ok(field in item, item.identificador + ' ' + field);
    assert.ok(numbers.has(item.numero), String(item.numero));
    assert.equal(health(item), 'verde');
    if (item.tipo === 'pantalla') assert.ok(item.pantalla.circuito);
    else assert.equal(item.pantalla, null);
  }
});

test('Alsea reutiliza la base Xtanco y no inventa el 44', () => {
  assert.equal(ALSEA[0].numero, 1);
  assert.equal(XTANCO[0].numero, 1);
  assert.equal(ALSEA.find((item) => item.tipo === 'planta').numero, 9);
  assert.equal(XTANCO.find((item) => item.tipo === 'planta').numero, 9);
  assert.equal(ALSEA.filter((item) => item.numero === 13).length, 3);
  assert.ok([...ALSEA, ...XTANCO].every((item) => item.numero < 44));
  assert.equal(Object.values(registry.numbers).includes(44), false);
});
