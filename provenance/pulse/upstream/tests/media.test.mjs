import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import { mediaRetryUrl, retrySrcset, sameMediaUrl } from '../src/media.ts';

const base = 'https://pulse.example/atlas/index.html';
const embedded = 'data:image/webp;base64,UklGRgAAAABXRUJQ';
const svgData = 'data:image/svg+xml,%3Csvg%20viewBox=%220,0,8,8%22%3E%3C/svg%3E';

test('network retry preserves unrelated query bytes and the fragment while replacing its own token', () => {
  assert.equal(
    mediaRetryUrl('./art/hero.webp?variant=wide%20view&value=a%2Bb&retry=8&flag#crop', 9, base),
    'https://pulse.example/atlas/art/hero.webp?variant=wide%20view&value=a%2Bb&flag&retry=9#crop',
  );
  assert.equal(mediaRetryUrl('http://pulse.example/a.webp?retry=1&retry=2', 3, base), 'http://pulse.example/a.webp?retry=3');
});

test('embedded, blob, and local file URLs remain byte-for-byte unchanged', async () => {
  for (const candidate of [embedded, svgData, 'blob:https://pulse.example/asset-id', 'file:///atlas/art/hero.webp']) {
    assert.equal(mediaRetryUrl(candidate, 12, base), candidate);
  }
  assert.equal(mediaRetryUrl('./art/hero.webp', 2, 'file:///atlas/index.html'), './art/hero.webp');
  const response = await fetch(mediaRetryUrl(embedded, 2, base));
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), Buffer.from(embedded.split(';base64,')[1], 'base64'));
});

test('URL matching resolves relative candidates without confusing different variants', () => {
  assert.equal(sameMediaUrl('./art/hero.webp?v=1', 'https://pulse.example/atlas/art/hero.webp?v=1', base), true);
  assert.equal(sameMediaUrl('./art/hero.webp?v=1', 'https://pulse.example/atlas/art/hero.webp?v=2', base), false);
  assert.equal(mediaRetryUrl('http://[invalid', 1, base), 'http://[invalid');
});

test('srcset retry preserves width descriptors, other candidates, and original spacing', () => {
  const input = './art/hero-960.webp 960w,\n  ./art/hero.webp?crop=wide 1536w';
  assert.deepEqual(retrySrcset(input, 'https://pulse.example/atlas/art/hero.webp?crop=wide', 4, base), {
    value: './art/hero-960.webp 960w,\n  https://pulse.example/atlas/art/hero.webp?crop=wide&retry=4 1536w',
    matches: 1,
  });
  assert.deepEqual(retrySrcset(input, 'https://pulse.example/atlas/art/missing.webp', 4, base), { value: input, matches: 0 });
});

test('srcset parsing preserves commas inside embedded URLs and can still replace a later network candidate', () => {
  const input = `${svgData} 960w, ${embedded} 1536w, ./art/large.webp 2x`;
  for (const selected of [svgData, embedded]) {
    assert.deepEqual(retrySrcset(input, selected, 5, base), { value: input, matches: 1 });
  }
  assert.deepEqual(retrySrcset(input, 'https://pulse.example/atlas/art/large.webp', 5, base), {
    value: `${svgData} 960w, ${embedded} 1536w, https://pulse.example/atlas/art/large.webp?retry=5 2x`,
    matches: 1,
  });
  assert.deepEqual(retrySrcset('./art/first.webp, ./art/second.webp 2x', 'https://pulse.example/atlas/art/first.webp', 2, base), {
    value: 'https://pulse.example/atlas/art/first.webp?retry=2, ./art/second.webp 2x',
    matches: 1,
  });
});

// Exercise the production Retry block with small event-driven elements. This
// checks DOM mutations and load/error ownership without claiming browser QA.
const main = await readFile(new URL('../src/main.ts', import.meta.url), 'utf8');
const start = main.indexOf("document.querySelectorAll<HTMLImageElement>('picture img')");
const end = main.indexOf('\nlet audioContext:', start);
assert.ok(start >= 0 && end > start, 'The production image recovery block must be available to the fixture.');
const recoveryCode = stripTypeScriptTypes(main.slice(start, end), { mode: 'strip' });

