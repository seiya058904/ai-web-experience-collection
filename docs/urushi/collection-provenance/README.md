# URUSHI — Layers of Lacquer

**Surface becoming depth.**

一件普通木胎，在湿度、时间、研磨、反复涂覆与光的作用下，逐渐获得深得近乎没有底的表面。

这是完整的本地交付版本。源码、生产构建、原创模型、纹理、GLSL、AI 视觉 Bible、生成提示词、研究资料、许可和来源记录均随包提供。没有部署到任何网站或公共服务。

## 直接体验

### Windows

1. 完整解压 ZIP。
2. 双击 **`Start-URUSHI.cmd`**。
3. 浏览器会打开 `http://127.0.0.1:8080`。

需要 Node.js 22.12 或更新版本。**体验已构建的版本不需要运行 `npm install`，也不需要联网。** 保持终端窗口打开；关闭窗口或按 `Ctrl+C` 即结束本地预览。

### macOS / Linux

```sh
sh Start-URUSHI.sh
```

也可以手动运行：

```sh
node scripts/serve.mjs
```

随后打开 `http://127.0.0.1:8080`。此预览服务器只监听本机回环地址。

### 使用 Python

如果电脑已安装 Python，可以直接服务生产目录：

```sh
python -m http.server 8080 --bind 127.0.0.1 --directory dist
```

Windows 的 Python 启动器也可使用 `py -m http.server ...`。不要用文件管理器直接双击 `dist/index.html`：ES modules、模型和数据加载需要本地 HTTP 上下文。

## 操作

- **滚轮、触控板或触摸滑动**：推进或倒放材质变化。
- **Index / 目录**：直接进入任一章节。
- **About / 关于**：阅读作品说明、真实工艺依据与来源，或展开完整文本叙事。
- **目录内的中文 / English**：切换语言，偏好保存在当前浏览器。
- **目录内的 Motion / 动态**：切换完整与减弱动态。默认遵循操作系统的 `prefers-reduced-motion` 设置。
- **结尾的 Move the light / 移动光线**：通过滑块移动环境反射，可用键盘方向键操作。
- **Begin again / 再看一次**：返回开场。

鼠标只轻微影响光的方向，不控制滚动进度。触屏保留原生触摸滚动。全站保持安静，没有自动播放音频。

## 叙事

| 章节 | 材质变化 |
| --- | --- |
| 00 — Black without edge | 一道长反射，让近乎隐没的黑色器物显露体积。开场没有金粉。 |
| 01 — Core | 同一只器物回到木胎，地层逐渐填平可见纹理。 |
| 02 — First coat | 薄而受控的漆膜前沿掠过表面，倒影开始聚拢。 |
| 03 — Cure | 湿润而静止的暗室，漆膜的变化被时间推进。 |
| 04 — Abrade | 湿磨打断反射，让表面暂时失去漂亮的光泽。 |
| 05 — Layers | 三次压缩的涂覆、固化、研磨节律；短暂显露层次示意。 |
| 06 — Vermilion | 同一表面局部释放浓而克制的朱色。 |
| 07 — Polish | 粗糙与细痕渐退，反射由断续走向完整。 |
| 08 — Maki-e | 有限金粉在漆绘区域落下、附着，形成原创曲线。 |
| 09 — Reveal | 覆漆遮住图案，再以局部研磨边界让它重新显现。 |
| 10 — Depth | 回到完整器物，停留在漆层与倒影之中。 |

## 源码开发与构建

使用 Node.js **22.12+**，建议 Node.js 24。依赖版本通过 `package-lock.json` 固定。

```sh
npm ci
npm run dev
```

开发地址：`http://127.0.0.1:5173`。

```sh
npm run build
npm run preview
```

生产预览地址：`http://127.0.0.1:4173`。构建输出到 `dist/`，所有资源使用相对路径。

```sh
npm run model
npm run check
```

`model` 从同一轮廓定义重新导出 OBJ 与材质纹理；`check` 验证状态的数值范围、可逆性、章节边界、金粉登场时刻和交付资产。

## 文件结构

```text
urushi/
  dist/                       已构建的完整作品
  src/
    main.js                   滚动、场景切换、导航与可访问交互
    story.js                  由位置直接求值的确定性材质状态
    renderer.js               Three.js 渲染与资源生命周期
    geometry.js               同一木胎的几何生成与表面采样
    material-textures.js      固定种子的材质纹理
    shaders/                  原创 GLSL：漆、反射、空间与金粉
    i18n.js                   中英文界面文案
    style.css                 响应式排版与界面
  public/
    assets/                   本地海报、研究来源与静帧版本
    models/                   原创器形轮廓 JSON 与 OBJ
    textures/                 导出的材质纹理
  docs/
    visual-bible/             生成关键帧与完整提示词
    research/RESEARCH.md      真实工艺研究与引用
    EXPERIENCE.md             场景与连续性设计
    VALIDATION.md             最终验收范围与限制
  licenses/                   依赖、字体和素材权利说明
  scripts/                    本地预览、模型导出与交付检查
  PROVENANCE.md               所有素材的来源与制作方式
  DESIGN.md                   最终视觉与动效系统
  MANIFEST.sha256             交付文件完整性校验
  Start-URUSHI.cmd            Windows 本地启动
  Start-URUSHI.sh             macOS / Linux 本地启动
```

## 实现说明

**同一器物。** WebGL 从一个原创椭圆漆盒轮廓生成封闭网格。木纹、地层、漆膜、研磨、朱色和金纹使用同一物体坐标；不会在不同章节替换模型。

**同一道光。** 反射由表面法线与观察方向在同一环境中求值。木胎、粗糙地层和磨过的漆面会打散它；抛光逐渐恢复连续性。黑漆是非金属介电材质，金粉有独立的反射响应，没有金色 bloom。

**可逆进度。** `getStoryState(position)` 是纯函数。Lenis 是唯一 smooth-scroll authority；渲染器不对故事进度再次插值。随机纹理和粉末到达顺序使用固定种子，因此快速滚动、倒退和直接跳章不会留下上一阶段的粉末或遮罩。

**移动构图。** 手机展示器物的局部曲面、倒影与肩缘，不把整件器物缩成小图。字体、阅读区域、章节目录和触控区域独立适配。

**有界渲染。** 绘制像素数、DPR 与可见金粉数量均有上限。后台标签停止请求动画帧；减弱动态时去除平滑滚动与自主材质运动，仅在交互或状态变化后重绘。没有 WebGL 时使用随包提供的静帧版本与完整章节文本。

## 工艺边界

本作依据博物馆、工艺机构及材料研究的真实记载进行艺术编排。镜面材质借鉴 **roiro**；后段遮蔽与研出借鉴 **togidashi maki-e**。前段 Polish 表示一次整理后的清晰表面，后续仍有装饰、覆漆和研出。

层数、厚度、粉末大小和时间在视觉中有所压缩或放大。作品没有把某组温湿度、天数或配方写成通用标准，也不代表某一历史漆器、工坊或博物馆藏品。详见 `docs/research/RESEARCH.md`。

## 许可与来源

原创代码、GLSL、程序化模型、纹理与文档按根目录 MIT 许可提供。Three.js、Lenis、Vite 及自托管字体的原始许可见 `licenses/`。AI 视觉研究的提示词，以及研究图、实时画面和生产静帧的来源关系见 `PROVENANCE.md`。

参考机构的馆藏摄影和纪录片未被复制进交付包。生产页面加载的资源全部来自本地；关于面板中的研究链接仅在主动点击后访问外部网页。
