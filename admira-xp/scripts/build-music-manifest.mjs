#!/usr/bin/env node
// Genera admira-xp/music/manifest.json escaneando music/*.mp3.
// Hilo musical "soltar y listo": copia un .mp3 a music/ y al hacer push la
// GitHub Action regenera el manifest; la página lo lee. Opcional: pon un nombre
// bonito en music/titles.json ({ "archivo.mp3": "Nombre - Artista" }); si no,
// se deriva del nombre del fichero.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MUSIC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'music');

function prettify(file) {
  return file
    .replace(/\.mp3$/i, '')
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

let titles = {};
try {
  titles = JSON.parse(readFileSync(join(MUSIC_DIR, 'titles.json'), 'utf8'));
} catch { /* sin nombres curados: se derivan del fichero */ }

const files = readdirSync(MUSIC_DIR)
  .filter((f) => /\.mp3$/i.test(f));

// Orden: primero los curados (en el orden de titles.json) que existan como
// fichero, luego el resto alfabéticamente.
const curatedOrder = Object.keys(titles).filter((f) => files.includes(f));
const extras = files.filter((f) => !curatedOrder.includes(f)).sort();
const ordered = [...curatedOrder, ...extras];

const manifest = ordered.map((file) => ({
  file: `music/${file}`,
  name: titles[file] || prettify(file),
}));

const out = join(MUSIC_DIR, 'manifest.json');
writeFileSync(out, JSON.stringify(manifest, null, 2) + '\n');
console.log(`manifest.json: ${manifest.length} pistas`);
for (const m of manifest) console.log(`  · ${m.name}  (${m.file})`);
