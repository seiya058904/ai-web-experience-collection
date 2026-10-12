# FERRUM — The Memory of Fire

一件由滚动控制的六幕金属叙事作品。观众跟随同一块钢，从粗粝原坯经过炉火、锤击、冷却与研磨，最终停留在一件安静的数字器物面前。

界面正文使用英文；制作说明与主要验收记录使用中文。本项目交付供本地复核和后续集成。

## 立即运行

需要 **Node.js 20 或更新版本**。网站的运行依赖、字体、材质与降级定帧都已包含在源码中。首次本地查看可以直接运行，无需安装 npm 依赖。

```bash
cd ferrum
node scripts/serve.mjs
```

在浏览器打开 **http://127.0.0.1:4173**。

也可以运行 `npm run dev`。端口已占用时：

```bash
node scripts/serve.mjs --port 4174
```

请通过本地 HTTP 服务访问；直接双击 `index.html` 会受到浏览器对 ES modules 和本地文件请求的限制。服务默认只监听本机的 `127.0.0.1`。

## 构建与本地预览

```bash
npm run build
npm run preview
```

构建脚本仅将正式网页入口、源码、正式资产和已固定版本的运行依赖复制到 `dist/`。它会重新生成 `dist/`，不会修改其他目录。预览命令在同一个本地地址服务构建结果。构建无需打包器，也无需先安装依赖。

## 观看方式

| 操作 | 行为 |
| --- | --- |
| 滚轮、触摸滑动 | 依次经历六幕；反向滚动恢复对应形态、温度、镜头与锤击状态 |
| `Scroll to begin` | 进入炉火章节的稳定构图 |
| 底部 `00–05` | 跳转到各章的停留位置 |
| `Journey` | 打开完整章节目录 |
| `About` | 阅读作品说明，选择动效与画质 |
| 桌面指针轻移 | 克制地改变观察光线；触摸设备以滚动观察 |
| `Sound off / on` | 主动开启或关闭原创合成声景；默认关闭，每次重新加载仍关闭 |
| `Experience again` | 回到开场 |
| `Escape` | 关闭已打开的对话框并归还键盘焦点 |

“跟随设备”遵循 `prefers-reduced-motion`。减弱动效时保留完整实时六幕，取消震动、火星、蒸汽和环境漂移，使用直接滚动。`Still images` 切换到同一正式场景生成的章节定帧；WebGL 不可用或渲染异常时也会使用此路径。禁用 JavaScript 时呈现可正常阅读的六幕图文版本。

## 六幕与同一件器物

| 幕 | 叙事 | 画面投入 |
| --- | --- | --- |
| 00 — Before form | 一块尚未成形的材料 | 生钢表面、窄侧光、留白与近端截面 |
| 01 — The furnace | 热使材料开始改变 | 暗氧化层与局部发光，炉炭与热源关系 |
| 02 — The strike | 力留下可见痕迹 | 两次具有准备、接触与回弹的冲击，定量方向火星 |
| 03 — The temperature between | 热度退去，形态留下 | 水线、蒸汽与冷白反射的交接 |
| 04 — Reveal the edge | 光显露表面与刃面 | 连续倒角、细纹、粗糙度和受控反射 |
| 05 — The relic | 停留观看 | 完整冷金属形体、安静空间与主动回看 |

同一可变形网格贯穿所有章节，表面的一处疤痕也保留在同一纵向位置。“记忆”是关于制造痕迹的诗性表述。本作采用原创抽象刃形，没有虚构馆藏身份，没有把它标为特定刀剑传统，也不提供制造配方。

## 实时画面、生图和定帧的分工

**实时画面**负责物体形态、摄影机、热度、表面反射、锤头、水面、粒子和指针响应。Three.js 使用同一个主渲染循环，由控制器统一驱动；Lenis 的自动 RAF 已关闭。叙事状态由归一化滚动位置直接计算，火星也由接触后的解析时间生成，因此可以反向观察，不依赖一次性的章节进入事件。

**生图**用于六幕视觉概念和两张实际金属表面纹理。正式网页使用生图生成的粗钢细节与抛光细纹作为材质输入，并保留原始 PNG、精确提示、尺寸与哈希供复核。网页文字、按钮和导航均为真实 DOM。概念图保存在设计资料中。

**章节定帧**由正式实时场景生成，分为桌面与竖屏两套，用于启动与图形能力不足时的降级。它们保证降级版与实时版保持同一件器物。没有视频文件或大型序列帧下载。

高画质和轻量画质各有像素预算；竖屏重新调整摄影机与主体姿态。自动模式会在持续帧耗时偏高时降至轻量画质。程序在后台暂停主循环与声音，恢复时重新测量视口；WebGL 上下文恢复使用丢失期间的最新叙事位置。

## 目录

