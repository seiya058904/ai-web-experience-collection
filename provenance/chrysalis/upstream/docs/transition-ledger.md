# CHRYSALIS transition ledger

Reviewed: 2026-11-09 (UTC). This ledger separates deterministic implementation from visual acceptance. Unit checks do not establish scientific fidelity or the quality of a browser-rendered handoff.

## State authority and integration

`src/story.ts` evaluates a complete snapshot from actual scroll position and freshly measured DOM rectangles. `src/scroll-controller.ts` supplies one Lenis 1.3.27 instance and one persistent requestAnimationFrame clock while the document is visible. `autoRaf` and `autoResize` are false. There is no GSAP timeline and no separate delayed scrub state.

The reading probe is `scrollY + viewportHeight / 2`. A measured `.chapter-transition[data-from][data-to]` rectangle owns its normalized transition window. The renderer can use an absolute marker at half a viewport below a bridge's top: a 140svh bridge with a 100svh sticky frame and a marker at top 50svh / height 40svh aligns transition 0% with pin entry and 100% with pin exit. Reading chapters themselves remain unpinned.

`evaluateTransition(index, progress, reducedMotion, mobile)` returns the source and target framing, clip path, selected desktop/portrait anchor, stage caption, presentation mode, and nonoverlapping caption ownership. Seven boundaries use opaque authored plates with a spatial reveal. TR-03-04, TR-06-07 and TR-09-10 use separately framed complete observations, because a mask crossing different anatomy produced misleading composites in browser review. Neither presentation blends transparent insects.

### Coordinate and layer contract

- Frame coordinates: x to the right, y downward; 0–100 is the frame width or height. Translation uses percentages, scale is unitless. These are editorial screen units, not biological measurements.
- Pivot: the named leaf or silk anchor, identical on reverse visits. The renderer aligns the correct plate content at this coordinate. The numeric anchor is a design target, not evidence of an automatically registered generated image.
- Projection: orthographic 2D image plane. No FOV, near/far clipping, transparent tissue camera, or rotatable 3D anatomy is claimed.
- Background to foreground: retained habitat backplate, outgoing opaque plate, incoming opaque plate inside its clipping wrapper, scene-owned anchor/annotation, then DOM text. Apply the clip to a stationary wrapper and transforms to its image child.
- Complete-pose exception: the two anatomically different hanging-stage studies use separate figures, each with its own complete silhouette, silk attachment, and visible caption. Their target wrapper has no partial clip. A single source is shown below 12.5%, both poses from 12.5% through 87.5%, and a single target above 87.5%. These are deliberate editorial stage changes, not reconstructed biological movement. The single shared decorative register is suppressed for these paired frames.
- Keep adequate source overscan (at least 7% on each side) where the framing shrinks below 1; otherwise background edges may be exposed. Verify the complete bridge at intermediate stops.
- Light: use each selected plate's original diffuse light and shared scene treatment. No global black frame, flash, color wash, or fake biological glow is part of the evaluator.
- Text: outgoing caption finishes before the incoming caption becomes readable. Between 30% and 70%, the bridge caption can own the reading area. Hidden outgoing/incoming controls must be inert or absent.
- Quarter captions tolerate native scroll quantization: a progress value within 0.005 of a quarter checkpoint uses that checkpoint's label. Actual progress, clipping, transforms, and mode boundaries remain unsnapped. The observed 0.499565 midpoint therefore receives the 50% caption rather than the 25% caption.
- Asset readiness: retain a target-specific still or authored diagram before image readiness. `assetToken` names the current chapter and selected mode; compare it before applying a delayed result. Pure evaluation itself performs no asynchronous work.
- Reduced motion: the same progress picks a stable source plate below 50% and a stable target plate from 50%; camera transforms remain neutral. All learning states remain reachable through their explicit controls.
- Mobile: use the scene-specific treatment below, retaining full anatomy, support, and selectable text; do not make essential facts depend on tiny moving marks.

## Boundary contracts

### TR-01-02 · CH-01 → CH-02

**Mechanism:** vein-pullback. **Anchor:** The egg-bearing leaf vein; desktop (69%, 63%), mobile (57%, 62%).

