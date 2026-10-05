# 第三方软件与字体 / Third-party notices

以下为原 CHRONOS 交付包使用的直接依赖及其实际锁定版本，核对自随构建安装的软件包与原交付 `package-lock.json`（当前共享工作流见仓库 README）。原创 CHRONOS 应用代码的 MIT 许可不改变这些依赖的许可。

## 随网页运行的依赖 / Runtime components

| 组件 | 版本 | 许可 | 保留的原始声明 |
| --- | --- | --- | --- |
| [Three.js](https://threejs.org/) | 0.186.1 | MIT | [three-MIT.txt](licenses/three-MIT.txt) |
| [Lenis](https://github.com/darkroomengineering/lenis) | 1.3.26 | MIT | [lenis-MIT.txt](licenses/lenis-MIT.txt) |
| [GSAP, CSSPlugin, ScrollTrigger 与 Observer](https://gsap.com/) | 3.15.0 | Standard No Charge GSAP License | [GSAP-NOTICES.txt](licenses/GSAP-NOTICES.txt)；[官方许可条款](https://gsap.com/standard-license/) |
| `@fontsource/cormorant-garamond` | 5.3.0 | SIL Open Font License 1.1 | [Cormorant-Garamond-OFL.txt](licenses/Cormorant-Garamond-OFL.txt) |
| `@fontsource/dm-sans` | 5.3.0 | SIL Open Font License 1.1 | [DM-Sans-OFL.txt](licenses/DM-Sans-OFL.txt) |
| `@fontsource/ibm-plex-mono` | 5.3.0 | SIL Open Font License 1.1 | [IBM-Plex-Mono-OFL.txt](licenses/IBM-Plex-Mono-OFL.txt) |

**GSAP 使用专用许可，不是 MIT。** 安装的 3.15.0 软件包通过 `package.json` 和源码头部链接到其官方条款，未包含独立的完整许可证文件。`GSAP-NOTICES.txt` 原样保留本构建相关模块的版权及许可引用。官方条款允许其定义的用途，并对与 Webflow 视觉动画制作功能竞争的用途设有限制；再次分发和使用时保留 GSAP 的原始声明，并适用其完整条款。

GSAP is distributed under its **Standard No Charge GSAP License**, not MIT. The installed package supplies copyright notices and a link to the governing terms rather than a standalone full license text. Its relevant original notices are preserved locally. The official terms define permitted and prohibited uses and require preservation of proprietary notices; consult the linked terms when reusing GSAP.

三个 OFL 文件均包含对应字体的原始版权声明和完整 SIL OFL 1.1 文本。字体文件保持该许可；字体许可不会把作品中使用这些字体的文本改为 OFL。

## 构建与检查工具 / Build and verification tools

这些依赖记录于源码包的清单与锁定文件中。ZIP 不包含 `node_modules/` 或 Node.js 本身；运行已提供的 `dist/` 不需要安装它们。为便于核对与修改源码，本包仍保留以下工具的原始许可文件。

| 工具 | 版本 | 许可 | 随包记录 |
| --- | --- | --- | --- |
| [Vite](https://vite.dev/) | 8.3.2 | MIT，另含其捆绑依赖声明 | [vite-LICENSE.md](licenses/vite-LICENSE.md)，完整复制，包括其内部依赖声明 |
| [TypeScript](https://www.typescriptlang.org/) | 5.9.3 | Apache-2.0 | [typescript-Apache-2.0.txt](licenses/typescript-Apache-2.0.txt)；[typescript-THIRD-PARTY.txt](licenses/typescript-THIRD-PARTY.txt) |
| [tsx](https://tsx.is/) | 4.23.15 | MIT | [tsx-MIT.txt](licenses/tsx-MIT.txt) |
| `@types/three` | 0.183.1 | MIT | [types-three-MIT.txt](licenses/types-three-MIT.txt) |

The source manifest and lockfile identify development dependencies. Their executables and the `node_modules` directory are not redistributed in this ZIP. Installing them with `npm ci` supplies their own additional transitive dependency notices. The Vite and TypeScript notice files above are complete copies from the installed packages, including the notices those packages bundle.

## 原始文件保留 / Preservation

原交付 `licenses/` 中的 MIT、OFL、Apache 及工具通知文本按安装包原文件复制；Collection 仅规范行尾和尾随空白，不改许可正文；GSAP 的相关模块通知从各源码头部原样提取。分发本项目或包含这些组件的构建文件时，请同时保留本文件与对应许可文件。图像与机械研究资料的来源单独记录于 [ATTRIBUTION.md](../../provenance/chronos/ATTRIBUTION.md)。
