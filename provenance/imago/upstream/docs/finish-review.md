disposition: fix

Inputs not supplied: a separate QUALITY BAR card or decision-reference comp. This is a code-led build under the user's pinned Visual Bible, so an approved whole-UI comp and comp-diff files are not applicable. Review is from saved browser pixels and sampled source; continuous motion, every provenance entry, and runtime behavior were not independently retested.

## persistence

**Pass.** `PRODUCT.md`, `docs/surface.md`, and `DESIGN.md` exist and describe the implemented natural-history world. The explicit user-pinned direction and three required Hero candidates justify the recorded non-random FORM; no invented seed or retrospective comp approval is required.

The required evidence packet is present and valid: desktop/mobile Hero, the native full-page capture from the document top, ten chapter crops, eight named mobile entry/body captures, and all 45 transition frames inspected through the nine actual-browser contact sheets. The 1363×852 desktop raster dimensions are explained by `evidence/transition-captures.json` as fit-scaled captures of a 1440×900 CSS iframe. The full-page raster is 1348×23446, consistent with its separately recorded native viewport. No required capture is black, empty, or of the wrong section.

The supplied detector contains 97 advisory findings: 82 type-ramp and 15 palette-documentation findings, with no non-advisory findings. No second detector was run. Functional checkpoint counts do not determine the visual disposition below.

**Additional required-viewport evidence:** after the initial review, `evidence/hero-3840x2160.jpg` was supplied as a real 3840×2160 CSS viewport captured at 1363×767 display pixels. It is valid evidence of an actual rendering defect: the Hero title and foreground leaf remain, but the chrysalis and branch are absent. This adds the bounded sixth finding below; it does not reopen unrelated parts of the review.

## fidelity

| Salient element / promise | State | Evidence and judgment |
| --- | --- | --- |
| TYPE | Match | The saved Hero and chapter captures use the high-contrast Cormorant Garamond display voice and restrained Inter observations described by the brief and OWN-WORLD. The hierarchy remains readable in the supplied mobile views. |
| MATERIAL | Match, with localized contradictions below | Actual macro raster imagery carries the focal material. The opaque green covering, bark, leaf texture, shed skin, and matte orange wings are visible; generated art is not presented as a screenshot or measured specimen. The Hero does not require a material rebuild. |
| GROUND | Match | The chapter-three reading field samples RGB 239/237/225, exactly the named `#EFEDE1`. The chapter-two dark field samples 22/62/53 in JPEG, consistent with the named `#173E34` and its source CSS. The light photographic backgrounds are part of the artwork rather than an unexplained page-field drift. |
| THESIS and first-viewport memory | Match | One complete hanging chrysalis dominates the desktop first view, with attachment and tail visible. The independent portrait arrangement preserves the subject above readable DOM text. The remembered object is an animal attached to a twig, not an isolated product ornament. |
| Hero at 3840×2160 | Contradicted | `evidence/hero-3840x2160.jpg` has no chrysalis or branch. At `min-width:2500px`, the rule `.hero-art picture>img,.hero-layers img{object-fit:contain;background:#eee9de}` gives every alpha image an opaque CSS background; the final foreground image consequently covers the subject layer. The inspected source subject/foreground WebPs retain alpha, so this is layer composition rather than an asset-generation failure. The original image's separately reported failure is not necessary to explain the occlusion. |
| Ten chapters and two-beat structure | Match in structure | All ten sections and their observation tools are present in `src/content.ts`; the full-page and chapter crops preserve the back half of the story. CH04's second beat is visually damaged by the crop defect below. |
| CH04 instar comparison | Contradicted | `evidence/chapters/chapter-04-native.jpg` and `evidence/mobile-chapter-04-body.jpg` show parts of adjacent specimens under instars II–IV, and some rows cut away the upper body/filaments. The source sheet has unequal row spacing; a uniform 20% translation cannot isolate it. |
| CH10 scale, support, and identity | Contradicted | `evidence/chapters/chapter-10-native.jpg` shows an adult with a wingspan smaller than the shell's height, whereas CH09 establishes a much larger adult relative to its shell. The alpha flight asset has no raised gripping legs, so the resting state reads as a small unsupported butterfly placed over the shell. This violates the explicit same-object scale and support requirements. |
| TR01–02 shared spatial anchor | Missing | `evidence/transitions/desktop-01-02-050.jpg` contains only the egg/leaf composition. The contact sheet changes from chrysalis/twig to leaf/egg without the promised midpoint in which twig and petiole share a legible direction and the egg-bearing leaf has already appeared. The retrospective caption is correct but does not supply that visual relationship. |
| TR05–06 / TR06–07 schematic handover | Missing | The two contact sheets contain only a green/late pupa and prose. TR05–06 never establishes the required real exterior beside a labeled developmental schematic; TR06–07 never carries the abstract wing outline into correspondence with the visible wing pattern. `handoffFrames` and `handoff-schematic-note` in `src/content.ts` confirm that the diagram has been replaced by captions in these boundaries. |
| Remaining matched stage handovers | Adaptation | The brief explicitly permits verified matched stills when continuous morphology is unreliable. TR02–03, TR03–04, TR04–05, TR07–08, and TR08–09 keep readable stage relationships and time labels; TR07–08's four emergence stages keep a single body and visible support rather than translucent duplicate animals. This acceptance is for the saved states, not a continuous-motion verdict. |
| STORY / scientific truth | Match except the ending contradiction | English DOM copy identifies artistic reconstructions, distinguishes a pupa from a cocoon, labels the internal diagram as schematic, separates early hatchling and later striped larva, and explains that observation controls do not mature the animal. The late shell retains a surface rather than becoming glass. |
| Craft floor: repeated above-heading categories | Contradicted | `chapterHead()` renders an above-heading eyebrow on CH02–10, visible in every chapter crop. The sequence numbers convey useful order and may remain; the additional category-label eyebrow treatment is the floor's expressly refused pattern, not a requirement of the pinned brief. |

