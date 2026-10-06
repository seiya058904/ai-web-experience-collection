# FACET, SILICON, ATLAS and THRUST — Collection acceptance, 2026-10-06

This record describes the imported Collection production build. Scoped upstream documents preserve historical standalone claims; they do not certify the Collection integration.

## Delivery and import boundary

| Work | ZIP bytes | Entries | Original SHA-256 |
| --- | ---: | ---: | --- |
| FACET | 1,057,114 | 65 | `f14688ce19b8fa31680530988b90406b846ff1194baa806a35e134ea647ef995` |
| SILICON | 651,019 | 62 | `08c71aeda6e101a60a6b9e706cb03479913a52238fd7bf213a4bd8a2e8cbf868` |
| ATLAS | 38,368,972 | 182 | `51b9efba98ce134388fffc54661586be148bfa3d4bd7f02438a7d52dbc1d03af` |
| THRUST | 694,889 | 51 | `8c4324902d0469194438af8516d1bca16debfee81bf732a24f0a16570d821f9f` |

Archives were inventoried before extraction into a fresh external directory. Entry paths, single expected roots, entry types and CRCs passed. Original archives remain unchanged in `D:/下载/`; their sizes, modification times and every original entry hash are in the delivery manifest.

Source, pages, resources, design records and provenance use the four namespaced directories. No standalone manifests, lockfiles, installed modules, compiled application duplicates, build/server configuration or ZIPs entered Git/deployment. Existing dependency versions and the root lockfile are unchanged. Thirteen local font files, original imagery, icons and all 23 ATLAS geographic runtime resources retain their supplied binary hashes. ATLAS source lineage, acquisition metadata and original offline tools remain under scoped provenance; unique raw acquisition binaries remain traceable in the unchanged external ZIP.

Each work has an independent HTML document, base-aware resources/identity, shared Collection return, native gallery entrance and complete credits. The seventeen-work social preview uses native media/runtime captures. FACET and SILICON retain one Lenis instance and one GSAP ticker each. ATLAS and THRUST retain native scroll and one owned RAF each.

## Confirmed issues and scoped repairs

- **CONFIRMED-RUNTIME:** ATLAS's globe loaded an unnamespaced geographic URL after integration, received HTML and failed to render. Its regional and globe loads now use the same base-aware ATLAS namespace; the final globe and reverse journey load correctly.
- **CONFIRMED-RUNTIME:** ATLAS's failure overlay intercepted the masthead Collection return. The overlay now sits below the masthead; failure colors remain readable and production guidance gives visitors usable next steps. Forced WebGL failure, field notes and native return passed.
- **CONFIRMED-RUNTIME, visual:** SILICON's portrait tablet camera cropped the right-hand structures at 768×1024. Its portrait desktop frustum now accommodates the authored objects without changing their poses or ordinary desktop/mobile camera framing. All eight tablet scenes were recaptured and inspected. Chapter and auxiliary labels retain an 11 CSS pixel floor, with chapter names wrapping at narrower desktop widths.
- **CONFIRMED-RUNTIME, visual:** THRUST's mobile blade heading lost local contrast against bright metal. A small heading shadow improves separation while preserving its copy, camera and geometry.
- **CONFIRMED-STATIC, integration:** FACET, SILICON and ATLAS release owned runtime resources on normal exit/HMR and guard late asynchronous completions. FACET/SILICON remove their owned GSAP callback while hidden. Real hidden-tab paint suspension, resumption and document BFCache recovery passed for all four works. SILICON's supplied inspection hook is development-only.
- Gallery captures suppress visible scene copy directly, avoiding duplicated source headings under the Collection typography. Supplied fonts/licenses and current documentation links follow their scoped Collection paths.

## Checks performed

Environment: Windows, Node 24.15.0, Chromium 151.0.7922.34 and the bundled Playwright. The Browser plugin was unavailable. WebGL used SwiftShader; this is browser behavior/visual evidence, not native GPU performance evidence.

