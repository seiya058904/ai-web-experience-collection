# Attribution & Licenses

## 原创内容与生成摄影

**GLAZE — Color Fired Into Form** 的视觉编排、场景叙事、界面文案与应用代码为本项目创作。七个场景的摄影风格图像由 OpenAI 内置 `image_gen.imagegen` 为本作品定制生成，并经筛选、构图调整和 WebP 格式优化。执行环境未提供精确的生成模型编号，因此不声称使用了某个特定的 Image 版本。

生成图像随本项目交付，可与项目一同使用和修改。它们是虚构器物的艺术表达，并非博物馆藏品照片、真实工坊产品记录或历史文物证据。项目没有把生成图像标注为任何博物馆的 CC0 馆藏，也没有复制下列品牌的摄影作品。

原始画面包括横幅场景、首页透明器物，以及红釉、白瓷、琥珀的专用竖幅。运行时使用的素材均在本地提供；不依赖图库热链。

每个最终 WebP 的尺寸、字节数、SHA-256、源图记录和提示词保存在 [ASSET-PROVENANCE.json](ASSET-PROVENANCE.json)。Cobalt 遮罩是从本项目生成的透明抠图衍生的辅助素材；文字前方显示的颜色仍来自原钴蓝底图。所有源图均非原生 4K。部分原始提示词未保存，相关记录明确标为“方向记录，非逐字原始提示词”，不会补造执行日志。

## 软件与字体

| 项目 | 来源 | 许可 |
| --- | --- | --- |
| GLAZE 原创应用源码 | 本项目 | MIT，见 `public/glaze/LICENSE.txt` |
| GSAP 3.15.0 / ScrollTrigger | [GSAP](https://gsap.com/) · [源码仓库](https://github.com/greensock/GSAP) | **Standard “No Charge” GSAP License，自定义许可，非 MIT**；见 `public/glaze/licenses/GSAP-Standard-License.txt` |
| Lenis 1.3.26 | [darkroomengineering/lenis](https://github.com/darkroomengineering/lenis) | MIT；见 `public/glaze/licenses/Lenis-MIT.txt` |
| Archivo Variable 字体 | [Omnibus-Type / Archivo](https://github.com/Omnibus-Type/Archivo) · [Fontsource](https://fontsource.org/fonts/archivo) | SIL Open Font License 1.1；来自 `@fontsource-variable/archivo`，本地 WOFF2；见 `public/glaze/licenses/Archivo-OFL.txt` |
| Vite 7.3.1 | [Vite](https://vite.dev/) · [源码仓库](https://github.com/vitejs/vite) | MIT；见 `public/glaze/licenses/Vite-MIT.txt` |
| TypeScript 5.9.3 | [Microsoft / TypeScript](https://github.com/microsoft/TypeScript) | Apache License 2.0；见 `public/glaze/licenses/TypeScript-Apache-2.0.txt` |

第三方许可原文收录于 `public/glaze/licenses/`。原创源码的 MIT 许可不替代依赖库、字体及其组成部分的上游条款。

## 研究参考：未随作品分发其图片或代码

这些来源用于研究器物比例、釉面细节、光线和编辑设计。最终场景并非对任何一个网站、作品或摄影系列的复制；以下机构与品牌未参与、赞助或认可本项目。

| 参考 | 对本作品的启发 |
| --- | --- |
| [TORTUS — Craftsmanship](https://tortus.dk/pages/craftsmanship) | 手工器物的比例差异、拉坯痕迹与釉面自然变化 |
| [Dzek / Formafantasma — ExCinere](https://dzekdzekdzek.com/excinere/) | 颜色来自矿物、颗粒与烧成；微距中的反射和表面密度 |
| [APPARATUS — New York](https://apparatusstudio.com/pages/new-york) | 深红空间、明亮顶光与黑暗凹处形成的戏剧性层次 |
| [大阪市立东洋陶磁美术馆 — Ceramics and Light](https://www.moco.or.jp/en/facilities/point/) | 自然光对釉色与质地的影响、象牙色展示背景的克制 |
| [The Met — Oxblood vase 42249](https://www.metmuseum.org/art/collection/search/42249) | 红釉斑驳、乳白口沿、釉层厚薄与高光的真实关系 |
| [The Met — Celadon vase 49852](https://www.metmuseum.org/art/collection/search/49852) | 青釉器物的轮廓、色泽与体积感 |
| [Cleveland Museum of Art — Tea bowl 1989.272](https://www.clevelandart.org/art/1989.272) | 黑釉中的银色斑点、暗部层次与薄褐色口沿 |
| [Fleava — Kevala case study](https://fleava.com/works/kevala) | 摄影主导、简短文案，以及移动端将器物置于核心的设计思路 |
| [Cai Yawen Ceramics](https://www.caiyawen.art/) · [Awwwards entry](https://www.awwwards.com/sites/caiyawen-ceramics) | 现代陶瓷网站的留白、器物比例与编辑节奏 |
| [V&A — Ceramics: a risky business](https://www.vam.ac.uk/articles/ceramics-a-risky-business) | 烧成的不可逆转性与材质变化，为红釉和热的意象提供背景 |

研究阶段查阅了 [The Met Open Access](https://www.metmuseum.org/policies/image-resources)、[Cleveland Open Access](https://www.clevelandart.org/open-access) 与 [MOCO Open Data](https://websites.jmapps.ne.jp/mocoor/en/) 的使用政策。最终作品没有采用这些馆藏图片；这些政策不构成本项目生成图像的许可来源。

## 技术研究与采用结论

| 官方来源 / 官方文档引用的示例 | 研究结论及本项目取舍 |
| --- | --- |
| [GSAP — Scrub Animations](https://codepen.io/GreenSock/pen/WNvVOWw) | 以滚动位置控制动画进度；本项目把七幕编排进一条可逆时间轴，没有复用示例画面或代码 |
| [GSAP — ScrollTrigger 文档](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) | 采用固定舞台内的子元素变换、刷新与销毁机制，避免给每幕另建一套 pin |
| [GSAP — preventOverlaps / fastScrollEnd](https://codepen.io/GreenSock/pen/ZEyXPGj) | 研究快速跨越触发区时的结束状态；本项目使用统一 scrub 进度，不采用强制跳到结束帧的选项 |
| [Lenis — 官方 GSAP 集成](https://github.com/darkroomengineering/lenis#gsap-scrolltrigger) | 关闭自动 RAF，由 GSAP ticker 驱动 Lenis，并同步 ScrollTrigger 更新 |
| [Lenis 官方 README 引用的模态框示例](https://codepen.io/ClementRoche/pen/PoLdjpw) | 研究模态内容与主页面平滑滚动的隔离；本项目索引通过暂停主展览并排除 dialog 的滚动事件实现 |
| [Vite 文档](https://vite.dev/guide/) | 本地开发、production build 与相对资源路径 |

[CodePen 官方许可说明](https://blog.codepen.io/documentation/licensing/) 将公开 Pens 的原创代码按 MIT 提供；这不改变其中引入的 GSAP、字体或图片各自的许可。这里的 Pen 链接是研究引用，本项目没有打包 Pen 的代码或素材，也没有建立在线嵌入。

GSAP 依赖继续适用其 [Standard License](https://gsap.com/standard-license)，包括其中针对与 Webflow 视觉动画构建功能竞争的用途限制；Lenis 按 MIT 使用。场景构图、过渡顺序、状态维护与控件逻辑由本项目编写，采用的是官方 API 与成熟的集成模式。
