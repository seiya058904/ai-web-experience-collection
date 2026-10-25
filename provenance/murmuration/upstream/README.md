# MURMURATION

**No one is leading.**

An interactive field study in collective motion. Follow one flock through five acts: **The Many → A Local World → A Turn Travels → The Live Field → The Shape You Left**. Observe a reversible simulation record, change the local rules, stir a living field, then keep a PNG of the shape you left.

The 2,400 birds are simulated agents. Their positions do not follow a target outline. The sky is the only generated image used in the live artwork; all interface text is HTML and all birds are drawn from model state.

## Run locally

Use **Node.js 22.12 or newer** and npm. Node 24.22.1 was used for the delivery checks.

```bash
npm ci
npm run dev
```

Open the local address printed by Vite. The development and preview commands bind to `127.0.0.1`. No account, API key, environment file or backend is needed.

```bash
npm run build
npm run preview
```

The production output is `dist/`. Serve it over HTTP; opening `index.html` with `file://` does not support module and worker loading. All production fonts, images and recorded data are local. The application makes no analytics or account requests. Research links open only when selected.

The build uses a relative asset base, so the complete `dist/` directory can also be served from a subdirectory. The compressed recording can be served as an ordinary `.gz` file or with gzip content encoding; both paths are recognized by the loader.

## Experience

- Scroll, use the chapter buttons, or use the keyboard to move through the observation. Positions in Acts I–III come from a deterministic recording; reversing the scroll samples that record in reverse without integrating the model backwards.
- In **A Local World**, select one of three concepts. One directional cue is shown at a time around the same marked bird.
- In **The Live Field**, native sliders change the actual separation, alignment and cohesion weights. **Drift**, **Cohere** and **Scatter** preserve current positions while changing those weights.
- Click or tap the open sky to apply a local turn. **Create a ripple**, or Enter/Space on the sky target, provides the same kind of intervention without precise pointer placement.
- **Hold** retains the current state. While held, a changed rule or queued ripple takes effect on **Resume** or **Step**. Step advances one fixed model tick.
- **Reset this flock** restores the recorded live checkpoint and default rules. It preserves the pause choice and page position.
- **Save a fieldprint** downloads the current Canvas image with the current rule weights, tick and seed. It is a visual record, not a full replay log. A seed alone cannot reconstruct an arbitrary history of interventions.

The live state is saved when leaving the active field region or hiding the page, and after relevant control actions. A same-tab reload can restore it through session storage. If storage is unavailable, the in-memory state still survives chapter transitions. Closing the tab ends that storage session.

Reduced motion starts with still wings and a held live field. **Step** provides single observations; **Resume** explicitly starts continuous flight. The **Still wings** control concerns wing motion, while **Hold** controls the live simulation.

## Two kinds of time

The narrative is an eight-second, fixed-step local-rule experiment, stored as 121 quantized snapshots. Scroll progress samples position and velocity by stable agent identity. The live field starts at its final checkpoint, then uses a separate forward-only clock at `1/60` per model step, with at most three compensating steps per frame. It pauses outside its active region, behind Field Notes, and while the page is hidden.

Leaving the live field captures positions, velocities, individual speed biases, rules, seed, tick, pause state, queued interventions and neighborhood configuration. The ending changes only the observing camera. Returning restores the saved state before any new step. Revisiting the narrative shows the preserved experiment in a labeled **Saved field** window; it does not pretend the user's branch is part of the recorded trajectory.

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for the model, recording format and exact handoff intervals.

## Rendering and resilience

A single Canvas 2D renderer supports the complete interaction without WebGL. A portrait camera rotates and reframes the same world. Controls stay in a separate reading region; on short phones, that region scrolls independently while page navigation remains available.

Local posters are rendered from the actual initial model, with desktop and portrait variants. They provide a meaningful first frame before JavaScript arrives. A short, interruptible focus reveal resolves into the live drawing. If the sky fails, a quiet gradient remains. If the recording fails, a worker reconstructs the same data from the included initial state. Fonts have readable system fallbacks.

