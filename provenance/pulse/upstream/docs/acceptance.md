# PULSE acceptance record

**Recorded production results: 51/51 Node tests; 74 PASS, 0 FAIL and one NOT TESTED coverage record in the frozen-release full browser suite.** Initial navigation/header defects, transition overflow, hero width and media-recovery problems have been corrected and checked. The TR05 source repair has been rebuilt and 30 replacement stage captures are present. Independent re-review confirms that repair and the four corrected phone labels. The final release suite now passes and the normal ready-media TR06 start capture is verified. Top-level navigation/history/reload are recorded from the independently extracted build; separate native and neutral-control measurements are retained. Representative smoothness acceptance remains BLOCKED. Separate extracted-source and packaged-source install/build verification pass; the final seal and archive-check method are recorded below. Required actual zoom/touch/video capabilities are unavailable. This record therefore does **not** declare unconditional H1–H9 acceptance.

Updated from retained artifacts on **November 9, 2026**. The [requirements ledger](../requirements-evidence.md) summarizes the gates; the [evidence index](../evidence/index.md) distinguishes historical, corrected and final material. The older [test plan](test-plan.md) and [transition contracts](transition-contracts.md) remain planning/state-test snapshots and do not override these execution results.

## 1. Environment and method

| Item | Actual environment / method |
| --- | --- |
| Browser | Chrome 156.0.0.0; Linux x86_64 user agent |
| Device-pixel ratio | 1 in retained browser records |
| Source runtime | Node.js 24.22.1; npm 11.9.0 |
| Build | Vite 8.3.6; TypeScript 7.0.2; pinned direct dependencies and lockfile |
| Browser route | Cloud browser visiting internal HTTP review/probe surfaces; no public deployment |
| Full-suite method | Real production HTML rendered in an iframe; DOM control activation, computed-state/bounds assertions and native document scrolling |
| CSS viewport method | The iframe's actual `innerWidth`/`innerHeight` are set and asserted; the outer review surface may scale it to fit |
| Additional input | Browser-native pointer, Enter, Escape and PageDown; top-level CTA/menu, history Back/Forward and actual reload |
| Top-level native method | Independently extracted production build with test-only diagnostics; 1363×936 CSS pixels, DPR 1; source payload SHA matches the frozen release |
| Network | No deliberately throttled slow-network run; a separate real HTTP invalid/restored image fixture tests recovery |
| Hardware | Remote host details unknown; no physical-device/GPU claim |

The Browser extension returned HTTP 502 when trying to reach `terminal.local`. A local Playwright Chromium executable was unavailable; no browser installation was attempted under managed-preview restrictions. Internal HTTP cloud-browser interaction supplied the recorded browser evidence instead.

Actual 125/150/200% browser zoom, touch-emulation and continuous-video APIs are not exposed by the active browser surface. They are **BLOCKED**, not simulated by narrowing or scaling an iframe. CSS 390×844 is not a physical phone; CSS 3840×2160 is not a tested 4K monitor. Safari, physical devices, screen-reader certification and a full native wheel/scrollbar matrix are **NOT TESTED**.

## 2. Build, unit and source results

Artifact: [build-and-unit-tests.log](../evidence/build-and-unit-tests.log).

| Gate | Observed result | Scope |
| --- | --- | --- |
| Node tests | PASS — 51 tests; 0 failed, skipped or cancelled | 21 editorial/content checks, 21 story-state checks and nine focused media/retry regressions |
| Locale guard | PASS — 11 authored public files | Unexpected-script/source guard; not a substitute for prose or artwork review |
| Static render | PASS | All 11 chapters, 22 beats and 10 boundary sections emitted into HTML |
| TypeScript/Vite | PASS | Type check and production build completed |
| Distribution notices | PASS | Postbuild copied third-party notices into the build |
| Image provenance | PASS — eight real retained outcomes | Exact prompts/references/dimensions; three candidates, refinement, portrait, two material plates and midpoint |

