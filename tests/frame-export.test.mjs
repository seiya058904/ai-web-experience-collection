import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { createFilmPayload, createFilmHTML, exportFilm, exportFilename } from '../experiences/frame/src/export.ts';

// Valid tiny PNG fixture; real baked frames and PNG decoding are browser-QA work.
const pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXxkAAAAASUVORK5CYII=';
const assets = () => ({ landscape: Array(24).fill(pixel), portrait: Array(24).fill(pixel) });
const extractPayload = html => JSON.parse(html.match(/<script id="frame-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);

test('the standalone file embeds both24-frame cameras and the actual configured beat table', () => {
  const config = { preset: 'ease-out', hold6: 4, hold18: 9 };
  const html = createFilmHTML(config, assets());
  const payload = extractPayload(html);
  assert.deepEqual(payload.config, config);
  assert.equal(payload.frames.landscape.length, 24);
  assert.equal(payload.frames.portrait.length, 24);
  assert.equal(payload.beats.length, 49);
  assert.equal(payload.duration, 49 / 12);
  assert.equal(payload.beats.filter(frame => frame === 6).length, 5);
  assert.equal(payload.beats.filter(frame => frame === 18).length, 10);
  assert.equal(payload.descriptions.length, 24);
  assert.match(html, /<html lang="en">/);
  assert.match(html, /Preparation, frame 06: <strong>\+4 held beats/);
  assert.match(html, /Looking back, frame 18: <strong>\+9 held beats/);
  assert.equal((html.match(/class="thumbnail" data-frame=/g) || []).length, 24);
});

test('a replay file has no external resource or runtime dependency', () => {
  const html = createFilmHTML({}, assets());
  assert.doesNotMatch(html, /https?:\/\/|blob:|<script\s+src=|<link\b|fetch\s*\(|XMLHttpRequest|WebSocket|import\s*\(/i);
  assert.match(html, /default-src 'none'; img-src data:/);
  assert.match(html, /<source id="portrait" media="\(max-width:600px\)" srcset="data:image\//);
  assert.match(html, /visibilitychange/);
  assert.match(html, /IntersectionObserver/);
  assert.match(html, /prefers-reduced-motion/);
  assert.match(html, /<button id="play"[^>]*>Play film<\/button>/);
  assert.match(html, /<button id="previous"/);
  assert.match(html, /<button id="next"/);
  assert.match(html, /type="range"/);
});

test('the generated inline playback code parses as browser JavaScript', () => {
  const html = createFilmHTML({}, assets());
  const runtime = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  assert.doesNotThrow(() => new vm.Script(runtime));
});

test('missing frames, links and markup disguised as an image are rejected', () => {
  assert.throws(() => createFilmHTML({}, { landscape: Array(23).fill(pixel), portrait: Array(24).fill(pixel) }), /all 24 frames/);
  for (const bad of ['https://example.com/frame.webp', 'blob:temporary', '', 'data:image/svg+xml,<svg/>', 'data:image/png;base64,AA==" onerror="alert(1)']) {
    const frames = assets(); frames.landscape[7] = bad;
    assert.throws(() => createFilmHTML({}, frames), /not an embedded image/);
  }
});

test('payload snapshots cannot be mutated through original config or frame arrays', () => {
  const frames = assets();
  const config = { preset: 'ease-in', hold6: 2, hold18: 3 };
  const payload = createFilmPayload(config, frames);
  config.hold18 = 12;
  frames.landscape[0] = 'broken';
  assert.equal(payload.config.hold18, 3);
  assert.equal(payload.frames.landscape[0], pixel);
  assert.ok(Object.isFrozen(payload));
  assert.ok(Object.isFrozen(payload.frames.landscape));
});

test('async HTML export freezes the click-time take before resource loading', async () => {
  const config = { preset: 'ease-out', hold6: 7, hold18: 11 };
  const requests = [];
  const promise = exportFilm(config, {
    load: async () => { throw new Error('Original-byte provider should avoid a canvas re-encode.'); },
    dataURL: async (frame, preset, camera) => {
      requests.push({ frame, preset, camera });
      await Promise.resolve();
      return pixel;
    },
  });
  config.preset = 'even'; config.hold6 = 0; config.hold18 = 0;
  const blob = await promise;
  const payload = extractPayload(await blob.text());
  assert.equal(blob.type, 'text/html;charset=utf-8');
  assert.deepEqual(payload.config, { preset: 'ease-out', hold6: 7, hold18: 11 });
  assert.equal(payload.duration, 4.5);
  assert.equal(requests.length, 48);
  assert.ok(requests.every(request => request.preset === 'ease-out'));
  for (const camera of ['landscape', 'portrait']) {
    assert.deepEqual(requests.filter(request => request.camera === camera).map(request => request.frame), Array.from({ length: 24 }, (_, i) => i + 1));
  }
});

test('a failed frame rejects the download instead of creating a partial success file', async () => {
  await assert.rejects(exportFilm({}, {
    load: async () => { throw new Error('Unused'); },
    dataURL: async (frame, preset, camera) => {
      if (frame === 9 && camera === 'portrait') throw new Error('Missing portrait frame 9');
      return pixel;
    },
  }), /Missing portrait frame 9/);
});

test('download names describe the current validated take', () => {
  assert.equal(exportFilename({ preset: 'ease-in', hold6: 2, hold18: 12 }, 'html'), 'frame-ease-in-02-12.html');
  assert.equal(exportFilename(null, 'png'), 'frame-even-00-00.png');
});

/** Execute the actual exported player with controllable image/visibility timing. */
function replayHarness({ autoDecode = true, reducedMotion = false } = {}) {
  const html = createFilmHTML({}, assets());
  const payload = html.match(/<script id="frame-data" type="application\/json">([\s\S]*?)<\/script>/)[1];
  const runtime = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const elements = new Map();
  const prepared = [];
  const animations = new Map();
  const scrolls = [];
  let observer;
  let nextAnimation = 0;
  const element = id => {
    if (!elements.has(id)) {
      elements.set(id, {
        textContent: id === 'frame-data' ? payload : id === 'play' ? 'Play film' : '',
        value: '0', dataset: {}, listeners: new Map(), attributes: new Map(),
        addEventListener(name, handler) { this.listeners.set(name, handler); },
        setAttribute(name, value) { this.attributes.set(name, value); },
        removeAttribute(name) { this.attributes.delete(name); },
        querySelectorAll() { return []; },
        scrollIntoView(options) { scrolls.push(options); },
      });
    }
    return elements.get(id);
  };
  class DecodableImage {
    complete = false;
    naturalWidth = 0;
    constructor() { prepared.push(this); }
    set src(value) {
      this.source = value;
      if (autoDecode) queueMicrotask(() => this.decode());
    }
    decode() {
      this.complete = true;
      this.naturalWidth = 1;
      this.onload?.();
    }
  }
  vm.runInNewContext(runtime, {
    document: { hidden: false, getElementById: element, addEventListener() {} },
    window: {
      IntersectionObserver: true,
      addEventListener() {},
      matchMedia: () => ({ matches: reducedMotion, addEventListener() {} }),
    },
    IntersectionObserver: class {
      constructor(callback) { observer = callback; }
      observe() {}
    },
    Image: DecodableImage,
    performance: { now: () => 0 },
    requestAnimationFrame(callback) {
      const id = ++nextAnimation;
      animations.set(id, callback);
      return id;
    },
    cancelAnimationFrame(id) { animations.delete(id); },
  });
  return {
    element, prepared, animations, scrolls,
    setVisible(value) { observer([{ isIntersecting: value }]); },
    clickPlay() { return element('play').listeners.get('click')(); },
    decodeFrames() { prepared.forEach(image => image.decode()); },
  };
}

test('an already offscreen film returns to view without starting invisible playback', async () => {
  const player = replayHarness({ reducedMotion: true });
  player.setVisible(false);
  await player.clickPlay();
  assert.equal(player.prepared.length, 0, 'offscreen click must not start asynchronous playback preparation');
  assert.equal(player.animations.size, 0);
  assert.equal(player.element('play').textContent, 'Play film');
  assert.match(player.element('status').textContent, /Bringing the film into view/);
  assert.equal(player.scrolls.length, 1);
  assert.equal(player.scrolls[0].behavior, 'auto', 'reduced motion must not force smooth scrolling');
  assert.equal(player.scrolls[0].block, 'nearest');

  player.setVisible(true);
  await player.clickPlay();
  assert.equal(player.prepared.length, 48);
  assert.equal(player.element('play').textContent, 'Pause');
  assert.equal(player.animations.size, 1, 'a new explicit play action can start after visibility returns');
});

test('leaving during asynchronous frame preparation cancels playback even if visibility returns', async () => {
  const player = replayHarness({ autoDecode: false });
  const pendingPlay = player.clickPlay();
  assert.equal(player.prepared.length, 48);
  assert.equal(player.element('play').textContent, 'Cancel');
  assert.equal(player.element('play').attributes.get('aria-busy'), 'true');

  player.setVisible(false);
  assert.equal(player.element('play').textContent, 'Play film');
  assert.match(player.element('status').textContent, /Paused while the film is out of view/);
  player.setVisible(true);
  player.decodeFrames();
  await pendingPlay;
  assert.equal(player.animations.size, 0, 'late decoding must not restart a cancelled request');
  assert.equal(player.element('play').textContent, 'Play film');
  assert.equal(player.element('play').attributes.has('aria-busy'), false);

  await player.clickPlay();
  assert.equal(player.prepared.length, 48, 'successfully prepared frames remain reusable');
  assert.equal(player.element('play').textContent, 'Pause');
  assert.equal(player.animations.size, 1);
});
