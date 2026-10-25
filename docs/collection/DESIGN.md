---
name: AI Web Experience Collection
description: A responsive three-column gallery opening thirty-seven independent worlds, followed by About & credits.
colors:
  ground: "#eeefeb"
  ink: "#20231f"
  secondary: "#596052"
  rule: "#c7ccc2"
  speed: "#f04432"
  forest: "#20372a"
  space: "#08090b"
typography:
  display:
    fontFamily: "Barlow, sans-serif"
    fontSize: "clamp(40px, 4.5vw, 150px)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.04em"
spacing:
  gutter: "clamp(22px, 3.3vw, 128px)"
rounded:
  media: "0"
---

# Collection design contract

## Overview

Experience mode. Thirty-seven complete works are the content. A cool, pale gallery frame creates room for each work's own visual world. No ordinary detached project cards, badge stacks, ornamental new scene or loading gate.

## Colors

Gallery tokens are above. The images and each work's established typography carry the thirty-seven distinct identities. Dark or light overlays protect each work's entrance text; they do not recolor the works themselves.

## Typography

Barlow for the quiet gallery voice; Barlow Condensed for the racing and space titles; VERDANT's supplied Instrument Serif for its secondary entrance typography. All are local. The opening invitation is plain, short and readable.

## Layout — current contract

The header and invitation sit above one uniform gallery: three equal columns above 1000px, two columns at 701–1000px, and one column at 700px and below. Thirty-seven native work links and a final About & credits link share this grid. Desktop seams are 3px; phone seams are 10px. Panel height follows the existing viewport clamps (56svh desktop, 52svh intermediate and large-screen, 76svh phone). In the two-column layout, the height clamp is a minimum: a row grows with its tallest content and both panels stretch together, keeping large display words and readable footers inside the frame. Other layouts retain their existing height bounds. No route or artwork is reordered.

Every work keeps its own image, palette and typeface. The shared `--t` and `--s` scales size display text from each panel's content width; COUNTERFORM uses a smaller title coefficient to keep its full name readable without changing Fraunces or the one-line lockup. Reading summaries have a 12px minimum and panel footer actions a 13px minimum. Decorative labels and ghost indices retain their quieter scale.

The ghost index remains a low-opacity background device, generated from `data-index`. The current grid supersedes the mixed full-width spreads and their height/alignment cadence described below; those older descriptions are historical, not rules for new entrances.

### Superseded layout record

The following three paragraphs describe the earlier editorial layout. They are retained for design history only.

One restrained header and invitation (with a THIRTY WORLDS · ONE COLLECTION kicker) sit above three edge-to-edge image triptychs, four paired rows and twelve full-width editorial spreads, separated by a 3px seam. Each entire panel is a native link. At 700px and below, the panels form a vertical sequence with independent, substantial visual compositions. Footer holds credits. No horizontal scrolling or hidden navigation.

The twelve full-width spreads follow one collection-level rhythm so the sequence reads as an edited magazine, not a stack of identical banners: a three-tier height cadence (58 / 64 / 72svh), alternating left/right compositions (AETERNA, LUTHIER, MAGMA, URUSHI and CREMA mirror their gradients, imagery and text to the right; GRID stays left-set because its poster already carries large type), and a recurring ghost index numeral (Barlow Condensed, stamped from main.ts as `data-index` because style containment scopes CSS counters) at six percent ink. Every spread keeps its own work's typography, palette and captured media; the shared system only sets cadence, alignment and the numeral.

INTERVAL’s display title scales from its panel’s content width, so the full name remains inside the triptych at narrow desktop widths. Its phone composition retains the existing typography.

## Elevation & Depth

Photographs supply depth. Optional pointer movement shifts the existing image by a few pixels; it neither runs a perpetual clock nor loads any work's rendering engine. On hover the image breathes to 1.06, the title lifts a few pixels and the ghost numeral wakes to twelve percent. Panels are fully visible before JavaScript. The stylesheet loads independently of the enhancement module; no observer or opacity gate delays End, fast scrolling, module failure or history restoration. Reduced motion removes image, title and arrow movement, including when the preference changes while hovered. Focus outlines and the instant numeral-opacity response remain available.

## Motion

Wheel and trackpad input is smoothed by one Lenis instance owned by `collection/main.ts` (`lerp: 0.105`, `syncTouch: false`, `anchors: false`) on its own RAF. It is the entrance's only clock and it imports no work runtime. Native touch, native fragment navigation, keyboard scrolling, focus and history stay authoritative: the Index, return journeys and Back/Forward never wait for an easing layer, and wheel momentum ends before a fragment jump or scroll key acts. `prefers-reduced-motion: reduce` starts no instance, and changing that preference destroys or recreates it at the current position. Every panel, the Index and the credits remain complete when the module fails or JavaScript is unavailable.

