# AETERNA

Historical standalone delivery record. Paths and verification claims describe the original package. Current Collection evidence is in [intake acceptance](ACCEPTANCE.md).

## Rome in Marble and Memory · 罗马：大理石与记忆

AETERNA 是一场由九幕组成的本地数字雕塑展。原生页面滚动串联巨像、石材、肖像、身体、纪念碑、浮雕、断裂与博物馆中的再生；真实馆藏扫描与当代生成图像共同承担不同的叙事角色。界面与展览正文使用英文，本说明以中文介绍启动方法、实际控件和素材来源。

交付内容是完整 ZIP，包含可直接运行的预构建 `dist/`、源代码、图片、字体、模型及来源文档。展览通过本机地址访问，无需部署或在线托管。

## 直接观看

先安装 **Node.js 20.19 或更高版本**，然后完整解压 ZIP。预构建展览使用 Node 自带的本地服务器，**不需要执行 `npm install` 或 `npm ci`**。

### Windows

1. 打开解压后的 `AETERNA` 文件夹。
2. 双击 **`START-WINDOWS.bat`**。
3. 默认浏览器会打开 [http://127.0.0.1:4173](http://127.0.0.1:4173)。若没有自动打开，手动访问终端显示的地址即可。

### macOS / Linux

在终端进入解压后的 `AETERNA` 文件夹，执行：

```bash
bash START-MAC-LINUX.sh
```

脚本会启动本地服务器，并尝试在默认浏览器打开展览。也可以在任一平台直接执行：

```bash
node scripts/serve.mjs --open
```

观看时请保持启动窗口打开；结束后在该窗口按 `Ctrl+C` 停止服务器。服务仅监听本机 `127.0.0.1`。请使用启动脚本提供的 HTTP 地址，直接双击 `dist/index.html` 会受到浏览器对本地模块、模型和解码器加载的限制。

若默认端口被占用，可在项目文件夹运行：

```bash
node scripts/serve.mjs --open --port 4174
```

## 九幕与控件

滚轮、触控板和触屏使用浏览器原生滚动。顶部 **Index** 可跳转到任一幕；桌面底部的 I–IX 导航也可直接跳转，窄屏底部的章节名称可打开目录。右下角按钮依次显示 **Scroll to enter**、**Next room**，最后一幕变为 **Begin again**。

| 幕 | 章节 | 可操作内容 |
|---|---|---|
| I | **The Colossus** · 巨像 | 滚动进入展览；巨型想象肖像与实时文字构成开场。 |
| II | **Stone Becomes Flesh** · 石成为肉身 | **Look closer** 放大石材局部，**Return to surface** 返回；**And before the white?** 打开古代彩绘的文字说明。 |
| III | **The Face of Power** · 权力的面孔 | **Experience / Idealization** 切换两幅匿名想象肖像及其说明；**Portraits and power** 展开研究注释。 |
| IV | **Body / Authority** · 身体与权威 | **Reassemble the figure** 滑杆将 36 块三维分片从离散状态重新组合；**About this sculpture** 查看翻模来源。 |
| V | **Monument** · 纪念碑 | 随滚动进入想象中的纪念性空间；**The monumental image** 打开有关公共形象的说明。 |
| VI | **History Carved in Stone** · 刻入石中的历史 | **Explore the relief** 从 Surface 推进到 Space，以视角变化观察真实井栏模型；**The stories on this object** 说明井栏上的神话。 |
| VII | **Fracture** · 断裂 | **Separate the fragments** 控制同一 Herakles 模型的 36 块分片散开；**What a fragment remembers** 解释遗存与修复。 |
| VIII | **Afterlife** · 再生 | **Inspect the cast** 从想象展厅切换到扫描衍生模型；**Move the museum light** 调整灯光方向，移动指针可轻微改变视角；**Return to the gallery** 返回展厅。 |
| IX | **Aeterna** · 永存 | **Sources & acknowledgements** 打开来源、馆藏信息和说明；**Begin again** 返回开场。 |

身体、浮雕和断裂章节默认随滚动推进。手动调整其滑杆后，**Follow the scroll** 可恢复滚动控制。浮雕滑杆改变观看方式与镜头位置，不改变古代物件本身的雕刻深度。展厅查看提供有限的视角变化，并非自由旋转的完整模型编辑器。

在手机上，部分来源按钮简写为 **Details**，打开的仍是相应章节的完整说明。模型、标题、说明和控制区按可用高度重新分区。

**Index → Reduce motion** 可减少动态，也会在未作手动选择时遵循设备的减少动态偏好。该模式使用更稳定的构图，保留章节导航、研究说明及手动滑杆。按钮和滑杆可通过键盘聚焦，范围滑杆可使用方向键调整，弹窗可按 `Esc` 关闭。

## 如何理解展览中的图像与物件

**古代石雕经常施彩。** 本展的象牙白视觉语言取自今日观看遗存的经验，不能代表其完整古代外观。相关历史放在第二幕的 **Ancient colour** 说明中；当前版本没有彩绘复原或配色控制器。研究依据见 [The Met — Polychromy of Roman Marble Sculpture](https://www.metmuseum.org/essays/polychromy-of-roman-marble-sculpture)。

两件三维素材有明确馆藏来源：

- **Lansdowne Herakles：**来自 SMK 皇家翻模收藏的后期石膏翻模扫描，馆藏号 KAS224，翻模于 1897 年入藏。它依据约公元 125 年的罗马大理石像制作；本展没有直接扫描古罗马原件。36 块分片、简化网格、新增断面、材质与灯光是数字艺术处理，不能作为历史破损或修复过程的证据。参见 [SMK 馆藏记录](https://open.smk.dk/en/artwork/image/KAS224)。
- **Roman wellhead：**来自大都会艺术博物馆真实公元二世纪罗马大理石井栏的扫描，馆藏号 2019.7。第六幕开场的生成浮雕与随后出现的井栏是两个不同对象，通过“石面上的叙事”相连。参见 [The Met 馆藏记录](https://www.metmuseum.org/art/collection/search/775805)。

其余生产图片是为本项目生成的罗马题材想象图像，包括匿名肖像、纪念性建筑、浮雕、断片及展厅。它们不是馆藏照片或史实复原，也不对应某位已识别的皇帝。身体章节的静态备用图同样是生成图像；当模型加载完成后，真实翻模扫描的衍生几何承担交互展示。

详细分类、授权和技术处理分别见 [素材总表](docs/ASSET_PROVENANCE.md)、[博物馆模型记录](docs/MUSEUM_ASSETS.md) 与 [策展研究](docs/CURATORIAL_NOTES.md)。

## 本地运行范围

展览所需的图片、字体、模型和 Draco 解码器均随文件包提供。安装好 Node 后，观看预构建展览不需要再下载 npm 依赖或访问模型 CDN；点击博物馆来源链接时会打开外部网站。开发时安装依赖则需要能够访问 npm 软件源。

三维章节需要浏览器可用的图形能力。若出现模型加载提示或错误，请先确认完整解压了 `dist/` 并通过本地服务器访问；相关模型控件会在准备好后启用。静态图像和文字仍承担展览叙事。

## 开发与构建

源代码使用 Vite 和 Three.js。当前锁定的 Vite 7.1.9 要求 **Node 20.19+ 的 20.x 分支，或 Node 22.12 及以上**。在项目根目录执行：

```bash
npm ci
npm run dev
```

开发服务器的具体地址显示在终端中。修改完成后生成新的预构建展览：

```bash
npm run build
```

构建输出位于 `dist/`。随后可用前述启动脚本，或以下命令观看该构建：

```bash
npm start
```

| 路径 | 内容 |
|---|---|
| `dist/` | 随 ZIP 提供的预构建展览；本地启动脚本读取此目录。 |
| `index.html`、`src/` | 九幕页面、样式、原生滚动、交互、三维场景和研究数据。 |
| `public/assets/`、`public/fonts/`、`public/models/` | 构建时原样复制的图片、字体、模型及本地解码器。 |
| `design/` | 视觉规范和选定的生成设计参考。 |
| `docs/` | 策展说明、素材来源、生成图像清单及第三方许可文本。 |
| `DESIGN.md`、`.impeccable/design.json` | 可继续维护的视觉系统、设计标记和组件约定。 |
| `scripts/serve.mjs`、`START-WINDOWS.bat`、`START-MAC-LINUX.sh` | 仅在本机运行的启动方式。 |
| `SHA256SUMS.txt` | 除清单自身以外，随包每个文件的 SHA-256 校验值；路径相对于 `AETERNA` 文件夹。 |

## 交付验证

已在本地 Chromium 中检查九幕展览、4K 静态首屏、手机重排、慢速及快速往返滚动、停留与刷新、缩放窗口、页面恢复、减少动态和图形故障回退。具体视口、功能检查、视觉参考对照及测试范围限制见 [VERIFICATION.md](docs/VERIFICATION.md)。

## 授权范围

素材与依赖各自保留原有权利标记：SMK 翻模为 **Public Domain Mark 1.0**，Met 井栏为 **CC0**；字体、Three.js、Vite 和 Draco 使用各自许可。具体对应及随包许可文件见 [ASSET_PROVENANCE.md](docs/ASSET_PROVENANCE.md)。这些标记不自动适用于本项目的自定义代码、策展文字或生成图像；本包没有将整个项目统一声明为 MIT、CC0 或其他单一开放许可。博物馆名称用于说明来源，不表示其为 AETERNA 背书。
