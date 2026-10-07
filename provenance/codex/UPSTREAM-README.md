# CODEX — The Anatomy of a Book

**Fold the sheet. Sew the structure. Close the object.**

一个以书籍装帧为主题的滚动交互作品：纸张经过折叠、排序、缝订、包覆和压印，逐渐形成完整的实体书。画面围绕暖象牙纸、黑色书布、细线与克制的金饰展开；界面正文为英文。

本项目按要求只提供源码、素材和本地构建包。所有操作均为本地开发、构建与预览。

## 快速打开：使用随包的最终构建

最终 ZIP 中的 `dist/` 是一份完整静态构建。已安装 Python 3 的 Windows 用户可以在解压目录打开终端，运行：

```powershell
py -m http.server 4173 --bind 127.0.0.1 --directory dist
```

浏览器打开 **http://127.0.0.1:4173**。按 `Ctrl+C` 停止预览。

如果系统使用 `python` 命令：

```sh
python -m http.server 4173 --bind 127.0.0.1 --directory dist
```

通过本地 HTTP 服务打开；直接双击 `dist/index.html` 会受到浏览器对本地模块和资源的限制。

## 源码开发与重新构建

推荐使用 **Node.js 22.12 或更高版本**，配套 npm。当前锁定的 Vite 8.3.3 和项目清单声明的 Node 范围是 `^20.19.0 || >=22.12.0`；Node 21 与 22.0–22.11 不在此范围内。版本信息见 [package.json](package.json) 与 [依赖来源记录](licenses/dependency-provenance.json)。

在包含 `package.json` 的解压目录中运行：

```powershell
npm ci
npm run dev -- --host 127.0.0.1
```

开发预览地址：**http://127.0.0.1:5173**。首次 `npm ci` 需要下载锁文件指定的依赖；正式页面所需的字体和素材随包提供。

生成并检查生产构建：

```powershell
npm run build
npm run preview -- --host 127.0.0.1
```

生产预览地址：**http://127.0.0.1:4173**。构建结果写入 `dist/`，再次构建会更新这份输出。最终交付只保留一份 `dist/`；`node_modules/` 不随 ZIP 交付，可由 `npm ci` 重建。

Three.js 渲染使用 WebGL 2。桌面端建议在支持 WebGL 2、开启硬件加速的浏览器中查看。移动端采用针对窄屏重新安排的构图，字体与材质均来自本地资源。

## 观看与操作

- 滚轮、触控板或手指滚动推进装帧；反向滚动回看结构变化。
- `Contents` 打开十幕目录；章节标记用于跳转。
- `Motion` 控制动画强度，并配合系统减少动态效果设置。
- 终幕的 `Open the cover` 查看扉页；`Bind again` 回到开始。
- 展示以书本完成的瞬间结束，扉页保持为实体书的一部分。

实际测试范围与环境见本文件末尾的验收记录。

## 十幕

| 幕 | 名称 | 画面主题 |
| --- | --- | --- |
| I | THE VOLUME | 完整闭合书体，建立质量、轮廓和材质 |
| II | SHEET | 单张纸的厚度、纤维与轻微挠曲 |
| III | FOLD | 折线成为结构轴，多张纸组成书帖 |
| IV | GATHER | 书帖按顺序对齐、聚拢 |
| V | SEW | 线穿过折背，沿承托带连接书帖 |
| VI | SPINE | 缝订、衬层与书头带组成连贯书脊 |
| VII | MARBLE | 克制的梳理纹样从液面转移为环衬材料 |
| VIII | CASE | 封板、书布与书芯完成包覆关系 |
| IX | IMPRESSION | 压力形成字印，细微金饰捕捉光线 |
| X | CODEX | 完整书体闭合，可轻启封面并重新观看 |

## 技术与素材分工

项目使用原生 JavaScript、Three.js、Lenis 和 Vite。Lenis 是唯一的平滑滚动控制器；场景由统一的绝对进度驱动。DOM 负责真实文字和可操作控件，Three.js 负责纸张、书帖、缝线、书脊与封面的空间结构，Canvas 负责受控的纹样变化。

首幕使用一张经过筛选的 **AI 生成书体成品素材**，与实时几何场景连接。纸张、黑色书布和大理石纹环衬来自独立的 AI 材质源图，微小起伏与空间形变由代码处理。`art-direction/` 中十张完整关键帧用于视觉开发与比对；关键帧中的排版不是运行页面的交互实现。详见 [架构说明](docs/ARCHITECTURE.md) 和 [素材来源](docs/PROVENANCE.md)。

这是经过工艺资料校准的艺术性数字模型。书帖数量、纸边尺度、缝线细节、形变、时间与部分工序被简化；marbling 使用确定性的纹样变形，并非数值流体仿真。场景顺序服务于视觉叙事，不宣称适用于所有装帧流派。参考 [工艺依据](docs/CRAFT-SOURCES.md)。

