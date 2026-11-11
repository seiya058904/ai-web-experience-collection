import test from 'node:test';
import assert from 'node:assert/strict';
import { FRAGMENTS, PIECE_IDS, SEAM_POINTS, SEAMS, SUN, containsPoint, outlinePolyline, polygonArea, sunSvg } from '../experiences/papersun/src/fragments.ts';
import { evaluateStory, sanitizeStoryMemory, initialStoryMemory } from '../experiences/papersun/src/story-state.ts';
import { CHAPTERS, TRANSITIONS } from '../experiences/papersun/src/story.ts';
import { renderProps } from '../experiences/papersun/src/stage-props.ts';

test('the exact three fragments use one circular radius and pairwise shared seam boundaries', () => {
  assert.deepEqual(Object.keys(FRAGMENTS), ['A', 'B', 'C']);
  assert.equal(new Set(PIECE_IDS.map(id => FRAGMENTS[id].path)).size, 3);
  assert.equal(SEAMS.length, 3);
  for (let i = 0; i < 3; i++) {
    const seam = SEAM_POINTS[i];
    assert.deepEqual(seam[0], { x: SUN.cx, y: SUN.cy });
    const end = seam.at(-1)!;
    assert.ok(Math.abs(Math.hypot(end.x - SUN.cx, end.y - SUN.cy) - SUN.r) < 1e-7);
    const forward = seam.map(point => `${point.x} ${point.y}`).join(' L ');
    const reverse = [...seam].reverse().slice(1).map(point => `${point.x} ${point.y}`).join(' L ');
    assert.ok(FRAGMENTS[PIECE_IDS[i]].path.includes(forward));
    assert.ok(FRAGMENTS[PIECE_IDS[(i + 2) % 3]].path.includes(reverse));
    assert.ok(FRAGMENTS[PIECE_IDS[i]].path.includes(` A ${SUN.r} ${SUN.r} 0 0 1 `));
  }
});

test('three sampled curved outlines have the area of their common opening', () => {
  const areas = PIECE_IDS.map(id => polygonArea(outlinePolyline(id, 720)));
  const circleArea = Math.PI * SUN.r ** 2;
  assert.ok(areas.every(area => area > circleArea * .29 && area < circleArea * .38));
  // Sampling 2,160 segments deliberately underestimates the true circular arcs.
  // The exact SVG paths use arc commands; they are not these polylines.
  assert.ok(Math.abs(areas.reduce((a, b) => a + b, 0) - circleArea) < .04);
});

test('dense deterministic coverage has one owner inside the disc and none outside', () => {
  const outlines = PIECE_IDS.map(id => outlinePolyline(id, 240));
  let checked = 0;
  for (let x = 12.173; x < 188; x += .79) {
    for (let y = 12.317; y < 188; y += .83) {
      const radialDistance = Math.hypot(x - SUN.cx, y - SUN.cy);
      // Avoid only the tiny curved-boundary approximation band, not shared seams.
      if (Math.abs(radialDistance - SUN.r) < .02) continue;
      const ownerCount = outlines.filter(outline => containsPoint(outline, { x, y })).length;
      assert.equal(ownerCount, radialDistance < SUN.r ? 1 : 0, `Unexpected coverage at ${x}, ${y}`);
      checked++;
    }
  }
  assert.ok(checked > 46000);
});

test('the assembled SVG reuses all exact paths and retains the authored seams', () => {
  const svg = sunSvg({ seams: true, rig: true });
  for (const id of PIECE_IDS) assert.ok(svg.includes(FRAGMENTS[id].path));
  for (const d of SEAMS) assert.ok(svg.includes(d));
  assert.equal((svg.match(/data-piece=/g) ?? []).length, 3);
  assert.ok(svg.includes('sun-rig'));
  assert.equal((sunSvg({ placed: ['A'] }).match(/fill="transparent"/g) ?? []).length, 2);
});

const chapters = Array.from({ length: 11 }, (_, i) => ({ top: i * 1500, height: 1500 }));
const input = { scrollY: 0, viewport: { width: 1440, height: 900 }, chapters };

test('all ten transition quarter frames are deterministic on reverse and direct entry', () => {
  for (let index = 0; index < 10; index++) {
    for (const progress of [0, .25, .5, .75, 1]) {
      const scrollY = chapters[index + 1].top - 900 + progress * 900;
      const direct = evaluateStory({ ...input, scrollY });
      evaluateStory({ ...input, scrollY: scrollY + 120 });
      const reverse = evaluateStory({ ...input, scrollY });
      assert.deepEqual(reverse, direct);
      assert.equal(direct.transition?.index, index);
      assert.equal(direct.transition?.progress, progress);
    }
  }
});

