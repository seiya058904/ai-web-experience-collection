# OPTIC and INKSCAPE — Collection acceptance, 2026-10-06

This record covers the imported Collection production build. The scoped upstream READMEs and product records remain historical delivery claims.

## Delivery and scope

- OPTIC: 1,640,068-byte ZIP, 40 entries, SHA-256 `a406b091bdb6388608e7c4b3900fdc2e6eb1621557cbb09d0c8eb14b645000f7`.
- INKSCAPE: 6,167,353-byte ZIP, 92 entries, SHA-256 `ae82bf5ab7264fed5102b982f027eaa074355e0bff4323a031c56cac11d8158e`.
- Both archives were inventoried before fresh external extraction; paths, entry types and CRCs passed. Original ZIPs remain in `D:/下载/`. The import manifest retains every original entry's path, size and SHA-256.
- Imported source, documents, resources and provenance use the two scoped directories. The seven supplied WebP studies, seven WOFF2 files and two SVG icons remain byte-identical. Generated images retain their original provenance and usage caveats.
- No standalone package manifests, lockfiles, installed modules, compiled bundles, servers or ZIPs entered Git. Root dependencies and the lockfile are unchanged.
- Added independent HTML routes, base-aware assets/identity, Collection return links, gallery captures, credits, sitemap and build assertions. Collection records now describe thirteen works.
- OPTIC retains native scroll and its supplied owned RAF. INKSCAPE retains one Lenis instance and one GSAP ticker.

## Confirmed issues repaired

- INKSCAPE's mobile Ink bloom crossed the explanation. Its mobile Ink hold now moves down while retaining the Water opening and Paper handoff.
- The tablet Mark seal overlapped the explanation. Its tablet placement now clears the copy; the authored mobile override remains.
- Small INKSCAPE movement/navigation labels now have a minimum 11 CSS pixels. Computed sizes and control separation were checked across all chapters at seven viewport sizes.
- INKSCAPE now removes its ticker while hidden, resumes on visibility/pageshow, and disposes owned resources on normal exit/HMR. Deferred callbacks guard disposal. Real hidden-tab rendering suspension and BFCache restoration passed.
- OPTIC's no-JavaScript notice covered its masthead return. The notice now exposes a native Collection return link.

## Checks performed

Environment: Windows, Node 24.15.0, Playwright 1.62.1, Chromium 151.0.7922.34. The Browser plugin was unavailable, so the bundled Playwright browser was used. WebGL ran through SwiftShader.

- `npm test`: 89 passed, including all 61 existing tests and 28 supplied OPTIC mechanics/structure tests. Imported OPTIC assertions are unchanged; only their source import paths moved.
- `npm run build` and `npm run verify:build`: passed at both `/` and `/ai-web-experience-collection/`; 335 HTML/CSS resource references verified for each.
- `git diff --check` and the staged whitespace check: passed.
- Source-to-import mappings and binary/font provenance hashes: passed.
- All seventeen new chapters rendered and were inspected at 390×844, 768×1024, 1440×900, 1920×1080, 2560×1440 and 3840×2160. No horizontal overflow or clipped headings/visible controls was detected.
- Primary controls passed at desktop/mobile: OPTIC focus, aperture, shutter/release, stabilization, index, motion and replay; INKSCAPE drop, wetness, fiber lens, marks/cap/clear, index, About, motion, previous and next.
- Both works passed direct entry, refresh, native home/work/return, all local font/media loads, all chapters under reduced motion, responsive resize and reading-position retention.
- OPTIC's complete Canvas2D edition and runtime WebGL context-loss fallback passed. INKSCAPE's intentionally failed material Canvas exposed all eight readable HTML sections and a usable return link.
- Thirty real-browser recovery/input checks passed: slow/normal/fine/high-frequency wheel, fast down/reverse, arbitrary stops, responsive normalized position, refresh, real tab hiding/restoration, document Back/BFCache, and INKSCAPE chapter history. Hidden tabs submitted zero additional instrumented Canvas/GPU paints.
- INKSCAPE's seven typography handoffs were checked forward/reverse at 1440 and 390 pixels; settled opacity and transform returned to the same values.
- Final INKSCAPE fixes passed all eight chapters at the six main sizes plus 360×800. DPR 3 rendering respected the supplied caps and remained usable after resize.
- Gallery entry/return passed for all eleven existing works. The thirteen native gallery links remained available without JavaScript. New gallery frames were inspected at all six sizes; VERDANT wide/short entry frames were also captured at 2560×1080 and 1920×720.
- Normal browser sessions recorded zero application errors and zero failed HTTP resources. The intentionally failed Canvas test emitted its expected initialization diagnostic.

## Evidence limits and counter-evidence

Temporary drivers, logs and screenshots are retained outside Git in the task's external import/QA directory. They are not deployed.

A shutter assertion initially ran before OPTIC's next owned frame; it was changed to wait for the accessible state. A handoff assertion initially sampled INKSCAPE's authored material-only pause and incorrectly required visible typography; the sampling points were corrected without changing the experience. Raw headed Chromium stayed hidden in this desktop session, so genuine tab visibility and BFCache were tested using raw headless Chromium over CDP with `noDefaults: true`, rather than simulated visibility properties.

The build still reports the existing VEIL late-CSS-import warning and the shared Three.js chunk size advisory. Neither is a new route failure. Local fresh dependency installation was not needed; CI owns `npm ci`. There is no lint npm script.

Physical touch, iOS/Safari, high-refresh displays, native GPU performance and device frame rates remain unverified. Existing works received entry/return regression checks, not a repeat of their complete previous acceptance suites.
