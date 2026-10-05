# 素材归属与参考 / Attribution

记录日期：2026-10-05。CHRONOS 是独立创作的数字腕表体验，与下面列出的制表品牌、机构和软件作者没有关联或背书关系。

## 原创内容 / Original work

原创应用代码、页面编排、文案、程序生成的几何体与材质、灯光布局，以及本地合成的机械声，均为本项目制作。应用代码和文档的许可见 [LICENSE](../../public/chronos/LICENSE)。

| 随包素材 | 来源与处理 |
| --- | --- |
| `public/chronos/images/chronos-watch.webp` | 为 CHRONOS 制作的原创 AI 摄影风格腕表图像；用于开场与结束构图 |
| `public/chronos/images/chronos-craft.webp` | 为 CHRONOS 制作的原创 AI 摄影风格机芯细节图像；用于 Craft 章节 |
| `experiences/chronos/src/scene/geometry.ts`、`experiences/chronos/src/scene/materials.ts`、`experiences/chronos/src/scene/WatchScene.ts` | 项目专用程序几何、表面纹理、灯光与机芯组成；无需远程模型或 HDRI |
| `experiences/chronos/src/audio.ts` | 通过 Web Audio 在本地生成的机械声；没有使用第三方录音 |
| `public/chronos/favicon.svg` | 原创 CHRONOS 图形标记 |

两幅图像通过内置 OpenAI ImageGen 于 **2026-10-05** 为本项目生成，随后准备为随包 WebP 素材。它们是摄影风格的想象作品，未验证为真实品牌制造品，也不是工程图纸。使用者可按所提供形式将其用于本项目，并遵守适用条款；这里不主张生成图像具有排他性著作权。原始生成图像与实时机芯是视觉叙事的不同组成部分，不声称逐件相同。

The two supplied photographic artworks were generated for this project with the built-in OpenAI ImageGen tool on **5 October 2026**. They depict an imagined watch and imagined movement detail, not verified branded manufactured objects or engineering drawings. You may use these artworks as supplied with the project, subject to applicable terms. No exclusive copyright in generated imagery is asserted. The generated images and live geometry serve the same visual narrative without claiming exact component identity.

## 字体 / Typography

| 字体 | 使用范围 | 随包许可 |
| --- | --- | --- |
| Cormorant Garamond | 标题、品牌字样；Latin 300、300 italic、400 | [SIL OFL 1.1 与原始版权声明](../../public/chronos/licenses/Cormorant-Garamond-OFL.txt) |
| DM Sans | 正文与界面；Latin 400、500 | [SIL OFL 1.1 与原始版权声明](../../public/chronos/licenses/DM-Sans-OFL.txt) |
| IBM Plex Mono | 技术读数；Latin 400 | [SIL OFL 1.1 与原始版权声明](../../public/chronos/licenses/IBM-Plex-Mono-OFL.txt) |

字体通过对应的 `@fontsource` 软件包取得，当前锁定版本均为 5.3.0。构建后的 WOFF2 文件本地随包提供；Cormorant 位于 `public/chronos/fonts/`，与 VERDANT 字节相同的 DM Sans 400/500 位于 `public/shared/fonts/`。字体保持原有许可，不改列为应用的 MIT 许可。

## 机械参考 / Mechanical references

这些一手资料用于核对机械关系与术语。**没有复制它们的摄影、插图、页面截图或 CAD 文件到作品中。** 原创齿数组合、空间布局、慢动作节奏与视觉简化详见 [CHRONOS motion](../../docs/chronos/MOTION.md)。

| 资料 | 在本项目中的用途 |
| --- | --- |
| [Grand Seiko — Mechanical](https://www.grand-seiko.com/us-en/collections/movement/mechanical)，“Mechanism” 部分 | 核对发条、轮系、擒纵轮、擒纵叉、摆轮与游丝之间的能量和调速关系 |
| [British Horological Institute — Technician Grade, Lesson 1](https://bhi.co.uk/wp-content/uploads/2018/03/BHI-DLC-Tech-L1.pdf)，印刷页 29 | 核对完整振荡与节拍的区别；本项目据此采用 4 Hz = 8 beats/s = 28,800 beats/hour |
| [L. C. Tam, Y. Fu & R. Du — Virtual Library of Mechanical Watch Movements](https://www.cad-journal.net/files/vol_4/CAD_4(1-4)_2007_127-136.pdf)，*Computer-Aided Design & Applications* 4(1–4), 2007, 127–136；§2.3、页 131–132 | 参考瑞士杠杆擒纵的锁定与释放关系；论文示例采用 15 齿擒纵轮、每次冲量转过 12° |
| [KHK — Spur Gears, 2025](https://khkgears.net/pdf/2025/spur-gears.pdf)，装配中心距公式 | 核对等模数外啮合的中心距 `a = m × (Z₁ + Z₂) / 2`；应用采用抽象模型单位 |

References inform the mechanical relationships only. The project does not reproduce a commercial calibre, a complete escapement contact simulation, or a manufacturable watch design. Research images and documents are linked, not redistributed.

## 技术参考 / Implementation references

- [GSAP — ScrollTrigger documentation](https://gsap.com/docs/v3/Plugins/ScrollTrigger/): scroll progress, refresh and lifecycle behavior.
- [Lenis — official repository and integration guidance](https://github.com/darkroomengineering/lenis): the shared GSAP ticker integration and local Lenis stylesheet.
- [Three.js](https://threejs.org/): the runtime used for the original 3D scene.

这些软件本身的版本、许可证与原始声明见 [THIRD_PARTY_NOTICES.md](../../public/chronos/THIRD_PARTY_NOTICES.md)。参考链接无需在作品运行时加载。
