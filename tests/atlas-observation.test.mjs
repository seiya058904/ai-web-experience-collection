import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { observationRadius } from "../experiences/atlas/src/world/observation.ts";

const meta = JSON.parse(readFileSync(new URL("../public/atlas/data/terrain.json", import.meta.url), "utf8"));
const bounds = {
  west: meta.anchor.u * meta.widthMeters / 1000,
  east: (1 - meta.anchor.u) * meta.widthMeters / 1000,
  north: meta.anchor.v * meta.depthMeters / 1000,
  south: (1 - meta.anchor.v) * meta.depthMeters / 1000,
};

test("Observation window leaves early scales and full Time composition intact and is reversible", () => {
  for (const progress of [0, .08, .156, .25, .34, .465, .555, .66, .76, .814999])
    for (const span of [.4, 1, 3, 5, 42, 6000]) assert.equal(observationRadius(progress, span), 50);
  assert.equal(observationRadius(.837, .46), 50);
  assert.equal(observationRadius(.9, 0), 50);
  assert.equal(observationRadius(.9, NaN), 50);
  const states = [[.837, .46], [.87, 3], [.875618, 5], [.91, 290]];
  assert.deepEqual(states.map(([p, s]) => observationRadius(p, s)),
    states.toReversed().map(([p, s]) => observationRadius(p, s)).reverse());
});

test("Final field fits inside all factual bounds before their earliest viewport re-entry", () => {
  const initial = observationRadius(.837, .46), final = observationRadius(.9, 5);
  for (const x of [-bounds.west, bounds.east])
    for (const z of [-bounds.north, bounds.south]) assert.ok(Math.hypot(x, z) < initial);
  assert.ok(Math.abs(final - 10.9) < 1e-12);
  for (const margin of Object.values(bounds)) assert.ok(margin - final > 2.7);
  assert.ok(observationRadius(.875618, 5) < bounds.north);
  assert.ok(5 < 5.75776, "Window complete before independently projected earliest tablet feather edge at 5.75776 km");
  assert.equal(observationRadius(.877145, 5.75776), final);
});

test("Late log-scale radius is monotone and has zero endpoint velocity", () => {
  let prior = 50;
  for (let i = 0; i <= 1000; i++) {
    const span = Math.exp(Math.log(5) * i / 1000), radius = observationRadius(.89, span);
    assert.ok(radius <= prior + 1e-12 && radius >= 10.9 - 1e-12);
    prior = radius;
  }
  const h = 1e-4;
  assert.ok(Math.abs((observationRadius(.89, 1 + h) - 50) / h) < 1e-4);
  assert.ok(Math.abs((10.9 - observationRadius(.89, 5 - h)) / h) < 1e-4);
});
