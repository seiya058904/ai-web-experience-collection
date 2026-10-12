# Runtime architecture

## State before animation

`sampleJourney(scrollY, metrics, viewportHeight)` maps the actual document position to `{ scene, local, transition, overall }`. Each chapter remains stable through local progress 0–0.78. The last 22% of its travel hands off to the next chapter. The last chapter uses `sectionHeight − viewportHeight`, so its local progress reaches 1 at the actual document bottom.

Process states come from scroll position. A separate elapsed-time value adds only bounded living motion; quiet mode removes that motion. Reversing the scroll revisits a represented stage. It does not suggest physically reversing compression or dissolution.

The app uses one continuously scheduled application-owned `requestAnimationFrame` loop. It passes the same timestamp to Lenis and updates the active scene. `autoRaf` and `autoResize` are disabled in Lenis. Lenis internally uses occasional single-shot RAF callbacks for native scroll-event bookkeeping; those are not separate render loops. Neither renderer creates its own scheduler.

## Layout and text

Every chapter is semantic HTML with a fixed visual composition. Only the current chapter is focusable and exposed to accessibility APIs; the narrative remains present for the no-JavaScript reading edition. Native headings, links, dialogs and range controls handle reading and interaction. Canvas is decorative (`aria-hidden`).

The two neighboring scene groups overlap only during a handoff. The corresponding captions fade in a short interval around that handoff. Scale, position, a circular motif and the shared tablet profile connect the scenes. The implementation combines spatial movement with opacity; it does not use a fluid or particle morphing simulation across all seven stages.

Desktop composition protects the left editorial area. Small screens place art between the heading and supporting copy. Surface intentionally crops its enlarged geometry. Evidence has a separate mobile placement to protect both the caption and depth control.

## Geometry and material identity

One radial tablet profile defines the main biconvex compact, cutaway boundary and working curvature of the punches. Geometry is original, generated at runtime. The powder and fracture layouts use seeded data. This keeps stable state reproducible and avoids accumulated simulation error after reverse scrolling.

Procedural canvas textures supply grain, pores, height-derived normals and metal detail. Lighting uses local Three.js `RoomEnvironment`, directional illumination and restrained shadows. Environment maps are explicitly bound per material; this avoids unintentionally letting scene-level environment intensity wash out individually tuned surfaces.

`Observe depth` moves a cut plane and regenerates only the associated cap when depth changes. The material exposed on the cap is illustrative. It does not represent a resolved molecular structure, a scan measurement or a dosage-unit assay.

Release separates irregular closed pieces and disperses smaller particles. The liquid cue is deliberately schematic. There is no Navier–Stokes solver, dissolution kinetics, concentration field or simulated absorption.

## Performance policy

- Only the current and adjacent handoff group are visible.
- Particle families use instancing and bounded pools.
- Full and light modes reduce particle counts; full distribution uses 1,020 grains, light uses 340.
- Pixel density is capped at 1.5 on larger screens, 1.25 on small screens and 1 in light mode. A 2.6-million-pixel ceiling also applies, including 4K viewports.
- If recent measured CPU update/render submission cost stays high, the default session can make a one-way move to light rendering. An explicit user or URL quality preference takes precedence.
- This heuristic measures CPU submission cost, not GPU completion. About provides an explicit light-mode control because software GPU speed and real GPU speed can differ substantially.
- Quiet mode stops continuous visual changes and avoids repeated scene drawing after state settles. The central RAF may continue sampling input; it remains the only application loop.
- When the page is hidden, the application cancels its scheduled frame and resets timestamp accumulation. It resumes without a large time jump when visible.
- Real `pagehide` disposes rendering resources when the page is not being placed into back/forward cache. A cached page resumes its existing state.

## Failure handling

The app loads `scene.js` dynamically while the illustrated edition is available. Failed import, failed WebGL initialization or render failure exposes the 2D renderer. A real `webglcontextlost` event keeps the current scroll and depth, then `webglcontextrestored` resizes and redraws the Three.js renderer. Failures are retained in read-only diagnostics rather than repeated console reporting.

A local, script-disabled reading edition displays all seven chapters in ordinary document flow. Font files and all runtime libraries are local. About links to external reading only when a visitor follows a reference.

## Inspecting state

For diagnostics from the browser console:

```js
window.__DOSE__.getState()
window.__DOSE__.getStats()
```

These functions return copies or plain read-only summaries. They report current chapter, local progress, depth, rendering mode, geometry/draw counters, context-loss counters and recent CPU render-submission samples. They are not product measurements or manufacturing data.

## Local serving and build

The Node server permits GET and HEAD, binds only to 127.0.0.1, validates resolved paths against the project root and sends MIME types for ES modules, styles and fonts. It does not accept uploads or arbitrary writes. The build script recreates only its own generated `dist` directory and copies runtime assets without bundling, minification or network access.

Do not delete `vendor/three.core.js`: the Three.js module imports that sibling. Keep the font licenses with the fonts and preserve the two MIT vendor licenses when redistributing.

## Collection adaptation (12 October 2026)

Runtime source is in `experiences/dose/src/`, its independent document is `/dose/`, and local resources/notices are in `public/dose/`. The Collection reuses its installed Three.js 0.186.1 and Lenis 1.3.26. Standalone vendor modules, duplicate dist and startup/build tooling are omitted; generated concept references remain in scoped provenance. Chapter spans are 2.5 / 2.8 / 3.05 / 3.6 / 2.65 / 3.35 / 2.7 viewport heights. Original local process timing and the 0.78 handoff start are retained; the first six handoffs have approximately 39–40% more scroll travel. Caption fade ranges avoid concurrent readable captions. Desktop endpoint headings and supporting copy share a flex frame with a protected gap, and type sizes respond to viewport height as well as width. See ACCEPTANCE.md for actual checks and limits.

The Collection handoff aligns both material representations in one continuous world frame (position, quaternion and scale), fades press machinery ahead of the tablet, and interpolates key/rim lighting at every boundary. No independent clock, geometry replacement or simulated physical reversibility is introduced.
