# Independent transition visual review

> This file preserves the original failed reviews. The later **Final evidence follow-up** section identifies corrected builds, current state-specific evidence and the limits of each review. Earlier FAIL records are historical observations, not silently rewritten results.

**Review date:** 2026-11-09. **Pass:** initial retained desktop evidence, before any correction prompted by this review.

This review examines the actual browser JPGs and available JSON audits. It is independent of the implementation’s authored transition descriptions. These are still-frame findings; continuous forward/reverse motion, threshold neighbors, mobile behavior and failed-media recovery are **NOT TESTED by this review**. They require their own evidence.

## Evidence and conditions

The available audits report Chrome 156 on Linux, a 1440 × 900 CSS viewport, DPR 1, content zoom 100%, motion on, and loaded scene images. The QA harness fits that viewport into its own browser window; the screenshot scale is approximately 0.806. The harness chrome is not part of PAPERSUN.

| Boundary | Retained frames inspected | Audit coverage | Review status |
| --- | --- | --- | --- |
| TR-01-02 | 0%, 25%, 50%, 100% | JSON retained for 0%, 25%, 100% | **FAIL — physical handoff needs correction.** The 75% JPG and 50%/75% JSON were not present at review time. |
| TR-02-03 | 0%, 25%, 50%, 75%, 100% | JSON retained for all five positions | **FAIL — intermediate paper handoff needs correction.** Endpoint composition and fragment recognition are clear. |
| TR-03-04 through TR-10-11 | Not yet reviewed in this pass | Additional captures are being collected | **NOT TESTED** |

## TR-01-02 — City to attic

### What the actual frames establish

- **0%:** The empty sky aperture, layered city, single amber attic window and red thread form a coherent outgoing composition. See [0% capture](evidence/desktop-tr01-000.jpg).
- **25%:** The incoming attic appears inside a large circular iris. A separate, smaller blue window-shaped outline is drawn over the lower-right workbench, while the actual exposed scene boundary remains circular. The amber source changes from the city window to the larger room lantern without a visibly registered window-to-room connection. See [25% capture](evidence/desktop-tr01-025.jpg) and [audit](evidence/desktop-tr01-025.json).
- **50%:** The room is nearly established and one Mira is visible. The small blue window outline still floats in front of the lamp and scissors instead of forming the actual foreground mask. See [50% capture](evidence/desktop-tr01-050.jpg).
- **100%:** The detached outline has gone. The completed room, one repairer, one lamp, desk tools and readable narration form a strong target hold. See [100% capture](evidence/desktop-tr01-100.jpg) and [audit](evidence/desktop-tr01-100.json).

### Findings

| Item | Status | Observation and implication |
| --- | --- | --- |
| Outgoing and incoming scene identity | **PASS — sampled endpoints** | City and attic are distinct, complete scenes. The ending frame belongs to the attic. |
| Duplicate Mira | **PASS — sampled stills only** | No duplicate character was visible in the inspected images. This does not rule out an intermediate one-frame defect. |
| Physical window mask and lamp handoff | **FAIL** | The large circular reveal and the detached blue window outline are two different boundaries. The outline reads as a floating prop rather than the window through which the scene is entered. |
| Midpoint reading hold | **FAIL under the brief’s strict midpoint-readability requirement** | At 50%, the incoming title is readable, but its lead reaches the bottom toolbar and is obscured there. The 25% audit flags only a 1.84 px entering-heading intersection; that minor entry indicator alone would not establish a reading failure. The visible midpoint is the stronger evidence. |
| Full quarter-frame coverage | **NOT TESTED** | The 75% capture was not available. No claim is made about it. |

**Recommended correction:** Register one actual window-shaped clipping/occlusion boundary to the original amber window. The visible paper frame should be the edge of that same mask, then expand beyond the screen as the attic takes ownership. Avoid retaining a separate window outline over the table. Keep the incoming reading zone clear of the toolbar at the intended midpoint hold, or deliberately suppress toolbar interception during that handoff.

## TR-02-03 — Attic to note

### What the actual frames establish

