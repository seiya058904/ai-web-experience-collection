---
name: OPTIC — The Architecture of an Image
description: A precision optical film following one light path through an original camera.
colors:
  bg: "#090b0d"
  ink: "#eeeee9"
  sub: "#a6aaa9"
  rule: "#343b3c"
  accent: "#c8d6d3"
  focus-ring: "#c9dad5"
  hover-ink: "#ffffff"
  control-muted: "#9ca6a1"
  study-surface: "#151b1d"
  shell: "#1b1e20"
  graphite: "#222729"
  magnesium: "#72797c"
  steel: "#b3b7b8"
  sensor-gold: "#a58a48"
typography:
  display:
    fontFamily: Manrope, sans-serif
    fontSize: clamp(54px, 5.5vw, 104px)
    fontWeight: 350
    lineHeight: 1.075
    letterSpacing: -0.04em
  headline:
    fontFamily: Manrope, sans-serif
    fontSize: clamp(45px, 5.05vw, 88px)
    fontWeight: 350
    lineHeight: 1.075
    letterSpacing: -0.04em
  emphasis:
    fontFamily: Cormorant, serif
    fontWeight: 400
    letterSpacing: -0.035em
  body:
    fontFamily: Manrope, sans-serif
    fontSize: clamp(13px, 0.98vw, 16px)
    fontWeight: 400
    lineHeight: 1.8
  label:
    fontFamily: Manrope, sans-serif
    fontSize: 10px
    fontWeight: 400
    letterSpacing: 0.22em
  action:
    fontFamily: Manrope, sans-serif
    fontSize: 10px
    fontWeight: 400
    letterSpacing: 0.17em
  control-heading:
    fontFamily: Manrope, sans-serif
    fontSize: 11px
    fontWeight: 400
    letterSpacing: 0.045em
  readout:
    fontFamily: Manrope, sans-serif
    fontSize: clamp(58px, 6vw, 96px)
    fontWeight: 300
    letterSpacing: -0.04em
  wordmark:
    fontFamily: Manrope, sans-serif
    fontSize: 23px
    fontWeight: 450
    lineHeight: 1
    letterSpacing: 0.35em
  chapter-title:
    fontFamily: Manrope, sans-serif
    fontSize: clamp(22px, 2.2vw, 35px)
    fontWeight: 350
rounded:
  circle: 50%
  switch: 12px
spacing:
  gutter: 4.25vw
  gutter-mobile: 6vw
  control-gap: 10px
components:
  quiet-action:
    textColor: "{colors.ink}"
    typography: "{typography.action}"
    padding: 8px 0
  ambient-motion:
    textColor: "{colors.sub}"
    size: 44px
  optical-stop:
    textColor: "{colors.control-muted}"
    padding: 10px 17px 12px
  optical-stop-selected:
    textColor: "{colors.ink}"
  focus-distance:
    width: 100%
    height: 24px
  stabilization-switch:
    textColor: "{colors.ink}"
  shutter-release:
    textColor: "{colors.ink}"
    padding: 5px 0
  chapter-link:
    height: 44px
  chapter-index-row:
    textColor: "{colors.ink}"
    typography: "{typography.chapter-title}"
    padding: 20px 0
  photo-study:
    backgroundColor: "{colors.study-surface}"
---

# Design System: OPTIC — The Architecture of an Image

## Overview

**Creative North Star: "Follow the light."**

OPTIC is a precision optical film. One beam leads through an original, unbranded full-frame camera, and the machine explains each relationship by moving. The composition is quiet and spacious around a materially detailed object: deep black, graphite and titanium-like metal, cold-white type, and restrained cyan/violet glass. The final warm coastline is the emotional destination.

The visual world remains continuous across Light, Optics, Focus, Aperture, Shutter, Sensor, Stability, Machine and Image. Typography names each idea, then clears while the object carries the handoff. Native HTML controls stay at the frame edges or beside the mechanism they affect. Original procedural geometry, authored studio reflections, photographic depth studies and a complete Canvas2D optical study share this direction. The earlier concept frames established composition and lighting; no concept screenshot is a production backdrop.

**Key Characteristics:**

