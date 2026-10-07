# MAGMA — Implemented Editorial Copy

This document records the English copy currently implemented in [index.html](../index.html), including the final “A seam within.” correction. Line breaks below follow the intended title composition. Chinese is a translation reference; the delivered interface is in English.

## Metadata

- Page title: **MAGMA — Stone Before Stone**
- Description: **An immersive material study. Hold the heat. Blacken the surface. Let fire become form.**

## 01 — PRESSURE / Hero

**MAGMA**

**Stone before stone.**

A study of matter becoming still.

**中文**

**MAGMA**

**石头成为石头之前。**

一场关于物质归于静止的凝视。

Entry: **Begin the descent** / **开始深入**

PRESSURE uses this hero composition. It does not display the earlier draft title “Heat waits beneath a still surface.”

## 02 — MOLTEN

**Nothing has settled**  
**into a shape.**

Edges yield.  
The body remains.

Secondary line: A body still capable of flow.

**中文**

**形体，尚未落定。**

边界退让。  
物质仍在。

次级文案：这具形体，仍能流动。

## 03 — FLOW

**Weight finds**  
**its own way.**

A seam learns to move.

Secondary line: Slow. Dense. Unfinished.

**中文**

**重量，自有去路。**

一道缝，开始流动。

次级文案：缓慢。浓密。尚未定形。

## 04 — SKIN

**The surface**  
**darkens first.**

A cooling crust. A living interior.

Action: **Hold to cool**

**中文**

**表面，先暗下去。**

外壳渐冷，内部仍在涌动。

操作：**按住，令其冷却**

Accessible help: “Hold with a pointer or Space. Press Enter to toggle cooling.” / “按住指针或空格键。按 Enter 切换冷却状态。”

## 05 — CRACK

**What cools,**  
**contracts.**

A quiet surface.  
A seam within.

Action: **Open the seam**

**中文**

**冷却之处，向内收紧。**

寂静的表面。  
一道内藏的缝。

操作：**打开裂缝**

## 06 — GLASS

**Darkness,**  
**made glass.**

Another cooling history. The light is no longer inside.  
It returns from the surface.

Pointer instruction: **Move to catch the light**  
Touch instruction: **Touch to catch the light**

**中文**

**黑暗，凝成玻璃。**

另一种冷却的历程。光不再来自内部，  
而是从表面返回。

指针提示：**移动，捕捉光线**  
触屏提示：**触摸，捕捉光线**

## 07 — FRACTURE

**The break leaves**  
**a curve behind.**

An edge. A hollow. A trace.

Action: **Trace the fracture**

**中文**

**断裂之后，曲面留下。**

一道刃。一处凹面。一道痕。

操作：**循着断面**

## 08 — CRYSTAL · STONE

**Elsewhere,**  
**a finer order.**

Minerals hold  
what motion once carried.

Secondary line: The grain of a different cooling history.

**中文**

**在另一处，细密的秩序。**

曾随流动而行的，  
如今由矿物承住。

次级文案：另一种冷却历程，留下另一种纹理。

## 09 — SEALED

**The light leaves.**  
**The form remains.**

What moved is held.

Actions: **About the study** / **Return to the heat**

**中文**

**光离去，形体留下。**

曾经流动的，如今定住。

操作：**关于这场凝视** / **回到热之初**

## Index and initial interface labels

**Nine states.**  
**One becoming.**

Follow the heat.  
Stay with the surface.

**九种状态，一次成形。**

循着热。  
停留在表面。

| Implemented English | 中文参考 |
| --- | --- |
| Index | 目录 |
| Sound off | 声音关闭 |
| Close | 关闭 |
| Motion on | 动效开启 |
| Scroll, or choose a state. | 滚动，或选择一种状态。 |
| About the study | 关于这场凝视 |
| Explore the nine states | 探索九种状态 |
| Open chapter index | 打开章节目录 |

Chapter labels remain **PRESSURE / MOLTEN / FLOW / SKIN / CRACK / GLASS / FRACTURE / CRYSTAL · STONE / SEALED**. The index displays the same names in title case. On/off and interaction feedback after user actions are controlled by the application code; the table records the initial HTML labels.

## About the study — implemented English

**Heat becomes**  
**form.**

Hold the heat.  
Blacken the surface.  
Let fire become form.

### About the study

MAGMA is an imagined material study across volcanic states. A fissure leads from the weight of molten rock to the quiet of a sealed black surface.

The sequence compresses geological time. Composition and cooling histories differ: obsidian and crystalline basalt are related observations, rather than compulsory stages of the same specimen.

### Image, motion, sound

Original AI-generated material studies meet authored cooling, flow, fracture geometry and reflected light. The transformations are artistic, not measured physical simulations. The optional sound is synthesized for this work.

### Grounded in observation

- USGS — How lava flows cool
- USGS — Volcanic glass and fracture
- NPS — Igneous materials

Archivo by Omnibus-Type · Lenis by Darkroom Engineering  
All image assets and sound run locally.

### 中文参考

**热，成为形。**

收住热。让表面归黑。让火成为形体。

MAGMA 是一场跨越火山物质不同状态的艺术观察。一道裂隙，引领我们从熔融岩石的重量走向封存黑色表面的寂静。

这一过程压缩了地质时间。不同材料的成分与冷却历程各异：黑曜石与结晶玄武岩是彼此相关的观察对象，并非同一块样本必须依次经过的阶段。

原创 AI 材质影像与人为编排的冷却、流动、断面几何及反射光相结合。这些变化属于艺术表现，并非经过测量的物理模拟。可选声音专为本作合成。

## Local-file and no-script messages

**Open the experience locally.**

On Windows, close this page and double-click **START-WINDOWS.bat** in the extracted folder.

Or run `npm run dev` from this folder, then open `http://127.0.0.1:4173`.

No installation or internet connection is needed when Node.js 20 or newer is available.

No-script message: **This is the image study. Enable JavaScript for the material transformations.**

**中文参考**

**在本机打开作品。**

Windows 用户请关闭此页，在解压后的文件夹中双击 **START-WINDOWS.bat**。

也可以在该文件夹运行 `npm run dev`，然后打开 `http://127.0.0.1:4173`。

已有 Node.js 20 或更新版本时，无需安装依赖或连接互联网。

禁用脚本时：**当前为静态影像观察。启用 JavaScript，即可体验材质变化。**

## Scientific and editorial boundaries

- Preserve **“Another cooling history”** in GLASS and **“Elsewhere”** in CRYSTAL · STONE. These phrases connect a continuous artwork across different materials without implying a compulsory basalt → obsidian → basalt route.
- Keep the About text explicit about geological-time compression and artistic transformations. Visual parameters and chapter progress are not live thermal telemetry.
- “A seam within” describes a cooling fissure without asserting tectonic displacement. The earlier “A fault within” draft is superseded.
- Use “minerals” for mineral structure. If columnar geometry is discussed, call it jointing or rock geometry rather than giant individual crystals.
- “Living” and “becoming” are poetic descriptions of motion and change. They do not identify the material as biologically alive.
- The final image and its words are intended to resolve into stillness, with internal emission fully extinguished.
