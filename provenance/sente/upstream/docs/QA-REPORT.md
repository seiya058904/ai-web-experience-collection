# SENTE — implementation and acceptance evidence

Report date: **9 November 2026**. Browser evidence timestamps are UTC. This report distinguishes implemented behavior, executed checks, remaining differences from the brief, and unverified conditions.

## Disposition

The application has ten chapters, nine transition sections, three playable finite Go exercises, two-eye and simple-ko demonstrations, local observation history and an SVG note generator. A fresh, independently extracted **source-code candidate** passed installation, all **61 Node tests**, type checking and production build. Its eight built files were byte-identical before and after rebuilding. An independent Python implementation enumerated **124 legal first moves**, finding exactly one goal move per puzzle: **P1 D5, P2 D3 and P3 C5**. All 38 published P3 white responses were legal.

The main browser interaction paths were exercised at **1440 × 900** and **390 × 844** CSS viewports. A broader layout sweep measured eleven exact, unscaled iframe CSS viewports with **zero horizontal overflow**. A final, single-state transition cohort contains 45 forward samples and nine reverse midpoint checks, with the note text and 196 intersection descriptions unchanged before and after.

These results do **not** constitute a full pass of the requested acceptance matrix. Native browser zoom, physical devices, screen readers, audible output, throttled performance and several lifecycle conditions remain unverified. The browser-created SVG's arrival on disk is also unverified. The current Hero and handoffs use an editorial, two-dimensional composition; the brief's complete light/camera reveal, spatial object handoff and final wider-board return remain unimplemented.

**Release boundary:** the code candidate has independent installation/build/HTTP evidence, and its rebuilt runtime passed an actual browser check of all three goal paths. The complete delivery adds the final documentation and coherent evidence without changing application code or the eight runtime files. The final ZIP has its own checksum and a companion `SENTE-package-verification.json`; candidate checksums below refer only to the earlier candidate.

## Evidence and its scope

| Evidence | Establishes | Does not establish |
| --- | --- | --- |
| [Browser measurements](evidence/browser-measurements.json) | Eleven CSS viewport layouts and an earlier progress/state cohort. | Physical hardware, native zoom, every input path at every size. Its earlier transition data does not map to the replacement final screenshots. |
| [Final transition measurements](evidence/final-transition-measurements.json), [image index](evidence/transitions-index.json) and [contact sheet](evidence/transitions-contact.jpg) | One frozen session at `/subpath/`; nine × five forward samples; nine reverse midpoint comparisons; unchanged note and intersection descriptions. | Continuous frame pacing or all requested spatial choreography. |
| [Subpath browser report](evidence/subpath-report.json) | Actual `/subpath/` browser load; six recorded runtime resources returned 200; zero overflow. | Every deployment environment or a production hosting service. |
| [Production performance observation](evidence/production-performance.json) | Native paint/resource/navigation entries and existing application marks from one local load. | A cold-cache guarantee, throttled performance, FPS, memory stability or Lighthouse. |
| [Final targeted geometry](evidence/targeted-final-measurements.json) | Later 320/390/3840 geometry; zero overflow and alignment below 0.021 px. | A new clean error-log session: expected failure-test events remain in its observer history. |
| [Resource-failure run](evidence/resource-failure-report.json) | Actual HTTP 404s for both images and both fonts; all three goals completed using coordinate controls. | Failure of initial HTML/JavaScript or every slow-network condition. |
| [Independent enumeration](reference-enumeration.json) and [verifier](../tests/reference-enumeration.py) | Independent coordinate/set implementation; all puzzle first moves/replies and named rule examples. | Browser rendering, art quality or file downloading. |
| [Release verification](evidence/release-verification.json) | Fresh code-candidate extraction, installation/tests/build and 54 HTTP assertions. | An unchanged final full-evidence archive, Windows execution or interactive browser checks. |
| [Rebuilt-runtime browser check](evidence/release-browser-report.json) | The independent rebuild's eight unchanged runtime files loaded in the production preview; all three coordinate-selected goals completed at 390 × 844. | A repeat of every interaction or verification of the final evidence ZIP itself. |
| [Chapter ledger](CHAPTERS-AND-TRANSITIONS.md), [rules/limits](RULES-AND-LIMITS.md), [finish review](FINISH-REVIEW.md) | Implemented content, state semantics, exact compositions and bounded visual review. | Full creative acceptance simply because source exists. |

