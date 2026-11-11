# CHRYSALIS — Collection acceptance

## 11 November 2026

- Source ZIP hash, byte length and entry count match the inventory; every entry is listed in `provenance/deliveries/import-manifest.json`. Imported runtime files are byte-identical to the ZIP except the integration edits below (83 of 88 kept files are byte-identical).
- Integration edits: `main.ts`, `media.ts`, `scenes.css`, `styles.css`, `transitions.ts` (plus the generated `content.d.ts`); `pages/chrysalis/index.html` replaces the supplied `index.html`. Smoothing edits are listed below.
- Supplied tests ported and passing: tests/chrysalis-reading-checkpoint.test.ts, tests/chrysalis-reading-position.test.ts and tests/chrysalis-story.test.ts. `npm test`, `npm run build` (`tsc --noEmit` + Vite) and `npm run verify:build` pass at `/` and at `--base=/ai-web-experience-collection/`.
- Chromium through Playwright, on the Vite dev server and on the project-path production preview: 1440×900 and 390×844 load with the work’s local fonts loaded and no font errors, no broken images, no horizontal overflow, the return control visible at 44 px height; entered from the Collection gallery, reloaded mid-page, and the return control landed on `#world-chrysalis` inside the viewport.
- No console errors, no failed requests and no requests outside the site origin in these sessions.

## Smoothing, 11 November 2026

Scroll-driven words in this work (chapter indicator, transition captions or stage labels) were written in one frame. They now go through `softText` from `experiences/shared/soft-swap.ts`, instantly in the work’s own reduced or still mode.

A frame-by-frame wheel probe (90 px steps down the whole page at 1440×900) found no scroll-driven narrative text that changes its words while visible after the change. Pictures that appear when a not-yet-decoded image arrives (cold cache) are load reveals, not authored handoffs, and were not changed.

## Soft handoffs, 11 November 2026 (owner request)

The owner found the reveals and the paired-study poses abrupt. Hard-edged `clip-path` wipes were replaced by feathered `mask-image` reveals from `experiences/shared/soft-reveal.ts`, driven by the same continuous scroll progress (no timer and no extra easing layer); endpoints are unchanged (nothing of the incoming picture at 0, all of it at 1). Shapes that cannot be feathered keep a hard clip. Pictures that finish decoding fade in instead of appearing in one frame. Reduced and still modes stay instant. `tests/soft-reveal.test.ts` covers the mask conversion. Checked in Chromium at 1280×800 with mid-transition filmstrips; no console errors.

## Pacing and framing, 11 November 2026 (owner request)

- Each of the ten handoffs was pinned for only 40% of a viewport of scrolling, so the whole reveal and camera move happened in about 360 px. The pinned stage is now 130 svh long (100 svh on phones), so the same continuous progress unfolds over roughly three times the distance. Stage captions follow the same progress.
- Transition plates have 6% overscan (was 3%), so the 0.92 scale and the horizontal shifts in the supplied ledger no longer expose the frame edge.
- Portrait tablets (701 px and wider, aspect below 1:1) cropped the egg and the adult off the right edge of the wide plates; the crop is shifted towards the subject (83%, 92% for the adult plates). Checked at 768×1024, 1440×900, 2560×1080 and 390×844.
- Defect fixed: in the three paired studies (hatchling/feeding, larva/pupa, pupa/adult) the wrapper switched to a single-column layout near the end, stacking the second pose below the first and pushing it half out of the frame, where it overlapped the caption. Both poses now stay in the two-up layout and only slide and fade; the single-column layout is used in reduced motion only. A check at 1440×900, 1616×1000, 768×1024 and 390×844 over nine positions of each paired transition found no visible layer outside the stage frame.

## Not tested

Physical phones and touch, iOS Safari, Firefox, high-refresh displays, real browser zoom, screen readers, throttled or cold network loads and long sessions. The upstream records list their own limits under `provenance/chrysalis/upstream/`.
