# AURORA — architecture

## Files

- `pages/aurora/index.html`: the independent document, chapters, controls, Sources dialog and `noscript` note.
- `experiences/aurora/src/model.js`: pure relationships. No DOM and no clock. Covered by `tests/aurora-model.test.mjs`.
- `experiences/aurora/src/renderer.js` and `shaders.js`: WebGL2 path.
- `experiences/aurora/src/fallback.js`: Canvas 2D path with the same `resize`, `draw`, `adapt`, `dispose` surface.
- `experiences/aurora/src/main.js`: lifecycle, scroll, interface state, overlays, export.
- `public/aurora/`: poster, social image, favicon and notices. The Earth texture is ORBITAL's existing `orbital/media/earth-texture.png`, requested only when the film first approaches space.

## State flow

`state` holds the visitor's four inputs and an emission selection. `derive()` turns them into pressure, standoff, flaring, activity and sky state through `model.js`. `view` chases those targets for display. `sceneAt(progress, aspect)` gives every camera and crossfade value directly from scroll, so scrubbing backwards retraces the film exactly.

## Rendering

**Sky.** Each ribbon is a line of texels (fold offset, brightness, ray top, lower edge) written every frame by `writeRibbons` into a 4096×3 `RGBA16F` texture. The fragment shader marches a spherical shell from 85 to 340 km, with samples crowded near the lower border. Each sheet is a thin Gaussian across the ray, integrated analytically between samples with the linear-offset closed form, so a sheet a few kilometres thick cannot alias at any step length. Colour and ray brightness are read at the computed crossing point rather than the step's end. Earth's curvature is applied, so low-latitude views show only high red light above the true horizon. A mirrored pass gives the lake; a 1D skyline texture holds ridges and conifers.

**Space.** One analytic fragment shader draws Earth, the shells that carry the oval, and the meridian diagram. The magnetopause uses the Shue form. The solar wind uses the stream and potential functions of a Rankine half-body, so streamlines are exact potential flow that runs straight upstream and bends around the boundary. Dipole shells are stretched downwind. The oval is computed in Sun-fixed magnetic coordinates while Earth's texture rotates beneath it through `geoMatrix`.

**Crossfade.** Space draws first, then the sky blends over it with a constant alpha, only during handoffs.

## Budgets and failure

- Resolution is capped at 1.5 DPR and 1.7 million pixels. `adapt()` lowers the render scale to 0.5 and reduces march steps when frames run long, and raises them when there is headroom.
- Drawing stops when the page is hidden or the dialog is open. Under still mode a frame is drawn only when something changes.
- A failed WebGL2 context or shader falls back to Canvas 2D on a fresh canvas element. A lost context rebuilds when the browser restores it.
- The HTML layer never depends on the renderer. Controls and text work on every path, and the poster covers the moment before the first frame.

## Lifecycle

All listeners use one `AbortController`. `dispose()` removes the ticker callback, the scroll trigger and Lenis, and releases the GL context. The page starts only its own runtime and returns through the shared Collection control.
