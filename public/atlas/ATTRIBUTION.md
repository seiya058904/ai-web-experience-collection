# ATLAS — Attribution

数据快照获取日期：**2026-10-06**。获取日期不是摄影日期。ATLAS 是独立创作的地理视觉作品，不代表数据提供机构制作或背书。

## Geographic data

### Geospatial Information Authority of Japan

**出典：国土地理院ウェブサイト・地理院タイル・国土地理院ベクトルタイル提供実験。ATLAS が切出し・再標本化・変換・可視化して作成。**

**Source: Geospatial Information Authority of Japan (GSI), GSI Tiles, and GSI Maps Vector Experiment. Cropped, resampled, decoded, simplified, and rendered for ATLAS. PDL1.0.**

- [GSI tile catalogue](https://maps.gsi.go.jp/development/ichiran.html)
- [GSI Maps Vector Experiment](https://github.com/gsi-cyberjapan/gsimaps-vector-experiment)
- [GSI content terms](https://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html)
- [Public Data License 1.0](https://www.digital.go.jp/resources/open_data/public_data_license_v1.0)

GSI 当前内容条款对未另行注明的适用内容采用 PDL1.0，要求保留来源及加工说明。这里使用的区域／城市 DEM、相应影像和实验矢量数据按照其各自图层说明记录来源。保留了相关条款文本，不使用 GSI 标志。[官方内容条款](https://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html)

| 使用内容 | 来源图层 | ATLAS 处理 |
| --- | --- | --- |
| 区域和城市地形 | GSI `dem_png` / DEM10B，z12 与 z14 | 按真实瓦片像素裁剪；解码；双线性重采样；生成 Float32 高程 |
| 区域等高线 | 与实际渲染地形对应的 GSI 高程网格 | 桌面 513／手机 257 节点分别与 100 m 高度平面求交；按真实三角网格连接，保留每个三角形转折；500 m 主等高线 |
| 区域卫星影像 | GSI `seamlessphoto` z13，Landsat 8 mosaic | 无损源裁剪；Lanczos 缩放；WebP 编码；贴合真实地形 |
| 城市航空影像 | GSI `seamlessphoto` z16，aerial orthophotography | 同上；作为独立航拍细节层，未虚构高分辨率细节 |
| 建筑、道路、水体 | GSI `experimental_bvmap`，区域 z12／城市 z16 | MVT 解码、按范围裁剪、瓦片缓冲区去重、保留来源、LOD 选择与路径构建 |

建筑轮廓来自真实平面数据，展示高度统一为 **8 m 示意值**。路线来自真实道路中心线；路线选择、光点运动、立面及昼夜光照为 ATLAS 的艺术处理。

### Landsat mosaic: additional source credit

区域 z13 卫星图层同时保留 GSI 官方目录要求的署名：

> データソース：Landsat8画像（GSI,TSIC,GEO Grid/AIST）, Landsat8画像（courtesy of the U.S. Geological Survey）, 海底地形（GEBCO）

**Landsat8 imagery (GSI, TSIC, GEO Grid/AIST); Landsat8 imagery courtesy of the U.S. Geological Survey; bathymetry (GEBCO).**

这一署名按产品来源保留；富士山局部裁剪不因此声称包含海底测深。GSI 目录记载的 GRUS / Axelspace 特殊区域不与本次富士地区裁剪相交，本项目没有使用该区域图像。[图层与来源说明](https://maps.gsi.go.jp/development/ichiran.html)

### Natural Earth

**Made with Natural Earth.**

全球陆地采用 Natural Earth **1:50,000,000 land（50m 系列）** 数据，经适度简化保留真实多边形与孔洞，用于陆地遮罩及海岸线；这里的 50m 是五千万分之一系列，不是 50 米空间分辨率。原文件随附于 `data-source/vectors/natural-earth/`。Natural Earth 将其地图数据置于公共领域。[Terms of Use](https://www.naturalearthdata.com/about/terms-of-use/)

- [Natural Earth project](https://www.naturalearthdata.com/)
- [Source GeoJSON](https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_land.geojson)
- [Source repository](https://github.com/nvkelso/natural-earth-vector)

## Software & fonts

版本与安装锁定见 `package.json` 和 `package-lock.json`。以下许可证从实际安装包原样复制；文本路径见 `licenses/`。

| 项目 | 版本 | 许可 | 本地许可证 |
| --- | --- | --- | --- |
| Three.js | 0.186.1 | MIT | `Three-MIT.txt` |
| Earcut，随 Three.js ShapeUtils 提供 | 3.0.2 | ISC | `Earcut-ISC.txt` |
| Vite | 8.3.3 | MIT；包含附带第三方通知 | `Vite-MIT-and-third-party.txt` |
| TypeScript | 5.9.3 | Apache-2.0；附带第三方通知 | `TypeScript-Apache-2.0.txt`、`TypeScript-THIRD-PARTY.txt` |
| Three.js 类型声明 | 0.183.1 | MIT | `Types-Three-MIT.txt` |
| Manrope Variable / Fontsource package | 5.2.8 | SIL Open Font License 1.1 | `Manrope-OFL-1.1.txt` |
| IBM Plex Mono / Fontsource package | 5.2.7 | SIL Open Font License 1.1 | `IBM-Plex-Mono-OFL-1.1.txt` |
| Cormorant Garamond / Fontsource package | 5.3.0 | SIL Open Font License 1.1 | `Cormorant-Garamond-OFL-1.1.txt` |

字体版本列为本项目使用的 Fontsource npm 包版本，字体作者及保留字体名称以对应 OFL 原文为准。字体在本地构建中打包，不调用外部字体 API。

可选 Python 数据工具依赖见 `scripts/data/requirements.txt`、`scripts/data/vectors/requirements.txt`；它们不进入浏览器运行代码。重建环境版本记录在 `data-source/gsi/snapshot-build-environment.json`。

## Authored elements

网页结构、排版、相机运动、图层过渡、地形／地球 shaders、坐标图形、路线高亮和示意光照由 ATLAS 实现。原创代码采用根目录 MIT License；第三方数据和字体保持其原许可。

运行资源中没有 AI 生成的地理事实或摄影像素。内部设计概念仅用于构图参考，不包含在运行资产或最终网站素材中。

Collection integration retains the root lockfile: Three.js 0.186.1, GSAP 3.15.0 and Lenis 1.3.26 where used; Vite 8.3.2 and Three.js types 0.186.0. Original version records above describe the supplied package. The generated Collection production dependency inventory records actual bundled software. Scoped source and design records remain in repository docs/provenance.
