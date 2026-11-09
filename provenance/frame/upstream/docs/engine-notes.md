# FRAME performance engine

`src/timeline.ts` is a deterministic, DOM-free model. Frame numbers are **1–24** throughout the public API. A frame is a distinct authored pose; a beat is one 1/12-second display interval. Holding a pose repeats its frame number and never claims to create another pose.

## Public contract

- `DEFAULT_CONFIG`: frozen `{ preset: 'even', hold6: 0, hold18: 0 }`.
- `PRESETS`: `even`, `ease-in`, `ease-out`.
- `sanitizeConfig(unknown)`: creates a frozen safe config, rounding finite numeric holds and clamping them to 0–12. Unknown values revert to documented defaults.
- `getPose(frame, preset)`: a deeply frozen, cached complete pose with body position/compression, lean, permanent-fold offset, gaze, mouth, two feet, two hand contact anchors, block position, story phase and English description.
- `pushPositions(preset)`: six actual block centers; the shared endpoints are −1.6 and 1.35.
- `makeTimeline(config)`: immutable config snapshot, `beats`, 24 timing `segments`, `totalBeats`, `duration` in seconds, `durationMs` and `fps`.
- `frameAtBeat`, `frameAtTime`, `beatForFrame`, `stepFrame`: bounded seek and independent-frame stepping helpers.
- `createHistory`, `editHistory`, `undoHistory`, `resetHistory`: immutable edit history with a 64-entry cap. No-op edits do not consume history; resetting is undoable.

## Geometry conventions

World y points up; the tabletop is y = 0. The block is .8 wide and .72 tall, with its center at y = .36. Boop's body center is approximately y = .95; the intended body envelope is about 1.3 wide × 1.48 high. Foot y coordinates refer to the **sole**, so the renderer must add its foot mesh half-height. Hand coordinates refer to the surface contact point, so a sphere/palm renderer must offset its center by its own radius rather than burying it in the block.

Every push take regenerates the body, hand endpoints, feet and effort from its position table. The two endpoint poses, and every pose outside frames 8–11, are the exact same cached objects across all three takes. Frames 12→13 therefore have a common raccord, independent of the selected preset. Authored permanent surface detail belongs to the model and must not be randomized in a renderer.

The model includes at least one planted foot in every pose, a stationary support foot in each interior push step, hand contact during the push and correction, and exact final block alignment. Numerical contact checks do **not** certify the final mesh, texture, camera framing or visual contact; those require rendered/browser inspection.

## Playback integration

Use elapsed **active playback time** with `frameAtTime`; do not feed wall time accumulated during hidden-tab or out-of-view pauses. Changing config should pause the current player, replace its immutable timeline, keep a valid selected frame, and require an explicit resume/restart. `stepFrame` moves among distinct poses, while `frameAtBeat` visits repeated holds.

Opening frame 1 and ending frame 24 each receive six additional beats. Frame 6 and frame 18 receive their respective selected additional holds. Thus `totalBeats = 36 + hold6 + hold18`; duration varies from 3 to 5 seconds.

## Verification

Run `node --experimental-strip-types --test tests/timeline.test.mjs` on Node 24. The suite checks 169 hold combinations, real spacing differences, exact common poses, actual changed limb/body data, contact/support constraints, time/beat/frame seeking, immutable export snapshots, and undo/reset behavior. It does not make visual, browser or physical-device claims.
