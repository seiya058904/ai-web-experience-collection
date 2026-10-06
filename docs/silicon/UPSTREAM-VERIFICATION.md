> Preserved upstream delivery record. Its original paths, commands, versions and validation claims describe the standalone ZIP; see `ACCEPTANCE.md` for Collection verification.

# Verification / 验收记录

验收日期：2026-10-06。交付包含完整源码和一份当前 production build。

## 构建与本地运行

`npm run build` 已完成 TypeScript 检查和 Vite production build。最后一次构建包含页眉的原创 SVG 展开图标；场景、材质与滚动模块沿用通过完整验收的版本。该图标已另外检查实际绘制、尺寸和点击行为，点击图标本身能打开 The process，关闭与焦点路径正常。

附带的 `scripts/serve.mjs` 使用 Node 内置模块提供 `dist/`，不需要安装项目依赖。服务范围包括主页与本地静态资源；内容类型、HEAD、缺失资源、非法路径和端口错误均有核查。开发、重新 build 和 preview 方法见 [README](../README.md)。

正常加载和运行中没有观察到外部资源请求。字体与代码均随构建提供；几何、表面图案、反射环境、光路和线路由本地代码建立。About 的参考资料链接仅在访问者主动打开时访问外部网站。第三方组件、字体和 LTC 面光源数据的许可见 [Attribution](../ATTRIBUTION.md)。

## 视觉与尺寸

完整视觉矩阵包含 **45 张当前场景版本的浏览器截图**。八个稳定场景、四组结构交接，以及第一块薄膜的停留、沉积和刻蚀顺序均逐张检查。文字、对象、图注与控制区域的相对位置、晶圆图案、三条沟道、金属与 via、两枚逻辑 die、四组 HBM，以及同一封装的信号与闭合状态都在核查范围内。

| 尺寸 | 核查范围 |
| --- | --- |
| 1672 × 941 | 八个稳定章节；四组交接的前、中、后；第一块薄膜的三个补充时序位置 |
| 1920 × 1080 | 晶圆、晶体管、封装 |
| 2560 × 1440 | 晶圆、晶体管、封装 |
| 3840 × 2160 | 晶圆、晶体管、封装；另行核对最终章节与真实滚动端点的几何状态 |
| 390 × 844 | 八个章节的独立手机构图 |
| 360 × 740 | 晶体管、封装的紧凑手机构图 |
| 844 × 390 | MATERIAL、TRANSISTOR、INTERCONNECT 的短横屏构图 |
| 667 × 375 | 额外核查窄宽度与短横屏规则同时生效时的 hero、GAA 画面与控制位置 |

667px 横屏的开场晶圆有意延伸到右侧边界；标题、说明、入口与导航完整。晶体管构图保持主体、文案、开关和导航分离。末轮 SVG 图标修改后，另有一张 1672 × 941 的最终页眉画面和真实点击检查。

截图采集使用实际滚动位置与场景进度共同判定稳定，并验证 viewport 和画布 CSS 尺寸，避免把 resize 中间态当成最终画面。静态视觉证据暂停环境时间；滚动与交互的运行检查另行执行。软件渲染环境中的个别浏览器启动或截图等待超时，使用独立新实例恢复采集；最终矩阵完整，没有把缺失图片当作通过证据。临时截图和采集记录不包含在交付 ZIP 中。

## 浏览器交互与恢复

验收在实际 Chromium 中加载 production build，执行浏览器滚轮、键盘、原生控件和触摸模拟。

| 项目 | 已核查行为 |
| --- | --- |
| 滚动速度与方向 | 极小步进、正常推进、高频大幅输入、快速下行后反向；任意进度停留与返回 |
| 八幕与边界 | 17 个章节或边界位置正反向访问，场景、可见绘制数量和几何数量一致 |
| 直接导航 | 八段章节、The process、终章重播、地址片段与刷新后的目的章节 |
| 曝光与层距 | 原生 range 的 Home / End / Arrow 键、手动值、Auto 恢复；手机横向拖动 |
| Gate 与 Power | 控件状态、文字反馈和模型中的活动状态同步 |
| 对话框 | 焦点约束、Escape、关闭后的焦点恢复；内部滚动不会推进后方场景 |
| 减少动态 | 系统偏好和页面设置；保留结构、文字与直接控制 |
| resize 与新输入 | 新章节导航优先于旧 resize 恢复；可信 wheel 打断导航后，不会在后续 resize 中重新追赶旧目标 |
| 隐藏与返回 | 模拟 visibilitychange / pageshow 条件，检查中途导航停止和对话框滚动锁定的恢复 |
| WebGL 丢失与恢复 | 用实际 WEBGL_lose_context 扩展连续执行两次丢失和恢复；出现非空简化视图，随后恢复为一张 WebGL 画布及原进度、几何计数 |
| 无 WebGL 启动 | 八幕仍可阅读；曝光、gate、互连、封装和 power 控制实际改变 Canvas 画面 |

