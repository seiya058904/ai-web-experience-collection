# FOSSIL — Provenance and material ledger

Production date: **7 October 2026**.

FOSSIL — Deep Time in Stone is an authored digital exhibit. Its photographic appearance, scientific references, and catalog typography do not identify a real museum object. The project contains four different source classes: original application code; AI-generated raster imagery; authored synthetic data and geometry; and separately licensed third-party software/fonts.

## 1. What the exhibit claims

The specimen is an **interpretive ammonite study**. `FSL—001` is an internal artwork identifier, not an accession number. No geological age, collecting locality, species diagnosis, physical scale, scanner model, or measured voxel size is assigned.

The scientific thread is grounded in the sources in [RESEARCH.md](RESEARCH.md): sediment can bury remains, several mechanisms preserve form, preparation exposes evidence, and imaging can reveal interior structure. The pictured specimen and generated numerical field are illustrations of that thread, not observations taken from those sources.

## 2. AI-generated visual development

All **ten scene concepts** were generated for this project with the built-in OpenAI image-generation tool. Their intended role was visual development: material, light, composition, typography, and the stable frame for each chapter.

| Chapter | Concept file | Exact prompt |
| --- | --- | --- |
| 01 · Specimen | `reference/01-specimen.png` | `reference/01-specimen.prompt.txt` |
| 02 · Strata | `reference/02-strata.png` | `reference/02-strata.prompt.txt` |
| 03 · Burial | `reference/03-burial.png` | `reference/03-burial.prompt.txt` |
| 04 · Preservation | `reference/04-preservation.png` | `reference/04-preservation.prompt.txt` |
| 05 · Exposure | `reference/05-exposure.png` | `reference/05-exposure.prompt.txt` |
| 06 · Amber | `reference/06-amber.png` | `reference/06-amber.prompt.txt`, plus `06-amber.refinement.prompt.txt` |
| 07 · Scan | `reference/07-scan.png` | `reference/07-scan.prompt.txt` |
| 08 · Reconstruct | `reference/08-reconstruct.png` | `reference/08-reconstruct.prompt.txt` |
| 09 · Archive | `reference/09-archive.png` | `reference/09-archive.prompt.txt` |
| 10 · Deep Time | `reference/10-deep-time.png` | `reference/10-deep-time.prompt.txt` |

The concept images are **1586 × 992** pixels. The Scan and Reconstruct concepts are generated design references, not scientific scan frames and not the numerical source of the working browser reconstruction. See [VISUAL-BIBLE.html](VISUAL-BIBLE.html) for their curated presentation.

## 3. Production image source-to-file mapping

All seven production PNG originals were generated or edited with image generation specifically for this project. The exact prompt shares each original's basename. The production plates remove embedded typography and controls; the application reconstructs text, controls, lines, masks, and motion natively.

The original production PNGs are retained without subsequent pixel editing. The seven WebP files are format-encoded derivatives of those same-named PNGs.

| Production WebP | Generation original and prompt | Source category and production instruction | Dimensions |
| --- | --- | --- | --- |
| `assets/images/hero-slab.webp` | `assets/ai-originals/hero-slab.png` + `hero-slab.prompt.txt` | AI edit of the opening visual concept: remove typography and the empty background; retain the cropped fossil-bearing slab with actual alpha. | 1586 × 992 |
| `assets/images/specimen.webp` | `assets/ai-originals/specimen.png` + `specimen.prompt.txt` | AI edit/outpainting of the specimen visual concept: a complete irregular specimen slab, with transparent margins and no text. | 1585 × 992 |
| `assets/images/strata.webp` | `assets/ai-originals/strata.png` + `strata.prompt.txt` | Fresh AI production geology plate: four bed groups, smaller laminae, no embedded fossil, no labels; native alpha above the upper edge. | 1586 × 992 |
| `assets/images/preservation.webp` | `assets/ai-originals/preservation.png` + `preservation.prompt.txt` | AI edit of the Preservation concept: retain relief, impression, limestone and composition; remove all generated type and UI rules. | 1585 × 992 |
| `assets/images/exposure.webp` | `assets/ai-originals/exposure.png` + `exposure.prompt.txt` | AI edit of the Exposure concept: retain specimen, matrix, loose grains and physical tool; remove type, controls and drawn boundary overlays. | 1586 × 992 |
| `assets/images/amber.webp` | `assets/ai-originals/amber.png` + `amber.prompt.txt` | AI extraction/edit of the finished Amber concept: preserve the irregular resin object and minute indeterminate inclusion; remove background, text and cast shadow with actual alpha. | 1584 × 993 |
| `assets/images/archive-drawer.webp` | `assets/ai-originals/archive-drawer.png` + `archive-drawer.prompt.txt` | AI edit of the Archive concept: preserve drawer, ammonite, fragment, supports and blank physical catalog paper; remove all text and graphic rules. | 1585 × 992 |

