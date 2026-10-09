# GRID — Visual Bible

These twelve AI-generated boards are the pre-implementation composition studies for **GRID — The Architecture of Visual Order**. They explore a single fixed content set under different rules. The website itself is built from real text, semantic DOM, CSS, SVG, Canvas, and local fonts; these board images are not website backgrounds or UI assets.

## What is included

Each scene board contains a principal poster-like web frame and six supporting studies: editorial spread, mobile composition, typography scale, grid density, color, and transition. There are twelve selected PNG boards, twelve prompt records, and a manifest with file sizes, pixel dimensions, and SHA-256 hashes.

The image tool returned every complete board at **1448 × 1086 pixels**. The 1440 × 900 and 390 × 844 labels describe the intended desktop and mobile design spaces being studied; they do not claim that individual panels within a board are rendered at those native pixel dimensions. AI panel proportions, small annotations, letterforms, and numerical labels are exploratory. Exact implementation values come from the application, not from measuring a generated study.

The filenames and [manifest.json](manifest.json) are the authoritative scene index.

## One content set

| Element | Persistent content |
| --- | --- |
| Title | GRID |
| Subtitle | The architecture of visual order. |
| Number | 08 |
| Paragraph | One set of information. An open field of possibilities. Change the rules. See it again. |
| Metadata | VISUAL STUDY / SERIES 001 |
| Time and place | 2026 / EVERYWHERE |
| Action | LOOK AGAIN ↗ |
| Mark | One circle-and-cross registration mark |
| Photograph | One monochrome architectural staircase photograph |

Study panels sometimes excerpt these objects to isolate a relationship. They are not proposals to add alternate chapter content, marketing copy, dashboards, metrics, or navigation cards.

## Scene index and design decisions

| Scene | Selected board | Composition question | Handoff direction |
| --- | --- | --- | --- |
| 00 ZERO | [00-zero.png](00-zero.png) | How much anticipation can a tiny mark and a quiet bottom content band create? | A baseline grows from the mark, and the same objects acquire visible relationships. |
| 01 SYSTEM | [01-system.png](01-system.png) | How do column intervals, baselines, margins, and one ratio establish order? | Structure starts to control type hierarchy and image crop. |
| 02 INTERNATIONAL | [02-international.png](02-international.png) | Can asymmetry remain exact when title, number, image, and body have very unequal visual weights? | The grid remains measurable as the title starts to resist it. |
| 03 BASEL / TENSION | [03-basel-tension.png](03-basel-tension.png) | Can tilt, compression, overlap, and a diagonal crop create controlled tension? | The enlarged letters begin to become the image field. |
| 04 TYPE AS IMAGE | [04-type-as-image.png](04-type-as-image.png) | What happens when the word's counters and stems become the main composition? | Type withdraws enough to reveal a slower editorial hierarchy. |
| 05 EDITORIAL | [05-editorial.png](05-editorial.png) | How do serif contrast, wide margins, a folio, and a narrow image bleed change the emotional reading? | Quiet rules become exposed, thick, and deliberately assertive. |
| 06 RAW | [06-raw.png](06-raw.png) | Can hard boundaries and purposeful collisions remain legible and proportionate? | Modular cells become discrete electronic units. |
| 07 ELECTRONIC | [07-electronic.png](07-electronic.png) | How can dots, terminal measure, 1-bit-like imagery, and restrained phosphor color express a real display medium? | Display columns become responsive layout constraints. |
| 08 INTERFACE | [08-interface.png](08-interface.png) | Can a single composition adapt to changing available width while preserving hierarchy? | Constraint-driven width becomes a continuous typographic variable. |
| 09 VARIABLE | [09-variable.png](09-variable.png) | How can weight, width, slant, and column proportion behave as continuous material? | The system settles into one coherent mixed hierarchy. |
| 10 SYNTHESIS | [10-synthesis.png](10-synthesis.png) | Can discipline, editorial breathing room, a precise accent, and contemporary type belong to one composition? | Helper lines disappear while object positions hold. |
| 11 NO GRID | [11-no-grid.png](11-no-grid.png) | Can an apparently free composition retain the proportions established earlier? | The first registration point returns and closes the loop. |

These are direction studies rather than historical reconstructions or reproductions of a designer's work. The design-history research and sources belong in the project-level research documentation.

## Photography and font provenance

The initial **02 INTERNATIONAL** board was generated before the project photograph was available; its staircase is an AI-created composition placeholder. It must not be used as documentary photography or extracted into the website.

The remaining eleven boards use the actual project staircase photograph as an input reference. Boards 00, 01, and 03 also use the initial board to carry the research-board format forward. The photograph's definitive identity, creator, source, and rights are recorded in the project-level attribution and provenance files.

Prompts identify the local implementation families **Roboto Flex**, **Instrument Serif**, and **IBM Plex Mono** as typographic direction. Generated letterforms are approximations, not embedded or extracted font software. Font files and licenses are maintained with the application.

## Generation record

All images were produced with the built-in `image_gen.imagegen` tool. The tool did not expose a model identifier, so the manifest does not invent one.

The [prompts](prompts/) directory records the actual generation instructions. Where a focused correction was needed, the prompt record also includes it: the outer headings of 00, 01, and 03 were corrected; the missing color study in 07 and the missing transition study in 10 were added. Only the selected complete outputs are included. Superseded boards, temporary captures, and failed studies are excluded.

The manifest records each final generator artifact identifier, input-reference relationships, final file hash, and prompt hash. No external image URL or remote resource is needed to inspect this Visual Bible.

## Implementation boundary

Use these studies to judge proportion, hierarchy, crop, pacing, and the relationship between mobile and desktop. Rebuild the decisions, then refine them in the real browser. Do not render AI lettering as product UI, copy a board into a full-screen background, or create a separate cloned content tree for every scene.

The website's repeated element identities, deterministic reverse scroll, font measurements, responsive reflow, reduced-motion behavior, contrast, keyboard handling, and no-JavaScript fallback require browser verification. A successful static study cannot validate those behaviors.

