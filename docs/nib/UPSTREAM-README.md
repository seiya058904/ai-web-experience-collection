# NIB — Ink Under Pressure

**Hold the ink. Balance the air. Draw the line.**

一个仅在本地运行的沉浸式网页作品：沿着储存的墨水，经过供墨结构、回流空气、笔尖狭缝与弯月面，触及纸张纤维，最终成为一条受控制的线。界面叙事使用英文；本说明以中文为主。项目制作与研究记录日期：**2026-10-07**。

## 立即运行

需要 **Node.js 20 或更高版本**，以及支持 ES modules、Canvas 2D、WebP 和原生 `<dialog>` 的现代浏览器。字体、图像、Lenis 和 GSAP 均已保存在项目内；**无需 `npm install`**。

解压 ZIP 后，在包含 `package.json` 的 `NIB` 文件夹中打开终端：

```bash
cd NIB
npm start
```

在浏览器打开 **http://127.0.0.1:4173**。若终端已经位于 `NIB` 内，直接执行 `npm start`。服务器默认只监听本机回环地址；不会自动打开浏览器。按 **Ctrl+C** 停止。

`npm start` 直接提供源码目录，无需先构建。修改源文件后刷新页面即可看到变化。完整沉浸体验通过本地 HTTP 访问；直接双击 `index.html` 不是运行 ES module 应用的方式。项目没有运行时 CDN、分析服务、账户或后端依赖。Colophon 内的参考文献链接仅在主动点击时访问外部网站。

## 检查、构建与预览

| 命令 | 作用 |
| --- | --- |
| `npm start` | 从源码目录启动本地预览，默认端口 4173。 |
| `npm run dev` | 与 `npm start` 相同。 |
| `npm run check` | 检查 JavaScript 语法、本地资源引用、资源路径与第三方文件校验值。 |
| `npm run build` | 将运行所需的 HTML、`src/` 与 `public/` 复制到干净的 `dist/`。 |
| `npm run preview` | 从已经构建的 `dist/` 启动本地预览，默认端口 4173。 |
| `npm run check -- --dist` | 检查构建产物及其本地依赖。 |

构建使用 Node.js 内置模块，不下载依赖，也不改变素材内容。它会替换项目内已有的 `dist/`，并为同一份输入生成可重复的运行文件树。先停止源码服务器，再使用同一默认端口进行生产预览：

```bash
npm run check
npm run build
npm run check -- --dist
npm run preview
```

若需同时保留源码预览，可另用一个本机端口：

```bash
npm run preview -- --port 4174
```

相应地址为 http://127.0.0.1:4174。也可以直接执行 `node scripts/serve.mjs`、`node scripts/build.mjs` 和 `node scripts/check.mjs`。查看服务器参数：`node scripts/serve.mjs --help`。

**交付范围仅为本地开发、预览、构建和检查。** 本项目未部署到任何公开网站，也未配置 Sites、GitHub Pages、Vercel、Netlify 或 Cloudflare Pages。

## 如何观看

用滚轮、触控板、触摸或键盘滚动浏览十幕：**Metal → Reservoir → Feed → Balance → Slit → Meniscus → Contact → Absorb → Write → Trace**。每幕可以停留观察，也可反向返回。细小章节刻度与 **The journey** 目录都能直接跳转；**Begin again** 返回开场。

**The journey → Colophon → Read the narrative** 切换为连续阅读视图；同一位置的 **Return to the film** 返回影像。阅读视图保留完整叙事并停止画布重绘。对话框可用关闭按钮或 Escape 关闭，链接和按钮支持键盘焦点。JavaScript 不可用或初始化失败时，语义化正文仍然可读。

系统启用“减少动态效果”时，网站响应 `prefers-reduced-motion: reduce`：使用每章完成的静态构图，冻结环境反光与流体微动，取消镜头过渡，章节跳转即时完成。偏好在页面打开期间变更也会生效。正常模式和阅读模式均保存语义化章节位置，以支持刷新、历史返回和标签页恢复；具体浏览器验证范围与限制见 [验收记录](docs/QA.md)。

## 实现结构

整个体验由一个 Canvas 2D 合成器与独立的 HTML 排版构成。AI 图像提供金属、漆面、液体反射与纸纤维的照片质感；墨水路线、空气补偿、弯月面、液桥、吸收分支、书写路径和干燥反光由代码构造。Visual Bible 中的文字仅属于设计参考，运行页面的标题与控制是可访问的 HTML。

Meniscus → Contact 通过液面尺度交接：镜头沿轴向进入附着墨滴，让同一液体反光材质充满视野，再拉回侧面笔尖。这个侧面姿态以同一笔尖锚点延续到接触、书写和离纸；纸面保持固定，漆面裁切边缘由原图取样延伸。纸纤维中的局部染色和微细路径依据材质取样生成，较高的纤维纹理局部遮挡湿墨，形成受控制的吸收边缘。它们是图像与实时几何的组合，不是重建的三维模型。