| 路径 | 内容 |
| --- | --- |
| `index.html` | 六幕语义内容、章节导航、原生对话框与无 JavaScript 版本 |
| `src/main.js` | 唯一主时钟、滚动、导航、偏好、生命周期与降级控制 |
| `src/story.js` | 纯函数叙事坐标、镜头与材质轨道、两次锤击和粒子状态 |
| `src/scene.js` | 原创几何、金属着色、环境光、炉炭、锤砧、水与蒸汽 |
| `src/audio.js` | 默认静音的原创 Web Audio 声景与音频状态同步 |
| `src/styles.css` | 本地字体、排版、响应式布局和可访问性样式 |
| `assets/` | 正式发布字体、金属纹理与十二张章节定帧 |
| `vendor/` | 固定版本 Three.js 与 Lenis 运行文件 |
| `scripts/` | 本地服务、静态构建和依赖快照更新脚本 |
| `tests/` | 叙事与音频回归测试、真实浏览器验收及截图工具 |
| `docs/design-reference/` | 生图概念原图、材质原图、精确提示与可移植来源记录 |
| `docs/licenses/` | 第三方代码与字体的原始许可证 |
| `docs/QA-REPORT.md` | 实际验收环境、结果、视觉修改记录和未覆盖风险 |
| `docs/ASSET-PROVENANCE.md` | 各类资产的来源、用途与权利说明 |
| `DESIGN.md` | 设计方向、类型层级、色彩、空间与关键取舍 |

## 开发与依赖复现

```bash
npm ci
npm run vendor
npm test
```

`package-lock.json` 固定完整依赖树；`vendor/versions.json` 记录快照版本。`npm run vendor` 从已安装的固定版本包重新复制运行文件、八个字体文件及对应许可证。正常查看网站不执行这一更新步骤。

当前运行依赖是 Three.js `0.186.1` 和 Lenis `1.3.17`。展示字体为 Antonio，目录和编号为 Barlow Condensed，正文与控制为 Manrope。全部在本地加载。

## 重跑验收

纯函数与音频生命周期测试无需浏览器：

```bash
npm test
```

真实浏览器验收先安装 Playwright 的标准 Chromium，然后运行：

```bash
npm ci
npx playwright install chromium
npm run test:browser
node tests/capture.mjs
```

浏览器验收自动启动并关闭本地服务。默认输出在 `qa-output/`。截图脚本覆盖六个尺寸，每幕进入、停留、交接三个位置，共 108 张画面；最后一幕的第三张表示旅程终点的长期停留。

可选环境变量：

| 变量 | 用途 |
| --- | --- |
| `FERRUM_BROWSER_EXECUTABLE` | 使用本机已安装的 Chromium 可执行文件 |
| `FERRUM_BROWSER_CONFIG` | 读取含 `launchOptions` 的 JSON，适配自己的测试环境 |
| `FERRUM_TEST_OUTPUT` | 浏览器交互报告与证据的输出目录 |
| `FERRUM_TEST_DIST=1` | 验收已构建的 `dist/` |
| `FERRUM_CAPTURE_OUTPUT` | 六尺寸截图与记录的输出目录 |
| `FERRUM_CAPTURE_VIEWPORT=390x844` | 仅复核指定尺寸 |
| `FERRUM_CAPTURE_PHASE=hold` | 仅复核指定阶段 |
| `FERRUM_CAPTURE_SCREENSHOT_TIMEOUT` | 单张截图的等待上限，默认 120000 ms；软件渲染的 4K 截图可能需要较长等待 |

`?qa=1` 暴露只用于本地验收的叙事观察接口，并冻结环境漂移；普通访问不暴露该接口。测试包含故意禁用 WebGL、阻断可选纹理或注入渲染错误的独立浏览器上下文，这些故障不写入生产代码。

正式章节定帧也可以从当前场景重新生成。完成上述 Playwright 安装后，另在 Python 环境安装 Pillow，再执行：

```bash
node scripts/render-stills.mjs
python scripts/encode-stills.py qa-output/stills-raw
```

第一个命令输出十二张不含界面文字的实际场景 PNG；第二个命令以 WebP quality 94 编码到 `assets/stills/`，不裁切、不缩放、不修饰画面，并更新 `docs/design-reference/still-render-origin.json` 中的源代码、材质与图像哈希。这些工具仅在重新制作定帧时需要，正常观看与构建依旧只需 Node.js。

## 验收范围和限制

请以 `docs/QA-REPORT.md` 中保存的实际结果为准。当前制作环境使用 Linux、Chromium 131 和 SwiftShader 软件图形渲染；这可以检验真实 DOM、WebGL 着色、输入事件及截图，但不能代替硬件 GPU 的帧率测量，也不能证明 Safari、Firefox 或真实手机的表现。

材质和炉火是艺术化实时近似；水、蒸汽与声音也是为叙事设计的表现，并非物理工艺模拟。最终集成时仍建议在目标设备上复核输入、显示亮度、字体栅格化、音频和 GPU 表现。

源码包不包含 `node_modules`、浏览器二进制、缓存或失败稿。查看许可证、资产来源与研究链接后，可按自己的项目约定决定后续集成方式。
