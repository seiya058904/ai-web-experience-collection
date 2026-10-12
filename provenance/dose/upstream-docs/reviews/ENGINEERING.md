> Archive note: this is an independent review record from development. Screenshot and task-local QA paths mentioned below identify evidence that was inspected, not files bundled in this source ZIP. The final consolidated results and correction status are in `../QA.md` and `../QA-RESULTS.json`.

# DOSE — independent engineering review

Scope: read-only review of the authored application, timeline, local server/build/check scripts, HTML/CSS accessibility semantics, and actual browser lifecycle behavior. No project files were edited by this reviewer. Science and final material art direction were outside this review. The application was being refined in parallel; these are observations of the loaded review snapshots, not a claim that the final ZIP has been audited.

## Actionable findings

1. **Theme-transition text contrast required correction.** The original `colorsForState` switched foreground palettes from a weighted, non-linear RGB brightness threshold. A user can stop on the middle gray of the Evidence handoff. Calculating sRGB relative-luminance contrast over 1,001 positions on both Evidence boundaries found minimum ratios of 3.24:1 for the main ink, 1.73:1 for muted text, and 1.45:1 for the accent. One reproduction was scene 5, transition 0.472, page `rgb(123,136,132)`, muted `#59615d`. Header/footer text remains visible through the handoff, so fading the chapter copy does not remove this issue. Recommended correction: select the contrasting light/dark ink using linear relative luminance, and converge muted/accent colors toward that ink while crossing the middle gray. Reported to the root agent for correction.

2. **The documented `?quality=high` override needed precedence over saved `low`.** The initial quality expression allowed a previous session preference to win over an explicit high query parameter. The root agent accepted this correction. This did not prevent either quality mode from working through the About control.

No other release-blocking application defect was established in this review. In particular, the first dialog test failure described below was a test-assumption problem, not evidence of a background focus escape.

## Actual checks and evidence

| Area | What was actually exercised | Observation |
| --- | --- | --- |
| Authored source checks | `node scripts/check.mjs` | Syntax, unique HTML IDs, local entry asset presence, exactly one authored RAF scheduler passed. |
| Pure timeline tests | `node --test tests/timeline.test.mjs` | All 7 test groups passed. |
| Context loss and restore, mobile | Real `WEBGL_lose_context` extension, 390×844, Evidence local 0.48025666337611056 | Canvas2D became active; restoring the context returned to WebGL without changing chapter, phase, or depth. Counters were one loss and one restore. No page errors. |
| Context loss and restore, desktop | A separate browser run, 1440×900, Evidence local 0.4, depth 1, no dialog open | Canvas2D → WebGL recovery preserved local 0.4 and depth 1 exactly. No page errors. |
| WebGL unavailable on initialization | Browser init script returned null only for WebGL context requests; native 2D remained enabled | Illustrated fallback became visible. One expected Three.js initialization console error was retained; zero page errors and no repeated error storm over the observation interval. Quiet mode produced 3 initial draws. |
| Native dialog keyboard boundaries | Open Index, Shift+Tab, then nine Tab presses | Chromium temporarily reported BODY at the browser-UI boundary; the next Tab returned to Close, followed by the seven Index links. No background page control was focused. Escape restored focus to `open-index`. |
| Reverse state restoration | Actual browser scroll to Press local ~0.61, Material, then the same Press position | Both visits returned local 0.609845031905196. This verifies state restoration, not pixel identity. |
| Final scroll hold | Scroll to actual document bottom in the browser | Release reached local 0.9993031358885017, within the final-pixel rounding interval and beyond the closing hold threshold. |
| Forced illustrated edition | `?renderer=2d&motion=quiet`, 360×780 | All seven scene states were visited successfully; Evidence End key set depth to 1. |
| JavaScript disabled | 390×844 browser context with JavaScript disabled | All seven chapter content blocks were visible, opacity 1, and nonzero height. |
| Runtime network inventory | Captured browser requests during the first integrated review | 17 requests, all to the local origin; zero external requests. |
| Server methods | Real HTTP HEAD and POST | HEAD `/` returned 200; POST `/` returned 405. |
| Server traversal | Encoded `../` and two-level traversal, malformed percent/UTF-8 path | Traversal requests returned 403; malformed path returned 404. No outside content was served. |
| Real non-cached page departure | Pagehide snapshot saved into the isolated test context's sessionStorage, then read after a same-origin navigation | `persisted:false`; scheduled application RAF count changed 1 → 0; renderer geometry count 3 → 0; renderer texture count 7 → 1. See qualification below. |

