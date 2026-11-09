# RALLY — Collection acceptance

## 9 November 2026

- Source ZIP hash, byte length and entry count match the approved inventory; every entry is listed in `provenance/deliveries/import-manifest.json`. Imported runtime files are byte-identical to the ZIP except the integration edits below.
- Integration edits: `content.ts`, `scenes.ts`, `contact-scenes.ts` (asset base under `rally/`), `content.ts` (return control), `style.css` (local fonts).
- Supplied tests ported and passing: 31 (tests/rally-physics.test.ts, tests/rally-state.test.ts). `npm test`, `npm run build` (`tsc --noEmit` + Vite) and `npm run verify:build` pass at `/` and at `--base=/ai-web-experience-collection/`.
- Chromium through Playwright, Vite dev server: 1440×900, 390×844, 768×1024 and 2560×1440 load with all local fonts loaded and no font errors, no broken images, no horizontal overflow, the return control visible at 44 px height; wheel scroll to the end and fast reverse; reload in the middle; simulated tab hide/restore; PageDown, End and Home; resize 900×700 and back; reduced motion starts no smooth scrolling.
- Chromium on the project-path production preview: entered from the Collection gallery, primary controls exercised (Explore the positions, Show the open court, Before / Contact / After and the Topspin preset) with visible state changes, reload, and the return control landed on `#world-rally` inside the viewport.
- No console errors, no failed requests and no requests outside the site origin in these sessions.

## Carried from the supplied delivery

Upstream `docs/acceptance.md`: full entrance/hold/exit acceptance for every chapter is partial, the mobile chapter-2 clipping fix is not visually retested, and physical devices are unverified.

## Notes

One note hides its `<br>` at phone width, which joined two sentences (“moment.The”). Fixed on 9 November 2026 by a space before the `<br>` in `content.ts`; the wording is unchanged.

## Smoothing, 9 November 2026 (owner request)

The preparation caption fades with a dead band; replay event labels fade; court and flight SVG labels are written only when they change. Edited: `src/main.ts`, `src/scenes.ts`.

Checked in Chromium at 1440×900 and 390×844 with a frame-by-frame scroll probe (wheel steps of 90 px): no narrative text or picture changes opacity by more than a third in one frame or changes its words while visible. `npm test`, `npm run build` and `npm run verify:build` pass.

## Not tested

Physical phones and touch, iOS Safari, Firefox, high-refresh displays, real browser zoom, screen readers, throttled or cold network loads and long sessions.
