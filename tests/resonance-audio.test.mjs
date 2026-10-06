import test from "node:test";
import assert from "node:assert/strict";
import { ResonanceAudio } from "../experiences/resonance/src/audio.js";

function engineFor(t) {
  const engine = new ResonanceAudio();
  t.after(() => engine.destroy());
  return engine;
}

function replaceAudioContext(t, replacement) {
  const original = Object.getOwnPropertyDescriptor(globalThis, "AudioContext");
  Object.defineProperty(globalThis, "AudioContext", { configurable: true, value: replacement });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, "AudioContext", original);
    else delete globalThis.AudioContext;
  });
}

function sampleMetrics(samples) {
  let peak = 0;
  let energy = 0;
  for (const sample of samples) {
    assert.ok(Number.isFinite(sample), "Every captured sample must be finite.");
    peak = Math.max(peak, Math.abs(sample));
    energy += sample * sample;
  }
  return { peak, rms: Math.sqrt(energy / samples.length) };
}

function estimatePitch(samples, sampleRate) {
  const start = Math.round(sampleRate * 0.1);
  const end = samples.length - start;
  let positiveCrossings = 0;
  for (let index = start + 1; index < end; index++) {
    if (samples[index - 1] <= 0 && samples[index] > 0) positiveCrossings++;
  }
  return positiveCrossings * sampleRate / (end - start);
}

test("capture and WAV export work with sound disabled and never create an AudioContext", async t => {
  let contextCreations = 0;
  replaceAudioContext(t, class ForbiddenAudioContext {
    constructor() {
      contextCreations++;
      throw new Error("Offline capture must not request a real-time audio context.");
    }
  });
  const engine = engineFor(t);
  const metadata = await engine.captureTone({ frequency: 220, duration: 3 });
  const wav = engine.exportWav();
  assert.equal(contextCreations, 0);
  assert.equal(engine.enabled, false);
  assert.equal(engine.context, null);
  assert.equal(metadata.duration, 3);
  assert.equal(metadata.sampleRate, 44100);
  assert.equal(metadata.frames, 132300);
  assert.equal(engine.capture.samples.length, metadata.frames);
  assert.equal(wav.size, 44 + metadata.frames * 2);
  assert.equal(wav.type, "audio/wav");
});

test("identical captures produce identical PCM and WAV bytes across engine instances", async t => {
  const first = engineFor(t);
  const second = engineFor(t);
  const settings = { frequency: 237, harmonics: [1, 0.42, 0.2, 0.08], duration: 3 };
  await first.captureTone(settings);
  await second.captureTone(settings);
  assert.deepEqual(first.capture.samples, second.capture.samples);
  assert.deepEqual(
    new Uint8Array(await first.exportWav().arrayBuffer()),
    new Uint8Array(await second.exportWav().arrayBuffer()),
  );
});

test("harmonic normalization keeps a dense signal finite and preserves relative timbre", async t => {
  const engine = engineFor(t);
  await engine.captureTone({ frequency: 180, harmonics: Array(8).fill(1), duration: 1 });
  const dense = sampleMetrics(engine.capture.samples);
  assert.ok(dense.peak <= 0.681, "Adding harmonics must not produce clipping.");
  assert.ok(dense.rms > 0.03, "Normalization must not accidentally mute the signal.");
  assert.ok(engine.capture.samples[0] === 0, "The attack begins at silence.");
  assert.ok(engine.capture.samples.at(-1) === 0, "The release ends at silence.");
  const harmonics = [1, 0.5, 0.25, 0.125];
  await engine.captureTone({ frequency: 220, harmonics, duration: 0.5 });
  const reference = engine.capture.samples.slice();
  await engine.captureTone({ frequency: 220, harmonics: harmonics.map(value => value * 0.2), duration: 0.5 });
  let largestDifference = 0;
  reference.forEach((value, index) => {
    largestDifference = Math.max(largestDifference, Math.abs(value - engine.capture.samples[index]));
  });
  assert.ok(largestDifference < 1e-6, "Scaling all harmonic coefficients equally must preserve the normalized waveform.");
});

test("the requested fundamental frequency changes the actual recorded pitch", async t => {
  const engine = engineFor(t);
  for (const frequency of [110, 220, 330]) {
    await engine.captureTone({ frequency, harmonics: [1, 0, 0, 0], duration: 1 });
    const measured = estimatePitch(engine.capture.samples, engine.capture.sampleRate);
    assert.ok(Math.abs(measured - frequency) < 2, `${frequency} Hz capture measured ${measured} Hz.`);
  }
});

