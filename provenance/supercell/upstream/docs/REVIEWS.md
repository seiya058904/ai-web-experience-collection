# Independent reviews and dispositions

These are the engineering, art and model review records from the iterative build. Early findings describe earlier iterations; they are retained to show what was actually found. The final results and remaining coverage boundaries are in [ACCEPTANCE.md](ACCEPTANCE.md). Some historical capture filenames below are audit identifiers rather than files retained in the final ZIP; selected final evidence is in `docs/evidence/`.


---

# SUPERCELL — Independent Engineering Review

Review scope: source inspection of the initial implementation, before the owner's browser correction pass. No production files changed, browser launched, or server started by this reviewer. Findings below are source-supported; browser geometry and visual acceptance remain the owner's tests.

## Findings

### ER-01 — III ↔ IV changes the mobile layout in one frame

- Priority: high; continuous handoff contract.
- Location: `src/main.ts`, initial line 134; mobile `#section-controls` in `src/style.css`.
- Cause: `#shear-block.hidden` flips at `story.shear > .55`. The control surface is anchored by its bottom on phones. Adding approximately a control-row height instantly moves the existing section diagram and height control upward. Reverse scrolling pops them downward.
- Repair: reserve comparison space, or derive wrapper height and opacity continuously from the same narrative progress. Keep focusability/inert state separate from visual height.
- Regression: sample III→IV and IV→III around global p≈0.66 at 320×700 and 390×844, then sample IV→V and its reverse.

### ER-02 — Required small-screen text reaches 7px

- Priority: high; readability gate.
- Location: `src/style.css`, ≤380px and short-height media rules.
- Cause: model note, chapter label, footer controls and other meaningful UI are reduced to 7px. A geometrically fitting layout can still fail the prompt's explicit prohibition on shrinking text until unreadable.
- Repair: establish a minimum readable size (approximately 10–11px for secondary UI, larger for essential control labels) and adjust the flow, spacing or scrolling container instead.
- Regression: inspect actual 320px screenshots and computed font sizes, including extreme slices that add the empty-section message.

### ER-03 — Immediate navigation can focus an inert heading

- Priority: medium; keyboard/reduced-motion behavior.
- Location: `src/main.ts`, `jump()` and `applyStory()`.
- Cause: immediate Lenis navigation calls `onComplete` before the next ticker's `applyStory()` has made the target chapter visible and removed `inert`. Focusing the target heading can fail, especially from the Index dialog with reduced motion.
- Repair: store pending target focus and apply it after the target chapter becomes active, or synchronously evaluate/apply the target state before focus.
- Regression: reduced-motion Index → each chapter, keyboard activation, check `document.activeElement`; repeat rapid navigation.

### ER-04 — First-paint poster depends on the main JavaScript bundle

- Priority: medium; cold/weak-network fallback gate.
- Location: `src/main.ts` 20–21, `src/posters.ts`, and `index.html`.
- Cause: the small embedded poster is only installed after main JavaScript executes. If the main bundle and large image are delayed together, initial HTML has only a flat background.
- Repair: embed the small data URL and minimal cover style in initial HTML; enhance it when other assets arrive.
- Regression: independently delay JavaScript and full-size media, then inspect the first meaningful frame. Resource-failure tests performed after JS starts do not cover this case.

### ER-05 — Repeated presets destroy the Return condition

- Priority: medium; comparison interaction.
- Location: `src/main.ts`, Reference/Change listeners.
- Cause: both preset buttons overwrite `state.comparison` even when the target preset equals current `u`. Double-clicking Change makes Return restore 0.9 to 0.9 and loses the prior condition.
- Repair: only capture comparison when the target differs from current `u`, or explicitly define Return as the reference state.
- Regression: custom shear → Change → Change → Return; Reference twice → Return.

### ER-06 — Mobile description sentences concatenate

- Priority: low; visible copy.
- Location: `index.html` chapter III/IV descriptions and mobile `br{display:none}` rule.
- Cause: the HTML has no whitespace after the break. Hiding it creates `plane.Discover` and `changes.The`.
- Repair: add real whitespace or use sentence spans with controlled responsive line breaks.
- Regression: inspect visible mobile text in III and IV.

### ER-07 — The detached section fades instead of returning spatially

