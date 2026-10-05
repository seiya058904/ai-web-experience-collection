# F1 / Beyond the Limit — maintenance guide

## Goal and baseline

This is a Chinese F1 educational site built around Motion Design, scroll storytelling and finished visual compositions. The current product has passed human acceptance. Preserve its imagery, typography, content, interactions and timing unless the requested task explicitly changes them or a reproduced engineering defect requires a correction.

## Entry points

- `index.html`: semantic chapters and cited educational content; `src/styles.css`: visual language and responsive composition.
- `src/main.ts`: startup, resource readiness and HMR teardown.
- `src/motion.ts`: the single Lenis / GSAP ticker owner, idle geometry queue, navigation, preferences and disposal.
- `src/choreography.ts`: measured reading windows, separate content / transition progress and reversible handoffs.
- `src/interactions.ts`: controls and three visibility-aware scene loops; `src/models.ts`: pure educational models, tested by `tests/models.test.mjs`.
- Read `DESIGN.md` and `SCROLL-AUDIT.md` before changing layout or motion; check `ATTRIBUTION.md` before publishing assets.
- `vite.config.ts` preserves upstream legal comments and emits a dependency license inventory; retain both in production releases.

## Invariants

- Keep one Lenis instance and one app-owned GSAP clock. Register continuous scene work through `motion.loop()` and cleanup through `motion.own()` / its abort signal. Do not add a competing RAF clock.
- Do not increase smoothing to disguise a scroll defect. Current Lenis interpolation is 0.105; touch uses native momentum (`syncTouch: false`). ScrollTrigger scrub is direct and reversible.
- Reflow must use the idle geometry queue. Never call `lenis.resize()` during an active destination or refresh blindly on every input. Measure choreography before ScrollTrigger refresh.
- Preserve **Enter → Hold → Exit**. Content must be fully composed before a measurable Hold, followed by transition. Keep content and transition progress separate, backgrounds below text and hold travel in normal document flow; do not restore negative overlaps or fixed-pixel spacer fixes.
- Both scroll directions and arbitrary stopping positions must work. Maintain keyboard controls, reduced motion, reading-position preservation and teardown across mode / breakpoint changes.
- 1440p and 4K matter. Mobile (at / below the 760px breakpoint) has an independently composed, natural-flow layout rather than a scaled desktop scene.
- Keep offscreen loops paused, cached path geometry and the Canvas cap (1.5 DPR / 3 million pixels). Do not introduce Three.js / WebGL for novelty or materially regress rendering cost.
- Models are illustrative; preserve their assumptions and distinguish 2026 active aero from historical DRS. New assets require proven distribution rights. Historical branded mockups in `design/concepts/` remain local and ignored.

## Change and validation

Reproduce first, then make the smallest justified correction. Preserve the visual language and avoid unsupported broad refactors. Do not change dependencies, publish or deploy without task authorization. Never claim hardware, browser or performance checks that were not run.

Use Node.js 24 LTS and npm. No backend or secret configuration is required.

```sh
npm ci                                  # lockfile install; no dependency updates
npm run dev                             # http://127.0.0.1:5173
npm test                                # seven node:test model tests
npm run build                           # TypeScript check + Vite -> dist/
npm run verify                          # tests + production build
npm run preview -- --port 4174 --strictPort
git diff --check
```

There is no configured lint or browser-test npm script. CI runs `npm ci` and `npm run verify`; it does not replace browser acceptance. `scripts/prepare-data.mjs` and `scripts/prepare-assets.mjs` are deliberate resource regeneration / import tools, not verification commands. They access upstream resources or the original generation outputs and may replace assets; do not run them during a routine build.

After motion or layout changes, scroll the production preview in a real browser through every boundary: slow / normal / repeated / fine wheel input, quick down-and-reverse and stops at Enter, Hold and Exit. Check complete outgoing content, expanded disclosures, navigation, motion toggle, all educational controls, mobile menu, console and failed assets. Test at least 390×844, a tablet, 1440×900, 2560×1440 and 3840×2160; for 1440p / 4K inspect the full frame, not just document width. The development-only `window.__f1Motion.inspect()` helps diagnose geometry and lifecycle; it is absent in production.

Physical touch / touchpad momentum, iOS Safari, real background-tab recovery and 120/144 Hz pacing require actual devices / external browsers. Viewport emulation and synthetic events cannot establish those results.

The accepted build uses root-relative resources. GitHub Pages project-path deployment needs a separate reviewed path check (including the footer license link); do not alter the frozen product to force deployment.
