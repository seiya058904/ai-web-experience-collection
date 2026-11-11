# PAPERSUN — Local browser QA environment

## Why the browser path changed

The build session first used a connected browser and a managed local-preview route. The route repeatedly stopped serving the PAPERSUN preview, returned a missing-page response, or exposed a different project through the shared route. Those conditions made later UI observations unreliable. The interrupted run was retained as `docs/evidence/mobile-interrupted-run.json`; it is not accepted final-art evidence.

The original brief permits Playwright-based local testing and dependency changes for this new build. The implementation owner therefore established an isolated local Chromium process, using Playwright against this project's localhost server. It does not reuse a signed-in browser profile or visit external accounts. This removes the shared-preview routing dependency from the later QA run; it does not itself establish application acceptance.

## Recorded environment

| Item | Build-session record |
| --- | --- |
| Operating environment | Linux managed execution environment |
| Node / npm | Node 24.22.1; npm 11.9.0 |
| Playwright library | 1.62.1, available in the execution runtime and now pinned in this project's development dependencies |
| Local Chromium version | **153.0.8010.0**, reported by the implementation owner after the successful isolated launch |
| Test-binary package | `@sparticuz/chromium` 153.0.0 in an isolated QA environment, outside the application dependency graph |
| Browser executable override | The build-session runner uses `PAPERSUN_BROWSER_PATH`; the machine-specific value is not part of this source handoff |
| Application access | This project's own localhost HTTP server only |
| Browser binary in ZIP | None |
| Initial local artifact | `docs/evidence/local-browser-smoke.png` |

The earlier managed-browser narrow run recorded a `Chrome/156.0.0.0` user agent. That is a different run and browser context from the isolated Chromium 153 process. Keep engine/version and method attached to each result rather than treating all captures as one homogeneous test session. Host CPU, physical screen, GPU, refresh rate and physical device are not established by the reported browser version.

The successful isolated launch is an environment smoke result. Chapter, transition, interaction, recovery and performance assertions require the corresponding result data and screenshots. `requirements-evidence.md` records their final status. Do not promote the whole website to PASS because a browser launched or because a screenshot file exists.

### Font-runtime correction and run identity

The first isolated Chromium run had an environment-specific Fontconfig problem: the serverless binary's configuration referred to its expected deployment paths, so text/font rendering was not trustworthy. Some audits reported `document.fonts.status` as `loaded` while the used Cormorant faces had `error` status. The set-level value means loading has finished, not that every requested font succeeded. Those initial no-font captures are **invalid for typography and aesthetic acceptance**; they must not be described as application visual regressions or accepted fallback-font tests.

The private runtime configuration was corrected before the next run. The initial process briefly continued writing `local-*` files after a termination request, and the implementation owner subsequently stopped its actual tool session. Consequently, a filename beginning with `local-` alone does not identify a valid final run. Use a distinctly labelled corrected run, its aggregate report, matching per-case timestamps, and actual visible text inspection. The QA runner now checks visible text ranges and used-font error states. Deliberately blocked-font tests remain a separate scenario.

`docs/evidence-index.md` identifies the evidence families and their validity boundaries. Preserve the failed environment record and corrections, but award results only to the completed corrected run. A successful normal-font run does not imply native browser zoom, hidden-tab restoration or physical-device coverage.

## Reproduce the optional suite

Start in the extracted project folder with Node 24 or newer. The regular source workflow uses the lockfile; Playwright browser installation is an additional, optional step:

```bash
npm ci
npx playwright install chromium
npm run check
npm run qa:browser
```

On Windows PowerShell, `npm.cmd` and `npx.cmd` avoid policies that affect the PowerShell wrapper scripts. The browser suite runs `scripts/qa-browser.mjs` and owns a child localhost server on port 4189, including teardown. It does not require a separately running preview. Build-session risk and recovery suites may use their own separate loopback ports, and should record those run conditions in their reports.

The layout suite defaults to both a 1440 × 900 desktop context and a 390 × 844 mobile context with touch enabled. Use `--profile=desktop` or `--profile=mobile` to select one, `--port=4192` to choose another local port, or `--label=rerun` to distinguish output filenames. Pass options after npm's separator, for example `npm run qa:browser -- --profile=mobile --label=rerun`. Actual per-case JSON, JPG captures and a timestamped aggregate layout report are written beneath `docs/evidence` by default. Those outputs carry their own assertions; the runner's automated PASS does not award aesthetic acceptance or accessibility conformance.

The continuity suite can be run with `npm run qa:browser -- --suite=continuity --boundaries=1,8,9 --hero-cycles=3 --label=rerun`. Each boundary records slow/fast forward/reverse movement in the selected profiles. It additionally requires an ImageMagick `convert` executable on PATH to encode the retained JPEG frames as animated WebP; this is a QA artifact tool, not a production application dependency. The default layout suite does not use that encoder. On Windows, the unrelated system utility also named `convert.exe` does not provide image conversion; ensure the ImageMagick executable is the command resolved by this optional continuity runner.

For the final state-specific flow, use `npm run qa:browser -- --suite=continuity --boundaries=5,6,7,8,9 --hero-cycles=0 --collected --repair-return --quarters --label=rerun-collected`. `--collected` performs the real market, wheel and shade actions, initially retaining found ABC with no placed pieces. Before the first assembled TR-09 recording, the runner separately captures labelled unassembled slow forward/reverse cases and checks that placement memory remains empty, then uses the actual Place A/B/C controls. `--repair-return` adds a separately labelled repaired-return TR-08 group. `--quarters` retains five quarter states and four ±2 px threshold neighbors per state group. These actions do not seed storage or grant pieces through a test-only app API. Current state-still names include `-empty`, `-collected`, `-unassembled` or `-repaired`; the historical carrier-run filename collision and replacement baseline are explicitly described in the evidence index.

