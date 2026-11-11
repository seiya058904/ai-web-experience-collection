# CARGO

## The same box, a changing world.

![One red container beneath a monumental fictional port gantry.](public/media/hero-small.webp)

An independent interactive editorial about one fictional freight container. Follow **CARGO / BOX-001** through packing, doors, road and rail, a terminal, a crane lift, open water and arrival. Eleven chapters pair generated industrial imagery with a shared container study. Ten authored handoffs can be explored by scrolling or selecting their five stages.

[Read the complete story](STORY.md) · [Sources and interpretation](docs/SOURCES.md) · [Evidence ledger](docs/requirements-evidence.md) · [Known limitations](docs/KNOWN-LIMITATIONS.md) · [Licenses](LICENSES.md)

**Delivery status:** the source implementation, generated assets and production build are provided. The source suite passes 28 tests. Required browser acceptance remains **BLOCKED** in the preparation environment, so this is not an H1–H9 acceptance claim. See the [verification report](docs/QA-REPORT.md) for the exact evidence and remaining checks.

## Run locally

Extract the source ZIP and open a terminal in the directory containing `package.json`.

Use **Node.js 24 LTS** for the documented development and test workflow. The package requires Node.js **22.12 or newer** for the application toolchain. The preparation environment used **Node.js 24.22.1** and **npm 11.9.0**. The lockfile fixes dependency versions.

### Windows PowerShell

```powershell
node --version
npm ci
npm run dev -- --host 127.0.0.1
```

Open the local address printed by Vite, normally [http://127.0.0.1:4173](http://127.0.0.1:4173). Keep the terminal open while using the site. Press **Ctrl+C** to stop it. If that port is occupied, stop the earlier process or add `--port 4174` to the command.

### macOS, Linux or another terminal

```sh
node --version
npm ci
npm run dev -- --host 127.0.0.1
```

Installation downloads the locked development dependencies. No image-generation account, API key, server backend, database or environment file is needed. The retained images and bundled fonts are local files.

### Build and preview

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). The build runs TypeScript checking and writes a static application to `dist/`. Use an HTTP server; opening the entry file directly with `file://` is not the supported module-loading workflow.

Vite uses `base: './'`. Generated asset references are relative, so the built directory can be served beneath a path prefix as well as at a server root. Chapter navigation uses hashes rather than server routes. A hosting provider is not required for local use. This handoff contains no publication, account, domain or deployment setup.

## Explore at your own pace

Scroll, use Page Up/Page Down or arrow keys, or choose a chapter from **Chapters**. The opening **Follow the container** link goes to the interior chapter. Chapter links can be entered directly, such as `/#ch-08`; the journey recap provides links back to road, rail, port, sea and destination.

| Control | Result |
| --- | --- |
| **Identify BOX-001** | Opens a schematic identity study of the same container. |
| **Corner fittings / Doors** | Highlights the selected structural feature; **Reset view** restores the original study. |
| **Empty / Packed** | Changes the interior between an empty shell and the six authored timber blocks. |
| **Open / Closed** | Changes the two door poses. The destination reuses the departure cargo arrangement. |
| **See the connection** | Opens the road-support study. |
| **Road / Rail** | Selects a distinct carrier beneath the unchanged container. |
| **Compare supports / Reset carrier** | Highlights the common corner interfaces or returns to the initial road view. |
| **Find BOX-001 / Locate the container / Find the red box** | Identifies the box within the corresponding illustration; selecting again restores the composition. |
| **Inspect the lift** | Opens the shared lifting study. Its labeled range control moves from grounded to engaged to raised. |
| **Compare ports** | Opens a paired view of the fictional departure and destination ports. |
| **Five stage buttons** | Selects a defined moment in each handoff, with an English caption. |
| **Replay the route / Explore the chapters again** | Returns to the beginning or opens the chapter menu. |

Buttons and links are keyboard accessible; the lift range also responds to its native keyboard controls. Dialogs have a close button and support **Escape**. Chapter navigation moves focus to the target heading. The interface text is English and rendered as real DOM or accessible SVG text.

### Motion and stills

**Motion: Reduced** switches to the SVG studies and a calmer, unpinned reading presentation. All chapters, stage choices and meaningful interaction states remain present. **View as stills**, inside the chapter menu, enables the same mode. A `?stills` query also selects it, for example `/?stills#ch-07`.

The system's reduced-motion preference is used when there is no saved explicit choice. A choice made with the motion control is saved locally in the current browser. Reduced mode can be changed at any time.

The display is silent. **Sound: Off** reports **“Audio is unavailable in this version.”** No sound recordings or synthesizer are included.

### Recovery and offline reading

