# IMAGO — Wings within

An illustrated natural history of one monarch butterfly, told through ten chapters, close observation, and the quiet continuity of a single branch.

![A jade-green monarch chrysalis suspended beneath a branch.](public/art/hero-desktop-768.webp)

The experience begins with a chrysalis, looks back to an egg beneath a milkweed leaf, and follows feeding, molting, pupation, emergence, wing expansion, and departure. All website copy is in English. The imagery is original AI-created **artistic reconstruction**, informed by the biological sources in [the field notes](docs/biology.md); it is not a photographic record of a measured individual.

## Windows 快速启动

1. **先完整解压 ZIP**，不要直接在压缩包内运行。文件夹中应能看到 `package.json`、`package-lock.json`、`src` 和 `public`。
2. 安装 **Node.js 22.12 或更新版本**，并确保安装时包含 npm。安装后重新打开终端。
3. 双击 **`start-imago.cmd`**，启动开发预览。脚本会切换到项目目录；如果尚无 `node_modules`，先执行 `npm ci`。
4. 在浏览器打开终端实际显示的本地地址。脚本不会自动打开浏览器。
5. 要检查正式构建，双击 **`build-preview.cmd`**：它会先构建，再启动生产预览。结束时按 **Ctrl+C**。

**首次安装依赖需要联网。** 图片、字体和网站功能均由项目本地文件提供；依赖安装完成后，本地运行不需要账号、API Key 或外部运行服务。不要双击 `index.html` 或 `dist/index.html` 打开，必须使用本地 HTTP 服务。

如果依赖安装被中断，或更新源码后依赖发生变化，在项目目录打开终端执行 `npm ci`，再运行脚本。脚本只在依赖目录不存在时自动安装，不会每次启动都重装。

## Requirements

- Node.js **22.12 or later**, with npm.
- A current browser capable of ES modules and the modern DOM APIs used by the site.
- Network access for the first `npm ci`, or a correctly configured local npm cache containing every locked dependency.

The application has no account system, database, analytics SDK, paid runtime service, or external model API. Its biological source links are ordinary outbound links; opening those sources requires a network connection.

## Run from a terminal

Open a terminal in the extracted project directory:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Stop the server with **Ctrl+C**.

For a fresh production build and preview:

```sh
npm run build
npm run preview
```

The Windows scripts pass `--host 127.0.0.1` so their preview stays on the local computer. The package scripts remain configurable for other development environments.

| Command | Purpose |
| --- | --- |
| `npm ci` | Install the exact dependency graph in `package-lock.json`. |
| `npm run dev` | Start Vite with live reload for source work. |
| `npm run build` | Check TypeScript, then write the production site to `dist/`. |
| `npm run preview` | Serve the existing `dist/` build; this command does not rebuild it. |
| `npm test` | Run the pure narrative-geometry and observation-state tests. |

### View the included production files

The delivery includes `dist/`. Serve that directory with an HTTP static server. After `npm ci`, `npm run preview` is the supplied Node-based option. If Python 3 is already installed, this alternative needs no npm installation merely to view the bundled build:

```sh
python -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Then open `http://127.0.0.1:4173/`. Editing `src/` does not update `dist/`; run `npm run build` before previewing source changes.

## Explore the work

| Chapter | Observation |
| --- | --- |
| 01 · A name still folded | A complete chrysalis and its place among the four life stages. |
| 02 · A small light beneath a leaf | The same egg in its leaf context and in a closer view. |
| 03 · A leaf, changed | A pale hatchling compared with a later, striped third instar. |
| 04 · Outgrowing the old shape | A molt and a five-instar study with illustrative, nonmeasured sizes. |
| 05 · The weight of a thread | The hanging J, a forming pupa, and the settled chrysalis. |
| 06 · A quiet reconstruction | An outward surface alongside a clearly labeled developmental schematic. |
| 07 · Color arrives first | Early, middle, and late chrysalis observations; comparison, reveal, and reset controls. |
| 08 · Leaving a former shape | Four separate emergence views with explicit supporting contacts. |
| 09 · Open, then ready | Folded, expanding, and open wings; forewing, hindwing, and body close views. |
| 10 · Leave the sky to it | An optional departure, an immediate final view, and links back to earlier stages. |

Scrolling changes the narrative viewpoint, not the animal’s developmental speed. Chapter anchors, the chapter menu, and ordinary browser scrolling remain available throughout. Phase comparisons show separate moments; they do not simulate a continuously adjustable biological age.

### Controls and preferences

