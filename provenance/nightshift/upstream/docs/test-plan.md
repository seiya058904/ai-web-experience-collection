# NIGHTSHIFT verification plan

Prepared 2026-11-09 from the NIGHTSHIFT Edition 2.0 brief. This document specifies tests and rejection conditions. It contains no completed test claims. Use the final test report and `requirements-evidence.md` for observed outcomes.

## Record conditions once per run

Record browser name and version, operating environment, CSS viewport, device pixel ratio, touch emulation, motion preference, cache state, network throttling, production build identifier, and test method. Physical monitor size, real 4K hardware, Safari, real touch devices, high-refresh hardware, and production field metrics must remain NOT TESTED unless actually exercised.

Separate functional observations from visual judgment. A passing build does not prove design fidelity; a screenshot does not prove continuous motion; a frame-rate sample does not prove a whole-device performance guarantee.

## Required evidence structure

Suggested paths, to be reconciled with the actual runner:

```text
evidence/
  environment.json
  test-results.json
  test-results.md
  screenshots/desktop/
  screenshots/mobile/
  transitions/desktop/
  transitions/mobile/
  recordings/
  logs/
docs/
  requirements-evidence.md
  fidelity-review.md
  known-limitations.md
```

Use readable filenames such as `tr-05-06-p050-desktop.png`. Retain useful evidence, not browser profiles, secrets, dependency caches, or enormous redundant media.

## Gate G0 and G1 — environment and art

| Check | Action | Expected evidence / rejection |
| --- | --- | --- |
| Scope | Inspect the attachment and applicable project instructions | All 11 chapters, 10 boundaries, English-only content, private-only handoff recorded. |
| Primary sources | Open all six requested primary sources | Reviewed date, exact URL, narrow supported claims; unavailable sources labeled. |
| Eight real generated outcomes | Verify AI-01 through AI-08 exist as separate actual images | Tool, retained path, prompt, known parameters, selection/rejection reason; no invented settings. |
| Hero concepts | Inspect three materially distinct framings | Street worker, last lit window, and pre-service platform are meaningfully different. |
| Desktop/phone hero | Inspect refined desktop and genuinely recomposed portrait | Portrait is not merely the desktop crop; warm room and city remain readable. |
| Non-hero quality | Inspect rail, market, and midpoint at useful resolution | Plausible anatomy/materials, no embedded lettering, no moving train near staff, no transparent dual pipe systems. |
| Visual lock | Compare selected artwork to visual bible | Framing, palette, typography, still/motion treatment, and all chapter roles are concrete. |

## Gate G2 — early high-risk prototype

Before full scene production, exercise TR-01-02, TR-05-06, and TR-06-07 through actual browser interaction. Test desktop 1440 x 900 and phone 390 x 844. Use wheel or touch gestures as appropriate, plus direct deterministic seeks for precise evidence frames.

For each boundary capture p=0, .25, .50, .75, and 1. Capture p=.49 and .51 where object identity or middle-asset switching occurs. If the implementation uses another discrete threshold, capture its immediate neighbors too.

Complete the hero-to-atlas forward and reverse sequence three times. Pause at .25/.50/.75 on each round trip. Reject blank images, scale pops, unfilled background edges, double mullions, drifting anchors, mixed chapter titles, or an introduction that replays when returning.

For street-to-rail, repeat a slow reverse at DPR 1 and narrow width. Inspect the rail separation and vanishing point on both sides of the structural occluder. For rail-to-water, load directly at the midpoint before optional large imagery arrives and deliberately fail the target large asset. The correct water identity and AI-08 bridge must remain available.

## Full chapter path

On both the main desktop and phone runs, visit all eleven chapters in order, then return in reverse. For each chapter record two specific content beats, the stable reading composition, working interaction, visible English copy, incoming boundary, outgoing boundary/complete ending, and target-specific fallback.

| Chapter | Content checks | Interaction checks |
| --- | --- | --- |
| CH-01 | Quiet city, then small human presence in original lit room | `Follow the night` lands on CH-02 with predictable focus; fiction note opens/closes. |
| CH-02 | Parallel work lights, then a route's particular purpose | Five routes highlight and explain; `All routes` restores; matching chapter link works. |
| CH-03 | Flour/dough preparation, then arranged first-bake station | Preparation comparison changes real source content and can reset. |
| CH-04 | Quiet corridor, then hands/water/linen without patients | `Read the scene` opens editorial note; Escape and close restore focus. |
| CH-05 | Debris/curb, then cleared edge in the same place | Range, arrow keys, `Before`, `After`, reset to 50%; state survives leaving/returning. |
| CH-06 | Complete inspection context, then track hardware detail | `Surface`/`Section` shows a labeled conceptual diagram without operational settings. |
| CH-07 | Supported pipe detail, then staff/log context | `Trace the path` reveals an explicitly illustrative diagram; close/reset works. |
| CH-08 | Generic inspection context, then steady lamp connection | `What stays on?` reveals an explanatory result; no live grid controls. |
| CH-09 | Loading aisle, then hands sorting stems/crates | `Night`/`First light` changes real work progress, with a reset/return path. |
| CH-10 | Prepared empty service, then first arrival | `Trace this night` opens usable earlier-route links; vehicle motion is scroll-owned. |
| CH-11 | Matched dawn city/original room, then six traces | Six outcomes open from a direct first visit; chapter links and `Back to dawn` work; focus returns. |

