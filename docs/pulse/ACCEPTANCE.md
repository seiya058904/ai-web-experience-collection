# PULSE — Collection acceptance

## 11 November 2026

- Source ZIP hash, byte length and entry count match the inventory; every entry is listed in `provenance/deliveries/import-manifest.json`. Imported runtime files are byte-identical to the ZIP except the integration edits below (55 of 57 kept files are byte-identical).
- Integration edits: `main.ts`, `styles.css`; `pages/pulse/index.html` replaces the supplied `index.html`. Smoothing edits are listed below.
- Supplied tests ported and passing: tests/pulse-content.test.mjs, tests/pulse-media.test.mjs and tests/pulse-story.test.mjs. `npm test`, `npm run build` (`tsc --noEmit` + Vite) and `npm run verify:build` pass at `/` and at `--base=/ai-web-experience-collection/`.
- Chromium through Playwright, on the Vite dev server and on the project-path production preview: 1440×900 and 390×844 load with the work’s local fonts loaded and no font errors, no broken images, no horizontal overflow, the return control visible at 44 px height; entered from the Collection gallery, reloaded mid-page, and the return control landed on `#world-pulse` inside the viewport.
- No console errors, no failed requests and no requests outside the site origin in these sessions.

## Smoothing, 11 November 2026

Scroll-driven words in this work (chapter indicator, transition captions or stage labels) were written in one frame. They now go through `softText` from `experiences/shared/soft-swap.ts`, instantly in the work’s own reduced or still mode.

A frame-by-frame wheel probe (90 px steps down the whole page at 1440×900) found no scroll-driven narrative text that changes its words while visible after the change. Pictures that appear when a not-yet-decoded image arrives (cold cache) are load reveals, not authored handoffs, and were not changed.

## Soft handoffs, 11 November 2026 (owner request)

The owner found the source/target reveals abrupt. Hard-edged `clip-path` wipes were replaced by feathered `mask-image` reveals from `experiences/shared/soft-reveal.ts`, driven by the same continuous scroll progress (no timer and no extra easing layer); endpoints are unchanged (nothing of the incoming picture at 0, all of it at 1). Shapes that cannot be feathered keep a hard clip. Pictures that finish decoding fade in instead of appearing in one frame. Reduced and still modes stay instant. `tests/soft-reveal.test.ts` covers the mask conversion. Checked in Chromium at 1280×800 with mid-transition filmstrips; no console errors.

## Not tested

Physical phones and touch, iOS Safari, Firefox, high-refresh displays, real browser zoom, screen readers, throttled or cold network loads and long sessions. The upstream records list their own limits under `provenance/pulse/upstream/`.
