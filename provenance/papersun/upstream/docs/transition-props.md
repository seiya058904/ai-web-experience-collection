# Transition foreground and physical ownership

`src/transition-props.ts` supplies deterministic foreground paper for the ten adjacent boundaries. `renderTransitionProp(index, progress, mobile, width, height, memory)` returns a pointer-inert decorative SVG, or an empty string at a settled endpoint. It has no animation clock, asynchronous asset work, inventory mutation or stored playback state. Indices are zero-based; index 4 is TR05, CH05 → CH06.

The coordinator in `src/main.ts` owns the scene surfaces, takeover masks, narration and the single `#journey-sun`. The transition module now also owns one shared journey puppet, holder and discovered-piece set during TR05–TR07. The old claim that it never renders a puppet no longer describes the implementation. It still never creates a joined sun.

## File guide

| File | Relevant responsibility |
| --- | --- |
| `src/fragments.ts` | The immutable A/B/C paths, centroids, circle and shared seams. |
| `src/carrier.ts` | Native `PaperPose` convention; Mira/hand/holder poses; fixture-versus-carrier ownership; fixed separated slots; opaque holder/piece material. |
| `src/stage-props.ts` | Held discovery fixtures and carriers, `miraJoints`/`miraGroup`, wheel contour/pivot and fallback scene composition. |
| `src/transition-props.ts` | `journeyHandoff`, registered paper occluders and `renderTransitionProp`. |
| `src/scene-renderer.ts` | Shared `frameFor` native-to-screen projection and scene asset readiness. |
| `src/main.ts` | `transitionMask`, scene hiding/restoration in `frame`, midpoint staging and root-disc `updateSun`. |
| `tests/geometry.test.ts` | Canonical geometry, story-state and rendered fixture/carrier/table ownership checks. |

## Authored foregrounds

| Index | Boundary | Implemented foreground / owner |
| --- | --- | --- |
| 0 | Missing Circle → Last Warm Room | A fibrous window frame shares the opening used by the room reveal. `windowHandoff` also registers the target room plane to the same amber lamp/window position. |
| 1 | Last Warm Room → Three Pieces | The foreground module returns empty. The coordinator raises and unfolds the actual pinned note from its desk pose; it does not add a detached duplicate corner. Drawn contours appear on that note. |
| 2 | Three Pieces → Roofs | Red thread connects the note route to three registered roof pins. |
| 3 | Roofs → Lantern Market | A scalloped navy canopy edge follows the downward scene reveal. |
| 4 | Lantern Market → Wind Hill | A solid slanted banner veils the location change. One shared Mira, hand-attached carrier and canonical discovered paths own the moving journey. |
| 5 | Wind Hill → Valley | The same six-blade wheel and axle enlarge and darken, then move right out of the viewport while remaining opaque. A solid rim of the actual wheel-centred reveal circle covers the change from the wind ridge to the valley floor. The shared actor, carrier and found pieces change registered poses only while covered. No wheel-to-rock mesh morph is claimed. |
| 6 | Valley → Blue Bridge | Red thread terminates at real bridge posts. A solid rim registered to the actual takeover ellipse covers the change from valley-floor support to bridge-deck support. The shared actor, holder and gold use the same occlusion. |
| 7 | Blue Bridge → Worktable | An opaque blue paper arch and red thread pass over the authored midpoint plate. The arch enters/exits through viewport translation; it does not ghost in through an opacity envelope. The root disc shares the worktable's target mask. |
| 8 | Worktable → First Light | Two red rigging strands use the same table/sky interpolation as the root disc. Loose table gold relinquishes ownership to that disc. |
| 9 | First Light → Ending | A restrained foreground roof lip accompanies the same city, aperture and lamp composition. |

The scene images provide their paper environments; the foreground module is not a substitute for whole-scene rendering. Decorative edges, thread and captions outside the identity-sensitive handoffs can have progress envelopes. Gold ownership, the TR05–TR08 solid handoff groups, the wheel and the blue arch do not use a transparent dissolve to establish continuity.

## Shared native geometry

Journey scenes use native 1586 × 992 coordinates. A `PaperPose` is applied as `translate(x y) scale(scale)` to the original path origin. Fragment centroids are used only to convert a desired slot centre into that origin. Every held and moving loose piece therefore uses the same canonical shape and transform convention.

