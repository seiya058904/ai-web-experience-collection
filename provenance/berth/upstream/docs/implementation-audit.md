# BERTH — independent static implementation audit

**Scope:** `src/render.ts`, `src/scroll.ts`, `src/state.ts`, `src/interactions.ts`, `src/styles.css`, and the resource handling in `src/main.ts`, compared with the supplied BERTH brief. This audit used source inspection and a direct Node evaluation of the pure state functions. **No browser checks or visual passes are claimed.** Final morning/departure/mobile assets were still in progress and missing in-flight files are not reported as defects.

## Relation to final browser evidence

This file preserves the independent source-audit snapshot and its original verification scope. The root contributor subsequently inspected the latest production bundle, including real card midpoints, custom input/copy, menu focus, degraded-resource native forward paths and Hero recovery. The updated authoritative browser scope and open gates are in `docs/verification.md`; the image-only finish judgment is in `docs/finish-review.md`. Historical “browser verification pending” wording below describes this audit contributor's work, not the absence of all later checks.

## Current resolution status

No critical security defect was found in this review. The initial findings below are retained as a record of the original snapshot. Subsequent implementation changes have addressed the concrete defects as follows. **Source correction, unit checks, and a successful build are not browser or art acceptance.**

| Finding | Current status | Evidence and remaining validation |
| --- | --- | --- |
| IA-01: metadata-only visual actions | **Substantive action sequences implemented; visual acceptance remains.** TR-05 now has `night-talk → climb → sleep`; TR-09 has `packing → lin-departure → ning-departure → empty`. TR-08 adds a live two-card/one-clip paper detail between handover and packing. | Actual action images are present and were inspected as local assets. They are exposed by reversible progress-derived spatial masks, with holds and stage-specific captions. TR-08 uses the current `[data-user-line]`, fixed `LIN_NOTE`, two distinct DOM cards, a manuscript edge, and exactly one moving SVG clip. Text does not crossfade. Paused/reduced motion preserves the action frames and gives the paper detail native Before/After controls that reuse its same text nodes and one clip. The original broader concern about Hero direction and other unbound sub-stages remains a visual acceptance item; state-only tests cannot prove shot continuity. |
| IA-02: lamp handover | **Implemented; browser verification pending.** | TR-03’s incoming table layer uses `--handover-light`, starting from the saved comparison brightness and returning to story brightness by the midpoint. Verify Off/Reading/Soft in both directions, including local illumination fidelity. |
| IA-03: sticky progress mismatch | **Source correction verified; browser verification pending.** | The loop now reads `getComputedStyle(sticky).top`; no separate height/width percentage branch remains. The section-only chapter query and `data-current-chapter` fix were preserved. |
| IA-04: distant copy fallback | **Source correction verified; browser verification pending.** | Each note action now has adjacent `[data-copy-status]` and `[data-copy-fallback]` nodes. `copyFeedbackFor()` resolves the local pair, with a guard against stealing focus after a delayed rejection. |
| IA-05: menu focus | **Source correction verified; browser verification pending.** | Outside clicks on real interactive controls close without restoring the menu summary’s focus. Escape still restores focus. |
| IA-06: glasses location | **Resolved in the state evaluator; unit check passed.** | Packing returns `lin-worn`, followed by `outside` after Ms. Lin departs. The existing suite includes this regression. Inspect the final departure images as well. |
| Exact input and grapheme boundary | **Resolved in source; unit checks passed.** | Nonblank input preserves outer whitespace. `truncateOpening()` counts code points while stopping at a whole grapheme boundary using `Intl.Segmenter`. |
| Hero readiness marker | **Source correction verified.** | The load marker now checks `picture.closest('.hero-art')` and a once-only guard, so the transition duplicate cannot claim primary Hero readiness. |
| Mobile transition source mapping | **Implemented; matching-frame review pending.** | Transition pictures now select `hero-mobile`, `night-talk-mobile`, `dawn-mobile`, and `empty-mobile` where available. Landscape action frames use containment on phones to keep both actors and the ladder in frame. Check the night/morning framing where a portrait counterpart does not exist for the source frame. |

