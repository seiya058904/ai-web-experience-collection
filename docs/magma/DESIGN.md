---
name: "MAGMA — Stone Before Stone"
description: "黑色包裹内热；九幕材料、文字与滚动共同组成一件逐渐静止的数字雕塑。"
colors:
  black: "#080909"
  paper: "#e9e7e2"
  muted: "#b7b5b0"
  active-white: "#fff"
  dialog-surface: "#0d0e0e"
  index-line: "#30312f"
  index-text: "#c4c3bd"
  index-number: "#9a9b95"
  rail-rest: "#555753"
  caption-rule: "#747572"
  cooling-track: "#494a46"
  setting-ring: "#a6a69e"
typography:
  display:
    fontFamily: "Archivo, Helvetica, Arial, sans-serif"
    fontSize: "17.22vw"
    fontWeight: 850
    lineHeight: 0.79
    letterSpacing: "-.04em"
  display-mobile:
    fontFamily: "Archivo, Helvetica, Arial, sans-serif"
    fontSize: "21.7vw"
    fontWeight: 850
    lineHeight: 0.85
    letterSpacing: "-.04em"
  display-short-landscape:
    fontFamily: "Archivo, Helvetica, Arial, sans-serif"
    fontSize: "14.11vw"
    fontWeight: 850
    lineHeight: 0.79
    letterSpacing: "-.04em"
  display-subtitle:
    fontFamily: "Archivo, Helvetica, Arial, sans-serif"
    fontSize: "clamp(25px, 3.05vw, 86px)"
    fontWeight: 300
    lineHeight: 1.07
    letterSpacing: "-.025em"
  headline:
    fontFamily: "Archivo, Helvetica, Arial, sans-serif"
    fontSize: "clamp(44px, 6.65vw, 220px)"
    fontWeight: 300
    lineHeight: 1.015
    letterSpacing: "-.04em"
  headline-mobile:
    fontFamily: "Archivo, Helvetica, Arial, sans-serif"
    fontSize: "clamp(39px, 10.3vw, 69px)"
    fontWeight: 300
    lineHeight: 1.045
    letterSpacing: "-.04em"
  dialog-headline:
    fontFamily: "Archivo, Helvetica, Arial, sans-serif"
    fontSize: "clamp(45px, 5.5vw, 145px)"
    fontWeight: 300
    lineHeight: 1.04
    letterSpacing: "-.04em"
  body:
    fontFamily: "Archivo, Helvetica, Arial, sans-serif"
    fontSize: "clamp(14px, 1.02vw, 21px)"
    fontWeight: 350
    lineHeight: 1.55
  body-mobile:
    fontFamily: "Archivo, Helvetica, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 350
    lineHeight: 1.6
  body-long:
    fontFamily: "Archivo, Helvetica, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 350
    lineHeight: 1.7
  title:
    fontFamily: "Archivo, Helvetica, Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 500
    letterSpacing: "-.01em"
  label:
    fontFamily: "Archivo, Helvetica, Arial, sans-serif"
    fontSize: "clamp(13px, .9vw, 18px)"
    fontWeight: 400
    lineHeight: 1.3
  label-chapter:
    fontFamily: "Archivo, Helvetica, Arial, sans-serif"
    fontSize: "clamp(11px, .83vw, 17px)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: ".08em"
  label-whisper:
    fontFamily: "Archivo, Helvetica, Arial, sans-serif"
    fontSize: "clamp(12px, .88vw, 18px)"
    fontWeight: 350
  wordmark:
    fontFamily: "Archivo, Helvetica, Arial, sans-serif"
    fontSize: "clamp(15px, 1.02vw, 23px)"
    fontWeight: 620
    lineHeight: 1
    letterSpacing: ".035em"
  index-row:
    fontFamily: "Archivo, Helvetica, Arial, sans-serif"
    fontSize: "clamp(21px, 1.7vw, 42px)"
    fontWeight: 350
    letterSpacing: "-.015em"
  action:
    fontFamily: "Archivo, Helvetica, Arial, sans-serif"
    fontSize: "clamp(14px, 1.05vw, 21px)"
    fontWeight: 350
    lineHeight: 1.3
  light-instruction:
    fontFamily: "Archivo, Helvetica, Arial, sans-serif"
    fontSize: "clamp(12px, .85vw, 18px)"
    fontWeight: 350
