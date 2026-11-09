# MEND — Independent Code and Requirements Review

Review date: 9 November 2026.

## Scope and evidence boundary

This review inspected `src/main.ts`, `src/state.ts`, `src/scene.ts`, `src/style.css`, `index.html`, the launch instructions, and the supplied execution brief. It used source inspection, the installed Lenis implementation, and a small arithmetic reproduction of the chapter/trial thresholds. It did **not** run a browser, inspect a live WebGL rendering, or certify visual fidelity.

The application was revised during the review. The findings below distinguish an observed source correction from a browser-verified result. The main delivery report, [ACCEPTANCE.md](ACCEPTANCE.md), owns actual browser coverage and unresolved limits.

After the initial independent findings, this reviewer was assigned the bounded SVG fallback diagrams. Their implementation and TypeScript check are recorded here, but their authoring is not presented as an independent visual review.

## Findings and source-level corrections

| ID | Location and observed problem | Minimal correction | Source follow-up |
| --- | --- | --- | --- |
| CR-01 | `src/scene.ts`, road displacement: the original `roadHold` became 1 at story 7.95 while the outgoing chapter's progress was already 1, then became 0 at the next chapter anchor. This introduced a forward jump and reset in the long-table walk. | Derive an explicit road progress from the actual section index; pass it separately from the interpolated story pose. | Rechecked: `main.ts` supplies `roadProgress`; `scene.ts` consumes it. Reduced motion uses stable endpoints. Motion continuity still needs the live renderer. |
| CR-02 | `src/main.ts`, `advanceTrial` call: the original active window ended at story 6.18 while CH-07 remained current until 6.5. Starting a trial in that interval immediately paused it on the next frame. | Use the current displayed trial chapter as the activity gate and retain full trial displacement through that interval. | Rechecked: activity uses `currentChapter === 6`; scene weighting remains full through 6.5 before handing off. Mobile button placement still requires a browser check. |
| CR-03 | `src/main.ts`, `sampleStory`: accessible scene text described a fitted repair even while a before-trial or before-comparison view showed the original fault. | Derive accessible wording from the displayed before/after state, independently of the saved repair plan. | Rechecked: the before overrides are included. |
| CR-04 | `src/main.ts`, repair input handlers: default A was already checked, so a `change` listener alone could not register clicking A as an explicit choice. Continuing with A also left it marked as an untouched example. | Commit on an explicit input click and on the continue action; preserve same-plan trial results. | Rechecked: `commitChoice` is used by click, change, and the continue link. |
| CR-05 | `index.html`, dialogs; `makeLenis`: overflowing modal content lacked the nested-scroll exclusion expected by the installed Lenis implementation. Wheel input could be consumed by the page smoother. | Give each modal `data-lenis-prevent`, leaving its native overflow scrolling intact. | Rechecked: both dialogs carry the attribute. Actual wheel/touch behavior remains a browser check. |
| CR-06 | `src/main.ts`, dialog close and chapter navigation: immediate reduced-motion navigation focused a chapter heading, then the queued dialog close handler could restore the opener and take focus away. | Suppress opener restoration when chapter navigation owns the destination focus. | Rechecked: navigation uses `closeDialog(false)`, which clears the opener. |
| CR-07 | `src/main.ts`, graphics retry: retrying from a graphics failure inverted `stillMode` into true, so a successful first retry still displayed the illustrated view. | Set the requested object mode explicitly during a retry. | Rechecked: retry selects object mode explicitly. |
| CR-08 | `src/main.ts`, asynchronous scene initialization: repeat mode changes while the scene import was pending could start multiple initialization continuations, replacing a renderer without disposing it. | Keep one initialization in flight and disable the toggle until it resolves. | Rechecked: `sceneLoading` guards initialization and the toggle is disabled while loading. |
| CR-09 | `src/main.ts`, retry after actual context loss: clearing the failure flag while retaining a scene whose internal context remained lost could reveal a blank live canvas. | Keep the illustrated fallback until the existing scene reports restoration, or replace the lost scene safely. | Rechecked: the existing lost scene now retains the illustrated fallback until graphics return. A real context-loss test is still required. |
| CR-10 | `src/main.ts`, `document.fonts.ready`: a late font completion always navigated to the current chapter hash, even if the visitor had already taken over scrolling. | Capture the initial hash and perform its one-time restoration only if no user navigation/input has occurred; always remeasure. | Rechecked: an initial-hash guard and user-input flag protect the deferred restoration. |
| CR-11 | `src/main.ts`, still-mode interactions: clearance and fitting only changed explanatory text, while the trial translated the whole photograph, including the bench. That did not demonstrate the required part relationship or rolling movement. | Provide exact lightweight diagrams driven by the same state; keep the photographic environment still. | Source remedy added in `src/diagrams.ts` and `.css`. Root integration supplies the state and removes photograph translation. Browser input/rendering is separate evidence. |
| CR-12 | `src/main.ts`, `artForChapter`: CH-09 used the long-table image for A but fell back to the repair close-up for B, losing the late-story spatial composition in that branch. | Supply a branch B long-table image and select it explicitly. | Rechecked: `long-road-B.webp` exists and is selected for B in CH-09. Its visual quality remains an art/browser review item. |
| CR-13 | Still-mode comparison: two independently generated photographs cannot establish a precisely registered same-pose comparison merely by replacing one with the other. | Use one fixed schematic toy pose for the actual before/after comparison; identify the photograph as a repair-detail reference. | The diagram module includes this fixed-pose comparison and optional `compareState`. Final placeholder/state wiring and browser review belong to the main acceptance record. |