- **0%:** The familiar attic contains one Mira, one lamp and the small desk note. See [0% capture](evidence/desktop-tr02-000.jpg).
- **25%:** A large ivory note enters from below. A detached L-shaped paper corner and pin hover above Mira, and a dark blue horizontal strip crosses the full stage in front of the growing note. See [25% capture](evidence/desktop-tr02-025.jpg).
- **50%:** Mira is no longer duplicated behind the note. The bottom fragment is recognizable, but the dark strip crosses the note’s contour area; the separate paper corner remains above it. The incoming lead is mostly under the toolbar. See [50% capture](evidence/desktop-tr02-050.jpg) and [audit](evidence/desktop-tr02-050.json).
- **75%:** All three fragment outlines become recognizable. The long dark strip still traverses the scene and intersects the note’s upper region; the isolated corner remains visible. The heading and lead have reached their reading zone. See [75% capture](evidence/desktop-tr02-075.jpg) and [audit](evidence/desktop-tr02-075.json).
- **100%:** The strip and isolated corner are gone. The pinned ivory note, three distinct shapes, red guide thread, heading, lead and both narrative beats form a composed target state. See [100% capture](evidence/desktop-tr02-100.jpg) and [audit](evidence/desktop-tr02-100.json).

### Findings

| Item | Status | Observation and implication |
| --- | --- | --- |
| Target note and three-piece vocabulary | **PASS — sampled final hold** | The three differently edged contours are distinct and retain the shared circular composition. This visual observation supplements, rather than replaces, the geometry tests. |
| Duplicate actor | **PASS — sampled stills only** | The held frames show one Mira before the note takeover and none duplicated afterward. |
| Physical note-edge continuity | **FAIL** | The wide dark strip is not visibly attached to the ivory note. The small pinned corner also appears detached from the sheet that enters. Together they read as extra overlay graphics rather than one expanding paper note. |
| Midpoint reading hold | **FAIL under the brief’s strict midpoint-readability requirement** | At 50%, the JSON records a 52.28 px lead/footer intersection, matching the visibly obscured incoming lead. There is no heading/body collision. At 75%, the entering first beat overlaps the toolbar; the final 100% hold has no such intersections. |
| Endpoint type safety | **PASS — inspected final frame** | The heading, lead, action and two beats remain legible at 100%; the audit records no heading/body or toolbar/copy intersections. |

**Recommended correction:** Let the actual ivory sheet edge, with its pin and red thread attached, carry the reveal. Remove the detached corner or bind it to the same sheet coordinates. Replace the full-width blue strip with a paper edge/shadow belonging to that sheet. Preserve the final composition, which already resolves the chapter clearly.

## Weakest known transition and acceptance boundary

**TR-01-02 is the weakest transition in this reviewed pair.** Its 25% circular opening and floating window outline conflict visibly with the required physical window entrance. TR-02-03 has a similarly detached intermediate overlay, but its paper-note destination and recognizable three-piece diagram remain easier to follow.

These findings do not imply that the whole story is absent or that the final holds fail. They identify specific intermediate compositions that presently prevent claiming the brief’s strict H4/H6 transition acceptance. Corrected captures should be saved separately or clearly identified, then reviewed again. Do not silently convert these initial findings to PASS because a later build succeeds.

## Review limits

- No continuous scroll recording was watched in this pass.
- No reverse-path, threshold-neighbor, failed-target or late-asset experiment was performed by this reviewer.
- No phone capture was inspected in this pass.
- The overlap audit measures bounding rectangles, not letter ink. Routine entry/exit intersections are recorded separately from visible obscuration at an intended hold.
- The visible absence of duplicate actors in a few frames is not proof that every intervening frame is correct.

## Corrected-capture review

This second review preserves the initial failures above. It examines the separately retained `final-desktop-tr01-*` and `final-desktop-tr02-*` captures, taken after the first physical-mask and caption corrections. The same 1440 × 900 harness viewport is used. This is still a review of actual retained images, not a continuous-motion acceptance claim.

| Boundary | Corrected frames inspected | What is resolved | Remaining status |
| --- | --- | --- | --- |
| TR-01-02 | 0%, 25%, 50%, 100% | The visible arched frame is now the actual reveal boundary. The detached small outline has gone. The incoming title, lead and both beats occupy a readable left zone at 50%. | **PARTIAL — recapture required.** The retained 50% image has a flat navy strip at the top of the translated room artwork. A subsequent scale correction is present in source, but its rendered result has not yet been accepted here. The corrected 75% file was still absent at this review. |
| TR-02-03 | 0%, 25%, 50%, 75%, 100% | The blue strip and detached pinned corner have gone. The complete ivory sheet is visually coherent. All three contours and the incoming text are legible. | **FAIL — reveal starts already complete.** The 0% image already contains the full-size target note, covering the repairer; its position stays substantially unchanged through the inspected quarters. The intended rising-sheet handoff is therefore not established by these frames. |

