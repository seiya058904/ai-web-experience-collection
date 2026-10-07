# MAGMA — Stone Before Stone

**Hold the heat. Blacken the surface. Let fire become form.**

一场可以在本地浏览器运行的数字雕塑。九个章节以黑色表层、内部热量与一条连续的裂隙为线索，让光、流动与反射逐步退场，最后留下安静的岩体。

## 立即运行

需要 **Node.js 20 或更新版本**与支持 WebGL 的现代浏览器。项目没有待安装的 npm 依赖，字体、Lenis、图像与音频生成代码都已包含。

### Windows

1. 完整解压 ZIP。
2. 打开 `MAGMA` 文件夹，双击 **`START-WINDOWS.bat`**。
3. 浏览器会打开 `http://localhost:4173/`。浏览期间保持启动窗口打开，关闭服务时按 `Ctrl+C`。

启动器会检查 Node 是否存在及版本是否满足要求。不要在压缩包预览窗口中直接运行。

### macOS / Linux / 终端

进入解压后的 `MAGMA` 文件夹：

```bash
npm run dev
```

然后打开 `http://localhost:4173/`。也可直接执行：

```bash
node scripts/serve.mjs --open
```

如果端口已被使用：

```bash
node scripts/serve.mjs --port 4174 --open
```

服务只绑定本机回环地址 `127.0.0.1`。本次交付没有部署、托管或公开网址。

直接双击 `index.html` 会显示本地运行说明；浏览器的 `file://` 环境无法可靠加载 ES modules 和 WebGL 图像纹理，请使用上述本地服务。

## 如何体验

| 操作 | 行为 |
| --- | --- |
| 滚轮、触控板、手机滑动 | 连续推进材料状态，也可以反向返回 |
| Begin the descent | 从压力进入熔融状态 |
| Index / 右侧章节刻度 | 进入任意一个稳定构图 |
| SKIN · Hold to cool | 按住鼠标、触摸或空格，推进表面冷却；松开后逐渐返回章节原状态 |
| SKIN · Enter | 键盘切换持续冷却，再按一次释放 |
| CRACK · Open the seam | 短暂打开独立的表层网格，露出内部热痕 |
| GLASS · 移动指针 / 触摸画面 | 调整冷反光的位置 |
| FRACTURE · Trace the fracture | 显现浅凹曲面与分离的断边，再次点击让它们回落 |
| Sound off / on | 开启或关闭程序生成的轻微氛围声；默认关闭 |
| Index · Motion on / reduced | 切换动态程度；系统减少动态偏好会被自动读取 |
| Esc | 关闭章节或作品说明面板，并返回原来的焦点 |
| Return to the heat | 回到第一幕，重新开始 |

结尾的大标题随最后一段滚动离开。冷图完全接管后，内部发光、自动材料运动和声音均归零；章节入口与返回操作仍然可用。

## 九幕叙事

| 章节 | 画面与动作 |
| --- | --- |
| 01 · PRESSURE | 巨大、近黑的岩体，极窄内热裂缝，微弱压力脉动 |
| 02 · MOLTEN | 厚而黏的熔融褶皱，局部热区缓慢变形 |
| 03 · FLOW | 熔融路径穿过更明显的黑色绳状表皮 |
| 04 · SKIN | 粗糙冷壳与仍有热量的内层形成斜向边界 |
| 05 · CRACK | 近乎平面的黑色表面收缩，一道开缝切分构图 |
| 06 · GLASS | 光从内部发射变成表面返回，黑曜石占据空间 |
| 07 · FRACTURE | 弧形、贝壳状断面成为浅浮雕与自然几何 |
| 08 · CRYSTAL · STONE | 颗粒状玄武岩与稀疏矿物包体接过视觉主导，少量明亮矿物面保留缓慢冷反光 |
| 09 · SEALED | 返回开场的岩体，最后的余光被封存、熄灭 |

作品比较多种材料状态与冷却历史。黑曜石与玄武岩的组成和结晶历史存在区别；章节顺序没有声称一块实际岩样必然依次成为这些材料。画面与时间经过艺术编排，相关地质依据见 [RESEARCH.md](docs/RESEARCH.md)。

## 画面与实现

图像提供微观纹理、黑色层次和雕塑构图；代码驱动其变化。实现采用原生 HTML、CSS、JavaScript modules，以及一个 WebGL 1 材质合成器。没有框架、后端、账户、远程字体、自动远程媒体请求或分析脚本。

六个自定义系统：

| 系统 | 实现 |
| --- | --- |
| Molten material | 仅对图版中的真实热色区域做慢速、连贯的局部位移，保持周围冷壳稳定 |
| Crust growth | 带静态地质不规则度的方向性表皮前沿，把发光区转成低反射的冷壳细节 |
| Fissure / emissive | 原图热区遮罩、低幅热脉动与开缝内光；返回岩体时将附近暖色包围的白热芯一起熄灭 |
| Cooling state | 单一滚动状态决定热量、表皮、流动、开裂、反射与封存，无随机累计进度 |
| Obsidian material | 无橙光的曲面反射变化，随指针或触摸调整 |
| Fracture geometry | 两片独立网格、沿实际断边分离的三角形，以及作者定义的浅凹曲面和法线 |

`src/fracture-geometry.js` 是模型源文件：运行时生成几何与一张很小的裂隙路径数据纹理。图版位于 `assets/materials/`，GLSL shader 源码位于 `src/shaders/`。这些系统是为作品定向设计的视觉机制，没有伪装成流体、热传导或应力数值模拟。

### 滚动与生命周期

Lenis 是唯一的平滑滚动控制者，`src/main.js` 持有唯一的应用 RAF。Renderer 不创建自己的动画循环。触屏保留原生滚动。