- Priority: medium; specified motion direction.
- Location: `src/story.ts` (`detach`) and `src/main.ts` `renderDiagram`/`applyStory`.
- Cause: `story.detach` only affects the connector's opacity. The detached SVG stays at its fixed panel coordinates until the whole panel fades. There is no same-path transform back to the cloud plane on IV→V.
- Repair: render one transition copy of the same contour paths in the global SVG, interpolate its diagram-to-plane transform from p, and fade the DOM controls independently.
- Regression: compare the transition's 25/50/75% samples in both directions at unchanged u/h.

## Model scope to state accurately

The scalar density field is genuinely shared between full-cloud observation-plane contours and detached-section contours. The photographic cloud itself uses a horizontal deformation driven by the centerline/rain shifts, and a darkened slice band; its pixels are not generated by the density field. This is an authored 2.5D photographic interpretation, not a volumetric reconstruction. README and final evidence should not claim a full physical volume renderer. A restrained stack of adjacent sampled density sections inside the observation region could strengthen the visible interior without a fluid solver.

## Source-supported strengths

- Scroll ownership is centralized: GSAP drives a single `lenis.raf`, and no second continuous requestAnimationFrame loop is present.
- `u/h` change only through explicit user actions or reset; chapter entry does not overwrite them.
- Reset Storm leaves scroll position alone; Back to Opening retains the condition.
- Plane and detached section reuse identical contour paths and field core coordinates.
- Exact empty extreme slices are handled honestly and offer Find the updraft.
- Local generated assets/font and a dependency lockfile are present; production build result was reported by the owner.
- Reduced motion uses discrete chapter states and stops ambient motion initially.
- Visibility changes clamp elapsed time; page unload releases ticker, event listeners, renderer objects and audio.

## Review limitations

No runtime or screenshot claim is made by this report. Actual browser overlap, frame continuity, performance, context restoration, font delays and clean ZIP build must be verified by the owner's acceptance pass. All findings were sent directly to the owner for integration and regression testing.


---

# SUPERCELL — Independent Art and Motion Design Review

## Evidence and scope

Reviewed the nine actual prototype browser captures:

- `prototype-1440-{hero,act2,act3}.png` — 1440×900.
- `prototype-390-{hero,act2,act3}.png` — 390×844.
- `prototype-320-{hero,act2,act3}.png` — 320×700.

Compared with the actual local desktop/portrait assets and `docs/concepts/airflow.webp`, `section.webp`, `shear.webp`, and `ending.webp`, using `view_image` for both implementation and reference. These screenshots precede the owner's ongoing readability, focus, cold-poster and control-layout repairs. This review does not certify those later repairs. Static frames establish composition and contrast, not temporal smoothness; motion findings are explicitly identified as source-backed hypotheses where appropriate.

## Overall assessment

The photographic direction is coherent and strong. The desktop hero conveys a large, weighty storm, while the independent portrait image gives phones a convincing upward scale. The warm cloud tops, slate base, low prairie and restrained type belong to the same visual world. The hero does not look like a dashboard or a generic marketing template.

**Act III is the weakest captured scene.** On phones its heading becomes unreadable over the brightest cloud. Its scientific layer is also visually much lighter and less informative than the chosen section reference. Fixing these two issues has more value than adding more decoration or additional chapters.

## Findings and specific repairs

### AR-01 — Mobile section copy disappears into white cloud

- Priority: blocking for visual acceptance.
- Evidence: `prototype-390-act3.png` and `prototype-320-act3.png`, upper reading zone.
- Observation: the white heading and explanation lie directly over luminous white cloud folds. Words in the second heading line and the body disappear locally despite fitting inside their boxes. This is a contrast and image-placement failure, not just a font-size issue.
- Repair: give III/IV a deliberate, localized top text-safe treatment. A restrained slate gradient behind the copy region, blending out below it, is preferable to a heavy full-screen wash. An alternative is a coordinated camera/text adjustment that creates consistently darker negative space. Keep the main cloud luminous outside this reading zone.
- Regression: inspect both mobile sizes at reference shear and at both shear extremes; check 125/150/200% representative enlargement. A single crop at reference state is insufficient.

### AR-02 — Mobile inflow line runs through the narrative

