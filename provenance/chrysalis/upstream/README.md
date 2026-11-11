# CHRYSALIS

## The architecture of becoming

An English-language, illustrated journey through the life of one imagined monarch butterfly (*Danaus plexippus*). Eleven substantial chapters connect an egg on milkweed, five larval instars, a hanging larva, the chrysalis, emergence, and first flight. Ten reversible scroll bridges connect the reading holds.

The website is a complete local project. It has no account system, analytics, database, paid runtime API, or publication requirement. AI-assisted macro illustrations and original SVG studies are delivered with the source. They are clearly identified as illustrations. This is not photographic documentation of one animal, microscopy, a measured time-lapse, or rotatable 3D.

## Start on Windows

Install Node.js **22.12 or newer** with npm. Node.js **24.22.1** is the build runtime used for this handoff. Extract the entire archive before starting; do not run it inside the ZIP viewer.

Open PowerShell in the extracted `chrysalis` directory:

```powershell
npm.cmd ci
npm.cmd run dev -- --open
```

Keep the terminal open and use the local address printed by Vite. Stop the server with **Ctrl+C**. `START.bat` offers the same development launch with an initial dependency install when necessary. `Start-Chrysalis.ps1` is provided for environments that already allow local PowerShell scripts; changing machine execution policy is not required to use the npm commands above.

A network connection is needed to install npm dependencies the first time. Once installed, the running website loads its fonts, images, styles, and scripts locally. External source citations open the corresponding organizations' websites only when selected.

## Start on macOS or Linux

```bash
npm ci
npm run dev -- --open
```

There are no environment variables or secret keys to configure.

## Build and preview the production website

```bash
npm run build
npm run preview -- --port 4173
```

On Windows, use `npm.cmd` if PowerShell's script policy intercepts `npm`.

Open the address printed by the preview command. `dist/` is the generated static website. The build uses relative asset URLs and can be served under a directory prefix. Do not open `dist/index.html` directly with `file://`; JavaScript modules require a local HTTP server. The separate `dist/reading.html` contains the complete script-free reading edition.

`npm run build` runs the TypeScript check and Vite production build. The source lockfile pins the dependency graph. A new npm install is not needed for every edit.

## Reading and observing

- **Begin the transformation** takes the reader to chapter two and places focus on its heading when navigation completes.
- **Chapters** opens all eleven destinations. Escape closes the dialog; focus returns to its opener. Hash links support direct entry, history, and reload.
- **Instar 1–5 / Show all** selects independently drawn specimens and accompanying descriptions. Left/Right arrows, Home, and End operate each segmented control.
- **Exterior / Illustrated inside / Reset view** separates a natural opaque exterior from a labeled explanatory reconstruction.
- **Leaving the shell / Wings unfolding / Ready for flight** selects three original explanatory poses. The large photographic-style art complements these diagrams; it is not a timed recording.
- **Skin / Chrysalis**, **Early / Late**, hatching poses, and the feeding comparison expose additional observation states. The feeding controls explicitly describe the diagram below the macro reference.
- **Watch the first flight / Return the butterfly** moves a separate alpha layer over the same clean milkweed backplate. The full plant remains after departure.
- **Motion: Reduced** uses stable scene steps and removes camera motion. The operating-system preference is also respected. **View as stills** removes the connecting bridges while preserving all chapters and observation controls. Both options are available in the chapter menu on narrow screens.
- **Sound: Off** explains that audio is unavailable. This version contains no audio asset and never starts sound.
- **Sources & illustration notes** distinguishes reviewed biological facts from the illustrative scene and its limits.

## Scientific and visual scope

The plant is the larval host; a mature caterpillar usually leaves its feeding milkweed to find a pupation site. The continuing plant setting is an illustrative habitat connection, not a claim that the whole life cycle always happens on one leaf. Adult structures begin developing during larval life. Late coloration is attributed to developing wing-scale pigmentation, without a universal countdown or an invented transparent shell.

Generated imagery is an interpretation with a reviewed anatomy boundary. In the final hatching plate, the ventral contact line is naturally hidden by the leaf; that plate must not be used to count legs. The instar and emergence illustrations supply separate, explicitly schematic comparative observations.

See [sources](docs/sources.md), [biology and editorial notes](docs/biology-editorial-notes.md), [visual bible](VISUAL-BIBLE.md), and [independent art review](docs/independent-art-review.md).

## Architecture

