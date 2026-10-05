---
name: CHRONOS
description: The Architecture of Time — a cinematic journey inside a mechanical watch.
colors:
  ink: "#0a0b0d"
  ivory: "#eee9df"
  muted: "#a5a39e"
  champagne: "#c7b48d"
  line: "rgba(218, 213, 201, .25)"
  dialog-surface: "#0d0e10"
  reading-copy: "#b8b5ad"
typography:
  display:
    fontFamily: "'Cormorant Garamond', Georgia, serif"
    fontSize: "clamp(72px, 6.1vw, 234px)"
    fontWeight: 300
    lineHeight: 0.97
    letterSpacing: "-.035em"
  headline:
    fontFamily: "'Cormorant Garamond', Georgia, serif"
    fontSize: "clamp(76px, 6.65vw, 255px)"
    fontWeight: 300
    lineHeight: 0.97
    letterSpacing: "-.035em"
  headline-compact:
    fontFamily: "'Cormorant Garamond', Georgia, serif"
    fontSize: "clamp(38px, 12.3vw, 78px)"
    fontWeight: 300
    lineHeight: 0.96
    letterSpacing: "-.03em"
  headline-portrait-tablet:
    fontFamily: "'Cormorant Garamond', Georgia, serif"
    fontSize: "clamp(68px, 8.8vw, 96px)"
    fontWeight: 300
    lineHeight: 0.96
    letterSpacing: "-.03em"
  dialog-headline:
    fontFamily: "'Cormorant Garamond', Georgia, serif"
    fontSize: "clamp(80px, 9vw, 240px)"
    fontWeight: 300
    lineHeight: 0.90
    letterSpacing: "-.035em"
  wordmark:
    fontFamily: "'Cormorant Garamond', Georgia, serif"
    fontSize: "clamp(21px, 1.7vw, 58px)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: ".30em"
  body:
    fontFamily: "'DM Sans', sans-serif"
    fontSize: "clamp(14px, 1.06vw, 36px)"
    fontWeight: 400
    lineHeight: 1.8
    letterSpacing: ".055em"
  label:
    fontFamily: "'DM Sans', sans-serif"
    fontSize: "clamp(10px, .70vw, 25px)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: ".20em"
  action:
    fontFamily: "'DM Sans', sans-serif"
    fontSize: "clamp(10px, .76vw, 26px)"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: ".23em"
  index-title:
    fontFamily: "'Cormorant Garamond', Georgia, serif"
    fontSize: "clamp(34px, 3.3vw, 110px)"
    fontWeight: 300
    letterSpacing: "-.025em"
  frequency:
    fontFamily: "'Cormorant Garamond', Georgia, serif"
    fontSize: "clamp(42px, 3.7vw, 140px)"
    fontWeight: 300
    lineHeight: 1
  measurement:
    fontFamily: "'IBM Plex Mono', monospace"
    fontSize: "clamp(20px, 2.1vw, 60px)"
    fontWeight: 400
    letterSpacing: "-.03em"
  reading-body:
    fontFamily: "'DM Sans', sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.95
rounded:
  circle: "50%"
spacing:
  gutter: "clamp(26px, 3.4vw, 136px)"
  gutter-compact: "23px"
  gutter-portrait-tablet: "clamp(32px, 4.2vw, 46px)"
  gutter-narrow: "18px"
  text-link-gap: "20px"
  note-gap: "18px"
  frequency-gap: "24px"
components:
  text-link:
    textColor: "{colors.ivory}"
    typography: "{typography.action}"
    padding: "8px 0"
  text-link-hover:
    textColor: "{colors.champagne}"
  index-trigger:
    textColor: "{colors.ivory}"
    typography: "{typography.label}"
    padding: "0"
  index-row:
    textColor: "{colors.ivory}"
    typography: "{typography.index-title}"
  index-row-hover:
    textColor: "{colors.champagne}"
  motion-control:
    width: "44px"
    height: "44px"
    padding: "0"
  sound-control:
    textColor: "{colors.ivory}"
    padding: "0"
  sound-control-active:
    textColor: "{colors.champagne}"
  frequency-pair:
    textColor: "{colors.ivory}"
    typography: "{typography.frequency}"
  dialog:
    backgroundColor: "{colors.dialog-surface}"
    textColor: "{colors.ivory}"
    width: "100%"
    height: "100%"
    padding: "0"
---

# Design System: CHRONOS

## Overview

**Creative North Star: "Time Machine"**