class ElementFixture {
  constructor(tag, attributes = {}) {
    this.tag = tag;
    this.attributes = { ...attributes };
    this.dataset = {};
    this.children = [];
    this.listeners = new Map();
    this.writes = [];
    this.disabled = false;
    const classes = new Set();
    this.classList = { add: value => classes.add(value), remove: value => classes.delete(value), contains: value => classes.has(value) };
  }
  append(...children) { for (const child of children) { child.parentElement = this; this.children.push(child); } }
  remove() { this.parentElement.children = this.parentElement.children.filter(child => child !== this); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  setAttribute(name, value) { this.attributes[name] = String(value); this.writes.push([name, String(value)]); }
  addEventListener(name, listener) { this.listeners.set(name, [...(this.listeners.get(name) || []), listener]); }
  emit(name) { for (const listener of this.listeners.get(name) || []) listener({ target: this }); }
  closest(tag) { return this.tag === tag ? this : this.parentElement?.closest(tag); }
  querySelectorAll(selector) {
    const descendants = this.children.flatMap(child => [child, ...child.querySelectorAll('*')]);
    if (selector === '*') return descendants;
    if (selector === '[srcset]') return descendants.filter(child => child.getAttribute('srcset') !== null);
    return descendants.filter(child => child.tag === selector);
  }
  querySelector(selector) {
    const errorFor = selector.match(/^\[data-error-for="([^"]+)"\]$/)?.[1];
    return errorFor ? this.querySelectorAll('*').find(child => child.dataset.errorFor === errorFor) ?? null : this.querySelectorAll(selector)[0] ?? null;
  }
}

function recoveryFixture({ selected = './art/hero-mobile.webp', baseUrl = base, portrait = './art/hero-mobile.webp', desktop = './art/hero-960.webp 960w, ./art/hero.webp 1536w', fallback = './art/hero.webp' } = {}) {
  const container = new ElementFixture('div');
  const picture = new ElementFixture('picture');
  const sources = [
    new ElementFixture('source', { media: '(max-width: 640px)', srcset: portrait, type: 'image/webp', sizes: '100vw' }),
    new ElementFixture('source', { srcset: desktop, sizes: '(max-width: 640px) 100vw, 100vw', type: 'image/webp' }),
  ];
  const img = new ElementFixture('img', { src: fallback, width: '1536', height: '1024', alt: 'An authored heart illustration.' });
  img.complete = true;
  img.naturalWidth = 0;
  img.currentSrc = new URL(selected, baseUrl).href;
  Object.defineProperty(img, 'src', { get: () => new URL(img.getAttribute('src'), baseUrl).href, set: value => img.setAttribute('src', value) });
  picture.append(...sources, img);
  container.append(picture);
  const probes = [];
  const context = {
    document: { baseURI: baseUrl, querySelectorAll: selector => selector === 'picture img' ? [img] : [], createElement: tag => new ElementFixture(tag) },
    Image: class { constructor() { probes.push(this); } },
    mediaRetryUrl, retrySrcset, sameMediaUrl, needsRender: false,
  };
  vm.runInNewContext(recoveryCode, context);
  const note = () => container.querySelector('[data-error-for="art-0"]');
  const retry = () => note().querySelector('button');
  return { picture, sources, img, probes, note, retry, context, click: () => { retry().emit('click'); return probes.at(-1); } };
}

test('portrait retry retains source nodes, desktop choices, all non-URL attributes, and actual load ownership', () => {
  const fixture = recoveryFixture();
  const { picture, sources, img } = fixture;
  const beforePortrait = { ...sources[0].attributes };
  const beforeDesktop = { ...sources[1].attributes };
  const beforeImage = { ...img.attributes };
  const probe = fixture.click();
  assert.equal(probe.src, 'https://pulse.example/atlas/art/hero-mobile.webp?retry=1');
  probe.onload();
  assert.equal(picture.querySelectorAll('source').length, 2);
  assert.equal(picture.children[0], sources[0]);
  assert.equal(picture.children[1], sources[1]);
  assert.deepEqual(sources[0].attributes, { ...beforePortrait, srcset: probe.src });
  assert.deepEqual(sources[1].attributes, beforeDesktop);
  assert.deepEqual(img.attributes, beforeImage);
  assert.equal(picture.dataset.assetState, 'loading');
  assert.equal(picture.classList.contains('asset-failed'), true);
  assert.ok(fixture.note(), 'A probe success must not remove the actual image failure UI.');
  img.complete = true;
  img.naturalWidth = 960;
  img.emit('load');
  assert.equal(picture.dataset.assetState, 'ready');
  assert.equal(picture.classList.contains('asset-failed'), false);
  assert.equal(fixture.note(), null);
  assert.equal(fixture.context.needsRender, true);
});

test('desktop retry refreshes only its selected width and fallback while keeping portrait selection available', () => {
  const fixture = recoveryFixture({ selected: './art/hero.webp' });
  const portrait = { ...fixture.sources[0].attributes };
  const probe = fixture.click();
  probe.onload();
  assert.deepEqual(fixture.sources[0].attributes, portrait);
  assert.equal(fixture.sources[1].getAttribute('srcset'), './art/hero-960.webp 960w, https://pulse.example/atlas/art/hero.webp?retry=1 1536w');
  assert.equal(fixture.img.getAttribute('src'), probe.src);
  assert.equal(fixture.picture.querySelectorAll('source').length, 2);
});

test('offline retry reassigns unchanged embedded candidates without destroying data or responsive descriptors', () => {
  const fixture = recoveryFixture({ selected: embedded, portrait: svgData, desktop: `${svgData} 960w, ${embedded} 1536w`, fallback: embedded, baseUrl: 'file:///atlas/pulse.html' });
  const before = fixture.sources.map(source => ({ ...source.attributes }));
  const probe = fixture.click();
  assert.equal(probe.src, embedded);
  probe.onload();
  assert.deepEqual(fixture.sources.map(source => source.attributes), before);
  assert.equal(fixture.img.getAttribute('src'), embedded);
  assert.deepEqual(fixture.sources[1].writes, [['srcset', before[1].srcset]]);
  assert.deepEqual(fixture.img.writes, [['src', embedded]]);
  assert.equal(fixture.picture.dataset.assetState, 'loading');
});

test('probe failure, late completion, and actual decode failure retain a usable Retry control', () => {
  const fixture = recoveryFixture();
  const first = fixture.click();
  assert.equal(fixture.retry().disabled, true);
  first.onerror();
  assert.equal(fixture.picture.dataset.assetState, 'failed');
  assert.equal(fixture.retry().disabled, false);
  const second = fixture.click();
  assert.equal(fixture.picture.dataset.requestToken, '2');
  first.onload();
  assert.equal(fixture.sources[0].writes.length, 0, 'A stale probe must not commit its candidate.');
  first.onerror();
  assert.equal(fixture.picture.dataset.assetState, 'loading', 'A stale failure must not replace the current state.');
  second.onload();
  assert.match(fixture.sources[0].getAttribute('srcset'), /\?retry=2$/);
  fixture.img.emit('error');
  assert.equal(fixture.picture.dataset.assetState, 'failed');
  assert.equal(fixture.retry().disabled, false);
  assert.equal(fixture.picture.parentElement.children.filter(child => child.dataset.errorFor === 'art-0').length, 1);
});
