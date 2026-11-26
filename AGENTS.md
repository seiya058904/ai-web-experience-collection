# AI Web Experience Collection — Agent Guide

Showcase of 55 independent web experiences sharing a restrained Collection entrance (`pages/index.html`, `collection/main.ts`, `collection/styles.css`). Every work lives under `pages/<work>/`, `experiences/<work>/`, `public/<work>/`, `docs/<work>/`, and `provenance/<work>/` (`experiences/shared/` holds only genuinely shared primitives and the Collection return control).

## Non-Negotiable Invariants
- **Preserve per-work identity**: read `docs/<work>/DESIGN.md` (plus `ARCHITECTURE.md` / `ACCEPTANCE.md` / `SOURCES.md` if present) before editing a work; read `docs/collection/DESIGN.md` before editing the entrance and `docs/f1/DESIGN.md` + `docs/f1/SCROLL-AUDIT.md` before editing F1. Never rebuild works from scratch or impose a shared visual theme.
- **Multi-page Vite build**: independent HTML document and runtime per work (no iframe or SPA fallback). Route all HTML/CSS assets through Vite; use `import.meta.env.BASE_URL` for runtime/cross-work URLs and `%BASE_URL%` in HTML links. Preserve `ATTRIBUTION.md`, `provenance/deliveries/*.json`, and per-work legal notices.
- **Single clock & smooth scroll**: each smoothed work keeps one Lenis instance on one owned clock (GSAP ticker or owned RAF; Collection entrance uses `lerp: .105`, `syncTouch: false`, `anchors: false` on its own RAF). Reduced motion disables wheel smoothing, dialogs keep native scroll, restoration is immediate, and scene progress follows document position without a second easing layer.
- **Work-specific guards**: F1 keeps Enter → Living Hold → Exit in normal flow, `lerp: 0.105` / `syncTouch: false`, 1.5 DPR / 3M px Canvas cap (no WebGL), `motion.loop()`/`motion.own()` teardown, remeasure before ScrollTrigger refresh after input settles, and dev-only `window.__f1Motion.inspect()`. VERDANT text groups own spacing (no absolute prose under width-scaled headings). FUSION/ORBITAL audio starts silent; preserve visibility suspension, keyboard access, and Canvas/still/reading fallbacks.
- **Calm handoffs**: narrative text and stills never snap in one frame — use `softText` (`experiences/shared/soft-swap.ts`), continuous `layerOpacity` cross-fades, and `steppedIndex` dead bands. Scroll-scrubbed fades span ≥25% viewport; time reveals ≥450 ms. Never toggle `hidden`/`display`/`visibility` on visible narrative content without an opacity transition, and never leave `overscroll-behavior: contain` or `data-lenis-prevent` on non-overflowing elements. Reduced motion stays instant.

## Commands & On-Demand Skills
- Node 24 LTS / npm (one root lockfile, no nested lockfiles): `npm ci`, `npm run dev`, `npm test`, `npm run build`, `npm run verify:build`, `npm run verify`, `git diff --check`.
- `npm run test:browser` runs Playwright Chromium checks (port 4178; `docs/collection/BROWSER-CHECKS.md`) against a project-path build. Never run `scripts/prepare-data.mjs` or `scripts/prepare-assets.mjs` as verification. Never commit `dist/`, caches, screenshots, or ZIPs.
- **Adding a supplied website ZIP**: load `.agents/skills/collection-add-work/SKILL.md`.
- **Multi-viewport QA, clock/font inventory & Pages release**: load `.agents/skills/collection-qa-release/SKILL.md`.
- **Delivery**: branch → PR → self-review → checks pass → merge → verify Pages deployment → `0/0` sync; pushes, merges, dependency updates, and deployments require explicit task authorization.
