# MAGMA — Asset Provenance

Recorded for this project on 7 October 2026. See [asset-prompts.json](../../provenance/magma/asset-prompts.json) for the complete prompt strings, selection history, reference relationships, delivered file paths, dimensions and SHA-256 hashes.

Paths quoted in the supplied generation record describe the original ZIP. In the Collection, the eighteen plates and Archivo font live in `public/magma/materials/` and `public/magma/fonts/`; prompt sidecars and full concepts live in `provenance/magma/`. Original sidecar and image bytes are preserved. The duplicate supplied Lenis distribution is replaced by the byte-identical installed 1.3.26 package. The host's import manifest records each original path and its destination or omission. See [IMPLEMENTATION.md](IMPLEMENTATION.md) for the runtime boundary.

## What the images are

All material plates and visual concepts were made for MAGMA using OpenAI’s built-in `image_gen__imagegen` tool. They are **AI-generated artistic reconstructions**, not documentary photographs of an eruption, a named geological site or an examined rock specimen. The words “photographic,” “photorealistic,” and similar expressions in the preserved prompts specify an intended visual style.

The work compares related volcanic materials and compresses geological time. Composition, cooling history and visible texture differ between its studies. Prompt percentages, camera coordinates, suggested resolutions and descriptions of physical behavior are creative directions; they are not measured thermal data, telemetry or scientific validation.

The USGS and NPS photography consulted during research informed material observation only. **No photographs from those research pages are reused in the package.** The image-generation references recorded here are earlier AI-generated images from this project. Scientific grounding and its limits are described in [RESEARCH.md](RESEARCH.md).

## Generation and curation

The source records contain **21 generation or edit rounds**: 17 marked selected, one selected for a different scene, and three rejected. The archive retains every recorded prompt, including the rejected drafts and refinement prompts. Rejected images, superseded mobile variants and intermediate PNG copies are excluded.

| Record | Decision | Delivered use or reason |
| --- | --- | --- |
| `concept-hero-v1` | Rejected | The outline read as a mountain and the external light made the black stone too grey. |
| `concept-hero-v2` | Selected | A blunt, heavier black monolith became the PRESSURE concept. |
| `concept-glass` | Selected | Full GLASS viewport concept with broad reflected light. |
| `molten-study-v1` | Repurposed | Its partially cooled, ropy folds became FLOW; a separate image was generated for MOLTEN. |
| `asset-pressure` | Selected | UI removal from the selected hero concept; clean desktop PRESSURE plate. |
| `asset-glass` | Selected | UI removal from the GLASS concept; clean desktop GLASS plate. |
| `asset-fracture` | Selected | Curved, scooped obsidian fracture study. |
| `asset-stone` | Selected | Fine-grained basalt with restrained mineral inclusions. |
| `asset-sealed` | Selected | Generative edit of PRESSURE with the hot seam changed to a dark trace. |
| `concept-skin` | Selected | Full SKIN viewport concept over the selected material plate. |
| `concept-mobile` | Selected | Portrait opening concept, with material and typography recomposed for a narrow viewport. |
| `asset-molten-v1` | Selected | Distinct thick molten folds beneath a thinner skin. |
| `asset-skin-v1` | Selected | Older porous crust against younger folded skin; diagonal cooling boundary. |
| `asset-crack-v1` | Rejected after refinement | Exterior fill and a broad yellow patch were too strong; retained only as the recorded reference for v2. |
| `asset-crack-v2` | Selected | Darker exterior, finer internal hot core and a restrained continuous seam. |
| `asset-pressure-mobile-v1` | Selected | Clean portrait production edit of the mobile concept, with its UI removed. |
| `asset-sealed-mobile-v1` | Selected | Matching portrait edit with the seam cooled to neutral black and graphite. |
| `asset-flow-mobile-v1` | Selected after comparison | Dedicated portrait with large lower and right-side molten folds and dark space behind the actual copy. |
| `asset-flow-mobile-v2` | Rejected | The targeted refinement sharpened texture but did not improve the small edge intrusion; v1 retained more natural material coherence. |
| `asset-glass-mobile-v1` | Selected | Monumental lower-half obsidian with reflections placed below a clear upper copy zone. |
| `asset-stone-mobile-v1` | Selected | Lower-half granular basalt slope and restrained inclusions beneath a clear upper copy zone. |

The rows group the available generation records; they are not a timed execution transcript. The PRESSURE / SEALED pairs aim for matching composition and seam placement. Generative edits can vary fine local texture, so the pairs should not be described as pixel-identical images.

The three additional portrait studies followed real mobile browser QA: desktop-derived crops placed dense mineral detail or reflected light behind the FLOW, GLASS and STONE copy. Their former 960 × 540 mobile files were replaced. Only the old versions’ dimensions, byte counts, hashes and replacement relationships remain in `supersededArtifacts`; their image files are not included. The desktop plates remain part of the final material series.

## Delivered raster assets

All 22 delivered raster files are WebP images. PNG generation outputs were encoded and compressed with **sharp**. Four retained mobile variants were downsampled with sharp. The new FLOW, GLASS and STONE portrait files use **WebP quality 91, effort 6**, at their native dimensions. No artificial upscaling was applied. Several prompts requested 2560 × 1440 or higher; those requests are preserved as prompts, while the verified native output dimensions are stated below.