## Shapes

Square media, thin gallery rules, a simple three-stroke collection mark and directional line icons. No decorative card shells.

## Components

The entrance is functional without JavaScript. Focus remains visible. Work headers expose a shared arrow-and-Collection return link with a minimum 44 by 44 CSS-pixel target, reduced to a labeled arrow on narrow screens; each header's existing colors remain authoritative. Menus and work controls are unchanged.

## Do's and Don'ts

Preserve the independent work styles. Reuse their actual assets, not recreated thumbnails. Do not import WebGL, React or GSAP on the homepage. Do not add extra imagery, a mandatory transition/loading sequence, or a competing continuous clock. Full document navigation releases each work's runtime.

## Direction contract

THESIS: a single thirty-seven-world visual entrance, with the works themselves as the first viewport's substance.
OWN-WORLD: pale gallery, sharp photographic edges, racing condensed type, botanical serif and the planetary horizon.
STORY: recognize thirty-seven distinct experiences, choose one, explore, return.
FIRST VIEWPORT: quiet header and invitation above the first gallery row; each panel carries Explore at its lower corner. Phone composition scrolls naturally rather than forcing a complete panel above the fold.
FORM: one responsive three/two/one-column gallery using media from the actual works; existing production assets are the reference.
FINISH: desktop/mobile full-frame review, verified native entry/return links, documented tokens and retained source provenance. Review stays in this chat as required by repository instructions; no additional agents.

## Historical integration notes

The records below preserve how the collection grew. References to paired rows, full-width spreads and earlier work counts describe prior revisions; the current 32-work gallery contract above takes precedence. Asset identities and provenance distinctions remain applicable.

GLAZE adds its supplied Archivo voice, celadon jar and pale green ground. KAGE adds its supplied condensed voice and a real FRAME rendering on white. The homepage imports neither work runtime; previews are static local media. The original three-panel composition and native-link behavior remain intact.

CHRONOS retains its supplied watch image, Cormorant Garamond typography and dark metal palette. The original nine native entrances share three gallery rows on desktop and one sequence on mobile. Each panel retains its work's typography and palette.

INTERVAL retains its original threshold imagery and supplied Bodoni Moda voice in the second triptych. Its mobile panel keeps the established vertical sequence. FORM and FUSION complete a third triptych with captured media from their actual runtimes; the homepage still loads no work runtime.

GLASSHOUSE and VEIL add the first paired row, with a real GLASSHOUSE pavilion capture and VEIL's supplied cloth study. Their Manrope and Cormorant voices, warm/cool grounds and native links retain the same restrained gallery frame. On mobile all thirty panels form the existing vertical sequence; neither runtime is imported by the homepage.

OPTIC and INKSCAPE add the second paired row, using captures from their supplied runtimes. OPTIC retains its Manrope/Cormorant optical film on black; INKSCAPE retains its light Cormorant voice, ivory paper and carbon ink. The existing eleven entrances keep their compositions. All thirty panels remain native document links and no new work runtime loads on the homepage.

FACET and SILICON add a third paired row, retaining Instrument Serif gemstone typography and Manrope semiconductor typography. ATLAS and THRUST add a fourth paired row, retaining real geographic relief and an original engine capture. Previews are captured from the actual work runtimes. All thirty entrances remain native document links; the Collection imports no work runtime.

RESONANCE adds the first full-width entrance with its actual resonant-plate runtime capture, original Manrope and Cormorant italic fonts, graphite ground and restrained amber. Existing entrances retain their grid positions. All thirty panels are native document links and the homepage imports no work runtime.

AETERNA adds the second independent full-width row using its unchanged generated colossal-face plate and supplied Bodoni Moda voice. Museum models stay inside its runtime; previews do not imply archaeological photographs. Existing row positions and document links are retained.

PARALLAX adds the third full-width native entrance using a capture of its actual reassembled sculpture. Its supplied Bodoni Moda voice, ivory gallery, black stone and chrome remain independent. The thirty entrances retain their existing row order and document navigation; no new work runtime loads on the homepage.

LUTHIER adds the fourth full-width native entrance using an actual capture of its opening composition and supplied generated violin plate. The supplied Cormorant voice, black material theatre and amber remain independent. All thirty entrances retain document navigation; no work runtime is imported by the Collection.

CODEX, MAGMA and FOSSIL add the fifth, sixth and seventh full-width native entrances. Their actual runtime captures retain respectively Cormorant binding typography on black cloth, Archivo cooling material on black, and Bodoni fossil exhibition typography on museum graphite. FOSSIL’s generated fossil plate remains distinct from its authored synthetic volume. All thirty works keep independent documents and no work runtime loads on the homepage.

