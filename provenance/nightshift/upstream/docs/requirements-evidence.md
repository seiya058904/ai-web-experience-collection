# NIGHTSHIFT requirements and evidence

Reviewed: **2026-11-09** against the supplied Edition 2.0 brief. **Overall strict acceptance: BLOCKED.** The complete local story and the tested functional/visual scopes are delivered, but the required browser-find, true browser-zoom, and actual background/lifecycle checks cannot be established in this headless fixture. Exact photographic projection and uninterrupted human video playback are not certified. The candidate source ZIP has passed independent extraction, installation, rebuild and preview verification. The exact final archive is re-extracted after documentation is finalized; its final byte count/hash are reported at handoff. There is no blanket H1–H9 PASS.

A `PASS` applies only to the observation named in its row. Allowed statuses are `NOT STARTED`, `IN PROGRESS`, `READY TO TEST`, `PASS`, `FAIL`, `BLOCKED`, and `NOT TESTED`. Environment limitations are kept distinct from application failures and from tests that were never performed. See [evidence-index.md](evidence-index.md) for artifacts and [known-limitations.md](known-limitations.md) for the remaining boundaries.

## Evidence versions and provenance

| Record | Observed result | Version / scope |
| --- | --- | --- |
| `evidence/browser-results.json` | 31 passed, 0 failed, 0 flaky, 1 intentionally skipped duplicate viewport sweep | Main suite on `index-5ebL6gaK.js`; desktop 1440×900 and phone emulation 390×844. The desktop project owns the supplemental sweep. |
| `evidence/records/targeted-regressions.json` | 6 passed, 0 failed | `index-BuBD98b4.js`: adaptive CH-10 arrival at desktop, phone and 4K; expanding content remeasurement; modal wheel cancellation; failed variant recovery. |
| `evidence/records/build.txt`, `unit-tests.txt`, `static-audit.txt` | Production build; 16 state tests passed; static content audit PASS; exact count in its retained log | Final `index-DLeUPCK4.js` / `index-D0j9bzfP.css`. Static checks do not claim browser verification. |
| `evidence/records/captures.json` | 122 records: 22 chapter holds and 100 nominal transition stages; 0 page errors/overflow; all 199 visible-stage images full resolution | Desktop and phone. The record explicitly identifies the final phone CH-08 replacement; unchanged compositions retain their earlier captures. It does not itself fingerprint every capture's bundle. |
| `evidence/records/hero-states.json` | 12 captures, PASS, 0 errors | Six states on desktop and phone; first HTML frame captured with application JavaScript delayed 900 ms. |
| `evidence/records/reading-holds.json` | 25 captures: all 22 second beats and 3 corrected CH-08 phone holds; 0 errors/overflow/faded beats | Final production build; CH-08 opening checked at 320×700, 360×640 and 390×844. |
| `docs/independent-visual-review.md` | All 7 material findings resolved; scoped visual source-delivery verdict | Independent image review, including selected hero versus actual rendering. It is not complete interaction, device or accessibility approval. |
| `evidence/records/input-lifecycle.json` | 6 passed, 0 failed, 3 blocked; one pass is explicitly synthetic | Final build. Five actual-input/no-JavaScript groups pass; browser find, real background visibility and trusted freeze/resume are blocked. |
| `evidence/records/performance.json` | MEASURED; stable fingerprints | Final DLeUPCK4/D0j9bzfP. Raw directory fingerprints also include retained older unreferenced files; Resource Timing confirms requests for the final bundle. |
| `evidence/records/motion-zoom.json` | Actual movie and scoped frame inspection; reflow PASS; true zoom BLOCKED | Specific earlier BuBD98b4/BMd4_mOq build. The later change only repositions the CH-08 phone reading panel; these desktop boundaries were not recaptured under a new hash. |
| `evidence/records/extracted-build.json`, `.txt`, extracted unit/audit logs | Candidate extraction PASS; independent locked install/build; 16 state tests; 3 rendered chapter probes; 34/34 media responses | Candidate ZIP: 48,480,932 bytes; 366 manifest-file hashes checked. Exact final packaging is verified after these documentation updates. |
| `ASSET-PROVENANCE.md`, three generation JSON records | 21 actual image-generation outputs: 17 production images and 4 compressed evidence images | All retained asset paths are project-relative. Original working PNGs are not runtime dependencies. |

The records are complementary; the complete suite was not silently relabeled as a full rerun of the last CSS-only build. Earlier failed attempts remain historical evidence, superseded only by the relevant observed reruns.

## H1–H9 summary

