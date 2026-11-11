# CARGO — Acceptance plan

Reviewed against the supplied Edition 2.0 brief on **2026-11-09**.

This is a test plan, not a test result. A case is accepted only after its actual outcome and evidence are recorded in `requirements-evidence.md`. An unexecuted case remains `NOT TESTED` or `NOT STARTED`. The source ZIP is the primary deliverable. Local testing is authorized; publication, hosting, Git pushes and changes to the existing Collection are outside scope.

## 1. Release gates

| Gate | Required observation | Evidence to retain |
| --- | --- | --- |
| G0 — Inspect | Read the full brief and applicable instructions; confirm source, browser, image-generation and build access. | Environment facts and any genuine tool blocker. |
| G1 — Research and images | Consult primary sources; retain eight actual generated outcomes; inspect their geometry and typography safety; lock a visual bible. | Source review, exact image prompts, result files, honest selection record, visual bible. |
| G2 — De-risk | Build and observe hero-to-interior, yard-to-lift and lift-to-deck before expanding the expensive implementation. | First/quarter/mid/three-quarter/final frames, continuous browser observation and failure/correction notes. |
| G3 — Complete narrative | All eleven chapters contain two meaningful beats, an independent reading hold and a working interaction. All ten boundaries are authored. | Chapter/transition ledgers, direct links and actual state captures. |
| G4 — Artistic correction | Independently identify the two weakest non-hero chapters and weakest transition; visibly improve them. | Before/after captures and concrete explanations of what changed. Avoid self-awarded visual scores. |
| G5 — Production acceptance | Test the production build in a real browser; fix observed issues and rerun the affected cases. | Build log, browser/actions log, viewport and recovery matrix, visual evidence, known limitations. |
| G6 — Reproducibility | Extract the final ZIP into a different clean directory; follow the documented install/build/preview commands. | Extraction listing, install/build output, first/middle/last chapter checks, packaged asset verification. |

## 2. H1–H9 decision criteria

| ID | A pass requires | Reject when |
| --- | --- | --- |
| H1 | CH-01 through CH-11 have distinct content, two substantive beats, stable reading holds, incoming and outgoing continuity, and a complete ending. | Loader, footer, repeated wallpaper, an empty pin or a spare paragraph is counted as a chapter. |
| H2 | All six hero states work and resemble the selected concept in framing, light, materials, identity and text safety. | Blank first frame, box identity drift, illegible title, blocked scrolling, or return state differs from the opening. |
| H3 | Eight separately inspectable, actually generated image outcomes exist, were inspected before production layout/prolonged modeling, and have exact provenance. | Only prompts, stock photos, mocked tool outputs or one image relabeled as multiple concepts exist. Mark `BLOCKED` if the real tool is unavailable. |
| H4 | All ten transitions have five authored progress stages, stable anchors, ordered depth/text, reversibility, random-access state, mobile treatment and target-specific fallback. | Undirected black fade, translucent double boxes, unsupported movement, stale target or missing midpoint. |
| H5 | One real Lenis instance participates in one authoritative progress clock; all native and explicit navigation paths remain usable. | Double requestAnimationFrame clocks, smoothing/playhead divergence, keyboard trap, broken hash/history or forced intro completion. |
| H6 | English DOM text and labels remain readable and selectable across all relevant views, fonts, zoom and transition states. | Image-baked fake lettering supplies meaning, titles collide, text clips, inactive captions stay focusable or invisible text blocks input. |
| H7 | A production build, real production-browser actions, independent aesthetic/interaction inspection and corrective retests are evidenced. | Build success substitutes for browser verification or observations are reported without having occurred. |
| H8 | Full story and all meaningful control results survive narrow/large layouts, reduced motion, resource failure, slow loading and unavailable WebGL. | Later chapters disappear, a target falls back to an unrelated scene, controls lose their results, or failed assets leave a blank story. |
| H9 | Complete distributable source and assets, lockfile, English documentation, evidence and known limits are in a ZIP that installs and rebuilds after extraction. | Required private/runtime dependency is missing, hard-coded workspace paths remain, the ZIP is untested, or unauthorized publication occurs. |

## 3. Chapter checks

For every chapter, record four observations: **beat A**, **beat B**, **stable reading hold**, and **interaction with reset**. Capture at least one representative desktop and phone state. A text description of a beat is insufficient if the corresponding visual state never exists.

