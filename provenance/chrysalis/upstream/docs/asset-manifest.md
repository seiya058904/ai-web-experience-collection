# CHRYSALIS — generated asset manifest

Reviewed: **9 November 2026**  
Tool: **built-in `image_gen.imagegen`**  
Generation record: **20 actual tool calls, 15 retained outputs**. Initial hatchling, feeding and hanging larval renders were corrected before handoff; two intermediate hatchling corrections were also rejected before selecting the third edit. AI-01 through AI-08 were generated and inspected before the main production layout.

## Interpretation and provenance

All images are original AI-generated digital illustrations for this project. They are not microscopy, photographs of a recorded individual, or measured sequences. Biology is explained by the separately sourced English text and intentionally labeled diagrams. The cinematic continuity follows one illustrated individual and one host environment.

No external photo or artwork was downloaded or redistributed. Generated output remains subject to the image service terms and applicable law; this manifest does not assert copyright exclusivity. No model identifier, seed, sampler, invented render settings or generation timing is claimed. The actual tool exposed the prompt, reference path and transparency choice; requested dimensions were prompt guidance, while the **actual returned dimensions** below are read from the files.

The authoritative machine-readable record, including every exact retained prompt, revision reason, reference identity, byte count and SHA-256, is [asset-provenance.json](../art/asset-provenance.json).

## Retained outputs

| ID | Actual pixels | File under public/assets | Role and selection |
| --- | --- | --- | --- |
| AI-01 | 1536 × 1024 | ai-01-concept-egg.webp | Concept A, selected as the visual reference: monumental ribbed egg and traceable diagonal vein. |
| AI-02 | 1536 × 1024 | ai-02-host.webp | Concept B, ecology framing; retained for the host-plant chapter. |
| AI-03 | 1536 × 1024 | ai-03-veins.webp | Concept C, warmer oblique vein cartography; retained as separately inspectable concept evidence. |
| AI-04 | 1659 × 948 | ai-04-hero.webp | Genuine reference refinement of AI-01; desktop hero, same egg and dominant vein. |
| AI-05 | 948 × 1659 | ai-05-mobile.webp | Independently composed portrait hero; vertical leaf arc, lower-middle egg, quiet upper text region. |
| AI-06 | 1659 × 948 | ai-06-jade.webp | Jade pupa, real visible silk pad and short cremaster. |
| AI-07 | 1659 × 948 | ai-07-emergence.webp | Newly emerged adult hangs below its empty shell with small crumpled wings. |
| AI-08 | 1659 × 948 | ai-08-pattern.webp | Same shell silhouette and silk pad; darkening wing pattern beneath intact surface. |
| AI-09 | 1659 × 948 | ai-09-hatch.webp | Opened shell and tiny pale hatchling; ventral contacts naturally occluded to avoid false leg topology. |
| AI-10 | 1659 × 948 | ai-10-feeding.webp | Tiny first instar at a fresh mouth-positioned notch. Posterior leg rendering corrected. |
| AI-11 | 1660 × 948 | ai-11-j-hang.webp | Corrected J-hanging larva with direct rear attachment; no pupal cremaster on larva. |
| AI-12 | 1659 × 948 | ai-12-adult.webp | Mature adult at the original two-leaf host, full composition and still fallback. |
| AI-13 | 1659 × 948 | ai-13-meadow.webp | Matching clean final backplate, butterfly entirely removed by image generation. |
| AI-14 | 1659 × 948 | ai-14-butterfly.webp | Genuine alpha foreground of the matching adult, same canvas and position. |
| AI-15 | 1660 × 948 | ai-15-unfolding.webp | Same hanging shell and adult, with visibly longer expanded wings before flight. |

The original retained PNG for each row is `art/generated/AI-XX.png`. Only selected originals are included; rejected larval attempts are described in provenance without being shipped.

## Visible comparison and corrections

