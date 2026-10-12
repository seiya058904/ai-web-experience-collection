# FERRUM — 资产来源与许可记录

本文件区分构思参考、正式材质、程序生成内容与第三方依赖。[ASSET-INVENTORY.md](ASSET-INVENTORY.md) 列出 35 项媒体与运行时资产及 5 份许可原文；精确字节数、SHA-256 和来源链汇总于 [asset-manifest.json](asset-manifest.json)。清单完成状态表示文件及来源核对，不代表视觉验收结论。所有路径以源码项目根目录为基准。

## 1. 本项目生成的图像

下列八个 PNG 源图都使用内置 **image_gen** 工具在本项目创作过程中生成。没有向生成调用提供外部参考图片。完整提示词与原始输出文件标识保留在 [design-reference](design-reference/README.md)；原始 PNG 未做像素修改。两份正式 WebP 是材质源图的编码衍生文件。

| 图像 | 实际尺寸 | 用途 | 是否由网站加载 |
| --- | --- | --- | --- |
| `docs/design-reference/concepts/00-prologue.png` | 1536 × 1024 | 首屏构图与粗粝钢坯研究。 | 否 |
| `docs/design-reference/concepts/01-furnace.png` | 1536 × 1024 | 炉口、局部热光与氧化皮研究。 | 否 |
| `docs/design-reference/concepts/02-strike.png` | 1536 × 1024 | 巨锤、砧面和击打构图研究。 | 否 |
| `docs/design-reference/concepts/03-quench.png` | 1536 × 1024 | 水面、余雾与冷热过渡研究。 | 否 |
| `docs/design-reference/concepts/04-reveal.png` | 1536 × 1024 | 斜面、微划痕与窄反射研究。 | 否 |
| `docs/design-reference/concepts/05-relic.png` | 1536 × 1024 | 建筑留白与完整器物收尾研究。 | 否 |
| `docs/design-reference/textures/originals/forged-steel.png` | 1254 × 1254 | 锻造材质的原始生成源图，供复核。 | 否 |
| `docs/design-reference/textures/originals/polished-steel.png` | 1254 × 1254 | 抛光材质的原始生成源图，供复核。 | 否 |
| `assets/textures/forged-steel.webp` | 1254 × 1254 | 原坯及相关表面的实际细节采样。 | 是 |
| `assets/textures/polished-steel.webp` | 1254 × 1254 | 抛光钢面实际细节采样。 | 是 |

概念图不是网站的全屏背景或交互界面。正式画面的文字、控制、对象几何、反射与运动另由代码构成。两张材质图请求的是 2048 方图，生成工具实际提供 1254 方图；未通过放大伪装成原生 2048。它们是合成细节来源，不是标定扫描材质。

正式材质通过 **Pillow WebP，quality 96、method 6** 编码，尺寸仍为 1254 × 1254 RGB。没有重新绘制、裁切或语义修改；WebP 编码本身有损，逐通道误差保留于 [texture-encoding.json](design-reference/texture-encoding.json)。两张发布纹理合计 **1,376,820 字节**，对应原始 PNG 合计 **6,887,795 字节**。原图与发布衍生图的独立 SHA-256 及来源关系见 [texture-metadata.json](design-reference/texture-metadata.json)。

## 2. 程序几何、渲染定帧、声音与图标

