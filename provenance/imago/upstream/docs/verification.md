# IMAGO — verification record

**Evidence date:** 9 November 2026 (UTC). Machine timestamps retain UTC.

**Current disposition:** the final scoped visual review is **`disposition: ship`**, with all six scored fixes resolved. Final source tests/build and independent **G6 runtime reproduction pass**: 31 tests pass in both environments, the rebuilt runtime matches all 266 recorded files, and the extracted production view passes both 55-checkpoint matrices and the ten-chapter subpath walk. Earlier fallback and long-jump exceptions remain documented. These results do not certify every browser, device, input sequence, or continuous-motion condition.

## 1. Revision and measurement scope

The authoritative final runtime evidence is `g6-desktop.json`, `g6-phone.json`, `g6-subpath.json`, and `g6-rebuild-comparison.json`, after the final CH08 safe-area correction. Final source logs are `unit-tests-final.txt` and `production-build-final.txt`. Earlier release matrices describe the preceding candidate; the older `dom-*-final.json` files and responsive sweep describe an earlier baseline. Their passes remain historical evidence rather than automatically transferring to later revisions.

Browser evidence comes from real cloud **Chrome 156.0.0.0 on Linux x86_64, DPR 1**, using the local static production preview at `http://terminal.local:4173/`. This internal address is not a published delivery URL. The full matrices use a same-origin iframe at the requested **CSS viewport**, scaled only for presentation. A 1440×900 test reports a 1425-pixel document client width; the 390×844 test reports 375 pixels. These are not physical phone, Windows, or 4K hardware tests.

The harness clicks real chapter anchors, uses native browser scrolling, and reads DOM geometry, computed styles, resources, and public progress events. It does not inject narrative progress. Harness version **`6-closed-details`** waits up to 4000 ms for the expected state and a fresh public progress event. The visibility check excludes descendants of closed `<details>` except its visible summary. It still does not measure every possible visual occlusion.

The final G6 runs are **warm cache**. Their embedded preparation records contain **54/54 successful URLs for 27 canonical names** at full and 768-pixel sizes, all with nonzero natural dimensions. Existing cache could satisfy requests. Preparation changes neither product state nor its loading policy and is not a cold-start measurement. The earlier release preparation retained a stale “25 canonical names” sentence despite containing 54 URLs; the final G6 method wording is corrected and its actual item list is consistent.

## 2. Final checks and captured states

| Evidence | Recorded result | Limit |
| --- | --- | --- |
| [unit-tests-final.txt](../evidence/unit-tests-final.txt) and [g6-unit-tests.txt](../evidence/g6-unit-tests.txt) | **31 passed, 0 failed, 0 skipped** in the source and independently extracted environments. | Pure narrative-geometry and observation-state tests, not browser or visual tests. |
| [production-build-final.txt](../evidence/production-build-final.txt) and [g6-production-build.txt](../evidence/g6-production-build.txt) | `tsc --noEmit` and Vite 8.3.6 production build succeeded in both environments. | Final CH08 safe area and corrected QA wording are included. |
| [g6-desktop.json](../evidence/g6-desktop.json) | **55/55:** zero geometry failures, timeouts, pending or failed visible images. Entry inspection also finds zero horizontal/semantic overflow and recovered-image checkpoints. | Settled warm-cache DOM samples of the extracted build at 1440×900. |
| [g6-phone.json](../evidence/g6-phone.json) | **55/55**, with the same zero reported and derived counts. | Settled warm-cache DOM samples of the extracted build at 390×844. Earlier targeted fallback observations remain below. |
| [asset-audit-release.json](../evidence/asset-audit-release.json) and [g6-rebuild-comparison.json](../evidence/g6-rebuild-comparison.json) | Asset inventory passes its technical checks; the final rebuilt production output is **3,817,352 bytes**. All **266** compared runtime files match. | Technical inventory/file identity, not biological certification. The earlier asset audit's byte total describes its preceding build. |
| [package-audit-release.json](../evidence/package-audit-release.json) | Earlier static dependency, notices, and packaging checks passed. | That static audit alone did not establish G6; actual independent reproduction is recorded in section 7. |

