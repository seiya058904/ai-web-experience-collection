# FERRUM — 完整资产清单

共 35 项媒体与运行时资产，合计 22,791,504 字节；另附 5 份第三方许可原文。全量 SHA-256、来源链与编码参数见 [asset-manifest.json](asset-manifest.json)。路径以源码项目根目录为基准。

正式定帧的实际浏览器、12 个叙事状态、场景/材质源 SHA、PNG 源 SHA 和发布 WebP SHA 另见 [still-render-origin.json](design-reference/still-render-origin.json)。资产清单已核对发布文件及当前输入与该记录一致；视觉评价和浏览器覆盖范围由验收报告负责。

## 场景概念 PNG（不由网站加载）

| 包内路径 | 字节 | 尺寸 / 版本 |
| --- | ---: | --- |
| `docs/design-reference/concepts/00-prologue.png` | 1,977,504 | 1536 × 1024 |
| `docs/design-reference/concepts/01-furnace.png` | 1,904,826 | 1536 × 1024 |
| `docs/design-reference/concepts/02-strike.png` | 2,133,943 | 1536 × 1024 |
| `docs/design-reference/concepts/03-quench.png` | 1,879,690 | 1536 × 1024 |
| `docs/design-reference/concepts/04-reveal.png` | 1,879,737 | 1536 × 1024 |
| `docs/design-reference/concepts/05-relic.png` | 2,007,117 | 1536 × 1024 |

## 材质原始 PNG（源码复核）

| 包内路径 | 字节 | 尺寸 / 版本 |
| --- | ---: | --- |
| `docs/design-reference/textures/originals/forged-steel.png` | 4,225,174 | 1254 × 1254 |
| `docs/design-reference/textures/originals/polished-steel.png` | 2,662,621 | 1254 × 1254 |

## 正式材质 WebP

| 包内路径 | 字节 | 尺寸 / 版本 |
| --- | ---: | --- |
| `assets/textures/forged-steel.webp` | 889,838 | 1254 × 1254 |
| `assets/textures/polished-steel.webp` | 486,982 | 1254 × 1254 |

## 正式场景定帧 WebP

| 包内路径 | 字节 | 尺寸 / 版本 |
| --- | ---: | --- |
| `assets/stills/00-desktop.webp` | 74,624 | 1920 × 1280 |
| `assets/stills/00-mobile.webp` | 33,658 | 780 × 1688 |
| `assets/stills/01-desktop.webp` | 59,028 | 1920 × 1280 |
| `assets/stills/01-mobile.webp` | 28,570 | 780 × 1688 |
| `assets/stills/02-desktop.webp` | 59,960 | 1920 × 1280 |
| `assets/stills/02-mobile.webp` | 23,578 | 780 × 1688 |
| `assets/stills/03-desktop.webp` | 34,832 | 1920 × 1280 |
| `assets/stills/03-mobile.webp` | 16,668 | 780 × 1688 |
| `assets/stills/04-desktop.webp` | 74,350 | 1920 × 1280 |
| `assets/stills/04-mobile.webp` | 18,838 | 780 × 1688 |
| `assets/stills/05-desktop.webp` | 24,446 | 1920 × 1280 |
| `assets/stills/05-mobile.webp` | 13,578 | 780 × 1688 |

## 本地 WOFF2 字体

| 包内路径 | 字节 | 尺寸 / 版本 |
| --- | ---: | --- |
| `assets/fonts/antonio-latin-300-normal.woff2` | 11,320 | 5.3.0 |
| `assets/fonts/antonio-latin-400-normal.woff2` | 11,016 | 5.3.0 |
| `assets/fonts/barlow-condensed-latin-500-normal.woff2` | 20,432 | 5.2.6 |
| `assets/fonts/barlow-condensed-latin-600-normal.woff2` | 21,352 | 5.2.6 |
| `assets/fonts/barlow-condensed-latin-700-normal.woff2` | 21,440 | 5.2.6 |
| `assets/fonts/manrope-latin-400-normal.woff2` | 14,108 | 5.2.7 |
| `assets/fonts/manrope-latin-500-normal.woff2` | 14,044 | 5.2.7 |
| `assets/fonts/manrope-latin-600-normal.woff2` | 14,172 | 5.2.7 |

## 本地运行时依赖

| 包内路径 | 字节 | 尺寸 / 版本 |
| --- | ---: | --- |
| `vendor/lenis.css` | 381 | 1.3.17 |
| `vendor/lenis.mjs` | 32,614 | 1.3.17 |
| `vendor/three.core.js` | 1,458,113 | 0.186.1 |
| `vendor/three.module.js` | 662,772 | 0.186.1 |

## 原创 SVG 标志

| 包内路径 | 字节 | 尺寸 / 版本 |
| --- | ---: | --- |
| `favicon.svg` | 178 | 0 0 64 64 |

## 随包许可

| 包内路径 | 包版本 | 许可 |
| --- | --- | --- |
| `docs/licenses/THREE-LICENSE.txt` | three 0.186.1 | MIT |
| `docs/licenses/LENIS-LICENSE.txt` | lenis 1.3.17 | MIT |
| `docs/licenses/ANTONIO-OFL.txt` | @fontsource/antonio 5.3.0 | OFL-1.1 |
| `docs/licenses/BARLOW-CONDENSED-OFL.txt` | @fontsource/barlow-condensed 5.2.6 | OFL-1.1 |
| `docs/licenses/MANROPE-OFL.txt` | @fontsource/manrope 5.2.7 | OFL-1.1 |
