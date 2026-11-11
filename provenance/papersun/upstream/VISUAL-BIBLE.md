# PAPERSUN — Visual bible

Locked art direction, 9 November 2026. This document records the chosen visual system and production decisions. Browser acceptance is recorded separately in the evidence ledger; this bible does not award a visual score.

## The world

PAPERSUN is an original fable performed in a physical miniature paper theatre. Its craft is cutting, layering, pinning and stitching. The city is assembled from thick cotton rag paper: irregular edges, quiet watercolor pigment, visible fiber, soft contact shadows and occasional tiny metal fasteners. Mira is a small repairer in a vermilion paper coat. The emotional movement is from immense absence to practical, tender repair.

The stage is seen almost straight on. A layer may shift slightly against another; the camera does not orbit a flat painting. The work is a hybrid of generated material-rich backplates, code-authored paper geometry and live HTML narration. It is not a fully rotatable 3D scene or a physically simulated lighting model.

## The selected opening

AI-01 established the selected composition. AI-04 refines that composition for production: a dark circular absence in the upper-right, layered blue rooftops below, one amber-lit attic window at lower-right, and a red linen thread winding through the city. The opening title is **The sky has lost its sun.** The large empty left sky is a deliberate reading area rather than an unfinished part of the art.

The circle must read as material missing from the sky. Its dark interior and fibrous cream rim distinguish it from a white moon. The ending returns to this same city and aperture. A canonical three-piece SVG disc supplies the repaired sun, avoiding a newly invented fourth object or different generated seam pattern.

### Desktop framing

- Production file: `public/art/hero.webp`, derived from AI-04 without resizing or cropping.
- Source raster: 1586 × 992 pixels. The scene is composed for a wide desktop stage; its raster resolution is distinct from the CSS viewport.
- The aperture remains upper-right. The amber attic stays lower-right. The left side remains calm enough for real display type and a short lead.
- Rooftops retain foreground, middle and distant plane separation. Subject motion stays shallow; large rotations would reveal the illusion.
- A first meaningful frame already contains art, title and the missing circle. The introduction never delays scrolling.

### Portrait framing

- Production file: `public/art/hero-mobile.webp`, independently generated AI-05.
- Source raster: 853 × 1844 pixels, designed around the brief's 390 × 844 CSS composition. It is not a crop of the desktop asset.
- The aperture is high on the right, roofs stack down the page, and the single warm window remains visible in the lower section.
- Live copy occupies quiet upper and left areas without entering the aperture. UI controls retain practical touch size.
- Later chapters use a compact stage above or alongside a normal-flow reading block as space requires. All story beats and actions remain available; mobile does not discard chapters.

## Palette and light

| Role | Color | Use |
| --- | --- | --- |
| Midnight paper | `#18233B` | Sky, deep stage and stable reading ground |
| Cornflower paper | `#5A729A` | City, hill, arch and bridge planes |
| Unbleached stock | `#EFE4CF` | Body text, notes, deckle edges and tools |
| Lantern gold | `#E5B354` | Lamp and the exact three narrative fragments |
| Vermilion | `#BC645B` | Mira's coat and market accents |
| Red linen | `#A94F45` | Guide thread, repair seams and rigging |
| Morning cream | `#F5EBCD` | Restrained ending warmth and highlights |

The selected paper assets use practical lateral warm light with restrained cool fill. The attic and market bring that warmth nearer; the valley suppresses it; the return introduces warm light to the original blue city. Generated images are display-referred raster artwork. WebP derivatives preserve that artwork; production warmth is an authored composite treatment, not a claim of physically recomputed shadows. Existing paper depth remains visible under the treatment, and narration always has a stable contrast surface.

There are no fantasy particles, glossy plastic highlights, global white flashes or sparkling loading overlays. Gold is reserved for meaningful light and the three story pieces.

## Typography and live content

| Role | Family | Treatment |
| --- | --- | --- |
| Display and chapter titles | Cormorant Garamond, Georgia fallback | Warm, spacious storybook serif; natural wrapping |
| Narration and long prose | Georgia, serif fallback | Readable prose with comfortable line height and conservative measure |
| Navigation and controls | System sans-serif | Clear compact labels, modest tracking, visible focus |

All meaningful words are real selectable English DOM text. No generated image contains required text. The document language is `en`. A font-loading change must not clip the title or hide controls. The reading block belongs to document flow; a decorative layer cannot capture its pointer events. A chapter number may identify the story location but must not become a marketing badge or substitute for a chapter title.

## Persistent objects

**The aperture and three pieces.** The A/B/C paths in `src/fragments.ts` are the canonical silhouettes. Shared cut boundaries and outer arcs define their fit. The note, inventory, discoveries, repair table and risen sun reuse those paths. Generated gold in AI-06 and AI-07 is reference art only; it is not the authoritative geometry.

**The red thread.** A thread is visible throughout the journey, changing its practical role from guide to railing to stitch to lifting rig. A transition uses its direction or attachment point to connect scenes. It is not an unrelated progress decoration.

**The amber lamp.** The little lamp is a local light, not a second sun. Its location on the opening city locates the warm room. The ending retains it for those who need night.

