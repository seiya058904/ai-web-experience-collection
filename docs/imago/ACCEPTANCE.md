# IMAGO — Collection acceptance

## 9 November 2026

- Source ZIP hash, byte length and entry count match the approved inventory; every entry is listed in `provenance/deliveries/import-manifest.json`. Imported runtime files are byte-identical to the ZIP except the integration edits below.
- Integration edits: `media.ts` (art base under `imago/`), `content.ts` (return control), `style.css` (local fonts).
- Supplied tests ported and passing: 31 (tests/imago-narrative.test.mjs, tests/imago-state.test.mjs (compiled through tests/imago-source-loader.mjs with the root TypeScript; the supplied `--ignoreConfig` flag is TypeScript 7 only and was dropped)). `npm test`, `npm run build` (`tsc --noEmit` + Vite) and `npm run verify:build` pass at `/` and at `--base=/ai-web-experience-collection/`.
- Chromium through Playwright, Vite dev server: 1440×900, 390×844, 768×1024 and 2560×1440 load with all local fonts loaded and no font errors, no broken images, no horizontal overflow, the return control visible at 44 px height; wheel scroll to the end and fast reverse; reload in the middle; simulated tab hide/restore; PageDown, End and Home; resize 900×700 and back; reduced motion starts no smooth scrolling.
- Chromium on the project-path production preview: entered from the Collection gallery, primary controls exercised (egg view, Look closer, hatchling / third-instar selection, instar rows I and II) with visible state changes, reload, and the return control landed on `#world-imago` inside the viewport.
- No console errors, no failed requests and no requests outside the site origin in these sessions.

## Carried from the supplied delivery

Upstream records 55/55 desktop and phone checkpoints and lists as unverified: physical devices, Safari/Firefox, cold loads, browser zoom, reverse traversal, full screen-reader coverage and the cause of one harness long-jump timeout (`provenance/imago/upstream/docs/verification.md`).

## Notes

At phone width three supplied lines hide their `<br>`, which joined words (“beginsin”, “moments,aligned”, “flight.First”). Fixed on 9 November 2026 by a space before each `<br>` in `content.ts`; the wording is unchanged. A reload starts at the top because the work sets manual scroll restoration.

## Smoothing, 9 November 2026 (owner request)

Handoff stills cross-fade above one another from continuous progress instead of `hidden` switches at `round(p*4)`; captions and the chapter counter fade; steps have a dead band; band, bridge and flight overlays fade. Each handoff is longer (240svh, 220svh on phones, 1500px on short windows) so every still and caption rests. Edited: `src/main.ts`, `src/style.css`.

Checked in Chromium at 1440×900 and 390×844 with a frame-by-frame scroll probe (wheel steps of 90 px): no narrative text or picture changes opacity by more than a third in one frame or changes its words while visible. `npm test`, `npm run build` and `npm run verify:build` pass.

## Not tested

Physical phones and touch, iOS Safari, Firefox, high-refresh displays, real browser zoom, screen readers, throttled or cold network loads and long sessions.