## ceiling

The remaining unused devices are already specified by the brief: a photographic twig-to-leaf spatial bridge and a clearly bounded schematic-to-visible-pattern handover. Complete those devices and the two local image corrections. No additional ornament, extra motion system, or general layout redesign is requested. A separate QUALITY BAR card was not available for an additional comparison.

## material_fixes

1. **P1 — CH10, support and scale (THESIS / explicit object continuity):** produce a resting ending raster, or a supported-adult raster matte, that preserves CH09's adult-to-shell proportion and shows its feet actually gripping the same shell; use the existing flight alpha only once departure begins, since scaling it cannot create support. Preserve the complete empty-shell final view and explicit leave/final/reset actions. Location: `src/content.ts` ending scene, `src/style.css` `.departure-butterfly`, `src/widgets.ts` departure states. **Recapture:** CH10 resting, completed departure, and reset at desktop and 390×844; also TR09–10 at 50% if its shared art or rules change.
2. **P1 — TR05–06 and TR06–07, missing diagram-to-surface bridge (STORY / transition table):** carry a real DOM/SVG schematic region beside the exterior by the middle of TR05–06, clearly label it as developmental and not measured internal imagery, then retain/reduce the abstract wing outline as a side annotation while the real late pattern becomes visible in TR06–07. Replace the prose-over-photo surrogate; do not imply that schematic lines are photographed organs. Location: `src/content.ts` `handoff()` and corresponding handoff layout/state rules. **Recapture:** overwrite both five-frame desktop transition sets, plus each boundary's midpoint at 390×844 and the CH06 schematic state.
3. **P1 — TR01–02, missing shared anchor (FIRST VIEWPORT / first-scroll contract):** produce a photographic bridge raster or a physically coherent photographic composite in which the twig/petiole direction connects the outgoing suspension setting to the incoming egg-bearing leaf; use it at the midpoint with the existing explicit “earlier” cue. Preserve the stable Hero and separate egg identity. Location: `handoffFrames[0]` and its image framing. **Recapture:** overwrite TR01–02's five desktop frames and capture its mobile midpoint, with both anchor elements and the egg-bearing leaf visible.
4. **P1 — CH04, incomplete instar pictures (second content beat / mobile equivalence):** isolate each specimen using its actual source-row bounds, preserve its complete head, tail, and filaments, and contain that row without neighboring-specimen fragments; retain all five titles and the schematic-size qualification. The existing source sheet can supply this repair without replacing its art. Location: `src/style.css` `.instar-row` and `src/content.ts` instar gallery. **Recapture:** overwrite `evidence/chapters/chapter-04-native.jpg` and `evidence/mobile-chapter-04-body.jpg`, adding a lower mobile view that includes instars IV and V.
5. **P2 — CH02–10, repeated category eyebrows (craft floor):** remove the above-heading category-label treatment in `chapterHead()`; retain useful sequence numbers beside the heading or in the existing chapter navigation/current-stage UI, and preserve any biological stage information in normal explanatory copy or navigation. **Recapture:** one desktop and one mobile chapter entrance using the shared component, and the CH08 title/image overlap view to confirm the spacing change introduces no collision.
6. **P1 — wide Hero, opaque backgrounds on alpha layers (FIRST VIEWPORT / required wide-screen composition):** put the cream field on the Hero stage or opaque base only, and keep the subject/foreground image backgrounds transparent at every breakpoint. Preserve the atomic upgrade to decoded layers and a complete static Hero when that upgrade is unavailable; do not answer this by suppressing the subject layer or omitting the wide viewport. Location: the `min-width:2500px` Hero rules in `src/style.css`, with the existing layer/fallback logic checked only as needed. **Recapture:** overwrite `evidence/hero-3840x2160.jpg` and supply the 2560×1440 Hero after the fixed build, showing the complete attachment, branch, chrysalis, and lower tip. This newly discovered P1 belongs ahead of the P2 cleanup in implementation priority; numbering stays stable for the six-item verdict.

