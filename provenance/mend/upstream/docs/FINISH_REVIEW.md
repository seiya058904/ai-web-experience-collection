# MEND — independent finish review

## Disposition

**Final visual approval is blocked pending a capture of the correct, current build.** This review supports a clearly qualified local source delivery; it does not establish that the full browser acceptance matrix passed.

The review found three concrete model and recovery defects. All three have now been corrected in source; the two geometry corrections have also received the bounded independent checks recorded below. No further source change is requested by this review. Rendered appearance and input behavior remain separate validation gates. No deployment, publication, repository push, or release was performed by this reviewer.

## Scope/evidence

- Reviewed the supplied execution brief, `PRODUCT.md`, `DESIGN.md`, `index.html`, application/state/scroll/scene/diagram code, styles, focused test source, requirements ledger, README, and self-contained packaging helper.
- Directly inspected the actual `inspection.webp` and `repair-A.webp` art. Their matching view and recognizable Pip support the still comparison, but source images are not screenshots of the running website.
- Executed bounded Node/Three.js raycasts against the exact body silhouette, extrusion settings, and transforms from `src/scene.ts`. These checks can establish intersection and clearance; they cannot establish appearance, lighting, readability, or animation quality.
- The execution lead reports 14 passing state and scroll tests. The reviewed tests address choice persistence, branch truth in the pure state helper, explicit trial behavior, interruption, reduced motion, and numerical scroll continuity. They do not exercise the rendered scene or browser controls.
- The execution lead reports one earlier desktop capture at 1348 × 925 CSS pixels: the image fallback, with WebGL unavailable, before the later image-containment and diagram fixes. The supplied screenshot path was unavailable to this reviewer, so it was not independently inspected. It is not evidence for the current live 3D scene or final responsive layout.
- The execution lead reports that subsequent managed previews served unrelated projects, the browser extension returned `ERR_HTTP_RESPONSE_CODE_FAILURE`, and a local-file browser route was rejected by protocol policy. This reviewer did not retry browsers or launch another server.
- The single detector warning reported by the execution lead, `flat-type-hierarchy`, is an explained false positive: it treated headings as 16 px because the external TypeScript-imported stylesheet was not resolved. The actual stylesheet specifies an opening heading of 104–190 px, chapter headings of 44–78 px, and 16 px body copy on the desktop route. This does not substitute for a responsive typography check.

## Material findings

### 1. P1 — live memory details were inside the wood; corrected and geometry checked

**Location:** `src/scene.ts`, underside sun and move marks.

The original sun plane was at local `y = 0.635`; the actual beveled underside at its center is `y = 0.5675639`. The wood therefore occluded the element that CH-03 asks the visitor to preserve. All three move marks were similarly inside the body at `y = 0.637`.

The sun now sits at `y = 0.560`. Nine sampled rays across its plane found at least **0.0075639 model units of outward clearance**. The three marks now sit at `y = 0.578`, `0.582`, and `0.586`; their upper corners clear the body by at least **0.0004287**, **0.0008319**, and **0.0008874** model units respectively. The third height includes the final correction for its rotated corner. The focus point has also been moved to the sun's new height.

This resolves the identified occlusion mechanism in the sampled geometry. A live underside capture remains necessary to judge the actual decal and mark appearance.

### 2. P1 — underside supports penetrated the tilted body; corrected and geometry checked

**Location:** `src/scene.ts`, support construction and CH-03 tilt pose.

At the original full tilt of `-1.03` radians, each support extended to `y = 0.81`. Upward rays at the support centers hit the body underside at `y = 0.7142373` and `0.7059302`, giving overlaps of **0.0957627** and **0.1040698** model units. Rays farther back within those same blocks showed overlap of approximately **0.226–0.229** model units. This is a physical intersection, not an aesthetic preference.