| Progress | Authored observation |
| --- | --- |
| 0% | Egg and shell ridges hold. |
| 25% | The view backs away along the vein. |
| 50% | The egg remains visible within the leaf. |
| 75% | The neighboring stem comes into view. |
| 100% | The milkweed habitat is established. |

**Mobile / still treatment:** Separate close and whole-leaf portrait plates share the vein landmark.

**Target fallback:** The host-plant plate, including the egg-bearing leaf.

**Reject if:** The egg or vein changes identity, or the image goes dark during the pullback.

**Reverse / direct-entry rule:** evaluate this same function at the requested progress; do not wait for prior playback. The target chapter owns the 100% endpoint. Verify the generated imagery, support, and silhouette separately from the math.

**Implementation:** `src/transitions.ts`, transition index 0. **Unit status:** PASS. **Browser / anatomical acceptance:** NOT TESTED in the engine-only pass; see the final browser evidence index for subsequent observations.

### TR-02-03 · CH-02 → CH-03

**Mechanism:** vein-magnifier. **Anchor:** The vein junction beneath the egg; desktop (69%, 63%), mobile (57%, 62%).

| Progress | Authored observation |
| --- | --- |
| 0% | The milkweed leaf holds. |
| 25% | The view follows the vein. |
| 50% | The egg becomes the point of focus. |
| 75% | Shell ridges take priority. |
| 100% | The hatching observation is ready. |

**Mobile / still treatment:** A restrained magnifier framing change leads into discrete hatching stills.

**Target fallback:** The egg and shell plate at the same leaf junction.

**Reject if:** The ridged egg becomes a smooth pearl or its base leaves the leaf.

**Reverse / direct-entry rule:** evaluate this same function at the requested progress; do not wait for prior playback. The target chapter owns the 100% endpoint. Verify the generated imagery, support, and silhouette separately from the math.

**Implementation:** `src/transitions.ts`, transition index 1. **Unit status:** PASS. **Browser / anatomical acceptance:** NOT TESTED in the engine-only pass; see the final browser evidence index for subsequent observations.

### TR-03-04 · CH-03 → CH-04

**Mechanism:** Two complete landscape observations. The source retains the whole opened shell and hatchling; the target retains the complete feeding larva, head and leaf margin. The former vertical wipe created an impossible shell-to-larva splice in an actual phone midpoint and was rejected.

| Progress | Authored observation |
| --- | --- |
| 0% | The shell and hatchling hold. |
| 25% | Two complete observations, shown separately. |
| 50% | Compare the hatchling and feeding observations. |
| 75% | The feeding head and leaf edge remain visible. |
| 100% | The first feeding observation holds. |

The source alone owns progress below 12.5%; two separately labeled complete plates occupy 12.5–87.5%; the target alone owns progress above 87.5%. Reduced mode selects one whole source below 50% or target from 50%, with its matching caption. No clipping seam or transparent body blend is applied to these figures.

**Mobile treatment:** Full 1659:948 landscape images use `object-fit: contain`; they stack on phones. Full-height portrait crops used by the hanging-stage studies are intentionally not reused here, because they would discard the tiny hatchling or the feeding head. The scope text explicitly states that movement between the two illustrated observations is not shown.

**Target fallback:** The complete feeding plate, with its head, body and leaf margin visible.

**Reject if:** A reveal edge joins the shell to a larva, crops either body or its leaf contact, or implies recorded movement between the observations.

**Reverse / direct-entry rule:** Evaluate the same complete-pose selection at the requested progress, without depending on prior playback. The actual before-correction midpoint remains in evidence; replacement rendering and selected quarter stops are separately indexed in the final QA report.

**Implementation:** `src/transitions.ts`, transition index 2; `src/scenes.css` landscape comparison rules. The mathematical and rendered checks retain their distinct scopes.

### TR-04-05 · CH-04 → CH-05

**Mechanism:** specimen-register. **Anchor:** The crescent-shaped feeding edge; desktop (65%, 70%), mobile (51%, 65%).

| Progress | Authored observation |
| --- | --- |
| 0% | The feeding margin holds. |
| 25% | The bite remains a point of reference. |
| 50% | An indexed comparison introduces separate stages. |
| 75% | The later larval stages take focus. |
| 100% | The five-instar comparison is ready. |

