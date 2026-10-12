# Physical material scenes

The MARK and PRESS scenes are generated locally from the verified Fraunces `R` in `font-spec.json`. The material canvas contains no rasterized text, image-generated lettering, external models, remote assets, or baked scene photographs. Only stone grain, metal wear, paper fibers, ink variation, a soft contact shadow and the studio lighting environment use procedural bitmap material maps. All of these maps are created deterministically in memory.

## Geometry and authorship

- **Font:** Fraunces, `wght=600`, `opsz=100`, `SOFT=0`, `WONK=1`. Exact source, license, local binaries and outline verification are in `FONT-SOURCES.md` and `font-spec.json`.
- **Outline:** The existing nonzero contour union provides one outer contour and one counter. Quadratic Bézier curves are retained as curves until the renderer tessellates them. The renderer does not substitute its own drawing of the letter.
- **MARK:** The outer contour is a real hole in the upper stone slab. The counter is an intact island at the slab's original surface height. A second, lower solid creates a floor approximately 0.25 scene units below the top; beveled edges, side walls and actual light shadows establish the incision.
- **PRESS:** The metal face is the same real outline, extruded and mirrored horizontally. The whole die turns face down around its vertical axis, approaches the paper, makes contact, lifts and returns to its starting side. At contact, the mirrored face has the orientation of the normal-reading impression. Both faces use the same 2.16-unit cap height.
- **Historical status:** These are designed material studies using a contemporary typeface, not reconstructions of an ancient inscription, a particular historical typefounder's tooling, or a specific press. Page copy should preserve that distinction.

The generated Visual Bible images are composition references. No part of their letterforms is painted into the material canvas.

## Local interface

Load `assets/materials.js` as an ordinary classic script; it is already bundled and also works with `file://` viewing.

```js
const material = window.CounterformMaterials.create(canvas);
if (material.ready) {
  material.resize(canvas.clientWidth, canvas.clientHeight, devicePixelRatio);
  material.render({ scene: 'mark', progress: 0.5, reduced: false });
}
```

The controller provides:

| Member | Meaning |
| --- | --- |
| `ready` | Whether the initial WebGL2 renderer and geometry were created. |
| `info` | Renderer provenance, font location, availability, drawing-buffer dimensions and last press state. |
| `resize(width, height, dpr)` | Sets the drawing buffer and invalidates the cached frame. Does not change canvas CSS size. |
| `render({scene, progress, reduced})` | Renders MARK or PRESS at an absolute clamped `0..1` progress. Returns `false` when rendering is unavailable. |
| `renderLayers({layers})` | Composes up to two MARK/PRESS layers in list order. Each layer provides `scene`, `progress`, `opacity` and `rect: [x,y,width,height]` in CSS pixels relative to the canvas. Optional `sourceSize: [baseWidth,baseHeight]` reuses a fixed capture while `rect` moves or scales. Returns `false` when unavailable. |
| `counterMatrix({scene, progress, width, height, role})` | Returns an SVG/CSS affine matrix `[a,b,c,d,e,f]` mapping the existing `#serif-counter` coordinates into the supplied material rectangle. `role: 'entry'` uses the mirrored metal face in PRESS; `'exit'` uses its paper impression. MARK uses the real stone island. Returns `null` when unavailable. |
| `dispose()` | Disposes geometries, materials, textures, environment target, shadow resources, renderer and event listeners. |

The module **never calls `requestAnimationFrame`**. The exhibition's single clock supplies progress, including reverse scrolling. Repeated requests for an unchanged frame are skipped. `reduced: true` renders the completed stable composition.

For a handoff, the caller uses a fixed canvas covering the material motion, then supplies both relative rectangles with complementary or authored opacity values. A stationary pair can use the rectangles' union; a moving pair can use the fixed exhibition viewport. It should leave the canvas element itself at opacity 1 during this composition. A stable scene continues to use `render()` without extra rendering passes.