The build log includes environment warnings about npm's proxy configuration and experimental TypeScript stripping. They did not fail the recorded commands. Build timing in that log is a local tool observation, not a site-performance benchmark.

The retained generated portrait is 984×1599 pixels; 390×844 is its intended browser layout target. Source, font, library and generated-art rights remain separate in [ATTRIBUTION.md](../ATTRIBUTION.md). No external medical artwork or patient data is redistributed.

## 3. Browser-run history and exact counts

| Run | Time recorded | Suite result, excluding summary/helper rows | Purpose |
| --- | --- | --- | --- |
| [Before fixes](../evidence/browser-run-before-fixes.json) | 2026-11-09T07:21:24.162Z | 69 PASS, 5 FAIL, 1 NOT TESTED | Retains original CTA/ending and narrow-header failures. |
| [Main flow after initial fixes](../evidence/browser-main-flow.json) | 2026-11-09T07:41:04.095Z | 74 PASS, 0 FAIL, 1 NOT TESTED | Rechecks navigation, header, full paths and transition containment. |
| [Earlier complete flow](../evidence/browser-final-flow.json) | 2026-11-09T08:12:26.133Z | 74 PASS, 0 FAIL, 1 NOT TESTED | Repeats complete suite after subsequent hero, fallback and Retry work. |
| [Frozen-release flow](../evidence/browser-release-flow.json) | 2026-11-09T08:26:15.219Z | 74 PASS, 0 FAIL, 1 NOT TESTED | Final full suite after the continuous TR05 outlet repair, against the frozen portable HTML. |

The earlier final-flow suite took 354,954 ms. Its embedded production snapshot was created at 2026-11-09T07:52:40.799Z and identifies SHA-256:

```text
b30b2d750d0a338a7b92c5806c521acaad8b91a31f8cb60d40e491fd4606edd4
```

This is the **browser-tested embedded HTML hash**, not the final source ZIP and not evidence for a later untested change.

The frozen source has since been rebuilt with the continuous TR05 pulmonary outlet. The current `preview/pulse.html` bytes independently hash to:

```text
6c1a14ff93bf0ab0e38060dd69b7fb809d2156d017c3e38b824a74c04f6630bd
```

The final release suite ran against this later revision and completed in **352,419 ms**. Its saved build metadata identifies the same SHA-256, with snapshot creation at **2026-11-09T08:18:12.451Z** and results recorded at **2026-11-09T08:26:15.219Z**. The exact result is **74 PASS, 0 FAIL, 1 NOT TESTED**. This is an executed release result, not a transfer of the earlier count.

The release file contains **83 raw records**: seven `OBSERVED`, 75 `PASS` and one `NOT TESTED`. One PASS is the suite summary; removing it gives **74 suite PASS cases**. The earlier final-flow file has 105 raw records: 27 `OBSERVED`, 77 `PASS` and one `NOT TESTED`. Its two font-override helpers and one summary are excluded to obtain that earlier 74-case result. The before-fix file has six literal FAIL rows only because its failing summary is included; there were five failing check cases, not six distinct failures.

### What the full suite proves

It confirms 11 chapters, exact headings, 22 substantive beats, ten transitions, English metadata and **219 checked strings**, dialog/focus behavior, CTA/ending navigation, and all chapter selection/reset outcomes. Computed visual-state assertions additionally cover CH-02/03/05/06/07/10/11; other option checks verify control/mode/result identity.

It exercises the complete reading and interaction path at **1440×900** and **390×844**. Each of ten boundaries has five-stage, threshold-neighbor, reverse and direct-midpoint checks in each viewport. The updated regression also checks art-stage containment and separation from local caption regions. Native scroll quantization can produce small deviations from exact quarter percentages; actual values are retained.

Risk-based bounds pass at **320×700, 360×640, 390×844, 768×1024, 1440×900, 1920×1080, 2560×1440, 3840×2160 and 844×390**. The suite preserves selected anatomy across motion changes and confirms 20 complete reduced-motion plate endpoints plus a correct gas-direction result. These are the sizes actually recorded; no unrecorded breakpoint-neighbor sweep is claimed.

