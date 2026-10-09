import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { gzipSync } from 'node:zlib';
import * as THREE from 'three';
import { PROJECT_ROOT, SOURCE_PATH, OPTICS, deriveCanonical, verifyPackage, sha256 } from '../scripts/derive-optics.mjs';
import { loadOpticsBytes, decodeFloat32LE } from '../experiences/atlas/src/world/optics-loader.ts';
import { GlobeLayer } from '../experiences/atlas/src/world/globe.ts';

const outputDir = resolve(PROJECT_ROOT, 'public/atlas/data/optics');
function transport(t, implementation, decompression = globalThis.DecompressionStream) {
  const previousFetch = globalThis.fetch;
  const previousDecompression = globalThis.DecompressionStream;
  const requests = [];
  globalThis.DecompressionStream = decompression;
  globalThis.fetch = async (url, options) => {
    requests.push(String(url));
    return implementation(String(url), options);
  };
  t.after(() => { globalThis.fetch = previousFetch; globalThis.DecompressionStream = previousDecompression; });
  return requests;
}
const signal = () => new AbortController().signal;

test('original geographic source regenerates all canonical raw bytes and packaged gzip decodes identically', async () => {
  const source = await readFile(resolve(PROJECT_ROOT, SOURCE_PATH));
  const regenerated = deriveCanonical(source);
  const results = await verifyPackage(outputDir, source, regenerated);
  assert.equal(results.length, 3);
  assert.ok(results.every(result => result.canonicalRaw && result.gzipDecodesExactly));
  assert.throws(() => deriveCanonical(Buffer.from('{}')), /source GeoJSON changed/);
});

