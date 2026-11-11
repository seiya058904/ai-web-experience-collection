# PAPERSUN

### A fable cut from light

An original, eleven-chapter paper-theatre story. Mira, a lantern-repairer, follows a red thread through a sleeping city to find three pieces of its missing sun. Repair a lantern, steady a wind-wheel, lift a paper shade, and stitch the same three pieces into the sky.

The experience uses generated paper artwork, precisely authored SVG props, selectable English narration, and local interactions. Its source is a Vite and TypeScript project with Lenis and GSAP ScrollTrigger. It requires no account, backend, paid runtime API, analytics, or external asset CDN.

## Start locally

Install **Node.js 24 or newer**. Extract the complete ZIP before running commands. The project directory is the `papersun` folder containing `package.json` and `package-lock.json`. The ZIP includes a prepared `dist/` build; npm dependencies are needed only if you want to rebuild or edit the source.

### Run the prepared preview without installing dependencies

With Node already installed, the included production build can run without `npm ci`, without `node_modules`, and without an internet connection. Open a terminal in the extracted `papersun` folder.

Windows PowerShell:

```powershell
$env:HOST = "127.0.0.1"
node scripts/serve.mjs
```

Windows Command Prompt:

```bat
set HOST=127.0.0.1
node scripts\serve.mjs
```

macOS or Linux:

```bash
HOST=127.0.0.1 node scripts/serve.mjs
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173) and keep the terminal open. Press **Ctrl+C** to stop. Keep the complete `dist/` directory with the server script. This runs the supplied build; it does not compile source edits. No service worker or previously populated browser cache is needed while this local server is running.

### Windows: rebuild from source

Double-click **`scripts/start-papersun.cmd`**. The launcher checks Node, installs locked dependencies when they are absent, builds the site, and starts a server bound to `127.0.0.1`. Open the URL printed in its window. The first dependency installation needs an internet connection. Keep the window open; press **Ctrl+C** to stop.

Alternatively, open PowerShell in the project directory:

```powershell
node --version
npm.cmd ci
npm.cmd run check
$env:HOST = "127.0.0.1"
npm.cmd run preview
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). `npm.cmd` avoids PowerShell execution-policy restrictions that may affect `npm.ps1`; there is no need to change a machine-wide execution policy.

### macOS or Linux: rebuild from source

```bash
sh scripts/start-papersun.sh
```

Or run the reproducible steps explicitly:

```bash
npm ci
npm run check
HOST=127.0.0.1 npm run preview
```

The launchers install dependencies only when `node_modules/.package-lock.json` is missing. After changing dependency manifests, run `npm ci` yourself to restore the exact lockfile before rebuilding.

## Commands

| Command | Purpose |
| --- | --- |
| `npm ci` | Install the exact dependency tree from `package-lock.json`. |
| `npm run build` | Check TypeScript and build the static site into `dist/`. |
| `npm run preview` | Serve the existing production build with the included Node server. |
| `node scripts/serve.mjs` | Serve the included prepared build directly; installed npm dependencies are unnecessary. |
| `npm run dev` | Alias for the same production preview server; build first. |
| `npm run develop` | Start Vite with source updates for editing. Its terminal prints the development URL. |
| `npm test` | Run the geometry, story-state, and content-contract tests. |
| `npm run check:english` | Scan authored text for unintended CJK and unfinished copy markers. |
| `npm run check` | Run tests, the English guard, and the production build. |
| `npm run qa:browser` | Run the optional local Playwright browser suite; it starts and stops its own loopback server. |

`dev` deliberately serves `dist/`; use **`develop`** when editing source. After a development hot update, use a full page reload before judging interactions because the current HMR cleanup does not remove every document listener.

The preview server accepts `HOST` and `PORT` and defaults to `127.0.0.1`, accessible only from the same computer. The supplied launchers explicitly use that loopback address too. For a different local port:

```powershell
$env:HOST = "127.0.0.1"
$env:PORT = "4174"
npm.cmd run preview
```

```bash
HOST=127.0.0.1 PORT=4174 npm run preview
```

`npm run develop` also defaults to loopback. Set `HOST` for the preview server, or pass Vite's `--host` option to the editing command, only when you intentionally need a different interface.

### Optional browser QA

The source pins the Playwright library to **1.62.1** as a development dependency. Running or rebuilding the website does not require a downloaded browser. To reproduce the separate automated browser suite, install the locked dependencies and the Chromium binary, then build and run QA:

```bash
npm ci
npx playwright install chromium
npm run check
npm run qa:browser
```