If a photograph fails to load, that chapter keeps its text and a schematic substitute with a **Retry** action. If WebGL or the Three.js enhancement is unavailable, the container study uses its SVG alternative. These are implemented recovery paths; their observed test coverage is recorded in the evidence files.

[STORY.md](STORY.md) is a complete offline English transcript containing both beats of all eleven chapters, every transition anchor and all fifty stage descriptions. The HTML also includes a short no-JavaScript chapter summary. Interactive controls require JavaScript. The runtime uses local assets after installation and build; external research links open only when the visitor follows them.

## Architecture

The application uses Vite, TypeScript and normal HTML/CSS. Lenis and GSAP share a single animation clock. A pure story evaluator derives chapter and transition state from the current position. A single active viewer presents the shared schematic model; Three.js is imported as an enhancement, while SVG supplies the initial and reduced-motion presentation.

| Path | Purpose |
| --- | --- |
| `src/main.ts` | Input, history, dialogs, motion preferences, resource recovery and the shared animation clock. |
| `src/render.ts` | Semantic chapter markup, controls, navigation, source dialog and reading holds. |
| `src/story-data.ts` | Eleven chapter records, ten five-stage handoffs and the fictional container metadata. |
| `src/story-state.ts` | Deterministic progress, support changes, door state, camera framing and occlusion. |
| `src/container-fallback.ts` | Canonical dimensions, six cargo blocks, physical pose evaluation and accessible SVG. |
| `src/container-scene.ts` | Bounded Three.js enhancement, contact geometry and resource lifecycle. |
| `src/style.css` | Editorial layout, responsive composition, still mode, focus and type. |
| `public/media/` | Retained generated images and smaller WebP derivatives. |
| `tests/` | Source-level checks and browser verification entry point. |
| `scripts/check-english.mjs` | Unintended CJK and unfinished-interface-copy guard. |
| `docs/model-contract.md` | Units, axes, hinges, scratch, cargo, supports and renderer boundaries. |
| `docs/SOURCES.md` | Reviewed primary-source facts and authored-fiction boundaries. |
| `docs/licenses/` | Retained dependency and font notices from the installed packages. |

The standard 20-foot nominal exterior is **6.058 × 2.438 × 2.591 m**. This value is supported by the reviewed public operator and BIC sources. The scratch, cargo, ports, route, seal and exhibit identity are authored fiction. Precise fittings, supports and handling details are schematic; see [the source register](docs/SOURCES.md) and [model contract](docs/model-contract.md).

## Verify the source

Run these commands from the project root:

```sh
npm test
npm run check:english
npm run build
npm run check:assets
```

The source tests use Node's native TypeScript support. Node.js 24 is the straightforward supported reproduction environment. On early Node.js 22 releases, the equivalent test invocation may require the explicit flag:

```sh
node --experimental-strip-types --test tests/*.test.mjs
```

The browser entry point is:

```sh
npx playwright install chromium
npm run test:browser
```

The first command installs the local Chromium build used by Playwright when it is not already present. See the browser test script and the [QA report](docs/QA-REPORT.md) for its preview-server setup and recorded environment. A restricted execution environment may require its supported browser surface instead; that is separate from the local reproduction commands above.

### Acceptance evidence

The [requirements ledger](docs/requirements-evidence.md) records individual states as `PASS`, `FAIL`, `BLOCKED`, `NOT TESTED` or an in-progress state. The [QA report](docs/QA-REPORT.md) is the authority for actual production-build, browser, viewport, resource-failure and clean-extraction results. This README does not turn an implemented feature into a test pass or infer performance from a screenshot.

For independent reproduction, extract the delivered ZIP into a different directory, run `npm ci`, run the checks and build, and start a production preview. Inspect the opening, a middle chapter and the destination, including controls and media paths. Any supplied report applies to its recorded build and conditions; modifications require appropriate retesting.

## Privacy and scope

There is no login, analytics, advertising, database, freight API or remote image-generation request in the application. Two optional browser-storage values are used: `cargo-motion` in local storage for motion preference, and `cargo-position` in session storage for reload restoration. They remain in the current browser and are not transmitted.

The production site is a static exhibit. Dependency installation and optional browser installation require ordinary package downloads. Explicit source links lead to external reference websites. The dev and preview commands above bind to the loopback interface for local work.

## Assets and rights

The photographic compositions are AI-generated fictional industrial scenes, retained as WebP files in `public/media/`. They are not images of a documented shipment. Archivo and Barlow Condensed are bundled through their installed font packages. No runtime font CDN is used.

[LICENSES.md](LICENSES.md) identifies the actual pinned runtime packages, fonts and retained notices. GSAP uses its own standard no-charge license; it is not MIT-licensed. The complete package should be kept together so that source notes, asset provenance and dependency notices remain available.
