# NIGHTSHIFT — independent visual review

Review date: 2026-11-09. This document records an independent, read-only visual review of the initial production captures, one bounded verdict pass on the resulting corrections, and a final focused confirmation of the remaining chapter 08 phone finding. The reviewer did not edit UI source or operate the shared browser preview.

## 1. Disposition

**Final disposition: ship within the visual scope reviewed. All seven material baseline findings are resolved.** The final utility chapter phone adjustment places the reading panel below the inspection action. The lamp, head and shoulders, and clipboard remain visible above it at the three inspected phone sizes. There are no outstanding findings in this bounded review's material correction list.

No rebuild is warranted. The opening art, type, palette, photographic progression, and humane tone are coherent. The corrections preserve that world and remove the most disruptive layout and capture defects. This is a verdict on the reviewed static compositions for source delivery, not authorization to publish and not a claim that every functional or device requirement has been independently verified here.

The initial disposition was **fix and recapture**. Initial screenshots are retained in `evidence/before-corrections/`; corrected captures use the corresponding names in `evidence/screenshots/`.

## 2. Evidence validity and scope

### Actual evidence reviewed

The production capture record identifies Chromium **153.0.8010.0**, headless Playwright captures of the local production build, desktop **1440 × 900**, phone **390 × 844**, and device scale factor **1**. The final `evidence/records/captures.json` contains **122 capture records** and **199 visible-stage image records**. A read-only check found:

- No recorded page errors.
- No capture whose recorded page width exceeded its viewport width.
- No missing visible-image records.
- No recorded stage image using `/fallback/` or reporting a natural width of 512 pixels or less.

The corrected capture script requires a full-resolution source, awaits `decode()`, and waits for two animation frames before taking the screenshot. This resolves the original capture gate, which could accept a loaded fallback while its full image was still being requested.

The reviewer opened all three final overview sheets, native chapter 01 desktop, native phone chapters 03/08/09/11, native chapter 11 desktop, native 07→08 transitions at 25%/50%/75%, and native 04→05, 05→06, and 09→10 midpoints. The selected `public/media/hero.webp` was reopened beside the actual chapter 01 desktop capture. The initial review also inspected both selected hero assets, utility and dawn originals, and the corresponding baseline frames.

The final focused confirmation inspected chapter 08 at **390 × 844**, **360 × 640**, and **320 × 700**. Its final positions and image sources are recorded in `evidence/records/reading-holds.json`. This supplementary set contains 25 records; the reviewer visually examined its three corrected inspection holds, not the other 22 second-beat images. The three inspected holds each record chapter opacity 1 and the full 1586 × 992 utility source.

Key evidence:

- [Desktop overview](../evidence/screenshots/desktop-overview.jpg)
- [Phone overview](../evidence/screenshots/mobile-overview.jpg)
- [Transition overview](../evidence/screenshots/transition-overview.jpg)
- [Capture metadata](../evidence/records/captures.json)
- [Final phone inspection-hold metadata](../evidence/records/reading-holds.json)
- [Capture implementation](../scripts/capture-evidence.mjs)

### Limits

The base zero-overflow result applies to the recorded 1440-pixel and 390-pixel viewports. The additional 320-pixel and 360-pixel visual confirmation applies only to the corrected chapter 08 opening. This is not a full-site 320-pixel-to-4K certification. Still captures do not establish continuous-motion smoothness, reversal behavior, keyboard focus, interaction correctness, reduced-motion completeness, screen-reader usability, general short-height behavior, or touch-target dimensions. Those require their own evidence. The additional hero-state and first-service interaction evidence was not independently replayed in this bounded verdict pass.

## 3. Craft and brief fidelity

The visual authority is the selected photographic art plus the English DOM composition required by the brief. The selected hero is not a raster UI mockup, so this review does not demand that typography be baked into, or copied from, the image. The large hero scale and chapter/time labels are pinned brief decisions.

### Five-point opening art-fidelity review

| Criterion | Verdict and visible evidence |
|---|---|
| Selected composition | **Strong.** The actual [desktop opening](../evidence/screenshots/desktop-ch-01.jpg) preserves the amber room at lower-left, the city receding to the right, and the broad quiet sky in the [selected asset](../public/media/hero.webp). The crop retains the important window geometry and street depth. |
| Human scale and tone | **Strong.** The anonymous worker remains a small participant in a larger city. The lamp, posture, rain, and surrounding darkness carry the story without turning the scene into a promotional portrait. |
| Light, color, and materials | **Strong.** Localized amber, ink sky, steel tones, concrete, wet streets, and glazing retain the selected image's material character. The screenshot does not replace this relationship with an unrelated global treatment. |
| English DOM hierarchy | **Strong.** The large title occupies the available sky; italic “sleeps” supplies a restrained reflective accent. The lead, primary action, wordmark, and controls remain visually subordinate and legible in the inspected frame. The text overlay does not conceal the worker. |
| Separate phone art direction | **Strong in the opening.** The phone composition changes to the interior desk viewpoint with a working hand, lamp, notebook, and city beneath calm title space. The inspected baseline phone source and the final phone overview support a deliberate alternate composition rather than a narrow desktop crop. |

The desktop chapters retain a convincing sequence of materials: flour and warm metal, cool corridor, wet curb, rails, substantial pipework, closed cabinets, flowers, canopy, and silver dawn. The rail-to-water midpoint remains one of the strongest architectural matches. The corrected phone bakery and market now show the work named by their text. The quiet desk at dawn is visible again on both reviewed device classes.

