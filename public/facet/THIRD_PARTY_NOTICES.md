# FACET — 第三方许可与素材来源

本文件对应 `package.json`、`package-lock.json` 与交付中的本地资源。原始软件许可、版权声明与字体 OFL 文件保存在 `public/licenses/`，并由构建复制到 `dist/licenses/`。本项目的 MIT License 不替代这些第三方条款。

## 运行时依赖

| 软件 | 锁定版本 | 许可与版权 | 完整文件 |
| --- | --- | --- | --- |
| [Three.js](https://github.com/mrdoob/three.js) | 0.186.1 | MIT；Copyright © 2010–2026 three.js authors | [THREE-LICENSE.txt](licenses/THREE-LICENSE.txt) |
| [Lenis](https://github.com/darkroomengineering/lenis) | 1.3.26 | MIT；Copyright © 2024 darkroom.engineering | [LENIS-LICENSE.txt](licenses/LENIS-LICENSE.txt) |
| [GSAP / ScrollTrigger](https://gsap.com/) | 3.15.0 | Standard “No Charge” GSAP License；发行文件保留 Copyright 2008–2026, GreenSock，许可页面署名 Webflow | [GSAP-Standard-License.md](licenses/GSAP-Standard-License.md) |

GSAP 的安装包 `package.json` 与发行文件指向 [官方标准许可](https://gsap.com/standard-license)，其当前规范地址为 [gsap.com/community/standard-license/](https://gsap.com/community/standard-license/)。本包保存核对时的完整正文、FAQ、日期与版权信息，并记录安装包的版权头。该许可不是 MIT；转用其代码时请保留自身许可与专有声明。

## 开发依赖

这些工具由 `npm ci` 安装，ZIP 不包含 `node_modules`。随包保留完整许可便于继续开发与查阅。

| 软件 | 锁定版本 | 许可 | 完整文件 |
| --- | --- | --- | --- |
| [Vite](https://github.com/vitejs/vite) | 8.3.3 | 核心 MIT；其已发布工具包含其他依赖的许可声明 | [VITE-LICENSE.md](licenses/VITE-LICENSE.md)，包含原始完整 bundled-dependency notices |
| [TypeScript](https://github.com/microsoft/TypeScript) | 5.9.3 | Apache-2.0 | [TYPESCRIPT-LICENSE.txt](licenses/TYPESCRIPT-LICENSE.txt)；[TYPESCRIPT-ThirdPartyNoticeText.txt](licenses/TYPESCRIPT-ThirdPartyNoticeText.txt) |
| [@types/three](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/three) | 0.183.1 | MIT | [THREE-TYPES-LICENSE.txt](licenses/THREE-TYPES-LICENSE.txt) |

上述本地软件许可文件从对应锁定版本的安装包直接复制，保留原文。

## 字体

| 字体 | 交付文件 | 来源与用途 | 许可 |
| --- | --- | --- | --- |
| Instrument Serif | `instrument-serif-regular.woff2`、`instrument-serif-italic.woff2` | [官方字体项目](https://github.com/Instrument/instrument-serif)；英文标题与斜体 | [Instrument-Serif-OFL.txt](licenses/Instrument-Serif-OFL.txt) |
| DM Sans | `dm-sans-regular.woff2`、`dm-sans-medium.woff2` | [官方字体项目](https://github.com/googlefonts/dm-fonts)；导航与界面文字 | [DM-Sans-OFL.txt](licenses/DM-Sans-OFL.txt) |
| Noto Serif SC | `facet-cjk.ttf` | [Google Fonts 字体页面](https://fonts.google.com/noto/specimen/Noto+Serif+SC)；通过 Google Fonts CSS2 接口获取当前中文界面所需的字符子集 | [Noto-Serif-SC-OFL.txt](licenses/Noto-Serif-SC-OFL.txt) |

所有字体从 `public/fonts/` 自行提供，不在浏览器运行时请求 Google Fonts。字体软件保留 SIL Open Font License 1.1，不由项目 MIT License 重新许可。Noto Serif SC 的 OFL 原始来源为 [Google Fonts 仓库](https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/OFL.txt)。

Noto Serif SC 子集的字符清单来自交付界面的 `index.html`、`src/i18n.ts` 与 `src/narrative.ts`。增加中文文案时需要重新检查字符覆盖，更新子集或改用完整官方字体。`facet-cjk.ttf` 是资源文件名，字体家族仍为 Noto Serif SC。

## 本项目视觉资产

- **程序化内容：** 宝石切面、阶梯式切割、玉石形体、玛瑙纹带与切片、水晶、光路、展陈底座和动画编排由本项目源码构建。相关代码遵循项目 MIT License。
- **静态备选画面：** `public/images/gallery-still.webp` 来源于为 FACET 使用 OpenAI ImageGen 生成的展览图像，经尺寸与 WebP 格式处理后包含在交付中。它是生成图像，不是某件真实博物馆藏品的摄影记录，也不冒用博物馆或摄影师署名。
- **研究参考：** GIA、Smithsonian 与展陈设计机构网页用于形态、材质和光学研究；其中的摄影、图表与网页截图没有作为图像素材随本项目分发。详细引用见 [docs/REFERENCES.md](docs/REFERENCES.md)。

## 重新分发时保留

保留项目 LICENSE、本文、依赖中已有的版权与许可声明，以及 `public/licenses/` 中与实际使用的代码和字体相对应的文件。生产构建中的 `licenses/` 同样应随构建资源一起保留。


Collection integration retains the root lockfile: Three.js 0.186.1, GSAP 3.15.0 and Lenis 1.3.26 where used; Vite 8.3.2 and Three.js types 0.186.0. Original version records above describe the supplied package. The generated Collection production dependency inventory records actual bundled software. Scoped source and design records remain in repository docs/provenance.
