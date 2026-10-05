# F1 / Beyond the Limit — 速度之外

An immersive, cinematic Formula 1 educational experience built around scroll-driven storytelling.

在线体验：[F1 / Beyond the Limit](https://seiya058904.github.io/f1-beyond-the-limit/)

面向普通观众的中文 F1 科普展示站。以摄影棚、风洞、动力实验室和赛道为场景，将空气动力学、能量回收、轮胎与比赛策略变成可以操作的解释。当前视觉、交互与章节交接已通过用户真人验收，作为正式项目基线保存。

## 体验与章节

- **开场与引言**：分层赛车影像、巨幅字体和完整观看窗口，建立滚动叙事。
- **空气动力学**：部件热点、Canvas 气流、速度滑块、弯道 / 直道模式。
- **动力**：回收 / 释放控制、能量轨迹与电池示意。
- **轮胎**：软 / 中 / 硬配方及抓地力、耐久性和身体负荷解释。
- **比赛**：常规 / 冲刺周末、键盘比赛日标签和 52 圈一停策略模型。
- **赛道与尾章**：蒙扎、铃鹿、摩纳哥的真实轮廓、可暂停路线演示与资料出处。

本项目独立、非官方。图像为 AI 生成的概念插画；模型、性能条和能量轨迹是教学示意，不是车队实测、遥测或真实策略承诺。内容按 2026 技术方向与赛制编写，资料核查基准为 2026-10-04，出处可在网站页脚访问。

## 安装与运行

建议使用 **Node.js 24 LTS / npm**（本地验证环境为 Node 24.15.0、npm 11.12.1）。图片、字体和赛道数据已包含在仓库中，无需素材服务、后台、账户或 API 密钥。

```sh
npm ci
npm run dev
```

开发地址：`http://127.0.0.1:5173`。

```sh
npm test                 # 七项模型测试
npm run build            # TypeScript 检查 + Vite production build
npm run verify           # 顺序执行 test 和 build
npm run preview -- --port 4174 --strictPort
```

生产预览：`http://127.0.0.1:4174`。默认开发与构建保留站点根路径；`dist/` 可交给静态服务器。

### GitHub Pages

`.github/workflows/pages.yml` 在推送 `main` 或手动运行时安装锁定依赖、执行七项测试，再按 Pages 返回的部署路径进行类型检查与构建。只有构建成功后才发布 `dist/`，包括两份许可文本；不提交构建产物或另建发布分支。

本地检查同样的项目子路径：

```sh
npm run build -- --base=/f1-beyond-the-limit/
npm run preview -- --port 4175 --strictPort --base=/f1-beyond-the-limit/
```

访问 `http://127.0.0.1:4175/f1-beyond-the-limit/`，检查图片、字体、交互和页脚许可链接。资源路径由 Vite 处理，许可链接使用 `%BASE_URL%`；子路径部署不改变视觉、滚动时钟或章节交接。

## 技术与结构

Vite 8、TypeScript 5.9、原生 HTML / CSS、Lenis 1.3.26、GSAP 3.15 / ScrollTrigger，以及轻量 SVG / Canvas；没有组件框架、WebGL 或视频运行时。

| 位置 | 职责 |
| --- | --- |
| `index.html`、`src/styles.css` | 语义章节、视觉语言、响应式与交互状态 |
| `src/main.ts` | 初始化、资源就绪与 HMR 清理 |
| `src/motion.ts` | 单一 Lenis / GSAP 时钟、空闲几何刷新、导航、动效偏好与生命周期 |
| `src/choreography.ts` | 内容测量、Enter → Hold → Exit 与可逆章节交接 |
| `src/interactions.ts`、`src/models.ts` | 科普控制、可见场景循环与纯计算模型 |
| `tests/models.test.mjs` | 七项空气动力、策略和地图投影测试 |
| `vite.config.ts` | 保留上游许可注释并生成构建依赖许可清单 |
| `public/`、`assets/` | 正式资源、许可文本、生产原图、提示词与来源记录 |
| `DESIGN.md`、`SCROLL-AUDIT.md`、`AGENTS.md` | 设计约束、滚动审计与后续维护指南 |

一个 GSAP ticker 驱动 Lenis 与可见场景；ScrollTrigger 直接 scrub，不叠加延迟。图片、字体、尺寸和说明展开引起的刷新合并到滚动停止后的几何检查点，避免尺寸更新截断惯性目标。实例销毁会清理监听器、观察器、ticker、场景与交互动画。

章节采用 **Enter → Hold → Exit**：桌面引言与五个主章节按内容、视口和控制项测量 sticky 阅读窗口，入场和转场使用独立 progress。下一章节在文档流中接入，背景层位于正文下方；正反向经过同一时间轴。手机采用独立构图与自然流阅读，不固定正文。气流、能量与赛道持续运动离屏暂停，Canvas 限制为 1.5 DPR / 300 万像素，路径使用缓存几何。

## 浏览器验收

CI 执行 `npm ci` 和 `npm run verify`。没有独立 lint 配置或自动浏览器测试脚本；类型检查由 build 完成，浏览器验收需另行执行。

使用生产预览，逐章正向 / 反向滚动并在 Enter、Hold、Exit 停止。检查气动滑块与模式、热点说明、能量控制、轮胎选择、比赛日键盘标签、进站滑块、赛道选择 / 暂停、导航、资料展开和动效开关；同时检查控制台、失败资源和横向溢出。建议覆盖 390×844、768×1024、1440×900、2560×1440、3840×2160。动效改动的复现检查点见 [SCROLL-AUDIT.md](SCROLL-AUDIT.md)。

手机在 760px 及以下使用专门适配，触摸保留浏览器原生惯性。支持 `prefers-reduced-motion` 和页眉动效开关；减少运动时科普控制仍可用。当前自动检查与截图基于 Chromium，不能推导所有浏览器或实际设备表现。

**仍需实机验证**：iOS Safari、真实触屏 / 触控板动量、手机旋转、真实后台页恢复，以及 120 / 144 Hz 显示节奏。视口模拟、合成事件与 rAF 回调采样不等同于这些实机验收；用户的真人验收不被扩展解释为全部环境已验证。

## 素材与许可

自有代码、文案、设计与原创素材**保留版权**，见 [LICENSE](LICENSE)。公开可浏览不等于授予宽松开源许可；字体、赛道与依赖适用各自条款，详见 [ATTRIBUTION.md](ATTRIBUTION.md) 与 [public/licenses.txt](public/licenses.txt)。

生产构建保留上游许可注释，并额外生成 `dist/third-party-licenses.md`；发布静态产物时一并保留这份清单与 `licenses.txt`。

生产插画原图与生成提示词保留在 `assets/`。历史概念图含第三方标识，留在本地而不随公开仓库分发。赛道来自 Tomislav Bacinger 的 MIT [f1-circuits](https://github.com/bacinger/f1-circuits)；Noto Sans SC 与 Barlow Condensed 为 SIL OFL 1.1，Lenis 为 MIT，GSAP 为 Standard No-Charge License。

`scripts/prepare-data.mjs` 会访问上游并重新生成赛道、中文字体子集与来源记录；`scripts/prepare-assets.mjs` 用于导入原始生成输出和制作 WebP。日常安装、测试、构建不需要运行这些脚本。修改文案或素材时应有意审查再生结果，避免覆盖已验收资源。
