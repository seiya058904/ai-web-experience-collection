# CREMA — reusable models

These two self-contained GLB files are exported from the same procedural geometry that the website renders. No external mesh, scan, scientific figure or measured coffee-particle dataset is used.

| Model | Contents | Compatibility | Size |
|---|---|---|---|
| `fractured-coffee-granule.glb` | The first detailed macro fragment from `PorousWorld.makeHeroFragments()`, at its original authored scale. | Core glTF 2.0, standard PBR material. | 48.5 KiB |
| `packed-coffee-bed.glb` | The complete 1,512-particle desktop bed, in five size bands, at stage 2.65. | glTF 2.0 with `EXT_mesh_gpu_instancing`. | 138.9 KiB |

## What is preserved

Fragment vertex positions, normals and UVs come directly from the runtime meshes. The bed retains the original deterministic particle positions, rotations, scales and instance colours. Its five geometries are shared by the particles, keeping the complete volume compact. The model is centred in its own material coordinates; the website's presentation camera, page offset and cinematic framing are omitted.

The packed bed requires a viewer or DCC importer that supports `EXT_mesh_gpu_instancing`. Importers without that extension may reject it or show only the base fragment forms. The single-fragment file requires no extensions.

## What remains in the website

These files are portable **dry geometry snapshots** with a plain, texture-free rough brown standard PBR material. The website's cellular material detail, HDR lighting, advancing saturation front, changing roughness, pressure interpretation, tracer transport, path competition and extraction colour progression remain in `src/visuals/PorousWorld.js`. Those custom shaders are not glTF material features and are not claimed to be baked into these files. No HDR environment or production image is duplicated inside the GLBs.

The cinematic granule detail image is supplied separately at `public/assets/granule.webp`; its production master and provenance accompany the project. The exact original procedural albedo and height maps are supplied separately in production/textures; their generator remains in the canonical source.

## Scale and scientific interpretation

Coordinates use authored scene units, with **Y up**, X across the bed section and Z into it. They are not particle measurements in millimetres. The deliberately heterogeneous geometry and connected void space are an artistic interpretation of fractured porous coffee. The snapshots are **not measured micro-CT, a permeability prediction, or CFD output**.

## Reproduce

From the project directory, after `npm ci`:

```sh
node scripts/export-models.mjs
```

The command imports the actual runtime class, uses its CPU geometry and packing routines, and writes these models. It needs no browser, GPU, network access or extra packages. It also performs a glTF loader round-trip, confirms particle counts and finite bounds, and checks that the files have no external buffers or embedded textures. Each GLB is limited to 5 MiB.

`models-manifest.json` records model hashes, bounds, counts and the SHA-256 of the canonical source used for this snapshot. Run the command again after any geometry changes.

## Rights

The procedural geometries and export script are original project assets distributed under the project's **MIT License**. No third-party model attribution is required. Three.js and its exporter/loader are used under their MIT terms; the project's dependency notices cover them. AI production-image provenance is documented separately; no AI image is embedded in these GLBs.
