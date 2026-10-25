# BACKSTAGE — actual acceptance and repair record

Acceptance date: **24 October 2026**. This document records executed checks, their evidence, repaired defects, and the limits of the test environment. It is not a claim of certification on untested hardware or browsers.

## Delivery and implementation

The delivered experience contains all five acts, three live scenes, a bounded audience-to-wings camera, a real sidelight control, production reset, ending return actions, persistent production choices, reduced motion, and a four-view static reading edition. The geometry, scenic paint, props, HTML and CSS are original. Five actual image-generation studies preceded production; two distinct hero compositions were compared. Their exact prompts, returned filenames, hashes and adoption decisions are in [IMAGE_GENERATION.json](IMAGE_GENERATION.json) and [VISUAL_BIBLE.md](VISUAL_BIBLE.md).

The stage is one persistent Three.js scene. Door, lantern, waves and floor rail share the revolve coordinate system. Room/coast faces are two sides of the same flat assemblies. The moon and star cloth follow finite mechanical paths. The renderer consumes one coordinated pose from `src/state.js`; one GSAP ticker advances Lenis, the director and rendering. There is no second application animation loop writing camera or scenery transforms. The original scenic research and distinctions from the supplied collection are recorded in [RESEARCH.md](RESEARCH.md).

Only local/private development and verification were performed. The source archive is the deliverable; no public site, repository publication or collection integration was created.

## Actual environment and methods

| Item | Observed environment |
| --- | --- |
| Runtime | Node.js 24.22.1, Linux x64, kernel 6.18.55 |
| Browser | Chromium 141.0.7390.37, installed Playwright 1.56.1 |
| Graphics | WebGL 2 through ANGLE SwiftShader software rendering |
| Main browser harness | Actual production files fulfilled to an isolated Chromium context; actual browser screenshots and DOM geometry |
| Cache and lifecycle complement | Headed Chromium on Xvfb and an ephemeral `127.0.0.1` HTTP server, with no request interception |
| Development complement | An isolated Vite server with the explicit project root, bound to an ephemeral local port |
| Normal capture mode | Animations and the actual production clock remain enabled; screenshots use CDP `Page.captureScreenshot` |
| Browser-plugin fallback | The connected browser navigation timed out twice; the cloud browser exposed a disabled graphics renderer. The installed Chromium was then used for actual WebGL verification. |

The acceptance harness reads public DOM state, native control values, text rectangles, real image bytes and sampled renderer diagnostics. It checks document overflow, simultaneously visible important text, decoded resources, nonblank rendered scenery, state continuity, prop identities and errors. Hidden text layers are excluded from text-overlap checks. Image review remains necessary for spatial occlusion and artistic quality.

`data-render-info` is refreshed at **2 Hz**. Its object IDs are useful persistent-identity evidence, but its recorded pose and projected anchors can lag the screenshot. No claim is made that these diagnostics are synchronized with every captured pixel. Actual screenshots, DOM observations and numerical state tests are separate forms of evidence.

## Completed coverage

The [evidence index](evidence/README.md) identifies the retained captures and case records. Checks were run across frozen builds during repair, with focused regression runs after each relevant change. They were not all collected in one uninterrupted run of a single build. The normalized records retain their originating build hashes and capture provenance.