test('loading and reduced motion do not change narrative identity or erase progress', () => {
  const scrollY = 8 * 1500 - 450;
  const normal = evaluateStory({ ...input, scrollY, assetsReady: Array(11).fill(true) });
  const fallback = evaluateStory({ ...input, scrollY, selectedMode: 'reduced', assetsReady: Array(11).fill(false) });
  assert.equal(normal.activeIndex, fallback.activeIndex);
  assert.equal(normal.storyProgress, fallback.storyProgress);
  assert.deepEqual(normal.transition, fallback.transition);
  assert.equal(fallback.assetReady, false);
  assert.equal(fallback.reduced, true);
  assert.equal(evaluateStory({ ...input, scrollY: Number.NaN }).storyProgress, 0);
  assert.equal(evaluateStory({ ...input, scrollY: 100000 }).activeIndex, 10);
});

test('untrusted saved state cannot add a fourth piece or lift an incomplete disc', () => {
  assert.deepEqual(sanitizeStoryMemory(null), initialStoryMemory());
  assert.deepEqual(sanitizeStoryMemory({ version: 2, found: ['A'] }), initialStoryMemory());
  const safe = sanitizeStoryMemory({ version: 1, found: ['A', 'A', 'D', 'B'], placed: ['A', 'D'], sunLifted: true, wheelSteady: 'true' });
  assert.deepEqual(safe.found, ['A', 'B']);
  assert.deepEqual(safe.placed, ['A']);
  assert.equal(safe.sunLifted, false);
  assert.equal(safe.wheelSteady, false);
});

test('recovered discovery outcomes agree with inventory without collecting a skipped repair', () => {
  const recovered = sanitizeStoryMemory({
    version: 1, found: [], marketRepaired: true, wheelSteady: true, shadeLifted: true,
  });
  assert.deepEqual(recovered.found, ['A', 'B', 'C']);
  const resetScene = sanitizeStoryMemory({ version: 1, found: ['B'], wheelSteady: false });
  assert.deepEqual(resetScene.found, ['B']);
  assert.equal(resetScene.wheelSteady, false);
  const skippedRepair = sanitizeStoryMemory({
    version: 1, found: [], placed: ['A', 'B', 'C'], sunLifted: true,
  });
  assert.deepEqual(skippedRepair.found, []);
  assert.deepEqual(skippedRepair.placed, ['A', 'B', 'C']);
  assert.equal(skippedRepair.sunLifted, true);
});

test('the complete narrative has eleven two-beat chapters and ten five-stage boundaries', () => {
  assert.equal(CHAPTERS.length, 11);
  assert.equal(TRANSITIONS.length, 10);
  assert.equal(new Set(CHAPTERS.map(chapter => chapter.id)).size, 11);
  CHAPTERS.forEach((chapter, i) => {
    assert.equal(chapter.number, i + 1);
    assert.equal(chapter.beats.length, 2);
    assert.ok(chapter.beats.every(beat => beat.length > 70));
    assert.ok(chapter.incoming && chapter.outgoing && chapter.readingNote);
  });
  TRANSITIONS.forEach((transition, i) => {
    assert.equal(transition.from, i);
    assert.equal(transition.to, i + 1);
    assert.equal(transition.stages.length, 5);
  });
  assert.equal(/[\u3400-\u9fff]/u.test(JSON.stringify([CHAPTERS, TRANSITIONS])), false);
});

test('rendered fixture, carrier and worktable states give every gold fragment exactly one owner', () => {
  const ids = (markup: string) => [...markup.matchAll(/data-piece="([ABC])"/g)].map(match => match[1]).sort();
  for (const mobile of [false, true]) {
    for (let foundMask = 0; foundMask < 8; foundMask++) {
      for (let sceneFlags = 0; sceneFlags < 8; sceneFlags++) {
        const memory = sanitizeStoryMemory({
          ...initialStoryMemory(),
          found: PIECE_IDS.filter((_, i) => foundMask & (1 << i)),
          marketRepaired: Boolean(sceneFlags & 1),
          wheelSteady: Boolean(sceneFlags & 2),
          shadeLifted: Boolean(sceneFlags & 4),
        });
        for (const index of [4, 5, 6, 7]) {
          assert.deepEqual(ids(renderProps(index, memory, mobile)), [...memory.found],
            `Duplicate or missing fixture/carrier piece: chapter ${index + 1}, mobile=${mobile}, found=${foundMask}, flags=${sceneFlags}`);
        }
        for (let placedMask = 0; placedMask < 8; placedMask++) {
          memory.placed = PIECE_IDS.filter((_, i) => placedMask & (1 << i));
          const loose = ids(renderProps(8, memory, mobile));
          const filled = [...sunSvg({ placed: memory.placed }).matchAll(/<path data-piece="([ABC])"[^>]*fill="([^"]+)"/g)]
            .filter(match => match[2] !== 'transparent').map(match => match[1]);
          assert.deepEqual([...loose, ...filled].sort(), [...PIECE_IDS],
            `Worktable and joined disc must share three pieces: mobile=${mobile}, placed=${placedMask}`);
          assert.ok(memory.placed.every(id => !loose.includes(id)), 'A placed piece cannot also remain in the loose table holder.');
        }
      }
    }
  }
});