Screenshots under `docs/evidence/` are actual page captures. Generated images under `art/concepts/` are art studies, not browser acceptance evidence. Earlier and later sessions must not be represented as one unchanged snapshot.

## Browser environment and geometry

The browser reported **Chromium 156 on Linux x86_64**, **DPR 1**. Each requested size was a same-origin iframe CSS viewport without CSS scaling. User-agent/platform strings do not verify physical hardware. Scrollbars can make document client width narrower than `innerWidth`; the detailed reports preserve both. For example, the 390 px production iframe had a 375 px document client width.

| Actual iframe CSS viewport | Horizontal overflow | Maximum board/button alignment difference |
| --- | ---: | ---: |
| 320 × 700 | 0 px | 0.020 px |
| 360 × 640 | 0 px | 0.022 px |
| 390 × 844 | 0 px | 0.019 px |
| 768 × 1024 | 0 px | 0.019 px |
| 844 × 390, short landscape | 0 px | 0.019 px |
| 999 × 800, below layout breakpoint | 0 px | 0.019 px |
| 1000 × 800, above layout breakpoint | 0 px | 0.021 px |
| 1440 × 900 | 0 px | 0.020 px |
| 1920 × 1080 | 0 px | 0.022 px |
| 2560 × 1440 | 0 px | 0.019 px |
| 3840 × 2160 | 0 px | 0.019 px |

Every row recorded ten chapters, nine transitions and 40 board instances. Seven boards were interactive, each with 49 intersection buttons and one active tab stop. The total includes 23 transition diagrams; these are not 40 independently playable exercises.

The later repeat measured **320 × 700: 0.020 px**, **390 × 844: 0.019 px** and **3840 × 2160: 0.019 px**, with zero document overflow and no overflowing elements. This supports alignment and layout bounds. It does not by itself establish contrast, ease of touch input or screen-reader usability.

The eleven-layout cohort recorded no native error, unhandled-rejection or failed-resource events during its observation windows. The observer starts after iframe load and does not intercept the console API; it cannot establish that every earlier console message was absent. Later targeted snapshots retain expected missing-material events from failure testing and are not error-free logs. The fresh subpath report has an empty observed event list and all six recorded runtime resources returned 200.

## Manual browser interaction record

The following paths were exercised through rendered controls at 1440 × 900 and 390 × 844. These manual observations are separate from module tests. Later mobile-only feedback changes received the focused repeat stated below; the entire path was not repeated at all eleven sizes.

| Area | Action and observed result |
| --- | --- |
| Hero and liberties | Black A1 had B1/A2 as its two liberties. Lifting it was independent of puzzle records. D4/A4/A1 displayed 4/3/2 liberties. |
| Keyboard edges | Up at A7, Down at G1, Left at A4 and Right at G4 remained at their real edges without wrapping. |
| Connected string | D3/D4/E4 formed one string with seven deduplicated liberties. F5 remained separate with four. |
| P1 | A1 was a retained legal non-solution; occupied D4 was rejected; D5 captured White D4; Undo restored the earlier board. |
| Two eyes | White C3 and White E3 were each rejected without changing the position. |
| P2 | D4 remained a legal non-solution. Reset restored the setup. Keyboard Enter at D3 produced five connected stones, eight liberties and no capture. |
| P2 variations | B replayed 2 → 1 → 0 to the common starting setup. Mobile A/B selection retained both move lists. |
| P3 manual reply | Black F6 captured White F5 while C3/C4 remained. The note described the unseen reply as pending. White C5 then removed C3/C4; focus moved to Undo. Undo stepped 2 → 1 → 0. |
| P3 automatic reply | Black C5 followed by White F6 retained the marked pair without a capture. Comparison examples did not add user attempts. |
| Ko | Black D5 captured White D4. Immediate White D4 was rejected. Original and hypothetical recapture boards matched. |
| Navigation/persistence | Escape closed the dialog and restored opener focus. A chapter anchor focused the note heading. Refresh retained observations. |
| Reduced motion | Manual reduced mode at 390 × 844 retained ten chapters/nine transitions, zero overflow and 0.019 px alignment. P1 keyboard input worked; returning to full motion retained state. The OS preference switch itself was not exercised. |

After the mobile feedback repair, P1's board-local Undo returned A1 to empty and restored initial feedback. P2 D3's local result appeared around y=659–729 in the tested phone view, with local Undo enabled. This closes that observed feedback-distance problem; it is not a claim about every scroll position. Final mobile Hero, P1, P2 and chapter-ten panel/control captures are retained, alongside desktop comparison/note and final wide captures.

