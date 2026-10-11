import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import { clamp } from '../experiences/orbital/lib/orbital/mission.ts';

const source = fs.readFileSync(new URL('../experiences/orbital/lib/orbital/audio.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: {
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
} }).outputText;
const module = { exports: {} };
new Function('require', 'module', 'exports', compiled)(name => {
  assert.equal(name, './mission');
  return { clamp };
}, module, module.exports);
const { MissionAudio } = module.exports;

function fixture(t) {
  const previous = globalThis.AudioContext;
  const contexts = [];
  const parameter = () => ({ value: 0, calls: [], setTargetAtTime(value) { this.calls.push(value); } });
  const node = () => ({ gain: parameter(), frequency: parameter(), threshold: parameter(), ratio: parameter(),
    connect() {}, start() {}, stop() { this.stopped = true; } });
  class AudioContextFixture {
    sampleRate = 1000; currentTime = 0; destination = {}; state = 'suspended'; pending = []; nodes = [];
    constructor() { contexts.push(this); }
    createGain() { const gain = node(); this.master ??= gain; return gain; }
    createDynamicsCompressor() { return node(); }
    createOscillator() { const value = node(); this.nodes.push(value); return value; }
    createBufferSource() { const value = node(); this.nodes.push(value); return value; }
    createBiquadFilter() { return node(); }
    createBuffer(_channels, length) { return { getChannelData: () => new Float32Array(length) }; }
    resume() {
      return new Promise((resolve, reject) => this.pending.push({
        resolve: () => { this.state = 'running'; resolve(); }, reject,
      }));
    }
    suspend() { this.state = 'suspended'; return Promise.resolve(); }
    close() { this.state = 'closed'; return Promise.resolve(); }
  }
  globalThis.AudioContext = AudioContextFixture;
  const audio = new MissionAudio();
  t.after(() => { audio.destroy(); globalThis.AudioContext = previous; });
  return { audio, contexts };
}

test('ORBITAL two toggles before resume settles preserve the final off intent', async t => {
  const { audio, contexts } = fixture(t);
  const first = audio.toggle(), second = audio.toggle();
  contexts[0].pending.forEach(value => value.resolve());
  await Promise.all([first, second]);
  assert.equal(audio.enabled, false);
  assert.equal(contexts[0].master.gain.calls.at(-1), 0);
});

test('ORBITAL a single enable and sequential mute retain normal behavior', async t => {
  const { audio, contexts } = fixture(t);
  const enabled = audio.toggle();
  contexts[0].pending[0].resolve();
  assert.equal(await enabled, true);
  assert.equal(audio.enabled, true);
  assert.equal(contexts[0].master.gain.calls.at(-1), .16);
  assert.equal(await audio.toggle(), false);
  assert.equal(contexts[0].master.gain.calls.at(-1), 0);
});

test('ORBITAL latest enable wins when older resume completes last', async t => {
  const { audio, contexts } = fixture(t);
  const first = audio.toggle(), off = audio.toggle(), latest = audio.toggle();
  const context = contexts[0];
  context.pending.at(-1).resolve();
  assert.equal(await latest, true);
  context.pending.forEach(value => value.resolve());
  await Promise.all([first, off]);
  assert.equal(audio.enabled, true);
  assert.equal(context.master.gain.calls.at(-1), .16);
  assert.equal(contexts.length, 1);
});

test('ORBITAL stale rejection cannot clear a newer successful enable', async t => {
  const { audio, contexts } = fixture(t);
  const first = audio.toggle(), off = audio.toggle(), latest = audio.toggle();
  const context = contexts[0];
  context.pending.at(-1).resolve();
  assert.equal(await latest, true);
  context.pending[0].reject(new Error('old resume rejected'));
  context.pending.slice(1).forEach(value => value.resolve());
  await Promise.all([first, off]);
  assert.equal(audio.enabled, true);
  assert.equal(context.master.gain.calls.at(-1), .16);
});

test('ORBITAL a failed enable returns off and permits retry', async t => {
  const { audio, contexts } = fixture(t);
  const first = audio.toggle();
  contexts[0].pending[0].reject(new Error('resume refused'));
  assert.equal(await first, false);
  assert.equal(audio.enabled, false);
  const retry = audio.toggle();
  contexts[0].pending.at(-1).resolve();
  assert.equal(await retry, true);
});

test('ORBITAL destruction invalidates pending enable and prevents reinitialization', async t => {
  const { audio, contexts } = fixture(t);
  const first = audio.toggle();
  audio.destroy();
  contexts[0].pending[0].resolve();
  assert.equal(await first, false);
  assert.equal(audio.enabled, false);
  assert.equal(await audio.toggle(), false);
  assert.equal(contexts.length, 1);
  assert.ok(contexts[0].nodes.every(value => value.stopped));
});

test('ORBITAL hiding during pending enable cannot apply audible gain', async t => {
  const { audio, contexts } = fixture(t);
  const pending = audio.toggle();
  audio.visibility(true);
  contexts[0].pending[0].resolve();
  await pending;
  assert.equal(contexts[0].state, 'suspended');
  assert.equal(contexts[0].master.gain.calls.at(-1), 0);
  audio.visibility(false);
  contexts[0].pending.at(-1).resolve();
  await Promise.resolve();
  assert.equal(audio.enabled, true);
  assert.equal(contexts[0].master.gain.calls.at(-1), .16);
});
