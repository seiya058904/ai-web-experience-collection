# RELAY — Independent Visual Review

**Latest review status: PASS for the tested visual scope, 2026-10-24 16:20 UTC.** The final-batch confirmation at the end of this document closes V01–V08 and R01–R03 with actual rendered evidence. Earlier FAIL/PENDING verdicts are retained as the repair history, not as the current status of those findings. The full-suite build and final one-label regression are identified separately.

## Scope and evidence

This is the independent art-direction/readability review, separate from the implementation owner's model and interaction checks. It reviews actual rendered production screenshots against `VISUAL-BIBLE.md` and the generated concept references; it does not infer browser results from source code alone.

The first evidence batch is `evidence/first-pass/`. The accompanying `first-pass.json` records Chromium production rendering, the exact viewport and presentation progress for each capture, no reported runtime errors, and a true `scrollPreservesModel` check. The implementation owner first attempted the connected Browser path, then the cloud preview path. Connection approvals failed for the connected Browser; the shared cloud-preview route had been occupied by the concurrent MURMURATION task. The recorded fallback used Playwright Chromium with unmodified `dist` bytes fulfilled internally at `http://relay.test/`; it did not publicly publish the work or start another HTTP server.

All first-pass screenshots considered here show the same real paused round at **12.056370197 demonstration seconds**, receiver `Receiving`, sender `Confirmation pending`. Desktop stable scene progress is 0, 1, 2, 3, 4, 5 (normalised scroll progress 0, .2, .4, .6, .8, 1). Thus the different pictures are alternate observations of the same facts. They are not evidence that an ACK moved or the message completed.

Images were opened with `view_image`. Reviewed browser captures include all six 1440 × 900 desktop stable scenes; the Hero at 320 × 700, 360 × 640, 390 × 844 and 768 × 1024; route/buffer/ACK/finale phone samples; and buffer/finale tablet samples. The selected Hero, buffer, finale and vertical-mobile concept files were opened in the same review pass for direct comparison.

## Art-direction assessment

The implementation keeps the selected **horizontal-bridge identity**: warm ivory, graphite broad bands, visible bounded thickness, contact shadows, matte orange numbered plates and precise native typography. It has not degraded into a thin-line node diagram or dashboard. Desktop first impression and the copy-shelf chapter have a coherent composition. The phone layout is a genuine top-to-bottom reconstruction with left/right branches.

The first-pass rendering nevertheless does **not** pass visual handoff. Most failures are shared-geometry safe-zone collisions rather than a wrong visual direction. The most affected chapter is the unfinished finale: rails pass through explanatory text on desktop, tablet and phone. The buffer chapter is also weak on phone because the received prefix occupies the same area as moving plates. These are repairable within the accepted direction.

## First-pass findings

