# Attribution and distribution

公开分发复核日期：2026-10-05。自有部分保留版权，详见 [LICENSE](LICENSE)；本项目没有为整个仓库授予 MIT 或其他宽松开源许可。下列第三方材料继续适用各自许可证。

## Beyond the Limit — 随仓库分发的素材

| 材料 / 位置 | 来源 | 权利与使用说明 |
| --- | --- | --- |
| 五张概念插画：`assets/source/`，响应式衍生图：`public/media/` | OpenAI 内置 Image Gen，为本项目生成；提示词见 `assets/image-prompts.json` | AI 生成的无车队品牌插画，不是官方照片、精确工程图或真实赛事记录。依据 [OpenAI 内容条款](https://openai.com/policies/terms-of-use/#content)，用户与 OpenAI 之间的输出权利归用户，限于适用法律允许的范围；输出可能不唯一。项目不将这些图片另行声明为 MIT。 |
| 中文字体：`public/fonts/noto-sans-sc.woff2` | [Noto Sans SC / Google Fonts](https://fonts.google.com/noto/specimen/Noto+Sans+SC)，Google Fonts 官方文字子集 | [SIL OFL 1.1](https://github.com/google/fonts/blob/main/ofl/notosanssc/OFL.txt)。保留版权、保留名称与完整许可文本；不得单独售卖字体。子集为 Google Fonts 提供的版本。 |
| 拉丁字体：通过 `@fontsource/barlow-condensed` 5.3.0 构建 | [Barlow](https://github.com/jpt/barlow)，The Barlow Project Authors | SIL OFL 1.1；完整文本见 `public/licenses.txt` 和 npm 包的 `LICENSE`。字体不适用项目作者的保留版权声明。 |
| 蒙扎、铃鹿、摩纳哥坐标：`src/circuits.json` | [f1-circuits](https://github.com/bacinger/f1-circuits)，Tomislav Bacinger | [MIT](https://github.com/bacinger/f1-circuits/blob/master/LICENSE.md)，Copyright 2019–2025 Tomislav Bacinger。仅筛选三条赛道；展示时等比投影，蒙扎为构图旋转。版权与完整许可保留在 `public/licenses.txt`。 |
| `public/favicon.svg`、界面图标与教学 SVG / Canvas | 本项目编写的几何图形和程序绘制 | 没有使用第三方图标包或官方 F1 标识；适用项目自有版权说明。 |

历史设计概念图包含生成的 F1 / 车队标识及不准确标签，属于本地设计过程材料。`design/concepts/` 已明确排除出公开仓库和生产构建，不作为可重新分发的正式素材。`assets/provenance.json` 保留生成阶段的历史来源记录，其中的本地概念图目录不随仓库提供。

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

`assets/imports.json` records the SHA-256 identity of the two user-supplied complete projects and the deliberately selected import boundary. Original ZIP exports are preserved outside the Git checkout. Their unused cloud/server starter and compiled duplicates are not distributed in this repository.

- **VERDANT:** four original AI-generated botanical / architectural plates and their responsive WebP derivatives; Instrument Serif and DM Sans with their OFL notices. See [the supplied asset record](experiences/verdant/ASSET-SOURCES.md). Runtime resources are now under `public/verdant/`.
- **ORBITAL:** original illustrative spacecraft GLB, layered compatibility renders and cinematic plates supplied with the project. Earth / Moon / cloud textures credit NASA / Goddard (Reto Stöckli for the cloud composite). Sources are retained in `experiences/orbital/SOURCE.md` and the in-experience credits. Fonts retain their OFL notices. Runtime resources are under `public/orbital/`.
- **Collection:** reuses those same production image files, including the three-panel `public/collection-social.jpg` social preview; its geometric mark and navigation are authored code. No additional stock imagery or commercial brand assets were introduced.
- React, Radix UI, Lucide, Three.js and the used utility packages retain their own licenses. The imported shadcn stylesheet's MIT notice remains beside it. The production dependency inventory includes the actually bundled libraries; it does not grant rights to imagery or replace GSAP's terms.

ORBITAL synthesizes optional audio in code after the sound control is activated; no audio recording or video file was added. AI Web Experience Collection is independent of Formula 1, FIA, racing teams, NASA and SpaceX. See the production `credits.html` for visitor-facing attribution and license links.