CHRONOS uses the user-defined character **Dark / Luxury / Precise / Minimal / Cinematic**. A mechanical watch occupies a dark field, with silver and graphite surfaces, restrained champagne details, and enough empty space to read both the object and the sentence beside it. The interface remains small in scale relative to the watch and its macro details.

Material, typography and movement carry the identity. Thin Cormorant Garamond headlines and italic emphasis establish the narrative voice; compact sans-serif controls and measured monospaced numbers keep navigation precise. A continuous camera and persistent mechanical assembly connect the views, while the reading layer remains semantic HTML. The [Experience direction contract](EXPERIENCE.md) records the journey-specific arrangement.

**Key Characteristics:**

- Dark graphite space with warm ivory reading contrast.
- Silver surfaces and restrained champagne emphasis.
- Light serif headlines, small sans-serif controls, monospaced measurements.
- One continuous object, with controlled movement between stable compositions.
- Flat navigation, fine rules, circular mechanical forms and photographic depth.

The frontmatter records current reusable values from [the stylesheet](../../experiences/chronos/src/style.css). [HTML](../../pages/chronos/index.html), [the page controller](../../experiences/chronos/src/main.ts), [narrative mapping](../../experiences/chronos/src/narrative.ts), and [the scene](../../experiences/chronos/src/scene/WatchScene.ts) define the behavior described below. This document describes the implemented system; it does not claim unperformed platform verification.

## Colors

The palette places a single warm accent inside graphite, ivory and muted metal tones. The frontmatter is the source for exact token values.

### Primary

- **Champagne** (`champagne`): hover and active emphasis, the visible keyboard focus outline, the mechanical pulse, and restrained warm details around the movement.

### Neutral

- **Graphite ink** (`ink`): the page, stage and dark sides of the photographic composition.
- **Warm ivory** (`ivory`): main headings, primary controls, wordmark and current chapter markers.
- **Muted gray** (`muted`): supporting chapter copy, secondary labels and explanations.
- **Metal hairline** (`line`): translucent top and bottom rules, index separators and the frequency divider. Preserve its alpha value.
- **Dialog graphite** (`dialog-surface`): the full-screen index, credits and reading surfaces, including their sticky headers.
- **Reading gray** (`reading-copy`): longer paragraphs and reference lists inside the reading and credits dialogs.

**The Accent Rule.** Reserve champagne for active, hover, focus and measured mechanical accents.

The 3D materials use their own metal, ruby and blued-steel surface values. They do not introduce additional interface accent roles. Sidecar tonal ramps are preview interpolations; the implementation does not define an eight-step application palette.

## Typography

**Display font:** Cormorant Garamond, with Georgia and serif fallbacks. Its light weight and selective italic words define chapter headings; the wordmark uses its regular weight with wider tracking.

**Body font:** DM Sans, with a sans-serif fallback. It supplies chapter copy, navigation, action labels, dialog reading copy and secondary information.

**Measurement font:** IBM Plex Mono, with a monospace fallback. It supplies chapter numbers, the mechanical clock, the speed notation and small part labels. The mechanical clock uses tabular numerals.

### Hierarchy

- **Display** uses the `display` token for the opening title. **Headline** supplies the main chapter scale; Transmission and Oscillation retain the slightly smaller clamps defined in the stylesheet.
- **Compact headline** replaces the broad-screen scale in the compact media rule. Portrait tablets use `headline-portrait-tablet`; narrow phones and shallow landscape views have their own final overrides. Preserve this cascade.
- **Dialog headline** supplies the large index introduction. The credits and reading title uses its own observed smaller clamp; index rows use `index-title`.
- **Body** supports a short reading measure, capped at 40 characters on the main stage. Compact chapter copy is capped at 35 characters and uses a tighter line height; portrait tablets use 16px copy with a 36-character measure.
- **Label** and **action** are uppercase and tracked. Buttons do not use the display serif merely to appear prominent.
- **Frequency** pairs a large serif number with a small sans-serif explanatory label. **Measurement** is a separate monospaced role; it is not another display heading.
- **Reading body** supports longer explanations inside the dialogs and is reduced to 14px in the compact layout.

**The Type Contrast Rule.** Set narrative headlines in Cormorant Garamond and interface text in DM Sans; use IBM Plex Mono for numbers and small mechanical labels.

All three families are local Fontsource assets. Additions should use the supplied weights and keep italic emphasis selective. The complete reading transcript carries the narrative for visitors who use that view.

## Layout