| 文件或目录 | 职责 |
| --- | --- |
| `index.html` | 十章语义正文、章节目录、Colophon、阅读入口。 |
| `src/main.js` | 资源就绪、唯一 Lenis 实例、唯一 GSAP ticker、输入、响应式尺寸、恢复与阅读状态。 |
| `src/renderer.js` | 画布合成、金属与狭缝、弯月面、材质过渡和共享 Ink Line。 |
| `src/fluid-scenes.js` | 储墨器液面、供墨通道与缓冲槽、墨水／空气反向交换。 |
| `src/paper-scenes.js` | 笔尖接触、纸纤维、吸收、同一条书写路径与湿墨到干痕。 |
| `src/math.js` / `src/styles.css` | 章节和数学工具／排版、移动端构图、阅读与减少动态效果样式。 |
| `public/assets/` | 11 个正式 WebP 素材。 |
| `artwork/originals/` | 对应的 11 个最终生成 PNG 原件，保留原始 alpha 与构图。 |
| `docs/visual-bible/` | 11 张策划阶段精选 PNG，包含移动端独立构图。 |
| `public/vendor/` / `public/fonts/` | 本地运行库与字体。 |
| `scripts/` | 不依赖外部包的本地服务器、构建及静态检查。 |
| `licenses/` | 第三方许可原文、来源、版本与 SHA256 清单。 |

### 时钟、几何与性能

`src/main.js` 的 GSAP ticker 是唯一动画时钟：每帧先推进 Lenis，再读取同一滚动位置更新几何与 HTML。Lenis 的 `autoRaf` 和 `autoResize` 关闭，场景模块不创建自己的动画循环。章节进度决定构图与材料状态，环境时间只控制克制的表面变化。

几何参数直接位于源代码：`src/fluid-scenes.js` 的通道、液面、槽距和空气入流函数；`src/paper-scenes.js` 的 `_point()`、`_camera()`、`_drawn()`、`_stroke()` 和 `_bridge()`；`src/renderer.js` 的金属、狭缝与弯月面构图。没有另需下载的三维模型或纹理库。纸面分支由固定种子构造，缩放和反向滚动读取同一世界状态。

移动端重新安排文字与物体位置，减少缓冲槽、纸面纤维和反射细节。画布按视口面积与设备像素比设上限；只绘制当前场景及必要过渡，离屏材质重复利用。隐藏标签页、阅读视图和不透明对话框会暂停不必要的画布重绘。详细参数以交付源码为准。

## 机制与解释边界

这里选取的是传统开缝笔尖、供墨结构、含水染料墨水和书写纸的定性系统。供墨由毛细作用、压力差、润湿条件与纸张吸收共同维持；替代空气间歇进入，横向细槽缓冲过量墨水。它不是只靠重力向下滴落的路径，也没有把每个鳍片当作串联供墨管。

画面放大了附着的弯月面与纤维尺度；气泡频率、渠道宽度、可见速度与干燥时间服务于观察，不代表测得的尺寸、压力或流量。吸收与蒸发会重叠发生，最终哑光是本作品选择的墨水／纸张结果。滚动反向恢复的是可逆的视觉状态，并不宣称真实吸收和干燥会自发倒转。它不执行分子模拟或经过校准的计算流体力学求解。

科学依据与可解释范围详见 [研究记录](docs/RESEARCH.md) 和 [机制说明](docs/MECHANISM.md)。视觉取舍见 [Visual Bible](docs/VISUAL-BIBLE.md)。最终可复用的排版、颜色、布局与交互规则见 [DESIGN.md](DESIGN.md)，独立视觉复核结论见 [FINISH-REVIEW.md](docs/FINISH-REVIEW.md)。

## 素材、权利与完整性

全部生产摄影质感素材和 Visual Bible 图像均在本会话中使用 AI 图像生成工具创作、筛选和精修；没有借用图库照片、第三方纹理包或三维模型。研究网站用于参考，没有将其照片或图表装入交付包。

[素材来源说明](docs/ASSET-PROVENANCE.md) 解释 11 组 PNG／WebP 的职责和生成链；[机器可读来源清单](docs/PROVENANCE.json) 保存全长 SHA256、尺寸、字节数、保留的完整提示词及明确标记的记录缺口。WebP 导出使用质量 94、alphaQuality 100，并保持原件尺寸。图片内没有可恢复的提示词元数据；未保留的提示词不作补写。

原创项目成果作为用户的项目材料交付，**本包未为原创内容另行授予许可证**。Lenis 使用 MIT；两种字体使用 SIL Open Font License 1.1；**GSAP 使用其专有 Standard “No Charge” License**，不归入 MIT 或 OFL。保留的许可文件与归属详见 [ATTRIBUTION.md](ATTRIBUTION.md) 和 [第三方清单](licenses/vendor-manifest.json)。

项目根目录的 `SHA256SUMS` 覆盖 ZIP 内除校验文件本身之外的全部文件。可在 `NIB` 内运行 `sha256sum -c SHA256SUMS`（macOS 可用 `shasum -a 256 -c SHA256SUMS`）验证解压文件。构建生成的 `dist/` 不属于交付校验清单。

## English quick start

Install **Node.js 20+**, extract the ZIP, and open a terminal in the `NIB` directory. **No `npm install` is needed.** Run `npm start`, then open **http://127.0.0.1:4173**. Source files are served immediately; edit and refresh. Stop with Ctrl+C.

Run `npm run check` for local reference, syntax and vendor integrity checks. Run `npm run build` to recreate `dist/`, then `npm run preview` for the local production preview. Use `npm run preview -- --port 4174` if the source server is still running. Run `npm run check -- --dist` to check the production tree.

Scroll through the ten chapters, or use **The journey**. Open **Colophon → Read the narrative** for the reading view. The experience honors the operating system's reduced-motion preference. All runtime images, libraries and fonts are local. This delivery has **no public deployment**. Original project work receives no additional license here; preserved third-party licenses apply to their identified files.