**Mobile / still treatment:** Five separately selectable plates preserve stage detail and captions.

**Target fallback:** The five-instar comparison plate with its stage descriptions.

**Reject if:** One caterpillar is simply scaled five times or the sequence implies instant growth.

**Reverse / direct-entry rule:** evaluate this same function at the requested progress; do not wait for prior playback. The target chapter owns the 100% endpoint. Verify the generated imagery, support, and silhouette separately from the math.

**Implementation:** `src/transitions.ts`, transition index 3. **Unit status:** PASS. **Browser / anatomical acceptance:** NOT TESTED in the engine-only pass; see the final browser evidence index for subsequent observations.

### TR-05-06 · CH-05 → CH-06

**Mechanism:** stem-descent. **Anchor:** The stem line and future attachment point; desktop (68%, 23%), mobile (56%, 24%).

| Progress | Authored observation |
| --- | --- |
| 0% | The fifth instar holds. |
| 25% | A nearby support enters the composition. |
| 50% | The mature larva is framed beneath the support. |
| 75% | A distinct J-hanging pose is introduced. |
| 100% | The silk pad and hanging larva hold. |

**Mobile / still treatment:** A contained full landscape hanging plate sits in the upper revealed field so its support and full J pose can remain visible at the midpoint. The earlier cropped midpoint is retained as before-refinement evidence.

**Target fallback:** The attached J-hanging larva plate.

**Reject if:** The silk support disappears or the larva floats beneath an unrelated branch.

**Reverse / direct-entry rule:** evaluate this same function at the requested progress; do not wait for prior playback. The target chapter owns the 100% endpoint. Verify the generated imagery, support, and silhouette separately from the math.

**Implementation:** `src/transitions.ts`, transition index 4. **Unit status:** PASS. **Browser / anatomical acceptance:** NOT TESTED in the engine-only pass; see the final browser evidence index for subsequent observations.

### TR-06-07 · CH-06 → CH-07

**Mechanism:** skin-release, presented as a complete-pose comparison. **Anchor:** The silk pad and hanging pivot is retained separately within each plate; desktop scene coordinates (68%, 23%), mobile (56%, 24%). No shared overlay claims anatomical registration between the two organisms.

| Progress | Authored observation |
| --- | --- |
| 0% | The J form holds beneath the pad. |
| 25% | Two complete stages, shown separately. |
| 50% | Compare the hanging larva and attached pupa. |
| 75% | The jade pupa remains attached to its silk pad. |
| 100% | The attached chrysalis holds. |

**Visible plates:** `ai-11-j-hang.webp` is labeled “J-hanging larva”; `ai-06-jade.webp` is labeled “Attached chrysalis.” The scope line states: “Separate illustrated observations. The skin-shedding process is not shown.”

**Mobile / still treatment:** Both complete supported poses occupy distinct 2:3 frames at the quarter, middle, and three-quarter stops. The complete source height is retained; the horizontal crop is centered at 69% and includes the larva's leftmost filament. Reduced motion shows one complete stage with its matching endpoint caption, without camera movement.

**Target fallback:** The jade chrysalis at the established hanging pivot.

**Reject if:** A reveal edge splices larva and pupa, either complete body or its support is cropped, or the comparison claims to show skin shedding.

**Reverse / direct-entry rule:** evaluate this same function at the requested progress; do not wait for prior playback. The target chapter owns the 100% endpoint. Verify the generated imagery, support, and silhouette separately from the math.

**Implementation:** `src/transitions.ts`, transition index 5. **Unit status:** PASS. **Browser / anatomical acceptance:** NOT TESTED in the engine-only pass; see the final browser evidence index for subsequent observations.

### TR-07-08 · CH-07 → CH-08

**Mechanism:** illustrated-section. **Anchor:** The outer shell and silk support; desktop (68%, 23%), mobile (56%, 24%).

| Progress | Authored observation |
| --- | --- |
| 0% | The opaque exterior holds. |
| 25% | The boundary of the explanatory layer appears. |
| 50% | A separate reconstruction introduces developing wing regions. |
| 75% | The reconstruction label and annotations settle. |
| 100% | The exterior and illustrative study are ready. |

**Mobile / still treatment:** Exterior and reconstruction remain separately labeled selectable plates.