| ID | Requirement | Implementation path | Test method | Evidence / boundary | Status |
| --- | --- | --- | --- | --- | --- |
| H1 | All 11 distinct chapters, two beats, readable holds and complete ending | `src/content.ts`, `src/markup.ts`, `src/styles.css`, `public/story.html` | Exact-copy/structure audit, complete desktop/phone path, 22 second-beat captures, control checks | All 11 chapters and interactions present. CH-10 now has separate before/arrived plates and scroll-owned progression, including corrected 4K timing. See chapter table. | PASS |
| H2 | Six actual hero states with selected desktop/portrait art | hero assets, `src/story-controller.ts`, markup/CSS | 12 actual captures; three forward/return cycles per main-suite project; independent concept/render comparison | `hero-states.json`, main suite, visual review. Reveal is bounded exposure; traffic is a small desktop-only overlay, not character animation. | PASS |
| H3 | At least eight real generated art outcomes and provenance | `ASSET-PROVENANCE.md`, `docs/core-art.json`, `supplemental-art.json`, `additional-art.json` | Inspect tool outputs, roles and selection records | AI-01–08 and 13 supporting outputs exist; 17 production and 4 evidence WebPs. No invented seeds, rights grants or camera metadata. | PASS |
| H4-FUNCTION | All 10 authored stages, reverse/direct state, mobile treatment and scene fallback | `src/story-state.ts`, `src/story-controller.ts`, `src/media.ts`, transition ledger | Five-stage desktop/phone capture and functional evaluation; direct midpoints; high-risk seam-neighbor checks | All 10 pass this bounded functional/capture scope. Detailed exact-projection requirement is separate below. | PASS |
| H4-PROJECTION | Exact photographic landmark/projective continuity required by the stricter handoff contracts | Same files; selected images | Measured landmark UVs, cover transforms, line slope/spacing and projection comparison | Guide coordinates are editorial screen positions. No calibrated image-to-image projection dataset or proof of exact physical match is supplied. H4 is not fully accepted by the functional row alone. | NOT TESTED |
| H5 | Real Lenis, one state/clock, complete input and history paths | controller, state evaluator, lockfile | Main suite plus native keyboard, touch, scrollbar and renderer-find probes | Wheel, keys, touch emulation, native scrollbar, links, hashes, history, reload and resize pass. Native `window.find` also fails on a plain control page; browser-chrome Ctrl+F is untested. | BLOCKED |
| H6 | Real selectable English and readable responsive/font/zoom states | HTML, content, markup, SVG and CSS | Static/visible-text audit, bounding boxes, captures, font delay, true zoom attempts | Tested typography and reflow pass. 125/150/200% true keyboard zoom leaves viewport/DPR unchanged in the shell. Reflow emulation is not substituted as true zoom. | BLOCKED |
| H7 | Build, real browsing, independent review, repair and retest | build/test/capture scripts and records | Actual production preview, functional suite, visual corrections, targeted reruns | Final build/state/audit logs, 31-pass suite, 6 targeted passes, 7 resolved visual findings. Continuous full-video human review remains separately NOT TESTED. | PASS |
| H8 | Complete alternatives and recovery, including real lifecycle restoration | media/controller/interactions; still edition | Reduced mode, failed/delayed assets/fonts, unavailable WebGL, resize, no-JS, slow startup, lifecycle probes | Tested alternatives pass. Actual tab hiding and trusted freeze/resume cannot be reached in this headless runtime. Synthetic visibility branch is explicitly separate. | BLOCKED |
| H9-SOURCE | Private portable source candidate, separately extracted and rebuilt | source, lockfile, README, notices and candidate archive | Independent `npm ci`, production build, state/content tests and local first/middle/last/media verification | `extracted-build.json` / `.txt`: PASS; 366 manifest-file hashes checked, 16 state tests, CH-01/06/11 with correct full images, all 34 production/fallback media responses valid. | PASS |
| H9-FINAL | Exact final archive after documentation/evidence updates | Final ZIP and handoff checksum | Re-extract the delivered bytes after final packaging | Candidate runtime verification is complete; final artifact identity/check is the packaging owner's last step and is reported at handoff. | READY TO TEST |

## Eleven chapters and both beats

For each `NN`, the retained holds are `evidence/screenshots/{desktop,mobile}-ch-NN.jpg` and `...-ch-NN-second-beat.jpg`. All primary heading/body strings are checked against the brief; all eleven second beats are recorded at readable native-scroll holds. `public/story.html` retains the complete text, four static image comparisons, five informative routes and six trace results without JavaScript.