## All ten boundaries

Capture the five specified stages for every boundary on desktop and phone. Use the transition ledger to evaluate the correct anchor and material identity. Inspect every contact sheet, then open full-size frames for the three high-risk handoffs and any suspicious frame.

For each boundary perform slow forward, fast forward, reverse, a stop at its midpoint, and direct midpoint entry. Source and target text must never share the same reading/focus zone. At 100%, the target exclusively owns scene identity. At 0% after reversal, the original composition returns without reveal replay.

A short recording of continuous scroll through the difficult boundaries is required. Watch it at normal speed and around the seam; paused screenshots alone cannot detect one-frame flashes, jitter, delayed catches, or a wall-clock animation.

## Active controls and accessibility

| Test | Action | Required result |
| --- | --- | --- |
| Chapter menu | Open with keyboard, tab through all links, activate a middle chapter | Menu is usable; chosen heading receives appropriate focus; menu closes. |
| Dialog lifecycle | Open each dialog, Tab/Shift+Tab, Escape, reopen, close by button | Focus stays appropriate, Escape works, focus returns to invoker. |
| Motion preference | Start with reduced OS preference; toggle mode mid-story | All chapters and interactions remain; no camera flights; position is preserved. |
| Sound | Confirm default off, opt in, turn off, background/resume | Immediate actual state changes; if unavailable, exact unavailable message; no hidden playback. |
| Comparison | Drag range, use arrows, click endpoints, reset | Actual image/content difference, correct accessible value, no page scroll trap. |
| Atlas keyboard | Select routes with keyboard and click matching links | Selected state visible and announced; matching explanation and destination. |
| Finale map | Enter finale first, open all six traces, follow/close | Nothing depends on having visited earlier chapters; outcome and destination match. |
| Still view | Activate while in a hard transition | Full story, all interactions, stable target identity, no trapped focus. |
| Touch targets | Inspect menu, mode, comparison, and atlas controls on 320/390 widths | Practical hit area, no overlapping invisible art/panels. |
| Semantic structure | Inspect headings, landmarks, lang, names, alt/aria | One coherent h1, ordered chapters, `lang=en`, selectable real text, decorative art hidden from assistive technology. |
| Keyboard scrolling | Arrow, PageDown/PageUp, Home/End, Space as appropriate | Native page progression remains available outside focused interactive controls. |
| Browser find | Find a distinctive late-chapter phrase | The matching text is present and can be reached; hidden animation logic does not make it unusable. |

Do not claim WCAG conformance from this targeted check. Record precisely what was tested, including any assistive technology that was actually used.

## Responsive and typography matrix

| CSS viewport | Coverage |
| --- | --- |
| 320 x 700 | Hero, longest heading/copy, menu, atlas list, comparison, rail/water midpoint, ending. |
| 360 x 640 | Same risk set; pay attention to short vertical reading space. |
| 390 x 844 | Entire eleven-chapter and ten-boundary path; all controls. |
| 768 x 1024 | Tablet composition, atlas, highest-density panel, finale. |
| 1440 x 900 | Entire main path and all interactions; concept comparison. |
| 1920 x 1080 | Hero crop, longest type, late market, ending. |
| 2560 x 1440 | Maximum reading measure, image sharpness, line alignment. |
| 3840 x 2160 | CSS-scale layout and image treatment only; no claim of real 4K hardware. |
| Short landscape | At least one genuine short landscape size, e.g. 844 x 390; menu and longest panel. |
| Breakpoint neighbors | One pixel below/above each actual CSS layout breakpoint that affects hero, atlas, dialogs, or transition framing. |

At representative browser zoom 125%, 150%, and 200%, inspect the hero, chapter navigation, longest chapter copy, range/control panel, a difficult transition, and final dialog. Record the method: true browser zoom is distinct from setting a smaller viewport or CSS `zoom`. If the available browser cannot change actual browser zoom, mark true zoom NOT TESTED and report the separate reflow checks honestly.