Lenis and ScrollTrigger share one GSAP ticker. There is no second Lenis RAF loop, forced snap, locked experiment stage or negative simulation timestep.

## Verify and regenerate

```bash
npm test
```

The model suite checks deterministic inputs, independent rule effects, complete checkpoints, bounded finite trajectories, five exact returns, pause/reset semantics, reduced motion, reversible sampling and byte-for-byte fallback reconstruction. Its case-level results are written to `docs/evidence/model-case-results.json`.

For the browser suites, first install the matching Playwright browser:

```bash
npx playwright install chromium
npm run test:browser
npm run test:recovery
npm run test:motion
npm run test:native
```

`test:browser` renders the eight required viewports, all five acts, the four handoffs in both directions, functional controls and zoom-equivalent layouts. It uses an isolated production-file fixture. `test:recovery` creates an ephemeral loopback HTTP fixture to test real cache behavior, failures, resize/storage/modal recovery, pixel-exact export, performance and Vite development mode. `test:motion` records real scrolling and densely samples the saved-field transition.

`test:native` launches headed Chromium in a fresh temporary profile. It verifies real tab hiding, freezing and resuming, then changes Chrome's actual Page zoom setting to 125%, 150% and 200%. It does not use Playwright's foreground override or synthetic visibility events. On Linux without a display, install Xvfb and run:

```bash
xvfb-run -a -s "-screen 0 1920x1200x24" npm run test:native
```

These tests do not publish a site. Outputs go to `.qa-run/`, `.qa-recovery/`, `.qa-motion/` and `.qa-native/`. The native suite is Chromium-specific; it creates and removes its own browser profile and changes no existing browser settings.

An existing compatible Chromium installation can be selected with the standard `CHROMIUM_EXECUTABLE` environment variable. A headless Linux browser with emulated screen sizes is not a physical-device test. See [QA_REPORT.md](docs/QA_REPORT.md) for the actual environment, measured results, repairs and remaining coverage limits.

To rebuild the model record or the fallback posters:

```bash
npm run record
npm run posters
npm run build
```

`record` uses the included seed, initial conditions, local perturbation and fixed timestep. `posters` captures the current renderer through Chromium; it does not call an image generator. Build again after regenerating posters to package their latest bytes.

## Project map

| Path | Purpose |
| --- | --- |
| `index.html` | Semantic English UI, navigation, controls and Field Notes |
| `src/main.js` | Shared scheduler, scroll state, interactions and export |
| `src/model.js` | Deterministic spatially local flock model |
| `src/session.js` | Live-state lifecycle and checkpoint semantics |
| `src/recording.js` | Quantized recording and continuous sampling |
| `src/record-worker.js` | Network-failure record reconstruction |
| `src/renderer.js` | Observing camera, bird rendering and sky |
| `src/style.css` | Responsive layouts, type and motion preferences |
| `src/hero.json` | Full chosen initial state and observation metadata |
| `public/` | Final sky, local fonts, model-derived posters and recording |
| `scripts/`, `tests/` | Record/poster generation and reproducible verification |
| `docs/` | Visual Bible, generation record, sources, licenses and selected evidence |

## Scientific scope and credits

This is **a local-rules model inspired by flocking research**. Reynolds supplies the separation/alignment/cohesion framework. Ballerini and colleagues motivate attention to a small neighborhood; their reported six-to-seven-neighbor result belongs to the studied starling flocks, not every bird or condition. Attanasi and colleagues motivate a turn that travels; this ordinary local-rule model does not reproduce their particular measured dynamics. A disclosed soft environmental boundary keeps the field observable.

Original code is licensed under MIT. Third-party software and fonts retain their own licenses; GSAP uses its Standard “No Charge” license, not MIT. The original generated sky and concept images are documented separately. See [SOURCES.md](docs/SOURCES.md), [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md), [VISUAL_BIBLE.md](docs/VISUAL_BIBLE.md) and [IMAGE_GENERATION.json](docs/IMAGE_GENERATION.json).
