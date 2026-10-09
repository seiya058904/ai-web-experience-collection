import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRouteGuide, refineCamera } from '../experiences/atlas/src/camera.ts';
import { evaluateStory, CHAPTER_THRESHOLDS } from '../experiences/atlas/src/story.ts';
import { Geography, registeredDetail } from '../experiences/atlas/src/geo.ts';

const data = name => new URL('../public/atlas/data/' + name, import.meta.url);
const readJSON = async name => JSON.parse(await fs.readFile(data(name), 'utf8'));
const norm = point => Math.hypot(point.x, point.y, point.z);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
async function readGrid(name, size) {
  const bytes = await fs.readFile(data(name));
  assert.equal(bytes.length, size * size * 4);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), values = new Float32Array(size * size);
  for (let i = 0; i < values.length; i++) values[i] = view.getFloat32(i * 4, true);
  return values;
}
const routeBytes = await fs.readFile(data('vectors/route.geojson'));
const route = JSON.parse(routeBytes), meta = await readJSON('terrain.json'), detailMeta = await readJSON('city-raster.json');
const models = [];
for (const mobile of [false, true]) {
  const size = mobile ? 257 : 513, detailSize = mobile ? 129 : 257;
  const coarse = new Geography(meta, await readGrid(`elevation-${size}.bin`, size), size);
  const fine = registeredDetail(coarse, new Geography(detailMeta, await readGrid(`city-elevation-${detailSize}.bin`, detailSize), detailSize));
  const points = route.features[0].geometry.coordinates.map(([lon, lat]) => coarse.project(lon, lat, fine.height(lon, lat)));
  models.push({ mobile, points, guide: createRouteGuide(points) });
}

test('registered input route remains the delivered geographic data', () => {
  assert.equal(createHash('sha256').update(routeBytes).digest('hex'), '379e858f97319d13bc03610afc6eb380ea19fe7241574c61f3656bdf3b83f7b8');
  assert.equal(route.features[0].properties.road_aligned, true);
  assert.equal(route.features[0].properties.measured_route, false);
});

test('invalid and zero-length guides are rejected before sampling', () => {
  assert.throws(() => createRouteGuide([]));
  assert.throws(() => createRouteGuide([{ x: 0, y: 0, z: 0 }]));
  assert.throws(() => createRouteGuide([{ x: 0, y: 0, z: 0 }, { x: NaN, y: 0, z: 1 }]));
  assert.throws(() => createRouteGuide([{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }]));
});

test('guide owns an immutable copy and returns independent samples', () => {
  const input = [{ x: 0, y: .2, z: 0 }, { x: .3, y: .21, z: 0 }, { x: .3, y: .25, z: .3 }];
  const before = structuredClone(input), guide = createRouteGuide(input), expected = guide.sample(.43);
  assert.deepEqual(input, before);
  input[1].x = 999; const sample = guide.sample(.43); sample.x = -999;
  assert.deepEqual(guide.sample(.43), expected);
  assert.deepEqual(guide.sample(-1), guide.sample(0));
  assert.deepEqual(guide.sample(2), guide.sample(1));
});