| ID | Priority | Actual evidence / location | Visible failure and cause | Required focused repair | Regression status |
| --- | --- | --- | --- | --- | --- |
| V01 | P1 | `hero-320x700.png`, `hero-360x640.png`, `hero-390x844.png`, scene 0 | The right side of RELAY is clipped at the viewport edge. The wide font plus 24vw type scale exceeds its safe width. | Fit the entire real wordmark inside mobile horizontal gutters, preserving generous scale; test after fonts load and with fallback font. | Repair requested; await corrected capture. |
| V02 | P1 | Phone Hero and scenes 2/4, notably `hero-390x844.png`, `chapter-2-390x844.png`, `chapter-4-360x640.png` | Receiver prefix/slots and lower caption occupy the same band. In the 390px Hero, the explanatory text crosses `Meet`/the missing range and receiver slots. | Calculate a scene rectangle above the caption using measured text/control heights; move receiver and route endpoint together, keeping the existing shared geometry. | Already identified by implementation owner; await corrected capture. |
| V03 | P1 | `chapter-3-390x844.png`, `chapter-3-320x700.png`, `chapter-3-360x640.png`, scene 3 | `RECEIVER`, `Meet`, and the missing-range control sit over graphite rails and orange instances 05/06. The message and instance identities become unreadable. | Give native receiver text a dedicated clear region above or to the right of incoming rail; move its missing-gap mark with it. Keep actual packet geometry intact. | Repair requested; await corrected capture. |
| V04 | P1 | `desktop-chapter-5.png`, `chapter-5-768x1024.png`, all reviewed scene-5 phone views | The compressed final tracks and orange packets cross “The sentence is not complete yet.”, remaining-time copy, and sometimes fact text. On desktop the collision occurs around y640–695; on 360px phone around y400–470. | Place final receive shelf and complete residual track ensemble above the measured caption/fact zone. Waiting and failed outcomes need the same safe composition as success. | Repair requested; await corrected capture. |
| V05 | P1 | `desktop-chapter-3.png` at slot baseline around y663–670; `chapter-3-360x640.png` | `RECEIVED SLOTS · ORIGINAL BYTE ORDER` overlays the individual slot byte-range labels. In the small phone it also collides with the lower explanation. | Assign the label a separate row below/above the receiving shelf and reserve real room for it. Do not merely lower contrast. | Repair requested; await corrected capture. |
| V06 | P1 | `desktop-chapter-4.png`, source label around y308 and return explanation around y657; `chapter-4-390x844.png` | SENDER overlaps the chapter subtitle; the two return-route explanatory labels overlap one another. On phone the long horizontal ACK caption extends into receiver/caption text. | Move source below the measured heading/subtitle safe zone; keep one concise return annotation with a single text owner. Ensure it follows the orientation-specific route safely. | Repair requested; await corrected capture. |
| V07 | P1 | `desktop-chapter-2.png`; `chapter-2-320x700.png`; `chapter-2-360x640.png` | Desktop speed control overlaps receiver region. On 320px phone “Slower queue” overlaps the sender label/shelf at y294; on 360px the slider crosses the sender dock around y258. | Reserve the route-control block first, then position source and receiving region without overlap. Recenter the phone source if necessary while keeping both routes traceable. | Desktop part known to owner; phone extension reported; await corrected capture. |
| V08 | P2 | `desktop-hero.png`, `desktop-chapter-3.png`, phone Hero/finale | The actual missing-gap indicator is very small (27 × 25px desktop, 18 × 16px phone), while the wordmark and rails dominate. The central suspense is too easy to miss. | Enlarge the real missing slot adjacent to the native prefix; keep it empty and selectable. Do not add a fake word fragment or infer unreceived text. | Owner plans a larger native gap; await corrected capture. |

No stale-header defect is retained. An initial review message incorrectly suspected that the chapter indicator remained “01”; the captures actually show the absolute header scrolling out of view, and source inspection confirms updates to its number/name. This suspicion was immediately retracted. A persistent chapter control can be an implementation choice, but it is not evidence of a measured stale-label failure.

The implementation owner also reported repairs to the joint shading and direction arrows on retained/received plates. These changes still require a fresh screenshot if they are to be counted as visually verified; they are not silently marked passed here.

## Copy and concept comparison

| Comparison point | First-pass observation |
| --- | --- |
| Palette | Warm ivory / graphite / vermilion matches the accepted world. No orange wash, neon or inappropriate green background. |
| Title hierarchy | Wide heavy RELAY is faithful; phone clipping is V01. |
| Sculpture | Broad tactile bands, branch alternative and source/receiver distinction are present. Joint highlights are being refined by the owner. |
| Message truth | The first-pass prefix is `Meet`, not the concept illustration's `Meet me`; this is correct because the real missing interval starts at byte 5. The source sentence remains complete. |
| Chunk roles | White retained originals and solid orange travelling instances are distinguishable. Received/missing slot outlines are apparent; post-repair direction arrows must be checked. |
| Mobile | Vertical reconstruction meets the intended direction; endpoint and caption collisions require the fixes above. |
| Finale | The waiting title is honest and appropriate. The residual rail ensemble intrudes into its explanation; V04 blocks visual acceptance. |
| Above-fold copy | Functional playback/status/block/history additions are required by the brief and are recorded in the Bible. The rejected concept's marketing labels, envelope icons and invented payload text have not been adopted. |

## What this review does not yet verify

- All first-pass views are paused. This batch cannot substantiate smoothness, actual packet/ACK movement, or the three-role ACK scene during a corresponding event.
- Intermediate handoff frames, reverse/fast scroll and dynamic recordings were not supplied to this review pass.
- The 4K rendering, complete delivery, all-ACK-lost state, failed ending, zoom/fallback states and explicit history view require separate supplied evidence.
- Geometry scans of native safe-text boxes alone do not detect the SVG/DOM collisions V03–V06. Their regression must include visual inspection.

## Focused confirmation batch

Review corrected screenshots for V01–V08 at the same viewport/progress; include at least one desktop and one phone view for the buffer and finale. Also inspect a native 3840 × 2160 capture, an actual ACK-present or explicitly recorded ACK moment, a complete ending, and representative 25/50/75% handoff samples. Record the exact outcome per finding. Do not turn this into an unrelated redesign or open-ended polish exercise.