### Corrected TR-01-02 observations

The [25% capture](evidence/final-desktop-tr01-025.jpg) now has one registered arched edge around the entering room. The [50% capture](evidence/final-desktop-tr01-050.jpg) contains one Mira and a clear reading hold. The visible top crop defect is a separate issue from the original floating-frame failure. The [100% capture](evidence/final-desktop-tr01-100.jpg) resolves to a complete, readable attic. Available corrected audits at 0%, 25%, 50% and 100% report zero heading/body and footer/copy intersections.

The implementation subsequently scales the translated target about the baked lamp anchor to cover the exposed top. That is an implementation change, **not a verified visual result** until a fresh capture shows it. The updated window geometry itself does not require another detached outline.

### Corrected TR-02-03 observations

The [0% capture](evidence/final-desktop-tr02-000.jpg) is the decisive remaining failure: the destination sheet is fully visible before the intended handoff has begun. The [25%](evidence/final-desktop-tr02-025.jpg), [50%](evidence/final-desktop-tr02-050.jpg), [75%](evidence/final-desktop-tr02-075.jpg) and [100%](evidence/final-desktop-tr02-100.jpg) captures retain a coherent note and clean type, but do not show the expected growth or rise from the source desk note. All five corrected audits report zero heading/body and footer/copy intersections.

Source inspection identifies a specific cause consistent with those images: the transition queries the first `.quest-note` within the target scene. `SceneRenderer` places `.scene-fallback` before `.scene-props`, and both contain a quest note. The first match is therefore the hidden fallback note. Its transform changes while the visible normal prop remains at rest. The parent implementation agent has been notified to target the visible prop or update both variants deliberately. This source diagnosis does not substitute for the required recapture after correction.

### Local-browser evidence quarantine

An initial isolated-browser run used a serverless Fontconfig file whose directories did not include the extracted local fonts. Its images omitted letters; those captures are **invalid for typography or visual acceptance** even when the DOM audit said the font set had finished loading. A corrected private Fontconfig produced a visually confirmed hero with loaded Cormorant and nonzero text ranges. Further isolated-browser graphics diagnostics are in progress, so the final accepted local run must be identified by its exact aggregate report and fresh capture prefix. Earlier interrupted `local-*` files are not an acceptance set.


## Final evidence follow-up

The earlier two-boundary review was followed by actual browser recordings, corrections and independent reviews. This follow-up distinguishes the implementation agent's own image inspection from the independent root and research reviews. The current moving foreground is authored 2.5D paper staging; it does not reconstruct a continuous three-dimensional room or deform a photographed wheel into a stone arch.

### Valid runtime and evidence chain

Accepted local image evidence uses Chromium 153.0.8010.0 with corrected private Fontconfig and CPU rendering. The earlier serverless font configuration and Angle/SwiftShader captures are not used to establish typography or SVG painting success. A font set's `loaded` status alone was insufficient: individual failed faces and actual omitted letters exposed that first problem. The final runner rejects failed baseline font faces, retains actual text ranges, and saves real screenshots.

The desktop viewport is 1440 × 900; the phone viewport is 390 × 844 with touch/mobile emulation and DPR 1. These are headless browser profiles, not physical-device tests. Each context starts fresh. The continuous recorder requests 2,400 ms slow and 650 ms fast native scroll segments, retains every second delivered compositor frame, and records the actual scroll samples, compositor timestamps and rAF intervals. Animated WebP frames come only from retained JPEGs; contact sheets uniformly downscale those same images. CAPTURED means the recording succeeded, not that the composition passed a human visual review.