| Area | Executed scope and result |
| --- | --- |
| Required viewport matrix | **320×700, 360×640, 390×844, 768×1024, 1440×900, 1920×1080, 2560×1440 and 3840×2160**, each at its real CSS viewport, with all five stable acts. Initial complete matrix: 464/464 assertions. Final wing/SEA regression: 200/200 across 16 captures. Final 4K regression: 58/58 across all five acts. Superseded captures are identified in the evidence index. |
| Hero and opening | Actual cold-load video, initial/settled ROOM captures, the separate cold/warm HTTP run, and delayed-resource poster captures. The complete ROOM and readable text remain in the inspected opening frames; the first I→II reveal is additionally covered at all five local handoff fractions in both directions. The cold video's exact poster-fade/live-ready event times were not instrumented. |
| Four main handoffs | Before/after boundaries and 0/25/50/75/100% in both directions, with normal motion. The discovered first-entry/night-return discrepancy was repaired and its entire 12-capture handoff rerun: **102/102**. Other handoff checks passed in the complete preceding handoff run. |
| All scene directions and takeover | Room→Sea, Room→Night, Sea→Room, Sea→Night, Night→Room and Night→Sea, followed by rapid retargeting: **120/120**. Each uses the same prop IDs, and settled scenery matches its control and status. |
| View, light and reset | Real camera endpoints, actual key-light position and changed rendered shadows, preserved scene choice, and reset without scroll/reload. Initial run: **43/43**. Final focus-ring regression: **47/47**, including four checks that the real keyboard-visible range outline clears its labels and remains inside the viewport. |
| Interrupted exit and return | A cue is interrupted by leaving Act IV; ending samples are traversed forward/backward; stationary handoff poses remain structurally frozen; reentry resumes; a chosen ROOM ending remains ROOM; Begin again restores the start: **106/106**. |
| Keyboard and wheel | Native keyboard control, focus handoff, chapter actions, wheel reversal and no focus left inside inert controls: **14/14**. |
| Touch | Touch-enabled Chromium context, native touch scroll and usable scene/view controls: **12/12**. This is touch emulation, not a physical phone. |
| Zoom and fonts | 125%, 150% and 200% layout-plus-DPR emulation: **63/63**. Actual delayed-font and loaded-font layouts: **22/22**. Failed-font fallback: **18/18**. Total: **103 passing assertions** in five cases. |
| Faults and recovery | Twelve distinct accepted cases, **220 passing assertions**: renderer failure, main-bundle failure, slow start, main arrival after the independent six-second fallback, poster failure with live rendering, resize/orientation, reduced motion/focus, history/reload/direct ending, no JavaScript, nested base/invalid hash, real WebGL unavailability, and native WebGL context loss/retry. |
| Cold/warm cache and lifecycle | **19/19** through a real local HTTP server: cold assets, genuine warm-cache reuse, real background visibility, browser freeze/resume, bounded clock restoration and unchanged prop identities. |
| Development mode | **6/6**: real Vite module graph, local fonts, live renderer, a real Sea cue and no runtime/resource errors. |
| State and geometry | **28 named checks** across three Node test files: 22 state checks, five deck/guide geometry checks, and one sampled scenic-clearance suite. The latter evaluates 1,001 poses and 38,792 pair comparisons. See the explicit scope in [GEOMETRY_CHECK.md](GEOMETRY_CHECK.md). |

### Handoff coordinates and reading order

Here `p` is whole-page progress; local percentages refer to their own handoff interval. Native scroll coordinates introduce small, recorded rounding differences from nominal `p`.

| Handoff | Whole-page interval | Shared anchor and takeover |
| --- | --- | --- |
| I → II | `.12–.26` | The same door, rail and room remain. The camera moves into the wings; the previous copy fades before the next copy becomes readable. |
| II → III | `.34–.52` | The outer scenic lane opens first, inner flats turn, then the three wave lanes enter. The room remains visible at the midpoint, and the camera returns toward the audience. |
| III → IV | `.60–.68` | The same coast darkens, the star backing and moon descend, and the entry bridge meets the stored director state. |
| IV → V | `.82–.94` | A frozen exit snapshot supplies the remaining scenic path, camera return, light and lantern homeward movement. Controls leave the focus order; ending copy appears in its separate reading region. |

Stable chapter anchors are `0`, `.29`, `.55`, `.735` and `.985`. The visual sequence, state ownership and mechanisms are documented in [STATE.md](STATE.md) and the Visual Bible.

## Repair register

Each entry describes a real problem encountered during implementation or review. Regression scope is specific; a passed screenshot is not promoted into a claim about every possible frame.

