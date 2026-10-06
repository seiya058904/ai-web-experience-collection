import test from 'node:test';
import assert from 'node:assert/strict';
import { WaveWorld } from '../experiences/resonance/src/world.js';

function canvas(available) {
  return {
    width: 1, height: 1, style: {}, listeners: new Set(), removed: false,
    getContext(kind) { return available && kind === '2d' ? {} : null; },
    addEventListener(name) { this.listeners.add(name); },
    removeEventListener(name) { this.listeners.delete(name); },
    cloneNode() { this.clone = canvas(available); return this.clone; },
    removeAttribute() {}, setAttribute() {}, dataset: {},
    insertAdjacentElement() {},
    remove() { this.removed = true; },
  };
}

test('unavailable WebGL and Canvas reject visual startup and release failed resources', () => {
  const surface = canvas(false);
  assert.throws(() => new WaveWorld(surface), /No visual renderer/);
  assert.equal(surface.listeners.size, 0);
  assert.equal(surface.clone.removed, true);
  assert.equal(surface.style.visibility, '');
});

test('Canvas compatibility remains available with capped rendering and teardown', () => {
  const surface = canvas(true);
  let fallback = false;
  const world = new WaveWorld(surface, { onFallback: () => { fallback = true; } });
  world.resize(390, 844, 3);
  assert.equal(fallback, true);
  assert.equal(world.quality.renderer, 'Canvas 2D');
  assert.equal(world.quality.particles, 2800);
  assert.ok(world.quality.dpr <= 1.75);
  assert.ok(world.quality.pixelBudget <= 2200000);
  world.destroy();
  assert.equal(surface.listeners.size, 0);
  assert.equal(world.geometry, null);
});

test('portrait tablet recomposes without changing desktop or short landscape layouts', () => {
  const world = new WaveWorld(canvas(true));
  for (const [width, height, mobile, landscape] of [
    [768, 1024, true, false], [900, 1200, true, false], [900, 900, true, false],
    [844, 390, false, true], [1440, 900, false, false], [760, 844, true, false],
  ]) {
    world.resize(width, height);
    assert.equal(world.mobile, mobile, `${width}×${height}`);
    assert.equal(world.shortLandscape, landscape, `${width}×${height}`);
  }
  world.destroy();
});
