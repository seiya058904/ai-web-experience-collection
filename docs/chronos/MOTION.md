# 运动与机芯模型 / Motion and mechanism

这份说明记录实际实现中的数值、时间关系与视觉简化。数值定义位于 [`src/mechanics.ts`](../../experiences/chronos/src/mechanics.ts)，章节映射位于 [`src/narrative.ts`](../../experiences/chronos/src/narrative.ts)，共享时钟与交互位于 [`src/main.ts`](../../experiences/chronos/src/main.ts)。

## 六个视角，共用一套结构

| 章节 | 主体与过渡 |
| --- | --- |
| 01 Time | 完整腕表与局部反光；滚动沿表盘开口进入 |
| 02 Energy | 打开发条盒，观察发条与储能关系 |
| 03 Transmission | 展开轮系与桥板，沿轴向分层展示轮与小齿轴 |
| 04 Oscillation | 聚焦擒纵轮、擒纵叉、摆轮与游丝 |
| 05 Craft | 以生成的摄影风格图像观察表面处理与宝石细节 |
| 06 Chronos | 沿同一场景结构收拢，返回完整腕表图像 |

章节标记位于总滚动进度 `0, 0.2, 0.4, 0.6, 0.8, 1`。`cameraProgress()` 在每个区间的前 28% 保持构图，随后推进，并在区间的 85% 前完成交接。几何和摄像机状态按当前进度求值，反向滚动沿同一映射返回。停留时的机械时钟独立运行。

摄影与实时机芯之间通过共用屏幕像素坐标的圆形光圈交接，两层表面保持不透明，并使用互补蒙版。开场光圈在进度 `0.028–0.125` 扩大，收尾在 `0.912–0.982` 收拢；腕表外层框架持有蒙版，内部图像继续按构图移动。Craft 图片使用独立的圆形裁剪，在 `0.717–0.776` 打开，在 `0.837–0.904` 关闭。

Craft 的圆心从过轮（Third wheel）宝石正面的实时屏幕投影出发，再按 `smooth(0, 0.72, craftIris)` 移到原定摄影构图。`craftIris` 同时控制开合半径；反向滚动沿同一映射回到宝石。控制器变换完整的 1536×1024 照片，让源图中的宝石中心 `(1155, 460)` 始终落在圆心，再完成既定裁切与缩放。每帧先渲染机芯、更新相机和部件矩阵，再投影并绘制光圈，避免使用上一帧的宝石位置。这里衔接的是可见宝石特征，不表示摄影与几何是同一个真实制造部件。

开场光圈露出实时画面前，实时表盘圈、刻度和指针已打开，窗口内只显示内部机芯；摄影中的外侧表壳仍保持可见。这样避免在同一个光圈里叠出第二套表盘与指针。静帧素材缺失时，实时机芯仍能显示自己的完整表盘。

## 时间关系

设 `p` 为归一化滚动进度，`t` 为仅在体验可见、未暂停、未打开弹窗时累积的环境机械时间：

```text
t += active frame seconds × (slow ? 1/32 : 1/8)
mechanism time = t + 90 × p
```

默认停留时每 8 个实际秒推进 1 个机械秒，`Look closer` 切换为每 32 个实际秒推进 1 个机械秒。速度切换只改变后续增量。滚动从开场到结束另外推进 90 个机械秒；反向滚动相应回退这一部分，所以拖动页面时的运动速度由滚动速度决定。普通动态模式下，界面的 `MECHANICAL SECONDS` 读数显示同一合成机械时间 `t + 90p`。

暂停按钮只停止累积环境时间，保留当前机械相位，滚动仍可改变摄像机和 `90p` 部分。减少动态效果时使用固定机械姿态，摄像机改用对应章节的静态构图。标签页隐藏时停止累积环境时间与传给 Lenis 的帧时基；恢复后不追赶隐藏期间的时长。音效通过 Web Audio 本地生成，只在用户主动开启且体验运行时，按同一合成机械时间 `t + 90p` 的节拍发声。

减少动态效果下，数字仍保留 `t + 90p` 的滚动时间标示，而固定机械姿态使用模型内的 `0.0375` 秒相位。`?render=still` 选择摄影静帧版本，并不自动开启系统的减少动态效果模式；它保留滚动及摄影图像运动逻辑。

