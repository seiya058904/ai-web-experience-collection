# GLASSHOUSE — Design notes

## 一座持续变化的空间

核心画面由**八块共享玻璃面、六组姿态和连续相机运动**建立。光束、棱镜、镜面、文字与最终建筑在这套空间关系中出现，专用光投影纹理与程序化细节共同提供局部光迹。作品保持同一组对象的身份：一面玻璃经过移动、转向与展开，成为下一章的边界。

视觉语言围绕暖白、冷灰、深炭黑、轻微青色吸收与克制的光谱色建立。玻璃的大部分表面保持安静，厚度、边缘、局部高光和背后画面的改变负责表现材质。主体取景与大字互相留出空间；Manrope 文字既作为可访问的界面内容，也通过 Canvas 纹理进入材质场景。桌面 Hero 标题右侧 18% 的字形区域由 `type-plane.js` 放到玻璃后方，主体保留 DOM 清晰度；移动端标题全部保留为 DOM。

天空与远处地面共享 `atmosphere.js` 的线性光颜色场，地面的远端逐渐与同一背景融合。连续空间的边界来自玻璃、结构和光，背景不因天空与地面分别计算颜色而出现接缝。

| 章节 | 视觉任务与连接关系 | 主要源码 |
| --- | --- | --- |
| Light | 少量玻璃承接入射光；局部投影光迹和玻璃后的部分字形建立空间关系 | `world.js`、`type-plane.js`、`optical-pass.js` |
| Surface | 共享玻璃展开为材质对照；后方文字帮助观察透明、磨砂与镜面的差别 | `world.js`、`optical-pass.js`、`ui.js` |
| Refraction | 玻璃结构向棱镜和光路集中，进入深色空间；角度控制改变照明关系 | `world.js`、`optics.js` |
| Reflection | 三面镜子把主相机画外的门廊和 ECHO 字形带入构图 | `world.js`、Three.js `Reflector` |
| Layers | 同一组玻璃展开为层叠纵深，文字在多个表面后发生连续改变 | `world.js`、`optical-pass.js` |
| Glasshouse | 玻璃面转为侧墙、后墙与屋面，地面和结构共同完成最终建筑 | `world.js`、`optics.js` |

表中的项目源码均位于 `src/`。

## 场景生命周期

`src/journey.js` 将整个旅程映射为单一归一化坐标。每章局部进度的 **0.24–0.68** 留给完整构图；前后区间承担交接。交接跨越章节边界，几何和相机使用相同的混合权重，正向与反向都可从同一坐标重建主体姿态。

| 阶段 | 设计作用 | 实现位置 |
| --- | --- | --- |
| Enter | 从前一章的玻璃关系进入新构图，文案逐渐具备可读性 | `journey.js` 的交接采样；`ui.js` 的文案状态 |
| Stable composition | 主要结构完整停留，文字和控制器清晰可用 | `journey.js` 的稳定区间；`world.js` 的六组姿态 |
| Living hold | 在可辨认的构图内保留轻微入射角、高光、层距和相机呼吸 | `world.js` 的 hold / ambient 参数；程序化光场 |
| Handoff | 共享玻璃面、结构与相机共同向下一组姿态变化；棱镜与门框沿纵深退远并渐隐 | `world.js` 的 `POSES` / 相机插值、光学权重 |
| Exit | 前一章的文字让出阅读位置，物体继续留在空间中参与下一章 | `ui.js` / `style.css`；共享对象仍由 `world.js` 持有 |

`src/main.js` 只使用一个 GSAP ticker：推进 Lenis，更新 ScrollTrigger 进度，再采样与渲染。异步资源初始化完成后继续使用 `gsap.ticker.time`，保持提前滚动的时间连续性。固定画布配合文档滚动距离工作，**没有 pin / unpin 生命周期**。几何直接读取进度；环境时间独立累积，暂停、减少动态效果和隐藏标签页均有相应处理。