The experience uses a viewport-height sticky stage within a long document. The broad-screen journey is 1300svh; the live canvas, photographic layers and chapter copy remain inside one persistent stage. The fixed top navigation and bottom transport share the fluid gutter token and fine horizontal rules. Main copy generally sits to the left of a larger object, with short lines and a changing vertical position suited to the chapter.

The index uses a two-column introduction and six ruled navigation rows. Credits and the reading view use a centered column with a maximum width of 810px and a proportional outer margin. These dialogs occupy the viewport and scroll natively; they are not floating cards.

### Responsive rules

| Source condition | Implemented composition |
| --- | --- |
| Minimum aspect ratio 21:9 | Main type responds to viewport height; the copy rises and the watch moves inward |
| Width 701–1100px | Intermediate base: reduced headline clamp, wider relative copy area and tighter transport; index subtitles are hidden. The portrait rule below overrides its composition |
| Width ≤700px, width ≤1100px with aspect ratio ≤43:50, or height ≤550px with width ≤950px | Compact base: 23px gutters, stacked copy and watch, smaller controls, 950svh journey and one-column index; portrait tablet and shallow landscape rules below override selected values |
| Width 701–1100px with aspect ratio ≤43:50 | Portrait tablet: fluid 32–46px gutters, 88px header, 68–96px headline clamp, 16px body copy, 44px text actions and 78px transport; copy remains above the mechanism |
| Width ≤359px | 18px gutters and a smaller headline and transport scale |
| Height ≤600px with width ≥701px | Shorter navigation and transport bars, viewport-height headline scale and reduced vertical gaps |
| Width ≤700px with height ≤680px | Stronger reading masks protect Oscillation and Chronos; the closing title and mechanical readout use dedicated compact placement |
| Height ≤550px with width 701–950px | Final landscape override: copy starts at 78px, occupies 47% width from a 32px left offset, watch remains on the right, minor callouts are hidden and the index uses two columns |
| Reduced-motion preference | Journey lengths become 800svh, or 670svh under the compact base rule; chapters use fixed compositions |

The page controller and 3D renderer share `portraitLayout(width, height)` from `experiences/chronos/src/narrative.ts`: width ≤700px, or width ≤1100px with width/height ≤43/50. CSS uses the matching portrait condition so the watch artwork, live camera and copy agree on a stacked composition. The controller measures the actual stage height. Short compact views move the final watch center to 70.5% of that height and apply 0.63 of the regular closing scale. The shallow landscape override remains separate and keeps the object on the right.

Compact layouts hide the supplementary mechanical caption to avoid repeating the chapter information. Oscillation uses a deeper reading gradient and a local dark backing under its numeric readout; short phones further extend the reading protection and simplify the readout.

Safe-area bottom insets remain part of the transport placement. The renderer caps device pixel ratio and total canvas pixels independently of CSS layout, so large-window compositions do not require a native-resolution 4K drawing buffer.

## Elevation & Depth

Interface depth uses tonal layering and masks. The stylesheet does not define a box-shadow vocabulary. Dark reading gradients protect type over the imagery, and the navigation and transport use transparent tonal layers that remain part of the same scene. The full-screen dialogs use a dark backdrop without card shadows.

Physical depth belongs to the watch. A persistent 30° PerspectiveCamera changes its distance from the selected mechanical focus. Geometry uses bevels, layered bridges, reflective metals, a locally generated studio environment, and cast shadows. Axial separation exposes the wheel and pinion relationships. At the photography-to-live handoff, the photo and live surfaces stay opaque and occupy complementary masks sharing one screen-space circular aperture. Craft's circular window starts at the projected third-wheel ruby surface and carries the photographic ruby into its settled crop; closing follows the same reversible mapping. The live scene renders before this projection is painted.

**The Material Depth Rule.** Create depth through lit geometry, restrained reflective surfaces and tonal masks; keep interface controls flat.

Static detail is merged by material within each moving assembly, and repeated fasteners use instancing. These optimizations retain the independent shaft, bridge, hand and spring behavior. They support the continuous scene without changing its material hierarchy or promising a particular frame rate.

## Shapes

Circular forms belong to the watch, its aperture, the light reflection and the small progress point. Their radius token is `circle`. UI surfaces remain rectilinear and edge-to-edge, with no rounded-card vocabulary.

One-pixel dividers establish alignment. Inline SVG icons use open strokes, rounded line caps and rounded joins; arrows, the index cross, pause/play marks and sound waveform keep similar optical weight. Action links use a fine lower rule, which is part of their shape as well as their affordance.

Clipping has a narrative function: the dial iris enters and exits the mechanism, the craft circle opens and closes a detail view, and the text reveal uncovers the next sentence. The watch frame holds the screen-space mask separately from the moving watch artwork. Reduced motion removes these animated reveals and uses visible, fixed chapter states.

