---
name: NIB — Ink Under Pressure
description: A quiet material film following stored ink through a tiny fluid machine into one controlled line.
colors:
  ground: '#080a0d'
  ivory: '#eee9dd'
  paper: '#f1ebdf'
  ink: '#171c23'
  muted: '#bbbdbb'
  dialog-surface: '#0c0f12'
  rule: '#2b2e32'
  header-ivory: '#f2f0e9'
  bright: '#ffffff'
  paper-hover: '#315171'
  ink-material: '#0a273c'
typography:
  display:
    fontFamily: Cormorant Garamond, Georgia, serif
    fontSize: clamp(210px, 28vw, 560px)
    fontWeight: 400
    lineHeight: 0.72
    letterSpacing: -0.035em
  headline:
    fontFamily: Cormorant Garamond, Georgia, serif
    fontSize: clamp(70px, 8.25vw, 170px)
    fontWeight: 400
    lineHeight: 0.94
    letterSpacing: -0.035em
  title:
    fontFamily: Cormorant Garamond, Georgia, serif
    fontSize: clamp(48px, 6vw, 100px)
    fontWeight: 400
    lineHeight: 0.94
    letterSpacing: -0.03em
  body:
    fontFamily: Manrope, Arial, sans-serif
    fontSize: clamp(14px, 1.3vw, 22px)
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: 0.01em
  label:
    fontFamily: Manrope, Arial, sans-serif
    fontSize: 13px
    fontWeight: 400
    letterSpacing: 0.025em
  position:
    fontFamily: Manrope, Arial, sans-serif
    fontSize: 11px
    fontWeight: 400
    letterSpacing: 0.19em
  index-entry:
    fontFamily: Cormorant Garamond, Georgia, serif
    fontSize: clamp(26px, 3.3vw, 56px)
    fontWeight: 400
  wordmark:
    fontFamily: Cormorant Garamond, Georgia, serif
    fontSize: clamp(28px, 2.2vw, 40px)
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0.13em
spacing:
  gutter: clamp(25px, 3.25vw, 100px)
  gutter-mobile: 25px
  gutter-compact: 20px
  control-gap: 20px
  compact-gap: 14px
  body-gap: 26px
components:
  wordmark:
    textColor: '{colors.header-ivory}'
    typography: '{typography.wordmark}'
  journey-toggle:
    textColor: '{colors.header-ivory}'
    typography: '{typography.label}'
    padding: 0 0 0 12px
  close-dialog:
    textColor: '{colors.ivory}'
    width: 44px
    height: 44px
  trace-link:
    textColor: '{colors.ink}'
    padding: 2px 0
  trace-link-hover:
    textColor: '{colors.paper-hover}'
  narrative-toggle:
    textColor: '{colors.ivory}'
    padding: 2px 0
  chapter-tick:
    textColor: '{colors.ivory}'
    width: 25px
    height: 44px
  chapter-index-entry:
    textColor: '{colors.ivory}'
    typography: '{typography.index-entry}'
    padding: 10px 0
  chapter-index-entry-current:
    textColor: '{colors.bright}'
  chapter-copy:
    textColor: '{colors.ivory}'
    typography: '{typography.headline}'
    width: 55%
  chapter-position:
    textColor: '{colors.ivory}'
    typography: '{typography.position}'
  credits-row:
    textColor: '{colors.ivory}'
    padding: 13px 0
---

# Design System: NIB — Ink Under Pressure

## Overview

**Creative North Star: "A tiny fluid machine"**

NIB is precise, liquid, tactile, intimate, metallurgical, editorial and quiet. Its world moves from near-black material space and reflected metal, through blue-black liquid, to warm ivory cellulose. The visual subject is the passage and control of ink. Large typography and close material views share the frame; neither becomes a commercial product presentation.

The interface stays at the edges while the material carries depth and motion. A held liquid boundary becomes a channel, a slit, a contact bridge and a deposited stroke. Replacement air supplies the counter-direction. Curated photographic plates establish surface fidelity; authored Canvas geometry, masks and lighting establish continuity. Selectable HTML carries the narrative and remains readable without the film.

**Key Characteristics:**

- One continuous Ink Line, with a quieter opposing air path.
- Real metal highlights, restrained blue-black liquid and warm matte paper.
- Cormorant Garamond display forms paired with compact Manrope controls.
- Viewport-wide compositions with sparse edge navigation and deliberate text safety.
- Reversible progress, complete resting frames and an independent mobile composition.

This record describes the shipped implementation in src/styles.css, src/main.js, src/renderer.js, src/paper-scenes.js and index.html, read against PRODUCT.md and docs/VISUAL-BIBLE.md. The build is the authority for exact tokens. The Visual Bible's seed and scene proposals are provenance, not additional token sources. This is a visual-system record, not a claim of physical-device testing.

## Colors

The palette is almost neutral until reflected light makes liquid and metal legible; paper then becomes the dominant field. Frontmatter values are normative.

### Primary

