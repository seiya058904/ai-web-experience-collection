# Imaging component

This component illustrates an authored chambered fossil. It does not display a
real CT volume or claim a real specimen, measured scale, diagnostic calibration,
or validated reconstruction.

## Offline loading

Load `data/fossil-volume.js` before `src/imaging.js` as classic scripts. They work
from `file://`; no runtime network access, imports or fetch calls are required.

```js
const imaging = new FossilImaging({
  scanCanvas,
  volumeCanvas,
  thumbs: [canvas1, canvas2, canvas3, canvas4, canvas5],
  onReady(instance) { /* instance.ready is true when data is available */ }
});
imaging.resize(viewportWidth, viewportHeight, renderScale);
```

`ready`, `sectionCount` (72), `thumbSections` and `renderer` are readable fields.
The class owns no animation loop. Its host supplies calls only while a scene is
active and calls `dispose()` when the component is no longer needed.

## Coordinates and controls

`rect = {x, y, width, height}` is in CSS pixels on the full-screen canvas. The
render scale accepts fractional values below one, so a 4K host can cap pixels.

`renderScan({section, alpha, rect, progress, motion, time})` uses a zero-based
section index from 0 through 71. Every section shares one density-volume frame.
That frame fits inside `rect` without a change of aspect ratio. A thin outer
section remains thin and correctly positioned rather than zooming to fill the
viewport. The host owns the slider and any photographic transition.

`drawContour(ctx, {rect, progress, color, alpha})` uses the same frame as the scan.
It derives the outer contour from the volume's density projection. The original
`{x, y, size}` arguments remain valid: `(x,y)` is the upper-left corner of a
`size × size` outer frame, inside which the contour is fitted and centered.
`progress` reveals a fraction of its arc length.

`renderVolume({progress, mode, alpha, rect, motion, time, pointer})` accepts
`mode: 'outline' | 'volume'`; `time` is in seconds and pointer coordinates are
small normalized offsets. The host supplies labels and mode controls. Motion
adds only a restrained pose drift and depth assembly. Missing patches are
retained in both modes.

The photographed specimen and the synthetic field have distinct sources. A
full-photo fade, native contour bridge and complete section reveal communicate
that handoff without falsely asserting a pixel-aligned scan of the photograph.

## Render paths

Hardware WebGL uses the density-derived indexed mesh and 48 actual isocontour
planes. Planes are edge geometry extracted at the same relative density as the
mesh; they do not shade large empty transparent quads. Surface normals come
from the source density gradient with the voxel spacing accounted for.

The fallback uses a 768 × 776 CPU raster of that same mesh, a depth buffer,
interpolated normal-based shading and 16 vector section planes. It is selected
for mobile, reduced motion, missing graphics support and software graphics
devices. It preserves a fixed readable pose. Neither path is a desaturated
photograph or a second independently generated fossil.

The main scan cache retains at most 12 section canvases. GPU resources are
released after failures and disposal. The fallback remains available through
the same supplied DOM canvas, including after a graphics context is lost.

## Verification

`python scripts/generate_volume.py --verify` compares all 72 PNGs to the raw
voxel planes, decodes and compares the browser field, checks OBJ/browser vertex
alignment and normals, checks padding, and samples the original field at mesh
vertices. `verification.json` records the results. These are consistency checks,
not evidence of scientific validity.

The standard marching-cubes lookup table is provided in `models/` with the
Three.js MIT license. The density field, generation functions, renderer and
software rasterizer are authored project code.
