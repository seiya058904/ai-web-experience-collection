# BACKSTAGE — Independent Art Review

## Verdict

**Stage compositions, sampled choreography, and selected interaction outputs: PASS.** The final range-control focus regression is visually closed. No actual visual blockers remain within the reviewed scope.

This was an independent, read-only review of actual rendered screenshots, the Visual Bible, references, and relevant geometry code. Representative phone, tablet, 1440px desktop, and 4K compositions were inspected directly; wing boundaries were checked across all eight required viewport sizes. This verdict does not certify continuous playback, physical devices, performance, every control combination, or exact numerical state reversal.

## Artistic result

The ivory theatre, teal flats, vermilion door, and warm paper lantern form a coherent miniature world. Desktop reading and stage regions remain separate; mobile and tablet place the theatre above copy and controls. The door and lantern remain recognizable at 320px. Final NIGHT has a coherent dark blue coast, a fully visible moon, and a clear moon–door–lantern relationship. The ending visibly returns the lantern along its original rail and warms the doorway.

References **A, B, D, and E** informed composition, palette, theatrical framing, and miniature construction. The implementation is a **stylized geometric interpretation**, with a simpler stepped frame, flatter painted surfaces, and restrained waves. It does not reproduce the references' photoreal material finish. Reference C supplied mechanism ideas; its full-scale auditorium and hanging lantern were deliberately excluded. See [VISUAL_BIBLE.md](VISUAL_BIBLE.md).

## Evidence map

These are logical names for the packaged evidence groups. Retain the original descriptive PNG basenames within each group. The delivery report may select representative captures; this review does not imply that every raw screenshot is included.

| Reviewed working set | Package evidence group | Main use |
| --- | --- | --- |
| `qa/acceptance-final/screenshots/` | `docs/evidence/stable/` | Stable compositions, responsive copy and controls |
| `qa/acceptance-final-regression/screenshots/viewports-*` | `docs/evidence/wing-regression/` | Final wing framing and SEA regressions |
| `qa/acceptance-final-regression/screenshots/transitions-*` | `docs/evidence/handoffs/` | Actual sampled handoff states |
| `qa/acceptance-4k-final/screenshots/` | `docs/evidence/final-4k/` | Final tall-canvas camera, especially Acts IV and V |
| `qa/acceptance-interactions-final/screenshots/` | `docs/evidence/interactions/` | Corrected night handoff, scene targets, controls, exit snapshot, and touch result |
| `qa/acceptance-controls-focus-final/screenshots/interactions-view-light-and-reset--*` | `docs/evidence/controls-focus/` | Final focused View and Light controls, plus reset |

Examples: `viewports-320x700--act-1.png`, `viewports-768x1024--act-4.png`, `viewports-3840x2160--act-5.png`, and `transitions-all-handoffs-both-directions--room-to-sea-forward-50.png`. Generated references remain in `docs/references/` and are marked **reference only**.

## Closed findings

| Finding | Correction and reviewed result |
| --- | --- |
| NIGHT retained bright daylight coastal faces | The existing coast now darkens and cools coherently; the ivory shell remains distinct. |
| Phone moon was partly hidden by the valance | Revised audience sightline exposes the complete disc with clear space above the door. |
| 4K moon top was clipped | Final tall-canvas camera correction passes in Acts IV and V; the full circle clears the curtain. |
| Mobile caption touched the plinth | A separate 32px caption strip prevents overlap. |
| Hidden mobile line break joined “ofmaking” | Literal whitespace restores the correct heading. |
| 320px masthead exceeded the intended inner width | Narrow typography and spacing restore both 18px gutters; document width is 320px. |
| Tablet stable frames partly cropped the masthead | Revised tablet stage height keeps the full wordmark visible. |
| Wing camera clipped the lower platform | Final radius and look-target adjustments contain the model at all eight sizes. |
| Moon batten lacked an apparent grid connection | Source inspection confirms two short brackets linking it to the existing fly grid. |
| Intermediate caption implied the wrong travel direction | “Between audience and wings” describes either direction accurately. |
| Range focus outlines crossed the endpoint labels | Final inward outlines remain clearly visible around the View and Light inputs, with clear separation from Audience/Wings and Low/High sidelight labels in all four focused captures. The reset capture also remains coherent. |

### Final focused-control regression

All five fresh captures in `qa/acceptance-controls-focus-final/screenshots/` were inspected: `interactions-view-light-and-reset--audience.png`, `--wings.png`, `--low-light.png`, `--high-light.png`, and `--reset.png`. The four focused ranges now have a visible vermilion ring contained around the input, leaving endpoint labels unobstructed. The thumb, track, and labels remain readable at both ends. Reset retains the complete NIGHT composition, full moon, and clear controls. This closes the last visible finding; the separate reported geometry assertions were not independently rerun for this art review.

