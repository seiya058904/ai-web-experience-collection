# SENTE — independent finish review

Status: **bounded review complete, including focused confirmation of the wide Hero, mobile feedback, and chapter ten**. The concrete wide-seam and mobile-feedback findings are closed. The choreography deviation remains explicitly documented.

This is one bounded finish handoff, not a new design direction or a full acceptance run. No application files were edited and no browser or preview process was controlled. The Impeccable context launcher was unavailable; the supplied brief, `PRODUCT.md`, accepted art, rendered captures, and relevant source were read directly. No `DESIGN.md` existed at the project root at review time.

## Evidence and limits

- Brief: `upload/05-sente(1).md` in the parent workspace.
- Accepted art inspected: `art/concepts/img-04-desktop-refined.png`, `img-05-mobile-composition.png`, `img-06-two-eyes.png`, `img-07-choice-comparison.png`, and `img-08-transition-midpoint.png`.
- Actual captures inspected: `sente-desktop-1440.jpg`, `sente-wide-3840.jpg`, `sente-eyes-desktop.jpg`, `sente-branches-desktop.jpg`, and `sente-choice-desktop.jpg` in the parent workspace; then `/workspace/scratch/sente-desktop-verified-1762654001.jpg` and `/workspace/scratch/sente-tr8-verified-1762654002.jpg`. The last two are the original final capture bytes saved under reliable paths after the earlier filenames failed to synchronize; they are not additional recaptures.
- Focused final confirmation inspected the actual files in `docs/evidence/`: `mobile-hero-final.jpg`, `mobile-p1-final.jpg`, `mobile-p2-final.jpg`, `wide-3840-final.jpg`, `mobile-note-panel-final.jpg`, `mobile-note-controls-final.jpg`, `note-cards-final.jpg`, and `desktop-hero-final.jpg`.
- The wide capture is a **3840 × 2160 CSS viewport capture**, not evidence of physical 4K hardware. The remaining desktop captures are 1440 × 900.
- Source inspected: `src/story.ts`, `src/style.css`, `src/board-view.ts`, `src/motion.ts`, relevant interaction/render paths in `src/main.ts`, and the observation-note renderer.
- No rule-engine rerun, screen-reader session, physical touch-device test, network-failure test, actual download, or full transition-motion verification was performed by this reviewer. Static captures cannot establish those results. In particular, the visible download button is not evidence that a file download completed.

## Overall assessment

The supplied desktop frames show a coherent, specific Go story. The primary board is a readable exact grid with convincing weight and sufficient separation between black and white stones. The serif titles, restrained accent, and clear prose support the material world instead of competing with the board. The late chapters have their own comparison structures and consequences; they do not collapse into undifferentiated prose.

**No P0 or independently demonstrated P1 defect is established by the supplied frames.** That statement is limited to this evidence and is not a claim that the full requested acceptance matrix passed.

## Significant findings

### 1. P2 — extreme-wide Hero material seams — CLOSED

**Evidence:** `sente-wide-3840.jpg`; `src/style.css`, `.hero-scene` and `@media(min-width:2200px)`.

The original wide capture showed a centered 2200-pixel Hero plate with a materially lighter repeated board texture outside it and abrupt edges. The primary title and board remained readable, but the tabletop stopped reading as one surface.

**Resolution confirmed:** `docs/evidence/wide-3840-final.jpg` replaces the repeated wood with clean paper gutters around the original composition. The mismatch is gone, the framing is deliberate, and the primary board and copy are retained. This closes the concrete seam finding without a redesign.

### 2. P2 — the implemented Hero reveal and handoffs are materially simpler than the specified choreography

**Evidence:** accepted desktop/TR-08-09 concepts; `src/motion.ts`, `src/style.css`, and the transition construction in `src/story.ts`.

The Hero is already a stable top-down composition. Its code has no distinct light/camera reveal or perspective change into chapter two. The implemented boundaries use explicit separate board snapshots, slight translation/rotation, a moving progress point, and changing explanatory text. This is clear and avoids ambiguous stone morphing, but it does not establish every spatial/camera beat described in the brief's six Hero states and five-stage boundary tables.

**Narrow action:** report this as an intentional editorial implementation and a residual brief deviation. Do not claim that static screenshots prove every requested animated beat. The final TR-08-09 capture establishes clear board identity and an orderly editorial composition; no additional visual change is indicated by that frame.

### 3. P2 — mobile P1/P2 feedback was separated from board input — CLOSED

