# Asset selection and production use

PULSE retains **eight separately inspectable image-generation outcomes**. All were produced with the authorized `image_gen.imagegen` tool for this project. Three distinct initial concepts precede the selected desktop refinement, separately recomposed portrait, two non-hero material plates and a transition midpoint.

The exact input prompts, reference relationships and output dimensions are recorded in [asset-provenance.json](asset-provenance.json). No seed, model identifier or undisclosed generation setting has been invented. The tool did not return those settings.

## Selection record

| ID | Retained native-dimension result | Actual pixels | Selection and rationale | Production use |
| --- | --- | --- | --- | --- |
| AI-01 | [AI-01.webp](art/AI-01.webp) | 1536 × 1024 | Intact exterior candidate. Retained for comparison; the cutaway concept more directly introduces the exterior/interior story. | Reference only. |
| AI-02 | [AI-02.webp](art/AI-02.webp) | 1536 × 1024 | Exterior/interior candidate selected as the visual premise. A controlled left-ventricular section keeps the organ recognizable while suggesting the interior. | Refinement reference for AI-04 and AI-05; superseded as the runtime hero. |
| AI-03 | [AI-03.webp](art/AI-03.webp) | 1536 × 1024 | Situated torso concept. Used as anatomical context rather than the main isolated-organ hero. | `public/art/torso.webp`; CH-01 opening observation. |
| AI-04 | [AI-04.webp](art/AI-04.webp) | 1536 × 1024 | Selected desktop refinement of AI-02. Calmer left text space, restrained rose material, complete crown and apex, and a continuous cutaway rim support the final composition. | `public/art/hero-desktop.webp`; opening and ending hero. |
| AI-05 | [AI-05.webp](art/AI-05.webp) | 984 × 1599 | Separately generated portrait recomposition using AI-02 as reference. Organ placement and upper text space were requested anew; it is not a crop of AI-04. | `public/art/hero-mobile.webp`; responsive opening and ending source. |
| AI-06 | [AI-06.webp](art/AI-06.webp) | 1536 × 1024 | Alveolar material study. Tactile tissue and separated blood/air spaces establish the chapter's scale; precise gas directions belong to the separate original SVG. | `public/art/alveolus.webp`; CH-07 material scene. |
| AI-07 | [AI-07.webp](art/AI-07.webp) | 1536 × 1024 | Left-ventricular material study. A substantial muscle rim and chordal detail support the late chapter's close observation; the SVG carries the qualitative wall comparison and outlet explanation. | `public/art/ventricle.webp`; CH-09 material scene. |
| AI-08 | [AI-08.webp](art/AI-08.webp) | 1536 × 1024 | Pulmonary-to-alveolar midpoint. A separate magnified field explicitly marks a representation change rather than suggesting a continuous pipe entering airspace. | `public/art/magnification.webp`; TR-06-07. |

The native-dimension results are WebP encodings of the generated outputs. Their pixel dimensions were inspected directly from the files. WebP conversion is not a claim of byte-for-byte or lossless preservation of the original generation. Rejected concepts are retained compactly for comparison, without including enormous redundant source rasters.

AI-05's requested composition targeted a **390 × 844 CSS viewport**. The generation tool actually returned **984 × 1599 pixels**. That actual result is recorded instead of claiming the prompt's requested bitmap dimensions were fulfilled. Responsive CSS and the portrait source determine the final browser framing.

## Responsive delivery

The desktop hero, torso, alveolus, ventricular plate and magnification plate have 960-pixel-wide WebP variants beside their full-size versions in `public/art/`. The portrait hero has its own source rather than sharing a desktop crop. The renderer selects sources with `<picture>` and `srcset`, preloads the relevant critical hero image, and lazy-loads later images.

The identical selected hero assets return in CH-11, retaining material, orientation and identity. Large material scenes are followed by independently readable diagrams and text. No meaningful title, label, button or medical statement is baked into the generated artwork.

## Generation roles and limits

- **Concepts:** AI-01, AI-02 and AI-03 use materially different premises: isolated intact specimen, exterior/interior dialogue, and location within the torso.
- **Refinement:** AI-04 uses AI-02 as its explicit reference and changes framing, negative space and tissue treatment while preserving the chosen concept.
- **Portrait:** AI-05 is a new generation based on the chosen concept, with a lower central organ and a quiet upper region.
- **Middle and late quality references:** AI-06 and AI-07 establish the material language of CH-07 and CH-09.
- **Boundary reference:** AI-08 explicitly separates the larger vascular scene from the magnified tissue scene.

These outputs are artistic reconstructions. Their attractive material rendering does not establish anatomical correctness. Exact chamber relationships, flow arrows, valve grouping and gas directions are implemented as original SVG instructions informed by the [source review](research-notes.md). The imagery is never called a scan, microscopy or a clinically validated model.

## Rights and attribution

All eight images were generated specifically for the requested task. They are supplied for project use under the applicable generation-service terms. No exclusive copyright guarantee is made for AI-generated output. No NIH, AHA or third-party medical illustration was copied or redistributed. The source links in the website support factual claims and do not license those publishers' artwork.

Original SVG linework and labels, Web Audio synthesis and code-native controls are separately authored project material. Font and library licenses are identified in [ATTRIBUTION.md](../ATTRIBUTION.md).

## Evidence boundary

This is a provenance and selection record. Final browser captures, responsive framing checks, high-risk transition observations and any corrections are indexed in [the evidence record](../evidence/index.md) and [acceptance results](acceptance.md). Selection rationale is not a substitute for those tests and is not a numerical aesthetic rating.