test("the WAV is a complete playable three-second mono PCM16 payload", async t => {
  const engine = engineFor(t);
  await engine.captureTone({ frequency: 220, duration: 3 });
  const bytes = await engine.exportWav().arrayBuffer();
  const view = new DataView(bytes);
  const tag = offset => String.fromCharCode(...new Uint8Array(bytes, offset, 4));
  assert.equal(tag(0), "RIFF");
  assert.equal(tag(8), "WAVE");
  assert.equal(tag(12), "fmt ");
  assert.equal(tag(36), "data");
  assert.equal(view.getUint32(4, true), bytes.byteLength - 8);
  assert.equal(view.getUint32(16, true), 16, "The PCM format chunk must have the standard size.");
  assert.equal(view.getUint16(20, true), 1, "The encoding must be integer PCM.");
  assert.equal(view.getUint16(22, true), 1, "The recording must be mono.");
  assert.equal(view.getUint32(24, true), 44100);
  assert.equal(view.getUint32(28, true), 88200);
  assert.equal(view.getUint16(32, true), 2);
  assert.equal(view.getUint16(34, true), 16);
  assert.equal(view.getUint32(40, true), 132300 * 2);
  assert.equal(bytes.byteLength, 264644);
  assert.equal(view.getInt16(44, true), 0);
  assert.equal(view.getInt16(bytes.byteLength - 2, true), 0);
  let audibleSamples = 0;
  for (let frame = 0; frame < engine.capture.frames; frame += 137) {
    const decoded = view.getInt16(44 + frame * 2, true) / 32768;
    if (decoded !== 0) audibleSamples++;
    assert.ok(Math.abs(decoded - engine.capture.samples[frame]) < 2 / 32768, "WAV sample data must match the captured signal within PCM16 quantization.");
  }
  assert.ok(audibleSamples > 100, "A valid header alone must not hide an empty recording.");
});

test("zero harmonic controls create real silence in both capture and export", async t => {
  const engine = engineFor(t);
  await engine.captureTone({ harmonics: [0, 0, 0, 0], duration: 0.25 });
  assert.ok(engine.capture.samples.every(sample => sample === 0));
  const bytes = new Uint8Array(await engine.exportWav().arrayBuffer());
  assert.ok(bytes.subarray(44).every(byte => byte === 0));
});

test("malformed capture settings remain finite and allocations remain bounded", async t => {
  const engine = engineFor(t);
  const malformed = await engine.captureTone({ frequency: Infinity, duration: NaN, harmonics: [NaN, -7, Infinity, 2, "0.3"] });
  assert.ok(malformed.frequency >= 110 && malformed.frequency <= 330);
  assert.equal(malformed.duration, 3);
  assert.ok(malformed.harmonics.every(value => Number.isFinite(value) && value >= 0 && value <= 1));
  sampleMetrics(engine.capture.samples);
  const belowRange = await engine.captureTone({ frequency: -300, duration: -1 });
  assert.equal(belowRange.frequency, 110);
  assert.ok(belowRange.duration > 0 && belowRange.duration <= 1);
  const aboveRange = await engine.captureTone({ frequency: 1e20, duration: 1e20, harmonics: Array(100).fill(1) });
  assert.equal(aboveRange.frequency, 330);
  assert.ok(aboveRange.duration <= 10, "A malformed duration must not allocate an unbounded recording.");
  assert.ok(aboveRange.harmonics.length <= 8);
  assert.equal(aboveRange.frames, Math.round(aboveRange.duration * aboveRange.sampleRate));
  assert.ok(sampleMetrics(engine.capture.samples).peak <= 0.681);
});

test("a saved recording is unchanged when live controls or returned metadata change", async t => {
  const engine = engineFor(t);
  const metadata = await engine.captureTone({ frequency: 220, harmonics: [1, 0.5, 0.25, 0.125], duration: 0.5 });
  const before = new Uint8Array(await engine.exportWav().arrayBuffer());
  metadata.harmonics[0] = 0;
  engine.setState({ scene: 5, frequency: 330, harmonics: [0, 1, 0, 0], phase: Math.PI });
  assert.equal(engine.capture.frequency, 220);
  assert.equal(engine.capture.harmonics[0], 1);
  assert.deepEqual(new Uint8Array(await engine.exportWav().arrayBuffer()), before);
});

test("failed audio activation propagates its error and leaves sound disabled", async t => {
  const expected = new Error("Audio device unavailable");
  replaceAudioContext(t, class UnavailableAudioContext {
    constructor() { throw expected; }
  });
  const engine = engineFor(t);
  await assert.rejects(engine.setEnabled(true), error => error === expected);
  assert.equal(engine.enabled, false);
  assert.equal(engine.context, null);
  assert.equal(engine.lastError, expected);
});

test("destroy releases the recording and is safe before activation or on repeated calls", async t => {
  const engine = engineFor(t);
  assert.equal(await engine.playCapture(), false);
  assert.throws(() => engine.exportWav(), /capture/i);
  await engine.captureTone({ duration: 0.25 });
  engine.destroy();
  engine.destroy();
  assert.equal(engine.enabled, false);
  assert.equal(engine.context, null);
  assert.equal(engine.capture, null);
  assert.equal(engine.playing, false);
  assert.equal(engine.excite(), false);
  assert.equal(await engine.playCapture(), false);
  assert.equal(await engine.setEnabled(true), false);
  await assert.rejects(engine.captureTone(), /released/i);
});