The rectangular blocks have been replaced by narrow, fitted cradles with sloping roofs and pose-derived placement. This reviewer evaluated the actual new source helpers and raycast the exact resulting meshes at **five tilt angles × two supports × 25 top points: 250 samples**. No sampled support/body overlap remained. The smallest clearance where the body was above a support was **0.0014999879 model units**. Both support bases stayed at **`y = 0.0120000001`**, the intended workbench contact level. At the first two sampled poses, the supports were still outside the body footprint; later samples checked the approach and full tilt.

This is a bounded regression check of the identified intersection. The cradle silhouette, perceived contact, and full continuous handover still need visual inspection.

### 3. P1 — retrying a lost graphics context could hide the working fallback; corrected in source

**Location:** `src/main.ts`, view toggle and scene initialization; `src/scene.ts`, context-loss guard.

The previous view-toggle handler cleared `graphicsFailed` while retaining the scene whose private context state was still lost. The application could then hide its illustrated fallback and select a live scene that deliberately returned without rendering.

The handler now keeps the fallback active while the existing scene awaits `webglcontextrestored` and announces that state. Scene initialization also has an in-flight guard and a second scene/disposal guard after the asynchronous import. The resulting source control flow addresses the identified failure and duplicate-initialization path. Context-loss, retry, and recovery still require actual browser confirmation.

## Strengths

- The implementation retains the brief's particular object and story: a worn wooden Pip, four mounted wheel identities, two axles, the red cord, a chipped ear, and a recorded underside memory. It does not turn the story into a shop or a generic card dashboard.
- A/B choice is independent of story sampling. The renderer, still selection, captions, and final record distinguish the retained original wheel plus sleeve from a replacement wheel plus return bag. Earlier story chapters do not erase the saved choice.
- Trial playback is an explicit action. The before case stops at 22% of the path; the repaired case reaches the endpoint. Leaving the chapter or backgrounding pauses playback, and saved choice data does not restore a previous completed trial as new evidence.
- The new fault, fitting, and trial diagrams provide meaningful visual responses even when WebGL is unavailable. The trial diagram derives wheel rotation from traveled distance while the ground stays fixed. Branch-specific fitting text and imagery also remain available in DOM/SVG.
- One caller-owned Lenis RAF and a pure scroll sampler coordinate the story. Image completion checks the current requested art key, which protects the current chapter/repair branch from a stale image completion.
- Authored content is English; inspection and trial actions use native buttons, repairs use radio controls, and dialogs include focus restoration. These are sound implementation choices, with browser accessibility verification still outstanding.
- Formal local art, font/license records, run helpers, and the packaging helper make the project reviewable. The optional self-contained HTML helper explicitly distinguishes static embedding checks from runtime validation.

## Remaining validation

1. Rebuild and validate the exact delivery after the final source changes. Do not treat an earlier build or screenshot as evidence for the changed files.
2. Verify the preview identity before testing it. Capture the actual final desktop and mobile layouts, then traverse all ten chapters in A and B, including direct entry, reverse scrolling, and the final record. Inspect the nine handovers both at stopped intermediate positions and during real input.
3. Observe the sun, all three marks, support contacts, four mounted wheels, fitting states, return bag, and trial interruption in the live scene. Check the still/graphics-failure route separately; it is a supported route in its own right.
4. Exercise keyboard focus, chapter dialogs, radio selection, trial controls, comparison, download, reduced motion, phone-size layouts, zoom, and short landscape. Source semantics alone do not establish readable or usable composition.
5. Reproduce context loss/recovery, slow and failed assets, background return, and a plan change during loading. Confirm that the current target remains visible and the final record remains accurate.
6. Run the final archive from a clean extraction using the documented commands. Browser runtime for `MEND-Offline.html`, Windows launcher execution, physical devices, other browser engines, performance timing, and the full viewport matrix remain **unverified** unless separately recorded with actual evidence.

The remaining gate is validation of the final artifact, not a request to redesign the established workbench world.
