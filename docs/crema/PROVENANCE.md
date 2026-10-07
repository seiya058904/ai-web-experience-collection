# CREMA — 视觉来源与制作记录

本文件记录最终保留的视觉资产、选择与精修过程，以及它们和网站实时系统的关系。所有生成工作日期为 **2026-10-07**。生成工具为 **`image_gen`**；工具未提供模型版本标识，因此本项目不声明具体模型版本。

**完整的 14 条已接受生成记录、逐字提示词、引用关系，以及全部 19 个图像文件的 SHA-256、像素尺寸和字节数，见 [production/manifest.json](../production/manifest.json)。** 清单中的文件路径均相对于项目根目录；不包含生成工作区或私有输出地址。

这些图像是为本项目生成的视觉解释，并非某台真实机器或一次真实萃取的摄影记录。它们不代表某个制造商品牌，也不构成工程 CAD、颗粒测量、显微断层扫描、CFD 或实测流体数据。

## 最终保留的资产

| 资产层 | 目录 | 数量 | 用途 |
|---|---|---:|---|
| 已接受的构图研究 | `production/concepts/` | 9 WebP | 比较尺度、材质、章节构图和移动端裁切的视觉依据 |
| AI 生产母版 | `production/originals/` | 5 PNG | 原始生成输出，逐字节保留 |
| 网站运行图像 | `public/assets/` | 5 WebP | 从生产母版转换得到的本地运行资产 |

这 19 个独立图像文件合计约 **14.07 MiB**。`dist/` 是随包提供的一份预构建应用，其中的运行图像为 `public/assets/` 的副本；资产主记录以源目录为准。原始 PNG 母版与生成输出已核对一致，所有已接受图像均保留生成输出的实际像素尺寸。

## Generate → Compare → Reject → Refine → Curate

### 第一轮：机器与颗粒床

并行比较两种 Hero 方向，并建立第一张 packed-bed 剖面研究。`hero-a` 的左侧文案／右侧产品构图过于常规，接近产品广告，因此被舍弃。`hero-b` 将具有强烈径向几何的巨大机器置于建筑尺度的字形上方，形成作品需要的压迫感与空间秩序，成为选定方向。被舍弃的图像不随包保留；这里仅记录选择理由。

保留 `hero-b` 和 `bed-concept`。它们是构图与材质研究，而非直接嵌入页面的截图。

### 第二轮：建立连续材质语言

保留 `saturation-concept`、`flow-concept`、`crema-concept` 和 `cup-concept`。四张研究分别对应不均匀推进的湿润边界、孔隙中的竞争路径、细密气液泡沫表面，以及最终小体积 espresso 的空间尺度。冷钢、近黑干颗粒和温暖液体保持同一组色彩关系。

### 第三轮：回到生产与关键时刻

将选中的 `hero-b` 原始生成输出再次交给 `image_gen`，生成 `machine-master`。精修提示要求去掉烘焙在图中的界面字样、静止液滴、滴水盘和远处支撑结构，为真实 HTML 字体与代码液体留出空间。此轮另外保留 `pressure-concept`、`drop-concept` 和 `mobile-concept`，补齐压力显现、第一滴离开，以及纵向近景。

移动端研究用于尺度和裁切判断。其带有手写／衬线感的次级字体没有进入最终实现；网站统一使用本地 Archivo 字体。

### 第四轮：生产母版精修

将选中的 crema、cup、bed 原始生成输出分别作为 `image_gen` 参考，生成清除界面文字后的生产母版。Crema 的精修强调更小、更不规则的细胞和克制高光；bed 的精修强调破碎的细胞性颗粒、尺寸差异和可见孔隙。另从文本生成一张方形 `granule-master`，供实时颗粒材质使用。

以上轮次来自制作记录。未记录精确生成时刻或同一轮内的墙钟先后顺序。提示词中的尺寸是生成意图；清单中的像素尺寸是实际交付文件的尺寸。

## 构图研究 → 生产母版 → 运行资产

| 参考生成 | 生产母版 | 运行资产 | 网站中的作用 |
|---|---|---|---|
| `hero-b` | `production/originals/machine-master.png` | `public/assets/machine.webp` | 机器背景；液滴、细流和文字由实时系统单独构成 |
| `bed-concept` | `production/originals/bed-master.png` | `public/assets/bed.webp` | 干颗粒床参考与图像回退 |
| 无；独立文本生成 | `production/originals/granule-master.png` | `public/assets/granule.webp` | 实时不规则颗粒的材质细节 |
| `crema-concept` | `production/originals/crema-master.png` | `public/assets/crema.webp` | Crema 微观表面的图像基础与动态 shader 输入 |
| `cup-concept` | `production/originals/cup-master.png` | `public/assets/cup.webp` | 最终小杯 espresso 静物 |

