# SUPERCELL — Visual Bible

## 1. Creative decision

**A storm sustained by moving air.** The experience follows one idealized storm through five ways of seeing it. A low horizon establishes scale; a small air parcel makes continuous movement legible; an observation plane reveals a model section; changing an illustrative wind condition changes the connected structure; the ending returns attention to the whole storm.

The selected visual medium is a **2.5D composition**: an original AI-generated two-dimensional photographic surface combines with a shared three-dimensional analytic cloud structure and airflow field. Custom WebGL deformation gives the photograph local movement and a controlled structural response. `src/volume.ts` integrates the same field through depth into an explanatory structural texture; it also supplies neighboring observation planes. SVG contours sample this shared field for the plane through the cloud and the detached horizontal section. The result has genuine computed structure and depth relationships, but is not a freely orbitable cloud reconstruction. It does not recover measured density from a photograph or solve atmospheric fluid dynamics. Its scientific scope is explained in [RESEARCH.md](RESEARCH.md).

This document records the selected direction, implemented timing and acceptance targets. It does not claim that a planned test has passed. Actual browser findings, fixes and limitations belong in [ACCEPTANCE.md](ACCEPTANCE.md).

## 2. Real image exploration and decisions

Generation tool: the built-in `image_gen.imagegen` capability. The identifiers below are the actual returned PNG filenames, not proposed assets. All seven images were inspected during visual direction review. Full production textures are packaged locally; only compact reference evidence is needed for unselected directions. Generated words and interface marks in reference images are not production text.

| Exploration | Actual generated source filename | Decision | Adopted qualities and limitations |
| --- | --- | --- | --- |
| Hero A — The Low Horizon | `exec-1cece603-eb5e-42e9-9137-2ff02a02f90b.png` | **final asset** | Primary landscape photograph. Low plain, warm anvil extending left, tall angled tower right, substantial dark base, separate rain curtain. The lower-left atmosphere provides the main title's reading zone. |
| Hero B — The Oblique Monument | `exec-8d17ae46-982d-4829-b242-64ee920f8b27.png` | **rejected** | The elevated camera makes the outline legible but reduces the bodily scale of seeing weather from the ground. Retain only a small reference as evidence of the distinct alternative. Do not use as a chapter background. |
| The Visible Interior | `exec-a88982aa-1696-4c99-a8f7-340b5dacdee4.png` | **reference only** | Adopt thin section correspondence, restrained density contours, and a right-side reading area. Replace its static contour illustration with computed geometry. Do not reuse its different cloud photograph or its rendered labels. |
| Portrait — The Vertical Tower | `exec-466c13a4-d851-4721-a513-911c39d6cb92.png` | **final asset** | Independent portrait composition, rather than a crop of Hero A. An upward tower, partial anvil, low ground and visible rain create a phone-specific framing. This is a responsive artistic view of the same idealized subject, not calibrated multi-camera capture. |
| What Keeps It Alive | `exec-8a313022-9c09-498e-8be0-f2ec9740d014.png` | **reference only** | Adopt the single readable inflow → rise → outflow gesture and no more than three explanatory labels. Use the selected Hero A/portrait photograph and actual computed paths in production. |
| A Change in the Wind | `exec-40281b43-9de4-41ea-9189-d77eae1d8ae5.png` | **reference only** | Adopt the integrated observation/condition area and stable viewing direction. Reject the serif type, duplicated control wording, glowing center and interpretation of a static image as an interactive comparison. All production typography remains local Manrope sans-serif. |
| Still Moving | `exec-6b7ca8e1-af1e-4143-8ee2-d530f942a7b9.png` | **reference only** | Adopt the generous ending statement and understated revisit/reset/source actions. Reuse the current storm and its retained conditions rather than replacing it with the concept's different cloud. |

### Comparison outcome

