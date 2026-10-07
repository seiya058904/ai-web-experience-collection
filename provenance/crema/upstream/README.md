# CREMA — 9 Bars

**Build the pressure. Find the path. Pull the shot.**

一场围绕压力、孔隙与萃取展开的本地交互作品。冷钢之下，一份水穿过干燥颗粒、逐渐湿润的咖啡床与复杂流路，最终汇成一滴 espresso，留下短暂的 crema。

## 1.1 · 材料与连续性精修

这一版进一步打磨实时微观段及其与液体实景尺度的交接：湿润颗粒保留粗糙的断裂表面，水在不规则孔隙中以薄膜与局部流束显现；镜头沿已有路径深入，汇流对准返回滤篮的液滴附着点。细流下方先形成一片液面与细小泡胞，再进入完整 crema 微距表面。

目录、声音、减少动态效果、十一章顺序和本地启动方式保持一致。具体改动与实现边界见 [docs/REFINEMENT.md](docs/REFINEMENT.md)，验收记录见 [docs/QA.md](docs/QA.md)。

## 最快打开方式 · Windows

1. **把整个 ZIP 解压到一个文件夹。** 不要在压缩包窗口里直接运行文件。
2. 电脑需要 **Node.js 22.12 或更新版本，推荐 Node.js 24**。如果已经安装，可在终端执行 `node --version` 确认。
3. 双击 **`START_CREMA.bat`**。
4. 启动器会打开默认浏览器，地址通常为 **http://127.0.0.1:4173/**。

保留启动后出现的终端窗口。体验结束后，在该窗口按 **Ctrl+C** 停止本地预览。

**ZIP 已包含一份完成构建的 `dist/`。正常观看不需要 `npm install`、不需要登录，也不需要联网下载素材。** 本地预览只使用 Node.js 内置模块，并且只监听本机 `127.0.0.1`。作品没有云端服务、账号、进度保存或线上发布步骤。

## macOS 与手动启动

macOS 可运行 `START_CREMA.command`。如果系统未保留可执行权限，在解压后的项目文件夹中执行：

```bash
chmod +x START_CREMA.command
./START_CREMA.command
```

也可以在 Windows、macOS 或 Linux 的项目文件夹中手动执行：

```bash
node scripts/preview.mjs
```

然后打开终端显示的本机地址。直接运行该命令只会启动服务器，不会自动打开浏览器。

## 如何体验

- 用滚轮、触控板或手机滑动推进故事；向上滚动可以恢复此前的场景状态。
- 通过页面目录跳转章节；键盘也可以操作导航和按钮。
- 声音需要主动开启。声音由浏览器实时合成，初始保持关闭。
- 系统的“减少动态效果 / Reduce Motion”偏好会冻结环境运动、保留滚动控制的材质变化；Index 内的开关可以覆盖系统偏好。
- 推荐使用启用图形加速的现代桌面浏览器；手机布局保留干燥、湿润、压力与液体的完整过程。

这是一件英文排版的数字作品。说明文字保持简短，让材料、空间与运动承担叙事。

## 文件结构

| 路径 | 用途 |
|---|---|
| `dist/` | 已构建的本地成品；观看时直接使用 |
| `src/` | 交互、运动、视觉系统与页面样式源码 |
| `public/` | 构建所用的本地素材 |
| `production/concepts/`、`production/originals/` | 接受的视觉方案与完整 AI 生产母版 |
| `production/models/`、`production/textures/` | 可复用 GLB 模型与精确程序化纹理快照 |
| `production/manifest.json` | 完整提示词、生成链、图像尺寸与 SHA-256 |
| `DESIGN.md`、`PRODUCT.md` | 构图、阶段设计与创作约束 |
| `scripts/preview.mjs` | 仅使用 Node.js 内置模块的本机静态服务器 |
| `START_CREMA.bat` | Windows 一键启动入口 |
| `START_CREMA.command` | macOS 启动入口 |
| `docs/SCIENCE.md` | 科学依据与视觉解释的边界 |
| `docs/QA.md` | 本地浏览器验收范围、结果与设备限制 |
| `docs/REFINEMENT.md` | 1.1 材料、镜头与液体连续性精修说明 |
| `docs/PROVENANCE.md` | AI production assets、提示词与素材处理记录 |
| `ATTRIBUTION.md` | 素材、字体与第三方组件归属 |
| `LICENSE`、`licenses/` | 原创源码与第三方许可说明 |