**Mira.** One original paper character design is reused. Joint motion is small and pinned. Her silhouette, coat color, light direction and contact with the stage remain consistent. She does not become a different generated person at each stop.

## Eleven distinct observations in one world

| Chapter | Composition and emotional purpose | Production material and action |
| --- | --- | --- |
| 01 — The Missing Circle | Broad city panorama; absence dominates, one lamp answers it | AI-04/05 city and a closer view of the same aperture |
| 02 — The Last Warm Room | Intimate practical workspace; introduce Mira through tools | Clean attic backplate, live character and desk inspection |
| 03 — Three Pieces of Light | Close paper note; the journey becomes an understandable rule | Code-authored note and the three canonical SVG silhouettes, without granting possession |
| 04 — A Thread Across Roofs | Directed route through the familiar city; courage becomes movement | City material reused intentionally with route anchors, thread and a pinned character |
| 05 — The Lantern Market | Warm jewel-colored lanterns in receding stalls; first act of repair | Separate market backplate, failed foreground lantern and exact piece A reveal |
| 06 — The Wind Hill | Broad periwinkle landscape; a different material tempo | Clean wind backplate, preserved pole and axle, live pinned rotor and exact piece B |
| 07 — Valley of Shadows | Deep indigo arch and tight warm glint; darkness has value | Clean valley backplate with live pivoting shade and exact piece C |
| 08 — The Blue Bridge | Curved return route toward a familiar warm window | Full outdoor bridge backplate, red railing thread and readable three-piece inventory |
| 09 — Mending the Sun | Focused worktable and deliberate hands; keep the seams | Attic material, exact A/B/C placement, stitch overlay and clear step controls |
| 10 — The First Light | Original aperture receives the repaired object; earned warmth | Original city composition, same canonical assembled SVG disc and visible red rigging |
| 11 — A Lamp for the Night | Return to the city at a quieter distance; the lamp remains | Same repaired stage, a final detail and a complete story ending with replay access |

Repeated locations have narrative meaning: home before and after a journey, city before and after repair. They must change observation, action and emotional function rather than repeating wallpaper as a new chapter.

## Image selection and production exceptions

- **AI-01** is the selected concept and material baseline, retained for comparison.
- **AI-02** and **AI-03** are rejected opening alternatives. AI-02 has too many decorative golden scraps; AI-03 has multiple illuminated windows and an oversized foreground lamp. They are retained as inspectable concepts, never used as evidence of canonical inventory or the final opening.
- **AI-04** is the production desktop city. **AI-05** is the independent portrait city.
- **AI-06** is the wind-hill reference. Its baked rotor and gold piece were removed with a real image-generation edit. `wind.webp` is the resulting clean plate; live SVG owns rotor motion and piece identity.
- **AI-07** is a late-story material and lighting reference only. Its generated seam pattern and theatrical framing differ from the canonical SVG geometry and opening, so it is not substituted for the actual repaired sun or ending.
- **AI-08** is the deliberately composed bridge/workroom transition midpoint. `transition-midpoint.webp` retains the art. A separate edited exterior `bridge.webp` supplies the stable bridge chapter.
- Extra attic and market backgrounds use the same selected paper material. The valley plate was edited to remove the baked shade, leaving an empty interior and visible pin for a live accessible reveal.

These exceptions preserve exact object identity while retaining the material depth proved by the generated references. All eight required concept outcomes remain separately inspectable as native-resolution WebPs in `art/concepts/`.

## Motion, stills and scene handoffs

Motion is small, reversible and derived from story state. The viewer can stop on a composed intermediate frame. Reading holds remain stable. The thread, lamp, paper note, fragment, wheel axle, arch and repaired disc are handoff anchors, so a scene change has a physical explanation.

The bridge-to-room boundary uses an opaque paper arch and the retained midpoint reference to conceal the change in environment. The disc lift uses the exact assembled paths and a screen-space position mapping to the opening aperture. Two transparent versions of Mira or the sun must not appear together.

Reduced motion presents composed before/after states with all text, actions and results intact. Sound starts off. Any ambient movement can be stopped through the motion control. Native scrolling, chapter links and keyboard navigation remain available during the opening and between actions.

## Media budget and packaging

The eight production WebP files total **1,722,356 bytes** (1.64 MiB). The desktop hero is **181,526 bytes** and the portrait hero is **213,830 bytes**. Both are full-resolution encodings. The eight inspectable concept WebPs add **2,138,984 bytes** (2.04 MiB). Together, the distributed raster artwork is **3,861,340 bytes** (3.68 MiB).

The corresponding production PNGs total 20,314,133 bytes. WebP encoding reduces those production bytes by approximately 91.5% without changing framing or pixel dimensions. This is a file-size result, not a measured page-load speed or visual-lossless claim. Browser behavior and network performance require their own evidence.

PNG generation originals and base64 intermediates remain in the working environment and are excluded from the source ZIP. `art/asset-derivatives.json` records the actual distributed byte counts, dimensions, encoder settings and SHA-256 values. `docs/assets.md` links the complete prompt and selection records.
