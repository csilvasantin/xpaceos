import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [entry, sitemap] = await Promise.all([
  readFile(new URL('../../Nvidia/index.html', import.meta.url), 'utf8'),
  readFile(new URL('../../sitemap.xml', import.meta.url), 'utf8'),
]);

assert.match(entry, /<html lang="en">/);
assert.match(entry, /canonical" href="https:\/\/www\.xpaceos\.com\/Nvidia\/"/);
assert.match(entry, /https:\/\/carlossilva\.info\/01\.-AdmiraXperience-Game\/game\.html\?lang=en&amp;langlock=1&amp;v=20260902-1211/);
assert.doesNotMatch(entry, /play=shoptalk|nvidia=1/);
assert.match(sitemap, /https:\/\/www\.xpaceos\.com\/Nvidia\//);

console.log('NVIDIA canonical English entry contracts: OK');
