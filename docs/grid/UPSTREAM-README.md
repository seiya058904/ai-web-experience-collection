# GRID — The Architecture of Visual Order

**Same content. Different rules. Everything changes.**

一个关于设计决策的实验网站。同一组标题、数字、摄影与文字，经过十二种规则状态，改变层级、节奏和空间关系。排版、栅格与界面均由真实 HTML / CSS / SVG 构建；AI 图像只用于 Visual Bible 中的构图探索。

本交付仅供**本地运行**：包含完整源码与一份预构建 `dist/`，没有线上地址或部署步骤。

## 快速打开

需要 **Node.js 22.12 或更高版本**。先完整解压 ZIP，再启动服务器；不要直接双击 `dist/index.html`。

### Windows

双击根目录的 **`START-GRID.cmd`**，保持终端窗口开启，然后在浏览器打开：

**http://127.0.0.1:4173**

### Windows / macOS / Linux 命令行

在解压后的项目目录执行：

```sh
node scripts/serve.mjs
```

macOS / Linux 也可执行 `sh START-GRID.sh`。同样访问 **http://127.0.0.1:4173**。此方式直接读取随包提供的 `dist/`，**无需安装 npm 依赖**；字体和摄影资源均来自本地文件。按 `Ctrl+C` 关闭服务器。

## 体验方式

| 操作 | 用途 |
| --- | --- |
| 滚轮、触控板或触屏滚动 | 连续观察同一批元素改变规则；向上滚动可反向返回。 |
| 章节索引 | 直接进入十二幕中的任意一幕。 |
| `←` / `→` | 在画布中切换上一幕、下一幕。 |
| `Home` / `End` | 回到开场或进入最终构图。 |
| Rules | 查看当前系统的设计规则。 |
| About | 查看作品说明，并切换减少动效设置。 |
| INTERFACE 的宽度滑杆 | 改变构图容器宽度，观察真实文字与图像重新排布。 |
| VARIABLE 的四个轴控制 | 调整 `wght`、`wdth`、`slnt`、`opsz`；`Reset` 恢复滚动驱动状态。 |

使用 `Tab` 在可交互控件之间移动。聚焦滑杆时，方向键用于调整该滑杆。减少动效模式保留章节导航、可读构图与手动控制；浏览器禁用 JavaScript 时，页面呈现一个可阅读的默认构图。

## 十二幕

`ZERO → SYSTEM → INTERNATIONAL → BASEL / TENSION → TYPE AS IMAGE → EDITORIAL → RAW → ELECTRONIC → INTERFACE → VARIABLE → SYNTHESIS → NO GRID`

整个体验只有一个 `h1` 与九个标记为 `data-content` 的内容节点：`GRID`、副标题、`08`、正文、同一张摄影、metadata、时间与地点、action、geometric mark。章节标签与规则读数用于解释实验，不替换核心内容。时间、地点与系列编号是原创的实验样本文案。

每幕的栅格、字体、图像、间距、颜色、交互和动效关系见 [设计规则](docs/RULES.md)；真实作品及一手来源见 [研究记录](docs/RESEARCH.md)；整体构图方向见 [Direction](docs/DIRECTION.md)。

## 本地开发与构建

首次安装依赖需要 npm 可访问软件包源。依赖版本由 `package-lock.json` 锁定。

```sh
npm ci
npm run dev
```

按终端给出的本地地址打开开发服务器。修改源码后，可重新生成生产文件：

```sh
npm run build
```

该命令先进行 TypeScript 检查，再更新 `dist/`。构建后可继续使用 `START-GRID.cmd` / `node scripts/serve.mjs`，或在已安装依赖的情况下执行：

```sh
npm run preview
```

源码修改不会自动写入随包提供的生产构建；需运行 `npm run build` 后再通过生产预览查看。

## 检查与验证

```sh
npm run check
npm test
```

检查覆盖状态重建、任意顺序与反向采样、实际字体轴范围、颜色对比与源状态不可变性。浏览器验证范围、截图审查结论和限制记录在 [QA](docs/QA.md)。设计系统与运行机制分别见 [DESIGN.md](DESIGN.md) 和 [ENGINE.md](docs/ENGINE.md)。

## 技术与文件

依赖版本见 [package.json](package.json)：Vanilla TypeScript、Vite **8.3.3**、GSAP **3.15.0** / ScrollTrigger、Lenis **1.3.26**。一个 Lenis 负责全局平滑滚动，与 GSAP 时钟同步；场景由滚动进度决定。主体使用语义化 DOM、CSS Grid、SVG 与局部 raster Canvas。

| 路径 | 内容 |
| --- | --- |
| `dist/` | 一份可直接通过本地服务器打开的生产构建。 |
| `src/`、`index.html` | 完整应用源码与语义化入口。 |
| `public/fonts/`、`public/images/` | 本地字体及摄影原始资源。 |
| `scripts/serve.mjs`、`START-GRID.cmd` | 无 npm 依赖的本地预览启动器。 |
| `visual-bible/` | 采用的 AI 构图研究及其提示词；不作为成品 UI 嵌入。 |
| `docs/` | 研究、场景规则与交付说明。 |
| `licenses/` | 字体许可、摄影署名和资源 provenance。 |

## 字体、摄影与来源

三款字体均本地提供，并附 SIL Open Font License 1.1：**Roboto Flex** 用于可变无衬线字形，**Instrument Serif** 用于 Editorial，**IBM Plex Mono** 用于等宽文字。Roboto Flex 的四个实际可变轴及文件校验信息记录在 [ASSET-PROVENANCE.json](licenses/ASSET-PROVENANCE.json)。

摄影为 **“Bw Stairs” — Dmitrijs Milajevs**，采用 **CC BY 3.0**，来源 Wikimedia Commons。全程使用同一张图片，裁切、色调与 raster 效果由页面实时产生。完整署名、来源链接与处理说明见 [PHOTO-ATTRIBUTION.md](licenses/PHOTO-ATTRIBUTION.md)。

Visual Bible 属于本项目的 AI 构图研究；历史作品仅作为有出处的研究参照。最终排版与交互由真实代码实现。
