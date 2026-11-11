# CHRYSALIS — QA report

Evidence review: **9 November 2026 (UTC)**. This report records the files retained at the time of documentation. It separates implemented behavior, deterministic tests, actual browser observations, and unfinished acceptance work. The [evidence index](evidence-index.md) identifies the source of each result; the [requirements ledger](../requirements-evidence.md) remains the acceptance contract.

## Current result

**The project is not declared accepted.** The current production build passes **51 tests**, the English guard covers **35 authored files**, and the independent reviewer has closed the observed phone-midpoint composition review for all ten boundaries within its explicit capture limits. The B3 affected run passed **195/195** checks. A later targeted run recorded **96 PASS / 2 FAIL**; the two full-image containment failures were then specifically retested and passed **2/2** on the current build. The 98-check run remains a failed historical record, not a rewritten 98/98 pass.

The final recovery record is **PARTIAL: 6 PASS / 1 BLOCKED / 0 FAIL**. Its initial reload attempt was blocked by shared-route replacement; a subsequent actual changed-layout and unchanged-layout reload passed, as did still-mode restoration, history, real 404/fallback/Retry and resize. Mandatory continuous recording, true zoom, OS motion-preference/touch coverage, slow-network and hidden-document lifecycle coverage remain blocked or untested as detailed below. The original **302/8**, interrupted **15/8**, B3 lifecycle failures and CZ pending-state failure remain preserved. Post-containment separate-package and extracted-browser evidence is recorded in the final section, with exact delivery identity in the accompanying verification record.

| Evidence | Recorded outcome | What the result covers |
| --- | --- | --- |
| [Current production build](../evidence/final-build-and-tests.txt) | 51 tests passed; 0 failed; English guard checked 35 authored files; TypeScript/Vite build completed | Current `CHOjqdUS` / `ByIcPCHI` snapshot, including the narrow-screen J-plate containment correction. Build success is not whole-site or extracted-package acceptance. |
| [Archived complete-pose build](../evidence/pose-build-and-tests.txt) | 47 tests passed; 0 failed; English guard checked 34 authored files; TypeScript/Vite build completed | B3 snapshot used by the 195-check affected run and the revised hanging-stage/phone-study captures. |
| [Build and unit log](../evidence/build-and-unit-check.txt) | 42 tests passed; 0 failed; English guard checked 30 authored files; TypeScript/Vite production build completed | The source snapshot executed in that log. Later code and documentation changes are not retroactively covered. |
| [Mobile anchor regression](../evidence/mobile-anchor-regression.txt) | 1 targeted test passed; type check exited 0 | Pure engine behavior at portrait/desktop boundaries, including all ten transitions and 700/701px. No renderer appearance claim. |
| [Asset audit](../evidence/asset-audit.json) | PASS | 15 retained distributable images and production derivatives; 20 actual generation calls recorded. Production WebP total: 1,491,734 bytes. This is file/provenance verification, not final framing acceptance. |
| [Broad browser matrix](../evidence/browser/matrix-before-fixes.json) | FAIL — 302 PASS / 8 FAIL | Historical same-origin iframe checks in real cloud Chromium, before subsequent corrections. |
| [Interrupted affected run](../evidence/browser/affected-route-interruption.json) | STOPPED — 15 PASS / 8 FAIL | Incomplete rerun with unavailable selected hero images. It is not a clean corrected-build result. |
| [B3 affected complete-pose run](../evidence/browser/affected-pose-final.json) | PASS — 195 PASS / 0 FAIL | Responsive image handoff, recorded transition states, chapter layouts, controls, UI reduced motion, explicit fallback-font metrics and English/completeness checks at the recorded scope. DOM assertions do not establish biological composition or continuous motion. |
| [Targeted refinements before containment](../evidence/browser/refinements-before-containment.json) | FAIL — 96 PASS / 2 FAIL / 98 total | Caption placement, complete hatching/feeding poses, hanging-plate geometry and reconstruction wording. Two full-plate bounds checks failed at 320px and 390px because inherited 8% overscan remained. |
| [Final hanging containment retest](../evidence/browser/hanging-containment-final.json) | PASS — 2 PASS / 0 FAIL | Repeats exactly those two unchanged geometry assertions after removing overscan only for the phone TR-05-06 plate; current production identity is recorded in the loaded document. |
| [Manual input observations](../evidence/browser/manual-input-observations.json) | 6 recorded PASS observations | Native wheel, instar click/arrow selection, dialog focus, native Tab, and native Escape/focus return on the recorded portrait snapshot. |
| [Direct navigation and capability observations](../evidence/browser/direct-navigation-and-capability-observations.json) | 1 PASS / 2 BLOCKED | Fresh top-level `#ch-08` navigation passed on corrected-2; actual zoom and background-transition attempts were blocked by the exposed browser surface. This predates final layout refinements. |
| [Recovery before final fixes](../evidence/browser/recovery-before-final-fixes.json) | FAIL — 6 PASS / 1 OBSERVED / 1 FAIL | Actual failed-image/Retry, stale-callback simulation, still-mode, resize, history, and timing observations; reload preserved position but changed active chapter. Historical snapshot. |
| [B3 deeper recovery](../evidence/browser/pose-recovery-before-lifecycle-fix.json) | FAIL — 3 PASS / 2 FAIL / 1 BLOCKED | Semantic reload drift and wrong chapter after still-mode restoration; image Retry blocked after the shared route served PULSE. Earlier records remain separate. |
| [CZ lifecycle still retest](../evidence/browser/lifecycle-still-retest.json) | FAIL overall — 2 PASS / 1 FAIL | Still-to-immersive restoration passed; the same report preserves the earlier assertion made while reload restoration remained pending. These are not three independent new tests beyond the component records. |
| [Final recovery](../evidence/browser/recovery-final.json) | PARTIAL — 6 PASS / 1 BLOCKED / 0 FAIL | Actual semantic/native reload restoration, stills, history, real 404/fallback/Retry and resize passed. An earlier route-blocked reload attempt remains in the report. Tested recovery module is separately identified below. |
| [Standalone Playwright environment](../evidence/prototype/playwright-environment.json) | BLOCKED | Missing Chromium executables and failed official browser download; no navigation, capture, or passing browser test. |
| [Independent art/interface review](independent-art-review.md) | Targeted G4 and later captured-midpoint defects RESOLVED at the stated scopes; all ten phone midpoints directly inspected | Original failures remain retained. The two reconstruction captions have source verification, actual runtime wording checks, and independently inspected final rendered captures. This is not continuous-motion or whole-site acceptance. |
| [Earlier package candidate](../evidence/package-candidate-before-containment.json) | PASS for its extracted install/build/asset audit, then superseded by later containment CSS | Actual command log is retained, but the earlier candidate is not the final source archive. |

