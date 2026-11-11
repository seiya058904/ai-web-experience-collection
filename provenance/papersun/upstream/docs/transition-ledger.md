# Transition ledger

The ten boundaries are defined in `src/story.ts`. Every progress value is local to its transition. The pure evaluator in `src/story-state.ts` derives each transition from measured chapter positions and the current scroll position: start = next chapter top − viewport height; end = next chapter top. State never depends on earlier playback.

## Five authored frames

| Boundary | Tracked anchor / opaque handoff | 0% | 25% | 50% | 75% | 100% |
| --- | --- | --- | --- | --- | --- | --- |
| TR-01-02 | Amber attic lamp and cut rooftop edge / Paper window frame | Missing circle and city hold. | The attic lamp grows; sky remains present. | The window frame masks the foreground; the desk appears beyond. | Mira and the tools take the stage; city recedes through the window. | The warm room and original lamp hold. |
| TR-02-03 | Note corner and linen pin / Opaque paper note | The workbench is complete. | The pinned note rises. | The note fills the reading plane; the first exact contour appears. | The other two contours enter; desk props frame the sheet. | The complete three-piece map holds. |
| TR-03-04 | Red thread pinned through the map edge / Map edge meeting roof walkway | The map and three outlines hold. | The red route leaves the page toward its desk pin. | The map edge aligns with the attic roof walkway. | Roof planes take depth; Mira steps outside. | The connected night roof path holds. |
| TR-04-05 | Red thread and warm paper lantern silhouette / Thick market canopy edge | Rooftops and thread remain legible. | Canopy edges enter the distance. | One lamp aligns with a roof slit behind opaque paper. | Market layers and the unlit lantern become primary. | The repairable lantern stage holds. |
| TR-05-06 | Piece A’s notch and the red thread / Opaque market banner | The market repair scene holds. | The exact outline of Piece A remains stable. | The banner veils the location handoff; thread continues. | Curved hill layers replace the stalls. | The hill and pinned wind-wheel hold. |
| TR-06-07 | Pinned wheel outline and red thread / Wheel silhouette, then valley arch | Aligned wheel and Piece B hold. | The view passes the wheel on a fixed path. | The wheel becomes near occlusion as the valley arch enters. | Indigo paper planes develop valley depth. | The third-fragment valley stage holds. |
| TR-07-08 | Three distinct pieces and the valley arch / Opaque blue bridge arch | Piece C holds beneath the arch. | All three separate pieces remain identifiable. | Thread traces toward a blue bridge contour. | The bridge edge covers the valley as Mira enters. | The homeward bridge stage holds. |
| TR-08-09 | Blue arc and red guide thread / Opaque blue arch matched to curved desk support | Bridge, Mira and separate pieces hold. | The thread guides across the last span. | The opaque arch aligns with the curved attic work surface. | Room props take over; all pieces remain separate. | The repair table and disc outline hold. |
| TR-09-10 | Exact repaired disc and red thread rig / Registered attic window edge | The stitched circle rests on the table. | The rig lifts it without changing local piece coordinates. | The disc passes the window on a registered vertical path. | The original sky opening appears at matching scale. | The disc reaches the aperture; warm light begins. |
| TR-10-11 | Repaired circle and original attic lamp / Foreground paper roof reveal | The returned sun and warm light hold. | The view withdraws to reveal the roofs and new shadows. | The amber attic lamp remains visible beneath its roof. | The city panorama and captions become quiet. | The lamp closes the story. |

## Recovery and portrait composition

| Boundary | Mobile / reduced motion | Target-owned fallback | Browser evidence |
| --- | --- | --- | --- |
| TR-01-02 | Two framed room and city states retain the aperture silhouette. | Attic composition with the same lamp and window. | READY TO TEST |
| TR-02-03 | Two note-opening states with all three shapes available. | The complete readable note and exact three contours. | READY TO TEST |
| TR-03-04 | A door-to-roof pair, connected by visible thread. | A complete roof path with anchored red thread. | READY TO TEST |
| TR-04-05 | A single foreground stall reveal with spacious copy. | The complete market stall and red thread. | READY TO TEST |
| TR-05-06 | Market and hill still states with the same carried piece. | The hill composition and carried Piece A. | READY TO TEST |
| TR-06-07 | Wheel silhouette and valley still pair. | The complete valley arch and red thread. | READY TO TEST |
| TR-07-08 | A readable found-pieces strip beside the bridge. | The complete bridge with three separate pieces. | READY TO TEST |
| TR-08-09 | Two stage views with the same thread termination. | The prepared repair table with all three distinct shapes. | READY TO TEST |
| TR-09-10 | Staged lift stills preserve the exact disc and its three seams. | A sunrise composition with the same repaired sun. | READY TO TEST |
| TR-10-11 | Two stable panorama and lamp-detail states. | The complete ending, repaired sun and amber lamp. | READY TO TEST |

## Shared scene contracts

1. **Coordinates and identity.** Theatre layers use a fixed scene coordinate system scaled uniformly within their stage. The hero aperture and ending disc share the same screen registration. The disc itself uses the immutable 200 × 200 SVG coordinates in `fragments.ts`; red rigging is anchored to that disc. Mira has one body design and fixed pin pivots.
2. **Media join.** A window, paper note, canopy, banner, wheel silhouette or arch supplies the opaque foreground handoff named in the table. These are two spatial compositions joined by a physical occluder; no arbitrary object morph or transparent duplicate character is intended.
3. **Depth and light.** Far paper, near paper, object/contact shadow, subject, red thread and foreground occluder maintain a stable draw order. Raking illumination enters from the same side; late warmth changes light and paper color coherently.
4. **Text.** The outgoing chapter’s reading/focus region leaves before the incoming region owns its hold. Narrative prose remains real DOM text. Decorative art must not intercept pointers.
5. **Reverse and random access.** Progress evaluation is a pure function. The exact same normalized progress renders the same major composition regardless of approach direction. A direct midpoint must not rely on a previous collection, animation completion or image callback.
6. **Loading.** Asset readiness selects detail/fallback, never another chapter. Any asynchronous asset handler must check a current request token before altering the stage. A failed target uses its own authored composition and retains text and controls.
7. **Reduced motion.** Two stable before/after compositions and explicit action states preserve every piece and narrative outcome. The raw position evaluator retains progress while the renderer chooses a stable stage.

## High-risk acceptance probes

- **TR-01-02:** the lamp never duplicates; the missing aperture is visible from the opening. Test a fast first scroll before hero reveal finishes.
- **TR-08-09:** enter directly at 50%, then reverse. The bridge arch is opaque; one Mira instance and three separate pieces stay traceable until the worktable owns the scene. Test delayed target art.
- **TR-09-10:** compare 0/25/50/75/100% with the opening. Move the one SVG composition by an explicit screen transform; no additional disc, altered radius or missing seams. Test a direct midpoint with the repair interaction not yet completed.
- **TR-10-11:** the repaired sun and original lamp stay in the ending. A warm city panorama is still a complete story scene.

## Test status

Pure direct/reverse transition evaluation at all ten × five quarter positions: **PASS** in `tests/geometry.test.ts`, 2026-11-09, Node v24.22.1. Continuous browser rendering, threshold-neighbor captures, focus and failure probes remain **READY TO TEST** until the main implementation is reviewed.
