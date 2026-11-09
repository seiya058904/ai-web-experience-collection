# SILLAGE — Collection acceptance

## 9 November 2026

- Source ZIP hash, byte length and entry count match the approved inventory; every entry is listed in `provenance/deliveries/import-manifest.json`. Imported runtime files are byte-identical to the ZIP except the integration edits below.
- Integration edits: `layout.ts` (return control), `style.css` (local fonts).
- Supplied tests ported and passing: 78 (tests/sillage-artwork.test.ts, tests/sillage-state.test.ts, tests/sillage-transitions.test.ts). `npm test`, `npm run build` (`tsc --noEmit` + Vite) and `npm run verify:build` pass at `/` and at `--base=/ai-web-experience-collection/`.
- Chromium through Playwright, Vite dev server: 1440×900, 390×844, 768×1024 and 2560×1440 load with all local fonts loaded and no font errors, no broken images, no horizontal overflow, the return control visible at 44 px height; wheel scroll to the end and fast reverse; reload in the middle; simulated tab hide/restore; PageDown, End and Home; resize 900×700 and back; reduced motion starts no smooth scrolling.
- Chromium on the project-path production preview: entered from the Collection gallery, primary controls exercised (Hero legend Brightness / Spice / Warmth and the three chapter-2 component cards) with visible state changes, reload, and the return control landed on `#world-sillage` inside the viewport.
- No console errors, no failed requests and no requests outside the site origin in these sessions.

## Carried from the supplied delivery

Upstream G5 acceptance is partial: download to disk, effective browser zoom, OS preference changes, physical devices and performance under load are unverified (`provenance/sillage/upstream/docs/TEST-REPORT.md`).

## Notes

The Fragonard link stays as a labelled context citation (“the product and its ingredients are not reproduced”); it already carries `rel="noreferrer"`.

## Smoothing, 9 November 2026 (owner request)

Bridge captions and print labels fade out and in; the caption step has a dead band. Bridges are longer (220vh, 190vh on phones); the closing panels of bridges 8 and 9 reveal over .42–.72 of the bridge instead of .62–.72, and the keep bridge, which is in normal flow on phones, plays while it rises through the viewport instead of over about 120 px. Edited: `src/transitions.ts`, `src/style.css`.

Checked in Chromium at 1440×900 and 390×844 with a frame-by-frame scroll probe (wheel steps of 90 px): no narrative text or picture changes opacity by more than a third in one frame or changes its words while visible. `npm test`, `npm run build` and `npm run verify:build` pass.

## Not tested

Physical phones and touch, iOS Safari, Firefox, high-refresh displays, real browser zoom, screen readers, throttled or cold network loads and long sessions.
