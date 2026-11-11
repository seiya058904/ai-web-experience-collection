# PAPERSUN — acceptance and adverse-condition plan

This document defines checks; it does **not** report them as performed. Record results in the requirements ledger and actual test report, with reproducible evidence paths. Initial status of every check below: **NOT TESTED**.

## Evidence rules

Record the build/source revision or content hashes, browser and version, date, CSS viewport, DPR, network/cache conditions, and interaction method. Treat screenshots, measured assertions, continuous-motion observations, and human aesthetic review as distinct evidence. Do not call a browser-emulated phone a physical-device test, a 3840-pixel CSS viewport a 4K hardware test, or local timing a field Core Web Vitals result.

## High-risk prototype gates

1. **CH-01 to CH-02:** At 0/25/50/75/100%, preserve one traceable amber lamp and the rooftop/window edge. Confirm the physical window mask covers the scene exchange. Stop midway, reverse, then jump directly to the midpoint from a fresh load. No duplicated lamp, disappearing text, or mandatory intro wait.
2. **CH-08 to CH-09:** Track the bridge curve and red thread into the repair table through an opaque arch. Fresh direct midpoint entry must contain exactly one Mira and three unjoined pieces. Repeat with the incoming image late or unavailable.
3. **CH-09 to CH-10:** The same three SVG paths form one disc, keep the same seam geometry and radius, then travel on explicit rigging into the CH-01 opening. Inspect five progress positions, inverse traversal, and a midpoint load. A new generic gold circle is a failure.

## Chapter coverage

Capture the stable reading hold for every chapter at desktop and 390 × 844. Check two substantive beats, complete selectable copy, distinct composition, incoming/outgoing anchor, and a still-mode equivalent.

| Chapter | Required observation and action |
| --- | --- |
| CH-01 — The Missing Circle | Literal dark circular aperture, layered roofs, one amber attic lamp, exact hero title/lead; `Follow the red thread` reaches CH-02 with focus. |
| CH-02 — The Last Warm Room | Same lamp and Mira, desk and tools; `Inspect the desk` reveals three tools and why they matter, Escape closes and returns focus. |
| CH-03 — Three Pieces of Light | Exact three paths and circle constraint; preview identifies A/B/C and locations without collecting any piece. |
| CH-04 — A Thread Across Roofs | Pinned route crosses plausible supports; tracing route reveals its true anchor sequence and can be reset. |
| CH-05 — The Lantern Market | Failed lantern becomes repaired after the action; only then is A found; reset and review have explicit outcomes. |
| CH-06 — The Wind Hill | Rotor rotates around a visible axle; steady/release states expose B with deterministic geometry. |
| CH-07 — Valley of Shadows | The shade hinges around its pin; lifting reveals C; reverse/reset restores the shade. |
| CH-08 — The Blue Bridge | Three separately carried silhouettes and route home; review shows names, origins, and actual collection states. |
| CH-09 — Mending the Sun | Sequential A/B/C buttons change the exact placed paths; shared edges fit; seams remain; lift cannot introduce a fourth piece. |
| CH-10 — The First Light | Repaired disc enters original aperture on red rigging; day/night changes lighting and preserves shape. |
| CH-11 — A Lamp for the Night | Full ending includes repaired sun and original lamp; revisit links work; begin again intentionally resets the story and returns to the start. |

## Hero six-state review

Capture first meaningful art, reveal midpoint, complete composition, living hold, initial scroll, and return. Compare desktop against AI-04 and portrait against AI-05 using viewed full-resolution images. The circle must already exist in the first frame. Readability must survive image failure and fallback fonts. Verify optional ambient motion can be stopped without removing any story result.

## Ten transition matrix

For **each** boundary TR-01-02 through TR-10-11, inspect normalized progress 0, 0.25, 0.5, 0.75, and 1; inspect epsilon before/after both thresholds. In a desktop and mobile main path, exercise slow forward, fast skip, reverse, and direct midpoint entry. Use the transition ledger's specific anchor and staging as the expected result.