rounded:
  none: "0"
  setting-dot: "50%"
spacing:
  gutter: "clamp(28px, 2.4vw, 100px)"
  scene-gutter: "5vw"
  mobile-gutter: "22px"
  mobile-scene-gutter: "24px"
  control-gap: "10px"
  material-gap: "22px"
  material-gap-mobile: "15px"
  dialog-column-gap: "9vw"
  dialog-row-gap-mobile: "35px"
  mobile-whisper-gap: "20px"
components:
  text-button:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0"
  text-button-hover:
    textColor: "{colors.active-white}"
  material-action:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    typography: "{typography.action}"
    rounded: "{rounded.none}"
    padding: "0"
  hold-action:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    typography: "{typography.action}"
    rounded: "{rounded.none}"
    padding: "0 0 12px"
  index-row:
    textColor: "{colors.index-text}"
    typography: "{typography.index-row}"
  index-row-current:
    textColor: "{colors.active-white}"
  chapter-rail-mark:
    backgroundColor: "{colors.rail-rest}"
    width: "1px"
    height: "23px"
  chapter-rail-mark-current:
    backgroundColor: "{colors.paper}"
  dialog-surface:
    backgroundColor: "{colors.dialog-surface}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "0"
    width: "100%"
    height: "100%"
  chapter-caption:
    textColor: "{colors.paper}"
    typography: "{typography.label-chapter}"
  light-instruction:
    textColor: "{colors.paper}"
    typography: "{typography.light-instruction}"
---

# Design System: MAGMA — Stone Before Stone

## Overview

**Creative North Star: "Darkness holding internal fire."**

黑色不是一层背景装饰，而是有重量、有表皮、能够遮住热量的主体。开场以钝重岩体和建筑般的 MAGMA 字形占据视口，随后由较轻的文字让出材料表面。褶皱、冷壳、裂隙、玻璃反光与颗粒矿物构成不同的黑；界面只承担进入、定位和少量主动干预。

这套系统依靠图版质量和代码编排共同成立。图版提供地质细节与负空间；HTML 保留文字、导航和操作的语义；滚动把它们绑定到同一材料状态。正常停留时的变化局限于材料内部，最终 SEALED 将余光和自主运动归零。声音是默认关闭的可选层，不承担理解作品的必要信息。

本文件记录当前实现，原始视觉方向见 [PRODUCT.md](UPSTREAM-PRODUCT.md) 与 [VISUAL_BIBLE.md](VISUAL_BIBLE.md)。四张精选概念是方向参照：[Pressure](../../provenance/magma/concepts/pressure.webp)、[Skin](../../provenance/magma/concepts/skin.webp)、[Glass](../../provenance/magma/concepts/glass.webp)、[Mobile opening](../../provenance/magma/concepts/mobile.webp)；当前代码与最终图版决定这里的数值和规则。前置 YAML 管理基础 token；[design.json](../../provenance/magma/design.json) 补充动态、断点、层级、材质参数和可独立展示的组件片段。

**Key Characteristics:**

- 连续的近黑空间，矿物白主字，灰白辅助文字；热色只在有材料依据的位置出现。
- 巨大的实心开场字形，较轻的场景标题，细小但明确的章节与操作层级。
- 每幕独立安排负空间；响应式构图同时调整图版、文字锚点与行长。
- 单一滚动状态组织进入、稳定、停留、交接与退出；材料变化克制且可逆。
- 圆形只用于小型操作线图与状态点；主体、面板和文字布局不套卡片外框。

## Colors

界面采用一组带轻微矿物暖感的白灰色，置于连续近黑空间；材质中的红、橙与极少量白热芯来自实际热区，而冷材质返回接近中性的银灰反光。

### Primary

- **矿物白 / `paper`**：主标题、字标、操作文字、当前章节刻度与键盘焦点线的共同前景色。
- **状态亮白 / `active-white`**：链接悬停和当前 Index 行的短暂提高亮度状态，不构成独立色块按钮。
- **内热**：属于图像与 shader 的材料信号，没有被规范成一个通用界面强调色。热遮罩依据图版的暖色分离；冷却同时处理邻近暖区包围的白热芯，避免只剩一个亮点。