控件定向组 **7 项通过、0 项失败**；严格 resize / 输入中断组 **8 项通过、0 项失败**。最终材质与时序修改后的定向组 **6 项通过、0 项失败**，没有发现页面、shader、LTC、资源归属或外部运行时请求错误。

最终定向组包含 `390×844 → 667×375 → 844×390 → 390×844`，同时核对实际滚动比例、场景进度、viewport、stage 和 assembly 控件。每个视口都执行 Home、End、Auto，控件保持可见、可聚焦，并与页头页脚分离。

第一块薄膜的 **16 个关键进度**覆盖放大、落定、掩膜生长、刻蚀入口与剥离完成。固定指针、通过键盘暂停环境时间后，正反向访问得到相同的实际滚动、进度、draw calls 和 triangles；对应 **256 × 160 RGBA 的 WebGL 像素采样逐字节一致**，平均和最大通道差均为 0。这是场景画布的确定性检查；原生文字与控件由单独的截图、焦点和交互检查覆盖。

## 渲染预算与验证边界

一个 GSAP ticker 同步 Lenis、ScrollTrigger 和场景。CSS sticky 维持舞台位置，统一进度重建图层与对象姿态。非当前场景不参与绘制；隐藏页面停止昂贵渲染；暂停或低动态时按需重绘。具体实现见 [main.ts](../src/main.ts) 和 [stage.ts](../src/scene/stage.ts)。

桌面 DPR 上限为 1.65，手机为 1.6，并设置 4,600,000 像素的绘图预算。因此 4K CSS 画布与文字仍按 3840 × 2160 构图，3D drawing buffer 会按预算降低分辨率。自适应质量可进一步调整绘制尺寸，不改变模型关系。

本次通过本地 Playwright 驱动 Chromium，3D 使用 **SwiftShader 软件渲染**；手机尺寸与触摸经过浏览器模拟。结果覆盖所列条件下的构建、视觉、输入与恢复行为，**不等于物理 4K 显卡、iPhone / Android 硬件、真实触控板或 Safari / Firefox 的实机性能认证**。页面隐藏与恢复使用浏览器生命周期事件条件，不声称覆盖所有操作系统后台冻结策略。没有报告未经实际硬件测量的 FPS 或 Web Vitals 分数。

## Release integrity

发行物采用显式文件清单：完整 `src/`、必要 `public/` 资源、构建与依赖锁定配置、文档、许可、内置服务器和一份当前 `dist/`。不纳入 `node_modules`、缓存、临时截图、trace、日志、内部采集脚本、概念参考图或历史构建。

ZIP 已通过完整性检验，并在一个没有 `node_modules` 的全新目录中解压，逐个核对成员内容。使用解压后附带的 Node 服务器打开其中的构建，浏览器实际完成开场、封装导航、终章与重播；本地字体和模块正常加载，未出现缺失资源、外部运行时请求或浏览器错误。最终归档再次校验 CRC 和文件内容；其应用与资源载荷和通过解压运行检查的版本一致。

## English scope

The production build was exercised in real Chromium with keyboard, wheel, native form controls, touch emulation, responsive geometry, reduced motion, modal focus, direct chapter links, lifecycle conditions, actual WebGL context loss/restoration, and the no-WebGL Canvas fallback. A 45-image matrix covers every stable scene, the four structural relays, the first-film chronology and the specified wide/portrait/landscape viewports. Two additional 667×375 views cover the overlapping narrow-width and short-landscape rules.

The final targeted runtime group passed all six checks. Sixteen first-film positions produced matching forward/reverse geometry and byte-identical 256×160 RGBA samples with pointer and ambient time held constant. The final header-only SVG correction received a separate rendered and actual-click check; the scene and scroll modules were unchanged.

This environment uses SwiftShader. Mobile testing is emulation, not physical-device GPU, Safari/Firefox, or trackpad-hardware certification. The 4K drawing buffer is deliberately budgeted while the CSS viewport and typography retain their full size. No unmeasured FPS or Web Vitals claims are made. The project includes sources, local runtime assets, build instructions and the scientific simplifications used by the exhibition.

The archive was extracted into a clean directory without node_modules. Its included Node server and production build completed a fresh browser check of initial rendering, package navigation, the final scene and replay, with local fonts and modules loaded and no missing resources, external runtime requests or browser errors. Archive integrity and member contents were checked separately.