### Lifecycle qualification

The real pagehide path cancels the application frame and calls disposal. The renderer's geometry count reached zero. One renderer-reported texture remained in that snapshot. This alone is not proof of a retained-memory leak: the document/context was departing, Three.js uses internal rendering resources, and the scene's environment-resource ownership was being revised concurrently. Do not convert this measurement into a claim that every GPU allocation was proven to reach zero. No repeated navigation heap or GPU-memory soak test was performed.

## Performance observation and its limits

The test browser was Chromium 153.0.8010.0 using ANGLE/SwiftShader software rendering. Other browser/render work was running concurrently in the shared environment. This is not a representative hardware-GPU or physical-phone benchmark.

At a stable Distribution composition at 1440×900, diagnostics showed:

| Setting | Instanced blend particles | Triangles | Draw calls | Frames submitted during a ~3-second observation |
| --- | ---: | ---: | ---: | ---: |
| High | 1,020 | 123,602 | 5 | 11 |
| Low | 340 | 41,522 | 5 | 8 |

The low mode demonstrably reduces geometric workload. The two short frame-throughput observations cannot establish a speed ratio because the shared software renderer was contended. The app's rolling synchronous render-cost means were 7.18 ms and 5.74 ms at those snapshots; the rolling histories include other frames, and those figures are CPU submission costs, not completed GPU frame time. They must not be advertised as FPS or a passing frame-budget benchmark.

The automatic reduction logic originally observed synchronous rendering cost, so a GPU-bound device with inexpensive command submission is not fully characterized by that metric. Physical-device and hardware-GPU performance remains unverified.

## Test-harness issue, explicitly excluded from product findings

The first broad script asserted that every Shift+Tab position in a native modal must leave `document.activeElement` inside the dialog. Chromium reports BODY while keyboard focus passes through browser UI. That assertion threw before cleanup, leaving the Index modal open. Several subsequent tests then failed because the modal correctly blocked background interaction. These cascading rows in `independent-code-review-results.json` are **not valid product failures**, and they are not counted as passed tests either. The second isolated sequence resolved the focus assumption. The root agent's separate functional script owns the final Index/About/slider/resize/quiet/history verdicts.

## Files containing raw evidence

- `qa/independent-code-review-results.json`: first broader run, including the explicitly invalid cascading UI failures.
- `qa/independent-webgl-review-results.json`: isolated focus sequence, both rendering qualities, desktop context recovery, WebGL initialization failure.
- `qa/independent-disposal-review-results.json`: real pagehide resource/callback snapshot.
- Matching `.mjs` scripts in `qa/` contain the exact executable checks. They are task-local evidence and use the task-local browser helper, so they are not portable end-user scripts.

## Delivery review boundary

The code directly serves local vendored Three.js/Lenis and local WOFF2 fonts. The Node server resolves paths from its own file location, rather than the caller's current working directory; `OPEN-DOSE.cmd` changes into its own directory and launches the local server. The server binds to loopback. Build output is limited to the generated `dist` directory. Source dependency licenses and font licenses were present at review time.

README, final license/asset manifest, final browser matrix, and final ZIP extraction verification were still the root agent's pending delivery work. Their completion should be verified on the completed archive, not inferred from this source review. Windows execution, Safari, Firefox, physical touch devices, real GPU performance, and a long memory soak were not tested by this reviewer.

## Delivery completion annotation by the project integrator

After this independent review, the contrast and explicit-quality issues were corrected. The final pure-state suite has 8 passing groups, including 21,021 color-contrast comparisons. The complete six-viewport matrix, final functional suite, isolated software-renderer performance observations and archive validation are recorded in the consolidated QA files. The original review above is retained as a dated observation, not rewritten as an audit of later changes.