### Neutral

| Token | 视觉作用 |
| --- | --- |
| `black` | 页面、固定舞台、导航提示背景及对话框遮罩共用的近黑基底。 |
| `muted` | 场景解释、whisper、说明正文及次要入口；靠行长、位置与留白保持安静。 |
| `dialog-surface` | Index 与 About 全屏面板的轻微提亮，仍与作品处于同一黑色空间。 |
| `index-text` / `index-number` / `index-line` | Index 行名、两位编号与细分隔线的递减层级。 |
| `rail-rest` / `caption-rule` | 右侧未选刻度与底部章节分隔线；两者具有不同的可见度。 |
| `cooling-track` / `setting-ring` | 冷却进度底线与动态开关空心状态点。 |

**The Contained Heat Rule.** 热区必须仍属于裂隙或熔融褶皱；不能把整页、控件或中性冷反光染成橙色。该规则不禁止材料自身的暖色、矿物包体或微小白热芯。

CSS 里另有 `--ember` 和 `--line` 声明，但当前样式没有使用它们；因此这里没有把这两个声明提升为可继承的界面配色角色。实际配色依据：[styles.css](../../experiences/magma/src/styles.css)；热区、冷反光与余热处理依据：[material shader](../../experiences/magma/src/shaders/material.js)。

## Typography

**Display Font / Body Font：** 本地 Archivo Variable，回退栈为 Helvetica、Arial、sans-serif。当前作品用同一家族的字重与尺度建立层级，没有独立装饰字体或等宽标签字体。本地字库文件支持字重范围（100–900），界面实际使用从轻标题（300）到开场重字（850）的若干字重。

**Character：** MAGMA 是压在画面前方的一块大字形；场景标题则以轻字重与明确断行保持呼吸。编号、操作和辅助句子退后，但继续使用真实文本。

### Hierarchy

| 层级 | 使用方式 |
| --- | --- |
| `display` / `display-mobile` / `display-short-landscape` | 开场唯一 h1。三种字号由 YAML 记录；桌面紧凑行高、手机略放开行高。右侧额外字形余量（`.075em`）属于实际标题盒。 |
| `display-subtitle` | “Stone before stone.”；手机将两个语义片段改为上下行，副标题改用（`clamp(25px, 6.3vw, 43px)`）。 |
| `headline` / `headline-mobile` | 场景标题的基础尺度；通常字重（300），CRACK 为（400）。各场景的字号覆盖值见下表。 |
| `dialog-headline` | Index 与 About 的说明性大标题，与场景标题共享轻字重及紧凑字距。 |
| `body` / `body-mobile` | 场景解释，桌面常规最大行长（45ch）；手机常规最大行长（30ch）。STONE、GLASS 有与图版配合的更窄区域。 |
| `body-long` / `title` | About 的长正文与小节标题；正文容器最大行长（64ch）。 |
| `label` / `action` | 顶部轻量入口与上下文材料操作；两者均无实心按钮底色。 |
| `label-chapter` / `label-whisper` | 两位章节进度及材料补充短句。章节名另用字距（`.16em`），它是定位信息。 |
| `wordmark` / `index-row` | 顶部小字标与全屏 Index 中可点选的大行名。 |

| Scene | 桌面标题字号覆盖 | 手机标题字号覆盖 |
| --- | --- | --- |
| MOLTEN | `clamp(44px, 5.8vw, 190px)` | `clamp(33px, 8.7vw, 56px)` |
| FLOW | `clamp(48px, 6.6vw, 215px)` | `headline-mobile` |
| SKIN | `headline` | `headline-mobile` |
| CRACK | `clamp(54px, 7.8vw, 245px)`；行高（1.12） | `clamp(47px, 12vw, 76px)`；行高（1.07） |
| GLASS | `clamp(44px, 6.8vw, 220px)`；行高（1.03） | `headline-mobile` |
| FRACTURE | `clamp(44px, 5.8vw, 190px)` | `clamp(34px, 8.8vw, 57px)` |
| CRYSTAL · STONE | `clamp(44px, 5.5vw, 185px)` | `clamp(42px, 10.5vw, 66px)` |
| SEALED | `clamp(44px, 6.25vw, 205px)` | `clamp(33px, 8.5vw, 55px)` |