- One continuous light path connects nine stable compositions.
- Dark, tactile materials carry detail through edges, curvature, grain and reflected light.
- Manrope provides precision; Cormorant italic gives light and photography a human voice.
- Portrait framing is authored independently, with staged parts and reachable controls.
- The final warm photograph settles into a quiet, stable composition.

This document refreshes the provisional direction against the implemented source. The frontmatter is the normative token layer; the sidecar extends it with motion, responsive conditions and component examples. Token values come from [the stylesheet](../../experiences/optic/src/style.css), [the original body](../../experiences/optic/src/camera-model.js) and the implemented controls. Scene behavior is grounded in [the timeline](../../experiences/optic/src/story.js), [scene integration](../../experiences/optic/src/scene.js), [interface orchestration](../../experiences/optic/src/main.js), [the optical assembly](../../experiences/optic/src/optics-model.js), [sensor mechanisms](../../experiences/optic/src/sensor-mechanisms.js) and [the fallback](../../experiences/optic/src/fallback.js).

## Colors

The interface sits within optical black and slightly cool neutrals. Color describes a material or a photographic subject, rather than surrounding the experience with decoration.

### Primary

- **Interaction tint** (`accent`) provides the pale, desaturated selection color. Controls remain led by ink, thin rules and clear state changes.
- **Keyboard focus** (`focus-ring`) is reserved for a distinct outline around the active control. It must remain legible against both the stage and the chapter index.

### Secondary

- **Sensor gold** (`sensor-gold`) belongs to the sensor carrier and the camera's restrained warm metal details. It is a physical material base color, not a call-to-action fill.
- Cyan and violet in the optical glass are calculated by its Fresnel/reflection shader. Preserve their angle-dependent, low-area presence; the source does not define a flat cyan/violet interface palette.

### Neutral

| Token           | Application                                                        |
| --------------- | ------------------------------------------------------------------ |
| `bg`            | Continuous page field, framing and backdrop beneath the renderers. |
| `ink`           | Main typography, selected stops and prominent numeric values.      |
| `sub`           | Supporting text, controls and quiet secondary readings.            |
| `hover-ink`     | Small increase in text brightness on button and link hover.        |
| `rule`          | Masthead, footer and large structural dividers.                    |
| `control-muted` | Unselected optical stops; selected values return to main ink.      |
| `study-surface` | Focus and aperture photographic-study background.                  |
| `shell`         | Rough dark camera enclosure.                                       |
| `graphite`      | Structural dark camera parts and sensor carrier.                   |
| `magnesium`     | Exposed chassis and machined structural surfaces.                  |
| `steel`         | Brighter metal edges, fittings and repeated details.               |

Material tokens describe the model's base colors. Studio lighting, roughness and the display transform determine the final rendered appearance. The photographic study is deliberately desaturated; the final image retains its warm amber flowers, coast and evening light. The sidecar's derived tonal strips are inspection aids, not additional application colors.

## Typography

**Display and body font:** Manrope, locally bundled as a variable font with a sans-serif fallback.

**Emphasis font:** Cormorant Garamond italic, locally registered under the CSS family name `Cormorant`, with a serif fallback. The implementation loads its regular italic face; preserve that italic treatment.

The pairing is precise but unhurried. Light Manrope headlines carry the mechanical statement; a short italic phrase carries the image, perception or light. Technical labels use the same sans-serif family. There is no separate monospace voice.

### Hierarchy

| Role              | Use                                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| `display`         | Opening headline. Balanced wrapping and tight tracking produce a continuous two-part statement.          |
| `headline`        | Baseline chapter heading. Each chapter has its own observed size and placement override.                 |
| `emphasis`        | Inline italic words within display and chapter headings. It inherits the heading's size and rhythm.      |
| `body`            | Brief explanatory sentences, usually one or two deliberate lines.                                        |
| `label`           | Uppercase experience trigger and similarly restrained utility language.                                  |
| `action`          | The opening “Follow the light” action. Other text actions retain their existing local size and tracking. |
| `control-heading` | Control names paired with a value, including focus and stabilization.                                    |
| `readout`         | Baseline aperture numeral. Shutter and sensor measurements have their own authored scales.               |
| `wordmark`        | The widely tracked OPTIC wordmark.                                                                       |
| `chapter-title`   | Chapter-index navigation rows.                                                                           |

