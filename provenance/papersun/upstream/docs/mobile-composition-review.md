# Mobile composition review

Review basis: actual browser captures in `docs/evidence/mobile-ch01.jpg` through `mobile-ch11.jpg`, at a 390 × 844 CSS phone viewport inside the QA harness. At the time of this review, the CH08 image was missing from that set; its row below is a coordinate review, not a visual pass. The captured browser reported a 375-pixel visual viewport inside the 390-pixel layout, so subjects close to the right edge require extra clearance.

This review distinguishes the defects visible in the original captures from code corrections made afterward. It does not claim that the corrected states have already passed a new browser capture.

## Findings and corrections

The main mobile composition defect was disagreement between native art coordinates and guessed mobile overlay positions. Non-city phone scenes crop the same 1586 × 992 plate as desktop. Their props therefore need either to stay on the original physical anchor or to be deliberately restaged inside the visible native span. Setting a prop near native x793 did not place it at the phone's visual center: the shared crop could hide it at the left edge.

| Chapter | Evidence in initial capture | Correction in `src/stage-props.ts` | Camera or copy follow-up |
|---|---|---|---|
| CH01 | Portrait aperture and amber attic are legible. | No prop change. | Preserve authored portrait composition. |
| CH02 | Mira is visible, but the actual lamp is cropped to the right. | Mobile Mira at native (950,500), scale .80; desk note remains registered at (1125,722). | Main scene now uses horizontal crop position .90 to include the physical lamp around x1415. |
| CH03 | The note extends off the right edge; not all three canonical shapes can be read together. | Mobile note at (855,375), width400, with all outlines, pins and thread scaled together. | Main crop position .76. The smaller complete note is a more useful quest object than a large partial close-up. |
| CH04 | Portrait city and Mira are within frame. | No change to the authored portrait thread or puppet placement. | Verify route feedback in its activated state. |
| CH05 | Foreground unlit lantern sits against the right crop. | Repair light, frame and exact A remain at the physical lantern coordinate (1180,535); mobile Mira moved to (1005,669), scale .70. | Main crop position .77 provides lantern clearance. Repaired-state capture still required. |
| CH06 | Mira and the lower-right lamp approach the right edge. The rotor belongs to the visible native post. | Rotor fixed to native axle (1065,255) on both sizes; removed the separate guessed phone axle/post. Mobile Mira at (1145,600), scale .65. Released B retains the same local rotor relationship. | Main crop position .80. The native rotor is high in the image; text contrast and clearance remain a layout concern. |
| CH07 | Shade and physical hinge pin are cut off on the right. | Flap remains at (985,375), local hinge (375,0), so its world hinge is exactly (1360,375). Mobile Mira at (970,685), scale .62. Exact C remains behind that same flap. | Main crop position .84 includes the actual hinge. Check the open flap and revealed C, not only the closed initial state. |
| CH08 | Browser screenshot unavailable in the reviewed set. | Preserved bridge Mira at (1072,345), scale .77, with compact contact shadow. On phone, cloth and found pieces share a .54 outer scale at (1138,500), keeping them together near the character and bridge deck. | Suggested main crop position .90 to include the distant attic window near x1440. This is a recommendation awaiting a browser capture. |
| CH09 | The root sun's prior mobile center (793,525) put its left edge outside the phone. Target and sun were not registered together. | Target center is (1095,650), radius140 on both sizes. Mobile Mira at (920,520), scale .55, leaving her visible beside the repair. | Root restored the single sun to the same native center and uses crop position .90. Verify all three placed pieces and the complete outer circle. |
| CH10 | Sun sits behind the lead/action text and dark reading treatment, reducing the climax. | No extra sun or prop added. | Root is adjusting heading size, lead spacing and sun/readability stacking. A new completed-state capture is required. |
| CH11 | Same sun/readability conflict as CH10. | Existing portrait Mira retained at (572,1368), scale .40. | Check restored city, exact sun aperture fit, final text and actions together after layout corrections. |

## Shared scene registration

`renderProps` and `renderFallback` now pass the real mobile flag into the non-city prop layout. Background fallback plates remain in their common native coordinate system. City portrait scenes retain their independent 853 × 1844 coordinate system.

Desktop prop coordinates remain unchanged. The repair target uses the same native center as before on desktop; mobile now shares it. The wheel and shade use their physical clean-plate pins on every device. This avoids a second axle, a floating hinge or a misregistered repair circle.

