# SUPERCELL

### The Shape of Moving Air

A storm sustained by moving air. An interactive, five-part observation of one illustrative supercell: its scale, the air that sustains it, a horizontal section, changing wind conditions, and a return to the whole cloud.

This is an independent local website. The title refers to the weather phenomenon; the project is not affiliated with the game company Supercell.

## Run locally

Requires **Node.js 22.12 or later** and npm. From the extracted project directory:

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

Open the local address printed by Vite, normally `http://127.0.0.1:5173`. Dependency installation needs access to the npm registry. Running the built experience needs no API key, backend, account or external media service.

### Build and preview

```sh
npm run build
npm run preview -- --host 127.0.0.1
```

The build type-checks the TypeScript and produces `dist/`. Preview normally runs at `http://127.0.0.1:4173`.

A prebuilt `dist/` is included in the ZIP. It can be served directly by any local static HTTP server. For example, with Python installed on Windows:

```sh
py -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Open the site over **HTTP**, not by double-clicking `index.html` or using a `file://` URL. No deployment is necessary or included.

### Tests

```sh
npm test
```

The Node tests check the shared field, section/height correspondence, structural responses to shear, the fixed horizon, path continuity, projected density and neighboring sections.

For the optional Playwright browser suite, install its Chromium browser once, keep the local dev server running in another terminal, then run:

```sh
npx playwright install chromium
npm run test:browser
```

`BASE_URL` defaults to `http://127.0.0.1:5173/`. To test a production preview instead, start `npm run preview -- --host 127.0.0.1` and set its URL in the test terminal. In PowerShell:

```powershell
$env:BASE_URL = "http://127.0.0.1:4173/"
npm run test:browser
```

On a POSIX shell:

```sh
BASE_URL=http://127.0.0.1:4173/ npm run test:browser
```

The suite writes screenshots and `acceptance.json` to `test-results/`; `QA_OUT` can select another output directory. It uses Playwright 1.56.1 and software WebGL. The recorded test environment is Linux with headless Chromium 141 and SwiftShader; Safari, Firefox and physical devices are outside the recorded coverage. See [docs/ACCEPTANCE.md](docs/ACCEPTANCE.md) for actual results, corrections and limits. Neither installation instructions nor a passing unit suite assert that every browser or visual check has passed.

### Additional recorded regression suites

Run the targeted touch/orientation/static-fallback suite against a production preview:

```sh
BASE_URL=http://127.0.0.1:4173/ node tests/recovery-regressions.mjs
```

For additional rendering/audio/motion evidence:

```sh
BASE_URL=http://127.0.0.1:4173/ node tests/resilience-acceptance.mjs
```

The optional native background-tab check needs Linux, Xvfb and an installed full Chromium browser. Its method and exact mode commands are recorded in [docs/RESILIENCE_REVIEW.md](docs/RESILIENCE_REVIEW.md). These test-only tools are not required to run the website. On PowerShell, set `$env:BASE_URL` before the `node` command, as in the primary browser example above.

## Explore

| Control | Behavior |
| --- | --- |
| Scroll, Index or chapter numbers | Move through the five observations. Chapter links preserve your selected condition and section height. |
| Slice Height | Move the observation plane and update its matching density section. Percentages describe normalized model height, not measured altitude. |
| Lower / Raise | Adjust the same section height in five-percentage-point steps. Native range controls also support keyboard operation. |
| Find the updraft | Set a readable section height of 42%. A plane that misses the main updraft otherwise remains an honest empty/partial observation. |
| Wind shear | Change the authored condition, affecting tower tilt, airflow and precipitation position together. The values are model parameters, not measured wind speeds or danger levels. |
| Reference / Change / Return | Select the reference condition, try a more pronounced condition, or return to the preceding comparison condition. |
| Reset Storm | Restore reference shear and 42% section height. Your scroll position stays unchanged. |
| Back to Opening / Revisit the section | Change your observation position without clearing the model settings. |
| Pause motion | Pause ambient cloud/rain and parcel movement. Scrolling and parameter changes remain available. |
| Sound | Optional locally synthesized wind, **off by default**. Sound is not needed to understand the experience. |
| Research & sources | Open the research notes. Closing a dialog restores its initiating control's focus. |

