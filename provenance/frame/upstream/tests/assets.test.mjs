import test from 'node:test';
import assert from 'node:assert/strict';
import { FrameAssets, assetPath, assetURL, resolveLocalAsset } from '../src/assets.ts';

function imageHarness({ failFirst = false, delay = 0 } = {}) {
  let created = 0, active = 0, maximum = 0;
  return {
    get created() { return created; },
    get maximum() { return maximum; },
    createImage() {
      const ordinal = ++created;
      const image = { naturalWidth: 1280, naturalHeight: 800, complete: false, onload: null, onerror: null, decode: async () => {} };
      Object.defineProperty(image, 'src', { set(value) {
        image.url = value;
        active += 1; maximum = Math.max(maximum, active);
        setTimeout(() => {
          active -= 1;
          if (failFirst && ordinal === 1) image.onerror?.();
          else { image.complete = true; image.onload?.(); }
        }, delay);
      } });
      return image;
    },
  };
}

test('baked URL mapping shares endpoints and non-push poses across presets', () => {
  assert.equal(assetURL(7, 'ease-in', 'landscape'), '/frames/landscape/even-07.webp');
  assert.equal(assetURL(8, 'ease-in', 'portrait'), '/frames/portrait/ease-in-08.webp');
  assert.equal(assetURL(11, 'ease-out', 'landscape'), '/frames/landscape/ease-out-11.webp');
  assert.equal(assetURL(12, 'ease-out', 'portrait'), '/frames/portrait/even-12.webp');
});

test('concurrent shared-frame requests deduplicate and failed loads remain retryable', async () => {
  const harness = imageHarness({ failFirst: true });
  const assets = new FrameAssets({ createImage: harness.createImage });
  const a = assets.load(7, 'even', 'landscape');
  const b = assets.load(7, 'ease-in', 'landscape');
  assert.strictEqual(a, b);
  await assert.rejects(a, /could not be loaded/);
  assert.equal(assets.stats.loading, 0);
  const result = await assets.load(7, 'ease-in', 'landscape');
  assert.equal(harness.created, 2);
  assert.strictEqual(assets.getCached(7, 'ease-out', 'landscape'), result);
});

test('preload never starts more than6 concurrent image loads and uses a boundedLRU', async () => {
  const harness = imageHarness({ delay: 2 });
  const assets = new FrameAssets({ createImage: harness.createImage, maxDecoded: 4 });
  await assets.preloadAll({ preset: 'ease-in', hold6: 0, hold18: 0 }, 'portrait');
  assert.equal(harness.created, 24);
  assert.ok(harness.maximum <= 6);
  assert.equal(assets.stats.decoded, 4);
  assert.equal(assets.stats.loading, 0);
  assert.equal(assets.getCached(1, 'even', 'portrait'), undefined);
  assert.ok(assets.getCached(24, 'even', 'portrait'));
});

test('clear prevents late requests from refilling caches and dispose prevents new work', async () => {
  const harness = imageHarness({ delay: 5 });
  const assets = new FrameAssets({ createImage: harness.createImage });
  const late = assets.load(8, 'ease-out', 'landscape');
  assets.clear();
  await late;
  assert.equal(assets.stats.decoded, 0);
  assets.dispose();
  await assert.rejects(assets.load(1), /closed/);
  await assert.rejects(assets.dataURL(1), /closed/);
});

test('original-byte export deduplicates requests, validates signatures and evicts failures', async () => {
  let calls = 0;
  const bytes = Uint8Array.from([82, 73, 70, 70, 4, 0, 0, 0, 87, 69, 66, 80, 1, 2, 3, 4]);
  const assets = new FrameAssets({ fetch: async () => {
    calls += 1;
    if (calls === 1) return new Response('<html>fallback</html>', { status: 200 });
    return new Response(bytes, { status: 200 });
  } });
  const failed = assets.dataURL(12, 'ease-in', 'landscape');
  assert.strictEqual(failed, assets.dataURL(12, 'even', 'landscape'));
  await assert.rejects(failed, /not a readable raster/);
  const result = await assets.dataURL(12, 'ease-out', 'landscape');
  assert.match(result, /^data:image\/webp;base64,/);
  assert.equal(calls, 2);
  assert.equal(await assets.dataURL(12, 'even', 'landscape'), result);
  assert.equal(calls, 2);
});