## Tested build identities

| Snapshot | Concrete identity | Recorded build scope |
| --- | --- | --- |
| B3 — complete-pose and study corrections | [pose-production-build.json](../evidence/pose-production-build.json): entry-document SHA-256 `706b6b54cbc59970529e70fb36e836ef21c4f466bedb10c3b50e367866b5500e`; script `./assets/index-B3o3QDo8.js`; CSS `./assets/index-BCuQmqec.css`. [pose-source-fingerprint.json](../evidence/pose-source-fingerprint.json) records 56 source/input/test paths at 08:09:25 UTC. | Archived 47-test/34-file build; this is the identity associated with the 195 passing affected checks. |
| CZ — historical lifecycle checkpoint | Script `./assets/index-CZsrKgAh.js`, identified in [the later checkpoint DOM observation](../evidence/browser/checkpoint-application-observation.json). | Early pending-session failure and scoped still-mode retest remain attached to this historical module. The current production identity file no longer describes CZ. |
| Recovery document | [recovery-final-production-identity.json](../evidence/browser/recovery-final-production-identity.json): script `./assets/index-t-phVWi2.js`; CSS `./assets/index-XL107Ink.css`. | Actual retained document used by the final recovery run. The identity note states later delivery changes affect only the phone J-plate caption tag and overscan framing. |
| Refinement run before containment | [refinements-before-containment.json](../evidence/browser/refinements-before-containment.json) records loaded script `./assets/index-81aSGw2Y.js`. | The 96/2 result belongs to this document; it is distinct from the final two-check containment retest. |
| Current production | [final-production-build.json](../evidence/final-production-build.json), recorded **08:45:36 UTC**: entry SHA-256 `66c915a644cfcb52825e5e10ab8b102b0c392d52e001530aa7d4c1d43319ce89`; script `./assets/index-CHOjqdUS.js`; CSS `./assets/index-ByIcPCHI.css`. [final-source-fingerprint.json](../evidence/final-source-fingerprint.json) maps **58 input paths**. | Current 51-test/35-file build and the loaded identity in the final containment retest. |

The source/build identities distinguish the actual tested documents. None is the final source ZIP checksum. Historical 42-, 47-, and 51-test records remain separate rather than being reassigned to another snapshot.

## Browser method and scope

The broad matrix ran from **07:15:05 to 07:26:04 UTC** in Chrome 156 on Linux, with device pixel ratio 1 and an unthrottled network. Its method was DOM assertions, DOM `click()`, and native `scrollTo()` in one retained same-origin iframe. The same real document was resized, and image assets were warmed before matrix checks. These are real CSS layout contexts; they are not physical-device emulation, fresh cold loads at every width, native pointer targeting, or proof of all keyboard behavior.

