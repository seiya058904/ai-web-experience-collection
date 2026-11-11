# PULSE transition contracts

> Historical implementation plan. The statuses below describe the time of authorship. See [the delivered acceptance record](acceptance.md) and [evidence index](../evidence/index.md) for actual later browser results, corrections and remaining limits.

Prepared: 2026-11-09. Scope: the ten adjacent story boundaries, their deterministic state model, and the rendering obligations that still require browser evidence.

## State authority and measurement

`src/story.ts` is the pure state authority. It reads native scroll distance, viewport dimensions, and current DOM measurements. It has no animation timer, DOM reference, asynchronous loader, or playback history. The viewport center is the reading focus. Each boundary is active while that focus lies inside its measured rectangle. At 50%, the incoming chapter owns navigation state. Chapter sections themselves remain in native document flow.

One Lenis instance may smooth native scroll input. Its actual current scroll position, not an independent lagging camera timeline, must feed the evaluator. The DOM adapter must remeasure after responsive layout changes and font/image layout settlement. Never reuse desktop rectangles after a phone resize.

### Integration API

`evaluateStory({ scrollY, viewport: { width, height }, chapters, transitions, reducedMotion })` returns `chapterIndex`, `chapterId`, document `progress`, `chapterProgress`, `focusY`, clamped `scrollY`, and the nearest `transition`. Each measured rectangle is `{ id, top, height }`. The nearest transition has `active: false` outside its rectangle, even though its endpoint frame remains available for rendering. Empty chapter geometry returns a null chapter and null transition.

`evaluateTransition(index, progress, reducedMotion)` returns the pure frame for one boundary. The zero-based index is 0–9. Invalid indices throw a clear `RangeError`; progress is clamped. Frame fields include separate source and target clip masks, image and text opacity, anchor position, line progress, stage label, representation label, and separate electrical and blood-overlay opacity.

## Scene and anatomical registration

| Property | Contract |
| --- | --- |
| Units | SVG authoring coordinates: 1000 × 700, not millimeters. Anchor coordinates below are percentages of this rectangle. |
| Axes | +x points viewer-right; +y points down. In the declared anterior view, anatomical right is viewer-left. No negative horizontal scale or mirror transform is permitted. |
| Pivot | Each mask uses its named anatomical landmark. Shared silhouette and anchor stay outside scene replacement layers. |
| Projection | Flat authored anatomical plate or explicitly schematic SVG. No claim of free rotation or full 3D anatomy. |
| Camera/FOV | Not applicable to SVG. Bounded scale changes are illustration composition, not physical camera penetration. |
| Near/far clipping | Not applicable; CSS clip-path reveals separate illustration plates. |
| Silhouette | The heart silhouette and known chamber/valve landmark must be registered before a handoff is accepted. State coordinates alone do not establish anatomical fidelity. |
| Light and color | Follow VISUAL-BIBLE.md. Raster illustrations retain their source lighting; diagram colors are notation. Do not tint blood blue without an explicit convention legend. |
| Support/shadow | No invented floor contact is required for floating museum plates. Any raster shadow remains part of that illustration and cannot jump between plates. |
| Depth order | Museum background → source plate → target plate behind authored reveal boundary → shared anchor/contour → real DOM or accessible SVG labels. Text lives in a stable reading zone. |
| Caption handoff | Source caption has cleared by 38%; target begins after 62%. The anchor caption owns the intervening region. The old and new captions never overlap mathematically. |
| Readiness | Each target has its own inline SVG fallback. No shader or WebGL readiness is required. Failed/late raster completion must not replace the active chapter with a different one. |
| Asset ownership | Each section owns its own DOM image element. If a shared asynchronous asset loader is later introduced, it must check a monotonically increasing target request token before committing a result. |
| Reverse restoration | The same pure function restores the same source/target images, masks, and anchors from scroll alone. |
| Reduced motion | Snap to a complete source/target plate at midpoint; retain the same chapter content, route controls, and textual explanation. |

These are authored diagram handoffs between separate views. They are not arbitrary mesh morphs. A dissolve alone does not satisfy any boundary: the distinct mask, named anatomical anchor, and representation label are required. Registration against the actual final SVG and art remains a browser/visual acceptance obligation.

## Boundary index

