# SENTE — chapter and transition implementation ledger

Source review date: 9 November 2026. This ledger describes the implementation in `src/story.ts`, `src/main.ts`, `src/motion.ts`, `src/board-view.ts`, `src/session.ts` and `src/style.css`. It does not replace the browser evidence or claim that every item in the original art brief has been fulfilled.

**Evidence status:** the items below are present in source. Actual browser input, eleven measured CSS viewports, resource failures, the final frozen-state transition cohort and their limits are recorded separately in [QA-REPORT.md](QA-REPORT.md). The full requested acceptance matrix remains incomplete. “Implemented” in this ledger does not mean that every environment or creative requirement was verified.

## Ten chapters

Every chapter is a semantic section in ordinary document flow. Chapter IDs are also menu and URL-fragment targets. The page uses English titles, controls, feedback and accessible names.

| Chapter / anchor | First substantive beat | Second substantive beat | Implemented interaction and principal elements | Responsive treatment in source |
| --- | --- | --- | --- | --- |
| 01 — Before a move / `#before` | A genuinely empty 7 × 7 rules board is shown over the unruled desktop art plate. Loose stones in the art are not rule data. | An explicitly placed black stone changes the neighbouring empty-point set; liberties can be revealed. | `hero-board`; one-stone practice; `hero-try`, `hero-liberties`, `hero-clear`; real intersection buttons; saved `hero` coordinate. Clearing this stone does not reset any puzzle. | At ≤999px the board becomes a square above the copy; the desktop photo is hidden and a separate wood material supplies the surface. |
| 02 — Room to breathe / `#breathing` | Show the Hero stone, or the clearly labelled D4 default if no stone was placed. | Compare an isolated D4, A4 or A1 and the exact 4/3/2 liberty sets. | `breathing-board`; four mutually exclusive controls including the inherited starting example; numerical count, coordinate list and explanation update together. | A single selected example remains fully usable at narrow widths. The three examples are not simultaneously rendered as three small diagrams. |
| 03 — Connected, not just close / `#together` | D3, D4 and E4 form one L-shaped string. | Count its seven shared empty neighbours once and contrast separate F5. | `group-board`; select a stone or use `group-outline` / `group-separate`; `group-liberties` reveals exact liberty rings; string and liberty text update. | Board spans the layout above two short observation columns; controls remain DOM buttons. |
| 04 — The last liberty / `#capture` | Find White D4's remaining liberty in independent position P1. | Play Black D5, remove White D4, and expose the genuinely empty intersection. | `P1-board`; any point can be attempted; coordinate form, hint, Undo, Reset and chronological attempt list. Legal wrong moves remain visible. | A single full board and the complete explanation/control block are retained; coordinate selection supplies an alternative input path. |
| 05 — Two quiet spaces / `#eyes` | Inspect the supplied connected black structure with distinct C3/E3 eyes. | Try White at either eye and explain why no opponent is captured and the new white stone would have no liberties. | `eyes-board`; C3/E3 intersection input and dedicated `eye-c3` / `eye-e3` buttons; rejection marker; `eyes-reset`; unchanged rule board. | Complete board above two explanations; controls wrap. No puzzle score or fourth exercise is created. |
| 06 — A small bridge / `#bridge` | Identify two marked black strings in independent P2. | Play one black D3 to join five stones into one string with eight unique liberties and no capture. | `P2-board`; coordinate input, hints, Undo, Reset, history; success connection stroke and complete liberty set; link to `#reply`. | Full single-board layout; all controls remain available. |
| 07 — The next move matters / `#reply` | Variation A: from P2, Black D3 connects the strings. | Variation B: from the same P2 setup, Black D4 followed by White D3 leaves the strings separate. | `branch-A-board`, `branch-B-board`; independent Previous/Next controls; `branches-reset` and `branches-final`; default views are both final positions. | At ≤600px A/B switches the active board. A separate `.mobile-step-record` keeps both step lists visible, including the inactive line. |
| 08 — Letting one go / `#choice` | Protect marked C3/C4 while noticing the capturable white F5. | Inspect the stated white response, then compare the capture and protection outcomes. | `P3-board`; automatic response toggle (on initially); manual `P3-next` when off; Undo moves back one displayed step; full initial reset and attempts. `compare-choice` opens two explicitly labelled examples without adding user attempts. | P3 board remains full width. The two outcome examples stack vertically on small screens. |
| 09 — Not the same again / `#ko` | Black D5 captures White D4 in independent K1. | Attempt White D4 and show that hypothetical recapture equals the initial board at every point. | `ko-board`, capture/recapture/reset controls; two evidence diagrams `ko-original-board` and `ko-hypothetical-board`; failed recapture never changes the live board. Accessible action labels change to White after capture. | Live board and evidence occupy successive vertical regions; evidence diagrams stack at ≤600px. This is a rule observation, not puzzle four. |
| 10 — Leave with a little more / `#note` | Review three observations derived from actual attempts; untouched exercises are labelled examples. | Generate a standalone SVG with the same selected boards and all chronological attempts, with save and preview links. | `note-panels`, `download-note`, `download-feedback`; after generation, `note-save-link` and `note-preview-link`; per-puzzle revisit links and return-to-beginning link. | Three note panels become a vertical sequence at ≤999px. The exporter includes all records and grows vertically rather than cropping them. Actual browser-to-disk file validation has the limitation described below. |