**Target fallback:** The exterior shell with an accessible static explanatory diagram.

**Reject if:** The illustration is presented as microscopy or the exterior becomes transparent glass.

**Reverse / direct-entry rule:** evaluate this same function at the requested progress; do not wait for prior playback. The target chapter owns the 100% endpoint. Verify the generated imagery, support, and silhouette separately from the math.

**Implementation:** `src/transitions.ts`, transition index 6. **Unit status:** PASS. **Browser / anatomical acceptance:** NOT TESTED in the engine-only pass; see the final browser evidence index for subsequent observations.

### TR-08-09 · CH-08 → CH-09

**Mechanism:** pigment-reveal. **Anchor:** The shell outline and gold details; desktop (68%, 23%), mobile (56%, 24%).

| Progress | Authored observation |
| --- | --- |
| 0% | The explanatory study holds. |
| 25% | The natural exterior returns. |
| 50% | The late pattern returns to the exterior view. |
| 75% | The developing wing pigmentation takes focus. |
| 100% | The late pupa holds before emergence. |

**Mobile / still treatment:** Early and late plates allow direct comparison without a transparency effect.

**Target fallback:** The late patterned chrysalis with the support intact.

**Reject if:** Two shells overlap as ghosts or the color change is described as glass-like transparency.

**Reverse / direct-entry rule:** evaluate this same function at the requested progress; do not wait for prior playback. The target chapter owns the 100% endpoint. Verify the generated imagery, support, and silhouette separately from the math.

**Implementation:** `src/transitions.ts`, transition index 7. **Unit status:** PASS. **Browser / anatomical acceptance:** NOT TESTED in the engine-only pass; see the final browser evidence index for subsequent observations.

### TR-09-10 · CH-09 → CH-10

**Mechanism:** shell-seam, presented as a complete-pose comparison. **Anchor:** The silk attachment remains visible independently in the late-pupa and emerged-adult plates; desktop scene coordinates (68%, 23%), mobile (56%, 24%). The transition does not simulate shell opening.

| Progress | Authored observation |
| --- | --- |
| 0% | The late pupa holds. |
| 25% | Two complete stages, before and after emergence. |
| 50% | Compare the late pupa and newly emerged adult. |
| 75% | The adult hangs beneath its empty shell. |
| 100% | The wing-expansion sequence is ready. |

**Visible plates:** The source is the late-pattern plate `ai-08-pattern.webp`, labeled “Late pupa.” The target is `ai-07-emergence.webp`, labeled “Newly emerged adult.” The scope line states: “Separate illustrated observations. The shell-opening movement is not shown.”

**Mobile / still treatment:** The complete late pupa and complete adult with spent shell occupy distinct labeled 2:3 frames, using the same safe full-height crop as the pupation comparison. The separate chapter inspector still provides its three authored emergence poses. Reduced motion shows one complete stage with matching copy.

**Target fallback:** The hanging emergence plate with its spent shell.

**Reject if:** A reveal edge joins an intact pupa to an empty shell, either support is cropped, or the comparison claims to show the opening movement.

**Reverse / direct-entry rule:** evaluate this same function at the requested progress; do not wait for prior playback. The target chapter owns the 100% endpoint. Verify the generated imagery, support, and silhouette separately from the math.

**Implementation:** `src/transitions.ts`, transition index 8. **Unit status:** PASS. **Browser / anatomical acceptance:** NOT TESTED in the engine-only pass; see the final browser evidence index for subsequent observations.

### TR-10-11 · CH-10 → CH-11

**Mechanism:** meadow-return. **Anchor:** The orange-black wing edge and familiar leaf margin; desktop (68%, 53%), mobile (56%, 54%).

| Progress | Authored observation |
| --- | --- |
| 0% | The established wing pattern holds. |
| 25% | The view widens toward the habitat. |
| 50% | Wing and leaf share the composition. |
| 75% | The butterfly belongs to the larger meadow. |
| 100% | The leaf and complete life cycle resolve the story. |

**Mobile / still treatment:** Two habitat plates retain the adult-and-milkweed relationship.

**Target fallback:** The adult and milkweed habitat plate followed by the lifecycle key.

**Reject if:** The adult changes species, a swarm replaces the individual, or the milkweed disappears.

