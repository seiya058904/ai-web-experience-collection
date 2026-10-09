# AETERNA — 素材来源与授权总表

本文区分馆藏扫描、扫描衍生几何、生成图像、设计参考与软件依赖。文件名和视觉上的摄影感不能代替来源判断。完整模型记录见 [MUSEUM_ASSETS.md](MUSEUM_ASSETS.md)，历史论述与官方链接见 [CURATORIAL_NOTES.md](CURATORIAL_NOTES.md)。

## 1. 真实馆藏与扫描衍生模型

| 运行文件 | 来源与身份 | 权利标记 | 展览处理 |
|---|---|---|---|
| `models/herakles-fragments.glb` | [SMK KAS224](https://open.smk.dk/en/artwork/image/KAS224)：1897 年入藏的 Lansdowne Herakles 石膏翻模；原型为约公元 125 年罗马大理石像。 | [Public Domain Mark 1.0](https://creativecommons.org/publicdomain/mark/1.0/)，以 SMK [官方元数据](https://api.smk.dk/api/v1/art/?object_number=KAS224)为准。 | 从翻模 STL 简化、平滑并数字切分为 36 块，新增内部断面，重新设置材质、灯光与运动；用于身体、断裂与展厅查看。 |
| `models/roman-wellhead.glb` | [The Met 2019.7](https://www.metmuseum.org/art/collection/search/775805)：公元二世纪罗马大理石井栏，题材为 Narcissus 与 Echo、Hylas 与水泽仙女。 | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)，The Met Open Access。 | 随包 GLB 保持馆方下载文件内容；展览以视角和灯光展示其立体形态。 |

SMK 的扫描对象是**后期石膏翻模**。其 36 块数字分片保留完整翻模的组合轮廓，切口与离散路径是本展创作，不是原件出土、损坏或修复过程的记录。PDM 是公共领域标记，与 CC0 的法律工具不同；这里保留馆方提供的具体称谓。

Met 的模型来自古代物件本身的扫描。第六幕先出现的生成行列浮雕没有与该井栏共享物件身份。Met 公开下载政策参见 [馆方 3D 项目说明](https://www.metmuseum.org/press-releases/3-d-models-announcement-2026)。两件模型的下载地址、馆藏信息、尺寸、文件哈希与几何统计集中保存在 [MUSEUM_ASSETS.md](MUSEUM_ASSETS.md)，避免在多份清单中重复维护。

## 2. OpenAI ImageGen 图像

共有 **10 张生产图、1 张生产透明遮罩、2 张设计参考**。以下图像均为本项目生成的当代阐释作品；它们不是博物馆摄影、考古证据或可识别古代遗址的复原。匿名肖像不被标为 Augustus、Marcus Aurelius 或其他具体历史人物。

[AI_ASSETS.json](AI_ASSETS.json) 保存逐项生成提示、来源类别、历史身份说明、原生尺寸、字节数及 SHA-256。下表说明最终用途；宽屏展示尺寸不代表图像原生像素达到 4K。

| 文件 | 类别 / 原生尺寸 | 最终用途与身份 |
|---|---|---|
| `assets/hero.webp` | 生产图 · 1672 × 941 | 第一幕的匿名罗马题材巨型想象肖像。 |
| `assets/hero-cutout.webp` | 生产透明遮罩 · 1672 × 941 | 从选定生成巨像制作的透明前景，与实时 HTML 标题叠合；不是独立历史图像。 |
| `assets/stone-macro.webp` | 生产图 · 1672 × 941 | 第二幕的想象石材与眼部特写，不记录某件雕塑的颜料证据。 |
| `assets/portrait-experience.webp` | 生产图 · 1672 × 940 | 第三幕“Experience”匿名肖像研究。 |
| `assets/portrait-ideal.webp` | 生产图 · 1672 × 941 | 第三幕“Idealization”匿名肖像研究。 |
| `assets/body-reference.webp` | 生产图 · 1672 × 941 | 第四幕静态背景与模型加载时的备用图；虽然文件名含 reference，它是运行素材，且不是 SMK 翻模照片。 |
| `assets/monument.webp` | 生产图 · 1672 × 941 | 第五幕的想象雕像与建筑；不复原 Marcus Aurelius 骑马像或特定古代场所。 |
| `assets/relief.webp` | 生产图 · 1672 × 941 | 第六幕开场的想象行列浮雕，与随后显示的 Met 井栏是不同对象。 |
| `assets/fracture.webp` | 生产图 · 1672 × 941 | 第七幕的想象石雕残面与建筑碎片；不记录 Herakles 的历史损伤。 |
| `assets/afterlife.webp` | 生产图 · 1672 × 941 | 第八幕的想象展厅、躯干与手部残件；切换至 Inspect the cast 后才显示扫描衍生模型。 |
| `assets/final-gallery.webp` | 生产图 · 1672 × 941 | 第九幕的想象远景展厅与匿名胸像。 |
| `design/references/hero-selected.webp` | 设计参考 · 1672 × 941 | 开场构图与字像关系的选定设计参考；不是额外的生产页面。 |
| `design/references/material-and-light.webp` | 设计参考 · 1254 × 1254 | 材质、色调和光照方向的参考板。 |

图像清单记录其生成来源，不为这些作品另行声明 CC0 或其他开放许可。馆藏扫描的公共领域标记仅对应前述馆藏素材，不延伸到生成图像。UI 中的文字、按钮和导航由页面代码呈现。

## 3. 字体、软件与许可文本

| 组件 | 使用范围与版本 | 适用许可 / 随包文本 |
|---|---|---|
| Bodoni Moda | 标题字体；`@fontsource/bodoni-moda` 5.2.7。运行文件为本地常规体与斜体 WOFF2。 | SIL Open Font License 1.1；[bodoni-moda-OFL.txt](licenses/bodoni-moda-OFL.txt)。 |
| Manrope | 正文与控件；`@fontsource/manrope` 5.2.6。运行文件为本地 400、500 字重 WOFF2。 | SIL Open Font License 1.1；[manrope-OFL.txt](licenses/manrope-OFL.txt)。 |
| Three.js | Collection 三维渲染；0.186.1。原包为 0.180.0，原始版本记录保留在 provenance。 | MIT；[实际生产依赖清单](../third-party-licenses.md)。 |
| Vite | Collection 根构建工具 8.3.2。原包为 7.1.9，原始许可保留在 provenance。 | [实际生产依赖清单](../third-party-licenses.md)与根工具包许可；未部署原包构建工具。 |
| Draco | Met GLB 的本地网格解码器；含 WASM、包装脚本和 JavaScript 解码器。 | Apache License 2.0；[LICENSE.txt](models/draco/LICENSE.txt)与[README.md](models/draco/README.md)。 |

版本来自本项目的 `package.json` 与锁文件；许可文本来自对应随包依赖。自定义 HTML、CSS、JavaScript、SVG、研究文字和生成图像没有因使用这些组件而自动继承同一许可。本文件是逐项来源清单，不是为整个项目增加一份统一开放许可证。

## 4. 视觉解释的边界

古代石雕经常施彩。AETERNA 的象牙白材质与明暗关系是一种当代展览呈现；彩绘历史通过第二幕的文字注释讨论。当前交互没有色彩复原或颜料方案切换功能。相关依据见 [The Met 的罗马大理石彩绘研究](https://www.metmuseum.org/essays/polychromy-of-roman-marble-sculpture)。

所有运行图片、字体、模型和 Draco 解码器均随包本地提供。源文件经构建复制到 `dist/` 后，仍保持上述来源分类。博物馆名称用于标示研究和素材出处，不代表其参与制作或认可本展的艺术处理。

## Collection intake, 2026-10-07

The supplied generated images, fonts, museum-derived GLBs and local Draco files are imported unchanged. The original source/archive records remain under scoped provenance; old compiled output, nested manifests/lockfiles and startup tools are omitted. The Collection root dependencies build the source; no dependency update was made. The supplied custom code, prose and images do not declare an application-wide open-source license.

The public Manrope license contains the official 2018 Manrope Project Authors copyright and complete OFL, checked against [Google Fonts](https://github.com/google/fonts/blob/main/ofl/manrope/OFL.txt). The delivery supplied a generic Google Inc. header; that original remains in scoped provenance. Font binaries are unchanged.