`carrier.ts` computes the strap contact from Mira's actual back hand: grip `(49,194)`, shoulder `(65,130)`, rotated by the existing joint angle. The holder scale is `.8 × Mira.scale`; its paper body extends left and down, above the boots. The front hand carries the lamp. During a transition, the holder is recomputed from the interpolated puppet/back-arm joint, so it cannot drift independently of the hand.

The exact revealed fixture origins are:

| Fragment / fixture | Native path origin | Scale |
| --- | --- | ---: |
| A, lantern | `(1171,547)` | `.55` |
| B, wheel | `(1095,360)` | `.95` |
| C, arch | `(1055,485)` | `1.32` |

`frameFor()` projects these poses with each scene's actual image scale and offset. Phone crops and contained desktop stages use the same native objects, not independently guessed screen percentages. The bench holder uses native origin `(1410,722)`, scale `.88`; the root repair circle is centred at `(1095,650)`, radius 140.

## One visible physical owner per fragment

Held scenes preserve discovery. If A is currently revealed in the repaired market lantern, A is excluded from that scene's carrier; the same rule applies to B at the steadied wheel and C under the lifted shade. Other found IDs remain in separated holder slots. Releasing the wheel or lowering the shade does not erase a previously discovered piece: it remains carried.

At interior progress of TR05, TR06 and TR07, `.journey-handoff` replaces the underlying physical copies. The coordinator hides both scene actors, both `.source-discovery-piece` sets and both `.carried-pieces` groups, including their fallback counterparts. The overlay contains:

- one `.mira-stage-position.journey-actor` with `data-puppet-owner="transition"`;
- one `.journey-carrier`, attached to that actor's free hand;
- one `data-transition-piece` group for each found ID, with one canonical `data-piece` base path.

The overlay starts at the held source poses and ends at the held target poses. In TR05, a source-fixture piece moves toward its bag slot; if the destination owns that ID at a revealed fixture, the path moves from its bag slot to the fixture pose. TR06 and TR07 make their support and piece-pose changes behind the registered solid edge described below. No new ID is collected by this movement. At the endpoints the overlay is empty and scene ownership is restored. Geometry, placement and visibility can therefore be evaluated in reverse or directly from a midpoint hash.

The former temporary sleeve and 14%–91% carrier opacity window have been removed. They were responsible for a disappearing carrier and the visible duplicate C documented in [the motion review addendum](motion-review-addendum.md). Correct path identity alone did not close that failure.

## TR06: change support behind the actual wheel-centred circle

The wind ridge and valley floor are different physical surfaces. A visible linear interpolation between their puppet positions produced unsupported feet in the retained [before image](evidence/local-tr06-ground-before.jpg). The corrected handoff keeps both held endpoint poses unchanged and moves between them only while a solid paper lip covers the actor, holder and found-piece bounds.

The circle centre is the wheel's native pivot `(1065,255)` projected through `frameFor(5)`. The scene uses CSS `circle(progress × 145%)`; its equivalent SVG radius is `progress × 1.45 × hypot(viewportWidth, viewportHeight) / sqrt(2)`, because circle percentages use the normalized viewport diagonal. The `.registered-valley-rim` uses that same outer circle. Its inner radius subtracts a geometrically changing lip thickness. The thickness is large enough to cover the complete source before the nearest target bounds emerge, including B at the wheel and C beneath the shade. Distance to the target rectangles, rather than only their corners, prevents a large piece from appearing through the opening early.

The source clip is the complement of the outer circle. The covered phase has no exposed actor region. The target clip is the inner circle, so the grounded valley pose is uncovered with its support. The holder and every participating canonical fragment share that clip. The solid lip sits behind the six opaque blades, and its circular edge is not cropped at the desktop reading column. Live narration remains above the decorative foreground. The lip grows and leaves geometrically; it does not dissolve. The corrected static proofs and actual 404 quarters are recorded in [the normal proof report](evidence/local-tr06-ground-proof-v2.json) and [the verified failed-art report](evidence/local-tr06-ground-failure.json). The final empty and collected retakes contain 16 actual clips and 423 compositor frames. Root independently inspected all 162 desktop frames and the research reviewer all 261 phone frames, with a scoped visual PASS for the grounded support, opacity and ownership correction. The reports and limits remain in the independent review; the earlier unsupported-footage record is preserved.