Touch-device chapter navigation moves immediately to its destination so it does not add a second smooth animation to native scrolling. Manual touch scrolling retains the continuous five-act experience.

The operating system's reduced-motion preference selects stepped observation states and pauses ambient motion. The interface keeps the same content and controls. To exercise the no-WebGL path deliberately, append `?fallback=1`, for example `http://127.0.0.1:4173/?fallback=1#section`.

## How it is built

The project uses TypeScript, Vite, Lenis 1.3.27, GSAP 3.15.0/ScrollTrigger, WebGL, Canvas 2D fallback and SVG explanatory geometry. One GSAP ticker drives Lenis and scene evaluation; `autoRaf` is disabled.

Three independent state values define the observation:

- **`p`** — normalized narrative scroll position: framing, chapter text and explanatory-layer visibility.
- **`u`** — the user's illustrative shear condition.
- **`h`** — the user's normalized horizontal section height.

The medium is **2.5D**: a two-dimensional photographic surface combines with a computed three-dimensional explanatory field and projected depth information. It is not a freely orbitable reconstructed cloud.

| Module | Responsibility |
| --- | --- |
| `src/field.ts` | Shared authored density, cloud/rain centers, deformation, airflow and matching section contours |
| `src/volume.ts` | Integrate that same field through depth for a projected structural texture; sample neighboring planes for depth context |
| `src/weather.ts` | WebGL photographic projection and structural shading, bounded/adaptive drawing buffers, Canvas 2D fallback |
| `src/story.ts` | Reversible chapter and layer states from current scroll progress |
| `src/main.ts` | Controls, navigation, semantic visibility, focus, lifecycle and shared scheduling |
| `src/audio.ts` | Optional local wind synthesis |

The plane through the cloud and detached section reuse the same contour samples. The depth projection is rebuilt when the condition changes, rather than performing a full volume integration on every animation frame. Reduced render resolution changes detail, not the field's coordinates or the user's selected height.

The images are original AI-generated artwork made for this task: landscape **1672×941** and independently composed portrait **941×1672**. They are stored locally as WebP. Manrope is bundled as a local WOFF2 font. HTML-linked styling and embedded posters support an immediate static introduction and readable font fallback while resources load; JavaScript enables the chapters and controls. A 4K viewport does not imply native 4K photographic source detail.

This is a shared **illustrative structure**, not a physical fluid solver, a measured reconstruction, live weather, or a forecast. The photograph provides an artistic surface; its appearance is not a scientific density measurement. Scroll distance represents a sequence of observations, not elapsed storm time.

## Privacy and local assets

Only `u` and `h` are saved under `supercell-observation` in browser **session storage**, so they can survive a reload in the same tab. There is no analytics, tracking, external data API or server-side persistence. All production images, fonts, scripts and sound generation are local. Research links open their external sources only when selected. If storage is unavailable, controls continue to work for the current page.

## Project notes

| File | Contents |
| --- | --- |
| [docs/VISUAL_BIBLE.md](docs/VISUAL_BIBLE.md) | Selected visual direction, composition, responsive strategy and transition contract |
| [docs/GENERATION_RECORD.json](docs/GENERATION_RECORD.json) | Real generation records and asset decisions |
| [docs/RESEARCH.md](docs/RESEARCH.md) | Primary references, scientific boundaries and acceptance requirements |
| [docs/SOURCES_AND_LICENSES.md](docs/SOURCES_AND_LICENSES.md) | Asset provenance and dependency/font notices |
| [docs/ACCEPTANCE.md](docs/ACCEPTANCE.md) | Actual verification, fixes, evidence and remaining coverage limits |

The ZIP contains source and prebuilt output. Dependency directories, caches, browser profiles and credentials are excluded. Refer to the acceptance record for what was actually measured; this README makes no claim of unrecorded browser or physical-device coverage.
