---
name: KAGE / VOID
description: A moving sculpture of space in black, white and neutral grey.
colors:
  void-ink: "#080808"
  field-white: "#ffffff"
  body-ink: "#101010"
  index-divider: "#333333"
  fallback-side: "#454545"
  fallback-side-light: "#747474"
  fallback-light: "#f7f7f7"
typography:
  display:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "clamp(112px, min(22.5vw, 49vh), 960px)"
    fontWeight: 500
    lineHeight: 0.72
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "clamp(72px, 9.5vw, 250px)"
    fontWeight: 500
    lineHeight: 0.9
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "clamp(34px, min(4vw, 6.5vh), 95px)"
    fontWeight: 500
    lineHeight: 0.9
    letterSpacing: "-0.02em"
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0.015em"
  label:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "10px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.07em"
  wordmark:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.02em"
  japanese:
    fontFamily: "Kage JP, sans-serif"
    fontSize: "25px"
    fontWeight: 400
    lineHeight: 1
rounded:
  square: "0"
spacing:
  gutter: "clamp(24px, 3.33vw, 76px)"
  gutter-mobile: "22px"
  gutter-narrow: "17px"
  row-gap: "24px"
components:
  button-utility:
    backgroundColor: "transparent"
    textColor: "{colors.field-white}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "0"
  wordmark:
    textColor: "{colors.field-white}"
    typography: "{typography.wordmark}"
  chapter-link:
    backgroundColor: "transparent"
    textColor: "{colors.field-white}"
    typography: "{typography.title}"
    rounded: "{rounded.square}"
  chapter-readout:
    backgroundColor: "transparent"
    textColor: "{colors.field-white}"
    rounded: "{rounded.square}"
    padding: "0"
  edge-action:
    backgroundColor: "transparent"
    textColor: "{colors.field-white}"
    rounded: "{rounded.square}"
    padding: "0"
  scene-word:
    textColor: "{colors.field-white}"
    typography: "{typography.display}"
    padding: "0.04em 0.055em 0.07em 0"
  index-dialog:
    backgroundColor: "{colors.void-ink}"
    textColor: "{colors.field-white}"
    rounded: "{rounded.square}"
    padding: "0 var(--safe-right) 0 var(--safe-left)"
---

# Design System: KAGE / VOID

## Overview

**Creative North Star: "A Moving Sculpture of Space"**

由一道边缘、一组开口和它们投下的影子建立空间。黑与白承担形体、背景和遮挡的关系；中性灰用于侧面、地面、距离与细节。界面保持稀疏，视觉重量集中于几何与大字。

同一套直角构件在连续的滚动坐标中改变厚度、方向、间距与折叠。页面的大字同样通过滚动控制的裁切交接；停止滚动时，保留缓慢的灯光与姿态微动。运动关闭后，章节以稳定构图呈现。

**Key Characteristics:**

- 黑、白与中性灰构成全部主要视觉。
- 大幅窄体字与小型功能标签形成尺度差。
- 实体阴影表达空间，界面控件保持平面。
- 同一组直角几何贯穿连续变形。
- 竖屏镜头与移动排版按各自条件重新构图。

本文记录当前实现中可复用的视觉规则。前置 YAML 是提取出的令牌快照；对应事实源为 [src/style.css](../../experiences/kage/src/style.css)、[src/score.ts](../../experiences/kage/src/score.ts) 与 [src/sculpture.ts](../../experiences/kage/src/sculpture.ts)。三维光照后的像素颜色由渲染流程决定，不应直接等同于 CSS 色值。

## Colors

配色以黑白对位和中性灰的明暗关系组织，不设置彩色强调色。

### Primary

- **Void Ink**：目录的深色表面，以及浅色 CSS 后备构图的主体。
- **Field White**：页面底色、深色表面文字，以及 difference 混合文字的原始颜色。

### Neutral

- **Body Ink**：未使用混合模式的默认正文颜色。
- **Index Divider**：深色目录中的横向分隔线。
- **Fallback Side / Fallback Side Light**：后备构图在浅色和深色背景上的侧面灰。
- **Fallback Light**：深色后备构图的主体亮部。

标题、页首、图注与页脚通常使用白色的 `mix-blend-mode: difference`，随下方明暗得到反相关系。LIGHT 的图注移至左侧暗部，改用普通混合的固定白字，避开右下方的光束。目录使用固定的深色表面与白字。强制颜色模式改用系统颜色并关闭混合模式。

**The Monochrome Rule.** 几何、背景与界面只使用黑、白和中性灰；状态变化依靠位置、裁切、明暗与细线表达。

三维场景的灰阶、发光量和阴影强度由章节数据控制；黑白切换期间，前景遮挡平面穿过镜头。它是场景的一部分，不是覆盖整个页面的通用淡入淡出。

## Typography

**Display Font:** Barlow Condensed，后备为 sans-serif。

**Body Font:** DM Sans，后备为 sans-serif。

**Japanese Font:** Kage JP，为本地 Noto Sans JP 子集提供的 CSS 字体名称。

**Character:** 标题使用窄体和紧字距，使单词成为构图中的大块形状。功能标签使用小字号、适量字距与等宽数字排列，保持读数稳定。拉丁字体与当前页面使用的八个日文单字均本地加载；新增日文字符时应同步补充子集。

### Hierarchy

| 令牌 / 角色 | 实际用途 |
| --- | --- |
| `display` | 场景大字；SHADOW、SILENCE 使用独立的长词缩放规则，MASS 保持标准大字尺寸 |
| `headline` | 全屏目录的 INDEX 标题 |
| `title` | 目录中的英文章节名 |
| `body` | 场景的短句图注 |
| `label` | 页首功能控件；页脚读数采用相近字号与更收敛的字距 |
| `wordmark` | KAGE / VOID 字标 |
| `japanese` | 图注中的日文单字；字标与目录按其层级使用更小或更大的字号 |

