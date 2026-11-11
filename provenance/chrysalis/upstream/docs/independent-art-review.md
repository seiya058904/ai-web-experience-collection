# Independent art and scientific-interface review

Review date: 9 November 2026.

Status: **Targeted art, G4 corrections, and the supplied ten-boundary phone midpoint set independently reviewed.** The AI-09 anatomy correction, CH-05/CH-08 study refinements, and complete-pose transition corrections are visually resolved within the cited captures. Later TR-01-02 and TR-03-04 failures are preserved alongside their inspected replacements. The final TR-05-06 capture shows the complete J pose and unobscured support; the final containment log records the full fitted image inside the revealed region at both tested phone sizes. TR-07-08/TR-08-09 wording corrections were verified in source and in the final supplied phone captures. No further material correction is requested for these observed states. This is not a continuous-motion or whole-website acceptance verdict.

## Scope and method

An independent reviewer read the supplied CHRYSALIS Edition 2.0 build brief, `PRODUCT.md`, `docs/sources.md`, `docs/surface-brief.md`, and `art/asset-provenance.json`. The reviewer directly viewed the retained full-resolution images AI-04, AI-05, AI-06, AI-07, AI-08, AI-09, AI-10, AI-11, and AI-12, with no more than three images in a viewing batch. The three hero concepts AI-01, AI-02, and AI-03 were subsequently viewed to prepare the concept-to-browser comparison. The reviewer also read `src/ui.ts` and `src/diagrams.ts`, with supporting checks of `src/content.js`, `src/media.ts`, and relevant styles.

The images were assessed as natural-history illustrations. A simplified fold, an obscured far-side leg, a stylized light treatment, or an unmeasured display scale was not automatically treated as false biology. The review looked for consequential anatomy errors, unsupported claims, contradictory states, broken support, species substitution, duplicate subjects, and loss of the intended compositional anchors.

The reviewer did not edit application source, regenerate art, launch a browser, deploy, publish, or push anything. Later production captures were supplied by the build owner and directly opened by the reviewer. No aesthetic score, frame-rate result, physical-device claim, or finished-site acceptance is asserted here.

## Initial asset and source findings

### 1. High, corrected in retained art: AI-09 obscured the difference between true legs and prolegs

**File:** `art/generated/AI-09.png` (CH-03 hatchling plate).

**Original visual evidence:** The small larva occupied approximately x=1270–1535 and y=470–595 in the 1659 × 948 image. Along its lower edge, narrow dark pointed appendages repeated from immediately behind the black head through the posterior body. The abdominal contacts read as further jointed walking legs rather than soft prolegs. This was a visible anatomy problem, rather than a concern about pale first-instar coloration or illustration style.