A passing state/bounds suite does not establish anatomical clinical validity, every artistic midpoint or smooth continuous motion. The separate visual review found the TR05 composition issue despite these passes. The source has now been repaired and visually re-reviewed successfully; the distinct final release run also passes the state, bounds, reverse and direct-entry cases.

## 4. Defects, corrections and verified outcomes

| ID | Actual defect | Implemented correction | Recorded verification |
| --- | --- | --- | --- |
| F-01 | CTA and ending hash/focus checks timed out in the `about:srcdoc` review embedding. | Resolve `pushState` against the document's own URL rather than an inherited base. | Both later suites pass CTA, correct focus and ending return. This does not claim the original ordinary HTTP page failed in the same way. |
| F-02 | Chapters control exceeded the viewport at 320/360/390 widths. | Specific mobile hiding rule for the header motion control; motion remains in the chapter menu. | All three narrow bounds pass in later suites; native phone-menu/Enter/Escape checks also pass. |
| F-03 | Oversized transition SVGs bled behind CH03/CH04 titles and over TR06-07 captions. | Fit art inside the allocated grid stage and add stage/caption containment regression. | Later suites pass bounds; corrected CH03/CH04/TR06-07 screenshots were opened by a separate reviewing agent. |
| F-04 | Retry could corrupt non-HTTP URLs or discard responsive picture sources. | Preserve embedded/blob/file bytes; update only selected HTTP candidates; retain source elements; bind readiness to the actual image; reject stale callbacks. | Nine focused Node tests; real HTTP failure/restoration/Retry passes; portrait source still selected after retry and resize; invalid embedded bytes remain recoverable errors. |
| F-05 | A five-pixel negative portrait-art inset caused horizontal escape. | Remove the negative inset. | Final phone capture reviewed; document client/scroll widths both 375 within the 390-pixel viewport; responsive suite passes. |
| F-06 | Failed magnification-art notice covered part of the fallback diagram. | Reserve a separate layout row for the notice and Retry. | `magnification-fallback-final.jpg` shows complete gas-exchange fallback and unobstructed notice; separate reviewer confirms the arrangement. |
| F-07 | Historical TR05 25/50% captures showed a detached pulmonary branch fragment above the valve root while the caption described a connected route. | Keep a continuous root/trunk and branches in the persistent SVG layer; advance the flow trace without clipping vessel geometry. The registered root remains `[47, 58]`; captions describe the trace. | Separate visual re-review confirms the continuous root at both failure points and both widths, matching captions and no new spill throughout both five-stage sequences. **Visible composition finding closed.** The later frozen-release suite also passes state/containment, reverse and direct-entry verification. |

A separate capture-quality issue affected four phone frames: TR01 0%, TR04 0%, TR04 75%, TR09 75%. They showed another chapter or a repeated midpoint, so the earlier versions were invalid evidence of their labeled stage. The owner has now replaced **30 unique frames**: all 20 desktop/phone zero-percent frames, the eight remaining TR05 quarter frames, and phone TR04/TR09 at 75%. All **100 originals** are present and all **20 contact sheets** have been regenerated. The separate reviewer reopened all 20 sheets, inspected all replaced zero-percent panels and TR05 stages plus the phone TR04/TR09 75% panels, and confirmed the four original label mismatches are resolved. An intermediate desktop TR06 0% capture contained the valid pending-media fallback. It has now been replaced by the normal ready-media branch-source state, verified in the actual screenshot and capture manifest. A capture-sequencing mistake is distinguished from an observed runtime anatomy failure.

## 5. G4 artistic correction record

The [independent visual review](../evidence/independent-visual-review.md) was performed by another AI agent, separate from the root browser operator, who also contributed diagrams. It is a bounded screenshot review, **not a third-party audit or a clinician's review**.

