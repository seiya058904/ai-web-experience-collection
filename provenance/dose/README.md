# DOSE — The Architecture of a Tablet

一个可以直接在本机运行的七幕交互式材料叙事网站。浏览者沿着同一枚假想药片，从原料、混合、压制、表面进入内部，再观察它与液体接触后的结构变化。

界面为英文；本文件提供中文启动、修改与验收说明。源码、字体和运行依赖均包含在文件夹内，**正常启动不需要 `npm install`，不需要账号、密钥或网络连接**。

## 在 Windows 上打开

1. **先把整个 ZIP 解压**，保留 `DOSE` 文件夹的完整结构，不要直接在压缩包内运行。
2. 电脑需要 Node.js 20 或以上版本。在终端运行 `node --version` 可以检查；Node.js 24 可用。
3. 双击 `OPEN-DOSE.cmd`。命令窗口会启动本地预览，并尝试打开浏览器。
4. 如果浏览器没有自动打开，手动访问 **http://127.0.0.1:4173/**。
5. 使用期间保持该命令窗口开启。结束后按 `Ctrl+C` 关闭预览。

不要双击 `index.html`：浏览器对 `file://` 下的 ES Module 有限制。本地 HTTP 启动器只监听本机 `127.0.0.1`。

### 终端启动（Windows / macOS / Linux）

在 `DOSE` 文件夹内运行：

```sh
npm start
```

不使用 npm 也可以：

```sh
node scripts/serve.mjs
```

若默认端口正在使用：

```sh
node scripts/serve.mjs --port 4174
```

浏览器自动打开：

```sh
node scripts/serve.mjs --open
```

## 体验方式

- 滚轮、触控板或触摸滑动推进故事；反向滚动返回同一工艺阶段。
- 点击 **Enter the matter** 进入原料；点击顶部 **Index +** 或底部章节名称打开完整目录。
- 底部七段进度线可直接跳转。链接有可读的辅助技术名称。
- 在 **Evidence** 章节拖动 **Observe depth**，改变三维切面。也可用方向键、Home、End 操作。
- **About → Quiet motion** 关闭持续微动、使用原生滚动并缩短章节间距。
- **About → Light rendering** 减少粒子数量并降低渲染分辨率上限。
- About / Index 均支持 Escape 关闭；关闭后键盘焦点回到打开按钮。
- 偏好仅保存在当前浏览器会话。禁用会话存储时，页面仍可使用。
- 关闭 JavaScript 时保留七章阅读版；WebGL 不可用或上下文丢失时保留 Canvas2D 插画与剖面控制。

### 可直接使用的地址参数

| 地址 | 行为 |
| --- | --- |
| `/?motion=quiet` | 从静态模式开始 |
| `/?quality=low` | 指定轻量渲染 |
| `/?quality=high` | 指定完整渲染，优先于会话中的画质偏好 |
| `/?renderer=2d` | 使用 Canvas2D 插画版 |
| `/#evidence` | 直接进入剖面章节 |
| `/?renderer=2d&motion=quiet#evidence` | 用静态插画版直接查看剖面 |

## 七章和科学范围

| 章节 | 画面与行为 |
| --- | --- |
| 00 Prologue | 白色双凸药片、细孔与压粉边缘；建立对象身份 |
| 01 Material | 不同形态的示意原料，区分活性成分与不同辅料角色 |
| 02 Distribution | 有边界的粉体混合体积，粒子分布随滚动改变 |
| 03 The press | 模孔、上冲、下冲；浅凹工作端匹配双凸片形；压实后由下冲推出 |
| 04 Surface | 未包衣药片的局部放大，强调孔隙与斜向照明 |
| 05 Evidence | 实际几何裁切与断面填充；滑杆改变截取位置 |
| 06 Release | 液体接触线索、不规则碎块与更小粒子的散开，最后逐渐平静 |

叙事采用 **假想、未包衣、立即释放、直接压片** 这一条路线。制粒和薄膜包衣没有混入本路线。形状、配色、比例、颗粒运动和时间都是视觉示意；不提供实际处方、剂量、压力、工艺参数、检测数值或药效结论。

