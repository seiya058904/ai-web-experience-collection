# ODDS — requirement and evidence ledger

Prepared from `10-odds(1).md` on 9 November 2026. This is the acceptance checklist, not a claim of completion. Every status below is **PENDING** until linked to implementation and observed evidence. The final acceptance report may supersede this planning snapshot without rewriting what was known at this stage.

## Scope and invariants

- Deliver all ten substantive chapters and all nine adjacent transitions. Loading, navigation, transitions, and the footer do not count as chapters.
- All authored site copy, accessible names, metadata, fixed export text, and error states are English. Set `lang="en"`.
- Generate eight distinct, independently viewable AI images before production scene implementation; maintain the actual prompt, output file, role, and selection rationale. Do not invent seeds or generation settings.
- Use real Lenis, one coordinated scroll clock, reversible scene evaluation, and native semantic controls. Do not lock scrolling or force a replay.
- Only explicit user actions create or append samples. Scroll, resize, returning, loading, preference changes, and image replacement cannot sample.
- This is an ideal independent left/right model with a seeded pseudorandom implementation. The trajectory is a visualization, not calibrated collision physics.
- Keep demonstrations, teaching comparisons, bias experiments, and the visitor's active round distinct. Preserve each round's seed, parameters, paths, identities, and counts.
- No deployment, push, PR, Release, or Collection addition is authorized. Deliver reproducible source, production assets, and a ZIP with an SHA-256 checksum.

## Ten chapters

| ID / canonical English title | Required first beat → second beat | Interaction and factual acceptance | Evidence required | Status |
| --- | --- | --- | --- | --- |
| CH-01 — The waiting ball | Recognizable entry, complete board and nine trays → one particular path reaches one endpoint | Label fixed examples; replace/separate them when personal sampling begins. One click adds one sample. Right-turn count equals endpoint. Six Hero states remain coherent on return. | Desktop/mobile/wide cold-open and return screenshots; click/count assertion | PENDING |
| CH-02 — Left, or right | One equal-probability fork → a short independent sequence does not compensate for its past | Explicit rerun button; two short sequences; keyboard inspection cannot alter the draw. Never alternate directions to enforce balance. | Button and keyboard action record; sequence display | PENDING |
| CH-03 — More paths than places | Enumerate all 16 four-step routes → six share endpoint 2 | Select prefix or endpoint; inspect routes by click/keyboard; reset to all. Exactly LLRR, LRLR, LRRL, RLLR, RLRL, RRLL at the center. | Enumeration test; route selection screenshots | PENDING |
| CH-04 — Why the middle fills | Extend the structure from four to eight levels → exact path multiplicities form nine weights | Show 1,8,28,56,70,56,28,8,1; total 256. Explicitly label path counts, not observed balls. Translate to probability, then expected counts for 16 balls; center expectation 4.375. | Math tests; nine-endpoint screenshot; unit-change frames | PENDING |
| CH-05 — The character of a small sample | Two separate 16-ball rounds → observed counts differ from an expected-count outline | New pair and one-step undo. Shared ball-count scale and `16 × P(K=k)` reference. Actual shapes are never manually balanced. | Counts sum to 16; undo identity; paired tray screenshots | PENDING |
| CH-06 — A different leaning | Choose per-level right probability → a new 64-ball round shifts its expected position | n=8; p=0.25/0.50/0.75. Changing p creates a clearly marked new round; restore previous round. Chapter 7 cannot overwrite this state. | Three settings, previous-round restore, back-navigation state | PENDING |
| CH-07 — Same rules, different evenings | Three seeds, same n=8 and p=0.5 → compare 16/64/128 prefixes | Prepare all three rounds to 256; show shared N and scale, default 128. Preserve each prefix. Select the middle round for CH-08. Do not promise monotonic convergence. | Prefix tests; all three N values; shared-scale check | PENDING |
| CH-08 — A portrait of 256 | Extend only the middle teaching round to 256 → inspect any individual ball | Exactly 256 unique sample IDs. Selecting a ball or endpoint reveals its actual eight directions. Provide keyboard and usable mobile alternatives to tiny hit targets. | Identity/count tests; selected-ball route evidence; portrait screenshot | PENDING |
| CH-09 — Your apparatus | Choose n, p and N → explicitly run and save an actual result | n={4,8,12}; p={0.25,0.5,0.75}; N={16,64,256}. Run, replay, fresh round with same rules, restore previous round, real SVG download. Display active seed and actual/theoretical data. | All parameter families; undo/replay identity; downloaded SVG compared with current state | PENDING |
| CH-10 — One more ball | Return to the original view with the active round → the next explicit ball joins that round | Board respects current n and n+1 endpoints, including 4 or 12. Increment N and counts together; both export locations use updated state. Untouched visits show a labelled demo. | Append assertion; n=4 and 12 endings; export after append; return to workbench | PENDING |

## Nine reversible transitions

For **each** boundary, capture actual normal-motion 0%, 25%, 50%, 75%, and 100% frames, then observe continuous forward and reverse scrolling. Still frames alone do not prove temporal quality. Test direct entry into the middle and both sides of renderer/semantic switches.

