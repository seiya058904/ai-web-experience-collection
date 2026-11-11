# CHRYSALIS — Visual Bible

**The architecture of becoming**  
Design record: 9 November 2026  
Status: implementation-informed visual contract. This file does not certify browser behavior or visual acceptance; those conclusions belong to the separate QA evidence.

## One illustrated life

The visual premise is a close observation of *Danaus plexippus*, beginning beneath a milkweed leaf and returning to that habitat after emergence. Scale, physical support and biological state carry the story. The recurring curved leaf vein establishes the early chapters; the stem and silk pad establish the pupal sequence.

The chosen medium is a photographic-style AI illustration with real DOM typography and deliberately schematic SVG studies. No raster is represented as microscopy, a photograph of a documented individual, or a measured time sequence. The 100 mm macro language is art direction, not camera metadata.

## Selected framing

| Candidate | Distinct premise | Decision |
| --- | --- | --- |
| AI-01 / A | Ribbed egg appears monumental against a diagonal vein; pearl detail on the right, quiet green on the left. | Selected as the hero reference. |
| AI-02 / B | Two milkweed leaves and a stem establish the host at a larger ecological scale; the egg becomes a small detail. | Used for CH-02 rather than the opening. |
| AI-03 / C | Warm grazing light follows branching veins toward a smaller egg. | Retained as inspectable concept evidence and texture reference. |

AI-04 genuinely refines A: the same egg orientation and dominant curved vein remain, with calmer texture and a wider composition. The desktop title sits in the dark upper-left field, clear of the shell. The whole matching backplate is retained; no separately extracted hero egg exposes duplicate subjects or holes.

AI-05 is an independently generated portrait. A vertical leaf arc frames the lower-middle egg while the upper area remains quiet. It is selected below 701 CSS pixels and is not a desktop center crop.

## Color and light

| Token | Color | Intended use |
| --- | --- | --- |
| Shaded leaf | `#173924` | Main dark reading surface, plant shadows, continuity between scenes. |
| Deep green | `#122A1B` | Page foundation and deepest quiet regions. |
| Milkweed | `#506A3C` | Leaf body, light-page accents and botanical context. |
| Eggshell pearl | `#E7E7CF` | Principal text and the light museum spreads. |
| Jade | `#5B8D69` | Pupal shell and restrained developmental diagrams. |
| Fine gold | `#D1B974` | Small rules, focus cues and natural chrysalis accents. |
| Wing copper | `#C8703A` | Late-life wing warmth and explanatory wing regions. |
| Wing black | `#1F1C1C` | Natural wing boundaries and dark anatomical marks. |

Upper-right diffuse daylight is the main illumination reference. Early plates favor cool leaf green and pearl; the pupa retains jade under controlled sunlight; the adult introduces copper while the plant remains recognizably green. This progression is carried by selected assets, not a universal colored wash over every picture.

The light feeding and instar chapters use pearl surfaces with green text. Their contrast is an editorial pause in the same world. Inside the Change uses a slightly cooler deep-green study surface so its reconstruction reads as a different observational mode.

## Materials and focus

The focal plane should expose useful shell ribs, matte leaf cuticle, restrained hairs, larval bands, silk contact and monarch wing pattern. Defocus belongs to the meadow and peripheral foliage. It must not hide a missing attachment or invented anatomy.

The jade surface stays opaque in its exterior view. The patterned late pupa remains a coherent physical casing. The SVG interior is a labeled explanation, not an illusion that the outer shell has become transparent glass. No jewels, particles, anatomical glow or explosive fragmentation belong to this world.

## Typography and framing rules

Libre Caslon Display carries the large narrative headings; Source Sans 3 carries body text, sources, annotations and controls. The fonts are packaged locally. Species names are italicized. The exact hero sentence is set over three composed lines on desktop: “Everything / changes / from here.”

Desktop spreads use a generous gutter and separate reading and image zones. On phones, later cinematic captions move into a real reading block above the image rather than competing with a cropped subject. Scientific labels stay selectable DOM/SVG text; generated artwork contains no baked captions.

## Six hero states

| State | Intended composition and current mechanism |
| --- | --- |
| First meaningful image | The preloaded desktop or portrait plate and real title are available immediately in the page structure; there is no cinematic loader gate. |
| Reveal | A one-time two-second CSS brightness arrival moves from 0.94 to 1.00. It does not claim moving illumination captured in nature. |
| Complete composition | The egg, vein, title, species caption and actual chapter-two link form a stable view. |
| Living hold | The still plate holds indefinitely after the arrival. No perpetual insect, foliage or light loop runs. |
| First scroll | The authored first bridge carries the leaf-vein reference toward the larger host-plant view; its state is derived from position. |
| Return | Reversing scroll returns to the same retained plate and orientation. The first-load light arrival is not restarted by scroll. |

Reduced motion removes the arrival animation and uses static transition endpoints. Hero state acceptance still requires checking the real browser at the prescribed viewport sizes and pause positions.

## Image layers and biological interpretation

There are **15 retained outputs from 20 actual image-generation calls**. Five attempts were not selected, including the initial larval anatomy issues and two unsuccessful hatchling corrections. The exact prompts and retained paths are in [the provenance record](art/asset-provenance.json).

AI-06, AI-08, AI-07 and AI-15 share the stem/silk reference across jade, pigmentation, emergence and wing expansion. Their handoffs are authored comparisons of illustrations, not continuous footage. The larva-to-pupa and pupa-to-emergence boundaries preserve two complete, separately framed opaque poses at intermediate stops, each with its own support. Their labels explain that the actual skin-shedding or shell-opening movement is not shown; a partial larva must never be spliced into a partial pupa. AI-09 hides the ventral contact line to avoid false posterior pointed legs; it is not a leg-count diagram.

For the final departure, place transparent **AI-14 over clean AI-13** with identical sizing and crop. AI-12 already contains the butterfly and is the composed still alternative. Never use AI-12 underneath the moving foreground.

## Resolution boundary

A/B/C originals are 1536 × 1024. Most selected wide plates are 1659 × 948; AI-11 and AI-15 are 1660 × 948. The portrait is 948 × 1659. These are the actual returned raster dimensions. Wider or high-density CSS viewports scale these images; the project does not contain native 4K macro plates.

Chapter-specific thumbnails and embedded data URIs preserve recognizable stills on asset failure. Their lower detail is an intentional fallback, not a substitute for full-resolution inspection.


The hatchling-to-feeding boundary also uses a complete-observation comparison: full landscape plates preserve the entire shell, tiny hatchling, feeding head, body and leaf margin. On phones the two landscape views stack. The first phone bridge places its caption in the upper field so its egg landmark remains visible below it. These are corrections from actual midpoint captures, not claims of continuous recorded metamorphosis.
