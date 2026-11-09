# SENTE

**Between moves.** A playable short story about the space between Go stones.

Ten chapters, nine reversible chapter transitions, and three small decisions on a real 7 × 7 practice board. The visual language is warm wood, matte black and softly textured white stones, quiet type, and the empty points that hold a position together. All website content is in English.

This delivery includes the source, locked dependencies, generated art studies, optimized runtime assets, a prebuilt `dist/`, and a dependency-free local server. It does not require an account, a database, an API key, or a paid runtime service.

## Open the included build

**Requirement: Node.js 24 or newer.** The completed build runs without downloading npm packages.

On Windows, extract the ZIP completely, then double-click **`START-SENTE.cmd`**. Keep its window open and visit the address it prints, normally:

```text
http://127.0.0.1:4173/
```

Windows 快速开始：完整解压 ZIP，确认已安装 Node.js 24 或更新版本，双击 `START-SENTE.cmd`，在浏览器打开窗口中显示的本地地址。运行已附带的网页不需要执行 `npm install`；按 Ctrl+C 停止服务。

From a terminal in the extracted project folder:

```sh
node scripts/serve.mjs
```

The equivalent npm command also uses only Node's built-in modules:

```sh
npm start
```

An optional PowerShell launcher is included:

```powershell
.\START-SENTE.ps1
.\START-SENTE.ps1 -Port 4174 -OpenBrowser
```

The script does not change your PowerShell execution policy. If your policy blocks it, use `START-SENTE.cmd` or the Node command instead. The launchers are supplied as Windows conveniences; consult the acceptance record for which operating systems were actually exercised.

Open the site through this local HTTP server. Opening `dist/index.html` directly as a `file:` URL will not provide the module-loading behavior of a web server.

## Build or edit the source

Dependency installation needs access to the npm registry. The lockfile pins the dependency graph. Serving the included build afterward requires no network connection.

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

Use the address printed by Vite. For validation and a fresh production build:

```sh
npm test
npm run check
npm run build
npm run preview
```

`npm test` runs the TypeScript tests with Node 24's built-in test runner. `npm run check` type-checks the source; `npm run build` repeats the type check before building with Vite. `npm run preview` needs the installed Vite dependency. `npm start` is the package-free alternative for an existing `dist/`.

The site uses Vite, TypeScript, and Lenis. The boards are precise SVG with semantic DOM controls; no WebGL or Three.js runtime is required. Fonts are served from the project, with system fallbacks.

## What is inside the story

| Chapter | Relationship and interaction |
| --- | --- |
| 01 · Before a move | Place one black stone on an empty board, inspect its liberties, and lift it again. |
| 02 · Room to breathe | Compare a stone at the centre, edge, and corner; the boundary changes its actual neighbours. |
| 03 · Connected, not just close | Inspect a connected L-shaped string and a separate diagonal stone; shared liberties are counted once. |
| 04 · The last liberty | P1: capture the white stone with one legal black move. |
| 05 · Two quiet spaces | Try White in either true eye; an illegal move leaves the exact board unchanged. |
| 06 · A small bridge | P2: connect two black strings in one move without capturing. |
| 07 · The next move matters | Replay two independent variations from the same setup, including a stated white reply. |
| 08 · Letting one go | P3: keep the marked black string after its published white response, then compare consequences. |
| 09 · Not the same again | Attempt an immediate ko recapture and compare the complete repeated positions. |
| 10 · Leave with a little more | Review real attempts and download a self-contained SVG observation note. |

Chapter navigation and scrolling do not play moves. Puzzles retain their state when you scroll away or return to the beginning. Each independent setup is labelled; setting up another example is never presented as a legal continuation of the preceding board.

### Controls

- Select an intersection with a mouse or touch. A coordinate selector provides an alternative for each puzzle.
- Focus a board, use the arrow keys to move between points, and press Enter or Space to choose. Home and End move to the ends of the current row.
- Use **Undo** to return one displayed step and **Reset position** to return to the initial setup. Both preserve the attempt history.
- In P3, turn off automatic replies to inspect the black move first, then choose **Show the white reply**.
- Open **Chapters** to jump directly or choose reduced motion. The system motion preference is respected by default.
- Stone sound is synthesized locally and starts **off**. It is optional; every outcome also has visible text and board evidence.

## Rules and scope

Coordinates run **A–G left to right and 1–7 bottom to top**. The edges are real boundaries. The immutable engine checks occupancy, captures adjacent opponent strings, checks the new string's liberties, and then rejects immediate board repetition. Animation does not decide legality.