| ID | Mechanism | Named anchor | Anchor start → end, percent x/y | Rendered evidence |
| --- | --- | --- | --- | --- |
| TR-01-02 | section-reveal | Real wall edge and fixed anterior axis | 58, 51 → 58, 51 | NOT TESTED |
| TR-02-03 | node-trace | Right atrium and sinoatrial-node region | 40, 30 → 40, 30 | NOT TESTED |
| TR-03-04 | route-switch | Right atrial contour | 40, 35 → 40, 35 | NOT TESTED |
| TR-04-05 | valve-focus | Tricuspid opening between right atrium and right ventricle | 42, 48 → 46, 48 | NOT TESTED |
| TR-05-06 | outflow-trace | Pulmonary valve root | 51, 34 → 51, 27 | NOT TESTED |
| TR-06-07 | magnify | Pulmonary arterial branch and explicit magnification boundary | 68, 37 → 68, 37 | NOT TESTED |
| TR-07-08 | scale-return | Capillary outlet and oxygen-rich notation | 67, 57 → 65, 32 | NOT TESTED |
| TR-08-09 | wall-reveal | Mitral opening and left ventricular chamber rim | 64, 44 → 64, 51 | NOT TESTED |
| TR-09-10 | body-map | Aortic root and aorta | 58, 27 → 53, 30 | NOT TESTED |
| TR-10-11 | home-return | Venous return entering the right atrium | 44, 37 → 40, 35 | NOT TESTED |

## Test status

| Check | Method | Result |
| --- | --- | --- |
| State continuity, endpoint completeness, all quarter stages | Node built-in test runner | PASS |
| Reverse/direct-entry determinism | Repeated forward/reverse snapshots and direct midpoint comparison | PASS |
| Nonoverlapping captions and separated signal/blood transition | Exhaustive sampled state checks | PASS |
| Reduced motion, empty/short page, invalid numeric inputs, resize measurements | Node built-in test runner | PASS |
| Actual rendered transitions, typography, mobile, images, continuous scroll | Production browser required | NOT TESTED |

Executed `node --test tests/story.test.mjs` on Node v24.22.1: **21 tests passed, 0 failed**, 2026-11-09. This validates state logic, not anatomy or aesthetic quality. Do not relabel visual acceptance as PASS from this result.

## TR-01-02 · The Living Form to Four Chambers

**Source → target:** CH-01 → CH-02. **Continuity anchor:** Real wall edge and fixed anterior axis.

| Progress | Required composition |
| --- | --- |
| 0% | Complete anatomical heart hold. |
| 25% | View settles toward the designated sectional plane. |
| 50% | Interior chambers are visible behind the illustrated cut surface. |
| 75% | Registered labels take focus; the external contour stays. |
| 100% | Four chambers hold in a stable anterior view. |

**Mechanism:** `section-reveal`. An authored left-to-right section mask reveals the registered chamber plate. The outer wall and the anterior-axis landmark remain in a separate shared layer; the section does not pretend to be a rotating 3D mesh.

**Always readable representation cue:** Exterior to illustrated section.

**Target-owned fallback:** Heart section with all four chambers and orientation labels.

**Mobile treatment:** Two atlas plates retain the same anterior orientation. In reduced motion, a complete source plate changes to a complete target plate at 50%; numeric progress and the text description remain available.

**Reverse, direct entry, and refresh:** Evaluate `evaluateTransition(0, p, reducedMotion)` from the current measured scroll position. There is no prerequisite playback or previous-transition state. At 50%, the same frame and target chapter identity are produced after forward scroll, reverse scroll, or direct seek.

**Specific rejection:** The wall pops out or anatomical left and right swap.

**Evidence:** `tests/story.test.mjs` verifies the state mathematics. Actual rendered 0/25/50/75/100% and threshold-neighbor captures, image failure, mobile, and continuous-motion review are **NOT TESTED** in this document until the production browser review records them.

## TR-02-03 · Four Chambers to The Signal

**Source → target:** CH-02 → CH-03. **Continuity anchor:** Right atrium and sinoatrial-node region.

| Progress | Required composition |
| --- | --- |
| 0% | The chamber diagram holds. |
| 25% | The right atrial label remains prominent as other labels recede. |
| 50% | The electrical overlay aligns without hiding tissue boundaries. |
| 75% | The SA and AV route becomes clear; chamber labels are secondary. |
| 100% | The signal explanation holds. |

**Mechanism:** `node-trace`. A circular reveal begins at the right atrial node location and draws a distinct electrical overlay. The heart shell remains steady. Electrical marks are dots and a fine dashed line, never filled vessels.

**Always readable representation cue:** Electrical sequence, separate from blood flow.

**Target-owned fallback:** Conduction diagram registered over the same heart section.

**Mobile treatment:** Separate labeled stages explain the electrical sequence. In reduced motion, a complete source plate changes to a complete target plate at 50%; numeric progress and the text description remain available.