### Hero state implementation and limits

| Brief state | What the current implementation does |
| --- | --- |
| Initial view | Real DOM title and controls; empty exact board; selected generated desktop environment. It does not wait through a black opening. |
| Reveal | A voluntary first move receives a 150ms placement decoration; liberties remain hidden until requested. There is no animated side-light reveal or 3D camera reveal. |
| Complete composition | Left text and right board on desktop; board above text on narrow screens. Actual visual fidelity must be judged from browser screenshots. |
| Stay | Retain the stone and optional liberty overlay; lift it explicitly. No automatic choice or score. |
| First scroll | Ordinary flow reaches TR-01-02 and then Chapter 2, using the same coordinate or explicit D4 default. The Hero camera does not continuously lower into the next chapter. |
| Return | Session state restores the stone or empty board. Scrolling or re-entering does not call the placement animation. |

### Shared interaction implementation

- `BoardView` draws exact SVG lines and stone centres from one 7 × 7 coordinate mapping. Native buttons use the same map. The SVG uses `preserveAspectRatio="none"` so the intentionally non-square desktop Hero and the input grid remain aligned.
- Interactive boards use a roving tab stop. Arrow keys move orthogonally; all four edges retain the current point when the requested direction leaves the board. Home/End move to row ends. Enter and Space use native button activation.
- P1, P2 and P3 have an independent coordinate selector. Legal wrong first moves remain until Undo/Reset; another black move cannot silently turn a one-move problem into unrestricted play.
- At ≤999px P1 and P2 also show board-local result text and Undo below their boards (`P1-board-status` / `P2-board-status`, `P1-board-undo` / `P2-board-undo`). These reflect the same session state as the full control block rather than creating another attempt history.
- Placement/capture decorations run only after the state has committed. Placement lasts 150ms. Captured visual copies lift 12px and fade over 180ms; they are hidden from accessibility and cannot receive input. Reduced motion skips new decorations. This is a short local lift, not an animation of stones travelling to a physical bowl.
- Sound is a locally synthesized, optional contact sound, off initially. It does not carry unique rule information.
- Menu, skip link and explicit navigation provide focus handoff in source. The browser report must verify their actual keyboard behaviour.
- Bodoni's optical size is pinned to `opsz: 18` for serif display elements; headings and the Hero subtitle use weight 450 to retain visible strokes over the wood texture. Body and control text remain Manrope with system fallbacks.

## The nine transitions actually implemented

Each boundary is a separately labelled, non-interactive editorial section: **opaque position diagrams on the two sides of an explanatory thread**. TR-01-02 through TR-05-06 have one board on each side. The later boundaries use explicit clusters: both P2 variations, both labelled P3 outcome examples, and all three observation-note boards. There are **23 transition boards in total**: 10 across the first five boundaries, then 3, 3, 3 and 4. Every board is present throughout its boundary. They never blend into one transparent board, slide individual stones between setups, or submit moves. A new position is identified as a separate example/setup.

This differs from the brief's more elaborate per-boundary camera, focal-object and media handoffs. The five statements below are changing explanatory text, not five different board-state mutations. Do not count these as five independently verified frames without browser evidence.

### Stateless progress and the five sample positions

For boundary rectangle top `t`, boundary height `h`, and viewport height `v`:

```text
p = clamp((v - t) / (v + h), 0, 1)
text step = round(p × 4)
```

The evaluator reads current layout and session state. It does not depend on visiting earlier chapters, accumulated animation time or onEnter/onLeave callbacks. Reversing scroll or jumping directly evaluates the same composition for the same geometry and interaction state. Distant transitions are skipped until near the viewport; on approach their current progress is evaluated rather than replayed.

The first five boundaries use the original two-miniature motion:

| Local progress | Preceding board translation / rotation | Following board translation / rotation | Thread marker and text |
| --- | --- | --- | --- |
| 0% | 0px / 0° | +16px / +2° | Marker at start; first statement |
| 25% | −4px / −0.5° | +12px / +1.5° | Marker at quarter; second statement |
| 50% | −8px / −1° | +8px / +1° | Marker at midpoint; third statement |
| 75% | −12px / −1.5° | +4px / +0.5° | Marker at three quarters; fourth statement |
| 100% | −16px / −2° | 0px / 0° | Marker at end; fifth statement |

TR-06-07 through TR-09-10 use gentler translation of their complete side or cluster, without rotation:

| Local progress | Desktop preceding / following side X | At ≤999px preceding / following side Y | Thread marker and text |
| --- | --- | --- | --- |
| 0% | 0px / +8px | 0px / +6px | Start; first statement |
| 25% | −2px / +6px | −1.5px / +4.5px | Quarter; second statement |
| 50% | −4px / +4px | −3px / +3px | Midpoint; third statement |
| 75% | −6px / +2px | −4.5px / +1.5px | Three quarters; fourth statement |
| 100% | −8px / 0px | −6px / 0px | End; fifth statement |

Text switches at the rounding thresholds 12.5%, 37.5%, 62.5% and 87.5%; those are not additional scene states. There is no pin, snap, opacity dissolve, camera motion or time-based catch-up timeline. Lenis runs from one manual RAF with `autoRaf: false`; the evaluator reads the resulting document scroll. Reduced motion destroys Lenis, uses native scrolling, removes board transforms, centres the marker and shows all five boundary statements as stable text.

Desktop places the two sides at the ends of a three-column row. Early boundaries have one miniature per side; at ≤600px those two boards occupy the first row and the text/thread occupy the second. Later boundaries allocate more width to the multi-board side. At ≤999px their entire preceding side, thread and following side become three successive vertical regions; at ≤600px each two- or three-board cluster becomes a single vertical sequence so that its diagrams remain readable. TR-08-09 has a warmer background; TR-09-10 has its own light background and three-note hierarchy. All nine share the same stateless progress formula, while early and late groups use the different transform amplitudes above.

### Board identities and chapter relationship

| Boundary / IDs | Preceding diagram, from current source | Following diagram, from current source | Boundary anchor |
| --- | --- | --- | --- |
| TR-01-02 / `tr-1`, `tr-1-from`, `tr-1-to` | Hero stone, or explicit default D4 | Same single stone with exact liberty rings | Same coordinate, now read through its empty neighbours |
| TR-02-03 / `tr-2` | Independent central D4, regardless of the last Chapter 2 comparison selection | `GROUP_BOARD`: D3, D4, E4 and separate F5 | Follow a grid line into a connected-string example |
| TR-03-04 / `tr-3` | `GROUP_BOARD` | Current P1 displayed position, including its actual attempt/undo state | Move attention from a string to a remaining empty point |
| TR-04-05 / `tr-4` | Current P1 displayed position; may still be initial if unplayed | Complete independent two-eye structure | Compare an empty space with two internal points |
| TR-05-06 / `tr-5` | Two-eye structure | Current P2 displayed position | Connection in a shape, then a one-move connection problem |
| TR-06-07 / `tr-6` | Current P2 displayed position (`tr-6-from`) | Both A and B at their independent current replay steps (`tr-6-to-A`, `tr-6-to-B`); each caption states the displayed step | The same initial setup supports two clearly separated lines |
| TR-07-08 / `tr-7` | Both P2 variations at their current replay steps (`tr-7-from-A`, `tr-7-from-B`) | Current P3 displayed position with C3/C4 marked (`tr-7-to`) | Carry the comparison into a fresh protection problem |
| TR-08-09 / `tr-8` | Two fixed, labelled P3 examples (`tr-8-from-take`, `tr-8-from-keep`): F6/C5 captures the marked pair; C5/F6 preserves it | Current K1 live position (`tr-8-to`) | Both consequences remain distinct beside the separate rule example; these diagrams never become personal attempts |
| TR-09-10 / `tr-9` | Current K1 live position (`tr-9-from`), labelled before or after capture | All three current note-panel boards (`tr-9-to-P1`, `tr-9-to-P2`, `tr-9-to-P3`), each labelled personal observation or unplayed example | The complete three-part record is already visible in the handoff |

“Current” means that an explicit interaction can update the miniature, including on a later return. It does not mean that scrolling produces the solution. Read-only boundary boards are never input targets.

### Exact five displayed statements per boundary