| Location and observation | Cause and repair | Regression evidence |
| --- | --- | --- |
| III → IV, 1440×900, local75%, first forward visit versus return from Act IV | The entry bridge was conditional on prior director visitation. At approximately `p=.66006`, the earlier forward world value was `1.84465` while the reverse value was `1.92270`. The bridge now always meets the initialized/stored director parameters without overwriting them. | Additional CPU first-entry/replay checks and the full 12-frame browser retake passed. Forward/reverse world values now both round to `1.9227`; view and lantern coordinates also agree. |
| WebGL context loss, Act IV, Sea selected | Attempting to acquire the loss extension after context loss could not restore it. The renderer now retains the native `WEBGL_lose_context` handle while healthy and refreshes it on restoration. | Native loss, decoded SEA poster, Retry, real WebGL return and unchanged door/lantern/wave IDs: 23/23. |
| JavaScript disabled, reading edition | The live story's long sticky layout remained active and reading text could overlap. The no-script rules now restore automatic height, normal flow, zero sticky offset and omit the live footer. | Actual JavaScript-disabled browser: 9/9 and screenshot review. |
| Main module arriving after six seconds | The independent reading fallback could leave hidden controls paired with a newly active renderer. Late initialization now restores coherent live classes and visibility flags before measurement. | Delayed main genuinely enters the reading fallback, then becomes live with usable Room control: 25/25. |
| NIGHT audience composition, phones and 4K | Moon/valance occlusion exposed an over-high sightline in a tall canvas. The audience camera fit now includes a blended eye-height limit; the side view keeps its authored elevation. | Final all-act 4K run and independent phone/4K image review: complete moon, door and lantern relationship. |
| Wing composition, all eight viewports | Lower platform clipping came from camera distance and look-target fit. The camera radius and look target were corrected without changing scene identity. | All eight wing retakes; lowest dark silhouette clears the canvas by approximately 10–449px depending on viewport. |
| 320px masthead, tablet height, mobile caption and heading | Narrow wordmark/gaps, tablet stage height, caption spacing and a missing literal word-space produced overflow/cropping or joined words. Responsive rules were corrected; the canvas and caption reserve separate space. | Real viewport matrix, final wing/SEA retakes and DOM/text checks; exact phone screenshots. |
| 200% equivalent layout and short landscape | The stacked stage could consume the visible short viewport above controls. The 600–849px short-screen layout now places stage and controls in compact adjacent columns. | Actual 720×450 CSS / DPR2 captures at 200%, resize/orientation checks and short-landscape focus capture. |
| Short-landscape chapter focus | An outward footer outline extended beyond the viewport. Footer controls use a visible inset outline. | Final 844×390 focus capture and outline geometry check. |
| Native View/Light focus, Act IV | The shared 6px outward outline crossed the immediately adjacent endpoint labels. A dedicated input rule keeps its 2px outline inside the native range box. | Final targeted controls regression and visual review. |
| ROOM → SEA mechanism lanes | Scenic supports, deck surfaces and parked wave volumes required actual clearances. The flats use staggered lanes; wider inner scenery, shorter wave lanes, real swept deck openings and hollow captured guide blocks preserve separation. | Five deck/guide checks, 1,001 sampled scenic poses, actual intermediate handoff images and dense normal-motion evidence. |
| NIGHT materials and rigging | Daylight coast color remained too bright, a large parked star board could appear above the frame, and the moon's upper support needed a visible connection. Existing coast surfaces receive the night light treatment; a fixed roller reveals star cloth; two brackets connect the moon batten to the fly grid. | Independent stable/intermediate image review and source geometry inspection. |

### Test harness corrections, distinguished from product defects

Early runs sharing the software renderer timed out and some runs were deliberately stopped after finding a defect. Those incomplete/failed cases are not counted as passes. Final GPU-intensive cases were run serially with finite waits for actual rendered acknowledgements. The production animation timestep was not altered to make tests pass.

The first zoom screenshot attempts changed the screenshot CDP session's device scale. The corrected capture preserves the fresh context's DPR; the retained output is actual 1440×900 browser imagery, not enlarged CSS-sized screenshots. Native Chrome keyboard zoom did not change viewport/DPR in the probe. The report therefore says **layout-plus-DPR zoom emulation**, not native browser-menu zoom.

Playwright's ordinary focus emulation keeps a document visible even when another tab is raised. The genuine lifecycle test disables that override on the original owning CDP session in the pinned Playwright version, then changes tabs normally. It does not patch `document.hidden` or dispatch a fake visibility event.

## Cache, freeze and history observations

Cold navigation requested nine assets plus HTML from the real local server. A second navigation in the same browser context requested only HTML; CDP reported one disk-cache response and eight other cache events. All four local font faces and the live stage loaded in both cases. The test server used `no-store` for HTML and `public, max-age=3600` for assets. These observations do not prescribe a future host's cache policy.

An unfinished Room cue at world `1.98217`, View1 and Light0 stayed unchanged for 1,521ms in a genuinely hidden tab. A 3,501ms browser freeze preserved its structural state; observed interval and animation-frame counters did not advance. The first foreground frame retained that pose, then the cue completed normally at Room world0. Door and lantern IDs remained unchanged. No application exception or failed resource occurred in this complement.

History coverage includes chapter back/forward, reload with saved production and a fresh direct visit to the ending. With no saved choice, the ending is complete default NIGHT. Saved choices survive an authored replay. Resize/orientation verification intentionally returns to the director anchor after layout settles; it proves retained choices and object identity, not exact preservation of physical scroll position during rotation.

## Independent artistic review

[ART_REVIEW.md](ART_REVIEW.md) records a separate visual review of actual screenshots against the references and Visual Bible. It covers the weakest later act, final NIGHT, small-screen composition, all eight wing boundaries and sampled intermediate choreography. The real implementation is a stylized geometric interpretation of the selected model-photography references; its simpler frame and painted materials are not described as photoreal reference reproduction.

The final interaction review additionally examines scene outcomes, actual shadow changes, paused exit poses, chosen ROOM ending and touch controls. Pixel changes alone are not used as proof of good art direction.

## Performance and continuous capture