页面的方向键、翻页键、Home / End 与空格滚动也进入同一个 Lenis 控制器。表单、按钮、可编辑区域和已被其他控件处理的事件保留各自的键盘行为。

## 玻璃是画面的一部分

`src/optical-pass.js` 先生成背景与不透明物体的画面和深度，再按远近逐层合成玻璃。支持浮点颜色缓冲时使用线性 HDR，必要时使用 8 位缓冲；两张缓冲交替读写，每一层都能取到其后方已经完成的图像。折射与吸收由自定义着色器处理，镜面高光和环境照明继续使用 `MeshPhysicalMaterial` 的计算。

磨砂通过 mip 层级扩散采样足迹，使后方文字融为连续形状。全部玻璃合成后，`optical-pass.js` 在同一个末端 pass 完成 FXAA：最终采样先经过 ACES 色调映射和 sRGB 输出转换，边缘判断使用显示亮度差。每个采样只转换一次，前面的光学合成维持在线性颜色中。

`public/glasshouse/media/focused-light.png` 是 OpenAI ImageGen 专为本项目生成的黑底光投影纹理。它作为材质输入，经 GLSL 按世界空间光向投射到局部玻璃和地面。`src/caustic-field.js` 的原创尖点与分叉光迹补充细节；两者共同形成缓慢变化的聚焦感。纹理不承担整屏构图或建筑摄影的作用。

三面真实平面镜使用 Three.js `Reflector` 渲染画外空间；每次生成当前镜子的镜像视图时，其余镜子暂时隐藏，避免递归。地面上的延伸倒影则由翻转几何和衰减材质完成，属于另一种视觉近似。

`type-plane.js` 在布局变化时重新测量标题；Canvas 像素尺寸发生变化就释放旧纹理并创建新纹理，再把文字平面与新的屏幕位置对齐。清晰的 DOM 主体与经过玻璃的字形因此共用同一套排版尺寸。

这些是为实时视觉创作设计的屏幕空间和程序化近似；没有把效果描述为完整物理光线追踪。素材来源、第三方实现与官方研究链接见 `ATTRIBUTION.md`。

## 手机重新取景

- `world.js` 使用独立的 `MOBILE_CAMERAS`，调整相机高度、距离、注视点与视角。
- 进入 Layers 时，中间部分玻璃面的光学贡献连续淡出，边缘、地面倒影和阴影同步减弱；接近不可见后再停止绘制。反向滚动使用同一权重恢复，稳定构图保留清晰的窄屏纵深。
- `style.css` 重新分配标题、正文、滑块和底部导航；短屏与横屏有独立规则。
- Hero 标题完整使用 DOM，保持小屏字形清晰与阅读连续性。
- `journey.js` 缩短手机滚动距离；减少动态效果模式进一步压缩旅程，并移除长距离姿态插值。
- 渲染分辨率受像素预算约束。DPR 1 桌面在预算内默认请求 1.25 倍渲染像素比进行超采样，其他设备也受像素比上限和自适应降级控制；视口分辨率与每次离屏绘制的像素数量可以不同。

## 验收原则

验收先检查每章停止时的构图，再检查慢滚、快速反向和任意跳转中的交接，同时检查界面可读性、控件用途、玻璃层之间的内容可见性与手机取景。实际完成的浏览器环境、检查范围、修复复验和真实设备验证边界统一记录在 `UPSTREAM-README.md` 的“验收记录”中（上游记录，不代表 Collection 当前构建）。

## Collection integration

Source remains under `experiences/glasshouse/src/`; the independent document is `pages/glasshouse/index.html`. Runtime resources and original notices are namespaced under `public/glasshouse/`. A base-aware shared Collection link is added to the existing header. The GSAP ticker, Lenis instance, optical passes and six authored compositions remain intact. Non-persisted page exit disposes owned resources; BFCache retains the supplied restoration path. Mobile header spacing accommodates the return control, and Refraction/Reflection copy uses a small dark text shadow to remain readable across bright glass edges.