## keep

Keep the complete desktop and independent portrait Hero, opaque biological material, restrained serif/sans hierarchy, bone/leaf/jade palette, explicit temporal and schematic labels, all ten chapters, all observation controls, and the matched single-body emergence sequence intact while making this bounded batch.

---

## verdict

Post-fix scoring, 2026-11-09. The replacement captures are valid; this pass scores the six original findings and regressions introduced by that batch only. No detector or runtime edits were performed. This is a composition/recorded-state verdict, not continuous-motion certification.

1. **Resolved — CH10 support and scale.** The updated `evidence/chapters/chapter-10-native.jpg` shows a complete adult gripping the shell with visible supporting legs at a credible, much larger relative scale. The six `ending-{desktop,mobile}-{resting,completed,reset}-release.jpg` captures show supported rest, the empty-shell result, and restoration of the resting state. The native chapter crop supplies the complete desktop scene where an individual viewport shows only part of its height.
2. **Resolved — TR05–06 / TR06–07 schematic bridge.** The overwritten five-frame contact sheets and the two mobile midpoint captures now show an exterior alongside a labeled developmental schematic, followed by an abstract wing outline beside the actual late-stage pattern. The CH06 schematic capture preserves the explanatory relationship. The diagram is visually separate from the photographic subject and expressly identified as not measured internal imagery.
3. **Resolved — TR01–02 shared anchor.** The overwritten transition frames now show a photographic twig, connected petiole, and egg-bearing leaf at 25% and 50%, before the egg close view takes over. `mobile-transition-01-02-050-release.jpg` retains the same relationship and the explicit retrospective cue.
4. **Resolved — CH04 instar crops.** The overwritten native chapter crop and mobile body/lower captures show five isolated complete specimens without adjacent-row fragments. Heads, tails, and filaments remain within their respective windows; all five labels and the schematic-size qualification remain visible.
5. **Partial — heading treatment.** The shared heading now leads, and the stage/sequence metadata appears below it in the desktop and mobile captures. However, the changed vertical order shifts CH08's desktop title upward into the branch: `evidence/chapters/chapter-08-native-release.jpg` now has the twig running through both title lines, including “former shape,” whereas that second line sat below the twig in the original `chapter-08-native.jpg`. This is the one fix-batch regression left open. Mobile CH08 remains clear.
6. **Resolved — wide Hero layering.** The overwritten `hero-3840x2160.jpg` and new `hero-2560x1440.jpg` both show the complete twig, attachment, chrysalis, and lower tip. The foreground no longer obscures the subject layer. The missing-organism failure is corrected in both required wide compositions.

## remaining

**R1, within finding 5 — desktop CH08 title safe area.** Place the complete title in clean air below the twig or outside the overlapping image region, keeping the heading-first order and the subject's attachment unobscured. The current second line intersects textured dark bark and loses the stable reading field required by the brief. Re-capture `evidence/chapters/chapter-08-native-release.jpg` plus a 1440×900 view containing the heading and upper scene after this local correction. No other findings, detector rerun, or general audit are requested.

disposition: fix

---

## verdict

Final remaining-item scoring, 2026-11-09. This pass re-read the replaced `evidence/chapters/chapter-08-native-release.jpg`, `chapter-08-desktop-safearea-final.jpg`, `mobile-chapter-08-safearea-final.jpg`, and `chapter-08-851x900-safearea-final.jpg`, with the supplied capture geometry and breakpoint records. The captures are valid. No detector or runtime edits were performed.

5. **Resolved — heading treatment and CH08 safe area (R1).** The native full chapter crop and 1440×900 capture now place the complete title and introduction in an uninterrupted paper field above the photograph. The twig no longer crosses either title line, and the image retains its clear branch, attachment, and subject. The 851×900 view preserves this separation, while the 390×844 view keeps the readable mobile stack. Sequence/stage metadata remains below the heading. No regression from this local correction is visible in the supplied captures.

## remaining

**Clear.** Findings 1–4 and 6 remain resolved from the preceding bounded verdict, and finding 5/R1 is now resolved. All six scored finish fixes are closed. This ship verdict covers the scored fixes and their supplied composition/recorded-state evidence, not the whole surface or continuous-motion certification.

disposition: ship
