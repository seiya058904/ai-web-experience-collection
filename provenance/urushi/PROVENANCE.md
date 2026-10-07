# URUSHI — 素材来源与权利记录

记录日期：2026-10-07。

本记录说明最终交付素材来自哪里、经过何种制作，以及在作品中如何使用。作品
描绘一件为本项目设计的想象器物，不代表某件真实馆藏、特定工坊产品或某位
艺术家的作品。图像中的工艺状态是创作研究，不是历史实物记录或材料实验照片。

## 1. AI 视觉研究：13 份最终采用图

以下图像通过本次会话中的图像生成工具，为 **URUSHI — Layers of Lacquer**
专门生成和修订。每张图的完整生成指令保存在同目录的同名 `.prompt.txt` 文件。
提示词中保留了有关参照形体、保留构图与定向修订的说明。

`00-material-bible.png` 为 1536 × 1024；其余采用图为 1672 × 941。以下路径均
相对于项目根目录。

| 图像 | 同名提示词 | 采用目的与运行时关系 |
| --- | --- | --- |
| `docs/visual-bible/00-material-bible.png` | `docs/visual-bible/00-material-bible.prompt.txt` | 材料研究总板：木、漆、固化、研磨、反射和金粉的色彩与质感关系。仅作设计资料。 |
| `docs/visual-bible/01-hero.png` | `docs/visual-bible/01-hero.prompt.txt` | 最终 Hero 构图与无金粉黑漆方向。用于指导实时器形、光线和版式。 |
| `docs/visual-bible/02-core.png` | `docs/visual-bible/02-core.prompt.txt` | 同一器物的木胎、吸光表面与木纹研究。实时木纹由程序生成。 |
| `docs/visual-bible/03-coat.png` | `docs/visual-bible/03-coat.prompt.txt` | 受控薄漆前沿与开始聚拢的反射。运行时使用物体空间遮罩。 |
| `docs/visual-bible/04-cure.png` | `docs/visual-bible/04-cure.prompt.txt` | 暗室、静候与固化气氛。运行时由背景着色器和表面状态表达。 |
| `docs/visual-bible/05-abrade.png` | `docs/visual-bible/05-abrade.prompt.txt` | 湿磨后的局部失光、细痕与近景裁切研究。 |
| `docs/visual-bible/06-layers.png` | `docs/visual-bible/06-layers.prompt.txt` | 重复、层积与放大截面方向。运行时截面是概念性材质窗口。 |
| `docs/visual-bible/07-vermilion.png` | `docs/visual-bible/07-vermilion.prompt.txt` | 朱色在同一器物上的受控转调。没有替换模型。 |
| `docs/visual-bible/08-polish.png` | `docs/visual-bible/08-polish.prompt.txt` | 连续长反射与镜面清晰度的目标研究。 |
| `docs/visual-bible/09-maki-e.png` | `docs/visual-bible/09-maki-e.prompt.txt` | 晚段有限金粉、附着关系与稀疏曲线研究。金粉和图案由程序实现。 |
| `docs/visual-bible/10-reveal.png` | `docs/visual-bible/10-reveal.prompt.txt` | 覆漆遮蔽、研磨显露与表面重新收光。 |
| `docs/visual-bible/11-depth.png` | `docs/visual-bible/11-depth.prompt.txt` | 最终器物的安静收尾与深黑倒影。 |
| `docs/visual-bible/12-poster.png` | `docs/visual-bible/12-poster.prompt.txt` | 去掉网页文字与界面的纯材质构图研究，用于校准器形、环境与反射；最终加载海报改由实时渲染器捕获，以保持首帧连续。 |

早期试作 `01-hero-study.png` 未被采用，不计入上述 13 份素材，也不属于最终
交付清单。后续 `01-hero.png` 的定向修订重点是去除黑漆上的金属感杂点和粗颗粒，
让开场保持无金、平滑、深黑的材料方向。

AI 图像按项目素材提供。该来源记录不宣称生成图像具备独占版权，也不把根目录
MIT 许可自动扩展为对生成服务相关权利与条款的替代。未登记无法核实的模型 ID、
训练材料或现实作品归属。

## 2. AI 研究与实时画面的关系

AI 关键帧为构图、材料与场景节奏提供参照。实际交互画面由原创轮廓、程序纹理和
GLSL 着色器生成：页面不会将 13 张研究图按滚动位置轮播，也没有把生成图直接
贴到网格上冒充动态漆材。

