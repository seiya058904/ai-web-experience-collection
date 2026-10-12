import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleJourney, scrollForState, colorsForState, depthLabel, CHAPTERS } from '../experiences/dose/src/timeline.js';

const vh = 900;
const spans = [2.5, 2.8, 3.05, 3.6, 2.65, 3.35, 2.7];
let top = 0;
const metrics = spans.map(span => { const result = { top, height: span * vh }; top += result.height; return result; });

test('the final composition can be reached at the actual document bottom', () => {
  const state = sampleJourney(top - vh, metrics, vh);
  assert.equal(state.scene, 6);
  assert.equal(state.local, 1);
  assert.equal(state.overall, 1);
});
test('scroll overshoot is bounded at both document edges', () => {
  assert.deepEqual(sampleJourney(-1000, metrics, vh), { scene: 0, local: 0, transition: 0, overall: 0 });
  assert.equal(sampleJourney(top * 2, metrics, vh).local, 1);
  assert.ok(Number.isFinite(sampleJourney(NaN, metrics, vh).local));
});
test('every chapter has a stable composition and a continuous handoff boundary', () => {
  for (let i = 0; i < 6; i++) {
    const stable = sampleJourney(scrollForState(i, .4, metrics, vh), metrics, vh);
    assert.equal(stable.scene, i);
    assert.equal(stable.transition, 0);
    const left = sampleJourney(metrics[i + 1].top - .1, metrics, vh);
    const right = sampleJourney(metrics[i + 1].top, metrics, vh);
    assert.ok(left.transition > .999);
    assert.equal(right.scene, i + 1);
    assert.equal(right.local, 0);
    const leftColors = colorsForState(left), rightColors = colorsForState(right);
    assert.equal(leftColors.page, rightColors.page);
  }
});
test('revisiting an identical position restores the same process state', () => {
  const positions = [0, 1240, 5850, 8177, 11920, top - vh, 8177, 0];
  const states = positions.map(y => sampleJourney(y, metrics, vh));
  assert.deepEqual(states[3], states[6]);
  assert.deepEqual(states[0], states[7]);
});
test('a resize can preserve phase across all seven chapters', () => {
  const mobileVH = 780;
  let nextTop = 0;
  const mobileMetrics = spans.map(span => { const result = { top: nextTop, height: span * mobileVH }; nextTop += result.height; return result; });
  for (let i = 0; i < 7; i++) for (const phase of [.1, .52, .93]) {
    const y = scrollForState(i, phase, mobileMetrics, mobileVH);
    const state = sampleJourney(y, mobileMetrics, mobileVH);
    assert.equal(state.scene, i);
    assert.ok(Math.abs(state.local - phase) < .000001);
  }
});
test('the cutaway uses qualitative labels rather than fake measurement output', () => {
  assert.equal(depthLabel(0), 'Surface');
  assert.equal(depthLabel(.5), 'Within the form');
  assert.equal(depthLabel(1), 'Interior');
});
test('only Evidence has a dark stable canvas and every scene has a unique anchor', () => {
  assert.equal(new Set(CHAPTERS.map(chapter => chapter.id)).size, 7);
  for (let i = 0; i < 7; i++) assert.equal(colorsForState({ scene: i, transition: 0 }).dark, i === 5);
});

// Regression: readers may stop on the gray backgrounds around Evidence.
test('all three reading colors maintain 4.5:1 contrast throughout every handoff', () => {
  const lum = rgb => rgb.map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  for (let scene = 0; scene < 7; scene++) {
    for (let step = 0; step <= 1000; step++) {
      const colors = colorsForState({ scene, transition: step / 1000 });
      const background = lum(colors.page.match(/\d+/g).map(Number));
      for (const key of ['ink', 'muted', 'accent']) {
        const foreground = lum(colors[key].slice(1).match(/../g).map(s => parseInt(s,16)));
        const ratio = (Math.max(background,foreground)+.05)/(Math.min(background,foreground)+.05);
        assert.ok(ratio >= 4.5, `${scene}/${step}/${key}: ${ratio}`);
      }
    }
  }
});