- **Blue-black material ink:** the ink-material token supplies cellulose staining and capillary branches. Wet stroke color is also a continuous renderer gradient; do not flatten that model into a single interface accent.
- **Ink text:** the ink token is the readable text and control color on paper.
- **Paper hover blue:** paper-hover is the restrained interactive response on the light world.

### Neutral

- **Graphite ground:** ground holds the metal and liquid scenes.
- **Display ivory:** ivory carries narrative copy and dark-dialog controls.
- **Warm paper:** paper is both the light scene base and the background supporting the cellulose plate.
- **Quiet gray:** muted supports explanatory index copy and secondary navigation text.
- **Dialog graphite:** dialog-surface is an opaque reading surface, slightly separated from the film ground.
- **Fine rule:** rule divides chapter-index entries and credits without creating cards.
- **Header ivory:** header-ivory is composed with difference blending so the fixed header can cross light and dark material.
- **Bright response:** bright marks dark-world hover and the current journey entry.

**The Material Color Rule.** Gold belongs to photographed metal and its highlights. Interface text and controls use the graphite, ivory and ink families.

The sidecar's synthesized OKLCH ramps are inspection swatches only. They do not introduce additional shipping colors or state variants. Champagne and rhodium remain photographic materials rather than invented flat color tokens.

## Typography

**Display Font:** Cormorant Garamond, with Georgia and serif fallbacks. The local regular and italic variable files provide the expressive voice.

**Body Font:** Manrope, with Arial and sans-serif fallbacks. The local variable file provides navigation and explanation.

**Character:** Narrow, high-contrast serif forms echo a nib's long symmetry and thin slit. Upright and italic phrases share measured, tightly spaced lines; the sans voice stays compact and factual.

### Hierarchy

- **Display:** the display token is the opening NIB only. Its large footprint is a specific first-view composition, not a repeated chapter template.
- **Headline:** headline is the normal chapter scale. Scene-specific Meniscus, Balance and Trace sizes respond to their material safety areas.
- **Title:** title is used by the chapter index and colophon.
- **Body:** body is short chapter explanation, with a maximum measure of 40em; Balance narrows its measure further.
- **Label:** label describes the journey control. Position is a distinct, meaningful chapter number and name, set in uppercase.
- **Index entry:** index-entry gives each chapter its serif identity; number and short description stay small and sans.
- **Wordmark:** wordmark is the small repeated NIB identity in the header and dialogs.

**The Two Voices Rule.** Use Cormorant Garamond for the expressive narrative and Manrope for navigation and explanation. Serif italic supplies continuity within a headline, not another type family.

At the mobile breakpoint, normal chapter headlines use clamp(48px, 10vw, 76px), paragraphs use 13px, and the opening display uses clamp(100px, 35vw, 210px). These are authored mobile roles, not a uniform scale reduction. Short landscape viewports receive a separate height-based display treatment. Do not promote a scene-specific size into the general hierarchy.

## Layout

The film fills the viewport. Images and authored geometry are not framed inside cards. Header and footer align to the shared fluid gutter; narrative copy usually begins at that same edge, occupies 55% of the desktop width and is limited to 850px. The first view gives the type a left field and the monumental nib a right field. The final trace centers its title and separates the quiet closing sentence and actions vertically.

The desktop chapter distance is 1.18 times the current viewport height, with a 510px minimum height basis. At 800px and below, chapter distance is 1.04 times that basis. Progress drives a fixed compositor and fixed HTML copy. A width change or substantial height change reestablishes layout while preserving semantic progress; minor phone address-bar changes do not continuously rewrite the chapter distance.

Mobile uses its own portrait nib plate, lower opening typography, upper narrative safety zone and reduced fiber density. The gutter becomes the mobile token, then the compact token at 380px and below. The journey index changes from two columns to one. Tick targets narrow from 25px to 19px, then 17px at the compact breakpoint, while retaining their 44px height. These compact tick widths describe the shipped navigation; they are not a general minimum target rule.

The wide-screen refinement begins at 1900px. The short-landscape refinement applies at a maximum height of 580px and a minimum width of 650px. Reading mode restores ordinary document sections and their fallback material images; it does not leave a hidden film in front of the text.

## Elevation & Depth

The UI has no box-shadow vocabulary and no raised cards. Opaque dialogs cover the film. Material depth is real to the composition: alpha-separated metal, masked narrow specular bands, liquid reflection, the soft radial nib-to-paper shadow, and cellulose ridges that partly occlude wet ink. The side-profile nib preserves uniform scale and a single tip anchor across paper scenes.

**The Material Depth Rule.** Depth comes from the object, liquid and substrate. Keep interface surfaces flat; retain the soft contact shadow and fiber occlusion that explain the material.

The Meniscus-to-Contact handoff travels into the registered liquid interface before emerging above paper. It uses photographic material, masking and scale; it does not reconstruct a 3D nib. Contact, Absorb, Write and Trace share one paper-coordinate stroke. Ambient reflection may breathe, but scroll progress determines deposited length, nib lift and drying.