At 390 × 844, the non-city stage scales by approximately .629. With the current main camera positions, the native horizontal spans are about 869–1489 for attic/repair, 734–1354 for note, 744–1364 for market, 773–1393 for wind, and 811–1431 for valley. These spans explain why coordinates near x1050–1200 are dependable for phone actions. Very narrow or unusually tall viewports still need browser verification because a cover crop changes the visible span.

## Integration handoff

The transition forelayer module contains four older mobile anchors that should follow the corrected objects: the arriving note pin at approximately (879,393), the departing note thread at approximately (1056,715), the wind axle at (1065,255), and the valley hinge at (1360,375). The main implementation owner was notified. That module, the camera and the text styles were not edited as part of this mobile prop pass.

## Validation status

TypeScript compilation passes after the changes. All 88 SVG combinations across 11 chapters, desktop/phone layouts, initial/completed memory and prop/fallback renderers contain finite values and parse as XML. This confirms structural validity; it does not substitute for inspecting the new phone captures. The open shade, repaired market lantern, released wind fragment, carried pieces, repaired sun and sunrise/ending text clearance still require visual confirmation after the main layout integrates these changes.


## Final phone composition refinement

The subsequent real-browser review found three defects that coordinate checks alone did not catch: the repaired disc crossed its feedback text, the short-phone ending title crossed the lifted disc, and pale roof edges weakened prose/action contrast. These were corrected in `src/scene-renderer.ts` and `src/style.css`.

The repair camera now keeps the native disc's lower edge at least 138 CSS pixels above the viewport bottom when necessary. The plate, target, puppet and single root sun use the same frame. `SceneRenderer.layout` publishes the feedback gap from that exact disc edge and the measured controls height; the feedback stays in normal document flow with a 14-pixel gap below the disc. This replaces a guessed viewport-height margin that could cover the lower rim.

Late-city prose uses the final sun's lower edge to calculate its reading gap. Prose, controls and feedback have a continuous navy reading backing. Phones no taller than 700 CSS pixels use 32-pixel titles and a compact introduction. When a width-cover crop would hide the attic resident, the late-city stage is slightly inset, preserving the complete sun, Mira and amber window together; its side edges fade into the theatre. The 390 × 844 composition keeps the full-width portrait artwork. This initial phone refinement did not change desktop framing; the later desktop camera correction is recorded in `viewport-review.md`.

The first critical retake, `local-phone-final`, contains 16 actual captures across 320 × 700, 360 × 640, 390 × 844 and a supplementary 390 × 844 sunrise. All 16 measured checks passed. A visual review inspected the three repaired-disc views, the three ending views and the sunrise view: all three sun pieces are visible, the disc clears its controls and feedback, titles clear the lifted disc, and the resident/lamp remain visible. These are intermediate captures; `local-acceptance` and `local-boundary-final` provide the final viewport evidence and record exact build references per case.

The lift transition requires its own check: settled chapters alone do not prove that incoming text clears a moving sun. The main implementation delays incoming phone reading during TR09; final transition evidence is recorded by the separate continuity suite.

## Final breakpoint correction and retake

The complete viewport matrix exposed a distinct 699–700 × 900 defect. Width-cover scaling enlarged the portrait art until the aperture reached behind the fixed header and the amber attic left the lower frame. A final rule for widths 501–700 caps the portrait stage around its authored aperture-to-attic span, retaining an undistorted inset paper theatre. Hero and CH04 title widths are bounded beside it. Narrower phone compositions are unchanged.

The final `local-boundary-final` run records 30 actual cases across 320 × 700, 360 × 640, 390 × 844, 699 × 900, 700 × 900 and 701 × 900. It covers hero, CH04, TR08–09 midpoint, assembled CH09 and ending at each size. All 30 measured checks pass with no runner errors on `index-DELhVtXL.js` / `index-7hykGXpd.css`.

Actual final 700 px hero/ending and 699 px CH04 images were inspected: aperture and restored disc are complete, titles are separated, amber window and Mira are present, and controls remain readable. The three required phone assembly/ending pairs were also inspected in the complete-matrix images. This is Chromium CSS viewport evidence with `hasTouch:false`, not physical-device or touch certification. Exact matrix outcomes, retained CSS-zoom failures, fallback-font review and final build scope are documented in `viewport-review.md`.
