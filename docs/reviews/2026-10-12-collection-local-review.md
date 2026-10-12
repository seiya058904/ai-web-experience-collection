# Collection 本地验收报告 · 2026-10-12

## 后续调整：GRID 节奏已修改

用户实际体验反馈指出 GRID 变化太快。本次已将 GRID 每套构图的滚动距离从 1.95 屏增加到 3.9 屏；同样输入下，画面进度减半。相邻章节点击过渡从约 0.82 秒延长到 1.64 秒，长距离跳转上限从 1.8 秒延长到 3.6 秒。原有画面、字体轴、转场曲线、滚轮平滑和单一时钟保留；减少动画下点击仍立即到达。

实际同条件生产浏览器对照：桌面 1440×900 输入 deltaY=900，旧版进度变化 0.461538，新版 0.230769；手机 390×844 为 0.492156 → 0.246078，均为原来的 50%。反向同量滚动回到起始位置，刷新保留位置。十二章点击实际到达，手机框架/字体控件、减少动画和 Collection 返回通过；六种规定尺寸的代表构图复验通过。315/315 测试、两种路径构建、855 引用验证及差异检查通过。物理设备和真实高刷新率专项仍未验证。

只需刷新 [GRID](http://127.0.0.1:4175/ai-web-experience-collection/grid/)，按平常速度滚动，再点击底部章节比较节奏。相关修改为 `experiences/grid/src/main.ts` 和 `docs/grid/ENGINE.md`；本报告同步记录。证据：[修改前输入记录](../../../collection-review-evidence-20261012-01a13020/grid-pacing/baseline.json)、[修改后输入记录](../../../collection-review-evidence-20261012-01a13020/grid-pacing/after.json)、[点击十二章](../../../collection-review-evidence-20261012-01a13020/grid-pacing/navigation.json)、[回归结果](../../../collection-review-evidence-20261012-01a13020/grid-pacing/regressions.json)。本次只本地提交，尚未推送。

以下“一屏结论”及全站表格保留首轮审计基线。当前 GRID 分类改为 **REFINE，已修改**；其他作品未改。首轮 KEEP 不代表用户对节奏已经满意。

## 一屏结论

本轮完成 Collection、Credits 和全部 29 个作品的生产预览巡检，最终 **29 KEEP、0 FIX、0 REFINE、0 BLOCKED**。**没有修改主站或子站源码**，只提交这份报告。检查范围内没有确认值得冒回归风险修补的运行时问题；KEEP 表示所列检查通过，并不表示每章、每项控件、所有设备都已完整验收。

最有价值的复核结果：

- VEIL 六个材质章节、三个滑块、释放/恢复折叠、减少动画、静态版本、刷新保留和正反向滚动均可用，没有依据更换渲染或滚动机制。
- GRID 桌面/手机十二套系统均逐一导航并看图；四个真实字体轴及 Reset、Interface 框架宽度及 Reset 可用，宽矮屏和较大视口没有确认新的排版缺陷。
- GLASSHOUSE 的“反向后标题少了半句”候选，经同坐标正反向复核确认为原有擦入设计。保留了最初失败判定和反证，没有为消除正常中间态而删动画。
- ORBITAL 的模拟手机滚轮没有位移；补做 CDP 模拟触摸后，实际位置由 0 → 435 → 0，排除了该输入方式下的页面滚动故障。不是物理手机验收。
- 主站 29 个作品入口和 Credits 入口可用，无 JavaScript 也能进入作品；Credits 的 95 个本地链接均返回 200。

| 门禁 | 状态 | 实际结果 |
| --- | --- | --- |
| 基线与最终 `npm run verify` | PASS | 两次均 315 测试通过，0 失败、0 跳过；类型检查、根路径生产构建及 855 个 HTML/CSS 引用校验通过 |
| 基线与最终项目路径构建、`verify:build` | PASS | `/ai-web-experience-collection/`；855 个引用通过 |
| 29 站桌面/手机首屏 smoke | PASS | 1440×900、390×844；逐站有截图及资源/错误记录 |
| 桌面 Collection → 作品 → Collection、刷新 | PASS | 29 站原生文档导航实际操作；MAGMA 入口保留原有 `#pressure` |
| 重点深检 | PASS | 仅限下文明确列出的章节、控件和模式 |
| 最终重建后预览抽检 | PASS | Collection、Credits、VEIL、GRID 非空，标题正确，0 页面/控制台错误 |
| `git diff --check` | PASS | 无空白错误；只纳入本报告 |
| 隐藏标签页、真实移动设备、其他浏览器、长时间内存检查 | NOT RUN | 具体限制见末节 |
| 推送、PR、部署、线上验收 | NOT RUN | 第一阶段授权止于本地提交，等待人工验收 |

确认的运行时 P1/P2/P3：**0/0/0；修复 0**。另有 **1 项 P3 文档漂移，未修改**：`docs/collection/DESIGN.md` 描述旧的三联/配对/整行展示，而 `collection/styles.css` 后段已采用统一三列、平板两列、手机单列。实际页面布局通过本轮抽检，不据旧文档回退它。这不是运行时故障。

## 本地 Git 与预览

- 分支：`main`。开始时工作区干净，没有既存未提交文件；未使用 stash、reset 或清理命令。
- 起点、测试的运行时源码、开始及提交前核对的远端 `main`：`1c739bbdabf25f48a957b71e3e7435900baeac86`。
- 本轮提交清单：一个本地文档提交，`docs: record collection production audit for local acceptance`，只含本报告。源码和依赖未变，未新增运行时测试来重复既有实现。
- **当前本地 HEAD、准确提交 SHA、提交后 ahead/behind 和工作区实测结果**：见提交后生成的 [git-state.json](../../../collection-review-evidence-20261012-01a13020/git-state.json)。报告无法在自己的内容中嵌入自己的提交哈希；交付回复也会给出该 SHA。
- **尚未推送、等待人工验收**。没有创建远程 PR、发布或修改远端配置。
- 预览持续运行：PID **25476**，`127.0.0.1:4175`。入口：[打开 Collection](http://127.0.0.1:4175/ai-web-experience-collection/)。最终 `dist/` 是项目路径生产构建。
- 若服务已停止，在仓库目录执行：`npm run preview -- --port 4175 --strictPort --base=/ai-web-experience-collection/`。本次已生成 `dist/`；不必重新安装依赖。

## 29 站状态总览

“基础 PASS”包含两种尺寸的真实首屏、字体到达及可见媒体检查、页面/控制台错误和请求失败记录；桌面含主页点击进入、滚轮、刷新和返回。手机直接加载通过，各站也检查了滚动，ORBITAL 使用触摸复核。未把未进入章节的懒加载素材记成缺图。手机逐站完整入口往返和真机触摸未全部执行。

| 子站 | 状态 | 发现摘要 / 已跑范围 | 改动 | 验证状态 | 建议重点看 |
| --- | --- | --- | --- | --- | --- |
| Beyond the Limit / f1 | KEEP | 首屏、滚动和文档导航正常 | 否 | 基础 PASS | 否 |
| VERDANT | KEEP | 首屏及中段前进/反向抽查正常 | 否 | 基础及中段 PASS | 可选 |
| ORBITAL | KEEP | 滚轮模拟限制已补触摸前进/反向复核 | 否 | 基础、模拟触摸 PASS | 可选 |
| GLAZE | KEEP | 首屏及中段前进/反向抽查正常 | 否 | 基础及中段 PASS | 可选 |
| KAGE / VOID | KEEP | 首屏、滚动和文档导航正常 | 否 | 基础 PASS | 否 |
| CHRONOS | KEEP | 首屏、滚动和文档导航正常 | 否 | 基础 PASS | 否 |
| INTERVAL | KEEP | 首屏、滚动和文档导航正常 | 否 | 基础 PASS | 否 |
| FORM | KEEP | 首屏、滚动和文档导航正常 | 否 | 基础 PASS | 否 |
| FUSION | KEEP | 首屏、滚动和文档导航正常 | 否 | 基础 PASS | 否 |
| GLASSHOUSE | KEEP | Reflection 裁切候选为进入阶段设计，稳定区完整 | 否 | 基础及同坐标复核 PASS | 是 |
| VEIL | KEEP | 六章、材质/折叠、模式、刷新和响应式深检 | 否 | 基础及深检 PASS | 是 |
| OPTIC | KEEP | 首屏、滚动和文档导航正常 | 否 | 基础 PASS | 否 |
| INKSCAPE | KEEP | 首屏、滚动和文档导航正常 | 否 | 基础 PASS | 否 |
| FACET | KEEP | 首屏、滚动和文档导航正常 | 否 | 基础 PASS | 否 |
| SILICON | KEEP | 首屏、滚动和文档导航正常 | 否 | 基础 PASS | 否 |
| ATLAS | KEEP | 末章 Atlas 到 Orbit 的反向抽查正常 | 否 | 基础及末段 PASS | 可选 |
| THRUST | KEEP | 首屏、正反滚动和文档导航正常 | 否 | 基础 PASS | 否 |
| RESONANCE | KEEP | 首屏、正反滚动和文档导航正常 | 否 | 基础 PASS | 否 |
| AETERNA | KEEP | 1 → 2 → 3 → 反向回 2 的抽查正常 | 否 | 基础及交接抽查 PASS | 可选 |
| PARALLAX | KEEP | 首屏、正反滚动和文档导航正常 | 否 | 基础 PASS | 否 |
| LUTHIER | KEEP | 首屏、正反滚动和文档导航正常 | 否 | 基础 PASS | 否 |
| CODEX | KEEP | 到 X / Codex，再反向至 IX/VIII/VII | 否 | 基础及末段 PASS | 可选 |
| MAGMA | KEEP | 保留主页 `#pressure` 入口，直接加载正常 | 否 | 基础 PASS | 否 |
| FOSSIL | KEEP | 10 / Deep Time → 反向 09 / Archive 正常 | 否 | 基础及末段 PASS | 可选 |
| URUSHI | KEEP | 10 / Depth → 反向 09 / Reveal 正常 | 否 | 基础及末段 PASS | 可选 |
| NIB | KEEP | 首屏、正反滚动和文档导航正常 | 否 | 基础 PASS | 否 |
| CREMA | KEEP | 首屏、正反滚动和文档导航正常 | 否 | 基础 PASS | 否 |
| CRAVE | KEEP | 首屏、正反滚动和文档导航正常 | 否 | 基础 PASS | 否 |
| GRID | KEEP | 桌面/手机十二系统、框架/字轴及宽矮屏深检 | 否 | 基础及深检 PASS | 是 |
| Collection（另列） | KEEP | 29 作品+Credits；四尺寸标题边界无碰撞；无 JS 导航可用 | 否 | PASS；有文档漂移 | 可选 |
| Credits（另列） | KEEP | 桌面/手机可读、手机无横向溢出；95 本地链接 200 | 否 | PASS | 否 |

## 重点复核及证据

**本轮没有源码改动，也没有虚构“修改前 → 修改后”的提升。** 以下是现有行为的基线和疑点复核，图片不是优化效果对比。精选证据在仓库外的同级目录 `collection-review-evidence-20261012-01a13020/`，约 7 MB；未提交图片、脚本、日志或 `dist/`。原始证据保留在 `C:/Users/admin/.codex/visualizations/2026/10/12/01a13020-1e1c-7193-ad99-827603dff3fb/refinement/`。

### VEIL — 保留同一块布的六章变化和折叠恢复

实际依次进入 Thread、Drape、Light、Form、Detail、Veil，手机也逐章进入。折叠释放令 Tension 从 45 到 5，恢复回 45；键盘可把 Tension 设为 100 或 0，Weave 设为 Close，Light 设为 Diffuse。Index 可跳章、Escape 可关闭，关闭后滚轮继续有效。刷新前后 documentY 均为 6561。

减少动画时 Motion 禁用、环境运动暂停，Light 仍可进入；`?render=still` 可到 Detail，材质滑块隐藏。覆盖 320×568、390×844、768×1024、844×390、1440×650、1440×900、1920×1080、2560×1440、3840×2160 的部分代表构图；非两种主尺寸没有逐章截图。4K 缓冲为 3040×1710，即 5,198,400 像素，上限生效。

并行巡检结束后单独采样：Chrome headless、DPR 1、RX 7900 XT/D3D11。Opening、Light、Detail 桌面和 Detail 手机视口分别采 2.4 秒，RAF 回调间隔中位数约 6.2–6.3 ms、P95 约 6.3 ms，各组无超过 34 ms 的间隔。这是**浏览器回调节奏，非 GPU 渲染耗时或物理设备 FPS**；没有前后性能改进，也没有据此保证低端设备流畅。没有复现需修改的卡顿。

证据：[六章桌面](../../../collection-review-evidence-20261012-01a13020/veil-chapters-before.png)、[手机首屏](../../../collection-review-evidence-20261012-01a13020/veil-before-mobile.png)、[行为/尺寸记录](../../../collection-review-evidence-20261012-01a13020/parent-checks.json)、[采样数据](../../../collection-review-evidence-20261012-01a13020/veil-frame-cadence.json)。相关实现 `experiences/veil/src/main.ts`、`visual/TextileWorld.ts` 及现有 `tests/veil-timeline.test.mjs` 均未变。

### GRID — 动态字体和框架控件没有被关闭

桌面/手机十二套系统均逐一点击、截图并查看联系表。Interface 框架手机可由 316 px 变到 278 px，1440×650 下可由 1226 px 变到 711 px，Reset 回到原宽度。Variable 的四轴可设为 1000 / 25 / −10 / 144，Reset 回到 390 / 105 / 0 / 70；文字仍在原设计系统内，未禁用动态字体。

768×1024、1920×1080、2560×1440、3840×2160 抽查 International，没有文档横向溢出。宽矮屏检查 Interface 交接和反向操作；减少动画下 Variable 可直接进入并保留四轴。无“完整辅助功能合规”或所有交接坐标均通过的声明。

证据：[十二系统桌面](../../../collection-review-evidence-20261012-01a13020/grid-desktop-contact.png)、[十二系统手机](../../../collection-review-evidence-20261012-01a13020/grid-mobile-contact.png)、[控件数据](../../../collection-review-evidence-20261012-01a13020/grid-controls.json)、[补充尺寸/模式](../../../collection-review-evidence-20261012-01a13020/grid-additional-checks.json)。现有 GRID 渲染、布局、字轴源码和回归测试未变。

### GLASSHOUSE — 原始候选及反证均保留

初步复现：1440×900，滚到总文档高度约 56%，反向 850 px 后停下；Reflection 的“Nothing exists alone.”只露出部分字。最初被子代理标为 FIX。

中央复核：停止位置为 documentY 5097，总可滚动距离 9720，Reflection 局部进度 **0.1463**，属于设计规定的进入阶段（揭示 0.03–0.23），尚未到稳定区 0.24–0.68。从上方向同一位置前进，也得到完全相同的 caption 0.621 和裁切 37.9%。点击 Reflection 后落在 documentY 5378，caption 1.000、无裁切，标题完整。等待时间不会推进按滚动位置采样的揭示，不能以“等了七秒仍裁切”断言故障。

结论：最终 KEEP，没有改擦入、时钟或平滑。原始 FIX 判定留在证据记录中，附有最终纠正理由。

证据：[反向中间态](../../../collection-review-evidence-20261012-01a13020/glasshouse-repro-reverse.png) → [同坐标正向](../../../collection-review-evidence-20261012-01a13020/glasshouse-repro-same-coordinate-forward.png) → [稳定区完整标题](../../../collection-review-evidence-20261012-01a13020/glasshouse-reflection-stable.png)，[测量及复核结论](../../../collection-review-evidence-20261012-01a13020/glasshouse-reconciliation.json)。依据为现有 `journey.js`、`ui.js` 和设计说明，没有源码变更。

### 其他站的原始覆盖

[第一组桌面](../../../collection-review-evidence-20261012-01a13020/smoke-a-desktop.jpg)、[第一组手机](../../../collection-review-evidence-20261012-01a13020/smoke-a-mobile.jpg)、[第一组记录](../../../collection-review-evidence-20261012-01a13020/smoke-a.json) 包含原始候选和最终纠正；[ORBITAL 触摸复核](../../../collection-review-evidence-20261012-01a13020/orbital-mobile-touch-recheck.json) 保留初始滚轮无位移这一反例。

[第二组桌面](../../../collection-review-evidence-20261012-01a13020/smoke-b-desktop.png)、[第二组手机](../../../collection-review-evidence-20261012-01a13020/smoke-b-mobile.png)、[第二组记录](../../../collection-review-evidence-20261012-01a13020/smoke-b.json)、[重点前进/反向联系表](../../../collection-review-evidence-20261012-01a13020/deep-contact.png)、[实际章节记录](../../../collection-review-evidence-20261012-01a13020/deep-results.json)。两组各覆盖 14 站，VEIL 由主代理单独覆盖。没有沿用上游历史验收数字作为本次结果。

## 5–10 分钟人工复核路线

本轮没有新增效果，下面用来确认保留决定是否符合你的实际观感。如果不通过，请反馈具体站、章节、尺寸和动作。

1. [VEIL / Form](http://127.0.0.1:4175/ai-web-experience-collection/veil/#form)：点 Release the fold，再点 Restore the fold。布面应打开再回原形；随后通过 Index 看 Light 与 Detail，并反向滚回。若折叠不能还原、材质不见或正文长期被遮挡，记为不通过。
2. [GRID / Interface](http://127.0.0.1:4175/ai-web-experience-collection/grid/#interface)：拖 Change the screen 到两端，再 Reset；到 09 Variable 拖四个字轴再 Reset。框架应真的重新排版、字体真的改变；若正文相撞、控件消失或 Reset 无效，记为不通过。建议同时看手机宽度和宽矮窗口。
3. [GLASSHOUSE / Reflection](http://127.0.0.1:4175/ai-web-experience-collection/glasshouse/#reflection)：确认完整标题，缓慢向上进入交接，再向下回稳定构图。中间态会擦去/揭出文字，稳定区必须完整；稳定区仍少字或正反方向同位置不同，记为不通过。
4. [AETERNA](http://127.0.0.1:4175/ai-web-experience-collection/aeterna/)：通过 Index 或滚动看第一到第三室，再反向。留意雕塑/图片交接是否出现持续黑块或不可恢复空屏；本轮抽查未确认这些问题。
5. [Collection](http://127.0.0.1:4175/ai-web-experience-collection/)：任选作品进入再返回，并看手机列表。29 作品均应可进入；若漏图、标题被切或返回错误，记为不通过。

可选全面路线：看 [ATLAS](http://127.0.0.1:4175/ai-web-experience-collection/atlas/) 10→11→10、[FOSSIL](http://127.0.0.1:4175/ai-web-experience-collection/fossil/) 09→10→09、[CODEX](http://127.0.0.1:4175/ai-web-experience-collection/codex/) 尾章并反向、[URUSHI](http://127.0.0.1:4175/ai-web-experience-collection/urushi/) Depth→Reveal；再查看 [Credits](http://127.0.0.1:4175/ai-web-experience-collection/credits.html)。这些都是本次实际访问的项目路径 URL。

## 剩余范围与边界

- **NOT RUN：**Safari、Firefox、iOS、物理 Android/触摸设备、高刷新率硬件专项、低端 GPU、长时间内存/资源泄漏检查，以及所有作品全部控件、全部章节、全部 fallback。没有声称“全平台通过”。
- **NOT RUN：**真实隐藏标签页暂停/恢复。本轮 headless 标签切换后页面仍报告 `visible`，因此该动作不构成隐藏证据。历史验收记录不能替代此次运行。
- **NOT RUN：**VERDANT 专项宽矮全程、其余 KEEP 站六种大视口全章节。全部站的统一基线是桌面/手机首屏与短程 smoke；深检范围已逐站列明。
- WebGL 硬件路径实际可用；VEIL 静态模式和减少动画、GRID 减少动画另有实测。其他模式没有逐站复验。没有新增资产、改许可、改来源声明、升级依赖或重新生成原始素材。
- 不把快滚抽查解释为逐帧无闪烁证明，也不把 RAF 间隔解释成材质优化效果。需要真机证实的问题仍需真机证据。
- 图谱发现的 partial/stale 元数据通过相关源码直接读取补证，特别是 GRID `scenes.ts` 的 250/270/329 行；结构结论未只依赖旧索引。
- 外部临时脚本/日志和原始证据保留；测试浏览器会话已结束，验收预览仍运行。没有清理用户数据或 Git 引用。
- 本轮在本地提交后停止。人工验收反馈若指出问题，再复现、修补并追加本地提交；推送和发布仍需你明确授权。
