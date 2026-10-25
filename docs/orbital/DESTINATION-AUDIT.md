# Destination labels — T13 / 2026-10-25

Baseline `eab9bc8`: selecting Moon changed the artwork, selected tab and 384,400 KM readout, while the current chapter and timeline still said Mars. Reproduced in local Chromium 156.0.8078.4 at 1440×900, DPR 1.

The shared chapter name is now **Destinations**. Header, Mission Index, section accessible name, current chapter, rail accessible name, timeline and reading companion derive from the same existing `CHAPTERS` record. Moon/Mars remain the only destination tabs; Earth remains its own chapter. The existing `mars` identity, `#chapter-mars` anchor, geometry, timing and selection controls are preserved.

Browser checks passed for both Moon and Mars: selected tab, respective distance, stable current label, section accessible name, rail current step, Index row and timeline. Fresh load at `/orbital/#chapter-mars` reached the Destinations chapter (scrollY 9310 at 1440×900). Evidence is local and outside the repository: `C:\Users\admin\.codex\tmp\flagship-a-20261025\modes\before-orbital-moon.png`, `after-orbital-moon.png`, `after-orbital-mars.png`, and `results.json`. No physical-device, production-site or performance certification is implied. Broader navigation hierarchy and engineering control handoffs (T14/T15) are unchanged.

## Production-path fragment timing follow-up

The development-server deep-link success above did not reliably carry to the production build. Fresh `/ai-web-experience-collection/orbital/#chapter-mars` repeatedly remained on Earth at scrollY 0 and progress 0 in a 1440×900 Chromium viewport, despite the WebGL renderer being ready and no console/request errors. A phone load reached the destination in the same run. The browser's native fragment resolution could precede React's chapter insertion; leaving it to native timing was not deterministic.

The existing controller now resolves a known chapter fragment immediately after its geometry is ready. It does so only when the document has not already moved, there is no matching saved position, and this is not Back/Forward restoration. Existing native movement, input before controller readiness and saved restoration retain precedence. Explicit later hash changes resolve through the same immediate Lenis coordinate, with matching per-entry saved progress taking precedence over the chapter hold during same-document Back/Forward. The first regression pass caught a 135px same-document Back loss before this precedence was added; that failure remains in the temporary evidence. Unknown fragments and the separate reading companion retain their behavior. No new clock, destination identity or history entry is introduced. `tests/orbital-fragments.test.ts` covers recognized/unknown/reading fragments and restoration/input precedence.

Final local production-path regression PASS in Chromium 156.0.8078.4 / SwiftShader, DPR 1:

- Three fresh browser contexts each at 1440×900 and 390×844 loaded `#chapter-mars` into Destinations. Empty/unknown fragments remained on Earth at scrollY 0; a subsequent explicit chapter hash resolved correctly.
- Saved reload preserved scrollY 9580 exactly; same-document Back preserved 9580 and Forward preserved 7960. Cross-document Back preserved 7960; Forward returned to the Collection's ORBITAL anchor. Reading-companion Back preserved its paragraph position at 12990.
- With the production controller chunk delayed 1800ms, wheel input moved the document to 600 before readiness; it remained at 600 after initialization rather than jumping to the URL fragment.
- Moon and Mars on desktop/phone retained selected tabs, correct respective distance text, neutral current/section/Index/timeline labels and the correct rail step. The rail is hidden by the existing phone layout; its DOM label remains synchronized without exposing a new navigation surface.
- No uncaught page errors or failed requests in the final label/CHRONOS production matrix. The earlier failures are resolved; physical devices and production deployment remain NOT_RUN.

Final assertions are in the external `modes/orbital-production-fragments.json` and `modes/production-final.json`; screenshots are `production-orbital-<width>-<destination>.png`. The source regression command `node --experimental-transform-types --test tests/orbital*.test.ts tests/orbital*.test.mjs` passed 15/15, and TypeScript/scoped diff checks passed. Parent integration owns the full root/project-path builds and full suite.