Hero cycles also retain explicit pause screenshots after three settled animation frames and compare the observed quarter-position signatures. Those pause stills remain separate from the compositor sequence, so an unchanged-frame capture gap is not hidden by choosing a guessed nearest frame.

The normal reproduction path uses the Chromium revision installed by the pinned Playwright CLI. It does not require the build session's custom browser package or executable path. The application itself and `npm run check` do not launch a browser, and the prepared `dist/` preview can run with Node alone.

Official references consulted on 9 November 2026:

- [Playwright browser installation](https://playwright.dev/docs/browsers): browser binaries are installed separately through the CLI; a named browser can be selected. Each Playwright release expects its supported browser versions.
- [Playwright Library](https://playwright.dev/docs/library): the library can launch and interact with browsers from a Node script, independently of the Playwright Test runner.

## Evidence interpretation

Exact CSS viewport sizing in a real browser establishes rendered layout at that size. It does not by itself establish a physical phone, Safari, browser UI zoom, native touch behavior, high-refresh-rate performance or a real 4K monitor. Touch emulation, reduced-motion emulation, blocked resources, delayed responses and background transitions should each be labeled with the actual method and result.

`?test-assets=slow` uses asynchronous local-server response delay, not bandwidth throttling. Normal and failing-resource tests should retain the target URL/state and any error list. Any frame recording assembled from seeks must be labeled as a sequence of sampled states; it is not a measured continuous scroll recording. No FPS or timing metric should be inferred from an animation's nominal duration or capture count.

## Final recorded runtime and evidence pointer

After the font configuration was corrected, graphics-runtime differences were isolated with actual captures. The final local suites removed the SwiftShader/ANGLE launch overrides and used `--disable-gpu` for CPU rasterization. This is the renderer identified in their run metadata. The per-blade SVG lighting/displacement effect also exposed a real black-blade defect; it was removed from the app while canonical geometry, gradients, fibers and shadow were retained, then actual desktop and phone images were checked. Environment correction and application correction are different records; neither is hidden behind a generic fallback claim.

Completed full-path, viewport, interaction, reduced-motion, failure, out-of-order, network and continuous-motion results are indexed in [the evidence index](evidence-index.md) and adjudicated in [the requirements ledger](../requirements-evidence.md). The final combined source build is identified there by its hashed assets and, after packaging, its manifest. The early work-session statuses above are historical environment context, not the current acceptance decision.

The actual unfiltered final functional report, `evidence/local-ownership-final-recovery-results.json`, contains 21 cases: 18 PASS, zero FAIL, three NOT TESTED and no uncaught page errors. That full command ran on DkJKhC7c/C8PaC5EY. The later Crm79syp/C8PaC5EY build changes only TR-06's physical support handoff; its affected retake records sixteen empty/collected clips, 423 actual frames and separate normal/failed-art proofs. The two independent reviewers inspected every retained frame across desktop and phone and closed the support correction. The actual final ten-test/English/type/production-build log records Crm79syp; the pre-support log is retained separately. No full 21-case rerun on the later build is implied.

The headless runtime could not establish native browser Find (its plain-HTML positive control also returned false), actual browser UI zoom (commands did not change geometry), or actual hidden-tab restoration (`document.hidden` never became true). These remain mandatory blocked checks. CDP lifecycle freeze/resume, CSS-content-zoom diagnostics and viewport resizing do not substitute for them. The six failing CSS-content-zoom assembly/ending diagnostics remain visible in the retained report.

## Actual extracted-source browser smoke

H9's candidate-archive check is now recorded in `evidence/handoff-candidate/execution.json` and explained in [the handoff verification record](handoff-verification.md). The archive was safely extracted to a separate directory; exact membership, CRC and all 5,345 manifested files passed. With `node_modules` initially absent, `node scripts/verify-handoff.mjs --http-only` started the prepared local preview and passed all 20 HTTP resources and 41 contained references without looking up Playwright. Fresh `npm ci` and `npm run check` then passed, including ten tests, the English guard, TypeScript and Vite. The rebuilt package manifest remained unchanged.

The subsequent real Chromium 153.0.8010.0 smoke used a fresh headless CPU-rendered 1440×900/DPR1 desktop profile on Linux, Node 24.22.1 and npm 11.9.0. It passed the opening, `#tr-08-09@50`, and ending states with zero errors and zero launch retries. The actual three screenshots and the report `evidence/handoff-candidate/rebuilt/handoff-browser-2026-11-09T10-11-00-192Z.json` are retained. Root opened all three images and assigned a scoped visual PASS. The script's own `humanVisualReview` field correctly says that the script does not perform that review; the separate human/agent judgment is not fabricated into its raw result.

This included proof identifies the candidate archive, SHA-256 `e64a4dfb74691d6c49db19b60503cddd0bc1fcf8798a36bb60b8c41a9c833541`, 490,064,262 bytes. The final delivery ZIP adds proof and final documentation. Its exact hash and second clean-extraction result belong to the separate `papersun-verification.md` supplied at delivery; the candidate result must not be relabelled as that final audit.

Diagnostic path normalization is complete for 35 text files in two batches, including imported candidate reports. `evidence/evidence-path-normalization.json` retains before/after hashes and the placeholder categories. Pixels, test outcomes, errors, timestamps and measurements are unchanged. This package smoke is separate from the full interaction and motion suites, and it does not close Find, native zoom or true hidden-tab verification. No browser environment result by itself declares the entire website accepted.