## 修改源码与重新构建

开发需要 Node.js 22.12 或更新版本。推荐使用 Node.js 24。第一次安装开发依赖可能需要访问 npm；这只用于开发，与直接观看已构建成品分开。

```bash
npm ci
npm run dev
```

开发服务器使用本机地址，终端会给出实际端口。

生成新的生产构建：

```bash
npm run build
npm run preview
```

`npm run build` 更新 `dist/`。预览仍使用 `scripts/preview.mjs`，默认地址为 http://127.0.0.1:4173/ 。本项目没有部署脚本。

| 组件 | 锁定版本 | 用途 |
|---|---:|---|
| Vite | 8.3.3 | 本地开发与生产构建 |
| Three.js | 0.186.1 | 实时视觉 |
| GSAP | 3.15.0 | 场景与滚动动画编排 |
| Lenis | 1.3.26 | 唯一平滑滚动控制器 |
| Archivo Variable | 5.3.0 | 本地字体资源包 |

## 实时系统与素材复用

`src/main.js` 统一计算 0–10.35 的连续场景位置。Lenis 控制平滑滚动，GSAP 的同一个 ticker 推动滚动与渲染；ScrollTrigger 读取滚动状态。没有第二个平滑控制器。

`PorousWorld.js` 负责多尺寸颗粒、压实、湿润前沿、压力场、分叉与汇合流路，以及沿流路的萃取颜色。`LiquidWorld.js` 负责液滴张力、颈缩、两次释放、细流与 crema 表面。结构状态直接由滚动位置决定，环境微动使用时间。减少动态效果后，静止场景不重复消耗 GPU 绘制同一帧。

模型是同一程序化几何的可复用快照，网站运行时仍由源码生成它们。安装依赖后，可以重新导出两份 GLB 与两张原始程序化 PNG：

```bash
node scripts/export-models.mjs
```

每次导出会更新模型、纹理及其 SHA-256 清单。具体材质用法、glTF 扩展和快照限制见各目录内的 README。

## 常见问题

**双击后提示找不到 Node.js**  
安装 Node.js 24 后重新打开启动器。安装 Node.js 是运行环境准备；作品素材与成品均已在 ZIP 内。

**提示端口 4173 被占用**  
先关闭之前启动的预览终端。也可以换一个本机端口：

```bash
node scripts/preview.mjs --port 4174
```

然后打开 http://127.0.0.1:4174/ 。服务器不会自动占用其他端口，也不会访问已有端口上的其他服务。

**浏览器没有自动打开**  
复制终端里的 `http://127.0.0.1:.../` 地址到浏览器即可。终端出现 `CREMA is ready at ...` 后，服务器已经就绪。

**直接双击 `dist/index.html` 后素材或脚本没有加载**  
请使用启动器或 `node scripts/preview.mjs`。浏览器对 `file://` 页面中的模块和资源有不同限制，本作品使用本机 HTTP 地址加载完整构建。

**修改源码后仍看到旧画面**  
运行 `npm run build`，再刷新预览页。`npm run preview` 服务的是 `dist/`，开发时使用 `npm run dev`。

**希望完全离线观看**  
在已安装合适 Node.js 的电脑上，完整解压 ZIP 后直接运行启动器。观看成品不执行依赖安装。

## 科学与素材

“9 Bars”采用经典 espresso 压力作为设计锚点；实际预浸泡与压力曲线存在多种选择。咖啡床、流线、颗粒和泡胞是基于研究创作的视觉解释，不能用作配方计算、压力测量或流体仿真结果。Crema 被表现为复杂气液体系，而非一层纯咖啡油。详细资料见 [docs/SCIENCE.md](docs/SCIENCE.md)。

项目所用影像为本次作品生成的 production assets，实时颗粒、流动、液滴等系统由代码创作；来源记录见 [docs/PROVENANCE.md](docs/PROVENANCE.md)。第三方软件与字体保持各自许可，见 [ATTRIBUTION.md](ATTRIBUTION.md)。
