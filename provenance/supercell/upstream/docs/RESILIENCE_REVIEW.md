# SUPERCELL — 补充韧性与真实生命周期验收

## 结论与范围

补充验收已完成。暂停、音频原生状态、连续滚动记录、精确交界定点、原生滚动条，以及**真实后台／前台恢复**均取得了对应的浏览器证据。冷／暖资源测量已在固定的 production 服务重新采集，替代了受 Vite 重载影响的早期数据。

本轮唯一修改的项目文件是 `tests/resilience-acceptance.mjs`；未修改产品源码、未启动或停止网站服务器，也没有连接已有用户浏览器。所有本轮创建的 Chromium、私有配置目录与 Xvfb 均已关闭或清理。

证据来自 Linux 上 Chromium 141.0.7390.37、SwiftShader 软件 WebGL。输入由浏览器自动化生成，不能称为实体手机或物理鼠标验收。录像与实际 rAF 状态证明连续输入和中间状态存在；编码帧率不等于应用实测帧率，也不自动构成人工观看后的流畅度结论。

## 已完成结果

| 检查 | 结果 | 关键实证 | 主证据 |
| --- | --- | --- | --- |
| 暂停与恢复 | **PASS** | 运行时 shader clock 从约 1.372 增至 2.147；暂停两次采样均为约 2.797，期间浏览器 rAF 增加 61 次，两张实际 PNG 的 SHA-256 完全相同；恢复后 clock 增至约 3.065且截图改变。 | `resilience.json`；`pause-held-a.png`、`pause-held-b.png`、`pause-resumed.png` |
| 音频开启／关闭 | **PASS** | 初始不存在 AudioContext。点击开启后原生 context 为 running，currentTime 从约 .731 增至 .920；GainNode目标 .17，实际值约 .158。关闭后目标为 0、实际值衰减至约 .00946。 | `resilience.json`；`audio-enabled.png`、`audio-muted.png` |
| 四个过渡的连续真实滚动 | **PASS，限定为输入／记录证据** | 使用原生合成滚动手势连续约 10.699 秒，期间未调用 scrollTo。记录 227 条真实 rAF状态、21张过程截图；四个过渡分别有26／13／16／17个不同进度值。 | `motion-four-handoffs-390.webm`、`motion-frame-*.jpg`、`resilience.json` |
| 交界阈值定点 | **PASS，限定为已断言的时序及已保存画面** | 24张静止定点图覆盖四个交界两侧，并包含 .4098／.415、.90、.944 两侧。断言旧空气流动正文与新控制区、ending与旧控制区没有在这些修复阈值同时超过可见阈值。 | `threshold-p-*.jpg`；`resilience.json → motion.thresholdStills` |
| 原生滚动条拖动 | **PASS** | 有窗口 Chromium 中，1440×900视口显示15px原生条宽；原生鼠标拖动使 scrollY 从0增至2741，p从0增至.55374。没有用 wheel或scrollTo替代拖动。 | `resilience-headed.json`；`headed-native-scrollbar-before.png`、`headed-native-scrollbar-after.png` |
| 真实后台／前台恢复 | **PASS** | 原生CDP在同一自有窗口创建、激活两个tab。浏览器真实产生 visible→hidden→visible；后台shader clock两次均为约2.279，gain目标为0；前台恢复后clock约2.821、gain目标恢复.17。p=.76993、u=.90、h=.57全程保留。 | `resilience-native-visibility.json`；`native-visibility-before-background.png`、`native-visibility-foreground-restored.png` |
| 开场未完成时可以滚动 | **PASS** | 开场reveal尚未完成时注入原生wheel输入，真实scrollY和叙事进度立即改变。生产版重采也通过。 | `resilience-headed.json`；`headed-cold-hero-scroll-during-reveal.png` |
| 冷／暖资源 | **MEASURED；不作性能承诺** | Production冷启动为有效fresh navigate；资源transfer合计518,039B，暖重载为0B。导航HTML另计：64,080B／300B。 | `resilience-headed.json → resources` |

### 后台恢复的具体证据

原生CDP连接地址只来自该脚本新建的私有profile内 `DevToolsActivePort`，没有发现或连接外部端点，也未让Playwright附着该浏览器。两个目标的原生windowId相同（2067668173），因此证据是同窗口标签切换。