| Target | Before | Corrected evidence | Visible improvement |
| --- | --- | --- | --- |
| CH-03 — The Signal | [Baseline](../evidence/ch03-baseline-final.jpg) | [Corrected chapter](../evidence/ch03-corrected-full.jpg); [sequence and controls](../evidence/ch03-sequence-and-controls.jpg) | Prior heart fragment removed; clean title/plate composition; AV marker moved into lower right atrium clear of pulmonary root; dotted signal distinguished from blood route. The captured lower strip shows the blood-pathway state, not every electrical step. |
| CH-04 — The Return | [Baseline](../evidence/ch04-baseline-final.jpg) | [Corrected chapter](../evidence/ch04-corrected-full.jpg) | No previous heart fragment over heading; vena-cava entries and upper/lower-body origin labels gain clear priority while retaining organ orientation. |
| TR-06-07 — Magnification | [Baseline](../evidence/tr06-07-baseline-settled.jpg) | [Corrected midpoint](../evidence/tr06-07-corrected.jpg); [later phone stages](../evidence/contact-sheets/phone-tr06.jpg) | One bounded material illustration replaces the duplicate oversized anatomy. Captions are clear. The later 25% phone frame verifies the corrected “explicit magnification cue” wording. |

The initial corrected midpoint still contained “boxed”; it is historical evidence of the layout correction, not evidence of the subsequent wording fix. The later phone TR06 sheet supplies that wording check. Baseline filenames containing `final` are not acceptance labels.

The reviewer inspected all **20 contact sheets**, containing 100 labeled panels, and separately opened the final portrait and magnification-failure captures. This does not mean all 100 full-resolution originals were individually opened. That earlier review found the four capture mismatches and the TR05 intermediate disconnection; all other reviewed panels followed the expected broad source/target order without recurring section overflow. Thirty originals have subsequently been replaced and the contact sheets regenerated. The additional independent review has now reopened all 20 regenerated sheets and specifically inspected every replaced zero-percent panel, both full TR05 sequences and phone TR04/TR09 at 75%. It confirms the TR05 gap is repaired and all four phone mismatches are corrected, with no new spill. The desktop TR06 0% panel in that pass was a contained pending-media fallback. A subsequent ready-image replacement now establishes the normal branch source: its manifest records `state: ready`, `complete: true`, natural width **1439**, observed progress **0.0008**, and the frozen release hash. The documentation reviewer opened the replacement original and confirmed the visible pulmonary-branch source. The diagram reviewer also reopened the original and its sheet, closing every concrete screenshot finding within that review’s stated scope. Fine-label readability and anatomical registration cannot be certified merely at contact-sheet scale.

## 6. Eleven-chapter ledger

Each row has two authored observations, passing desktop/phone reading-hold checks and passing selection/reset results in the latest suite. “PASS” below is scoped to that reading/interaction verification; special visual evidence and limitations are stated separately.

| Chapter | Two observations | Verified method and evidence | Reading/interaction result |
| --- | --- | --- | --- |
| CH-01 — The Living Form | Chest orientation; muscle/cutaway | All six hero states observed across retained runs; CTA/return suite checks; final portrait and desktop art review; two orientation options/reset | PASS |
| CH-02 — Four Chambers | Receiving/pumping roles; septa/wall difference | Four chamber controls and computed emphasis; native Enter on Left ventricle; two reading checks | PASS |
| CH-03 — The Signal | SA/atria; AV delay/ventricular conduction | Computed signal/blood separation; native Blood pathway click; corrected AV placement and chapter/reading-strip captures | PASS |
| CH-04 — The Return | Two caval entrances; tricuspid route to RV | Four step/reset results; corrected hierarchy and upper/lower-body annotations; no preceding art bleed | PASS |
| CH-05 — One-Way Gates | AV apparatus; semilunar outlets and phases | Family selection/display checks and complete reading path. Outgoing TR05 repair is visually confirmed separately; final release-suite checks also pass. | PASS |
| CH-06 — Toward the Lungs | RV/pulmonary outflow; branches/capillary scale | Branch selection and computed attenuation; both reading paths. Incoming TR05 repair is visually confirmed; final release-suite checks also pass. | PASS |
| CH-07 — Exchange | Separate compartments; opposite gas directions | Computed gas layers; native oxygen click; failed-art interaction result; script-removed textual outcomes; fallback fonts | PASS |
| CH-08 — The Way Back | Pulmonary venous return; LA/mitral/LV | Body/lungs/both/reset mode and result checks; two reading paths; posterior-connection note retained | PASS |
| CH-09 — The Stronger Wall | Qualitative wall comparison; distinct aortic outlet | Right/left/outflow/reset results and reading checks; generated macro with separate diagram | PASS |
| CH-10 — Around the Body | Distribution/capillaries; venous return | Computed arterial/venous layers; complete reading path; no one-beat-transit claim | PASS |
| CH-11 — Beat Again | Two circuits; separate electrical meaning | Computed signal/blood layers; identical opening asset and ending return pass; both reading paths | PASS |