**The Monument and Voice Rule.** 以开场的重字与后续轻标题建立反差；标题字距保持在当前下限（−.04em），不要用继续压缩字距来补偿宽度。修改字库、字重、字号或英文断行时，必须连同它们占用的材料负空间一起处理。

标题的 `<span>` 断行、CRACK 的两段分离及副标题换行均为实际构图的一部分。字体和响应式覆盖依据：[styles.css](../../experiences/magma/src/styles.css)；完整英文文案与语义结构依据：[index.html](index.html)。

## Layout

### 视口与层级

增强模式以一个固定全屏材料舞台承接九个章节，当前章节的 HTML 文字层固定在其上；滚动章节只提供时间长度。基础长度为（180svh），手机为（155svh），末章额外增加（100svh）供封存及文字退场。文案区域、页首和章节刻度各自使用明确层级；无统一居中最大宽度容器。页面最小宽度为（280px）。

普通文案默认从 `scene-gutter` 开始，页首和边角入口使用 `gutter`。桌面边距的实际值以 YAML 为准，不使用概念稿里概括性的范围替代。页首与面板顶部读取安全区（`safe-area-inset-top`）；手机底部入口以百分比与最小像素值的较大者定位。

### 九幕构图

| Scene | 桌面文字锚点与材料关系 | 手机对应关系 |
| --- | --- | --- |
| 01 PRESSURE | 开场字块位于左下（bottom 13.6%）；岩体保持钝重轮廓，内热缝穿过表面。 | 字块移至 bottom（24%）、left（20px）；配套竖图保留上方岩体与下方文字。 |
| 02 MOLTEN | 文字 bottom（23%），与右中部黏厚褶皱相对。 | bottom（25%）；保留横图衍生移动版本和单独焦点。 |
| 03 FLOW | 文字 top（20%），材料路径位于右侧。 | 使用竖图；文字与 whisper 连成网格第二、第三行，首行（23%）。 |
| 04 SKIN | 文字 top（19%），与斜向壳层边界配合。 | top（23%）；冷却操作固定在底部安全区域。 |
| 05 CRACK | 文字 top（28%），宽（90vw）；第二句水平偏移（51%）、另加上间距（4vh），承认中间开缝。 | top（33%）；第二句偏移缩至（11vw），间距（5vh）；解释句回归普通文流。 |
| 06 GLASS | 文字 top（31.5%）、left（4.3vw）；反光黑曜石占据右侧。 | 使用竖图；文字 top（22%），主体及反光带留在其下。竖向平板单独处理，见断点表。 |
| 07 FRACTURE | 文字 bottom（20%），弧面在上方与右侧。 | bottom（26%）；以单独焦点保留弧面。 |
| 08 CRYSTAL · STONE | 文字 top（24%）、left（55%）；颗粒表面与文本分布在不同区域。 | 使用竖图；文字回到左侧并与 whisper 组成网格，首行通常（24%）。 |
| 09 SEALED | 文字 bottom（23%），返回与开场对应的岩体；末段继续撤去标题。 | bottom（31%）；配套竖图与 PRESSURE 对应，返回入口留在底部。 |

### 响应式条件

| 条件 | 已实现的变化 |
| --- | --- |
| 宽度 ≤700px | 切换九张 mobile 图版及其焦点；使用移动边距、标题和面板布局；隐藏右侧章节轨道，保留 Index。 |
| 宽度 ≤360px | 只将 STONE 网格首行提高到（18%）。手机 STONE whisper 维持最大（23ch），确保两行仍落在图版黑色楔形区域。 |
| 宽度 701–1000px | 部分标题与 Index 尺度调整，面板列间距为（6vw）；GLASS 左边距为（5vw）。 |
| 宽度 701–1024px 且竖向 | GLASS 文案置于 top（12%）、left（5vw）；标题配套缩为（`clamp(44px, 5.8vw, 64px)`），解释句行长缩为（24ch）。位置、字号与行长共同避开反光肩部。 |
| 高度 ≤580px 且宽度 ≥701px | 使用短横屏开场字号，开场字块 bottom（20%）；相应场景标题、正文间距、Index 行高与底部操作收紧。 |
| 宽度 ≥2200px | 页首改用视口高度边距，章节刻度高度与点击行距随视口高度增长。 |
| `(pointer: coarse)` | 显示 “Touch to catch the light”，隐藏 “Move to catch the light”；输入提示由设备能力决定，不依赖手机宽度。 |