引用式精修使用的是对应研究的原始 PNG 生成输出。随包的研究图是这些输出的 WebP 存档版本；并非在外部图像编辑器中修改该 WebP 得到生产母版。重复的研究 PNG 不保留，五张最终生产 PNG 母版均保留。其余五张研究以构图参考的形式影响代码实现，没有被作为整页背景直接使用。

## 接受的九张构图研究

| 研究文件 | 接受的设计作用 |
|---|---|
| `production/concepts/hero-b.webp` | 巨大径向机器、中央张力、建筑尺度字体 |
| `production/concepts/bed-concept.webp` | 干燥、碎裂、多尺度颗粒与连续孔隙 |
| `production/concepts/saturation-concept.webp` | 不整齐的湿润前沿与干湿材质差异 |
| `production/concepts/pressure-concept.webp` | 短暂、克制的 9 BAR 构图 |
| `production/concepts/flow-concept.webp` | 孔隙内分流、竞争与重新汇合 |
| `production/concepts/drop-concept.webp` | 从微观路径返回第一滴真实尺度 |
| `production/concepts/crema-concept.webp` | 细密、不稳定的 reddish-brown 气液表面 |
| `production/concepts/cup-concept.webp` | 微小杯体与巨大负空间形成的终点 |
| `production/concepts/mobile-concept.webp` | 为纵向屏幕重新组织的机器近景 |

研究图中的文字、导航和标记只表达排版意图。实际界面、可访问文本、章节导航和交互由 HTML、CSS 与 JavaScript 实现。

## 图像处理边界

所有改变图像内容的生产精修均通过 `image_gen` 完成，精确提示词和参考生成 ID 已写入清单。工具外只使用 **ffmpeg 将 PNG 编码为 WebP，quality 90、compression level 6**。没有进行工具外裁切、缩放或修图。母版 PNG 保持原始生成输出；研究与运行 WebP 保持对应输出的像素尺寸。

浏览器里的响应式裁切、DOM 排版、动态光照、shader 处理与粒子／液体几何属于实时表现系统，不会改写上述存档图像。

## 原创实时系统与可选模型

`src/visuals/PorousWorld.js` 构建不规则颗粒、packed bed、压实后的空隙、逐步饱和、湿润材质变化、压力场的视觉表达、曲折竞争路径和萃取颜色转变。其形态与行为由项目代码创作，不是从颗粒测量或物理求解器导入。

`src/visuals/LiquidWorld.js` 构建液面张力、颈缩与脱落、后续液滴、espresso 细流和 crema 表面演化。生成图像提供材质参考与部分输入，液体过程与滚动状态由实时几何和 shader 表达。`src/Soundscape.js` 使用原创 Web Audio 合成；没有使用外部录音或采样音乐。

可选的 GLB 是从同一组原创程序化几何导出的快照，不是网站运行时依赖，也不是外部下载模型。其独立记录、兼容性、几何数量、作者设定的场景单位与 SHA-256 见 [模型清单](../production/models/models-manifest.json) 和 [模型说明](../production/models/README.md)。生成脚本为 `scripts/export-models.mjs`。自定义湿润、流动和液体 shader 不被宣称为已烘焙进这些静态快照。

同一导出脚本还保存两张精确的程序化 PNG：原始细胞性色彩与高度纹理。它们保持运行时 RGBA 像素值，独立的像素／文件散列、色彩空间、repeat 与 flipY 设置见 [纹理清单](../production/textures/textures-manifest.json) 和 [纹理说明](../production/textures/README.md)。这些纹理是代码生成数据；AI 材质覆盖图仍单独保留在图像资产目录中。

## 1.1 实时精修记录

本轮没有新增或替换生成影像。五张生产母版、九张接受的构图研究与五张运行 WebP 保持原有来源链；改动发生于实时代码。颗粒采用对象坐标中的三向色彩／高度采样，湿润反光与孔隙水膜重新编排；汇流投影连接返回机器的附着点，局部气泡形成后进入原有 crema 影像。最终模型与原始程序化纹理由同一源码重新导出，清单更新了源码散列与当前投影规则。

## 科学与权利边界

9 bar 是本作品使用的经典叙事参考。场景允许低压润湿、压力建立与可变过程；它不声称所有 espresso 必须以固定 9.000 bar 制作。液体在孔隙内从清澈逐渐带走物质，与出口随萃取进行而从较深、较浓趋向较浅的颜色变化，是两个不同的观察视角。Crema 表达的是气泡、液体、油滴与提取物组成的复杂表面，不是纯粹的咖啡油。研究依据和解释边界见 [SCIENCE.md](SCIENCE.md)。

原创源代码采用项目 MIT License。生成图像作为项目资产提供，受适用的生成服务条款约束，不保证独占性。第三方依赖和字体继续适用各自的上游许可，详见 [ATTRIBUTION.md](../ATTRIBUTION.md)、[LICENSE](../LICENSE) 与 `licenses/`。研究论文图版、实验数据、论文 PDF、制造商照片和广告图像未被作为生产素材再分发。