**First-pass disposition: visual FAIL; concrete fix list delivered.**

## Corrected-build confirmation review

The owner supplied `evidence/regression/` and `evidence/handoff-regression/` after the first repair batch. The former's `results.json` records production-index SHA256 `4f3e7f72c649096596000632ab6b93faae02697506102ad962bfc4fe8f4ccc6a`, Chromium 145.0.7632.6, 56 passing checks, 48 geometry samples, and no critical failures for the tested eight-viewport matrix. These engineering results are supporting evidence only: the confirmation below is based on opening the actual pictures.

This independent pass visually inspected **all six 1440 × 900 stable scenes**, corrected mobile Heroes at 320 × 700 and 390 × 844, the 320 × 700 buffer chapter, and the native 3840 × 2160 Hero. It also inspected every handoff at 25/50/75% forward and each of the five 50% reverse frames. The persistent sculpture remains visible while headings clear; the original message and copy shelf enter without the former title occupying their reading area. The reverse midpoint restores the same composition. Pixel comparison finds only an insignificant small primary-button difference around x285–287/y808–815 at those five midpoint pairs, not a different scene or a changed packet location.

### Per-finding progress in this batch

| Finding | Confirmation evidence | Observed status |
| --- | --- | --- |
| V01 — mobile wordmark clipping | `regression/chapter-1-320x700.png`, `chapter-1-390x844.png` | **PASS** in reviewed captures. Entire RELAY wordmark now fits inside gutters. |
| V02 — receiver/caption collision | Same corrected phone Heroes | **PASS for former caption collision**. Caption is now below the receive slots with clear spacing. A narrower receiver/trunk occlusion remains, recorded as R01 below. |
| V03 — buffer message over moving instances | `regression/chapter-4-320x700.png` | **PASS for phone main prefix/instance collision**. Message occupies clear space to the right of incoming geometry. Smaller desktop missing-range annotation remains R02. |
| V04 — final rails over caption | `regression/chapter-6-1440x900.png` | **PASS on corrected desktop**. Whole residual rail ensemble sits above caption/facts. Corrected phone and history-mode captures are still required. |
| V05 — buffer label over byte ranges | `regression/chapter-4-1440x900.png`, `chapter-4-320x700.png` | **PASS**. Slot label has its own clear baseline below the shelf. |
| V06 — ACK source/subtitle and duplicate return annotation | `regression/chapter-5-1440x900.png` | **PASS on corrected desktop**. Source is below subtitle and only one return annotation remains. Corrected phone confirmation pending. |
| V07 — route controls over endpoints | `regression/chapter-3-1440x900.png` | **PASS on corrected desktop**. Control block and receiver no longer overlap. Corrected phone source/control confirmation pending. |
| V08 — tiny missing gap | All corrected stable views | **PASS for intended emphasis**. Larger empty inline gap now sits immediately after the real prefix; no unreceived word was invented. R01 affects its phone edge. |

### Narrow residual issues

- **R01, receiver path/label overlap on phone:** in `regression/chapter-1-390x844.png`, the descending trunk at approximately x180–207/y535–561 covers part of `Receiving` and the right edge of the inline missing slot. The 320px Hero has the same issue around x145–174/y390–412. The lower caption is fixed; this remaining problem is the path ending inside the receiver text area. Offset the endpoint/trunk relative to native text or terminate it at a clear shelf edge using the shared layout data.
- **R02, small missing-range label over graphite:** in corrected desktop buffer (`chapter-4-1440x900.png`), `Missing 5–9 B` around x611/y514 lies partly on the dark incoming endpoint. The same shared annotation crosses the track during handoffs 3/4/5. Move the shared label clear of the track rather than correcting just one stable frame. The large native prefix and large gap are already clear.
- **R03, history-mode clearance needs fresh proof:** the earlier `browser/recorded-received-ack-loss.png` has the full received phrase and caption crossed by rails when the event strip opens. That image predates the second layout changes, so it is evidence of a former problem, not proof of the current build's state. A fresh recorded-moment screenshot is required before this mode can pass. The old ordinary UTF-8 success, ACK-loss ending and incomplete ending are legible; the compressed history mode is the distinct risk.

