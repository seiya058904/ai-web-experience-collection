---
name: INTERVAL
description: Architecture between light & space.
colors:
  paper: "#eeece5"
  ink: "#292c28"
  muted: "#64685e"
  rule: "#c4c4b8"
  focus: "#576344"
  moss: "#647057"
typography:
  display:
    fontFamily: "Bodoni Moda, Georgia, serif"
    fontSize: "15.7vw"
    fontWeight: 400
    lineHeight: 0.88
    letterSpacing: "0"
  headline:
    fontFamily: "Bodoni Moda, Georgia, serif"
    fontSize: "clamp(28px, 3.3vw, 88px)"
    fontWeight: 400
    lineHeight: 1.07
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "clamp(12px, 1.01vw, 21px)"
    lineHeight: 1.65
  label:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "10px"
    fontWeight: 600
    letterSpacing: "0.25em"
  control:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 450
rounded:
  rectangular: "0"
  switch: "20px"
  dot: "50%"
spacing:
  gutter-desktop: "2.65vw"
  gutter-mobile: "20px"
  control-gap: "7px"
  caption-gap: "30px"
components:
  index-button:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.rectangular}"
    padding: "7px 0 7px 16px"
  chapter-nav:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.muted}"
    height: "54px"
  scene-caption:
    textColor: "{colors.ink}"
    typography: "{typography.headline}"
  index-row:
    textColor: "{colors.ink}"
    rounded: "{rounded.rectangular}"
    padding: "12px 6px 14px 0"
  motion-toggle:
    rounded: "{rounded.switch}"
    width: "38px"
    height: "22px"
  motion-toggle-active:
    backgroundColor: "{colors.moss}"
    rounded: "{rounded.switch}"
    width: "38px"
    height: "22px"
---

# Design System: INTERVAL

## Overview

**Creative North Star: "Architecture Between Light & Space"**

INTERVAL 把网页作为一段建筑动线：纸白界面提供秩序，建筑影像决定画面的重量，光、阴影与遮挡引导观看。整体安静、触感真实、比例精确；长时间停留时仍有极轻的空间生命。

视觉连续性来自同一座虚构海边建筑的材料、晨光与视线关系。字体负责入口识别和简短注释，正文避开摄影主体；空间交接由门洞、木柱和材料边缘完成。影像是本项目的 AI 概念创作，研究来源和生成记录分别保留在 `provenance/interval/ATTRIBUTION.md` 与 `provenance/interval/ASSET-PROVENANCE.json`。

**Key Characteristics:**

- 建筑影像主导，文字位于明确的安全边界。
- 暖纸白、混凝土、石材、木材与克制灰绿。
- 一个连续摄影机进度，完整展示之后才交接。
- 手机独立裁切，Reduced motion 保留完整可读内容。

## Colors

以暖纸白和偏绿的灰色建立低对比背景，深墨色保证文字清晰；摄影中的木材、天空与反射自然扩展色彩。

### Primary

- **Focus / 深灰绿**：键盘焦点轮廓，清晰指出当前可操作元素。
- **Moss / 苔灰绿**：Reduced motion 开关的选中状态，面积克制。

### Neutral

- **Paper / 暖纸白**：页面、页眉与导航的连续基底。
- **Ink / 深墨色**：主标题、核心文字和当前导航。
- **Muted / 温灰绿**：正文、次要注释与未选中的导航。
- **Rule / 浅石灰线**：导航、目录行和设置区的细分隔。

**The Light Rule.** 界面的颜色维持安静的阅读秩序，让摄影中的自然光、阴影与材料承担主要色彩变化。

## Typography

**Display Font:** Bodoni Moda，后备 Georgia / serif。<br>
**Body Font:** Manrope，后备 Arial / sans-serif。

Bodoni 的高对比笔画提供建筑出版物的秩序感；Manrope 承担小尺寸说明与操作。两者本地加载，未使用图片内嵌文字。

- **Display**：只用于入口的 INTERVAL 字标；逐字分布形成横向比例。移动端另用视口字号与较紧字距。
- **Headline**：六幕的短标题，保持轻量字重和紧凑行高，允许自然平衡换行。
- **Body**：注释文字采用适度行距；桌面副文案最多占注释区约三分之一，手机移至标题下方。
- **Label / Control**：编号标签大写并增加字距；操作文字保持正常大小写。

**The Margin Rule.** 标题和正文保持在影像外的注释区；门洞、柱网、地平线与受光面留给建筑。

## Layout

### 连续舞台

页眉、影像窗口、注释区和底部导航共享左右边距。正常模式使用一个 CSS sticky 舞台；摄影高度根据真实页眉与最高注释尺寸计算。首屏字标随进入过程让出空间，后续各幕复用同一观看窗口。

| 空间 | 稳定构图 | 通向下一幕的边界 |
| --- | --- | --- |
| Threshold | 石路越过水面，直面混凝土门庭 | 影像中实际门洞的投影放大 |
| Light | 顶光进入混凝土房间，光带指向木门 | 远端木门开口 |
| Frame | 暖木柱列与窗外松树、海面 | 近处木柱横向掠过 |
| Matter | 混凝土、木框、玻璃与石材节点 | 结构描线后，材料边缘侧向离开 |
| Void | 水庭、单树与面海开口 | 对面墙体中的实际门洞 |
| Silence | 屋面和边柱框住海面与天空 | 维持开放构图，提供返回入口 |

### 实际场景生命周期