Numeric outputs and specifications use tabular numerals. Keep prose brief enough to leave the mechanism visible; this system has no long-form text column or repeated content cards. On narrow phones the headline sizes use viewport-based values, while large displays increase utility type and spacing. Follow those source overrides rather than scaling the entire interface as an image.

The panel opacity is `smooth(0.50, 0.86, weight)`. Outgoing text reaches zero before incoming text appears; at the middle of a handoff the object has the frame to itself. Only the active, sufficiently visible panel can receive input or keyboard focus. Reduced motion selects the active chapter's typography directly.

## Layout

The visual stage and scene panels occupy a fixed viewport. Native document sections supply the scroll distance; their heights come from each chapter's authored duration multiplied by the current viewport height. There is one continuous document and one scroll position. The masthead and chapter rail establish the persistent frame with the frontmatter gutter tokens and fine horizontal rules.

Desktop compositions place text, mechanism and controls in distinct areas of the viewport. The opening camera has room at the right of its headline; Optics uses a broad diagonal depth axis; the middle chapters reserve a clear control area next to their mechanism. The final photograph is centered and retains its 3:2 image ratio, with caption and replay placed in the surrounding dark space.

### Authored chapter compositions

| Chapter   | Stable composition and response                                                                                            | Handoff                                                                      |
| --------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Light     | Three-quarter camera with the light path, restrained coating reflections and a large opening statement.                    | The camera recedes and the optical path opens.                               |
| Optics    | Ten curved elements in eight groups spread along one optical axis; sparse labels and rays follow actual element surfaces.  | The rear focus carriage retains attention.                                   |
| Focus     | Optical geometry and a separate depth study; native range input links carriage movement, focus bracket, blur and distance. | The view aligns with the iris.                                               |
| Aperture  | Front-on nine-blade iris, large f-number, relative-light reading and a small exposure-matched study.                       | The opening leads into the body.                                             |
| Shutter   | Rectangular focal plane, visible cassettes and two traveling curtains; speed choices and a manual release.                 | The curtains reveal the same sensor plane.                                   |
| Sensor    | Full-frame surround and a 24 × 16 RGGB overview give way to an enlarged 4 × 4 layered crop.                                | The sensor returns to its carriage.                                          |
| Stability | Body and frame disturbance around a sensor image; the on/off comparison uses the same signal.                              | The corrected sensor rejoins the chassis.                                    |
| Machine   | Three separated lens housings, ordered body layers, raised control deck and readable internal parts.                       | Reassembly closes reversibly, then the rear display becomes the image frame. |
| Image     | Warm coastline, restrained caption, final sentence and replay action.                                                      | The settled composition remains still until navigation resumes.              |

### Responsive behavior

At widths up to (900px), the application uses a mobile timeline and wider proportional gutters. Portrait uses an independent set of viewing-camera poses. Optical parts recede through depth, the focus study spans the frame beneath the mechanism, the iris remains large, and control docks occupy reachable lower positions. The machine's detached parts enter staged portrait lanes after their initial depth release; the lens housings use their own inspection lane.

At widths up to (480px), headline sizes and selected line breaks are adjusted per chapter. The short-portrait aperture rule applies at widths up to (600px) and heights up to (700px), moving its reading and depth study together while retaining the lower control area. At widths up to (900px) and heights up to (520px), the compact layout uses two visual columns and removes nonessential supporting copy; the viewing camera uses the wide composition with a wider field of view. Short desktop viewports and displays from (2200px) have separate spacing and type adjustments.

Do not infer a universal grid from these compositions. The repeated structure is the outer frame, the document-scroll timeline, a clear object region, and a control region with room for the footer.

## Elevation & Depth

The DOM interface is flat. It uses tonal separation, fine rules and spare outlines rather than raised surfaces. Focus and aperture studies have a thin border; there is no card elevation scale, frosted-glass panel system or large decorative UI shadow.

The scene supplies depth through original geometry, finite material thickness, bevels, surface grain, machined edges and studio reflections. Metal and structure use PBR materials. Curved optical glass uses a single-pass Fresnel shader with authored dark studio reflections and restrained coating color; its appearance is an explanatory shading treatment. The light-path solver separately refracts representative rays at the actual authored curved surfaces. A procedural radial shadow grounds the camera and expanded assembly.

### Shadow vocabulary