| ID | Distinct observations and real control outcome | Additional evidence | Status |
| --- | --- | --- | --- |
| CH-01 | Unlit city and single warm room; worker/window observation; fictional-city note | Six-state hero record; note dialog/focus and three return cycles | PASS |
| CH-02 | Parallel work lights; a selected place/purpose; five filters, All routes reset and real chapter links | Main suite atlas checks; accessible SVG and text result | PASS |
| CH-03 | Hands and dough; prepared workbench; actual Before/After image change | Bakery control test; corrected phone composition; variant-failure targeted test | PASS |
| CH-04 | Quiet corridor; water/linen preparation; fictional scene note | Care dialog and focus tests; patient-free composed art | PASS |
| CH-05 | Grit/leaves; cleared curb; range, arrows, Before/After and reset | Distinct assets; comparison state survives chapter return | PASS |
| CH-06 | Full quiet line; close hardware observation; conceptual Surface/Section | Conceptual SVG, five-stage seams, long-title risk checks | PASS |
| CH-07 | Supported pipe detail; gallery/human attention; illustrative water path | Diagram open/close and dynamic layout remeasurement; correct fallback/retry | PASS |
| CH-08 | Closed equipment inspection; steady lamp relationship; explanatory disclosure | Final phone panel exposes inspector/clipboard at 320/360/390 widths | PASS |
| CH-09 | Sorting aisle; organized stems at first light; meaningful image toggle | Hands restored in phone crop; actual market variants and return state | PASS |
| CH-10 | Prepared platform before service; arrived vehicle/open door/boarding; local route recall | Scroll-deterministic photographic reveal at 1440×900, 390×844 and 3840×2160 | PASS |
| CH-11 | Opening city/window at dawn; six work/result traces and genuine revisit links | Direct finale visit, all six dialogs, exact focus return, original-window visual review | PASS |

These are photographic/SVG chapter outcomes. They do not claim a rotatable rail model, animated character rig, physically simulated vehicle or factual municipal workflow.

## Hero and transition coverage

| ID | Requirement / method | Retained evidence | Status |
| --- | --- | --- | --- |
| HERO-1 | Meaningful image before application JS | Delayed-JS first frame at both viewports in `hero-states.json`; local same-scene fallback | PASS |
| HERO-2 | Compact optional reveal without scroll lock | Actual exposure-reveal frames and state metadata | PASS |
| HERO-3 | Complete composition retains selected art and safe DOM type | Desktop/portrait complete frames; five-point independent hero review | PASS |
| HERO-4 | Readable living hold | Recorded hold; desktop miniature traffic, steady photographic lamp; phone ambient traffic intentionally absent | PASS |
| HERO-5 | Composed first scroll | Both five-stage sets, main-suite state assertions and real high-risk movie | PASS |
| HERO-6 | Exact scene return without reveal replay | Three actual forward/return cycles per main-suite project; return captures | PASS |
| TR-ALL | Ten boundaries, nominal 0/25/50/75/100% on both device classes | 100 files `evidence/screenshots/{desktop,mobile}-tr-AA-BB-{000,025,050,075,100}.jpg`; `captures.json` | PASS |
| TR-SEEK | Direct 50%, reverse evaluation and target identity | Main suite visits each direct midpoint and reverses; fresh initial TR-01-02 hash; pure random-seek tests | PASS |
| TR-NEIGHBOR | High-risk midpoint neighbors at .49/.50/.51 | Main suite for TR-01-02, TR-05-06, TR-06-07 on both projects | PASS |
| TR-VIDEO | Real forward/reverse recording of three difficult boundaries | 27.485-second MP4, actual-frame contact sheets and timing/count metadata | PASS |
| TR-VISUAL | Scoped sample inspection and rail/water adjacent-frame inspection | 30 progress samples, 43 adjacent encoded midpoint frames, final held frame; no blank/white flash observed in inspected set | PASS |
| TR-FULLWATCH | Uninterrupted human playback / every frame manually inspected | Recording exists; this broader review was not performed | NOT TESTED |
| TR-EXACT | Precisely calibrated photographic projection at every handoff | Editorial coordinates and opaque masks are documented; calibrated physical/projective proof is absent | NOT TESTED |
| TR-FAILURE-EACH | Independently abort every target at every boundary and every threshold neighbor | General primary/all-image failure and race probes pass; the exhaustive 10-boundary failure permutation is not recorded | NOT TESTED |

See [transition-ledger.md](transition-ledger.md) for the actual axis, mask, asset, guide coordinates, five stages and limits of each boundary.

## Controls, input, recovery and alternatives