### Checks actually executed after the carrying, departure, and live-card transition changes

- `npm test`: **22 passed, 0 failed**. These are state/input/storage checks; they do not validate the rendering of the new transition frames.
- `npm run build`: **passed** (`tsc --noEmit` and the production Vite build).
- No browser tool, browser screenshot, physical-phone check, or visual transition pass was performed by this audit contributor.

TR-08’s paper view is fully exposed from local progress 0.18 to 0.80. The clip moves from the manuscript at 0.25 to the joined cards by 0.70. Its position is evaluated against the real paper edges after responsive layout. Hidden paper frames are inert; unusually long custom text has a local scrollable reading area that enters the tab order only when visible and overflowing. This implementation still requires browser verification with a long English line, mixed-script input, and the reduced-motion Before/After controls.

### Original findings

## IA-01 — Major: evaluated story state does not control the visible story actions

**Evidence:** `src/scroll.ts`, `render()`; `src/render.ts`, `hero()`, `sleep()`, `ending()`, `transition()`; `src/styles.css`, transition selectors.

`resolveStoryState()` computes people, objects, lamp output, card faces, and meaningful sub-stages. `scroll.ts` copies a subset to `data-story-stage`, `data-story-lamp`, `data-ning-card`, `data-lin-card`, `data-manuscript`, and `data-clip-on`. No renderer or CSS selector consumes these attributes. People and `lightLevel` are not bound to the artwork at all.

Consequently, the state model can pass a continuity assertion while the page remains on one fixed scene. The clearest contract gap is TR-09-10: its markup contains only `packing` and `empty` pictures, and the `departure` kind has no departure-specific behaviour. A generic reveal of the empty still cannot represent Ms. Lin leaving first, Ning following, and their separate bags moving through the doorway. The opening similarly has no progress-driven reveal beyond the later generic still-to-still transition. These were explicit requirements in the brief, not optional embellishments.

**Minimum correction:** bind actual scene layers or a small set of well-matched action frames to the evaluator, especially the ordered departure and carrying/clipping actions. Otherwise identify the affected director/transition requirements as incomplete; do not treat state-only assertions as visual evidence.

**Verify after correction:** inspect the real scene at the required five progress points in both directions; compare visible possession and location against the evaluator. No result is recorded here.

## IA-02 — Major: CH-03 comparison lighting is dropped at its transition boundary

**Evidence:** `src/render.ts`, `table()` and `transitionNames[2]`; `src/interactions.ts`, `updateLamp()`; `src/styles.css`, `[data-lamp-view][data-mode=…]`.

Only the CH-03 `.desk-scene` receives `data-lamp-view` and the selected comparison mode. TR-03-04 begins with a separate, unmodified `picture('table')`. Choosing **Off** therefore produces a dim CH-03 image but an ordinary bright table as the transition’s initial image. The saved comparison is not represented at the required 0% state or gradually handed back to story lighting at the doorway. The reverse approach has the same discontinuity. The “Back to this night” caption exists, but it does not perform the local illumination handover.

**Minimum correction:** apply the saved comparison to the transition’s incoming table layer, then interpolate to the canonical story light using that transition’s own progress. Keep all later chapters independent of the comparison value.

## IA-03 — Major: mobile sticky position and progress calculation disagree

**Evidence:** `src/scroll.ts`, `const stickyTop=height*(height<720 && innerWidth<=720?.23:.14)`; `src/styles.css`, `@media(max-width:720px)` sets `.transition-sticky{top:23svh}`.

At the required **390×844** viewport, the CSS sticky top is **194.12 px**, whereas the evaluator assumes **118.16 px**. Progress therefore begins about **75.96 px late**, and the transition is not at its final state when the sticky frame reaches its release point. The short desktop override also uses a separate 90 px value. This was confirmed by evaluating the actual numeric branches, not by a browser screenshot.

**Minimum correction:** measure the computed sticky top alongside each box, or use one shared responsive property. Re-measure after breakpoints, viewport changes, and motion changes. Avoid mixing `innerHeight` assumptions with CSS `svh` values.

**Verify:** normal, slow, fast, and reverse scrolling at 390×844, 360×640, and a short landscape view, observing both the sticky endpoint and the displayed scene.