内部图像是原创程序化 CGI，不是 CT、显微图或质量检验结果。崩解与溶出分别表述：颗粒散开与可溶材料进入溶液不是同一件事。文案依据、引用范围和未验证部分见 `docs/PROCESS.md`、`docs/SOURCES.md`。

## 源码结构

| 文件 / 目录 | 作用 |
| --- | --- |
| `index.html` | 完整语义化七章文案、导航、原生对话框与范围输入 |
| `src/app.js` | 唯一应用渲染时钟、滚动、偏好、交互、降级与恢复 |
| `src/timeline.js` | 可独立测试的滚动状态、章节映射、文字对比度与定性标签 |
| `src/scene.js` | Three.js 场景、光照、材质、粒子、压机与剖面 |
| `src/geometry.js` | 药片剖线、共用轮廓、粒子形状与碎块几何 |
| `src/fallback.js` | 独立 Canvas2D 插画版；使用相同章节和深度状态 |
| `src/styles.css` | 排版、色彩、移动端、打印与阅读版 |
| `vendor/` | 固定版本 Three.js / Lenis、本地 RoomEnvironment 与许可证 |
| `assets/fonts/` | 三套自托管 WOFF2 字体与原始 OFL 许可证 |
| `scripts/` | 不依赖第三方 npm 包的本地启动、构建和静态检查 |
| `dist/` | 随包提供的预构建运行目录，含运行资源与许可证 |
| `tests/` | 纯状态逻辑和过渡对比度回归测试 |
| `docs/concepts/` | 七张选用的艺术方向概念图与生成记录 |
| `DESIGN.md` | Visual Bible、构图、设计变量、动效和响应式准则 |
| `docs/QA.md` | 本次实际验证、修复记录与测试边界 |
| `docs/QA-RESULTS.json` | 机器可读的最终验证摘要 |
| `docs/ARCHITECTURE.md` | 运行机制、性能取舍与修改入口 |
| `LICENSE`、`THIRD-PARTY-NOTICES.md` | 原创源码及第三方资源许可 |
| `FILE-MANIFEST.sha256` | 交付文件的 SHA-256 清单 |

概念图用于说明艺术方向；应用运行时不加载这些图片。主体验为可交互几何，文本保持为真实 HTML。

## 修改与检查

```sh
npm run check
npm test
npm run build
npm run preview
```

已附预构建的 `dist/`。`build` 可根据修改后的源码重新生成它，不会下载依赖。`preview` 预览这个构建目录。普通启动直接使用源文件，保存后刷新即可看到修改。

- 修改内容：编辑 `index.html`，保持章节 ID 与 `src/timeline.js` 中的 ID 一致。
- 修改构图、字号、断点：编辑 `src/styles.css`。
- 修改压机阶段、材质或模型大小：编辑 `src/scene.js`。
- 修改主药片轮廓：编辑 `src/geometry.js`，并检查冲头接触面和碎块是否仍一致。
- 修改章节时长：调整各 `<section>` 的 `--span`；最后一章会扣除一个视口高度计算有效行程。

`npm test` 使用 Node 自带测试运行器。浏览器验收环境、视口和结果单独列在 QA 文档，不将静态测试通过等同于所有设备兼容。

## 交付与限制

这是本地可运行源码交付。没有创建线上站点或远端仓库，也不需要部署才能使用。内含本地依赖，未包含 `node_modules`、浏览器可执行文件或本次临时测试环境。

本次浏览器验证使用 Linux Chromium 和 SwiftShader 软件图形环境。六种视口检查不等于六台真实设备；Windows 启动脚本经过语法和路径检查，实际浏览器运行在 Linux。Safari、Firefox、真实 iOS/Android 与用户显卡上的帧率仍需在目标设备验证。性能统计严格区分 JavaScript/提交耗时与最终图形帧率。

所有检测、压实、断面和液体接触均为概念表现，不是物理求解器或可验证的药品模型。