test('a custom packaged-source resolver is used consistently for decode, cache and original-byte export', async () => {
  const harness = imageHarness();
  const fetched = [];
  const bytes = Uint8Array.from([82, 73, 70, 70, 4, 0, 0, 0, 87, 69, 66, 80, 1, 2, 3, 4]);
  const assets = new FrameAssets({
    createImage: harness.createImage,
    resolveURL: (frame, preset, camera) => `/custom/${camera}/${preset}-${frame}.webp`,
    fetch: async url => { fetched.push(url); return new Response(bytes); },
  });
  const image = await assets.load(6, 'ease-in', 'portrait');
  assert.equal(image.url, '/custom/portrait/ease-in-6.webp');
  assert.strictEqual(assets.getCached(6, 'ease-in', 'portrait'), image);
  await assets.dataURL(6, 'ease-in', 'portrait');
  assert.deepEqual(fetched, ['/custom/portrait/ease-in-6.webp']);
});

test('optional embedded asset maps preserve raw paths and resolve exact or normalized local keys', async () => {
  const original=globalThis.document;
  const embedded='data:image/webp;base64,UklGRgQAAABXRUJQAQIDBA==';
  try{
    delete globalThis.document;
    const raw=assetPath(9,'ease-in','landscape');
    assert.equal(raw,'/frames/landscape/ease-in-09.webp');
    assert.equal(assetURL(9,'ease-in','landscape'),raw);
    const script={textContent:JSON.stringify({'frames/landscape/ease-in-09.webp':embedded})};
    globalThis.document={getElementById:id=>id==='frame-embedded-assets'?script:null};
    assert.equal(assetPath(9,'ease-in','landscape'),raw,'raw paths remain composable');
    assert.equal(assetURL(9,'ease-in','landscape'),embedded);
    assert.equal(await new FrameAssets().dataURL(9,'ease-in','landscape'),embedded,
      'the original-byte exporter reads a data URI through native fetch without a network request');
    assert.equal(resolveLocalAsset('./frames/landscape/ease-in-09.webp'),embedded);
    assert.equal(resolveLocalAsset('/frames/landscape/ease-in-09.webp?v=1'),embedded);
    assert.equal(resolveLocalAsset('stills/unmapped.webp'),'stills/unmapped.webp');
    assert.equal(resolveLocalAsset(embedded),embedded);
    assert.equal(resolveLocalAsset('https://example.test/frame.webp'),'https://example.test/frame.webp');
    globalThis.document={getElementById:()=>({textContent:'{malformed'})};
    assert.equal(assetURL(9,'ease-in','landscape'),raw);
    globalThis.document={getElementById:()=>({textContent:'null'})};
    assert.equal(assetURL(9,'ease-in','landscape'),raw);
    globalThis.document={body:{dataset:{}}};
    assert.equal(assetURL(9,'ease-in','landscape'),raw,'minimal Node DOM stubs remain safe');
  }finally{if(original===undefined)delete globalThis.document;else globalThis.document=original;}
});

test('browser embedded rasters use stable deduplicated Blob URLs after the JSON source is removed', async () => {
  const originalDocument=globalThis.document,originalWindow=globalThis.window;
  const embedded='data:image/webp;base64,UklGRgQAAABXRUJQAQIDBA==';
  let attached=true,removals=0,blobURL;
  const script={
    textContent:JSON.stringify({
      'frames/landscape/even-01.webp':embedded,
      'frames/landscape/even-02.webp':embedded,
    }),
    remove(){attached=false;removals+=1;},
  };
  try{
    globalThis.window={};
    globalThis.document={getElementById:id=>id==='frame-embedded-assets'&&attached?script:null};
    blobURL=assetURL(1,'even','landscape');
    assert.match(blobURL,/^blob:/);
    assert.equal(script.textContent,'');
    assert.equal(removals,1);
    assert.equal(assetURL(1,'even','landscape'),blobURL,'the private map survives removal of its script');
    assert.equal(assetURL(2,'even','landscape'),blobURL,'identical embedded bytes share one stable object URL');
    assert.equal(resolveLocalAsset('./frames/landscape/even-01.webp'),blobURL);
    assert.equal(await new FrameAssets().dataURL(1,'even','landscape'),embedded,
      'native fetch(blob) exports exactly the original bytes');
    assert.equal(assetPath(1,'even','landscape'),'/frames/landscape/even-01.webp');
    assert.equal(resolveLocalAsset('stills/not-embedded.webp'),'stills/not-embedded.webp');
    assert.equal(removals,1);
  }finally{
    if(blobURL)URL.revokeObjectURL(blobURL);
    if(originalDocument===undefined)delete globalThis.document;else globalThis.document=originalDocument;
    if(originalWindow===undefined)delete globalThis.window;else globalThis.window=originalWindow;
  }
});
