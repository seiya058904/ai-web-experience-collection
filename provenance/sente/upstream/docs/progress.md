# SENTE — execution ledger

Updated: **9 November 2026**. Browser evidence timestamps use UTC. Status records actual implementation and evidence, not a blanket acceptance decision. Details: [QA report](QA-REPORT.md).

## G0 — Environment and scope

**Completed.** The supplied brief was read; the project is isolated from unrelated files. The environment used Node 24.22.1, with locked Vite 8.3.6, TypeScript 7.0.2 and Lenis 1.3.27. Primary rule/technical sources were checked. The [chapter/transition ledger](CHAPTERS-AND-TRANSITIONS.md) and [rules/limits](RULES-AND-LIMITS.md) map current implementation to the ten chapters, nine boundaries and finite exercises.

The independent Python verifier enumerated P1's 45, P2's 41 and P3's 38 legal first moves. Only D5/D3/C5 meet their respective goals; all 38 P3 responses are legal. These are executed results, not assumed answers.

## G1 — Art and assets

**Required studies produced; adopted direction documented.** Nine actual generated PNGs are retained: three Hero candidates, refined desktop, independently composed phone, two later-chapter studies, a transition midpoint and an additional wood material. The eight required roles are separate outputs. Actual prompts/files/decisions are in [generation-log.json](../art/generation-log.json) and [ART-DIRECTION.md](../art/ART-DIRECTION.md).

Runtime uses two optimized generated WebPs and two local WOFF2 fonts. Exact boards, stones, coordinates and semantic text come from rule data/DOM/SVG. Bodoni Moda uses optical size 18 and heading weight 450, paired with Manrope. License texts and provenance are included.

**Remaining difference:** the direction is translated into editorial two-dimensional scenes. Art-study completion does not close the missing moving light/camera reveal.

## G2 — Hero and difficult handoff trial

**Implemented and integrated, with a creative scope gap.** Hero → chapter two retains the user's independent placement and introduces real liberties. P3 → K1 displays two labelled P3 examples and the separate K1 diagram. Independent positions are not falsely merged and scroll never submits moves.

The implementation uses opaque SVG diagrams and modest translations/rotations. It does not implement the brief's complete spatial/camera handoff. The final 45-frame cohort now verifies current local-progress states and reverse midpoint consistency; it does not prove continuous-motion quality or unimplemented choreography.

## G3 — Whole story and controls

**Implemented; main paths exercised.** All ten chapters and nine boundaries are present. Seven boards accept keyboard/pointer input; puzzles also have coordinate controls. The story includes legal non-solutions, occupied rejection, capture, both eye rejections, connection, independent A/B replay, disclosed P3 replies, simple ko, undo/reset and real local history. Notes retain chronological attempts and mark untouched examples.

Desktop 1440 × 900 and phone 390 × 844 runs exercised the main rules, P3 manual/automatic replies, branch replay, focus/navigation and refresh persistence. Fresh extracted-candidate tests passed **61/61**, alongside the independent 124-first-move verification. Ten SVG module tests verify the generator; browser file-on-disk export remains unverified despite Blob generation and preview-tab creation.

## G4 — Focused refinement

**Specific defects repaired; full creative acceptance not claimed.** Work addressed grid/button alignment, keyboard wrapping, navigation/hidden-control focus, mobile A/B move-list retention, White's ko label, singular liberty text and capture-lift decoration. Late boundaries now retain 23 distinct diagrams. The wide Hero was capped at 2200px with paper-colored outer gutters after visible wood seams were identified.

Phone P1/P2 feedback and Undo were distant from their boards. Board-local feedback/Undo were added and rechecked: P1 restored its initial board and P2 displayed D3 success with local Undo enabled. Final mobile, desktop/note, wide and transition captures are retained. [FINISH-REVIEW.md](FINISH-REVIEW.md) states the independent review's own scope.

**Remaining:** six-state Hero choreography, full spatial boundary choreography, edge/bowl capture travel, simultaneous three-board reduced-motion chapter-two layout and the final wider empty-board return differ from the brief. These are residual requirements, not completed items.

## G5 — Browser acceptance

**Substantial executed coverage; matrix incomplete.** Eleven unscaled Chromium CSS viewports from 320 × 700 through 3840 × 2160, including 844 × 390 and 999/1000 breakpoint sides, showed zero horizontal overflow. Every interactive board had 49 points and one tab stop. Maximum alignment difference was 0.022 px across the sweep and 0.020 px in the later 320/390/3840 repeat.

The authoritative final `/subpath/` transition run has **45 forward samples and nine matching reverse midpoint checks**, with identical before/after note text and 196 intersection labels. Its fixed attempt counts are 8/5/5. Final screenshots replace earlier mixed captures. Endpoint screenshots may show adjacent composition because the transition is just outside the viewport under the current progress definition.

A four-resource 404 test genuinely omitted both images and both fonts; P1 D5, P2 D3 and P3 C5 still completed via coordinate controls. A fresh normal subpath browser report records all six runtime resource entries returning 200. One local unthrottled production sample recorded FCP 180 ms, interactive mark 109.1 ms and Hero-settled mark 158.4 ms; these are not cold-cache or FPS guarantees.

**Unverified:** native zoom 125/150/200%; physical touch/Android/4K; real Windows; actual screen reader; audible audio; OS motion-preference switch; throttled network/CPU; full slow/out-of-order resource matrix; FPS/memory/lifecycle; every rapid-scroll/history gesture; successful SVG file landing. No full-matrix pass is claimed.

## G6 — Reproducible delivery

**Validated code, browser-checked rebuild and complete delivery materials.** A clean 58-file candidate ZIP was independently extracted on Linux x86_64 with Node 24.22.1/npm 11.9.0. `npm ci`, `npm test` (61 passes) and `npm run build` all exited 0. Fifty source files were unchanged. Its eight built files total 346,913 bytes and were byte-identical before/after rebuilding; 54 HTTP assertions passed across dependency-free prebuilt/rebuilt root and subpath serving. Exact logs and hashes: [release-verification.json](evidence/release-verification.json).

Those eight rebuilt files were copied unchanged into the production preview for an actual browser check. All three coordinate-selected goal paths completed; the 390 × 844 report had ten chapters, nine transitions, zero overflow, 0.019 px alignment, all six requested resources returning 200 and no post-load observed errors. See [release-browser-report.json](evidence/release-browser-report.json). This was a focused three-goal repeat, not the full matrix again.

The code candidate intentionally excluded unfinished/mixed browser evidence. The complete delivery adds finished documentation and the final coherent captures to the same validated application/runtime. Obsolete assets and contaminated/mixed screenshots are excluded. The final archive receives its own checksum and a separate `SENTE-package-verification.json` recording the exact post-packaging extraction/install/build result. These companion files distinguish the final delivery from the candidate.

## Final verification scope

The package manifest covers every included file. The companion checksum covers the final ZIP itself. Post-packaging checks are recorded separately so the archive does not need to contain its own hash. The concrete creative gaps and unverified environmental conditions listed above remain open; packaging does not convert them into passed requirements.

No deployment, publication, push, PR/Release or collection integration was performed. The export evidence gap and concrete creative differences remain disclosed when packaging finishes.