At handoff 1 around 75%, a fading source-only `SENDER` annotation also passes over the first retained tile while `ORIGINAL MESSAGE · SENDER` is already visible above. Removing the redundant micro-label earlier is a bounded cleanup within the same text-ownership fix; it does not require new content or layout direction.

### Confirmed design fidelity after repairs

The 4K Hero scales the title, message and sculpture with the viewport. The page keeps the warm-paper palette, broad graphite planes, orange/outline role separation and a native readable gap. Desktop chapter rhythm retains a source shelf, expanded fork, receiving slots and a calm typographic outcome, rather than six repeated cards. Mobile preserves vertical flow and broad branches. Typography, track mass, material depth, palette, native text roles, controls and negative-space hierarchy were compared directly to the selected reference set.

**Current disposition: core stable compositions substantially repaired; final acceptance is held for the three narrowly identified residual checks above and corrected phone route/ACK/finale evidence.**

## Final-batch visual confirmation — 2026-10-24

The final evidence directory was reviewed directly, including all six 1440 × 900 stable compositions, all six 320 × 700 compositions, the 390 × 844 Hero/copy/route/buffer/ACK/finale, native 3840 × 2160 Hero and finale, actual success/failure/ACK-loss endings, the 120-byte mobile ending, and the recorded-received moment. The source-message entrance at handoff 1, 75%, was inspected again after removal of the redundant fading SENDER annotation. The remaining midpoint captures for handoffs 3/4/5 preserve the sculpture while native chapter text changes ownership.

The later corrective captures at **16:12–16:13 UTC** supersede the first final-directory pictures. The review checked file modification times before accepting each repair; a stale image was not silently reused to close an issue.

### Status of the original findings

| ID | Fresh evidence in `evidence/final/` | Current visual conclusion |
| --- | --- | --- |
| V01 | `chapter-1-320x700.png`, `chapter-1-390x844.png` | **PASS.** The entire wide RELAY wordmark fits its mobile gutters. |
| V02 | Same Heroes, plus phone route/ACK chapters | **PASS.** Receiver, actual missing gap, slots and lower explanation occupy separate readable regions. |
| V03 | `chapter-4-1440x900.png`, `chapter-4-320x700.png`, `chapter-4-390x844.png` | **PASS for the main buffer composition.** Prefix and native gap remain readable above/right of incoming data; original-byte slots have a separate caption baseline. |
| V04 | `chapter-6-320x700.png`, `chapter-6-390x844.png`, `chapter-6-1440x900.png`, `chapter-6-3840x2160.png` | **PASS.** The initially observed 4K shelf/message collision was repaired in the fresh 16:12:30 capture. The narrow missing-range badge exception was then repaired and directly confirmed in the 16:15:52 desktop finale, as recorded under R02. |
| V05 | Desktop and phone chapter 4 | **PASS.** Byte ranges and the received-shelf caption do not share a baseline. |
| V06 | `chapter-5-320x700.png`, `chapter-5-390x844.png`, `chapter-5-1440x900.png` | **PASS after the 16:12 phone refresh.** The source now begins below the ACK action/help block. The concise return annotation has its own row, and neither source nor receiver cuts through explanatory text. |
| V07 | `chapter-3-320x700.png`, `chapter-3-390x844.png`, `chapter-3-1440x900.png` | **PASS after the 16:12 phone refresh.** The source clears the measured slider and its endpoint labels. Both branches remain distinguishable within the compact 320px composition. |
| V08 | Phone and desktop Hero/buffer/finale | **PASS.** The visibly empty, orange-outlined gap follows the actual native prefix. It does not invent unreceived text. |

### Residual checks and exact outcomes

**R01 — closed.** The mobile trunk now ends before the receiver's native text station. In the 320 × 700 and 390 × 844 Hero, both `Receiving` and the gap outline are unobstructed. This repair also holds in the refreshed phone route/ACK scenes.

**R02 — closed after two focused repairs.** The desktop buffer prefix/label now clears its dark rail, and the non-buffer badge sits beside the receiver heading. A 3× inspection of the intermediate 16:12 desktop finale found its opaque padding clipping received slot 01 around x171–244/y518–535. The owner reduced the end-state badge height/padding and removed its unnecessary opaque backing. The fresh **16:15:52** `final/chapter-6-1440x900.png` shows slot 01's full outline and ID, with a clear missing-range row above it. The full rerun also resolves the small-station endpoint-label collisions at tablet and landscape sizes.