这些是角色尺度，不构成统一等比字阶。场景字的字号同时受视口宽度和高度约束；长词的桌面规则是 `clamp(105px, min(17.5vw, 43vh), 750px)`。在移动布局中，标准词改为 `clamp(118px, 43vw, 310px)`，长词改为 `clamp(90px, 32vw, 235px)`。

场景大字禁用文本选择与鼠标命中，语义标题和章节说明保留在独立的可访问结构中。保持这种视觉与语义的对应关系；章节名和图注的主要数据源位于 `score.ts`。

## Layout

主舞台固定覆盖视口，3D 画布、文字、图注和边缘控件分别占据不同层。实际文档滚动距离由单个不可见轨道提供。文字和几何不依靠普通内容区块逐段堆叠。

页首和页脚共享左右留白；四周同时考虑 `safe-area-inset-*`。图注通常靠右，LIGHT 时移动到左侧暗部；场景大字靠左下。全屏目录为两列，左侧介绍与右侧章节列表使用 `0.75fr 1.25fr`，列间距为 `7vw`。

| 条件 | 布局行为 |
| --- | --- |
| 宽度 ≤ 760px | 使用移动留白；大字提高至画面下部约 26svh；目录变为单列，主要控件最小高度为 42px |
| 宽度 ≤ 360px | 进一步收紧留白和控件间距，隐藏字标旁的日文单字 |
| 宽度 ≥ 2000px | 提高页首、图注、页脚和目录标签的字号与间距 |
| 高度 ≤ 620px 且宽度 ≥ 761px | 收紧上下留白和目录行高，降低大字高度占比 |
| 画布宽高比 < 0.85 | 启用竖屏 3D 镜头与较低的画布像素预算；此条件独立于 CSS 宽度断点 |

竖屏镜头减少横向偏移，将主体更多保留在上方区域，并在 LIGHT 的开口处进入光廊。避免只把桌面截图等比缩小来代替这一镜头逻辑。

## Elevation & Depth

空间深度来自透视镜头、实体侧面、方向光、接收阴影的地面、远处雾化、发光开口与前景遮挡。材质带有幅度很小的程序化微结构；不依赖下载的纹理图。CSS 后备版本使用偏斜平面和半透明的投影形状表达相同的基本关系。

界面没有 `box-shadow`。目录进入浏览器原生对话框的顶层，靠完整深色表面与背景隔开；按钮通过细线与位移反馈状态。画布的明暗层次和控件的层叠顺序承担不同职责。

**The Flat Interface Rule.** 控件保持平面、直角与细线反馈；有体积的阴影属于作品中的几何。

## Shapes

形体由五组可复用的矩形开口构成，每组由四根长方体边条组成。边条宽度、深度、旋转、展开和折叠共同生成线、框、质量块与拆分构件。高亮的棱边与地面延长线维持各状态间的联系。

按钮、目录、分隔线和进度轨道均保持直角；导航用细线箭头和极小方点指示方向与当前位置。场景文字使用矩形裁切，裁切方向与滚动进度绑定。

**The Shared Edge Rule.** 新的几何状态应从已有边条、开口与平面关系中演变，保留可辨认的连续形体。

## Components

### Utility Buttons

MOTION、INDEX 和 CLOSE 为透明背景的短标签控件。桌面最小高度为 36px，移动布局为 42px；无圆角、无常驻按钮框。悬停时，下方细线使用 `340ms` 与 `cubic-bezier(0.16, 1, 0.3, 1)` 展开。键盘焦点显示 1px 的 `currentColor` 外框，外移 7px。

MOTION 的暂停 / 播放符号与 ON / OFF 标签同步。减少运动模式关闭这些控件的过渡动画。

### Wordmark

KAGE / VOID 与日文单字作为单一返回开头的链接。保持字标的紧凑字距与文本呈现；它不是独立的大幅装饰图。窄屏隐藏旁侧日文字符，为功能按钮保留空间。

### Chapter Navigation

目录是原生全屏 `<dialog>`。章节行包括序号、英文名、日文单字和箭头，以细横线分隔。悬停或键盘聚焦时，英文名向右移动 8px，箭头显现；当前章节还在序号旁显示小方点。移动布局维持相同信息顺序，降低列宽并采用 60px 的最小行高。

### Scene Word

大字是作品的一层，使用 difference 混合。进出场裁切和少量水平位移完全由滚动位置计算，不使用独立计时器。长词应用专用字号；字符保持单行。

### Progress and Chapter Readout

页脚进度为 1px 的轨道，当前进度从左向右缩放。下方章节读数显示序号、短分隔线、章节名与总数；点击可打开目录。数值采用 `tabular-nums`，轨道有可访问的百分比读数。

### Edge Action

开头显示 SCROLL TO ENTER，结尾显示 REPLAY；中间过程隐藏并退出键盘顺序。箭头以少量纵向位移响应悬停，REPLAY 状态旋转箭头。主要画面始终由几何与场景字承担。

## Do's and Don'ts

### Do:

- **Do** 从同一套直角边条与开口演变新的几何状态。
- **Do** 保留大幅场景字与紧凑功能标签之间的尺度差。
- **Do** 分别维护移动布局、竖屏镜头和安全区域留白。
- **Do** 同步提供减少运动、键盘焦点与可访问的章节信息。

### Don't:

- **Don't** 为状态或装饰加入彩色强调色。
- **Don't** 用常规功能卡片替代连续的空间构图。
- **Don't** 把几何阴影的厚重感套用到界面按钮或目录容器。
- **Don't** 让场景文字或几何的进出场依赖不可逆的计时动画。