## 目录说明

| 路径 | 内容 |
| --- | --- |
| `src/` | 场景、程序化模型、交互与样式源码 |
| `assets/ai-final/` | 选定 AI 成品源图，保留原始 PNG |
| `public/assets/` | 运行时书体图像的 WebP 派生文件 |
| `public/textures/` | 运行时纸张、书布和环衬材质的 WebP 派生文件 |
| `public/models/book-spec.json` | 程序化书体的尺寸、结构、材质与运动规格 |
| `models/` | 完成态书体的独立 GLB、导出元数据与使用说明；网站运行时不加载此静态快照 |
| `public/fonts/` | 自托管 WOFF2 字体 |
| `art-direction/` | 十张选定关键帧及完整提示词、筛选记录 |
| `docs/` | 架构、工艺来源和素材来源 |
| `licenses/` | 字体与依赖的许可文本、版本与来源记录 |
| `dist/` | 最终静态构建 |
| `DESIGN.md` / `PRODUCT.md` | 视觉标准与产品约束 |
| `package-lock.json` | 可重复安装所需的依赖锁文件 |
| `MANIFEST.sha256` | 包内文件的 SHA-256 校验清单，不包含清单自身 |

模型由项目源码创建，不需要额外下载第三方模型。`models/codex-complete.glb` 是从同一几何导出的闭合完成态，可在兼容 glTF 2.0 的编辑器或查看器中打开；它内嵌纹理，不包含装订过程的动画。网站的可逆装订与开合仍由源码实时实现，详见 [模型说明](models/README.md)。最终 ZIP 排除 `node_modules/`、缓存、调试产物、临时截图、失败生成和重复构建。

## 许可与来源

Cormorant Garamond 与 Manrope 使用随包的 **SIL Open Font License 1.1**。Three.js、Lenis 和 Vite 的许可文本随包提供；它们为 MIT，构建工具的传递依赖还包含其他许可证，不能将整包统一标记为 MIT。

项目原创源码、文案和 AI 素材未另行指定统一开源许可证。各部分的来源与授权记录见 [PROVENANCE.md](docs/PROVENANCE.md)。博物馆与保护机构页面仅用于工艺研究，没有复制其馆藏摄影作为项目素材。

## 验收状态

桌面与手机纵向的十幕画面及交互检查已完成；详细范围、可逆性比较和环境限制见 [QA.md](docs/QA.md)。

| 检查项 | 状态 |
| --- | --- |
| `npm ci` / 生产构建 / 本地预览 | 通过 — 独立目录按锁文件安装、Vite 构建与本地 HTTP 预览 |
| 十幕桌面构图与停留画面 | 通过 — 1536 × 1024，每幕 25% / 65% |
| 手机纵向布局、真实交互与目录 | 通过 — 390 × 844 触控模拟；文字无截断、无横向溢出 |
| 快速滚动、反向滚动、章节跳转 | 通过 — 普通动态输入及两视口共 20 对反向画面比较，光栅差异另行记录 |
| 封面打开、重新观看、减少动态效果 | 通过 — 开合、重新开始、焦点与偏好保留 |
| 控制台、资源请求与相对子路径 | 通过 — 生产 `/edition/codex/` 预览，无外部请求或页面／资源错误 |
| 紧凑布局与绘图缓冲上限 | 通过 — 360 × 640、844 × 390 定点视觉复查；4K 实际画布像素低于上限，截图采集边界见 QA |
| 最终 ZIP 内容、许可文件与清理 | 通过 — 选定素材、模型与许可清单核对；一份最终构建，逐文件校验见 `MANIFEST.sha256` |


没有执行 Windows、Android 或 iOS Safari 实机测试。验证环境使用软件 WebGL；模拟视口不等于设备测试，截图结果不构成真实 GPU 帧率保证。

## English quick start

CODEX is an immersive study of a book becoming an object through folding, gathering, sewing, enclosure and pressure. It contains ten scroll-directed scenes, original procedural geometry, selected AI imagery, local textures and self-hosted fonts.

Use Node.js **22.12 or later** and npm. The exact accepted engine range is `^20.19.0 || >=22.12.0`.

```sh
npm ci
npm run dev -- --host 127.0.0.1
npm run build
npm run preview -- --host 127.0.0.1
```

Development runs at http://127.0.0.1:5173 and production preview at http://127.0.0.1:4173. Alternatively, serve the included `dist/` with Python's standard-library HTTP server as shown above. The shipped site assets are local; no API key is needed to view or build the project.

The Visual Bible is a design reference. The experience combines a generated photographic prologue with live spatial geometry and controlled marbling. It is an artistic interpretation of craft, with intentionally simplified physical and procedural detail. See [provenance](docs/PROVENANCE.md), [craft sources](docs/CRAFT-SOURCES.md) and the actual QA status above.
