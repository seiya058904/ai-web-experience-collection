# Recovery and performance test method

Reviewed: 2026-11-09. Harness: `tests/recovery-qa.html`.

## Purpose and status

This is a private QA surface, separate from the product. It exercises the actual rendered application in one retained, same-origin iframe. Its source has been syntax-checked; **the source file itself is not evidence that browser checks passed**. The operator must run the visible controls and retain the resulting JSON. Each operation records PASS, FAIL, BLOCKED, or OBSERVED at its actual scope.

The companion broad viewport matrix is `tests/cloud-qa.html`. This recovery console adds failure and restoration cases rather than repeating that entire matrix. Include both harnesses in source if useful for reproduction; exclude them from the public production artifact.

## Why the iframe is retained

The managed preview route is shared infrastructure. During earlier QA, another project could replace the route serving the preview. An HMR connection could then also replace the loaded QA document. Production preview removes that HMR behavior, and this console keeps its loaded iframe for ordinary tests.

**Load site once** verifies the current root document title before navigating. It also verifies the loaded title and all eleven chapters. It warms the local media used by the story and the additional unfolding image so later selection checks can reuse the loaded assets. **Reload site** is a separate, deliberate network operation. A previously loaded document is not re-fetched by each recovery test.

Network-dependent checks verify that the current route still serves the expected title. If the route has changed, their result is infrastructure **BLOCKED**, not an application failure or a passing test. Same-document UI, layout, and history checks can continue against the already loaded frame. This guard does not claim to make the shared route exclusive; narrow reassertion windows are still needed for fresh navigation and requests.

## Operator sequence

1. Ensure the authorized production preview is serving the final CHRYSALIS build. Use the existing official preview process; this harness neither starts nor changes a server.
2. Open the private route serving `tests/recovery-qa.html` and click **Load site once**. The default site path is `/`; only same-origin paths are accepted.
3. Click **Run recovery checks**, or run an individual labeled control. It reuses the retained frame. Results are printed in the visible JSON panel, and **Download JSON** exports those exact observations.
4. For an independent native reload check, select a mid-page chapter with the product UI, then click **Reload site** while the production route is still available.
5. Use **Focus viewport** for direct visual inspection. Performance sampling temporarily hides the console controls to reduce their rendering overhead, then restores them.
6. Save the observed report as evidence. Preserve any failed or blocked records; do not replace them with the harness's intended coverage.

## Functional cases

| Control | Actual operation | Required observable result | Scope limit |
| --- | --- | --- | --- |
| Failed image + Retry | Give the jade scene's existing image element a deliberately unavailable same-origin URL; wait for the browser's real error event; click the product's actual Retry control | The embedded authored still remains behind the hidden broken image, the English recovery notice appears, the chapter identity remains intact, and Retry restores the original asset and removes the notice | This exercises a real load/decode failure. The route may return a 404 or a non-image fallback response; the report records an available response status without assuming one. It is not a full network outage or throttling test. |
| Late callback stress | Select Leaving the shell → Wings unfolding → Ready for flight with the actual UI; capture older image callback closures; deliver those old success/error callbacks after C has loaded | The final mode, diagram, caption, selected control, asset identity, and successful image remain unchanged | This is explicitly simulated late callback delivery. No claim is made that network responses were delayed or reordered. Scheduled and observed callback delays are separately recorded. |
| Still view + restore | Enter still view through the Chapters settings, inspect all eleven chapter layouts and content beats, select Instar 4, visit opening/middle/ending, then restore immersive view | All eleven chapters retain nonzero layouts and two beats; cinematic bridge spacing disappears; specimen selection works; chapter identity and transition evaluation recover | The OS motion preference is not emulated. The initial reading mode is restored after the test. |
| Resize + refresh | Resize the same loaded frame between 390×844 and 1440×900 four times and revisit the J-to-pupa and emergence midpoints | Requested and rendered progress agree, the full story remains, and no horizontal overflow appears | These are real iframe CSS layout changes. They do not emulate a physical phone or browser UI zoom. |
| History back + forward | Use actual chapter-menu links to create same-document entries; repeat the current destination; invoke the iframe's real history.back() and history.forward() | Each distinct destination adds one entry, repeating the same hash adds none, and back/forward restores the expected chapter and focus | Only newly created same-document history entries are exercised. This is not a bfcache or browser-background-restoration test. |
| Reload site | Reload the retained frame after verifying the current route | Native mid-page position remains within the documented tolerance and active chapter remains the same | A route replacement blocks this check. Reload is not silently substituted with a copy of previously fetched HTML. |

UI activation uses authored `click()` calls after focus. These test application behavior in a real browser but do not establish pointer hit-testing, physical touch handling, or native Tab/Escape behavior. Those require the separate manual/browser-tool checks.

## Performance observations

The report uses the iframe's own Performance API entries and application marks. Missing entries remain `null`; unsupported observers are identified explicitly. It records:

- Navigation milestones, including response end, DOM interactive, DOMContentLoaded end, load-event end, response sizes, and the navigation type.
- `first-contentful-paint`, when exposed by the browser.
- The actual `chrysalis-ready` and `chrysalis-hero-ready` marks already emitted by the application. These are kept as separate measurements.
- Feature-detected `longtask` observations, with start time, duration, count, total duration, and maximum duration. The observer requests buffered entries and records when it was attached.
- Actual `requestAnimationFrame` intervals while native scrolling advances through the J-to-pupa and emergence transitions. The sample preserves raw intervals, a small set of actual scroll positions, distribution statistics, and final transition state. Sampling is bounded; an early timeout is reported rather than padded with invented samples.

**Observe performance** returns **OBSERVED**, not a claimed performance-budget pass. The browser may use software rendering, the host hardware is unknown, the browser cache may already be warm, and the iframe plus harness add overhead. No cold-start claim, physical FPS capability, Core Web Vitals pass, INP, or measured time to first human interaction is inferred from these values. First contentful paint and an image-ready mark are different events and remain differently named.

## Standards and implementation references

- [Navigation Timing Level 2](https://www.w3.org/TR/navigation-timing-2/), reviewed 2026-11-09: navigation entries expose milestones relative to the document's time origin. The harness reads their actual values rather than timing a synthetic delay.
- [Paint Timing](https://www.w3.org/TR/paint-timing/), reviewed 2026-11-09: first contentful paint refers to the first rendered text or image content. It is not a complete measure of page readiness or an interchangeable name for LCP.
- [Long Tasks API](https://www.w3.org/TR/longtasks/), reviewed 2026-11-09: the published document is marked **Discontinued Draft**. The harness therefore treats an implemented `longtask` observer as a feature-detected browser diagnostic, not a claim of current standards conformance. Unsupported observers remain explicitly unavailable.

## Known execution limits

The local Playwright 1.62.1 package was available, but its Chromium executables were absent. The official Chromium installation failed after automatic download attempts returned invalid archives. The exact blocker is retained in `evidence/prototype/playwright-environment.json`.

The working cloud browser can execute this same-origin harness, but this does not remove the independent gaps for operating-system media emulation, native Playwright interception, physical devices, touch gestures, true browser zoom, bfcache, or background restoration. Keep those outcomes separately labeled in the final acceptance ledger.