The actual ACK evidence was refreshed rather than reusing the stale 16:06 image. `final/actual-ack-inflight-1440.png` at **16:16:42** and `final-label-regression/actual-ack-inflight-1440.png` at **16:20:12** both show orange data instances 02/03 clear of the relocated badge, a distinct green returning ACK 01, the received shelf, and retained originals at the sender. The fresh actual round exposed a small SENDER annotation crossing retained plate 01; the last focused change moves that desktop annotation above the source station during the ACK pose. Direct inspection of the 16:20:12 image confirms that SENDER and every retained ID are now readable, with clear separation from the subtitle. R02 and this adjacent label cleanup are therefore closed without changing the accepted art direction.

**R03 — closed on fresh recorded evidence.** `recorded-received-ack-loss.png`, refreshed at **16:13:14 UTC**, shows the received Chinese/é/emoji message clearly above its slots and residual tracks. Three green returning ACKs remain visible, while the ending caption, factual receiver/sender status, statistics, event strip and disabled playback controls each retain a readable area. This is an actual recorded moment with `Received` and `Confirmation pending`; it is not a made-up success image.

### End-state and fidelity assessment

The reviewed ordinary confirmed ending, all-ACK-lost ending, genuinely incomplete ending and maximum-length mobile ending remain visibly distinct and truthful. The 120-byte mobile message fits without replacing user text or concealing the full block selector. The sculpture still matches the selected reference direction: broad graphite bands with bounded depth and weight, warm paper, orange data, green acknowledgements, and a native typographic ending. The vertical phone fork is a deliberate recomposition, not a cropped horizontal desktop stage. There is no switch to dashboard cards or thin-line node diagrams.

### Full-suite evidence versus the final label regression

| Evidence set | Production-index SHA256 | Recorded result | What it establishes |
| --- | --- | --- | --- |
| `evidence/final/results.json`, completed 16:18:15 UTC | `8c9f4ee91f815b1ee58f35eeff44ce03aa3d592561835707f2d8f541181d9460` | **133 PASS, 3 optional FAIL, 1 NOT_TESTED, 0 critical failures**; 91 screenshots, 117 geometry samples, 50 handoff samples | The complete requested browser suite after badge, tablet, landscape, phone and history repairs. This is the full-suite build, before the last desktop SENDER micro-label adjustment. |
| `evidence/final-label-regression/results.json`, completed 16:20:18 UTC | `29412d915c50d3147809c84aa21d0cdbdd634fe7110b37e6a85d32742bc0e0d4` | **29 PASS, 0 FAIL, 0 NOT_TESTED**; 24 screenshots, 28 geometry samples, 20 handoff samples | The final SENDER annotation delta: ACK scene at all eight required viewports; handoffs 4→5 and 5→6 at 0/25/50/75/100%, both directions; real single-ACK loss, duplication and fresh in-flight capture. This is a focused final regression, not a second full-suite claim. |

The earlier 16:14 checkpoint with six critical failures is superseded by those reruns. Its tablet badge overlaps were repaired, and the interaction assertion was reconciled before the actual ACK evidence was accepted. Passing native text-box scans alone did not close the visual findings: the actual final-slot crop, mobile controls, 4K finale and actual ACK images were inspected separately.

### Remaining limits

- The three optional failures apply to forced CSS font-size overrides at 125/150/200%. They are disclosed stress cases, not reported as passing text-only enlargement. Actual native Chrome page zoom at 125/150/200% has separate passing evidence in `evidence/headed/headed-results.json`; CDP page scaling is not substituted for browser zoom.
- The full headless suite's background-tab item remains honestly labelled NOT_TESTED there because tab switching did not hide the document. The owner's separate native-visibility evidence covers that behaviour; this art review does not relabel the headless result.
- Browser evidence covers the installed Chromium engine and emulated viewports/touch, not physical devices, Safari, Firefox or a Windows GPU. Static visual inspection also does not establish frame-rate performance; the engineering report records its own bounded timing sample.
- At dense maximum-input states, individual rendered byte tiles are necessarily compact. The complete native block selector and inspector remain the means of reading every block's exact facts; no missing content is invented to fill visual space.

**Final visual disposition: PASS within the recorded scope.** All eight original material findings and all three residual checks have concrete corrections and reviewed evidence. The six compositions, the tested handoffs, phone reconstruction, 4K ending, real ACK moment and recorded-received state retain the selected sculpture, readable native text hierarchy and truthful transport roles. No unresolved blocking visual defect is retained from this review; the bounded stress/engine limitations above remain disclosed.
