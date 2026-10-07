# LUTHIER — The Anatomy of a Violin

**一件沉默的木制工艺品，被弓触碰后，逐渐成为整个空间中的声音。**

这是一个完整的本地沉浸式网页作品。九幕沿着 **Object → Craft → Tension → Resonance → Sound** 展开：先停留在琴体的存在感中，再进入木材、结构与内部空间；第一次弓触弦之后，实体逐渐转化为振动与曲线，最后回到同一把安静的小提琴。

交付包包含源码、唯一一份正式 `dist` 构建、正式素材、8 张最终 AI PNG 原图、9 张精选章节概念图、原创参数化模型及 GLB、配置、研究与来源文档、第三方许可。运行步骤全部针对本机。

## 直接打开正式作品

建议使用本次工具验证所用的 **Node.js 24.19.0**。`npm run verify` 直接使用 Node 的原生 TypeScript 类型剥离能力，因此完整开发与验证流程以 Node 24 为运行环境。

构建工具 Vite 8.3.3 自身声明的 Node 范围为 `^20.19.0 || >=22.12.0`；这是 Vite 的兼容范围，与本项目完整验证脚本的环境要求分别记录。版本及声明依据已安装依赖的 `package.json`，见 [licenses/manifest.json](licenses/manifest.json)。

### Windows

1. 完整解压 ZIP，保留目录结构。
2. 双击 **`Start-LUTHIER.cmd`**。
3. 默认浏览器会打开 `http://127.0.0.1:4173/`。保留启动窗口；按 `Ctrl+C` 停止服务。

如果浏览器没有自动打开，复制启动窗口中的地址即可。已有 `dist` 时，预览不需要先安装项目依赖。

### 终端方式

在项目目录运行：

```bash
node scripts/serve.mjs --open
```

也可以使用：

```bash
npm start
```

`npm start` 会打印访问地址，不自动打开浏览器。macOS / Linux 可运行 `sh start.sh`。端口占用时：

```bash
npm start -- --port 4174
```

请通过本地 HTTP 地址访问。直接双击 `index.html` 或 `dist/index.html` 使用 `file://` 打开，不适合作为此项目的运行方式。

## 如何体验

使用滚轮、触控板或触屏上下移动。标题旁的 **The anatomy** 和页脚章节计数都能打开章节目录。

| 章节 | 观看与操作 |
| --- | --- |
| **01 Presence** | 巨大琴体裁切、标题遮挡关系、沿漆面移动的局部高光。选择 **Enter the instrument** 开始。 |
| **02 Wood** | 选择 **Spruce / Maple / Ebony**，改变材质画面、文字与实时纹理线。 |
| **03 Craft** | 观察原创三维结构缓慢打开。继续滚动，或反向回看琴板重新合拢。 |
| **04 Inside** | 进入琴体内部；选择 **Bass bar / Sound post**，查看对应结构说明。 |
| **05 Tension** | 四根实时绘制的弦与琴桥建立张力，尚未开始发声。 |
| **06 First Bow** | 滚动控制靠近、触弦和运弓；也可操作 **Draw the bow** 滑块。继续滚动会接回主叙事。 |
| **07 Resonance** | 选择 **String / Body / Air**，改变共鸣图形的观察重点。 |
| **08 Sound as Space** | 使用 **Open the space** 调整全屏曲线装置的展开程度。 |
| **09 Return** | 回到开场的同一物体；**Begin again** 重新开始，**Credits** 查看作品与研究来源。 |

### 声音

默认静音。选择右上角 **Sound off** 才会启用声音；前五幕仍保持安静，声音随弓触弦的叙事出现。再次选择即可关闭。

声音由本地 Web Audio 生成，包含原创谐波、低声级弓噪、轻微揉弦与合成混响，**不是画面中乐器的录音**。系统静音、浏览器标签静音或音频输出设备设置仍会影响实际听感。浏览器无法开始音频时，界面会提示重试。

### 减少动态与键盘

章节目录中的 **Motion: full / Motion: reduced** 可以切换动态程度。首次进入时读取系统的减少动态偏好；手动选择保存在浏览器本地。减少动态模式将叙事改为九个连续阅读段落，并保留交互与代表性静态声学图形。

按钮、链接与滑块可通过 `Tab` / `Shift+Tab` 聚焦；`Enter` 或空格操作按钮，方向键调整已聚焦的滑块，`Esc` 关闭原生对话框。

## 修改源码与重新构建

首次安装依赖需要访问 npm 软件包源；正式构建的字体、图片、脚本与音效生成均在本地使用。

