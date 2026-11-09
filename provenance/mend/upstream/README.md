# MEND — Still Yours

A quiet, ten-chapter interactive story about a wooden pull-along dog, a short unfinished walk, and the small marks that make an old thing someone's own.

Meet Pip at a sunlit workbench. Look closely at a wheel that catches, find the little sun underneath, choose a repair, and return the string to its next owner. The work uses original generated art, English DOM text, a shared interaction state, and an optional Three.js scene.

## Start the packaged build

The delivery archive includes a production build in `dist/` and an optional **`dist/MEND-Offline.html`** containing its own images, fonts, styles and modules. The offline file is intended to open by double-click without an installation or network connection. Its static resource checks passed; local-file browser execution could not be verified because the available browser blocks file URLs. See the acceptance report before treating any browser path as verified.

For the normal production build, use the local server below. It needs no Node dependencies when Python 3 is available.

### Windows

1. Extract the entire ZIP into a normal folder.
2. Double-click **`START-WINDOWS.cmd`**.
3. Open **http://127.0.0.1:4173** in your browser and keep the terminal open.

The launcher tries the Windows Python launcher (`py -3`), then `python`. If Python or the packaged build is unavailable, it prints the Node commands below. It does not install software automatically. Press **Ctrl+C** in the terminal to stop the preview.

You can also start the packaged build directly:

```powershell
py -3 serve.py
```

### macOS or Linux

```sh
sh start.sh
```

The script serves the included build with `python3 serve.py` when possible. Otherwise it installs the locked Node dependencies, builds the source, and starts a local Vite preview.

Serve the project over HTTP; opening `dist/index.html` directly as a local file is not the supported way to run its module assets.

## Build or edit the source

**Node.js 24 is recommended.** Run commands from the extracted project folder, where `package.json` is located. `npm ci` requires access to the package registry unless the required packages are already cached.

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

To build and preview production assets:

```sh
npm run build
npm run preview -- --host 127.0.0.1
```

Use the address printed by Vite. The default preview port is `4173`; Vite may choose another port if that one is occupied. The explicit `--host 127.0.0.1` keeps these commands on the local computer. The package scripts' broader default host is for development QA.

| Command | Purpose |
| --- | --- |
| `npm ci` | Install the exact dependency tree from `package-lock.json` |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Run TypeScript checking and create the production build |
| `npm run preview` | Preview the production build with Vite |
| `npm test` | Run the Node state tests |
| `node scripts/make-offline.mjs` | Embed the already built app and its assets into `dist/MEND-Offline.html` |
| `node scripts/check-package.mjs` | Check chapter/DOM references, English UI source, and packaged local assets |

## How the story works

All ten chapters remain available without making a repair choice. Plan A is the clearly identified example. Chapter links allow a direct visit to any part of the story; returning to an earlier chapter does not undo the selected plan.

| Choice | What stays on Pip | What comes home alongside Pip |
| --- | --- | --- |
| **A — Keep the old wheel** | The original rear wheel, with a new sleeve around the axle | The repair card; no removed wheel |
| **B — Fit a new wheel** | A distinguishable new rear wheel | The original wheel in the return bag, and the repair card |

The chipped ear, worn paint, and painted sun remain in both branches. Inspection changes the annotation focus. Repair selection changes the subsequent object state and final record. The trial controls explicitly start or reset the short before/after demonstration; ordinary scrolling does not run the trial for you.

Without WebGL, stable generated stills preserve the scene and accurate SVG diagrams show wheel clearance, part seating and rolling over fixed ground. The before/after drawing keeps exactly one pose; the accompanying photograph is labeled as a repaired-detail reference.

Repair choice can be kept locally in the browser when storage is available. A restored choice does not restore a completed trial as new evidence. There are no accounts, telemetry endpoints, or paid runtime API requirements in the project design.

## Accessibility and fallback contract

The authored text is English, with semantic headings and native controls. Keyboard operation, a reduced-motion route, responsive mobile compositions, and chapter-specific graphics fallbacks are part of the acceptance requirements. The generated art supplies the setting; important wording, choices, and trial results remain in real DOM content.

Consult the [acceptance report](docs/ACCEPTANCE.md) for the environments and paths actually verified, observed defects, and remaining limits. The [requirements ledger](docs/REQUIREMENTS.md) describes the contract and is not a test-pass report. A successful production build or state test does not by itself verify visual continuity, accessibility, or physical devices.

## Project guide

| Location | Contents |
| --- | --- |
| `src/` | Application, scene, styles, and pure interaction state |
| `public/art/` | Optimized local scene images |
| `dist/` | Packaged production assets |
| `tests/` | Focused state and behavior tests |
| `scripts/make-offline.mjs` | Reproducible single-file packaging and resource-hash manifest |
| `serve.py` | Standard-library Python server for the packaged build |
| [Art direction](docs/ART_DIRECTION.md) | Pip's fixed identity, palette, composition, and art decisions |
| [Requirements](docs/REQUIREMENTS.md) | Ten chapters, nine handovers, and acceptance criteria |
| [Sources](docs/SOURCES.md) | Research boundaries, dependency/font licenses, and art provenance |
| [Generation log](docs/art-generation.json) | Actual prompts, tools, source files, and adoption notes |
| `docs/art-source/` | Independently inspectable generated source images |
| [Acceptance](docs/ACCEPTANCE.md) | Actual verification and limitations for this delivery |

The package is a local deliverable. No hosting account, deployment, repository push, release, or Collection change is required to run it.

## Check the download

Compare the ZIP's SHA-256 with the value supplied alongside the delivery. In PowerShell:

```powershell
Get-FileHash -Algorithm SHA256 .\MEND-Still-Yours-source.zip
```

Replace the ZIP name if your browser renamed the download. The reported hash belongs to the ZIP itself; the archive does not claim a self-referential hash.
