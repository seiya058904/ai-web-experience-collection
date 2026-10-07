# Original violin structural study

The selective real-time study is authored in `src/model-geometry.ts` and assembled in `src/violin-model.ts`. It does not use a downloaded instrument model. The conceptual reference image informed the warm lighting and modest structural opening; its pixels are not used as geometry.

## Construction

The outline is a continuous sequence of original Bézier curves with upper and lower bouts, projecting corners and concave C-bouts. The two f-holes are actual holes cut into an arched spruce plate. Planar triangulation is subdivided three times before the vertices are displaced into the crown. Separate surfaces describe the finished face, unfinished underside and thin cut walls.

The ribs are a hollow shell with distinct outer and inner surfaces. A second arched plate closes the back. The rim includes two dark purfling lines and a narrow varnished edge. Six small blocks, rib linings, a longitudinal tapered bass bar and a slender treble-side sound post establish the interior. The neck, heel, hollow pegbox, scroll, ebony fingerboard, bridge, tailpiece, saddle, endpin and four strings are also original geometry.

The bass bar attaches below the bass side of the top. The sound post stands on the treble side, behind the bridge. These positions are illustrative. This is an artistic structural interpretation; it is not a measured luthier plan, a named instrument replica, a dismantling tutorial or a simulation of material mechanics.

For the chapter reveal, the front assembly lifts gently while the ribs and back remain largely together. This intentionally separates the visible structural relationships without presenting an engineering explosion. The instrument begins assembled and opens toward the following interior study. The modern chinrest is omitted to keep the historic body contours visible.

## Materials and rendering

The spruce and figured-maple texture crops are selected project AI assets. Their exact originals and prompts belong in the main asset provenance manifest. Clearcoat, soft studio reflections and a restrained lighting rig are generated in code. One 1024-pixel directional shadow map grounds the interior relationships. Ebony uses an original deterministic grain texture generated at runtime; no external HDRI or model service is required.

The transparent WebGL canvas fills its assigned stage. Geometry is built once. The caller owns the only ticker and calls `render(localProgress, timeInSeconds, reducedMotion)`. The study creates no RAF loop, no scroll listener and no resize listener. It renders only when called, after both material images have loaded and their GPU textures are initialized. Pixel ratio is capped at 1.45 for smaller views and 1.65 otherwise; a 3.2-million-pixel drawing-buffer budget also limits rendering at large desktop resolutions. Texture anisotropy is capped at 4. The caller keeps the photographic fallback visible when WebGL initialization or material loading fails.

## Public API

```ts
const study = new ViolinStudy(container);
study.available;                  // false when WebGL cannot be initialized
await study.ready;                 // check available first; rejects an image-load failure
study.resize(width, height);      // CSS pixels of its actual container
study.render(progress, seconds, prefersReducedMotion);
study.model;                      // the original THREE.Group
await study.exportGLB();          // binary ArrayBuffer; textures embedded
study.dispose();                  // release resources and remove its canvas
```

When `available` is true, wait for `ready`, then render the first frame before hiding the photographic fallback. Premature `render()` calls leave the transparent canvas untouched. The readiness promise rejects a genuine material-image failure with its filename, allowing the caller to retain the fallback. No hidden polling or independent frame is scheduled.

`exportGLB()` awaits the same material readiness, normalizes the model into the assembled pose and exports only the authored object. It excludes the studio, camera and background. The exported GLB is a reusable companion asset; source remains the authoritative procedural model.

The delivered `models/violin-study.glb` is a glTF 2 binary with 64 meshes, 12 materials and 3 embedded texture images. It has no external image URI. Clearcoat, refractive-index and texture-transform extensions describe the finish; the optional bump extension adds fine surface detail in supporting viewers. The source renderer remains the reference for its lighting and the structural opening.

## Validation

The module passes strict TypeScript checking, including unused declarations. Geometry positions, normals and texture coordinates are finite. Sampled outline/f-hole contours have no self-intersections, and both hole contours are fully inside the plate silhouette. An isolated Chromium 153 / SwiftShader browser run rendered the closed and open desktop composition at 1600 × 1000 and the mobile composition at 390 × 844. The native progress control changed the model pose in both directions. The final run had no page errors or console errors. The GLB header, declared length, embedded images and scene structure were inspected after export.

These checks establish geometry, rendering and local interaction behavior. They do not claim physical material measurements, acoustic accuracy, real-device GPU performance or a complete app-wide scroll audit; those belong to the broader site acceptance work.

## Rights

The procedural geometry and ebony texture were created for this project. The included Three.js runtime and exporter retain their upstream MIT license. Generated spruce/maple imagery is identified separately in the project provenance files. No proprietary museum model, scan or texture is included.