**Reverse, direct entry, and refresh:** Evaluate `evaluateTransition(1, p, reducedMotion)` from the current measured scroll position. There is no prerequisite playback or previous-transition state. At 50%, the same frame and target chapter identity are produced after forward scroll, reverse scroll, or direct seek.

**Specific rejection:** Conduction lines are mistaken for blood-flow arrows.

**Evidence:** `tests/story.test.mjs` verifies the state mathematics. Actual rendered 0/25/50/75/100% and threshold-neighbor captures, image failure, mobile, and continuous-motion review are **NOT TESTED** in this document until the production browser review records them.

## TR-03-04 · The Signal to The Return

**Source → target:** CH-03 → CH-04. **Continuity anchor:** Right atrial contour.

| Progress | Required composition |
| --- | --- |
| 0% | The electrical overlay is visible. |
| 25% | The SA-node mark becomes a secondary callout. |
| 50% | The vena cava route enters beside the fixed right atrial contour. |
| 75% | Blood flow takes focus with its own legend. |
| 100% | Right-sided venous return is clear. |

**Mechanism:** `route-switch`. The electrical overlay clears before the separate blood-route layer enters from above. Their opacity windows do not overlap. The right atrial contour is held throughout, so the change is a labeled explanatory-layer switch.

**Always readable representation cue:** Changing explanatory layer.

**Target-owned fallback:** Right atrium and venae cavae with direction arrows.

**Mobile treatment:** Two distinct labeled modes retain a stable atrial landmark. In reduced motion, a complete source plate changes to a complete target plate at 50%; numeric progress and the text description remain available.

**Reverse, direct entry, and refresh:** Evaluate `evaluateTransition(2, p, reducedMotion)` from the current measured scroll position. There is no prerequisite playback or previous-transition state. At 50%, the same frame and target chapter identity are produced after forward scroll, reverse scroll, or direct seek.

**Specific rejection:** Electrical wiring appears to transform into a blood vessel.

**Evidence:** `tests/story.test.mjs` verifies the state mathematics. Actual rendered 0/25/50/75/100% and threshold-neighbor captures, image failure, mobile, and continuous-motion review are **NOT TESTED** in this document until the production browser review records them.

## TR-04-05 · The Return to One-Way Gates

**Source → target:** CH-04 → CH-05. **Continuity anchor:** Tricuspid opening between right atrium and right ventricle.

| Progress | Required composition |
| --- | --- |
| 0% | The right-heart return composition holds. |
| 25% | The tricuspid valve gains emphasis. |
| 50% | Valve leaflets remain registered with the neighboring wall. |
| 75% | Other valves enter in an explicitly comparative plate. |
| 100% | The valve atlas is readable. |

**Mechanism:** `valve-focus`. A bounded enlargement of the tricuspid landmark meets a circular valve-comparison reveal. The comparison is explicitly an atlas plate, not a floating new heart. The shared orifice label identifies the anatomical anchor.

**Always readable representation cue:** Tricuspid landmark to valve comparison.

**Target-owned fallback:** Tricuspid detail with a separate valve comparison plate.

**Mobile treatment:** Atrioventricular and outflow valve plates are paired. In reduced motion, a complete source plate changes to a complete target plate at 50%; numeric progress and the text description remain available.

**Reverse, direct entry, and refresh:** Evaluate `evaluateTransition(3, p, reducedMotion)` from the current measured scroll position. There is no prerequisite playback or previous-transition state. At 50%, the same frame and target chapter identity are produced after forward scroll, reverse scroll, or direct seek.

**Specific rejection:** Leaflet orientation or opening direction silently flips.

**Evidence:** `tests/story.test.mjs` verifies the state mathematics. Actual rendered 0/25/50/75/100% and threshold-neighbor captures, image failure, mobile, and continuous-motion review are **NOT TESTED** in this document until the production browser review records them.

## TR-05-06 · One-Way Gates to Toward the Lungs

**Source → target:** CH-05 → CH-06. **Continuity anchor:** Pulmonary valve root.

| Progress | Required composition |
| --- | --- |
| 0% | The valve families are distinct. |
| 25% | The pulmonary valve is isolated from the other outlets. |
| 50% | Right ventricle and pulmonary trunk meet at the matched section. |
| 75% | The pulmonary arterial branch enters the view. |
| 100% | The right-heart-to-lung route holds. |

**Mechanism:** `outflow-trace`. An upward outflow reveal follows the pulmonary root into its trunk. The aortic and pulmonary outlets retain different identities. A fixed caption names the pulmonary route throughout the comparison.

