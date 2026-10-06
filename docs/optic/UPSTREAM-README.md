# OPTIC — The Architecture of an Image

**Follow the light. Build the machine. Reveal the image.**

An original optical film controlled by scrolling. One fictional mirrorless camera carries the viewer from exterior form into glass, focus, aperture, shutter, sensor and stabilization, then opens into an exploded mechanical assembly before returning to a single photograph.

The camera, lens, internal structures and mechanisms are original procedural geometry written for this project. The only AI-generated image used by the experience is the final coastal artwork, also reused in the focus and exposure studies. The project runs locally and includes its full source and one production build; no brand product imagery is included.

## Run the included build

Install **Node.js 22.12 or newer**. This release was verified with Node.js **24.19.0** and npm **11.9.0**. Open a terminal in the extracted project folder:

```sh
npm start
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). This command uses the Node-only server in `scripts/serve.mjs` and the included `dist/`. It needs neither `node_modules` nor an installation step. Stop the server with **Ctrl+C**.

Serve the folder over HTTP; opening `index.html` through a `file://` URL is not the supported way to run the application.

## Develop and rebuild

```sh
npm ci
npm run dev
```

The development address is [http://127.0.0.1:5173](http://127.0.0.1:5173).

```sh
npm run build
npm run preview
```

The production preview address is [http://127.0.0.1:4173](http://127.0.0.1:4173). `npm run build` replaces the production output in `dist/`. Package installation requires an internet connection or a populated local npm cache. All resources used by the running experience are local.

Run the supplied source checks with:

```sh
npm run check
```

## Experience and controls

- Scroll or swipe to travel through the film; reverse direction to inspect an earlier state.
- Use the chapter index to move directly to a scene.
- Native browser keyboard scrolling remains available, including arrows, Page Up / Page Down, Home and End.
- Keyboard focus and standard controls remain usable without a pointer.
- The experience respects reduced-motion preferences and provides a 2D fallback when the 3D presentation is unavailable.

The story follows **Light → Optics → Focus → Aperture → Shutter → Sensor → Stability → Machine → Image**. Stable compositions are intended to be held and inspected; motion is tied to the same scroll position when returning through the film.

The sensor moves from a **24 × 16 schematic overview** into a magnified **4 × 4 cell study** of microlenses, RGGB filters, photodiodes and electrical readout. Both are explanatory samples of the fictional 24 MP sensor. The image on the sensor is rotated 180° to represent optical inversion; the display and final photograph are upright. Portrait phones use a separate component layout that opens inspection space between the chassis, shutter, sensor/IBIS and processor while preserving their depth order.

## Technical layout

| Area                               | Implementation                                                                      |
| ---------------------------------- | ----------------------------------------------------------------------------------- |
| Application                        | Static HTML, CSS and vanilla JavaScript; no backend                                 |
| Rendering                          | Three.js **0.186.1**, procedural meshes/materials, Canvas/SVG/DOM where appropriate |
| Build                              | Vite **8.3.3**, pinned package lock                                                 |
| Typography                         | Locally bundled Manrope variable **5.2.8** and Cormorant Garamond **5.2.8**         |
| Camera                             | `src/camera-model.js`                                                               |
| Optical assembly                   | `src/optics-model.js`                                                               |
| Shutter and microscopic mechanisms | `src/sensor-mechanisms.js`                                                          |
| Final artwork                      | `public/assets/coast-of-light.webp`                                                 |
| Artwork provenance                 | `public/assets/coast-of-light.webp.json` and `docs/ASSET_PROMPT.txt`                |
| Ready-to-run output                | `dist/`, served by `scripts/serve.mjs`                                              |

The ZIP intentionally excludes `node_modules`, caches, test screenshots, traces, temporary generation drafts and duplicate build folders. No deployment or public hosting is performed.

## Verification

Recorded on **2026-10-06**. The release source passed the checks below. Clean-extraction results are recorded separately.

| Recorded check                        | Result and measured scope                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mechanics and structure               | **28 / 28 passed** in the recorded `npm run check` run: refraction and glass intersections, iris geometry, shutter exposure and light gating, sensor/IBIS structure, reversible desktop/portrait assembly, and resource disposal.                                                                                                                                                                  |
| Final browser acceptance              | **19 / 19 passed** for the completed scene and interaction implementation, using Linux headless **Chromium 153.0.8010.0** with **SwiftShader software WebGL**.                                                                                                                                                                                                                                     |
| Interaction and lifecycle             | Index/focus containment/Escape, focus endpoints, four aperture stops, fast/slow shutter, IBIS switch, immediate/slow/rapid/reversed scrolling, stopping/resuming, paused rendering, resize, mid-story refresh, Chromium freeze/activate and `pageshow`, final photograph and replay passed.                                                                                                        |
| Accessibility and fallback            | Reduced-motion WebGL controls, forced context-loss fallback and all nine scenes in explicit 2D mode passed. This is functional coverage, not a full accessibility certification.                                                                                                                                                                                                                   |
| Viewport checks                       | Layout samples at **1920 × 1080, 2560 × 1440, 3840 × 2160, 768 × 1024, 360 × 740, 320 × 568 and 844 × 390** recorded no horizontal overflow. The 390 × 844 phone viewport was also used for context-loss fallback. These checks do not establish that every composition was visually accepted.                                                                                                     |
| Requests and errors                   | No recorded page exceptions, console errors, unexpected failed requests or external runtime requests.                                                                                                                                                                                                                                                                                              |
| Visual scene review                   | All nine desktop and phone chapter compositions were inspected. The final correction review inspected **36 desktop/mobile/detail captures**, including Sensor magnification and reverse handoffs, optical rays, Focus near/far holds, three aperture stops across four viewports, and complete/reassembling Machine views. All seven identified finish findings were resolved.                     |
| Clean extraction and production build | **Passed.** A ZIP was extracted into a new directory. `npm start` ran before any dependencies were installed. `npm ci` installed the locked dependencies; all **28** source tests passed again, and `npm run build` succeeded. All **8** rebuilt production files were byte-for-byte identical to the included build.                                                                              |
| Production browser checks             | **14 / 14 passed for both the included and independently rebuilt production versions**, through `npm start` and `npm run preview` respectively. Each run visited all nine WebGL chapters and all nine 2D chapters, verified focus/aperture/IBIS controls, local fonts and photo/depth assets, and confirmed no development globals, HTTP errors, page/console errors or external runtime requests. |

Development audit files and screenshots are excluded from the ZIP; this table preserves their measured scope. The production package is validated separately below.

### Manual review checklist

| Check             | Procedure and expected behavior                                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Scroll continuity | Try very slow, normal, fast and repeated scroll input. Reverse immediately and move back and forth within a scene. Objects should follow the current position without accumulating a second animation. |
| Interruption      | Stop within a transition, continue, switch tabs and return. The composition should remain coherent and the controls should still respond.                                                              |
| Restoration       | Refresh in the middle of the film, resize the window, and begin scrolling immediately after opening. The visible scene and its progress should agree.                                                  |
| Desktop framing   | Inspect 1920 × 1080, 2560 × 1440 and 3840 × 2160 layouts. Check the complete camera, exploded components, labels and final photograph for unintended clipping.                                         |
| Mobile framing    | Inspect a portrait phone viewport and a landscape viewport. Test native swiping, the index, focus visibility and any adjustable controls.                                                              |
| Accessibility     | Navigate by keyboard, enable the operating system's reduced-motion setting, and inspect the 2D fallback. Essential content should remain reachable.                                                    |
| Clean extraction  | Extract to a new directory, run `npm start`, then independently run `npm ci`, `npm run build` and `npm run preview`.                                                                                   |

Automated viewport checks do not certify physical devices. Hardware-specific frame rates, high-refresh input and physical iOS Safari/Android browsers remain unmeasured. Chromium's simulated freeze/activate does not certify physical-device suspension. A roughly 60 FPS presentation is a design target, not a measured guarantee. The 4K check refers to viewport layout; the final artwork is **1536 × 1024**, and the recorded 4K WebGL drawing buffer was capped at **2732 × 1537**.

## Engineering scope and licenses

This is an authored visual experience with a coherent explanatory camera architecture. It is not a calibrated optical simulator or a manufacturable CAD prescription. The focus preview, pixel magnification, exploded distances and stabilization motion contain deliberate visual simplifications.

- [Engineering references](docs/SOURCES.md)
- [Asset provenance and simplifications](docs/PROVENANCE.md)
- [Original software license](LICENSE)
- [Third-party notices](THIRD_PARTY_NOTICES.md)

Original software and authored documentation use the MIT license. Fonts retain their SIL Open Font License; Three.js retains its MIT notice. The generated artwork is included with the project subject to applicable generation-provider terms. No camera manufacturer endorses this work.

---

## 中文说明

**OPTIC 是一部由滚动控制的摄影机器电影。** 你会跟随光线进入一台原创无品牌相机，穿过镜片、光圈与快门，观察感光、像素采样和防抖，最后从完整拆解重新回到一张照片。相机与内部结构使用专门编写的程序化模型；海岸终章为 AI 生成艺术图像，并非真实相机拍摄记录。

传感器从 **24 × 16 示意总览**进入 **4 × 4 微观单元**，呈现微透镜、RGGB 滤色片、光电二极管与电荷读出；这两种视图均不是实际渲染 2400 万像素。传感器上的照片旋转 180° 表现光学倒像，显示屏与终章照片保持正向。手机竖屏采用专门的拆解分层，在保留前后关系的同时让快门、sensor/IBIS 与处理器可分别观察。

### 直接运行 ZIP 内的正式版本

安装 **Node.js 22.12 或更新版本**。本次验证使用 **Node.js 24.19.0 / npm 11.9.0**。解压后，在项目目录打开终端：

```sh
npm start
```

打开 [http://127.0.0.1:4173](http://127.0.0.1:4173)。此方式直接读取 ZIP 中唯一一份 `dist/`，使用 Node 内置能力启动本地服务器，**无需先安装依赖**。按 **Ctrl+C** 停止。请通过本地 HTTP 地址访问，不要直接双击 HTML 文件。

### 修改源码与重新构建

```sh
npm ci
npm run dev
```

开发地址：[http://127.0.0.1:5173](http://127.0.0.1:5173)。

```sh
npm run build
npm run preview
```

构建后的预览地址：[http://127.0.0.1:4173](http://127.0.0.1:4173)。`npm run check` 运行随项目提供的源码检查。安装依赖需要网络或本地 npm 缓存；运行时图片、字体与脚本均来自本地，没有必需的外部 API、分析服务或后端。

鼠标滚轮、触控滑动与浏览器原生键盘滚动均可使用；章节索引用于直接定位。系统的“减少动态效果”偏好会被尊重，3D 不可用时提供 2D 呈现。

验收状态以本文 **Verification** 部分为准：最终源码已通过 **28/28 机械与结构测试**和 **19/19 Chromium 回归检查**，九章桌面/手机构图及最后36张修正帧已检查，七项视觉问题全部关闭；ZIP 已在新目录解压，先通过无需依赖安装的 `npm start`，再完成 `npm ci`、28项测试、构建与 `npm run preview`；随包版和独立重建版均通过 **14/14 正式浏览器检查**，8个构建文件逐字节一致。模拟手机尺寸不等于真实手机认证，硬件帧率、高刷新率输入、iOS Safari 与 Android 实机未作验证。唯一 AI 生成图像的交付尺寸为 **1536 × 1024**，附带 `.webp.json` 来源记录；4K 验收指页面布局尺寸。源码、正式资源、构建配置、依赖锁文件、来源说明及许可证均在包内；依赖目录、缓存、测试截图、trace 和临时素材不在包内。本次交付不涉及部署或公开托管。
