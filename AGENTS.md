# AI Web Experience Collection — maintenance guide

## Scope and entrypoints

Three accepted complete works share a restrained Collection entrance. Preserve each work's imagery, typography, content, interactions and timing outside a requested change. Never rebuild the works from scratch or force a shared visual theme.

- `index.html`, `src/collection.ts`, `src/collection.css`: Collection entrance. Read `design/COLLECTION.md` before changing it.
- `f1/index.html`, `src/main.ts`, `src/styles.css`: F1 document, startup and composition. Read `DESIGN.md` and `SCROLL-AUDIT.md` before changing F1 layout or motion.
- `experiences/verdant/components/verdant/`: React composition, single journey timeline and photographic surface renderer; `experiences/verdant/app/globals.css`: its independent style sheet.
- `experiences/orbital/components/orbital/`, `experiences/orbital/lib/orbital/`: React composition, mission controller, pure progress/poses, WebGL / Canvas and audio.
- `experiences/shared/`: only genuinely shared UI primitives and Collection return control.
- `ATTRIBUTION.md`, `assets/imports.json` and per-work notices: asset provenance. Preserve legal comments and production license inventory.

## Invariants

- Multi-page Vite build, actual `/`, `/f1/`, `/verdant/`, `/orbital/` documents. No iframe or SPA fallback. Every work owns its lifecycle; only that work's runtime starts.
- HTML/CSS asset URLs go through Vite. Runtime URLs and cross-work links must include `import.meta.env.BASE_URL`; HTML links use `%BASE_URL%`. Keep resources namespaced and test a project-path build.
- Each experience keeps one Lenis instance and one owned GSAP clock. Do not introduce an independent RAF clock or more smoothing to disguise a handoff issue.
- F1 interpolation is 0.105, `syncTouch: false`, direct reversible ScrollTrigger scrub. `src/motion.ts` owns the idle geometry queue, navigation, preferences and teardown. Register loops via `motion.loop()` and cleanup via `motion.own()` / its abort signal.
- F1 must retain Enter → complete composition → Living Hold → handoff → Exit. Short measured Hold travel stays in normal flow; no negative overlaps, content masks or fixed-pixel spacer patches. Input must give visible, reversible feedback while the protected text remains readable.
- F1 remeasure happens before ScrollTrigger refresh and only after active input settles. Do not resize Lenis during a destination. The dev-only `window.__f1Motion.inspect()` is absent from production.
- VERDANT text groups must own spacing; do not reintroduce independently absolute-positioned prose below a width-scaled heading. Test both 16:9 and wide/short windows after font load. Static/reduced layouts must remain legible.
- ORBITAL's shared spacecraft, engineering tabs, Moon/Mars, silent-by-default audio, reading companion and Canvas compatibility path are part of the complete experience.
- Preserve visibility suspension, rendering caps, keyboard access, reduced motion and read-position retention on rebuild. F1 Canvas cap is 1.5 DPR / 3 million pixels; do not add WebGL to F1 for novelty.
- No subagents without explicit user authorization. No dependency updates or publishing without task authorization.

## Validation and deployment

Node.js 24 LTS / npm; one lockfile. `npm ci`; `npm run dev`; `npm test` (nine tests); `npm run build`; `npm run verify:build`; `npm run verify`; `git diff --check`.

There is no lint or browser-test npm script. `scripts/prepare-data.mjs` and `scripts/prepare-assets.mjs` regenerate original F1 resources and must not run as verification. Do not commit temporary browser drivers, screenshots, caches, ZIPs or `dist/`.

After UI/motion changes, inspect complete frames at 390×844, 768×1024, 1440×900, 1920×1080, 2560×1440 and 3840×2160, plus wide/short VERDANT. Exercise slow/normal/fine/high-frequency wheel, fast down/reverse, arbitrary stops, scene boundaries, disclosures, every control, menus, reduced motion, immediate-load input, resize and tab recovery. Record actual observations; physical touch, iOS and high-refresh hardware require actual devices.

Pages workflow builds with its returned base path, tests output references, then deploys only `dist/` on `main`. Before authorized release, run the README project-path build/preview and verify direct loads, refresh, home/work/back navigation, fonts/images/GLB, WebGL/Canvas and both production license files. After deployment, compare live asset bytes with the verified build and repeat core desktop/mobile flows. Close with exact commit, Git parity and clean state.
