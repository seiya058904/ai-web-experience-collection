import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import * as THREE from "three";
import ts from "typescript";
import { evaluateStory } from "../experiences/atlas/src/story.ts";

// Load the actual class without writing a build. The browser source uses an
// extensionless Vite import; Node receives only equivalent absolute module URLs.
const source = readFileSync(new URL("../experiences/atlas/src/world/city.ts", import.meta.url), "utf8");
let code = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
for (const name of ["three", "three/addons/lines/Line2.js",
  "three/addons/lines/LineGeometry.js", "three/addons/lines/LineMaterial.js"])
  code = code.replace(`from "${name}"`, `from ${JSON.stringify(import.meta.resolve(name))}`);
code = code.replace('from "../geo"',
  `from ${JSON.stringify(new URL("../experiences/atlas/src/geo.ts", import.meta.url).href)}`);
const { CityLayer } = await import("data:text/javascript;base64," + Buffer.from(code).toString("base64"));

function fixture() {
  const layer = new CityLayer();
  const project = ([x, z], offset = 0) => new THREE.Vector3(x, offset, z);
  // A short fixture isolates the real route geometry/update from the expensive
  // city footprint load. It does not stub the visibility or material behavior.
  layer.buildRoute({ features: [{ geometry: {
    type: "LineString", coordinates: [[0, 0], [0.2, 0.3], [0.4, 0.4]],
  } }] }, project, (a, b, offset) => [project(a, offset), project(b, offset)], false);
  layer.ready = true;
  const start = layer.group.getObjectByName("Registered route start");
  assert.ok(start instanceof THREE.Mesh);
  assert.equal(start.geometry.index.count, 192, "The actual 64-triangle ring reported by browser QA");
  const inVisibleTraversal = () => {
    let present = false;
    layer.group.traverseVisible(object => { if (object === start) present = true; });
    return present;
  };
  return { layer, start, inVisibleTraversal };
}

test("zero-alpha route start never enters visible traversal, including reverse and resumed city", () => {
  const { layer, start, inVisibleTraversal } = fixture();
  assert.equal(start.material.opacity, 0);
  assert.equal(start.visible, false, "Loading cannot briefly expose an uninitialized transparent ring");
  for (const [p, expected] of [[.695, false], [.775, true], [.835, true],
    [.695, false], [.5, false], [.775, true], [.695, false]]) {
    layer.update(evaluateStory(p, false), 0);
    assert.equal(inVisibleTraversal(), expected, `Route-start draw eligibility at p=${p}`);
    if (expected) assert.ok(start.material.opacity > 0, "Visible route start still contributes");
    else if (layer.group.visible) assert.equal(start.material.opacity, 0);
  }
});

test("route start culling removes only exact zero, retaining arbitrarily small positive exposure", () => {
  const { layer, start, inVisibleTraversal } = fixture();
  const city = evaluateStory(.695, false);
  layer.update({ ...city, route: 1e-9 }, 0);
  assert.ok(start.material.opacity > 0 && start.material.opacity < 1e-10);
  assert.equal(inVisibleTraversal(), true, "No added visibility threshold may trim genuine contribution");
  layer.update({ ...city, route: 0 }, 0);
  assert.equal(start.material.opacity, 0);
  assert.equal(inVisibleTraversal(), false);
});
