# IMAGO — sources, provenance, and redistribution

## Biological references

[biology.md](biology.md) maps the life-history writing and anatomy criteria to primary sources, including [Monarch Joint Venture](https://monarchjointventure.org/monarch-biology/life-cycle), the [American Museum of Natural History](https://www.amnh.org/exhibitions/butterflies/metamorphosis), and [Monarch Watch](https://monarchwatch.org/biology/). Institutional names and links provide attribution; they do not imply endorsement of IMAGO.

The project contains original writing and AI-created artwork. It contains no externally sourced wildlife photograph, institution logo, copied research diagram, field recording, or 3D model. References informed the explanation; their images and page layouts were not redistributed.

## Generated-image inventory

The natural-history images are **artistic reconstructions**, not real wildlife photography or measured internal imaging. The one-individual narrative, common setting, matched lighting, and compressed chronology are artistic decisions.

[image-generation.json](image-generation.json) records **31 returned image-generation outcomes** from `image_gen.imagegen`: **27 canonical art roles and four registration revisions**. Each entry records the submitted prompt, returned PNG basename, output dimensions, local WebP path, page role, recorded processing, and adoption status where applicable. The tool did not expose seeds; the entries say so. This is an output record rather than a claim of seed-based reproducibility.

The current source and production directories each contain **58 local WebP files**, confirmed by the [release asset audit](../evidence/asset-audit-release.json) and [release packaging audit](../evidence/package-audit-release.json):

| Files | Count | Dimensions |
| --- | ---: | --- |
| Current full-size landscape roles | 26 | 1536 × 1024 |
| Independently composed mobile hero | 1 | 1024 × 1536 |
| Retained superseded registration frames, `*-first.webp` | 4 | 1536 × 1024 |
| Landscape responsive derivatives, `*-768.webp` | 26 | 768 × 512 |
| Mobile hero responsive derivative | 1 | 768 × 1152 |

The 58 WebPs occupy **3,241,246 bytes** in `public/art/`; this is stored asset size, not an assertion that every file downloads at the entrance. Three of the 27 canonical roles preserve the hero candidate directions. The four retained original full-size registration frames preserve the correction history. Their replacements supply the current scene roles.

Every WebP has an adjacent **`.webp.json` prompt sidecar**: 58 sidecars totaling **57,187 bytes**, with exact prompt matches to the corresponding generation records. Impeccable's `embed-prompt` writes adjacent JSON for this format; the project does not claim that those prompts are embedded in the binary WebP metadata. The release audit records identical image and sidecar copies in `public/` and `dist/`, with no missing documented artwork, orphan sidecars, or public-to-production mismatches. Provenance sidecars do not alter image pixels.

`src/media-manifest.json` contains 27 matching art roles and 27 embedded, stage-specific WebP fallbacks: 26 at 256 × 171 and the portrait hero at 256 × 384. No signed image URL or image-generation service is required at runtime. Recorded conversion settings are WebP quality 87 for full-size artwork, quality 82 for 768-pixel derivatives, and quality 62 for embedded fallbacks. Resizing and encoding are delivery processing; they do not add biological detail.

[asset-selection.md](asset-selection.md) explains the chosen hero direction and revisions. [art-review.md](art-review.md) records bounded source-image observations and their limits. AI generation and visual review do not certify every anatomical detail. The strongly green shell in the emerging artwork, exact markings, relative instar sizes, and continuous identity across separately generated frames remain artistic approximations.

## Fonts

The site uses locally bundled **Cormorant Garamond** and **Inter** with `font-display: swap`. The dependency versions are pinned in `package.json` and the lockfile: `@fontsource/cormorant-garamond@5.3.0` and `@fontsource/inter@5.3.0`. Each package declares `OFL-1.1`. Its original notice is retained unchanged in [Cormorant-Garamond-OFL.txt](licenses/Cormorant-Garamond-OFL.txt) or [Inter-OFL.txt](licenses/Inter-OFL.txt).

The current `dist/assets/` contains these ten font files, totaling **275,004 bytes**:

| Face | WOFF2 file | WOFF file | Notice |
| --- | --- | --- | --- |
| Cormorant Garamond Latin 400 normal | `cormorant-garamond-latin-400-normal-B-1hWBU7.woff2` | `cormorant-garamond-latin-400-normal-B7YtguxJ.woff` | Cormorant Garamond OFL |
| Cormorant Garamond Latin 400 italic | `cormorant-garamond-latin-400-italic-Dc_OZ8oc.woff2` | `cormorant-garamond-latin-400-italic-BLh7T8o8.woff` | Cormorant Garamond OFL |
| Cormorant Garamond Latin 500 normal | `cormorant-garamond-latin-500-normal-BsRWmXhO.woff2` | `cormorant-garamond-latin-500-normal-zIXX3Q-H.woff` | Cormorant Garamond OFL |
| Inter Latin 400 normal | `inter-latin-400-normal-C38fXH4l.woff2` | `inter-latin-400-normal-CyCys3Eg.woff` | Inter OFL |
| Inter Latin 500 normal | `inter-latin-500-normal-Cerq10X2.woff2` | `inter-latin-500-normal-BL9OpVg8.woff` | Inter OFL |

These are observed build filenames; a later build-tool change can alter hashed names. The font licensing and face mapping remain attached to the corresponding font family.

## Code and dependency notices

[LICENSE](../LICENSE) applies the MIT license to original project code and documentation. It preserves separate terms for third-party fonts and dependencies and makes no claim of exclusive copyright or scientific authenticity for AI-created imagery.

The source contains the dependency manifest and lockfile. Direct dependency versions are pinned. Original package notices are included unchanged:

| Package | Version | Retained notice |
| --- | --- | --- |
| Lenis | 1.3.27 | [MIT](licenses/Lenis-MIT.txt) |
| Vite | 8.3.6 | [MIT and bundled notices](licenses/Vite-LICENSE.md) |
| TypeScript | 7.0.2 | [Apache-2.0](licenses/TypeScript-Apache-2.0.txt) |

These are the versions in this project, not recommendations about later releases. Vite and TypeScript are build dependencies; Lenis is included in the browser application.

## Sound and other media

The optional sound starts off. `src/main.ts` synthesizes a deterministic eight-second filtered-noise loop with the Web Audio API: fixed seed 71354, a low-pass filter at 460 Hz, and output gain 0.09. The code starts it after an explicit button action, suspends it while the document is hidden, and labels it a composed air soundscape. No external audio file or field-recorded wildlife sound is used. The seed here belongs to audio synthesis, not image generation.

The asset inventory contains no video or 3D-model file. The site uses generated stills, DOM/CSS motion, and an explicitly nonmeasured explanatory SVG.

## Scope of this inventory

This document records files, manifest entries, notices, and source-code behavior. It does not claim an audible check, browser interaction pass, physical-device test, archive extraction pass, or zoological certification. Browser and delivery evidence belong in the separate verification report. The generated stills do not support arbitrary-angle 3D inspection, precise organ-position claims, or measured developmental timing.