### Final wing clearance

Approximate gap between the lowest dark platform silhouette and the canvas bottom, measured from the final regression images. The pale cast shadow is excluded. Upper grid clearance was also positive at every size.

| Viewport | Lower clearance |
| --- | ---: |
| 320 × 700 | 17.3px |
| 360 × 640 | 10.3px |
| 390 × 844 | 28.3px |
| 768 × 1024 | 17.4px |
| 1440 × 900 | 34px |
| 1920 × 1080 | 40px |
| 2560 × 1440 | 120px |
| 3840 × 2160 | 449px |

## Handoff assessment

Forward 25/50/75% states were reviewed across all four handoffs, with reverse comparisons and representative settled/boundary frames. These are actual sampled render states, not continuous-video evidence.

| Handoff | Artistic assessment and scope |
| --- | --- |
| I → II: audience to wings | **PASS.** The front column and flats create legible physical occlusion as board thickness, supports, and floor rail emerge. The theatre remains present and the red door remains traceable. Reverse samples preserve the same spatial arrangement. |
| II → III: room to sea | **PASS.** At 25%, the near coastal flat temporarily masks much of the door and lantern, while the red lintel remains traceable. At 50%, the teal room/window remains at left, a coastal face appears at right, and wave tips emerge. By 75%, the coast takes over and the lantern advances. No empty stage, transparent double scene, or visible intersection appeared in the inspected samples. |
| III → IV: sea to night | **PASS for the artistic arrangements.** The star backing descends, the same coastal faces darken, and the moon enters behind the valance before becoming fully visible. Its partial occlusion during descent is physically legible. Fresh final 75% forward and reverse captures show the same artistic arrangement. Exact first-entry/return equality remains a separate engineering check. |
| IV → V: director to ending | **PASS for the captured default NIGHT exit and selected ROOM ending.** Controls leave before ending copy becomes prominent; the lantern follows the existing rail home and the doorway warms. Final interrupted-exit captures preserve the paused structural arrangement and finish in the selected ROOM with its low sidelight. This sampled review does not cover every possible choice or cue interruption. |

## Final interaction image review

The final interaction report records six passing cases and 46 screenshots. **Twenty representative PNGs from that set were visually inspected**, including the corrected night handoff, all six settled scene-pair results, view/light/reset, rapid retarget, the exit snapshot, and mobile touch. **Five additional corrected control captures** were then inspected in the focused regression described above. The reports' numerical checks were not independently rerun for this art review.

| Samples inspected | Visible result and limit |
| --- | --- |
| SEA → NIGHT 75%, forward and reverse | Matching artistic arrangement: full moon, aligned red door, dark coast, and lantern on the rail. Image review does not establish exact numerical reversal. |
| All six scene-pair `after` captures | ROOM, SEA, and NIGHT each settle into the corresponding complete composition; selection and ready text agree with the visible scene. The six local transition paths were not watched continuously. |
| `rapid-retarget-final-room` | The final visible result is a complete ROOM, with no leftover raised sea or moon. |
| View audience/wings; low/high light; reset | View exposes the same model's scenic layers. Low and high light visibly change the window, door, floor illumination, and shadows. Reset returns to the default NIGHT composition. The final focused regression confirms readable endpoint labels and clearly visible focus rings. |
| `snapshot-start`, `paused-before`, `paused-after`, `selected-room-ending`, `begin-again` | The in-flight Room cue is visible at the wing; the paused pair shows the same structural arrangement. The ending retains ROOM and low sidelight, with the lantern home and doorway warm. Begin again restores the opening composition. These images support the visible result, not elapsed-time or state-equality assertions. |
| `touch-sea-view` at 390px | The SEA wing view and its controls remain visible and readable together. This is a rendered touch-test result, not physical-phone certification. |

## Verification limits

Engineering found and corrected an exact first-entry/return discrepancy at the III → IV 75% sample after the initial art pass. The fresh final forward and reverse 75% PNGs were subsequently inspected and their artistic arrangements approved. The CPU regression and exact numerical reversal verification belong to the engineering record; image inspection did not establish numerical equality.

The diagnostic `renderInfo` snapshot is sampled at **2Hz** and can lag the screenshot. It is useful for persistent object-identity evidence, but its pose and projected anchors must not be described as exactly synchronized with every captured image. The actual screenshot is authoritative for visible appearance. DOM state and engine diagnostics supply separate evidence for values and behavior.

No physical-device, uninterrupted-animation, FPS, or complete collision certification is implied. The approval concerns the inspected artistic arrangements, readable intermediate states, visual hierarchy, and documented framing regressions.
