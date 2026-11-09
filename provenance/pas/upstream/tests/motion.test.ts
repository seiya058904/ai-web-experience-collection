import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  CHARACTER_METRICS, CHAPTER_POSES, comparePose, evaluateDance, solveTwoBone,
} from '../src/motion.ts';
import type { BodyPose, JointName, Vec3 } from '../src/motion-types.ts';

const ids = ['cen', 'cheng'] as const;
const sides = ['left', 'right'] as const;
const distance = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const j = (side: string, part: string) => `${side}${part}` as JointName;
const close = (a: number, b: number, tolerance = 1e-7) => assert.ok(Math.abs(a - b) <= tolerance, `${a} differs from ${b}`);
const finite = (p: Vec3) => p.every(Number.isFinite);

function maxPoseDistance(a: BodyPose, b: BodyPose): number {
  return Math.max(...Object.keys(a.joints).map(name => distance(a.joints[name as JointName], b.joints[name as JointName])));
}

test('random access, forward traversal and reversed traversal return identical complete poses', () => {
  let seed = 0x50a5;
  const positions = [0, 10, ...Array.from({ length: 250 }, () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 0xffffffff * 10;
  })];
  const direct = new Map(positions.map(t => [t, evaluateDance(t, { mode: 'echo', layout: 'narrow' })]));
  for (const t of [...positions].sort((a, b) => a - b)) assert.deepEqual(evaluateDance(t, { mode: 'echo', layout: 'narrow' }), direct.get(t));
  for (const t of [...positions].sort((a, b) => b - a)) assert.deepEqual(evaluateDance(t, { mode: 'echo', layout: 'narrow' }), direct.get(t));
});

test('all ten chapters and all nine transition intervals have valid independent states', () => {
  assert.equal(CHAPTER_POSES.length, 10);
  for (let chapter = 0; chapter < 10; chapter++) {
    const f = evaluateDance(chapter + .4);
    assert.equal(f.chapter, chapter);
    assert.equal(f.segment, 'chapter');
    if (chapter < 9) for (const u of [0, .25, .5, .75, 1]) {
      const t = chapter + .76 + .24 * u;
      const a = evaluateDance(t), b = evaluateDance(t);
      assert.deepEqual(a.poses, b.poses);
      for (const id of ids) for (const p of Object.values(a.poses[id].joints)) assert.ok(finite(p));
      if (u < 1) {
        assert.equal(a.transition, chapter);
        close(a.transitionProgress, u, 1e-12);
      }
    }
  }
});

test('measured arm, forearm, thigh and shin lengths remain constant through the full score', () => {
  for (let i = 0; i <= 2000; i++) {
    const f = evaluateDance(i / 200);
    for (const id of ids) for (const side of sides) {
      const p = f.poses[id].joints, l = CHARACTER_METRICS[id].lengths;
      close(distance(p[j(side, 'Shoulder')], p[j(side, 'Elbow')]), l.upperArm);
      close(distance(p[j(side, 'Elbow')], p[j(side, 'Wrist')]), l.forearm);
      close(distance(p[j(side, 'Hip')], p[j(side, 'Knee')]), l.thigh);
      close(distance(p[j(side, 'Knee')], p[j(side, 'Ankle')]), l.shin);
      close(distance(p[j(side, 'Wrist')], p[j(side, 'Hand')]), l.palm);
    }
  }
});

test('grounded feet never drift, swing feet remain above the floor, and support is never lost', () => {
  let previous = evaluateDance(0);
  for (let i = 1; i <= 10000; i++) {
    const f = evaluateDance(i / 1000);
    for (const id of ids) {
      const body = f.poses[id], old = previous.poses[id], m = CHARACTER_METRICS[id];
      assert.ok(body.feet.left.planted || body.feet.right.planted, `${id} loses both supports at ${f.t}`);
      for (const side of sides) {
        const foot = body.feet[side];
        assert.ok(foot.ankle[1] >= m.ankleHeight - 1e-9);
        assert.ok(foot.toe[1] >= m.joints[j(side, 'Toe')][1] - 1e-6);
        if (foot.planted && old.feet[side].planted) close(distance(foot.ankle, old.feet[side].ankle), 0, 1e-12);
      }
    }
    previous = f;
  }
});

