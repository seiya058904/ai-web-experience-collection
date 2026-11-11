# PAPERSUN — Closing visual and recovery review

## Scope and method

This is an implementation-owner review of actual browser captures, separate from the independent reviewer records. It records what was inspected on 9 November 2026; it is not a blanket acceptance claim. The relevant environment was isolated Chromium 153.0.8010.0 on Linux, with corrected Fontconfig and CPU rasterization. Desktop and phone refer to CSS viewports of 1440 × 900 and 390 × 844, respectively, not physical devices.

The transition contact sheets contain consecutive compositor frames from real continuous browser scroll captures, including each frame's recorded time. They are not interpolated transitions assembled from five sought states. Inspection of retained compositor frames cannot establish that every physical display refresh was captured, and these records do not support a hardware FPS claim.

## TR09: the same repaired circle travels from table to sky

All sixteen contact sheets for `local-boundary-final-*-tr09-*-contact-*.jpg` were viewed in sequence. They represent eight recordings: slow forward, slow reverse, fast forward and fast reverse in each profile. The desktop sequences contain 32, 33, 17 and 16 retained frames; the phone sequences contain 68, 72, 24 and 24. All **286 retained frames** were included in the inspected sheets.

The scoped visual result is **PASS**. One three-piece disc remains traceable as the worktable leaves and the city enters. Its internal seams keep their arrangement. No duplicate disc or completely blank handoff was visible in the retained frames. The paper edge travels across the stage; the late chapter's heading and body enter after the phone disc has moved clear of the reading area. The final circle registers with the opening, and the reverse sequences restore the table path without changing the three shapes.

These recordings begin with fresh, uncollected memory. The narrative repair appears on entering the lift and disappears again on returning to the unassembled table. That behavior is the deliberate skip-ahead reading path; it does not prove that the user collected and assembled the pieces in that particular recording. Actual interaction records and the separately labelled collected-state continuity run cover that different condition.

After the canonical table-holder change, the root additionally opened four current full-resolution phone holds from `local-carrier-final-mobile-tr09-unassembled`: `start-before`, `start-after`, `050` and `end-after`. The before image has three separate loose pieces and an empty circle outline; the immediately following narrative state has one joined disc and an empty holder; the midpoint and ending retain that one disc with its three seams. This confirms the visible ownership switch in those held states. It remains an explicitly discrete narrative skip behavior, not an observed manual assembly animation. The transition-owner review separately records all twelve current TR09 recordings and 488 retained frames.

Evidence:

- `evidence/local-boundary-final-continuity-2026-11-09T08-52-08-164Z.json`
- Eight `evidence/local-boundary-final-{desktop,mobile}-tr09-{slow,fast}-{forward,reverse}.json` records and their animated WebPs.
- The sixteen complete contact sheets with the same sequence prefixes.

## Every transition with its target picture missing

The added failure exercise directly opened the 50% point of all ten boundaries in both profiles with `?test-assets=fail`. The image requests actually returned HTTP 404. For each sample the runner checked the requested transition, active target chapter, eleven chapters and twenty-two beats, English document content, lack of horizontal overflow, failed-image state, and a visible nonempty SVG fallback for the correct target chapter. The screenshots are actual rendered failure states.

The first test oracle incorrectly assumed that every target scene's asset slot equals its zero-based chapter index. TR08 intentionally uses the separate bridge-to-attic midpoint asset slot 11, whose fallback is CH09. The initial run therefore failed that assertion in both profiles. Source inspection established the special mapping in `src/scene-renderer.ts`; the corrected oracle verifies both the special asset slot and the actual `fallback-ch-09` identity. The earlier failing report remains available as test-harness history. No application code was changed to satisfy that mistaken assertion.

The corrected run passed all twenty midpoint assertions. Visual inspection of its two contact sheets found one additional application issue: the phone ending's pale fallback daylight reduced the contrast of the light heading. A targeted CSS correction now strengthens the upper reading shade only at phone widths, only in late chapters, and only while a scene lacks its loaded image. It changes no geometry, progress, control or loaded-art composition.