- Priority: high.
- Evidence: both mobile act-II frames. At 390px the diagonal inflow crosses the descriptive copy; at 320px it also approaches/cuts the right end of “Nothing here.”
- Observation: the line competes with words and looks accidentally overprinted. The same path is well separated from the desktop heading.
- Repair: preserve the geometric trajectory but mask the SVG behind the actual text-safe bounding region, with a small breathing margin; alternatively route the lower projected path farther right through a coordinated mobile scene adjustment. Do not move only a label while leaving the line over the text.
- Regression: all act-II stable and I→II transition samples on 320/360/390px, including reverse scrolling.

### AR-03 — The detached section lacks readable density mass

- Priority: high for the first interactive climax.
- Evidence: `prototype-1440-act3.png` versus `docs/concepts/section.webp`; same issue at smaller scale on phones.
- Observation: the implementation shows thin nested loops and two dots. The reference makes cloud density and the warm updraft/cool precipitation relationship legible as connected material. The current wire-only version reads as a small chart placed over a photograph rather than a substantial change in how the cloud is seen.
- Repair: add a restrained low-opacity density fill beneath the contours using the same scalar samples. Keep the updraft warm wheat and the precipitation cool neutral; do not introduce a rainbow, glow or opaque card. Use the current shared geometry rather than a second illustrative shape.
- Regression: default h, low/high h, empty h and changing u. Ensure fill and line contours remain registered.

### AR-04 — The full-cloud plane reads as a long physical shelf

- Priority: medium.
- Evidence: desktop act III, around y≈425. Multiple flattened contours extend almost to the right edge.
- Observation: the extremely compressed ellipse stack forms a long hard horizontal rail across the photograph. It is more prominent than the detached section and suggests a solid platform, whereas the reference emphasizes a fine observation cut through cloud.
- Repair: reduce outer-plane contour opacity/weight and retain the accurate cut line/core as primary. Consider clipping secondary plane detail to the visually relevant cloud region while preserving shared coordinates. The detached sample should carry the explanatory detail.
- Regression: selected heights near the base, middle and anvil; ensure the plane remains recognizable without becoming a rigid object.

### AR-05 — Outflow intrudes into header territory

- Priority: medium.
- Evidence: desktop act II around y≈70; phone act II around y≈60.
- Observation: the almost-horizontal final branch sits immediately below/along the header, becoming visually similar to a navigation divider. It has too little air around it and reduces the apparent height of the anvil.
- Repair: lower the final branch toward the anvil's interior, approximately authored model height h≈0.84–0.86, while preserving the coherent shared flow path. Recheck the exact resulting camera projection instead of using those values as a universal meteorological number.
- Regression: all three captured viewport families and reverse first handoff; no line/header collision.

### AR-06 — Header descriptor has inconsistent contrast

- Priority: medium-low.
- Evidence: desktop frames, centered “The shape of moving air” over the brightest cloud top. Phone wordmark also crosses a light cloud edge in some states.
- Observation: the center descriptor is barely readable and adds a fourth competing header element without helping navigation. Other header elements over blue sky are clearer.
- Repair: remove/reposition the optional centered descriptor or give header text a restrained local contrast treatment. Preserve the clean small mark, title and Index control.
- Regression: first frame and all stable chapter frames after camera movement.

## Motion-specific notes

These points are not claims of having watched a video:

- The source-driven mobile shear-row insertion previously identified in ER-01 would produce a one-frame vertical layout shift. The owner is now replacing it with continuous progress-based layout; review new 0/25/50/75/100% boundary frames to verify the change.
- The initial implementation only faded the detached section rather than spatially returning it to the cloud. A transition copy of the same contour paths, interpolated from the detached diagram transform to the cloud-plane transform, would preserve the brief's cause-and-effect direction.
- Keep the cloud and horizon as uninterrupted visual anchors. The current stills successfully retain them across I/II/III; do not sacrifice that strength while adding the density treatment.

## Fidelity points that already work

1. Desktop full-bleed photographic composition uses the selected low-horizon asset with preserved side light and rain separation.
2. Phone hero is an independent vertical composition; the tower is recognizable rather than an arbitrary desktop crop.
3. Main hero type is real, restrained sans serif and fits without accidental clipping at 320 and 390px.
4. Navigation and thin line controls share a restrained visual language; no card grid or cockpit styling has appeared.
5. Palette remains ivory/slate/wheat across captured scenes, preserving identity.
6. The dark lower cloud provides a good reading zone in the hero and most of act II.
7. Same-cloud continuity remains visually clear across the three desktop scenes.