The rules implementation covers these finite teaching examples and **simple ko**. It does not implement whole-game scoring, territory adjudication, passing, superko, tournament play, ranks, or an AI opponent. P3's white response is a published teaching script. Its goal does not imply that saving two stones is always worth more than capturing one.

Rule background and an independent enumeration of the puzzle outcomes are recorded in [research notes](docs/research.md). The tests cover all 124 empty first moves across the three puzzles, the exact resulting captures and replies, shared liberties, suicide, ko, undo, branch isolation, observation persistence, and SVG records. This describes test coverage; it is not a substitute for the browser evidence in the [acceptance record](docs/acceptance.md).

## Your observations stay local

The browser stores coordinates, which steps you actually viewed, and display preferences in local storage. It does not upload your play or store a fabricated score. Saved positions are reconstructed from the original puzzle data and moves; stored board arrays and claimed results are not trusted.

The observation note retains legal and invalid attempts in order. If you have not viewed a P3 white reply, the note says so and exports the position you did view. An unplayed exercise is labelled **Example**. Undo and reset do not silently delete earlier attempts. Clearing this site's browser storage clears the local record.

There is no telemetry or external runtime API. The footer's optional source links open external reference websites only if you follow them.

## Art, assets, and documentation

The art folder contains **nine actual generated images**: the eight required independent studies plus one additional wood-material study. It includes three different Hero directions, a refined desktop environment, an independently composed mobile study, two later-chapter studies, the transition midpoint, and the additional material. The PNG studies occupy approximately **21.77 MiB** uncompressed; they are provided for inspection and further work, and the page does not download them all.

Runtime images and fonts are optimized and self-hosted: two WebP assets and two WOFF2 font files total approximately **0.21 MB**, plus the JavaScript/CSS bundle and small SVG assets. These asset sizes are not a claim about measured loading time, frame rate, or device performance. All official grid lines, stones, coordinates, liberties, and puzzle positions come from exact code and rule data rather than generated image arrangements.

| Location | Contents |
| --- | --- |
| `src/engine.ts`, `src/puzzles.ts` | Immutable rules and exact independent setups. |
| `src/session.ts`, `src/note.ts` | Truthful local observations and SVG export. |
| `src/board-view.ts` | Precise accessible board presentation. |
| `src/story.ts`, `src/main.ts`, `src/style.css` | Ten chapters, real controls, and responsive layout. |
| `src/motion.ts`, `src/sound.ts` | Coordinated Lenis motion and optional synthesized sound. |
| `public/` | Runtime imagery, fonts, and favicon. |
| `art/` | Generated images, [art direction](art/ART-DIRECTION.md), and [generation log](art/generation-log.json). |
| `tests/` | Reproducible engine, session, export, and independent rule checks. |
| `docs/` | Research, third-party licenses, progress, and [acceptance evidence](docs/acceptance.md). |
| `dist/` | Included production build. |
| `scripts/serve.mjs` | Dependency-free delivery server. |

The generation log records actual prompts, files, and selection decisions. No unreported image seeds or model settings are invented. Third-party font and Lenis license texts are included under `docs/licenses/`; generated artwork is documented separately. See the acceptance record for the actual screenshots, environments, verified checks, and remaining limitations. Browser simulation does not claim testing on physical phones or 4K hardware.

## Local server options

The server binds to loopback by default. It serves only files inside its selected static directory, rejects traversal, returns **404** for missing assets, and does not replace missing files with an HTML page.

```sh
node scripts/serve.mjs --port 4174
node scripts/serve.mjs --dir dist --base /subpath/ --port 4175
```

The second command mounts the same build at `http://127.0.0.1:4175/subpath/`. The relative Vite asset base allows the build to work at that prefix. `--port` takes priority over the `PORT` environment variable. `--host` changes the bind address only when explicitly supplied.

For the included browser QA harness, enable its separate endpoint explicitly:

```sh
node scripts/serve.mjs --qa
node scripts/serve.mjs --qa --base /subpath/ --port 4175
```

The harness is served at `/__qa.html` only with `--qa`; otherwise that URL returns 404. For a subpath run, open `/__qa.html?base=/subpath/` so the harness uses the mounted page. The ordinary website does not need this endpoint. Use `node scripts/serve.mjs --help` for all options.

## Delivery boundary

This project is delivered for local use and further editing. It has not been deployed, published, pushed to a repository, or added to an existing collection as part of this delivery. There is no deployment step hidden in a launcher, build command, or preview server.
