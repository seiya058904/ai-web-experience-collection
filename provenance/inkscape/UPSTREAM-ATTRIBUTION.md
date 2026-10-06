# Attribution & licenses

## 范围

本项目的原创代码、SVG 几何、程序视觉系统和文档采用根目录 [LICENSE](LICENSE) 中的 MIT License，版权声明为 **2026 INKSCAPE contributors**。

下列第三方软件、字体与生成图像分别标明来源和许可。项目的 MIT 声明不替代这些条款，也不授予研究参考中艺术作品、摄影或品牌标识的使用权。

## 专门生成的材质图像

以下六张图像在 2026-10-06 使用 OpenAI 内置 `image_gen.imagegen` 工具为本项目生成。它们是生成材质研究，不是纪实摄影、某位艺术家的既有作品或经实验验证的科学图示。未向生成调用提供外部艺术作品或网站截图作为输入。

| 文件 | 原生尺寸 | 内容 |
| --- | --- | --- |
| `public/art/ink-bloom.webp` | 1448 × 1086 | 带透明边缘的碳墨扩散形态 |
| `public/art/paper-fibers.webp` | 1448 × 1086 | 暖白纸纤维微观材质 |
| `public/art/ink-wash.webp` | 1448 × 1086 | 大面积留白中的抽象横向墨迹 |
| `public/art/brush-stroke.webp` | 1619 × 971 | 带真实 alpha 裂隙的干笔笔触 |
| `public/art/paper-sheet.webp` | 1457 × 1079 | 带透明毛边的空白薄纸 |
| `public/art/ink-gesture.webp` | 960 × 1638 | 带透明笔毫裂隙的竖向流动干笔手势 |

PNG 原图转换为 WebP，颜色质量 94、alpha 质量 100，保留工具实际返回的尺寸，没有放大。透明墨晕、笔触与纸页的 alpha 经过检查；墨晕在暖白背景上的合成边缘经过目视检查。

完整提示词、实际尺寸、源图与交付文件的 SHA-256、处理方式见 [docs/ASSET_PROVENANCE.json](docs/ASSET_PROVENANCE.json)。源 PNG 不随成品包重复提供。生成图像作为本作品组成部分随包交付，单独标记其生成来源；不将其宣称为第三方 CC0 素材，也不作独占版权或第三方权利的概括保证。

网站中的水缘、墨粒、纤维、笔势、折叠和印记是原创程序表现。它们表达材料感与视觉节奏，不声称精确复现某种宣纸、墨配方或流体实验。

## 本地字体

字体文件均保存在 `public/fonts/`，运行时不会请求 Google Fonts 或其他字体服务。文件保持上游二进制内容，未在本地修改。确切下载 URL、字节数和 SHA-256 记录在 [public/fonts/SOURCES.json](public/fonts/SOURCES.json)。