## IA-04 — Major interaction defect: CH-09 copy fallback is off-screen in CH-10

**Evidence:** `src/render.ts`, `cards('packing')` creates a copy button; `ending()` is the only location of `#copy-status` and `#copy-fallback`. `src/interactions.ts` queries those global IDs for every copy action.

If clipboard access fails while the reader is at CH-09, the handler reveals the textarea in CH-10, focuses it with `preventScroll:true`, and selects its text. The reader remains at CH-09 without the promised visible fallback, while keyboard focus has moved to a distant section. Successful copy feedback is also displayed only in CH-10.

**Minimum correction:** provide a local status and selectable fallback next to each copy button, or explicitly bring the shared fallback into view with an understandable focus transfer. Prefer local feedback so copying does not interrupt the story.

**Verify:** deny clipboard access and use the CH-09 button by keyboard and touch; the failure explanation and selectable sentence must be visible beside the action.

## IA-05 — Major keyboard defect: dismissing the chapter menu steals the clicked control’s focus

**Evidence:** `src/interactions.ts`, the document click handler calls `closeMenu(true)` whenever the target is outside the open menu. `closeMenu(true)` focuses the chapter-menu summary.

For example, after opening Chapters, clicking the opening textarea first gives the textarea native focus, then the document handler moves focus back to the menu button. The visitor’s next keystroke no longer edits the intended field. This is a definite event-handler consequence; no browser reproduction is asserted here.

**Minimum correction:** use focus restoration for Escape and equivalent keyboard dismissal. On an outside click, close the menu without taking focus away from the clicked interactive element.

## IA-06 — Continuity inconsistency: Ms. Lin’s glasses enter the wrong location

**Evidence:** `src/state.ts`, CH-09 packing and the beginning of CH-10; `src/story.ts`, CH-09 paragraph A.

The prose says “Ms. Lin puts on her glasses”. The evaluator returns `glasses:'travel-bag'` at `resolveStoryState(9,0.9,defaultState)` and `resolveStoryState(10,0.1,defaultState)`. These returned values were directly checked in Node. The intended location is `lin-worn` until she leaves, then `outside` if outside is the project’s chosen representation for all departed possessions.

**Minimum correction:** make the evaluator and any new departure frames use the established action of putting the glasses on.

## Additional bounded issues

- **Exact input preservation:** `sanitizeOpening()` trims every non-empty input. A direct check with `"  Hello, 世界.  "` returns `"Hello, 世界."`. The brief asks to preserve visitor input. Keep the whitespace-only default rule while retaining non-empty input exactly, subject to the explicit length limit. The current code-point cap also separates multi-code-point graphemes at the boundary; clarify the limit or use grapheme-safe truncation.
- **Hero readiness evidence:** `src/main.ts` marks `berth:hero-ready` for every picture whose `data-asset` is `hero`. That includes the duplicate hero in TR-01-02, so a transition image can produce a readiness mark for the primary Hero. Scope this metric to `.hero-art` and distinguish meaningful initial visual from the full primary asset. Do not use the current unqualified mark as proof of primary Hero load performance.
- **Mobile transition sources:** `transition()` never passes the `mobile` option to `picture()`. Even where chapter imagery has independent portrait art, transition frames still use cropped desktop images. The brief specifically calls for independent matching mobile frames at TR-07-08; inspect this when the final portrait assets land.

## Sound foundations observed in source

The following are source observations rather than browser passes: all ten chapters and both narrative paragraphs per chapter are rendered; controls are native buttons/form/textarea; visitor text uses `textContent` or `value`; the beginning handout is not populated with the later saved sentence; CH-03 comparison styles are scoped locally; normal storage writes are checked before reporting persistent success; reduced motion switches to a native-scroll/static path; async copy feedback has a revision guard; images own their individual requests and contain an attempt guard before adopting an awaited preview; the default audio state is silent and AudioContext creation follows explicit activation.

Final acceptance still requires inspecting actual scenes, keyboard behaviour, rejected clipboard access, resource failures, and the corrected mobile transition endpoints in the browser.
