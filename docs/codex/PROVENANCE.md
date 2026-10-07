> Supplied design/source record, integrated into the Collection on 2026-10-07. Original `src/` paths refer to `experiences/codex/src/`, runtime `public/` assets to `public/codex/`, and concept/export records to `provenance/codex/`. Current lifecycle and path changes are in [INTEGRATION.md](INTEGRATION.md); current checks are in [ACCEPTANCE.md](ACCEPTANCE.md).

# 素材、生成记录与许可 / Provenance

记录日期：2026-10-07。路径均相对于项目根目录。

本文件区分运行时素材、视觉开发关键帧、程序化模型、字体和软件依赖。生成提示词中的原始工作区路径仅为追溯记录，不是运行时资源依赖。

## 1. 运行时图像与材质

| 文件 | 来源与制作方式 | 用途与记录 |
| --- | --- | --- |
| `assets/ai-final/volume-still.png` | OpenAI 内置 imagegen；从选定首幕关键帧生成独立书体素材，移除网页文字与导航，保留书体自身的标题 | 首幕摄影式书体源图。提示词和源生成标识见 [root-concepts-provenance.json](../../provenance/codex/art-direction/root-concepts-provenance.json) 中 `hero_asset` |
| `assets/ai-final/cloth-albedo.png` | OpenAI 内置 imagegen；独立生成的近黑色细织书布表面 | 实时封面材质源图。尺寸、提示词与筛选说明见 [material-assets-provenance.json](../../provenance/codex/art-direction/material-assets-provenance.json) |
| `assets/ai-final/marbled-endpaper.png` | OpenAI 内置 imagegen；由选定 MARBLE 关键帧编辑为无文字、无 UI 的独立纹样图 | Canvas 纹样变化和实时环衬的共同源图。详见同一素材记录 |
| `assets/ai-final/paper-albedo.png` | OpenAI 内置 imagegen；独立生成的平整象牙色纸张纤维表面 | 折叠纸张的材质源图；提示词与导出方式见 [paper-material-provenance.json](../../provenance/codex/art-direction/paper-material-provenance.json) |
| `public/assets/volume-still.webp` | 从上述书体 PNG 源图导出的 WebP | 页面加载的书体派生文件 |
| `public/textures/cloth-albedo.webp` | 从上述书布 PNG 源图导出的 WebP | 页面加载的书布派生文件 |
| `public/textures/marbled-endpaper.webp` | 从上述环衬 PNG 源图导出的 WebP | 页面加载的环衬派生文件 |
| `public/textures/paper-albedo.webp` | 从上述纸张 PNG 源图导出的 1024 × 1024 WebP | 页面加载的纸张派生文件；导出记录为 ffmpeg WebP quality 95 |

书布源图为 1254 × 1254；环衬源图为 1536 × 1024，实际输出尺寸以文件和记录为准。书布提示词要求可平铺，但生成过程本身不构成数学上的无缝保证；纹理比例、滤波和接缝效果须按最终渲染检查。

以上图片标记为 **AI-generated**，不表示真实馆藏摄影、某位装帧师作品的记录或科学测量图。生成过程不依赖用户运行时提供 API key。

## 2. Visual Bible：十张选定关键帧

这些关键帧在编写页面之前用于构图、材质、文字层级和场景转场的视觉开发。它们保留网页文字是为了设计比对；最终页面的真实导航、文字和控件由 DOM 实现。

| 场景 | 选定文件 | 提示词与筛选记录 |
| --- | --- | --- |
| I — THE VOLUME | `art-direction/01-volume-concept.png` | [root-concepts-provenance.json](../../provenance/codex/art-direction/root-concepts-provenance.json) |
| II — SHEET | `art-direction/02-sheet-final.png` | [sheet-spine-prompts.json](../../provenance/codex/art-direction/sheet-spine-prompts.json) |
| III — FOLD | `art-direction/03-fold-concept.png` | [root-concepts-provenance.json](../../provenance/codex/art-direction/root-concepts-provenance.json) |
| IV — GATHER | `art-direction/04-gather-concept.png` | [gather-codex-prompts.json](../../provenance/codex/art-direction/gather-codex-prompts.json) |
| V — SEW | `art-direction/05-sew-concept.png` | [section-concepts-provenance.json](../../provenance/codex/art-direction/section-concepts-provenance.json) |
| VI — SPINE | `art-direction/06-spine-final.png` | [sheet-spine-prompts.json](../../provenance/codex/art-direction/sheet-spine-prompts.json) |
| VII — MARBLE | `art-direction/07-marble-concept.png` | [section-concepts-provenance.json](../../provenance/codex/art-direction/section-concepts-provenance.json) |
| VIII — CASE | `art-direction/08-case-concept.png` | [section-concepts-provenance.json](../../provenance/codex/art-direction/section-concepts-provenance.json) |
| IX — IMPRESSION | `art-direction/09-impression-concept.png` | [root-concepts-provenance.json](../../provenance/codex/art-direction/root-concepts-provenance.json) |
| X — CODEX | `art-direction/10-codex-concept.png` | [gather-codex-prompts.json](../../provenance/codex/art-direction/gather-codex-prompts.json) |

全部由 OpenAI 内置 imagegen 生成或编辑。统一采用暖象牙色、博物馆黑、细织书布、克制金饰和衬纸纹样。CASE 初稿因文字与封板碰撞被淘汰，选定文件为修订稿；失败图像和其他未选版本不进入交付包。其余取舍见 [DESIGN.md](DESIGN.md)。