The final corrective run uses `index-Bc_ZO-w8.js` and `index-B82G5Cib.css`. Both profile cases **PASS**, with no uncaught page errors. In addition to the twenty midpoints, it captures CH10 and CH11 in both day and night views in each profile: eight late reading holds. Full-resolution phone TR10 midpoint, CH10 daylight and CH11 night images were inspected after the correction. Their titles have a clear dark reading field, the complete stitched disc remains visible, and the body, controls and recovery notice remain legible. This is a visual check, not a formal WCAG contrast audit.

Evidence history:

| Record | Disposition |
| --- | --- |
| `evidence/local-all-failed-midpoints-recovery-results.json` | Two retained failed cases caused by the incorrect asset-slot oracle. |
| `evidence/local-all-failed-midpoints-corrected-recovery-results.json` | Two measured passes, twenty midpoints; visual review then identified the late phone fallback contrast issue. |
| `evidence/local-all-failed-midpoints-corrected-{desktop,mobile}-contact.jpg` | Actual before-correction images used in the visual review. |
| `evidence/local-fallback-readable-final-recovery-results.json` | Two final measured passes, twenty midpoints plus eight day/night holds, no uncaught page errors. |
| `evidence/local-fallback-readable-final-failed-midpoint-mobile-10.jpg` | Corrected phone transition-to-ending heading and repaired sun. |
| `evidence/local-fallback-readable-final-failed-late-mobile-ch10-day.jpg` | Corrected daylight fallback title, prose and actions. |
| `evidence/local-fallback-readable-final-failed-late-mobile-ch11-night.jpg` | Night counterpart with the same repaired circle and usable ending. |

The later `local-ownership-final-recovery-results.json` is an actual, unfiltered **twenty-one-case command** on `index-DkJKhC7c.js` / `index-C8PaC5EY.css`: **eighteen PASS, zero FAIL, three NOT TESTED, and zero uncaught page errors**. It supersedes the earlier merged-count description. Its two failed-art profile cases include all twenty transition midpoints, eight late day/night holds, and twenty-four collected-state quarter views at TR05–08. This run preceded the final TR06 support correction described below; the affected boundary receives its own corrective retest rather than silently assigning the old run to a different build.

Both contact sheets `local-ownership-final-collected-failed-{desktop,mobile}-contact.jpg` were viewed, covering all twenty-four collected-state failed-art quarter captures. Their chapter-specific fallback art, English reading areas, recovery notices and controls remain visible. The opaque recovery notice intentionally covers part of the lower phone artwork; these images do not establish the count of every small shape behind that notice. No visible duplicate puppet, transparent gold disc or unexplained blank target was found in this static scope. Moving support is assessed separately below.

The three unestablished capabilities remain browser Find, native browser UI zoom, and an actual hidden-tab/background transition. The acceptance ledger records their required gates as BLOCKED.

## Collected TR05 and the remaining TR06 support defect

All sixteen `local-carrier-final-{desktop,mobile}-tr05-{slow,fast}-{forward,reverse}-contact-*.jpg` sheets were viewed. They contain all **284 retained frames across eight actual recordings**. Each recording follows real UI discovery of A/B/C with the table still unassembled. The scoped TR05 visual result is **PASS**: one Mira and one attached holder cross the diagonal paper edge, the three distinct shapes retain their contours, and fixture A transfers into the holder while B transfers toward the wind-wheel fixture. Forward and reverse movement preserve the same object paths. The complete paper edge occludes the actor while passing; it does not alpha-dissolve her.

The desktop slow-forward frames 0034 and 0036 were also opened at full resolution to resolve an ambiguous small gold shape in the contact thumbnails. B is already visible at its intermediate position in frame 0034 and continues toward its exact endpoint in frame 0036. This is continuous movement and scale change, not an endpoint appearance.

All eight desktop TR06 contact sheets were then viewed, containing **93 retained frames across four recordings**. A full-resolution inspection of `local-carrier-final-desktop-tr06-slow-forward-frames/0018.jpg` found a real remaining defect: Mira's boots sat above the revealed valley floor while her pose was interpolating between the two chapter supports. The holder stayed attached and there was no extra piece, but the unsupported pose failed physical continuity. The passing capture assertions did not detect that visual fault. The original sequence and a separate before-correction still are retained; these captures are not blanket visual passes.

