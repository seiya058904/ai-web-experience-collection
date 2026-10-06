> Preserved upstream delivery record. Its original paths, commands, versions and validation claims describe the standalone ZIP; see `ACCEPTANCE.md` for Collection verification.

# THRUST — Anatomy of a Jet Engine

**Follow the air. Enter the machine. Become thrust.**

一段由原生滚动驱动的连续发动机旅程：进气 → 风扇 → 旁通 → 压缩 → 燃烧 → 涡轮 → 叶片微距 → 整机分解 → 推力 → 飞行。源码、正式资源和一份生产构建全部包含在此包中。没有部署配置、云服务依赖、账号要求或运行时远程素材请求。

## 直接运行已构建版本

需要 **Node.js 22.12 或更高版本**。无需安装 npm 依赖，也无需联网：

```sh
node scripts/serve.mjs
```

在浏览器打开 **http://127.0.0.1:4173**。

- Windows：也可以双击 `START-WINDOWS.cmd`，然后打开上面的地址。
- macOS / Linux：运行 `sh START-MAC-LINUX.sh`。
- 结束运行：在命令行按 `Ctrl+C`。
- 如果 4173 被占用，设置环境变量 `THRUST_PORT` 为其他端口后再运行。

请通过本地 HTTP 服务器打开。直接双击 `index.html` 会受到浏览器对 ES 模块及本地文件的限制。启动脚本只监听 `127.0.0.1`。

## 从完整源码安装和构建

首次安装依赖需要访问 npm registry；安装完成后的开发、构建和运行均使用本地资源。

```sh
npm ci
npm run dev
```

开发地址默认为 **http://127.0.0.1:5173**。

```sh
npm run check
npm test
npm run build
npm run preview
```

`build` 输出唯一的生产目录 `dist/`，`preview` 默认为 **http://127.0.0.1:4173**。构建配置使用相对资源路径，可在站点子目录中运行。没有自动发布命令。

## 体验方法

| 操作 | 行为 |
|---|---|
| 鼠标滚轮 / 触控滚动 | 沿空气路径前进或反向穿过同一台发动机 |
| 底部十段章节线 | 跳到对应章节 |
| 右上角 `INDEX` | 选择章节，查看模型说明与设置 |
| 右上角暂停按钮 / `M` | 暂停或恢复环境运动；滚动和导航仍可用 |
| 键盘 `←` / `→` | 前一章 / 后一章 |
| 叶片章节 `REVEAL THE CHANNELS` | 打开或关闭内部冷却剖切 |
| 叶片 / 整机分解中横向拖动 | 小幅改变观察角度，纵向触控滚动保留 |
| Index 中 `SOUND` | 开启或关闭本地合成音景；默认关闭 |
| Index 中 `RENDER QUALITY` | 自动像素预算 / 更高细节预算 |
| 结尾 `FOLLOW THE AIR AGAIN` | 返回进气口重新开始 |

系统启用 `prefers-reduced-motion` 时，页面默认暂停环境运动，并使用各章节的稳定机位。主动点击恢复按钮可以选择完整运动。页面隐藏后停止渲染循环并暂停音频，恢复时不会补播离开期间的时间。WebGL 不可用时显示完整文字阅读版；上下文丢失时提供恢复入口。

## 视觉与实现

### 一台持续存在的机器

发动机由原创程序化网格构成，采用固定的双轴架构：22 枚风扇叶片、3 级 LP booster、9 级 HPC、2 级 HPT、5 级 LPT、18 处环形燃料喷射位置。转子与定子分别建模，LP / HP 的对应组件保持同步。分解视图使用同一批部件按层级展开、重组。

### 两股空气，一条能量主线

Shader 路径始终保留外围旁通流和内部核心流。核心流道围绕轮毂与轴系，经过压缩、燃烧与涡轮后进入核心喷口；旁通流有独立外侧出口。冷却叶片使用曲面翼型、真实孔口、部分可打开外皮、内部折返通道及表面流线。所有光效都是示意表达，不是数值流体仿真。

### 连续镜头

`story.js` 是唯一镜头轨迹与章节状态来源。镜头轨迹、分解程度、热量与气流由当前滚动坐标确定，可以随时反向。手机使用独立机位、视角与画面倾角，所有镜头参数连续插值；窗口尺寸改变时保留当前故事位置。

### 正式素材

主机械画面、飞机、金属细节、气流和冷却结构均为实时生成。正式图像只有一张生成的天空背景，以及从原创实时模型导出的兼容性海报。字体随构建打包。无厂家模型、无品牌商标、无远程 CDN。

## 工程边界

这是原创、可信但经艺术简化的工程展示，不是任何厂家产品的 CAD、实测数据或性能模型。`9:1` 表示**示意质量流量比**，不是推力占比或几何面积比。燃烧提高温度而伴随少量总压损失；涡轮回收轴功；叶片冷却来自压气机引气。显示的压力 / 温度条是定性的叙事场，不是仪表读数。

完整结构说明见 `docs/ENGINEERING.md`，公开技术参考见 `docs/SOURCES.md`。材质、镜头与分镜见 `DESIGN.md`。

## 文件结构

```text
THRUST/
  index.html                 语义化章节与界面
  src/
    main.js                  滚动、导航、可访问性与生命周期
    story.js                 连续镜头与叙事状态
    scene.js                 场景、灯光、像素预算与部件组合
    engine.js                原创双轴发动机
    flow.js                  核心流 / 旁通流 / 燃烧着色器
    blade.js                 冷却叶片微距
    flight.js                原创双发飞机
    sound.js                 可选本地合成音景
    style.css                字体、排版与响应式构图
  public/                    正式图片与图标
  dist/                      一份完整生产构建
  scripts/serve.mjs          零依赖本地静态服务器
  tests/                     镜头连续性和机械不变量检查
  docs/                      工程、来源、素材来源与验收记录
  licenses/                  第三方许可全文
```

## 验证与运行限制

具体执行环境、尺寸、交互路径和结果见 `docs/VALIDATION.md`。自动检查和本地 Chromium 的可观察结果与真实硬件体验分开记录。这里不把软件渲染器的速度当作真实显卡帧率，也不对未测试的 Safari / iOS 实机作通过声明。

## 许可与来源

原创源码使用 MIT，见 `LICENSE`。Third-party notices、字体 OFL 和来源说明见 `ATTRIBUTION.md`、`licenses/` 与 `docs/PROVENANCE.md`。

---

## English quick start

This archive contains a complete original scroll-driven jet-engine experience, source and one production build. Nothing has been deployed.

With Node.js 22.12+, run `node scripts/serve.mjs`, then visit `http://127.0.0.1:4173`. This ready-to-run path needs no package installation or network. For development, run `npm ci` and `npm run dev`; validate with `npm run check`, `npm test`, and `npm run build`.

Scroll to travel, use the bottom chapter rail or Index to navigate, pause with the upper-right button or M, and use the blade section control to inspect cooling channels. Sound is opt-in. Reduced-motion and static reading modes are included. The engine, aircraft, air paths and display fields are original explanatory artwork, not certified engineering or measured telemetry.
