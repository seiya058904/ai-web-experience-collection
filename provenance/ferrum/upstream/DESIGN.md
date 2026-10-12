---
name: FERRUM — The Memory of Fire
description: One steel object, six states of matter and light.
colors:
  space: "#0b0c0d"
  bone: "#e8e5de"
  muted: "#aaa9a4"
  rule: "#585a59"
  ember: "#e76b35"
  overlay: "#101112"
  control-surface: "#151718"
  control-border: "#535553"
  subtle-rule: "#393b3b"
  options-rule: "#3e4040"
  reference-rule: "#656763"
  scrollbar: "#666660"
  selection: "#ba562f"
  selection-ink: "#fff3e5"
  backdrop: "rgba(0,0,0,.8)"
typography:
  display:
    fontFamily: "Antonio, 'Arial Narrow', sans-serif"
    fontSize: "clamp(100px,23.6vw,930px)"
    fontWeight: 300
    lineHeight: 0.90
    letterSpacing: ".008em"
  headline:
    fontFamily: "Antonio, 'Arial Narrow', sans-serif"
    fontSize: "clamp(64px,8.4vw,330px)"
    fontWeight: 300
    lineHeight: 0.91
    letterSpacing: ".006em"
  body:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "clamp(15px,1.2vw,30px)"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: ".025em"
  label:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "clamp(11px,.79vw,22px)"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: ".17em"
  directory:
    fontFamily: "Barlow, sans-serif"
    fontSize: "clamp(25px,2.2vw,80px)"
    fontWeight: 500
    lineHeight: 1.15
rounded:
  square: "0"
spacing:
  gutter: "clamp(24px,3.25vw,128px)"
  control-gap: "15px"
  navigation-gap: "clamp(26px,2.5vw,100px)"
components:
  text-control:
    backgroundColor: "transparent"
    textColor: "{colors.bone}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "0"
  viewing-select:
    backgroundColor: "{colors.control-surface}"
    textColor: "{colors.bone}"
    rounded: "{rounded.square}"
    padding: "12px 34px 12px 12px"
  overlay:
    backgroundColor: "{colors.overlay}"
    textColor: "{colors.bone}"
    rounded: "{rounded.square}"
---

# Design System: FERRUM

## Overview

**Creative North Star: Steel remembers the fire.**

煤黑空间、馆藏式留白与一件持续变化的钢制雕塑组成固定视觉世界。器物和光负责表达，界面保持安静。方向来自完整创作简报与六张概念定帧；概念图用于比较构图，正式体验由真实 DOM、同一三维网格及局部材质细节组成。

本文件记录已采用的设计选择与当前样式 token；渲染质量和浏览器覆盖范围由验收报告记录。完整产品边界见 [PRODUCT.md](PRODUCT.md)，原始视觉参考见 [design-reference](docs/design-reference/README.md)。

## Colors

骨白承担标题、导航和主要文字；柔灰承担次级注释，细线灰界定进度与目录。深煤黑保持为主要空间，弹层仅略微提亮。余烬橙用于少量交互强调；场景内的热光由材质和局部光源负责，不作为满屏页面渐变。

冷钢反射与热光是三维材质状态，不扩展为另一套界面品牌色。文字颜色以此文件前置 token 与 `src/styles.css` 为准。

## Typography

Antonio 的窄高字形用于巨型 FERRUM 与章节标题；Manrope 用于正文和控制；Barlow Condensed 在 CSS 中名为 Barlow，用于 Journey 目录与章节编号。字体全部本地提供。概念阶段曾以 Barlow 为展示字候选，当前实现选择 Antonio 以接近定帧中的高窄比例。

展示文字少而大，注释短而清楚。淬火章标题分两行，并保留更宽松的行距。正式网页文字不烘焙进 WebGL 画面、材质贴图或降级定帧；字体加载与响应式重排均由 DOM 处理。概念图中的示意文字只保留为最初的排版参考。

## Layout

首屏上方与左侧留给标题，右下方留给粗粝坯体；顶部标志、Journey 与 About 保持开放排版。底部由声音开关、一条细进度线与六个章节编号组成。增加明确的 **Scroll to begin** 提示，作为相对概念定帧的一项可用性调整。