| Concern | Implementation |
| --- | --- |
| Build | Vite 8.3.6 and TypeScript 7.0.2; native ES modules |
| Scrolling | Lenis 1.3.27; one instance and one visible-page animation clock |
| State | Pure `evaluateStory` and `evaluateTransition` functions; actual native scroll position is the authority |
| Reading layout | Unpinned HTML sections, semantic headings, selectable English copy |
| Bridges | Seven opaque spatial reveals and three labeled complete-pose comparisons; hatching/feeding, larva/pupa and late-pupa/emergence remain separate complete observations |
| Biological studies | Original accessible inline SVG with separately authored instar and emergence shapes |
| Imagery | Fifteen retained generated outputs, locally compressed WebP derivatives, embedded chapter-specific thumbnails |
| Recovery | Per-picture request versions, target-specific fallback imagery, visible Retry, a complete script-free reading edition |
| Fonts | Locally bundled Libre Caslon Display and Source Sans 3 |
| Privacy | No telemetry, accounts, remote application services, or secrets |

GSAP and Three.js were not required for this implementation. Their omission is deliberate: the single custom scroll controller avoids competing timelines, and the reviewed layered stills avoid unsupported anatomical geometry. The experience has no WebGL dependency to lose. It must not be described as a 3D model or a physically simulated metamorphosis.

Each bridge is evaluated from the current measured scroll position; it does not depend on having played the previous chapter. Reduced mode picks stable source/target states. A chapter's local selection is independent of scrolling. Only the currently progressing bridge requests compositing promotion; later scenes are not continuously animated.

## Project map

```text
chrysalis/
  index.html                 Static meaningful opening and metadata
  src/                       Story, interactions, diagrams, and styling
  public/                    Local web assets and script-free reading edition
  art/generated/             Retained source PNG illustrations
  art/asset-provenance.json   Exact prompts, outputs, selection and rights notes
  tests/                     Deterministic tests and browser QA harnesses
  scripts/                   Repeatable content, checking and packaging helpers
  docs/                      Source, chapter, transition and evidence ledgers
  evidence/                  Actual results and captured browser views
  licenses/                  Bundled third-party license notices
  package-lock.json          Locked dependency graph
  VISUAL-BIBLE.md             Art direction and asset choices
  DESIGN.md                  Interface design contract
```

## Verification commands

```bash
npm test
npm run check:english
npm run build
```

The deterministic test suite verifies endpoints, intermediate progression, reverse/direct evaluation, distinct handoffs, continuity coordinates, invalid input handling, and reduced-motion results. It does not establish visual quality or biological correctness. The English character guard detects accidental CJK text; it is supplemented by editorial review, not presented as a grammar checker.

### Reproduce browser acceptance checks

With the production preview already running:

```bash
npx playwright install chromium
npm run test:browser
```

The browser test runner uses a dedicated headless browser and does not start or publish a server. Optional variables:

| Variable | Purpose |
| --- | --- |
| `CHRYSALIS_TEST_URL` | Already-running local preview URL; default `http://127.0.0.1:4173/` |
| `CHRYSALIS_QA_OUTPUT` | Output directory relative to the project; default `evidence/browser` |
| `CHROMIUM_EXECUTABLE_PATH` | Optional installed test Chromium executable |

Windows example:

```powershell
$env:CHRYSALIS_TEST_URL = 'http://127.0.0.1:4173/'
npm.cmd run test:browser
```

`tests/cloud-qa.html` is a separate local QA page for exact iframe CSS sizes, deterministic transition stops, selected UI states, and visible JSON evidence. It is not included in the production website. `tests/recovery-qa.html` supplies additional explicitly scoped recovery and timing observations. These authored consoles exercise the real site in a browser, but they do not emulate physical touch devices, OS preferences, network throttling, or browser UI zoom.

The handoff environment could not install the standalone Chromium binary: the official download returned an invalid empty archive. Therefore the native Playwright suite is delivered for reproduction and is **BLOCKED** in that environment; it must not be counted as passed. Real cloud Chromium observations are separately indexed in [QA results](docs/qa-report.md) and [evidence index](docs/evidence-index.md). Read those documents for exact coverage, actual failures and corrections, and remaining limits. No physical-device, Safari, formal accessibility-conformance, fixed-FPS, or field Core Web Vitals claim is made.

## Assets and reuse

The eight required generation assignments were completed before production layout; fifteen final outputs are retained from twenty actual generation calls. Original files, exact prompts, references, and rejected-attempt rationale are listed in the [asset manifest](docs/asset-manifest.md) and `art/asset-provenance.json`. Rejected raster outputs, caches, private tool paths, credentials, and dependency folders are excluded from the source handoff.

The raster originals are approximately 1.6K pixels wide, with a separate portrait composition. A large CSS viewport can scale them; this is not native 4K photography. SVG studies, DOM type, and interface linework remain resolution-independent.

See [third-party notices](docs/third-party-licenses.md), `licenses/`, and [project license](LICENSE.md). Generated outputs are supplied for this project without a promise of copyright exclusivity or trademark clearance. External scientific sources support facts; their artwork has not been copied into the project.

## Local-only handoff

No site has been deployed, published, pushed to Git, inserted into a collection, or attached to a domain as part of this work. The primary deliverable is the source ZIP. Use its evidence ledger to distinguish implemented features, observed passes, and checks that remain blocked by the test environment.
