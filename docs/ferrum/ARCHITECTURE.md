# FERRUM — integration architecture

`pages/ferrum/index.html` is an independent document with a still-image fallback. `experiences/ferrum/src/main.js` owns one Lenis instance and one RAF for story sampling, fades, scene rendering and opt-in sound. `scene.js` owns the Three.js scene and resource teardown; `story.js` provides pure six-act progress; `audio.js` synthesizes sound only after activation.

Three.js and Lenis resolve from the Collection root lockfile. This matches supplied Three.js `0.186.1`; the root Lenis `1.3.26` replaces the supplied `1.3.17` without updating dependencies. Fonts, stills and textures are namespaced under `public/ferrum/assets/`; HTML font faces and stills use `%BASE_URL%`, while JavaScript texture/fallback URLs prepend `import.meta.env.BASE_URL`. Upstream vendor modules, QA screenshots and nested package/serve tooling are not deployed.