No chapter result implies independent clinical validation. Heart diagrams use an anterior cutaway; anatomical right remains viewer-left, and posterior connections are exposed schematically.

## 7. Ten-transition ledger

For every boundary, the latest completed suite passes five stages, threshold neighbors, reverse/direct midpoint comparison and containment at both main CSS viewports. The screenshot index links each desktop/phone set. The visual column below combines the earlier composition review, re-review of replacement panels and the final ready-media desktop TR06 source capture. The browser column now refers to the executed frozen-release suite.

| Boundary | Tracked anchor / representation | Browser state and bounds | Screenshot/review result |
| --- | --- | --- | --- |
| TR-01-02 | Outer wall, anterior axis; exterior to section | PASS, both viewports | PASS — corrected phone 0% re-reviewed; expected exterior-to-section start. |
| TR-02-03 | Right atrium/SA region; distinct electrical overlay | PASS, both viewports | PASS for reviewed composition; CH03 overflow correction separately shown. |
| TR-03-04 | Right atrial contour; explicitly separate blood layer | PASS, both viewports | PASS for reviewed composition; CH04 overflow correction separately shown. |
| TR-04-05 | Tricuspid opening; comparative valve plate | PASS, both viewports | PASS — corrected phone 0%/75% re-reviewed; correct source, target and captions. |
| TR-05-06 | Pulmonary root; RV-to-pulmonary outflow | PASS, both viewports | PASS for repaired visual sequence at both widths: connected root/trunk at 25/50%, captions match, no new spill. Frozen-release functional checks also pass. |
| TR-06-07 | Pulmonary branch/magnification boundary; scale change | PASS, both viewports | PASS for reviewed magnification/caption/fallback arrangement; the later desktop 0% replacement shows the branch source with ready/complete media recorded. |
| TR-07-08 | Capillary outlet; pulmonary venous return scale | PASS, both viewports | PASS for reviewed overall source/target composition. |
| TR-08-09 | Mitral opening/LV rim; wall cutaway | PASS, both viewports | PASS for reviewed overall source/target composition. |
| TR-09-10 | Aortic root; body-scale map | PASS, both viewports | PASS — corrected phone 75% re-reviewed; target state/caption advances from midpoint. |
| TR-10-11 | Venous return into RA; original heart | PASS, both viewports | PASS for reviewed composition; ending return passes functionally. |

The gallery contains 100 actual original screenshot files and 20 regenerated contact sheets. The replacement review closes the original TR05 and four phone-state findings. The inventory count alone does not certify every full-resolution detail; the later ready-media desktop TR06 start capture is separately verified by its image and readiness metadata. Still captures and state checks do not prove absence of one-frame flicker or smooth continuous motion. A continuous video artifact is **BLOCKED** by tool capability.

## 8. Manual input, recovery and alternative reading

Primary records: [manual-checks.md](../evidence/manual-checks.md), [recovery session JSON](../evidence/browser-recovery-session.json), and manual observations retained in [final-flow JSON](../evidence/browser-final-flow.json).