| ID | Two meaningful beats | Interaction and expected result | Continuity and specific rejection |
| --- | --- | --- | --- |
| CH-01 — One Box | Establish the lone red box under a monumental gantry; move close enough to recognize its corrugations, fictional mark and upper-right door scratch. | Identify BOX-001, Corner fittings, Doors and Reset view expose real object details and restore the original view. | The same grounded box enters the first transition; reject a generic clone or an invisible identifying detail. |
| CH-02 — Within the Walls | Show a finite empty interior with wall thickness and door aperture; show the authored cargo arrangement with visible clearances. | Empty/Packed updates the diagram and accessible state; switching back restores the empty volume. | Container proportions remain consistent; retain this exact cargo arrangement for CH-11. |
| CH-03 — Closed and Recorded | Show credible hinge and bar geometry; show closed doors, illustrative seal and a fictional transfer record. | Open/Closed changes the actual door state; seal is visible only in the closed condition and is explicitly illustrative. | Same hinges, bars and scratch; no interpenetration or claim that the seal guarantees security. |
| CH-04 — Overland | Establish the road carrier as a separate object; show the container seated and grounded on that carrier. | See the connection exposes the lower-corner/support relationship and can be dismissed/reset. | No floating box or unsupported autonomous loading sequence. |
| CH-05 — Intermodal | Isolate the road support situation; expose the rail support situation without unpacking. | Road/Rail, Compare supports and Reset carrier change selected support and true selected state. | The same box dimensions, paint, corner and scratch persist; show Conceptual transfer. |
| CH-06 — Across the Land | Follow the selected box on coherent wagons; pull back to grounded rails, landscape and scale. | Find BOX-001 points to the same actual box and resets to the wide view. | No false GPS; no new box or missing scratch when revisited. |
| CH-07 — The Yard | Establish lanes, grounded stacks and gantries; reveal the selected box in a plausible stack location. | Locate the container emphasizes its actual location and returns to the overview. | Selected row/scale stays stable; no floating stacks or identity switch. |
| CH-08 — The Lift | Align and engage the spreader at top corners; raise the engaged box toward the vessel. | Inspect the lift gives a stable view with three clearly related component labels; closing/reset returns to the composed view. | Spreader contact precedes lift; cables remain credible and no duplicate box appears. |
| CH-09 — Open Water | Establish the box at a defined deck position; reveal the small vessel within extensive open water. | Find the red box returns attention to its real deck position and can be reset. | No unsupported cargo, changing ship, false live tracking or exaggerated storm. |
| CH-10 — Another Shore | Show reception at an explicitly fictional berth; show onward movement toward the receiving facility. | Compare ports presents genuinely different fictional locations, with an Illustrative locations note. | Paint, scratch and ID persist despite the new coast/light. |
| CH-11 — Open Again | Match the earlier closed door hardware; reopen to the exact CH-02 cargo and offer a genuine route recap. | Open/Closed is reversible; recap links target the actual road, rail, port, sea and destination chapters. | Earlier history is not rewritten; returning to CH-01 restores its original state. |

### Control checks shared by every interactive chapter

1. Observe and record the initial state.
2. Activate each control with pointer or touch emulation, inspect the actual visual and accessible result, then change to a different state.
3. Reset and compare with the initial state.
4. Repeat by keyboard; verify focus visibility and meaningful selected/pressed state.
5. Leave the chapter, jump elsewhere, return and check the documented local-state policy.
6. Repeat the meaningful result in reduced-motion/still mode and when the scene image fails.

## 4. Hero: six required states

| State | How to observe | Required invariant |
| --- | --- | --- |
| First meaningful image | Cold navigation, then delayed/noncritical image loading. | Refined box/gantry art or a deliberate matched still appears with real English title; no black loading wall. |
| Reveal | Observe continuously while using normal input. | Restrained camera/atmosphere reveals scale; scrolling stays available. |
| Complete composition | Pause after media is ready at 1440×900 and 390×844. | Compare with AI-04 and purpose-built AI-05; text-safe space, grounded box and coherent crane. |
| Living hold | Stop input and watch the settled frame. | Identity and text remain fixed. Any prolonged ambient animation has an effective reduced/pause alternative. |
| First scroll | Traverse TR-01-02, pausing at 25%, 50% and 75%. | A visible corner/doorframe leads into the interior; no texture flight through a zero-thickness wall. |
| Return | Reach a later chapter or open CH-11, then return to the opening. | Exact original ID, scratch, door state and corner position return. |

