# FRAME 交付与验证报告

**记录日期：2026-11-09。** 当前冻结版本已通过 47 项测试及干净重建；可见页面长 RAF 间隔导致误暂停的缺陷已定位并修复。主页面三秒 Hero、编辑器五秒版本及独立五秒 HTML 样片均已观察到播放完成。本报告分别记录代码验证、浏览器观察和仍未覆盖的项目，不把局部检查扩展为全项通过。

## 1. 交付内容与版本

作品含 10 个英文章节、24 个独立故事帧、3 种真实间距预设，以及推之前、回看时两处可调停顿。基础时间表为 36 拍／3 秒；两处各加 12 拍时为 60 拍／5 秒。重复停顿不增加独立故事帧数。参见 [时间模型](../src/timeline.ts)与[实现说明](engine-notes.md)。

| 交付项 | 已核对的内容 |
| --- | --- |
| 独立网页 | `FRAME.html` 为 2,681,027 字节，图片、字体及 Lenis／Manrope 版权声明均内嵌 |
| 源码与目录构建 | Vite＋TypeScript 项目、锁文件、136 个 `dist/` 文件、无需 npm 依赖的本地 Node 服务 |
| 原创数字素材 | 126 幅生产图，共 1,861,274 字节：64 标准序列＋24 桌面 Hero＋24 手机 Hero＋14 静帧 |
| 实际 AI 生成记录 | 10 张 PNG：8 张任务概念参考＋2 张界面研究，含提示词和文件哈希 |
| 输出证据 | 浏览器下载的 PNG 分镜、真实导出函数生成的 HTML 样片、截图及测试日志 |

资源数量、尺寸及哈希见[源码资源审计](source-package-audit.json)、[完整图像清单](../public/production-art-manifest.json)和[生成记录](image-generation.json)。项目是数字黏土作品，不声称为实体逐格摄影；参考作品的角色和照片未作为生产素材。

当前冻结、已完成干净重建验证的 `FRAME.html` SHA-256：

```text
13f99e61c4b2d2db1a817b391177c15c75380480708b46d9c2043f5f42a428df
```

该值与[重建报告](reproduction.json)及[单文件构建记录](offline-build.json)一致。最终 ZIP 在文档和证据齐备后重新打包，其哈希由独立校验文件记录，不沿用候选包哈希。启动方式见 [Windows 说明](../START-HERE.zh-CN.md)。

## 2. 代码、重建与资源验证

在 Linux x86-64、Node 24.22.1、npm 11.9.0 下，原项目和全新解压目录均通过 **47／47 项测试**。新目录执行 `npm ci` 后，删除附带的生成结果再构建；`FRAME.html`、`QA-PREVIEW.html`、整个 `dist/` 和 `offline-build.json` 均逐字节一致。npm 下载缓存可能复用，因此不声称首次安装可离线完成。

在安装依赖之前，附带服务器已通过全部 136 个构建文件的 HTTP 内容与 MIME 检查，并通过 HEAD、404、405、异常路径和符号链接越界检查，随后停止。126 幅生产图和 10 张概念图均成功解码；四份图像清单、20 份依赖声明及内嵌版权文本均通过对应哈希核对。详见[重建报告](reproduction.json)、[实际命令日志](../evidence/reproduction.log)和[版权记录](licenses.md)。

## 3. 浏览器实测与边界

以下为 Chrome 中的实际页面交互和 DOM 采样；固定 iframe CSS 尺寸保留宿主 DPR，不代表真实手机、显示器或浏览器缩放。

| 检查 | 已观察结果 |
| --- | --- |
| 章节与尺寸 | 保留 100 条记录，其中含早期 320px 宽度的 21px 溢出；按视口和章节取最新值后为 9×10＝90 个不同状态，横向溢出及失败图片均为 0。懒加载 pending 未算作失败 |
| 桌面与手机交接 | 各 9 段 × 0／25／50／75／100%，合计 90 个不同采样点；最新记录全部 ready。原始 97 条记录保留 7 次初始 loading 及其 ready 复访，未抹去中间状态 |
| 最终手机复测 | 320／360／390 三种宽度分别复查 Hero、第 4 章、第 8 章，共 9 个受改动影响的状态，横向溢出均为 0 |
| 编辑与恢复 | `ease-in`＋12＋12 显示 60 拍／5 秒；Undo 后 59 拍／4.92 秒；重载恢复第 18 帧及同一预设、两处 12 拍停顿 |
| 少动效与焦点 | 站内 Less motion 切换改变 HTML 类；手动前进到第 2 帧后 ready；Escape 关闭后焦点返回已检查。未据此声称完整键盘或系统级少动效验收 |
| 手机 Hero | 冻结版 390×844 截图中，独立 portrait 相机第 1 帧为 ready；720×800 源图中主体高 331–356 像素，此值是资源测量，不是屏幕显示尺寸 |

九种 CSS 视口为：320×700、360×640、390×844、768×1024、1440×900、1920×1080、2560×1440、3840×2160、844×390。[原始浏览器证据](../evidence/frame-browser-evidence.json)保留旧失败、复访及最终手机记录；过程使用[本地 QA 页面](../public/qa.html)。另附[手机构图测量](hero-portrait-validation.json)、[手机最终首屏](../evidence/frame-mobile-compact-final.jpg)、[桌面最终首屏](../evidence/frame-desktop-hero-final.jpg)与[编辑器截图](../evidence/frame-editor-final.jpg)。离散采样不能证明任意滚动位置都无缝。