| Area | Actual observation | Result and scope |
| --- | --- | --- |
| Pointer/keyboard | Visible phone menu click; Enter toggles motion; Escape closes and restores Chapters focus; chapter link focuses heading; Enter selects LV; native PageDown advances 4589→5235; pointer selects blood and oxygen modes | PASS for these operations, not a full native input matrix. An initial control-layer timeout targeting non-focusable body was retried on the actual focused button successfully. |
| HTTP image recovery | Invalid local fixture creates genuine image-decode error; after restoring valid image, Retry token reaches 1, actual image becomes ready and error note disappears | PASS. Real requests/decode events, not synthetic load/error dispatch. |
| Responsive recovery | Both `<source>` nodes remain after Retry; resizing to 390×844 selects the portrait asset | PASS; [portrait-preserved capture](../evidence/http-retry-portrait-preserved.jpg). |
| Permanently invalid embedded image | Retry returns to enabled/recoverable error; it does not pretend corrupted bytes repaired themselves | PASS for honest failure behavior. |
| Exchange art failure | Oxygen selection still yields air→barrier→blood; full diagram/text remain | PASS; failed-art phone capture and observation. |
| Magnification art failure | Complete exchange SVG and separate recovery notice/Retry remain unobstructed | PASS after row-layout correction; [final fallback](../evidence/magnification-fallback-final.jpg). |
| Static reading | Script-removed production snapshot retains 11 chapters/22 beats; script controls hidden; Read the diagram exposes all gas outcomes | PASS for script removal, not a change to browser-wide JavaScript preferences. |
| Font fallback | Real Georgia/Arial metrics applied at 390×844; long Exchange heading wraps and visible text bounds pass | PASS for override; not slow or deliberately delayed font download. |
| Reduced motion | All chapters/results retained; 20 complete endpoint plates and gas direction checked | PASS in the automated method. |
| WebGL | Application has no WebGL context/dependency | Independence verified by architecture; context-loss injection is not applicable. |
| Audio | Native Sound On/Off labels and `aria-pressed` true/false observed; opt-in synthesis and visibility handling implemented | PASS for UI state only. Actual audibility, immediate audible silence and background restoration remain NOT TESTED. |
| Slow loading/platforms | No throttled-network, late-font, Safari, physical-device or screen-reader matrix | NOT TESTED. |
| Background/resume | No retained hidden/resumed lifecycle execution in the native session | NOT TESTED; implementation alone is not an execution result. |

### Top-level extracted-build navigation and reload

The [native main session](../evidence/native-main-session.json) is a **top-level** production snapshot from the independently extracted source, served through internal HTTP with test-only diagnostics. Its production payload identifies the frozen SHA-256 `6c1a14ff93bf0ab0e38060dd69b7fb809d2156d017c3e38b824a74c04f6630bd`. The actual viewport is **1363×936**, DPR **1**, with document client/scroll widths both **1348**. These are native document observations, separate from iframe assertions and from a physical-device test.

| Operation | Retained observation | Scoped result |
| --- | --- | --- |
| Opening CTA | Chapter 1 → chapter 2; `#four-chambers`; heading focus `four-chambers-title`; scroll 3178 | PASS |
| Chapter menu and browser history | Select Exchange; Back returns chapter 2/hash/heading; Forward restores chapter 7, `#exchange`, `exchange-title`, scroll 14486 | PASS for this actual traversal |
| Browser reload at Exchange | [Before](../evidence/native-reload-before.json) and [after](../evidence/native-reload-after.json) both retain chapter 7, `#exchange`, scroll 15848; [reload session](../evidence/native-reload-session.json) records navigation type `reload` and restored heading focus | PASS for the settled state; no claim that every intermediate loading coordinate was identical |
| Oxygen selection | Operator confirmed the native Exchange oxygen result; the before-reload record also retains the last focused Oxygen into blood control | Manual observation; no claim that selection persistence across reload was tested |
| Sound controls | [Native UI observations](../evidence/native-ui-observations.json): Sound On / `aria-pressed=true`, then Sound Off / `aria-pressed=false` | PASS for control state; audibility NOT TESTED |