## Next review gate

Inspect revised mobile III/IV first, then the revised airflow safe zones and section density treatment. Finally inspect actual IV/V frames and all boundary samples. Do not claim complete motion fidelity from the nine static prototype images alone.

---

## Post-fix acceptance review

This section supersedes the prototype's open visual findings for the states actually inspected below. The earlier findings remain as a record of what was repaired. This reviewer did not modify production files or run a browser/server. The owner supplied the actual local-browser captures; this reviewer opened them with `view_image` and assessed their rendered appearance.

### Evidence inspected after repair

- `acceptance/360x640-act4.jpg`: the shortest requested phone comparison composition.
- `acceptance/390x844-act3.jpg`: the formerly unreadable section heading/body and revised section treatment.
- `acceptance/320x700-act2.jpg`: the narrow airflow reading zone and header separation.
- `acceptance/1440x900-act{1,3,4}.jpg`: hero, section and comparison compositions.
- `acceptance/{320x700,360x640,390x844,768x1024,1440x900,1920x1080,2560x1440,3840x2160}-act5.jpg`: all eight ending sizes, opened individually or in small batches. The large files were inspected through the image viewer's fitted rendering, not a claim of native 4K photographic detail.
- `acceptance/handoff-390-3-forward-{25,50,75}.jpg`: three III→IV intermediate compositions.
- `acceptance/handoff-1440-4-forward-50.jpg`: IV→V midpoint composition.
- Reopened `docs/concepts/section.webp` and `docs/concepts/shear.webp`; compared with the previously inspected final desktop/portrait assets, airflow concept and ending concept, and the recorded decisions in `docs/VISUAL_BIBLE.md`.

### Disposition of original art findings

| Finding | Post-fix result | Visible evidence and limit |
| --- | --- | --- |
| AR-01: white text over bright phone cloud | **Pass** | The localized slate treatment makes both heading and body readable in 390×844 III and 360×640 IV. The middle cloud remains luminous. The darkened upper reading region is now an intentional composition, not a blank overlay. This judgment covers the captured states, not every possible shader frame. |
| AR-02: airflow through narrative | **Pass** | In 320×700 II the flow no longer intersects the heading or body. The lower part of the flow is masked around the reading area; its vertical rise and upper exit remain understandable. That limited loss of line visibility is an acceptable narrow-screen tradeoff. |
| AR-03: detached section lacks density mass | **Pass with acknowledged reference deviation** | The warm updraft and cool precipitation regions now have sampled density beneath the contours, making their relationship easier to read. It remains more restrained and smaller than the concept's broad filled illustration, consistent with the documented decision to avoid a glowing diagnostic display. |
| AR-04: whole-cloud plane looks like a shelf | **Pass** | The reduced contour weight leaves the fine cut line and selected point dominant. Faint flattened contours remain visible, but no longer overpower the storm or the detached section in the inspected desktop states. |
| AR-05: outflow occupies header | **Pass** | In the narrow airflow capture, the exit runs inside the upper cloud with clear separation from the brand and Index. |
| AR-06: optional descriptor loses contrast | **Pass** | The unnecessary centered descriptor is absent from the revised desktop scenes. The smaller brand and Index preserve the restrained header. |

### Art fidelity ledger

