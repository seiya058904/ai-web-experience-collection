# RESONANCE — Sound Made Visible

一个由八幕连续构成的交互声学体验：从安静中的一次扰动开始，让振动依次成为空间、干涉、共振图形、泛音、记录与重放。

这是可在本地运行的完整静态项目。页面、视觉代码、音频合成和字体都随包提供；无需安装 npm 依赖，也不需要账号、后端或外部 API。

## 快速开始（Windows）

需要 **Node.js 20 或更新版本**。

1. 完整解压 ZIP，保留目录结构。
2. 打开包含 `package.json` 的文件夹，在资源管理器地址栏输入 `cmd` 并回车。
3. 在命令提示符运行：

   ```bat
   npm start
   ```

4. 浏览器打开 **[http://localhost:4173](http://localhost:4173)**。

停止本地服务器：回到命令提示符，按 **Ctrl+C**。

**不需要运行 `npm install`。** 页面使用原生 ES modules，请通过本地 HTTP 服务器打开；直接双击 HTML 的 `file://` 方式可能被浏览器的模块加载规则拦截。

macOS / Linux 同样在项目根目录运行 `npm start`。

Windows 也可双击 `START-WINDOWS.cmd`，由它启动服务器并打开浏览器。

## 如何体验

滚动是主叙事控制。每幕先保持稳定构图，再让同一组视觉元素逐渐变成下一幕。可以随时停下、倒退，或通过底部导航及 **Index** 直接进入某幕。

| 幕 | 内容 | 可用交互 |
| --- | --- | --- |
| 01 · Silence | 悬浮的源与微弱张力 | **Disturb the silence** 开始 |
| 02 · Vibration | 受力、回弹与衰减的弦 | **Pluck the string** 再次拨动 |
| 03 · Propagation | 介质局部振动，波向外传播 | 滚动进入空间中的波场 |
| 04 · Interference | 两个波在同一空间叠加 | 调整 **Phase difference** |
| 05 · Resonance | 颗粒形成节点图案 | 选择 **2 : 3 / 3 : 4 / 4 : 5** 模式 |
| 06 · Harmonics | 一个基频及其泛音结构 | 调整 **110–330 Hz** 基频 |
| 07 · Memory | 波形转化为可保留的痕迹 | **Capture this tone**；完成后 **Save .wav** |
| 08 · Return | 信号重放，重新辐射至安静 | **Release the signal**；**Return to silence** |

### 声音、捕获与保存

声音默认关闭。顶部 **Sound off** 按钮可主动开启声音；点击 **Release the signal** 也会明确启动重放。

声音完全由浏览器合成，**不访问麦克风**。Capture 会根据点击时的基频与泛音参数，生成并保留一段 **3 秒、44.1 kHz、单声道**信号。保存格式是 **16-bit PCM WAV**。捕获不要求先打开扬声器。

重放使用最近一次捕获的信号；如果还没有捕获，重放按钮会根据当前参数生成一段。之后改变基频不会改写已经捕获的信号，需要再次 Capture。刷新页面后，未下载的捕获会丢失。

### 更平静的动效

**Index → Calm motion** 可以降低自主运动幅度，并让章节跳转直接到达目标。首次访问会读取系统的减少动态效果偏好；主动设置后会在当前浏览器中保留。浏览器禁止本地存储时，设置仍对当前页面生效。

离开标签页会暂停画面的活动时间，并挂起音频。回到页面后继续当前体验；捕获进度等界面计时不会在后台偷偷走完。

## 内容与科学边界

视觉遵循阻尼、传播、叠加、节点与泛音等关系，但它是艺术化的解析模型。位移和视觉时间经过调整，以便看清运动；界面上的 Hz 控制的是合成音的实际基频，画面中的运动被放慢。

板面图案是受 Chladni 节点模态启发的理想化可视化，未针对某一种金属、尺寸或夹持条件进行校准。模式按钮表示图形模式，不代表实验测量频率。干涉的相位控制作用于基频；含有多个泛音的声音，在基频相反时不一定整体归零。

完整技术说明见 [ARCHITECTURE.md](./ARCHITECTURE.md)，参考来源及字体许可见 [ASSET_PROVENANCE.md](./ASSET_PROVENANCE.md)。

## 项目结构

| 路径 | 用途 |
| --- | --- |
| `dist/index.html` | 完整的八幕语义结构、导航与交互控件 |
| `dist/style.css` | 字体、布局、响应式构图与动效偏好 |
| `dist/app.js` | 唯一应用动画循环、页面状态与交互绑定 |
| `dist/scroll-state.js` | 无历史依赖的滚动位置与场景映射 |
| `dist/world.js` | 原创连续视觉系统 |
| `dist/math.js` | 确定性颗粒种子、节点投影与阻尼弦等数学函数 |
| `dist/audio.js` | Web Audio 合成、捕获、重放与 WAV 编码 |
| `dist/favicon.svg` | 原创线性图标 |
| `dist/assets/fonts/` | 本地字体 |
| `licenses/` | 字体的 OFL 许可与版权声明 |
| `scripts/` | 本地服务器与静态项目校验 |
| `tests/` | 使用 Node 内置测试运行器的自动检查 |

`dist/` 同时是可直接编辑的前端源码和可供普通静态 HTTP 服务器托管的网页目录。没有打包器生成的另一份前端副本。

## 检查命令

在项目根目录运行：

```bat
npm run check
npm test
npm run build
```

`check` 和 `build` 都校验已完成的 `dist/`；`build` 不下载依赖，也不生成重复目录。`npm test` 使用 `node --test` 运行项目测试。

这些命令描述的是可复现的检查入口，不代表它们覆盖所有浏览器、显卡或触控设备。图形质量会随设备调整；浏览器无法启动视觉渲染时，页面保留可阅读的语义内容。Web Audio 的可用性由浏览器决定。

## 已完成的验证

本交付在 **2026-10-06** 完成以下检查：

| 检查 | 结果与范围 |
| --- | --- |
| 静态构建校验 | JavaScript 语法、模块导入、页面锚点、本地字体和素材引用全部通过 |
| 自动测试 | **21 / 21** 通过；覆盖音高、PCM/WAV、捕获隔离、失败路径，以及三组布局中的 12,003 个滚动采样点 |
| 浏览器完整流程 | **22 / 22** 通过；八幕、拨弦、相位、模式、基频、捕获、下载、重放、静音、Index 和导航 |
| 滚动与恢复 | 慢滚动、快速滚动、立即反向、每幕任意停留、深链接、中途刷新、宽度改变和浏览器冻结后恢复 |
| 响应式画面 | 1536×1024、1920×1080、2560×1440、3840×2160；360×740、390×844、430×932；844×390 横屏 |
| 可用性路径 | 系统减少动态效果、手动 Calm motion、键盘关闭目录、无 WebGL 的 Canvas 2D，以及关闭 JavaScript 后的完整语义内容 |
| 导出文件 | 实际下载并检查了三秒 WAV：44,100 Hz、单声道、16-bit PCM，264,644 字节 |
| 音频定向回归 | **6 / 6** 通过；捕获 110 Hz 后将实时控制改为 330 Hz，重放仍使用原信号，且没有额外拨弦；捕获计时和真实 AudioContext 可以挂起、恢复 |
| 边缘视口复测 | **6 / 6** 通过；4K 标题行数、矮屏手机、短横屏、Canvas fallback 均重新检查 |
| 运行错误 | 完整流程中浏览器控制台错误为 0，资源请求错误为 0 |

浏览器验证使用 **Chromium 153.0.8010.0 和软件 WebGL**；移动端检查是该浏览器中的视口重构检查。桌面、常规手机、4K 与短横屏截图均经过视觉复核，并修正了标题换行和图形遮叠。未将这些结果等同于真实手机 Safari、所有显卡或高刷新率设备的性能保证。

生命周期定向回归通过受控的 `pagehide` / `pageshow` 事件调用应用处理函数：捕获在 1/3 秒保持 3.6 秒，音频上下文时间停止，恢复后继续剩余捕获。无头浏览器切换标签没有改变 `document.hidden`，所以这项检查验证的是处理链和真实音频上下文，不能替代操作系统触发的真实后台切换测试。

## English overview

RESONANCE is a portable, dependency-free static ES-module project. Serve the included `dist/` directory over HTTP, or run `npm start` from the project root with Node.js 20 or newer. The runtime has no remote font, image, analytics, audio, or service dependency. External references in the About panel open only when selected.

The project uses native scrolling, one application-owned animation frame loop, an evolving procedural visual field, opt-in local audio, and semantic HTML. See the architecture and provenance documents for implementation boundaries and source acknowledgments.