test('the palm exchange and its handovers avoid the rendered hyperextended-wrist defect', () => {
  // A previous upright-hand target produced 110–119 degree bends even while
  // IK preserved limb lengths. Check the wrist relation, not just bone size.
  for (let i = 0; i <= 1130; i++) {
    const t = 1.76 + i / 1000, frame = evaluateDance(t);
    for (const id of ids) {
      const side = id === 'cen' ? 'right' : 'left';
      const pose = frame.poses[id], elbow = pose.joints[j(side, 'Elbow')], wrist = pose.joints[j(side, 'Wrist')];
      const forearm = wrist.map((v, k) => v - elbow[k]);
      const cosine = forearm.reduce((sum, v, k) => sum + v * pose.hands[side].forward[k], 0) / Math.hypot(...forearm);
      const degrees = Math.acos(Math.min(1, Math.max(-1, cosine))) * 180 / Math.PI;
      assert.ok(degrees < 75, `${id} wrist bends ${degrees} degrees at ${t}`);
      if (t >= 2 && t <= 2.76) assert.ok(degrees < 35, `${id} cannot sustain a relaxed palm exchange at ${t}`);
      assert.ok(pose.feet.left.planted && pose.feet.right.planted);
    }
  }
});

test('counterweight uses a stable grasp before outward movement and recovers before release', () => {
  const held = evaluateDance(2.89);
  assert.equal(held.contact.kind, 'grip');
  close(held.contact.strength, 1);
  for (let i = 0; i <= 150; i++) {
    const t = 2.89 + (3.90 - 2.89) * i / 150, f = evaluateDance(t);
    assert.equal(f.contact.kind, 'grip');
    close(distance(f.poses.cen.hands.right.position, [-.053, 1.18, .163]), 0);
    close(distance(f.poses.cheng.hands.left.position, [-.017, 1.18, .197]), 0);
    for (const id of ids) for (const side of sides) assert.ok(f.poses[id].feet[side].planted);
    for (const id of ids) {
      const side = id === 'cen' ? 'right' : 'left';
      assert.ok(f.poses[id].joints[j(side, 'Shoulder')][1] - f.poses[id].joints[j(side, 'Elbow')][1] > .10,
        `${id} raises the connecting elbow unnaturally during the modest counterweight`);
    }
  }
  const restored = evaluateDance(3.90), releasing = evaluateDance(3.94);
  for (const id of ids) {
    close(restored.poses[id].lean[0], 0);
    close(releasing.poses[id].lean[0], 0);
    close(restored.poses[id].root[0], id === 'cen' ? -.46 : .46);
  }
  assert.ok(releasing.contact.strength < 1);
  assert.equal(evaluateDance(4).contact.kind, 'none');
});

test('Echo produces a genuinely different independent phrase with identical start and end poses', () => {
  for (const t of [4, 4.76]) assert.deepEqual(evaluateDance(t, { mode: 'unison' }).poses, evaluateDance(t, { mode: 'echo' }).poses);
  const a = evaluateDance(4.29, { mode: 'unison' }), b = evaluateDance(4.29, { mode: 'echo' });
  assert.ok(maxPoseDistance(a.poses.cheng, b.poses.cheng) > .10);
  for (const t of [4.10, 4.25, 4.40, 4.60]) {
    const u = evaluateDance(t, { mode: 'unison' });
    close(u.poses.cen.phrasePhase, u.poses.cheng.phrasePhase);
    assert.equal(u.contact.kind, 'none');
  }
});

test('timing choice has no effect on any contact, walking, opening or ending chapter', () => {
  for (let i = 0; i <= 500; i++) {
    const t = i / 50;
    if (t >= 4 && t <= 4.76) continue;
    assert.deepEqual(evaluateDance(t, { mode: 'unison' }).poses, evaluateDance(t, { mode: 'echo' }).poses);
  }
});

test('all chapter edges, transition edges and authored phase edges are continuous', () => {
  const boundaries = [
    ...Array.from({ length: 9 }, (_, i) => i + 1),
    ...Array.from({ length: 9 }, (_, i) => i + .76),
    .28, .66, 1.17, 1.38, 1.67, 1.98, 2.16, 2.42, 2.58, 2.76, 2.89,
    3.15, 3.45, 3.90, 3.91, 3.935, 3.98, 4.83, 4.90, 5.06, 5.16,
    5.33, 5.40, 5.59, 5.62, 5.75, 5.78, 5.90, 6.08, 6.45,
    7.10, 7.12, 7.24, 7.27, 7.46, 7.52, 7.68, 8.10, 8.26, 8.42, 8.76,
  ];
  for (const t of boundaries) {
    const a = evaluateDance(t - 1e-6), b = evaluateDance(t + 1e-6);
    for (const id of ids) assert.ok(maxPoseDistance(a.poses[id], b.poses[id]) < .0001, `${id} has a discontinuity at ${t}`);
  }
});