One GSAP ticker advances Lenis before composition and HTML state. Chapter jumps use the existing authority. Reduced motion substitutes stable chapter compositions with no ambient time progression. Opaque dialogs, reading mode, hidden documents and an unchanged fully dry ending avoid unnecessary film rendering.

## Shapes

UI surfaces and controls use straight edges without a rounded-container system. Fine dividers structure the index and credits. A thin vertical mark is the recurring chapter-navigation shape: the current tick lengthens, while surrounding ticks remain short.

Organic geometry belongs to the material: an attached meniscus, a narrow ink bridge, a slight written curve and local capillary branches. Broad pill buttons and decorative rounded cards are absent. Functional icons are inline SVG paths with a fine current-color stroke; plus, close and directional arrows remain simple and subordinate to text.

## Components

### Journey control

A text label and fine plus, aligned at the outer header edge. It inherits the header's difference-blended ivory, has a 44px minimum height, and opens the native modal chapter index. The small wordmark balances it on the opposite edge. Hover brightens; keyboard focus uses the shared thin current-color outline with a 6px offset.

### Dialog close

A square 44px control with the actual crossing SVG paths. The journey index and colophon use the same placement and visual treatment. Native modal semantics, Escape handling and returned focus are part of the component behavior. Its dark dialog remains opaque in either material world.

### Trace actions

“Begin again” uses a northeast arrow; “Colophon” is a plain text button beside it. The pair rests on paper, with a 44px minimum control height, a small gap between label and icon, and restrained blue hover. Hover adds an underline rather than a filled button surface. Begin again returns through the same scroll authority.

### Narrative toggle

A plain text button inside the colophon switches between “Read the narrative” and “Return to the film.” It shares the text-link spacing and visible focus language. The state changes layout and restores a meaningful chapter position; it is not a decorative mode badge.

### Chapter ticks

Ten thin vertical marks provide compact navigation. Every anchor has a complete accessible chapter name. The current anchor uses aria-current="step": its mark is full height and opaque. Hover extends the mark partway. The only CSS transition is the restrained quarter-second tick response, removed by reduced motion.

### Chapter index

An editorial list with two columns on desktop and one on mobile. Each row contains a small sans number, a serif chapter name and a short sans description. Fine top rules replace card boundaries. The current chapter becomes bright; its identity agrees with the narrative view.

### Chapter copy

A short serif heading, often continuing in italic, followed by a restrained sans sentence. HTML remains selectable and semantic. In the film, outgoing and incoming copy fade in a defined interval and only visible copy participates in interaction. Reading mode returns all chapter text to ordinary document layout.

### Chapter position

A meaningful number, slash and chapter name in the footer. It supplies orientation while the film changes scale. Its uppercase small type is functional progress metadata, not a decorative eyebrow. On the narrowest composition the chapter name yields space while the number remains.

### Credits list

A flat definition list in the colophon, divided by fine rules. Labels occupy a fixed column and descriptions take the remaining width; mobile reduces the label column and gap. It reports actual material, living-system and type credits rather than fabricated badges or metrics.

The sidecar contains nine self-contained examples of these actual components. Their dark or paper sample wrappers provide the existing material context; they are not new product containers. SVG paths are copied from the implementation. There are no invented cards, forms, chips or input fields.

## Do's and Don'ts

### Do:

- Do preserve the metal → liquid ink → ivory paper transition and carry the Ink Line through changes of scale.
- Do keep replacement air legible as the restrained counter-direction to outgoing ink.
- Do place narrative text in the quiet area of each composition and recompose that area for mobile.
- Do use semantic chapter links, meaningful progress labels, visible keyboard focus and the readable narrative path.
- Do use one Lenis instance and one GSAP ticker for scroll and rendering; keep material state reversible.
- Do show a complete stable chapter frame for reduced motion and allow the final dried trace to become still.

### Don't:

- Don't apply gold to general interface text, controls or decorative chrome.
- Don't introduce commerce cards, decorative badges, invented metrics, a dashboard, or a generic exploded product view.
- Don't turn the controlled stroke into a broad watercolor cloud, a random particle field or a calligraphy performance.
- Don't bake narrative typography into photographic assets or place small text across active material detail.
- Don't add continuous CSS animation or another animation clock beside the existing compositor.
- Don't treat the photographic scale handoff or fiber sampling as a reconstructed physical simulation.


## Collection runtime boundary

The independent Canvas film, generated material plates, ten chapters, Cormorant/Manrope typography, qualitative mechanism and original editorial composition are retained. One imported GSAP ticker advances one root-locked Lenis (lerp .105, syncTouch false, autoRaf false), then reads document scroll position directly. OS reduced motion and reading mode use native wheel input; dialogs retain native scrolling. The existing normalized history/session restoration is immediate. Terminal teardown cancels late readiness, unregisters the owned clock/listeners and releases Canvas caches. Native Collection return and base-aware asset paths are the only shared interface additions. Trace text/actions return to normal chapter flow in fallback. Original delivery QA is preserved separately; integrated acceptance is scoped in ACCEPTANCE.md. Original project work receives no additional license.