The retained sizes were:

| Group | CSS viewport sizes |
| --- | --- |
| Main matrix | 320×700, 360×640, 390×844, 768×1024, 1440×900, 1920×1080, 2560×1440, 3840×2160 |
| Landscape and breakpoint neighbors | 844×390, 699×900, 701×900, 1099×900, 1101×900 |
| Effective reflow sizes | 1152×720, 960×600, 720×450 |

The effective reflow sizes approximate content widths associated with 125%, 150%, and 200% zoom on a 1440px baseline. A separate actual browser-zoom attempt was **BLOCKED** because the inputs produced no observed zoom effect; these CSS reflow sizes are not relabeled as zoom tests. High CSS viewport dimensions likewise do not turn the retained approximately 1.66K-wide illustrations into native 4K assets.

### Eight historical failures

| Recorded failure | Affected context | Resolution status in retained evidence |
| --- | --- | --- |
| Hero image unavailable without an authored fallback | 768×1024, 1440×900, 1920×1080, 2560×1440, 3840×2160 — five failed checks | B3 selected-source/layout checks passed at all eight main widths in the affected run. This resolves those observations for B3, without rewriting the earlier failures or certifying later builds. |
| “Illustrative reconstruction” exceeded horizontal bounds | 699×900 — one failed check | B3's explicit 699px corrected-annotation check passed, with document width 691px. Later caption checks are retained in the targeted refinement run below. |
| Direct navigation to `#ch-08` timed out | Fresh hash navigation — one failed check | A separate corrected-2 top-level direct-hash observation passed. That scoped pass does not delete the historical iframe timeout. |
| Mid-page reload did not retain native position | Recorded scroll position changed from 22,292 to 12,580 — one failed check | Later strict changed-layout and unchanged-layout reloads passed in the final recovery record. The original failed observation remains intact. |

The later affected run began at **07:51:14 UTC** and was stopped at **07:52:26 UTC**. All eight retained viewport hero checks failed because their selected image did not decode: the portrait source at 320/360/390px and the desktop source at 768/1440/1920/2560/3840px. The operator encountered replacement of the shared preview route. The JSON preserves the actual failures and stop; it must not be relabeled as a passing rerun or used by itself to conclude that the final source introduced eight regressions. The earlier development-preview interruption is separately described in [the environment record](../evidence/environment-interruption.md); its unfinished 11-check observation is also not a matrix pass.

## B3 affected complete-pose run

[The saved affected run](../evidence/browser/affected-pose-final.json) began at **08:16:31 UTC** and finished at **08:24:57 UTC**, recording **195 PASS and 0 FAIL**. It used the B3 identity above, Chrome 156 on Linux, DPR 1, an unthrottled network, warmed images, and a retained same-origin iframe. The eight main CSS viewport sizes were unchanged from the broad matrix; an additional 699×900 annotation check is explicitly present.

The recorded assertions cover selected responsive hero sources, midpoint/ending completeness, all eleven chapter layouts at 390px and 1440px, transition checkpoints including the separate hanging-stage poses, quarter-caption rounding, phone instar rows, reconstruction reset, other named controls, and English/completeness. UI-selected reduced motion preserved all eleven chapters and Instar 3 selection at 390px and 1440px. This is not an OS preference-emulation result.

Explicit fallback-font metric checks switched the body to Arial and headings to Georgia, verified the recorded layouts, and restored the original families at 390px and 1440px. They did **not** delay or block font network requests. The 195 DOM/state passes do not certify every biological silhouette, caption-to-subject relationship, pointer target, or continuous intermediate frame. The later boundary findings below demonstrate why the independent visual check remains separate.

## Direct interaction observations

[The manual record](../evidence/browser/manual-input-observations.json) identifies the actual production snapshot as **corrected-2, before complete-pose and study-scale refinements**, in a 390×844 CSS iframe. Browser-control actions and subsequent accessibility/DOM observations established the following narrow results:

| Action | Observed result |
| --- | --- |
| Native wheel scroll downward | The CH-05 reading hold moved; scrolling was not locked. |
| Select Instar 4 | The pressed control, named diagram, and caption changed to the fourth instar. |
| ArrowRight from Instar 4 | Instar 5 became selected and focused; its description and caption changed. |
| Open Chapters | The dialog contained all eleven links and initially focused Close. |
| Native Tab | Focus moved from Close to the first chapter link. |
| Native Escape | The dialog closed and focus returned to its Chapters trigger. |