Hero A has the strongest relationship between the immense illuminated upper cloud and the thin inhabited-looking ground. Its diagonal tower and leftward anvil create both a clear directional identity and useful quiet atmosphere for type. Hero B offers stronger detached-object readability, but that comes at the cost of the ground observer's scale. The portrait result resolves the narrow view through a fresh vertical composition. The section and subsequent concepts define interaction hierarchy; their literal photographs, approximate labels and incompatible typography do not become assets.

## 3. Protagonist, camera, light and material

**Protagonist.** A connected, weighty daytime cloud with a bright anvil, inclined tower, darker base and offset rain. The cloud remains soft at its boundaries and structured in its large light/shadow masses. It has no hard shell or assembled mechanical parts.

**Camera.** A distant ground-level observer is the default. Changes in `p` produce small changes of framing and scale; the experience never becomes a fast flight through a glowing tunnel. The horizon, tower and rain region remain traceable. Stopping scroll freezes the framing. Wind comparison holds the camera and illumination steady so geometry, rather than a new view, explains the difference.

**Light.** Broad warm side light on the anvil and tower, with slate and blue-gray shadow. Chapters share one light world. The finale may ease into a slightly more open view, but does not introduce a sunset, storm flash or unrelated palette.

**Material.** Fine cloud texture is photographic. Slow localized deformation and sparse rain movement provide a living hold. Large masses do not wobble like gelatin. There are no neon edges, bloom, rainbow density colors or shiny volumetric shells.

**Geometric anchors.** Ground line; tower centerline; updraft entry; upper spreading region; rain centroid; the user's current horizontal observation height. The full-cloud plane and detached section use the same normalized field and projection conventions. Labels are positioned from the corresponding model point, not fixed decorative screen coordinates that become wrong when `u` changes.

## 4. Palette and typography

| Role | Direction |
| --- | --- |
| Main type | Warm white `#f5f2e9` |
| Section, flow and selection accents | Muted wheat `#dfc39a` |
| Environment | Warm white cloud, lead gray base, slate/blue atmosphere, restrained wheat/gray-green ground |
| Font | Local Manrope sans-serif throughout; a readable system sans-serif fallback |
| Hero | Wide uppercase `SUPERCELL`, large but fully contained in the lower-left reading zone |
| Chapter headings | Short sentence-case statements with lowercase words, airy line height and an intentional two-line measure where needed |
| Supporting copy | Limited line length, comfortable body size; never hidden or compressed to pass a geometry test |
| Controls | Thin, stable rules and native controls; no heavy cards, cockpit panel or decorative glow |

Desktop spacing begins with approximately 48 CSS-pixel outer gutters; phone spacing begins with approximately 24 CSS-pixel gutters. These are composition targets, not reasons to overflow at a narrow width or enlarged text. The header, chapter copy, controls and footer have distinct occupied areas. Type and controls are real DOM elements and remain readable with delayed fonts. Styling is linked from the HTML rather than relying solely on JavaScript injection, so a no-JavaScript introduction and font fallback retain a deliberate composition.

## 5. Five stable compositions

The initial composition studies used reference positions near `p = 0, 0.25, 0.50, 0.75, 1`. Implemented chapter navigation stops at `p = 0, 0.28, 0.53, 0.77, 1`, safely inside each stable hold. The intervening transition intervals remain as defined below. Each act allows a useful pause with the whole storm still recognizable.

