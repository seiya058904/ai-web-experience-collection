# FUSION — 科学与技术资料

资料核对日期：**2026-10-05**。以下均为机构或项目的一手资料，用于校准科学关系与实现方式。引用采用转述；原网页的照片、插画、影片及模型没有作为素材打包。

## 科学参考与实际用途

| 一手资料 | 用于本作品的事实与关系 | 对应表达 |
| --- | --- | --- |
| [ITER — What is a tokamak?](https://www.iter.org/machine/what-tokamak) | 托卡马克具有环形真空室，利用磁场约束带电等离子体；辅助加热把粒子推进到聚变所需的高温条件。该页面用约 150 million °C 说明极端温度量级。 | 贯穿八章的环形装置；从初始电流到升温的叙事；150 M°C 温度示意。 |
| [ITER — Magnets](https://www.iter.org/machine/magnets) | ITER 的磁体系统包括 18 个 D 形环向场线圈、6 个极向场线圈、中央螺线管与校正系统；不同组件承担约束、塑形、电流感应和稳定控制等不同作用。 | 重复的 D 形线圈、水平环、中央结构与反馈秩序。作品的比例和材质为原创设计，不是 ITER 的施工模型。 |
| [ITER — Vacuum Vessel](https://www.iter.org/machine/vacuum-vessel) | 环形双壁真空室为等离子体提供真空环境，并支撑内部包层、偏滤器等组件。 | 分段外壳、内壁层次和前部剖面；打开外壳时仍保留连续的腔体关系。 |
| [ITER — Divertor](https://www.iter.org/machine/divertor) | 偏滤器位于真空室下部，处理来自等离子体的热与粒子排出；相关区域承受集中热负荷。 | 反应堆下部组件与热流方向的工程参考。没有将其描绘为简单封闭、没有排热路径的发光容器。 |
| [U.S. Department of Energy — DOE Explains…Tokamaks](https://www.energy.gov/science/doe-explainstokamaks) | 环向与极向磁场分量组合成扭转的磁力线结构；外部极向线圈帮助控制等离子体形状与位置。 | Helical、Toroidal、Poloidal 三种可切换路径；粒子运动围绕受约束的环面组织。 |
| [ITER — Making fusion work](https://www.iter.org/fusion-energy/making-it-work) | 聚变条件同时涉及温度、粒子密度与约束时间。D–T 反应产生的带电氦核可继续加热等离子体；中子可离开磁约束区，将能量传向周围结构。把热转为电力还需要后续工程系统。 | 热、约束和反馈的共同作用；第七章的能量去向；第八章“热—换热—发电”的概念路径。 |
| [ITER — The magic cocktail of deuterium and tritium](https://www.iter.org/node/20687/magic-cocktail-deuterium-and-tritium) | 氘与氚是相关聚变研究中的重要燃料组合；一次基本 D–T 反应产生氦-4和中子，释放约 17.6 MeV。带电 α 粒子与不带电中子的约束行为不同。 | 第七章的 `²H + ³H → ⁴He + n` 与 17.6 MeV 标注。 |
| [Princeton Plasma Physics Laboratory — Engineers use AI to wrangle fusion power for the grid](https://www.pppl.gov/news/2024/engineers-use-ai-wrangle-fusion-power-grid) | 2024 年报道描述了在 DIII-D 实验中预测特定撕裂模失稳，并通过调整运行参数规避它的控制研究。 | “检测偏差—调整—趋于稳定”的叙事逻辑。作品没有实现该研究的 AI 控制器，也没有复现其实验数据。 |

## 科学边界

这套视觉系统表达科学关系，并未求解磁流体力学、输运方程、粒子碰撞或核反应率。

- **温度**：界面中的数值由章节进度和加热滑块计算。150 M°C 用于传达温度量级；它不是任何聚变装置通用的“达到此数就成功”开关。
- **磁场激励百分比**：是可读的界面变量，不代表以特斯拉标定的磁场，也不是某台装置电源的实际百分比。
- **边界偏差**：波形与 `Δ` 读数是归一化的示意信号，不对应真实测量单位或实验脉冲记录。
- **密度与粒子**：画面疏密是视觉采样。显示粒子数量并非等离子体粒子密度；发光轨迹也不是带电粒子完整的微观回旋轨道。
- **颜色、光与时间**：蓝紫、品红、橙白用于区分场与能量层次，不是定量光谱或黑体测温。大小、流速、波幅和播放时长均经过艺术化处理。
- **失稳与反馈**：协调波动呈现失稳趋势；反馈参数会减小其可见幅度。这一因果表达不等于实际撕裂模、ELM 或完整控制系统的数值模拟。
- **点火与发电**：“Ignition”是章节名；不宣称技术意义的聚变点火、自持燃烧门槛或净电力输出已经达成。最终能量网络是未来工程路径的概念表达。

## 技术一手资料

| 项目资料 | 对应实现 |
| --- | --- |
| [GSAP — gsap.ticker](https://gsap.com/docs/v3/GSAP/gsap.ticker/) | 单一应用动画时钟、帧间隔与回调生命周期。 |
| [GSAP — ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) | 从滚动范围读取章节进度，以及字体就绪、页面恢复、窗口变化后的更新与刷新。 |
| [Lenis — Official repository and GSAP integration](https://github.com/propagande-studio/lenis) | `autoRaf: false`、`lenis.on('scroll', ScrollTrigger.update)`，在 GSAP ticker 中把秒转换为毫秒后调用 `lenis.raf()`。 |
| [Three.js — WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html) | WebGL 2 场景渲染、视口尺寸、像素比、渲染统计与资源释放。 |
| [Three.js — ShaderMaterial](https://threejs.org/docs/pages/ShaderMaterial.html) | 使用顶点 / 片元着色器及 uniforms，让时间、能量、场与控制参数驱动同一套视觉。 |
| [Vite — Configuration](https://vite.dev/config/) | 源码开发、静态构建与相对资源基路径。具体配置见 `vite.config.ts`。 |

实现版本由 `package.json` 与 `package-lock.json` 固定：Three.js 0.180.0、GSAP 3.13.0、Lenis 1.3.11。官网文档可能更新；重新构建应以随包锁文件为准。软件与字体授权另见 [ATTRIBUTION.md](ATTRIBUTION.md)。