test('dense intermediate sampling catches neither elbow/knee flips nor palm-basis singularities', () => {
  let previous = evaluateDance(0);
  for (let i = 1; i <= 10000; i++) {
    const f = evaluateDance(i / 1000);
    for (const id of ids) {
      assert.ok(maxPoseDistance(f.poses[id], previous.poses[id]) < .018, `${id} joint jump at ${f.t}`);
      for (const side of sides) {
        const a = f.poses[id].hands[side], b = previous.poses[id].hands[side];
        assert.ok(distance(a.forward, b.forward) < .10, `hand direction jump at ${f.t}`);
        assert.ok(distance(a.normal, b.normal) < .10, `palm normal jump at ${f.t}`);
        close(Math.hypot(...a.forward), 1);
        close(Math.hypot(...a.normal), 1);
        close(a.forward.reduce((sum, v, k) => sum + v * a.normal[k], 0), 0);
      }
    }
    previous = f;
  }
});

test('Cheng yields in depth, both dancers step, and identities survive the side exchange', () => {
  const start = evaluateDance(4.76), yielding = evaluateDance(5.25), end = evaluateDance(5.76);
  assert.ok(start.poses.cen.root[0] < start.poses.cheng.root[0]);
  assert.ok(yielding.poses.cheng.root[2] < yielding.poses.cen.root[2] - .35);
  assert.ok(end.poses.cen.root[0] > end.poses.cheng.root[0]);
  for (let i = 0; i <= 200; i++) {
    const t = 4.76 + i / 200, f = evaluateDance(t);
    const a = f.poses.cen.root, b = f.poses.cheng.root;
    assert.ok(Math.hypot(a[0] - b[0], a[2] - b[2]) > .45, `root paths collide at ${t}`);
  }
  for (const id of ids) assert.ok(distance(start.poses[id].feet.left.ankle, end.poses[id].feet.left.ankle) > .5);
});

test('back contact descends and rises together while all four supports remain fixed', () => {
  const a = evaluateDance(6.04), low = evaluateDance(6.48), rise = evaluateDance(6.96);
  assert.equal(a.contact.kind, 'back');
  assert.equal(low.contact.kind, 'back');
  for (const id of ids) {
    assert.ok(low.poses[id].root[1] < a.poses[id].root[1] - .18);
    assert.ok(rise.poses[id].root[1] > low.poses[id].root[1] + .18);
    for (const side of sides) {
      assert.deepEqual(a.poses[id].feet[side].ankle, low.poses[id].feet[side].ankle);
      assert.deepEqual(a.poses[id].feet[side].ankle, rise.poses[id].feet[side].ankle);
    }
  }
});

test('CH-08 is a new complete phrase: backs release, shoulder lines change, and hands reconnect', () => {
  const rising = evaluateDance(7.02), parallel = evaluateDance(7.24), arc = evaluateDance(7.51), held = evaluateDance(7.76);
  assert.equal(rising.contact.kind, 'back');
  assert.equal(parallel.contact.kind, 'none');
  close(parallel.poses.cen.rootYaw, parallel.poses.cheng.rootYaw);
  assert.ok(arc.poses.cheng.root[2] > parallel.poses.cheng.root[2] + .12);
  assert.deepEqual(arc.poses.cen.feet, parallel.poses.cen.feet);
  assert.equal(held.contact.kind, 'fingertips');
  assert.ok(maxPoseDistance(parallel.poses.cheng, held.poses.cheng) > .20);
});

test('finger release happens after the dancers own their weight, and response follows release', () => {
  const before = evaluateDance(8.05), releasing = evaluateDance(8.22), after = evaluateDance(8.43), answer = evaluateDance(8.61);
  for (const id of ids) {
    const side = id === 'cen' ? 'right' : 'left';
    close(before.poses[id].lean[0], 0);
    close(releasing.poses[id].lean[0], 0);
    assert.ok(releasing.poses[id].hands[side].fingers[1] < before.poses[id].hands[side].fingers[1]);
    assert.ok(before.poses[id].feet.left.planted && before.poses[id].feet.right.planted);
  }
  assert.equal(after.contact.kind, 'none');
  assert.ok(maxPoseDistance(after.poses.cheng, answer.poses.cheng) > .04);
});

