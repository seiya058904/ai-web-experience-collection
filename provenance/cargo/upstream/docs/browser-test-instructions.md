# CARGO — Production browser verification

## Current status

The acceptance runner is implemented in `tests/browser.mjs`. Its presence is **not evidence that the website passed browser testing**. Initial attempts lacked a usable browser executable; a browser-download attempt produced an invalid/truncated archive, and a separately packaged Chromium exited before creating a page. The available cloud preview also returned another project's page instead of CARGO, while the local production output identified itself as CARGO. Those are blockers, not CARGO captures or test results. Consult the actual execution reports for any later successful run.

Do not mark H1/H2/H4/H6/H7/H8 as visually accepted until the correct production page has been observed. A source build and pure state tests cannot substitute for browser acceptance. A clean extracted build establishes build reproducibility only; it does not establish the runtime portion of H9.

## Runtime and local target

Use **Node 24 or a compatible Node version with default TypeScript type stripping**, the project's locked dependencies, and an already installed Chromium browser. This runner imports the pure TypeScript story data directly. It does not install a browser, start a server, deploy the site or navigate source links.

Build and run the production preview in one terminal:

```powershell
npm ci
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

Run a small first batch in another terminal:

```powershell
npm run test:browser -- --batch=smoke
```

The default target is `http://127.0.0.1:4173/`. To use another authorized local/private production preview, set its exact URL. The runner checks the complete CARGO title before using controls; a wrong application is reported as `BLOCKED`.

Windows PowerShell example using an installed Edge browser:

```powershell
$env:CARGO_BASE_URL = 'http://127.0.0.1:4173/'
$env:CARGO_BROWSER_CHANNEL = 'msedge'
npm run test:browser -- --batch=smoke
```

An explicit existing executable is another option:

```powershell
$env:CARGO_BROWSER_EXECUTABLE = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
npm run test:browser -- --batch=smoke --headed
```

Cross-platform shell example:

```bash
CARGO_BASE_URL=http://127.0.0.1:4173/ CARGO_BROWSER_CHANNEL=chrome npm run test:browser -- --batch=smoke
```

`CARGO_BROWSER_EXECUTABLE` takes precedence over `CARGO_BROWSER_CHANNEL`. If neither is set, Playwright uses its existing compatible Chromium installation. A missing dependency, browser or preview is `BLOCKED`, with an explanatory report and exit code 2. The runner never silently downloads one.

## Optional file-backed browser transport

When an actual browser can launch but the managed HTTP preview routes to the wrong project, the runner can fulfill browser requests directly from a completed `dist` directory. This exercises the **real browser engine and real application UI**, while keeping the transport limitation explicit:

```powershell
$env:CARGO_TEST_DIST = (Resolve-Path 'dist').Path
$env:CARGO_BROWSER_EXECUTABLE = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
npm run test:browser -- --batch=smoke --no-video
```

```bash
CARGO_TEST_DIST=dist CARGO_BROWSER_EXECUTABLE=/path/to/existing/chromium node tests/browser.mjs --batch=smoke --no-video
```

`CARGO_TEST_DIST` forces the synthetic test origin `http://cargo.test/`; it does not create a server or public URL. Its request handler reads only files contained within the resolved build root, rejects traversal and escaping symlinks, returns 404 for missing files, and supplies MIME types for HTML, JavaScript, CSS, images, fonts and other supported assets. Later failure/delay probes use Playwright route fallback to return to this file handler after the injected condition clears.

Every report labels this mode as **file-backed Playwright request fulfillment, not a production HTTP preview**. Such a run can establish browser interaction and rendering observations, but it does not verify the managed server's routing, HTTP caching/headers, actual wire-network performance or the production-preview portion of H7/H9. CDP network throttling does not turn intercepted file fulfillment into a measured real network. Do not relabel this mode as a successful production-server run.

Unset `CARGO_TEST_DIST` before the final normal HTTP preview verification. In PowerShell use `Remove-Item Env:CARGO_TEST_DIST`; in a POSIX shell use `unset CARGO_TEST_DIST`.

## Bounded batches

Prefer separate batches so a blocked environment or a real defect does not waste a long run. Each case has a default 45-second limit; each invocation has a 10-minute budget. A timed-out case closes its page and records the limitation. Increase a limit deliberately only when diagnosing a known slow condition.

If Playwright's video encoder is unavailable, `--no-video` lets the other cases execute. The continuous-recording case then records its input samples but remains `BLOCKED` for the missing recording/review; it is not silently marked passed.