Diagnostic Inspect state buttons can be the active focus at the moment of export. The recorder retains `lastContentFocus`, while hashchange events also show the chapter heading focus; these fields are not conflated.

[Clean native hero](../evidence/hero-native-final.jpg), [middle](../evidence/native-middle-extracted.jpg) and [ending](../evidence/native-ending-extracted.jpg) captures document first/middle/last appearance from the extracted build. The separate diagram reviewer compared the hero and ending against retained AI-04, confirming preserved orientation, material detail, framing and text separation. The ending capture contains a small review utility panel; it is not proof of an unobstructed lowest image edge. This is illustration review, not clinical validation.

## 9. Hero states and performance interpretation

The earlier main-flow and final-flow records observe **first-frame, reveal, full-composition, living-hold, first-scroll and return**. The final release file separately retains first-frame, first-scroll and return observations; it is not described as recording all six reveal phases again. The initial title opacity is recorded as 1; the image has a readiness/fallback identity. The final portrait capture shows the vessel crown, ventricular contour, text and controls in the narrow column. Return restores the original hero identity, and the suite's CTA/ending assertions pass.

These state timestamps came from warm embedded production snapshots, including some deliberately failed-image sessions. They are not measured cold-network LCP, time to first meaningful art on a physical device or guaranteed time to interaction. No clinical rhythm is inferred from them.

The recorded **4.8-second warm iframe TR06-07 sweep** measured:

| Metric | Observed value |
| --- | ---: |
| Sampled frame intervals | 11 |
| Median interval | 183.3 ms |
| 95th percentile / maximum | 1016.5 ms / 1016.5 ms |
| Intervals above 50 ms | 6 |
| Reported long tasks | 0 |
| Reported JS heap before / after | 12,129,815 / 11,404,062 bytes |

This is a **coarse, sparse remote-browser sample, not a smoothness PASS**. It does not isolate an application-only bottleneck, establish 60/120 FPS, or prove a memory bound. No reported long tasks and a lower ending heap do not demonstrate freedom from jank or leaks. The top-level native and neutral-control measurements below are separate sessions, not replacement labels for this iframe result. Cold start, field Core Web Vitals and a defensible INP measurement are not supplied.

### Top-level native timings and neutral control

The main native session records local **first contentful paint at 156 ms**, an **LCP candidate at 156 ms**, and one initial **66 ms long task**. The document uses embedded assets and an internal local/reload route. These values describe that session; they are not a cold-network measurement, field LCP, delivery guarantee or proof of a general performance budget.

The native TR06-07 sweep requested 4800 ms and observed **5210.4 ms**, with the document visible and focused. A [neutral control](../evidence/native-control-session.json) then ran the **unchanged sampler** on static white HTML with no PULSE module, images, fonts or animation. Its reference geometry was a 28,624-pixel document, transition top 13,861.21875 and transition height 730; both sessions used 1363×936, DPR 1, visible/focused top-level documents. The control observed **5396.1 ms** for the same 4800-ms request.

| Metric | PULSE native session | Neutral control |
| --- | ---: | ---: |
| Animation-frame callbacks / intervals | 9 / 8 | 12 / 11 |
| Median interval | 1016.4 ms | 216.6 ms |
| 95th percentile / maximum | 1016.5 ms / 1016.5 ms | 1016.5 ms / 1016.5 ms |
| Intervals above 50 ms | 5 | 6 |
| Long tasks reported during the sweep | 0 | 0 |
| Reported JS heap before / after | 5,821,197 / 5,333,289 bytes | 7,506,107 / 7,562,754 bytes |

The raw intervals, sampler identity and conditions are retained. **Inference:** similar approximately one-second gaps on the neutral page support an environment/scheduler contribution to the sparse callbacks. The comparison does not isolate a unique cause, quantify the application’s contribution or establish PULSE smoothness. It provides no basis for an invented optimization or FPS result.