每幕的进度包含 **Enter → Stable composition → Living hold → Handoff → Exit**。稳定阶段提供完整排版，随后由前沿、流动和表面变化完成交接。相机只做小范围推进和表面移动。

STONE 在正常动态的稳定停留阶段，以 **64 秒动画周期**让克制的冷反光经过少量明亮矿物面。暗部与岩体轮廓保持稳定，这一变化不增加纹理采样；减少动态模式与 SEALED 完成状态不应用该效果。减少动态仍允许用户主动冷却、开缝与显现断面。

### 排版与输入适配

手机版 FLOW 与 STONE 的小字现在与主文案一起放在上方留白中。STONE 小字宽度限制为 **23ch**，在不宽于 360px 的视口中把该章节第一网格行设为 **18%**；390 × 844 与 320 × 740 的完整两行小字均已在黑色背景上复核。平板 GLASS 协调文字与岩体反光面的布局，标题字距保持 **不小于 −0.04em**。触屏提示依据 `(pointer: coarse)` 输入条件显示，适用于采用粗指针输入的手机和平板。

### 性能边界

- 每页一个 WebGL context；摄影纹理同时最多 3 张，另有一张小型路径数据纹理。
- 桌面 DPR 上限 1.5，绘制缓冲区预算最多约 320 万像素。
- 手机及较小触屏设备 DPR 上限 1.25，绘制缓冲区预算最多约 110 万像素，并减少网格密度与 shader 细节。
- 手机构图切换断点为 700px；小型横向平板保留横图构图，同时降低 GPU 成本。
- 普通稳定帧只采样当前图版；过渡时合成下一张。没有体积层、粒子系统、屏幕空间 bloom 或离屏 WebGL 场景。
- 手机绘制目标最多 30 次/秒；桌面最多 60 次/秒。这是调度上限，不是对所有硬件的帧率保证。
- 隐藏页面暂停应用 RAF 与声音。最后一帧以及减少动态的静止画面停止无意义的 GPU 重绘。
- WebGL 不可用或 context 丢失时，图片版本保留九幕文字、导航、表皮冷却操作与结尾；依赖几何或反光的操作会自动隐藏。context 恢复后重新建立资源。

声音由 Web Audio 的滤波噪声与很弱的正弦波在本地生成，没有音频文件或外部音源。只有用户主动开启声音时才创建 AudioContext。

## 检查与构建

```bash
npm run check
npm run build
```

检查会核验必需文件、九组桌面／手机 WebP、JavaScript 语法及本地模块引用。构建通过检查后，把运行所需文件写入干净的 `dist/`。

关闭先前的开发服务后，可以这样检查构建版本：

```bash
node scripts/serve.mjs --dir dist --open
```

根目录已经可以直接运行；ZIP 保留源代码与生成构建的方法。`dist/` 是可再生成的输出，不重复打包。

最后一次 STONE 排版修正后的严格检查与构建通过，生成 **49 个文件、5.09 MiB** 的本地构建。两种主要尺寸的九幕与面板、补充尺寸、材质及锚点回归已记录；独立审阅者对五项已解决的修正给出 **`ship`**，该结论限定于这五项问题。详细证据与未覆盖的实机环境见 [ACCEPTANCE.md](docs/ACCEPTANCE.md)。

## 目录导航

| 路径 | 用途 |
| --- | --- |
| `index.html` | 九幕语义化内容、导航、控制与说明面板 |
| `src/main.js` | Lenis、交互、页面状态、键盘、历史与唯一 RAF |
| `src/styles.css` | 字体、排版、响应式与静态图片版本 |
| `src/material-state.js` | 可重复、可反向的九幕材料状态 |
| `src/material-renderer.js` | WebGL、图像加载、纹理预算与 context 生命周期 |
| `src/shaders/material.js` | 材质 vertex / fragment GLSL |
| `src/fracture-geometry.js` | 曲面、裂隙数据与独立断面网格 |
| `src/audio.js` | 默认静默的可选程序声音 |
| `assets/materials/` | 精选桌面与手机图版 |
| `assets/fonts/` | 本地 Archivo 可变字体 |
| `vendor/`、`licenses/` | Lenis 原始文件及第三方许可证 |
| `scripts/` | 本地运行、检查与构建，均无 npm 依赖 |
| [DESIGN.md](DESIGN.md) | 完整设计约定与视觉实现决策 |
| [.impeccable/design.json](.impeccable/design.json) | 随项目保留的机器可读设计清单 |
| `docs/VISUAL_BIBLE.md` | 视觉论点、颜色、九幕构图及精选概念 |
| `docs/PROVENANCE.md`、`docs/asset-prompts.json` | 素材来源、完整提示词、比较／舍弃记录、实际尺寸与哈希 |
| `docs/RESEARCH.md`、`docs/COPY.md` | 地质研究依据与最终文案 |
| `docs/ACCEPTANCE.md` | 功能、尺寸、材质回归与构建验收记录，以及验证范围 |

## 修改作品

文本在 `index.html`；颜色、字号和章节滚动长度在 `src/styles.css`。素材清单、手机焦点与尺寸在 `src/main.js`。改变材料进度请编辑 `src/material-state.js`，改变表面视觉机制请编辑 `src/shaders/material.js`。

替换图像时同时检查横／竖构图、文件实际尺寸、裂缝路径、热色遮罩和新素材来源记录。PRESSURE 与 SEALED 的轮廓需要保持构图对应；它们是艺术生成的配对图版，并非逐像素一致的实物扫描。

本包只保留精选可用素材、源码、设计记录、运行方法与第三方许可证。没有安装目录、缓存、测试截图、失败图版或重复构建。
