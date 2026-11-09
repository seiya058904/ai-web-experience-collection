# AER 本地启动说明

## 直接体验已构建的网站

1. 把整个 ZIP 解压到一个普通文件夹，不要只拖出其中的 `index.html`。
2. 电脑安装 **Node.js 24 或更高版本**。
3. 双击 **START-WINDOWS.cmd**。
4. 浏览器通常会自动打开；如果没有，手动访问 **http://127.0.0.1:4173/**。
5. 体验期间保留终端窗口，结束后按 **Ctrl+C**。

这个启动方式只使用随包提供的 `dist` 成品，不会自动安装 npm 依赖，也不需要运行时 API、账号或付费服务。请不要直接用 `file://` 打开 `dist/index.html`。

如果 4173 端口被占用，在项目文件夹打开终端，运行：

```powershell
node scripts/serve.mjs --port 4180 --open
```

## 修改源码

双击 **START-DEV.cmd**。它仅在 `node_modules` 不存在时执行 `npm ci`，首次安装依赖需要联网。也可以手动运行：

```powershell
npm ci
npm run dev -- --host 127.0.0.1
```

修改后重新生成成品：

```powershell
npm run build
node scripts/serve.mjs --open
```

## 体验内容

网站正文与操作界面均为英文。共十章，三层风分别通往 **Hedgerow Meadow、Willow Bend、Far Meadow**。前五章始终是相同的公共旅程；改选风层不会改写之前的位置。最后可保存 SVG 或 PNG 纪念画。

声音默认关闭；章节菜单内可切换降低动态模式。没有 WebGL 时会显示对应场景的轻量插画，保留交互与路线结果。

## 验证范围

自动测试已有 **25 项通过**：旅程与物理模型 14 项、纪念画与路线图 8 项、场景 CPU 不变量 3 项。当前可用的云端 Chrome 禁用了 WebGL，因此浏览器检查覆盖的是插画降级路径，不能据此宣称真实显卡上的 Three.js 渲染或帧率已验收。手机与宽屏检查采用 CSS iframe 视口，不等同于实体手机、真实 4K 设备或浏览器缩放测试。最终实际检查记录见 `docs/VERIFICATION.md`。

本交付未部署、未发布、未推送，也未加入已有合集。所有地形、路线与风场都是虚构演示，不是飞行操作或导航教程。
