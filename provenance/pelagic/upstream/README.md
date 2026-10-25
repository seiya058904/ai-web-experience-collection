# PELAGIC

## A Language of Living Light

An independent, five-act browser exhibition about the conditions of seeing biological light. Turn down a survey lamp, inspect a reconstructed lure encounter, and compare two squid pigmentation patterns under a conceptual backlight.

The interface and content are English. The project runs locally and has no account, API key, database, analytics, audio permission, or external media dependency. No deployment is required.

## Run locally

Use **Node.js 22.12 or newer** and npm. The clean-install verification used Node 24.22.1 and npm 11.9.0.

```bash
npm ci
npm run dev
```

Open the local address printed by Vite, normally `http://localhost:5173/`. Keep the process running while viewing the exhibition. Serve the files over HTTP; opening `index.html` directly with a `file:` URL does not run the TypeScript application.

```bash
npm test
npm run build
npm run preview
```

The build performs TypeScript checking and writes a static production application to `dist/`. Vite's `base: './'` makes the built asset paths relative. Installation needs access to the npm registry; the running production application uses bundled fonts and artwork. The research links in Field notes open external source pages only when followed.

## The observations

| Act | What to do |
| --- | --- |
| I — Encounter | Observe the connected colony and its small terminal lure. Motion can be paused at any time. |
| II — Less light | Move the native Survey light slider. The body illumination changes independently of lure emission. |
| III — A lure has a purpose | Replay, pause or scrub one deterministic, illustrative fish encounter. |
| IV — A body can carry a pattern | Compare Pattern A and B, switch the backlighting hypothesis, and open the still comparison. |
| V — Look again | Return to the first subject with your light setting intact; optionally compare the comb-jelly rainbow effect. |

The first survey-light input enters **Your light · held** mode. Scrolling, history navigation and repeated visits preserve that value. **Restore authored view** returns smoothly to the lighting appropriate to the current chapter. It does not restart the story or encounter.

The header pause affects all living motion and encounter playback. The sliders and pattern controls continue to work. An operating-system reduced-motion preference starts the exhibition still, with manual encounter stepping available. The illustrated renderer is available from Field notes or by appending `?renderer=svg` to the local URL.

## How it is built

This is a deliberately limited-view **2.5D** exhibition, not a freely orbitable 3D model. Original transparent artwork supplies the tissue detail. The runtime calculates separate surface illumination, faint exhibition fill, a connected luminous lure, pigmentation masks and a curved fish path. No video substitutes for the interactive scene.

`src/state.ts` owns the reversible story progress and the independent observation settings. `src/renderer.ts` renders Canvas 2D or a complete SVG alternative. `src/main.ts` connects the semantic DOM, controls, dialogs, history and lifecycle. `src/style.css` owns the desktop, portrait and compact layouts. `index.html` includes the complete English content and an embedded first-frame specimen, so delayed large artwork does not leave an empty opening.

There is one master GSAP ticker. It calls `lenis.raf(time * 1000)` with `autoRaf: false`, updates the local simulation, and renders. Lenis forwards scroll events to ScrollTrigger; all narrative layers read the same progress. Resize preserves progress while recalculating geometry. Background tabs pause work and resume without simulating the elapsed absence.

Canvas does not request WebGL. If artwork or Canvas is unavailable, an original SVG anatomy diagram retains light, behavior and pattern controls. The still comparison uses the same fallback. Text and controls are separate DOM elements and never inherit scene exposure.

## Tests and evidence

`npm test` runs nine meaningful state-regression tests. The delivered browser suites use the pinned Playwright dependency:

```bash
npx playwright install chromium
npm run build
npm run dev
# In another terminal, with the development server still running:
npm run qa:matrix
npm run qa:interactions
npm run qa:resilience
npm run qa:zoom
npm run qa:performance
```

The suites default to `http://127.0.0.1:5173/` and write to `qa-output/`. Set `QA_URL` for another local address, `QA_OUTPUT` for another evidence directory, or `PLAYWRIGHT_EXECUTABLE_PATH` for an installed Chromium executable. The production-bundle smoke check loads `/dist/` through the same development server after a build.

The native-scrollbar/video and actual-background suites need a graphical display. On Linux with Xvfb installed, run `xvfb-run -a npm run qa:motion` and `xvfb-run -a npm run qa:background`. The native zoom suite uses a small private test extension to invoke Chromium's real page-zoom API. It does not install anything into a personal browser profile. Test profiles are created under `qa-output/` and can be removed with that folder.

Read [the actual QA record](docs/QA.md) for results, repairs, environment details and coverage limits. The files under `docs/qa/` are selected evidence from real browser renders. They are not substitutes for the runnable application.

## Research, art and licenses

- [Visual Bible](DESIGN.md): art direction, medium, stable compositions and handoff contracts.
- [Research and boundaries](docs/RESEARCH.md): primary sources, evidence and interpretive decisions.
- [Image-generation record](docs/IMAGE_GENERATION.json): six actual calls, exact prompts, output references, SHA-256 values and adoption status.
- [Sources and licenses](docs/LICENSES.md): font and dependency notices, artwork provenance and research-image boundaries.

The colony is an Erenna-inspired artistic interpretation. The encounter is reconstructed. Squid backlighting is explicitly presented as a hypothesis; no meaning is assigned to either pigmentation pattern. The comb-jelly comparison concerns externally illuminated comb rows and does not claim that comb jellies cannot produce light. The faint fill, display brightness and timings are exhibition choices, not calibrated biological measurements.

## Package contents

All application source, local artwork, local fonts, configuration, dependency lockfile, tests, design/research documentation and selected acceptance evidence are included. Dependencies, generated builds, browser profiles, caches and credentials are excluded. Recreate `node_modules/` and `dist/` with the commands above.