- **Motion: auto** follows the operating system’s reduced-motion preference. The header control cycles through automatic, still, and full motion. Still mode retains the chapters and observation results while using native scrolling and static views.
- **Keyboard:** Tab reaches controls. Arrow keys and Home/End move through grouped stage choices. Escape closes the chapter dialog. The comparison reveal is a native range input.
- **Observation memory:** explicit choices are stored in browser `sessionStorage` for this visit. Blocked or unavailable storage falls back to in-memory state. Scrolling does not submit observation changes.
- **Sound:** the optional composed air soundscape starts off and requires a button action. It pauses when the page is hidden. No sound is needed to understand any chapter.
- **Image recovery:** a small embedded still belongs to each image’s exact stage. The app retains the relevant view during loading or failure and offers a retry for the currently visible failed image where appropriate.

## Architecture

The site uses **Vite + TypeScript + Lenis**, with semantic HTML, local raster artwork, and a small SVG developmental schematic. It does not require WebGL.

| File or directory | Responsibility |
| --- | --- |
| `index.html` | English document metadata, critical image preload, and the application entry. |
| `src/content.ts` | Ten chapters, nine handoffs, narrative copy, and real DOM controls. |
| `src/engine.ts` | One coordinated animation clock, Lenis integration, cached narrative geometry, anchors, history, motion preferences, and lifecycle cleanup. |
| `src/state.ts` | Whitelisted observation values, validation, defaults, and optional session persistence. |
| `src/widgets.ts` | Stage choices, image selection, comparisons, keyboard behavior, and the explicit departure action. |
| `src/media.ts` | Responsive art paths, target-specific embedded fallbacks, and current-target recovery. |
| `src/media-manifest.json` | Image dimensions and small embedded stills. |
| `src/main.ts` | Assembly, menu, optional Hero layers, revisit behavior, and composed ambient audio. |
| `src/style.css` | Typography, layouts, responsive compositions, motion, and focus treatment. |
| `public/art/` | Locally shipped artwork and responsive derivatives. |
| `tests/` | Pure state and narrative evaluation checks. |
| `dist/` | Included production output, including the bundled fonts and image resources. |
| `docs/` | Biological sources, design decisions, requirements, artwork provenance, and original dependency/font notices. |

The narrative evaluator derives a frame from the current position and measured layout. It does not depend on visiting earlier chapters first. Observation actions remain independent from that progress. Separate prepared image elements prevent a late resource request from replacing a newly selected stage.

Lenis has one manual animation-frame owner. Reduced-motion mode uses native scrolling. The design avoids morphing incompatible animal bodies and instead uses authored stage views with explicit chronology.

### Assets and fonts

The exact generation prompts and returned-image records are in [image-generation.json](docs/image-generation.json). [The art review](docs/art-review.md) records visual decisions and limitations. The three initial Hero directions and later production resources are retained as local artwork; candidate count and final usage should be read from these records rather than inferred from filenames.

Cormorant Garamond and Inter are imported from the locked Fontsource packages. Production builds bundle the selected font files locally in `dist/assets/`; the website does not request Google Fonts or another external font service. Original notices are included in [docs/licenses/](docs/licenses/), with attribution and redistribution details in [sources-and-licenses.md](docs/sources-and-licenses.md).

### Static hosting and subpaths

`vite.config.ts` sets `base: './'`. Image URLs are derived from Vite’s base value, and chapter navigation uses fragment identifiers rather than application routes. A static server can serve the contents of `dist/` at the site root or beneath a directory such as `/imago/`, provided all relative asset paths remain intact. Use a directory URL ending in `/` when serving beneath a subpath.

There is no deployment command in the project. Serving the files locally does not publish or push them anywhere.

## Verification scope

Run both the source checks and a production build after code changes:

```sh
npm test
npm run build
```

The automated tests exercise validation, optional-storage failure, deterministic narrative evaluation, chapter ownership, reverse traversal, direct evaluation, and geometry boundary conditions. They do **not** certify rendered composition, actual input behavior, animal anatomy, frame rate, physical-device support, or the full browser matrix.

The final extracted runtime passed 31 tests, a production rebuild with 266 matching file hashes, and 55 settled browser checkpoints at each of 1440×900 and 390×844. Ten chapter-menu visits and departure/reset/return were also observed beneath a `/nested/` subpath. These are warm-cache Chrome/Linux checks; the Windows launchers were inspected, not executed on Windows.

[verification.md](docs/verification.md) records the evidence, earlier failures, recoveries, and unverified conditions. [g6-reproduction.md](docs/g6-reproduction.md) explains the independent archive reproduction. [requirements.md](docs/requirements.md) maps the requested chapters, transitions, interactions, and engineering checks. Neither a test count nor this README should be interpreted as a claim that an unlisted device or browser was tested.

## Project notes

- [Product contract](PRODUCT.md)
- [Design system](DESIGN.md)
- [Surface direction](docs/surface.md)
- [Biology and English copy](docs/biology.md)
- [Requirements and evidence map](docs/requirements.md)
- [Verification and known limits](docs/verification.md)
- [Independent archive reproduction](docs/g6-reproduction.md)
- [Artwork provenance](docs/image-generation.json)
- [Sources and licenses](docs/sources-and-licenses.md)