完整视觉方向、选帧标准与实现分工见 [VISUAL-BIBLE.md](../../provenance/codex/art-direction/VISUAL-BIBLE.md)。

## 3. 模型、图形与文字

纸张、折线、书帖、缝线、承托带、书脊、封板和字印等几何由项目 `src/` 中的原始实现创建。没有引入第三方 glTF/GLB 模型库或商用模型资产。

模型几何源码为 `src/book.js` 和 `src/model/paper.js`；[book-spec.json](../../public/codex/models/book-spec.json) 保存显示单位下的尺寸、折帖数量、缝订站点、材料来源和运动契约。它是可追溯的程序化模型规格，不是来自外部作者的成品网格。

[models/codex-complete.glb](../../provenance/codex/models/codex-complete.glb) 是从同一源码导出的 glTF 2.0 闭合完成态静态快照。纹理与缓冲均内嵌；运行时定制的金箔／凹印材质转为标准 PBR 贴图。它没有动画轨道，网站也不加载此快照。[模型说明](../../provenance/codex/models/README.md) 记录移植限制，[导出元数据](../../provenance/codex/models/codex-complete.meta.json) 记录 SHA-256、源文件哈希、材质转换和实际回载验证。该模型包含本项目 AI 材质与程序化图形，不是另外购买或下载的第三方模型。

纸面纹理、微小起伏、材质响应、印字映射和控制图形由项目代码或上述本地源素材生成。外部网页没有被截成背景或整页交互截图。关于几何简化和材料处理，见 [ARCHITECTURE.md](ARCHITECTURE.md) 与 [CRAFT-SOURCES.md](CRAFT-SOURCES.md)。

## 4. 字体

| 字体与文件 | 许可 | 详细来源 |
| --- | --- | --- |
| Cormorant Garamond Roman，`public/fonts/cormorant-garamond-latin-variable.woff2` | SIL Open Font License 1.1 | [Cormorant-Garamond-OFL.txt](../../public/codex/licenses/Cormorant-Garamond-OFL.txt) |
| Cormorant Garamond Italic，`public/fonts/cormorant-garamond-italic-latin-variable.woff2` | SIL Open Font License 1.1 | 同上 |
| Manrope，`public/fonts/manrope-latin-variable.woff2` | SIL Open Font License 1.1 | [Manrope-OFL.txt](../../public/codex/licenses/Manrope-OFL.txt) |

字体从 Google Fonts 的官方分发地址取得并本地托管。文件为 Latin 子集，不包含完整中文字符集。家族、样式、权重、源 URL、字节数与 SHA-256 见 [font-provenance.json](../../public/codex/licenses/font-provenance.json)。字体许可独立于项目源码许可。

## 5. 软件依赖

| 直接依赖 | 锁定版本 | 角色 | 随包许可 |
| --- | --- | --- | --- |
| Three.js | 0.186.1 | 实时空间渲染 | [MIT](../../public/codex/licenses/dependencies/three--LICENSE) |
| Lenis | 1.3.26 | 平滑滚动 | [MIT](../../public/codex/licenses/dependencies/lenis--LICENSE) |
| Vite | 8.3.3 | 本地开发与静态构建 | [MIT 与包含的声明](../../public/codex/licenses/dependencies/vite--LICENSE.md) |

全部实际依赖版本由 the supplied standalone lockfile (not imported; see [import record](../../provenance/codex/import-record.json)) 锁定。安装来源和各包许可证见 [dependency-provenance.json](../../public/codex/licenses/dependency-provenance.json)，对应文件保存在 `licenses/dependencies/`。传递依赖包含 MIT、ISC、BSD-3-Clause、Apache-2.0、MPL-2.0 等不同许可；本项目没有用一个统一 MIT 声明覆盖它们。

`node_modules/` 是可重建安装目录，不随最终 ZIP 交付。许可记录反映生成记录中注明的安装环境；用户在其他平台安装时，npm 可能选择锁文件中对应平台的原生构建依赖。

## 6. 项目级许可范围

项目原创源码、文案和 AI 生成素材 **未另行指定统一开源许可证**。本交付分别记录它们的制作方式与第三方组件的许可，不将整包宣称为 MIT、CC0 或已获全面第三方商业授权。

博物馆、图书馆和保护机构资料仅用于工艺研究。没有从这些资料复制馆藏摄影、参考图或网站页面作为运行素材；来源链接见 [CRAFT-SOURCES.md](CRAFT-SOURCES.md)。

## 7. 最终交付核对

选定的十张 Visual Bible PNG 与四张 AI 成品源 PNG 均与各自的生成来源一致。四张 WebP 派生文件的尺寸、透明通道和运行路径已核对，图像内容没有重复；失败或未选中的生成结果不随包交付。

三份字体与两份 OFL 文本的哈希符合来源记录。实际安装的 17 个依赖包与锁文件、依赖来源记录一致，所有随包许可文本与安装来源一致，并保留 Rolldown 的额外第三方声明。博物馆和保护机构摄影没有进入素材目录。

最终 GLB、源模型哈希与导出元数据一致。随包 `dist/` 中的字体、图像、模型规格与 `public/` 对应资源一致；只保留一份最终构建。源码已移除临时全局调试入口。

归档内容由根目录 `MANIFEST.sha256` 逐项记录，清单不对自身计算哈希。最终 ZIP 排除 `node_modules/`、缓存、QA 调试脚本、临时截图、失败生成、旧模型与重复构建。构建与浏览器验证范围见 [QA.md](QA.md)。
