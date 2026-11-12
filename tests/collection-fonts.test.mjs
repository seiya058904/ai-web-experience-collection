import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const manifest = JSON.parse(await read('provenance/collection/font-subsets.json'));
const html = (await read('pages/index.html')).toString();
const css = (await read('collection/styles.css')).toString();

test('Collection derivatives preserve original font and license identities and reduce bytes', async () => {
  for (const font of manifest.fonts) {
    const [source, output, license] = await Promise.all([
      read(`public/${font.source}`), read(`public/${font.output}`), read(`public/${font.license}`),
    ]);
    assert.equal(hash(source), font.sourceSha256, `Original changed: ${font.source}`);
    assert.equal(hash(output), font.sha256, `Regenerate derivative: ${font.output}`);
    assert.equal(hash(license), font.licenseSha256);
    assert.equal(source.length, font.sourceBytes);
    assert.equal(output.length, font.bytes);
    assert.ok(output.length < source.length);
    assert.ok((html + css).includes(font.output), `Unused derivative: ${font.output}`);
  }
});

test('Collection font subsets cover current gallery copy, including CSS case transforms', () => {
  const entities = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ',
    mdash: '—', ndash: '–', hellip: '…', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”' };
  for (const font of manifest.fonts) {
    const covered = new Set(font.characters + font.originalFallbackCharacters);
    for (const world of font.worlds) {
      const panel = html.match(new RegExp(`<a id="world-${world}"[\\s\\S]*?</a>`))?.[0];
      assert.ok(panel, `Missing gallery entrance: ${world}`);
      const text = panel.replace(/<[^>]*>/g, ' ').replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (_, entity) => {
        if (entity.startsWith('#')) return String.fromCodePoint(parseInt(entity.slice(entity[1] === 'x' ? 2 : 1), entity[1] === 'x' ? 16 : 10));
        assert.ok(entity in entities, `Add a decoder for &${entity};`);
        return entities[entity];
      }).replace(/\s+/g, ' ').trim();
      for (const character of text + text.toUpperCase() + text.toLowerCase()) {
        assert.ok(covered.has(character), `${font.cssFamily}: missing ${JSON.stringify(character)} in ${world}; regenerate Collection subsets`);
      }
    }
  }
});
