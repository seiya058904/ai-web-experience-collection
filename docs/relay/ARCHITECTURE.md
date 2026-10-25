# RELAY — integration architecture

`pages/relay/index.html` is one independent document; `experiences/relay/src/main.js` owns the single Lenis instance, the GSAP/ScrollTrigger clock, the delivery controls, history review and the new-round dialog. `model/relay-simulation.js` is pure (no DOM) and `view/sculpture.js` owns the SVG sculpture and its labels.

- **Runtime sources:** `experiences/relay/src/` (unchanged apart from asset URLs).
- **Assets:** `public/relay/fonts/` (Archivo, IBM Plex Mono), `public/relay/favicon.svg`, notices in `public/relay/licenses/`.
- **Base awareness:** the stylesheet's font URLs moved from `/fonts/` to `/relay/fonts/`; the page references fonts and the favicon through `%BASE_URL%`. Vite applies the configured base to the root-absolute public paths at build time.
- **Dependencies:** `gsap 3.15.0` matches the supplied pin exactly. The supplied `lenis 1.3.27` is replaced by the Collection's locked `1.3.26`; the work uses only stable wheel/scroll APIs. No dependency or lockfile changed.
- **Tests:** `tests/relay-model.test.mjs` is the supplied deterministic model suite with paths rebased to `experiences/relay/src/model/relay-simulation.js` and the upstream JSON evidence write removed so the suite stays read-only.

The upstream project keeps its own Vite config, lockfile and Playwright harness; none of it is deployed or added to the Collection.