Both samples are too sparse to certify continuous playback or representative hardware performance. Absence of reported long tasks does not prove absence of jank. Heap values are nonstandard browser estimates, not total/GPU memory or a no-leak result. **Representative pacing acceptance remains BLOCKED**, given unavailable continuous-video capture and representative-device validation. Execution of these probes is complete; their limited result is retained rather than converted into a smoothness PASS.

## 10. Research, licensing and publication boundary

The four required medical sources and supplemental scopes were reviewed on November 9, 2026; see [research notes](research-notes.md). Generated art and simplified diagrams have not undergone independent clinical validation. No patient scan, external medical image, biometric dashboard or diagnostic output is included.

The primary build owner also consulted the exact [Lenis repository](https://github.com/darkroomengineering/lenis), [GSAP ScrollTrigger reference](https://gsap.com/docs/v3/Plugins/ScrollTrigger/), [Playwright visual comparisons](https://playwright.dev/docs/test-snapshots) and [W3C Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) references. Consulting Playwright documentation is not a claim that the unavailable local Playwright executable ran.

Real license notices are included under `docs/licenses/`, copied to the build, and embedded by the portable build process. GSAP's Standard “No Charge” license is not MIT; fonts retain OFL terms. Original code, generated art and source publications have separate notices. No public site deployment, Git push, pull request, tag, release, domain binding or collection change is authorized or claimed.

## 11. Packaged-source verification and final seal

**PASS for the recorded packaged-source verification.** Two independent extraction rounds completed `npm ci`, `npm run check` and the offline rebuild. Both reported 51/51 tests, an 11-file locale guard, a successful production build and the same portable HTML SHA-256 `6c1a14ff93bf0ab0e38060dd69b7fb809d2156d017c3e38b824a74c04f6630bd` as the final browser suite.

The first [preflight](../evidence/archive-preflight.json) checked all 33 local HTML/CSS resource references and all eleven production media files. Its independently rebuilt production preview supplied the first/middle/last native screenshots and interaction/history/reload checks. The later [packaged-source verification](../evidence/packaged-source-verification.json) checked a 231-entry source archive and every one of its 230 manifest-listed files after extraction and rebuild: **zero checksum mismatches**. Its actual command output is [packaged-install-and-build.log](../evidence/packaged-install-and-build.log).

The recorded candidate hash belongs to the archive before its verification record and these closing notes were inserted. It is not mislabeled as the final delivered ZIP hash. Final sealing adds evidence/documentation and regenerates [source-manifest.json](../source-manifest.json); the application, assets, lockfile and reviewed portable HTML remain byte-identical. The delivered ZIP is released only after another independent extraction, locked install/build, resource/manifest check and first/middle/last production preview. Its exact ZIP SHA-256 is reported with the download, outside the ZIP, avoiding a circular checksum.

The archive contains editable source, pinned dependencies/lockfile, eight retained generated outcomes, production assets, exact third-party notices, the portable edition, test/review helpers and actual evidence. It excludes dependency installs, caches, browser profiles, credentials, temporary preview-server changes, the mislabeled unused screenshot and private filesystem paths. The original development command is `vite --host 0.0.0.0`; the development and production-preview commands remain separate.

The self-contained portable bytes were exercised over internal HTTP. Direct `file://` navigation was blocked by the active browser protocol policy, so direct-file opening is **NOT TESTED** in this environment. No alternative path was used to bypass that restriction.

## Delivery decision

**The source implementation and recorded Chromium checks are ready for delivery; full brief acceptance remains BLOCKED.** Required native zoom, touch and continuous-video capabilities were unavailable. Representative smoothness is unverified, and deliberately slow networking, true late-font loading, background/resume, audible sound quality, Safari and physical devices retain their explicit NOT TESTED status. The complete source and honest evidence are delivered without a public deployment or an unconditional acceptance claim.
