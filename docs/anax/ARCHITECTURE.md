# ANAX — architecture

## Files

- `pages/anax/index.html`: the independent document, controls, Index, part card, Notes dialog and the fallback poster.
- `experiences/anax/src/spec.js`: every dimension, tooth count and stage boundary the model, the motion and the tests share.
- `experiences/anax/src/kinematics.js`: pure maths with no DOM or clock: the crank-and-rocker solver, gear mesh angle, track evaluation, crank speed and the timed journey. Covered by `tests/anax-kinematics.test.mjs`.
- `geo.js` (geometry helpers), `materials.js` (titanium, gunmetal, glass and wing film), `stage.js` (lights, post-processing, tiers, frame governor), `rig.js` (camera), `labels.js` (callouts), `parts.js` (the 18 selectable parts and their card text), `main.js` (lifecycle, state, interface).
- `experiences/anax/src/model/`: `thorax`, `drive`, `wing`, `wingmodule`, `head`, `abdomen`, `legs`, assembled by `index.js` with `context.js` holding the material library and the register of movable parts.
- `public/anax/`: poster images, social image, favicon and notices.

## One progress value

`state.target` is set by the journey, the slider or a stage mark. `state.shown` follows it through a critically damped spring (natural frequency 9.5 per second). Each part owns a track, a list of steps `{ a, b, v, r, e }`, and `evalTrack` sums the steps passed so far. At progress 0 no step contributes, so every part sits exactly at its rest pose.

## Mechanism

- Crank-rocker: for a crank angle the pin, rod and lever are solved by circle intersection, so the rod keeps `LINK.rod` and the lever keeps `LINK.arm` at every angle. The hind crank pins lead the fore pins by `HIND_LEAD`.
- Gears: one module per train, centre distances from pitch radii, `meshAngle` seats teeth in the gaps. The planetary stage has ring = sun + 2 × planet, and (sun + ring) divisible by 3 so three planets assemble evenly.
- Crank speed falls from `SPEED.hover` to `SPEED.demo` as parts begin to separate.

## Rendering

- One owned `requestAnimationFrame` loop. It draws only when something changes: running mechanism, moving progress, camera, shell mode, a selection or a pending `dirty` count. A resting page does no GPU work.
- Three device tiers (high, mid, low) from pointer type, core count and memory set the pixel ratio cap and a pixel budget, at most 5.2 million pixels on the high tier. Bloom is off on low.
- A frame-time governor averages frames, trials a lower render scale when they run long and locks it if the trial does not help.
- Shell modes (Solid, Glass, Section) swap lit copies of the shell materials in step.

## Failure paths

If WebGL is unavailable the page gains `no-webgl` and shows the poster with the written description. Context loss cancels the loop and restore restarts it. Hiding the tab marks the scene dirty, so it redraws on return. All listeners share one teardown (`dispose`), and without JavaScript a still and a note are shown.