FLOW 与 STONE 的手机 whisper 跟随主文案，间距为 `mobile-whisper-gap`。这里的布局关系不能拆成一个独立浮在底部的小字组件。其他场景保留相应边角 whisper 或动作位置。手机 Index 与 About 从双列改成单列；Index 隐藏引导段落，仍显示标题、About 入口、九行章节及动态设置。

构图切换和渲染质量是两个独立条件：图版在（≤700px）切换；渲染轻量档用于宽度（<768px）或粗指针且宽度（<1024px）。后者降低像素预算与网格密度，不强制把横向平板换成竖图。具体约束由 [styles.css](../../experiences/magma/src/styles.css)、[main.js](../../experiences/magma/src/main.js) 与 [material-renderer.js](../../experiences/magma/src/material-renderer.js) 共同定义。

## Elevation & Depth

界面不通过浮起的卡片、投影按钮或模糊面板制造深度。深度来自图版中的遮挡、黑色体量和反射，以及 CRACK / FRACTURE 的独立表面网格。全屏 Index 与 About 使用不透明的深色表面；页首和主文案直接叠于作品。

### Shadow Vocabulary

- **文字保护阴影**（`text-shadow: 0 1px 8px rgb(0 0 0 / .85)`）：用于页首、章节编号、whisper、材料操作、光线提示与场景解释句，帮助小字跨越细碎纹理。大标题不使用它。
- **界面盒阴影**：当前没有 `box-shadow` 词汇；不要把文字保护阴影扩展成容器浮层的视觉模型。

层级数值从舞台（0）、活动文字层（5）、章节状态（12）、章节轨道（20）、页首（30），到静态说明（40）、本地启动帮助（100）和跳转链接（110）。原生模态对话框进入浏览器 top layer，不用一个伪造的超大 z-index 代替。

**The Registered Surface Rule.** 裂口轮廓、浅凹面与图版使用同一套原图坐标，再共同经过 cover 裁切、焦点和相机变换。CRACK 与 FRACTURE 的两边分别拥有缝边顶点，没有跨过开口的三角形；换图时必须同时核对几何路径与焦点。

阴影与层级依据：[styles.css](../../experiences/magma/src/styles.css)；表面深度依据：[fracture-geometry.js](../../experiences/magma/src/fracture-geometry.js)、[material-renderer.js](../../experiences/magma/src/material-renderer.js) 与 [material shader](../../experiences/magma/src/shaders/material.js)。

## Shapes

主体遵循块体、褶皱、薄壳、窄缝、贝壳状弧面与颗粒地面的材料轮廓。开场与结尾保留对应的厚重岩体，而非尖峰山体；GLASS 的明亮曲面仍属于不透明的黑色对象。

界面控件和面板采用直角，分隔线细而有限。右侧章节标记是一像素竖线；Index 使用行边界，不使用卡片阵列。冷却进度是一条水平细线（2px），从左向右缩放填充。设置状态点使用圆形（50%），材料操作中的圆环、箭头与弧线采用内联 SVG：线宽（1.15）、圆形线帽与连接。圆环属于操作图形，不是通用圆角容器规则。

图像按 cover 填满舞台，焦点存在桌面与手机两套数据；没有为艺术图版增加边框或圆角裁切。图形来源见 [index.html](index.html)、[styles.css](../../experiences/magma/src/styles.css) 及 [main.js](../../experiences/magma/src/main.js)。

## Components

### 轻量按钮与入口

文字是主要点击线索，细线图形只补充方向或材料动作。顶部 Index / Sound 使用 `text-button`；上下文按钮使用 `material-action`。常规文字按钮最小高度（36px），手机版为（38px）；材料按钮桌面最小高度（46px），手机版为（48px）。返回入口最小高度（44px）。这些是当前不同组件的实值，不是所有控件统一尺寸的声明。