| Boundary | 0% | 25% | 50% | 75% | 100% |
| --- | --- | --- | --- | --- | --- |
| TR-01-02 | Keep the same intersection. | Look from above. | Find the four directions. | Let the empty points appear. | Read the liberties. |
| TR-02-03 | One stone has neighbours. | A line reaches the next point. | A new, independent example. | Trace the connected stones. | Count the empty points once. |
| TR-03-04 | See the whole string. | Notice an empty neighbour. | P1 is a separate setup. | Find White’s remaining space. | Your move can change it. |
| TR-04-05 | Keep your P1 position. | Look at the space around stones. | A new example is placed beside it. | Two internal points remain distinct. | Inspect the two eyes. |
| TR-05-06 | Notice the middle connection. | Hold that relationship in mind. | P2 is a different setup. | See the two separate strings. | Find a way across. |
| TR-06-07 | Keep your attempted bridge. | Make room for comparison. | Both lines start from P2. | Add the stated white reply. | Compare what is really connected. |
| TR-07-08 | Look beyond the first move. | Keep the same reading direction. | P3 begins independently. | Find the two marked black stones. | Choose, then see the reply. |
| TR-08-09 | Compare the two P3 examples. | Notice the points left empty. | K1 is a separate position. | Keep each board clearly distinct. | Ask what returning would repeat. |
| TR-09-10 | Keep the rule example in view. | Let the board become a record. | Bring your three exercises together. | Keep attempts as they happened. | Take a small note with you. |

## Explicit differences from the supplied brief

| Brief requirement or direction | Current implementation | Consequence for acceptance |
| --- | --- | --- |
| Six Hero states including lighting reveal and first-scroll camera change | Static aligned art plus precise interactive SVG; voluntary placement/liberty interaction; coordinate/state continuity into Chapter 2 | The interaction states exist, but the lighting/camera choreography is not implemented. |
| Nine individually choreographed five-frame handoffs | Nine editorial boundaries use two transform families and changing text. Late boundaries contain all required variation/note boards, but those boards stay simultaneously visible throughout the boundary. | Do not describe the captions as nine bespoke spatial or camera choreographies. |
| TR-08-09 gradually gathers the two outcomes into a principal K1 view | Two labelled P3 outcomes and K1 coexist in a stable editorial composition; the sides translate a few pixels | The two-lines-to-one relationship is present, but no progressive merger or camera handoff is implemented. |
| TR-09-10 gradually forms three observations from the rule example | K1 and the three current note boards are present for the entire boundary | The complete record is visible, but its formation is not a staged animation. |
| Chapter 2 reduced-motion view retains three small comparison diagrams | The selected single board and all example controls remain usable in reduced motion | No simultaneous three-diagram reduced-motion layout is implemented. |
| Captured stones are collected toward the outside of the board | A 12px lift/fade reveals the committed empty point | The rule effect is real, but no physical bowl/edge collection path is implemented. |
| Hero's single black stone closes on a wider empty board in Chapter 10 | A decorative CSS black stone and return link close the page | The ending does not rebuild a wide empty board with the original Hero coordinate. |

The complete art references and their adoption decisions are documented separately in `art/ART-DIRECTION.md` and `art/generation-log.json`. Concept generation is not proof of production composition fidelity.

## Separate browser evidence and remaining coverage

The [QA report](QA-REPORT.md) records actual input, layout, resource-failure, production and package checks. The final transition metadata and 45 captures form one frozen-state cohort, with nine reverse midpoint checks. At the exact start/end of the current progress formula a transition may sit outside the viewport; those endpoint screenshots document the boundary and adjacent chapter, rather than a fully visible transition composition.

The complete requirement also calls for continuous slow/fast forward/reverse observation, native zoom, touch/assistive technology, abnormal-resource timing and lifecycle checks. Their actual covered or unverified status belongs to the QA report, not an inference from this source ledger.

### Known export-browser evidence boundary

The integration browser run reported that the actual generation button created a Blob URL, displayed the ready status and exposed the persistent save-again and preview links. Opening the preview produced a new tab titled **“SENTE — Three observations.”** These observations confirm the UI generation/preview path only.

The remote download-event/media-capture operation timed out, and the browser security policy refused acquiring the `blob:` tab for further inspection. That restriction was not bypassed. **A successful save to the browser's disk and the exact saved file contents remain unverified:** no downloaded file was acquired, byte-compared or visually inspected through that browser. Module-level SVG tests remain valid but do not stand in for that missing end-to-end file check. The final browser acceptance report owns the complete execution details.
