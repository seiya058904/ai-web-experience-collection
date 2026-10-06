> Preserved upstream delivery record. Its original paths, commands, versions and validation claims describe the standalone ZIP; see `ACCEPTANCE.md` for Collection verification.

# ATLAS — The World in Layers

**One place. Every scale. The world in layers.**

一个用滚动控制观察尺度的地理作品。起点固定在日本富士吉田 **35.4875° N / 138.8079° E**：坐标展开成网格，等高线获得高度，真实影像贴合山体，城市轮廓升起，路线穿过街区，最后回到地球上的同一个点。

本项目包含完整源码、固定地理数据快照、预处理输入与脚本、字体依赖、许可证及来源记录。通过本地 HTTP 服务运行。

## Quick start

需要 **Node.js 22.12.0 或更新版本**、随 Node 安装的 npm，以及支持 WebGL 2 的现代浏览器。普通运行与构建不需要 Python。

解压后进入含有 `package.json` 的 `atlas` 目录：

```sh
npm ci
npm run dev
```

打开 **http://localhost:4173**。开发服务支持修改源码后自动更新。

首次 `npm ci` 需要从 npm 下载 `package-lock.json` 锁定的依赖。地理数据已经随项目提供；启动、构建和体验时不会请求在线地图瓦片，不需要 API key、token 或地图账号。字体由本地依赖打包。

### Production preview

先用 `Ctrl+C` 结束开发服务，再执行：

```sh
npm run build
npm run preview
```

同样打开 **http://localhost:4173**。`build` 先进行 TypeScript 检查，再将网站生成到 `dist/`；`preview` 只预览这份构建产物。开发服务与预览服务使用同一个端口，不能同时占用。

不要直接双击 `index.html`：ES modules、二进制高程和 JSON 数据需要通过 HTTP 读取。

### Windows

在解压目录打开 PowerShell 或 Windows Terminal，进入 `atlas` 后执行上述命令。也可以在文件资源管理器地址栏输入 `powershell` 打开当前目录终端。