### English and accessibility scope

Measured pages reported `lang="en"`, title **“SENTE — Between moves”**, no detected Han characters in visible DOM text and none in common accessible/metadata attributes. Rule feedback and controls were read in the exercised states. Source provides semantic headings, native controls/dialog, visible focus, coordinate alternatives, English status text and roving board focus.

The scan does not read pixels inside images, audio or a saved artifact. It is not an accessibility certification. No actual screen-reader session was run. SVG fixed language/XML safety were checked by module tests; the browser-saved artifact was not acquired.

## Rules, observations and SVG verification

The fresh [test log](evidence/release-tests.txt) reports **61 pass, 0 fail, 0 skipped, 0 cancelled**. Checks cover capture-before-suicide ordering, occupied rejection, unchanged rejected positions, exact shared-liberty sets, simple-ko equality, independent branches, chronological attempts, maximum actually observed step, restore validation and export contents.

| Independent enumeration | Empty points tested | Legal first moves | Goal move |
| --- | ---: | ---: | --- |
| P1 | 45 | 45 | D5 only |
| P2 | 41 | 41 | D3 only |
| P3 | 38 | 38 | C5 only |

All 38 P3 replies were legal. The independent verifier also established P2's eight-liberty set, legal White D3 after Black D4, diagonal separation, both eye rejections and exact whole-board K1 repetition. These are finite-position facts. The app has no whole-game scoring, superko, general eye adjudication or universally optimal move claim.

The **ten SVG module tests** cover three panels, 49 intersections per board, coordinates, exact passed stones, chronological legal/invalid attempts, pending-reply honesty, XML escaping/control filtering, deterministic immutable behavior, dynamic height for long records, wrapping of wide unbroken text and invalid panel/board rejection. The SVG has no external font or image dependency.

### Browser SVG export boundary

The actual export button produced a Blob URL and ready status. Persistent **“Save the SVG again”** and **“Open the SVG note”** links appeared. Preview opened a tab titled **“SENTE — Three observations.”** Remote download-event/media capture timed out, and browser security policy refused acquiring the `blob:` tab. That boundary was respected; no bypass was attempted.

**Successful browser file arrival on disk, exact saved bytes and saved-file visual rendering remain unverified.** Generator tests remain valid within their scope. Save/preview links refer to a generated snapshot until the user generates a new one.

## Final transition cohort

Current progress is evaluated from layout and scroll, without playing moves when a boundary is crossed. The five explanatory states use local 0/25/50/75/100 percent positions. All diagrams remain opaque and independently identified. TR6/TR7 retain both P2 lines; TR8 has two labelled P3 examples plus K1; TR9 has K1 plus three observation boards. The [transition ledger](CHAPTERS-AND-TRANSITIONS.md) states the exact transforms and remaining creative differences.

The authoritative [final cohort](evidence/final-transition-measurements.json) was captured at **1440 × 900**, under `/subpath/`, with one unchanged interaction state:

- **45 forward samples:** nine transitions at five local fractions. Maximum difference between requested and geometrically measured fraction was **0.000428**; rounded DOM progress differed by at most 0.0004.
- **Nine reverse midpoint checks:** every progress comparison and explanatory-step comparison matched its forward counterpart.
- **No recorded move/history change:** the entire note text (996 characters) and 196 Hero/P1/P2/P3 intersection descriptions were identical before and after. The recorded attempt counts were P1 **8**, P2 **5**, P3 **5**.

The final 45 `TRnn-ppp.jpg` images replace earlier mixed-state captures. Independent indexing confirmed that all 45 originals are nonempty 1440 × 900 images, have unique hashes and match the authoritative final capture archive byte for byte. The [contact sheet](evidence/transitions-contact.jpg) scales the complete images without cropping or retouching content. The older browser-measurement cohort had unchanged counts 5/3/4 and remains useful for layout/history context; it is not the metadata source for the final images.

At twelve sampled endpoints, the transition element is just below the viewport or wholly above it, as expected from the current local-progress formula. Those screenshots document the boundary/adjacent composition; they are not 45 fully visible transition compositions. Static samples and reverse midpoint checks do not establish continuous frame pacing, every possible one-frame flash or every fast/slow-scroll combination. They also cannot prove unimplemented spatial choreography.

