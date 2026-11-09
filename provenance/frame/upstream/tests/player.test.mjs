import test from 'node:test';
import assert from 'node:assert/strict';
import { FilmPlayer } from '../src/player.ts';
import { makeTimeline } from '../src/timeline.ts';

function advance(player, milliseconds, start = 0) {
  player.tick(start);
  for (let elapsed = 50; elapsed <= milliseconds; elapsed += 50) player.tick(start + elapsed);
}

test('full playback follows the actual beat table and ends on24 after3seconds', () => {
  const changes = [];
  const player = new FilmPlayer(state => changes.push(state));
  assert.equal(changes.length, 0, 'constructors must not call into a partially initialized UI');
  const timeline = makeTimeline();
  player.play();
  player.tick(0);
  for (let time = 50; time <= 3000; time += 50) {
    player.tick(time);
    const expected = timeline.beats[Math.min(35, Math.floor((time + 1e-7) * 12 / 1000))];
    assert.equal(player.state.frame, expected);
  }
  assert.deepEqual(player.state, { frame: 24, beat: 35, playing: false, elapsedMs: 3000, totalBeats: 36, duration: 3, complete: true });
  assert.ok(changes.every(state => Object.isFrozen(state)));
});

test('pause/resume preserves the exact partial beat and excludes paused wall time', () => {
  const player = new FilmPlayer();
  player.play(); advance(player, 650);
  player.pause();
  const paused = player.state;
  player.tick(50000);
  assert.deepEqual(player.state, paused);
  player.play();
  player.tick(60000);
  assert.equal(player.state.elapsedMs, 650);
  player.tick(60050);
  assert.equal(player.state.elapsedMs, 700);
  assert.equal(player.state.frame, 3);
});

test('a visible 1016.4ms tick delay advances playback and elapsed time clamps to the actual duration', () => {
  const player = new FilmPlayer();
  player.play(); player.tick(655.9); player.tick(905.9);
  assert.equal(player.state.elapsedMs, 250);
  player.tick(1922.3);
  assert.equal(player.state.playing, true);
  assert.ok(Math.abs(player.state.elapsedMs - 1266.4) < 1e-7);
  assert.equal(player.state.beat, 15);
  assert.equal(player.state.frame, 10);
  assert.equal(player.state.complete, false);
  player.tick(5655.9);
  assert.deepEqual(player.state, { frame: 24, beat: 35, playing: false, elapsedMs: 3000, totalBeats: 36, duration: 3, complete: true });
});

test('backward or nonfinite clock samples pause without corrupting elapsed time', () => {
  for (const invalidTime of [1049, NaN, Infinity]) {
    const player = new FilmPlayer();
    player.play(); player.tick(1000); player.tick(1050); player.tick(invalidTime);
    assert.equal(player.state.playing, false);
    assert.equal(player.state.elapsedMs, 50);
    assert.equal(player.state.complete, false);
    player.play(); player.tick(50000); player.tick(50050);
    assert.equal(player.state.playing, true);
    assert.equal(player.state.elapsedMs, 100);
  }
});

test('config edits pause at the selected pose with the new real holds', () => {
  const player = new FilmPlayer();
  player.setFrame(18);
  player.play(); player.tick(0); player.tick(100);
  player.configure({ preset: 'ease-in', hold6: 8, hold18: 12 });
  assert.equal(player.state.playing, false);
  assert.equal(player.state.frame, 19, 'the exact pose reached before editing is retained');
  assert.equal(player.state.totalBeats, 56);
  assert.equal(player.state.duration, 56 / 12);
  assert.equal(player.state.beat, makeTimeline({ preset: 'ease-in', hold6: 8, hold18: 12 }).beats.indexOf(19));
});

test('range playback isolates poses while retaining only their applicable holds', () => {
  const player = new FilmPlayer();
  player.configure({ preset: 'even', hold6: 6, hold18: 8 });
  player.play({ from: 5, to: 7, restart: true });
  assert.equal(player.state.frame, 5);
  assert.equal(player.state.totalBeats, 9);
  advance(player, 750);
  assert.equal(player.state.frame, 7);
  assert.equal(player.state.complete, true);
  player.play({ restart: true });
  assert.equal(player.state.frame, 1, 'a full restart exits a previous comparison clip');
  assert.equal(player.state.totalBeats, 50);
});

test('lookback comparison removes17/18 and every repeat of18, leaving the rest intact', () => {
  const frames = [];
  const player = new FilmPlayer(state => { if (state.playing) frames.push(state.frame); });
  player.configure({ preset: 'ease-out', hold6: 0, hold18: 12 });
  player.play({ from: 13, to: 24, omitLookback: true, restart: true });
  assert.equal(player.state.totalBeats, 16);
  advance(player, 1400);
  assert.equal(player.state.complete, true);
  assert.equal(player.state.frame, 24);
  assert.ok(!frames.includes(17) && !frames.includes(18));
  assert.ok(frames.includes(16) && frames.includes(19));
});

test('manual frame selection exits clip mode, pauses and selects the first beat of that pose', () => {
  const player = new FilmPlayer();
  player.play({ from: 7, to: 12 });
  player.setFrame(18);
  assert.equal(player.state.playing, false);
  assert.equal(player.state.frame, 18);
  assert.equal(player.state.totalBeats, 36);
  player.setFrame(999);
  assert.equal(player.state.frame, 24);
  player.play(); advance(player, 600);
  assert.equal(player.state.complete, true);
  player.play();
  assert.equal(player.state.frame, 1, 'playing a completed take starts at its beginning');
});

test('an empty comparison range rejects without corrupting the current playback state', () => {
  const player = new FilmPlayer();
  player.setFrame(10);
  const before = player.state;
  assert.throws(() => player.play({ from: 17, to: 18, omitLookback: true }), /contains no frames/);
  assert.deepEqual(player.state, before);
});
