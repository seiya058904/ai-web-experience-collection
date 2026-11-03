import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('the native Collection Index reaches all 39 stable gallery anchors without script', async () => {
  const html = await readFile(new URL('../pages/index.html', import.meta.url), 'utf8');
  const index = html.match(/<details class="collection-index"[\s\S]*?<\/details>/)?.[0];
  assert.ok(index?.includes('<summary>Index '));
  assert.ok(index.includes('<nav aria-label="Work index">'));
  const destinations = [...index.matchAll(/href="#(world-[a-z0-9-]+)"/g)].map(match => match[1]);
  const gallery = [...html.matchAll(/<a id="(world-[a-z0-9-]+)" class="world /g)].map(match => match[1]);
  assert.equal(destinations.length, 39);
  assert.equal(new Set(destinations).size, 39);
  assert.deepEqual(destinations, gallery);
  assert.match(index, /href="#world-ferrum"[\s\S]*?钢铁/);
  assert.match(index, /href="#world-nib"[\s\S]*?墨水/);
  assert.match(index, /href="#world-grid"[\s\S]*?字体/);
  assert.match(index, /href="#world-relay"[\s\S]*?语句与路径/);
  assert.match(index, /href="#world-supercell"[\s\S]*?空气与风暴/);
  assert.match(index, /href="#world-pelagic"[\s\S]*?深海与生物光/);
  assert.match(index, /href="#world-backstage"[\s\S]*?剧场与幻觉/);
  assert.match(index, /href="#world-varen"[\s\S]*?剪裁与风格/);
  assert.match(index, /href="#world-murmuration"[\s\S]*?群飞与邻域/);

  assert.match(index, /href="#world-aurora"[\s\S]*?太阳风与极光/);

  // The spectrum mirrors the gallery in order, as a pointer shortcut outside the tab sequence.
  const spectrum = html.match(/<div class="spectrum" aria-hidden="true">[\s\S]*?<\/div>/)?.[0];
  assert.ok(spectrum, 'The spectrum must stay hidden from assistive technology');
  const strips = [...spectrum.matchAll(/<a class="slit"[^>]*href="%BASE_URL%([a-z0-9-]+)\/" tabindex="-1">/g)].map(match => `world-${match[1]}`);
  assert.deepEqual(strips, gallery, 'Every work needs one strip, in gallery order, with tabindex -1');
  assert.equal((spectrum.match(/ alt=""/g) ?? []).length, gallery.length, 'Strip images are decorative');
  assert.equal((spectrum.match(/ loading="lazy"/g) ?? []).length, gallery.length, 'Hidden strips must not download');
});