- The outgoing caption leaves before the incoming caption occupies the same reading zone.
- Hidden text and controls do not remain focusable or block pointers.
- Foreground occlusion hides scene exchanges; a generic whole-screen dissolve does not replace the intended physical handoff.
- Stopping scroll gives a coherent, stable frame; stage and text do not continue catching up on separate clocks.
- Direct target or midpoint loads are valid without earlier events having fired.
- Reverse traversal uses the same evaluator; it does not replay forward-only timers.
- Target failure preserves that target's complete story and authored visual fallback.
- A short continuous recording or live observation of the three high-risk joins supplements still captures.

## Input and control checks

Exercise wheel, scrollbar movement, touch emulation, Arrow/Page/Home/End keys, browser find, all chapter links, manual hashes, and history Back/Forward. Interrupt the hero reveal immediately with scroll. Jump from first to last and back repeatedly. Open each dialog by keyboard, traverse its controls, close with Escape, and verify focus return. Button labels, disabled states, success captions, and inventory must agree.

Run collection/assembly both in narrative order and by direct chapter entry. Preview is not collection; scrolling is not collection. A late visitor must have a readable explanation and usable route to the real actions. Reset has a clear scope and cannot create extra pieces. Confirm persistent state handles absent, corrupted, or inaccessible local storage without breaking rendering. Sound starts off, requires an intentional gesture, and stops immediately when switched off; no remote unlicensed sample is required.

## Responsive and typesetting matrix

Required CSS viewports: **320 × 700, 360 × 640, 390 × 844, 768 × 1024, 1440 × 900, 1920 × 1080, 2560 × 1440, and 3840 × 2160**. Add each breakpoint minus/plus one pixel and a short landscape configuration. Test actual browser zoom at 125%, 150%, and 200% where available; if only equivalent CSS viewport scaling is available, state that limitation.

At all variants, inspect hero, longest narration, hardest bridge join, assembly controls, and ending. Look for horizontal overflow, hidden prose, clipped buttons, overlapping fixed chrome, illegible bright-background text, and tiny targets. Inspect bounding boxes and the screenshot together; either alone can miss errors. Test before/after font availability and a delayed font. Do not hide body overflow or shrink essential text to conceal a failure.

## Recovery and accessibility

Test mid-page reload, direct hash startup, browser history, resize/orientation change, background/foreground resume, and rapid A-to-B-to-C navigation with B completing last. Fail one hero image, one middle image, and one late image. Delay noncritical assets and confirm old scene imagery never takes ownership of new text. Test an offline reload where feasible and state exactly which resources were cached.

Test system reduced motion and the UI motion setting independently. All eleven chapters, all three found states, all assembly steps, seams, lighting comparison, and ending remain available. All narration stays selectable and the document has `lang="en"`. Decorative images are hidden from assistive technology; meaningful alternatives do not duplicate adjacent prose. Verify semantic headings, labelled dialogs/controls, visible focus, logical tab order, and statuses announced without excessive live-region chatter. Record screen-reader coverage only if actually performed.

For a DOM/SVG implementation with no WebGL dependency, verify no WebGL renderer is required and report that architecture fact; do not fabricate a WebGL-context-loss experiment. Missing raster art must still leave the chapter's specific composition, text, and functioning controls.

## Build, performance, packaging

Run locked install, TypeScript/build checks, and production preview. Record cold-cache first meaningful image, LCP where measurable, time to usable controls, long tasks, and frame pacing through heavy joins. State throttling and measurement caveats. Repeated round trips must not accumulate listeners, timelines, or scene DOM. Pause nonessential hidden-page work.

Scan authored source and extracted visible DOM/aria/alt/metadata for unintended CJK, placeholder copy, baked-image captions, broken hashes, empty buttons, and hard-coded private paths. Verify generated asset provenance, known parameters only, legal fonts/dependencies, and all eight inspectable art outputs. Include actual evidence and limitations in the archive.

Create `papersun-source.zip` without dependencies, caches, secrets, browser profiles, or unrelated files. Extract into a clean directory; follow the README with `npm ci`, build, and production preview. Verify packaged media and first/middle/final chapters in that extracted build. Record the final archive's SHA-256. Do not publish, deploy, push, tag, release, or alter the Collection.

## Independent review and release status

After implementation, independent review should rank the two weakest non-hero chapters and the weakest transition, explain concrete visual/functional issues, and verify visible corrections. The acceptance ledger must distinguish `PASS`, `FAIL`, `BLOCKED`, and `NOT TESTED`. Any unmet mandatory item prevents calling the whole site accepted, even when a useful source package can be delivered.