These observations do not establish every keyboard combination, screen-reader output, physical touch, or WCAG conformance. They also do not certify the later revised layout and transitions.

### Fresh navigation and exposed browser capabilities

[The separate capability record](../evidence/browser/direct-navigation-and-capability-observations.json), recorded at **08:05:25 UTC**, used Chrome 156 on Linux with an unthrottled network and potentially warm shared cache. It explicitly identifies the **corrected-2 snapshot before final complete-pose/study refinements**.

| Operation | Recorded result and limit |
| --- | --- |
| Fresh top-level direct hash | **PASS:** opening a new real tab at `/?chrysalis-qa=direct-hash#ch-08` produced the CHRYSALIS title, active chapter `ch-08`, and heading “The change is continuous.” The heading top was 242.09375 CSS px at a document width of 1355px. This is a successful separate observation, not deletion of the earlier iframe timeout. |
| Native browser zoom attempt | **BLOCKED:** native Ctrl+Plus and Ctrl+Equal were sent, then Ctrl+0. Client width and scroll width remained 1355px; no zoom effect was observed. This does not establish 125%, 150%, or 200% browser zoom. |
| Background-tab restoration attempt | **BLOCKED:** the retained QA, recovery, and direct-navigation documents all continued to report `visibilityState: visible`. No actual hidden-to-visible lifecycle transition occurred, and no synthetic visibility event was counted. bfcache remains a separate untested case. |

## Historical recovery and performance observations

[The recovery record](../evidence/browser/recovery-before-final-fixes.json) was created at **07:53:26 UTC** and last updated at **07:57:33 UTC**. It used the actual production document in the same-origin cloud Chromium iframe, with a 1440×900 initial CSS viewport, DPR 1, unthrottled network, potentially warm cache, and unknown host hardware. The saved captions identify the older handoff presentation, so these results do not validate the later complete-pose correction.

| Check | Actual result |
| --- | --- |
| Authorized production document | PASS: expected CHRYSALIS title, all 13 requested warmed image resources loaded. |
| Failed image and Retry | PASS: a real unavailable image URL returned 404 and fired an error; the embedded jade fallback remained, the broken image was hidden, and the recovery notice appeared. The actual Retry control restored the 1659×948 jade asset and removed the notice. |
| Late completion protection | PASS within an explicit simulation: saved older A/B image callbacks were delivered after the final emergence selection. Mode, asset, diagram and caption remained at the final selection. This did not delay or reorder real network traffic. |
| Still view and restoration | PASS: all eleven chapters retained nonzero layout and two beats; Instar 4 remained selectable; first/middle/last visits and return to immersive mode were observed. This did not emulate the OS reduced-motion preference. |
| Same-document resize | PASS: four actual iframe resizes between 390×844 and 1440×900 retained refreshed midpoint state. This checks the older renderer's state behavior, not the revised figures' visual quality. |
| Same-document history | PASS: menu links created distinct entries, repeating the same hash created none, and actual back/forward restored the expected chapter and heading focus. This was not a bfcache test. |
| Reload | FAIL in this historical run: native position remained at scrollY 24,011, but active chapter changed from `ch-09` to `ch-10`. Retaining the number alone was insufficient. The later corrected strict result is recorded separately below. |
| Timing diagnostics | OBSERVED, not a performance pass; details below. |

The loaded document exposed **first contentful paint at 816ms**, an application-ready mark at **118.6ms**, and the hero-asset-ready mark at **75ms**, measured against the document time origin. These are different events and are not LCP, INP, or time to first human interaction. The buffered long-task observer reported one task of **75ms** in the captured diagnostic scope.

Both requested 61-frame transition samples timed out: TR-06-07 retained **24 observed frame timestamps** over **22,911.7ms**, and TR-09-10 retained **22** over **22,812.1ms**. Both recorded a median interval of **1016.4ms** in this cloud iframe/harness context. The JSON preserves raw intervals and scroll samples. These constrained observations cannot establish smooth-motion acceptance, hardware FPS capability, or the cause of the pacing. They must not be converted into a claimed performance-budget pass. A final snapshot's diagnostic run, if performed, needs its own record.

## Deeper lifecycle failures and scoped retests

[The B3 recovery record](../evidence/browser/pose-recovery-before-lifecycle-fix.json), updated at **08:22:11 UTC**, is **FAIL overall: 3 PASS / 2 FAIL / 1 BLOCKED**. Initial document loading, simulated stale callbacks, and same-document resize passed. The following remaining findings were concrete:

| Finding | Actual evidence and interpretation |
| --- | --- |
| Semantic position drift after reload | **FAIL:** changing from selected Instar 4 back to default Show all increased the measured document/preceding layout by **164px**. Native scrollY remained 24,011, but the TR-09-10 reading fraction changed from approximately **1.000651** to **0.545095**. Keeping the same native Y did not preserve the same reading position. The earlier isolated copy is [reload-semantic-first-retest-failure.json](../evidence/browser/reload-semantic-first-retest-failure.json); it duplicates this failed observation and is not a separate passing rerun. |
| Still-to-immersive restoration | **FAIL:** the selected chapter was lost when immersive view returned. The controller was subsequently corrected to maintain active semantic checkpoints and exclude hidden bridge markers from the reading-state measurement. |
| Image failure/Retry | **BLOCKED:** the real route guard observed the title “PULSE — An atlas of one heartbeat” instead of CHRYSALIS. The network-dependent check stopped before being treated as an application result. This does not erase the earlier successful real 404/Retry observation on its own snapshot. |

The historical CZ checkpoint contained the lifecycle correction. [reload-checkpoint-pending-observation.json](../evidence/browser/reload-checkpoint-pending-observation.json) nevertheless retains an early **FAIL**: the strict reading-fraction assertion ran while the actual public DOM reported `data-reload-restoration="pending-session"`.

A [later read-only DOM observation](../evidence/browser/checkpoint-application-observation.json) records `data-reload-restoration="applied"` and active chapter `ch-10` on the CZ module. Its exact observation timestamp was not separately retained; the artifact was recorded at 08:33:59 UTC. **No later scrollY or anchor fraction was measured in that read**, so it establishes that restoration left the pending state, not that the strict geometry assertions passed. The early failure remains FAIL.

The [recovery harness](../tests/recovery-qa.html) waits for the public restoration status to leave `pending-`, with a finite **10-second timeout**, before taking the settled state and running the unchanged strict geometry assertions. A timeout remains a failure. The completed strict retest is now retained in the final recovery record below; it does not rewrite the earlier assertion.

[lifecycle-still-retest.json](../evidence/browser/lifecycle-still-retest.json), updated at **08:27:17 UTC**, contains a **PASS for all eleven chapters in still view and immersive restoration**: Instar 4 remained selectable and the selected CH-05 returned as CH-05. Its overall status remains **FAIL**, with two passing checks and the earlier pending-session reload failure preserved. These lifecycle artifacts overlap; their counts must not be added together as independent coverage.

## Final recovery result

[recovery-final.json](../evidence/browser/recovery-final.json), created at **08:37:32 UTC** and updated at **08:45:11 UTC**, records **PARTIAL: 6 PASS / 1 BLOCKED / 0 FAIL** on the `t-phVWi2` recovery document identified above. The first reload attempt was blocked when the guarded route served PULSE. The route was reasserted and the actual reload operation was repeated successfully; both records remain visible.

| Completed check | Actual result |
| --- | --- |
| Changed-layout reload | PASS: after the default Show-all layout added 164px, native Y moved from 24,011 to **24,175**, the semantic anchor fraction stayed identical (**semantic delta 0**), and owner `ch-10` remained. The finite restoration wait observed **2910.6ms**. |
| Unchanged-layout reload | PASS: native Y remained **24,175**, native and semantic deltas were **0**, and owner `ch-10` remained. Restoration wait observed **2910.4ms**. Both reload cases form one recorded check. |
| Stills and immersive restoration | PASS: all eleven chapters retained two beats and nonzero layouts; Instar 4 remained selectable; CH-05 returned as CH-05. |
| History | PASS: actual same-document back/forward restored chapter and heading focus; repeating the current destination added no duplicate entry. |
| Real failed image and Retry | PASS: actual unavailable image URL returned **404**, authored embedded jade fallback remained visible, and actual Retry restored the 1659×948 image and removed the notice. |
| Resize | PASS: four actual iframe resizes between 390×844 and 1440×900 refreshed the measured/rendered transition state. |

Successful initial loading is the sixth passing record; the two reload cases share one check. The report contains no new performance observation. The final production identity differs only by the later phone J-plate tag/overscan changes stated in the recovery identity record; the run is not mislabeled as having loaded the current module.

## Visual review and corrective work

The independent review directly inspected the selected source images and identified the AI-09 hatchling's repeated posterior pointed legs as a material defect. The retained replacement was directly rechecked: the erroneous spikes are gone, with ventral feet naturally occluded by the leaf. It is an observation illustration, not a leg-count plate. The final AI-09 derivative hash is recorded in both [the asset audit](../evidence/asset-audit.json) and [provenance](../art/asset-provenance.json). The feeding comparison's diagram scope and missing instar description field were also corrected and rechecked in source.