- The range thumb's small surrounding shadow separates its grip from the optical-black field.
- The focus bracket's fine offset outline preserves its edge over the photographic study.

Their exact CSS values are carried in the sidecar. They are local contrast treatments and should not become surface-elevation presets.

### Scene continuity and motion

A single Lenis instance advances from the existing application `requestAnimationFrame` loop (`lerp: 0.105`, `syncTouch: false`, `autoRaf: false`). Scene, controls, typography and rail sample the resulting document position directly; there is no second camera easing clock. Native touch, keyboard input and the Index's own scrolling remain available. Model modules own geometry and resources, not clocks. Neighboring stable poses interpolate deterministically; repeated mechanical details are instanced. There is no nested document scroller.

Ambient motion is deliberately small and can be paused. Native reduced motion disables wheel smoothing, removes ambient movement, changes the camera between chapter keyframes, disables the capture flash, and keeps mechanism controls available. Hidden tabs stop Lenis and cancel the scheduled callback; returning reconstructs the current document position without resuming stale inertia. Resize retains normalized reading position. Reload and document Back keep their actual stop; fresh hash entry navigates immediately into the named chapter, without replacing input made during initialization. Lenis and the renderers are disposed with the owning clock.

Drawing-buffer sizing targets approximately (1.7 million pixels) on mobile and (4.2 million pixels) on desktop, with DPR limits of (1.6) and (1.5) respectively and a lower ratio bound of (0.65). These are implementation budgets, not measured frame-rate claims. Once the final chapter passes local progress (0.42), the visual stage is hidden and WebGL submissions stop. Reverse navigation restores scene rendering. Canvas2D provides an explicit optical study for all nine chapters when WebGL is unavailable or its context is lost; renderer-specific 3D labels and the magnified 4 × 4 crop are not represented as identical 3D output in that mode.

## Shapes

The interface uses straight rules, open text actions and unfilled controls. Round forms have a functional role: range thumbs, switch tracks and knobs, lens barrels, rings and mechanical pivots. There is no general rounded-card primitive.

The original body is approximately (134mm) wide at a construction scale of (25mm per scene unit). The active sensor is (36 × 24mm), represented as (1.44 × 0.96 units) at the optical reference plane. Local positive Z faces the subject; light travels toward negative Z. Preserve these internally consistent relationships when adding geometry.

The camera combines hollow, beveled covers, a magnesium chassis, sculpted grip, knurled controls, an EVF and rear screen. The optical assembly has ten curved glass elements in eight groups, finite edge thickness and three machined housing segments. Its nine iris blades rotate around individual pivots to form the aperture. The shutter uses two focal-plane curtains with rigid stacking blades and same-direction exposure travel. Stabilization remains planar: X, Y and roll correction preserve the focal plane while illustrating the five labeled camera-motion classes.

The sensor view progresses from a (24 × 16) overview to a (4 × 4) magnified crop with curved microlenses, filters, photodiode wells, interconnects and readout. The (6µm) annotation belongs to the fictional camera specification. These grids are explanatory crops; they do not depict the complete sensor's pixel count. Layer separation and visible motion are explanatory magnifications, not manufacturing dimensions.

## Components

### Quiet text actions and ambient-motion control

Actions are lightweight text with a fine inline SVG. “Follow the light” moves its downward arrow slightly on hover; replay uses a return arrow. Shutter release has a small concentric-circle symbol. The experience trigger pairs uppercase text with two horizontal strokes. Hover brightens the text; keyboard focus uses the shared visible outline. The dedicated ambient-motion button keeps a square (44px) target and exposes pause/resume through its accessible name and pressed state.

### Optical stop selector

Aperture and shutter choices share an open horizontal selector over one rule. Selection uses main ink and a short underline, with `aria-pressed` exposing state. The aperture choices are f/1.4, f/2.8, f/8 and f/16; shutter choices are 1/30, 1/125 and 1/2000. Preserve these labels as illustrative mechanism controls. The aperture study reports relative light and an exposure-matched shutter value; those readings are not a measured camera profile. Desktop stop buttons have a (44px) minimum height, mobile rules use (43px), and the large-display rule uses (60px).

### Focus distance

A native range field combines a fine track, round thumb, near/infinity labels and a tabular distance output. Its accessible value text follows the distance. The photographic study uses the shared coast image with a masked near layer, independent blur amounts and a moving bracket; the visible depth effect is an authored approximation.

