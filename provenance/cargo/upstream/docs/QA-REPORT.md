# CARGO — Verification report

Reviewed **9 November 2026**. This is a local source handoff. **The website is not accepted under H1–H9: browser-dependent acceptance is BLOCKED.** Implementation and source-level checks have been completed; they do not establish rendered quality, interaction correctness or accessibility conformance.

## Observed results

| Check | Observed result | Status and evidence |
| --- | --- | --- |
| TypeScript and production build | Strict type checking and Vite production bundling complete. The lazy Three.js chunk exceeds Vite's 500 kB advisory threshold. | **PASS**, [build log](evidence/build.log) |
| Deterministic story and geometry suite | **28 tests passed; 0 failed.** Includes eleven chapters, twenty-two content beats, ten boundary contracts, finite forward/reverse/random state, support changes, contact-before-lift, door order, reduced-state equivalence and exact cargo identity. | **PASS at source-test scope**, [test log](evidence/unit-tests.log) |
| English guard | No unintended CJK or unfinished interface-copy patterns were found in the authored files scanned. This is not browser proofreading. | **PASS at guard scope**, [guard log](evidence/english-check.log) |
| Production assets | Twelve retained generated images, nineteen production WebP files, source/build media hash equality, entry references and bundled font paths checked. Production photographs total **1,804,544 bytes**. | **PASS at local-file scope**, [asset manifest](evidence/asset-manifest.json) |
| Design detector | One source detector run returned an empty finding list. It does not inspect rendering or establish visual quality. | **PASS at detector scope**, [raw result](evidence/design-detector.json) |
| Fallback geometry | Six specific SVG states were directly rasterized and inspected; twenty-one mode/door variants were checked during model development. The contact sheet is labeled NON-BROWSER. | **Observed non-browser diagnostic**, [states and method](../evidence/non-browser/fallback-states.json) |
| CARGO browser rendering | No valid CARGO browser screenshot or completed page interaction was acquired. | **BLOCKED**, [channel observations](evidence/browser-channel-observations.json), [local launch result](evidence/browser-launch.json) |
| Browser runner invocation | The actual smoke invocation exited with code 2: four selected cases BLOCKED, zero PASS, no browser version or page context. The remaining planned cases were not executed. | **BLOCKED**, [machine-readable report](evidence/browser-attempt/report.json) |
| Production HTTP preview | The managed preview reported a URL, but a later successful browser load showed a different project. This was rejected as CARGO evidence. | **BLOCKED** |
| Independent aesthetic acceptance | Actual desktop and mobile website captures are missing. A generated plate and a direct SVG raster cannot replace them. | **BLOCKED**, [independent review](INDEPENDENT-REVIEW.md) |
| Separate source extraction and rebuild | Locked install, strict build, twenty-eight tests and local asset validation passed in a separately extracted project. Browser preview remains blocked. | **PASS for install/build/file integrity**, [reproduction record](REPRODUCIBILITY.md) |

## What the source tests establish

The tests exercise the actual state evaluator and geometry data. Each boundary has five staged descriptions and a history-independent progress function. Dense forward, reverse and direct calls verify finite values and support invariants. The tests also generate SVG for the chapter modes and all fifty boundary checkpoints.

The cargo test compares the **six exact identities, world centers and dimensions**, not their camera-dependent screen positions. It verifies three visible faces and two straps per block, eighteen faces and twelve straps in total, empty states with no cargo, and a packed-minus-empty geometry difference consisting of those blocks. Departure and destination use different explanatory cameras but preserve the same world arrangement.

The viewport dimensions in the pure-state tests are **simulated numeric inputs**. They are not evidence that a browser rendered those viewports, wrapped text correctly or maintained visual continuity. Passing numerical contact tests does not certify a photographic crane, a fitting aperture or a handling procedure.

## Browser blockers and attempted alternatives

The managed preview daemon was started against the CARGO checkout, and then against a separate copy of its production output. It reported `http://terminal.local:4173/`. Initial cloud-browser access exposed the CARGO title but timed out on frame-tree and layout-metric calls. The connected browser extension failed navigation with `net::ERR_HTTP_RESPONSE_CODE_FAILURE`.

A blank tab and a favicon document were accessible in the cloud browser. After preparing the static production preview, the same reported URL rendered **PULSE**, a different project, although the local copied `dist/index.html` contained the CARGO title and CARGO asset references. That page was not used for testing, screenshots or acceptance of this work. No other project's files were changed.