The archive production plate was made through a full-image generative edit, not by cropping a text-free region out of the concept. Its catalog lettering is native browser text positioned over the real blank card in the image.

### Encoding and alpha

Production conversion used **`ffmpeg` / `libwebp`**, with **`-quality 91 -compression_level 6`**. It did not crop or change image dimensions. Alpha was retained where present: the hero slab, isolated specimen, strata, and amber originals contain alpha; the preparation, preservation, and archive plates have opaque RGB originals.

This is WebP encoding, not a claim of lossless RGB equivalence to the PNGs. Exact prompts remain in sidecars. Textual provenance metadata embedded in a WebP is supplementary to the sidecar and source relationship; adding that metadata is distinct from editing or regenerating image pixels.

The final file inventory, sizes, hashes and embedded metadata are recorded in [ASSET-MANIFEST.json](ASSET-MANIFEST.json).

## 4. Procedural data and model lineage

The interactive scan and reconstructed volume come from one seeded, authored scalar field generated by [generate_volume.py](../../provenance/fossil/verification/generate_volume.py). They are not derived from AI image pixels or a downloaded fossil dataset.

| Representation | Source and meaning |
| --- | --- |
| `data/ammonite-density.u8` | A **192 × 192 × 72** unsigned-byte field, ordered Z/Y/X with X contiguous; **2,654,208 bytes**. Values are authored relative grayscale, without calibrated physical units. |
| `data/sections/section-000.png` through `section-071.png` | **72** lossless grayscale planes from the stored byte array. These are synthetic sections, not acquired X-ray slices. |
| `data/fossil-volume.js` | The same field plus a quantized representation of its extracted mesh, embedded for offline classic-script loading. No runtime remote data request is required. |
| `models/ammonite-interpretive.obj` | A Marching Cubes isosurface extracted from that stored field at relative density **112**, containing **190,744 vertices** and **378,128 triangles**. |
| `data/volume-metadata.json` | Dimensions, orientation, seed **20261007**, source hashes, extraction threshold, missing regions, and limitations. |
| `models/procedural-parameters.json` | Authored spiral, rib, chamber and missing-patch parameters plus model statistics and field identity. |

The field uses unitless model coordinates. Ribs, chamber partitions, mineral-density variation, fractures and missing patches are authored. External ribs and internal septa are distinct procedural structures. The two missing outer patches indicate intentionally absent material, not quantified anatomical uncertainty.

Every displayed section uses a single fixed volume frame and contain-style scaling. Thin outer sections therefore stay thin and properly placed. The complete generated surface image fades into a contour bridge and then a complete synthetic grayscale section; the transition does not assert that the generated photograph was scanned.

The hardware path and the **768 × 776 CPU fallback** render the same extracted mesh. The fallback is selected for mobile, reduced motion, missing hardware graphics support and software-graphics environments. It is not a separately generated specimen or an enlarged slice thumbnail. Format and renderer details remain in [data/README.md](../../public/fossil/data/README.md) and [data/RENDERING.md](../../public/fossil/data/RENDERING.md).

### Marching Cubes table

`models/marching-cubes-table.json` adapts the standard edge/triangle lookup table from the **Three.js MarchingCubes addon**. This is third-party algorithmic table data, not a fossil mesh or measurement.