**Always readable representation cue:** Right ventricle to pulmonary arteries.

**Target-owned fallback:** Right ventricle, pulmonary valve, and pulmonary trunk route.

**Mobile treatment:** A labeled anatomical route is shown in simple steps. In reduced motion, a complete source plate changes to a complete target plate at 50%; numeric progress and the text description remain available.

**Reverse, direct entry, and refresh:** Evaluate `evaluateTransition(4, p, reducedMotion)` from the current measured scroll position. There is no prerequisite playback or previous-transition state. At 50%, the same frame and target chapter identity are produced after forward scroll, reverse scroll, or direct seek.

**Specific rejection:** The aortic valve is used as the pulmonary outlet.

**Evidence:** `tests/story.test.mjs` verifies the state mathematics. Actual rendered 0/25/50/75/100% and threshold-neighbor captures, image failure, mobile, and continuous-motion review are **NOT TESTED** in this document until the production browser review records them.

## TR-06-07 · Toward the Lungs to Exchange

**Source → target:** CH-06 → CH-07. **Continuity anchor:** Pulmonary arterial branch and explicit magnification boundary.

| Progress | Required composition |
| --- | --- |
| 0% | The pulmonary artery branch is legible. |
| 25% | A boxed magnification cue identifies the tissue being examined. |
| 50% | Capillary and alveolus coexist behind an explicit diagram boundary. |
| 75% | Gas-exchange structures become the principal subject. |
| 100% | The alveolar barrier and gas directions hold. |

**Mechanism:** `magnify`. A growing circular magnification window is centered at the branch landmark. The source arterial branch and the target alveolar-capillary illustration are separate objects with a visible window boundary. The scale label remains present even at either endpoint. No geometric pipe-to-air-sac morph occurs.

**Always readable representation cue:** Schematic magnification — different scale.

**Target-owned fallback:** Complete alveolar-capillary diagram labeled Schematic scale.

**Mobile treatment:** A stable magnified plate keeps air and blood compartments separate. In reduced motion, a complete source plate changes to a complete target plate at 50%; numeric progress and the text description remain available.

**Reverse, direct entry, and refresh:** Evaluate `evaluateTransition(5, p, reducedMotion)` from the current measured scroll position. There is no prerequisite playback or previous-transition state. At 50%, the same frame and target chapter identity are produced after forward scroll, reverse scroll, or direct seek.

**Specific rejection:** Blood enters the airspace or a zoom implies a literal pipe-to-sac conversion.

**Evidence:** `tests/story.test.mjs` verifies the state mathematics. Actual rendered 0/25/50/75/100% and threshold-neighbor captures, image failure, mobile, and continuous-motion review are **NOT TESTED** in this document until the production browser review records them.

## TR-07-08 · Exchange to The Way Back

**Source → target:** CH-07 → CH-08. **Continuity anchor:** Capillary outlet and oxygen-rich notation.

| Progress | Required composition |
| --- | --- |
| 0% | The alveolar diagram keeps air and blood spaces distinct. |
| 25% | The outgoing capillary is highlighted. |
| 50% | A scale label explains the conceptual change in view. |
| 75% | Pulmonary veins appear as a separate, larger route. |
| 100% | Return to the left atrium is visible. |

**Mechanism:** `scale-return`. A right-to-left plate handoff reintroduces the larger pulmonary venous route. The capillary outlet stays identified as oxygen-rich return; an explicit scale label accompanies the change of representation.

**Always readable representation cue:** From microcirculation to pulmonary veins.

**Target-owned fallback:** Pulmonary veins leading into the left atrium.

**Mobile treatment:** Two labeled venous-path plates explain the scale change. In reduced motion, a complete source plate changes to a complete target plate at 50%; numeric progress and the text description remain available.

**Reverse, direct entry, and refresh:** Evaluate `evaluateTransition(6, p, reducedMotion)` from the current measured scroll position. There is no prerequisite playback or previous-transition state. At 50%, the same frame and target chapter identity are produced after forward scroll, reverse scroll, or direct seek.

**Specific rejection:** Blood is shown returning through a pulmonary artery.

**Evidence:** `tests/story.test.mjs` verifies the state mathematics. Actual rendered 0/25/50/75/100% and threshold-neighbor captures, image failure, mobile, and continuous-motion review are **NOT TESTED** in this document until the production browser review records them.

## TR-08-09 · The Way Back to The Stronger Wall

**Source → target:** CH-08 → CH-09. **Continuity anchor:** Mitral opening and left ventricular chamber rim.