Monarch larvae have thoracic true legs and five pairs of prolegs in total. These are different structures; the abdominal contacts should not all read as additional hard thoracic legs. The distinction is described in both the [Monarch Watch anatomy account](https://www.monarchwatch.org/biology/) and [Monarch Joint Venture life-cycle account](https://monarchjointventure.org/monarch-biology/life-cycle), directly retrieved during this review.

**Recommended correction:** Make a narrow art edit that preserves the egg, opening, larval body, leaf, vein, lighting, and camera. Keep three anterior near-side jointed legs immediately behind the head. Render the middle abdominal contacts as rounded soft prolegs, with the terminal anal contact at the rear; leaf occlusion may hide some contacts. Avoid a repeated row of dark needle-like feet. The corrected AI-10 feeding plate already demonstrates a clearer distinction.

**Correction and independent recheck:** The retained replacement was directly reopened after the art revision. The repeated posterior dark spikes are gone. The small pale larva now rests against the raised leaf surface with its ventral contact line concealed. The opened egg, curved vein, head direction, negative space, and setting remain recognizable. No invented row of posterior jointed legs remains visible.

The chosen correction uses natural occlusion rather than an exposed leg-count demonstration. This is acceptable for the hatching observation; it does not establish visible anatomical detail for all legs. The provenance correctly states that all ventral feet are occluded and that this plate must not be used to illustrate or count larval legs. CH-04 provides a separate view of anterior contact. The revised provenance records production SHA-256 `82b82c999e8a4516329ab1cd83467ce6bf2cc27bb805361922a16c5382d8b6fc`.

**State at this review:** Corrected in retained art and independently visually rechecked. Packaged derivative consistency remains part of the build owner's asset verification; finished browser framing has not yet been inspected by this reviewer.

### 2. Medium, clarified in source: feeding comparison needed a clear visual scope

**Source:** `src/ui.ts`, CH-04 rendering branch.

**Evidence:** The initial button state is “Before feeding,” and the nearby caption says that the edge is intact. The macro beside those controls is AI-10, which visibly contains the feeding notch. A separate SVG lower in the chapter represents the before/after comparison.

**Why it matters:** If the controls appear to operate on the adjacent macro image, the label and visible edge disagree. The comparison itself can be valid when it clearly refers to the explanatory diagram. This is an interface-state question, not an objection to using a schematic.

**Recommended correction:** Explicitly label the controls as a diagram comparison and bring the changing diagram into their reading context, or synchronize the larger illustrated scene with the selected state. Do not rely on an off-screen SVG to explain an apparent contradiction beside the control.

**Correction and source recheck:** The reviewer reread the updated CH-04 branch. It now places “Compare the diagram below.” immediately before the selector. This explicitly identifies the changing medium, addressing the source-level ambiguity.

**State at this review:** Clarified in source. Confirm the instruction remains visible beside the selector at desktop and mobile widths; no browser rendering was inspected in this phase.

### 3. Medium, corrected in source: five instar captions would render as “undefined”

**Sources:** `src/ui.ts`, `src/content.js`, and `src/media.ts`.

**Evidence:** The initial instar note renderer used `s.caption`, while the five content records expose `description`. The escaping helper converts its input with `String(value)`, so the missing field would become literal visible “undefined.”

**Correction:** The build owner changed the renderer to `s.description` and removed the `any` annotation. The reviewer reread `src/ui.ts` and confirmed that correction.

**State at this review:** Corrected in source. The later selected Instar 5 and stacked phone comparison captures show readable stage descriptions, with no literal “undefined” in the inspected content. This does not imply inspection of every caption at every breakpoint.

## Asset-by-asset observations

| Asset | Direct observation | Assessment within this review |
| --- | --- | --- |
| AI-04, desktop egg | One ribbed, opaque, pale egg meets the leaf at a plausible contact. The diagonal vein remains visible. The left and upper-left areas provide substantial quiet space. | No material source-image defect identified. The later stable browser region retains that material and text safety; see the scoped hero review. |
| AI-05, portrait egg | The vertical leaf arc and egg position are visibly recomposed for portrait use. The egg is intact within the frame and the upper field is quiet. | No material source-image defect identified. This is a separate composition, not an obvious horizontal center crop; the later 390 × 844 capture retains its full egg and readable text. |
| AI-06, jade pupa | A short dark cremaster visibly joins the pupa to a small silk pad. The body is opaque green with restrained gold markings; no floating jewel, long suspension rope, or detached shell is present. | No material source-image defect identified. |
| AI-07, early emergence | One adult hangs beneath a retained empty shell. Its feet visibly meet the shell, its abdomen remains full, and its wings are shorter and folded. The stem and silk support remain in the same general frame as AI-06. | No obvious instant-flight or detached-adult error. Exact wing-pattern continuity through subsequent rendered states still needs review. |
| AI-08, late pupa | The silk pad, cremaster, stem, shell outline, and gold line remain recognizable against AI-06. Copper and dark wing regions are visible within a retained surface. | No ghost butterfly, exploded casing, or glass-vessel defect identified. Pattern visibility is compatible with the cited late pigmentation explanation. |
| AI-09, hatchling, revised | The opened shell and leaf anchor remain recognizable. The small pale larva rests flush against the leaf/vein and the erroneous row of pointed posterior legs has been removed. Ventral feet are occluded. | Identified defect corrected and independently rechecked. This is an observation plate, not a leg-count plate; see finding 1. |
| AI-10, feeding | The feeding notch is at the head. Three anterior dark legs are distinct, and posterior contacts are subdued or hidden by the leaf. | The previously documented excessive posterior-leg issue is not evident in the retained plate. The control scope is clarified in source; no final CH-04 browser capture was supplied to this reviewer. |
| AI-11, J-hang | The rear directly meets silk, with no pupal cremaster drawn between larva and pad. The body forms a J and the head is at its lower curled end. | No strong basis for another regeneration. Only three rounded near-side midbody contacts are clearly resolved, but the curved pose can obscure a contact; this alone does not prove an anatomical count error. |
| AI-12, adult | One adult has recognizable orange-and-black monarch wing fields and white-spotted borders. Its legs meet the leaf and the full silhouette stays inside the source frame. | No clear species substitution or source-image composition failure identified. The separate production cutout and animated departure were outside this phase. |

## Scientific wording and diagram review

No additional clear biological falsehood was identified in the inspected UI and diagram definitions. The source explicitly separates illustration from observation, avoids fixed developmental countdowns, labels the inside view “Illustrative reconstruction,” and does not describe the animal as dissolving into nothing.

The larval diagram generator uses three anterior true-leg positions plus four middle abdominal proleg positions and a terminal proleg position. The five specimen records vary body profiles, head proportions, band emphasis, filament length, and proleg markings. They are not only one silhouette enlarged five times. Their presentation is expressly unmeasured.

The attachment copy distinguishes larval rear attachment from the pupal cremaster. The emergence diagrams retain the support and separate small folded wings from larger expanded wings. The cycle diagram's description explicitly distinguishes the next generation from one adult turning back into an egg. These choices are consistent with the source material and the educational scope.

The hatching macro is an after-hatching reference while its separate study begins at the intact-shell pose. The final layout should make that relationship clear. This is less concerning than the adjacent feeding control because the hatching controls and changing diagram are already grouped as a separate study.

## Primary-source checks

Both pages below were directly opened on 9 November 2026 for this review. Their factual support does not grant permission to reproduce their artwork; no source artwork was copied into this review.

- [Monarch Watch — Monarch Biology](https://www.monarchwatch.org/biology/): true legs and prolegs, silk and cremaster attachment, adult anatomy, and the four-stage life cycle.
- [Monarch Joint Venture — Life Cycle](https://monarchjointventure.org/monarch-biology/life-cycle): first-instar appearance; differences among instars; late wing pigmentation; hanging emergence and wing expansion.

## Production screenshot review

### Evidence scope

The reviewer directly viewed the following actual browser-capture files:

| Evidence | Raster dimensions and scope |
| --- | --- |
| `evidence/browser/portrait-390-hero-crop.jpg` | 390 × 844 crop of the portrait hero. |
| `evidence/browser/portrait-390-hero.jpg` | 1363 × 936 context capture; the 390-pixel page occupies the left side, with the QA host canvas beside it. |
| `evidence/browser/desktop-1440-hero-visible1363.jpg` | Actual raster 1341 × 921; a visible region of the 1440 CSS-pixel iframe, clipped by the host. The temporary filename is not the raster size. |
| `evidence/browser/desktop-1440-ch05-visible-region.jpg` | 1341 × 921 visible region of the CH-05 introductory and Show-all study state. |
| `evidence/browser/desktop-1440-ch08-visible-region.jpg` | 1341 × 921 visible region of CH-08 in its exterior state. |
| `evidence/browser/desktop-1440-ch10-visible-region.jpg` | 1341 × 921 visible region of the emergence scene. |
| `evidence/browser/desktop-1440-ch11-visible-region.jpg` | 1341 × 921 visible region of the resting adult in the finale. |
| `evidence/browser/desktop-1440-tr06-p50-visible-region.jpg` | 1341 × 921 visible region of TR-06-07 at its midpoint, before correction. |
| `evidence/browser/portrait-390-ch05.jpg` | Context capture of a 390-pixel phone page, showing the complete Show-all overview. |
| `evidence/browser/portrait-390-ch05-instar5.jpg` | Context capture of the 390-pixel page with Instar 5 selected and its complete specimen visible. |
| `evidence/browser/portrait-390-ch08-inside.jpg` | Context capture of the 390-pixel page with the complete labeled reconstruction panel visible. |
| `evidence/browser/portrait-390-ch10.jpg` | Context capture of the 390-pixel emergence introduction and upper portion of its following art. |
| `evidence/browser/final-desktop-tr06-p50.jpg` | 1341 × 921 visible region of the corrected TR-06-07 midpoint, using separate complete-pose panels. |
| `evidence/browser/final-desktop-tr09-p50.jpg` | 1341 × 921 visible region of the corrected TR-09-10 midpoint, using separate complete-pose panels. |
| `evidence/browser/final-portrait-tr06-p25.jpg` | 1363 × 936 context capture of the corrected TR-06-07 at 25 percent in the 390-pixel phone page. |
| `evidence/browser/final-portrait-tr06-p50.jpg` | 1363 × 936 context capture of the corrected TR-06-07 midpoint in the 390-pixel phone page. |
| `evidence/browser/final-portrait-tr06-p75.jpg` | 1363 × 936 context capture of the corrected TR-06-07 at 75 percent in the 390-pixel phone page. |
| `evidence/browser/final-portrait-tr09-p25.jpg` | 1363 × 936 context capture of the corrected TR-09-10 at 25 percent in the 390-pixel phone page. |
| `evidence/browser/final-portrait-tr09-p50.jpg` | 1363 × 936 context capture of the corrected TR-09-10 midpoint in the 390-pixel phone page. |
| `evidence/browser/final-portrait-tr09-p75.jpg` | 1363 × 936 context capture of the corrected TR-09-10 at 75 percent in the 390-pixel phone page. |
| `evidence/browser/final-portrait-ch05-all-upper.jpg` | 1363 × 936 context capture of the revised phone Show-all comparison: upper specimen rows. |
| `evidence/browser/final-portrait-ch05-all-lower.jpg` | 1363 × 936 context capture of the revised phone Show-all comparison: lower specimen rows and scale disclaimer. |
| `evidence/browser/final-portrait-ch08-inside.jpg` | 1363 × 936 context capture of the revised phone reconstruction, full support/outline, legend, and disclaimers. |
| `evidence/browser/refined-portrait-01-p50-320.jpg` | 1363 × 936 context capture of TR-01-02 midpoint in the 320 × 700 phone page, with the caption repositioned above the egg. |
| `evidence/browser/refined-portrait-01-p50-390.jpg` | 1363 × 936 context capture of TR-01-02 midpoint in the 390 × 844 phone page, with the caption repositioned above the egg. |
| `evidence/browser/refined-portrait-03-p50-320.jpg` | 1363 × 936 context capture of the corrected complete hatching/feeding plates in the 320 × 700 phone page. |
| `evidence/browser/refined-portrait-03-p50-390.jpg` | 1363 × 936 context capture of the corrected complete hatching/feeding plates in the 390 × 844 phone page. |
| `evidence/browser/refined-desktop-03-p50.jpg` | 1341 × 921 visible desktop region containing the corrected separate hatching/feeding plates. |
| `evidence/browser/refined-portrait-05-p50-390.jpg` | Earlier corrected 1363 × 936 context capture of TR-05-06 midpoint: complete J pose and support, with the tag moved to the left. Superseded for full-image containment by the capture below. |
| `evidence/browser/contained-portrait-05-p50-390.jpg` | Final phone midpoint context capture after narrow-screen overscan removal: full J silhouette, attachment, and supporting stem remain visible, with the tag clear of the attachment. |
| `evidence/browser/contained-portrait-07-p50-390.jpg` | Final phone midpoint context capture showing the corrected separate-reconstruction caption in the rendered page. |
| `evidence/browser/contained-portrait-08-p50-390.jpg` | Final phone midpoint context capture showing the corrected return-to-exterior caption in the rendered page. |

These desktop files are not complete 1440-pixel viewport captures. Their host scrollbars and the portrait context image's empty QA canvas are capture context, not evidence of a site-layout defect. These are still screenshots; no continuous movement or unseen intermediate frame is certified by this review. The previously proposed `prototype-hero.jpg` was not present and was never reviewed or marked as passed.

### High, before-fix failure: TR-06-07 midpoint formed an impossible hybrid

**Evidence:** `desktop-1440-tr06-p50-visible-region.jpg`.

The horizontal wipe boundary crosses the body near the middle of the visible image. Above it, the striped larval body hangs from silk; below it, the lower jade pupa continues the same silhouette. The result reads as one body with a larval upper half and a pupal lower half. A straight discontinuity in the background crosses the image at the same height. This is a material biological/compositional failure in the captured midpoint.

The small “Illustrated stage comparison” label does not make the combined silhouette a credible stage or a clear comparison of two specimens. The main caption also refers to a skin-shedding observation, but no physical skin separation is visible in this frame.

**Recommended correction:** During the comparison interval, show two clearly labeled complete-pose panels, each retaining its full animal and visible support; alternatively, a scene-owned occluder must cover the entire subject before the pose changes. Do not let a generic image wipe join halves of incompatible bodies. Captions should describe a comparison unless actual skin separation is shown.

**Historical review status:** **FAIL for the before-correction midpoint.** This image and finding are preserved. The actual revised desktop midpoint and phone 25/50/75 percent states were subsequently inspected, as documented next. Transform calculations or endpoint assertions alone would not have resolved the visual finding.

### Post-fix transition recheck: complete supported poses

The build owner identified the new production assets as `index-B3o3QDo8.js` and `index-BCuQmqec.css`. The reviewer directly opened the two new desktop midpoint images and all six phone 25/50/75 percent images listed above.

- **TR-06-07 desktop midpoint:** The J-hanging larva and jade pupa now occupy distinct labeled panels. Both complete bodies are visible, with silk/support retained. Their materials and stage identities remain recognizable. The former horizontal body-splicing boundary is absent. The caption explicitly distinguishes separate observations and states that the skin-shedding process is not shown.
- **TR-09-10 desktop midpoint:** The complete late pupa and newly emerged adult occupy distinct labeled panels. The emerging adult retains its empty casing above, with visible feet/support and small folded wings. The shell and animal remain fully inside the panel. The caption states that shell-opening movement is not shown.
- **TR-06-07 phone 25/50/75 percent:** Both complete bodies and their support fit within the side-by-side phone panels in all three captures. Stage names, attachment notes, and the explicit limitation about the unshown skin-shedding process are visible. The changing caption progresses from separate stages, to comparison, to the attached jade pupa. No joined silhouette is present at any inspected checkpoint.
- **TR-09-10 phone 25/50/75 percent:** The late pupa and newly emerged adult remain whole and visually separate in all three captures. The adult's empty casing remains attached above it, and its complete abdomen and folded wings fit inside the image. Stage names and the shell-opening limitation are readable. The captions distinguish the before/after comparison and the adult hanging beneath its empty shell; no fragment of one biological pose is spliced onto the other.

**Scoped resolution:** The impossible hybrid-body defect is corrected in the inspected desktop midpoints and six phone checkpoints. The requested 25/50/75 percent phone recheck is complete. This does not erase the before-fix failure, demonstrate the omitted physical shedding/opening movements, or certify unseen progress values, entrance/exit thresholds, and continuous motion.

### Hero fidelity in the observed regions

The desktop hero retains AI-04's ribbed opaque egg, physical leaf contact, diagonal vein, light direction, and quiet left-hand text field. The title, lead, and primary action remain separated from the egg. The portrait crop retains AI-05's independently composed leaf arc; the egg is entirely visible below the title and call to action. The serif title, body copy, species line, and controls are readable in these captures, with no observed overlap or shell masking. No change into a smooth glass sphere or loss of the leaf texture is visible.

This supports fidelity of those observed stable compositions. It does not establish all six hero states, the complete desktop right edge, all narrow widths, or forward/reverse motion continuity.

### Nonhero observations so far

- **CH-05:** The heading, lead, and stage selectors are distinct and readable in the initial desktop region. Five different profiles are visible. Much of the study field above the small specimens is empty, and the bottom of the study is outside that capture. The subsequent complete phone and selected-state observations appear below.
- **CH-08:** The initial exterior state has a readable heading and explicit interpretation context. The retained chrysalis support is visible. The subsequent inside-state observation appears below.
- **CH-10:** The visible title and lead remain in the quiet left field, separate from the hanging adult and empty shell. The lowest abdomen reaches beyond the captured bottom edge; this image does not establish complete-body framing. Capture position and actual scene cropping must be distinguished before calling it a layout failure.
- **CH-11:** The capture contains one adult with recognizable monarch markings and visible leaf contact. The heading, lead, and action occupy the separate left field. No duplicate butterfly or obvious extraction halo is visible at the capture's resolution. The departure and restored states are not established by this resting-state image.

### G4 before-refinement findings

The earlier phone captures established two nonhero weaknesses. Among those inspected states, **CH-08 was the first refinement priority and CH-05 the second**. This was a judgment about information visibility, without a numerical aesthetic score. The following findings preserve the reason for the changes; their final recheck follows below.

1. **CH-08 — enlarge the explanatory subject.** In `portrait-390-ch08-inside.jpg`, the shell and folded-wing diagram occupies a small central area of the wide panel. The retained support and fine internal lines are much less prominent than the surrounding explanation. The full “Illustrative reconstruction” label and disclaimer are readable, but the subject they explain is unnecessarily small. A tight viewBox around the actual drawing and leader extents can enlarge it substantially while retaining the whole support and outer outline; there is no need to enlarge the typography. The three legend samples should also match the casing, wing-region, and support treatments in the diagram, rather than using one gold line for every key. Treat the result as a separate explanatory plate unless actual exterior registration is implemented and shown; the capture does not demonstrate a registered overlay.
2. **CH-05 — preserve comparative detail on phones.** In `portrait-390-ch05.jpg`, all five larvae remain in one horizontal row. Several bodies are only a few pixels high, so bands, heads, and proleg details are difficult to compare. The selected Instar 5 state in `portrait-390-ch05-instar5.jpg` is materially more usable: the specimen, selected control, and explanatory caption are all identifiable. Keep that selected-state behavior. For phone Show-all, use stacked larger specimen rows or another layout that gives each stage comparable inspectable detail; preserve the desktop overview and existing source notes.

The CH-10 phone capture shows readable text separated from the art. It ends midway down the following image because the chapter continues below the captured viewport, so it is not evidence that the full image itself clips the adult. No additional CH-10 defect is asserted from that frame.

**Weakest observed transition before correction:** TR-06-07, because the documented midpoint joined incompatible body halves. The complete-pose correction was prioritized over cosmetic refinements.

These are before-refinement findings. `portrait-390-ch05-selected.jpg` was not used as selected-specimen proof; it was identified by the build owner as a lower reading-beat capture and subsequently renamed `portrait-390-ch05-reading-beat.jpg`.

### Final G4 correction decision for the supplied captures

The reviewer independently opened both final phone Show-all captures and the final inside-state capture, in addition to the revised transition frames. The changes address the specific observed defects and are materially visible:

| Target | Directly observed correction | Scoped result |
| --- | --- | --- |
| CH-05 phone Show-all | The upper/lower captures together show all five distinct specimens in larger stacked rows. Each row has an explicit instar label and readable identifying feature. Pale body, head marking, band emphasis, filament length, body profile, and proleg markings can be inspected at a substantially larger display size than the former five-across row. The lower capture retains the explanation that specimens are enlarged separately and are not a measured growth scale. | **RESOLVED in the inspected phone Show-all captures.** |
| CH-08 phone illustrated inside | The complete support, silk attachment, casing, two folded-wing regions, and leader lines are enlarged while staying within the panel. The “Illustrative reconstruction” label, descriptive caption, and explanatory disclaimers remain readable. Legend samples now distinguish the casing, wing regions, and attachment treatments. | **RESOLVED in the inspected phone inside-state capture.** |
| TR-06-07 and TR-09-10 comparison states | The revised desktop midpoints and phone 25/50/75 percent frames use complete supported poses in separate labeled panels. The former TR-06-07 body splice is absent, and the limits of the unshown physical movements are stated. | **RESOLVED for the inspected checkpoint compositions.** |

The CH-08 result is a separate explanatory drawing. Source review confirmed its `160 20 380 250` viewBox and its explicit statement that the drawing is not registered to the exact exterior geometry. This review accepts the observed correction of scale and explanatory clarity; it does not rename the separate plate as a precisely registered cutaway.

**G4 decision:** The two identified nonhero visibility problems and the identified transition-splice problem have documented before/after evidence and are corrected within this review's capture scope. No further correction is requested for these captured states. This is a targeted visual resolution, not a claim that every chapter, breakpoint, transition frame, or animation has passed.

### Additional boundary midpoint review: TR-01-02 caption conflict

**Evidence:** `evidence/browser/boundary-01-p50.jpg`, a context capture of the 390 × 844 phone page at the first boundary midpoint.

**Finding:** The caption's opaque upper edge masks the lower part of the small egg at the lower right. Only the pale upper tip clearly remains above the panel, while the lower shell and leaf-contact region are behind it. This is material to this scene because the caption specifically says the egg remains visible and the egg is the intended continuity landmark.

**Minimal recommended correction:** Lower the caption for TR-01-02 on phones by approximately 35–40 pixels in this composition. Changing only this boundary's phone bottom offset from 7 percent to about 20–24 pixels should place the panel below the shell at 390 × 844. Keep the change scene-specific; other boundaries have different subject positions.

The build owner subsequently proposed a phone `top: 150px` placement to remain clear of the egg when narrower viewports make the caption taller. That is a reasonable broader solution; the lower-offset suggestion above was specific to the original 390 × 844 evidence. The top placement still requires checking against the header/tag and egg at both 320 × 700 and 390 × 844.

**Historical status:** **FAIL for the supplied before-correction midpoint framing.** The original image and finding remain retained.

**Independent replacement review:** The reviewer directly opened `refined-portrait-01-p50-320.jpg` and `refined-portrait-01-p50-390.jpg`. In both captures, the caption is positioned above the egg and below the fixed header/tag, with readable text and a clear separation between elements. The complete small shell and its contact with the leaf are unobscured below the panel. **RESOLVED for these 320 × 700 and 390 × 844 midpoint captures.** This finding does not imply inspection of every progress value or narrow viewport.

### Additional boundary midpoint review: TR-03-04 shell/larva splice

**Evidence:** `evidence/browser/boundary-03-p50.jpg`, a context capture of the 390 × 844 phone page at the hatching-to-feeding midpoint.

**Finding:** The vertical wipe seam places a partial ribbed eggshell from the hatching plate immediately against the horizontal feeding larva on the right. The feeding head is lost at the seam, while the right-hand body and anterior contacts remain visible. The result does not read as either a complete hatching observation or a complete feeding pose. Its joined silhouette and background discontinuity make this a material biological/compositional failure.

**Recommended correction:** Use a complete-pose comparison for this boundary, with separate labels such as “Hatchling beside the shell” and “Feeding at the leaf margin.” State that these are distinct illustrated observations instead of implying recorded movement between them. Give the hatching panel an asset-specific crop that retains both the whole opened shell and the tiny larva to its right; a portrait crop designed for a central pupa can lose the hatchling. The feeding panel must retain the complete head/body, local contact, and feeding notch.

**Historical status:** **FAIL for the supplied before-correction midpoint.** The original image and finding remain retained.

**Independent replacement review:** The reviewer directly opened `refined-portrait-03-p50-320.jpg`, `refined-portrait-03-p50-390.jpg`, and `refined-desktop-03-p50.jpg`. The hatching plate retains the entire opened shell and tiny larva together, with visible leaf contact. The separate feeding plate retains the full head and body, local contact, and feeding notch. Both phone layouts stack complete landscape plates; the desktop visible region places them side by side. Labels and the explicit statement that movement between observations is not shown are readable. No shell/body splice remains. **RESOLVED for the supplied phone and desktop midpoint regions.** No application source was changed by the reviewer.

### Ten-boundary phone midpoint register

The reviewer subsequently directly opened `boundary-02-p50.jpg`, `boundary-04-p50.jpg`, `boundary-05-p50.jpg`, `boundary-07-p50.jpg`, `boundary-08-p50.jpg`, and `boundary-10-p50.jpg`, all under `evidence/browser/`. Together with the previously inspected first/third boundaries and revised sixth/ninth boundaries, these provide a still-frame observation of every boundary's phone midpoint. They do not constitute continuous-motion or threshold-neighbor coverage.

| Boundary | Midpoint evidence | Observed result and limit |
| --- | --- | --- |
| TR-01-02 | `boundary-01-p50.jpg`; `refined-portrait-01-p50-320.jpg`; `refined-portrait-01-p50-390.jpg` | Original caption/egg masking preserved as a failure. The inspected replacements at both phone sizes show the full egg and contact clear of the upper caption. Resolved at those midpoints. |
| TR-02-03 | `boundary-02-p50.jpg` | The opened shell remains complete and above the caption. The oblique reveal divides leaf views without joining incompatible body parts. No new material anatomy or text-safety defect observed at this checkpoint. |
| TR-03-04 | `boundary-03-p50.jpg`; `refined-portrait-03-p50-320.jpg`; `refined-portrait-03-p50-390.jpg`; `refined-desktop-03-p50.jpg` | Original shell/body splice preserved as a failure. The inspected replacements show complete, separately labeled hatching and feeding observations, including all subjects and local contacts. Resolved in the listed regions. |
| TR-04-05 | `boundary-04-p50.jpg` | The partial instar overview is visibly a graphic comparison being introduced beneath the feeding image. It is labeled as separate illustrations without a measured scale. No literal body-to-body biological morph is asserted by this graphic reveal. This midpoint is not proof that all five complete specimens are visible simultaneously. |
| TR-05-06 | `boundary-05-p50.jpg`; `refined-portrait-05-p50-390.jpg`; final `contained-portrait-05-p50-390.jpg` | The earlier midpoint revealed only the upper larval body. The directly inspected replacements fit the entire J-shaped body, lower head, upper rear attachment, silk, and supporting stem in the phone image. The tag is at the left, clear of the attachment. The final capture retains that complete pose after the narrow-screen inner overscan was removed. The full-length-at-midpoint framing concern is resolved in this final 390 × 844 capture; the separately read containment log records the fitted image bounds at both phone sizes. |
| TR-06-07 | `final-portrait-tr06-p50.jpg` | Corrected separate complete-pose comparison, with full larva/pupa and support. Scoped resolution recorded above. |
| TR-07-08 | `boundary-07-p50.jpg`; final `contained-portrait-07-p50-390.jpg`; current `src/transitions.ts` midpoint text | The “Illustrative reconstruction” label is visible. The image presents a separate, differently scaled reconstruction panel, partly covered by the reveal. The final capture directly shows the corrected wording: “A separate reconstruction introduces developing wing regions.” This removes the registration implication of the original caption and matches the separate diagram being introduced. No microscopy claim is inferred from the labeled drawing. The replacement wording is verified in both source and the captured rendered page. |
| TR-08-09 | `boundary-08-p50.jpg`; final `contained-portrait-08-p50-390.jpg`; current `src/transitions.ts` midpoint text | The retained exterior and late wing pattern are visible. The final capture directly shows the corrected wording: “The late pattern returns to the exterior view.” This describes the frame without claiming a whole-outline match that the close crop cannot demonstrate. The replacement wording is verified in both source and the captured rendered page. |
| TR-09-10 | `final-portrait-tr09-p50.jpg` | Corrected separate late-pupa/emerged-adult comparison, with full supported poses and explicit movement limitation. Scoped resolution recorded above. |
| TR-10-11 | `boundary-10-p50.jpg` | The adult body, feet, and leaf contact are clear within a close wing/leaf composition. Wing tips extend beyond the narrow frame, but no incompatible-body splice is visible and the caption describes the actual composition. No material correction requested for this checkpoint. |

**Captured midpoint review closed:** Every boundary has a directly inspected phone midpoint, and the later TR-01-02/TR-03-04/TR-05-06 framing changes have directly inspected replacement evidence. The two outline/registration captions are corrected in source and visibly corrected in the final supplied captures. No further material anatomy or text-safety change is requested for the observed checkpoint compositions. This closes the supplied still-image set, not continuous movement or unobserved states.

### Final containment and caption confirmation

The reviewer directly inspected `contained-portrait-05-p50-390.jpg`, `contained-portrait-07-p50-390.jpg`, and `contained-portrait-08-p50-390.jpg` after the final narrow-screen containment change. TR-05-06 retains the complete hanging body and visible support, with the tag to the left of the attachment. TR-07-08 and TR-08-09 display the corrected captions quoted in the register above; neither caption now asserts exact outline registration. The earlier partial-pose, anatomy-splice, caption-occlusion, and misleading-wording findings remain documented as historical failures.

The reviewer also read `evidence/browser/hanging-containment-final.json`. That recorded same-origin iframe run reports two unchanged full-image bounds assertions as **PASS**, at 320 × 700 and 390 × 844 near midpoint. Its recorded contain-fitted image bounds are wholly inside the revealed region at both sizes. This log resolves the later full-asset containment issue, which concerned background-edge overscan after the complete body had already become visible. It is programmatic geometry evidence from the build owner's run, not a new test independently executed by this reviewer. The final screenshot independently supports the visible full-body/support result at 390 pixels. No continuous-motion, native-device, or global acceptance claim follows from these checks.

## Remaining coverage and environment limits

The targeted G4 corrections and later captured-midpoint corrections are no longer pending. The following broader conclusions are outside the inspected capture set and remain **NOT TESTED** by this reviewer:

- Title safety, legibility, cropping, and control placement outside the stable hero regions and limited chapter regions described above.
- All eleven chapters in their final layouts and selected control states.
- Continuous transition motion, unseen progress values and entrance/exit thresholds, including egg/leaf and mature wing identity across movement. The listed complete-pose checkpoint compositions and support are already resolved above.
- Departure/return compositing and cutout edges in unseen frames; the single resting adult in the listed CH-11 region was inspected above.
- Reduced-motion and still-view readability.

The retained `evidence/prototype/playwright-environment.json` marks standalone Playwright Chromium execution **BLOCKED**: browser executables were absent and the official installer returned invalid empty archives. This screenshot review does not convert that blocked method into a pass. The working cloud-browser iframe captures are separate evidence and do not establish native touch, OS motion-preference emulation, real browser zoom, physical-device coverage, or continuous-scroll recording. The earlier managed-preview interruption also remains an interrupted observation, not a completed matrix pass.

The build owner's final QA and requirements records govern other executed checks and remaining gates. The asset-level and scoped screenshot findings here must not be presented as whole-site acceptance.