默认透明底与矿物白文字；文本链接悬停提高至亮白。Begin 箭头悬停下移（5px），Return 箭头斜移（3px，−3px），过渡为（.4s）与（`cubic-bezier(.16,1,.3,1)`）。键盘焦点使用矿物白实线（1px），外偏移（6px）；禁用按钮透明度为（.5）。

### 导航与全屏面板

顶部仅保留 MAGMA、Index 与 Sound。右侧章节轨道在开场进度超过（.6）后可用，其每行至少宽（44px）、桌面高（34px）；当前状态通过 `aria-current="step"`、亮度与刻度长度共同表达。名称在悬停或键盘聚焦时出现。手机隐藏整条轨道，通过 Index 保留九个同等可达的入口。

Index 的每一行由编号、名称、箭头三列构成；当前行与悬停行显示箭头。默认行最小高度（`clamp(48px, 6.4vh, 85px)`）；手机（48px），短横屏（43px）。面板的列宽、间距与响应式行为沿用 Layout 中的对应规则。

Index 与 About 使用原生 `<dialog>`。打开时暂停背景滚动、清除材料操作并把焦点放在 Close；Esc 与关闭按钮恢复原来的焦点。导航到章节后将焦点移至该幕标题；入口默认落在局部进度（.2）的稳定构图，PRESSURE 落在（0）。非活动章节设为 `inert` 并从辅助技术中隐藏；另有礼貌播报的章节状态与操作反馈。

### 材料舞台与时间

**The Shared State Rule.** 滚动位置同时决定材料与文本；Lenis 是唯一的平滑滚动控制者，应用只有一个 RAF 负责调度。不能给文案或相机再加一层独立滚动平滑。

| 生命周期 | 章节局部进度 | 已实现的关系 |
| --- | --- | --- |
| Enter | `[0, .14)` | 非首章文案在（.015–.14）进入，同时最多从下方（15px）靠近。 |
| Stable composition | `[.14, .36)` | 导航默认落点（.2）；完整文案与稳定构图可以阅读。 |
| Living hold | `[.36, .72)` | 当前材料保留其自身的小幅变化；不让整张图重复上下漂浮。 |
| Handoff | `[.72, .94)` | 常规图版混合从（.76）开始；文案由（.75）开始离开。 |
| Exit | `[.94, 1]` | 普通文案在（.97）完全退去；图版在边界完成交接。 |

Lenis 的滚轮平滑系数为（.105），触屏保持原生滚动。章节导航时长按距离落在（1.1–2.1s）范围。减少动态模式或系统减少动态偏好关闭滚轮平滑；减少动态模式改为立即导航，停止自主相机、热脉动、移动反光与 CSS 过渡；用户主动滚动、冷却和断面操作仍可改变材料。

STONE 的“静”保留少量冷反光，而不是让颗粒整体运动：shader 以（64s）周期在图版已有明亮矿物面上移动窄带，添加幅度为（.038）乘以遮罩与动态开关。它不增加纹理采样，也不移动轮廓。该效果由 renderer 的动态开关控制，不能仅因 STONE 的 `state.motion` 为零就认定这幕完全无变化。

SEALED 在总进度（8.86）完成；封存混合从该幕局部（.04）到（.86），热量、流动、脉动、开缝、反光、浅浮雕与相机在完成时归零。正常动态下标题随后仍由滚动透明度（局部 .72–.96）退出；减少动态模式在完成时直接隐藏结束文案。返回入口和导航继续可用。

### 主动材料操作

| Scene / Control | 状态与反馈 |
| --- | --- |
| SKIN / Hold to cool | 指针、触摸或空格按住；Enter 切换持续冷却。按压时进度每秒增加（.55），释放时每秒减少（.38）。`aria-pressed` 与底线填充对应；失去指针捕获、松开或离开场景时清理临时操作。 |
| CRACK / Open the seam | 点击产生一次强度（1）的开缝脉冲，按每秒（.28）衰减；不是持续开关。 |
| GLASS / Move 或 Touch | 指针位置映射到（−1…1）范围，以指数系数（4/s）平滑进入反光方向；粗指针按下也更新位置。减少动态或图片模式隐藏此提示。 |
| FRACTURE / Trace the fracture | 点击切换显现状态，反馈文案改为 “Let the curve settle”；按指数系数（2.6/s）接近目标，再次点击回落。 |

