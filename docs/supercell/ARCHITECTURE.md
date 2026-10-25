# SUPERCELL — integration architecture

`pages/supercell/index.html` is the independent document; `experiences/supercell/src/main.ts` owns one Lenis instance, the GSAP/ScrollTrigger clock, chapter state, controls and the 650svh journey. `field.ts` is pure sampled storm geometry; `volume.ts` projects density; `weather.ts` draws the Canvas layers and swaps the hero poster; `posters.ts` carries the inline data-URI posters; `audio.ts` synthesizes wind only after activation.

- **Sources:** `experiences/supercell/src/` (TypeScript, checked by the root `tsc --noEmit`).
- **Assets:** `public/supercell/assets/` (Manrope variable, desktop and mobile storm posters), `public/supercell/favicon.svg`, notices in `public/supercell/licenses/`.
- **Base awareness:** stylesheet URLs moved from `/assets/` to `/supercell/assets/`; the runtime poster swap resolves `assets/…` against `document.baseURI`, which already carries the deployment base. HTML references use `%BASE_URL%`.
- **Dependencies:** supplied `gsap 3.15.0` matches the lockfile; `lenis 1.3.27` is replaced by the locked `1.3.26`. Nothing was added.
- **Tests:** `tests/supercell-field.test.ts` and `tests/supercell-volume.test.ts` are supplied suites with imports rebased to `experiences/supercell/src/`.
