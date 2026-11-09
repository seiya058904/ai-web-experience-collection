# SENTE — Collection acceptance

## 9 November 2026

- Source ZIP hash, byte length and entry count match the approved inventory; every entry is listed in `provenance/deliveries/import-manifest.json`. Imported runtime files are byte-identical to the ZIP except the integration edits below.
- Integration edits: `story.ts` and `board-view.ts` (asset base under `sente/`), `story.ts` (return control), `style.css` (fonts from `/interval/` and `/atlas/`, background URL under `/sente/`).
- Supplied tests ported and passing: 61 (tests/sente-engine.test.ts, tests/sente-note.test.ts, tests/sente-session.test.ts). `npm test`, `npm run build` (`tsc --noEmit` + Vite) and `npm run verify:build` pass at `/` and at `--base=/ai-web-experience-collection/`.
- Chromium through Playwright, Vite dev server: 1440×900, 390×844, 768×1024 and 2560×1440 load with all local fonts loaded and no font errors, no broken images, no horizontal overflow, the return control visible at 44 px height; wheel scroll to the end and fast reverse; reload in the middle; simulated tab hide/restore; PageDown, End and Home; resize 900×700 and back; reduced motion starts no smooth scrolling.
- Chromium on the project-path production preview: entered from the Collection gallery, primary controls exercised (Place your first stone and board points A7/B7 (later points correctly refuse further play until the chapter advances)) with visible state changes, reload, and the return control landed on `#world-sente` inside the viewport.
- No console errors, no failed requests and no requests outside the site origin in these sessions.

## Carried from the supplied delivery

Upstream `docs/QA-REPORT.md`: not a full pass; native zoom, physical devices, screen readers, audible output, throttled performance and several lifecycle conditions are unverified.

## Notes

Up to 768 px two hero lines hide their `<br>`, which joined words (“stone,see”, “storyin”). Fixed on 9 November 2026 by a space before each `<br>` in `story.ts`; the wording is unchanged.

## Smoothing, 9 November 2026 (owner request)

Transition step words fade out and in with a dead band; step marks ease their colour. Edited: `src/motion.ts`, `src/style.css`.

Checked in Chromium at 1440×900 and 390×844 with a frame-by-frame scroll probe (wheel steps of 90 px): no narrative text or picture changes opacity by more than a third in one frame or changes its words while visible. `npm test`, `npm run build` and `npm run verify:build` pass.

## Not tested

Physical phones and touch, iOS Safari, Firefox, high-refresh displays, real browser zoom, screen readers, throttled or cold network loads and long sessions.
