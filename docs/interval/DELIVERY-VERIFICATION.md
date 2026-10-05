> Original standalone delivery observations, dated 2026-10-05. They do not certify later Collection builds. Current development/build/deploy workflow: [root README](../../README.md).

# Original INTERVAL delivery verification

验收使用 Linux、Node.js 24.19.0、Chromium 153.0.8010.0 与 Playwright 1.62.1。生产文件通过本地 HTTP 服务器运行；除程序检查外，实际浏览器截图经过两轮关键构图目视复核，并补充尺寸矩阵与短横屏修正复核。

| 检查 | 结果 |
| --- | --- |
| TypeScript 与 Vite 生产构建 | 通过；交付 `dist/` 与最终源码对应 |
| 独立重建 | 在单独目录按锁文件重新安装依赖并构建，36 个生产文件与交付版逐字节一致 |
| 尺寸矩阵 | 3840×2160、2560×1440、1920×1080、1440×900、1024×768、834×1194、430×932、390×844、360×800、896×414 |
| 完整构图 | 上述 10 种视口共检查 70 个首幕／稳定节点；标题、说明与导航无碰撞，无水平溢出 |
| 视觉停留点 | 检查 Hero、进入中段、完整构图、Living Hold、交接中段、下一空间稳定帧、Index 和静态模式；已修正手机横移露底、描线错位与短横屏首幕裁切 |
| 滚动输入 | 8px 细碎滚轮、正常连续滚动、快速前进与反向、转场往返，以及 Chromium 原生触摸事件模拟均有连续反馈 |
| 可逆性 | 五个空间交接从不同方向返回相同滚动位置时，相机、遮罩、字幕及活动状态一致 |
| 停留生命感 | LIGHT、MATTER、SILENCE 中停留时，滚动位置和主相机不动，细微呼吸与光照仍变化 |
| 延迟加载 | 字体延迟 550ms、首图延迟及初始解码期间的导航仍到达正确目的地；用户反向滚动可以取消导航，不被刷新抢回 |
| Resize | 桌面、平板、手机五次往返后，原进度和相机矩阵准确恢复；导航期间连续改尺寸仍到达正确场景 |
| 交互与无障碍 | Index／About、Esc 与焦点恢复、Skip link、hash／历史导航、系统和手动 Reduced motion 切换、图片失败重试通过 |
| 加载与错误 | 最终矩阵检查无 JavaScript 异常、控制台错误、失败资源或外部运行时请求 |

**验证范围：** 触摸与屏幕尺寸使用 Chromium 仿真，并非 iPhone／iPad 实机。已操作页面返回、切换浏览器标签及生命周期冻结／恢复；该 headless 环境切换标签时仍将页面报告为 `visible`，因此没有将其视为真实后台隐藏事件的实机验证。Safari、Firefox、移动地址栏收缩与 120／144Hz 硬件帧率未在本环境实测。
