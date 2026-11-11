# CHRYSALIS — Asset production

Reviewed: 9 November 2026  
Scope: retained art, conversion and safe replacement. Browser QA is documented separately.

## What was actually produced

The project made **20 built-in `image_gen.imagegen` calls** and retained **15 outputs**. Required AI-01 through AI-08 were generated and inspected before production layout. Three materially distinct hero concepts were considered; AI-01 was selected and genuinely refined into AI-04. AI-05 was independently composed in portrait.

Additional outputs provide hatch, feeding, hanging larva, adult, clean final backplate, transparent adult and a later wing-expansion posture. Five calls produced unselected results: the first feeding and J-hang renders, the first hatchling render, and two unsuccessful hatchling corrections. The retained files exclude these rejected images; their reasons and prompts remain in provenance.

Use [asset-provenance.json](../art/asset-provenance.json) for exact prompts, actual parameters, original and production paths, dimensions, byte counts and hashes. Use [asset-manifest.md](asset-manifest.md) for the human-readable selection review.

## Known settings and dimensions

Only the actual tool inputs are claimed: prompt, supplied reference image(s) and `transparent_background`. Transparency is true for AI-14 and false for all other retained outputs. The tool did not expose a model identifier, seed or quality setting; none is invented.

| Output group | Actual returned dimensions |
| --- | --- |
| AI-01, AI-02, AI-03 | 1536 × 1024 |
| AI-04, AI-06 through AI-10, AI-12 through AI-14 | 1659 × 948 |
| AI-11, AI-15 | 1660 × 948 |
| AI-05 portrait | 948 × 1659 |

Prompted dimensions were art direction rather than an exact API setting. The retained raster dimensions above govern real available detail. High-resolution CSS layouts scale those pixels; they are not native 4K outputs.

## Production transformation

Original selected PNGs remain in `art/generated/`. Production WebPs retain their original dimensions and use **quality 88, method 6**. Alpha is preserved for AI-14. The only Python image operations were format conversion, thumbnail resizing, decoding and integrity inspection. Biological editing, clean-background creation and transparency extraction used actual image-generation calls.

Every non-alpha image has a **240-pixel-wide WebP fallback at quality 65** in `public/assets/fallbacks/`. The same bytes are embedded in `src/fallbacks.json`, keyed by production basename including `.webp`. Alpha fallback is intentionally provided through the complete adult still rather than a separate low-resolution cutout.

Current totals after the hatchling correction:

- Production WebPs: **1,491,734 bytes**.
- Retained original PNGs: **26,822,053 bytes**.
- Embedded fallback JSON: **46,458 bytes**.

These are file sizes, not measured network transfer or page-load timings.

## Stable names and layer registration

The frontend uses the stable lowercase `ai-XX-name.webp` names. Keep those identities when making an approved correction; update the provenance hash and corresponding embedded fallback in the same work item.

The final scene requires two synchronized layers:

1. `ai-13-meadow.webp`: clean milkweed backplate, no residual butterfly.
2. `ai-14-butterfly.webp`: matching true-alpha adult, same 1659 × 948 canvas, scale and position.

Use identical image sizing, object-fit and object-position before moving only the foreground. `ai-12-adult.webp` contains the full composed adult scene and is the static alternative. Overlaying AI-14 on AI-12 would leave a second adult behind.

## Biological correction record

The feeding image was refined to avoid rendering abdominal prolegs as repeated hard pointed walking legs. The J-hang was corrected to remove the inappropriate pupal stalk from the larva and to reduce excessive prolegs.

Independent review later found the same pointed-contact problem in AI-09. Two narrow corrections retained it and were rejected. The third selected edit hides the entire ventral contact line naturally along the leaf while keeping the egg, body and vein. Consequently, AI-09 is an observation of a hatchling beside its shell, not a diagram for counting true legs or prolegs. Precise explanatory labels belong in the separately authored figures.

## Safe replacement workflow

1. Inspect the current full-resolution original and identify one concrete defect.
2. Use the original as an image-generation reference; preserve the scene's approved geometry and text-safe regions.
3. Inspect the returned result and reject ineffective corrections. Record every real attempt.
4. Write the selected original, production WebP and fallback to temporary sibling files. Fully decode them before installation.
5. Atomically replace the stable asset paths so a running preview never receives a partially written image.
6. Update the embedded fallback, exact prompt/reference record, dimensions, byte counts, selection rationale and SHA-256.
7. Reinspect the affected chapter and adjacent transitions in the production browser; a valid image file does not prove correct cropping or animation.

AI-09's final correction followed this atomic workflow. No original art edit was simulated through a source-code overlay to conceal the defect.

## Rights and interpretation

These are generated project illustrations, not redistributed third-party nature photographs. The primary biological sources substantiate text; they do not license their photography. Output use remains subject to service terms and applicable law, without a claim of exclusive copyright.

The retained pixels make the source package rebuildable without a runtime image API. Regenerating the art is a separate creative process and is not guaranteed to reproduce identical pixels; the project does not claim deterministic image generation.