```bash
npm ci
npm run dev
```

开发地址为 `http://127.0.0.1:5173/`。生成正式文件：

```bash
npm run verify
npm run build
npm start
```

`npm run verify` 执行类型检查及源码数据、曲线和素材路径等自动检查；真实浏览器体验的验收独立记录。`npm run build` 先执行 TypeScript 检查，再由 Vite 更新 `dist`。需要单独检查类型时可运行 `npm run typecheck`。`npm run preview` 也可以使用 Vite 在本机预览构建；交付中的 `scripts/serve.mjs` 则无需 Vite 或其他第三方包。

本地静态服务只绑定 `127.0.0.1`，只公开 `dist` 内的允许文件类型，拒绝目录穿越、越界符号链接、目录列表、非本机 Host 和写入请求。它不会把源文件、原图或项目目录作为文件列表公开，也没有上传接口。

## 代码与素材位置

| 位置 | 内容 |
| --- | --- |
| `index.html` | 真实 HTML 标题、正文、导航、按钮、滑块与对话框。 |
| `src/main.ts` | 唯一 Lenis 实例、GSAP ticker / ScrollTrigger 同步、场景编排与交互。 |
| `src/story.ts` | 章节与叙事时间配置。 |
| `src/style.css` | 字体、色彩、构图、移动端与减少动态布局。 |
| `src/field.ts` | 原创琴弦、木纹路径、触弦与声学曲线系统。 |
| `src/model-geometry.ts` / `src/violin-model.ts` | 原创参数化小提琴结构、局部三维揭示与 GLB 导出能力。 |
| `src/audio.ts` | 明确启用后才播放的原创 Web Audio 声音设计。 |
| `public/assets` / `public/fonts` | 正式 WebP 素材、模型纹理裁切和自托管 WOFF2 字体。 |
| `assets-originals` | 8 张最终 PNG 与含完整提示词、派生关系的素材清单。 |
| `docs/concepts` | 9 张选定章节概念图，作为设计参考保留。 |
| `models/violin-study.glb` | 原创三维模型的独立 glTF 2 二进制文件，含嵌入纹理。 |
| `dist` | 唯一正式构建，用于直接本地预览。 |
| `scripts/serve.mjs` / `scripts/verify.mjs` | 本机静态服务，以及使用 Node 24 执行的自动检查脚本。 |
| `licenses` | 精确保留的第三方许可、声明及来源清单。 |
| `SHA256SUMS` | 交付文件的 SHA-256 清单，可用于核对解压内容完整性。 |

原始图像负责材质与特定镜头，文字、按钮、遮挡关系、高光、路径、弦、接触与声场由代码共同构成。图片上的概念排版没有被当成真实界面使用。

## 研究、设计与验收文档

- [DESIGN.md](DESIGN.md)：Visual Bible、章节架构、媒介选择与动效约定。
- [PRODUCT.md](PRODUCT.md)：作品目的与固定交付要求。
- [docs/RESEARCH.md](docs/RESEARCH.md)：已查阅的一手来源、事实边界与视觉依据。
- [docs/CONTENT.md](docs/CONTENT.md)：九幕英文补充文案和中文参考译文。
- [docs/PROVENANCE.md](docs/PROVENANCE.md)：AI 素材、概念选择、处理过程与来源。
- [docs/MODEL.md](docs/MODEL.md)：原创三维结构、渲染预算和模型范围。
- [docs/QA.md](docs/QA.md)：最终验收环境、覆盖范围、结果与未验证项目，以该记录为准。

## 适用范围与权利说明

这是对一把**未命名小提琴的数字艺术诠释**。AI 图像不是历史名琴实拍，模型不是测绘扫描；声学时间、位移与图形经过表现性调整，不作为制琴尺寸图或测量结果。WebGL 不可用时，Craft 章节保留静态图像后备。真实手机、不同浏览器、显卡与声音设备的具体测试情况以 QA 文档为准。

原创源代码、参数化几何与项目文档的许可见 [LICENSE](LICENSE)。第三方软件与字体保留各自许可，其中 **GSAP 使用其 Standard No Charge 许可**，字体使用 SIL OFL；它们不被根目录 MIT 许可替代。生成图像的来源独立记录，不以 MIT 标注，也不声称为历史实拍或具有排他权。完整署名见 [ATTRIBUTION.md](ATTRIBUTION.md)。

研究网站的照片、图表、动画、录音及扫描模型均未打包。Credits 的研究外链仅在主动点击时打开；体验本身没有运行时在线服务依赖。

**Shape the wood. Hold the tension. Let silence become sound.**