| 状态 | document.hidden | p / u / h | Shader clock | Gain目标 |
| --- | --- | --- | --- | --- |
| 切换前 | false | .76993 / .90 / .57 | 2.279 | .17 |
| 后台首次采样 | true | .76993 / .90 / .57 | 2.279 | 0 |
| 后台约456ms后 | true | .76993 / .90 / .57 | 2.279 | 0 |
| 恢复前台后 | false | .76993 / .90 / .57 | 2.821 | .17 |

真实 `visibilitychange` 记录的隐藏和恢复时刻约为本次导航后的4804ms、5319ms。后台音量通过原生GainNode渐变衰减，表中“0”指目标值，不意味着该指数衰减瞬间已经达到数学上的零。未测试扬声器硬件是否可听。

### 录像与静帧边界

`motion-four-handoffs-390.webm` 已用 ffprobe 核对：VP8、390×844、时长13.36秒、编码25fps。连续输入段约10.7秒，其余为进入与结束画面。25fps仅是文件编码参数。

`threshold-p-*.jpg` 是另一个上下文中的精确程序化进度定位；这些定点图不冒充连续滚动录像。DOM完整几何矩阵、反向交界及最终noJS画面由主验收记录负责。本补充报告不替代这些结果。

## 冷启动时间点与被替代的证据

Production重采使用 `http://127.0.0.1:4318/`，前后 `performance.timeOrigin`一致，导航类型为navigate。单次观测的appReady约105ms、canvasReady约711ms；暖重载约73ms、244ms。资源测量没有使用请求拦截，缓存行为由浏览器和服务器实际决定。这些是本地、软件WebGL、包含截图读取开销的一次观测，不能推广为真实网络或用户设备性能保证。

三张开场截图使用CDP `Page.captureScreenshot`，没有等待Playwright的 `fonts.ready`。文件中的650ms／1500ms为**请求目标**；本次有窗口冷启动的截图读取较慢，实际时钟如下，不能写成精确650ms／1500ms已验收。

| 图像 | 实际请求前时间 | 实际返回后时间 |
| --- | ---: | ---: |
| `headed-cold-hero-initial.png` | 392.7ms | 1118.3ms |
| `headed-cold-hero-reveal-0650ms.png` | 1130.4ms | 1423.0ms |
| `headed-cold-hero-reveal-1500ms.png` | 1856.0ms | 2058.0ms |

这些画面证明可辨认的初始风暴、中间reveal状态及完整画面；精确读取区间保存在JSON中。若需要更紧的指定时间点，应按导航绝对时钟并发调度截图，避免前一次readback阻塞后一次请求。本轮没有为追求名义时刻而冻结或伪造应用时钟。

| 早期结果 | 最终处置 |
| --- | --- |
| `resilience.json`中的dev冷／暖资源 | **无效冷测，已替代。** 首次截图期间发生Vite重载，最终navigation.type为reload，performance.now还发生回退；不能用于fresh cold结论。使用production的 `resilience-headed.json → resources`。 |
| Headless及Playwright headed的background NOT_PROVEN | **已替代。** 两次自动化环境均未产生真实hidden；没有将其算成PASS。最终以无Playwright附着／焦点模拟的 `resilience-native-visibility.json` 为准。 |
| Headless原生滚动条 NOT_PROVEN | **已替代。** Headless没有获得有效原生拖动；有窗口复测真实条宽及scrollY/p变化通过。 |
| 初次完整Chromium安装／启动失败 | **环境恢复完成。** 首次目录锁故障留下不完整资源；重新从官方发行镜像安装到独立临时缓存后，完整Chromium正常执行。失败启动未用作产品验收。 |
| 原生CDP最初的早期DOM读取错误 | **测试同步已修复并重跑。** ready条件加入documentElement存在检查；最终原生生命周期记录完整通过。 |

## 可复跑命令

以下从包含 `package.json` 的项目根目录执行。脚本只连接已运行的本地服务器；不会替你启动、停止或发布网站。Node版本遵守项目 `engines`，Playwright版本来自锁文件。

### 1. 准备依赖和浏览器

```sh
npm ci
npx playwright install chromium
```