| Evidence set | Exact report | Recorded scope |
| --- | --- | --- |
| All missing continuous boundaries | [Remaining boundaries](evidence/local-remaining-boundaries-continuity-2026-11-09T08-58-43-575Z.json) | 56 clips, 2,050 real frames, boundaries 2/3/4/5/6/7/10 in both profiles, speeds and directions. Empty-state evidence, not proof of collected-piece ownership. |
| Exact hero pauses | [Collected run and hero cycles](evidence/local-collected-continuity-continuity-2026-11-09T09-07-02-048Z.json) | Three first-scroll/return cycles per profile, with 36 additional actual settled page screenshots and all 18 forward/reverse geometry pairs equal. Other carrier clips in this historical run contain the separately recorded ownership failures. |
| State-specific carrier and table retake | [Carrier run](evidence/local-carrier-final-continuity-2026-11-09T09-46-38-872Z.json) | 52 clips, 1,901 compositor images and 126 held screenshots. Found/unplaced first arrival, actual placement, repaired return and unassembled lift have separate cases. Build `index-DkJKhC7c.js` / `index-C8PaC5EY.css`. |
| Unique empty-state replacement | [Carrier baseline](evidence/local-carrier-baseline-layout-2026-11-09T09-51-29-976Z.json) | 140/140 measured cases, unique empty-state filenames, transitions 5–9, quarter states, ±2 px neighbors and direct/reverse checks. |
| Final TR06 support, empty state | [Layout](evidence/local-tr06-ground-empty-layout-2026-11-09T10-01-39-421Z.json) and [motion](evidence/local-tr06-ground-empty-continuity-2026-11-09T10-01-47-079Z.json) | 28/28 measured layout cases; eight clips, 204 actual frames, 18 held screenshots; build `index-Crm79syp.js` / `index-C8PaC5EY.css`. |
| Final TR06 support, found/unplaced state | [Collected motion](evidence/local-tr06-ground-collected-continuity-2026-11-09T10-02-23-781Z.json) | Eight clips, 219 actual frames and 18 held screenshots after real discovery controls, with placed remaining empty. Same final build. |

The independently inspected scopes and historical findings are preserved in [the independent visual review](independent-visual-review.md), [the motion review addendum](motion-review-addendum.md) and [the closing review](closing-review.md). These documents, not successful runner exit codes, determine visual closure. In particular, the later TR02 review confirms the same pinned note grows from the actual desk sheet; the exact hero pairs confirm the registered TR01 window/room composition and reverse return. Their earlier floating-frame and already-complete-note failures remain unchanged above.

### Six observed hero states

The cold sequence is recorded separately in [desktop cold hero](evidence/local-boundary-final-desktop-cold-hero.json) and [phone cold hero](evidence/local-boundary-final-mobile-cold-hero.json). Each retains 59 actual compositor images. The images establish the visible state; the attached readiness observations are asynchronous and can be later than the raster instant.

Desktop frame 0000 at about 38.8 ms is genuinely blank navy before meaningful application content. Desktop 0001 at about 238.1 ms and phone 0000 at about 182.0 ms visibly show the authored fallback city, title/action, circular absence and warm window. They must not be reclassified as generated art merely because their later state observations already report readiness. Subsequent frames 0004 and 0020 show the generated paper scene and the restrained reveal. Frame 0049 is near the complete composition; frame 0050 shows the living hold (desktop about 1,862.1 ms, phone about 1,842.1 ms). The glow changes slightly; the narrative is not withheld for a long introduction.

First-scroll and return are established by the separate exact settled images: [desktop cycle 1](evidence/local-collected-continuity-desktop-hero-cycle-1-settled-pairs.jpg), [desktop cycle 2](evidence/local-collected-continuity-desktop-hero-cycle-2-settled-pairs.jpg), [desktop cycle 3](evidence/local-collected-continuity-desktop-hero-cycle-3-settled-pairs.jpg), and the corresponding [phone cycle 1](evidence/local-collected-continuity-mobile-hero-cycle-1-settled-pairs.jpg), [phone cycle 2](evidence/local-collected-continuity-mobile-hero-cycle-2-settled-pairs.jpg) and [phone cycle 3](evidence/local-collected-continuity-mobile-hero-cycle-3-settled-pairs.jpg). This agent viewed all six sheets; the research reviewer independently viewed them too. Each pair preserves the same aperture, registered room/window, one puppet and lamp, and supported desk note at 25%, 50% and 75%. These page screenshots were taken after at least three settled animation frames, not selected by guessing the nearest compositor timestamp. The [manifest](evidence/local-collected-continuity-hero-pairs.json) identifies their full-resolution sources.

### Current TR09 lift and ownership inspection

