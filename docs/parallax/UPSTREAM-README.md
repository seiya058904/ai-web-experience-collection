# PARALLAX — The Museum of Impossible Forms

**One form. Infinite ways of seeing.**

一件原创雕塑，十种观看方式。PARALLAX 是一段由滚动控制的空间艺术体验：厚重的黑石、镜面切面与一道细光，在分离、对齐、倒影、裂隙和重组之间持续变化。

交付版本：**1.0.1**。

## 解压后运行

请先解压整个 ZIP，并保持文件夹结构完整。

- **Windows：**双击 `START-WINDOWS.bat`。
- **macOS：**双击 `START-MAC.command`。若系统未保留执行权限，可在该文件夹的终端运行 `bash START-MAC.command`。

启动脚本优先使用 **Node 20 或更新版本**；没有合适的 Node 时，会尝试使用 **Python 3** 运行已附带的 `dist/`。浏览器会打开 [http://127.0.0.1:4173/](http://127.0.0.1:4173/)。保持终端窗口开启；结束体验后关闭窗口或按 `Ctrl+C`。

**无需 `npm install`，运行时无需联网。** 字体、图片、Three.js 与其他运行文件均在包内。服务地址固定为本机 `127.0.0.1:4173`。这个交付包不包含发布配置，也不会自动上传或上线。

若浏览器没有自动打开，手动输入上方地址即可。若提示端口已占用，请先结束之前启动的本地服务。

### 手动启动

在解压后的项目文件夹运行：

```sh
node scripts/serve.mjs
```

也可以使用 `npm start`。没有 Node 时，运行：

```sh
python3 scripts/serve.py
```

Windows 的 Python 启动命令也可以是 `py -3 scripts/serve.py` 或 `python scripts/serve.py`。使用本地服务入口打开体验；直接双击 `index.html` 无法可靠加载模块与图形资源。

## 如何观看

滚动、触控滑动或键盘翻页推进章节；向上滚动可逆向观看。页面的原生滚动位置控制作品的状态。

| 控件 | 用途 |
|---|---|
| **Index** | 打开十章目录并跳转到指定章节；`Esc` 关闭目录。 |
| **Align view** | 在 ALIGNMENT 章节回到碎片相互对齐的特定视点。 |
| **Reduced motion** | 切换减少动态效果偏好；保留各章节的完整构图与内容。 |
| **Focus artwork** | 暂时收起非必要界面文字，把注意力留给作品。 |
| **Begin again** | 从终章返回 OBJECT。 |

## 十个章节

| 章 | 名称 | 观看重点 |
|---:|---|---|
| 01 | OBJECT | 先认识完整雕塑的轮廓、材质与中空结构。 |
| 02 | FRAGMENT | 原本紧密的结构展开，切面和距离变得可见。 |
| 03 | ALIGNMENT | 不同深度的碎片在一个特定视点重新成为整体。 |
| 04 | REFLECTION | 倒影随真实视点与几何变化。 |
| 05 | RIFT | 一道切口打开为可进入的深度。 |
| 06 | MEMBRANE | 隔着薄膜，观察后方物体的折射变化。 |
| 07 | CHROMA | 颜色沿切面和边缘出现，黑色体量仍然稳定。 |
| 08 | HALO | 主体接近隐去，细光勾出边界。 |
| 09 | REASSEMBLY | 同一组碎片有序返回原位。 |
| 10 | THE MUSEUM | 视野拉远，让一件作品重新回到巨大的空间。 |

## 图形与兼容性

空间章节使用 WebGL2。若浏览器无法创建图形上下文，或图形上下文丢失，页面会保留本地作品图像与可阅读内容；此时不提供完整的实时空间交互。浏览器恢复图形上下文后，页面会重新建立渲染资源并回到当前观看位置。若图形能力始终不可用，可检查浏览器硬件加速设置，再重新打开页面。

开启系统的“减少动态效果”偏好时，页面采用较安静的章节构图，并移除指针视差。画面可以适配桌面、平板与手机；原生 DOM 文字及实时几何按浏览器分辨率绘制。生成的参考图与图片素材各有其源尺寸，不能等同于原生 4K 图像。

界面偏好会保存在当前浏览器。`Focus artwork` 收起文字后，可用 **Show labels** 恢复。ALIGNMENT 的滑动控件适用于触屏与键盘；桌面还可以轻移指针观察视点偏离后的结构变化。

### 1.0.1 更新

- 调整日常铬金属切面的环境反射，让窗格的暗部与高光带更清楚地呈现抛光表面。
- 为竖屏平板采用匹配的摄像机构图，并修正平板开场、窄横屏标题、说明文字和底部控件的位置。
- 章节跳转中改变窗口尺寸时，继续前往原目标；手动滚动可接管跳转。`Align view` 可以立即结束尚未完成的跳转并恢复对齐视点。
- 在图片加载完成后再建立图形资源，修正加载期间发生图形上下文丢失和恢复时的初始化问题。

## 修改与重新构建

源代码和正式素材均包含在 ZIP 中。修改源码后使用 Node 20+ 运行：

```sh
node scripts/build.mjs
```

等效命令为 `npm run build`。构建只使用 Node 自带功能，把应用入口、源码、本地渲染依赖以及 `public/` 内的正式素材复制到 `dist/`，不安装依赖、不访问网络。附带的 `dist/` 可以直接运行，Python 入口负责运行现成产物。

需要边修改边预览时：

```sh
node scripts/serve.mjs --source
```

等效命令为 `npm run dev`。源模式把 `/assets/`、`/fonts/` 映射到 `public/`，其他应用路径保持相对结构。服务与构建脚本均根据自身位置确定项目目录，不依赖终端的当前工作目录。

| 位置 | 内容 |
|---|---|
| `index.html`、`src/` | 页面、样式、交互与空间渲染源码。 |
| `vendor/` | 本地 Three.js 及所用附加模块。 |
| `public/assets/`、`public/fonts/` | 正式图片、材质与字体。 |
| `dist/` | 可直接运行的完整静态构建。 |
| `reference/`、`docs/` | 选定视觉参考、Visual Bible 与相关说明。 |
| `models/` | 同源生成的 GLB 雕塑模型及尺寸、结构、散列值说明。 |
| `licenses/` | 随包依赖与字体的许可证。 |
| `scripts/`、`tests/` | 无外部依赖的构建、本地服务、模型导出与核心行为检查。 |

参考图用于记录设计目标；真正的视点对齐、移动碎片、倒影和重组由几何与渲染逻辑完成。AI 生成素材的使用与来源记录见随包文档。

### 设计与制作说明

- [Visual Bible（图文版）](docs/VISUAL_BIBLE.html)：可直接在浏览器打开，包含十幕选定参考、材质板、RIFT 分镜与手机构图。
- [Visual Bible（完整说明）](docs/VISUAL_BIBLE.md)：设计方向、版式规则，以及每一幕从参考到实现的制作决策。
- [实现说明](docs/IMPLEMENTATION.md)：原生滚动时间轴、透视对齐公式、实时倒影与折射、RIFT 空间和降级行为。
- [素材来源与使用记录](docs/ASSET_PROVENANCE.md)：生成素材、字体、渲染依赖及许可证；精确记录在 `assets/provenance.json`。

模型由 `src/model.js` 的同一套几何定义生成，含 18 个命名碎片和一道附属光缝。GLB 记录完整静止形态；时间轴、摄像机与实时光学效果保存在应用源码中。修改模型定义后，使用以下命令更新导出文件：

```sh
node scripts/export-model.mjs
```

核心数学与时间轴检查使用 Node 内置测试器运行：

```sh
node --test
```

## 验证状态

本地验收已完成。浏览器验收使用 **Chromium 153.0.8010.0、Linux、无头浏览器与软件 WebGL**。本次 1.0.1 更新完成了以下复验；发现的材质、构图、导航及初始化问题均已修正。

- **7 项核心测试通过：**桌面与手机的透视对齐、偏离视点后的真实分离、十章可达性、正逆向采样、减少动态效果及输入边界。
- **正式构建的 18 个画面通过：**1920 × 1080 覆盖十章；3840 × 2160 覆盖 ALIGNMENT、REFLECTION、MEMBRANE、REASSEMBLY；568 × 320 复验 REFLECTION、CHROMA、HALO、REASSEMBLY 的文字布局。画面均到达相应实时状态，保持原有碎片与几何身份，没有横向溢出。
- **平板和横屏专项检查通过：**768 × 1024、820 × 1180、1024 × 768、844 × 390、568 × 320 覆盖关键章节、目录及对齐操作；另检查竖屏平板的开场过渡。五种尺寸都验证了偏离视点后的分离、Align view 复位、完整目录及关闭后的焦点返回。
- **导航与恢复检查通过：**跳转中的尺寸变化、手动滚动接管、静止位置保持、尚未完成跳转时的 Align view、非整数章节位置的刷新与浏览器返回、RIFT 正逆向穿越、减少动态效果切换，以及静止后停止绘制。
- **图形上下文检查通过：**已运行场景在丢失与恢复后回到当前姿态；图片加载期间分别验证“先恢复、后完成图片加载”和“图片加载完成时仍然丢失、随后恢复”两条路径。两条初始化路径均正确重建图形资源，没有图形警告或错误。
- **触屏单独验证：**在 390 × 844、设备像素比 3 的触屏模拟环境中，目录点击、滑杆视点保持与 Align view 复位均通过。渲染像素比按手机预算限制为 1.75。
- **模型与交付检查：**GLB 的几何、索引、嵌入纹理及来源散列已核对；正式素材、文档链接和本地运行依赖完整。

最终正式构建检查没有浏览器或着色器错误、警告、资源加载失败，也没有外部运行时请求。原始 1.0.0 验收另覆盖了 18 组行为检查与 45 个静止画面，包括 2560 × 1440 和 320 × 568；这些属于初版记录，不计入本次 18 个正式构建画面。

上述尺寸与触屏来自浏览器模拟。未在实体 iPhone、Android、Windows 或 macOS 设备上进行性能基准，也未单独验收 Safari、Firefox 或平台原生启动器。实际帧率取决于设备、浏览器与图形驱动。AI 图像与实时几何采用互补的制作方式，选定参考图记录的是设计目标。

## English quick start

Extract the entire ZIP, then open `START-WINDOWS.bat` or `START-MAC.command`. The launcher prefers **Node 20+** and can use **Python 3** to serve the included build. Open **http://127.0.0.1:4173/** and keep the terminal running. No package installation or runtime internet connection is required.

Scroll through ten chapters, use **Index** to jump between them, restore the intended viewpoint with **Align view**, and adjust **Reduced motion** or **Focus artwork** to suit your viewing preference. **Begin again** returns to the opening. WebGL2 provides the spatial interactions; an image-and-text presentation remains available if the graphics context cannot run.

To serve the included build, run `node scripts/serve.mjs` or `python3 scripts/serve.py`. To rebuild after changing source, run `node scripts/build.mjs`; to preview source, run `node scripts/serve.mjs --source`. All scripts resolve paths relative to the project, listen only on loopback, and contain no deployment hooks.

Version 1.0.1 refines ordinary chrome reflections, portrait-tablet and short-landscape framing, native navigation during resize, and graphics initialization during context loss. Validation includes seven core tests; eighteen current production frames across desktop, 4K and short landscape; targeted checks at five tablet and landscape sizes; touch interaction at device pixel ratio 3; fractional-position reload and browser Back; and both initial-load and active-scene WebGL recovery. The current production checks produced no browser or shader warnings, failed assets or external runtime requests. The original 1.0.0 acceptance also included eighteen behavior groups and forty-five resting frames; those are earlier records, not additional current-build captures. Physical-device performance, Safari, Firefox and native Windows/macOS launchers were not separately benchmarked. Open `docs/VISUAL_BIBLE.html` for the visual guide, and see `docs/IMPLEMENTATION.md` and `docs/ASSET_PROVENANCE.md` for production details.