test('the final fingertip contact agrees with the shipped finger geometry, not guessed reach', () => {
  const dot = (a: Vec3, b: Vec3) => a.reduce((sum, value, i) => sum + value * b[i], 0);
  const minus = (a: Vec3, b: Vec3): Vec3 => a.map((v, i) => v - b[i]) as Vec3;
  const unit = (a: Vec3): Vec3 => a.map(v => v / Math.hypot(...a)) as Vec3;
  const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const frame = evaluateDance(7.90), tips: Vec3[] = [];
  for (const id of ids) {
    const model = JSON.parse(readFileSync(new URL(`../public/assets/models/${id}.json`, import.meta.url), 'utf8'));
    const side = id === 'cen' ? 'right' : 'left', suffix = side === 'left' ? 'L' : 'R';
    const bones = new Map<string, { head: Vec3; tail: Vec3 }>(model.bones.map((b: { name: string; head: Vec3; tail: Vec3 }) => [b.name, b]));
    const rest = model.metrics.joints;
    const forward = unit(minus(rest[j(side, 'Hand')], rest[j(side, 'Wrist')]));
    const row = minus(bones.get(`finger2-1.${suffix}`)!.head, bones.get(`finger5-1.${suffix}`)!.head);
    const normal = unit(cross(forward, row)).map(v => v * (side === 'left' ? 1 : -1)) as Vec3;
    const across = unit(cross(forward, normal));
    const delta = minus(bones.get(`finger3-3.${suffix}`)!.tail, rest[j(side, 'Hand')]);
    const hand = frame.poses[id].hands[side];
    close(hand.fingers[2], 0); close(hand.spread, 0);
    const posedAcross = cross(hand.forward, hand.normal);
    tips.push(hand.position.map((v, i) => v + hand.forward[i] * dot(delta, forward) + hand.normal[i] * dot(delta, normal) + posedAcross[i] * dot(delta, across)) as Vec3);
  }
  const separation = distance(tips[0], tips[1]);
  assert.ok(separation > .005 && separation < .011, `distal fingertip separation is ${separation}`);
  const midpoint = tips[0].map((v, i) => (v + tips[1][i]) / 2) as Vec3;
  assert.ok(distance(midpoint, frame.contact.point!) < .001);
});

test('the ending is recognizably related to, but not a reuse of, the opening', () => {
  const a = comparePose('opening'), b = comparePose('ending');
  assert.ok(a.poses.cen.root[0] < 0 && b.poses.cen.root[0] > 0);
  assert.ok(a.poses.cheng.root[0] > 0 && b.poses.cheng.root[0] < 0);
  const startGap = Math.abs(a.poses.cen.root[0] - a.poses.cheng.root[0]);
  const endGap = Math.abs(b.poses.cen.root[0] - b.poses.cheng.root[0]);
  assert.ok(Math.abs(startGap - endGap) < .15);
  assert.notDeepEqual(a.poses.cen.hands.right, b.poses.cen.hands.right);
  assert.equal(b.contact.kind, 'none');
});

test('IK remains finite and preserves its lengths for degenerate and out-of-reach requests', () => {
  for (const end of [[0, 0, 0], [0, -20, 0], [.2, -.2, .2], [0, -.4, 0]] as Vec3[]) {
    const result = solveTwoBone([0, 0, 0], end, .25, .22, [0, -.5, 0]);
    assert.ok(finite(result.middle) && finite(result.end));
    close(distance([0, 0, 0], result.middle), .25);
    close(distance(result.middle, result.end), .22);
  }
});

test('invalid progress is bounded and bounded breath never displaces the supports', () => {
  assert.equal(evaluateDance(Number.NaN).t, 0);
  assert.equal(evaluateDance(-10).t, 0);
  assert.equal(evaluateDance(200).t, 10);
  for (const t of [.62, 3.56, 6.48, 7.76, 9.6]) {
    const a = evaluateDance(t, { breath: -100 }), b = evaluateDance(t, { breath: 100 });
    for (const id of ids) for (const side of sides) assert.deepEqual(a.poses[id].feet[side], b.poses[id].feet[side]);
  }
});
