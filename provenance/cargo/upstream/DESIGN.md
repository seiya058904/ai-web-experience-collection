---
name: CARGO
description: The same box, a changing world.
colors:
  freight-red: "#A64B3B"
  freight-red-hover: "#873D31"
  hazard-amber: "#E4AA4C"
  focus-umber: "#AE5B26"
  paper: "#EDF0EB"
  ink: "#18252B"
  structural-graphite: "#283138"
  muted: "#576567"
  dock-fog: "#B8C3C4"
  sea-light: "#D8E1DD"
  maritime-midnight: "#102A3D"
  white: "#FFFFFF"
typography:
  display:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "clamp(88px, 8.4vw, 126px)"
    fontWeight: 600
    lineHeight: 0.91
    letterSpacing: "-0.022em"
  display-mobile:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "clamp(70px, 20.6vw, 95px)"
    fontWeight: 600
    lineHeight: 0.92
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "clamp(58px, 6.05vw, 94px)"
    fontWeight: 600
    lineHeight: 0.99
    letterSpacing: "-0.015em"
  reading-title:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "clamp(32px, 3.5vw, 52px)"
    fontWeight: 600
    lineHeight: 1.06
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Archivo Variable, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.85
  body-mobile:
    fontFamily: "Archivo Variable, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.8
  control:
    fontFamily: "Archivo Variable, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    letterSpacing: "0.015em"
  wordmark:
    fontFamily: "Archivo Variable, sans-serif"
    fontSize: "30px"
    fontWeight: 850
    letterSpacing: "-0.04em"
spacing:
  page-gutter: "clamp(24px, 5.55vw, 100px)"
  portrait-gutter: "25px"
  narrow-gutter: "20px"
  control-gap: "15px"
  paired-media-gap: "20px"
components:
  button-primary:
    backgroundColor: "{colors.freight-red}"
    textColor: "{colors.white}"
    typography: "{typography.control}"
    padding: "17px 22px"
  button-primary-hover:
    backgroundColor: "{colors.freight-red-hover}"
    textColor: "{colors.white}"
  button-text:
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    padding: "9px 0"
  segmented-selected:
    backgroundColor: "{colors.structural-graphite}"
    textColor: "{colors.white}"
    typography: "{typography.control}"
    padding: "12px 19px"
  chapter-current:
    backgroundColor: "{colors.freight-red}"
    textColor: "{colors.white}"
  dialog:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    padding: "40px"
    width: "680px"
---

# Design System: CARGO

## Overview

**Creative North Star: "The same box, a changing world."**

CARGO combines monumental industrial photographs with precise interface studies. A quiet oxidized-red container remains the visual subject while roads, wagons, stacks, cranes and water change its surroundings. Cool atmospheric distance and warm light from the right give the photographic world a restrained, tactile character. The supporting interface uses paper-like surfaces, strong condensed headings, plain readable prose and structural rules.

The imagery supplies scale; the technical study supplies explicit object state. Neither pretends to be the other. The result should feel like an authored industrial essay with moments of close observation, rather than a freight dashboard or a collection of generic cards.

This is a **source-derived design record** of `src/style.css`, `src/render.ts` and `src/main.ts`, aligned with [PRODUCT.md](PRODUCT.md) and [VISUAL-BIBLE.md](VISUAL-BIBLE.md). **Rendered fidelity is unverified: the current browser route did not serve CARGO, so browser visual acceptance is blocked and no CARGO browser captures were acquired.** Exact test findings belong in the evidence ledger and QA report. The sidecar's tonal ramps are generated preview aids, not additional application color tokens.

**Key Characteristics:**

- One persistent red subject within much larger structures.
- Photographic atmosphere paired with clearly schematic mechanisms.
- Condensed display type and compact, calm wayfinding.
- Selectable English text outside the generated image content.
- Stable reading holds and reversible, position-based mechanical states.
- Complete still-mode content and explicit interaction results.

## Colors

The palette draws from worn freight paint, cool steel, concrete, fog and sea. The frontmatter preserves the current CSS values; the visual bible records the broader photographic interpretation.

### Primary

**Freight red** belongs to the container, the primary journey action, current chapter and selected stage. Its darker hover treatment is a state change, not a second subject color.

### Secondary

**Hazard amber** marks a small point of attention, such as a corner or identity annotation. **Focus umber** is the explicit keyboard outline. Keep these treatments legible on both the paper surfaces and photographic backgrounds.

### Neutral

**Paper** supports reading and interface studies; **ink** is its main type color. **Structural graphite** grounds selected controls and the closing panel. **Muted** supports subordinate information. **Dock fog**, **sea light** and **maritime midnight** connect the interface to the photographed environments. **White** is reserved for dark photographs and filled controls where the composition requires it.

**The Persistent Subject Rule.** Preserve the container's freight-red identity across scenes. Highlights explain a feature temporarily; they do not redefine its material or introduce a competing bright-red actor.

## Typography

Barlow Condensed carries display headings and reading titles. Archivo Variable carries body text, labels, controls and the CARGO wordmark. Both are bundled locally. Condensed headings establish industrial scale; the prose remains conventional and easy to scan.

The frontmatter records the default desktop hierarchy, the portrait hero variant and the enlarged 15-pixel mobile reading body. Photographic headings use short, deliberate measures; reading text is limited to approximately 54 characters in the desktop reading strip. The source contains responsive size changes for small phones, large displays and short landscape viewports. These values are implementation facts, not proof of legibility at every zoom level.

Keep sentence case in narrative headings and normal English punctuation. Chapter numbers are navigation, not decorative telemetry. Dimensions are sourced facts; other numeric marks must have an actual role.