The correction therefore keeps Mira on each authored support and transfers her behind an opaque edge registered to the actual wheel-centered reveal. Its targeted TR06 retake and independent visual disposition follow.

## Final TR06 support follow-up

The final support correction is `index-Crm79syp.js` / `index-C8PaC5EY.css`. It adds an opaque annular paper edge whose center and radius match the actual wheel-centered CSS circle. The actor, attached holder and exact pieces remain on the source support until covered, then change registration while hidden and emerge at the authored target support. The six blades draw in front of the lip. The lip follows the full registered circle rather than being cut by the desktop reading-column clip. The text occupies a separate higher reading layer.

The root reviewer viewed **all thirteen desktop contact sheets, eight recordings and 162 retained frames**: 77 empty-memory frames and 85 collected/unplaced frames. Slow forward, slow reverse, fast forward and fast reverse were inspected for each memory condition. The scoped result is **PASS**. No unsupported interpolated pose remains visible; the source and target feet retain their ground contact, the holder remains attached, and there is no duplicate gold shape or alpha disappearance. The circle covers the support change in both directions. The wheel retains its six opaque blades and moves out and back without an unexplained identity change.

Desktop collected fast-reverse frames 0004, 0005 and 0006 were additionally opened at full resolution. The recorded scroll positions are monotonic in reverse; the two captures at the same position show the same wheel geometry. The full images resolve a thumbnail ambiguity without assigning a new defect or synthesizing an intermediate frame.

The independent reviewer viewed the **thirteen phone sheets, eight recordings and 261 retained frames**: 127 empty and 134 collected. That scope also passed, with full-resolution ground-contact checks. Together the final support review covers all **423 retained frames in sixteen recordings**, not a selected subset of the motion. The independent report records its own phone observations.

The root also opened all **eight normal v2 direct-state proofs** (empty midpoint plus collected 25/50/75 in both profiles) and all **six actual HTTP-404 collected quarter proofs**. The desktop midpoint is grounded; the phone midpoint deliberately keeps Mira behind the solid paper lip and the later quarter uncovers her on the valley floor. English titles/actions and the recovery notice remain readable. The phone recovery notice covers some lower artwork, so no count is inferred for geometry hidden behind it.

Measured checks include a **28/28 empty-memory layout retake**, thirty-six paused quarter/threshold-neighbor captures across the two memory runs, and zero failure records in the final motion aggregates. Preliminary files labelled failed-art used the wrong diagnostic query and are explicitly not failure proof; `local-tr06-ground-failure.json` records the corrected `test-assets=fail` requests and actual failed readiness. The earlier v1 rim-layer/straight-edge iteration and the original floating-pose failure remain historical evidence.

Final evidence:

- `evidence/local-tr06-ground-empty-layout-2026-11-09T10-01-39-421Z.json`
- `evidence/local-tr06-ground-empty-continuity-2026-11-09T10-01-47-079Z.json`
- `evidence/local-tr06-ground-collected-continuity-2026-11-09T10-02-23-781Z.json`
- `evidence/local-tr06-ground-{empty,collected}-contacts.json` and every listed sheet/animation.
- `evidence/local-tr06-ground-proof-v2.json` and its eight normal direct-state captures.
- `evidence/local-tr06-ground-failure.json` and its six actual failed-art quarter captures.
- `evidence/local-tr06-ground-before.jpg` and `evidence/local-tr06-ground-mobile-after.jpg`.

This closes the diagnosed support defect in the recorded desktop and phone conditions. It does not convert the three unavailable browser capabilities into passes, establish physical-device performance, or replace the separate exact-archive extraction and rebuild proof.

## Acceptance remains scoped

The final source handoff must also pass clean extraction, locked dependency installation, rebuilding and preview. Those results belong in the handoff verification record. The current visual/recovery review does not supersede the known environment gaps, the six retained synthetic CSS-content-zoom diagnostic failures, physical-device limits, or the separate independent review.