- `npm test`: **118 passed**, including the existing tests and supplied FACET/THRUST model tests. Supplied assertions retain their meaning; imports/extensions were adapted to the root test runner.
- Root and project-path `npm run build` / `npm run verify:build`: passed; **424 HTML/CSS resource references** verified at both `/` and `/ai-web-experience-collection/`.
- Source/import hashes, unchanged binary resources and original ZIP rehashes: passed. The supplied offline ATLAS checker passed 147 source/provenance hashes, 23 runtime resources, six finite elevation grids, matching contours and vectors, and all 142 connected route segments. Its numerical contour agreement is not a survey-accuracy claim.
- All **36 chapters** were rendered and visually inspected at **390×844, 768×1024, 1440×900, 1920×1080, 2560×1440 and 3840×2160**: 216 chapter frames across 24 route/viewport cases. Final targeted repairs were recaptured. Normal sessions recorded zero application errors, failed resources or horizontal overflow.
- **52 control/navigation checks** passed at desktop/mobile: native home/work/return, every chapter, direct refresh/read position, dialogs and all supplied primary controls. FACET covers cut, polish, color/material selection, translucency, optical angle, six specimen inspections, keyboard rotation/reset, language and motion. SILICON covers exposure/layer/assembly controls, auto restoration, gate/power, motion, process/About/transcript. ATLAS covers index/source views, quiet motion, globe and replay. THRUST covers blade reveal, pointer inspection, pause, opt-in sound, quality, index and replay. Reduced-motion contexts traversed every chapter in all four works.
- **54 recovery/fallback/home checks** passed: immediate-load input; slow, normal, fine and high-frequency wheel; fast down/reverse; arbitrary stops; responsive normalized read-position retention; real hidden-tab suspension/resumption; unavailable-WebGL editions/error views and their native returns; seventeen native entrances without JavaScript. Hidden pages submitted no additional instrumented Canvas/GPU paints during the measured interval.
- Raw Chromium/CDP document Back tests confirmed **actual BFCache restoration in all four works** (`pageshow.persisted=true`), identical outgoing read positions and working subsequent wheel input.
- All four new gallery frames were inspected at the six main sizes. VERDANT's unchanged opening received focused wide/short checks at 2560×1080 and 1920×720. Existing work runtimes were not changed or subjected to a repeat of their complete historical acceptance suites.
- Manual Impeccable detection was reviewed against authored visual contracts. Instrument Serif warnings concern established typography; the homepage hierarchy warning assumes default sizes rather than the external stylesheet. Those warnings do not justify replacing the work identities. The final ATLAS failure-style scan returned no findings.
- `git diff --check` and final source/provenance inspection passed before closeout. Both production license inventories and namespaced notices are present.

## Evidence, counter-evidence and limits

Drivers, JSON reports, logs and screenshots remain outside Git/deployment in `C:/Users/admin/AppData/Local/Temp/collection-intake-20261006-four-19o15oh1/`. Named reports are `project-qa/report.json`, `controls-qa/results.json`, `recovery-qa/results.json`, `back-qa/results.json` and `home-qa/results.json`.

Two initial control assertions reflected incorrect harness assumptions: mobile FACET arrows are intentionally hidden, and pressing End on an already-maximized SILICON assembly slider does not emit input. The harness was corrected without changing these behaviors. An interrupted preview was restarted without its project base, producing readiness timeouts; the documented explicit `--base` preview restored the correct routes. The ATLAS failure-return obstruction was an application defect and was repaired/retested. These earlier results are retained separately from passing checks.

The existing VEIL late-CSS-import warning remains; its source is unchanged. No lint script exists. Local fresh dependency installation was unnecessary; CI performs `npm ci`. Audio toggle/state behavior was exercised, but speaker output/timbre was not judged. Physical touch, iOS/Safari, high-refresh hardware and native GPU/device frame rates remain unverified.

This committed record is local pre-release acceptance. Each release still requires successful CI/Pages, exact deployed artifact/asset byte comparison and core live desktop/mobile checks; task closeout reports their actual results and exact commit separately.
