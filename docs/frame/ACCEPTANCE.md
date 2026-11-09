# FRAME — Collection acceptance

## 9 November 2026

- Source ZIP hash, byte length and entry count match the approved inventory; every entry is listed in `provenance/deliveries/import-manifest.json`. Imported runtime files are byte-identical to the ZIP except the integration edits below.
- Integration edits: `art.ts` and `assets.ts` (base under `frame/` inside Vite only, so the tests keep the root), `content.ts` (return control), `style.css` (Manrope from `/atlas/fonts/`).
- Supplied tests ported and passing: 47 (tests/frame-*.test.mjs (assets, download links, export, player, scene transition, scheduler, timeline)). `npm test`, `npm run build` (`tsc --noEmit` + Vite) and `npm run verify:build` pass at `/` and at `--base=/ai-web-experience-collection/`.
- Chromium through Playwright, Vite dev server: 1440×900, 390×844, 768×1024 and 2560×1440 load with all local fonts loaded and no font errors, no broken images, no horizontal overflow, the return control visible at 44 px height; wheel scroll to the end and fast reverse; reload in the middle; simulated tab hide/restore; PageDown, End and Home; resize 900×700 and back; reduced motion starts no smooth scrolling.
- Chromium on the project-path production preview: entered from the Collection gallery, primary controls exercised (Watch Boop try, This frame / The next, previous/next frame comparison and See the sequence) with visible state changes, reload, and the return control landed on `#world-frame` inside the viewport.
- No console errors, no failed requests and no requests outside the site origin in these sessions.

## Carried from the supplied delivery

Upstream `docs/delivery-limitations.md`: 24 story frames, the bridges are not one continuous object, and no physical device, Windows or Safari verification. The offline `FRAME.html` is not imported.

## Smoothing, 9 November 2026 (owner request)

Handoffs that cut between stills (12→6, 6→9, 12→16→18) cross-fade over a band around each edge; their stills preload when the handoff is drawn; while scrolling within one take and camera a cache miss keeps the drawn canvas, and the canvas fades in over its still. Edited: `src/transitions.ts`, `src/style.css`; test added to `tests/frame-scene-transition.test.mjs`.

Checked in Chromium at 1440×900 and 390×844 with a frame-by-frame scroll probe (wheel steps of 90 px): no narrative text or picture changes opacity by more than a third in one frame or changes its words while visible. `npm test`, `npm run build` and `npm run verify:build` pass.

## Not tested

Physical phones and touch, iOS Safari, Firefox, high-refresh displays, real browser zoom, screen readers, throttled or cold network loads and long sessions.