Run bounding-box checks for horizontal overflow, clipped words, controls outside the viewport, and unintended intersections, followed by actual visual inspection. Do not fix overflow by globally hiding it or shrinking essential text below a readable size. Validate fallback font metrics as well as loaded fonts.

## Recovery and lifecycle probes

1. Refresh at a middle chapter; refresh at a transition midpoint; open each chapter hash in a fresh session. Confirm correct scene and focus behavior.
2. Navigate A to B to C quickly while delaying B's large image. Let B finish last. C remains visible and correctly titled; B may only populate its own cache.
3. Jump from first to last and last to middle with menu, hash, browser history, and native page keys. No introduction lock or stale asset overwrite.
4. Fail a large hero image, a large middle image, and a large final image independently. The correct small still remains. Separately fail all image requests to verify the honest text/error fallback without claiming loaded imagery.
5. Throttle image delivery and delay fonts. Capture first meaningful image, complete hero, and text before/after font load. There is no black loading page or clipped title.
6. Change orientation during a boundary and resize while a dialog is open. Anchor calibration refreshes without duplicated controllers, lost focus, or scene identity mismatch.
7. Background the tab and restore it mid-story. No large animation catch-up or autonomous scene advance; optional sound follows the chosen lifecycle policy.
8. Disable WebGL before loading. If the final implementation has no WebGL dependency, verify the full story remains functional and document WebGL loss as not applicable to the chosen rendering path. Do not claim a context-loss recovery implementation that does not exist.
9. If WebGL is actually introduced, lose its context deliberately at a difficult boundary; the same chapter's still and DOM controls remain while the context is unavailable.
10. Activate reduced/still mode before optional assets arrive. Late load completion must not re-enable motion or replace the chosen composition.

## Performance observations

Measure cold and warm production loads separately. Record first meaningful art, complete hero timing, interaction readiness, layout shift, long tasks, and frame intervals during the heavy boundaries. State actual throttling and cache conditions. Local lab measurements are not field Core Web Vitals.

For memory behavior, repeat a complete round trip several times and compare observable memory/resource counts under the same conditions. Treat monotonic growth as a risk to investigate, not as proof of a leak without accounting for caches. State when memory APIs or garbage-collection control are unavailable.

Do not invent FPS, INP, network speed, RAM usage, or hardware. If only animation frame intervals are available, name that measurement and its limits. Stop optional profiling after the concrete regression risks have been resolved.

## English-only and source audit

Scan authored source, generated text assets, and public document metadata for unintended CJK. Extract actual visible UI text at every chapter and changed interaction state. Check `aria-label`, `alt`, titles, errors, loading notices, route labels, and dialogs. Proofread the English separately; a character scan cannot prove fluent wording.

Confirm no baked image labels, invented real-city schedules, fabricated service counts, confidential patient details, operational utility instructions, analytics, credentials, or paid API calls. Fictional timestamps and names must be visibly framed as part of Meridian City.

## Artistic correction and fidelity

Compare the actual desktop hero screenshot directly to AI-04 and the phone screenshot to AI-05. Open both concept and rendered images at useful resolution. Record at least five concrete comparison points: composition, light/temperature, material identity, type and copy, image treatment, spacing, responsive framing, or motion.

Review all non-hero chapters and identify the two weakest scenes plus the weakest transition from real captures. Record the original issue, the concrete correction, and before/after evidence. A different background color alone is not adequate artistic correction. Do not assign a fabricated aesthetic score.

## Build and extracted ZIP acceptance

1. Run the locked dependency installation and production build using the documented commands.
2. Start a local production preview and exercise real browser actions against that build.
3. Package complete distributable source, lockfile, assets, licenses/provenance, English README, visual bible, evidence, and limitations. Exclude `node_modules`, caches, browser profiles, secrets, private paths, and enormous rejected generations.
4. Compute the ZIP's SHA-256 and record its exact byte size.
5. Extract the ZIP into a separate clean directory. Follow the README, install from the lockfile, and rebuild; do not borrow the original checkout's dependency directory.
6. Start the extracted build's production preview. Check the first, middle, and last chapters, relevant asset URLs, chapter navigation, and a central interaction.
7. Verify every packaged media reference resolves locally. The handoff must not depend on an expiring generation URL or an author's absolute filesystem path.
8. Record actual commands, exit results, browser observations, and any environment limitation. Mark H9 PASS only when the extraction/rebuild/preview check really succeeded.

## Status vocabulary

Use only `NOT STARTED`, `IN PROGRESS`, `READY TO TEST`, `PASS`, `FAIL`, `BLOCKED`, or `NOT TESTED` in the requirement ledger. A blocked required test must remain visible in the final handoff. Fixable failures should be repaired and only the affected checks rerun. Neither a successful screenshot nor a build exit code can silently upgrade untested requirements to PASS.
