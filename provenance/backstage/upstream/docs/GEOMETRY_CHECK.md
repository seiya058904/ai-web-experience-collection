# Scenic clearance regression

## Purpose

`tests/scenic-clearance.test.mjs` checks that the widened scenic flats and their attached rear jacks do not intersect the other checked assemblies during the ROOM-to-SEA mechanism path. It is a CPU geometry regression. It creates no browser or WebGL context and does not judge rendered appearance.

Run it from the project directory:

```sh
node --test tests/scenic-clearance.test.mjs
```

The standard `npm test` command includes it. For the detailed per-test diagnostics in environments that summarize isolated test files, run:

```sh
node tests/scenic-clearance.test.mjs
```

## Geometry source and method

The test imports the actual stage factory and reads `createTheatre.scenicLayout()` for the four frozen `[x, z, width, height, baseYaw]` tuples. It reads wave dimensions, lift heights and sway amplitude from `createTheatre.geometryLayout().dimensions`. It never parses source code or evaluates a string. `mechanism(world)` supplies the same four rotation angles, three lift progress values and revolve angle used by the renderer.

Each rectangle uses the Three.js positive-Y rotation convention:

```text
x' = cx + cos(yaw) × x + sin(yaw) × z
z' = cz − sin(yaw) × x + cos(yaw) × z
```

The flat and jack rotate about their own scenic pivot by `baseYaw + flatAngles[index]`. The door landing and wave footprints rotate about the common revolve origin. This matters: a translation followed by the wrong sign of rotation would test a different motion from the real stage.

Two convex footprints are compared with the separating-axis theorem. The test projects both rectangles onto normals from all of their edges. A separating projection proves that those footprints do not overlap at that sample. Normals are normalized, so the numerical tolerance of `1e-9` is expressed in model units. The test also verifies a known overlapping pair and a separated pair before examining the stage.

## Checked envelopes

All values are original artistic model units, not physical construction dimensions.

| Assembly | Ground-plane envelope | Treatment |
| --- | --- | --- |
| Scenic flat core | Local X `±width/2`; Z `[-0.39, 0.11]` | Encloses the panel, painted reverse, rear timber and diagonal backing. |
| Attached jack | Local X `±0.05`; Z `[-0.64, -0.25]` | Separate envelope, rotated with its own flat. |
| Door landing | X `1.24 ± 1.06`; Z `[-1.52 − 0.55, -1.52 + 0.76]` | Conservative rectangle around the landing and front step, rotated with the revolve. |
| Raised wave board | Full row width, full `±horizontalTravel` sway and `0.01` edge allowance; actual back thickness and front crest allowance | Includes the entire sway range at every sample and fills the rail notch. |

A wave is included as an obstacle once its conservative top height exceeds the flat base at Y `0.20`. Its top bound is `liftY + 0.80`: the board’s two sine terms have a combined upper bound of `0.785`, and the crest tube adds `0.009`. The front envelope extends to `boardDepth/2 + 0.014`, covering the crest’s forward offset and tube radius. This is slightly more conservative than checking only the board body at approximately Z `±0.04`.

Parts of the same flat assembly intentionally meet and are not checked against each other. Every flat core and jack is checked against the cores and jacks of the other flats, the door landing, and each wave whose height requires it. The comparison-set count is guarded so a filtering mistake cannot silently omit the bulk of the checks.

## Actual run

On 24 October 2026, using Node.js `v24.22.1` in the local Linux execution environment:

- **1,001 poses** sampled uniformly at world coordinates `0.000` through `1.000`, including both stable endpoints.
- **38,792 pair comparisons** executed.
- **No sampled envelope overlap** found.
- The smallest sampled separating-axis gap was **0.119955 model units**, between flat 3 and the door landing at world `0.273`.
- The isolated test command and direct diagnostic invocation both completed successfully.

That last number is the smallest recorded separating-axis projection gap. It is not a certified minimum Euclidean clearance for every mesh at every instant.

In the current mechanism, flat rotations, wave lifts and revolve rotation are clamped at the SEA pose for the SEA-to-NIGHT interval. An endpoint guard verifies that the corresponding NIGHT values still match SEA. The moon and star backing have their own motion and are outside this test.

## Scope and limits

This is a finite set of conservative two-dimensional envelope checks, not continuous collision detection or a full collision certificate. It does not prove clearance between the sampled coordinates. The use of whole rectangles, filled notches and maximum wave heights can reject a geometrically safe design; such a result requires inspection rather than weakening the tolerance.

The following are outside its proof: the window’s front projection, pivot fittings, proscenium and curtains, sky and night backing, moon and suspension, lantern and full rail assembly, wave-to-wave contact, and wave-to-door contact. Those relationships depend on additional height, notch or detailed mesh information and require the browser review and other geometry checks. The separate `tests/geometry.test.mjs` covers the wave trap openings, fixed floor, guide capture and parked clearances.

If panel construction, the jack, door landing or wave crest geometry changes, update the documented envelopes deliberately. The imported layout prevents stale pivot positions and widths; it does not automatically infer every new mesh protrusion. Screenshots and real-time forward/reverse inspection remain necessary for camera occlusion, support continuity, material quality and the absence of visible clipping.