`docs/visual-bible/12-poster.png` 及提示词保留了纯器物的构图研究。最终生产海报
`public/assets/surface-black.webp` 与 `public/assets/stills/hero.webp` 使用相同的
原创实时渲染结果：加载前后保持一致的器形与光线，避免从概念图切换到模型时
产生跳变。它也用于单个降级静帧读取失败时的通用后备图。

## 3. 原创模型、纹理、着色器与图形

| 素材或代码 | 制作方式 | 权利范围 |
| --- | --- | --- |
| `public/models/vessel-profile.json` | 为本作编写的低矮椭圆器物轮廓、比例、接缝和采样参数；采用归一化艺术单位。 | 原创，MIT。 |
| `src/geometry.js` | 从轮廓生成封闭网格、表面位置、法线与纹理坐标。 | 原创，MIT。 |
| `public/models/urushi-vessel.obj` | 通过 `scripts/export-model.mjs` 从与实时画面相同的轮廓及几何函数导出。 | 原创模型导出，MIT。 |
| `src/material-textures.js` | 固定随机种子生成 RGBA 材料噪声场，供木纹、微结构和遮罩变化使用。 | 原创，MIT。 |
| `public/textures/lacquer-microstructure.png` | 上述程序纹理的文件导出；不含第三方照片或扫描。 | 原创纹理导出，MIT。 |
| `src/shaders/` 中的 GLSL | 原创漆面、木纹、地层、反射、研磨、朱色、金纹、金粉、背景与地面近似。 | 原创部分，MIT；使用的 Three.js shader include 保留 Three.js 的 MIT 许可。 |
| 金粉与三条细弧线图案 | 以物体坐标和固定种子生成；到达次序与局部遮罩共同控制显现、覆盖和研出。 | 原创设计与实现，MIT。 |
| 导航箭头、界面与文案 | 本项目编写的 SVG 路径、DOM、CSS 和中英文内容。 | 原创，MIT。 |

该模型没有由馆藏扫描、第三方模型商店或摄影测量生成。着色器是为视觉叙事
编写的近似；没有声称使用实测漆材光谱、真实 BRDF 或准确的固化动力学。

## 4. 章节静帧降级版

`public/assets/stills/` 的章节图由本项目同一 `LacquerRenderer`、器形轮廓、
GLSL 和故事状态捕获，再编码为 WebP。它们是原创实时画面的固定时刻，用于
无 WebGL 或渲染不可用时保留章节内容；不来自 AI 章节图裁切或第三方摄影。

静帧文件与章节的对应关系：

| 文件 | 章节 |
| --- | --- |
| `public/assets/stills/hero.webp` | 00 — Black without edge |
| `public/assets/stills/core.webp` | 01 — Core |
| `public/assets/stills/coat.webp` | 02 — First coat |
| `public/assets/stills/cure.webp` | 03 — Cure |
| `public/assets/stills/abrade.webp` | 04 — Abrade |
| `public/assets/stills/layers.webp` | 05 — Layers |
| `public/assets/stills/vermilion.webp` | 06 — Vermilion |
| `public/assets/stills/polish.webp` | 07 — Polish |
| `public/assets/stills/maki-e.webp` | 08 — Maki-e |
| `public/assets/stills/reveal.webp` | 09 — Reveal |
| `public/assets/stills/depth.webp` | 10 — Depth |

静帧与生产海报来自原创模型和渲染实现，按本项目 MIT 许可提供。静帧采用无损
WebP 编码保留黑色渐变。它们保留关键状态的外观，
无法呈现实时版本中连续可逆的涂覆与反射变化。

## 5. 字体

字体保留 **SIL Open Font License 1.1**，不改用原创代码的 MIT 许可。

| 字体 | 来源与实际使用 | 随包记录 |
| --- | --- | --- |
| **Bodoni Moda** | `@fontsource/bodoni-moda` 5.3.0，Latin 400；英文标题与品牌字标。原作者见字体许可。 | `licenses/bodoni-moda-OFL.txt` |
| **Manrope** | `@fontsource/manrope` 5.3.0，Latin 400 / 500；正文与控件。原作者见字体许可。 | `licenses/manrope-OFL.txt` |
| **Noto Serif SC → URUSHI CJK** | 以 `@fontsource/noto-serif-sc` 5.3.0、上游 v35 为来源制作本站中文子集，家族名改为 URUSHI CJK；合并所需箭头字形，没有修改字形轮廓。 | `licenses/noto-serif-sc-OFL.txt`；`public/assets/fonts/urushi-cjk.provenance.json`；`public/assets/fonts/urushi-cjk.woff2` |

