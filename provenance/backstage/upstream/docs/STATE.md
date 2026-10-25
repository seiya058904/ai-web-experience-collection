# State ownership and reproducibility

`src/state.js` is a pure JavaScript module. It has no animation loop, DOM access, renderer reference or mutable scene objects. The application's sole ticker passes scroll progress and elapsed **seconds** to `tick`. The renderer applies one returned pose. `mechanism(pose.world)` describes the rigid assemblies on the same reversible path.

## Public API

```js
const director = createDirector(savedVersionOneObjectOrJSONString);
director.setScene('room'); // room | sea | night; invalid names are ignored
director.setView(0.5);     // 0 audience, 1 wings; finite numbers are clamped
director.setLight(0.5);    // low to high sidelight; changes no scene/view state
const pose = director.tick(pageProgress, deltaSeconds, {
  reducedMotion: false,
  visible: true,
});
director.reset();          // production only; never changes scroll progress
JSON.stringify(director.serialize());
director.inspect();        // serializable diagnostics; snapshots are immutable
```

The pose contains `world`, `view`, `light`, `lamp`, `doorGlow`, `act` (1–5), `mode`, `scene`, `target`, `busy` and `exitQ`. `scene` is the nearest stable scene; use `target` for the selected Scene button and cue-status text. `mode` is `author`, `director`, `handoff` or `ending`. World 0, 1 and 2 correspond to room, sea and night. Intermediate values are mechanism positions, never duplicate models.

## Motion lanes

`mechanism(world).flatAngles` order is left outer, left inner, right inner, right outer. Left and right turn outward with opposite signs; all final rotation magnitudes are π. The right outer flat turns at .06–.34 and the right inner at .24–.57. The left room remains through the midpoint: its outer flat turns at .48–.78 and inner flat at .53–.83. The front wave enters at .32–.64, the middle wave at .70–.94 and the rear wave at .83–1.00, after the wide inner flat has cleared. `waves` is still ordered back/middle/front. The renderer adds each flat's fixed stable yaw to its mechanism angle. Their below-deck storage is masked from the audience and visible from the wings. Physical lane clearance must be established in the geometry and inspected in rendered evidence. The module does not claim to simulate collision volumes. The lamp remains in its safe rail position through the first part of the scenery change. Its normalized rail coordinate is separate from the turntable angle, whose maximum is .05 radians.

## Clock and snapshot rules

- Before `.64`, the authored pose depends only on current scroll. The director's stored world, selected scene, view and light are not overwritten.
- The `.64–.68` entry bridge reconstructs its pose from current scroll and the preserved director parameters. It meets stored choices continuously, with no sudden reset on returning from earlier acts.
- In `.68–.82`, one finite cue advances toward the latest requested scene. Retargeting begins at the current world coordinate and replaces the old target. There is no queue.
- Crossing `.82` captures the current world, lamp, view, light, selected target and remaining safe path in a recursively frozen `exitSnapshot`.
- `.82–.94` reads only that snapshot and local scroll progress. Local cue time stays frozen. A stationary page cannot continue structural motion. Reversing visits exactly the same intermediate poses.
- A true return to Act IV restores the captured start and resumes the unfinished cue. Reverse motion within the handoff does not create new snapshots. A later exit after resumed local work captures its new pose **within the same production revision**. This is a deliberate continuity detail: the production revision changes only on user choices, while capture IDs can change after an actual exit/reentry cycle.
- A direct jump to the ending uses an existing validated snapshot or the saved production. Without one, it uses the canonical default NIGHT. Reloading an in-progress ending reconstructs the same handoff pose.
- Hidden tabs do not advance the local clock. A resumed delta is capped at 50 ms; missed time is not replayed.
- Reduced motion settles local cues at their selected stable states and uses immediate authored scene/view changes. All three director controls still work.

## Persistence

The version-1 save is a small JSON value. Scene names are allowlisted, numeric parameters bounded, unsupported versions or malformed JSON ignored, and mechanical snapshot values recomputed from the validated world coordinate. No file paths, code, URLs, or model transforms are accepted from storage. A stale exit snapshot is not serialized after new user work.

## Test scope

`node --test tests/state.test.mjs` checks author reconstruction and reversal, every directed scene pair, latest-target takeover, snapshot immutability and paused clocks, all five handoff samples in both directions, boundary continuity, direct skips, saved ending restoration, author replay, invalid saves, reduced motion, hidden tabs and reset scope. These are state tests; geometric non-intersection, lighting effect and visual quality require the browser evidence recorded elsewhere.

## Guided trap geometry refinement

The three wave boards, their captured sliders and their fixed guide rails now share the revolve coordinate system. Board widths are 6.9 / 5.4 / 5.6 model units at local Z −.53 / .83 / 2.18. The middle board is shorter to leave space beside the outer scenic flat's support. These are original miniature proportions, not industrial specifications.

The circular deck is built from four extruded segments. Each lift has a genuine open strip from Z −.16 to +.10 relative to its lane. The underlying stationary planks are cut by the swept footprint of those openings over the complete 0–.05-radian turn, including horizontal wave travel and a small numerical margin. Cuts remain beneath the 3.72-radius revolve. Plank lines stop at the openings instead of bridging them. The rim, shaft and prop coordinates share one central axis.

Parked board bottoms are at Y −1.10, above the base plate's Y −1.18 top, with .08 clearance. Tall beams no longer cross the parking volume. Short hollow sliders stay captured by rails from Y −1.10 to +.36; their .16-wide opening accommodates the .055 lateral motion around a .028-wide guide. Guide feet meet the base plate, and slider solids stay inside the real trap slots during travel.

`tests/geometry.test.mjs` inspects the same polygon plan used to build the meshes, without a browser. It samples board and slider clearances against the rotating deck and stationary plank openings, checks vertical parking/guide engagement, and verifies retained floor away from the openings. It does not certify every scenic flat intersection or prove a good-looking rendered frame; those remain browser checks.

## Sampled scenic separation

`tests/scenic-clearance.test.mjs` adds 1,001 samples of the actual `scenicLayout()` and `geometryLayout()` dimensions. It checks conservative horizontal envelopes of four moving flat faces and attached jacks against one another, the shared door landing and raised wave lanes. See `GEOMETRY_CHECK.md` for the recorded comparison count, minimum sampled gap and explicit exclusions. This supplements, rather than replaces, intermediate-frame visual inspection.
