---
name: SILICON — From Sand to Signal
description: 'A precision object theatre: material, light, layers and connected signal.'
colors:
  paper: '#edf0ec'
  muted: '#a0a7a8'
  ground: '#080a0b'
  line: '#343c40'
  dialog: '#0e1418'
  focus: '#ccdbdf'
  hover: '#ffffff'
  surface: '#10191f'
  range-filled: '#c5d3d2'
  range-track: '#4d595f'
  range-thumb: '#dbe3df'
  auto-manual: '#d9c2a5'
  motion-text: '#8e9a9f'
  silicon-channel: '#acb3b7'
  copper-route: '#b97e55'
  silver-lid: '#f7f9f8'
  violet: '#c3a8ee'
  signal: '#b5ded1'
typography:
  display:
    fontFamily: '''Manrope Variable'', sans-serif'
    fontSize: clamp(150px, 15.4vw, 720px)
    fontWeight: 300
    lineHeight: 0.97
    letterSpacing: .09em
  headline:
    fontFamily: '''Manrope Variable'', sans-serif'
    fontSize: clamp(52px, 5.55vw, 240px)
    fontWeight: 350
    lineHeight: 1.04
    letterSpacing: -.04em
  title:
    fontFamily: '''Manrope Variable'', sans-serif'
    fontSize: clamp(30px, 2.65vw, 112px)
    fontWeight: 350
    lineHeight: 1.2
    letterSpacing: -.035em
  body:
    fontFamily: '''Manrope Variable'', sans-serif'
    fontSize: clamp(14px, 1.03vw, 42px)
    fontWeight: 400
    lineHeight: 1.75
  action:
    fontFamily: '''Manrope Variable'', sans-serif'
    fontSize: clamp(12px, .85vw, 34px)
    fontWeight: 450
  chapter-label:
    fontFamily: '''IBM Plex Mono'', monospace'
    fontSize: clamp(9px, .63vw, 26px)
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: .065em
  process-row:
    fontFamily: '''Manrope Variable'', sans-serif'
    fontSize: clamp(21px, 2.1vw, 32px)
    fontWeight: 350
  dialog-headline:
    fontFamily: '''Manrope Variable'', sans-serif'
    fontSize: clamp(40px, 4.4vw, 69px)
    fontWeight: 350
    lineHeight: 1.1
    letterSpacing: -.04em
  motion-label:
    fontFamily: '''IBM Plex Mono'', monospace'
    fontSize: clamp(10px, .60vw, 24px)
    fontWeight: 400
    lineHeight: 1
rounded:
  none: '0'
  range-thumb: 1px
  switch-track: 10px
  circle: 50%
spacing:
  gutter: clamp(28px, 3.65vw, 160px)
  gutter-mobile: 24px
  control-gap: 12px
  action-gap: 22px
  dialog-block: 28px
  dialog-inline: 42px
components:
  text-action:
    textColor: '{colors.paper}'
    typography: '{typography.action}'
    rounded: '{rounded.none}'
    padding: 10px 0
  text-action-begin:
    textColor: '{colors.paper}'
    typography: '{typography.action}'
    rounded: '{rounded.none}'
    padding: 10px 0
  quiet-action:
    textColor: '{colors.muted}'
    rounded: '{rounded.none}'
    padding: 8px 0
  inspection:
    width: clamp(210px, 20vw, 800px)
  switch-control:
    textColor: '{colors.paper}'
    rounded: '{rounded.none}'
    padding: 4px 0
  chapter-link:
    rounded: '{rounded.none}'
    padding: 16px 0 6px
  process-index-row:
    textColor: '{colors.paper}'
    typography: '{typography.process-row}'
    rounded: '{rounded.none}'
    padding: 22px 0
  process-dialog:
    backgroundColor: '{colors.dialog}'
    textColor: '{colors.paper}'
    rounded: '{rounded.none}'
    padding: '0'
    width: min(1120px, calc(100vw - 64px))
  motion-control:
    textColor: '{colors.motion-text}'
    typography: '{typography.motion-label}'
    rounded: '{rounded.none}'
    padding: 4px 0 4px 9px
---

# Design System: SILICON — From Sand to Signal

## Overview

**Creative North Star: "Precision Object Theatre"**

SILICON occupies one dark exhibition space. A polished wafer becomes a patterned film, a microscopic cutaway, a connected metal stack and a finished package. Layers, light, paths and signals supply the recurring visual language. The geometry and its material response carry the experience; typography establishes a quiet editorial frame around it.

The implemented world is precise, layered, luminous and industrial. Cold reflections reveal silicon and silver; copper belongs to conductors; violet makes an invisible optical process legible; pale green marks circuit activity. Original procedural surfaces, modelled sections and a continuous camera provide the artwork. The restrained controls invite inspection without taking over the exhibit.

**Key Characteristics:**

- One continuous exhibition ground and one shared camera.
- Real layer depth, retained feature identity and connected routes.
- Light-weight editorial type paired with functional monospaced labels.
- Material reflections and sectional geometry instead of decorative UI depth.
- Dedicated portrait and compact landscape compositions.

This record is derived from `src/style.css`, `src/main.ts` and the scene modules. Frontmatter contains the normative reused values; the sidecar adds state styling, responsive conditions and component specimens. The narrative and construction sequence are preserved in [Scene architecture](SCENE-ARCHITECTURE.md). Scientific sources and the boundaries of the abstraction are recorded in [Sources](SOURCES.md).

## Colors

The palette combines a nearly black exhibition ground, cool neutral typography and distinct material colours.

### Primary

- **Paper** is the normal foreground for headings, actions and dialog content. **Muted** supports body copy and secondary actions. **Hover** and **Focus** supply explicit interaction states.
- **Signal** identifies active channels and connected electrical routes. It is an activity colour, not a general button colour.

### Secondary

- **Copper route** is the base colour of the repeated BEOL conductors. Other metal parts use deliberately related, physically shaded finishes; this token does not repaint every metallic object.
- **Violet** is the recurring exposure and gate-control accent. The brighter optical core and faint surrounding field remain separate scene-specific materials.
- **Silicon channel** and **Silver lid** are material base colours, not their final screen appearance. Roughness, reflected cards, direct lighting and tone mapping determine the visible result.
- **Auto manual** distinguishes the available return-to-scroll action while a range control is manually held.

### Neutral

- **Ground** anchors the canvas and document. **Dialog** is the distinct raised reading surface. **Surface** is the dark range-thumb fill and a recurring procedural surface ground.
- **Line** separates dialog groups. The chapter rail and range tracks have their own quieter state strokes; their exact values belong to those components.
- **Range filled**, **Range track** and **Range thumb** make the control position legible without a filled panel. **Motion text** keeps the persistent ambient-motion action secondary.

**The Material Meaning Rule.** Reserve material and activity colours for what they explain: metal, optics, conduction or heat. Keep the interface predominantly neutral.

The sidecar's eight-step tonal strips are generated inspection aids in OKLCH. They are not an additional palette used by the website. Unused custom properties and unused members of the shared material palette are deliberately omitted from the normative tokens.

## Typography

**Display and body font:** Manrope Variable, with a sans-serif fallback.

**Measurement and indexing font:** IBM Plex Mono, with a monospace fallback.

The word SILICON uses light, widely spaced letters that sit behind the wafer. Scene headlines are closer set, with deliberate line breaks that frame the object. Short paragraphs maintain an editorial rhythm; the monospaced voice is reserved for information that behaves like an index, measurement or instrument readout.

### Hierarchy

- **Display** is the oversized opening word, not a repeated section-heading treatment.
- **Headline** is the primary scene story. Its variable weight and tight line height preserve large negative space around the model.
- **Title** is the opening sentence below the model. **Dialog headline** introduces the process index.
- **Body** is the shared scene paragraph, normally limited to a 34ch measure. It uses the frontmatter's fluid desktop scale and comfortable line height.
- **Action** is the underlined entry and replay action. **Process row** is the larger process-index item.
- **Chapter label** and **Motion label** are functional mono roles. They are not a pattern for adding decorative text above every heading.

**The Two Voices Rule.** Use Manrope for the visitor-facing story and actions; use IBM Plex Mono for chapter indexing, measurements and control readouts.

Typography has explicit responsive variants rather than a single proportional reduction. Portrait scene headlines use `clamp(38px, 12.3vw, 72px)` with a 1.03 line height; the transistor headline has a narrower chapter-specific setting. Portrait body copy is 12px. Compact landscape uses a 26–40px headline clamp and 12px body copy at 1.45 line height. The opening word has separate portrait and landscape tracking. Scene headline tracking remains no tighter than `-.04em`.

## Layout

The desktop composition is asymmetrical: narrative occupies the left third and the model occupies the open field to its right. Header, copy and eight-part navigation share the same fluid gutter. A fixed header and footer surround a single viewport-height sticky exhibit. The full scroll document is 1540svh on desktop and 1260svh below the portrait width breakpoint.

The dominant layout is spatial, not a grid of containers. Short copy, nearby controls, an occasional structure label and the physical object are enough to make a scene. The process index is the distinct two-column reading layout inside its dialog.

| Viewport condition | Implemented composition |
| --- | --- |
| Desktop | Left copy block at 33% width; scene heading centred vertically around the 43.5% anchor; fixed eight-label rail below. |
| 760–1100px wide | Copy widens to 35%; chapter labels and callouts become more compact. |
| Desktop at most 730px high | Copy and control spacing tighten; the opening sentence and footer use shorter vertical intervals. |
| At most 759px wide | Gutter becomes 24px. Story moves above the object; inspection controls sit above the footer. The chapter rail retains eight tracks with one current chapter label. The package has its own lower, smaller framing. |
| Portrait at most 740px high | Headlines and paragraph spacing tighten; the footer moves to its shorter layout. |
| At most 500px high and aspect ratio at least 3:2 | Compact landscape takes precedence. A 36%-wide copy column begins below the 56px header; the object occupies the right. Controls return to document-local positioning, and the footer becomes a horizontal metadata/rail grid. |
| At least 2400px wide | Fluid typography and control geometry grow; dedicated spacing and switch/icon sizes preserve their relationship to the artwork. |

The responsive camera accompanies these CSS branches. It is not enough to change type size while leaving the model in the same screen coordinates. The sidecar records the exact media conditions. The canonical gutter and recurring component spacing are in frontmatter; they are observed values, not a newly imposed spacing scale.

## Elevation & Depth

Interface surfaces are flat: there is no CSS box-shadow vocabulary. Dialogs are separated from the exhibition by a darker backdrop and a modest neutral surface change, not by floating card shadows. The atmospheric gradient belongs to the exhibition ground and is deliberately restrained.

Objects gain depth from modelled thickness, precise bevels, occlusion, cast shadows and material-dependent reflections. The shared studio uses separated narrow HDR cards with real dark gaps and two finite rectangular area lights. These sources create changing highlights across rails, caps and the tilted lid. The wafer carries a procedural floorplan and thin-film response; conductor and lid surfaces retain their own finish maps. Global tone mapping is ACES with an exposure of 0.98.

**The Physical Depth Rule.** Let bevels, layer separation, shadows and reflected light describe the object. Keep surrounding interface surfaces flat.

Ambient motion is a living hold: a reflection, exposure sweep or connected packet continues while the main composition remains readable. The scene state is reconstructed from scroll progress, so layer poses and transitions work in either direction. Pause freezes ambient activity; reduced motion selects a composed still state per chapter while retaining direct controls. The detailed sequence and feature transfers live in the scene-architecture record.

## Shapes

Interface buttons and dialog surfaces use square edges. Fine horizontal rules, range tracks and the eight chapter tracks express precision without enclosing the screen in frames. The tiny range thumb is almost square; the switch track and its circular indicator are the deliberate rounded control exceptions.

The artwork's form language comes from manufacturing: a circular wafer with a real alignment notch, rectilinear die floorplans, thin deposited films, three retained nanosheets, crossing conductors, vertical vias and a layered package footprint. Modelled bevels are physical edge treatment, not a generic UI corner radius. Wafer arcs, local routing and cut faces may guide composition because they belong to the object.

## Components

### Underlined actions

Entry and replay are quiet text actions with an inline SVG arrow and a fine underline. On hover the underline shortens to 62% of its length; the arrow advances four pixels along the action's direction. The entry arrow points down, the replay arrow right. The secondary exhibit action uses muted text without the underline. All share the visible keyboard focus outline.

### Inspection ranges

Exposure and layer separation use the same native range control: a short label, a percentage output, a one-pixel track, a small rectangular thumb and a compact return-to-Auto action. Dragging enters manual inspection; Auto restores the scroll-driven value. The footer describes that relationship. The range remains a semantic input and keeps vertical touch scrolling available.

### Gate and power switches

Gate and power share a neutral outlined switch, a state word and a short explanatory caption. The indicator moves within its track when `aria-checked` changes. Their scene effects are different: the gate controls the three channels, and power controls activity on connected package routes. A related preference switch lives in the About dialog.

### Chapter rail

Eight parallel tracks describe one continuous manufacturing journey. The active label brightens and its track becomes two pixels high; progress grows within each segment. The rail remains a group of named buttons, with `aria-current="step"` on the current chapter. Portrait and compact landscape omit the individual visible names while keeping their accessible names and the current chapter readout.

### Process index and dialogs

The header's process action pairs its text with an authored 12px inline SVG cross. It rotates 90 degrees on hover and is omitted in the existing narrow layouts.

The process index is a two-column list of numbered chapter actions, separated by fine horizontal lines. Its arrow advances on hover. The process dialog is centred and bounded; the About dialog is a full-height reading panel on the right, becoming full width on narrow screens. Both use native dialog semantics, explicit close buttons and contained internal scrolling. The close button is a square 44px target with an inline SVG cross.

### Motion control

The persistent mono action changes between pause and resume icons and words. It controls ambient time, while chapter navigation and inspection remain available. The About panel separately exposes reduced motion. These are distinct preferences with distinct behaviour.

The sidecar includes nine faithful HTML/CSS specimens of these implemented components. It does not introduce a card system, tags, decorative badges, text-entry forms or an additional component framework.

## Do's and Don'ts

### Do:

- Do keep the shared ground, camera and four recurring forms: layer, light, path and signal.
- Do align copy, controls and navigation to the common gutter, then reserve clear space for the object.
- Do preserve the same physical feature during a handoff, including the selected die floorplan before subsequent deposition covers it.
- Do use neutral, flat controls with the existing visible focus treatment and native semantic behaviour.
- Do provide a composed still state, direct inspection and semantic exhibit text when motion or WebGL is unavailable.
- Do distinguish silicon channels, dielectric, conductors, logic dies and stacked memory in both geometry and copy.

### Don't:

- Don't turn the exhibition into repeated image-and-headline sections or a card-based content dashboard.
- Don't use optical violet or activity green as a blanket technology theme.
- Don't substitute broad glow, blur or transparent HUD frames for material definition and readable geometry.
- Don't hide the carried feature as soon as it reaches its destination; allow its identity to be read before the next process changes it.
- Don't copy the desktop composition onto a narrow or short viewport without its corresponding layout and camera branch.
- Don't present the illustrative geometry as a foundry blueprint, a scale drawing, a measured thermal field or evidence of consciousness.

**Not canonized:** unused custom-property and palette declarations are omitted from the normative tokens.
