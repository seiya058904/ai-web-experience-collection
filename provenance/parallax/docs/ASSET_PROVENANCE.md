# 素材来源与模型说明

本包包含 **13 张选定参考图、4 张正式 PNG 素材、1 个原创 SVG 标记、3 个本地字体文件**，以及实际使用的 Three.js 模块。完整清单、尺寸、SHA-256、精确生成提示词、生成记录 ID 和输入关系见 [assets/provenance.json](../assets/provenance.json)。所有路径以解压后的项目根目录为基准。

清单只计入源文件；`dist/` 中的同名运行副本不重复计数。未选中的方案和被替换的中间图没有随包交付。记录中保留的中间生成 ID 仅用于说明所选成品的修订来源。

## AI 与实时实现分别承担什么

AI 先用于确定艺术方向：主雕塑、首页构图、材质、十章目标画面、裂隙阶段和手机布局。所选参考图保存在 `reference/`，它们是设计目标，不是实际网页运行截图。参考图中的文字最终由真正的 DOM 文字与界面控件实现。

正式页面直接使用以下四张生成素材：

| 文件 | 用途 | 源尺寸 |
|---|---|---:|
| `public/assets/hero-form.png` | 雕塑前景抠图，用于开场分层构图及图形降级呈现；外部和中空窗口具有真实 alpha。 | 1024 × 1536 |
| `public/assets/gallery-ivory.png` | 空白象牙色画廊背景，与作品和文字分层。 | 1672 × 941 |
| `public/assets/gallery-museum.png` | 终章建筑背景与裂隙远景投影；局部石灰岩画面通过独立 UV 取样范围，复用为真实裂隙立柱的颜色、轻微凹凸和纹理补光，未生成额外位图。 | 1672 × 941 |
| `public/assets/basalt.png` | 实时几何使用的黑石颜色纹理。 | 1254 × 1254 |

会移动的碎片、特定视点下的对齐、镜面反射、裂隙中的深度、薄膜折射、光色变化和重组，由 `src/` 内的几何、材质、相机及 shader 代码实现。模型没有借用外部扫描或现成 CAD；它以选定图像作为艺术指导，通过原创参数与网格生成。

图片提示词和生成 ID 记录了来源，但重新生成不保证得到相同像素。四张生产 PNG 与所选生成原件的哈希一致。原生文字和实时几何可以按浏览器分辨率绘制；上述图片自身的尺寸保持如表所示。

## 选定的参考图

| 路径 | 设计用途 |
|---|---|
| `reference/01-object.png` | 选定的象牙色画廊首页。 |
| `reference/02-fragment.png` | 雕塑分离与切面关系。 |
| `reference/03-alignment.png` | 特定视点的轮廓重合。 |
| `reference/04-reflection.png` | 物体与镜面的构图。 |
| `reference/05-rift.png` | 切口转化为空间。 |
| `reference/06-membrane.png` | 薄膜与后方结构的视觉关系。 |
| `reference/07-chroma.png` | 收敛到切面与边缘的颜色。 |
| `reference/08-halo.png` | 接近消失的黑色体量与细光边界。 |
| `reference/09-reassembly.png` | 重组后的相同雕塑。 |
| `reference/10-museum.png` | 巨型空间中的单一对象。 |
| `reference/material-board.png` | 材质与光的选定研究。 |
| `reference/rift-study.png` | CLOSED、HALF OPEN、INSIDE、BEYOND 四阶段。 |
| `reference/mobile-object.png` | 独立手机首页构图，853 × 1844。 |

`public/assets/mark.svg` 是为 PARALLAX 编写的原创线形门框标记。

## 字体与渲染依赖

| 依赖 | 本包内容与已核实版本 | 来源与许可证 |
|---|---|---|
| Three.js | 本地源码可直接确认 **r186**；包含 module、core、Reflector。原始 npm 包清单未保留，故不推断补丁版本。 | [官方项目](https://github.com/mrdoob/three.js) · [随包 MIT 许可证](../licenses/THREE-LICENSE.txt) |
| Bodoni Moda | Fontsource **5.2.7**；Latin、400、normal。 | [Fontsource](https://fontsource.org/fonts/bodoni-moda) · [字体上游](https://github.com/indestructible-type/Bodoni) · [随包 OFL 1.1](../licenses/BODONI-MODA-LICENSE.txt) |
| Manrope | Fontsource **5.2.6**；Latin、400 / 500、normal。 | [Fontsource](https://fontsource.org/fonts/manrope) · [字体上游](https://github.com/sharanda/manrope) · [随包 OFL 1.1](../licenses/MANROPE-LICENSE.txt) |

三款 WOFF2 均与相应 Fontsource 包中的文件哈希一致。Fontsource 包的来源库为 [fontsource/font-files](https://github.com/fontsource/font-files)，目录分别为 `fonts/google/bodoni-moda` 和 `fonts/google/manrope`。所有运行依赖与字体已本地化；表内链接只用于查阅来源，运行页面无需访问它们。

## 可复用雕塑模型

[models/impossible-form.glb](../models/impossible-form.glb) 是标准 **glTF 2.0 二进制模型**，可作为一个独立文件导入支持 GLB 的 3D 工具。文件内嵌黑石纹理，保留 18 个有名称的结构部件、法线、纹理映射、PBR 材质以及附着在所属部件上的细光切口。UV 的 V 方向按 glTF 约定转换，保持原有可见映射。坐标采用 Y 轴向上，导出状态为完整组装的原始姿态。

[models/impossible-form.json](../models/impossible-form.json) 保存主轮廓、部件规格、名称、射线缩放参数、材质记录、导出哈希和模型源码哈希。重新生成模型只需 Node 20+：

```sh
node scripts/export-model.mjs
```

等效命令为 `npm run export:model`。导出器直接调用当前 `src/model.js`，只使用随包 Three.js 与 Node 自带功能，不需要浏览器、GPU、额外插件或依赖安装。

GLB 保存可复用的静态主模型；章节时序、镜面渲染、薄膜折射、环境布光、边界光辅助对象与高度凹凸着色仍由网站源码负责。GLB 没有把这些实时过程伪装成静态模型的固有能力。

## Focused source checks

`npm test` 运行无依赖的 Node 测试，覆盖桌面与手机相机的射线投影不变量、改变视点后显现的深度差、十章可达性、逆向滚动的一致性、减少动态效果的完整章节姿态，以及无效滚动值的边界处理。完整网页的浏览器验收状态由 README 的最终验证部分记录。