This agent inspected all 28 TR09 contact sheets in the [carrier manifest](evidence/local-carrier-final-contacts.json): all 12 clips and 488 actual retained frames. Eight clips show a table repaired through the visible Place A/B/C controls, in both directions and at both speeds; four additional clips show slow unassembled forward/reverse traversal in both profiles. The three-part disc remains one opaque object through the assembled lift and return, and no retained frame contains loose ABC beside an additional joined ABC. Its stitched outline remains legible and it seats in the same sky aperture. No full-stage blank or second sun was observed in this inspected scope.

The unassembled case has a deliberate narrative substitution at lift entry. [Phone two pixels before entry](evidence/local-carrier-final-mobile-tr09-unassembled-start-before.jpg) shows the three separate table pieces and empty repair outline; [two pixels after entry](evidence/local-carrier-final-mobile-tr09-unassembled-start-after.jpg) shows the narrative completed disc and an empty holder. The visitor's stored `placed` remains empty. This is not credited as an animation of user-performed assembly or an earned discovery. On reverse, the outside-transition held state restores the loose pieces. A last every-second compositor frame can precede that final repaint, so the actual held threshold screenshots and later audits establish the endpoint without inventing another video frame.

### Final TR06 support correction

Root's full-resolution review of the Dk carrier retake found a new real defect: Mira and the attached holder floated above the exposed valley floor. The exact original image and metadata are preserved as [before image](evidence/local-tr06-ground-before.jpg) and [before record](evidence/local-tr06-ground-before.json). That historical sequence is not a whole-transition PASS, despite correct piece uniqueness and opaque rotor faces.

The corrected renderer keeps the held wind and valley poses unchanged. The actual wheel-centred reveal circle covers the complete source actor, holder and found-piece bounds. A solid annular paper lip hides the support change, then its inner edge uncovers the grounded valley pose. The lip shares the exact CSS circle geometry, does not have a desktop rectangular cut through its edge, remains below the canonical six blades, and never dissolves. The holder and gold share the same physical clip. [The mechanism document](transition-props.md) gives the normalized-diagonal radius and ownership details.

Root independently viewed all eight normal full-resolution direct proofs, including empty midpoint and collected 25/50/75% in both profiles, plus all six genuine failed-art quarters. The static scope passes: desktop Mira is grounded; the phone midpoint keeps her physically covered before the later grounded reveal; the six blades remain solid; no extra C appears. This agent also inspected every retained frame in the two final collected slow-forward clips, confirming the covered interval and grounded emergence. Independent moving closure is now **PASS for the inspected final scope**: root viewed all 13 desktop contact sheets / 162 actual frames, and the research reviewer viewed all 13 phone sheets / 261 actual frames, covering all 16 final empty/collected clips. The original unsupported-footage record remains FAIL; it is closed by this separate corrected evidence. The complete manifests are [empty-state contacts](evidence/local-tr06-ground-empty-contacts.json) and [collected-state contacts](evidence/local-tr06-ground-collected-contacts.json).

The first preliminary proof script used the wrong query key `assets=fail`. Those files actually loaded normal art and are explicitly rejected as failure evidence in their JSON reports. The true six 404 cases use `test-assets=fail`, assert failed readiness and retain the recovery controls: [verified failure report](evidence/local-tr06-ground-failure.json). No preliminary file was silently relabelled as a successful failed-media test.

### Evidence supersession and remaining limits

The first local-carrier-final layout process reused plain quarter filenames later overwritten by collected-state held captures. Its original numerical measurements are retained, but its report now contains an explicit `SUPERSEDED_LINKS` annotation. Only the unique local-carrier-baseline replacement establishes matched empty-state pixels. The current plain carrier quarter files belong to the collected-continuity report, whose sidecars record the actual memory. Per-clip recordings and contact sheets were uniquely named and unaffected. Future held captures use explicit `-empty` or `-collected` variants. The [scope manifest](evidence/local-carrier-final-evidence-scope.json) records this correction.

These checks do not establish physical Android/iOS behavior, native browser zoom, a fixed 60 fps frame rate, Lighthouse scores, or display-frame-perfect absence of errors between retained captures. Read-only performance observations include capture overhead and are reported as measurements, not invented acceptance scores. Narrow source changes were retaken only in their affected states; unchanged earlier coverage remains scoped to its recorded build. The retained failures, corrected evidence and independent review together make that boundary reviewable.