如果 PowerShell 的脚本策略阻止了 `npm.ps1`，可以直接使用命令包装器，无须修改系统策略：

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd run preview
```

端口占用时，结束占用 4173 的旧开发／预览进程，或显式换端口，例如 `npm run dev -- --port 4174`，然后打开终端显示的地址。

## Experience

使用滚轮、触控板、触摸滚动或浏览器原生键盘滚动控制尺度。画面可以停在任意位置，也可以直接反向滚动。目录用于跳到指定尺度，结尾可以返回开场坐标。

桌面与手机使用不同的镜头构图、地形精度、建筑子集和标签密度。系统启用减少动态效果时，作品保留地理层次与直接滚动姿态，减少环境动画。

作品的重点是同一地点如何被表达。它没有导航服务、实时地图搜索或实时卫星数据。

## Included data

数据获取日期为 **2026-10-06**；这不是所有照片的拍摄日期。具体 URL、瓦片哈希、裁剪边界和处理记录保存在 [`PROVENANCE.json`](PROVENANCE.json) 及 `data-source/` 下的来源清单。

| 图层 | 实际来源与内容 | 随附运行资源 |
| --- | --- | --- |
| 区域地形 | GSI DEM10B，`dem_png` z12；富士山与富士五湖区域 | 1025、513、257、129 节点高程网格；实际渲染为桌面 513／手机 257；各自匹配的 100 m 等高线 |
| 城市地形 | GSI DEM10B，`dem_png` z14；富士吉田局部 | 257、129 节点高程网格 |
| 区域影像 | GSI `seamlessphoto` z13，全国 Landsat 8 拼接影像 | 2048 与 1024 纹理 |
| 城市影像 | GSI `seamlessphoto` z16，航空正射摄影拼接影像 | 2048 与 1024 纹理 |
| 道路、水体、建筑 | GSI 地理院地図Vector提供実験，区域 z12、城市 z16 | GeoJSON；桌面／手机建筑子集；路线与逐段来源 |
| 全球陆地 | Natural Earth 1:50,000,000（50m 系列）陆地多边形 | GeoJSON；运行时生成的陆地遮罩和海岸线 |

区域范围为 **138.54–138.99° E / 35.24–35.61° N**，约 40.8 × 41.2 km；城市细节范围为 **138.791–138.827° E / 35.474–35.505° N**，约 3.26 × 3.45 km。精确尺寸与边界见 `public/data/terrain.json` 和 `public/data/city-raster.json`。

### Geographic truth

- **高程来自真实 DEM。** 1025 节点网格中的最高采样值约为 **3764.57 m**，受原始瓦片分辨率及重采样影响。画面中的富士山 **3776 m** 是另行标识的官方参考高度，不能与网格最大值混为一谈。GSI RGB 的 0.01 m 编码增量也不代表厘米级测量精度。[GSI 高程说明](https://maps.gsi.go.jp/development/hyokochi.html) · [富士山参考高度](https://web1.gsi.go.jp/WNEW/PRESS-RELEASE/keikaku61003.html)
- **等高线对应当前地形精度。** 桌面和手机分别使用从 513／257 节点三角网格精确求交的等高线。线条保持标注高程，保留跨三角形的全部转折；没有把高精度线条直接悬放到低精度网格上。相关计算、源网格哈希及数值检查随数据提供。
- **卫星与航拍分开标识。** 区域层是 Landsat 8 拼接影像，城市层是航空正射摄影；均保留真实源像素，属于多日期拼接产品。[GSI 图层目录](https://maps.gsi.go.jp/development/ichiran.html)
- **建筑平面是真的，高度是示意值。** 每个展示建筑的平面位置和轮廓来自 GSI；统一采用 **8 m** 的展览式体量，不宣称实测层数、屋顶高程或建筑立面。LOD 子集不是完整建筑普查。街道阶段使用空间模型，没有伪造街景摄影。
- **路线沿真实道路中心线。** 作者选择经过的路网节点，算法在现有中心线上连接，长度约 **3.255 km**。为了保持道路真实性，中间路网节点位于开场坐标附近，约相距 27.6 m；没有移动坐标点或添加跨越建筑的直线捷径。逐段追溯见 `data-source/vectors/route-lineage.json`。这是展览路径，不是步行通行情况或导航建议。
- **水系遵循真实地图。** 等高线与河流之间是视觉关注的转移。作品不将富士山顶到城市之间画成虚构的连续地表河流；该区域包含山麓地下水、涌泉及桂川水系。[富士吉田官方地理资料](https://www.city.fujiyoshida.yamanashi.jp/uploaded/attachment/5294.pdf)
- **时间段是光照研究。** 日照方向、阴影、窗口亮光与路线光点是设计的动态表现，不是实时太阳位置、历史影像序列或实测夜间灯光。
- **全球层使用真实大陆轮廓。** 地球半径采用 6371 km 的球形表示，属于地图展示模型。没有生成虚构全球高程、云层或灯光数据。

运行画面中没有 AI 生成的地形、卫星像素、航拍像素或城市平面。设计阶段的概念图不属于地理来源，也不包含在网站运行资源内。

## Architecture

技术栈为 **TypeScript + Vite + Three.js**。原生文档滚动驱动绝对场景状态，单一 `requestAnimationFrame` 循环负责镜头与所有图层；主要体验没有嵌套滚动容器、Lenis 或独立动画 ticker。页面在等待地理资源前恢复上次刷新／历史返回时的滚动位置，资源就绪后直接计算当前位置；隐藏页面时暂停 RAF，返回时恢复同一循环。

| 位置 | 作用 |
| --- | --- |
| `src/` | 页面入口、界面、共享滚动生命周期与样式 |
| `src/story.ts` | 绝对进度、阶段状态、相机关键姿态与手机构图 |
| `src/geo.ts` | 坐标投影、瓦片 UV、二进制高程读取与高度采样 |
| `src/world/` | 网格／等高线、地形与影像 shader、城市、路线、地球图层 |
| `public/data/` | 网站直接读取的高程、影像、等高线和矢量数据 |
| `data-source/gsi/` | 四份无损源裁剪、原瓦片 URL／哈希及重建环境记录 |
| `data-source/vectors/` | 原始 GSI PBF、Natural Earth 原文件、路线来源与处理说明 |
| `scripts/data/` | 可选的数据获取与预处理工具 |
| `scripts/verify-data.mjs` | 无外部依赖的数据哈希、二进制网格、矢量、路径追溯及等高线贴合检查 |
| `licenses/` | 原样复制的软件／字体许可证及官方数据条款文本 |

地区栅格按 **EPSG:3857 / Web Mercator** 对齐；地理坐标使用经度、纬度顺序。纹理 `u` 从西向东，`v` 从北向南。高程文件是无头部、北到南逐行排列的 **Float32 little-endian 米值**。Three.js 世界单位为千米，X 向东、Y 向上、Z 向南；平面距离使用当地纬度修正，最终球面与固定锚点共用坐标基准。

**几何共用同一地面。** 区域地形实际使用桌面 513 × 513／手机 257 × 257 节点，并加载各自从同一三角网格求交得到的等高线。城市细节地面、建筑基底、道路、路线和镜头观察点共同使用注册后的城市高程；道路与路线中心线在穿越网格边及对角线处插入顶点，避免长线段穿入坡面。地形接边混合和防深度闪烁的显示偏移属于渲染处理，不改写原始 DEM。低位路线镜头沿真实中心线前进，之后以同一场景的光照与色温表达日间、金色时刻和夜色。

**资源随尺度进入使用。** 起始阶段读取基础地理数据与路线的 CPU 数据；区域影像、城市精细地面与航拍、城市几何、地球在后续门槛分别预加载。归一化进度超过 `0.977` 且地球已就绪后，城市几何和精细影像／地形 GPU 资源被释放；反向回到相关尺度时重新预加载。已读取的 JSON 和 Float32 网格通过共享缓存复用，纹理与几何按需重建。所有这些资源都来自随附本地文件。

**移动端保留自己的数据配对。** 首次打开时选择区域 257 节点地形、匹配等高线、129 节点城市地面、1024 纹理和较小建筑子集。窗口变化会更新镜头、标签和画布，而当前页面保留最初选定的数据 LOD，避免在调整大小时更换等高线与地面的配对。桌面画布 DPR 最高 1.5，手机最高 1.6，并结合约 **3200 × 1900** 的像素目标预算；实现同时保留 0.6 的最小像素比。**4K 适配指视口构图与界面布局，不代表 WebGL 始终以原生 4K 像素渲染。**

**地球是一幅球面地图。** 同一份 Natural Earth 陆地多边形在运行时生成 4096 × 2048 的全球遮罩、真实海岸线和一个 2048 × 2048 的日本周边有符号距离场；后者改善中途拉远时的海岸抗锯齿，不增加网络请求或新地理来源。Natural Earth 的 **50m 表示 1:50,000,000 比例尺系列，不是 50 米分辨率**。纹理尺寸、插值与边缘清晰度均不提高源数据的测量精度。

更多视觉构造说明见 [`docs/SCENE-ARCHITECTURE.md`](docs/SCENE-ARCHITECTURE.md)。

## Rebuild data

**仅修改网页时不需要执行本节。** 所有预处理结果都已经放在 `public/data/` 中。

若要从随附输入重新生成地理运行资源，先准备 Python 3.10+ 并安装数据工具依赖：

```sh
python -m pip install -r scripts/data/requirements.txt -r scripts/data/vectors/requirements.txt
python scripts/data/build_rasters.py
python scripts/data/vectors/build.py
```

依赖安装完成后，这两条生成命令使用随附输入，不需要访问 GSI。原始栅格输入保留为由真实瓦片像素组成的最小无损裁剪；原始矢量输入保留为 PBF 与 Natural Earth GeoJSON。详见 [`data-source/gsi/README.md`](data-source/gsi/README.md) 与 [`data-source/vectors/README.md`](data-source/vectors/README.md)。

图像重新编码的字节级一致性取决于 Python 与底层编码库版本，参考 `data-source/gsi/snapshot-build-environment.json`。正常 `npm ci → build → preview` 使用固定的现成数据，不运行 Python，也不重新编码照片。

若明确需要获取上游的新快照，可另行运行获取脚本：

```sh
python scripts/data/acquire_gsi.py
python scripts/data/vectors/fetch.py --refresh
```

这会主动联网获取数据。上游更新可能改变地理内容与哈希；随后需重新运行生成脚本，并更新来源记录。复现本次作品应直接使用随附的固定输入。

## Verification

可运行的本地检查：

```sh
npm run typecheck
npm run verify:data
npm run build
```

### Release validation · 2026-10-06

交付归档已解压到独立的新目录，并实际完成 **`npm ci → npm run verify:data → npm run build → npm run preview`**。验收环境为 Linux、Node.js 24.19.0、npm 11.9.0、Chromium 153，浏览器使用 SwiftShader 软件 WebGL。生产预览逐一经过全部 11 个尺度，读取的运行资源全部来自本地服务，未发现失败请求、应用错误或 shader 编译错误；生产版本不包含开发诊断全局变量。

| 验收项目 | 实际检查结果 |
| --- | --- |
| 数据完整性 | 147 项来源／资源哈希及 23 项运行资源清单检查通过；6 份高程网格均为有限值；桌面与手机等高线的 737,743 次三角网格采样检查通过 |
| 地理几何 | 8 份 GeoJSON、真实道路路线的 142 段来源追溯检查通过；道路、水系和路线的 661,670 次地面间隙采样未发现穿入地面的点 |
| 桌面布局 | 检查 1920 × 1080、2560 × 1440、3840 × 2160 视口，以及全部主要场景的静止构图；4K 视口的实际渲染缓冲为 3200 × 1800 |
| 手机布局 | 检查 390 × 844 视口、DPR 2、较低 LOD 和全部主要场景；实际渲染缓冲为 624 × 1350，目录、路线与完整地球构图可见 |
| 连续滚动 | 检查 1 px 微输入、极慢滚动、普通滚轮、高频大幅滚动、快速下滚后立即反向，以及多个尺度交界处的反复往返 |
| 状态恢复 | 检查页面加载后立即滚动、中段刷新、离开页面再返回、桌面与竖屏之间调整窗口，以及任意位置停止滚动 |
| 资源生命周期 | 检查地球阶段释放高成本城市资源，再快速反向返回时恢复建筑、精细地面、纹理与路线 |
| 控件与触摸 | 检查原生触摸滑动、目录定位、键盘焦点、Escape 关闭、来源窗口、返回坐标，以及减少动态效果开关与系统偏好 |
| 归档清理 | ZIP 包含源码、数据、预处理输入、配置和文档；没有 `node_modules`、`dist`、测试截图、浏览器 trace 或缓存；归档 CRC 检查通过 |

上述记录来自浏览器实际输入驱动、数值检查和逐帧截图审阅。手机项目使用浏览器触摸与视口模拟；没有用实体手机、Safari 或 Firefox 进行设备验收，也没有将软件 WebGL 的表现作为实体 GPU 帧率保证。数值贴合误差只描述本项目网格与线条的计算一致性，不代表原始地理数据具有同等测量精度。

## Credits & licenses

原创网站代码采用 [`MIT License`](LICENSE)。GSI 数据、Natural Earth 数据、Three.js、构建工具和字体分别遵循各自许可；代码许可证不会覆盖第三方地理数据与字体。

完整署名见 [`ATTRIBUTION.md`](ATTRIBUTION.md)，逐项来源及文件哈希见 [`PROVENANCE.json`](PROVENANCE.json)，许可证原文与快照见 [`licenses/README.md`](licenses/README.md)。
