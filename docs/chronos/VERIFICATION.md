> Historical delivery observations, dated 2026-10-05. The original standalone commands below describe that delivery. Current Collection workflow and combined 29-test suite: [root README](../../README.md). These observations do not certify later builds.

# 交付检查 / Verification

检查日期：2026-10-05。当前版本：1.0.1。本文件分别记录本次增量复核与初版基线，并区分实际浏览器观察、源码测试与环境限制。

## 1.0.1 增量复核

本次继续打磨保留原有六章结构、机械模型和素材，集中修正输入中断、平板竖屏构图与 Craft 的空间交接。

**24 个新增构图 / 交接检查通过。** 覆盖 820 × 1180、768 × 1024、1024 × 768、1366 × 768、3440 × 1440、700 × 900、390 × 844、1536 × 1024 和 320 × 568。新增检查重点包括平板上下构图、手机标注避让，以及工艺光圈从进入、展开、稳定到收缩的桌面和手机静止帧。已目视比较修改前后，并完成这三项视觉修改的独立复核。

**最终定向浏览器检查 7/7 通过。** 包括页面及实时机芯加载、滚轮惯性中按 End / Home / PageDown、目录动画中按 Home、动态切换减少动态效果后的进度保持，以及控制台健康检查。初次检查确认旧动画会覆盖部分键盘指令；修正后 End / Home 到达文档首尾，目录跳转中的 Home 回到进度 0，PageDown 保留原生向下翻页行为。减少动态效果切换后，连续两次采样的滚动进度保持一致。

新增或调整的行为：

- 页面、照片与实时摄像机共同使用竖向布局判断，平板不再混用桌面文字位置与手机机芯取景。
- 手机删除重复浮动部件标签，保留正文下的部件说明；振荡文字与机械读数增加局部明暗保护。
- Craft 的开口跟随第三轮宝石轴承的表面投影；摄影中的宝石中心与开口对齐，展开后回到原有微距构图。实时渲染与开口定位在同一帧完成。
- 原生滚动键先取消尚未完成的平滑动画；打断动画的 Home / End 明确落到端点。弹窗、编辑区域和控件的空格激活仍保留自身行为。

本轮构建及原有 15 项源码测试全部通过。下面保留的 48 项主矩阵、12 项初版定向画面检查和 12 项恢复检查是初版基线，未把它们重复计作 1.0.1 的新增测试。实际硬件和浏览器限制仍适用。

## 初版基线：构建与源码

- 在独立目录使用 `npm ci` 安装锁文件中的依赖，并以最终源码重新执行 `npm run build` 与 `npm test`。
- TypeScript 检查和 Vite production build 通过；15 项源码测试全部通过。
- 测试覆盖齿轮中心距与啮合相位、反向传动与速比、擒纵释放和锁定、相位边界连续性、反向求值、章节文字不重叠、完整构图停留、摄像机连续性，以及游丝固定端和变形几何。
- 交付的 `dist/` 使用独立构建结果，清除旧哈希文件。构建资源与源项目最终版本逐文件核对。

构建环境为 Node.js 24.19.0、npm 11.9.0。项目声明最低 Node.js 版本为 22.12.0；没有在每一个受支持的 Node.js 小版本上逐一运行。

## 浏览器与画面

使用实际 Chromium 153.0.8010.0 渲染初版 production build，并通过 Playwright 与 Chromium DevTools Protocol 输入滚轮、键盘和触摸事件。初版主要浏览器矩阵为 **48/48 项通过**；初版光圈修改与补充 4K 画面的定向检查为 **12/12 项通过**。画面由截图逐帧检查，并对金属反射、开场交接和窄屏构图做了第二轮独立目视复核。

| 视口（CSS px） | 检查内容 |
| --- | --- |
| 1536 × 1024 | 六个章节的完整构图、八个交接位置、目录和阅读弹窗 |
| 1920 × 1080 | 开场、振荡构图与文字边界 |
| 2560 × 1440 | 开场、振荡构图与文字边界 |
| 3840 × 2160 | 开场、储能、传动、振荡；金属表面和细部层次 |
| 390 × 844 | 六个章节、开场光圈、减弱动态效果、键盘导航与触摸滑动 |
| 320 × 568 | 开场、振荡、收尾的窄短屏构图和控件避让 |
| 844 × 390 | 横屏开场、振荡、收尾的左右构图 |
| 1440 × 900 | 交互恢复、窗口调整、静帧回退与资源延迟加载 |

