# SENTE — rules, state and limits

Implementation review: 9 November 2026. This is an original finite interactive tutorial, not an online Go service or a complete tournament engine. The scope in this file is derived from current source, the supplied positions and the independent rule-data verification.

## Board and move rules

All official diagrams use exactly **7 × 7 intersections**. Columns A–G increase left to right; rows 1–7 increase bottom to top. There are no omitted off-board stones or implied extra intersections. Internally, A1 is array index 0 and G7 is 48.

`src/engine.ts` implements:

1. Validate that the chosen point is inside the board and empty.
2. Place the current colour in a new candidate board.
3. Find orthogonally adjacent opposing strings, with set-based, deduplicated liberties.
4. Remove opposing strings with no liberties.
5. Reject the move if the new friendly string still has no liberties.
6. Reject immediate board repetition under the simple-ko rule below.
7. Commit a new frozen position with the next player, move metadata, capture counters and board history.

The original position is unchanged on rejection. Display, sound, asset loading and animation completion do not decide whether a move is valid. Diagonal proximity is not a connection. A liberty shared by multiple stones is counted once for the whole string.

### Exact repetition limit

The engine implements **simple ko**: the candidate board key is compared with the position immediately before the opponent's last move (`history[history.length - 2]`). It does not search every prior position and does not implement positional or situational superko.