The standard Playwright Chromium installation returned an invalid/truncated archive. An additional npm-distributed Chromium diagnostic was attempted in a separate temporary tool directory. That process exited before a browser connection could be established, both with its recommended launch arguments and with standard Playwright arguments. No page was created. The diagnostic binary, profiles, dependency directory and temporary script are excluded from the source ZIP.

No server replacement, network-permission change, public deployment or browser-security bypass was used to claim a successful result. The test runner supports ordinary local production HTTP previews. It also offers explicitly labeled file-backed request fulfillment for diagnosis; such a run would not prove HTTP hosting or realistic network performance. Neither transport acquired usable browser evidence in this session.

## Required browser coverage still blocked

| Required coverage | Current state |
| --- | --- |
| Hero first image, reveal, complete composition, living hold, first scroll and return | **BLOCKED**; actual UI captures are missing. |
| Full eleven-chapter desktop and 390 × 844 main paths | **BLOCKED**. |
| Ten transitions at 0/25/50/75/100%, threshold neighbors, slow/fast forward and reverse | Numerical/SVG state checks pass; **browser continuity is BLOCKED**. |
| CH-01 → CH-02 repeated cycles; CH-07 → CH-08 engagement; CH-08 → CH-09 deck placement | Source mechanics exist; the required early and final browser gates remain **BLOCKED**. |
| 320 × 700, 360 × 640, 390 × 844, 768 × 1024, 1440 × 900, 1920 × 1080, 2560 × 1440, 3840 × 2160 | **All browser viewport checks BLOCKED**. No physical-device coverage is claimed. |
| Breakpoint neighbors, short landscape, 125/150/200% browser zoom | **BLOCKED**. CSS zoom is not substituted for actual browser zoom. |
| Select/change/reset controls, touch, keyboard, Escape, focus return and target focus | Implemented; actual event-path verification **BLOCKED**. |
| Image failure and mobile Retry; slow image/font; unavailable/lost WebGL; delayed asset races | Recovery paths implemented; actual browser probes **BLOCKED**. |
| Mid-page reload, hash/history, rapid skips, resize and background restoration | Implemented; actual browser probes **BLOCKED**. |
| Two weakest non-hero chapters and weakest transition corrected against real before/after captures | **BLOCKED**. No self-awarded aesthetic score or fabricated before/after image is supplied. |
| Cold start, first meaningful art, interaction timing, long tasks, frame pacing, memory and Core Web Vitals | **NOT TESTED**. No FPS, latency or performance rating is inferred. |

## Corrections made from real source or geometry findings

1. **Checkpoint arithmetic:** exact quarter positions could straddle floating-point boundaries. The evaluator now normalizes negligible arithmetic drift; the regression test passes.
2. **Outgoing viewer continuity:** reparenting the shared viewer could reveal an older stage-zero SVG. The outgoing slot now retains its last actual model state before the viewer moves.
3. **Responsive image Retry:** changing only an image URL left the selected mobile picture source unchanged. Retry now refreshes the picture sources and image `src`/`srcset`.
4. **Fallback geometry:** direct SVG inspection found a far post drawn through the near wall, a clipped lift beam and an obscured destination doorway. Painter order, framing and doorway projection were corrected. These corrections are supported by non-browser SVG evidence only.
5. **Cargo assertion:** after the intentional destination camera correction, a test incorrectly required identical projected polygon strings. The original failure log is retained. The repaired test now checks exact rendered cargo world metadata and geometry membership, while preserving the original world-bounds test.
6. **Narrow layout safeguards:** source review found potential clipping in fixed-height mobile handoff panels. Their content can now size naturally; the note is in normal flow, stage controls have 44 px targets, and a persistent mobile chapter-menu button replaces tiny navigation targets. Browser confirmation remains blocked.

The [original camera-dependent test failure](evidence/unit-tests-before-camera-contract-fix.log) is intentionally retained. It is a historical failure, not the current result. Browser-specific corrections have not been labeled browser-verified.

## Reproduce the remaining checks

Use the Windows or cross-platform commands in [README.md](../README.md) to install, build and start a loopback production preview. Then follow [browser-test-instructions.md](browser-test-instructions.md). The runner supports an existing Chrome or Edge installation as well as Playwright's Chromium, bounded test batches, machine-readable results and screenshot/recording paths. Missing browsers and wrong-page titles must stay **BLOCKED**.

Open every resulting screenshot before counting it as visual evidence. Observe the difficult transfers in continuous motion, compare actual hero renders against AI-04 and AI-05, and submit the real desktop/mobile capture packet for an independent review. H1–H9 can only be marked accepted after the remaining requirements are materially verified.