for (const { mobile, points, guide } of models) {
  const label = mobile ? 'phone raster' : 'desktop raster';
  test(label + ': repeated road vertices remain finite and within the source spatial envelope', () => {
    const limits = Object.fromEntries(['x', 'y', 'z'].map(key => [key, [Math.min(...points.map(point => point[key])), Math.max(...points.map(point => point[key]))]]));
    assert.ok(guide.length > 0 && guide.length <= guide.sourceLength + 1e-9);
    assert.ok(guide.sourceLength > 3 && guide.sourceLength < 3.5);
    for (let i = 0; i <= 4096; i++) {
      const point = guide.sample(i / 4096);
      for (const key of ['x', 'y', 'z']) assert.ok(Number.isFinite(point[key]) && point[key] >= limits[key][0] - 1e-10 && point[key] <= limits[key][1] + 1e-10);
    }
  });
  test(label + ': independent dense chord lengths confirm distance-based progression', () => {
    const count = 8192, lengths = []; let previous = guide.sample(0);
    for (let i = 1; i <= count; i++) { const point = guide.sample(i / count); lengths.push(distance(point, previous)); previous = point; }
    const chord = lengths.reduce((sum, value) => sum + value, 0), mean = chord / count;
    const cv = Math.sqrt(lengths.reduce((sum, value) => sum + (value - mean) ** 2, 0) / count) / mean;
    assert.ok(Math.abs(chord - guide.length) / guide.length < 1e-5, 'Numerical quadrature must agree with independently sampled length.');
    assert.ok(Math.max(...lengths) / Math.min(...lengths) < 1.001, 'Equal fractions must not produce speed jumps at road corners.');
    assert.ok(cv < .0001);
  });
  test(label + ': interior acceleration differences converge as the sampling interval shrinks', () => {
    const maximumDifference = h => {
      let maximum = 0;
      for (let i = 1; i < 1000; i++) {
        const f = i / 1000, a = guide.sample(f - 2 * h), b = guide.sample(f - h), d = guide.sample(f + h), e = guide.sample(f + 2 * h);
        const difference = norm(Object.fromEntries(['x', 'y', 'z'].map(key => [key, (e[key] - 2 * d[key] + 2 * b[key] - a[key]) / (h * h)]))) / guide.length;
        maximum = Math.max(maximum, difference);
      }
      return maximum;
    };
    const coarse = maximumDifference(2e-5), medium = maximumDifference(1e-5), fine = maximumDifference(5e-6);
    assert.ok(medium < coarse * .65 && fine < medium * .65, 'A persistent acceleration discontinuity would not converge toward zero.');
    assert.ok(fine < 2);
  });
  test(label + ': all scroll poses and layer exposures remain valid', () => {
    for (let i = 0; i <= 4000; i++) {
      const state = evaluateStory(i / 4000, mobile, guide), pose = state.pose;
      for (const value of Object.values(pose)) assert.ok(Number.isFinite(value));
      assert.ok(pose.span > .4 && pose.span < 40000);
      assert.ok(pose.pitch > 0 && pose.pitch < Math.PI / 2);
      assert.ok(Math.abs(pose.yaw) < Math.PI);
      for (const key of ['night', 'backdrop', 'globe', 'imageVisibility', 'terrainVisibility', 'cityVisibility', 'curvature']) assert.ok(state[key] >= 0 && state[key] <= 1, key);
      const range = pose.span / (2 * Math.tan(Math.PI / 10));
      const near = Math.max(.004, range * .000025), far = Math.max(350, range * 8 + 20000 * state.globe);
      assert.ok(near > 0 && near < range && range < far);
    }
  });
  test(label + ': fast reverse and arbitrary revisit exactly reconstruct the same state', () => {
    const positions = [0, .735, .737, .749, .764, .785, .815, .825, .837, .845, .863, .8756, .887, .91, .928, .955, .972, .988, .99, 1];
    const forward = positions.map(p => evaluateStory(p, mobile, guide));
    for (let i = positions.length - 1; i >= 0; i--) assert.deepEqual(evaluateStory(positions[i], mobile, guide), forward[i]);
    for (const i of [7, 2, 18, 5, 10, 0, 19, 13, 3]) assert.deepEqual(evaluateStory(positions[i], mobile, guide), forward[i]);
    assert.deepEqual(evaluateStory(-2, mobile, guide), evaluateStory(0, mobile, guide));
    assert.deepEqual(evaluateStory(2, mobile, guide), evaluateStory(1, mobile, guide));
  });
  test(label + ': chapter and camera-branch thresholds have no pose jumps', () => {
    const boundaries = [...CHAPTER_THRESHOLDS.slice(1), .735, .737, .749, .772, .787, .815, .825, .845, .887, .97, .99], h = 1e-9;
    for (const p of boundaries) {
      const before = evaluateStory(p - h, mobile, guide).pose, after = evaluateStory(p + h, mobile, guide).pose;
      assert.ok(distance(before, after) / Math.max(1, before.span) < 1e-6, `Target discontinuity at ${p}`);
      assert.ok(Math.abs(Math.log(after.span / before.span)) < 1e-6, `Scale discontinuity at ${p}`);
      assert.ok(Math.abs(after.pitch - before.pitch) < 1e-6 && Math.abs(after.yaw - before.yaw) < 1e-6, `Orientation discontinuity at ${p}`);
    }
  });
}

test('global scale grows monotonically while device framing preserves shared layer timing', () => {
  let previous = 0;
  for (let i = 0; i <= 2000; i++) {
    const p = .815 + (.99 - .815) * i / 2000, desktop = evaluateStory(p, false, models[0].guide), phone = evaluateStory(p, true, models[1].guide);
    assert.ok(desktop.baseSpan >= previous - 1e-10); previous = desktop.baseSpan;
    assert.equal(phone.baseSpan, desktop.baseSpan);
    for (const key of ['night', 'globe', 'imageVisibility', 'terrainVisibility', 'cityVisibility', 'curvature']) assert.equal(phone[key], desktop[key]);
  }
});

test('the optional guide does not change input poses or early chapters', () => {
  const input = { x: -.55, y: .78, z: .08, span: 1.85, pitch: 1.04, yaw: -.38 }, copy = { ...input };
  refineCamera(.80, input, false, models[0].guide); assert.deepEqual(input, copy);
  for (const p of [0, .075, .155, .34, .465, .555, .695, .735]) assert.deepEqual(evaluateStory(p, false, models[0].guide), evaluateStory(p, false));
});
