# MAGMA — Visual Bible

## The visual thesis

**Darkness holding internal fire.** The surface leads the narrative: an opaque, heavy body contains an energy that is visible only where that surface yields. The experience opens at monumental scale, moves through folds and skins, becomes a study of reflection and curved fracture, then returns to the first body without its light.

This is an original digital sculpture, informed by geological observation. The succession of images is a comparison across material states and cooling histories. It is not a measured reconstruction of one sample becoming basalt, obsidian and basalt in succession.

## Look development and selection

The work began with generated concepts and material studies, before application implementation. The first hero was rejected: its peaked silhouette resembled a mountain and its bright external light made the stone too grey. Revision 2 replaced it with a blunt, massive monolith, concentrated light inside a narrow winding seam, and kept a legible black silhouette. A separate production pass removed UI from the selected concept while retaining its overall composition.

The first folded molten study was curated for FLOW because its thick, partly cooled ropes were more appropriate there. A distinct MOLTEN plate preserves the viscous luminous material beneath a thinner skin. CRACK was regenerated with less external fill and narrower hot spots. The cold states introduce smooth conchoidal surfaces and then granular basalt with sparse mineral inclusions, giving black multiple distinct material identities.

Real mobile browser inspection prompted a second composition pass for FLOW, GLASS and STONE. Their desktop-derived crops placed busy texture or bright reflection behind the narrow-screen copy. Dedicated portrait generation moved the material into the right and lower portions while reserving quiet black space for the header, title and supporting lines. A targeted second FLOW edit was rejected because it changed texture without materially improving the copy margin; the first portrait was selected after comparison.

Selected concept references: [Pressure](../../provenance/magma/concepts/pressure.webp), [Skin](../../provenance/magma/concepts/skin.webp), [Glass](../../provenance/magma/concepts/glass.webp), [Mobile opening](../../provenance/magma/concepts/mobile.webp). They are design references, not flattened website UI. All visible website text and controls are semantic HTML.

## Black, heat and weight

| Role | Color / material | Use |
| --- | --- | --- |
| Backdrop | `#080909` | Near-black continuous space; no colored page wash. |
| Primary type | `#e9e7e2` | Mineral white; large display and clear small controls. |
| Secondary type | `#b7b5b0` | Readable quieter copy, never nearly black on black. |
| Structure | `#454644` | Very limited navigation rails and rules. |
| Interior energy | Ember red → orange → tiny pale cores | Confined to actual fissures and molten folds. |
| Cold reflection | Neutral ash / silver | Selected glass faces and sparse bright mineral facets; keep the black body opaque and heavy. |

The molten shader does not turn the whole image orange. Camera displacement is measured in a few percent of the frame. There are no particle showers, orbit controls, explosions, screen shakes or perpetual animated noise. Surface changes have coherent directions.

A local cooldown correction attenuates the small near-white incandescent core through the residual-heat mask, so it fades with the warm seam instead of lingering as a pale hot spot. The correction belongs to that emissive feature. It is an authored image-compositing treatment, not a calibrated thermal-material model.

## Typography and interface

Self-hosted **Archivo Variable**, weights 300–850. The hero uses a massive, dense architectural word; other titles are lighter and more open. Tracking is no tighter than **−0.04em**. UI text is deliberately small but legible. The desktop masthead/root gutter is `clamp(28px, 2.4vw, 100px)` and the scene gutter is `5vw`; mobile uses 22px and 24px respectively. The object occupies a full viewport without a decorative card or frame.

The header contains only the wordmark, Index and Sound. A quiet chapter rail appears after the opening. Each state has a chapter identifier and, when appropriate, a contextual action. The Index is a spacious typographic list. Settings and material context live there rather than in the opening composition.

## Nine authored scenes

| State | Plate | Composition and purpose | Material change and handoff |
| --- | --- | --- | --- |
| 01 PRESSURE | [pressure.webp](../../public/magma/materials/pressure.webp) | Huge blunt black body. MAGMA low and left. One descending internal seam. | Very small pressure pulse; controlled inward movement toward the seam. |
| 02 MOLTEN | [molten.webp](../../public/magma/materials/molten.webp) | Viscous folds fill right and center; short text occupies lower-left darkness. | Local hot regions move slowly while the cold skin stays anchored. |
| 03 FLOW | [flow.webp](../../public/magma/materials/flow.webp) | The seam becomes a route through heavy ropes of material. Text moves to the upper left. | Directional advection with resistance; the cooling front begins to take over. |
| 04 SKIN | [skin.webp](../../public/magma/materials/skin.webp) | Diagonal boundary between rough dark shell and still-folded skin. | Crust coverage grows separately from interior heat. Hold to cool advances the front. |
| 05 CRACK | [crack.webp](../../public/magma/materials/crack.webp) | A near-flat field is divided by one narrow vertical fissure; headline composition acknowledges the split. | Authored contraction separates independent surface meshes. A short interval reveals inner light. |
| 06 GLASS | [glass.webp](../../public/magma/materials/glass.webp) | Left text, large black obsidian on right. No orange glow. | Another cooling history: moving reflection replaces emission; pointer / touch adjusts light. |
| 07 FRACTURE | [fracture.webp](../../public/magma/materials/fracture.webp) | Curved scooped faces dominate above and right; quiet text below-left. | Shallow curved surface geometry and split edges reveal the shape left by a break. |
| 08 CRYSTAL · STONE | [stone.webp](../../public/magma/materials/stone.webp) | Granular basalt and sparse mineral inclusions replace glossy faces. | Comparative crystalline groundmass holds its structure. A restrained cool reflection slowly crosses selected bright facets during the normal living hold; heat remains absent. |
| 09 SEALED | [sealed.webp](../../public/magma/materials/sealed.webp) | Return to the original black monolith and its now sealed scar. | A final registered blend extinguishes the remaining light, including the small pale core. Continued scrolling then withdraws the ending title. At the end emission and autonomous motion are exactly zero. |