| 幕 | 固定构图意图 | 交接依据 |
| --- | --- | --- |
| 00 — Before form | 巨型铭文与低位原坯，窄冷侧光显示重量。 | 同一坯体的局部热光逐渐建立炉内空间。 |
| 01 — The furnace | 左侧文字留白，右侧金属、炉炭与局部发光。 | 钢坯长边继续存在，砧面与锤头进入。 |
| 02 — The strike | 低砧面与巨大方锤建立接触张力。 | 冲击和伸长沿金属长轴继续。 |
| 03 — The temperature between | 低水面、斜向器物、少量余雾；标题分行。 | 热色退去，水面冷白反射接入精修。 |
| 04 — Reveal the edge | 靠近真实棱线与斜面，文字避开主要反射。 | 狭长高光引导镜头退开。 |
| 05 — The relic | 完整冷钢器物、建筑留白与可主动重看的结尾。 | 姿态呼应第一幕；观众决定何时离开。 |

窄屏将标题与主体分置上下区域，重新配置相机和器物位置，底部控制换行。当前样式在 900px、700px 处调整结构，另有 2200px 大屏和低高度横屏规则；大于 700px 的竖屏定帧采用完整适配，保留图片画幅。移动端留白使用固定的 24px 边距，功能文字不小于 11px，次级叙述为 12px；控制保留至少 44px 的主要触发高度。短的陈列式主句在桌面保留较宽字距，正文、移动字幕和长说明使用更紧凑的字距。无悬停输入显示滚动提示，指针提示只在可悬停环境出现。

## Elevation & Depth

深度来自几何斜面、材质粗糙度、局部发光、环境中的长条反射，以及少量雾与遮挡。网页控制不使用浮起卡片或装饰阴影。弹层通过整幅稍亮的暗色表面与背景遮罩形成层级。

选择实时 Three.js 形体与程序材质，目的是让同一器物、温度和镜头能随滚动重求值。两张生成贴图仅提供表面细节；它们不是完整材质扫描，也不能独自保证反射质量。构图参考与正式定帧的来源见 [ASSET-PROVENANCE.md](docs/ASSET-PROVENANCE.md)。

当前材质分别控制粗糙表面、磨削斜面和薄刃，环境反射来自程序摄影灯带。水线与接触余波采用解析反射近似，暖晕使用受深度遮挡的软光面。水体和温度采用视觉近似；当前渲染管线不包含流体、热力学计算或屏幕后处理 bloom。

章间交接依据器物旋转和变形后的实际最低点调整支撑：砧顶、砧腰与底座组成独立砧体，按当前金属与砧顶的几何关系连续下退，锤头保留既定轨迹。水面四个 UV 外沿在边界之前渐隐到透明，保留中央局部反射，使有限面片融入暗场。

## Shapes

主角为直线长轴、连续截面和明确棱脊的抽象钢制器物，不增加护手、刀柄、装饰纹章或伪造的历史身份。UI 使用直角、细线与极小方形当前章节标记；图标由简洁 SVG 线段构成。

## Components

**文字控制。** 无填充按钮与小型大写标签配合悬停下划线；键盘焦点使用可见骨白轮廓。Journey 目录以连续横线分隔，About 使用原生选择框提供动效和细节选择。

**叙事控制。** 底部编号可跨章访问，声音默认关闭，结尾提供主动重看。所有章节的关键状态由同一进度驱动；稳定构图允许停留，少量环境运动保持生命感。减少动态效果偏好收掉多余平滑与过渡。

**定帧视图。** 质量选择与渲染失败路径共用保留六幕结构和 DOM 文案的图片视图。进入定帧状态时，样式立即隐藏 canvas 并显示图片；恢复实时画面时使用 0.65 秒过渡，减少动效选择关闭该过渡。12 张正式定帧从同一实时场景输出，桌面与竖屏各六张；来源记录与文件清单见 [ASSET-INVENTORY.md](docs/ASSET-INVENTORY.md)。六张概念图只承担构图参考用途。

## Do's and Don'ts

- **Do** 保持器物轮廓、棱线与主要痕迹的连续性，并让每幕有可停留的构图。
- **Do** 通过方向明确的侧光、窄反射与局部温度区分材料状态。
- **Do** 为标题、字幕和控制留出真实空间，保持键盘与触摸操作清楚。
- **Don't** 将概念图作为全屏假交互背景，或把导航烘焙在图片中。
- **Don't** 引入满屏火星、赛博 HUD、商业卡片、黑金模板或无依据的大马士革波纹。
- **Don't** 用质量宣称替代对最终浏览器画面和未覆盖环境的如实记录。