The stable captured hero regions retain the selected egg/leaf framing, light, contact, and safe text field. This supports those observed compositions only. It does not validate all six directed hero states, all narrow widths, three first-scroll/return trials, or the unseen right edge of the desktop iframe.

The historical TR-06-07 midpoint visibly spliced the upper hanging larva onto the lower jade pupa. That captured frame **failed** independent review. The B3 correction presents TR-06-07 and TR-09-10 as separate complete supported poses, with one source below 12.5%, two labeled poses from 12.5% through 87.5%, and one target above 87.5%. Reduced motion selects one complete source below 50% and the target from 50%. Scope text explicitly says the skin-shedding or shell-opening movement is not shown. The independent reviewer directly inspected the revised desktop midpoint and portrait 25/50/75% captures and marked the previous splice **RESOLVED within those checkpoint compositions**. This is not a continuous-motion or unseen-boundary verdict.

G4's two weakest observed nonhero chapters were **CH-08**, whose phone reconstruction was too small, and **CH-05**, whose phone Show-all row made the five specimens too small to compare. The independent reviewer has now marked both targeted visibility defects **RESOLVED in the supplied phone captures**: CH-05 uses larger stacked specimen rows with descriptions and its unmeasured-scale disclaimer; CH-08 enlarges the complete support/casing/wing-region drawing and differentiates its legend while retaining the illustration disclaimer. CH-08 remains a separate explanatory drawing, not a registered cutaway. These scoped G4 corrections remain valid even though subsequent boundary review found other defects.

### Additional midpoint findings and their resolutions

| Boundary and evidence | Independent before-correction finding | Actual resolution |
| --- | --- | --- |
| TR-01-02 — [boundary-01-p50.jpg](../evidence/browser/boundary-01-p50.jpg) | **Historical FAIL:** the opaque caption panel masked the egg's lower shell and leaf contact. | Independently RESOLVED in the retained 320×700 and 390×844 replacement midpoints: the upper caption clears the header/tag and complete shell/contact. |
| TR-03-04 — [boundary-03-p50.jpg](../evidence/browser/boundary-03-p50.jpg) | **Historical FAIL:** a wipe joined a partial opened shell to the feeding larva and removed the feeding head at the seam. | Independently RESOLVED in the replacement phone and desktop regions: separately labeled complete hatching and feeding plates retain the shell, tiny hatchling, feeding head/body/contact/notch, and the explicit unshown-movement limitation. |
| TR-05-06 — [refined phone midpoint](../evidence/browser/refined-portrait-05-p50-390.jpg) | Earlier framing did not show the full J pose; the initial replacement also needed its tag moved clear of the attachment. | Independently resolved at the inspected 390×844 midpoint: the complete body, head, rear attachment, silk and stem are visible with the tag clear. The later whole-plate geometry correction is separately tested below. |

The independent reviewer directly inspected a phone midpoint for every boundary and closed the captured-midpoint review with no further material anatomy or text-safety correction requested in those observed compositions. TR-07-08 and TR-08-09 replacement captions were initially source-verified; the targeted browser run now records their actual rendered wording as PASS, and the final [TR-07-08](../evidence/browser/contained-portrait-07-p50-390.jpg) and [TR-08-09](../evidence/browser/contained-portrait-08-p50-390.jpg) captures retain those words. This does not extend the still-frame verdict to unobserved progress values or continuous motion.

## Targeted refinements and final containment

[refinements-before-containment.json](../evidence/browser/refinements-before-containment.json) ran from **08:41:31 to 08:45:12 UTC**, recording **96 PASS / 2 FAIL out of 98 checks** at 320×700, 360×640, 390×844, 1440×900 and 844×390. It checks TR-01 caption placement; forward/reverse/direct and mode-boundary states for the TR-03 complete landscape observations; TR-05 phone hanging geometry; and honest reconstruction/exterior wording. It loaded `index-81aSGw2Y.js`, not the later containment build.

The two failures were strict **full source-plate bounds** checks at 320px and 390px. Inherited 8% cinematic overscan extended the plate outside the revealed rectangle even though the complete animal could remain visible in a capture. The geometric invariant was not waived. Overscan was removed only for the phone TR-05-06 plate.

[hanging-containment-final.json](../evidence/browser/hanging-containment-final.json), **08:46:28–08:46:35 UTC**, repeats those two unchanged assertions and records **2 PASS / 0 FAIL** on `index-CHOjqdUS.js` / `index-ByIcPCHI.css`. The contained plate's horizontal bounds were **0–312px** at the 320px viewport and **0–382px** at the 390px viewport; its full vertical extent fit within the respective revealed rectangle. [The final 390px capture](../evidence/browser/contained-portrait-05-p50-390.jpg) retains the resulting subject framing. These two results specifically resolve the two bounds failures; the original 98-check JSON remains FAIL.