Each final WebP is accompanied by a same-name **`.webp.json` provenance sidecar** containing its complete selected or repurposed generation prompt. The same prompts and their full curation history are collected in [asset-prompts.json](../../provenance/magma/asset-prompts.json). Impeccable’s `embed-prompt` workflow uses these adjacent JSON files for WebP; it does not insert an XMP or EXIF chunk into the image container. All 22 sidecar prompt strings were checked against their generation records and match exactly.

The raster files were not rewritten during this provenance pass. All 22 decoded RGB pixel hashes match the values captured beforehand. Final image dimensions, byte counts, container SHA-256 hashes, pixel checks, and sidecar paths, byte counts and SHA-256 hashes are recorded in the central manifest. The asset set contains **22 WebP images and 22 prompt sidecars**. The package retains these source records, not the generated source PNGs.

### Four full-frame concepts

| File | Actual dimensions | Purpose |
| --- | --- | --- |
| [concepts/pressure.webp](../../provenance/magma/concepts/pressure.webp) | 1672 × 941 | Selected desktop PRESSURE design. |
| [concepts/skin.webp](../../provenance/magma/concepts/skin.webp) | 1672 × 941 | Selected desktop SKIN design. |
| [concepts/glass.webp](../../provenance/magma/concepts/glass.webp) | 1672 × 941 | Selected desktop GLASS design. |
| [concepts/mobile.webp](../../provenance/magma/concepts/mobile.webp) | 853 × 1844 | Selected portrait opening design. |

These are complete concept frames, not contact sheets or cropped thumbnails. Their pictured typography is retained for design reference. The running website uses clean material assets with its own HTML text and controls.

### Nine desktop and nine mobile plates

Every desktop plate is native **1672 × 941**. Five mobile plates have dedicated portrait generation/edit passes: **PRESSURE, FLOW, GLASS and SEALED are 853 × 1844; STONE is 830 × 1896**. PRESSURE and SEALED derive from the selected mobile concept. FLOW, GLASS and STONE were recomposed from their respective material references after mobile QA. The four remaining variants—MOLTEN, SKIN, CRACK and FRACTURE—are **960 × 540** downsampled desktop plates.

| State | Desktop plate | Mobile plate | Mobile dimensions |
| --- | --- | --- | --- |
| PRESSURE | [pressure.webp](../../public/magma/materials/pressure.webp) | [pressure-mobile.webp](../../public/magma/materials/pressure-mobile.webp) | 853 × 1844 |
| MOLTEN | [molten.webp](../../public/magma/materials/molten.webp) | [molten-mobile.webp](../../public/magma/materials/molten-mobile.webp) | 960 × 540 |
| FLOW | [flow.webp](../../public/magma/materials/flow.webp) | [flow-mobile.webp](../../public/magma/materials/flow-mobile.webp) | 853 × 1844 |
| SKIN | [skin.webp](../../public/magma/materials/skin.webp) | [skin-mobile.webp](../../public/magma/materials/skin-mobile.webp) | 960 × 540 |
| CRACK | [crack.webp](../../public/magma/materials/crack.webp) | [crack-mobile.webp](../../public/magma/materials/crack-mobile.webp) | 960 × 540 |
| GLASS | [glass.webp](../../public/magma/materials/glass.webp) | [glass-mobile.webp](../../public/magma/materials/glass-mobile.webp) | 853 × 1844 |
| FRACTURE | [fracture.webp](../../public/magma/materials/fracture.webp) | [fracture-mobile.webp](../../public/magma/materials/fracture-mobile.webp) | 960 × 540 |
| CRYSTAL · STONE | [stone.webp](../../public/magma/materials/stone.webp) | [stone-mobile.webp](../../public/magma/materials/stone-mobile.webp) | 830 × 1896 |
| SEALED | [sealed.webp](../../public/magma/materials/sealed.webp) | [sealed-mobile.webp](../../public/magma/materials/sealed-mobile.webp) | 853 × 1844 |

The JSON record uses paths relative to the project root. It contains no working-machine absolute paths. Omitted PNGs and rejected outputs are identified by generation record IDs, not by links to files that are absent from the package.

## Third-party material

| Component | Recorded distribution | Local files | License and source |
| --- | --- | --- | --- |
| Archivo variable font | `@fontsource-variable/archivo` **5.3.0** | `assets/fonts/archivo-latin-variable.woff2`, from the package’s `files/archivo-latin-wght-normal.woff2` | [Local SIL Open Font License 1.1](../../public/magma/licenses/Archivo-OFL.txt) · [Fontsource package 5.3.0](https://www.npmjs.com/package/@fontsource-variable/archivo/v/5.3.0) · [Archivo / Omnibus-Type](https://github.com/Omnibus-Type/Archivo) |
| Lenis | `lenis` **1.3.26** | `vendor/lenis.mjs` and `vendor/lenis.css` | [Local MIT license](../../public/magma/licenses/Lenis-MIT.txt) · [Official Lenis repository](https://github.com/darkroomengineering/lenis) |

**5.3.0 is the Fontsource npm package version**, not a claim about the font’s embedded design-version identifier. The local font and Lenis license texts are retained unchanged. These distributions are already included; the visitor does not need to install npm dependencies or fetch a font from the internet.

The remaining material transformations, fracture geometry, interface and synthesized sound are authored project code. No third-party model, recorded sound sample or texture pack is included. sharp was used during asset preparation; it is not a runtime dependency of the delivered website.

Technical references include the [official Lenis documentation](https://github.com/darkroomengineering/lenis) and [MDN WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices). They are references for implementation choices, not additional bundled assets.