滚动输入包含极小幅度慢滚、正常滚轮、连续高频输入、快速前进与反向、触控板式增减速输入、章节直接跳转，以及多个固定进度之间的快速往返。检查了章节接管之前、之中和之后的停帧。所有位置由同一进度映射求值，浏览器诊断中的 ScrollTrigger 数量保持为 1。

## 交互与恢复

补充恢复检查为 **12/12 项通过**，涵盖：

- 窗口调整后保持当前进度；实测 `0.4 → 0.4000558`，差异来自滚动像素取整。
- 暂停后机械时间保持不变；恢复后 Living Hold 在不滚动时继续推进。
- 原生 WebGL 上下文丢失后显示静帧回退，恢复后重新生成环境纹理并显示机芯。暂停构图的恢复前后像素对比平均差异为 0。
- 静帧模式仍可访问全部六章和完整阅读文本。
- 页面加载后立即滚动，延迟到达的图片不会重置当前位置；实测进度保持 `0.43`。
- 系统减少动态效果模式下，键盘章节导航把焦点放到可读的目标标题。
- 通过 CDP 发送实际浏览器触摸事件，手机视口由顶部推进到约 `0.05645`；该检查使用 DPR 1.5。
- 目录、Escape 关闭、声音开关、慢速观察、暂停和阅读视图均已检查。

最终浏览器检查未记录未捕获的 JavaScript 错误。主要画面矩阵未记录浏览器控制台警告。

## 已修正的问题

检查期间修正了开场摄影与实时表盘重复、金属端面的三角反光、游丝和发条层次不清、短屏文字保护不足、弹窗关闭时章节跳转被中止、慢帧下平滑滚动持续追赶，以及 WebGL 恢复后的环境纹理重建。最终定向画面检查覆盖这些修改涉及的构图。

## 检查范围与限制

浏览器运行于 Linux 无头环境，WebGL 使用 SwiftShader 软件渲染。以上检查证明该环境中的画面、状态和交互结果，不是独立显卡、手机 GPU 或固定 60 fps 的性能认证。4K 检查指 3840 × 2160 的浏览器视口；实时画布仍遵守项目的约 205 万像素预算。

进行了真实页面切换和返回操作，但此无头浏览器始终报告页面可见，且 CDP 的前台冻结命令没有触发原生 `freeze` / `resume` 事件。因此不把这些操作计为原生后台挂起通过。另以明确标记的合成生命周期事件检查冻结与恢复处理函数：冻结期间机械时间保持一致，恢复后继续推进。该结果只证明事件处理逻辑。

没有在实体 iPhone、Safari、Firefox 或真实 Windows 系统上运行本次验收。Windows 启动脚本经过路径、参数和退出码检查，但没有实际双击运行。测试截图、浏览器安装包、运行日志和依赖目录均不属于交付文件。

## 本地复查

```sh
# 运行随包构建，无需安装 npm 依赖
node scripts/serve.mjs

# 修改源码后的检查与构建
npm ci
npm test
npm run build
```

在本地地址后添加 `?inspect` 可读取 `window.__CHRONOS__.inspect()`；添加 `?render=still` 可检查静帧版本。诊断入口默认不显示在页面界面中。

## English scope

Version 1.0.1 adds 24 composition / handoff checks and a final 7-check browser interaction pass. It unifies tablet portrait composition, removes duplicate mobile callouts, aligns the Craft aperture with the live ruby bearing, and fixes smooth-scroll interruption by keyboard commands and reduced-motion changes. The production build and all 15 source tests pass.

The retained initial-release baseline passed 48 main Chromium checks, 12 targeted capture checks, and 12 recovery checks. These groups contain repeated checks and were not rerun or recounted as new 1.0.1 tests.

Visuals were inspected at desktop, 1080p, 1440p, 4K, portrait mobile, narrow portrait and short landscape viewports. Real browser input covered wheel patterns, reversals, keyboard controls, touch events and resize. Context loss/restoration and delayed asset loading were exercised. The runtime was Linux Chromium with software WebGL, not a physical-device frame-rate benchmark. Native background suspension was unavailable in this headless environment; the separately labelled lifecycle simulation verifies handlers only.
