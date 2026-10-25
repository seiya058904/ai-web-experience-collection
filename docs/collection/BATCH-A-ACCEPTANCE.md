# Collection — Batch A acceptance (2026-10-25)

Scope: T01, T02, T04, T06 and shared-return T18. Starting HEAD `eab9bc8`; the audit baseline was older. The three/two/one-column gallery, order, native work documents, all 32 names and work runtimes are retained. No dependencies were changed.

## Findings and changes

- **T01:** the current HEAD already fixed COUNTERFORM's oversized main name. Its supporting sentence still overrode container sizing with viewport units; that override and FERRUM's phone-only viewport override were removed. Loaded-font checks covered every title, including the last row, at 320, 390, 700, 701, 1000, 1001, 1440, 2560 and 3840 CSS pixels. Text-node DOM ranges plus the loaded font's Canvas ink bearings/ascent/descent showed all 288 title ink bounds inside their panels. A raw DOM-range ascent at FOSSIL/3840 extends above the panel by 4px, but its painted glyph ink stays inside; no font-metric-only crop fix was applied.
- **T02:** the 32-source contact sheet confirmed competing screenshot UI in FORM, FUSION, GRID and COUNTERFORM. Only those four received new WebP captures of the existing integrated runtime. Temporary capture CSS hid interface/copy layers; no work source or original media was altered. GRID retains its actual specimen typography in the captured resource; the gallery frames the photographic portion with an explicit width crop that also works when the card and capture share an aspect ratio. COUNTERFORM retains its real R/counter and annotation; its gallery wash protects the complete name and its image crop exposes the counter. CODEX's cover lettering is artwork and stays. The other 28 images are unchanged.
- **T04:** all entrances now have stable `world-<route>` anchors. Same-tab primary entry stores this journey's route and viewport offset under an opaque session token; ordinary hrefs remain native. Return resolves to the base-aware source fragment, with the token only when it matches this work. An early home head script supplies `scroll-margin-top` before native fragment navigation. The module restores focus with `preventScroll`; it never performs a post-font scroll. Fresh visits do not restore old state. Work deep links/new tabs without a journey use their readable work anchor. Browser history remains native; no `history.back()` replacement or global scroll-restoration override is used.
- **T06:** reproduced the head/CSS-success, main-module-failure combination: all 33 panels had opacity zero. Removed the visibility/reveal gate and linked the Collection stylesheet independently of its module. Every entry is visible before enhancement; existing hover image/title/arrow behavior remains.
- **T18:** the shared return's transparent target is at least 44×44 CSS pixels; visible arrow/label sizing is retained.

## Preview review, all 32

| Work | Kept | Removed from preview capture |
|---|---|---|
| F1 | Silver concept car, racing studio | None; original unchanged |
| VERDANT | Pavilion, garden and reflection | None; original unchanged |
| ORBITAL | Earth horizon | None; original unchanged |
| GLAZE | Celadon vessel | None; original unchanged |
| KAGE | Frame sculpture and shadow | None; original unchanged |
| CHRONOS | Generated skeleton watch | None; original unchanged |
| INTERVAL | Pavilion, path and water | None; original unchanged |
| FORM | Actual ARC chair, studio shadow and registered drawing | Header, hero word, chapter copy/controls, captions, begin cue and rail |
| FUSION | Actual tokamak geometry/material/light | Header, narrative copy/labels, telemetry, footer controls, edge marks |
| GLASSHOUSE | Glass installation | None; original unchanged |
| VEIL | Cloth folds/material | None; original unchanged |
| OPTIC | Original camera | None; original unchanged |
| INKSCAPE | Paper and branching ink | None; original unchanged |
| FACET | Gemstone geometry | None; original unchanged |
| SILICON | Wafer surface | None; original unchanged |
| ATLAS | Geographic relief | None; original unchanged |
| THRUST | Engine geometry | None; original unchanged |
| RESONANCE | Resonant plate lines | None; original unchanged |
| AETERNA | Generated face plate | None; original unchanged |
| PARALLAX | Reassembled sculpture | None; original unchanged |
| LUTHIER | Violin material/opening | None; original unchanged |
| CODEX | Binding and cover lettering | None; original unchanged; cover title is artwork |
| MAGMA | Fractured material | None; original unchanged |
| FOSSIL | Fossil plate | None; original unchanged |
| URUSHI | Vessel and reflection | None; original unchanged |
| NIB | Nib material | None; original unchanged |
| CREMA | Machine and suspended drop | None; original unchanged |
| CRAVE | Pastry material | None; original unchanged |
| GRID | Actual specimen title, subtitle, folio, body/meta/place, photograph and mark | Header, journey caption/rail, experiment tools, invitation and in-specimen action; artwork typography retained |
| DOSE | Procedural tablet | None; original unchanged |
| COUNTERFORM | Actual Fraunces R/counter and anatomy caption | Header, opening narrative heading/copy, scene footer and chapter rail |
| FERRUM | Supplied sculpture still | None; original unchanged |

## Actual evidence and limits

Browser: installed Chromium 1248, headless, DPR 1. Viewport emulation is layout evidence, not physical touch, native 4K-panel or high-refresh certification. Actual runtime recaptures used software WebGL at 1600×1000. Review included the 32-image raw contact sheet, all 32 composed 1440-wide entrances, and the four changed compositions at 320/390/2560/3840. Loaded-font bounds covered the nine widths above. Shared return measured exactly 44×44 at 320/390 in KAGE, COUNTERFORM, GRID, GLAZE, F1 and ORBITAL, with no neighboring header link/button rectangle overlap and with the center hitting the return itself. Physical touch: **NOT_RUN** (no connected device).

Desktop explicit return checks for entries 20/28/32 (PARALLAX/CRAVE/FERRUM) retained their measured source offset with **0px delta** and restored focus; the font-ready check did not move them. External FERRUM deep linking returned to `#world-ferrum`; a fresh `/` remained at zero. At 390px, the same three entries also returned with 0px delta and focus restored. Back restored the native scroll offset exactly (17845px), Forward returned to CRAVE, and a new-tab entry used the clean work URL and work-anchor return. The independent reviewer found non-BFCache keyboard Back lost focus; a per-home-history-entry source id now restores focus with preventScroll (4713px preserved, active element world-crave). This does not override BFCache/native scrolling or restore unrelated visits. With the home module blocked and CSS retained, End reached the last panel fully visible (top 142px in the 844px window). A no-JavaScript context retained all 32 styled native entrances.

Local evidence directory (not committed): `C:\Users\admin\.codex\tmp\flagship-a-20261025\collection\`.

- `before-contact.png`, `after-home-contact-1440.png`: individual source and composed review.
- `before-module-failed-with-css.png`, `after-module-blocked-end-390.png`: failure-path evidence.
- `before-titles.json`, `after-title-ink.json`: initial Range and final loaded-font ink measurements.
- `return-results.json`, `history-results.json`: journey, focus/history/new-tab/fresh-visit checks.
- `header-results.json`, `header-<work>-<width>.png`: shared-return bounds/adjacency and frames.
- `<work>-runtime-before.png`, `<work>-runtime-clean.png`, `after-<work>-<width>.png`: capture and gallery composition states.

Build/unit/project-base checks are run once by the integrating agent for the complete Batch A; this scoped report does not claim independent completion of those shared gates.