Each full matrix contains ten chapter anchors and all nine adjacent transitions at **0%, 25%, 50%, 75%, and 100%**. Chapter-state conditions and transition progress waits passed. Samples run in ascending transition order. They do not establish a reverse traversal matrix, approaches from both directions, or checkpoints immediately outside each boundary.

[release-targeted-captures.json](../evidence/release-targeted-captures.json) contains **40 capture/action records**. Its 35 capture records reference 34 distinct filenames because the phone resting view was recaptured after retry; with the retained pre-retry view, 35 distinct targeted screenshots are present. [transition-captures-release.json](../evidence/transition-captures-release.json) separately records actual progress and successful waits for **15 desktop frames**: five each for TR01–02, TR05–06, and TR06–07. Corresponding mobile midpoints were captured as well. These counts describe evidence coverage, not 40 additional automated passes.

[native-chapter-walk-release.json](../evidence/native-chapter-walk-release.json) records ten earlier actual menu visits, CH01–CH10. The candidate [native full-page capture](../evidence/full-page-native-release.jpg) and its [metadata](../evidence/full-page-native-release.json) record a 1363×936 CSS viewport, DPR 1, `scrollY: 0`, and document height 23,486. That full-page view predates the last CH08 adjustment; the replaced CH08 chapter crop and dedicated final views are the authority for its safe area. Final extracted-build Hero views are retained as [desktop delivery](../evidence/hero-desktop-delivery.jpg) and [phone delivery](../evidence/hero-390x844-delivery.jpg) captures.

## 3. Six visual-review corrections

The initial [finish-review.md](finish-review.md) returned **`disposition: fix`**. Five original findings were followed by a sixth when an actual 3840×2160 rendering exposed missing Hero subject layers. The review distinguishes saved-state visual judgment from continuous motion and exhaustive runtime testing.

| Finding | Bounded change | Release evidence supplied |
| --- | --- | --- |
| **1 · CH10 support and scale** | A generated resting raster shows the adult supported by the shell; the flight cutout is reserved for departure. | Desktop and phone resting, completed, and reset captures. Both actions record `leaving`, then `departed`, then `resting` after reset. See the targeted capture index. |
| **2 · TR05–06 / TR06–07 schematic handover** | A labeled DOM/SVG schematic accompanies the exterior, then carries the abstract wing outline toward the visible late pattern. | Ten desktop transition frames, two phone midpoints, and [CH06 schematic state](../evidence/chapter-06-schematic-release.jpg). |
| **3 · TR01–02 shared spatial anchor** | A new photographic twig-to-leaf bridge supplies the missing intermediate relationship. | Five desktop frames and a [phone midpoint](../evidence/mobile-transition-01-02-050-release.jpg), with actual progress recorded for the desktop set. |
| **4 · CH04 instar cropping** | Each specimen uses its actual source-row bounds rather than uniform row translation. | [Release chapter crop](../evidence/chapters/chapter-04-native-release.jpg), mobile body view, and [lower mobile view](../evidence/mobile-chapter-04-lower-release.jpg) covering the later rows. The previous five-row count alone did not establish correct cropping. |
| **5 · CH02–10 category eyebrows and CH08 safe area** | The heading leads; sequence metadata remains below. At widths ≥701 pixels, CH08 title/introduction occupy a separate two-column text area above the photograph; the mobile stack is retained. | **Resolved in the final review.** [Safe-area records](../evidence/chapter-08-safearea-checks.json) show settled 701/850/851-pixel checks with no overflow, plus 1440/390/851-pixel captures. The native CH08 release crop is replaced. |
| **6 · Wide Hero alpha composition** | Alpha layers keep transparent CSS backgrounds; the cream field belongs to the stage/base. | [2560×1440 Hero](../evidence/hero-2560x1440.jpg) and [3840×2160 Hero](../evidence/hero-3840x2160.jpg). Readiness records show all three layers complete, natural width 1536, and transparent computed backgrounds at both sizes. |