| ID / shared anchor | Required state sequence and special constraint | Evidence required | Status |
| --- | --- | --- | --- |
| TR-01-02 / first fork | Full board → approach first fork → keep its projection aligned → reveal both exits → stable fork. Preserve ball identity and width/shadow continuity. | Five frames, forward/reverse, mobile and reduced motion | PENDING |
| TR-02-03 / selected trajectory | One fork → second layer → four layers half unfolded → five endpoints appear on one baseline → all 16 paths. No burst of untraceable lines. | Five frames; direct mid-entry has four valid levels | PENDING |
| TR-03-04 / endpoint baseline | Four levels/five endpoints → move existing structure upward → add four levels; old endpoints become intermediate nodes → nine final endpoints → full eight-level view. Label structural expansion; never report an invalid intermediate distribution. | Five frames; n/endpoint semantic checks; hardest-boundary prototype | PENDING |
| TR-04-05 / theoretical outline | Combinatorial weights → divide by 256 with probability units → multiply by 16 with a ball-count axis → second independent tray → two real 16-ball rounds. Do not round an expectation into a guaranteed outcome. | Five frames including unit labels; equal sample-tray scale | PENDING |
| TR-05-06 / p label | Two trays → shared p=0.5 moves to board → prior samples become labelled summaries → probability buttons appear → new-condition board. Layout changes cannot submit a round. | Five frames; no count/seed changes during scrolling | PENDING |
| TR-06-07 / endpoint order | Active bias board → saved previous-condition summary → explicit independent n=8,p=0.5 teaching comparison → three prepared groups → shared-scale triptych. | Five frames; preserved bias state after reverse | PENDING |
| TR-07-08 / middle tray | Three rounds → select middle; outer rounds recede → middle nine trays gain depth without duplicate balls → show longer prefix → its 256-ball portrait. Outer samples never merge into it. | Five frames; IDs and counts; hardest-boundary prototype; no double rendering at 50% | PENDING |
| TR-08-09 / selected ball and result slip | Portrait → selected ball's actual route → route becomes a readable result slip → parameters enter normal flow → complete workbench. Selection does not change counts. | Five frames; valid default selection on direct entry | PENDING |
| TR-09-10 / apparatus silhouette | Workbench → compact active-rule line → original camera with current n → entry ball becomes focal point → stable conclusion and current result. No reset or automatic append. | Five frames; preserved active result/export; reverse restores form | PENDING |

## Eight image deliverables

| ID | Distinct role | Evidence required | Status |
| --- | --- | --- | --- |
| IMG-01 | Desktop-scale three-quarter Hero A | Actual generated file, prompt, inspection | PENDING |
| IMG-02 | Near-frontal monumental Hero B | Actual generated file; genuinely different camera/scale | PENDING |
| IMG-03 | Entry/lead-ball macro Hero C | Actual generated file; distinct composition | PENDING |
| IMG-04 | Refined selected desktop direction | Actual generated file; slot continuity, shadow, text-safe region | PENDING |
| IMG-05 | Independently composed vertical mobile Hero | Actual generated file; entry and complete tray row | PENDING |
| IMG-06 | CH-04 path-weight relief concept | Actual generated file; exact mathematics remains code-owned | PENDING |
| IMG-07 | CH-08 ordered orange-ball portrait concept | Actual generated file; quiet 3D group rather than falling particles | PENDING |
| IMG-08 | TR-07-08 50% midpoint concept | Actual generated file; middle tray continuity and separate side groups | PENDING |

## Verification matrix

| Area | Required verification | Status |
| --- | --- | --- |
| Mathematics | n=4 complete enumeration/center six; n=8 coefficients total 256; all path lengths and right counts; all counts sum to N; repeatability and prefix extension; p=0/1 boundaries | PENDING |
| Main journeys | 1440×900 and 390×844: start→end→start, direct late chapter then reverse, chapter anchors, refresh/history, scrollbar and early scrolling | PENDING |
| Other CSS viewports | 320×700, 360×640, 768×1024, 1920×1080, 2560×1440, 3840×2160; breakpoint neighbors and short landscape | PENDING |
| Accessibility | Semantic English headings and controls; keyboard operations, focus visibility and return; DOM equivalents for graphics; useful live result announcements; zoom at 125/150/200% | PENDING |
| Motion | System and manual reduced-motion changes retain all chapters/data; pause/step/instant result/replay as appropriate; ordinary motion remains enabled for transition tests | PENDING |
| Recovery | Slow/failed images and fonts, target-change loading order, resizing, background return, unavailable WebGL, storage failure/corruption; target chapter stays complete | PENDING |
| Lifecycle/performance | Record browser, viewport, DPR, known hardware and throttling; meaningful first visual, full Hero and interaction readiness; repeated traversal and hidden-tab pause; no invented FPS/Lighthouse score | PENDING |
| Packaging | Lockfile and legal assets included; clean ZIP extraction, documented install/build/production-preview commands, main journey, asset and subpath checks, Windows instructions and SHA-256 | PENDING |

Physical devices and browsers not actually used remain **NOT VERIFIED** in the final report. A simulated viewport is not physical-phone or physical-4K evidence. Store each real defect with location, conditions, reproduction, cause, fix and affected-path retest. Keep engineering facts and visual judgments separate.