Repeat the first-scroll/return cycle **three times**. Record the cycles; do not infer repeatability from a single capture. Also scroll during the reveal and test the Follow the container CTA's actual CH-02 destination/focus.

## 5. Transition staging contract

The percentages below are local to a boundary, not page percentages. Every stop must be a deliberate composition. Record front-to-back layer order and the outgoing/incoming caption handoff for each implemented boundary. The incoming chapter always owns the final state.

| ID and shared anchor | 0% | 25% | 50% | 75% | 100% |
| --- | --- | --- | --- | --- | --- |
| TR-01-02 — top corner/corrugation | Grounded hero box and gantry | Approach known corner and door | Doorframe in foreground; floor visible | Interior dominates; walls keep thickness | Empty interior hold |
| TR-02-03 — hinge/locking bar | Packed interior visible | Doors rotate from their real hinges | Coherent partial closure | Closed bars and seal region | Closed transfer record |
| TR-03-04 — lower corner/support | Closed grounded box | Chassis enters at coherent scale | Lower corner aligns with carrier | Road carrier and legitimate shadow | Grounded road hold |
| TR-04-05 — unchanged corner | Road support established | Support detail becomes focal point | Opaque transfer frame hides carrier change | Wagon support and rail contact emerge | Rail support hold |
| TR-05-06 — wagon/red corrugation | Box seated on wagon | Track marked side | ID visible as rails converge | Terrain and horizon establish scale | Wide rail hold |
| TR-06-07 — corrugation/lane lines | Rail arrival and selected box | Ground guide reaches yard edge | Foreground stack hides relocation | Target lane and selected box readable | Grounded yard hold |
| TR-07-08 — top corners/lifting beam | Box supported in yard | Spreader approaches alignment | Spreader engages; opaque beam crosses | Engaged box raises with cables/shadow | Controlled lift hold |
| TR-08-09 — box bottom/deck bay | Box suspended near vessel | Ship side begins to occlude crane | Box matches a defined deck location | Crane exits; horizon opens | Box supported among deck stacks |
| TR-09-10 — horizon/deck identity | Calm sea and vessel | Horizon gains prominence | Land/port appears through same cloud band | Destination berth gains perspective | Fictional arrival hold |
| TR-10-11 — bars/scratch | Arrival approach | Door side becomes prominent | Warehouse frame aligns with bars | Same hinges open to matched cargo | Interior and recap hold |

### Execution for each boundary

1. Capture 0/25/50/75/100% in forward order and inspect their composition; that is **50 checkpoints per complete path**.
2. Observe continuous slow movement, then a fast skip. Retain a short real scroll recording for the three high-risk handoffs.
3. Traverse backward and confirm the same positions reconstruct the same important state.
4. Enter directly at the midpoint without prior playback. Test just before and after entrance/exit thresholds.
5. Fail the target image/resource. Verify the target chapter's authored still/diagram, copy and interaction remain available.
6. Repeat the complete path at 1440×900 and 390×844. On phone/reduced motion, deliberately composed matched plates may replace camera flight; all outcomes and continuity cues remain.
7. Record any intentional matched-plate substitution as such. Do not call a 2.5D illustration a freely rotatable 3D simulation.

### Physical identity invariants

- One documented parameter schema supplies container dimensions, door face, upper-right scratch, CARGO / BOX-001 mark and corner positions.
- Road chassis, rail wagon, lifting spreader and ship deck are different entities; the container is retained across their handoffs.
- Door rotations have real pivots and a consistent opening direction; CH-02 and CH-11 use the same cargo arrangement.
- A box leaves support only after a visually credible attachment or a clearly disclosed matched editorial handoff.
- No transparent double of the selected box may substitute for an occlusion or a validated matched frame.
- Random jumps CH-02 → CH-07 → CH-09 → CH-11 → CH-01 must reconstruct each chapter independently of prior playback.

## 6. Scroll and navigation matrix

Record the expected chapter, actual chapter, target focus and selected navigation item for each case.

