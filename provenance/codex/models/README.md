# CODEX — reusable completed book model

`codex-complete.glb` is a self-contained glTF 2.0 binary snapshot of the completed, closed book. It was exported from the same procedural geometry used by the website, with the desktop signature count and the exact `chapter: 9, progress: 0, open: 0` state. All image data and geometry buffers are embedded; the file has no external resource paths.

The website continues to construct its animated book from `src/book.js` and `src/model/paper.js`. This GLB is a portable static asset for a 3D viewer, editor, or another project. It is not a replacement for the deterministic folding, sewing, wrapping, pressing, or opening systems.

## Geometry and orientation

| Property | Value |
| --- | --- |
| Front of closed cover | +Z |
| Spine | −X |
| Long axis | Y |
| Paper-block dimensions | 3.4 × 4.8 × 0.66 scene units |
| Complete closed bounds | Approximately 3.549865 × 4.921 × 0.827 scene units |
| Signatures | 12 |
| Sheets per signature | 4 |
| Represented leaves | 96 |
| Rendered mesh instances | 152 |
| Shared glTF mesh definitions | 41, containing 46 primitives |
| Triangles across all instances | 26,312 |
| Materials | 15 |
| Embedded texture images | 15 |
| Binary size | 7,663,592 bytes / 7.31 MiB |

Original scene units are preserved. Apply a uniform scale in your receiving application if a physical size is required; a scale of approximately `0.04877` makes the complete book 0.24 units tall.

The model retains the completed book's paper signatures, structural sewing, linen supports, spine lining, endbands, boards, cloth, marbled pastedowns, and gold details, including structure enclosed by the closed case. Inactive construction groups—the loose sheet/folding study, free construction thread, and stamping die—are omitted. Runtime instancing is expanded into ordinary nodes that share meshes; no instancing extension is required.

The narrow fore-edge gold accent sits at local `z = 0.20`, below the overhanging front-board lip. Its original thin dimensions are preserved; this position allows the completed object's authored views to reveal a hairline of warm metal.

Detailed construction parameters and craft simplifications are recorded in `public/models/book-spec.json`.

## Portable material treatment

The runtime uses a custom `onBeforeCompile` material for the gradual foil/deboss reveal. That shader cannot be represented directly in glTF. For this export, the exact existing title mask and latest black-cloth color were baked into standard metallic-roughness PBR textures:

- A 1024 × 1024 embedded base-color texture combines the black cloth with the physical cover title and subtitle. It is baked from the original 1024 × 1536 title surface before the export resolution cap is applied; the geometry UVs preserve the title's proportions.
- A metallic-roughness texture retains matte cloth and restrained metallic lettering, using the runtime's final roughness and metalness values.
- A tangent-space normal texture combines cloth relief with an approximate 0.003-scene-unit title recess.
- Other procedural bump textures are converted to normal textures. The spine title's alpha mask is baked into an RGBA texture.

The resulting file requires no custom GLSL. It uses only `KHR_texture_transform` in addition to core glTF 2.0, to preserve texture tiling.

### Snapshot texture optimization

One export-only image optimization reduced the binary from 22,788,988 bytes to 7,663,592 bytes, a 66.4% reduction. Mesh sharing, geometry, UVs, texture repeats, and source runtime assets are unchanged.

| Image category | Embedded format and resolution |
| --- | --- |
| Opaque photographic cloth, paper, and marbled albedos | JPEG, 1024 × 1024, Chromium canvas default quality (approximately 0.92) |
| Cover base color with baked title, title normal, and metallic-roughness | PNG, 1024 × 1024 |
| Spine title with alpha | PNG, 256 × 1024 |
| Other procedural bump-to-normal conversions | PNG, maximum 512 pixels per axis |
| Other procedural color maps | PNG, maximum 1024 pixels per axis |

The file contains three JPEG images and twelve PNG images. The exporter caps each image axis at 1024 pixels. Alpha, fine text, normal data, and metallic-roughness data are kept in PNG; only the three opaque photographic albedos use lossy encoding. The compact snapshot therefore has less microscopic relief detail than the source materials, while the cover title remains legible. Full source image and runtime texture resolutions remain available elsewhere in the project.

**Material limitations:** normal maps approximate the runtime's differential bump and deboss shading; the exported surface is not physically displaced by the title. Runtime sheen, time-varying foil reveal, pressure animation, and other shader-specific light response are omitted. Appearance depends on the receiving viewer's lighting, exposure, tone mapping, and texture-transform support. No studio lighting, camera, or environment map is included in the asset.

The website also applies a small raster depth bias to the trimmed folio-edge surfaces to reduce interference with nearby paper caps. That renderer setting is not encoded in this standard PBR export; geometric positions remain intact. The final depth-bias settings and the fore-gilt position are recorded in the metadata, alongside the source hashes.

There are no skeletal rigs, animation clips, morph targets, or interactive cover controls in this static snapshot. Use the procedural source for reversible construction and opening.

## Verification and provenance

The file was exported locally with Three.js `0.186.1` and `GLTFExporter`, then loaded from its binary buffer with `GLTFLoader`. Validation confirmed the glTF 2.0 header, nonempty mesh/material/buffer data, embedded images with no external references, finite vertex positions, expected bounds, and a successful render of the reloaded model. The export/reload produced no browser warnings or errors.

`codex-complete.meta.json` contains the exact byte size, binary SHA-256, source-file SHA-256 hashes, mesh/material/image counts, bounds, omitted groups, material-bake settings, and validation results. The procedural source remains authoritative if later interactive states or construction changes are needed.

The model incorporates the project's selected AI cloth, paper, and marbled textures together with procedural maps. Their original files and provenance are included under `assets/ai-final/` and `art-direction/`. Cover text was rasterized from the bundled Cormorant and Manrope fonts; font binaries are not embedded inside the GLB. The corresponding font and dependency licenses are in `licenses/`.