| 字体 | 提供的文件 / 字重 | 上游与版权 | 完整许可 |
| --- | --- | --- | --- |
| Cormorant Garamond | Light 300、Regular 400、Italic 400 | [Cormorant Project](https://github.com/CatharsisFonts/Cormorant)；Copyright 2015 the Cormorant Project Authors | [OFL-Cormorant.txt](public/fonts/OFL-Cormorant.txt) |
| Manrope | Latin subset variable WOFF2，200–800 | [Google Fonts 的 OFL 分发](https://github.com/google/fonts/tree/main/ofl/manrope)；Copyright 2018 The Manrope Project Authors | [OFL-Manrope.txt](public/fonts/OFL-Manrope.txt)、[FONTLOG-Manrope.txt](public/fonts/FONTLOG-Manrope.txt) |
| IBM Plex Mono | Regular 400 | [IBM Plex](https://github.com/IBM/plex)；Copyright © 2017 IBM Corp.，Reserved Font Name “Plex” | [OFL-IBM-Plex.txt](public/fonts/OFL-IBM-Plex.txt) |

三组字体使用 **SIL Open Font License 1.1**。Manrope 使用上述 Google Fonts OFL 分发的原始 WOFF2；没有混入另行许可的 Manrope V5。再次分发字体时，请保留对应版权声明、OFL 全文与相关通知。

## JavaScript 与构建依赖

版本取自随包 `package-lock.json` 对应的实际安装包。

| 包 | 版本 | 用途 | 许可与随包声明 |
| --- | --- | --- | --- |
| [GSAP](https://gsap.com/) | 3.15.0 | 动画时钟与交互 / 滚动动画 | **Standard “No Charge” GSAP License**；[官方条款](https://gsap.com/standard-license)、[GSAP.txt](licenses/GSAP.txt) |
| [Lenis](https://github.com/darkroomengineering/lenis) | 1.3.26 | 滚动平滑 | MIT；[Lenis.txt](licenses/Lenis.txt) |
| [Vite](https://github.com/vitejs/vite) | 8.3.3 | 开发与生产构建 | MIT 与其包内附带的依赖通知；[Vite.txt](licenses/Vite.txt) |

**GSAP 不是 MIT。** 安装的 GSAP 3.15.0 npm 包未提供独立的 LICENSE 文件；`licenses/GSAP.txt` 原样保存其 README 的完整 License 节，其中包含版权声明和官方条款链接。该文件是包内许可证声明，不冒充完整条款快照。官方许可页面核对日期：2026-10-06。请保留 GSAP 源文件与生产输出中的版权和许可证注释。

`licenses/` 还保留已安装构建依赖包随附的许可与通知，包括 Rolldown、Lightning CSS、PostCSS、nanoid、picocolors、picomatch、fdir、tinyglobby、source-map-js、detect-libc 与相关 Oxc / Rolldown 工具。具体版本、包内来源与复制文件哈希见 [licenses/DEPENDENCIES.json](licenses/DEPENDENCIES.json)。

构建工具与平台原生依赖不作为运行时 CDN 资源使用；ZIP 不包含 `node_modules`。在其他操作系统上执行 `npm ci` 时，包管理器按锁文件安装相应平台依赖。

## 设计与材料研究参考

下列来源用于理解材料、观看方式和展览构图。只借鉴研究原则，没有打包其艺术作品、摄影、视频、截图、商标或代码；引用链接不等于获得这些媒体的复制许可。

| 原始来源 | 用于本项目的研究方向 |
| --- | --- |
| [UNESCO — Traditional handicrafts of making Xuan paper](https://ich.unesco.org/en/RL/traditional-handicrafts-of-making-xuan-paper-00201) | 纸纤维、薄纸边缘、折叠与手工材料感 |
| [Shao et al. — A new kind of nanocomposite Xuan paper…，RSC Advances，2019](https://doi.org/10.1039/C9RA08349A) | 润湿与墨粒扩散的观察；不把实验复合纸的特性概括为普通宣纸 |
| [The Metropolitan Museum of Art — Ink Art: Past as Present in Contemporary China](https://www.metmuseum.org/exhibitions/listings/2013/ink-art) | 抽象笔痕、当代材料过程与展览级留白 |
| [Xu Bing studio — Book from the Sky](https://www.xubing.com/en/work/details/206?classID=2&type=class) | 从纸面转为空间环境的尺度关系 |
| [JAPAN HOUSE Los Angeles — TAKEO PAPER SHOW / SUBTLE](https://www.japanhousela.com/exhibitions/takeo-paper/) | 白纸、掠射光、折痕与细微观看 |
| [TAKT PROJECT — programmed PAPER](https://www.taktproject.com/projects/programmed-paper/) | 湿度、曲率与纸面几何之间的艺术性衔接 |
| [SEA — GF Smith Digital](https://seadesign.com/projects/gf-smith-digital) | 以程序纤维构成微观空间的设计方法 |
| [Liu & Liu — Reproducing ancient Chinese ink depending on gelatin/chitosan and modern experimental methodology，2022](https://www.nature.com/articles/s40494-022-00739-w) | 不同墨配方与水痕行为的差异，作为避免过度概括的补充研究 |

研究日期：2026-10-06。参考中的创作者、机构与本项目之间没有被声称的合作、授权或背书关系。