**The Real Type Rule.** Keep meaningful language in selectable HTML or justified accessible SVG. Do not bake titles, labels, registration numbers or technical annotations into generated photographs.

## Layout

The recurring layout alternates a large photographic or technical first beat with an unpinned reading strip. On wide screens, title and supporting prose occupy separate columns. Technical studies place explanatory text beside the model. The portrait treatment stacks those elements and gives the generated mobile hero its own composition.

Page gutters use the responsive values in the frontmatter. The main small-screen change occurs at 700 CSS pixels, with additional source adjustments at 1,000 and 360 pixels. Larger typography and model areas are provided at 1,900 and 2,800 pixels. A short landscape rule handles heights below 600 pixels on wider screens. These are CSS breakpoints, not physical-device test results.

Each handoff separates the caption from the mechanism. Five stage controls remain together beneath the anchor description. The viewport can stop at an intermediate stage without requiring a timed animation to finish. Mobile holds use natural height and visible overflow so their content is not clipped to a fixed frame. Reduced mode removes the sticky travel and leaves an ordinary reading sequence with explicit state choices.

The chapter rail is a narrow vertical index on wide screens. On phones, the eleven compact links are hidden and replaced by a persistent current-chapter status plus a **Chapters** button with a 44-pixel minimum height. Keep room for this bottom strip in the footer, captions and dialogs. Long copy, zoom and font fallback still require the actual browser checks recorded elsewhere.

## Elevation & Depth

Photographs establish physical depth through structural hierarchy, contact, occlusion and haze. The technical model uses its own bounded lighting and contact treatment. The interface itself is mostly flat: tonal changes and thin rules separate sections instead of floating cards.

The current mobile chapter rail has a small shadow to separate it from the moving page. Some photographic captions use a restrained text shadow. Dialog depth is supplied by a dark backdrop; the panel remains a plain paper surface. These exact shadow and motion values are retained in the sidecar rather than added as unsupported frontmatter primitives.

**The Contact Rule.** A support or attachment must remain visually intelligible. When the carrier changes, the structural occluder owns the handoff; a transparent duplicate container is not continuity.

## Shapes

The form language is rectangular: container faces, technical plates, outlined controls, chapter indices and thin structural rules. It echoes the box without turning every reading block into a framed card. Small crosses and corner markers indicate attention; they do not become a decorative map or network.

Buttons and choice groups retain their compact, square-edged character. Native range control behavior is preserved. Do not impose an unrelated pill, glass or floating-card system over the industrial editorial world.

## Components

### Primary and text actions

Primary actions use freight red, white text and an inline directional arrow. The default primary control has a minimum height of 54 CSS pixels. Text actions use an underline-like lower rule, an optional small plus or arrow, and a quieter visual weight. The source's common action controls retain practical keyboard/touch geometry rather than shrinking to match tiny annotation text.

Keyboard focus uses a visible three-pixel outline with a five-pixel offset. Keep it separate from the selected state so that the visitor can distinguish navigation focus from the current choice.

### State selection

Packing, doors, carriers and identity features use small grouped buttons. The selected option is graphite with white text; unselected choices remain on the light surface. `aria-pressed` carries the actual selection. Reset restores a defined state and its readable explanation.

### Chapter navigation

The header provides CARGO, motion preference and chapter access; the about control is also available on wider screens and through the closing section. The desktop rail uses tabular numbers and a freight-red current item; its mobile replacement shows the current chapter and a full-size menu control. The chapter dialog pairs each number with a real chapter name. Native links retain hashes, and selected destinations receive heading focus.

### Dialogs

The chapter and interpretation dialogs are plain paper panels with condensed headings, a visible outlined close control and a dark backdrop. They scroll internally when needed. Escape closes them and focus returns to the opener. Their maximum size is bounded by the viewport.

### Lift range

The lifting study uses a labeled native range input with the freight-red accent. Its accompanying English state explanation distinguishes approach, engagement and lift. The range is an explanatory input, not an equipment-control surface.

### Handoff stage selector

Five short horizontal bars represent the five authored progress positions. The selected bar is red and slightly thicker. Each button has a complete accessible stage label and retains a 44-pixel height on mobile as well as desktop. The anchor and caption provide the meaning; color alone does not carry the state.

### Photographic marker and technical plate

The marker uses a small amber cross and a dark readable identity label. It points within an authored picture and never claims GPS tracking. The technical plate uses a shared SVG/Three model, fine dimension rules, a fictional identity label and a clear schematic note. Failure and still modes preserve the explanatory controls.

Motion is restrained and purposeful. The initial copy reveal is finite; optional haze is subtle. Lenis, GSAP and the scene evaluator share the story clock. The primary mechanical state follows scroll position directly. Reduced motion removes ambient movement and smooth travel while keeping every meaningful choice.

## Do's and Don'ts

### Do:

- **Do** retain the single freight-red container, the same scratch, doors and authored cargo arrangement.
- **Do** keep photographic atmosphere and technical explanation visibly distinct.
- **Do** place English type on a quiet region or an appropriate reading surface.
- **Do** preserve real support, attachment and opaque occlusion during handoffs.
- **Do** retain complete chapters, state choices and readable results in still mode.
- **Do** update this source-derived record if final CSS or component behavior changes.

### Don't:

- **Don't** add carrier logos, invented BIC registration or fabricated operational data.
- **Don't** use baked image text as the website's meaningful content.
- **Don't** blend two translucent copies of the selected container to imply continuity.
- **Don't** turn the editorial into a telemetry dashboard or generic card grid.
- **Don't** replace the purpose-built portrait hero with a desktop crop.
- **Don't** label design extraction, image generation or a successful build as browser visual acceptance.
