# FOSSIL — Deep Time in Stone

**一座可以通过滚轮进入的深时间档案馆。**

FOSSIL 从一件像雕塑一样沉默的化石出发，经过岩层、埋藏、保存、修复、琥珀、内部成像与局部重建，最后回到抽屉、纸卡和研究记录。贯穿十章的是同一条线索：生命如何留下形态，形态如何成为可以阅读的证据。

这是完整的本地 ZIP 交付。网站主体、字体、图像、Lenis 和合成成像数据均已随包提供；运行时不需要网络、账号、API Key 或 npm 安装。资料来源只在你主动点击外部链接时访问网络。本项目没有使用 OpenAI Sites，也没有执行任何公开部署。

> **标本与成像的身份：**图像是为本项目生成的解释性作品；扫描和模型来自程序化合成数据。`FSL—001` 是作品内部的研究编号，不是真实博物馆馆藏号。项目不为它虚构产地、地质年龄、物种鉴定、实际尺寸或扫描仪分辨率。

## 立即打开

### 方式一：双击，不需要安装

1. 完整解压 ZIP，保留文件夹结构。
2. 双击根目录的 **`index.html`**，用现代浏览器打开。
3. Windows 也可以双击 **`Start-FOSSIL.cmd`**，它会打开同一个入口。

源码使用本地经典脚本加载，成像数据直接包含在 `data/fossil-volume.js` 中，没有依赖 `fetch` 或远程模块。若浏览器或管理策略限制 `file://` 文件能力，可使用下面的本地预览方式。

### 方式二：Node 本地预览

已安装 **Node.js 18 或更高版本**时，在解压目录运行：

```sh
node scripts/serve.mjs
```

