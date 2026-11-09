# PAS — Collection acceptance

## 9 November 2026

- Source ZIP hash, byte length and entry count match the approved inventory; every entry is listed in `provenance/deliveries/import-manifest.json`. Imported runtime files are byte-identical to the ZIP except the integration edits below.
- Integration edits: `assets.ts` (frame/asset base under `pas/`), `render/character.ts` (model/texture base under `pas/`), `main.ts` (font imports moved to `style.css`; return control), `style.css` (Bodoni Moda and Manrope from `/aeterna/fonts/`).
- Supplied tests ported and passing: 18 (tests/pas-motion.test.ts). `npm test`, `npm run build` (`tsc --noEmit` + Vite) and `npm run verify:build` pass at `/` and at `--base=/ai-web-experience-collection/`.
- Chromium through Playwright, Vite dev server: 1440×900, 390×844, 768×1024 and 2560×1440 load with all local fonts loaded and no font errors, no broken images, no horizontal overflow, the return control visible at 44 px height; wheel scroll to the end and fast reverse; reload in the middle; simulated tab hide/restore; PageDown, End and Home; resize 900×700 and back; reduced motion starts no smooth scrolling.
- Chromium on the project-path production preview: entered from the Collection gallery, primary controls exercised (Enter the duet) with visible state changes, reload, and the return control landed on `#world-pas` inside the viewport.
- No console errors, no failed requests and no requests outside the site origin in these sessions.

## Carried from the supplied delivery

Upstream `docs/VERIFICATION.md`: the optional WebGL route was never visually verified upstream (no WebGL context there); untested browsers, hardware and assistive technologies remain unverified.

## Notes

Frame loading: scrolling the whole duet requested 1,763 frame/asset files at 1440×900 and 229 at 390×844 with no failures; the JS heap stayed about 27 MB. `?renderer=webgl` created a 1430×900 canvas and loaded both models without errors or fallback in Chromium.

## Not tested

Physical phones and touch, iOS Safari, Firefox, high-refresh displays, real browser zoom, screen readers, throttled or cold network loads and long sessions.
