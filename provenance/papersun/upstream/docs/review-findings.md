# PAPERSUN — independent implementation review

Reviewed on **2026-11-09**. This pass inspected `src/main.ts`, `src/assets.ts`, `src/scene-renderer.ts`, `src/stage-props.ts`, `src/style.css`, `src/story-state.ts`, fragment geometry, document metadata, and the installed Lenis integration. It did not operate the browser. Source inspection and a successful build are not substitutes for rendered acceptance.

## Concrete findings and corrections

| Finding | Evidence and reproduction | Correction / review status |
| --- | --- | --- |
| Preview selection could lose keyboard focus | The preview's SVG paths precede its buttons and also carry `data-piece`. The old selector matched a path when a preview choice rebuilt the panel. | Selector now explicitly matches the preview button. **READY TO TEST:** select A/B/C by keyboard and confirm focus stays on the chosen button. |
| Table sun flashed during the bridge handoff | Active chapter identity changes at 50%, while the old sun reveal began at 70%. Between those values the table sun was fully visible, then its opacity dropped to zero. | The animated table-entry branch now hides the sun until its reveal and applies one monotonic opacity ramp. Reduced mode takes the complete target state immediately. **READY TO TEST:** inspect 49/50/69/70/71/75/95% and reverse. |
| Malformed URL fragments threw during parsing | `decodeURIComponent(location.hash.slice(1))` was unguarded; a fragment such as `#%` is not valid encoded input. | Decoding is guarded. Unknown malformed fragments are ignored without interrupting the story. **READY TO TEST.** |
| Returning to an empty hash had no explicit chapter destination | `resolveHash()` handled recognized chapters and transitions, but an empty history fragment did not select the beginning. | Empty hash now navigates to CH-01 without creating a new history entry. **READY TO TEST:** navigate twice, then use Back through the initial URL. |
| About and the text-story link were unreachable from mobile navigation | The direct About button is hidden below 701 CSS pixels, and the chapter panel originally offered no replacement. | The chapter panel now includes About. Switching panels preserves the original opener for focus return. **READY TO TEST:** 390-pixel width, Chapters → About → Escape. |
| Look-closer label could disagree with hero state | Rebuilding controls always wrote `Look closer`, even while `heroClose` remained true; chapter navigation also reset the pose without resetting the old label. | The control label now derives from `heroClose`; navigation resets both. **READY TO TEST:** zoom, scroll naturally, use an action, return, then navigate by chapter link. |
| Recovered discovery flags could contradict the inventory | A version-one object with true repaired/steady/lifted flags and an empty `found` array retained the inconsistency. | Sanitization now restores the corresponding discoveries. Reset scenes retain previous discoveries, and a skipped repair still does not collect pieces. **PASS for the executed data regression; browser recovery check remains separate.** |
| Portrait fallback lost the opening and lamp | The original 1586 × 992 fallback was fitted to the portrait plane. At 390 × 844 its visible SVG x interval was 563.56–1022.44; the aperture's left edge was 1028 and the lamp began at 1053. The ending's Mira began at 1231. | Reported to the owner and the scene-props author for a dedicated portrait composition. **READY TO TEST after their correction:** failed-art hero, roof scene, and ending. |
| Failed bridge midpoint selected the ending fallback | The old `Math.min(index, 10)` mapped transition scene 11 to chapter index 10. | Reported to the owner to use the target repair-room fallback or an authored midpoint. **READY TO TEST after their correction.** |

## Checks actually executed during this pass

The added state-recovery regression ran through `npm run check`. The command completed with **9 passing tests, zero failures**, the English-content guard, strict TypeScript checking, and a production build. A prior build also passed immediately after the focus/hash/sun-reveal corrections. These commands do not establish layout, animation, accessibility, or audible sound acceptance.

The source-level crop calculation used the actual `frameFor(0, 390, 844)` result. It established the initial portrait fallback defect geometrically; it did not claim to inspect a mobile screenshot. Node's experimental type transformation was used only for this diagnostic because the renderer contains TypeScript constructor parameter properties.

## Additional observations

- Asset ownership uses a monotonically increasing renderer serial. A previous scene's asynchronous load is checked before it may update the renderer. This is a useful source-level safeguard; delayed-resource navigation still needs browser evidence.
- There is one Lenis instance with `autoRaf: false`, driven by the GSAP ticker. Lenis scroll events update ScrollTrigger. No second application animation loop was found.
- The wind-wheel has six equally rotated blades, giving its geometry central symmetry. Its fill-box centre therefore coincides with its authored local pin in the inspected source; an off-centre rotation was not established by inspection alone.
- The preview SVG initially used the default completed-sun alternative text even though its seams are hidden. The owner was advised to provide a preview-specific title. Check the final label in the accessibility tree.
- The development hot-reload disposer removes the ticker and destroys Lenis/renderers/audio, but anonymous document/window/media listeners are not collectively removed. A hot module replacement can retain old handlers. This is a development-workflow risk; use a full reload after source edits. Production navigation does not itself invoke HMR. No HMR browser experiment was performed in this pass.

## Independent art observations

All eight mandatory generated images were viewed. AI-04 provides a literal dark circular gap, dimensional roofs, one warm attic, and a clear left reading area. AI-05 is a separate portrait composition. AI-06 and AI-08 establish tactile hill and arch imagery.

AI-02 includes extra gold scraps and a different architectural idiom; AI-03 lights many windows. They should remain concept alternatives, not uncorrected opening plates. AI-07 has simple pie-sector seams rather than the shared interlocking geometry. It is suitable as a lighting/material reference; the production repaired disc must use the authored SVG paths. No image-baked lettering was observed in the eight inspected concepts.

## Acceptance boundary

This review makes no overall H1–H9 acceptance claim. The owning agent's browser results, failure-condition captures, visual corrections, production preview, and extracted archive reconstruction remain the authoritative completion evidence.