The initial source review identified the risk that tapping P1/P2 could update a feedback panel above the phone viewport. The parent task subsequently measured the original P1 result above the viewport and added a second, mobile-only result and real Undo control directly below each board.

**Resolution confirmed:** `mobile-p1-final.jpg` shows the entire P1 board, the actual unsuccessful A1 explanation, and `Undo this move` together. `mobile-p2-final.jpg` shows the connected D3 result, the explanation of eight distinct liberties, and its adjacent Undo control. The original detailed copy remains available. The parent task reports that the local Undo was actually exercised; this reviewer confirms placement and readability from the images, not a separate interaction run.

**Evidence qualification:** the inspected `mobile-p2-final.jpg` still contains the previously reported foreign blue/green material artifact from the earlier long-lived preview. Its cause was not independently established by this reviewer. This image is excluded entirely from final SENTE material evidence and used only to verify feedback placement and board geometry. The golden-wood phone Hero and P1 final captures are visually consistent. The parent task reports a new production P2 success state, successful resource responses, and prefixed-asset checks; those DOM/resource checks are not a substitute for a fresh phone P2 material screenshot. **Final mobile P2 material was not independently verified in a fresh screenshot by this reviewer.**

## What is working

1. **The official board is visually and semantically separate from the art.** Exact lines and coordinates remain clear over the texture. The visible stones are centered on intersections, with restrained highlights and attached contact shadows. The accepted concept's malformed or illustrative positions are not being used as rule data.
2. **Multi-board identity is explicit.** Chapter seven labels A and B, spells out Black D3 versus Black D4 followed by White D3, and gives both boards consistent scale and lighting. Source defines separate board instances and replay steps. The later transition source likewise names the two P3 examples and the independent K1 board rather than merging them into one opaque state.
3. **Late-chapter copy respects the finite exercise.** The P3 goal names C3 and C4; the teaching reply is disclosed; successful feedback describes the local outcome. The comparison's copy states that preserving two stones is not a universal value rule. K1 is labelled as one repetition example rather than a complete tournament ruleset.
4. **The comparison affordances have real state behind them.** Source uses native buttons, a stable keyboard grid, explicit undo/reset controls, coordinate alternatives, and distinct displayed attempts. These are favorable implementation facts; their complete end-to-end behavior still belongs to the main acceptance evidence.

The verified final desktop Hero also has materially clearer title hairlines than the earlier frame. In final TR-08-09, the two P3 outcomes remain opaque, distinct, and individually labelled at left, while K1 sits separately at right. The three boards do not overlap and do not produce doubled stones or dirty transparency. Its small coordinates and move captions are secondary to the readable main relationship; they do not establish a new significant defect in this static frame.

## Viewport framing, not confirmed layout loss

The 1440 × 900 Hero screenshot ends at the board caption. The eyes screenshot begins partway through its heading and ends near the board bottom. Chapter seven's boards extend below that captured viewport. These are ordinary viewport crops of flowing sections: the source does not impose a clipping height on those chapter containers. They must not be logged as missing boards, missing controls, or truncated chapter content solely from these images.

## Final mobile and ending confirmation

The outstanding screenshot questions are closed within the supplied evidence:

- **Phone Hero:** `mobile-hero-final.jpg` presents a complete 7 × 7 top-down board above the title, short premise, and real first-stone control at 390 × 844. The golden wood and readable text remain consistent. It is an independent vertical arrangement, not a narrow crop of the desktop scene. The accepted concept's loose black/white stones are absent; this remains a minor material-composition deviation, not a blocked task.
- **P1/P2 result context:** the focused final captures establish adjacent feedback and Undo, as recorded in the closed finding above.
- **Desktop ending:** `note-cards-final.jpg` shows three separate Capture, Connection, and Choice observation boards, each with its own actual-state description and history disclosure. The P1 example in that desktop capture truthfully describes an unsuccessful A1 attempt rather than substituting a solved board.
- **Phone ending:** `mobile-note-panel-final.jpg` shows a complete observation board, explanatory caption, history disclosure, and revisit link in vertical flow. `mobile-note-controls-final.jpg` shows the last panel's description/history/revisit control, the actual download button, and the return-to-beginning link with a visible keyboard focus outline. The download control does not cover the final record. Successful file download remains unverified by this review.

No additional broad critique or optional polish cycle was opened during confirmation. No application source or preview process was changed by this reviewer.

Questions skipped: this is a bounded internal finish handoff; the parent task owns user communication, browser validation, and the final disposition of findings.