Noto Serif SC 子集记录包含来源包 URL、输入字体哈希、选入字符、工具和成品
SHA-256。精确字符范围以该 JSON 为准。英文包和中文子集均在本地提供，页面
无需向在线字体服务发起请求。字体来源可查阅 [Bodoni Moda](https://fontsource.org/fonts/bodoni-moda)、
[Manrope](https://fontsource.org/fonts/manrope) 与 [Noto Serif SC](https://fontsource.org/fonts/noto-serif-sc)。

## 6. 运行依赖与构建工具

| 组件 | 锁定版本 | 许可文件 | 用途 |
| --- | --- | --- | --- |
| Three.js | 0.186.1 | `licenses/three-MIT.txt` | WebGL 对象、几何、资源与渲染管理。 |
| Lenis | 1.3.26 | `licenses/lenis-MIT.txt` | 唯一平滑滚动实现。 |
| Vite | 8.3.3 | `licenses/vite-MIT.txt` | 本地开发与生产构建。 |

依赖版本以 `package.json` 和 `package-lock.json` 为准。各依赖保留其原始作者、
版权与许可声明。更多权利范围说明见 `licenses/ASSET-RIGHTS.md`。

## 7. 真实工艺与视觉参考

技术事实与视觉研究使用了博物馆、官方工艺机构、材料研究论文和当代创作记录。
完整事实对应关系见 `docs/research/RESEARCH.md`；About 面板使用
`public/assets/research-sources.json` 的 8 项来源。

| 机构或资料 | 本项目使用范围 |
| --- | --- |
| [Japan Kogei Association — Urushi work](https://www.nihonkogeikai.or.jp/en/urushiwork/) | 树液、地层、工艺分支与术语。 |
| [轮岛漆艺美术馆 — Techniques and History](https://www.art.city.wajima.ishikawa.jp/exhibition-guide/gl-en) | 木胎准备、地层、木炭湿磨和精细收光。 |
| [Kenjo, 1973 — 漆膜聚合研究](https://www.jstage.jst.go.jp/article/shikizai1937/46/7/46_419/_article/-char/en) | 漆酶参与的聚合，以及湿度和氧气的影响。 |
| [Japan Artisan Foundation — Roiro](https://artisanfoundation.jp/wajima/articles/roiro) | 擦漆、细磨与镜面终饰。 |
| [The Met — Lacquerware of East Asia](https://www.metmuseum.org/essays/lacquerware-of-east-asia) | 蒔绘撒粉与梨地的含义。 |
| [e-Museum — Comb Box with Pine and Camellia](https://emuseum.nich.go.jp/detail?content_base_id=101134&content_part_id=022&content_pict_id=0&langId=en&webView=0) | 覆漆后研出图案的实物工艺记录。 |
| [京都国立博物馆 — Poetry-Inspired Inkstone Box](https://www.kyohaku.go.jp/eng/collection/meihin/urusi/item02/) | 金属粉在半透明漆下形成梨地的说明。 |
| [V&A — Mine Tanigawa 的漆雕塑](https://www.vam.ac.uk/articles/mine-tanigawas-meticulously-crafted-japanese-urushi-lacquer-sculptures) | 当代漆材形体、分层、抛光与受控环境的视觉研究。 |

这些网页中的馆藏照片、纪录片、页面图形及第三方模型**没有复制进交付包**。
来源链接不是合作、授权署名或机构背书。图像研究只用于形成材料判断与原创
视觉方案，未把某个真实文物的归属转移给本项目。

## 8. 作品边界与交付状态

本作通过滚动压缩时间，放大薄层、微痕与粉末的可见度。湿度、固化、层数与
粗糙度是艺术控制参数，不构成漆艺配方或施工指导。镜面借鉴 **roiro**；前段
Polish 表示初次清晰，后段仍有装饰、覆盖与研出。形状是原创建模，光照、金粉
附着和表面化学变化采用视觉近似。

交付为本地源码与已构建资源的 ZIP。没有使用 OpenAI Sites，也没有部署到
任何公共托管服务。生产页面的素材、模型、纹理、字体与来源清单均随包提供；
研究链接仅在用户主动点击时访问外部网站。