### Capture boundaries

The **seven historical desktop JPEGs** and **two B3 revised desktop midpoint JPEGs** each decode as **1341×921 raster images** showing the visible portion of a **1440px CSS iframe**. They are not full 1440px viewport screenshots. In particular, `desktop-1440-hero-visible1363.jpg` has a temporary filename that does not match its actual raster width. The **six historical portrait context captures**, **nine B3 revised portrait captures**, and **eight additional boundary midpoint captures** are each **1363×936**, with the **390px page on the left and QA host canvas beside it**. `portrait-390-hero-crop.jpg` remains the separate **390×844** crop.

The B3 revised set, whose filenames retain the `final-` prefix, covers desktop TR-06-07/TR-09-10 at 50%; portrait TR-06-07/TR-09-10 at 25%, 50%, and 75%; two portions of phone CH-05 Show all; and phone CH-08 inside. The additional set covers the other eight boundary midpoints and includes the newly failed TR-01-02/TR-03-04 frames. None comprises every chapter, every boundary endpoint, all six hero states, or continuous movement. Exact filenames appear in the [evidence index](evidence-index.md).

Host scrollbars and surrounding QA canvas must not be confused with application layout defects. A still image cannot establish continuous movement, unseen intermediate anatomy, or regions beyond its captured bounds. Every filename and capture role is listed in the [evidence index](evidence-index.md).

The subsequent refinement captures use the same 1341×921 desktop visible-region and 1363×936 phone-context conventions, including separate 320px and 390px phone states. The [ten-boundary contact sheet](../evidence/browser/ten-boundary-midpoint-contact-sheet.jpg) is a **1950×1848** arrangement of ten actual 390×844 crops, with [source/crop metadata](../evidence/browser/ten-boundary-midpoint-contact-sheet.json). It intentionally combines named snapshots: corrected boundaries use their replacements and unchanged boundaries retain earlier frames. It is neither a single-build full-path capture nor continuous video. The build owner reviewed the assembled sheet and requested no further composition changes.

## Earlier extracted package candidate

[package-candidate-before-containment.json](../evidence/package-candidate-before-containment.json) and [candidate-install-build.txt](../evidence/candidate-install-build.txt) record an actual separate extraction followed by `npm ci`, `npm run build`, and `node scripts/audit-assets.mjs`, all with exit code **0**. The audit verified **15 retained originals, 15 production checksums and 15 built media copies**, with declared fallbacks. The candidate archive was **28,122,702 bytes**, SHA-256 `438e51b8fca79714bb67bf84f780405d0ad13fcf6284b04073da50df5474f17d`.

This is a valid result for that earlier candidate and is explicitly **superseded by the later containment CSS**. Its then-current production-match flag does not describe the current `CHOjqdUS` / `ByIcPCHI` build. Browser verification of that candidate was not performed in the recorded artifact. The current application was separately extracted and verified again as recorded below; the final delivery checksum is kept outside the archive it identifies.

## Open mandatory gates and known limits

| Area | Current status and required evidence |
| --- | --- |
| H2 — directed hero | Responsive availability/layout and the corrected first-boundary caption are evidenced. Complete cold/partial-loading six-state observation and the full prescribed repeated first-scroll/return trial coverage are not established by the retained stills and DOM checks. |
| H4 — ten boundaries | Every phone midpoint has an independent scoped visual observation; identified midpoint defects are resolved. B3 and targeted state checks plus the final 2/2 containment retest are retained. Continuous motion and unseen-frame guarantees remain outside that evidence. |
| G4 — artistic correction | The original CH-05/CH-08/hanging-stage targets and later captured-midpoint defects are independently RESOLVED within the stated captures. This is targeted artistic correction, not whole-site acceptance. |
| Recovery and state restoration | Final actual changed/unchanged reload, stills, history, image failure/Retry and resize passed at their recorded scopes; one earlier route blockage remains. Historical failures and overlapping records are preserved. |
| Input and preferences | OS `prefers-reduced-motion`, native touch, and full keyboard/screen-reader coverage are NOT TESTED here. The actual browser-zoom attempt is BLOCKED because the inputs had no observed effect. Manual observations above retain their narrower scope. |
| Network and fonts | B3's explicit CSS fallback-font metric and restore exercises passed at 390/1440px. Actual late/missing font requests and throttled/slow network remain NOT TESTED. Warmed assets, unthrottled requests, and the blocked PULSE-route image check remain identified. |
| Background and browser lifecycle | Background/resume attempt BLOCKED: the exposed documents remained visible. bfcache behavior is NOT TESTED. Same-document history is a separate case. |
| Continuous recording | No completed continuous scroll video is retained, and no recording API was available in the used browser-control surface. Still captures and harness definitions do not satisfy this evidence item. |
| Performance | Historical diagnostics remain OBSERVED; both scroll samples timed out. The final recovery run contains no new performance sample. No measured FPS, budget pass, cold-start claim, LCP/INP result or field Core Web Vitals claim is made. |
| H9 — source package | The post-containment application passed a separate locked install, rebuild, all packaged-media checks, and actual first/middle/last browser observations. The final archive is verified again before handoff; its checksum and exact-copy verification accompany the delivery outside the ZIP. |