| Progress | Required composition |
| --- | --- |
| 0% | Pulmonary veins and the left atrium are readable. |
| 25% | The route passes through the correct mitral position. |
| 50% | The thicker left ventricular wall enters the section. |
| 75% | The left ventricular section dominates. |
| 100% | The wall comparison holds. |

**Mechanism:** `wall-reveal`. An elliptical section reveal grows about the mitral-to-left-ventricular landmark. The muscular rim stays in a shared layer; the target wall view settles from a very small bounded scale offset.

**Always readable representation cue:** Mitral inflow to the left ventricle.

**Target-owned fallback:** Left ventricular wall section with the mitral relation visible.

**Mobile treatment:** Left atrial and left ventricular plates share the mitral landmark. In reduced motion, a complete source plate changes to a complete target plate at 50%; numeric progress and the text description remain available.

**Reverse, direct entry, and refresh:** Evaluate `evaluateTransition(7, p, reducedMotion)` from the current measured scroll position. There is no prerequisite playback or previous-transition state. At 50%, the same frame and target chapter identity are produced after forward scroll, reverse scroll, or direct seek.

**Specific rejection:** Wall orientation or the direction of flow is inverted.

**Evidence:** `tests/story.test.mjs` verifies the state mathematics. Actual rendered 0/25/50/75/100% and threshold-neighbor captures, image failure, mobile, and continuous-motion review are **NOT TESTED** in this document until the production browser review records them.

## TR-09-10 · The Stronger Wall to Around the Body

**Source → target:** CH-09 → CH-10. **Continuity anchor:** Aortic root and aorta.

| Progress | Required composition |
| --- | --- |
| 0% | The thick left ventricular wall and outlet valve hold. |
| 25% | The aortic root trace extends upward. |
| 50% | The anatomical section meets an explicitly schematic body map. |
| 75% | Systemic arterial branches become clear with their legend. |
| 100% | The body-circulation diagram holds. |

**Mechanism:** `body-map`. A bottom-to-top diagram handoff connects the aortic landmark to an explicitly schematic body map. The root anchor stays separate from both panels. No invented direct aorta-to-vein shortcut is introduced.

**Always readable representation cue:** Anatomical section to schematic body map.

**Target-owned fallback:** Complete schematic map from the aorta through tissues to veins.

**Mobile treatment:** Labeled anatomical and body-map plates form a still sequence. In reduced motion, a complete source plate changes to a complete target plate at 50%; numeric progress and the text description remain available.

**Reverse, direct entry, and refresh:** Evaluate `evaluateTransition(8, p, reducedMotion)` from the current measured scroll position. There is no prerequisite playback or previous-transition state. At 50%, the same frame and target chapter identity are produced after forward scroll, reverse scroll, or direct seek.

**Specific rejection:** An invented shortcut joins the aorta directly to venous return.

**Evidence:** `tests/story.test.mjs` verifies the state mathematics. Actual rendered 0/25/50/75/100% and threshold-neighbor captures, image failure, mobile, and continuous-motion review are **NOT TESTED** in this document until the production browser review records them.

## TR-10-11 · Around the Body to Beat Again

**Source → target:** CH-10 → CH-11. **Continuity anchor:** Venous return entering the right atrium.

| Progress | Required composition |
| --- | --- |
| 0% | The body map and returning route are readable. |
| 25% | The venous trace approaches the heart. |
| 50% | The original heart appears as the map recedes behind its outline. |
| 75% | Electrical and blood overlays settle into separate layers. |
| 100% | The final heartbeat atlas holds. |

**Mechanism:** `home-return`. A circular return reveal restores the original heart artwork while the map contracts slightly behind it. The venous-return anchor remains fixed to the right atrial destination. Electrical and blood explanations remain separate layers.

**Always readable representation cue:** Two circuits; a separate electrical sequence.

**Target-owned fallback:** Original hero heart with separate circulation and electrical diagrams.

**Mobile treatment:** The original heart and selectable explanatory plates close the loop. In reduced motion, a complete source plate changes to a complete target plate at 50%; numeric progress and the text description remain available.

**Reverse, direct entry, and refresh:** Evaluate `evaluateTransition(9, p, reducedMotion)` from the current measured scroll position. There is no prerequisite playback or previous-transition state. At 50%, the same frame and target chapter identity are produced after forward scroll, reverse scroll, or direct seek.

**Specific rejection:** The ending claims that one blood cell completes the body circuit in one beat.

**Evidence:** `tests/story.test.mjs` verifies the state mathematics. Actual rendered 0/25/50/75/100% and threshold-neighbor captures, image failure, mobile, and continuous-motion review are **NOT TESTED** in this document until the production browser review records them.
