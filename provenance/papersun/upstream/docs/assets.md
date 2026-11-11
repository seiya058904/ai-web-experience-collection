# PAPERSUN — Artwork, provenance and byte budget

Reviewed 9 November 2026. Every image listed below came from an actual built-in `image_gen.imagegen` call. The eight required concepts were generated as eight distinct outputs; the production workflow also generated three chapter environments and three clean-plate edits. Original returned images were inspected visually before selection or production editing.

## Eight required image outcomes

| ID | Inspectable file in source ZIP | Exact prompt record | Selected role and rationale |
| --- | --- | --- | --- |
| AI-01 | `art/concepts/ai-01.webp` | `art/concepts/provenance.json`, AI-01 | Selected hero concept: dark circular absence, one warm attic, textured roofs, left title safety |
| AI-02 | `art/concepts/ai-02.webp` | `art/concepts/provenance.json`, AI-02 | Rejected opening alternative; useful tactile character reference, but decorative gold offcuts exceed three |
| AI-03 | `art/concepts/ai-03.webp` | `art/concepts/provenance.json`, AI-03 | Rejected opening alternative; strong attic depth, but many lit windows and a dominant foreground lamp |
| AI-04 | `art/concepts/ai-04.webp` | `art/concepts/prompts-refinement.json`, ai-04 | Selected refined desktop hero; distributed to the app as `public/art/hero.webp` |
| AI-05 | `art/concepts/ai-05.webp` | `art/concepts/prompts-refinement.json`, ai-05 | Selected independent portrait hero, recomposed rather than cropped; `public/art/hero-mobile.webp` |
| AI-06 | `art/concepts/ai-06.webp` | `art/concepts/prompts-main.json`, ai-06 | Selected wind-hill material master; cleaned before production so SVG controls the wheel and exact piece B |
| AI-07 | `art/concepts/ai-07.webp` | `art/concepts/prompts-main.json`, ai-07 | Lighting/material reference only; generated seam geometry is not the canonical sun geometry |
| AI-08 | `art/concepts/ai-08.webp` | `art/concepts/prompts-main.json`, ai-08 | Selected bridge-to-attic midpoint reference and production midpoint raster |

All concepts are retained at their generated pixel dimensions. AI-05 is 853 × 1844 pixels. The other seven are 1586 × 992 pixels. The portrait generation was prompted around a 390 × 844 CSS viewport; that CSS target is not claimed as the returned raster dimensions.

## Additional production environments and clean plates

| Generation | Exact prompt and original-path record | Distributed asset | Purpose |
| --- | --- | --- | --- |
| Attic background | `art/extra-backgrounds.json`, attic | `public/art/attic.webp` | Empty repair desk, one amber lamp, thread and tools; live character and note can be placed without duplicates |
| Market background | `art/extra-backgrounds.json`, market | `public/art/market.webp` | Dimensional market and one unlit foreground lantern; no baked narrative piece |
| Valley closed-shade background | `art/extra-backgrounds.json`, valley | Superseded by the clean valley below | Original edit input; the baked shade was unsuitable for an independent moving overlay |
| Wind clean plate | `art/clean-plates.json`, wind | `public/art/wind.webp` | Removes AI-06's rotor and gold fragment while retaining the pole, axle, grass, lamp and thread |
| Valley clean plate | `art/clean-plates.json`, valley | `public/art/valley.webp` | Removes the shade and light slit, leaving the arch empty and preserving the pivot pin |
| Exterior bridge | `art/clean-plates.json`, bridge | `public/art/bridge.webp` | Replaces AI-08's indoor half with a complete outdoor return bridge and distant warm attic |

The clean valley output is **1585 × 992** pixels; its actual one-pixel width difference is recorded rather than silently rounded. Other chapter backgrounds are 1586 × 992 pixels.

The metadata records approximate normalized overlay slots observed in each image. These are practical placement guides, not segmentation masks or claims of exact object coordinates.

## Known generation parameters

- Tool: built-in `image_gen.imagegen`.
- Explicit background parameter: `transparent_background: false`.
- AI-01/02/03 were new generations without image references.
- AI-04/05 used AI-01 as their selected-concept reference.
- The extra attic, market and valley scenes used AI-01 as a paper-material, palette and lighting reference.
- Each clean-plate edit used its exact recorded source image after visual inspection.
- Original exact prompts are preserved in the JSON files listed above; they include composition, text exclusions and object-preservation instructions.
- The tool did not return a model identifier, random seed or sampling settings. None is fabricated here. Prompted aspect ratios are instructions, not undocumented API parameters.

## Derivatives and integrity

The distributed images were encoded with Pillow as WebP using `quality=88` and `method=6`. There was **no crop, resize, image synthesis or creative modification during compression**. WebP is lossy; the file-size reduction is not described as lossless.

`art/asset-derivatives.json` is the authoritative manifest for all 16 distributed raster files. Each entry gives its original PNG source, pixel dimensions, exact byte count, encoder settings and SHA-256 of the distributed file. The generation JSON records preserve the separate SHA-256 values of unmodified PNG originals and explicitly mark them as excluded from the source ZIP.

Original PNG and base64 paths in the generation records are historical working paths. They are not runtime dependencies. The source ZIP contains optimized WebP files, prompts and provenance; the website reads only production assets under `public/art/`.

## Measured production byte budget

| Production file | Pixels | Bytes | Approx. KiB |
| --- | ---: | ---: | ---: |
| `hero.webp` | 1586 × 992 | 181,526 | 177.3 |
| `hero-mobile.webp` | 853 × 1844 | 213,830 | 208.8 |
| `attic.webp` | 1586 × 992 | 238,678 | 233.1 |
| `market.webp` | 1586 × 992 | 188,798 | 184.4 |
| `wind.webp` | 1586 × 992 | 252,470 | 246.6 |
| `valley.webp` | 1585 × 992 | 172,194 | 168.2 |
| `bridge.webp` | 1586 × 992 | 216,564 | 211.5 |
| `transition-midpoint.webp` | 1586 × 992 | 258,296 | 252.2 |
| **Production total** | | **1,722,356** | **1,682.0** |

The eight retained concept derivatives add 2,138,984 bytes. All distributed raster art totals 3,861,340 bytes (3.68 MiB). The corresponding production PNG inputs total 20,314,133 bytes, so the production encoding saves approximately 91.5% of those bytes. These measurements concern file sizes; they do not establish LCP, FPS, network throughput or a physical-device performance claim.

## Rights and attribution

The artwork is original AI-generated output requested specifically for this PAPERSUN project. The prompts do not name a living artist, animation studio, existing franchise, celebrity or recognizable existing fictional character. No third-party illustration, photograph or music sample was downloaded into these image assets.

These files are included as part of the user's requested distributable source deliverable. No exclusive copyright, uniqueness guarantee or independent third-party-rights clearance is promised. Technical documentation consulted for implementation is evidence for API behavior, not a license for unrelated source artwork. Font and software licenses are separate from this image provenance and should be retained with their respective distributed assets and dependencies.

The story is original fiction. Its city, Mira, repair ritual and missing paper sun are not presented as traditional folklore or factual cultural history.

## Visual inspection notes

The selected wide and portrait images retain a dark cutout rather than a luminous moon, visible paper thickness, coherent blue/cream material, one small warm attic and the red thread. The wind and valley clean plates were specifically inspected for remaining baked moving objects and duplicate gold. The final source uses code-defined fragment geometry instead of relying on the generated shape in AI-06 or seams in AI-07.

Browser composition, text safety, interaction state and transition continuity still require their own real browser evidence. Image inspection alone does not establish those results.
