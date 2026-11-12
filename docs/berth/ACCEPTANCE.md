# BERTH — Collection acceptance

## 9 November 2026

- Source ZIP hash, byte length and entry count match the approved inventory; every entry is listed in `provenance/deliveries/import-manifest.json`. Imported runtime files are byte-identical to the ZIP except the integration edits below.
- Integration edits: `main.ts` and `render.ts` (asset base under `berth/`), `render.ts` (return control), `styles.css` (local fonts).
- Supplied tests ported and passing: 22 (tests/berth-state.test.ts). `npm test`, `npm run build` (`tsc --noEmit` + Vite) and `npm run verify:build` pass at `/` and at `--base=/ai-web-experience-collection/`.
- Chromium through Playwright, Vite dev server: 1440×900, 390×844, 768×1024 and 2560×1440 load with all local fonts loaded and no font errors, no broken images, no horizontal overflow, the return control visible at 44 px height; wheel scroll to the end and fast reverse; reload in the middle; simulated tab hide/restore; PageDown, End and Home; resize 900×700 and back; reduced motion starts no smooth scrolling.
- Chromium on the project-path production preview: entered from the Collection gallery, primary controls exercised (lamp modes Reading / Soft / Off and three opening-line choices) with visible state changes, reload, and the return control landed on `#world-berth` inside the viewport.
- No console errors, no failed requests and no requests outside the site origin in these sessions.

## Carried from the supplied delivery

Upstream records partial browser verification: full-resolution mobile art, the five-position transition matrix, continuous slow forward/reverse review and several accessibility and failure cases remain open (`provenance/berth/upstream/docs/verification.md`).

## Notes

Two chapter decks hide their `<br>` at phone width, which joined words (“day.Another”, “room,seen”). Fixed on 9 November 2026 by a space before each `<br>` in `render.ts`; the wording is unchanged.

## Smoothing, 9 November 2026 (owner request)

Sequence and binding captions and the chapter counter fade, with a dead band around the half-way point. Fixed a supplied wheel trap: binding-card text kept `overscroll-behavior: contain` and `data-lenis-prevent` without overflowing, so a resting pointer stopped the page at about 77%; both now apply only while the text overflows. Edited: `src/scroll.ts`.

Checked in Chromium at 1440×900 and 390×844 with a frame-by-frame scroll probe (wheel steps of 90 px): no narrative text or picture changes opacity by more than a third in one frame or changes its words while visible. `npm test`, `npm run build` and `npm run verify:build` pass.

## Scroll ownership, 12 November 2026

The entrypoint loads Lenis CSS. The existing measurement clock now applies directory containment only while its native navigation surface really overflows, including after toggle, font load and resize. Fitting-directory document wheel, short-directory internal wheel and resize recovery pass in both motion modes in Chromium. The earlier binding-text guard remains intact. Six-size complete-frame review and shared results are recorded in [Collection acceptance](../collection/SCROLL-FONTS-ACCEPTANCE-2026-11-12.md).

## Not tested

Physical phones and touch, iOS Safari, Firefox, high-refresh displays, real browser zoom, screen readers, throttled or cold network loads and long sessions.