## TR07: change support behind the same physical edge

The valley floor and bridge deck are separate support planes. Moving Mira linearly upward while she remains visible would make her float. `journeyHandoff()` instead computes coverage from the actual takeover ellipse, centred at `(viewportWidth, .78 × viewportHeight)` with radii `1.55 × viewportWidth × progress` and `1.25 × viewportHeight × progress`.

It includes the source actor, holder and source-piece bounds when calculating the covered point. The source remains at the valley-floor pose until covered. A `.registered-bridge-rim` uses the same ellipse, with an inner ellipse forming a solid blue paper band. During the covered interval the actor and holder change to the registered bridge pose. The inner edge then uncovers the grounded destination. Rim thickness changes geometrically and returns to zero; actor and gold share its source/covered/target clip stages.

This is an authored occluded change of support, not open-air travel or a continuous 3D camera reconstruction. The debug attributes `data-support`, `data-covered-at` and `data-reveal-at` identify the staged phase. They help inspect the implementation but do not prove visual success without the actual frames.

## TR08: midpoint and root disc share target ownership

The original overall progress remains the input to the foreground module. Scene ownership is split separately in `main.ts`: the first half reveals the authored midpoint over the bridge; the second reveals the worktable over that midpoint. The midpoint index is 11 and does not own a visible journey puppet or carrier; the coordinator suppresses the spare copies inside its repair-room fallback.

The bridge carrier follows the source actor's handoff and is hidden after the bridge is covered. The worktable carrier belongs to the target scene and is uncovered by that scene's actual mask. Its slots contain every unplaced ID, including a first repair visit with no discoveries; this matches the existing direct-visit repair interaction. Placed IDs are absent from the loose holder and filled only in `#journey-sun`.

For the root disc, `tableReveal = clamp((overallProgress − .5) × 2, 0, 1)`. `updateSun()` converts the same worktable ellipse into the sun element's local coordinates. Its opacity remains 1, and it becomes visible through that mask. The foreground arch is above the disc during this entry. This replaces the old behavior where the disc could fade over a worktable that was already exposed.

TR09 uses the single root disc for the lift. Loose table paths are hidden while the narrative disc owns A/B/C, including a skipped repair. The visitor's `found` and `placed` arrays are not silently rewritten by that narrative outcome.

## Layering, access and verification limits

The foreground is decorative and pointer-inert, below live narration. The root controls whether the arch passes above the disc at TR08 or the disc passes above its rig at TR09. Most desktop decorative foregrounds are clipped away from the left reading column, and phone props use their lower art region. The actual window edge and TR06 circular edge span their complete registered masks; an arbitrary rectangular crop would break their physical boundaries. Meaningful English controls and status text remain DOM content.

Reduced motion uses complete scene states rather than running these intermediate foregrounds. Missing images use the same live ownership rules in authored fallback scenes. Request serials protect newer target scenes from stale asset completion.

The helper and integrated modules have been typechecked. The ownership test exercises discovery flags, found subsets and placed subsets on both layouts; it checks source/holder uniqueness and that loose table pieces plus filled disc sectors equal exactly A/B/C. These are code checks. This document does **not** claim that the corrected moving handoffs have passed visual acceptance before their retakes are reviewed.

The [fresh unplaced-table retake](evidence/local-table-holder-final-results.json) separately covers four actual first arrivals at 320 × 700, 360 × 640, 390 × 844 and 700 × 900 on `index-DkJKhC7c.js` / `index-C8PaC5EY.css`. All four measured checks passed with no page/console errors or launch retries, and all four full-resolution stills were viewed. Three separate loose pieces remain on the visible bench, the root disc is only an outline, and the holder clears the feedback by approximately 12–13 CSS pixels. This closes that initial-hold fit check only. The reviewer authored the pure carrier helper; the independent moving review is recorded separately by the other reviewers.

Required rendered checks include collected and empty states; both speeds and directions; source-to-holder transfer; no duplicate C or B; grounded source/destination support; exact holder-to-hand contact; direct and reverse midpoint entry; opaque wheel/arch edges; fresh unplaced CH09 fit; late/failed art; and the same root-disc mask at TR08. The retained before images and subsequent run reports, not this implementation description, determine acceptance.