The final appended independent verdict is **`disposition: ship`**: findings **1–6 are resolved**, including CH08/R1. The title now sits in uninterrupted paper above the image; the reviewed desktop, 851-pixel, and phone states retain the branch, attachment, subject, and readable heading. This verdict covers the six scored corrections and supplied composition/recorded-state evidence. It does **not** certify the entire surface, continuous motion, or all possible conditions.

Earlier source-image registration work—four regenerated frames under AR-01/AR-02—remains documented in [art-review.md](art-review.md). Artistic reconstructions and the developmental diagram do not certify exact anatomy, timing, tissue positions, or measured instar sizes.

## 4. Retained earlier exceptions and harness correction

### Five false failures in the first release matrix

[dom-1440x900-release-initial.json](../evidence/dom-1440x900-release-initial.json), harness `5-finish-review`, records five geometry failures, five wait timeouts, and five pending-image checkpoints, all at TR07–08. Target state and fresh progress were already correct. A late-stage comparison image reported `complete: false` with natural width 1152, and the harness incorrectly counted it as visible inside the **closed** reveal-details region.

The harness was corrected to exclude descendants of closed details except the summary. This was a **measurement correction, with no application change for that finding**. Both v6 matrices then completed 55/55. The v5 file remains intact; it is not relabeled as a successful run.

### Phone ending fallback and successful retry

During later targeted phone work, the resting CH10 image entered the embedded low-resolution fallback. The operator used **Load full image**, which succeeded, then recaptured the normal [phone resting view](../evidence/ending-mobile-resting-release.jpg). The earlier view is preserved as [ending-mobile-recovered-before-retry.jpg](../evidence/ending-mobile-recovered-before-retry.jpg); the target index retains both capture records for the resting filename.

This verifies an observed recovery path for that action. It does not establish why the first load failed or prove that every image, hidden-stage retry, mobile `<picture>` source, or reordered request behaves correctly.

### Long jump after desktop departure/reset

The targeted record reports one harness request for CH01 that timed out after **4013.1 ms**, still active at CH09, with zero pending images. The operator subsequently used the product's **Look again** control; the following [Hero capture](../evidence/hero-1440x900-release.jpg) records CH01 and `scrollY: 0`.

The cause remains **unconfirmed**. A layout/external-scroll timing race and frame scheduling are engineering hypotheses, not established diagnoses. No runtime fix was justified from this single observation. The timeout remains an exception even though the product control subsequently reached its destination. The final G6 subpath run also completed departure, reset, and Look again at CH01/`scrollY: 0` with focus on `hero-title`; this positive repetition does not diagnose the earlier timeout.

## 5. Earlier runs and observations retained as history

| Earlier evidence | Outcome and interpretation |
| --- | --- |
| [Initial desktop matrix](../evidence/dom-1440x900.json) | 55 checkpoints, **36 aggregate geometry failures**. Fixed-delay sampling at approximately 185 ms preceded some smooth-scroll settling. Retained as a failed methodology run. |
| [Condition-wait desktop matrix](../evidence/dom-1440x900-production.json) | **54/55** geometry/state checks; CH09 timed out after 2236.8 ms with a 2200 ms limit. Recovered imagery appeared at 23 checkpoints. |
| [Condition-wait phone matrix](../evidence/dom-390x844-production.json) | 55/55 geometry/state conditions, but one failed visible Hero and 22 recovered-image checkpoints. This was not a complete rendering pass. |
| [Initial responsive sweep](../evidence/responsive-sweep.json) | 55 checkpoints; **20 geometry failures, 25 overflow checkpoints, one failed visible image**. CH08 figure sizing enlarged the document toward 990 pixels at several tablet/short-landscape widths. |
| [Earlier final desktop](../evidence/dom-1440x900-final.json), [phone](../evidence/dom-390x844-final.json), and [responsive sweep](../evidence/responsive-sweep-final.json) | Each completed 55/55, after [50/50 preload preparation](../evidence/warm-cache-preparation.json), with zero sampled geometry/wait/image/overflow failures. These **165 checks preceded the six visual corrections**. |