```js
material.resize(viewportWidth, viewportHeight, devicePixelRatio);
material.renderLayers({ layers: [
  { scene: 'mark', progress: 1, opacity: 1 - blend, sourceSize: markBaseSize, rect: movingMarkRect },
  { scene: 'press', progress: 0, opacity: blend, sourceSize: pressBaseSize, rect: pressRect },
] });
```

The two scene captures stay entirely on the GPU. Each uses the same renderer's normal tone mapping, anti-aliasing and transparency, then a `FramebufferTexture` caches the display-space premultiplied pixels. A final transparent composition pass changes the two opacity values. This preserves ink variation and soft edges at the handoff boundary; rendering the scene into a linear HDR target before tone mapping would change how the semi-transparent ink mixes with the paper.

With `sourceSize`, the source is captured once at its fixed base dimensions, which must fit in the canvas. Moving or uniformly scaling the destination `rect` only transforms the cached quad; it does not re-render 3D, change the source camera or allocate a new texture. Only scene, pose, base size or canvas changes invalidate that capture. This lets the stone contract toward the metal die during the MARK → PRESS handoff without rebuilding the material scene on every scroll frame. Without `sourceSize`, the capture follows `rect` as before.

`counterMatrix()` projects three points through the actual mesh hierarchy and the same orthographic camera used to render that pose. It restores the temporary pose and camera changes before returning. The caller can add its material rectangle's screen offset to `e` and `f` and connect that matrix to an SVG specimen's measured screen matrix. No percentage-based guess is needed for the bridge's endpoint.

The canvas dispatches bubbling `counterform:materials-lost` and `counterform:materials-restored` events when WebGL is lost/restored. Restoration rebuilds the GPU-generated PMREM environment, assigns it to both scenes, discards cached composition textures, refreshes shadows and invalidates the frame before announcing readiness; the old environment target is disposed. Initial failure returns `ready: false` with `info.reason`; it does not throw. The HTML/SVG scene is the complete fallback, so the caller should hide the canvas and preserve the native content on failure.

## Press timeline

| Progress | Physical state |
| --- | --- |
| `0.00–0.10` | Raised reversed face on the left; blank paper on the right. |
| `0.10–0.31` | Die lifts, travels to the paper and turns face down. |
| `0.31–0.40` | Face-down descent to the paper surface. |
| `0.40–0.46` | Contact; the ink impression appears beneath the die. |
| `0.46–0.57` | Die lifts from the impression; leftward separation begins at `0.50`. |
| `0.57–0.72` | Die returns left and turns face up. |
| `0.72–1.00` | Stable side-by-side comparison: reversed metal face and normal-reading ink impression. |

The timeline is a deterministic visual model, not a rigid-body simulation. Reverse scrolling reverses the entire sequence, including ink transfer. There is no hidden time accumulator, delayed effect, permanent local storage or independent animation loop.

The PRESS key light is more frontal than MARK's raking stone light. Its shorter projection keeps the die shadow inside the available canvas through the lift and stable hold, so it no longer ends in a hard horizontal cutoff at the canvas boundary. The die's contact height, travel and mirrored orientation are unchanged.

## Resource policy

- One transparent WebGL canvas shows a stable scene or composes two scenes during their handoff. There is one renderer and one application-owned animation clock.
- Three.js r180, physically based materials, an orthographic camera and soft shadow maps.
- Four local 512×512 deterministic surface maps, one 128×128 substrate contact-shadow map and one generated studio environment.
- Device pixel ratio is capped at 1.65; a second cap limits large drawing buffers to approximately 3.3 million pixels.
- Two lazily created RGBA8 framebuffer capture textures are bounded by that same canvas size: at most approximately 26.4 MB of combined color storage. There are no additional scene-depth or multisample render targets. The captures are reused and are disposed on context restoration or controller disposal.
- Shadow maps are 1024×1024. They update only on requested render frames.
- The geometry and camera adapt to the current canvas bounds; the surrounding mobile editorial composition remains owned by HTML/CSS.
- No render-loop, network, audio, video, font-fetch, control-listener or scroll-listener ownership.