### 动态、声音与回退

Motion 开关位于 Index，优先读取已有本地偏好，否则遵循系统减少动态偏好。Sound 默认关闭，只有主动打开才创建音频上下文；开启后显示细小的三条声音线。其视觉呼吸周期为（2s），结尾暂停，减少动态时不播放该 CSS 动画。

没有 WebGL 或 context 丢失时，图像路径保留九幕、文字、导航和冷却操作；图片冷却使用饱和度与亮度变化。依赖几何的 CRACK、FRACTURE 操作及反光提示隐藏。没有 JavaScript 时保留普通图像章节与语义内容，不显示需要脚本的按钮。

视觉预算也是组件约束：单一 WebGL context，最多三张摄影图版纹理，外加一张（512 × 1）路径数据纹理。轻量档 DPR 上限（1.25）、缓冲区预算（1,100,000 像素）、网格（26 × 36）；常规档分别为（1.5）、（3,200,000 像素）、（40 × 56）。手机绘制调度上限（30次/秒），其他宽度（60次/秒）；这是调度上限，不是硬件帧率承诺。隐藏页面暂停 RAF 与声音，减少动态静止帧与完成画面不继续无意义重绘。

上述组件、焦点与交互状态依据：[index.html](index.html)、[styles.css](../../experiences/magma/src/styles.css)、[main.js](../../experiences/magma/src/main.js)、[material-state.js](../../experiences/magma/src/material-state.js)、[material-renderer.js](../../experiences/magma/src/material-renderer.js)、[material shader](../../experiences/magma/src/shaders/material.js) 及 [audio.js](../../experiences/magma/src/audio.js)。sidecar 的组件片段展示真实 HTML/CSS 状态；材料引擎、声音与模态焦点行为仍以这些源文件为准。

## Do's and Don'ts

### Do:

- **Do** 保持材料优先的层级：黑色体量、有限内热、主标题、辅助句与操作各有自己的可读区域。
- **Do** 将图版焦点、文字锚点、标题断行和行长作为一组关系修改；手机 FLOW / STONE 与竖向平板 GLASS 保留各自已实现的协同布局。
- **Do** 让 PRESSURE 与 SEALED 的构图对应，保留从细缝余光到冷图完全接管的闭环。
- **Do** 在替换 CRACK / FRACTURE 图版时同步核对原图尺寸、路径、独立网格、cover 裁切与焦点。
- **Do** 保留原生语义、可见键盘焦点、章节入口、关闭后的焦点恢复及减少动态下的主动操作。
- **Do** 让视觉变更继续遵循单一滚动状态、局部材质运动和明确的最终静止条件。

### Don't:

- **Don't** 把整个页面染成热橙色，或让中性白灰反光产生无材料依据的橙光。
- **Don't** 以粒子雨、爆炸、屏幕震动、漂浮环绕镜头或持续随机噪声替代已有的重量与表面变化。
- **Don't** 将数字雕塑改造成产品拆解、卡片陈列或带装饰外框的图像画廊。
- **Don't** 通过比（−.04em）更紧的标题字距补偿构图问题，也不要把章节定位信息扩展成装饰性眉题体系。
- **Don't** 将小型圆环操作图形推广为通用胶囊按钮，或把文字保护阴影当成浮层阴影。
- **Don't** 用屏幕宽度替代输入能力判断，也不要把渲染轻量档与手机图版切换合并成同一个断点。
- **Don't** 将白热芯残留、无效声明或验证范围之外的假设写成可复用设计规则；同样不要把本作品的材料演变描述为实测物理模拟。

## Collection adaptation

The original material/typographic contract above remains the visual authority. Runtime paths now follow the Collection boundaries in [IMPLEMENTATION.md](IMPLEMENTATION.md). The single existing RAF advances one installed Lenis instance at `.105`; OS reduced motion disables wheel smoothing, dialogs/touch keep native behavior, restoration is immediate, and the document position drives the material score directly. Hidden/pagehide states suspend the owned clock, Lenis, GPU drawing and audio; disposal owns all listeners and resources. Reload/document Back preserve their real stop. This changes delivery/runtime integration, not the artwork's volcanic comparisons or material controls.
