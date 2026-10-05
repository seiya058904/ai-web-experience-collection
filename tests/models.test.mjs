import test from "node:test";
import assert from "node:assert/strict";
import {
  aerodynamicForces,
  raceStrategy,
  projectCircuit,
  PIT_LOSS,
} from "../src/models.ts";

test("air forces are quadratic at fixed posture, normalized at 240 km/h", () => {
  assert.equal(aerodynamicForces(240, "corner").downforce, 1);
  assert.equal(
    aerodynamicForces(240, "corner").downforce /
      aerodynamicForces(120, "corner").downforce,
    4,
  );
});
test("straight mode trades downforce for reduced drag", () => {
  const corner = aerodynamicForces(300, "corner");
  const straight = aerodynamicForces(300, "straight");
  assert.ok(straight.drag < corner.drag);
  assert.ok(straight.downforce < corner.downforce);
});
test("model input cannot produce nonfinite or out-of-range results", () => {
  assert.deepEqual(
    aerodynamicForces(NaN, "corner"),
    aerodynamicForces(240, "corner"),
  );
  assert.deepEqual(
    aerodynamicForces(999, "straight"),
    aerodynamicForces(340, "straight"),
  );
  assert.equal(raceStrategy(-1).pitLap, 10);
  assert.equal(raceStrategy(100).pitLap, 38);
});
test("one-stop strategy contains 52 laps and includes pit loss exactly once", () => {
  const result = raceStrategy(20);
  assert.equal(result.laps.length, 52);
  assert.equal(
    result.total,
    result.laps.reduce((sum, lap) => sum + lap, 0) + PIT_LOSS,
  );
});
test("tyre age resets on the first lap following the stop", () => {
  const result = raceStrategy(24);
  assert.equal(result.laps[0], 89.8);
  assert.equal(result.laps[24], 90.3);
  assert.ok(result.laps[24] < result.laps[23]);
  assert.ok(result.laps[25] > result.laps[24]);
});
test("earlier is not always better; strategy produces a real optimum", () => {
  const results = Array.from({ length: 29 }, (_, i) => raceStrategy(10 + i));
  const best = results.reduce((a, b) => (a.total < b.total ? a : b));
  assert.ok(best.pitLap > 10 && best.pitLap < 38);
  assert.ok(best.total < results[0].total && best.total < results.at(-1).total);
});
test("map projection preserves uniform scale and stays within its frame", () => {
  const points = projectCircuit([
    [0, 0],
    [0.01, 0],
    [0.01, 0.01],
    [0, 0.01],
    [0, 0],
  ]);
  assert.deepEqual(points[0], points.at(-1));
  points.forEach(([x, y]) => {
    assert.ok(x >= 44 && x <= 676);
    assert.ok(y >= 44 && y <= 396);
  });
  const dx = points[1][0] - points[0][0];
  const dy = points[0][1] - points[3][1];
  assert.ok(Math.abs(dx / dy - 1) < 0.0001);
});