## Dependency and rebuilding

The delivery contains both the prebuilt classic bundle and its readable source:

- `src/materials.js`
- `assets/materials.js`
- `assets/vendor/three.module.min.js`
- `assets/vendor/three.core.min.js`
- `licenses/Three-MIT.txt`

Three.js is pinned at **0.180.0** from the official NPM package: <https://registry.npmjs.org/three/-/three-0.180.0.tgz>. Upstream: <https://github.com/mrdoob/three.js/tree/r180>. The MIT license is retained. Geometry reference: <https://threejs.org/docs/#api/en/geometries/ExtrudeGeometry>. Rendering reference: <https://threejs.org/docs/#api/en/renderers/WebGLRenderer>.

The shipped bundle was produced with esbuild **0.25.10**. Rebuilding is optional; viewing the delivered exhibition needs no Node installation or package download.

```sh
npx --yes esbuild@0.25.10 src/materials.js --bundle --minify --format=iife --target=es2020 --outfile=assets/materials.js
```

## Validation

The isolated material harness passed in Chromium 138.0.7204.0, using software WebGL through SwiftShader. The Browser plugin was not available, so the existing Playwright runtime controlled the browser.

The flow under test was: local classic bundle → successful WebGL material construction → absolute MARK/PRESS progress → correctly oriented carve, metal die and retained impression.

- Seven key frames rendered successfully: MARK `0` and `0.6`; PRESS `0`, `0.24`, `0.41`, `0.56` and `0.8`.
- No JavaScript page error or console error occurred.
- A forward/backward replay to PRESS `0.8` produced a byte-identical browser screenshot.
- A 390px-wide mobile canvas rendered both scenes; the density cap limited a requested DPR of 2 to 1.65.
- Reduced motion at input progress 0 resolved to the completed impression state.
- The visual review refined the soft external stone shadow, kept the carved floor shadow physically separate, made the metal face neutral, restrained ink texture and began the separating movement earlier so the impression becomes visible sooner.

These isolated checks do not replace the full exhibition's six-viewport acceptance, scroll handoffs, controls, history restoration or non-WebGL fallback checks. Those are recorded with the exhibition's final browser acceptance record. The independent material harness and its scratch screenshots are intentionally excluded from the delivered source.

The final full-application context-loss recheck produced byte-identical PRESS and MARK screenshots before loss and after restoration. Desktop static fallback bounds and direct file opening were also rechecked successfully; see [QA.md](QA.md).

### Refinement validation — material module 1.1.0

The bounded material refinement check used the same Chromium/SwiftShader environment at 1440×900 and 390×844. All 32 checks passed with no JavaScript or console errors. It exercised nine dual-layer blend positions including both endpoints and the center, five PRESS poses, read-only counter projection and loss/restoration of a composed frame. Each restored composed screenshot was byte-identical to its pre-loss capture.

Three focused endpoint comparisons then rendered MARK at 821×747, PRESS at 1339×482 and a small PRESS at 367×321 through both the direct renderer and the GPU-cached compositor. Every RGB pixel matched exactly. At the central blend samples 0.49 → 0.50 → 0.51, the maximum channel change per step was 4/255 on both viewports, consistent with a continuous alpha change. The projection overlay visually aligned to the actual stone counter, mirrored raised counter and paper impression.

The first pass exposed a tone-mapping-order difference in the initial HDR-target approach; the final GPU framebuffer capture approach above resolved it. Fractional viewport placement also rounds the top inset and extent separately in device pixels, preventing a one-pixel shift at a standalone/composed canvas boundary. The final bundle preserves the original geometry and press contact timeline.

The fixed-source motion check at both 1440×900 and 390×844 instrumented actual WebGL framebuffer-copy calls. Each viewport made two initial captures; all 24 subsequent forward/reverse translation-and-scale frames reused those captures, leaving the count at two. Every render succeeded, the return-to-start screenshot was byte-identical, and no JavaScript or console error occurred.
