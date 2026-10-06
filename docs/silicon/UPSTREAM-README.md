> Preserved upstream delivery record. Its original paths, commands, versions and validation claims describe the standalone ZIP; see `ACCEPTANCE.md` for Collection verification.

# SILICON — From Sand to Signal

一场由滚动推进的半导体数字展览：从晶圆与图形化，进入纳米结构、金属互连与先进封装，最后让第一束信号穿过完整系统。八个场景由实时几何、程序化材质、光路和线路共同构建。

**交付包含完整源码与一份 production build。所有运行资源均在本地；没有托管服务、远程图片或运行时 CDN 依赖。**

## 最快打开：无需安装项目依赖

安装 **Node.js 22.12 或更新版本**；推荐 Node 24。解压 ZIP，在包含本 README 的项目文件夹打开 PowerShell 或终端，然后运行：

```powershell
node scripts/serve.mjs
```

浏览器打开 **[http://127.0.0.1:4173/](http://127.0.0.1:4173/)**。按 **Ctrl+C** 关闭服务器。

这条命令直接提供 ZIP 内的 **dist/**，使用 Node 内置模块，因此不需要先运行 npm install 或 npm ci。也可以使用完全等价的 **npm run serve**。

请通过 HTTP 地址打开；双击 dist/index.html 的 **file://** 打开方式不受支持，浏览器对 ES modules 与资源来源的限制会影响运行。

若端口 4173 已被占用，PowerShell 中改用：

```powershell
$env:PORT = "4174"
node scripts/serve.mjs
```

对应地址是 [http://127.0.0.1:4174/](http://127.0.0.1:4174/)。macOS / Linux 可运行 **PORT=4174 node scripts/serve.mjs**。服务器固定监听本机 127.0.0.1，仅公开 dist 中的文件；每次请求读取当前版本，避免重建后仍使用旧资源。

## 修改源码与重新构建

在项目根目录依次运行：

```powershell
npm ci
npm run dev
```

开发地址由 Vite 在终端输出，默认是 [http://localhost:5173/](http://localhost:5173/)。首次 npm ci 需要访问 npm 软件源；安装完成后，网站本身不需要联网。

| 命令 | 用途 |
| --- | --- |
| npm ci | 按 package-lock.json 安装锁定版本的依赖 |
| npm run dev | 启动 Vite 开发服务器与热更新 |
| npm run check | 运行 TypeScript 类型检查 |
| npm run build | 先检查类型，再生成新的 dist/ |
| npm run preview | 通过 Vite 预览 dist/，默认端口 4173；需要已安装依赖 |
| npm run serve | 用内置 Node 服务器打开 dist/；不依赖 node_modules |

正式构建与预览：

```powershell
npm run build
npm run preview
```

修改源码后需要重新 build，独立服务器才会展示新版本。构建工具 Vite 8.3.3 的实际 Node 要求是 **^20.19.0 或 >=22.12.0**；本交付统一建议使用 22.12 及以上版本。

## 如何体验

用滚轮、触控板或触摸纵向推进场景；反向滚动可回看制造过程。底部八段章节导航可以直接到达指定场景，顶部 **The process** 提供章节入口，**About** 提供作品与工艺说明。

在章节停住时，观察材质反射、层间关系和线路活动。晶体管、互连与封装章节提供对应的检查控制，用来观察开关、层距或组装关系。所有交互都保持在同一个叙事场景中。

支持键盘 Tab 导航和系统 **prefers-reduced-motion**。低动态模式减少惯性、连续光流与大幅镜头运动，保留关键结构和阅读内容。WebGL 不可用时提供简化示意视图。具体浏览器与尺寸的最终验收情况见 [docs/VERIFICATION.md](docs/VERIFICATION.md)。

## 八个场景

| 场景 | 核心视觉 |
| --- | --- |
| 01 MATERIAL | 带定位缺口的晶圆、die 阵列、表面线路与薄膜反射 |
| 02 PATTERN | 反射式掩模、折返光路、扫描曝光与图形转移 |
| 03 BUILD | 沉积、图形化、刻蚀和层间剖面 |
| 04 TRANSISTOR | 三层硅沟道、栅介质与剖开的环栅结构 |
| 05 INTERCONNECT | 交错金属线路、垂直 via 与多级互连 |
| 06 PACKAGE | substrate、interposer、两个逻辑 chiplet、四组 HBM 与散热盖 |
| 07 SIGNAL | 沿实际构造路径移动的信号脉冲与克制的局部热区 |
| 08 SILICON | 完整封装、蚀刻标记与安静的终章构图 |

## 项目结构与资源

| 路径 | 内容 |
| --- | --- |
| src/ | 展览逻辑、页面样式与场景源码 |
| src/scene/ | 实时几何、材质、晶圆、微结构和封装系统 |
| index.html | 入口文档 |
| package.json / package-lock.json | 开发命令与锁定依赖 |
| dist/ | 本次交付的一份可运行 production build |
| scripts/serve.mjs | 无第三方依赖的本地静态服务器 |
| PRODUCT.md / DESIGN.md | 产品边界、视觉方向、实际设计参数与界面规范 |
| docs/SCENE-ARCHITECTURE.md | 八幕镜头职责、工序时序、结构交接与渲染架构 |
| docs/SOURCES.md | 工艺参考与视觉化简说明 |
| docs/licenses/ | 依赖与字体的原始许可和版权声明 |

浏览器中的模型、路由图案、环境反射和材质纹理由代码生成。Manrope 与 IBM Plex Mono 字体由 Fontsource 包提供，并在构建时复制到本地资源中。交付不含第三方厂商图片、标识或概念设计图；不含 node_modules、缓存和临时验收截图。

## 工艺表达与许可

本作品以可信工艺资料建立结构关系，但尺寸、比例、工序数量和时间均有意简化。GAA 是一个先进晶体管实例；EUV 的紫色光路是不可见辐射的可视化；发光脉冲表示线路活动，不表示电子漂移速度；局部热区是归一化视觉效果，未执行热传导仿真。通用 chiplet 封装不对应某一款商业芯片。“唤醒”指电路开始运作。

原始项目代码采用 [MIT License](LICENSE)。第三方库和字体保留各自许可；**GSAP 使用自己的 Standard “No Charge” License，不属于本项目 MIT 授权的范围**。完整清单见 [ATTRIBUTION.md](ATTRIBUTION.md)，参考资料见 [docs/SOURCES.md](docs/SOURCES.md)。

## English quick start

SILICON is a scroll-controlled semiconductor exhibition built from real-time geometry, procedural materials, optical paths and signal routes. The ZIP includes the complete source and a current production build. It is not deployed to a hosted service.

Use **Node.js 22.12+**, with Node 24 recommended. Open a terminal in the extracted project folder:

```sh
node scripts/serve.mjs
```

Visit **http://127.0.0.1:4173/**. The included build works without installing project dependencies or contacting a CDN. Use HTTP; opening index.html directly with file:// is not supported. Stop the server with Ctrl+C. Set the PORT environment variable to change the port.

For source development:

```sh
npm ci
npm run dev
```

To regenerate and review the production build:

```sh
npm run build
npm run preview
```

Scroll in either direction, use the chapter navigation, and inspect the scene controls. Reduced-motion preferences are supported. Final validation scope and any limitations are recorded in [docs/VERIFICATION.md](docs/VERIFICATION.md).

The process models are intentionally schematic: the GAA structure is one device example, violet represents invisible EUV radiation, light packets represent circuit activity, and thermal colour is a normalized visual illustration. Dimensions and timings are not a manufacturing specification. Original code is MIT; dependency and font licenses remain separate, including GSAP's Standard License. See [ATTRIBUTION.md](ATTRIBUTION.md) and [docs/SOURCES.md](docs/SOURCES.md).
