# VAREN

英文高端男装概念展示网站。暖调、当代建筑影像、现代字标、精细衬线排版，搭配 GSAP 与 Lenis 平滑滚动。

## 本地运行

推荐 Node.js 22.12 或更高版本。当前工作区已安装依赖。

```powershell
npm ci
npm run dev
```

打开终端显示的本地地址。也可双击 `Start VAREN.cmd`。

生产构建与预览：

```powershell
npm run typecheck
npm run build
npm run preview
```

必须通过本地服务器访问，不能直接双击 `index.html`。`dist/` 是已构建的静态网站；本次没有部署或发布。

## 已实现

- 六套造型，五种系列筛选，详情完整造型与近景切换。
- 本地收藏、空状态、存储不可用时的明确提示。
- 筛选与详情 URL、刷新恢复、浏览器前进与返回。
- 可键盘操作的原生对话框、焦点循环、Escape 关闭与焦点恢复。
- 桌面 Lenis 平滑滚轮、GSAP 单一 ticker、一处固定滚动章节。
- 手机原生触屏滚动、减少动态效果支持、无 JavaScript 基本内容。
- 本地字体、三档 WebP、延迟加载与稳定图片比例。

## 修改内容

- `src/data.ts`：商品名称、分类、文案、场合推荐。
- `src/components/`：页面区块与详情面板。
- `src/styles/tokens.css`：颜色、字体、尺寸与动效变量。
- `public/images/`：九张生产影像的 27 个 WebP 文件。
- `assets/originals/`：九张原始 PNG。
- `design/previews/`：六张设计参考。
- `design/asset-prompts.json`：每张图片的完整提示词与文件信息，全部使用内置 Imagegen 生成。
- `qa/`：最终截图、浏览器验收记录、滚动诊断轨迹和演示视频。

收藏使用浏览器本地键 `varen:saved:v1`，不会发送到服务器。

## 验收

生产版本完成 **42 项浏览器检查，42 PASS，0 FAIL**。覆盖 320、390、768、1280、1440、1920 像素宽度，未发现横向溢出；1280 × 800 首屏标题与主操作完整可见。

TypeScript 和生产构建通过。Impeccable detector 无发现。Hallmark 静态检查 0 FAIL、0 WARN，3 个短引导文案宽度提示按单句 lede 的合法例外明确豁免；影像占比豁免已记录。

Hallmark 自带渲染层因本机缺少 puppeteer-core 未运行；实际视觉与交互检查使用已安装的 Playwright / Chromium 1248 完成，没有为检查新增项目依赖。模拟连续滚动未记录到长任务，单一 Lenis ticker 和单一 ScrollTrigger 在反复开关菜单后保持稳定。无头浏览器帧间隔不代表真实显示器 FPS；未将模拟输入当作实体触控板或真实手机验收。

完整边界见 `qa/VERIFICATION.md`。

## 素材与字体

VAREN 是本项目的原创概念名称。所有服装影像是 AI 概念图，不代表在售商品；页面不包含虚构价格、品牌历史、认证或客户评价。

Sentient 来自 [Fontshare](https://www.fontshare.com/fonts/sentient)，Hanken Grotesk 来自 [Google Fonts](https://fonts.google.com/specimen/Hanken+Grotesk)。字体许可随文件保存在 `public/fonts/`。
