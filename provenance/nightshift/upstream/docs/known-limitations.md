# NIGHTSHIFT known limitations

Reviewed **2026-11-09**. The complete local story, recorded tests and candidate extraction are delivered with the following explicit limits. **Strict H1–H9 acceptance is not claimed.** The independent visual reviewer resolved seven material findings within the inspected compositions; that scoped verdict is separate from the blocked checks below.

## Required checks blocked by the available browser fixture

| Requirement | Actual attempt and result | Status |
| --- | --- | --- |
| Native browser find (H5) | `window.find` returned false for full-heading and short-word probes on the story and even a visible one-paragraph control page. No programmatic selection/scroll was substituted. Browser-chrome Ctrl+F was not exercised. | BLOCKED |
| True 125%, 150%, 200% browser zoom (H6) | Trusted Control+Equal shortcuts after reset left innerWidth 1440, DPR 1 and visualViewport.scale 1 unchanged. The headless shell did not apply zoom. | BLOCKED |
| Actual tab background/return and related audio suspension (H8) | Creating another tab and bringing it forward never made the story document hidden. A real background visibility transition was not observed. | BLOCKED |
| Trusted freeze/resume (H8) | CDP accepted frozen/active commands but produced no trusted freeze/resume events. Command acceptance alone is not a lifecycle test. | BLOCKED |

The final input/lifecycle record contains 6 PASS, 0 FAIL and 3 BLOCKED groups. One pass explicitly exercises synthetic visibility properties/events; it confirms only the controller branch and is not real background evidence. Equivalent zoom reflow passes at 1152×720/DPR1.25, 960×600/DPR1.5 and 720×450/DPR2; it remains separate from true browser zoom.

## Checks not established

- **Chronological G2: NOT TESTED.** Early browser access failed or showed an unrelated project on a shared preview. Later successful hero/street–rail/rail–water testing cannot prove that the requested full early de-risk gate happened before extensive production. This history is not retroactively changed to PASS.
- **Exact photographic/projective matching: NOT TESTED.** All ten functional staged transitions pass, but their guide points are editorial screen coordinates. No measured photograph UV/homography, exact vanishing-point/line-spacing dataset or physically calibrated optical solution is supplied.
- **Uninterrupted human full-video playback and every-frame manual review: NOT TESTED.** A real forward/reverse movie exists. Thirty progress samples, 43 adjacent midpoint frames, the final hold and nine reflow screenshots were inspected. No blank/white flash was seen in that subset; a narrow black-frame heuristic found none among 1,344 timestamped input images. Those observations do not certify every frame or all motion quality.
- **Exhaustive failure combinations: NOT TESTED.** Primary-image, all-image, delayed-font, stale-response and selected variant-recovery tests pass. Every target-failure/entrance/exit permutation across all ten boundaries was not recorded.
- **Physical devices, Safari, real 4K/high-refresh hardware, assistive-technology applications and complete WCAG conformance: NOT TESTED.** Keyboard/focus/semantic/SVG checks and phone/4K CSS emulation do not establish those results. Actual audio audibility was not tested in the headless environment.

## Intentional implementation boundaries

This is an original **2D layered photographic editorial experience**, not a rotatable 3D city, technical simulator or operational inspection guide. Source/target plates remain opaque behind CSS masks; an SVG amber guide supplies visual continuity. Units are CSS pixels and normalized screen coordinates, with compositing levels 0–30 plus native dialogs. Standard browser sRGB compositing is used. Physical units, FOV, camera clipping planes and runtime material lighting are not part of the implementation.

The hero reveal adjusts exposure over the selected photograph. Small distant traffic lights animate only on desktop; the worker and lamp are not separately rigged or cut out. Portrait hero art was generated independently, while later phone scenes use specifically chosen crops and layout changes. CH-10 uses distinct generated before/arrived photographs revealed by scroll, not a 3D vehicle simulation. Comparison edits retain recognizable camera/landmark relationships but are not claimed to have exact pixel registration.

All people, streets, timestamps, facilities and routes are fictional composites. Images are generated illustrations, not documentary evidence of actual workers or schedules. The rail, water and utility diagrams are conceptual. Source consultation does not license third-party art or establish the fictional timetable. No exclusive copyright, separate commercial asset license, endorsement or invented generation seed/settings is asserted.

## Measurement and evidence versions

The fixture is Chromium 153.0.8010.0 through Playwright 1.65 on virtualized Linux with unknown underlying hardware; headless launches use `--disable-gpu`. Loopback production preview, CDP network/CPU emulation and fresh contexts are laboratory conditions. Image decode plus two rAF callbacks is not pixel-level first-meaningful-paint proof; the application-ready mark is not standardized TTI/INP; callback intervals are not GPU FPS; a short forced-GC JS-heap test does not prove no leak.

The full main suite ran on 5ebL6gaK; targeted logic corrections and video/zoom on BuBD98b4; final phone placement, input/lifecycle checks and performance on DLeUPCK4/D0j9bzfP. The last change is CSS placement, and the final JS bytes match the previous logic build. This scope is disclosed instead of calling every earlier report a complete rerun of the final archive.

The final movie contains 1,345 encoded frames from 1,344 timestamped actual browser images plus a repeated final hold. An extra received event fell outside the frozen input manifest; both counters are retained. Millisecond encoding quantization makes its 27.485-second output differ slightly from the source concat timing. Actual settled screenshots were appended after holds to avoid a stale final repaint in an earlier every-second-frame capture. No invented/interpolated motion frames were added.

## Source archive verification

The candidate source ZIP **passed** separate extraction, 366 manifest hashes, an independent locked install/build, 16 state tests, static audit, actual CH-01/06/11 preview checks and 34/34 production/fallback image responses. See `evidence/records/extracted-build.json` and associated logs. Documentation/evidence packaging is finalized afterward; the exact final archive is separately re-extracted at handoff, with its actual bytes/hash reported there. Candidate runtime verification is not mislabeled as proof of bytes that had not yet been packaged.

No publication, public deployment, Git push/PR/tag/release or existing-collection modification is authorized or performed. The handoff is reproducible local source and evidence.
