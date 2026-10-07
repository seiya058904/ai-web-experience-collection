# LUTHIER — Asset Provenance

Record date: **2026-10-07**.

The instrument is an original synthetic interpretation of an **unnamed violin**. No image is presented as a photograph, scan or verified reconstruction of a historical instrument. This document records origin and processing; it does not assert exclusive rights in generated imagery.

## Design sequence

The process recorded in [DESIGN.md](DESIGN.md) was: research → multiple complete screen concepts → comparison and rejection → refined production assets → code composition → local browser review.

Ten full-screen composition candidates were reviewed and nine section directions selected. The additional Hero candidate placed a smaller violin at a distance in a room with a plinth. It was rejected because the surrounding setting weakened the brief's monumental object scale. The close, extreme crop became the production direction. **The rejected image is not included.**

The selected screen concepts preserve their generated typography as design references. They are not flattened production pages. Live HTML owns every final heading, navigation item, label and control. Production image edits removed concept typography and UI; the application adds native masking, light, grain paths, structural geometry, strings and acoustic motion.

## Eight final production AI originals

**Generator:** OpenAI built-in image generation. **Generation date:** 2026-10-07.

The complete production and concept prompts are preserved in [assets-originals/manifest.json](../../provenance/luthier/assets-originals/manifest.json). The PNGs below are the selected final production originals, not discarded generations.

| Original PNG | Dimensions / mode | Production asset | Purpose and treatment |
| --- | --- | --- | --- |
| `assets-originals/hero.png` | 1672 × 941, RGBA | `public/assets/hero.webp` | Monumental varnished body cutout. Native alpha allows real typography occlusion; reused for Return. |
| `assets-originals/wood.png` | 1672 × 941, RGB | `public/assets/wood.webp` | Raw figured-maple material plate, cleared of generated type and graphic traces. |
| `assets-originals/inside.png` | 1672 × 941, RGB | `public/assets/inside.webp` | Synthetic interior macro study with a slender post and longitudinal bar; overlaid with original light and sectional SVG. |
| `assets-originals/tension.png` | 1672 × 941, RGB | `public/assets/tension.webp` | Bridge/background plate. Baked strings were removed so all four strings can be drawn and moved in code. |
| `assets-originals/bow.png` | 724 × 2172, RGBA | `public/assets/bow.webp` | Isolated bow-stick and hair segment. Native alpha supports controlled live approach and contact. |
| `assets-originals/craft.png` | 1672 × 941, RGB | `public/assets/craft.webp` | Quiet structural-reveal fallback image. Main Craft rendering uses authored geometry instead. |
| `assets-originals/spruce.png` | 1672 × 941, RGB | `public/assets/spruce.webp` | Additional raw-spruce material plate with fine straight grain. |
| `assets-originals/ebony.png` | 1672 × 941, RGB | `public/assets/ebony.webp` | Additional dark-ebony material plate with restrained satin light. |

The browser uses WebP derivatives to reduce transfer and decode cost while the PNG originals remain available for further editing. Both transparent originals contain real alpha, including fully transparent pixels. No background-removal claim relies on a painted checkerboard.

### Original PNG checksums

SHA-256 identifies the selected originals in this record. Production styling and code remain independently editable.

| File | SHA-256 |
| --- | --- |
| `hero.png` | `32e3144264530f89312ad1547c5e68127afcf4f4bc6dc41614276c1b386b432f` |
| `wood.png` | `ca12a17912f14cccb0d4a01f9bbe28f476a8fcd8c76fa4ff0829ba32745e59f4` |
| `inside.png` | `1835594352b8cc97ca65a1b478aaed9b7654e79525fd5a4cd5a6f408d032e84c` |
| `tension.png` | `6b50d2e92e107fe07a99c4e5db7cd5dac8ddb7f0264738d1aa394d7490d5c34a` |
| `bow.png` | `55b3460de560c5cb904899a2bad5555490db97c8c801f05d4d9605b6369a3e43` |
| `craft.png` | `8be721ba3f65c5dc5d4bf4930431e7de5384a710575abeafee98bd1c33048334` |
| `spruce.png` | `98821f29dbf6a90ca06a1cac55511db7da0ba32baf2aa62cd63a30f9f8f9652e` |
| `ebony.png` | `1a01e47555f2dea3510db974b47c0db8a6dd9828865c7d8a7beea1e9fb95162c` |

### Texture derivatives

The two model texture plates are crops of the same generated originals, not downloaded textures. Crop coordinates are in original PNG pixels and are also recorded in the manifest.

| Derivative | Source | Crop `(left, top, width, height)` | Subsequent use |
| --- | --- | --- | --- |
| `public/assets/spruce-texture.webp` | `assets-originals/spruce.png` | `(1310, 590, 300, 340)` | Resampled for the authored model's material UV mapping. |
| `public/assets/maple-texture.webp` | `assets-originals/wood.png` | `(1090, 560, 440, 340)` | Resampled for the authored model's material UV mapping. |

### Composition after asset selection

The selected bitmap is one layer of each final scene. The browser performs these additional treatments:

- **Presence / Return:** separate foreground alpha and typography, viewport-specific crop, a moving varnish mask and live edge/string paths. Mobile uses a different lower-right crop with a feathered entry and a localized dark region behind the small copy.
- **Wood:** three independently selectable plates, a separate mobile crop, a feathered exit into the paper ground, and material-specific live grain traces.
- **Craft:** the production photograph is reserved for reduced motion or unavailable WebGL. The main scene renders original geometry and generated texture crops; mobile reframes the model and feathers the entering neck. Desktop lets the neck leave the viewport naturally.
- **Inside:** an authored f-hole path opens the image; local raking light and a native sectional SVG remain separate from the plate. Mobile uses a closer crop and local contrast around the navigation and reading area.
- **Tension / First Bow:** all tension strings are drawn in code, registered to the retained bridge. The isolated bow is separately sized for desktop and mobile, its hair edge registered to the same contact geometry, and its ends feathered beyond the shot. Timing and proportions serve the enlarged visual study.
- **Resonance / Space:** no production bitmap defines the acoustic field. Sampled instrument contours are drawn live. On mobile, gentle local attenuation in that field protects the small explanatory text and the space-opening input; the reduced-motion plate uses the same treatment.

These choices are editable in `src/main.ts`, `src/style.css`, `src/field.ts` and the model modules. They do not alter or overwrite the preserved PNG originals.

## Nine selected concept screens

These are selected visual references, exported as WebP for the documentation. Their prompts are retained in the manifest.

| File | Selected direction |
| --- | --- |
| `docs/concepts/01-presence.webp` | Extreme crop, amber object, deep black field, overlapping serif typography. |
| `docs/concepts/02-wood.webp` | Bright raw-material interlude and a compact material selector. |
| `docs/concepts/03-craft.webp` | Gentle separation of related layers, retained alignment and warm inner surfaces. |
| `docs/concepts/04-inside.webp` | A tiny wooden cavity perceived as a substantial spatial interior. |
| `docs/concepts/05-tension.webp` | Long fine strings and a pale bridge held in black negative space. |
| `docs/concepts/06-bow.webp` | Slow contact between hair and string, followed by the first restrained motion. |
| `docs/concepts/07-resonance.webp` | Instrument-related contour families with clear negative space. |
| `docs/concepts/08-space.webp` | The curve language expands into a full-viewport spatial sculpture. |
| `docs/concepts/09-return.webp` | Return to the same object and opening visual identity. |

Generated microcopy, geometry mistakes or interface marks in a reference screen are not authoritative. The source implementation and factual notes in [RESEARCH.md](RESEARCH.md) define the final experience.

## Original code, geometry and audio

- **Geometry:** `src/model-geometry.ts` and `src/violin-model.ts` contain the original parameterized study. `models/violin-study.glb` is its companion export with embedded material images. No museum model, commercial asset, instrument scan or external HDRI is included. See [MODEL.md](MODEL.md).
- **Live graphics:** SVG and Canvas paths, grain traces, string displacement, bow-contact animation and acoustic curves are authored project systems. They are not extracted graphs from an acoustics paper.
- **Light:** Highlight masks, room lighting and restrained surface effects are composed in code around the selected assets.
- **Audio:** `src/audio.ts` generates harmonic oscillators, filtered seeded noise, subtle vibrato and a synthesized reverberation impulse. There are no sampled performances or external audio files. The pitch, timbre and room response are artistic sound design.
- **Scientific boundary:** Timing and displacement are enlarged for visibility. Acoustic contours are interpretations, not measured modes or certified response data. Bow hair contacts the speaking span between fingerboard and bridge; the wooden stick is not the contact surface.

## Fonts

All six WOFF2 files are byte-identical copies of Latin subsets in the installed Fontsource 5.3.0 packages, with shorter project filenames. The source font software is not modified.

| Project filename | Upstream package file |
| --- | --- |
| `cormorant-300.woff2` | `@fontsource/cormorant-garamond/files/cormorant-garamond-latin-300-normal.woff2` |
| `cormorant-300-italic.woff2` | `@fontsource/cormorant-garamond/files/cormorant-garamond-latin-300-italic.woff2` |
| `cormorant-400.woff2` | `@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-normal.woff2` |
| `cormorant-400-italic.woff2` | `@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-italic.woff2` |
| `dm-sans-400.woff2` | `@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff2` |
| `dm-sans-500.woff2` | `@fontsource/dm-sans/files/dm-sans-latin-500-normal.woff2` |

The complete upstream SIL Open Font Licenses and copyright notices are preserved under [licenses](../../public/luthier/licenses/README.md).

## Research-only materials and licensing boundary

The museum, luthier, photography and acoustics URLs in [RESEARCH.md](RESEARCH.md) document factual and visual research. **No image, recording, diagram, animation or scan from those sites is shipped.** Charles Brooks's photography supplied a conceptual reference for interior scale; no Brooks image is included or used as a production texture.

The root MIT license covers original project code and documentation only within its stated scope. Third-party dependencies retain their own terms. AI-generated raster imagery is recorded separately and is not relabeled as MIT, public domain, a named maker's work, or an exclusively owned photographic record.