**Reverse / direct-entry rule:** evaluate this same function at the requested progress; do not wait for prior playback. The target chapter owns the 100% endpoint. Verify the generated imagery, support, and silhouette separately from the math.

**Implementation:** `src/transitions.ts`, transition index 9. **Unit status:** PASS. **Browser / anatomical acceptance:** NOT TESTED in the engine-only pass; see the final browser evidence index for subsequent observations.

## Engine test record

Command: `node --experimental-strip-types --test tests/story.test.ts`.

Observed result after the complete-pose correction: **43 tests, 43 PASS, 0 FAIL** with Node v24.22.1. Test coverage includes all ten transitions at five checkpoints, both sides of quarter/midpoint thresholds, forward/reverse/random visit order, caption exclusivity, incoming/outgoing endpoint ownership, reduced motion, invalid numeric inputs, empty documents, explicit/default rectangle evaluation, fast end-to-start jumps, resize recomputation, chapter/mode asset tokens, desktop/portrait anchor round trips, the actual quantized midpoint caption, and complete-pose mode ownership. The added regression checks that neither comparison produces an intermediate anatomy-splicing mask and that reduced captions describe the single displayed pose.

Type check after adding the controller: `npx tsc --noEmit` completed with exit code 0. This does not verify browser rendering or physical device behavior.

### Targeted visual correction record

The retained pre-fix captures `evidence/browser/desktop-1440-tr06-p50-visible-region.jpg` and `evidence/browser/desktop-1440-tr09-p50-visible-region.jpg` show a larva/pupa splice and an intact-shell/empty-shell splice respectively. Those reveals were rejected. The complete-pose implementation changes the evaluator, transition markup, renderer, and scene CSS; its automated tests and TypeScript check passed. Post-fix visual acceptance must be established by the separate browser evidence, including both boundaries at 0/25/50/75/100%, reverse visits, direct midpoint entry, desktop and portrait, and reduced motion. No browser pass is inferred from the engine tests.

## Controller behaviors awaiting browser verification

1. A chapter link updates its hash without duplicate same-hash entries, scrolls without locking input, and focuses the target heading after arrival.
2. Wheel, touch, pointer, and native scrolling keys can interrupt a programmatic journey. A late font or load event cannot return an interacting visitor to an initial hash.
3. Reload and back/forward restoration preserve browser-owned position. Hash changes and explicit chapter history still select the proper chapter.
4. Font readiness, dimensions, and resize trigger fresh measurements without a recursive layout-write loop.
5. Switching reduced motion re-creates Lenis at the actual position without stopping native scrolling. The OS reduced-motion setting remains respected.
6. Hidden documents pause the persistent frame loop; restoration re-evaluates actual position. A bfcache pagehide retains the controller for pageshow; a nonpersisted pagehide tears it down.
7. The root dataset exposes `activeChapter`, `storyProgress`, and the active `transition` / `transitionProgress` for repeatable browser assertions.

## Reviewed technical references

- [Lenis official repository](https://github.com/darkroomengineering/lenis). The network fetch timed out in the engine pass; the official README and implementation distributed in installed **lenis 1.3.27** were read locally. Checked: manual RAF, actualScroll, scrollTo, native input, reduced-motion behavior, recommended CSS, resize, and destroy. Lenis 1.3.27 already includes CSS scroll-margin and scroll-padding in element navigation, so the controller does not subtract a second header offset.
- [GSAP ScrollTrigger reference](https://gsap.com/docs/v3/Plugins/ScrollTrigger/), reviewed 2026-11-09. Numeric scrub can continue after scroll stops and update timing differs from raw trigger progress. The project chooses a custom direct evaluator, so GSAP is not an installed runtime dependency.

These references support implementation choices; no external art is copied from them.

## Final recovery and evidence interpretation

The final controller excludes zero-area hidden bridge markers in still mode and passes an explicit empty bridge array. It checkpoints measured reading positions on the existing animation clock, rate-limiting session writes to at most once per 500ms and history writes to once per 1000ms. A route-validated session backup and semantic chapter/bridge fraction support reload after selection-dependent layout changes. The saved early failures, pending-checkpoint observation, and subsequent actual rechecks remain separate in the QA report. Do not infer a browser pass from these implementation descriptions.
