# SILLAGE — The shape of scent

An original, ten-chapter interactive visual essay about Brightness, Spice and Warmth. Follow one open imprint through words, time, absence, distance and memory; compose your own version and keep it as a PNG.

气味如何被描述、组合、记住，并留下余韵：十个完整英文章节、九处可逆交接、三项可编辑视觉份额，以及可下载的个人印迹。

The shapes are artistic interpretations. The website does not transmit scent or predict perfume performance. The three shares are visual parameters, not a fragrance formula.

## Run the included build / 直接运行

**Requirement: Node.js 22.18 or newer.** Unzip the complete package before starting it and keep the folders together. Windows and macOS launcher execution has not been verified; the independently rebuilt production output was tested through the managed static preview.

- **Windows:** double-click `start.cmd`.
- **macOS / Linux:** run `./start.sh` from a terminal. If the executable flag was lost during extraction, use `sh start.sh`.
- **Any platform:** run `node tools/serve.mjs --open`.

The launcher serves the included `dist/` at **http://127.0.0.1:4173/** and opens your default browser. Keep the terminal open; press **Ctrl+C** to stop. If the browser does not open automatically, enter that address yourself.

首次运行只需要 Node.js；运行已附带的 `dist/` 无需安装 npm 依赖。先完整解压，再双击 Windows 启动脚本。服务仅监听本机 `127.0.0.1`，关闭终端即停止访问。

If port 4173 is occupied, select another port:

```sh
node tools/serve.mjs --port 4174 --open
```

Open the HTTP address rather than double-clicking `dist/index.html`; module scripts and generated image export need a normal browser origin.

## Develop and rebuild / 修改与重建

From the project directory:

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

`npm ci` installs the exact locked dependencies and needs network access. Follow the development URL printed by Vite. To produce and run a fresh local build:

```sh
npm test
npm run build
node tools/serve.mjs --open
```

`npm run build` type-checks the source and writes production files to `dist/`. `npm run preview -- --host 127.0.0.1` is also available after installing dependencies.

修改源码后执行 `npm run build`，再运行启动脚本即可查看新版本。`node_modules/`、缓存和临时浏览器资料不属于交付内容。独立的启动服务器使用 Node.js 内置模块，无额外依赖。

## Experience / 使用说明

- **Index** jumps to any chapter. Normal scrolling, reverse scrolling and keyboard navigation remain available.
- **Motion** switches to a reduced-motion presentation; the operating-system preference is also respected.
- **Sound** is optional and initially off. The work remains understandable while muted.
- Chapter 5 removes a component only for its comparison. It does not alter your personal composition.
- Chapter 7 offers a memory-based title suggestion. A title you have written is preserved when your memory choice changes.
- Chapter 9 accepts integer shares totaling 100. Editing one share proportionally redistributes the other two; presets and reset are provided.
- The handoff into Chapter 9 also contains three live share controls. They edit the same composition; **Continue composing** opens the complete editor.
- **Preview the print** generates the current 2400 × 1600 PNG and displays it on the page. **Keep your impression** starts the browser download. Personal titles retain the language you enter. Editing after a preview invalidates that preview so it cannot be mistaken for the latest composition.

Your composition is stored in this browser's local storage when available. It is not uploaded. Private browsing, blocked storage, a different browser or a different localhost port may use a separate or temporary saved composition.

本作品默认静音，可随时降低动态。个人份额与标题在浏览器允许时保存在本机；没有账户、数据库、遥测或运行时付费 API。导出图片由浏览器本地生成。更换浏览器或端口时，浏览器可能使用独立的本地保存记录。

## Package map / 文件结构

| Path | Purpose |
| --- | --- |
| `dist/` | Included production website, ready for the launchers |
| `src/main.ts`, `src/layout.ts`, `src/style.css`, `src/bridge-controls.css` | Application behavior, ten chapter layouts and responsive styling |
| `src/content.ts` | Consistent English narration and terminology |
| `src/state.ts` | Integer share allocation, personal state and safe persistence |
| `src/artwork.ts` | Deterministic SVG contours, neutral hollow and material mapping |
| `src/transitions.ts` | Nine scroll-driven, directly evaluable transitions |
| `src/export.ts`, `src/audio.ts` | Local PNG export and optional original ambient audio |
| `public/art/` | Bundled production art and responsive variants |
| `tests/` | Repeatable engineering checks; see the test summary for scope |
| `docs/REQUIREMENTS.md`, `docs/DIRECTION.md` | Requirement ledger and visual direction |
| `docs/art-generation.json`, `docs/concepts/`, `docs/art-originals/` | Actual generation provenance, candidate studies and original art |
| `docs/SOURCES.md`, `docs/licenses/` | Sources, resource notes and third-party license texts |
| `docs/TEST-REPORT.md`, `docs/REQUIREMENTS.md`, `docs/PROGRESS.md` | Observed verification, acceptance criteria and remaining gates |
| `docs/VISUAL-REVIEW.md`, `docs/evidence/`, `docs/g6/` | Independent visual decision, browser observations and clean-build reproduction records |
| `tools/serve.mjs`, `start.cmd`, `start.sh` | Local production server and launchers |

## Delivery scope and verification / 交付范围与验收

This is a **local runnable source package**. These commands do not deploy, publish, push to a repository, create a release or add the work to an existing collection.

The art record contains **12 genuine AI-generated originals**. The production art directory contains **14 WebP assets totaling 1,415,236 bytes (about 1.35 MiB)**, including responsive derivatives. Derivatives are not counted as additional generated originals; the byte total is an asset inventory, not a page-load performance result.

The final source and independently extracted clean build each passed **78/78 tests**, including all **5,151** integer share triples and **92,718** redistribution edits. The clean build matched all **36 source/resource files and 28 production files**. Its browser path reached all ten chapters through the real Index, checked visible image readiness and returned to the Hero; an actual reload preserved edited shares and a custom title.

Browser inspection covered all ten chapters at **1440 × 900** and **390 × 844**, plus nine transitions at five target progress values in both layouts: **90 observed states**. Another **27 responsive states** covered narrow, tablet, large, breakpoint and short-landscape viewports. The final mobile TR09 label collision was corrected and recaptured before the independent visual **SHIP** decision. Keyboard controls, real bridge edits, zero channels, memory/custom titles, history, persistence, manual Still, PNG preview/invalidation and image/font failure cases were exercised. The [verification report](docs/TEST-REPORT.md) records the exact scope and evidence, including the 27 additional native control checks.

Browser verification produced the **2400 × 1600 PNG preview**. The managed test browser rejected Blob/Data download URLs, so the final download to disk remains **unverified**. No alternate protocol or bypass was used. Image generation and download acceptance are recorded separately.

The full G5 acceptance remains partial. Native zoom shortcuts did not change the observed viewport/DPR, so zoom remains unverified. OS-level reduced-motion preference changes, physical devices, performance/Lighthouse, stress/heap behavior and Windows/macOS launcher execution are also unverified. Explicit same-page retry recovery was not isolated because restoring fixture files caused the preview to reload. Resources were warm/preloaded, not a cold-load benchmark. Simulated CSS viewports do not certify a physical phone, 4K display or another browser.

交付范围为可本地运行的源码及正式资源。真实浏览器验收范围、已修复问题及未覆盖环境以随附验收记录为准；视口模拟不等同于真实手机或真实 4K 硬件。艺术画面不构成科学嗅觉模拟。

浏览器已实际生成 2400 × 1600 的 PNG 预览；受测试浏览器对 Blob/Data 下载地址的限制，最终文件落盘未在该环境中获验证。图片生成与下载验收在报告中分别记录。
