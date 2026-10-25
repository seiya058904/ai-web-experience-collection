# RELAY — Final acceptance record

## Delivery outcome

The project contains all six interactive chapters, the deterministic local byte
protocol, eight genuine visual studies, the Visual Bible, local production
fonts, executable verification suites and the actual evidence described below.
It is delivered as source only. No site was deployed, hosted, published or
integrated into an existing repository.

The complete production-browser run finished at **2026-10-24T16:18:15.304Z** with
**133 PASS, 3 optional forced-font
stress FAIL, 1 harness-specific NOT_TESTED, and zero
critical failures**. The three stress failures remain explicitly disclosed;
they have not been relabelled as passes. The headless visibility limitation
was independently resolved by a real ordinary-browser test.

Primary evidence: [complete production report](evidence/final/results.json),
[native browser review](NATIVE-BROWSER-REVIEW.md),
[engine review](ENGINE-REVIEW.md), and
[independent visual review](VISUAL-REVIEW.md).

## What was actually checked

| Requirement | Evidence and outcome |
| --- | --- |
| Real image generation before scene implementation | Eight actual outputs; two different Heroes, ACK middle, copy, route, buffer, ending and mobile studies. Exact prompts, files, hashes and adopted/rejected decisions are in [generation-record.json](concepts/generation-record.json). |
| Six stable scenes | Each rendered at 320×700, 360×640, 390×844, 768×1024, 1440×900, 1920×1080, 2560×1440 and 3840×2160. Native DOM geometry and independent screenshot review were used. |
| All chapter boundaries | Five boundaries × 0/25/50/75/100% × forward/reverse: 50 live timeline samples. Animation was enabled. Packet IDs remain tied to actual model instances. |
| Scroll independence | Slow wheel, rapid reversals, chapter navigation and document jumps left the paused exported model trace unchanged. Scroll does not advance delivery or the history cursor. |
| Explicit time control | Play, pause, next event, restart and new-round submission exercised through actual controls. Repeated inspection does not send again. |
| Real interventions | Upper/lower closure, lower queue speed and one-shot ACK loss alter actual model events. The all-cut scenario genuinely fails. Restoring a path follows the remaining budget. |
| Sender versus receiver truth | Exact bytes can reach Received while sender knowledge remains Confirmation pending, including the all-ACK-loss terminal case and recorded snapshot. |
| UTF-8 and safe text | Chinese, accented characters, emoji, split multibyte chunks, leading U+FEFF and literal markup tested. Original and reassembled Uint8Array bytes compared exactly. |
| Maximum input | 120 UTF-8 bytes / 24 blocks. All 24 native selector options remain inspectable on a 320px touch viewport, and the last interval is [115,120). |
| Recorded mobile state | Actual UI steps, then a real Received snapshot at 4.475073981s, tested at 320 and 390px. Historical statistics match the selected snapshot and differ correctly from later live statistics. Return preserves the live trace. |
| Actual browser zoom | Native Chrome Settings → Appearance → Page zoom at 125%, 150%, 200%. DPR/layout metrics, unchanged outer window, visible controls and native inspection verified. |
| Actual hidden-tab recovery | Ordinary headed Chrome, no focus emulation. Another real tab causes document.hidden and automatic pause; returning preserves exact simulation time and trace. |
| Genuine cache hit | Native Chrome emitted Network.requestServedFromCache for production JS, CSS and the two loaded local font faces after a normal warm reload. |
| Loading and fallback | Initial static sculpture, reveal, resource delay, delayed fonts, unavailable fonts and unavailable module tested. Failure remains visibly explanatory. |
| Resize and input | Portrait/landscape, resize, history navigation, keyboard controls, focus return, emulated touch and reduced motion tested. |
| Runtime health | Actual page identity, meaningful DOM, no framework overlay, normal resource delivery, absence of app console exceptions and no outbound message request checked. |
| Clean source package | Exact ZIP extraction, dependency installation, model suite and production build are recorded in [CLEAN-BUILD.md](CLEAN-BUILD.md). |