The earlier responsive sweep covered 320×700, 360×640, 768×1024, 1920×1080, 2560×1440, 3840×2160, 700×780, 701×780, 850×900, 851×900, and 844×390. It sampled CH01/04/08/10 and TR07–08 midpoint at each size. A complete new 11-size sweep has not been run after all corrections. Final evidence instead includes the two G6 full matrices, targeted corrected views at the two wide sizes, and three settled CH08 breakpoint checks at 701/850/851 pixels.

The operator observed the shared managed preview switching to unrelated PAS/BERTH work during earlier resource failures. That is environmental context, not proof of each request's cause. Work moved to static production viewing to avoid live-reload replacement. No unrelated project's files were changed.

### Control and supplementary observations

[interactive-checks-final.json](../evidence/interactive-checks-final.json) contains **25 observations**, retaining the earlier 24 phone records and adding the opened desktop comparison range advancing from 50 to **51**, with `--reveal: 51%;`. They cover egg close/whole view, hatchling/third-instar selection, five illustrated instar rows, pupation stages, emergence next/direct/previous counters, wing stages and detail views, departure/final/reset, return to CH01, and a schematic label. The in-page reduced-motion change preserved CH06. These are observations on the then-current build, not a 25-test automated suite; changed ending and crop regions have separate release evidence above.

The initial immediate “Look again” sample still reported CH03 during travel; its retained settled follow-up reached CH01 at the top. An input event and its settled result are distinct observations.

[supplementary-checks.json](../evidence/supplementary-checks.json) adds ten narrowly scoped observations:

| Check | Observed result / limit |
| --- | --- |
| Deliberate egg-image 404, then full-image retry | Fallback reported natural width 256 and recovered state; retry reported width 1152, no recovered state, and local `/art/egg.webp`. One controlled image path, not exhaustive failure timing. |
| Fallback fonts at desktop CH02 and CH08 | Inline Georgia/Arial override showed no horizontal or reported semantic overflow at 1440×900. Font downloads were not blocked. |
| Native Back and Forward | CH10→CH09 on Back and CH10 on Forward, with matching URL and active chapter. |
| Refresh CH07 after Late selection | `#chapter-07`, active CH07, and Late remained selected after same-session refresh. |
| Chapter menu Escape and observer Home/End | Escape closed the dialog and restored focus to Chapters; Home selected Early and End selected Late. |
| Hero orientation expansion | Egg, Caterpillar, Chrysalis, and Adult descriptions appeared with the explanation that scrolling revisits stages rather than modeling developmental speed. |
| Browser-zoom shortcut attempts | Ctrl+plus and Ctrl+equal produced no observable CSS viewport/DPR change: 1363×936 and DPR 1 before/after. **Actual 125%, 150%, and 200% browser zoom remain unverified.** |

Desktop side-by-side selection and Reset were also observed by the operator. Those observations do not establish comprehensive keyboard, screen-reader, or accessibility coverage.

## 6. Assets and package audit

The release audit reads **31 image-generation outcomes, 27 canonical roles, 58 WebPs, 58 prompt sidecars, and 10 local font files**. The WebPs comprise 31 full-size outcomes and 27 responsive derivatives; four original registration frames remain as documented history. All 58 sidecar prompts exactly match their corresponding generation records; image/sidecar copies in `dist` are identical to their public counterparts. All 27 embedded fallbacks validate. No documented art, production entrypoint, local font notice, or referenced HTML/CSS asset is missing in this audit.

The **final independently rebuilt production output is 3,817,352 bytes**, as recorded in [g6-rebuild-comparison.json](../evidence/g6-rebuild-comparison.json). The earlier candidate audit measured 3,817,009 bytes; that historical figure is not the final total. QA HTML remains excluded from production. The static HTML/CSS audit found no external resource URL, and the final subpath run observed local assets/fonts resolving. These are size/path measurements, not latency, LCP, FPS, or cold-network results. Reused navigation origins and warm cache prevent interpreting browser performance marks as independent cold-start benchmarks.