| Act and stable progress | Enter and stable composition | Living hold | Handoff and exit |
| --- | --- | --- | --- |
| I — The Weight of Air, `0` | A recognizable complete storm exists on first meaningful paint. Hero title occupies the lower left; anvil stretches above, tower rises right, the horizon stays low. | Only localized cloud detail and sparse rain move. The camera stays still. | Title gives up its zone before explanatory copy appears; a small inflow cue draws attention to the same cloud base. |
| II — What Keeps It Alive, `0.28` | A slightly closer view retains the same horizon and outline. One path explains entering air, rising air and upper spreading; at most three key labels. | One trackable parcel follows the authored continuous field. A visible note explains that air paths are illustrative. | The parcel becomes partly obscured inside the cloud as the observation plane starts entering; path explanation clears before section explanation takes over. |
| III — A Section Through the Sky, `0.53` | The cloud carries a fine horizontal observation plane. A corresponding density section sits in the right reading area on desktop, below the image focus on phones. | Slice Height changes `h`; plane, density contours, core location and labels update together. Empty or weak intersections are presented honestly. | Keep the exact user height. Introduce the environmental comparison in the same reading area; no second dashboard appears. |
| IV — A Change in the Wind, `0.77` | Same subject, section height, view and illumination. A restrained control changes the authored wind condition. | The cloud's tilt, airflow and precipitation relationship respond to the same `u`. Reference / Change / Return remain explicit choices. | Keep `u/h`; explanatory layers withdraw toward their observation position. The whole cloud becomes primary before the ending copy. |
| V — Still Moving, `1` | A slightly wider whole-storm view preserves the chosen condition. “The shape remains. The air moves on.” sits outside the complicated cloud texture. | Small ambient movement can continue; revisit, reset and sources stay available. | There is no forced restart. Reversal restores the observation layer at the retained `u/h`. |

## 6. Transition intervals and deterministic ordering

The sole narrative position is normalized `p`. For each interval `[a,b]`, local handoff progress is `q = clamp((p-a)/(b-a), 0, 1)`. Use a monotonic smoothstep for visual interpolation if needed; never integrate enter/leave offsets over time. Reversing at the same `p/u/h` evaluates the same composition. The ambient clock cannot alter chapter position or the user's condition.

| Boundary | Global `p` interval | Shared visual anchor | Required takeover |
| --- | --- | --- | --- |
| I → II | `[0.10, 0.24]` | Low horizon, cloud outline, inflow location | Hero type → inflow cue → path → short chapter title → supporting explanation |
| II → III | `[0.35, 0.48]` | Tower, parcel location, selected height plane | Path explanation → observation plane → sampled interior → corresponding detached section → section controls |
| III → IV | `[0.60, 0.72]` | Same section, same `h`, same camera | Section explanation → comparison heading/control → user action → linked structural change |
| IV → V | `[0.84, 0.97]` | Current cloud condition, plane and rain region | Condition explanation → section returning to cloud → explanation withdrawn → independent whole cloud → ending statement |

### Text alpha and interaction order

The implemented common text contract evaluates the chapter group (heading and its short supporting copy) from the same smoothstep weight: outgoing text fades from opacity 1 to 0 over local `q = 0…0.46`; incoming text begins at `q = 0.54` and reaches 1 at the boundary's end. The breathing gap prevents two chapter groups sharing the reading zone. The persistent header and progress marker remain visible throughout. The ending has the deliberately later exception described below.

Interactive controls are enabled only when their chapter's reading layer is active. Inactive sections must leave tab order and pointer interaction rather than becoming invisible hit targets. Persistent values remain in state even when their controls are hidden. Exiting a chapter never rewrites a slider value.

The section/condition UI has a separate visibility envelope from the structural observation plane. It enters over global `p = 0.415…0.48`, after the earlier airflow copy has cleared, and exits over `p = 0.84…0.90`. The plane may continue its spatial handoff as that UI disappears. This separation prevents early controls from colliding with outgoing copy and lets the storm take over without a lingering panel.

For IV → V, the final statement waits until local `q = 0.80`, equivalent to global `p = 0.944`; it reaches full opacity at `p = 0.97`. The chosen `u/h` remains intact while the UI fades. A late ending entrance is part of the actual timing contract, rather than a cover for unfinished explanatory layers.

### Layer order

1. Local poster/photo environment remains the foundation.
2. The WebGL photographic layer and shared-field depth projection replace the poster's appearance only when ready; no blank handover.
3. The shared model's observation plane, trajectories and density contours sit within the storm view.
4. Diagram labels occupy their own safe positions and remain tied to model anchors.
5. Chapter copy and controls occupy explicit reading regions.
6. Header, progress navigation and accessible modal surface remain above the scene.

The layer order is consistent in both directions. A local cloud occlusion can hide a parcel, but no opaque full-screen mask may hide a broken transition.