- Upstream source recorded in the bundled notice: https://github.com/mrdoob/three.js/blob/dev/examples/jsm/objects/MarchingCubes.js
- Copyright: **2010–2026 three.js authors**.
- License: **MIT**, retained in [MARCHING_CUBES_LICENSE.txt](../../public/fossil/models/MARCHING_CUBES_LICENSE.txt).
- The complete Three.js runtime is not bundled or loaded. The project's renderer and field generator are original code around this table.

## 5. Third-party runtime and font sources

| Component | Local files | Upstream / copyright | License |
| --- | --- | --- | --- |
| **Lenis 1.3.26** | `vendor/lenis.min.js` | darkroom.engineering; https://github.com/darkroomengineering/lenis | [Lenis MIT](../../public/fossil/licenses/Lenis-MIT.txt) |
| **Bodoni Moda** | `assets/fonts/bodoni-moda.woff2` | Bodoni Moda Project Authors; https://github.com/indestructible-type/Bodoni | [SIL OFL 1.1](../../public/fossil/licenses/Bodoni-Moda-OFL.txt) |
| **Cormorant Garamond** | `assets/fonts/cormorant-garamond.woff2`, `cormorant-garamond-italic.woff2` | Cormorant Project Authors; https://github.com/CatharsisFonts/Cormorant | [SIL OFL 1.1](../../public/fossil/licenses/Cormorant-Garamond-OFL.txt) |
| **Manrope** | `assets/fonts/manrope.woff2` | Manrope Project Authors; https://github.com/googlefonts/manrope | [SIL OFL 1.1](../../public/fossil/licenses/Manrope-OFL.txt) |

The website uses three font families in four local WOFF2 files. The offline Visual Bible additionally embeds a 750-character WOFF subset of Droid Sans Fallback Regular, extracted from the runtime MuPDF / PyMuPDF CJK font resource. Its Apache 2.0 license and subset-modification notice are embedded at the end of `VISUAL-BIBLE.html` (anchor `font-license`); a separate copy is retained in [Droid-Sans-Fallback-Apache.txt](../../public/fossil/licenses/Droid-Sans-Fallback-Apache.txt), with upstream inventory links. The additional font is used by that handbook only. Their licenses remain attached to the fonts; the project's MIT license does not relicense them. Lenis is the only global smooth-scroll authority. The website does not contact a CDN or Google Fonts at runtime.

The supplied `requirements-procedural.txt` records optional generator dependencies, not bundled browser runtime files (the standalone requirements file is omitted and recorded in [IMPORT.json](../../provenance/fossil/IMPORT.json)): NumPy **2.3.5**, SciPy **1.17.0**, and Pillow **12.3.0**. Their source packages are not redistributed here. The supplied site and data run without installing them.

## 6. Original material and license boundaries

The root [MIT License](../../public/fossil/LICENSE.txt) covers original application source, scripts, native vector artwork, documentation, authored scalar data, and model outputs. Original implementation is located in `index.html`, `src/`, and `scripts/`; the field, sections, and model are generated outputs. The borrowed Marching Cubes table retains its own MIT notice.

Generated raster imagery has a separate [AI Assets Notice](../../public/fossil/licenses/AI-Assets-Notice.md). This document does not claim a museum's open-access license for those images, public-domain status, or exclusive human authorship.

## 7. Research and delivery boundaries

The eight museum and geological sources in [RESEARCH.md](RESEARCH.md) were consulted for factual grounding. **No external museum photographs, specimen scans, CT measurements, or existing fossil models were incorporated into the production imagery or synthetic field.** Their inclusion as reading links does not imply affiliation or endorsement.

All core content and dependencies are local. Only a user-initiated external reference link requires Internet access. Saving the study record creates a local JSON download.

The intended delivery is the complete project ZIP. No OpenAI Sites workflow or public deployment was used. Final browser observations and material limitations are recorded separately in [UPSTREAM-VALIDATION.md](UPSTREAM-VALIDATION.md); this provenance ledger is not a substitute for a test report.
