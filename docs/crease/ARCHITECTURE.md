# CREASE — architecture

## Files

- `pages/crease/index.html`: the independent document, chapters, controls, notes dialog and `noscript` still.
- `experiences/crease/src/model.js`: exact geometry with no DOM and no clock. Covered by `tests/crease-model.test.mjs`.
- `experiences/crease/src/renderer.js`: Three.js path.
- `experiences/crease/src/fallback.js`: SVG path with the same surface (`setCreases`, `setFacets`, `setView`, `project`, `resize`, `render`, `dispose`).
- `experiences/crease/src/main.js`: lifecycle, scroll, interface state, corner drag, download.
- `public/crease/`: poster, social image, favicon and notices.

## Geometry

Every pattern produces the same structure: facets with a flat polygon and its folded points. A facet is defined by three flat and three folded reference points, and any point inside it maps through that rigid motion. This allows arbitrary clipping: patterns are generated past the sheet's edge and clipped to one rectangle, so the outline never changes.

- **Line.** One half stays down and the other rotates about the crease.
- **Vertex.** Four sectors form a spherical four-bar linkage. Crease 4 turns about crease 1 by a driver angle, and crease 3 is solved in closed form from its two fixed sector angles. `vertexLimit` scans the motion until the linkage binds or a crease closes. With Kawasaki's condition all four close together; otherwise the readout reports how far the rest stay open. The result is rotated so the whole sheet faces up and rests on the table.
- **Miura.** Closed-form cell dimensions from one fold angle. Vertices follow `x = iS`, `y = jL + (i odd) V`, `z = (j odd) H`. Tests confirm edge lengths, planarity and the shared-edge condition.

Stage changes happen at `reveal = 0` and fold zero, when every pattern is the same flat rectangle.

## Rendering

- Two meshes share one non-indexed geometry: cobalt front faces and white back faces. Normals come from Newell's method per facet.
- Crease lines are drawn into a canvas texture in flat sheet coordinates, then mixed into the diffuse colour in the shader. They fold with the paper and need no line geometry. A radial wipe reveals a new pattern, and the lines fade as the paper folds so geometry takes over.
- A directional light casts PCF shadows onto the sheet itself and onto a `ShadowMaterial` plane. The canvas is transparent and sits above the title, so that shadow falls on the type.
- Pixel ratio is capped at 2. The scene renders only when marked dirty, so a resting page uses no GPU.

## Interaction

`state` holds the raw inputs and `shown` chases them for display. Dragging the corner handle writes to the same state as the Pull slider, which is the keyboard and assistive route. The handle is `aria-hidden` and outside the tab order.

## Failure paths

If WebGL is unavailable, the canvas is replaced by the SVG renderer, which uses the same facets with depth sorting and flat shading. Without JavaScript, a still and a note are shown. All listeners share one `AbortController`, and `dispose()` removes the ticker callback, scroll trigger and Lenis and releases GPU resources.