## Trial-window arithmetic evidence

The original mapping held the chapter at story 6 until section-local progress 0.36, then used `(local - 0.36) / 0.64` for the outgoing handover. The original playback gate ended at story 6.18.

| Section-local progress | Story value | Displayed chapter | Original trial gate |
| --- | --- | --- | --- |
| 0.3600 | 6.00000 | CH-07 | Active |
| 0.4752 | 6.18000 | CH-07 | Paused |
| 0.5000 | 6.21875 | CH-07 | Paused |
| 0.6000 | 6.37500 | CH-07 | Paused |
| 0.6790 | 6.49844 | CH-07 | Paused |
| 0.6800 | 6.50000 | CH-08 | Paused |

This arithmetic proves the state-window mismatch; it is not a screenshot or an assertion about the exact onscreen location of a button at a particular viewport. The revised source removes that mismatch. Long mobile content, small-height viewports, and keyboard-driven scrolling still require actual interaction checks.

## State, wording, and export observations

- `createInitialState` reads only valid own data properties and does not restore trial completion, inspection focus, or comparison state from storage. The choice persists independently of the story.
- Plan changes clear the previous trial; reselecting the same plan preserves its progress/result. Before demonstrations do not claim a repaired success.
- Early chapter views use the original fault without deleting a selected B plan. The return-wheel flag is exclusive to B after the repair.
- `syncState` derives repair wording, return contents, and the final trial record from the current state. The repair-card export reads those same record fields and uses consistent Pip/Lan/He names.
- Both branch narratives retain the ear, worn paint, and sun. The B wording identifies the rear wheel as new rather than calling it original.
- The built CSS inspected during this review used relative `../fonts/…` paths. This source/build observation does not replace an actual extracted-archive subpath test.

No contradiction was found in the inspected letter or repair-card export wording. The source observations above do not prove that the user downloaded the file successfully in every browser.

## Bounded fallback diagrams

The module exports `mountDiagrams().update(frame)` and installs no event listeners or timers. It updates native SVG attributes from the explicit application state.

- **Fault:** a fixed axle/body section with a wheel edge that changes from actual contact to visible clearance.
- **Fitting:** A keeps the original wheel mounted while a pale sleeve approaches; B moves a new wheel into position and displays the original only in its return bag.
- **Trial:** four wheel groups and one toy move over fixed ground. Wheel angle is calculated from distance divided by radius. The before path stops at the obstruction, and the repaired path uses the same endpoints.
- **Comparison:** the same enlarged toy group remains at a fixed pose with zero wheel spin. Only the rear-wheel condition changes; ear, paint, and the underside sun keep their positions.

`tsc --noEmit` passed after the module and comparison extension were added. Diagram layout, visual clarity, and interaction wiring have not been browser-verified by this reviewer.

## License copies

The following notices were copied byte-for-byte from the installed packages into `docs/licenses/`, and the copies were compared with their source bytes:

- `Three-MIT.txt`
- `Lenis-MIT.txt`
- `Vite-LICENSE.md` — includes the package's bundled dependency notices
- `TypeScript-Apache-2.0.txt`
- `Types-Three-MIT.txt`
- `Newsreader-OFL-1.1.txt`
- `DM-Sans-OFL-1.1.txt`

This records the copied direct-package/font notices, not a claim that every possible future dependency or asset has been reviewed.

## Documentation and delivery follow-up

1. Record the actual graphics limitation in `ACCEPTANCE.md`. An environment with a disabled WebGL renderer can validate the illustrated/diagram route; it cannot verify the Three.js visual result or nine continuous model handovers.
2. Update the production asset table if additional branch images such as `long-road-B.webp` or texture files are delivered. Keep their exact provenance in the generation log.
3. Keep still references, static transition frames, continuous movement observations, pure state tests, and production-build results as separate evidence categories.
4. State which desktop/mobile CSS viewports, zoom levels, reduced-motion changes, resource failures, keyboard paths, and physical devices were actually exercised. Uncovered items remain unverified.
5. The final archive still requires its own extraction/install/build/preview verification and final ZIP hash. The Windows launcher must not be described as executed on Windows unless that was actually done.

No deployment, publication, repository push, or external account mutation was performed by this review.
