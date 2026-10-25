import test from 'node:test';
import assert from 'node:assert/strict';
import { fillEnvironment } from '../experiences/parallax/src/environment-data.js';

// Reference samples recorded from the original two complete Batch B HDR fields.
const references = [
  [[0,0,.34520656,.35753536,.37162542],[512,72,1.94105554,2.01037908,2.08960581],[300,210,2.53700924,2.62761688,2.73116827],[400,240,1.64872813,1.70761132,1.77490628],[612,274,.20059922,.20617525,.21244270],[910,398,.17570232,.17122102,.16538718],[1023,511,.21039866,.20389155,.19552626]],
  [[0,0,.15093938,.14708714,.14298210],[512,72,.93962914,.94843060,.96049529],[300,210,.20746034,.18167967,.15252879],[400,240,.74751729,.72870898,.70868838],[612,274,1.20270669,1.21808636,1.23826694],[910,398,.61833918,.58987445,.55878514],[1023,511,.23946674,.21203700,.18143235]],
];

for (const architectural of [false, true]) {
  test(`${architectural ? 'architectural' : 'studio'} HDR retains its original field and bounded-row fallback`, () => {
    const complete = fillEnvironment(new Float32Array(1024 * 512 * 4), architectural);
    for (const [x, y, ...rgb] of references[Number(architectural)]) {
      const offset = (y * 1024 + x) * 4;
      rgb.forEach((value, channel) => assert.ok(Math.abs(complete[offset + channel] - value) < 1e-6));
      assert.equal(complete[offset + 3], 1);
    }
    const chunked = new Float32Array(complete.length);
    for (let row = 0; row < 512; row += 17) fillEnvironment(chunked, architectural, row, Math.min(512, row + 17));
    assert.deepEqual(chunked, complete);
  });
}