| ID | Requirement | Implementation | Test / evidence | Status |
| --- | --- | --- | --- | --- |
| UI-01 | CTA/menu/11 links, correct focus and chapter identity | markup/controller/interactions | Main suite desktop and phone | PASS |
| UI-02 | All five routes, informative result, other routes retained, reset | content/diagrams/interactions | Main suite atlas test | PASS |
| UI-03 | Real curb layers; range arrows/buttons/reset; state persists | markup/interactions/CSS | Main suite comparison test | PASS |
| UI-04 | All six traces from a first visit to dawn; exact return focus | content/interactions | Main suite morning-trace test | PASS |
| UI-05 | Fiction/care/About dialogs; Escape; focus; background remains fixed | interactions/controller | Main suite plus targeted pending-wheel/modal cancellation | PASS |
| UI-06 | Bakery, market, rail, water, light and recall controls | interactions/diagrams | Main suite; expanded-water layout targeted test | PASS |
| UI-07 | Sound opt-in, actual AudioContext suspension, no sampled-audio dependency | original Web Audio in interactions | Main suite plus lifecycle instrumentation; audible output itself is untested | PASS |
| NAV-01 | One Lenis instance, one GSAP clock and deterministic state | controller/state | Installed source/API inspection; 16 state tests; `autoRaf:false`, `lenis.raf(time*1000)`, ScrollTrigger update/refresh and cleanup | PASS |
| NAV-02 | Wheel, Page/Arrow/Home/End keys, native scrollbar and phone gestures | controller/native flow | Main suite wheel; actual-keyboard, exposed-scrollbar drag and CDP touch input groups | PASS |
| NAV-03 | Hash/history, refresh, fast jump, reverse and responsive identity | controller/media tokens | Main suite reload/history/race/resize; targeted layout checks | PASS |
| NAV-04 | Native text find | browser renderer / native document | `window.find` returned false on both story and a visible plain control page; Ctrl+F chrome was not exercised | BLOCKED |
| REC-01 | Failed primary and all-image failure preserve correct scene/text/controls; Retry | media/controller/still edition | Main suite failure tests; targeted failed bakery variant and fallback recovery | PASS |
| REC-02 | Delayed art/fonts and stale response do not replace newer chapter | media request tokens; font/layout refresh | Main suite delayed resources and older-variant race | PASS |
| REC-03 | Actual tab background/return and opted-in audio suspension | visibility/audio handlers | Real second tab plus `bringToFront` never made the original document hidden | BLOCKED |
| REC-04 | Trusted browser freeze/resume | lifecycle fixture | CDP accepted frozen/active commands but emitted no trusted freeze/resume events | BLOCKED |
| REC-05 | Synthetic visibility branch keeps position and respects opt-in | same application handlers | Explicit test-only property override/events; no application source changes | PASS |
| REC-06 | Unsupported WebGL; used-path context-loss behavior | 2D photographic/SVG architecture | Main suite disables WebGL APIs. No runtime WebGL context exists, so GPU context-loss restoration is not a used pathway | PASS |
| ALT-01 | System/UI reduced mode and still view retain story/results | controller/CSS/interactions | Main suite on desktop/phone, complete content and controls | PASS |
| ALT-02 | No-JavaScript complete edition and working anchors | `scripts/build-still.mjs`, `public/story.html` | Actual JS-disabled desktop/phone browsers: 11 chapters, 22 beats, four pairs and links | PASS |
| ALT-03 | Slow startup still offers full text and current scene | media/fallback/HTML | One explicit slow-4G/4× CPU startup; not a whole-site real-network certification | PASS |

The synthetic lifecycle pass is not added to the actual background evidence. It cannot close REC-03/04 or H8.

## Responsive, typography and access scope