The final standalone sample uses the normal SEA hold at a **1440×900** viewport, DPR1, with an approximately **952×657** drawing surface. No other acceptance browser from this task was running. A requested 6,000ms sample lasted **6,268.5ms** and received **23 animation-frame callbacks**. Discarding only the first partial interval leaves 22 intervals: mean **281.81ms**, median **283.30ms**, 95th percentile **483.30ms**, approximately **3.55 observed callbacks per second**. The raw intervals and CDP metrics are retained. This software-rendered result is slow; it is not presented as production-hardware performance or a 60FPS result. The case's 11 passing checks establish successful execution, live output and error-free sampling, not a frame-rate quality threshold.

The inspected SEA renderer reports **234 draw calls, 91,440 triangles, 11 textures and 76 geometries**. Its pixel ratio is capped by the production code. A previous overlapping software-browser diagnostic was discarded as representative performance evidence; its contention is described in the test-harness notes rather than hidden as a successful benchmark.

The complex ROOM→SEA handoff is additionally captured in an **unedited real browser WebM at 960×640**, with normal motion, **31 forward and 31 reverse poses** and an 844×390 focus-proof tail. All **258 recorded assertions pass**. The original video is neither interpolated nor sped up; it shows the sampled native scroll journey and actual rendered frames. The record retains requested progress, observed progress, world coordinates, timestamps, original object IDs and video/file hashes. Three actual quarter-position PNGs and the final inset-footer-focus PNG accompany it. Its separate review describes what could be observed in the initial cold-load segment and continuous choreography.

No hardware-GPU frame-rate, Lighthouse or Web Vitals score is inferred from these records.

Production drawing is bounded: one live stage, a capped pixel ratio, modest procedural textures, a single primary shadow caster and a lazy renderer chunk. The final Vite build reports the renderer chunk slightly above its default 500kB warning threshold. This warning is retained openly; it is not a build failure. The source uses a separate dynamic import for that chunk and local posters during loading.

## Clean archive reproduction

**PASS.** A 141-file source ZIP was extracted into a new, previously nonexistent directory. It contained neither `node_modules` nor `dist`. Ordinary `npm ci` installed 25 packages successfully; `npm test` reported **28/28 passing tests**; `npm run build` succeeded. The extracted build's **15 output files match the final working build byte for byte**, including all scripts, CSS, fonts, posters and the favicon.

The packaged browser helper was then executed from the extracted project against that newly built `dist`. All five acts at **1440×900 passed 58/58 checks**, with five original screenshots, unchanged prop identities and no unexpected runtime/resource errors. The clean-built hero and ending were directly inspected and match the approved compositions.

[ARCHIVE_VERIFICATION.json](ARCHIVE_VERIFICATION.json) contains the actual commands, exit codes, output, elapsed times, tested candidate archive hash, complete build hashes and the browser evidence reference. [SOURCE_MANIFEST.json](SOURCE_MANIFEST.json) identifies all 27 application, configuration, lockfile, test/helper and formal-asset files. Only verification evidence and explanatory documents were added during final packaging; all 27 files remain byte-identical to the extracted, installed and tested source. The final ZIP receives a further integrity and content check after that documentation update. No existing dependency directory, cached build output or external media directory is required by the extracted project.

## Repeating the checks

From the extracted project directory:

```sh
npm ci
npx playwright install chromium
npm test
npm run build
node scripts/acceptance.mjs --group viewports
node scripts/acceptance.mjs --group transitions,interactions
node scripts/acceptance.mjs --group resilience,typography
node scripts/acceptance.mjs --group performance --sample-ms 6000
node scripts/dense-handoff.mjs
```

The helpers accept local `--project`, `--dist`, `--out` and `--browsers` overrides. Run GPU-intensive groups serially. For genuine cache/background/freeze checks on Linux with Xvfb installed:

```sh
xvfb-run -a -s '-screen 0 1600x1000x24' node scripts/http-lifecycle.mjs --headed true
node scripts/http-lifecycle.mjs --phase dev-smoke
```

The lifecycle script uses the inspected focus-session bridge of pinned Playwright 1.56.1. An upgrade may require updating that test-only bridge. It is not part of the website runtime. Poster regeneration is documented in the English README.

## Explicit limits

- No physical phone/tablet, hardware-GPU benchmark, Windows/macOS browser, Firefox or Safari run was performed.
- Zoom uses real viewport/DPR emulation. Native browser-menu zoom and OS text scaling were not validated.
- Weak-resource tests use controlled local response delay/failure. They are not measurements of a real mobile network.
- Touch is Chromium emulation. No physical touchscreen, screen-reader user study or formal accessibility audit is claimed.
- Scenic clearance is a bounded sampled envelope test, not continuous collision detection, industrial rigging validation or full solid-mesh certification.
- Static and no-JavaScript editions preserve the story and composed views; only the live WebGL edition provides scene/view/light interaction. Reduced motion retains those controls.
- The browser route used by most cases disables normal HTTP cache. Genuine cache evidence comes only from the separate HTTP complement.
- There is no public deployment result to validate; the authorized deliverable is the complete local source archive.