The BGA-hosted [AGA rules text](https://www.britgo.org/rules/agarules.html) identifies itself as April 1991 and describes a broader same-position/same-player history restriction. SENTE uses its capture-before-suicide principle and the shared typical immediate-ko example; it does **not** claim full AGA conformance or that this is the latest complete tournament ruleset. The [BGA introductory explanation](https://www.britgo.org/intro/intro2.html) also explains intersections, liberties, strings and immediate recapture. More source notes are in `research.md`.

## Fixed independent setups

All unlisted intersections are empty. Replacing one chapter's setup with another is explicitly a new example; it is not represented as a sequence of legal moves in one ongoing game.

| ID | Initial black stones | Initial white stones | Local objective / response |
| --- | --- | --- | --- |
| P1 | C4, D3, E4 | D4 | Black plays once to capture White D4. Only D5 succeeds. |
| P2 | B3, C3, E3, F3 | C2, C4, E2, E4 | Black plays once to connect both marked strings without a capture. Only D3 succeeds. |
| P3 | C3, C4, E5, F4, G5 | B3, B4, C2, D3, D4, F5 | Keep Black C3/C4 after the disclosed white response. After Black C5, White F6; after every other legal first move, White C5. Only C5 succeeds. |
| K1 | C4, D3, E4 | D4, C5, E5, D6 | Black D5 captures D4. White's immediate D4 would capture D5 and exactly restore K1, so it is rejected. |
| String example | D3, D4, E4, F5 | None | D3/D4/E4 form one string; F5 remains separate. |
| Two-eye example | B2, C2, D2, E2, F2, B3, D3, F3, B4, C4, D4, E4, F4 | None | White C3 or E3 captures nothing and has no liberties; either attempt is rejected. |

The string example has seven shared liberties: C3, C4, D2, D5, E3, E5 and F4. After P2 D3, the five-stone string has exactly eight: A3, B2, B4, D2, D4, F2, F4 and G3.

### P3 is a disclosed script

The white response is selected by `p3ReplyFor()` from the coordinate of the first black move. It is not an AI search, opponent model or claim of globally optimal play. Black F6 first captures White F5; White C5 then captures Black C3/C4. Black C5 followed by White F6 preserves the target pair. This establishes this exercise's goal, not a universal claim that two saved stones are always worth more than one capture.

Automatic reply is on in a new session. Turning it off retains the first-move board until the user explicitly chooses “Show the white reply.” Current automatic mode commits the final two-move position in one action and decorates both move effects; it does not pause on the intermediate first-move position. The manual control, Undo and recorded step information provide the intermediate view.

### No full-game rules or playing-strength claims

There is no unrestricted opponent, matchmaker, account, rating, rank, leaderboard, analysis engine or win probability. The engine does not implement passing, game ending, komi, handicaps, territory/area scoring, dead-stone adjudication, seki adjudication, generalized eye recognition or complex repetitive cycles. No enclosing shade is automatically classified as territory. The C3/E3 eye lesson applies only to its explicit shape. K1 is a rule observation, not a fourth scored puzzle.

## User actions, history and undo

`src/session.ts` keeps separate state for the Hero, three puzzles, eye inspection, P2 variations, ko observation and preferences. Scroll progress is not saved as a move and cannot submit an answer.

- Every attempted puzzle coordinate is retained in chronological order, including occupied or otherwise illegal points.
- A legal trial remains visible. To make a different first move, the user must undo to the initial position or reset it.
- P3 Undo steps from the white response to the first black move, then to the initial setup. It does not rewrite the furthest step that was actually observed.
- Reset restores the initial displayed position but retains attempts. It is not a history-erasing control.
- Revisiting an attempt shows its actual recorded observation extent. It does not fabricate an unseen white response.
- P2 A/B replay is rebuilt from its common initial position each time. Its comparison controls do not count as puzzle attempts.
- The P3 comparison examples likewise do not alter the personal record.
- The state schema stores actions and preferences. It replays fixed trusted positions on restore; stored computed boards, success claims or capture counts are not trusted as input.

Persistence uses only localStorage under `sente-observations-v1`. If storage is unavailable, the current page continues in memory and explains that the downloadable note can preserve observations. There is no cloud sync. Browser storage removal or a different browser profile starts a separate session.

## What the exported observation means

The page and exporter share the same `NotePanel` data. For each exercise, the note uses the **latest legal attempt's furthest actually observed board**, not necessarily the currently rewound/revisited board. All attempts remain in order below it. This is a record of observations, not a screenshot of every temporary undo state.

If no attempt exists, the standard example is displayed with **“Example — not played.”** If only illegal attempts exist, the unchanged starting board is used and the explanation says no legal move has yet been produced. Pending P3 replies are explicitly described as not yet viewed, and the protection goal is not claimed as evaluated.

The standalone SVG has no external assets or fonts. It includes coordinates, precise stones, captions and all attempt explanations; height grows to accommodate long records. Text is XML-escaped. It invents no elapsed time, score, rank, first-try success or user choice. Download is local through a Blob URL and does not upload observations.

After generation, the page keeps **“Save the SVG again”** and **“Open the SVG note”** links visible. Both refer to the generated snapshot. They do not silently update if later moves are made; generating a new note creates a fresh snapshot and replaces the previous URL. The current Blob URL is revoked when a replacement is generated or on `pagehide`.

The integration browser run observed the real button producing a Blob URL and ready status, then the preview opening a tab titled **“SENTE — Three observations.”** Remote download-event/media capture timed out; the browser security policy also refused acquiring the `blob:` tab. That boundary was respected. **A successful browser save to disk and the exact saved file contents remain unverified**: no captured browser file was byte-compared or visually inspected. The SVG module tests verify the generator independently and remain valid, but they do not close this browser-download evidence gap.

## Rendering, input and resource boundaries

Official positions are computed from coordinate data, never inferred from AI images. `BoardView` uses SVG for geometry and native DOM buttons for input. It does not require Canvas, Three.js or WebGL, so there is no graphics-context state handoff to validate. Generated images supply a desktop environment and wood material; remaining generation outputs are art references.

Buttons describe coordinate, occupancy, connected-string liberties and the applicable action. The current source includes orthogonal arrow-key navigation, Home/End, visible focus, per-puzzle coordinate selectors, semantic headings, native dialog behaviour and English live feedback. Actual screen-reader behaviour and physical touch use require their own acceptance evidence; the source alone cannot verify them.

When a board material image fails, the SVG still contains its wood-coloured base, exact grid and rule state. The Hero error path exposes that fallback board and hides the failed photo. Fonts have system fallbacks. Image assets do not asynchronously replace board identities. There is no model loader or stale-branch model response.

JavaScript is required for the full story and its interactive boards. With JavaScript disabled, the page provides an English explanation, not a playable ten-chapter fallback. Full network failure before the initial HTML/JavaScript arrives is outside the resource-fallback promise. The packaged built site can run locally after it has been obtained.

## Motion and sound boundaries

Full motion uses one manually advanced Lenis instance. The application reads the device's reduced-motion preference unless the visitor chooses a manual override. Reduced mode removes Lenis, disables transition transforms, shows stable boundary explanations and skips new stone decorations. It retains every chapter, puzzle, response control and export.

The animation frame loop pauses while the document is hidden; resuming reads current scroll and layout. The nine transition sections contain 23 opaque board diagrams in total. The late boundaries keep both P2 variations, both labelled P3 examples and all three observation-note panels visible in their respective clusters. Read-only examples do not become user attempts. These are editorial diagrams with two small-translation families, not a real-time 3D camera sequence. Their exact board identities, transforms and remaining implementation differences are listed in `CHAPTERS-AND-TRANSITIONS.md`.

Sound begins off. It is synthesized locally only after the user enables it, and it can be switched off again. Audio failure does not delay or undo a rule result. No spoken narration or external soundtrack is included.

## Verification boundary

The independent Python verifier was actually executed during development. It enumerated all 45 initial empty points in P1, all 41 in P2, and all 38 in P3; all were legal first moves and each puzzle had exactly the stated single solution. All 38 P3 scripted replies were legal. It separately checked liberty sets, diagonal separation, both eyes, P2 branch isolation and exact K1 recapture equality. See `reference-enumeration.json` and `tests/reference-enumeration.py`.

That computation validates the supplied positions independently. The [QA report](QA-REPORT.md) now records the fresh 61-test code-candidate run, actual browser input, eleven measured viewports, final transition cohort, resource failures, production observations and independent candidate extraction. The complete requested browser/creative acceptance matrix remains incomplete. Export UI/preview observations are narrower than file-on-disk validation, which remains unverified. Real mobile hardware, untested browsers, native zoom and unmeasured frame rates are not claimed as verified.
