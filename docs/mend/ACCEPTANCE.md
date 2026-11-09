# MEND — Collection acceptance

## 9 November 2026

- Source ZIP hash, byte length and entry count match the approved inventory; every entry is listed in `provenance/deliveries/import-manifest.json`. Imported runtime files are byte-identical to the ZIP except the integration edits below.
- Integration edits: `main.ts` (asset base under `mend/`), `style.css` (font URLs under `/mend/fonts/`).
- Supplied tests ported and passing: 14 (tests/mend-state.test.ts, tests/mend-story.test.ts). `npm test`, `npm run build` (`tsc --noEmit` + Vite) and `npm run verify:build` pass at `/` and at `--base=/ai-web-experience-collection/`.
- Chromium through Playwright, Vite dev server: 1440×900, 390×844, 768×1024 and 2560×1440 load with all local fonts loaded and no font errors, no broken images, no horizontal overflow, the return control visible at 44 px height; wheel scroll to the end and fast reverse; reload in the middle; simulated tab hide/restore; PageDown, End and Home; resize 900×700 and back; reduced motion starts no smooth scrolling.
- Chromium on the project-path production preview: entered from the Collection gallery, primary controls exercised (A gentle pull, the three inspection focuses and the catch / clearance comparisons) with visible state changes, reload, and the return control landed on `#world-mend` inside the viewport.
- No console errors, no failed requests and no requests outside the site origin in these sessions.

## Carried from the supplied delivery

Upstream lists final desktop/mobile screenshots, complete real-input paths, other viewports, zoom, the 45 transition samples and visual contact of the supports as unverified (`provenance/mend/upstream/docs/ACCEPTANCE.md`).

## Notes

At 390×844 the live 3D toy overlapped the hero introduction, which upstream never verified on phones. Fixed on 9 November 2026: up to 760 px the opening stage sits below the copy (`height: max(230px, 100svh − 530px)`, soft top edge), following the supplied portrait hero in which the toy fills the lower half. Checked at 390×844, 430×932, 760×900 and 360×640 (on the shortest screen the buttons still touch the stage's faded top edge); desktop and later chapters are unchanged.

## Smoothing, 9 November 2026 (owner request)

Chapter count and name, scene label and diagram captions fade out and in; the scene label is written once per frame; the numbered inspection points fade instead of toggling `hidden`. Edited: `src/main.ts`, `src/diagrams.ts`, `src/style.css`, `pages/mend/index.html`.

Checked in Chromium at 1440×900 and 390×844 with a frame-by-frame scroll probe (wheel steps of 90 px): no narrative text or picture changes opacity by more than a third in one frame or changes its words while visible. `npm test`, `npm run build` and `npm run verify:build` pass.

## Not tested

Physical phones and touch, iOS Safari, Firefox, high-refresh displays, real browser zoom, screen readers, throttled or cold network loads and long sessions.