### Required handoff stills

| Boundary | 0% | 25% | 50% | 75% | 100% |
| --- | --- | --- | --- | --- | --- |
| I → II | Hero complete | Hero type recedes; low inflow cue appears | Same cloud closer; parcel begins rising; reading zone clear | Old title absent; path readable; short new heading arrives | Stable airflow composition |
| II → III | Airflow stable | Plane reaches the same cloud's edge | Local observation reveals sampled structure; outer identity persists | Detached section and plane visibly correspond; height scale enters | Stable usable section |
| III → IV | Section at user height | Old explanation recedes; section remains | Same `h` and view; no automatic condition change | Comparison heading and controls become legible | Stable comparison, awaiting or preserving user input |
| IV → V | Chosen condition visible | Copy/controls withdraw without changing values | Section returns along its observation relationship; view opens | Explanation is gone; full cloud can stand alone | Ending statement and actions readable |

Reverse the same ordering by evaluating `q` backward. In particular, backward entry from V must show the same wind condition and height; backward entry to I must recover the title without rerunning initial resource loading.

## 7. Phone, tablet, short-screen and 4K composition

### Phone: 320–390 CSS pixels wide

Use the independently generated portrait photograph. The cloud tower drives the composition upward; cropping part of the anvil is intentional, while removing the tower or the ground scale is not. Use an upper scene region and a lower reading/control region. Do not squeeze text and controls into narrow columns on either side of the cloud.

The header remains compact. Hero type scales to the available line width without letter clipping. Subsequent headings use short controlled measures. For section/comparison acts, the plane remains visible in the cloud region while the matching section and controls appear below. A height slider needs a real touch target and adjacent step controls; the image is not a substitute for the control. Stacked content may use normal document flow in reduced-motion or constrained-height layouts to keep all instructions available.

At 320×700 and 360×640, prioritize title, explanation and usable control separation over optional labels. Remove decorative ticks before making necessary text unreadably small. Native focus must remain visible and above the scene. Touch cannot depend on hover. A phone's browser chrome and safe-area insets must not cover the end actions or bottom progress. Enlarged text and short landscape windows require actual layout reflow and safe reading areas; they are not handled by scaling down a finished screenshot.

### Tablet: 768×1024

Retain the vertical cloud emphasis but give the section more width. Choose stacked or offset reading regions according to the actual available height; do not treat a tablet as a compressed 1440-pixel desktop. The scene and the control must remain distinguishable at a glance.

### Desktop and short windows

At 1440×900 and 1920×1080, preserve the leftward anvil, low horizon and bottom-left title. Use the right side for the section and controls without turning it into a solid card. The reading area has sufficient atmospheric contrast and does not occupy the brightest complex cloud edge. Short windows reduce ornamental labels, vertical gaps and viewpoint inclination before they sacrifice essential copy.

### 2560 and 3840 widths

Use real viewport rendering for verification. Enlarge the composition and typography deliberately, but keep supporting-copy line lengths and control widths constrained; neither should stretch across half a 4K display. Thin lines must remain legible at the chosen CSS scale. Use bounded, adaptive WebGL drawing buffers rather than assuming the full viewport's native pixel count is an appropriate render budget. Shared-field integration is rebuilt on condition changes, not every frame. Rendering-quality changes retain the same coordinates and control state. The 4K test demonstrates layout at that viewport, not that the generated source contains native 4K photographic detail.

## 8. Interaction ownership and fallback art direction

`p` controls camera, chapter text and observation mode. `u` controls the authored wind condition; `h` controls normalized section height. Only user actions, including an explicit reset or Find the Updraft action, modify `u/h`. Reset Storm changes those values without moving scroll. Back to Opening changes scroll without clearing them.

The analytic field is the common source for the observation plane, detached contour geometry, airflow relation and depth-integrated structural texture. `src/volume.ts` samples along depth and records artistic opacity/near-structure/depth information; this is computed from the same density function used by the visible section. The photograph's deformation and material shading remain an artistic projection of that structure, not a measured reconstruction. Changes stay within the source photograph's plausible range. The chosen 2.5D medium is explicit: a photographic surface, a real shared three-dimensional illustrative field, and computed projections, rather than a claim of a complete physically rendered atmosphere.