主时间线每幕占一个进度单位，幕内进度记为 p。阶段可以共享边界：下一幕的 Enter 发生在上一幕 Handoff 内，避免两个独立章节互相抢占。

| 阶段 | 当前实现 |
| --- | --- |
| Enter | 首幕 p=0–0.205 扩展影像窗口；标题注释在 p=0.165–0.245 落位。其余场景从前一幕 p=0.65 起在建筑开口后进入，至前一幕结束完成揭示。 |
| Stable Composition | 首幕约 p=0.245 后形成完整画面；其余场景在本幕 p=0 已完整出现，目录跳转落在 p=0.12 的稳定位置。 |
| Living Hold | 完整构图维持至 p=0.65；相机缓慢推进，环境光与独立呼吸层持续细微变化。普通幕的完整构图区间覆盖本幕前 65%。 |
| Handoff | p=0.65–1；门洞推进或建筑边缘侧移。下一幕仅在交接最后约 14% 的进度中显露注释，先交接空间、再交接文字。 |
| Exit | p=1 时旧幕退出活动对；画面仅保留当前幕与有必要出现的相邻幕。Silence 不触发后续 Handoff，以开放观看结束。 |

Matter 的描线在 p=0.15–0.56 逐步建立，并在交接早段退去。阶段数字描述当前实现，不是独立的固定计时动画；滚动方向改变时沿同一进度逆行。

### 响应式与静态阅读

桌面、平板、手机分别调整排版；主要宽度断点为 2000、1000、700、380 像素，并为矮屏提供高度规则。矮横屏入口将字标限制为 min(10.7vw,96px)，缩小介绍文字和首屏底部预留，保住建筑影像的可见高度。手机在 700 像素以下使用固定边距、每幕独立的影像焦点、竖向注释和紧凑导航；只展开当前幕名称，保留可触摸目标。旅程滚动距离由桌面约 10.6 个舞台高度缩短为手机约 8.25 个。

Reduced motion 首次遵循系统偏好，也可在 Index 手动设置。切换后销毁空间引擎，六幕回到正常文档流，关闭环境运动与结构描线；目录、完整影像和文案继续可读。

## Elevation & Depth

界面不使用投影卡片、模糊玻璃层或装饰性漂浮面板。深度由摄影透视、构件遮挡、门洞坐标映射和材质光影建立。影像在裁切之前保留完整覆盖尺寸，供木柱侧移使用；持续呼吸置于独立子层，避免与滚动相机争夺同一个 transform。

正常模式由一个 Lenis 实例（autoRaf=false）、一个 GSAP ticker 入口与一个 ScrollTrigger 驱动主时间线。Lenis 时间单位在同一 ticker 中换算；不叠加第二条自建 RAF。打开 Index 暂停旅程，隐藏标签页暂停昂贵更新，尺寸与资源就绪后重新测量；退出时销毁监听与实例。

**The Threshold Rule.** 每次空间交接必须依附影像中可辨认的建筑边界，并在该边界离开前建立下一空间。

## Shapes

主要轮廓保持直角、矩形开口与细线。圆形仅用于导航点和设置开关的明确功能形态。门洞使用与影像对齐的矩形裁切，柱子和材料节点使用真实垂直边缘。品牌标记、操作箭头、行进示意图与 Matter 结构描线由 SVG 提供。

影像原始分辨率为 Threshold 1672×941、其余五幕 1586×992；较小版本宽 1120 像素。它们提供摄影式材质与构图，但并非原生 4K 影像。更新素材须以实际像素与几何核对为准，不用放大文件尺寸来宣称更高原生细节。

## Components

### Index button

无填色的文字按钮配细线加号。直角、充足点击高度；悬停时加号旋转，键盘焦点使用可见轮廓。全屏原生 dialog 复用纸白背景，普通打开从目录顶部开始，关闭后返回先前焦点。

### Chapter navigation

一条细线承托六幕名称；当前与悬停状态改变文字和下划线。手机以导航点保存六个入口，只展示当前名称。目录和地址片段跳转使用各幕稳定位置。

### Scene caption

短编号、衬线标题和两句说明共用注释区。桌面横向分配，手机纵向排列；不覆盖图像的建筑主体。下一幕的文案到交接末段才出现。

### Index row

大号衬线空间名、小编号和右箭头构成完整的一行链接。分隔线贯穿列表；悬停与当前状态通过子文字层 translateX(12px) 轻推内容并显露箭头，保持行布局稳定。目录只提供观看路径，不扩展成项目网格。

### Motion toggle

原生 checkbox 配可见开关，标题解释切换结果。选中时显示静态阅读模式；手动偏好保存在本地，存储不可用时仍可切换。焦点轮廓落在可见开关上。

## Do's and Don'ts

### Do:

- Do 保持同一建筑的材料、主光方向、摄影视高和地平线关系。
- Do 在更新影像时同步核对比例、手机焦点、门洞坐标和 Matter 描线。
- Do 先形成完整构图，再让持续的微量运动引向下一空间。
- Do 保留字体许可、影像来源记录、静态阅读与键盘焦点。

### Don't:

- Don't 把页面扩展成项目卡片墙、图片合集或建筑百科。
- Don't 用黑屏、无依据的遮罩或下一节直接覆盖来替代建筑交接。
- Don't 把大段正文、超大标题或装饰动画压在建筑主体上。
- Don't 把生成影像描述成真实建筑摄影、原生 4K 素材或实测高帧率证明。