| Comparison point | Selected reference or direction | Actual rendered outcome | Status |
| --- | --- | --- | --- |
| Primary composition and scale | Hero A: low prairie horizon, broad leftward anvil, tower and rain to the right | The 1440 hero and all desktop endings retain the ground observer's scale and the same recognizable storm. The headline occupies the quieter lower atmosphere. | **Pass** |
| Phone composition | Independent portrait tower, partial anvil, low ground | Phone III/IV and all three phone endings retain the upward tower and rain. The portrait feels composed for the narrow frame rather than a mechanically clipped landscape. | **Pass** |
| Image material and light | Warm ivory illumination, slate base, photographic cloud structure, no neon shell | Cloud texture, side light, rain separation and the muted field remain coherent. The added reading scrim changes local exposure but preserves the storm's material. | **Pass** |
| Typography and hierarchy | Real sans-serif type, large restrained statements, rejection of the shear concept's serif lettering | Revised headings, body text, controls and end actions consistently use the selected sans-serif language. The 320 ending holds its two-line statement and three actions without clipping. | **Pass** |
| Airflow gesture and labels | One entering/rising/exiting path and no more than three explanatory labels | The narrow act-II capture retains one legible path and three labels. The line respects the narrative safe region and no longer looks like a header divider. | **Pass** |
| Section correspondence and density | Fine observation cut plus related warm/cool section in a separate reading area | The full-cloud point and detached section are visibly related; density and contour layers make the two regions legible. The exact analytic identity is a source/interaction test rather than something a still alone proves. | **Pass for appearance** |
| Integrated wind comparison | Same cloud/camera/light; condition controls share the section's reading region | Desktop IV and 360×640 IV retain the section and present wind choices in the same area, without an added card or dashboard. The mobile height value remains visible while the wind control takes the available height. | **Pass for stable composition** |
| III→IV handoff | Retain the observation layer and user height while the explanation changes | At 25/50/75%, the plane stays at the same apparent height, the old words clear before new words dominate, and the control area reallocates height progressively. | **Pass for sampled frames; temporal smoothness requires the owner's motion test** |
| IV→V return | Explanatory section returns toward the cloud before the ending becomes primary | The inspected midpoint shows the section flattened and moved toward the observation plane, with ending copy not yet competing. It is visibly more faithful than a stationary fade. | **Pass for inspected midpoint; full motion not certified here** |
| Ending | Same retained storm, generous statement, understated revisit/reset/source actions | All eight ending sizes preserve the same visual identity. The statement and actions have space, controls are absent, and the horizon remains a quiet anchor. | **Pass** |

### Weakest scene after repair

**Act IV at 360×640 is now the weakest composition by relative density, but it passes visual acceptance.** It must accommodate the heading, explanation, section, legend, retained height, wind slider, three comparison choices, two utilities and model note in 640 pixels. The result is necessarily tighter and its section looks smaller than the generous desktop concept. In the actual capture, these elements remain separated, readable and inside the viewport. The cloud is still recognizable, so there is no remaining art blocker that justifies another layout rewrite.

Act III is no longer the weakest scene: its repaired contrast and density treatment give the first interactive explanation a clear hierarchy. Hero and ending remain the strongest scenes.

### Remaining limits and final art verdict

**No remaining blocking visual defect was found in the post-fix states listed above.** The visual pass is limited to those inspected stills. This review does not certify every frame, frame rate, input behavior, touch hardware, screen-reader output, contrast ratios at all parameters, or native 4K texture detail. The owner's browser acceptance results are the appropriate evidence for state retention, reverse and fast movement, resource failure, focus, and temporal behavior.

Keep the implementation description accurate: the photographic cloud is an authored 2.5D interpretation connected to the analytic section, not a recovered atmospheric volume or physical fluid simulation. That scope limitation does not prevent the observed art direction from passing.


---

# SUPERCELL — model and medium review

Review date: 2026-10-24. Scope: `src/field.ts`, `src/volume.ts`, `src/weather.ts`, `src/main.ts`, their scene-state integration, and the medium descriptions in README/source notes. This is a source-level model audit; it does not replace the owner's browser/visual acceptance run.

## Conclusion

The shared `h/u` chain is coherent. The observation plane, detached contours, density raster, structure texture and explanatory locations use the same authored field and current condition. The main visual is accurately described as **2.5D photographic projection plus a three-dimensional illustrative density field**. It is not a fluid simulation, measured density scan, or photogrammetric reconstruction.

One visible causal link needs a small completion: in chapter IV the condition changes the computed airflow, but that airflow is no longer drawn. A single short direction cue inside the existing section can complete the comparison without adding another panel or returning the entire chapter-II diagram.

## Checked relationships