- **器物与场景几何**：由本项目 [scene.js](../src/scene.js) 构造，包括同一坯体/刃形的相容网格、锤头、砧体、炉内物体和场景结构；没有导入第三方模型。
- **材质与环境**：本项目 shader、程序噪声、生成贴图与环境反射面共同构成。反射环境由四条程序摄影灯带生成，没有下载 HDRI。水线、接触余波和接触阴影为解析近似；暖晕使用受深度遮挡的软光面，没有使用外部后处理效果或流体模拟资产。
- **降级定帧**：`assets/stills/` 保留六幕正式场景的桌面与竖屏定帧各一张，用于 still 模式、不可用的 WebGL 环境与无脚本阅读。它们由 [render-stills.mjs](../scripts/render-stills.mjs) 在浏览器中输出同一器物和材质的无文字画面，再由 [encode-stills.py](../scripts/encode-stills.py) 以 Pillow WebP quality 94、method 6 编码，保持尺寸、不裁切或重绘。桌面尺寸为 1920 × 1280，竖屏为 780 × 1688。[still-render-origin.json](design-reference/still-render-origin.json) 记录实际浏览器、源代码与材质 SHA、12 个叙事状态，以及源 PNG 和发布 WebP 的独立 SHA。清单内每张定帧关联该来源记录，发布文件及当前渲染输入均按 SHA 核对。
- **声音**：由本项目 [audio.js](../src/audio.js) 使用 Web Audio 振荡器、噪声缓冲与滤波器合成，包含环境低频、气流/水声质感与冲击包络；不使用外部音乐、录音或音效样本。
- **图标**：[favicon.svg](../favicon.svg) 的 F 字标以及 [index.html](../index.html) 内的箭头、关闭、重看等 SVG 由本项目直接编写，不依赖外部图标包。

“原创”在此表示本次项目生成或编写的来源，不表示对历史器物的复原，也不为生成输出虚构额外的版权登记、馆藏身份或第三方授权证书。

## 3. 本地字体

下表版本是用于交付的 **Fontsource npm 包版本**，不冒充字体内部版本号。WOFF2 文件直接从对应包复制，保留原始字节。字体许可为 **SIL Open Font License, Version 1.1（OFL-1.1）**，完整原文随包保留。

| 字体 / CSS 名称 | 包与版本 | 随包字重 | 实际角色 | 许可原文 |
| --- | --- | --- | --- | --- |
| Antonio / `Antonio` | `@fontsource/antonio` **5.3.0** | 300、400，Latin normal | 大标题与章节标题，当前使用 300。 | [ANTONIO-OFL.txt](licenses/ANTONIO-OFL.txt) |
| Barlow Condensed / `Barlow` | `@fontsource/barlow-condensed` **5.2.6** | 500、600、700，Latin normal | Journey 目录及章节编号。 | [BARLOW-CONDENSED-OFL.txt](licenses/BARLOW-CONDENSED-OFL.txt) |
| Manrope / `Manrope` | `@fontsource/manrope` **5.2.7** | 400、500、600，Latin normal | 叙述、说明与界面控制。 | [MANROPE-OFL.txt](licenses/MANROPE-OFL.txt) |

共 **8 个本地 WOFF2 文件**，均位于 `assets/fonts/`。Antonio 许可中的原始声明为 The Antonio Project Authors；其余声明按 Fontsource 包中附带的许可原文保留，未擅自改写作者信息。字体没有更名、子集再加工或字形修改。

## 4. 本地运行时依赖

| 依赖 | 版本 | 随包文件 | 许可 |
| --- | --- | --- | --- |
| Three.js | **0.186.1** | `vendor/three.module.js`、`vendor/three.core.js` | MIT；[THREE-LICENSE.txt](licenses/THREE-LICENSE.txt) |
| Lenis | **1.3.17** | `vendor/lenis.mjs`、`vendor/lenis.css` | MIT；[LENIS-LICENSE.txt](licenses/LENIS-LICENSE.txt) |

版本可与 [package.json](../package.json)、[package-lock.json](../package-lock.json) 和 [vendor/versions.json](../vendor/versions.json) 交叉核对。Three.js 许可保留 three.js authors 的原始声明；Lenis 许可保留 darkroom.engineering 的原始声明。包内依赖代码与字体文件通过 `scripts/vendor.mjs` 从锁定的 npm 依赖复制。

Playwright 1.62.1 是开发验收工具，不是网站中加载的运行时资源；其版本也记录在依赖清单。`node_modules` 不随源码交付。

## 5. 工艺研究与生产素材的边界

[RESEARCH.md](RESEARCH.md) 中的博物馆与工艺链接用于理解术语、材料和视觉差别。没有把这些网页上的摄影、馆藏图或文字长段落下载为生产资产；研究引用不被当成素材授权。网站里的器物为原创抽象雕塑，文字中的“记忆”和“relic”是叙事用语。
