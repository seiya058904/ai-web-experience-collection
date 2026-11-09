# AER — Collection acceptance

## 9 November 2026

- Source ZIP hash, byte length and entry count match the approved inventory; every entry is listed in `provenance/deliveries/import-manifest.json`. Imported runtime files are byte-identical to the ZIP except the integration edits below.
- Integration edits: `main.ts` (panorama base under `aer/`; four missing number separators added to the wind-profile balloon path, which the browser rejected with two console errors and did not draw), `styles.css` (local fonts).
- Supplied tests ported and passing: 25 (tests/aer-journey.test.ts, tests/aer-keepsake.test.ts, tests/aer-scene-invariants.test.ts). `npm test`, `npm run build` (`tsc --noEmit` + Vite) and `npm run verify:build` pass at `/` and at `--base=/ai-web-experience-collection/`.
- Chromium through Playwright, Vite dev server: 1440×900, 390×844, 768×1024 and 2560×1440 load with all local fonts loaded and no font errors, no broken images, no horizontal overflow, the return control visible at 44 px height; wheel scroll to the end and fast reverse; reload in the middle; simulated tab hide/restore; PageDown, End and Home; resize 900×700 and back; reduced motion starts no smooth scrolling.
- Chromium on the project-path production preview: entered from the Collection gallery, primary controls exercised (At rest / Held open, the three balance presets and Reset the experiment) with visible state changes, reload, and the return control landed on `#world-aer` inside the viewport.
- No console errors, no failed requests and no requests outside the site origin in these sessions.

## Carried from the supplied delivery

Upstream `docs/KNOWN-GAPS.md`: the hero is a static photograph, most chapter handovers are document flow rather than continuous camera moves, CH08 uses three separately authored photographs, the WebGL scene was never browser-verified upstream, and final layouts were not fully accepted. These gaps are carried unchanged.

## Notes

The lazy Three.js flight study was not inspected frame by frame here; scrolling through its chapters produced no console errors.

## Not tested

Physical phones and touch, iOS Safari, Firefox, high-refresh displays, real browser zoom, screen readers, throttled or cold network loads and long sessions.
