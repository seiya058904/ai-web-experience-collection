# Attribution & licenses

本文件区分原创代码、生成影像、研究参考与第三方资源。根目录 [LICENSE](../../public/interval/LICENSE) 的 MIT 许可仅适用于 INTERVAL 原创源码和文字；第三方组件保留各自许可。

## 原创建筑影像

六幕影像是为 INTERVAL 使用 OpenAI 内置图像生成工具创作的建筑概念视觉，描绘同一座虚构的海边建筑。它们不是现实项目的摄影记录，也不代表下列建筑师、摄影师或机构的作品、委托或认可。

- 正式资源：`public/interval/images/{threshold,light,frame,matter,void,silence}.webp`。
- 同目录的 `*-small.webp` 是响应式较小版本。
- Threshold 正式尺寸为 1672 × 941；其余五幕为 1586 × 992。较小版本宽 1120 像素。
- 每张影像的生成提示词、生成路径和处理记录见 [ASSET-PROVENANCE.json](ASSET-PROVENANCE.json)。
- 图像用于本项目的概念表达，不附加真实建筑名称或原生 4K 摄影声明。

推荐随图保留的说明：

> Architectural imagery was created for INTERVAL as original AI-generated concept visualization. It does not document or represent an existing building.

## 设计研究参考

研究日期：2026-10-05。以下官方资料仅用于理解比例、采光、材料与空间关系；**其照片、视频、图纸和网页设计均未复制到交付资源中**。

| 官方参考 | 本项目研究的空间原则 |
| --- | --- |
| [Chichu Art Museum · Benesse Art Site Naoshima](https://benesse-artsite.jp/en/art/chichu.html) | 厚重边界与地下空间中的自然采光，光随时间改变空间感受 |
| [GC Prostho Museum Research Center · Kengo Kuma & Associates](https://kkaa.co.jp/en/project/gc-prostho-museum-research-center/) | 木构网格作为结构和空间秩序，层次与构件间距形成深度 |
| [Architecture et parc · Louvre-Lens / SANAA](https://www.louvrelens.fr/le-louvre-lens/architecture-et-parc/) | 水平体量、玻璃与反射形成建筑和园景之间的柔和边界 |
| [Teshima Art Museum · Benesse Art Site Naoshima](https://benesse-artsite.jp/en/art/teshima-artmuseum.html) | 留白、开放采光、自然与水的持续变化 |
| [Stillness · Norm Architects](https://normcph.com/project/stillness/) | 对自然、光和材料工艺的关注，安静而有节奏的摄影编辑 |

这些官网图片具有独立权利和使用条件。仅标注参考来源不能替代图片授权。可另见 [Benesse 摄影指引](https://benesse-artsite.jp/en/photography.html)；该指引也不构成其官网照片的开放转载许可。

## 字体

网站使用本地 WOFF2 可变字体，不在运行时调用 Google Fonts 服务。文件由 Google Fonts 官方 CSS 服务与 `fonts.gstatic.com` 获取；交付包含 Latin / Latin Extended 正体子集，未包含斜体或 CJK 字库。原始字体文件未改动，仅使用清晰的本地文件名。

| 字体 | 权利人 / 来源 | 许可原文 |
| --- | --- | --- |
| Bodoni Moda | Copyright 2020 The Bodoni Moda Project Authors · [项目源头](https://github.com/indestructible-type/Bodoni) · [Google Fonts](https://fonts.google.com/specimen/Bodoni+Moda) | [SIL Open Font License 1.1](../../public/interval/fonts/Bodoni-Moda-OFL.txt) |
| Manrope | Copyright 2018 The Manrope Project Authors · [项目源头](https://github.com/googlefonts/manrope) · [Google Fonts](https://fonts.google.com/specimen/Manrope) | [SIL Open Font License 1.1](../../public/interval/fonts/Manrope-OFL.txt) |

完整下载地址、实际字体轴、版本、字节数和 SHA-256 见 [font-provenance.json](font-provenance.json)。Manrope 的原始 [FONTLOG](../../public/interval/fonts/Manrope-FONTLOG.txt) 一并保留。

OFL 文本来源：

- [Google Fonts / Bodoni Moda / OFL.txt](https://raw.githubusercontent.com/google/fonts/main/ofl/bodonimoda/OFL.txt)
- [Google Fonts / Manrope / OFL.txt](https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/OFL.txt)

## JavaScript 运行依赖

| 组件 | 交付版本 | 许可与随附文件 |
| --- | --- | --- |
| [GSAP](https://gsap.com/)（含 ScrollTrigger） | 3.15.0 | **Standard “No Charge” GSAP License**；[官方标准许可](https://gsap.com/standard-license/)；[GSAP-NOTICE.txt](../../public/interval/licenses/GSAP-NOTICE.txt) |
| [Lenis](https://github.com/darkroomengineering/lenis) | 1.3.26 | **MIT**；[Lenis-LICENSE.txt](../../public/interval/licenses/Lenis-LICENSE.txt) |

GSAP 3.15.0 的包元数据指定 Standard “no charge” license，源码版权标记为 Copyright 2008–2026, GreenSock. All rights reserved. GSAP 不是 MIT 组件；项目自身的 MIT 许可不覆盖它。随附 notice 保留版权、许可名称和官方条款链接，完整使用条件以其官方许可为准。

Lenis 许可原文按所安装的 1.3.26 npm 包 `LICENSE` 文件逐字保留，版权为 Copyright (c) 2024 darkroom.engineering。

## 构建工具与项目代码

本项目原创源码与文字：Copyright (c) 2026 INTERVAL contributors，采用 [MIT License](../../public/interval/LICENSE)。

Vite、TypeScript 与 Node.js 类型定义仅用于开发和构建；原交付版本与逐项哈希保存在 `provenance/deliveries/import-manifest.json`；当前 Collection 使用根目录的共享 `package-lock.json`。交付不包含 `node_modules`；重新执行 `npm ci` 时，各开发依赖自身的许可随其包提供。生成的生产 JavaScript 包含上述实际运行依赖及其保留的版权标记。