- **A versus B versus C:** A provides the most legible pearl ribs and architectural egg scale. B deliberately changes to the whole host, where the egg becomes a small detail. C is a warmer low-angle vein study. These are separate generated compositions.
- **Desktop refinement:** AI-04 preserves A's diagonal vein, opaque ribbed shell and upper-right light. A full coherent backplate is used rather than an unreliable extracted egg that could expose duplicate subjects.
- **Mobile composition:** AI-05 is independently generated in portrait. The upper region is quiet green negative space; the egg is protected near the lower middle. It is not a desktop crop.
- **Jade and maturation:** AI-06 and AI-08 maintain the same stem, silk pad, shell position and camera. The later surface remains a physical shell rather than a floating ghost insect.
- **Emergence:** AI-07 and AI-15 are separate matched state illustrations. Their comparison shows crumpled versus expanded hanging wings; neither is presented as measured time-lapse footage.
- **Hatchling correction:** Independent review identified false pointed contacts continuing down the abdomen. Two narrow edits retained the issue and were rejected. The selected third edit naturally occludes the entire ventral contact line along the leaf while preserving egg, body and vein continuity. The three true legs are not visible in this angle; this image is not a leg-count diagram. The feeding image provides a separate visible anterior-contact view.
- **Feeding correction:** The first attempt rendered posterior contacts like too many hard walking legs. The selected revision shows three anterior true-leg contacts and occludes abdominal contacts naturally behind the leaf margin.
- **J-hang correction:** The first attempt retained a black pupal stalk and excessive prolegs. The selected revision removes the stalk, brings the larval rear directly to silk, and simplifies abdominal contacts. The explanatory SVG carries precise anatomical labels rather than treating rendered details as measurements.
- **Final departure:** AI-13 contains no remaining adult. AI-14 contains only the same adult over true alpha. Moving this separate foreground therefore reveals the original leaf, without leaving a second butterfly underneath.

## Foreground compositing

AI-13 and AI-14 have the same full canvas: **1659 × 948**. Overlay them with identical sizing, crop and object position before applying departure motion to the foreground. The adult's visible alpha bounds at threshold 5/255 are approximately **x822–1402, y235–541**. At higher opacity the bounds lie within that rectangle. Alpha ranges from 0 to 255. The generator left a small number of imperceptible alpha 1–4 pixels elsewhere; no manual thresholding or scene manipulation was applied.

Use AI-12 as the composed static alternative if the foreground cannot load. Do not layer AI-14 over AI-12 during departure, because that would leave a duplicate adult in the backplate.

## Optimization and fallback behavior

Production conversion uses WebP quality 88 and method 6, preserving original dimensions and alpha. All fifteen production files total **1,491,734 bytes** before transport compression. No color retouching, object painting, masking, inpainting or compositing was performed with Python.

Each non-alpha image also has a 240-pixel-wide WebP thumbnail in `public/assets/fallbacks/`. The same bytes are embedded as data URIs in `src/fallbacks.json`, keyed by the complete production basename including `.webp`. Its size is **46,458 bytes**. These embedded chapter-specific images are independent of a network request for the main asset; they allow the text and interaction states to retain a recognizable corresponding still when external asset requests fail. The alpha layer intentionally has no fallback thumbnail; the composed adult plate provides its static alternative.

Format conversion and thumbnail resizing are the only non-generative image transformations. All biological scene changes, refinement, background removal and clean-backplate creation used actual image-generation calls.

## File integrity

Every selected original and production WebP was opened and fully decoded after conversion. A zero-byte hatch WebP discovered during a later scan was restored from the intact original and re-decoded successfully. After the later anatomy correction, its final size is **91,028 bytes** and its final SHA-256 appears in the provenance record. The revised original, WebP and fallback were decoded as temporary sibling files and then atomically replaced, preventing incomplete bytes from being served during preview.

These checks verify file integrity and provenance. Browser composition, cropping, interaction, scroll continuity and visual fidelity must be verified separately against the actual site.

