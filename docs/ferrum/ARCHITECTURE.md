# FERRUM — integration architecture

`pages/ferrum/index.html` is an independent document with a still-image fallback. `experiences/ferrum/src/main.js` owns one Lenis instance and one RAF for story sampling, fades, scene rendering and opt-in sound. `scene.js` owns the Three.js scene and resource teardown; `story.js` provides pure six-act progress; `audio.js` synthesizes sound only after activation.

Three.js and Lenis resolve from the Collection root lockfile. This matches supplied Three.js `0.186.1`; the root Lenis `1.3.26` replaces the supplied `1.3.17` without updating dependencies. Fonts, stills and textures are namespaced under `public/ferrum/assets/`; HTML font faces and stills use `%BASE_URL%`, while JavaScript texture/fallback URLs prepend `import.meta.env.BASE_URL`. Upstream vendor modules, QA screenshots and nested package/serve tooling are not deployed.
# Batch B navigation and still-image ownership — 2026-10-25

The still renderer commits an already decoded image element atomically. Each request owns a generation; delayed results from earlier acts or orientations cannot replace the current choice. Pending/error states retain the previous complete image and name it explicitly. Existing chapter stills and orientation choices are preserved. Still mode describes the captured ridge rather than inviting unavailable pointer-driven lighting.

Adjacent explicit navigation retains the authored 1.15-second journey. Selecting an act more than one chapter away, including Replay, immediately selects its complete pose through the existing Lenis instance. This prevents unreadable interim furnace/strike/cooling flashes. Manual scrolling and adjacent handoffs are unchanged; no new fade or clock was added.
