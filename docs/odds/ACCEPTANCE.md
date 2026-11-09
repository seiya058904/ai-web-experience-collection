# ODDS — Collection acceptance

## 9 November 2026

- Source ZIP hash, byte length and entry count match the approved inventory; every entry is listed in `provenance/deliveries/import-manifest.json`. Imported runtime files are byte-identical to the ZIP except the integration edits below.
- Integration edits: `scene.ts` (material URL under `odds/`), `content.ts` (return control), `style.css` (local Manrope subsets), new `es2024-string.d.ts` (declares `String.prototype.toWellFormed` for the ES2022 type-check).
- Supplied tests ported and passing: 60 (tests/odds-charts.test.ts, odds-engine, odds-narrative, odds-scene, odds-state). `npm test`, `npm run build` (`tsc --noEmit` + Vite) and `npm run verify:build` pass at `/` and at `--base=/ai-web-experience-collection/`.
- Chromium through Playwright, Vite dev server: 1440×900, 390×844, 768×1024 and 2560×1440 load with all local fonts loaded and no font errors, no broken images, no horizontal overflow, the return control visible at 44 px height; wheel scroll to the end and fast reverse; reload in the middle; simulated tab hide/restore; PageDown, End and Home; resize 900×700 and back; reduced motion starts no smooth scrolling.
- Chromium on the project-path production preview: entered from the Collection gallery, primary controls exercised (Drop the first ball, Pause, Show result, four fresh choices and route inspection) with visible state changes, reload, and the return control landed on `#world-odds` inside the viewport.
- No console errors, no failed requests and no requests outside the site origin in these sessions.

## Carried from the supplied delivery

Upstream `docs/acceptance.md` marks most chapter browser inputs and the responsive layout as unverified, and the offline file as unverified; the offline file is not imported.

## Notes

The delivery ships no font or Lenis notice files; standard Manrope OFL and Lenis MIT texts are copied from existing Collection notices. `public/collection/odds.webp` is an interface-cleaned capture of the running opening.

## Not tested

Physical phones and touch, iOS Safari, Firefox, high-refresh displays, real browser zoom, screen readers, throttled or cold network loads and long sessions.
