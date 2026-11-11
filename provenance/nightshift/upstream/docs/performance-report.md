# NIGHTSHIFT final-build performance measurements

**Measurement status: MEASURED on the final production build identified below.** These are bounded local laboratory observations, not a general performance guarantee or a claim that every acceptance requirement has passed.

Final-build raw evidence: `evidence/records/performance.json`. The original pre-correction run is preserved separately as `evidence/records/performance-baseline.json`; its numbers are not used as final-build results.

Reproducible runner: `scripts/measure-performance.mjs`.

## Build and environment

The run began at **2026-11-09T07:46:06.293Z** and finished at **2026-11-09T07:46:26.737Z**. The recorded production files were unchanged between the beginning and end of measurement.

| Production file | Bytes | SHA-256 |
| --- | ---: | --- |
| `assets/index-DLeUPCK4.js` | 196,480 | `33c9c605994ba14ea2e7bb9d4cbc2c321b0de99ac8f48e6a7c4f1ff061716460` |
| `assets/index-D0j9bzfP.css` | 45,418 | `e02301f363201dcd592f04131c431e371ae9abf0a30b6dfa400fd66b2365ea6b` |
| `index.html` | 3,259 | `ed082736994c239cfbc3e31798a84bce46a7d7d69a742a8e33d8ebc62fb1b35e` |

The table identifies the files actually referenced by the final index and requested by all three measured pages. The raw directory fingerprint also lists retained older, unreferenced `index-BuBD98b4.js` and `index-BMd4_mOq.css` copies. Resource Timing confirms that these startup runs fetched the new `DLeUPCK4` JavaScript and `D0j9bzfP` stylesheet. The JavaScript contents have the same SHA-256 as the preceding build; the stylesheet and index changed.

- Browser: **Chromium 153.0.8010.0** through **Playwright 1.65.0**.
- CSS viewport: **1440 × 900**; device pixel ratio: **1**.
- Environment: virtualized Linux; underlying physical hardware is unknown. Headless launch included `--disable-gpu`; this is a software-oriented fixture, not a physical-device measurement.
- Server: loopback HTTP using the actual Vite production preview, launched in the same Node process as the browser. No public hosting or deployment was used.
- Compression: the observed responses included **gzip and identity**. These results must not be described as entirely uncompressed resources.
- Each startup sample used a new browser context and disabled HTTP cache through CDP. The browser process and local server were shared, so these are fresh-context loads, not operating-system cold boots.
- Other tasks can contend for CPU on the shared host. The run does not reproduce a particular Windows or Android device.

The Browser extension initially failed with `net::ERR_HTTP_RESPONSE_CODE_FAILURE`. A cloud-browser attempt then displayed another project on the shared preview port after initially seeing NIGHTSHIFT. The isolated local fixture avoids that shared-port ambiguity. The ordinary Chromium archive download was corrupt; the run used an explicitly supplied executable. The report records the actual browser version rather than assuming it matches Playwright's usual bundled revision.

## Startup observations

The unthrottled column uses the median of three fresh-context runs, except CLS, which reports the largest observed value among those runs. Times are milliseconds from navigation unless stated otherwise.

| Observation | Three unthrottled local runs | One simulated slow-4G / 4× CPU run |
| --- | ---: | ---: |
| First contentful paint | 68 ms median | 552 ms |
| First hero image decoded, followed by two animation-frame callbacks | 118.7 ms median | 1,899.1 ms, compact fallback |
| Full-resolution hero decoded, followed by two animation-frame callbacks | 118.7 ms median | 2,812.3 ms |
| Application's `nightshift-interactive` mark | 69.6 ms median | 1,431.7 ms |
| Last observed LCP candidate before the interaction probe | 108 ms median | 1,468 ms |
| CLS, using the largest eligible session window | 0 maximum | 0.008566 |
| Observed startup long tasks | 0 in all three windows | 1 × 144 ms |
| Primary chapter text available | 11 chapters in every run | 11 chapters |
| Active scene images complete after readiness wait | Yes in every run | Yes |
| Uncaught application errors | 0 | 0 |

The LCP element was **`#hero-title`, an H1**, in these samples. It was not the photograph. The relatively early LCP therefore does not imply that the detailed hero image finished at the same time. The separate art timings show when that image became decodable and received subsequent rendering opportunities.

The art observer records decode readiness and two `requestAnimationFrame` callbacks. It does not inspect display pixels and is not a formal first-meaningful-paint metric. The application mark records initialization of markup, controller and interactions; it is not standardized Time to Interactive or INP.

The image-timing observer logged one rejected `img.decode()` attempt in each unthrottled run (`The source image cannot be decoded`), then recorded a successful full-hero decode and complete active image. The throttled run had no observer errors. These diagnostic rejections are retained in the JSON; they were not uncaught application errors, and the report does not infer their cause or silently discard them.

