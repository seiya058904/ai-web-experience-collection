# Attribution & provenance

## 原创内容

VEIL 的构图、页面代码、交互、参数化布料形态、经纬纱线几何、程序织纹、缝线与光影系统为本项目制作。原创代码与文档依 [MIT License](LICENSE) 提供。

本文件区分作品本身、第三方软件、字体、辅助生成图与研究参考。第三方名称只用于注明来源，不表示合作或背书。

## 软件与字体

以下版本来自本次安装的实际 `package.json`，并由项目 `package-lock.json` 锁定。许可文件直接复制自相应安装包；GSAP 安装包只提供标准许可网址，其正文另从官方页面归档。构建后的 JavaScript 与 WOFF2 字体仍保留各自许可，不因打包而改为项目 MIT 许可。

| 依赖 / 版本 | 使用范围 | 原始来源 | 许可全文 |
| --- | --- | --- | --- |
| Three.js `0.186.1` | 实时几何、材质、光照与环境 | [three.js](https://github.com/mrdoob/three.js) | MIT · [THREE-LICENSE.txt](licenses/THREE-LICENSE.txt) |
| GSAP `3.15.0` | ticker 与 ScrollTrigger | [GSAP](https://gsap.com/) · [Standard License](https://gsap.com/standard-license/) | Standard “No Charge” · [GSAP-STANDARD-LICENSE.txt](licenses/GSAP-STANDARD-LICENSE.txt)；[版权声明](licenses/GSAP-NOTICE.txt) |
| Lenis `1.3.26` | 平滑滚动与统一滚动更新 | [Lenis](https://github.com/darkroomengineering/lenis) | MIT · [LENIS-LICENSE.txt](licenses/LENIS-LICENSE.txt) |
| Vite `8.3.2` | 开发与生产构建 | [Vite](https://github.com/vitejs/vite) | MIT 及安装包附带的依赖声明 · [VITE-LICENSE.md](licenses/VITE-LICENSE.md) |
| TypeScript `5.9.3` | 源码类型检查 | [TypeScript](https://github.com/microsoft/TypeScript) | Apache-2.0 · [TYPESCRIPT-LICENSE.txt](licenses/TYPESCRIPT-LICENSE.txt) |
| `@types/three` `0.183.1` | Three.js 类型定义 | [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/three) | MIT · [TYPES-THREE-LICENSE.txt](licenses/TYPES-THREE-LICENSE.txt) |
| `@fontsource/cormorant-garamond` `5.3.0` | 本地衬线标题字体与 build 内的 WOFF2 | [Fontsource](https://fontsource.org/fonts/cormorant-garamond) · [Cormorant 原项目](https://github.com/CatharsisFonts/Cormorant) | SIL OFL 1.1 · [CORMORANT-GARAMOND-OFL.txt](licenses/CORMORANT-GARAMOND-OFL.txt) |
| `@fontsource/manrope` `5.2.8` | 本地界面字体与 build 内的 WOFF2 | [Fontsource](https://fontsource.org/fonts/manrope) · [Manrope 原项目](https://github.com/sharanda/manrope) | SIL OFL 1.1 · [MANROPE-OFL.txt](licenses/MANROPE-OFL.txt) |

GSAP **不是 MIT 许可软件**。此处归档其官方 Standard “No Charge” License 的完整正文（I–VI），取自 2026-10-06 的官方页面；该正文引用的 Webflow Terms of Service 仍以其中链接为准。

## 配套生成图

以下三张图片使用本次制作中的 OpenAI 内置 `image_gen` 生成，以质量 90 转为 WebP 供本地运行。它们是**生成的材质研究与艺术图像**，不是实拍照片、第三方图库照片或公共领域素材。两张场景图的编辑输入为本项目自己生成的概念图。

| 文件 | 来源与用途 |
| --- | --- |
| `public/images/cloth-study.webp` | 从原创 VEIL 概念图中移除界面文字，保留象牙色背景中的悬浮丝绸；用于初始 / 兼容版本的视觉。 |
| `public/images/light-study.webp` | 从原创 Light 概念图中移除界面文字，保留暗色环境与透光薄纱；用于暗场兼容版本。 |
| `public/images/silk-macro.webp` | 独立生成的平面丝织纹理微距研究；用于实时布料的 albedo 材质图和 Detail 的小型表面样本。法线与立体经纬结构由代码生成，材质图加载失败时回退到程序织纹。 |

在交付方享有的权利范围内，配套生成图随项目提供，可用于、修改和再分发本作品，无额外署名要求；本说明不将生成图声明为公共领域，也不改变任何第三方软件或字体许可。

## 研究参考

以下原始机构 / 艺术家资料用于理解织物结构、空间、构成与光，**没有将这些网站的图片、视频、文字正文或艺术品素材打包进作品**。研究所得转化为本项目自己的几何、构图与交互。

- [Anni Albers — On Weaving / Josef & Anni Albers Foundation](https://www.albersfoundation.org/alberses/teaching/anni-albers/on-weaving)：经纬结构与材料自身如何形成视觉秩序。
- [Do Ho Suh: Almost Home / Smithsonian American Art Museum](https://americanart.si.edu/exhibitions/suh)：半透明织物如何建立可进入的建筑空间。
- [Secrets of Balenciaga’s construction / V&A](https://www.vam.ac.uk/articles/secrets-of-balenciagas-construction)：裁片、垂褶与材料处理如何从平面构成立体轮廓。
- [Light Field no. 1 / Gabriel Dawe](https://www.gabrieldawe.com/light-field-no-1)：薄纱装置中的层次、通透与空间感。
- [A-POC ABLE ISSEY MIYAKE TYPE-XIII / Atelier Oï](https://eu.isseymiyake.com/blogs/project_types/type-13)：材料、结构与造型共同形成对象的设计思路。

## 运行素材的原始生成提示词

下方保留三张运行素材使用的完整提示词；概念探索图不属于运行资源，也未随交付包附带。提示词记载的是生成请求；相同提示词不保证生成逐像素一致的输出。

### cloth-study.webp

```text
Use case: precise-object-edit
Asset type: production runtime fallback poster and auxiliary art layer for VEIL — Fabric in Motion.
Edit target: the supplied original VEIL hero concept image.
Primary request: Remove ALL text and ALL website interface elements, including the giant VEIL word, the small VEIL logo, the top centered tagline, Index, hamburger lines, lower-left title and subtitle, Scroll to unfold label and line, all bottom chapter labels and the horizontal baseline. Reconstruct the unobstructed ivory studio background and silk surfaces behind every removed text or line.
Preserve: the giant flowing S-shaped silver-white silk sculpture exactly in its existing expressive pose; its graceful folds and thin curled edges, tactile microscopic woven fibers, subtle silky reflected light, luminous pearly highlights and physical soft shadow. Preserve the original composition with sculpture predominantly on the right, generous clean negative space on the left, original 1536 × 1024 landscape framing, warm matte ivory #e9e6df atmosphere.
Requirements: Pure full-bleed fabric artwork only, no words, no typography, no UI, no labels, no lines, no logos, no watermarks. Do not add objects. Do not change the cloth shape, material, lighting, camera position, background color, or shadow design beyond naturally reconstructing regions occluded by removed interface. Keep physically soft textile realism and restrained premium studio lighting. This must be a clean seamless artwork that can sit behind native webpage text.
```

### light-study.webp

```text
Use case: precise-object-edit
Asset type: production runtime dark-scene fallback artwork for VEIL — Fabric in Motion.
Edit target: supplied LIGHT chapter concept image, 1536 × 1024 landscape.
Primary request: remove EVERY word and EVERY interface element from this image. Remove the small VEIL top-left label, Index top-right label, the entire huge lower-left "Light, held softly." headline, every chapter-navigation label at the bottom, and the small navigation underline. Reconstruct each removed region naturally as the continuous dark charcoal studio space that lies behind it.
Preserve exactly: the three broad suspended transparent silver-grey silk organza surfaces, their composition and graceful draping curves, the illuminated upper-left diagonal light, luminous finely woven texture, ultrathin bright textile edges, black-to-charcoal #161918 background, original camera angle and framing, subtle atmospheric light gradients, original overlapping fabric transparency. The sheets must remain airy and tactile with their original delicate shallow folds.
Output: only a clean full-bleed cinematic photograph-like textile installation with a dark background and no text, typography, logos, navigation, lines, UI, watermark, or extra object. Cloth remains in the upper-center and right, leaving generous clean negative space on lower left. Do not change cloth geometry, palette, fabric placement, lighting, or shadows except to restore portions occluded by removed UI.
```

### silk-macro.webp

```text
Use case: photorealistic-natural.
Asset type: runtime material texture map for a WebGL silk fabric mesh and a textile detail scene. Not a finished design, no typography.
Create an exactly square 2048×2048 image of real warm ivory silk satin weave at extreme macro magnification, seen perfectly orthographically from directly overhead. Entire canvas is filled edge-to-edge with continuous flat homogeneous woven silk material. Uniformly repeating warp and weft yarns form a very fine understated diagonal satin weave, plausible over-under structure. Each yarn bundle consists of many discernible fine individual silk strands, with very subtle natural microvariation. Light silver-beige #ddd8ce and ivory #ece8e0 palette, no colored threads.
The texture must be visually as seamless and tileable as possible across all four edges: constant yarn scale, constant thread density, neutral even diffuse lighting, no highlight hotspot, no dark corner, no gradient, no vignetting, no seam, no border. Delicate strand highlights and tiny occlusion at crossings are okay, but all large-scale shadows and directional shading must be absent because lighting will be generated by the WebGL shader.
Tactile, premium real silk rather than synthetic plastic, no glossy rubber, no latex, no leather grain, no foil, no chrome, no coarse jute or rope. Flat plane, no folds, no ripples, no drape, no pinching, no objects, no frame, no text, no labels, no icon, no watermark, no background beyond textile. Photorealistic textile scan, calibrated material texture quality. The weave should be legible at this magnification while fine enough to read as elegant silk.
```
