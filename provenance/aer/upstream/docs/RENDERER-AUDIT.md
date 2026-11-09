# AER — Renderer CPU and source review

Reviewed 2026-11-09 against `src/scene.ts`, `src/balloon.ts`, `src/journey.ts` and `tests/scene-invariants.test.ts`. This is a geometry, budget and source review. It is **not a WebGL visual acceptance or performance result**. The available cloud Chrome cannot create a WebGL context; browser observations and final package checks belong in [VERIFICATION.md](VERIFICATION.md).

## Drawing-buffer budget

`drawingBudget()` keeps CSS composition dimensions separate from the renderer's pixel buffer. The camera aspect ratio follows the CSS viewport; a large display may receive fewer drawing pixels without changing the layout or camera aspect ratio.

| Constraint | Desktop | Mobile |
| --- | --- | --- |
| Maximum requested device pixel ratio | 1.75 | 1.4 |
| Maximum drawing-buffer pixel count | 4,200,000 | 2,000,000 |
| Maximum single drawing dimension | The smaller of 8,192 and the reported renderbuffer limit | The same hardware-aware limit |

The helper clamps invalid/non-finite dimensions and density to finite usable values, limits CSS dimension inputs to 16,384, and accounts for very narrow or tall buffers. It can select a ratio below 1 for a large CSS viewport. This is an intentional rendering-cost limit, not a claim of native-resolution 4K rendering. `resizeDrawingBuffer()` changes the buffer only when its resulting dimensions change. Runtime statistics expose actual buffer dimensions, pixel count, draw calls, triangles and resource counts when WebGL is available; no values from that unobserved hardware path are claimed here.

## Geometry and grounding corrections

| Finding | Implemented correction | Evidence and limit |
| --- | --- | --- |
| A coarse ground triangle can interpolate above the finer field and obscure it or intersect grounded objects. | The distant 24-unit-cell underlay is lowered by 0.16 fictional units. Fine fields and grounded objects still use the shared analytic height field. | Source reviewed. This offset has not received a real-WebGL visual inspection in this environment. |
| Large center-to-edge landing triangles could cut through the curved terrain. | Each landing patch now has eight radial rings and 64 angular segments, with vertices 0.035 fictional units above the height field. | CPU tests sample interior points in every triangle of all three patches and require clearance between 0.028 and 0.042. These samples do not constitute a proof about every rasterized pixel. |
| Scaling the resting envelope horizontally pulled its mouth away from the suspension endpoints. | The preset changes only vertical extent around the fixed mouth; X/Z mouth coordinates and the four rigging endpoints stay unchanged. | CPU tests check endpoint positions, physical mouth-ring intersection, finite geometry data, repeatable return to held bounds and no replacement geometry allocation during repeated preset changes. |
| A gathered rope authored on a flat plane could intersect a sloping final meadow. | Original rope vertices are cached. On a changed landing position, each vertex is offset by the local terrain height relative to the basket's ground height; normals and bounds are refreshed. | Source reviewed. Starting from cached vertices avoids accumulating deformation between choices. Gathered-rope appearance is not covered by the suspension test and remains visually unverified on WebGL. |

The projected envelope shadow has separate held/rest outlines and includes the rest preset in its update key. The basket, contact shadow, landing patches and rope use the same terrain function. Those source relationships help maintain consistent contact, but do not establish final framing, softness, occlusion or contact appearance without rendered evidence.

## Ownership and determinism reviewed in source

The scene consumes the deterministic journey state and a caller-owned decorative clock. It has no internal animation loop. Landscape variation uses fixed seeds. Shared geometry and materials are retained across route changes; disposal deduplicates geometries, materials and textures, disposes the renderer and clears the scene. These are source findings, not a measured browser leak or long-session stability result.

The shared `reducedSceneState()` helper selects fixed chapter states and three distinct arrival stages without advancing a common-prefix view past the decision boundary. Its regression test covers all wind choices, fixed-state repeatability and repeated application. This verifies the state-selection rule; visible behavior of each renderer remains a separate integration check.

## Observed automated result

On Node v24.22.1, `node --test --test-reporter=spec tests/*.test.ts` completed with **25 passing tests and 0 failures**: 14 journey tests, 8 keepsake tests and 3 scene CPU invariant tests. The scene tests inspect Three.js geometry on the CPU with a minimal canvas stub where needed; they do not create a WebGL context, draw an image or measure speed.

Real-WebGL composition, shadow appearance, contact intersections, cross-media transitions, GPU allocation behavior and frame rate remain outside this audit's observed evidence.