Within the stable Focus composition, the default remains sharp near until local progress (0.48), racks to sharp far by (0.64), then holds. Clicking a chapter lands within the near hold. A manual range choice overrides the automatic focus while the visitor remains in the chapter; leaving clears the override. Preserve the two holds when changing the preview or carriage.

### Shutter release

The explicit release action retains a (44px) minimum target and restarts the slowed two-curtain cycle. The same control works alongside the three speed choices. The short “mechanical / motion slowed” note distinguishes the explanatory animation from real elapsed exposure time.

### Stabilization switch

The switch sits beside its label above a thin rule, with a small round-ended track and a dot that travels horizontally between ON and OFF. Its accessible name remains “Sensor-shift stabilization”; `aria-checked` and visible text expose the changing state. Keep its (44px) minimum target. The model uses the exact inverse planar transform for the demonstration's shared X/Y/roll disturbance; the sensor does not tip forward or sideways.

### Chapter rail and index

The footer rail contains nine equal segments and keeps (44px) link targets even though the visible line is thin. Progress fills each segment from the left; hover or keyboard focus reveals its chapter name, and the active chapter carries `aria-current="step"`. The full-screen native dialog offers the same nine chapters as large numbered text rows: three columns on desktop, two on mobile, and three in the compact landscape treatment. Dialog behavior, keyboard navigation and the skip link remain part of the experience.

### Optical and sensor labels

Small uppercase labels remain sparse and subordinate to the object. Optical and machine labels project from the relevant parts. Magnified sensor labels use dedicated microlens, color-filter, photodiode and readout anchors, with leader lines terminating on the actual layers. Their screen positions may use an authored side lane; their endpoints must continue to follow the mechanism. The overview key is RGGB, with two green cells per red and blue pair.

### Machine assembly and photographic destination

The exploded machine is an authored component, not a loose pile of decorative parts. The complete lens follows the front module's axial release. The three housing segments clear the optical sightline before becoming fully visible in their inspection lane. The body first releases through depth, then its portrait arrangement separates into readable lanes. On reverse travel, the housings clear before crossing back over the optical stack. Reassembly occurs through local Machine progress (0.57–0.90), and every placement is reconstructible from current state.

The same original coast image appears in depth studies, sensor/display surfaces and the final figure. The final caption calls it an imagined moment. Keep the final 3:2 composition, authored warm color and descriptive image alternative text. The supplied geometry, exposure labels and generated artwork illustrate an original camera; they are not evidence from a physical product.

## Do's and Don'ts

### Do:

- Do keep one coherent light path and an intelligible relationship between every optical and mechanical part.
- Do preserve the deep black field, cold-white typography and restrained material color; let the final coastline carry warmth.
- Do let outgoing typography clear before the next headline enters, while the mechanism carries the transition.
- Do preserve the sharp-near hold, the authored focus rack and the sharp-far hold before adding any new focus behavior.
- Do compose portrait scenes with their independent camera poses and staged inspection lanes.
- Do keep projected layer labels attached to actual layer anchors, and keep the two sensor crops clearly illustrative.
- Do retain native controls, visible keyboard focus, stable accessible names, chapter navigation and reduced-motion behavior.
- Do keep one Lenis/document/RAF authority and reconstruct all scene positions from current state so reverse travel remains reliable.
- Do stop hidden GPU submissions at the settled photograph and preserve the complete Canvas2D fallback.

### Don't:

- Don't introduce neon HUDs, glowing interface frames, card grids or generic scrolling reveals.
- Don't turn cyan/violet glass coatings or sensor gold into broad interface fills.
- Don't replace the original camera with a branded product clone, a raster slideshow or a concept-image backdrop.
- Don't flatten curved glass into discs, scale iris blades in place, or tip the stabilized sensor out of its focal plane.
- Don't collapse the three housing segments or the detached body layers into one unreadable stack, including on portrait screens.
- Don't add an independent animation clock, a nested document scroller or a second easing layer after Lenis.
- Don't present illustrative optical geometry, the 6 µm pitch, exposure labels or the generated coast image as measured hardware data or photographic EXIF.
- Don't add unsupported claims about awards, manufacturing, calibrated optical performance or real-device frame rates.
