# FERRUM — 设计参考与生成记录

本目录保留六张最初的场景概念定帧、实际采用的两张材质细节贴图的精确生成提示词，以及可随源码 ZIP 搬移的来源元数据。

| 内容 | 文件 |
| --- | --- |
| 实施采用的 Experience 方向约定 | [SURFACE-BRIEF.md](SURFACE-BRIEF.md) |
| 六幕概念图 | `concepts/00-prologue.png` 至 `concepts/05-relic.png` |
| 六条概念图原始提示词 | [concept-prompts.json](concept-prompts.json) |
| 概念图来源 ID、尺寸、字节与 SHA-256 | [concept-metadata.json](concept-metadata.json) |
| 两条实际材质贴图原始提示词 | [texture-prompts.json](texture-prompts.json) |
| 贴图来源 ID、实测信息与限制 | [texture-metadata.json](texture-metadata.json) |
| 原始材质 PNG | `textures/originals/forged-steel.png`、`textures/originals/polished-steel.png` |
| 发布 WebP 转码参数与误差记录 | [texture-encoding.json](texture-encoding.json) |
| 12 张正式定帧的浏览器、状态与 SHA 来源链 | [still-render-origin.json](still-render-origin.json) |
| 参考图与正式实现的关系 | [REFERENCE-NOTES.md](REFERENCE-NOTES.md) |

12 张正式场景定帧另由项目的 `scripts/render-stills.mjs` 与 `scripts/encode-stills.py` 产生，桌面与竖屏各六张。`still-render-origin.json` 保留实际浏览器、叙事状态、代码及贴图 SHA、源 PNG 与发布 WebP SHA；[完整资产清单](../ASSET-INVENTORY.md) 列出全部发布文件。它们与六张概念图是不同来源。

元数据中的 `path` 和 `promptFile` 均以 **项目根目录** 为基准；它们不依赖生成机器的目录。`generator.sourceId` 为生成工具返回的原始图像文件名去掉扩展名，`sourceIdBasis` 明确记录这一来源。没有把推断出的编号冒充额外的服务端任务信息。

六张概念图是构思记录，**不会作为网站背景加载**。原图中的文字、几何细节和局部光色可能与最终实现不同；当前设计 token 以根目录 [DESIGN.md](../../DESIGN.md) 为准。材质原始 PNG 保留于本目录供源码复核；网站加载 `assets/textures/` 下的 WebP 编码衍生文件。

所有原始生成 PNG 都保持工具输出的字节内容，未放大、重新绘制或伪造更高分辨率。两张材质 WebP 使用 Pillow quality 96、method 6 编码，保持尺寸与构图，存在记录在案的有损编码误差。生产资产来源、许可与逐项 SHA 见 [ASSET-PROVENANCE.md](../ASSET-PROVENANCE.md) 和 [asset-manifest.json](../asset-manifest.json)。