**主页面误暂停缺陷已修复，两种时长均完成实测。** [实际诊断日志](../evidence/frame-playback-diagnostic.json)定位到 1,016.4ms 的可见 RAF 延迟触发旧 250ms 阈值，误把卡顿当作后台暂停。[播放器](../src/player.ts)现按正向实际耗时推进；隐藏、离屏、pagehide 和编辑等明确暂停仍保留。回归验证 elapsed 从 250ms 前进至 1,266.4ms 时仍播放第 10 帧，并在 3,000ms 到第 24 帧；明确暂停期间的墙钟时间仍不计入。

真实主页面 Hero 已观察到 Watch Boop try → Pause → Watch again，frame／renderedFrame 均为 24、资源 ready。编辑器 `ease-in`＋12＋12、`filmDuration=5.0000` 也到达 renderedFrame 24／ready，按钮为 Watch again、选帧条为 24，并显示 Your take is complete；Premiere 同步为 24／24 与 There. Just right.。后续 Premiere 暂停／重播自动化尝试超时，因此完整暂停—继续—重播路径仍未完成浏览器验收，相关播放器状态已有单元测试覆盖。长 RAF 延迟下不保证每一帧都获得独立显示机会，也不据此宣称实测 FPS。

完成状态见[实际浏览器记录](../evidence/frame-playback-completed.json)与[编辑器完成截图](../evidence/frame-editor-complete-final.jpg)。

## 4. 两种导出分别记录

| 输出 | 证据与状态 |
| --- | --- |
| PNG 分镜 | 浏览器实际下载，1440×1800；已打开目视检查 24 格英文分镜完整，01／06／18／24 帧分别为 7／13／13／7 拍。文件为[五秒分镜](../evidence/browser-storyboard-5s.png) |
| HTML 下载入口 | 持久 Open／Download 链接已在真实 UI 中出现，但云端自动化等待 HTML 文件传输仍超时，顶层页尝试也未完成。HTML 下载保持未验证；不由此推断用户浏览器禁止下载，也不能用“文件已准备好”替代传输成功 |
| HTML 样片播放 | [export-sample.html](../evidence/export-sample.html)由 Node 调用真实导出函数生成；随后经 HTTP 在真实浏览器点击 Play，观察到 Pause，再到 Frame 24／24、5.00／5.00s 和 Just right 结束状态，完成一次五秒播放；见[结束截图](../evidence/frame-film-finished-final.jpg) |

样片为 823,789 字节，其 SHA-256 为 `0c6314ab58c811a7150b6e07e0086e263887ea9db56b9bf8bf5bffccbeb3a7e8`。[静态载荷验证](../evidence/export-sample-validation.json)确认 60 拍／5 秒、48 幅内嵌图与原始素材逐字节一致，且没有外部图片引用。HTTP 播放成功不等于浏览器下载成功，也不覆盖 `file://`。实现细节见[导出代码](../src/export.ts)与[说明](export-notes.md)。

## 5. 缺陷处理记录

| 问题 | 处理及当前证据 |
| --- | --- |
| 页面内容被误清空 | 已修复；最终页面可读取完整 10 章，见[页面逻辑](../src/main.ts) |
| RAF 调度重复分叉 | 循环末尾增加单一待执行 RAF 检查；[实际调度回归测试](../tests/scheduler.test.mjs)通过 |
| 320px 宽度溢出 | 增加最小宽度与换行约束，10 章复测无横向溢出；见[样式](../src/style.css) |
| 手机 Hero 主体偏小 | 新增 24 幅独立紧凑 portrait 镜头并接入场景；资源和最终首帧截图已检查 |
| HTML 下载反馈与备用入口 | 已增加持久准备文件链接及准确提示，UI 出现已确认；实际 HTML 下载仍未验证，见[下载控制](../src/main.ts) |
| 主页面播放停在首帧 | 日志定位可见 RAF 延迟被误判为后台；已去除该推断并保留明确暂停，回归、Hero 三秒及编辑器五秒完成状态均通过 |
| 单文件打包与声明 | 修正内嵌脚本结束标签处理，保留外层 HTML 结束标签，内嵌运行库与字体声明；[打包器](../scripts/pack-offline.mjs)产物通过干净重建比对 |

## 6. 已知差异与未覆盖项

最终逐格画面使用确定性的 CPU 渲染模型，与 AI 参考在轮廓、脸部比例、折角和表面细节上仍有差异。第 8 章虽附有俯视资源，实际交互场景尚未启用完整俯视构图。九段交接是独立 Canvas 构图，不是同一 DOM 对象在章节间精确连续迁移；坐姿尾声是额外静帧，第 24 帧仍保留原电影终点姿态。详见[设计记录](../DESIGN.md)、[渲染说明](renderer.md)与[交付边界](delivery-limitations.md)。

当前协议限制阻止 `file://`、`chrome://` 检查。未完成 Windows 实机、Safari、实体手机、125／150／200% 原生缩放、慢 CPU、完整键盘路径及测量式对比度验收；没有 Lighthouse、保证帧率或实机内存成绩。本次未部署公开网站、推送仓库或创建 PR。