The application uses native SVG and DOM; there is no WebGL renderer or context
to lose. No GPU-context recovery claim is made.

## Model and independent engineering review

The executable model suite passes **23 tests**, with 24 detailed evidence cases
in [model-results.json](../tests/model/model-results.json). The tested model
source SHA-256 is:

`d0a15758acc720bfe03a9fd9d6a64f7bd115616d762d22b98a8891e4094863bd`

An independent engineering pass examined 20 additional seeded scenarios and
3,651 actual snapshots, with 20 exact operation-trace replays. It found and
verified two substantive repairs: each ACK now retains provenance of the data
attempt that actually caused it, and a leading UTF-8 BOM remains part of the
payload. See [ENGINE-REVIEW.md](ENGINE-REVIEW.md) and
[MODEL-TESTS.md](MODEL-TESTS.md) for evidence and limits.

## Visual and interaction repairs

The independent art pass rejected the first implementation where small-screen
titles clipped, receiver content crossed captions, buffer annotations sat on
slot IDs, and the final tracks crossed the outcome facts. Repairs separated
actual text safe areas from sculpture geometry; the phones use vertical
transport rather than a uniformly shrunken desktop diagram.

Further observed repairs included large-screen heading line boxes, source
sentence timing during transitions, ACK receiver/control spacing, genuine 200%
zoom in a short layout window, phone source shelves below their measured
controls, a clear receiving dock above the mobile message, a missing-range
badge clear of live carriers, scaled 4K caption width, and independent message,
facts and history rows during recorded review.

The source-caption micro-label on the desktop ACK station was the final narrow
visual correction after the full run. Its eight-viewport ACK scene, adjacent
handoffs and real one-ACK-loss flow were rechecked separately in
[final-label-regression/results.json](evidence/final-label-regression/results.json).
The final focused regression passed 29 checks with 0 failures, including 28 geometry samples and 20 handoff samples. The final source change only moves that SVG annotation; it does not change the
model, controller, queue rules, scroll timeline, other layouts or time handling.
The independent visual review identifies the exact images inspected.

Two test failures were next-render-frame assertion races: block selector
population and the disabled ACK-loss button. Bounded waits now observe the
real DOM state after the shared rendering tick. Expected model states and all
functional assertions remain unchanged; no application shortcut was added.

The complete first-pass defects are retained in
[QA-FIRST-PASS.md](QA-FIRST-PASS.md). Final screenshots, not generated concept
images, establish implementation acceptance.

## Measured performance, without extrapolation

The final full run sampled requestAnimationFrame callbacks while delivery was
playing at 1440×900 in Chromium 145.0.7632.6 on Linux x64. Over
**1833.3ms**, it observed **69 intervals**, a
median of **16.70ms** and a 95th percentile of
**50.00ms**. The observed callback rate was
**37.64 per second** in that short virtual
browser sample. This is not a physical-device FPS, Web Vitals, Lighthouse,
battery or high-refresh-display claim. Exact values and user agent remain in
the JSON report.

## Reproduction and evidence identity

Run `npm ci`, `npm test`, `npm run build`, then the browser commands in
[tests/browser/README.md](../tests/browser/README.md). The production fixture
serves actual built bytes and uses native controls for mutations. Its public
inspection API is detached and read-only. Normal application data never leaves
local browser memory.

Each browser report records its own production-index hash. The full matrix and
native browser checks precede the final isolated micro-label adjustment; the
narrow label regression and clean-extraction build identify the final artifact.
The final source, configuration and runtime assets are independently listed in
[production-source-sha256.json](evidence/production-source-sha256.json).

Read [KNOWN-LIMITATIONS.md](KNOWN-LIMITATIONS.md) for the three forced-font
stress findings, exact browser/device coverage, platform glyph fallback and
other practical boundaries. Actual native zoom, cache and hidden-tab checks
are successful supplements to the earlier harness-specific limitations; the
original reports retain their original statuses.