The first startup measurement window contained **521,678 encoded resource bytes** in each unthrottled run. The throttled measurement window contained **703,536 encoded resource bytes**. These windows ended at different times, so the counts are not a controlled before/after size comparison or the whole-site payload. Detailed per-resource timings and bytes are retained in the JSON.

## Simulated slow network

One fresh context used these CDP settings before navigation:

| Setting | Actual requested value |
| --- | ---: |
| Added latency | 150 ms |
| Download throughput | 200,000 bytes/s = 1.6 Mbps |
| Upload throughput | 93,750 bytes/s = 750 kbps |
| CPU slowdown | 4× |

The first usable art record referenced `/media/fallback/hero.webp`, **512 × 320** pixels. The full-hero record referenced `/media/hero.webp`, **1585 × 992** pixels. The complete chapter text was present, the current scene's image finished loading, and opening the chapter dialog worked after readiness.

This is a single controlled browser simulation, not a real 4G connection or phone. It covers startup and one interaction, not every image at every chapter under prolonged throttling. The full hero became ready after approximately **2.81 seconds** in this run; no claim that all visual completion meets a universal 2.5-second target is made.

## Measured interaction probe

After each startup observation window, Playwright performed a trusted click on the chapter-menu button. A capture listener measured from that click to two subsequent animation frames, and the test verified that the dialog was open.

The unthrottled event-to-two-frame samples were **27.7 ms**, **29.6 ms**, and **29.0 ms**. The simulated slow-4G/CPU sample was **33.0 ms**. These small samples are sensitive to frame scheduling and do not establish a general interaction-latency distribution.

Raw Event Timing entries are retained where the browser supplied them. This probe is **not an INP score** and does not cover all interaction types or the full visit.

## Rail-to-water frame-callback pacing

The runner used native `scrollTo` positions during a forward and reverse traversal of **TR-06-07**, sampling each `requestAnimationFrame` interval. It used the real measured transition bounds from the DOM and kept the normal motion mode enabled.

| Observation | Result |
| --- | ---: |
| Requested traversal duration | 6,000 ms |
| Observed duration | 6,016.4 ms |
| Recorded intervals | 361 |
| Median interval | 16.7 ms |
| 95th-percentile interval | 16.7 ms |
| Largest interval | 16.8 ms |
| Intervals over 50 ms | 0 |
| Intervals over 100 ms | 0 |

The checkpoints identify the source/target progression as rail → authored rail/water midpoint → water and the reverse. Observed state can trail the requested scroll by one callback because the diagnostic samples state in the same frame in which it requests a new position.

These are **callback-pacing measurements**, not GPU presentation timings or a claim of 60 FPS. They do not replace a recorded, visually watched transition, and they cannot rule out a one-frame art discontinuity.

## Three repeated round trips and JS heap

One complete warm-up traversal visited every chapter from top to bottom and back. Three further traversals repeated that path. The runner waited for network idle and active-image readiness, then requested garbage collection through CDP before each sample.

| Sample | JS heap used | DOM nodes | JS event listeners |
| --- | ---: | ---: | ---: |
| After warm-up | 2,166,280 bytes | 1,267 | 124 |
| After measured round trip 1 | 2,166,332 bytes | 1,267 | 124 |
| After measured round trip 2 | 2,164,836 bytes | 1,267 | 124 |
| After measured round trip 3 | 2,164,860 bytes | 1,267 | 124 |

The net retained JS-heap difference was **−1,420 bytes**. The node and event-listener counts were unchanged. There were no uncaught page errors during this probe.

The final retained heap was below the warmed baseline, and the measured samples did not increase monotonically. This short probe does not prove flat memory use or absence of leaks. Forced GC changes runtime behavior. JS heap excludes native browser allocations, decoded images, graphics resources and other process memory, and three round trips are not a long-duration soak test.

## Reproduction

Build the project first, then run:

```bash
node scripts/measure-performance.mjs
```

The script expects Playwright's browser installation by default. For an existing compatible local executable, set **`PLAYWRIGHT_EXECUTABLE_PATH`** in the environment before running it. There is no task-specific executable path embedded in the script. The optional **`NIGHTSHIFT_PERFORMANCE_PORT`** variable changes its default loopback port, 4330.

The runner starts and closes its own Vite preview in the same process, creates separate contexts for startup samples, writes raw evidence, and fingerprints the production index, JS and CSS before and after. A changed build invalidates the assumption that one stable version was measured.

These results apply only to the SHA-256 fingerprints recorded above. Rebuilds that change the index, JavaScript or CSS require a new run before these numbers can be presented as measurements of that output. The preserved baseline supports provenance, not a controlled speed-comparison claim: browser scheduling and shared-host load differ between runs.