## Components

### Text actions

**Character:** small, ruled and directional. The uppercase label sits beside an inline arrow with a minimum broad-screen height of 44px and vertical padding from `text-link`.

Hover changes the text to champagne over 220ms and moves the arrow by 3px horizontally and 2px vertically over 250ms. Focus uses the shared one-pixel champagne outline with a 7px offset. Compact and shallow landscape rules use their smaller observed dimensions; do not claim a universal 44px target across all variants.

### Navigation and chapter index

**Character:** a quiet frame around the object. The wordmark links to the beginning; the movement link enters the mechanism; Index opens a native dialog. Its cross rotates 90° over 300ms on hover.

Index rows pair a mono chapter number with a light serif name, a short secondary label when space allows, and an arrow. They are separated by fine rules and change text color over 240ms. The current row exposes `aria-current="step"`. The lower chapter indicator opens the same index rather than creating another navigation controller. Chapter navigation uses 1.65 seconds in the broad composition and 1.2 seconds in the shared portrait layout, or moves immediately with reduced motion. Page-scroll keys cancel an active smooth scroll. Home/End, including their Ctrl variants, then commit the appropriate endpoint immediately; Page, Arrow and non-control Space retain native scrolling. Form editing and button activation keep their behavior.

### Transport controls

**Character:** measured and compact. The broad-screen pause control has a 44px square box, with smaller optical marks inside it. The compact layout reduces its width to 33px; portrait tablets use 42px. Play and pause symbols respond to `aria-pressed`.

Sound begins off and requires explicit activation. Its active state is champagne; the compact layout retains the waveform and an accessible text label while visually hiding the label. Disabled controls use 0.45 opacity. Both controls share the global visible focus outline.

### Frequency and mechanical readout

**Character:** an observation beside the mechanism. The 4 Hz serif value, short divider and small sans-serif label explain the nominal balance frequency. The separate IBM Plex Mono clock shows mechanical seconds. Its fine pulse line uses champagne.

The closer-study action switches ambient mechanical advance between ⅛ and ¹⁄₃₂ speed. The camera and scroll-induced phase remain responsive to the visitor. Compact views give the clock a local dark reading gradient; short phones also remove its pulse line and rate sublabel. Small supplementary callouts are hidden in the final shallow landscape rule.

### Dialogs and reading view

**Character:** full-screen, flat and readable. Use native dialogs, sticky ruled headers, a clear Close action, and natural document scrolling. The opening opacity animation lasts 300ms with ease-out. Escape and focus restoration belong to the behavior; opening an index or reading view pauses the background experience.

### Cinematic stage

**Character:** one mechanism carried between views. One page-level Lenis instance, one ScrollTrigger and one GSAP ticker coordinate the persistent canvas and HTML copy. The `WatchScene` receives progress and time rather than creating its own scrolling or frame loop.

Each interval holds its composition for the first 28%, then transitions and settles by 85%. Pausing freezes ambient time while preserving scroll access; reduced motion selects static chapter and mechanism poses. Changing that preference explicitly stops any old Lenis animation before layout measurements change. A still edition keeps the story and controls available when live rendering cannot be established. The exact kinematic model and its visual simplifications are recorded in [MOTION.md](MOTION.md).

## Do's and Don'ts

### Do:

- Do preserve the Time Machine direction and the Dark / Luxury / Precise / Minimal / Cinematic character.
- Do keep the watch and its mechanical detail larger in visual importance than the interface.
- Do use the existing graphite, ivory and champagne roles with their original alpha values.
- Do preserve serif narrative type, sans-serif controls and monospaced measurements as separate roles.
- Do maintain one continuous camera, one persistent assembly and reversible chapter mappings.
- Do preserve complementary opaque masks at each photo/live handoff.
- Do preserve the reading view, visible keyboard focus, optional sound and reduced-motion compositions.
- Do keep page, camera and CSS portrait fitting aligned, while preserving the separate shallow landscape override.

### Don't:

- Don't turn this experience into a shopping layout, card grid or generic section template.
- Don't introduce rounded UI containers or box-shadow elevation into this flat interface.
- Don't replace mechanical relationships with unrelated spins or per-chapter random phases.
- Don't move essential copy into textures, photographs or canvas-only labels.
- Don't describe generated photographic detail or illustrative geometry as a verified manufactured calibre.
- Don't claim a fixed frame rate, a native 4K drawing buffer or unperformed device verification.