主控只创建一个 Lenis、一个 ScrollTrigger 和一个持续保留的 WatchScene。GSAP ticker 是统一的帧调度入口，驱动 `lenis.raf()`、页面状态和 Three.js 渲染；场景类不另开动画循环。模式切换、窗口调整和资源就绪时更新布局测量，不为每个章节重建滚动控制器或机芯。有关集成依据，见 [Lenis 官方文档](https://github.com/darkroomengineering/lenis) 与 [ScrollTrigger 文档](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)。

页面滚动键会先取消尚未完成的平滑滚动；其中 `Home` / `End`（含 `Ctrl` 组合）随后立即到达页面起点 / 终点，`PageUp` / `PageDown`、方向键及非控件空格仍交由浏览器原生滚动。表单输入、弹窗和按钮的空格激活不受该中断逻辑影响。系统减少动态效果偏好变化时，先显式停止旧 Lenis 动画，再更新模式和布局，按原先的停止状态恢复滚动控制，防止旧动画继续追向已改变的目标。

滚动时基在前台使用真实帧间隔，仅在标签页或生命周期恢复的首帧移除停用期间的间隔，避免慢帧下的滚动持续追赶。机械环境时钟单帧最多计入 50 毫秒，以免运动姿态突然跨过较大相位。

## 摄像机与渲染组织

[`WatchScene`](../../experiences/chronos/src/scene/WatchScene.ts) 使用视野角 30°、近裁剪面 0.075、远裁剪面 100 的 `PerspectiveCamera`。每个章节给定观察目标和可见跨度；摄像机距离按 `span / (2 × tan(FOV / 2))` 求得，并随章节插值改变，因此具有透视深度关系。窄屏和纵向构图单独调整目标宽度与画面偏移。

[`batch.ts`](../../experiences/chronos/src/scene/batch.ts) 在各个可动组件内部按相同材质合并静态细节，保留组件本身的变换。重复紧固件使用实例化绘制，独立指针与会变形的弹簧保持独立。这样减少重复绘制提交，同时保留轮系转动与爆炸视图的层次。程序创建的三条发光灯箱与后侧补光经 PMREM 转为本地环境贴图，定义于 [`studio.ts`](../../experiences/chronos/src/scene/studio.ts)，不下载远程 HDRI。WebGL 上下文恢复时重新生成该环境纹理，继续使用当前场景实例。

渲染器的设备像素比上限为 1.5，并另受约 205 万个画布像素的预算限制。页面与机芯共用 `portraitLayout(width, height)`：宽度不超过 700px，或宽度不超过 1100px 且宽高比不超过 `43/50`，均使用纵向构图；CSS 使用对应条件。阴影贴图在该构图中采用 512 边长，其余使用 1024。被完整照片遮盖、弹窗打开或状态未变化时，主控可以跳过实时绘制。这些是代码中的负载控制方式，不是帧率保证。

页面按真实舞台高度计算取景与屏幕蒙版。纵向平板使用上下构图、较宽留白和独立文字比例；紧凑布局隐藏重复的机械旁注，并为 Oscillation 文字及数字增加局部保护渐变。宽度不超过 700px 且高度不超过 680px 时，收尾腕表采用正常收尾缩放的 0.63 倍，中心下移到舞台高度的 70.5%；Oscillation 和 Chronos 的文字保护进一步加深。宽度 701–950px、高度不超过 550px 时使用单独的左右横向构图，具体断点见 [`DESIGN.md`](DESIGN.md)。

## 选定轮系

以下是为这个作品选择的原创齿数组合，以擒纵轮转向为正方向。平均速度按名义机械时间计算，未乘展示慢速系数。

| 轴 | 本轴轮齿数 | 接收前级动力的小齿轴齿数 | 相对擒纵轮角速度 | 平均转数 / 机械小时 |
| --- | ---: | ---: | ---: | ---: |
| 发条盒 Barrel | 72 | — | +1/5760 | +1/6 |
| 中心轮 Centre | 80 | 12 | −1/960 | −1 |
| 过轮 Third | 75 | 10 | +1/120 | +8 |
| 四轮 Fourth | 96 | 10 | −1/16 | −60 |
| 擒纵轮 Escape | 15 | 6 | +1 | +960 |

每级大轮与下一级的小齿轴啮合；同轴大轮与小齿轴一起转动，相邻外啮合副转向相反。中心轮到四轮的速比为 60:1，四轮到擒纵轮为 16:1。这些是本项目根据所选齿数推导的关系，不是某个商品机芯的规格。

共同模数为 `0.022`，单位是模型坐标单位。轮心距等于 `module × (driver teeth + receiving pinion teeth) / 2`，与 [KHK 中心距公式](https://khkgears.net/pdf/2025/spur-gears.pdf) 相符。连接方向经过折叠安排，保持该距离。连续轮平面相距 `0.07`，接收小齿轴位于前一级轮的平面。齿与齿隙通过固定局部相位对齐。

## 擒纵、摆轮与游丝

模型选择名义 **4 Hz**：每秒 4 次完整振荡、8 个节拍，等于每小时 28,800 个节拍。完整振荡和节拍的区分参照 [BHI Technician Lesson 1，印刷页 29](https://bhi.co.uk/wp-content/uploads/2018/03/BHI-DLC-Tech-L1.pdf)。

15 齿擒纵轮每节拍转过半个齿距，即 `360° / (2 × 15) = 12°`；这与 [Tam、Fu、Du 的瑞士杠杆擒纵示例，§2.3](https://www.cad-journal.net/files/vol_4/CAD_4(1-4)_2007_127-136.pdf) 的角度关系一致。由本项目所选频率推导，擒纵轮平均转速为 `8 × 12° / 360° × 60 = 16 rpm`。

实现将每个节拍前 12% 设为短暂释放段，使用平滑插值推进 12°；其余时间保持锁定。全轮系角度由同一个擒纵角度推导。摆轮使用正弦往复运动、选定摆幅 ±250°；擒纵叉在 ±5.5° 两个止位之间交替。游丝随内端的摆轮变形，外端保持固定。

这些相位、幅度和释放占比服务于清晰可读的电影化表达。没有进行接触、冲击、摩擦、惯量或弹性动力学求解；不能从画面推断真实走时精度或加工尺寸。能量和调速的基本关系参照 [Grand Seiko 的机械机芯说明](https://www.grand-seiko.com/us-en/collections/movement/mechanical)。

## 有意采用的视觉简化

- 擒纵轮的模型分度半径为 `0.165`，可见轮廓放大到 `0.30`，以便读清释放动作；它不代表精确的齿面接触几何。
- 爆炸视图将部件沿轴向分开；该状态用于展示层次，不是能保持实体啮合并正常运行的装配状态。
- 发条与游丝采用程序曲线变形，不求解材料应力；金属纹理、反射、宝石、刻字及加工痕迹用于视觉叙事。
- 生成的开场 / 工艺图像与实时几何不保证每个部件一一对应；均不代表经过验证的真实品牌制造品。
- 画布按照设备与视口限制像素预算。1080p、1440p 和 4K 窗口使用响应式布局；画布内部像素数可能低于窗口的物理像素数。

## 检查入口

增强模式的章节 hash 由原有导航控制器解释。舞台使用 `overflow: clip`，场景 article 的原生 id 添加 `-view` 后缀；标题的 aria 引用保持原样，源码 HTML 的普通章节锚点仍服务于无 JavaScript 版本。这样直接打开或刷新 `#oscillation` 时，浏览器不会另行滚动 sticky 舞台或将文档推到末尾。销毁时恢复原章节 id，便于热更新重新初始化。

仓库根目录的 `npm run build` 检查类型并构建，`npm test` 运行共享测试；浏览器中的 `?inspect` 可启用只读诊断入口 `window.__CHRONOS__.inspect()`。`?render=still` 可直接检查没有实时机芯时的内容与导航。这些是复查方式，不构成未实际运行平台的通过声明。

## English model notes

One original 3D assembly and a **30° PerspectiveCamera** carry through the live chapters, driven by one persistent page controller. Scroll progress controls camera composition, assembly separation and a reversible offset of **90 mechanical seconds** over the full journey. A separate active clock advances at **⅛ speed**, or **¹⁄₃₂ speed** in the closer study. The mechanical readout and optional sound use the combined time. Pause freezes ambient advance while preserving scroll access; reduced motion selects fixed chapter compositions and a fixed mechanism pose. Material batching, instanced fasteners and a roughly 2.05-million-pixel canvas budget control rendering load.

The chosen train is **72 / 12 → 80 / 10 → 75 / 10 → 96 / 6**, ending at a 15-tooth escape wheel. Wheel-to-next-pinion pitch distances use module **0.022** in model units. Signed shaft speeds relative to the escape wheel are **+1/5760, −1/960, +1/120, −1/16, +1**. The nominal balance frequency is **4 Hz**, with eight beats per mechanical second; a **12°** escape step gives **16 rpm** on the escape shaft. The 12% release window and chosen swing amplitudes are cinematic model parameters.

This is a kinematic study, with deliberately enlarged escapement geometry and illustrative spring deformation. Exploded separation is an explanatory presentation, not a functioning physical assembly. The artwork does not simulate contact dynamics, manufacture, power reserve or timing accuracy. Primary mechanical sources and generated-image provenance are recorded in [ATTRIBUTION.md](../../provenance/chronos/ATTRIBUTION.md).