## Scene lifecycle

**Enter → Stable composition → Living hold → Handoff → Exit.** Each chapter has a stable readable composition before it transforms. Hot chapters retain local heat and tiny material movement during a hold. Cold chapters use restrained changes in reflected light. There is no repeated whole-image bobbing. The ending is the deliberate exception: still means still.

STONE uses a **64-second animation cycle** to move a small cool reflection across the plate's existing bright mineral facets. The black field, dark surface and silhouette remain stable. This authored reflection adds no texture sample. Reduced motion and the completed SEALED state bypass the effect. Fixed-position WebGL comparisons verified the small change in normal motion and zero change against the previous shader in those inactive states; see [ACCEPTANCE.md](ACCEPTANCE.md) for the test scope.

The final chapter has a quiet outro: the residual light disappears first, then further scrolling carries the title out of the composition. The black object remains. This title exit follows the visitor’s scroll and does not restart autonomous motion in the sealed material.

One scroll position determines both the material and the text state. Lenis is the sole authority for smooth scrolling; no second scroll interpolation or CSS smooth-scrolling competes with it. The camera's apparent weight comes from restrained movement and progressive material response.

## Mobile and access

The nine states are retained. Five scenes use dedicated portrait artwork; four retain smaller desktop-derived mobile variants. The compositions and text placement are designed together. A bounded pixel budget, simpler surface meshes and the smaller variants for the remaining scenes limit GPU cost. Native touch scrolling remains native. Reduced motion disables autonomous movement and uses immediate navigation while retaining user-directed cooling and fracture controls. A static image path keeps the material story available if WebGL is unavailable or lost. All sound is optional and starts off.

The mobile FLOW and STONE supporting lines sit with the main copy in the upper negative space. STONE limits the whisper measure to **23ch** and uses an **18% first grid row at widths of 360px or below**. The complete two-line whisper was inspected on black at 390 × 844 and 320 × 740. Tablet GLASS coordinates the text layout with the reflective object. Input instructions follow **`(pointer: coarse)`**, so touch guidance follows the primary input type.

Both main nine-scene and dialog capture sets, and all supplemental captures, have been opened for inspection. The same independent reviewer marked all five scored fixes resolved and returned **`ship`**, with that verdict explicitly limited to those fixes. The last STONE layout correction has its own normal-motion WebGL regression at the two phone sizes. [ACCEPTANCE.md](ACCEPTANCE.md) records this bounded evidence and the untested device environments; it makes no universal visual or hardware certification claim.

| Mobile plate | Actual dimensions | Composition |
| --- | --- | --- |
| PRESSURE / SEALED | 853 × 1844 each | Matching portrait studies derived from the selected mobile concept. |
| FLOW | 853 × 1844 | Massive folds along the right and lower half; dark upper-left copy space. |
| GLASS | 853 × 1844 | Near-complete obsidian form in the lower half; reflected bands stay below the copy. |
| CRYSTAL · STONE | 830 × 1896 | Dense granular basalt slope in the lower half, with small mineral inclusions and quiet black space above. |
| MOLTEN / SKIN / CRACK / FRACTURE | 960 × 540 each | Retained downsampled desktop plates with mobile framing. |

The three portraits added after mobile QA were encoded as WebP with sharp at quality 91, effort 6, without resizing. Their replaced 960 × 540 versions are recorded in the provenance history and omitted from the package. The delivered raster set remains four full-frame concepts, nine desktop plates and nine mobile plates.

## Medium and accuracy

AI key visuals supply geological detail. Custom WebGL shading controls molten motion, crust growth, emission, cooling and moving glass reflection. Independent generated meshes supply actual fracture geometry. These are directed visual systems, not a computational fluid dynamics or stress simulation. The package contains 22 final WebP assets, 22 matching `.webp.json` prompt sidecars and complete central prompt records; source PNGs, rejected renders and replaced mobile files remain outside the deliverable. Prompt provenance does not modify the image pixels. See [RESEARCH.md](RESEARCH.md) for factual boundaries and [PROVENANCE.md](PROVENANCE.md) for asset history.
