# FRAME

**Let stillness breathe.**

An original digital stop-motion story about Boop, a small block, and getting something almost right. Ten chapters unfold the performance; a compact editing table lets you change spacing and leave a little more time for a second look.

FRAME is digital artwork. Its character and scenes are generated and rendered for this project; it is not a record of physical clay photography.

## Open the portable version

Open the top-level **`FRAME.html`** in a browser. This approximately **2.68 MB** file contains the production application with its image and font bytes embedded; it needs no npm installation or Node.js server. It is separate from the shorter film exported in chapter 10.

Direct `file://` opening on Windows has not been exercised: the available browser environment did not permit that local-file check, and no Windows machine was used. The included local server provides another way to open the production build.

## Run the included build with a local server

Requires **Node.js 24**. The complete production build belongs in `dist/` in the delivered ZIP.

On Windows, extract the entire ZIP, then double-click **`Start-Frame.cmd`**. Leave its console open while using the site. Close the console or press `Ctrl+C` when finished.

On any supported system:

```sh
node scripts/serve-built.mjs
```

Open **http://127.0.0.1:4173/**. The server binds only to the local machine. Serving the included build needs no dependency installation and works offline once Node.js is installed.

If port 4173 is already in use:

```sh
node scripts/serve-built.mjs --port 4174
```

Windows instructions are also available in [START-HERE.zh-CN.md](START-HERE.zh-CN.md).

## Develop or rebuild

Requires Node.js 24 and npm. The first dependency installation requires network access. Package versions are fixed by `package-lock.json`; use `npm ci` to reproduce them.

```sh
npm ci
npm run dev
```

Vite prints the development address. To validate, build, and preview:

```sh
npm test
npm run build
npm run preview
```

`npm run build` writes the production site to `dist/`, regenerates the self-contained `FRAME.html` and its `QA-PREVIEW.html` test harness, and records the portable artifact's hash in `docs/offline-build.json`. The simple server above can serve the directory build without npm dependencies. Keep the entire `dist/` directory together with its assets.

## Shape the performance

- **Spacing:** choose Even, Slow then quick, or Quick then slow. The six push frames share the same starting point, ending point, and beat rate; their intermediate positions and poses differ.
- **Holds:** add 0–12 beats before the push at frame 06 and at the second look at frame 18. An added beat repeats the existing frame for 1/12 second.
- **Playback:** step through 24 distinct story frames, play the current rhythm, pause, or replay. Changes during playback pause the sequence on a valid frame.
- **Take it with you:** chapter 10 exports a PNG storyboard and an HTML film containing its frames and playback table. Both must describe the current edited version.

The base sequence contains 36 playback beats: the 24 story frames plus six extra opening beats and six extra closing beats. At 12 beats per second it lasts 3 seconds. The two optional holds can extend it to 5 seconds. Story frames and repeated playback beats are intentionally different concepts.

## Accessibility and input

The site is intended to work with pointer, touch, and keyboard. Controls have visible labels and focus states. Reduced-motion preferences retain the complete ten-chapter story and frame controls. Playback is user-initiated; scrolling does not commit edits. Sound is not needed to understand the task.

All authored website text and fixed export text are English. The Chinese launch guide is documentation outside the website.

## Project guide

| Location | Purpose |
| --- | --- |
| `src/` | Application, scene, deterministic frame data, and playback logic |
| `public/` | Bundled production assets |
| `dist/` | Included production build |
| `FRAME.html` | Self-contained production application |
| `scripts/serve-built.mjs` | Dependency-free local server for the included build |
| `scripts/package-source.py` | Standard-library Python packager; excludes dependencies and private or temporary files |
| `tests/` | Functional tests |
| `docs/requirements.md` | Ten chapters, nine transitions, six Hero states, and acceptance baseline |
| `docs/sources.md` | Verified primary references and their limits |
| `docs/licenses.md` | Asset provenance and dependency license inventory |
| `docs/image-prompts.json` | Actual generation prompt record; final image provenance accompanies delivery |
| `evidence/` | Selected actual validation evidence included with delivery |

## Validation status

The final frozen revision passed **47/47 tests** in both the source project and a fresh ZIP extraction on Linux with Node 24.22.1 and npm 11.9.0. A clean rebuild reproduced FRAME.html, the QA harness, all **136 distribution files**, and offline metadata byte for byte. HTTP checks passed before dependency installation; **126 production images**, ten generated references, and retained notices were verified. See [reproduction results](docs/reproduction.json) and [the command log](evidence/reproduction.log).

Chrome observations cover **90 latest chapter/viewport states with zero overflow or failed images**, **90 desktop/mobile handoff samples ready on their latest observation**, and nine final mobile checks. Earlier overflow and seven transient loading observations remain in the [raw evidence](evidence/frame-browser-evidence.json). The browser downloaded the **1440×1800, 24-cell PNG storyboard**. A measured 1,016.4ms RAF-delay pause defect was fixed: actual UI actions now complete both the **three-second Hero** and **five-second edited take** at frame 24. The standalone five-second HTML sample also completed over HTTP. See [completion records](evidence/frame-playback-completed.json), [desktop Hero](evidence/frame-desktop-hero-final.jpg), [editor completion](evidence/frame-editor-complete-final.jpg), and [film completion](evidence/frame-film-finished-final.jpg). These results do not measure FPS or prove presentation of every intermediate frame.

HTML Open/Download links are present, but cloud automation timed out waiting for the HTML file transfer, including from a top-level page; successful HTML download remains unverified. Follow-up Premiere pause/replay automation also timed out, leaving the complete browser pause/resume/replay journey unverified despite unit coverage. CSS viewport checks are not physical-device or native-zoom tests. Windows, Safari, direct file-protocol opening, CPU throttling, complete keyboard coverage, and measured contrast remain unverified. The [Chinese delivery report](docs/FRAME-delivery-report.zh-CN.md) and [delivery limitations](docs/delivery-limitations.md) describe these boundaries; the requirement ledger remains a planning baseline.

## Distribution notes

The source package should contain the production build, source, dependency manifest and lockfile, eight brief-assigned concept results plus two interface studies, asset records, and selected verification evidence. It must not contain `node_modules`, local credentials, browser profiles, or development caches. No hosted deployment is necessary to run it.

To recreate the ZIP after building and verifying, run `python scripts/package-source.py` with Python 3.11 or newer. The script writes `../FRAME-source.zip` from explicit project roots. Run it again after any final documentation or evidence changes; it does not run the build or tests itself.

See [docs/licenses.md](docs/licenses.md) for third-party attribution and [docs/sources.md](docs/sources.md) for research references. A reference is not an endorsement or permission to reuse the reference site's characters or media.