## Failed resources and performance

The `/fallback/` run actually returned **HTTP 404** for `sente-hero-table.webp`, `sente-board-material.webp`, `bodoni-moda-latin.woff2` and `manrope-latin.woff2`, while JavaScript/CSS returned 200. With these failures present, coordinate controls completed P1 D5 (one white capture), P2 D3 (five stones/eight liberties/no capture) and P3 C5 then White F6 (marked pair retained/no capture). Horizontal overflow remained zero. Expected failed-resource events are retained in the record.

This tests missing decorative images/fonts after the app can load. It does not test total network failure before initial HTML/JavaScript arrives. Boards retain exact SVG geometry/state and a solid material base; fonts fall back to system fonts.

The production performance sample was a 390 × 844 full-motion load with no network/CPU throttle applied by the harness. Native first paint/FCP were **180 ms**. Existing application marks recorded `sente-interactive` at **109.1 ms** and `sente-hero-settled` at **158.4 ms** relative to that iframe navigation. The retained resource buffer reported six entries and 347,062 transferred bytes, excluding the HTML navigation document.

This is **one local unthrottled observation**. Cache state and external throttling were not independently controlled. The marks describe implementation readiness points, not measured input latency or completion of the brief's missing reveal. No FPS, Lighthouse, memory, battery or real-device loading target is claimed.

## Defect and repair ledger

| Location / reproduction condition | Cause and implemented repair | Focused evidence / limit |
| --- | --- | --- |
| Keyboard Up A7 / Down G1 could jump across the top/bottom row. | Linear clamping lacked row-edge guards; `board-view.ts` now guards all four real edges. | Four edge directions manually repeated; independent adjacency tests. |
| Hero buttons could differ from the visible grid in a non-square host. | SVG aspect-ratio behavior differed from the DOM overlay; exact SVG now fills the same host rectangle. | Eleven layouts, worst 0.022 px; later targeted worst 0.020 px. |
| Chapter navigation / hidden P3 reply control could leave unsuitable focus. | Destination-heading focus, dialog navigation/cancellation distinction, reply-to-Undo focus. | Escape/opener, note-heading anchor and P3 reply focus observed; no real screen reader. |
| Selecting a mobile P2 variation hid the other move list. | Both full A/B lists now remain outside the selected board panel. | Both lists observed on mobile. |
| Ko description could announce Black for the White move. | `activeColor` follows the ko stage. | Source/accessible-label review; no assistive-technology session. |
| A single liberty used plural text. | Count-based “liberty” / “liberties”. | Source and exercised English review. |
| Captured stones disappeared without a lift. | State commits first; decorative placement and a 12 px capture lift/fade follow. | Real removal verified; exact visual timing/FPS unmeasured. Edge/bowl travel still absent. |
| Extreme-wide Hero had hard joins beside its plate. | Hero composition capped at 2200px and centered within paper-colored outer gutters, without repeated wood. | Final 3840 CSS capture retained; no physical 4K claim. |
| Phone P1/P2 feedback/Undo sat far from the tapped board. | Narrow layout now adds board-local result text and Undo. | Focused P1 reset and P2 D3 feedback/Undo repeat. |
| Early late-boundary layouts omitted required comparison identities. | 23 transition diagrams now retain both A/B lines, both labelled P3 examples and all three note boards in the respective boundaries. | Source ledger, board counts and final frozen-state captures. |
| Export lacked durable controls after generation. | Current Blob snapshot has persistent save-again/preview links. | Ready status, links and preview title observed; actual saved file unverified. |

The ledger includes source-review findings and observed UI defects. It does not imply that every defect was discovered in a browser or that a code change alone establishes a complete regression pass.

## Remaining requirements and unverified conditions