| Relationship | Source evidence and assessment |
| --- | --- |
| State ownership | `main.ts` owns one `state.h` and `state.u`. Native inputs, step buttons, Find the updraft and explicit reset are the writers. Chapter evaluation does not overwrite those values. Reset does not move narrative progress. |
| Whole-plane / detached section | `updateContours()` calls `contourSegments(state.h,state.u)` once and assigns identical path markup to `section-contours`, `plane-contours` and `travel-plane`. Their different transforms change display placement, not the sampled section. |
| Density raster | The section's colored raster calls `sampleSlice(state.h,state.u)`. Its warm/cool emphasis follows `cloudCenter` and `rainCenter`; opacity is the shared density. It is a display convention rather than a measured physical variable. |
| Plane and markers | `weather.project()` applies `heightToY(h)` and the same view transform to the full-cloud plane and model centers. The section uses `sectionPoint()` for those same centers. Updraft markers disappear when the height misses the modeled main updraft. |
| Structural projection | `buildProjectedDensity(u)` integrates the original `density()` through depth. `weather.ts` samples this already-deformed field at canonical display coordinates before the photograph's inverse warp, avoiding a second application of shear. The selected observation band uses the same current height. |
| Photographic deformation | The shader imports `DEFORMATION_GLSL`; Canvas fallback imports `deformation()`. Both share the same centerline/rain-shift coefficients as the field. The photo is an artistic skin, so its fine texture and exact silhouette are not asserted to be density-derived. |
| Portrait mapping | `referenceUV()` and `project()` use inverse horizontal mappings for the portrait view. This maintains model annotation correspondence. The portrait is independently generated artwork, not a calibrated alternate camera of a real storm; the Visual Bible states this limitation. |
| Reversal and persistence | Geometry is recomputed from current progress and retained values, not accumulated enter/leave effects. Session storage preserves only the user condition/height. The reduced-motion path changes observation position, not user parameters. |
| Scientific scope | README explicitly says 2.5D, authored normalized controls, no physical solver, no measured reconstruction, no live weather/forecast. The on-page source notes likewise identify generated photographs and calculated illustrations. No measured altitude, wind speed or danger level is invented. |

## Finding M1 — airflow changes are not visible during the wind comparison

**Location:** `story.ts` defines `flow` to fade out by progress `.47`; `main.ts` draws the long airflow path only while this value is nonzero. Chapter IV's control is active much later. `flowPoint(t,u)` does change with the condition, but the user cannot observe that response while moving the wind control.

**Consequence:** cloud tilt and precipitation displacement are visible, but the brief's third simultaneous effect—flow direction—is currently implicit. This is a presentation gap, not a disagreement between two independent models.

**Smallest correction:** add one short SVG tangent arrow inside the existing horizontal section. Find the first ascending crossing of the selected height on `flowPoint(t,u)`, evaluate neighboring points, and use their horizontal `x/z` tangent. Position it at that intersection. Convert the canonical tangent into the existing 400×220 section coordinate system before normalizing its visual length. A constant display length conveys direction without suggesting a measured speed. Hide it where `updraftExists(h)` is false; do not alter `h` to make it appear. No new panel, control or full-screen animation is needed.

**Source-level check:** at model height `.42`, the horizontal direction obtained from the existing path changes from approximately −147.7° at `u=0`, through −132.3° at `u=.5`, to −35.7° at `u=1`, after the section's 400×220 display scaling. These are diagnostic drawing angles, not meteorological bearings and must not be exposed as physical measurements. The shown rotation is one authored illustration, not a global meteorological rule.

**Disposition:** owner accepted this correction. The pure `sectionFlow(h,u)` helper is implemented and its two added tests pass: finite deterministic intersections on the original path, correct missing-updraft behavior, and actual position/direction changes with shear. The field suite now passes 8/8 and TypeScript checking passes. The owner will integrate the arrow and perform the visible regression check. This report does not claim that the browser correction has passed before that evidence exists.

## Limits that should remain explicit

- The photograph's complete outline is not a ray-marched density isosurface. The shared density supplies section structure and projected explanatory shading; the photograph supplies atmospheric appearance.
- The projection uses authored coordinates and a constrained view, not a freely orbitable 3D reconstruction.
- The field's intensity, shear and height are dimensionless model parameters. Contour colors do not encode hazard, measured temperature or wind speed.
- No broader redesign or additional scientific controls are needed for this final correction.


---

## Final model direction correction

The section-flow helper was connected to a short SVG arrow in the existing illustrated section. A real browser regression verified that selecting Change alters its actual SVG path at the retained height; an empty upper/lower section hides it. The arrow is a constant display-length direction indicator, not a measured wind speed. This closes the model reviewer’s M1 integration finding. Final production matrix results take precedence over earlier review snapshots.
