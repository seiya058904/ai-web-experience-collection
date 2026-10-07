# Attribution and distribution

公开分发复核日期：2026-10-06。自有部分保留版权，详见 [LICENSE](LICENSE)；本项目没有为整个仓库授予 MIT 或其他宽松开源许可。下列第三方材料继续适用各自许可证。

## Beyond the Limit — 随仓库分发的素材

| 材料 / 位置 | 来源 | 权利与使用说明 |
| --- | --- | --- |
| 五张概念插画：`provenance/f1/source/`，响应式衍生图：`public/f1/media/` | OpenAI 内置 Image Gen，为本项目生成；提示词见 `provenance/f1/image-prompts.json` | AI 生成的无车队品牌插画，不是官方照片、精确工程图或真实赛事记录。依据 [OpenAI 内容条款](https://openai.com/policies/terms-of-use/#content)，用户与 OpenAI 之间的输出权利归用户，限于适用法律允许的范围；输出可能不唯一。项目不将这些图片另行声明为 MIT。 |
| 中文字体：`public/f1/fonts/noto-sans-sc.woff2` | [Noto Sans SC / Google Fonts](https://fonts.google.com/noto/specimen/Noto+Sans+SC)，Google Fonts 官方文字子集 | [SIL OFL 1.1](https://github.com/google/fonts/blob/main/ofl/notosanssc/OFL.txt)。保留版权、保留名称与完整许可文本；不得单独售卖字体。子集为 Google Fonts 提供的版本。 |
| 拉丁字体：通过 `@fontsource/barlow-condensed` 5.3.0 构建 | [Barlow](https://github.com/jpt/barlow)，The Barlow Project Authors | SIL OFL 1.1；完整文本见 `public/licenses.txt` 和 npm 包的 `LICENSE`。字体不适用项目作者的保留版权声明。 |
| 蒙扎、铃鹿、摩纳哥坐标：`experiences/f1/src/circuits.json` | [f1-circuits](https://github.com/bacinger/f1-circuits)，Tomislav Bacinger | [MIT](https://github.com/bacinger/f1-circuits/blob/master/LICENSE.md)，Copyright 2019–2025 Tomislav Bacinger。仅筛选三条赛道；展示时等比投影，蒙扎为构图旋转。版权与完整许可保留在 `public/licenses.txt`。 |
| `public/f1/favicon.svg`、界面图标与教学 SVG / Canvas | 本项目编写的几何图形和程序绘制 | 没有使用第三方图标包或官方 F1 标识；适用项目自有版权说明。 |

历史设计概念图包含生成的 F1 / 车队标识及不准确标签，属于本地设计过程材料。`provenance/f1/concepts/` 已明确排除出公开仓库和生产构建，不作为可重新分发的正式素材。`provenance/f1/provenance.json` 保留生成阶段的历史来源记录，其中的本地概念图目录不随仓库提供。

Beyond the Limit 没有生产视频或音频素材。运行时图片、字体和赛道数据均本地提供，无需外部素材 CDN。VERDANT 与 ORBITAL 的素材及声音说明见下方各作品记录。

## npm 与第三方代码

| 依赖 | 使用范围 | 许可证 |
| --- | --- | --- |
| Lenis 1.3.26 | 运行时滚动服务 | MIT，Copyright 2024 darkroom.engineering；完整文本见 `public/licenses.txt`。 |
| GSAP 3.15.0 / ScrollTrigger | 运行时动画与滚动时间轴 | [GSAP Standard No-Charge License](https://gsap.com/community/standard-license/)，Webflow。不是 MIT；须遵守其用途限制并保留专有声明。本项目用于普通教育网站，构建保留上游许可注释。 |
| Vite 8.3.2 | 构建 / 开发 | MIT。 |
| TypeScript 5.9.x | 类型检查 | Apache-2.0。 |
| Sharp 0.35.5 | 离线图片处理 | Apache-2.0；其平台原生依赖还包含 LGPL-3.0-or-later 等许可。原生库不进入浏览器构建。 |

`package-lock.json` 固定实际版本，完整依赖树还包含 MIT、Apache-2.0、MPL-2.0、LGPL-3.0-or-later、ISC、BSD-3-Clause 和 0BSD 材料。`node_modules/` 与构建工具二进制不随仓库提交；安装时保留各包附带的许可证。构建工具的许可证不替代项目代码或图片的许可证。

运行时字体、赛道与 Lenis 的完整许可文本在 [public/licenses.txt](public/licenses.txt)。GSAP 采用其官方条款并保留库内声明。不要移除这些文件或构建产物中的上游许可注释。

`vite.config.ts` 显式保留上游 legal comments，并生成 `dist/third-party-licenses.md` 构建依赖许可清单。公开发布构建时保留该清单；Sharp 等离线处理工具的二进制不属于浏览器产物。

## Beyond the Limit — 内容与设计参考

正文引用的 Formula 1、FIA 和技术制造商资料可在网站页脚查阅，内容核查基准为 2026-10-04。空气动力、能量条、轮胎性能和进站方案用于教学；它们不是车队遥测、实时赛事数据或最佳策略承诺。

视觉研究参考 [Apple AirPods Pro](https://www.apple.com/airpods-pro/)、[Lenis](https://lenis.darkroom.engineering/) 和 [Apart Collective / Charles Leclerc](https://apart-collective.com/works/charles-leclerc/) 的尺度、节奏与运动表达，没有将这些网站的代码或媒体纳入项目。GitHub 的实际素材复用为上述赛道数据；没有纳入 CodePen 实现或无法确认许可的复制代码。

Beyond the Limit 是 Collection 中独立、非官方的 F1 教育展示作品，不与 Formula 1、FIA、车队或赞助商存在隶属或认可关系。第三方名称、商标与所链接资料仍属于各自权利人。

## Collection additions (2026-10-05)

`provenance/deliveries/legacy-imports.json` records the SHA-256 identity of the two user-supplied complete projects and the deliberately selected import boundary. Original ZIP exports are preserved outside the Git checkout. Their unused cloud/server starter and compiled duplicates are not distributed in this repository.

- **VERDANT:** four original AI-generated botanical / architectural plates and their responsive WebP derivatives; Instrument Serif and DM Sans with their OFL notices. See [the supplied asset record](experiences/verdant/ASSET-SOURCES.md). Runtime resources are now under `public/verdant/`.
- **ORBITAL:** original illustrative spacecraft GLB, layered compatibility renders and cinematic plates supplied with the project. Earth / Moon / cloud textures credit NASA / Goddard (Reto Stöckli for the cloud composite). Sources are retained in `experiences/orbital/SOURCE.md` and the in-experience credits. Fonts retain their OFL notices. Runtime resources are under `public/orbital/`.
- **Collection:** reuses those same production image files, including the thirteen-world `public/collection-social.jpg` social preview; its geometric mark and navigation are authored code. No additional stock imagery or commercial brand assets were introduced.
- React, Radix UI, Lucide, Three.js and the used utility packages retain their own licenses. The imported shadcn stylesheet's MIT notice remains beside it. The production dependency inventory includes the actually bundled libraries; it does not grant rights to imagery or replace GSAP's terms.

ORBITAL synthesizes optional audio in code after the sound control is activated; no audio recording or video file was added. AI Web Experience Collection is independent of Formula 1, FIA, racing teams, NASA and SpaceX. See the production `credits.html` for visitor-facing attribution and license links.


## GLAZE — Color Fired Into Form

用户提供的完整成品。原创代码按 [MIT](public/glaze/LICENSE.txt) 许可保留；七组生成的器物图像是虚构陶瓷艺术表达，并非藏品或工坊摄影。[素材说明](provenance/glaze/ATTRIBUTION.md) 与 [逐图 SHA-256 来源记录](provenance/glaze/ASSET-PROVENANCE.json) 保留原始作者依据。运行资源迁移至 `public/glaze/`，图片字节未修改。Archivo 字体使用 [OFL](public/glaze/licenses/Archivo-OFL.txt)，GSAP 使用 [Standard No-Charge License](public/glaze/licenses/GSAP-Standard-License.txt)，Lenis 使用 MIT。

## KAGE / VOID

用户提供的完整程序化雕塑成品。原创代码与几何按 [MIT](public/kage/LICENSE) 保留；没有库存摄影、外部模型或影片。Three.js、Lenis 与 Barlow Condensed、DM Sans、Noto Sans JP 的完整许可见 [第三方声明](public/kage/licenses/THIRD-PARTY-NOTICES.md) 和 `public/kage/licenses/`。Collection 预览与社交图是该作品 FRAME 场景的真实渲染截图，不是重新创作的雕塑。原始离线 HTML 保留于 `provenance/kage/KAGE-VOID.html`，不参与部署。

## 本轮导入与归档

GLAZE、KAGE、CHRONOS 与 INTERVAL 交付 ZIP 的逐项字节和 SHA-256 保存在 [导入清单](provenance/deliveries/import-manifest.json)。独立包的旧配置、启动脚本和 README 已淘汰，保留原始逐项哈希与实际素材来源依据。旧 VERDANT/ORBITAL ZIP 移至本地忽略的 `provenance/deliveries/`，它们含有超出当前运行工程的历史内容，未经逐项证明为重复不删除。


## CHRONOS — The Architecture of Time

用户提供的完整原创数字腕表成品。原代码、程序几何与文档继续适用 [MIT](public/chronos/LICENSE)；两幅生成摄影艺术保持其原始说明，不声称是真实品牌产品或精确工程图。完整 [素材来源与机械参考](provenance/chronos/ATTRIBUTION.md)、[第三方声明](public/chronos/THIRD_PARTY_NOTICES.md) 与所有许可证已保留。Cormorant Garamond 与 DM Sans 从交付构建中的同版本 WOFF2 无损导入本地；其中与 VERDANT 字节完全相同的两个 DM Sans 文件安全合并到 `public/shared/fonts/`，两站许可均保留；IBM Plex Mono 使用 Collection 已锁定的相同 5.3.0 软件包。运行库仍为同版本 Three.js、GSAP、Lenis，无依赖升级。

六章的 3D 机芯、机械关系、慢动作与本地合成声音均沿用成品实现；模型是解释性运动研究，不是可制造机芯或精度模拟。原交付的逐项文件 SHA-256 追加在 `provenance/deliveries/import-manifest.json`。

## INTERVAL — Architecture Between Light & Space

用户提供的完整独立建筑旅程。原创代码和文字继续适用 [MIT](public/interval/LICENSE)，原始 [素材与研究说明](provenance/interval/ATTRIBUTION.md)、[逐图来源](provenance/interval/ASSET-PROVENANCE.json)、[字体来源](provenance/interval/font-provenance.json) 和 [第三方通知](public/interval/THIRD-PARTY-NOTICES.md) 均保留。六组建筑图像描绘虚构海边建筑，未使用研究官网摄影。12 张 WebP 与四份 Bodoni Moda/Manrope WOFF2 均按交付原字节导入，字体使用 OFL。GSAP 3.15.0 与 Lenis 1.3.26 复用 Collection 已锁定版本；原交付 Vite 7 独立构建由现有共享 Vite 8 多页面流程取代，无依赖升级。

原始 ZIP 保留在仓库外 `D:/下载/INTERVAL-Architecture-Experience.zip`，不提交或部署。逐项文件大小与 SHA-256 保存在导入清单；元数据 sidecar、字体下载记录和设计依据归入 `provenance/interval/`，不随网站部署。

## FORM and FUSION — 2026-10-06

The supplied [FORM](public/form/ATTRIBUTION.md) and [FUSION](public/fusion/ATTRIBUTION.md) projects retain their MIT licenses, design/scientific references, GSAP terms, and local font/library notices. Their original ZIP entry hashes are preserved in the import manifest. Runtime code and fonts are integrated without standalone `dist/` builds or nested package lockfiles; both use the Collection's root dependency lockfile. FORM's measurements remain conceptual. FUSION's field, temperature, stability and output values remain illustrative, not experimental data or a plasma simulation. Collection previews are captured from the supplied runtimes and tracked in each work's provenance.

## GLASSHOUSE and VEIL — 2026-10-06

The supplied GLASSHOUSE and VEIL works retain their original MIT code licenses, material-image provenance, local font OFL texts and third-party notices. GLASSHOUSE's one generated light-projection texture and VEIL's three generated silk studies are imported byte-for-byte. VEIL's four WOFF2 font files are recovered unchanged from its supplied production build, replacing Fontsource imports without adding dependencies. Both experiences use the root's already locked GSAP 3.15.0, Lenis 1.3.26 and Three.js 0.186.1. Source ZIP size, time and per-entry SHA-256 records are appended to the import manifest; the two original ZIPs remain outside the repository at `D:/下载/`.

See [GLASSHOUSE's preserved attribution](public/glasshouse/ATTRIBUTION.md), [Manrope OFL](public/glasshouse/licenses/MANROPE-OFL.txt), [VEIL's preserved attribution](public/veil/ATTRIBUTION.md), [Cormorant Garamond OFL](public/veil/licenses/CORMORANT-GARAMOND-OFL.txt) and [VEIL Manrope OFL](public/veil/licenses/MANROPE-OFL.txt). Upstream build/type-library notices are preserved as historical source evidence; the actual production dependency inventory remains generated by the Collection build. The optical and textile scenes remain artistic approximations. The GLASSHOUSE preview is captured from its actual final chapter; VEIL uses its supplied cloth study. No research-site imagery or new third-party art is redistributed.

## OPTIC and INKSCAPE — 2026-10-06

The two user-supplied works retain their original MIT code licenses and independent design contracts. [OPTIC notices](public/optic/THIRD_PARTY_NOTICES.md), [INKSCAPE attribution](public/inkscape/ATTRIBUTION.md), all included library/font notices and source-generation records are preserved. Seven generated WebP files and seven WOFF2 files are imported with their original binary hashes. The OPTIC fonts are recovered unchanged from its supplied build, with no new Fontsource dependency. Runtime libraries use the existing Three.js 0.186.1, GSAP 3.15.0 and Lenis 1.3.26; the Collection keeps Vite 8.3.2. Supplied Vite 8.3.3 notices document the original packages, while the generated production inventory records actual deployed dependencies.

OPTIC's optical model, slowed shutter, Bayer crops and exaggerated stabilization remain explanatory; its coastal artwork is generated, not a real camera capture. INKSCAPE expresses materials artistically, not a verified paper/ink or fluid experiment. Neither work redistributes research-site photography. Gallery previews are actual runtime captures. The source ZIP byte length, timestamp and every entry hash remain in the import manifest; originals are retained at `D:/下载/` outside Git/deployment. Standalone startup/build tools, manifests, lockfiles and compiled duplicates are omitted. See scoped provenance for adaptations and asset checks.

## FACET, SILICON, ATLAS and THRUST — 2026-10-06

Four supplied independent works retain their MIT code licenses, authored design contracts, full software/font notices and honest model caveats. All existing dependency versions and the root lockfile are unchanged. FACET fonts and still artwork, SILICON/THRUST fonts recovered from supplied build assets, THRUST images and all 23 ATLAS geographic runtime files are copied without binary changes. ATLAS shares the exact supplied Manrope/IBM Plex font bytes recovered from SILICON and the existing OPTIC Cormorant italic file, with their OFL notices retained.

ATLAS uses GSI terrain, imagery and vector snapshots and Natural Earth land geometry. GSI source and processing statements, Landsat/USGS and related source credits, PDL1.0 and Natural Earth terms remain in the work's public attribution, interface and licenses. Buildings are uniformly schematic heights; authored lighting and route motion do not describe current conditions. Source lineage/acquisition records are preserved under scoped provenance. The original ZIP retains the raw raster/tile files and offline acquisition tools outside deployment. The supplied numeric/hash verification was run against that intact extracted snapshot; it is not a certification of survey accuracy.

Original ZIPs remain outside the repository at `D:/下载/`. The delivery manifest records byte lengths, modification times and every original entry hash. Supplied Vite/type/font-package version notices document their original builds; generated production licenses identify the actual Collection dependencies. Standalone build/server/startup tooling, nested manifests/lockfiles and compiled duplicates are omitted; unchanged font recovery is the documented exception. Gallery media uses actual runtime captures, not new generated concepts.

## RESONANCE — 2026-10-07

User-supplied original procedural acoustics, interface geometry and local synthesized sound. No third-party image, recording, microphone input or runtime network service is included. Manrope and Cormorant Garamond font binaries are imported unchanged with their supplied OFL copyright/license texts, checked against the linked Google Fonts upstream notices. The delivery has no application-wide LICENSE file; no MIT grant is inferred or invented. [Asset and reference record](public/resonance/ATTRIBUTION.md) and [original provenance](provenance/resonance/ASSET_PROVENANCE.md) preserve those boundaries.

The upstream `dist/` is the only editable native ES-module source, explicitly documented in its README and architecture. These files are relocated into the Collection source/page/public boundary; no compiled duplicate or nested build, manifest, lockfile or startup tool is imported. The original ZIP stays at `D:/下载/RESONANCE-Sound-Made-Visible-v1.0.0.zip`; archive size/time and every entry hash are added to the import manifest. Gallery imagery is captured from the actual runtime, with interface labels temporarily hidden. Acoustic models remain qualitative and visually time-slowed; Hz sets the real synthesized fundamental, while node modes are not material-calibrated experiments. See [the intake acceptance record](docs/resonance/ACCEPTANCE.md) for observed defects, fixes and validation limits.

## AETERNA — 2026-10-07

The supplied nine-room exhibition distinguishes its generated production plates from museum scans. SMK KAS224 is a plaster cast acquired in 1897, marked Public Domain Mark 1.0; its 36 digital cuts are artistic transformations. The Met's second-century Roman wellhead 2019.7 is supplied as an unchanged CC0 GLB. All production images, fonts, GLBs and local Draco decoder binaries are imported unchanged; Bodoni Moda and Manrope keep OFL and Draco keeps Apache 2.0. No license for the entire custom application is inferred. See [the public source record](public/aeterna/ATTRIBUTION.md), [museum provenance](public/aeterna/MUSEUM_ASSETS.md) and [intake acceptance](docs/aeterna/ACCEPTANCE.md).

The original ZIP remains outside the repository at `D:/下载/AETERNA-Rome-in-Marble-and-Memory.zip`. Original per-entry hashes and omitted standalone tooling/compiled output are recorded. The Collection root dependency versions build the source; supplied version/license history remains in scoped provenance and the generated production inventory identifies actual runtime dependencies. Gallery/social imagery is the unchanged supplied generated plate.

ATLAS, THRUST, RESONANCE and AETERNA now use the Collection's already locked Lenis dependency for wheel smoothing on their existing RAF clocks. Its MIT license is retained in [the public license inventory](public/licenses.txt) and the generated production dependency inventory. Original delivery records and supplied notices remain historical source evidence; no asset bytes or dependency versions changed in this scroll update.

## PARALLAX — 2026-10-07

The supplied original sculpture retains 18 named fragments and a fine attached incision across ten perspectives. Four generated production images, thirteen selected design references, three local font binaries and the portable assembled GLB retain their source hashes. Reference frames are art direction, not runtime screenshots. The live exhibition creates its geometry from source; the GLB is its static portable counterpart. Bodoni Moda/Manrope retain complete OFL notices; Three.js/Lenis retain MIT. No application-wide open-source grant is inferred. See [the deployed record](public/parallax/ATTRIBUTION.md), [original prompts and hashes](provenance/parallax/assets/provenance.json) and [intake acceptance](docs/parallax/ACCEPTANCE.md).

The original ZIP stays outside Git and deployment at `D:/下载/PARALLAX-The-Museum-of-Impossible-Forms.zip`. All 73 entries are inventoried. Its 19-file prepared runtime is byte-identical to source/public/vendor and omitted. Three.js core/module/Reflector match the existing locked root dependency byte-for-byte. Standalone package/build/server/startup files are omitted; the historical model exporter is preserved as provenance. Lenis runs on the existing on-demand RAF with immediate restoration/reduced motion and native touch/dialog scrolling. Gallery/social imagery is captured from the actual runtime.

## LUTHIER — 2026-10-07

The supplied nine-movement violin theatre retains its original procedural instrument and local synthesized sound. [Source and model MIT terms](public/luthier/LICENSE.txt), [asset/font/software notices](public/luthier/NOTICE.md), generated-image provenance and original verification records are retained in scoped locations. Generated imagery is not relicensed under the source/model MIT grant. Fonts retain OFL. Existing root Three.js, GSAP and Lenis versions are reused without dependency updates. Gallery/social media is captured from the actual opening composition, which uses the supplied generated violin plate. The interactive internal model remains a separate procedural interpretation.

The original ZIP remains outside Git and deployment at `D:/下载/LUTHIER.zip`. Archive SHA-256 `d8933ed1dec2f77d409e5df0ff528affd814a87b2334d5ac602cb9373c89ab9f`, byte size, time and every entry hash are recorded in the delivery manifest. Compiled output, nested manifests/lockfiles and standalone startup/build/server tools are omitted; unique original image records remain in scoped provenance. See [LUTHIER acceptance](docs/luthier/ACCEPTANCE.md).

OPTIC now uses the locked Lenis on its existing RAF. Its source-history notices remain intact; the added Collection adaptation and actual production license inventory describe the current dependencies.

## CODEX — 2026-10-07

The supplied ten-chapter binding theatre preserves its original procedural book, physical stamped typography, marbling, generated prologue and selected generated art-direction plates. It is an artistic interpretation of a sewn case binding. [Asset and software distinctions](public/codex/NOTICE.md), Cormorant Garamond/Manrope OFL and complete upstream dependency notices are retained. No whole-project open-source grant is inferred. Existing locked Three.js and Lenis are reused without dependency changes. Its gallery/social image is an actual capture of the final original book model, including its authored stamped cover lettering.

The original ZIP remains outside Git and deployment at `D:/下载/CODEX-The-Anatomy-of-a-Book.zip`. Its 42,806,519 bytes, SHA-256 `10f89d184d7a3a9f2098badf90fdb774c90aff0eb829014ca69df2e393b7f74f` and every entry hash are retained in the delivery manifest. Generated-image records, craft references and dependency/font provenance remain scoped. Compiled output and standalone manifest/lock/configuration files are omitted. See [CODEX acceptance](docs/codex/ACCEPTANCE.md).

## MAGMA — 2026-10-07

The supplied nine-movement material sculpture keeps its authored geometry, shaders, local opt-in sound and eighteen generated volcanic plates. The narrative compresses time across compositions and cooling histories; it is not one specimen's mandatory transformation or a calibrated simulation. [Source distinctions](public/magma/NOTICE.md), Archivo OFL and Lenis MIT are retained. No whole-project open-source grant is inferred. Its gallery/social image is a capture of the actual live material renderer.

The original ZIP remains outside Git and deployment at `D:/下载/MAGMA-Stone-Before-Stone.zip`. Its 6,262,469 bytes, SHA-256 `db318dd3cda0cfee6fa230f8ef78e78cc4708683dd6b40d1d0d6284470c24d64` and every entry hash are recorded in the import manifest. Original image-generation and selected/rejected records remain in scoped provenance. Standalone package/lockfiles, vendor duplicates and startup/server tooling are omitted. See [MAGMA acceptance](docs/magma/ACCEPTANCE.md).

## FOSSIL — 2026-10-07

The supplied ten-movement stone exhibition preserves its original generated plates, authored density field, 72 virtual sections and reconstruction. These are interpretive material, not a real CT acquisition, museum accession or calibrated fossil dataset. [Scoped source/data/model MIT terms](public/fossil/LICENSE.txt), [scientific and image distinctions](public/fossil/NOTICE.md), [image notice](public/fossil/licenses/AI-Assets-Notice.md), OFL font notices and the Marching Cubes table's MIT notice are retained. The Collection reuses the installed Lenis on the existing RAF without adding a Three.js runtime to this work. The gallery/social image is an actual opening capture showing the supplied generated ammonite plate.

The original ZIP remains outside Git and deployment at `D:/下载/FOSSIL-Deep-Time-in-Stone.zip`. Its 63,468,503 bytes, SHA-256 `b0f7c0e3e3ed5d73d30d022796c898cb338d942ad7943192c3e2c1e2dce6ff09` and every original entry hash are preserved in the delivery manifest. Original image concepts, data/model records and verification history are scoped; standalone tooling, manifests and vendor duplicates are omitted. See [FOSSIL acceptance](docs/fossil/ACCEPTANCE.md).

## URUSHI and NIB — 2026-10-07

URUSHI preserves one original procedural elliptical lacquer box, its shaders, renderer-captured fallback stills and thirteen generated visual-research plates with their original prompts. The generated research does not replace the live geometry. Original source retains its supplied MIT terms; Bodoni Moda, Manrope and the renamed URUSHI CJK subset retain complete OFL/provenance records. Reflection, curing and layer-depth values are artistic interpretations. See [URUSHI rights](public/urushi/NOTICE.md), [source license](public/urushi/LICENSE.txt) and [acceptance](docs/urushi/ACCEPTANCE.md).

NIB preserves ten original mechanism chapters, eleven generated runtime material images, curated research art, local Cormorant Garamond/Manrope fonts and original source rights. No additional whole-project license is inferred. Fluid/paper mechanisms are authored qualitative interpretations and no manufacturer photograph or model is redistributed. See [NIB original attribution](public/nib/ATTRIBUTION.md), [notices](public/nib/NOTICE.md) and [acceptance](docs/nib/ACCEPTANCE.md). GSAP’s Standard No-Charge License remains distinct from MIT.

Both use the root’s locked dependencies without version changes. Gallery/social images are captured from the actual runtimes and retain procedural/generated distinctions. Original archives remain at `D:/下载/URUSHI-Layers-of-Lacquer.zip` (SHA-256 `1bc800b28e25ee49520004e852c91202ed9e4f0c5e6e3d7895764f7b51a75b1c`) and `D:/下载/NIB-Ink-Under-Pressure.zip` (SHA-256 `40b55bcfe94ce8da8db611d84227982e9388aca3df7a9707aca7005d24894395`). Complete per-entry hashes and scoped adaptations are retained in the import manifest. No standalone manifests, lockfiles, server/build scripts or duplicate vendor runtimes are deployed.

## CREMA — 2026-10-07

The supplied eleven-movement espresso study retains generated machine/material images and concepts, an authored porous volume/flow network, liquid geometry and locally synthesized opt-in sound. Original source retains its scoped MIT license; generated artwork remains subject to separate provider terms with no exclusivity claim. Archivo retains OFL and original software notices remain separate. The Collection reuses locked runtime versions and one Lenis/GSAP clock. Nine bars, wetting, flow, extraction colours and crema are artistic physical interpretations rather than measured data or CFD. [CREMA rights](public/crema/ATTRIBUTION.md), [source license](public/crema/LICENSE.txt), [notices](public/crema/NOTICE.md) and [acceptance](docs/crema/ACCEPTANCE.md) preserve those distinctions.

Original ZIP stays outside Git and deployment at `D:/下载/CREMA-9-Bars.zip`, 16,544,879 bytes, SHA-256 `a89f2f565c52eb3623e4441c89929dabcf6c4801ee2d9c9ad6641f5b49ee5cda`. All 69 entry hashes and scoped omissions/adaptations are recorded in the delivery manifest.

## CRAVE — 2026-10-07

The supplied eleven-movement food/material study retains its generated generic food identities, authored material-light shader, steam/knife layers and locally synthesized opt-in sound. Research photographs and films are referenced, not redistributed. The delivery supplies no application-wide open-source license; MIT is not inferred from Lenis. Cormorant Garamond and Manrope retain OFL with original font/software notices. [Original attribution](public/crave/ATTRIBUTION.md), [material distinctions](public/crave/NOTICE.md) and [acceptance](docs/crave/ACCEPTANCE.md) preserve these boundaries. One locked Lenis/GSAP clock retains native touch and reduced motion.

Original ZIP stays outside Git and deployment at `D:/下载/CRAVE-Before-the-First-Bite.zip`, 21,395,216 bytes, SHA-256 `c20b9e2f66841d13b5d823122ce3c1b89e13a43b629462494009e349c464ea53`. All 64 entry hashes and scoped omissions/adaptations are recorded in the delivery manifest.

## GRID — 2026-10-07

The supplied twelve-system typography experiment keeps its one semantic specimen, nine content nodes, live type/frame controls and authored pure handoffs. “Bw Stairs” by Dmitrijs Milajevs, CC BY 3.0, via Wikimedia Commons is the single actual runtime photograph; live cropping, contrast and raster processing are disclosed presentation changes. Original generated visual-bible plates stay in provenance as design references and are not deployed. Roboto Flex, Instrument Serif and IBM Plex Mono retain OFL, with original font/photo/software records. No application-wide open-source grant is inferred. [Photograph attribution](public/grid/licenses/PHOTO-ATTRIBUTION.md), [notices](public/grid/NOTICE.md) and [acceptance](docs/grid/ACCEPTANCE.md) preserve these distinctions.

Original ZIP stays outside Git and deployment at `D:/下载/GRID-The-Architecture-of-Visual-Order.zip`, 22,328,651 bytes, SHA-256 `a482b66fca3ce9f76fbf08766e211005312770b4dad10b8290c75ca12f320fbc`. All 76 entry hashes and scoped omissions/adaptations are recorded in the delivery manifest. Root runtime and compiler dependencies are reused without updates.