| Item | Current disposition |
| --- | --- |
| Hero's six-state light/camera reveal and first-scroll spatial handoff | **Partial.** Stable material Hero and working first move exist; complete reveal/camera choreography does not. |
| Nine specified spatial/media handoffs | **Partial.** Nine reversible editorial diagram transitions exist; proposed spatial choreography is simplified. |
| Closing wider empty board tied to the Hero object | **Not implemented in that form.** The ending uses a decorative stone, actual notes and a return link. |
| Captured-stone travel to board edge/bowl | **Partial.** Exact removal and short lift/fade exist; travel is absent. |
| Reduced-motion chapter-two three simultaneous examples | **Partial.** All centre/edge/corner content remains available via selector rather than three simultaneous static boards. |
| Native browser zoom 125% / 150% / 200% | **Unverified.** Resizing CSS iframes is not native zoom. |
| Physical Android/touch, real 4K display, other browser engines | **Unverified.** Recorded scope is Chromium with simulated CSS sizes and mouse/keyboard controls. |
| Real Windows CMD/PowerShell launch | **Unverified.** Launchers are supplied; Linux execution and quoted-glob checks do not prove Windows operation. |
| Actual screen reader, OS motion-preference switch, audible sound | **Unverified.** Source semantics, manual motion mode and visual controls have narrower evidence. |
| Cold cache, network/CPU throttling, full slow/out-of-order resource matrix | **Unverified as a complete matrix.** Four missing resources were genuinely tested. There is no asynchronous model loader replacing puzzle boards. |
| FPS, memory lifecycle, prolonged idle, repeated hide/resume | **Unverified.** A hidden-document pause exists in source; no measured lifecycle result is claimed. |
| Every rapid-scroll / scrollbar / history-return combination | **Not fully verified.** Named main paths/navigation and progress probes do not cover every gesture/timing combination. |
| Fresh final phone P2 material screenshot | **Unverified.** Its earlier image demonstrated feedback placement but contained a foreign material artifact and is excluded. Fresh rebuilt-phone input/resource evidence and clean desktop P2 transition images have narrower scope. |
| Browser SVG file landing and saved rendering | **Unverified**, following download capture timeouts and blocked Blob-tab acquisition. |
| Final complete source/evidence archive | Completed documentation and coherent evidence are included with the validated code/runtime. See the companion `SENTE-package-verification.json` and `SENTE-SHA256.txt` for the exact final archive and its post-packaging verification. |

## Independent code-candidate release verification

The helper independently extracted `SENTE-code-candidate.zip`: **58 files, 22,440,972 bytes**, SHA-256 `6ebde04c07ec4845df7683d28e599464b929d797aa506b8e793d5d575cf0e316`. This intermediate candidate intentionally excluded in-progress/mixed browser evidence and final reports. It is not the final full-evidence delivery archive.

Environment: **Linux x86_64, Node v24.22.1, npm 11.9.0**. Actual executed commands:

| Command | Outcome | Log |
| --- | --- | --- |
| `npm ci` | Exit 0 | [Install log](evidence/release-npm-ci.txt) |
| `npm test` | Exit 0; 61 pass, no failed/skipped tests | [Test log](evidence/release-tests.txt) |
| `npm run build` | Exit 0; TypeScript check and Vite production build | [Build log](evidence/release-build.txt) |

The included prebuilt site was served **before installing dependencies**. After installation/build, all eight `dist` files still totalled **346,913 bytes** and had identical per-file hashes. The sorted manifest SHA-256 before and after was `22a56835525894361645fe0b5300dd4d4eee4a8b3b0c7eff52b87ecc6577a458`. Fifty non-`dist` candidate source files were unchanged.

**54 isolated HTTP assertions passed** across prebuilt/rebuilt root and `/subpath/` serving: exact file hashes, applicable MIME types, HEAD responses, missing-asset 404s, disabled QA endpoint, malformed-URL rejection and traversal rejection. These assertions verify local delivery behavior; they do not replace interactive browser input. The logs include the environment's npm `http-proxy` configuration warning; it did not cause a command failure.

### Browser check of the independent rebuild

The independent rebuild's eight runtime files were copied unchanged into the production preview and exercised through its actual coordinate controls. The [record](evidence/release-browser-report.json) reports a 390 × 844 unscaled CSS viewport, ten chapters, nine transitions, zero horizontal overflow, 0.019 px maximum alignment difference, six recorded runtime requests returning 200 and no post-load observed error events. P1 D5 captured White D4; P2 D3 joined five stones with eight liberties and no capture; P3 C5 followed by the specified White F6 retained the marked pair. This is a focused three-goal regression on the rebuilt runtime, not another full matrix run.

Final packaging includes the completed documentation, all 45 coherent transition originals, selected valid screenshots, raw measurements, source art and license texts. Obsolete assets, superseded bundles, the mixed recapture record and the contaminated mobile P2 frame are excluded. The final ZIP checksum and post-packaging extraction/build result are recorded outside the archive in the companion checksum and package-verification files, avoiding a self-referential archive hash.

No deployment, publication, push, PR/Release or collection integration is part of the recorded work.