URUSHI and NIB add the eighth and ninth full-width native entrances. Actual runtime captures retain respectively the supplied Bodoni Moda lacquer vessel on warm black and Cormorant Garamond ink theatre on graphite. URUSHI’s capture is procedural; NIB’s opening material plate is generated imagery. The first twenty-four works retain their row positions and compositions. All thirty entrances use full document navigation; neither new runtime loads on the homepage.

CREMA adds the tenth full-width native entrance with a capture of its actual radial machine and suspended-drop opening. Its supplied Archivo voice, near-black chamber, cool steel and amber liquid stay independent. Generated machine/material imagery remains distinguished from authored real-time geometry. The first twenty-six works retain their compositions and row positions; all thirty entries navigate to independent documents.

CRAVE adds the eleventh full-width native entrance with a capture of its actual pastry/material opening. Its supplied Cormorant voice, warm dark ground and generated culinary imagery stay independent. The first twenty-seven works retain their compositions and row positions; all thirty entries navigate to independent documents.

GRID adds the twelfth full-width native entrance with a capture of its actual typographic specimen and licensed photograph. Its supplied variable grotesk, paper and geometric composition remain independent. The first twenty-eight works retain their compositions and row positions; all thirty entries navigate to independent documents.

DOSE adds a thirtieth native entrance using a capture of its actual procedural tablet scene, porcelain ground and original Barlow Condensed lettering. Its research concepts stay outside deployment; the homepage imports no DOSE runtime. The current uniform three-column gallery remains authoritative, with two columns at intermediate widths and one on phones.

COUNTERFORM and FERRUM add the thirty-first and thirty-second native entrances. COUNTERFORM uses a capture of its live specimen and retains its paper, rust, Fraunces and Roboto Flex identity; FERRUM uses its supplied steel-sculpture still and retains Antonio, Manrope and the graphite/ember stage. Both remain independent document links with base-aware resources; the Collection imports neither runtime.

## Batch A navigation and preview refinement

Stable `world-<route>` anchors identify each source entrance. A same-tab entry records only that journey's source and viewport offset. Explicit return uses a native base-aware fragment and a per-journey scroll margin present before layout; focus returns without scrolling again after fonts. External deep links and new-tab visits use a readable work fragment, while Back/Forward remains native. No global last-visit position is restored.

FORM, FUSION, GRID and COUNTERFORM now use interface-cleaned captures from their existing integrated runtimes, stored in `public/collection/`; original work assets remain unchanged. GRID's full captured specimen typography is retained in the resource and its gallery crop favors the photograph at every panel aspect ratio. COUNTERFORM's real R/counter stays visible below a protected title register. Other 28 media remain unchanged; CODEX cover typography is part of its artwork. See `BATCH-A-ACCEPTANCE.md` for capture exclusions, all-32 review and measured evidence.

## Batch B discovery

A closed native Index follows the concise invitation and precedes the gallery in normal flow. Its optional list gives all thirty-seven works the same treatment and links to their existing stable entrance anchors. Short bilingual subjects identify material, ink, typography and other worlds; language is stated only where verified (F1 Chinese engineering text, URUSHI English/Chinese). There are no estimated durations, complex filters or new work runtime imports. Summary, links, targets and native navigation remain usable without JavaScript. Opening the Index deliberately expands the document; closing it restores the gallery-led entrance. Batch A origin offset/focus behavior remains in force.

## Batch E entrances — 25 October 2026

RELAY, SUPERCELL, PELAGIC, BACKSTAGE and MURMURATION add the thirty-third to thirty-seventh native entrances in the same uniform three-column frame. Each uses an interface-cleaned capture of its own running opening — the transport sculpture, the illustrated storm, the living-light specimen, the working miniature theatre and the recorded flock — so the gallery supplies the work name and no second title competes inside the image. RELAY keeps its Archivo/paper/vermilion voice, SUPERCELL its light Manrope on storm blue, PELAGIC its Cormorant italic on near-black teal, BACKSTAGE its Fraunces and Source Sans 3 on paper, and MURMURATION its Anton over the warm grey sky. New font requests are limited to Anton and Source Sans 3; every other face reuses an existing Collection URL with a byte-identical binary. The Collection imports no work runtime and the gallery remains readable without JavaScript.

## Batch C resource contract

Identical font binaries share an existing URL while keeping every authored family alias, weight and style. All original fonts and their notices remain. The gallery uses size variants of its existing images, with the original image as the largest candidate. `sizes` accounts for the height-driven width needed by `object-fit: cover`, the two-column content floor and GRID's enlarged image; `object-position` and the original focal crop are unchanged. Only the first entrance has high fetch priority. `provenance/collection/responsive-previews.json` records every source and derivative hash. See `../audits/2026-10-25-batch-c.md` for measured HTTP transfers and visual checks.