| Batch | Actual work when executed |
| --- | --- |
| `smoke` | Exact title and nonblank story, observed initial/settled hero, real CTA, keyboard dialog/focus, wheel and page keys, basic performance observations. |
| `desktop` | Full 1440×900 path: eleven chapters with both beats, ten boundaries at 0/25/50/75/100%, reverse and direct midpoints, threshold neighbors, three hero-return cycles, continuous high-risk movement, history/refresh. |
| `mobile` | Full 390×844 path with the same story/transition coverage, persistent mobile chapter menu, touch-emulated controls and a native touch scroll gesture. |
| `viewports` | Exact required CSS sizes: 320×700, 360×640, 390×844, 768×1024, 1440×900, 1920×1080, 2560×1440 and 3840×2160. Each receives hero, longest-heading scene, difficult midpoint, carrier interaction and ending checks. |
| `breakpoints` | Widths on both sides of 360, 700, 1000, 1900 and 2800 px, short landscape, and the 600 px height boundary. |
| `interactions` | Identity lens/reset, empty/packed, doors, road support, Road/Rail/reset, three locators, keyboard lift slider, port comparison, original-cargo ending, recap links and unavailable-audio notice. |
| `reduced` | OS reduced motion, all eleven chapters and all five states of every handoff; representative packing/carrier/door outcomes; UI motion persistence and View as stills. |
| `recovery` | Desktop and responsive-mobile image failure/retry, target image failures, late/slow resources, failed fonts, no WebGL, genuine WebGL loss where supported, resize/orientation, observed background restoration and native scrollbar drag where available. |
| `zoom` | Attempts actual browser zoom at 125%, 150% and 200%. Requires observed layout-metric changes; reports `BLOCKED` if headless browser chrome ignores shortcuts. It does not substitute CSS zoom or pinch scaling. |

Examples:

```powershell
npm run test:browser -- --batch=desktop
npm run test:browser -- --batch=mobile
npm run test:browser -- --batch=viewports,breakpoints
npm run test:browser -- --batch=interactions,reduced
npm run test:browser -- --batch=recovery
npm run test:browser -- --batch=zoom --headed
```

For one full invocation, with a deliberately larger total budget:

```powershell
npm run test:browser -- --batch=all --budget-ms=1200000
```

List selected cases without launching a browser or creating evidence:

```powershell
npm run test:browser -- --batch=all --list
```

## Evidence output and honest statuses

By default every run gets a new timestamped directory under `docs/evidence/browser/`. Override it with `--out=PATH` if needed. Do not overwrite earlier failures when preserving a correction history.

The runner writes:

- `report.json`: selected and unselected cases, actual status, duration, reason, observations, browser version, console/page errors, failed requests, screenshot paths and context-video paths.
- `results.jsonl`: one completed case record per line, useful when a longer run is interrupted.
- `summary.md`: actual batch status and case table.
- `screenshots/*.jpg`: actual visible-viewport captures at quality 86, including failure captures only after CARGO identity was verified.
- `videos/*.webm`: desktop/mobile context recordings for independent continuous-motion review, where Playwright recording is available.

Exit codes are **0 = selected automated cases passed**, **1 = an assertion failed**, **2 = blocked or incomplete**. Unselected cases stay `NOT TESTED`. `visualAcceptance` remains `NOT TESTED` until a separate person/agent actually inspects the evidence; screenshots alone never award an artistic pass.

Any browser page with a different title is left untouched by application-control tests. No screenshot of that other application is presented as CARGO evidence. A run that never launches a browser contains no synthetic screenshots or fabricated passes.

## What the assertions establish

The runner checks DOM state and actual user actions, not just source strings. It verifies chapter focus/hash targets, selected controls, displayed SVG state, current container identity, stage captions, support changes, resource fallback visibility and responsive-image retry requests. Layout checks look for horizontal overflow, meaningful text clipped by a hidden/clip ancestor and overlap between the handoff note and identity annotation.

The transition buttons are required to select the intended quarter stage. Browser scroll positions can round to physical/CSS pixels: progress allows a small positional tolerance, while stage ownership and its caption must still be correct. A failed stage assertion is a defect to inspect, not a reason to delete the check.

Local LCP, CLS, long-task entries, observed image readiness, frame intervals and heap values are recorded where available. These observations include their environment and limitations. They do not establish field INP, guaranteed frame rate, physical 4K hardware or a memory leak merely from a heap difference.

## Independent visual review still required

Read `ACCEPTANCE-PLAN.md` and compare real captures with the selected artwork. Watch the desktop/mobile videos, especially hero → interior, yard → lift and lift → deck. Check physical support, corner/spreader contact, door pivots, title contrast, box identity, midpoint composition and abrupt flashes. Revisit failed cases after fixing their causes.

Confirm six hero states and the three repeated return cycles. Review all eleven chapters for two genuinely effective beats. Identify and visibly correct the two weakest non-hero chapters and weakest transition, retaining before/after evidence. Verify the upper-right scratch and fictional mark through random chapter jumps, and compare the actual departure/destination cargo.

If automated browser zoom is blocked, use the real browser's zoom menu at 125%, 150% and 200% and capture hero, longest copy, hardest midpoint, complex controls and ending. If headless focus did not produce a `visibilitychange` to hidden, background restoration remains untested until a real hide/resume is observed. If the environment has no native scrollbar or WebGL context-loss extension, retain those precise limits rather than reporting them as passes.

Finally run the same production-browser checks against a **cleanly extracted source ZIP** after its own locked install/build. A prior working-directory run does not verify the extracted runtime. Update `requirements-evidence.md` with exact evidence paths and actual outcomes; keep build, source-level checks and visual/runtime acceptance separate.