The reading panels remain a consistent phone device. The final chapter 08 composition deliberately places its panel lower than the surrounding chapters, allowing the inspection to lead and preserving a readable text surface below. This both resolves the obscured action and gives that phone chapter a more distinct composition.

## 4. Material findings and correction verdicts

The two weakest non-hero chapters in the initial review were **03, Before the Bread**, and **08, Light on Duty**. The weakest initial transition was **07→08, Water Below to Light on Duty**. The table preserves those baseline judgments rather than retrospectively replacing them with the corrected result.

| # | Baseline finding | Initial severity | Final verdict | What the corrected evidence shows |
|---|---|---|---|---|
| 1 | Phone chapter 03 had a tall, mostly empty dark panel hiding the dough and hands. | High | **Resolved** | The panel now ends shortly after its lead. Both hands, dough, flour, and steel are clearly visible below it. The image remains sharp. [Before](../evidence/before-corrections/mobile-ch-03.jpg) · [After](../evidence/screenshots/mobile-ch-03.jpg). |
| 2 | Phone chapter 08 cropped the inspector out, leaving an empty cabinet/wall. | High | **Resolved** | The first correction restored the worker but left the head and clipboard behind the top panel; that intermediate result was correctly marked partial. The final lower reading panel exposes the lamp, head and shoulders, and clipboard at all three inspected phone sizes. The text fits with visible separation above the fixed toolbar. [Before](../evidence/before-corrections/mobile-ch-08.jpg) · [390 × 844](../evidence/screenshots/mobile-ch-08.jpg) · [360 × 640](../evidence/screenshots/phone-360-ch-08.jpg) · [320 × 700](../evidence/screenshots/phone-320-ch-08.jpg). |
| 3 | Final visual captures could accept enlarged fallback imagery. | High evidence gate | **Resolved** | The new capture gate requires full image sources and decoded frames. All 199 visible-stage image records exceed 512 pixels in natural width and avoid `/fallback/`. The utility and dawn captures now retain the originals' detail. [Record](../evidence/records/captures.json) · [Script](../scripts/capture-evidence.mjs). |
| 4 | The stretched dawn panel concealed almost the whole returned window. | Medium | **Resolved** | The desktop panel is intrinsic-height; the desk, empty chair, lamp, and lower window are visible beneath it. The phone crop directly frames the quiet room. [Desktop before](../evidence/before-corrections/desktop-ch-11.jpg) · [Desktop after](../evidence/screenshots/desktop-ch-11.jpg) · [Phone after](../evidence/screenshots/mobile-ch-11.jpg). |
| 5 | Transition 07→08 revealed an empty incoming wall behind a broad corner slab; an outgoing detail block intruded into the quarter frame. | Medium | **Resolved** | The utility scene now arrives from the right. Its inspector and lamp are visible opposite the water flange at midpoint; the corner is narrower. The reviewed 25%, 50%, and 75% frames are clean of the clipped outgoing detail block. [Before midpoint](../evidence/before-corrections/desktop-tr-07-08-050.jpg) · [25%](../evidence/screenshots/desktop-tr-07-08-025.jpg) · [50%](../evidence/screenshots/desktop-tr-07-08-050.jpg) · [75%](../evidence/screenshots/desktop-tr-07-08-075.jpg). |
| 6 | Phone chapter 09 excluded the working hands despite the title “Color arrives by hand.” | Medium | **Resolved** | The new crop retains a substantial glove, stems, flowers, and the crate edge below the text. The material action is readable. [Before](../evidence/before-corrections/mobile-ch-09.jpg) · [After](../evidence/screenshots/mobile-ch-09.jpg). |
| 7 | Several horizontal transitions used the same thick synthetic extrusion. | Medium | **Resolved at material-defect scope** | The 04→05 and 05→06 separators are substantially thinner and no longer dominate their images. The 09→10 midpoint now uses a vertical column and distinct canopy-to-platform composition. The seams remain visibly editorial, which is consistent with the chosen layered-photography fallback; this review does not certify them as invisible physical-camera moves. [04→05](../evidence/screenshots/desktop-tr-04-05-050.jpg) · [05→06](../evidence/screenshots/desktop-tr-05-06-050.jpg) · [09→10 before](../evidence/before-corrections/desktop-tr-09-10-050.jpg) · [09→10 after](../evidence/screenshots/desktop-tr-09-10-050.jpg). |

### Final focused confirmation

The final chapter 08 pass was restricted to the previously partial finding. At 390 × 844 the panel begins near y503; the inspector and clipboard are unobscured above it. At 360 × 640 and 320 × 700, the same action remains visible, the complete heading and lead fit in the lower panel, and the panel stays separated from the fixed toolbar. No new general polish search was performed. The visual evidence is sufficient to change this finding from partial to resolved at those sizes.

## 5. Final score and limits

**Subjective craft appraisal of the inspected compositions: 8.5/10 overall; approximately 9/10 for the opening.** The initial baseline was 7/10 overall with a 7.5 ceiling until its material defects were corrected. The new evidence lifts that baseline ceiling, and the final utility adjustment closes the remaining material composition finding. The editorial seams still vary in how naturally they read as photographic architecture; this remains a limit on the overall aesthetic appraisal rather than an outstanding defect in the bounded correction list.

These are clearly labeled reviewer judgments, not measured quality metrics, a promise of awards, or an accessibility/performance certification. The source and capture metadata substantiate the technical evidence statements; the aesthetic appraisal remains a scoped human-style judgment of the viewed material. The final disposition applies only to the reviewed visual scope and does not convert unreviewed behavior or device sizes into a pass.
