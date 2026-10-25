# BACKSTAGE — integration architecture

`pages/backstage/index.html` is the independent document with the unchanged inline fallback script and `?static=1` reading edition. `experiences/backstage/src/main.js` owns one Lenis instance, the GSAP/ScrollTrigger clock, the act director and controls. `state.js` is pure direction state, `theatre.js` owns the Three.js stage and teardown, `materials.js` the authored materials.

- **Sources:** `experiences/backstage/src/`; `theatre.js` resolves `three` and `three/addons/` from the root lockfile at the supplied `0.186.1`.
- **Assets:** `public/backstage/fonts/`, `public/backstage/posters/`, `public/backstage/favicon.svg`, notices in `public/backstage/licenses/`.
- **Base awareness:** stylesheet font URLs moved from `/fonts/` to `/backstage/fonts/`; the runtime poster swap resolves `posters/…` against `document.baseURI`; HTML references use `%BASE_URL%`.
- **Repaired phone layout:** the supplied single-column stage grid sized itself from its widest row, so at 390–424px the masthead and the five-act footer were clipped and the cue link read “Call the c…”. The page now lets that track shrink and compacts the masthead below 520px, keeping the supplied typography at every wider width.
- **Tests:** `tests/backstage-state.test.mjs`, `backstage-geometry.test.mjs` and `backstage-clearance.test.mjs` read the same geometry plan as the meshes without creating a WebGL context.