然后打开 [http://127.0.0.1:4173](http://127.0.0.1:4173)。服务仅监听本机回环地址；按 `Ctrl+C` 结束。Windows 可以直接运行 **`Preview-Server.cmd`**，未安装 Node 时它会回退到双击入口。

无需执行 `npm install`。`npm start` 和 `npm run dev` 只是同一条本地服务器命令的快捷方式。端口被占用时可运行：

```sh
node scripts/serve.mjs --port=4174
```

## 十个场景

| 章节 | 画面与叙事 | 可以做什么 |
| --- | --- | --- |
| **01 · Specimen** | 博物馆暗场中，巨大的菊石与不规则石基先作为自然雕塑出现。 | 滚动进入；点击 **Enter the archive** 进入岩层。 |
| **02 · Strata** | 四组明暗不同的沉积层在同一空间里建立深度。层厚表达材料变化，不是等长时间刻度。 | 随滚动观察层理与沉降。 |
| **03 · Burial** | 沉积前缘覆盖形体，暗淡轮廓仍留在石基内部。 | 向前与反向滚动，阅读形体被遮蔽的过程。 |
| **04 · Preservation** | 同一形体在孔隙充填、矿物替代、阴模与铸型之间转变。 | 点击 **Pore infill / Replacement / Mold / Cast**，手动选择四种保存路径。 |
| **05 · Exposure** | 明亮修复台上，小片基质和浮尘被移除；标本下方仍留有支撑石基。 | 拖动揭露比例滑块；进入 **Inspect the surface** 后在标本上轻拖清理浮尘。 |
| **06 · Amber** | 透射光穿过不规则琥珀，短暂进入另一种封存痕迹的语言。 | 随滚动观察材质、内部深度和细微光线变化。 |
| **07 · Scan** | 完整表面淡出，经轮廓过渡，进入同一坐标范围内的完整灰度切片。 | 浏览 **72** 个合成截面；拖动滑块或选择五个缩略截面；点击 **Follow scroll** 恢复滚动控制。 |
| **08 · Reconstruct** | 数据截面与轮廓围合出局部体积，缺损保持缺损。 | 切换 **Outline / Volume**；观察保留空缺的同源模型。 |
| **09 · Archive** | 标本回到抽屉、纸质支架和目录记录。 | 打开 **Open specimen record**，查看解释性身份、来源，并下载研究记录 JSON。 |
| **10 · Deep Time** | 标本重新出现，画面回到安静的物体本身。 | 点击 **Return to the specimen** 返回开场。 |

## 操作细节

**目录与定位。** 右上角 **Index** 打开十章目录；底部刻度也可以跳转。章节地址使用 `#chapter-01` 至 `#chapter-10`。目录和记录采用原生对话框，支持关闭按钮及 `Esc`。

**修复。** 揭露比例滑块可以精确控制显示范围。**Inspect the surface** 将标本区域切换为清理浮尘的指针交互；点击 **Finish inspection** 退出检查。**Resume the sequence** 清除手动揭露和刷除状态，恢复滚动驱动。键盘用户可以通过原生滑块获得同一揭露范围，无需使用拖刷手势。

**扫描。** 手动选择截面后，该截面保持选中，直到点击 **Follow scroll**。桌面五个快捷截面是第 11、23、36、49、63 层；手机保留中间三个缩略图，完整 72 层仍可用滑块选择。第 1、2、71、72 层确实位于这个合成形体的边界之外，会显示 **Outside the preserved volume.**；这不是图像加载失败。所有截面使用固定世界范围与一致的适配比例，外缘的小截面不会被单独放大。

**档案。** **Save this study record** 在浏览器内生成并下载 `FOSSIL-study-001.json`，包含作品编号、解释性来源、合成成像声明和研究链接。此操作没有上传过程。

**键盘。** 使用 `Tab` / `Shift+Tab` 在当前场景控件间移动，使用浏览器原生按钮操作和滑块方向键。非当前场景的交互内容会退出焦点顺序；每章保留了语义标题和视觉说明。

## 滚动、移动端与减少动态效果

- **单一滚动管理：**全站只创建一个随包附带的 **Lenis 1.3.26** 实例。地质与成像组件接收主程序提供的进度和时间，没有各自的滚动或动画循环。触摸滚动保持原生行为；无法使用 Lenis 时保留原生滚动回退。
- **减少动态效果：**读取系统 `prefers-reduced-motion` 设置，取消平滑跳转、环境漂移和跨场景混合，保持可读的稳定构图与全部核心控件。也可以在目录底部使用 **Pause ambient motion** 暂停环境动态；这一偏好会尽可能保存在本机。
- **移动端成像：**缩减标签与同时出现的截面数量。手机、减少动态效果模式及不适合使用硬件图形的环境，使用同一网格的 **768 × 776 CPU 光栅缓存**与 16 个矢量截面，保留形体和缺损；不是放大缩略图或替换成另一张照片。
- **绘制预算：**全屏画布通过 DPR 限制在约 **2.8 百万像素/画布**的预算内；地质遮罩只在相关数据改变时重绘。页面隐藏时暂停动画循环，目录打开时暂停场景绘制。
- **脚本回退：**禁用 JavaScript 时保留十章静态文字与可用的本地材料图；交互扫描和模型依赖脚本。

具体浏览器、尺寸、交互、反向滚动与降级检查的结果，以 [最终 QA 记录](docs/QA.md) 为准。这里描述实现方式，不将设备模拟等同于实体手机验收，也不承诺固定帧率。

## 合成扫描与模型

成像源是一个 **192 × 192 × 72** 的 `uint8` 标量场，使用无量纲的作者坐标，种子为 `20261007`。72 张 PNG 截面、浏览器内嵌数据和 OBJ 网格来自同一份存储体数据。等值面使用相对密度阈值 `112`，包含 **190,744 个顶点、378,128 个三角形**；这些数值描述交付数据，不是仪器测量精度。

原始字节、每层 PNG、体数据元信息、生成参数和模型都包含在 ZIP 中。网页直接使用内嵌浏览器数据，不在运行时读取体积较大的 OBJ 文件。完整格式和渲染说明见 [data/README.md](data/README.md)、[data/RENDERING.md](data/RENDERING.md) 及 [volume-metadata.json](data/volume-metadata.json)。

**仅在需要重新生成数据时**，才需要 Python 和 [requirements-procedural.txt](requirements-procedural.txt) 中固定版本的 NumPy、SciPy、Pillow；正常打开网站完全不需要这些包。可在独立 Python 虚拟环境中执行：

```sh
python -m pip install -r requirements-procedural.txt
python scripts/generate_volume.py
python scripts/generate_volume.py --verify
```

生成命令会重建项目内的合成数据与模型。AI 图像的精确提示词随原图保留；程序化生成器不会重新生成 AI 摄影底图。

## 项目内容与修改入口

| 路径 | 内容 |
| --- | --- |
| `index.html` | 十章语义内容、原生控件、目录、档案弹窗和研究链接。 |
| `src/app.js`、`src/math.js` | 单一主时钟、Lenis、场景进度、状态与交互。 |
| `src/geology.js` | 地层、埋藏、保存与谨慎揭露的 Canvas 材质系统。 |
| `src/imaging.js` | 同源切片、轮廓、WebGL 网格和 CPU 降级路径。 |
| `src/style.css` | 桌面/移动排版、局部构图、字体、焦点与减少动态效果样式。 |
| `assets/images/` | 网页实际加载的 **7 张生产 WebP**。 |
| `assets/ai-originals/` | 对应 **7 张 AI 生成 PNG 原图**及精确提示词。 |
| `reference/` | **10 张完整场景视觉概念**及提示词；琥珀另附一次修订提示词。 |
| `assets/fonts/`、`vendor/` | 三个本地字体家族、四个 WOFF2 文件，以及 Lenis。 |
| `data/`、`models/` | 合成体数据、72 个截面、浏览器数据、OBJ、参数与格式说明。 |
| `scripts/` | 无 npm 安装依赖的本地预览、构建、检查脚本，以及可选的 Python 数据生成器。 |
| `docs/`、`licenses/` | 视觉开发、研究、来源、验收、资产清单与许可证。 |

需要生成轻量运行目录时：

```sh
node scripts/build.mjs
```

脚本重建 `dist/`，放入网页运行必需的本地文件与依赖许可；它不是包含原图、模型、完整研究和视觉开发文件的完整交付包。可直接打开 `dist/index.html`，或运行 `node scripts/serve.mjs --root=dist`。本地交付检查入口为 `node scripts/verify.mjs`，其静态检查范围与实际浏览器验收分开记录。

## 视觉开发与来源

- [Visual Bible：十个完整场景](docs/VISUAL-BIBLE.html)
- [设计与场景系统](DESIGN.md)
- [八个权威研究来源](docs/RESEARCH.md)
- [图像、数据与模型来源](docs/PROVENANCE.md)
- [逐文件资产清单](docs/ASSET-MANIFEST.json)
- [最终 QA 记录](docs/QA.md)

全部 10 张场景概念、7 张 AI PNG 原图和 7 张生产 WebP 都为本项目生成或由这些生成原图转换。研究页面中的外部照片和真实 CT 数据没有纳入成品。生产 WebP 由同名 PNG 使用 `ffmpeg` 的 `libwebp` 编码，`quality 91`、`compression_level 6`，未裁切或改变分辨率，并保留原有透明度。精确提示词、源文件关系和文件哈希随交付保留。

## 许可

项目原创代码、文档和作者化程序数据/模型采用根目录 [MIT License](LICENSE)。AI 栅格图像的来源及适用范围见 [AI Assets Notice](licenses/AI-Assets-Notice.md)，它们不以代码 MIT 许可证冒充博物馆开放素材。

| 第三方部分 | 许可与来源 |
| --- | --- |
| Lenis **1.3.26** | [MIT 许可](licenses/Lenis-MIT.txt)，darkroom.engineering；仅使用已随包提供的本地版本。 |
| Bodoni Moda | [SIL OFL 1.1](licenses/Bodoni-Moda-OFL.txt)。 |
| Cormorant Garamond，正体与斜体 | [SIL OFL 1.1](licenses/Cormorant-Garamond-OFL.txt)。 |
| Manrope | [SIL OFL 1.1](licenses/Manrope-OFL.txt)。 |
| Visual Bible 内嵌中文字体 | Droid Sans Fallback 的 750 字符 WOFF 子集；[Apache 2.0 许可、来源及修改说明](licenses/Droid-Sans-Fallback-Apache.txt)，手册末尾也内嵌全文。只用于中文设计手册。 |
| Marching Cubes 标准查找表 | 来自 Three.js MarchingCubes addon 的表数据，保留 [Three.js MIT 声明](models/MARCHING_CUBES_LICENSE.txt)。浏览器没有加载完整 Three.js 库。 |

**Bury the form. Reveal the trace. Let time become evidence.**