On Windows PowerShell, use `npm.cmd` and `npx.cmd` if script execution policy affects the unsuffixed commands. Browser installation is a network download and is separate from `npm ci`. The QA script starts and stops its own localhost server on port 4189; do not start another preview server for it. If that port is occupied, use `npm run qa:browser -- --port=4192`. The source ZIP contains no browser executable. See [the browser QA record](docs/browser-qa.md) for the build-session environment, evidence boundaries and the reason an isolated browser was used. [Playwright's browser documentation](https://playwright.dev/docs/browsers) describes browser installation and supported environments.

## Read, explore, and mend

Scroll naturally or choose a destination from **Chapters**. The opening's **Follow the red thread** takes you to Mira's room. Chapter navigation, wheel/trackpad, native touch scrolling, and keyboard navigation remain available throughout.

| Place | Action and result |
| --- | --- |
| The Last Warm Room | Inspect the desk to learn why Mira carries scissors, a needle, and thread. |
| Three Pieces of Light | Preview A, B, or C and its destination. Previewing does not collect anything. |
| A Thread Across Roofs | Trace the route along the rooftop pins. |
| The Lantern Market | Repair the lantern to discover piece A. |
| The Wind Hill | Steady the wheel to discover B; release it to restore its motion. |
| Valley of Shadows | Lift the paper shade to discover C; lower it again if desired. |
| The Blue Bridge | Review the three shapes, their origins, and your actual discoveries. |
| Mending the Sun | Place or remove A/B/C, inspect the seams, then lift the assembled sun. |
| The First Light | Compare day and night without changing the repaired geometry. |
| A Lamp for the Night | Revisit the three discovery locations, explore chapters, or begin again. |

The story can be read in any order. You can try the worktable even if you skipped the discovery chapters; placing pieces does not silently add them to your discovery inventory. Later narrative chapters still present Mira's complete ending. **Reset scene** resets that scene's action while retaining discovered pieces. **Begin again** clears discoveries and the repair for a new telling.

Progress and the motion setting use optional browser local storage. They stay in that browser profile and origin; changing the port produces a separate origin. If storage is unavailable, the current visit still works. No progress is sent to a server.

## Comfort and access

- **Motion: Reduced** presents stable chapter states and preserves all meaningful actions. The system reduced-motion preference is also observed.
- **Sound: Off** is the default. Enable it deliberately for original, quiet procedural chimes and paper rustles. The off control immediately stops them; background tabs are silent.
- Use **Tab**, **Shift+Tab**, and **Enter** for controls. Use **Escape** to close a dialog. Dialogs return focus to their opener; chapter links focus the destination heading.
- About is available directly on wider screens and through **Chapters → About this experience** on every layout.
- The [complete text edition](public/story.html) contains all eleven chapters. When the server is running, visit `/story.html` or use the link in About. This file can also be read directly without the interactive application.

## Artwork failure and diagnostic views

If a raster scene cannot load, the app supplies that chapter's authored SVG fallback and keeps its text and controls. **Retry** attempts the image again. **View as stills** selects reduced motion. It does not repair a deliberately invalid URL.

For a reproducible failure exercise, open:

```text
http://127.0.0.1:4173/?test-assets=fail#ch-06
```

This query intentionally requests missing art files. Remove `?test-assets=fail` and reload to return to normal assets. Direct chapter hashes run from `#ch-01` through `#ch-11`. For a transition inspection, `#tr-08-09@50` opens the bridge-to-worktable midpoint; percentages run from 0 to 100.

The included preview server also accepts an explicit `qa-delay` query on image requests beneath `/art/`, for example `/art/hero.webp?qa-delay=1500`. It delays that response asynchronously by the requested milliseconds, clamped to 0–5000. Other assets and normal requests are unaffected. This is **server-injected response latency**, not a measurement or simulation of limited network bandwidth, a physical mobile network, or CPU throttling. Delayed and out-of-order image checks must be described accordingly in their evidence.

All runtime images, scripts, and fonts are served from the local build. Rebuilding source requires dependency installation; running the included prepared build does not. There is no service worker or guaranteed offline cache. If the local server stops before an image is fetched, that scene uses its fallback.

## Project guide

| Path | Contents |
| --- | --- |
| `src/story.ts` | Eleven chapters, tools, and ten transition descriptions. |
| `src/story-state.ts` | Pure scroll evaluator and safe local-state recovery. |
| `src/fragments.ts` | Shared three-piece geometry, opening radius, seams, and SVG rendering. |
| `src/carrier.ts` | One physical owner per fragment across discovery fixtures, Mira's hand carrier, and the loose worktable pieces. |
| `src/main.ts` | Semantic interface, actions, dialogs, navigation, and animation coordination. |
| `src/scene-renderer.ts`, `src/stage-props.ts` | Raster registration, live props, fallback scenes, and portrait composition. |
| `src/assets.ts`, `src/audio.ts` | Bounded scene loading and optional procedural sound. |
| `public/art/` | Eight optimized production image assets. |
| `art/` | Eight inspectable generation outcomes, exact prompts, and derivative provenance. |
| `docs/` | Architecture, rights, sources, narrative/transition ledgers, review, and actual evidence. |
| `tests/` | Geometry and deterministic-state regression tests. |
| `dist/` | Prepared static production build, including its local fonts and images. |
| `scripts/package-source.py` | Deterministic source/build ZIP packager and per-file integrity manifest. |
| `scripts/verify-handoff.mjs` | Read-only integrity, local HTTP and optional browser checks for an extracted source handoff; writes its report outside the project. |

Read [architecture](docs/architecture.md), [art provenance](docs/assets.md), [rights and attribution](docs/rights-and-attribution.md), and the [independent review](docs/review-findings.md). The final acceptance ledger and evidence record distinguish performed checks from limitations. The final source check passed ten tests, the English guard, strict TypeScript and the production build, including the rendered fragment-ownership regression. The actual check log is `docs/evidence/final-check.log`; build success alone is not a browser or visual acceptance claim.

## Troubleshooting

**The page is blank after opening `index.html` directly.** Serve the project using a launcher or the preview command. The interactive entry uses browser modules and build-generated paths; `file://` is not its runtime.

**Node or npm is not recognized.** Install Node 24 or newer with npm, then reopen the terminal. Check `node --version` and `npm.cmd --version` on Windows.

**PowerShell says running scripts is disabled.** Use the `.cmd` launcher or `npm.cmd` commands shown above.

**`npm ci` fails.** Check the reported registry/network error and keep both package manifests together. Extract into a writable local folder. Avoid running inside a ZIP viewer or a read-only folder. Do not use `--omit=optional`: the build tools use platform-specific packages.

**The server says build first.** Run `npm run build` from the folder containing `package.json`. The preview command serves `dist/` and does not build automatically.

**The port is already in use.** Stop the previous preview with Ctrl+C or choose `PORT=4174` as shown above.

**Source edits are not visible.** Rebuild before production preview, or use `npm run develop`. Perform a full reload after changing interactive code in development.

**Sound does not start.** Click Sound deliberately and check the browser tab's mute state and system volume. If the browser cannot resume audio, the interface remains off and the story continues silently.

**A scene stays in its fallback.** Remove any failure-test query, keep the complete `dist/art/` folder with the build, and use Retry. The text edition remains available.

## Delivery boundary

This is a local source handoff. The launchers, build scripts, and preview server do not deploy, publish, push Git changes, or modify an existing collection. No public release is included.

### Recreate the source ZIP

The maintainer packaging script uses Python 3.10 or newer and only its standard library. It is not needed to run the website. Finish source, documentation, evidence and build updates before packaging; do not edit files while it is collecting them.

```bash
npm ci
npm run check
python3 scripts/package-source.py --dry-run
python3 scripts/package-source.py
```

On Windows, use `npm.cmd` and `py -3` in place of `npm` and `python3` if those are the installed commands. The dry run validates the selection and computes hashes without writing files. The normal command writes `../papersun-source.zip` with one top-level `papersun/` folder and updates `docs/package-manifest.json`. The manifest lists every included file's project-relative path, byte count and SHA-256, excluding the manifest itself.

The ZIP includes current source, the lockfile, production `dist/`, all eight inspectable WebP concepts, provenance, licenses, documentation and recorded evidence. It excludes installed dependencies, caches, Git history, temporary files, original art PNG/base64 intermediates and obsolete unreferenced build outputs. Completed continuous-capture JPEG frame folders are compacted only when the same sequence has a valid retained animated WebP and a complete frame/timing JSON record. The animation and original metadata remain in the ZIP; their raw JPEG paths in that metadata identify the capture originals, which are redundant working data and may be absent from the ZIP. The integrity manifest explicitly lists these omissions. All still images, actual failure captures, JSON reports and incomplete sequences remain included. See [the evidence index](docs/evidence-index.md) for evidence validity and capture history.

Current public files must match their built copies. Entries are sorted and have fixed timestamps and normalized modes; identical input bytes with the same Python/zlib toolchain produce reproducible archive bytes. The script neither installs packages nor deploys anything.

**Actual clean extraction and rebuild passed.** The [recorded handoff verification](docs/handoff-verification.md) includes the candidate archive's exact membership/CRC and per-file integrity checks, a Node-only prepared preview before installation, fresh `npm ci`, ten passing tests plus English/TypeScript/Vite checks, and three real browser states from the rebuilt extraction with zero page/console errors. Its logs and screenshots are included in `docs/evidence/handoff-candidate/`. The accompanying `papersun-verification.md` identifies the exact delivered ZIP's checksum and second independent extraction audit; the included candidate checksum is not presented as the final checksum. H5, H6 and H8 retain their specifically documented blocked browser capabilities, so the complete contract is not globally accepted.
