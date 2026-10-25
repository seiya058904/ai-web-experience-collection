import test from 'node:test';
import assert from 'node:assert/strict';
import { createTheatre } from '../experiences/backstage/src/theatre.js';
import { mechanism } from '../experiences/backstage/src/state.js';

// Read the same dimensions used to construct the meshes. Importing this module
// does not create a WebGL context. There is no source parsing or eval here.
const flats = createTheatre.scenicLayout();
const lift = createTheatre.geometryLayout().dimensions;
const SAMPLE_INTERVALS = 1000;
const EPSILON = 1e-9;
const FLAT_BOTTOM = .20;

// Core flat, painted reverse and timber backing; the window projection and
// pivot fittings are outside this check. The jack is a separate envelope.
const flatEnvelope = width => [-width / 2, width / 2, -.39, .11];
const jackEnvelope = [-.05, .05, -.64, -.25];

/** Three.js positive Y rotation, projected into the X/Z ground plane. */
function rectangle(cx, cz, [minX, maxX, minZ, maxZ], yaw) {
  const cosine = Math.cos(yaw), sine = Math.sin(yaw);
  return [[minX, minZ], [maxX, minZ], [maxX, maxZ], [minX, maxZ]]
    .map(([x, z]) => [cx + cosine * x + sine * z, cz - sine * x + cosine * z]);
}

/**
 * Convex-polygon separating-axis test. A positive result supplies a separating
 * projection gap; a negative result is penetration on every candidate axis.
 * Normals are normalized so EPSILON is in model units, not edge-length units.
 */
function separatingGap(a, b) {
  let largestGap = -Infinity;
  for (const polygon of [a, b]) {
    for (let i = 0; i < polygon.length; i++) {
      const p = polygon[i], q = polygon[(i + 1) % polygon.length];
      const dx = q[0] - p[0], dz = q[1] - p[1];
      const length = Math.hypot(dx, dz);
      assert.ok(length > EPSILON, 'a collision envelope has a degenerate edge');
      const nx = -dz / length, nz = dx / length;
      const project = points => points.map(([x, z]) => x * nx + z * nz);
      const ap = project(a), bp = project(b);
      const gap = Math.max(Math.min(...bp) - Math.max(...ap), Math.min(...ap) - Math.max(...bp));
      largestGap = Math.max(largestGap, gap);
    }
  }
  return largestGap;
}

function assembliesAt(world) {
  const cue = mechanism(world);
  const parts = flats.flatMap(([x, z, width, , baseYaw], index) => {
    const yaw = baseYaw + cue.flatAngles[index];
    return [
      { name: `flat ${index + 1}`, family: `flat-${index}`, scenic: true,
        polygon: rectangle(x, z, flatEnvelope(width), yaw) },
      { name: `jack ${index + 1}`, family: `flat-${index}`, scenic: true,
        polygon: rectangle(x, z, jackEnvelope, yaw) },
    ];
  });

  // Union envelope of the actual landing and its front step. Both use the
  // same revolve origin as the door and waves. It deliberately fills corners
  // of the footprint that are empty in the detailed model.
  parts.push({ name: 'door landing', family: 'door', scenic: false,
    polygon: rectangle(0, 0, [1.24 - 1.06, 1.24 + 1.06, -1.52 - .55, -1.52 + .76], cue.turn) });

  lift.rows.forEach((row, index) => {
    const liftY = lift.parkedY + (lift.raisedY - lift.parkedY) * cue.waves[index];
    // .61 + .14 + .035 is an upper bound on the two sine-wave crest terms.
    // Including the .009 crest tube gives .794; .80 is conservative. Treat
    // the whole board as that height and fill its rail notch for this test.
    if (liftY + .80 <= FLAT_BOTTOM) return;
    const halfWidth = row.width / 2 + lift.horizontalTravel + .01;
    const frontDepth = lift.boardDepth / 2 + .014; // crest centre + tube radius
    parts.push({ name: `wave ${index + 1}`, family: `wave-${index}`, scenic: false,
      polygon: rectangle(0, 0, [-halfWidth, halfWidth, row.z - lift.boardDepth / 2, row.z + frontDepth], cue.turn) });
  });
  return parts;
}

test('scenic flats and attached jacks clear other flats, the door landing and raised waves over 1,001 mechanism samples', t => {
  assert.equal(flats.length, 4);
  for (const spec of flats) {
    assert.equal(spec.length, 5);
    assert.ok(spec.every(Number.isFinite));
    assert.ok(spec[2] > 0 && spec[3] > 0);
  }

  // A tiny independent sanity check ensures the SAT does not pass everything:
  // rotation must not turn an intersecting pair into a claimed separation.
  const unit = rectangle(0, 0, [-1, 1, -1, 1], 0);
  assert.ok(separatingGap(unit, rectangle(.3, .2, [-1, 1, -1, 1], .7)) < 0);
  assert.ok(separatingGap(unit, rectangle(4, 0, [-1, 1, -1, 1], .7)) > 0);

  let checks = 0, smallestGap = Infinity, closestPair = '', closestWorld = 0;
  const violations = [];
  for (let sample = 0; sample <= SAMPLE_INTERVALS; sample++) {
    const world = sample / SAMPLE_INTERVALS;
    const parts = assembliesAt(world);
    for (let a = 0; a < parts.length; a++) {
      for (let b = a + 1; b < parts.length; b++) {
        const first = parts[a], second = parts[b];
        // A jack is intentionally attached to its own flat. Wave-vs-wave and
        // wave-vs-door checks require height/notch detail and are out of scope.
        if (first.family === second.family || (!first.scenic && !second.scenic)) continue;
        checks++;
        const gap = separatingGap(first.polygon, second.polygon);
        if (gap < smallestGap) {
          smallestGap = gap;
          closestPair = `${first.name} / ${second.name}`;
          closestWorld = world;
        }
        if (gap < -EPSILON && violations.length < 12) {
          violations.push(`${first.name} intersects ${second.name} at world=${world.toFixed(3)} (SAT gap ${gap.toFixed(6)})`);
        }
      }
    }
  }
  assert.ok(checks >= (SAMPLE_INTERVALS + 1) * 32, 'the complete comparison set must run');
  assert.deepEqual(violations, [], `Scenery clearance regression:\n${violations.join('\n')}`);

  // SEA -> NIGHT does not move these particular assemblies. If that changes,
  // extend the sampling domain rather than silently claiming coverage of it.
  const sea = mechanism(1), night = mechanism(2);
  for (const key of ['flatAngles', 'waves', 'turn']) assert.deepEqual(night[key], sea[key], `${key} now requires night-path sampling`);

  t.diagnostic(`${SAMPLE_INTERVALS + 1} poses; ${checks} pair comparisons; no sampled envelope overlap.`);
  t.diagnostic(`Smallest sampled separating-axis gap: ${smallestGap.toFixed(6)} model units (${closestPair}, world=${closestWorld.toFixed(3)}).`);
});