Standalone Playwright 1.62.1 could not launch because both expected Chromium executables were absent. The official shell installation failed after five automatic download attempts returned 0 MiB archives and invalid-ZIP extraction errors. This is an **environment BLOCKED** result, not a skipped success. The functioning cloud browser supplied the separately scoped iframe/manual evidence above; it does not erase the missing native suite coverage.

## Source package and independent extraction

The post-containment application was packaged as a validation candidate, `chrysalis-preflight.zip`, then extracted into a separate clean directory. [package-verification.json](../evidence/package-verification.json) and [extracted-install-build.txt](../evidence/extracted-install-build.txt) record successful `npm ci`, `npm run build`, and `node scripts/audit-assets.mjs` executions (exit codes **0 / 0 / 0**). Archive integrity, path safety and dependency/private-preview exclusions passed. The candidate contains **191 entries / 28,918,665 bytes**, with SHA-256 `da79b6a231a5257ba1964f3017befcd1205c45f1ef979533e2a71c7428879830`. This hash identifies the validation candidate, **not** the final delivery ZIP.

All **58 application/configuration/test source files** matched the retained final-source fingerprint. All **15 retained originals, 15 production checksums and 15 built media copies** were audited. The independently rebuilt `dist/index.html` SHA-256 is `66c915a644cfcb52825e5e10ab8b102b0c392d52e001530aa7d4c1d43319ce89`, matching the final production build. Its module is `index-CHOjqdUS.js` and its stylesheet is `index-ByIcPCHI.css`.

### Actual extracted-copy browser observations

[extracted-copy-observations.json](../evidence/browser/extracted-copy-observations.json) records fresh top-level navigation and normal Chapters-menu clicks in cloud Chromium, followed by actual ending-button actions:

| Observed state | Result |
| --- | --- |
| Opening / CH-01 | PASS: 11 chapters and 22 beats present; hero decoded; correct final module and stylesheet. |
| Middle / CH-06 | PASS: chapter menu reached the hanging chapter; heading received focus; both beats and decoded J-pose media present. |
| Ending / CH-11 | PASS: both beats present; the clean meadow and separate adult images decoded. |
| Flight departure and return | PASS: actual controls changed and reset the adult state while preserving the clean leaf/meadow backdrop. |
| Live preview response has zero scripts | FAIL: the managed preview service injected one 1,102-character WebSocket/CSS-refresh script. This failed assertion remains in the raw report; it is not recounted as a pass. |

The complete reading page visibly contained all **11 chapter sections and 18 SVG studies**. [reading-edition-source-audit.json](../evidence/reading-edition-source-audit.json) separately inspects the actual extracted built bytes: **zero scripts**, all 17 local resource references present, and SHA-256 `9eb1c72aca4763d37c6c4177a63ef5db4e0092d4c5f0b6431272f5c5e7d6175f`. The preview injection is absent from the delivered source and built reading page. This establishes a script-free deliverable, **not** an actual browser run with JavaScript disabled. The preview-browser report remains **PARTIAL: 4 PASS / 1 FAIL**.

[extracted-desktop-hero.jpg](../evidence/browser/extracted-desktop-hero.jpg) is a real native screenshot of this independently rebuilt opening page. These checks do not claim physical-device, true-zoom, cold-start or continuous-motion coverage.

### Final archive identity

The delivered `chrysalis-source.zip` adds the completed evidence and delivery documentation to that same fingerprinted application. It contains editable source, the lockfile, retained original and production art, fonts/licenses, launch instructions, test sources and actual evidence. Dependency folders, built output, private preview wrappers, environment files, caches and rejected generation rasters are excluded.

The final ZIP receives a further clean extraction, locked install, rebuild, media audit and first/middle/last browser observation before handoff. Its exact checksum, byte count and resulting observations are recorded in the accompanying **`chrysalis-verification.json`** and the handoff response. That external record identifies the immutable delivered archive; a ZIP cannot contain its own final checksum. The candidate record above is retained as the in-package application verification evidence and is not relabeled with the final ZIP's identity.