The package audit verifies exact direct dependency/lockfile agreement and retained license copies. Its observed runtime is **Node v24.22.1**; the declared minimum is **Node 22.12**. It did not execute the project at that minimum or on Windows. Both `.cmd` launchers were inspected for ASCII/CRLF, quoted directory changes, Node/npm checks, `npm ci`, local binding, and preserved errors, but were not run on Windows.

The earlier packaging audit was a static proposal. G6 subsequently performed an actual extraction, locked dependency installation, tests, production rebuild, file comparison, and browser walk. The runtime-candidate archive identity is recorded separately from any final documentation/evidence repack: whole-ZIP bytes can change while the verified runtime remains identical. The delivery packaging must preserve all 266 verified runtime hashes; the candidate SHA-256 must not be mislabeled as the later whole-delivery ZIP hash.

## 7. G6 independent reproduction — passed for the final runtime

The complete procedure and environment are documented in [g6-reproduction.md](g6-reproduction.md).

[g6-candidate.json](../evidence/g6-candidate.json) identifies the second extracted candidate, explicitly including final CH08 safe area and QA method wording. Its archive integrity check passed. In the independent extraction, [npm ci](../evidence/g6-npm-ci.txt), the 31-test suite, and the production build all exited **0** on Node **v24.22.1**. [g6-rebuild-comparison.json](../evidence/g6-rebuild-comparison.json) compares **266 source/public/test/config/helper/launcher and rebuilt production files**, with **zero mismatches**.

The real production UI served from that extracted and rebuilt runtime passed **55/55 desktop and 55/55 phone checkpoints**. Both used the final 54/54 warm preparation; neither is a cold-load result. No sampled geometry failures, wait timeouts, pending/failed visible images, horizontal/semantic overflow, or recovered-image checkpoints were present in those matrices.

[g6-subpath.json](../evidence/g6-subpath.json) records ten native chapter visits beneath `/nested/`. All reported loaded fonts and no horizontal overflow. Script and stylesheet URLs resolve beneath `/nested/assets/`; the recorded nonempty art URLs use `/nested/art/`. The full resource inventory includes inactive/offscreen images, so it is not a claim that every DOM image loaded at once. No first-party console errors were observed in this recorded walk.

The subpath ending reached `departed`; reset and Look again then returned to `#chapter-01`, `scrollY: 0`, with departure state `resting` and focus on **`hero-title`**. This closes the tested nested-path, principal navigation, and ending/return reproduction cases. It does not imply actual Windows execution or every history/recovery permutation.

## 8. Explicit remaining limits

The six-item visual-review gate and final-runtime G6 reproduction are closed within their stated scopes. Remaining unverified areas are:

- Physical Windows, Android, iOS, high-DPR, or 4K hardware; Safari and Firefox; actual Windows launcher execution and running specifically at the declared minimum Node 22.12.
- Real network throttling, a cold-load benchmark, deliberately reordered A→B→C completions, and controlled outage/recovery coverage of every stage and picture-source variant.
- Operating-system-level motion-preference changes, actual 125/150/200% browser zoom, blocked font downloads, document background/return behavior, and history/refresh paths beyond the named observations.
- A fresh complete 11-size sweep after the last local correction; reverse traversal and both-direction boundary approaches; checkpoints immediately outside each boundary.
- Full screen-reader/accessibility coverage, sustained FPS/GPU use, and long-session heap/texture/listener growth.
- The cause of the earlier harness long-jump timeout. Later successful returns are retained without silently converting that observation into a pass.
- Independent scientific certification of generated imagery or the nonmeasured developmental schematic.

All verification work remains local. The review's “ship” disposition is a scoped readiness judgment; no deployment, publication, repository push, pull request, or release publication is claimed.
