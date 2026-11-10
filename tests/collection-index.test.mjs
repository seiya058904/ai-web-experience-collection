import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('a resting pointer stays inside the strip it opens, at every position', async () => {
  const css = await readFile(new URL('../collection/styles.css', import.meta.url), 'utf8');
  const open = Number(css.match(/\.slit:hover\{flex-grow:([\d.]+)\}/)?.[1]);
  const near = Number(css.match(/\.slit:has\(\+\.slit:hover\)\{flex-grow:([\d.]+)\}/)?.[1]);
  assert.ok(open > near && near > 1, 'The stylesheet must state both growth values');
  // 50 strips on wide screens, every second one between 701 and 1000px, and room to add more works.
  for (const count of [20, 21, 40, 41, 50, 60]) {
    for (let i = 0; i < count; i += 1) {
      const grow = Array.from({ length: count }, (_, j) => (j === i ? open : Math.abs(j - i) === 1 ? near : 1));
      const unit = count / grow.reduce((sum, value) => sum + value, 0);
      const start = grow.slice(0, i).reduce((sum, value) => sum + value, 0) * unit;
      const end = start + open * unit;
      const pointer = i + 0.5;
      assert.ok(start <= pointer && pointer <= end, `Strip ${i} of ${count} would lose the pointer: ${start.toFixed(2)} to ${end.toFixed(2)}, pointer at ${pointer}`);
    }
  }
});

test('the native Collection Index reaches all 50 stable gallery anchors without script', async () => {
  const html = await readFile(new URL('../pages/index.html', import.meta.url), 'utf8');
  const index = html.match(/<details class="collection-index"[\s\S]*?<\/details>/)?.[0];
  assert.ok(index?.includes('<summary>Index '));
  assert.ok(index.includes('<nav aria-label="Work index">'));
  const destinations = [...index.matchAll(/href="#(world-[a-z0-9-]+)"/g)].map(match => match[1]);
  const gallery = [...html.matchAll(/<a id="(world-[a-z0-9-]+)" class="world /g)].map(match => match[1]);
  assert.equal(destinations.length, 50);
  assert.equal(new Set(destinations).size, 50);
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

  assert.match(index, /href="#world-crease"[\s\S]*?折纸与几何/);

  for (const [route, subject] of [['imago', '蜕变与生命'], ['sillage', '气味与印象'], ['aer', '热气球与浮力'], ['berth', '夜车与陪伴'], ['mend', '修补与珍惜'], ['frame', '定格与动画'], ['odds', '概率与随机'], ['rally', '网球与选择'], ['sente', '围棋与落子'], ['anax', '机械与蜻蜓']]) {
    assert.match(index, new RegExp(`href="#world-${route}"[\\s\\S]*?${subject}`));
  }

  // The spectrum mirrors the gallery in order, as a pointer shortcut outside the tab sequence.
  const spectrum = html.match(/<div class="spectrum" aria-hidden="true">[\s\S]*?<\/div>/)?.[0];
  assert.ok(spectrum, 'The spectrum must stay hidden from assistive technology');
  const strips = [...spectrum.matchAll(/<a class="slit"[^>]*href="%BASE_URL%([a-z0-9-]+)\/" tabindex="-1">/g)].map(match => `world-${match[1]}`);
  assert.deepEqual(strips, gallery, 'Every work needs one strip, in gallery order, with tabindex -1');
  assert.equal((spectrum.match(/ alt=""/g) ?? []).length, gallery.length, 'Strip images are decorative');
  assert.equal((spectrum.match(/ loading="lazy"/g) ?? []).length, gallery.length, 'Hidden strips must not download');
});