Without WebGL, retain a complete local photograph, a Canvas 2D projection and the same semantic controls with the SVG explanatory structure. Label the section as illustrated; `?fallback=1` provides a deliberate inspection path. Reduced motion keeps all chapters and parameter comparisons, suppresses continuing micro-motion and steps between stable observations. Resource failures retain the embedded poster and readable font fallback. Without JavaScript, the local HTML/CSS provides a static introduction; the interactive chapters require JavaScript.

Optional locally synthesized wind begins off and is not required for understanding. Pause motion leaves the controls usable. There is no default lightning or full-screen flash.

## 9. Fidelity decisions and explicit deviations

- The landscape and portrait production images preserve the selected photo direction. The other generated scenes are compositional references, not five interchangeable backgrounds.
- Concept-generated headings, labels, section percentages and buttons are replaced by actual DOM type, native inputs and computed values.
- The serif lettering in the shear concept is intentionally rejected; Manrope is the consistent production family.
- The detached section and depth projection are computed from the shared analytic model. Their correspondence is algorithmic, but they are not radar or a measured cloud density scan.
- The reference's strong warm center is reduced to restrained wheat contours. No glow is required to explain the updraft.
- The same source photograph and framing anchors persist between acts; camera motion and deformation are restrained because aggressive image warping would damage the cloud's physical character.
- The portrait artwork is an independently authored view with the same visual language. It is not claimed to be the same instant photographed from a second calibrated camera.
- The delivery favors reliable local assets and real interaction over a costly fluid solver. Performance claims must refer to actual browser measurements, with device and emulation limitations recorded.

## 10. Stage gates and review evidence

1. **Research and real exploration:** confirm the four primary sources, Lenis/GSAP APIs, two distinct Hero routes and the visible-interior exploration; preserve actual generation records and decisions.
2. **Direction lock:** use this Visual Bible, the chosen landscape/portrait assets and the shared model contract before expanding the production layout.
3. **Prototype gate:** render Hero, first handoff and a usable section in the target desktop and phone compositions. Inspect a real screenshot and verify that `h` changes the actual shown structure. Resolve failures before expanding the final two acts.
4. **Full narrative gate:** all five stable compositions and all four transition intervals exist; forward/back/fast jumps preserve `u/h` and text separation.
5. **Independent review perspectives:** engineering/interaction review checks state, inputs and lifecycle; visual/motion review checks weight, composition, hierarchy, handoffs and the weakest act.
6. **Delivery gate:** run the exact viewport/zoom/error/recovery matrix in `RESEARCH.md`; record performed tests and gaps honestly; extract the final ZIP and verify install/build and local asset paths.

Evidence should include first paint, the opening hold, all stable acts, each boundary at 0/25/50/75/100%, representative reverse/fast movement, phone and 4K frames, and visible-text geometry scans. Playwright 1.56.1 provides the reproducible browser harness. The recorded environment is Linux, headless Chromium 141 and SwiftShader software WebGL; it is not physical-device validation, and Safari/Firefox are not in the recorded coverage. Enlarged-layout screenshots must state their actual zoom method. [ACCEPTANCE.md](ACCEPTANCE.md) records completed checks, fixes and limits without treating the checklist itself as a pass. Fix an observed state, timing or layout cause rather than covering it with a full-screen mask.

### Final control refinement

Across all screen sizes, the height scale continuously contracts into its retained value as wind comparison enters. The main flow labels clear by `p = .415`, ahead of incoming section copy, while the cloud path completes its handoff by `.47`. A short tangent arrow inside the illustrated section is sampled from the same `flowPoint()` trajectory at the selected height. Its position and direction change with `u`; its constant display length does not represent a wind-speed measurement. Short desktop windows use a more compact section layout, and resize retains normalized narrative progress as well as the chosen parameters.