| Input/recovery path | Required behavior |
| --- | --- |
| Wheel/trackpad | Natural progress, no forced cinematic completion or nested trap. |
| Scrollbar drag | Immediate deterministic target composition without delayed old scene takeover. |
| Arrow/Page keys, Home/End and Space where native | Native navigation remains usable and does not depend on pointer input. |
| Touch emulation | Vertical document navigation and all chapter controls work with practical hit areas. |
| Chapter menu and recap links | Real hashes target every chapter; selected state and focus are predictable. |
| Direct hash load | Correct target chapter before any previous scene has played. |
| Mid-page refresh | Restored/direct state has matching title, art and controls. |
| Back/Forward history | Prior explicit navigation is reconstructible and does not create an accidental history flood. |
| Rapid A → B → C navigation | A late B asset completion cannot overwrite C. |
| End-to-top reverse and return from CH-11 | Original hero and all intermediate identities restore. |
| Browser find | Main English story remains searchable and reachable. |
| Resize/orientation/background resume | Measurements and progress recover without duplicate listeners or triggers. |

Inspect the actual installed Lenis version and integration. If a GSAP ticker drives `lenis.raf`, Lenis autoRaf must be disabled. Native/Lenis progress, DOM, masks and any canvas must derive from one authoritative snapshot. Record disposal and refresh behavior where present.

## 7. Responsive and accessible coverage

### Required viewports

| CSS viewport | Minimum coverage |
| --- | --- |
| 320×700 | Hero, longest paragraph/title, menu, hardest transition, most complex control and ending. |
| 360×640 | Same risk-based coverage, including short reading height. |
| 390×844 | Complete eleven-chapter, ten-transition path, interactions and reduced-motion equivalents. |
| 768×1024 | Risk-based coverage, menu and change of layout. |
| 1440×900 | Complete eleven-chapter, ten-transition path and all active controls. |
| 1920×1080 | Risk-based coverage and image/text scale. |
| 2560×1440 | Risk-based coverage and bounded visual/reading measure. |
| 3840×2160 | Risk-based CSS-viewport coverage; do not call this physical 4K hardware testing. |

Also test both sides of each actual CSS breakpoint, one short landscape view, and representative **125%, 150% and 200% browser zoom**. CSS viewport changes alone are not a claim that browser zoom was tested.

### Accessibility observations

- Document language is `en`; headings and landmarks expose the story in coherent order.
- All meaningful text is selectable DOM or justified accessible SVG text. Decorative art is hidden from assistive technology when adjacent prose supplies the meaning.
- Keyboard-only operation reaches the chapter menu, its links, all controls and ending. Focus is visible; Escape closes overlays and focus returns to the opener.
- When section links move reading focus, they do not hide the target under a fixed header.
- Hidden captions/panels are removed from the focus order and do not intercept pointer input.
- Color, hover and motion are not the sole carriers of meaning. Labels/notes provide equivalent results.
- Buttons have clear names and practical touch targets. Selected state is exposed with the appropriate pressed/selected semantic.
- Reduced motion honors the OS setting and the UI control, preserves all eleven chapters, and maintains the result of every interaction. Smoothing/camera travel may be disabled.
- Any prolonged ambient motion can be stopped/reduced. Audio, if included, begins silent and has an immediate off control. An unavailable-audio control clearly reports that state rather than pretending to play sound.
- Font-before/after states, fallback font metrics, narrow layout, long titles, zoom and moving light behind text are visually inspected.

Run an unintended-CJK scan over authored source and extracted visible/ARIA UI strings, then proofread English. Regex success does not prove fluent copy or detect fake image lettering.

## 8. Failure and recovery probes

| Probe | Expected result and evidence |
| --- | --- |
| Critical/target image fails | The current chapter's authored visual fallback, complete copy and controls remain; a useful error/retry state is available if appropriate. |
| Slow loading | First meaningful art/readable text remain; navigation does not wait for all later assets. |
| Out-of-order resources | A delayed old target never replaces the current scene; reproduce rapid jumps while target responses are delayed. |
| Late or failed font | Readable fallback metrics; no overlapping/vanished controls after swap. |
| WebGL unsupported | Whole story and interaction outcomes remain through still/SVG/DOM alternatives. If WebGL is not used, document that fact and verify no WebGL dependency. |
| WebGL context loss | Same chapter still appears and navigation continues; record `NOT APPLICABLE` in notes only when no WebGL exists, while ledger status reflects the checked nondependence. |
| Resize and orientation change | No blank stage, duplicate selected scene, clipped essential content or broken chapter offset. |
| Background/resume | Progress and controls recover; hidden rendering is paused if applicable. |
| Repeated round trips | No accumulating animation clocks/triggers and no increasing retained resources beyond documented caching. |

## 9. Measured performance and environment

Record actual browser/version, CSS viewport, DPR, throttling/network conditions, test timestamp and whether hardware is known. Distinguish measurements from targets.