`PLAYWRIGHT_BROWSERS_PATH`、`RESILIENCE_EXECUTABLE`都是可选项。使用Playwright默认浏览器缓存时无需设置。只有希望选择独立缓存或指定完整Chromium二进制时才设置，例如：

```sh
PLAYWRIGHT_BROWSERS_PATH=/absolute/path/to/qa-browsers npx playwright install chromium
```

指定的二进制应与当前Playwright兼容。无需复用本次会话的 `/tmp` 或工作目录路径。

### 2. 默认开发环境

终端A：

```sh
npm run dev -- --port 5173
```

终端B：

```sh
node tests/resilience-acceptance.mjs
```

默认连接 `http://127.0.0.1:5173/`，输出 `test-results/resilience/`。默认模式使用headless Chromium，**不需要Xvfb**。开发服务器若在采样期间重载，冷测会明确判为无效；建议最终资源结论使用固定production构建。

### 3. 固定production构建

终端A：

```sh
npm run build
npm run preview -- --port 4173
```

终端B：

```sh
BASE_URL=http://127.0.0.1:4173/ QA_OUT=test-results/resilience-production node tests/resilience-acceptance.mjs
```

该命令仍是headless全套模式，无需Xvfb。`BASE_URL`仅接受本地地址。

### 4. 可选有窗口定向补证

当前脚本的 `headed`、`visibility`、`native-visibility` 都属于**Linux私有Xvfb补证模式**，需要可用的 `/usr/bin/Xvfb` 和完整Chromium；这些依赖不属于网站运行条件，也不属于默认／production headless模式。只有 `native-visibility` 不附着Playwright，而使用原生CDP。这里按脚本实际实现列出依赖，避免把普通有窗口模式误写成无需显示服务。

在production服务运行时：

```sh
BASE_URL=http://127.0.0.1:4173/ QA_OUT=test-results/resilience-headed RESILIENCE_MODE=headed node tests/resilience-acceptance.mjs
```

该模式只跑生产冷／暖、可见滚动条和Playwright上下文中的visibility证据，不重复录像或pause/audio全套。若visibility没有真实事件，会保留NOT_PROVEN，不会从DOM标签推导通过。

### 5. 原生后台／前台硬门槛

```sh
BASE_URL=http://127.0.0.1:4173/ QA_OUT=test-results/resilience-native RESILIENCE_MODE=native-visibility node tests/resilience-acceptance.mjs
```

可选的独立浏览器路径写法：

```sh
PLAYWRIGHT_BROWSERS_PATH=/absolute/path/to/qa-browsers BASE_URL=http://127.0.0.1:4173/ QA_OUT=test-results/resilience-native RESILIENCE_MODE=native-visibility node tests/resilience-acceptance.mjs
```

也可额外提供 `RESILIENCE_EXECUTABLE=/absolute/path/to/chrome`；通常不需要。脚本自行创建私有display、profile和仅本地的调试端点，验证真实native tab切换，并只清理自身创建的进程和目录。

## 最终证据索引与清理

- 暂停、音频、录像、阈值：`resilience.json`（不采用其中早期dev冷测）。
- Production冷／暖、原生滚动条：`resilience-headed.json`。
- 最终真实后台／前台恢复：`resilience-native-visibility.json`。
- 连续录像：`motion-four-handoffs-390.webm`。
- 背景恢复前后图：`native-visibility-before-background.png`、`native-visibility-foreground-restored.png`。
- 最终noJS画面：由主验收填写，本补充复核不代签。

最后一次原生补证结束于2026-10-24 16:29:59 UTC，记录 `browserClosed:true`。本轮创建的浏览器进程均关闭，原生CDP私有profile已移除，私有Xvfb已终止；未关闭或更改4317／4318网站服务器，也未操作外部／共享浏览器。

## 主验收补记

最终无JavaScript静态首屏及媒体全失败退路已实际复验：只显示一个标题、不残留气流标签、不显示坏图图标；启用JavaScript时，媒体失败仍可将实际切片调至47%。对应证据为 `evidence/poster-verification.json`、`evidence/poster-final-js-false.jpg` 和 `evidence/poster-final-js-true.jpg`。主验收还逐帧查看了录像提取的2fps概览与结尾4fps密采样，未见被黑场遮盖的交接或被替换的云体；该观察不构成逐帧流畅度或真机帧率保证。