| ID | Configuration / test | Evidence and limitation | Status |
| --- | --- | --- | --- |
| VIEW-MAIN | 1440×900 and 390×844 full narrative | Main suite, 122 stage/hold captures, 22 second beats | PASS |
| VIEW-RISK | 320×700, 360×640, 768×1024, 1920×1080, 2560×1440, 3840×2160 | Main-suite risk sweep: hero, long rail title, rail/water midpoint, curb controls, dawn/dialog. It is not a full-path run at every size | PASS |
| VIEW-SHORT | 800×450 landscape | Same risk sweep | PASS |
| VIEW-BREAK | 638/640 and 799/801 CSS widths | Same risk sweep on both sides of principal tested breakpoints; exhaustive every-media-query neighbor testing is not claimed | PASS |
| VIEW-4K | Arrival completes before outgoing transition at 3840×2160 | Targeted regression and actual screenshot; CSS viewport emulation only | PASS |
| VIEW-PHONE8 | Corrected utility inspection hold at 320/360/390 widths | Three final captures and independent visual confirmation | PASS |
| TYPE-FONT | Fallback/loaded local fonts; delayed resources | Main suite delayed-font/art checks and real text bounds | PASS |
| TYPE-EN | English-only content, metadata, alt/aria, errors and UI | Static audit, main-suite visible text and chapter copy checks; a no-CJK scan is only a guard | PASS |
| TYPE-REVIEW | Selected compositions, bright backgrounds, reading holds | Independent scoped review and final full-image captures; no general WCAG certification | PASS |
| ZOOM-125 | True browser zoom 125% | Two trusted Control+Equal increments after reset; innerWidth/DPR/visual scale unchanged | BLOCKED |
| ZOOM-150 | True browser zoom 150% | Three increments; unchanged measurements | BLOCKED |
| ZOOM-200 | True browser zoom 200% | Five increments; unchanged measurements | BLOCKED |
| REFLOW | Equivalent 125/150/200% viewport/DPR combinations | 1152×720/1.25, 960×600/1.5, 720×450/2; bounds, scene and controls pass; expressly not true browser zoom | PASS |
| ACCESS-AT | Screen-reader applications and complete conformance audit | Semantic headings, SVG alternatives and tested focus do not establish assistive-technology conformance | NOT TESTED |
| DEVICE | Physical Windows/Android, Safari, real 4K/high-refresh displays | No such hardware/browser run is claimed | NOT TESTED |

## Work gates, measurement and handoff

| ID | Requirement | Implementation / method | Evidence / qualification | Status |
| --- | --- | --- | --- | --- |
| G0 | Inspect brief/tools and keep work private | Local project/tool inspection | Local development and preview only; no publication authorization | PASS |
| G1-SOURCES | Actually consult six exact primary sources and separate fiction | `docs/sources.md` | Reviewed 2026-11-09; MTA redirect and Lenis root timeout/official README fallback disclosed | PASS |
| G1-ART | Real required art, visual bible, provenance and story/transition plans | `ASSET-PROVENANCE.md`, `VISUAL-BIBLE.md`, generation records | 21 real outputs; no invented model settings, commercial license or real-world timetable | PASS |
| G2 | Browser de-risk all three difficult prototypes before extensive production | Chronological project gate | Early browser access was blocked/ambiguous. Later successful tests do not establish the required earlier sequence | NOT TESTED |
| G3 | Complete narrative before delivery | content/markup/media/still edition | All chapters, all boundaries, actual local outcomes; no placeholder late chapters | PASS |
| G4 | Independent art comparison and weakest-scene/transition correction | Visual reviewer and before/after captures | CH-03 and CH-08 were the weakest non-hero scenes; TR-07-08 weakest transition; all 7 material findings resolved at reviewed scope | PASS |
| G5-FUNCTION | Production build, real browser failures corrected and rerun | Build, main suite, targeted and lifecycle runners | Retained logs distinguish passing groups, blocked environment checks and historical attempts | PASS |
| G5-MOTION | Continuous real recording plus limited frame review | CDP real frames, actual held screenshots, FFmpeg | Recorded and inspected samples pass; uninterrupted human full-video playback remains NOT TESTED | PASS |
| PERF | Actual cold/art/ready/LCP/CLS/long-task/callback/memory measurements | `scripts/measure-performance.mjs` | Final stable build; 3 fresh contexts, 1 simulated slow network, rail/water traversal and 3 warmed memory round trips; detailed caveats in performance report | PASS |
| G6 / ZIP-REBUILD | Separate candidate extraction, locked install, build, preview and media verification | Independent dependencies in a separate extraction | `extracted-build.json`, build/unit/audit logs: PASS; 16 state tests, 3 chapter probes, 34/34 media HTTP200; no borrowed original dependencies | PASS |
| ZIP-CONTENTS | Portable source, chosen assets, lockfile, docs, licenses and useful evidence | Final packaging manifest inspection | Exclude dist/dependencies, caches/profiles/secrets, original working PNGs, unreferenced browser-report data and redundant adjacent midpoint JPEGs; retain final video, contact sheets, 30 selected motion samples and final screenshots | READY TO TEST |
| ZIP-HASH | Actual delivered archive identity | Hash final ZIP after final file updates | Candidate SHA-256 and 48,480,932-byte size are recorded in extracted-build.json; exact final bytes/hash belong to the handoff, not a guessed or self-embedded value | READY TO TEST |
| RELEASE | No deployment, public preview, push, PR/tag/release or collection mutation | Local-only execution | Source delivery does not authorize publication | PASS |

Full acceptance remains unavailable while the specified blocked/not-tested requirements remain. The source handoff should state those concrete limits, preserve the completed work, and avoid retroactively calling the chronological G2 gate passed.