Measure cold navigation, first meaningful artwork, completed hero and first usable interaction. Observe long tasks and frame pacing during hero/interior, yard/lift and lift/deck. Observe resource/memory behavior across repeated full round trips where supported. Include the measurement method and known limitations; do not manufacture FPS, physical-device results or Core Web Vitals.

Reference targets are **LCP ≤ 2.5 s, INP ≤ 200 ms and CLS ≤ 0.1**. A local synthetic interaction sample is not automatically a field INP value. There is no mandatory image-byte or triangle-count budget in the supplied brief: establish practical limits from measured bottlenecks and record them, without deleting chapters to meet a number.

Read-only environment inspection at plan creation found Node **v24.22.1**, npm **11.9.0** and bundled Playwright **1.62.1**. These are environment observations, not project dependency selections or browser-test results. The environment reports managed Sites preview; use the supported browser workflow and do not treat an installed browser library as permission to bypass it.

## 10. Image and source evidence

| ID | Required distinct result |
| --- | --- |
| AI-01 | Wide gantry/box hero candidate with text-safe fog. |
| AI-02 | Nearly orthographic warehouse object portrait with floor contact. |
| AI-03 | Elevated intermodal geometry with trucks, rails, stacks and sea. |
| AI-04 | Genuine selected-concept desktop refinement with coherent box/backplate strategy. |
| AI-05 | Purpose-built portrait composition, not a center crop of AI-04. |
| AI-06 | Mid-story lift keyframe with credible spreader/corner engagement. |
| AI-07 | Late-story sea keyframe with a plausible ship and identifiable deck position. |
| AI-08 | Yard/lift transition midpoint with an opaque beam and one engaged red box. |

For each result retain its exact prompt, actual tool, returned parameters only, retained file path, role, inspection notes, selected/rejected rationale and rights/provenance. Record whether it is a production image or a modeling/composition reference and where the result is redeemed in the real browser. Do not invent a seed. Avoid generated typography and company logos. Distribute only appropriate legal assets; compact review copies may document rejected concepts without bloating the source package.

The source review must distinguish facts, fictional locations/cargo/operator, composite scenes and technical approximations. Precise dimensions and standards revisions require actual primary evidence. The fictional exhibit mark is not a valid BIC registration. An ordinary door seal is not represented as a universal security guarantee.

## 11. Independent visual review and issue records

Review actual browser captures separately from functional assertions. Assess art composition, text safety, scale/material consistency, foreground/background depth, selected-box continuity, scene variation and physical contact. Compare the hero to AI-04/AI-05, lift to AI-06 and midpoint to AI-08.

For each issue, record: reproducible steps, environment, expected outcome, actual observed outcome, severity, screenshot/recording path, implementation change, and the actual retest result. Identify the two weakest non-hero chapters and weakest boundary even if no code exception occurs. Their corrections must be visible in content, material, framing, layout or motion. Close an issue only after rerunning the relevant behavior; leave genuine limitations explicit.

## 12. Source ZIP and clean rebuild

The final `cargo-source.zip` must include:

- Complete HTML, TypeScript, CSS, authored SVG/shader/component code and build configuration.
- Pinned dependency manifest and lockfile, with no private dependency requirement.
- Selected legal images and any essential models, plus compact eight-image provenance/selection evidence.
- English `README.md` with prerequisites, Windows PowerShell and cross-platform install/start/build/production-preview commands.
- `VISUAL-BIBLE.md`, source/rights documentation, requirements ledger, chapter/transition evidence, actual results, evidence index and honest known limits.
- A local start path and complete production preview instructions.

Exclude dependencies, caches, secret values, browser profiles, personal information, unlicensed media, enormous rejected generations and hard-coded private workspace paths. Verify the package file listing and media references. The archive hash, if provided, belongs beside the archive rather than inside a self-referential manifest.

Extract to a different clean directory and follow the README literally. Install from the lockfile, build, start the production preview, then open first/middle/last chapters and verify all packaged media paths. Record actual logs and outcomes. A successful build in the original working directory does not establish clean reproducibility.

## 13. Final acceptance wording

Only report the site as accepted when H1–H9 have material evidence. If the environment blocks a required result, preserve the completed source, clearly mark the exact requirement `BLOCKED`, and describe the remaining verification. Never convert `NOT TESTED` to `PASS` by implication. Do not claim physical-device, Safari, real high-refresh hardware or unexecuted network coverage.