test('package verification permits different valid gzip encodings and rejects manifest/content corruption', async t => {
  const temporary = await mkdtemp(join(tmpdir(), 'atlas-optics-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  await cp(outputDir, temporary, { recursive: true });
  const source = await readFile(resolve(PROJECT_ROOT, SOURCE_PATH));
  const manifestPath = join(temporary, 'DERIVATION.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const spec = OPTICS[0];
  const raw = await readFile(join(temporary, spec.filename));
  const differentEncoding = gzipSync(raw, { level: 1 });
  const record = manifest.outputs[0].gzip;
  assert.notEqual(sha256(differentEncoding), record.sha256);
  record.bytes = differentEncoding.length;
  record.sha256 = sha256(differentEncoding);
  await writeFile(join(temporary, record.filename), differentEncoding);
  await writeFile(manifestPath, JSON.stringify(manifest));
  assert.equal((await verifyPackage(temporary, source)).length, 3);
  record.sha256 = '0'.repeat(64);
  await writeFile(manifestPath, JSON.stringify(manifest));
  await assert.rejects(verifyPackage(temporary, source), /packaged gzip hash mismatch/);
  raw[1234] ^= 1;
  await writeFile(join(temporary, spec.filename), raw);
  await assert.rejects(verifyPackage(temporary, source), /non-canonical raw content/);
});

test('runtime uses a single gzip request when decompression succeeds', async t => {
  const raw = Buffer.from([1, 2, 3, 4]);
  const requests = transport(t, () => new Response(gzipSync(raw)));
  assert.deepEqual(await loadOpticsBytes('/data/', 'test.bin', 4, signal()), new Uint8Array(raw));
  assert.deepEqual(requests, ['/data/test.bin.gz']);
});

test('runtime requests raw directly when DecompressionStream is unavailable', async t => {
  const requests = transport(t, () => new Response(new Uint8Array([9, 8])), null);
  // An unavailable API has typeof "undefined"; null also intentionally fails the feature test.
  assert.deepEqual(await loadOpticsBytes('/data/', 'test.bin', 2, signal()), new Uint8Array([9, 8]));
  assert.deepEqual(requests, ['/data/test.bin']);
});

for (const failure of ['http', 'corrupt', 'wrong-length', 'no-body']) {
  test(`runtime falls back to exact raw after gzip ${failure}`, async t => {
    const raw = new Uint8Array([9, 8, 7]);
    const requests = transport(t, url => {
      if (!url.endsWith('.gz')) return new Response(raw);
      if (failure === 'http') return new Response(null, { status: 404 });
      if (failure === 'corrupt') return new Response('not gzip');
      if (failure === 'no-body') return new Response(null);
      return new Response(gzipSync(new Uint8Array([1, 2])));
    });
    assert.deepEqual(await loadOpticsBytes('/data/', 'test.bin', 3, signal()), raw);
    assert.deepEqual(requests, ['/data/test.bin.gz', '/data/test.bin']);
  });
}

test('runtime rejects wrong-length raw instead of constructing partial textures', async t => {
  transport(t, () => new Response(new Uint8Array([1])), null);
  await assert.rejects(loadOpticsBytes('/', 'test.bin', 2, signal()), /has 1 bytes; expected 2/);
});

test('abort before fetch, during fetch, and during decode never requests raw fallback', async t => {
  const abort = new DOMException('Stopped', 'AbortError');
  const alreadyAborted = new AbortController();
  alreadyAborted.abort(abort);
  const requests = transport(t, () => { throw abort; });
  await assert.rejects(loadOpticsBytes('/', 'test.bin', 2, alreadyAborted.signal), { name: 'AbortError' });
  assert.equal(requests.length, 0);
  await assert.rejects(loadOpticsBytes('/', 'test.bin', 2, signal()), { name: 'AbortError' });
  assert.deepEqual(requests, ['/test.bin.gz']);
  globalThis.fetch = async url => {
    requests.push(String(url));
    return new Response(new ReadableStream({ start(controller) { controller.error(abort); } }));
  };
  await assert.rejects(loadOpticsBytes('/', 'test.bin', 2, signal()), { name: 'AbortError' });
  assert.deepEqual(requests, ['/test.bin.gz', '/test.bin.gz']);
});

test('coastline decoding uses explicit little endian and respects byte offsets', () => {
  const backing = Buffer.alloc(14);
  backing.writeFloatLE(138.8079, 3);
  backing.writeFloatLE(-35.4875, 7);
  const values = decodeFloat32LE(new Uint8Array(backing.buffer, backing.byteOffset + 3, 8));
  assert.deepEqual([...values], [Math.fround(138.8079), Math.fround(-35.4875)]);
  assert.throws(() => decodeFloat32LE(new Uint8Array(3)), /misaligned float32/);
  const invalid = Buffer.alloc(4); invalid.writeFloatLE(NaN);
  assert.throws(() => decodeFloat32LE(invalid), /non-finite/);
});

test('actual GlobeLayer loads only optical resources with original texture precision and reverses visibility', async t => {
  const requests = transport(t, async url => new Response(await readFile(join(outputDir, url.split('/').at(-1)))), null);
  const globe = new GlobeLayer();
  t.after(() => globe.dispose());
  assert.equal(globe.group.visible, false);
  await Promise.all([globe.load('./'), globe.load('./')]);
  assert.equal(requests.length, 3);
  assert.ok(requests.every(url => url.startsWith('./data/optics/') && url.endsWith('.bin')));
  const surface = globe.group.children.find(child => child.name.startsWith('Earth'));
  const mask = surface.material.uniforms.uLandMask.value;
  const regional = surface.material.uniforms.uRegionalCoast.value;
  assert.deepEqual([mask.image.width, mask.image.height, regional.image.width, regional.image.height], [4096, 2048, 2048, 2048]);
  assert.equal(sha256(mask.image.data), OPTICS[0].sha256);
  assert.equal(sha256(regional.image.data), OPTICS[1].sha256);
  for (const texture of [mask, regional]) {
    assert.equal(texture.format, THREE.RedFormat);
    assert.equal(texture.type, THREE.UnsignedByteType);
    assert.equal(texture.magFilter, THREE.LinearFilter);
    assert.equal(texture.minFilter, THREE.LinearMipmapLinearFilter);
    assert.equal(texture.generateMipmaps, true);
    assert.equal(texture.colorSpace, THREE.NoColorSpace);
    assert.equal(texture.flipY, false);
    assert.equal(texture.unpackAlignment, 1);
    assert.equal(texture.wrapT, THREE.ClampToEdgeWrapping);
  }
  assert.equal(mask.wrapS, THREE.RepeatWrapping);
  assert.equal(regional.wrapS, THREE.ClampToEdgeWrapping);
  const coast = globe.group.children.find(child => child.name.includes('coastline (map scale)'));
  assert.equal(coast.geometry.getAttribute('position').count, 72872);
  const packed = Buffer.alloc(874464);
  coast.geometry.getAttribute('position').array.forEach((value, i) => packed.writeFloatLE(value, i * 4));
  assert.equal(sha256(packed), OPTICS[2].sha256);
  for (const visibility of [1, 0.3, 0, 0.3, 1]) {
    globe.update({ visibility, night: 0.25, time: 0 });
    assert.equal(globe.group.visible, visibility > 0.001);
    assert.equal(surface.material.uniforms.uVisibility.value, visibility);
  }
  await globe.load('./'); assert.equal(requests.length, 3);
  let disposed = 0;
  for (const resource of [mask, regional, coast.geometry]) resource.addEventListener('dispose', () => disposed++);
  globe.dispose(); globe.dispose();
  assert.equal(disposed, 3);
  assert.equal(globe.group.children.length, 0);
  await assert.rejects(globe.load('./'), /disposed layer/);
});

test('disposing an actual GlobeLayer during load aborts all requests and performs no raw retries', async t => {
  const requests = transport(t, (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  }));
  const globe = new GlobeLayer();
  const loading = globe.load('./');
  const expectedFailure = assert.rejects(loading, { name: 'AbortError' });
  globe.dispose();
  await expectedFailure;
  assert.equal(requests.length, 3);
  assert.ok(requests.every(url => url.endsWith('.gz')));
  assert.equal(globe.group.children.length, 0);
});

test('collection deployment mounts globe optics under the atlas namespace, not the site root', async t => {
  // The Pages deployment serves the collection under /ai-web-experience-collection/
  // and the globe bytes live at atlas/data/optics/. The transport below answers
  // only that namespace, so the pre-fix call shape — load(base), which asks the
  // site root for data/optics/ — must fail this test.
  const base = '/ai-web-experience-collection/';
  const requests = transport(t, async url => {
    if (!url.startsWith(`${base}atlas/data/optics/`)) return new Response(null, { status: 404 });
    const name = url.split('/').at(-1);
    const raw = await readFile(join(outputDir, name.endsWith('.gz') ? name.slice(0, -3) : name));
    return new Response(name.endsWith('.gz') ? gzipSync(raw) : raw);
  });
  const globe = new GlobeLayer();
  t.after(() => globe.dispose());
  await assert.rejects(globe.load(base), /resource failed to load/);
  assert.ok(requests.some(url => url === `${base}data/optics/globe-land-mask-4096x2048.bin.gz`));
  await globe.load(`${base}atlas/`);
  assert.equal(requests.filter(url => url.startsWith(`${base}atlas/data/optics/`)).length, 3);
});

test('main.ts mounts the globe layer under the atlas work directory (regression)', async () => {
  const source = await readFile(resolve(PROJECT_ROOT, 'experiences/atlas/src/main.ts'), 'utf8');
  const call = source.match(/new module\.GlobeLayer\(\);[\s\S]*?await instance\.load\(([^;]+)\);/);
  assert.ok(call, 'globe layer load call not found in main.ts');
  assert.match(call[1], /atlas/, 'globe must load from atlas/data/optics/, not the deployment base');
});
