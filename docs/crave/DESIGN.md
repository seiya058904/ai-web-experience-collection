---
name: "CRAVE — Before the First Bite"
description: "See the heat. Break the crust. Want the bite."
colors:
  paper: "#17120f"
  ink: "#f0e6d2"
  accent: "#b27743"
  paper-light: "#eae4d9"
  ink-light: "#322116"
typography:
  display:
    fontFamily: "'Crave Serif', Georgia, serif"
    fontSize: "27vw"
    fontWeight: 400
    lineHeight: 0.84
    letterSpacing: "-.038em"
  headline:
    fontFamily: "'Crave Serif', Georgia, serif"
    fontSize: "clamp(70px, 8.2vw, 270px)"
    fontWeight: 400
    lineHeight: 0.91
    letterSpacing: "-.033em"
  headline-mobile:
    fontFamily: "'Crave Serif', Georgia, serif"
    fontSize: "clamp(45px, 13.4vw, 80px)"
    fontWeight: 400
    lineHeight: 0.94
    letterSpacing: "-.026em"
  melt-headline:
    fontFamily: "'Crave Serif', Georgia, serif"
    fontSize: "clamp(90px, 12vw, 370px)"
    fontWeight: 400
    lineHeight: 0.91
    letterSpacing: "-.033em"
  hero-tagline:
    fontFamily: "'Crave Serif', Georgia, serif"
    fontSize: "clamp(27px, 2.35vw, 64px)"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "-.02em"
  wordmark:
    fontFamily: "'Crave Serif', Georgia, serif"
    fontSize: "clamp(23px, 1.8vw, 38px)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: ".16em"
  control:
    fontFamily: "'Crave Serif', Georgia, serif"
    fontSize: "clamp(17px, 1.28vw, 26px)"
    lineHeight: 1.4
  action-label:
    fontFamily: "'Crave Sans', Arial, sans-serif"
    fontSize: "clamp(12px, .85vw, 18px)"
    letterSpacing: ".03em"
  range-label:
    fontFamily: "'Crave Serif', Georgia, serif"
    fontSize: "clamp(15px, 1.2vw, 24px)"
  caption:
    fontFamily: "'Crave Serif', Georgia, serif"
    fontSize: "clamp(16px, 1.3vw, 28px)"
    lineHeight: 1.2
  chapter-title:
    fontFamily: "'Crave Serif', Georgia, serif"
    fontSize: "clamp(24px, 2.25vw, 62px)"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "-.01em"
  chapter-number:
    fontFamily: "'Crave Sans', Arial, sans-serif"
    fontSize: "clamp(11px, .83vw, 19px)"
    fontWeight: 400
    lineHeight: 1
  index-title:
    fontFamily: "'Crave Serif', Georgia, serif"
    fontSize: "clamp(64px, 7.8vw, 220px)"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "-.032em"
rounded:
  none: "0"
  range-thumb: "50%"
spacing:
  gutter: "clamp(24px, 3.25vw, 120px)"
  gutter-mobile: "23px"
  gutter-narrow: "18px"
  header-control-gap: "clamp(28px, 3vw, 62px)"
  action-gap: "20px"
  transport-gap: "24px"
components:
  wordmark:
    textColor: "{colors.ink}"
    typography: "{typography.wordmark}"
  text-control:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.none}"
    padding: "0"
  scene-title-light:
    textColor: "{colors.ink-light}"
    typography: "{typography.headline}"
  material-action:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.action-label}"
    rounded: "{rounded.none}"
    padding: "0"
  material-range:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.range-label}"
    width: "min(300px, 25vw)"
  scene-next:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.none}"
    padding: "0"
  chapter-link:
    backgroundColor: "transparent"
    textColor: "{colors.ink-light}"
    typography: "{typography.chapter-title}"
    padding: "5px 5px 7px"
  motion-control:
    backgroundColor: "transparent"
    textColor: "{colors.ink-light}"
    rounded: "{rounded.none}"
    padding: "0"
  journey-progress:
    backgroundColor: "rgba(167, 126, 86, .13)"
    height: "2px"
    width: "100%"
---

# Design System: CRAVE

Source snapshot: [style.css](src/style.css), [scenes.js](src/scenes.js), [index.html](index.html), [main.js](src/main.js), [atmosphere.js](src/atmosphere.js) and [PRODUCT.md](PRODUCT.md), extracted on 2026-10-07. The frontmatter captures the implemented primitive values; responsive overrides and behavior are documented below. Component values describe their stated tone, while the running interface follows the active scene tone.

## Overview

**Creative North Star: "Before the First Bite"**

CRAVE is a sensory film about the instant before eating. Food occupies the frame as a warm, edible material: a dry layer, a moist interior, a heavy ribbon, a temporary reflection. The interface gives these differences room to register through sparse editorial language and close observation.

Espresso darkness and porcelain light alternate with the materials. Large serif words share the composition with the food; small controls remain legible and quiet. Desire comes from believable color, irregular structure, restrained moisture and a clear contrast between outside and inside. The visitor completes the final bite in imagination.

**Key Characteristics:**

- Four food materials across eleven movements, with one material relationship in focus at a time.
- Extreme photographic crops, native serif italics and precise, understated controls.
- Material match cuts and one restrained highlight language connect the scenes.
- Hold, anticipation, snap and release give the experience an uneven, deliberate rhythm.
- Mobile compositions, reduced motion and local media are part of the design.

## Colors

The palette pairs espresso and warm ivory with a restrained browned-butter accent, then turns to porcelain and dark brown for the interior, air and plate sequences.

### Primary

- **Browning accent** (`accent`) marks keyboard focus. Its warm character belongs to the same family as the food without becoming a decorative wash.

### Neutral

- **Espresso paper** (`paper`) is the default backdrop and the dark scene surface.
- **Warm ivory ink** (`ink`) carries the wordmark, large dark-scene type and quiet navigation.
- **Porcelain paper** (`paper-light`) opens the light scenes and the chapter index.
- **Dark brown ink** (`ink-light`) preserves the warmth of the typography against porcelain.

The source retains the names `--paper`, `--ink` and `--accent`. Scene tone switches the paper/ink pair through the body's data attribute; the food handoff determines the timing independently of the incoming title. Local top and bottom gradients protect navigation contrast in the affected compositions. Thin range and chapter rules remain translucent; their exact component CSS is preserved in the sidecar.

The sidecar's eight-step OKLCH strips are synthesized panel previews derived from the five source colors. They are metadata, not additional production colors or a replacement palette.

**The Edible Color Rule.** Let the food establish the warm color range. Use the interface accent for orientation and focus; preserve uneven browning, pale interiors and selective highlights in the imagery.

## Typography

**Display and editorial font:** Cormorant Garamond, self-hosted as `Crave Serif`, with Georgia and serif fallbacks. Regular and genuine italic font files are loaded at weight 400.

**Utility font:** Manrope, self-hosted as `Crave Sans`, with Arial and sans-serif fallbacks. The variable file is declared for weights 400–500 and appears in sensory action labels, chapter numbers and compact notes.

**Character:** The serif carries the voice, including the ordinary Index and Sound controls. Italic phrases supply the softer second beat of a title. The sans is a small precision instrument, never a competing headline voice.

### Hierarchy

- **Display** fills the opening with CRAVE and sits behind the foreground material. Its desktop token is intentionally much larger than normal interface display type.
- **Headline** is the ordinary two-part scene title. The second line uses native italic. Individual scenes change placement and size around their own material.
- **Melt headline** gives the short phrase “Give in.” its own larger scale.
- **Hero tagline** is a brief italic line below the opening display.
- **Wordmark** is the small tracked CRAVE in the persistent header and chapter index.
- **Control** covers the serif header actions; **action label** covers the underlined sans phrase beside a fine arrow.
- **Range label** describes sensory endpoints rather than invented measurements. **Caption** accompanies the next-scene control.
- **Index title**, **chapter title** and **chapter number** establish the single-column list inside the two-column desktop index.

There is no generic body-copy column in the live scenes. Descriptive prose is available to assistive technology, and the index has a short introduction. Numerals in scene counts and chapter navigation use tabular alignment. Do not replace the actual italic font with synthetic obliques; font synthesis is disabled.

The mobile headline token is a deliberate override. The opening display uses a separate size (30.5vw), line height (.78) and tracking (-.04em); the finale is centered with its own 17.1vw headline. Desktop scene variants include a smaller single-line Crust title and a larger Melt phrase. These values are composition decisions, not a uniform type scale.

**The Cropped Voice Rule.** Large type is part of the scene composition. Preserve the explicit oversized display scale, native italics and short sensory phrases; do not impose a generic headline ceiling or add explanatory paragraphs over the food.

## Layout

The experience uses one fixed visual stage over a vertical sequence of scene sections. The food, type, atmosphere and navigation occupy separate layers. Scroll changes the material state and composition; it does not move a stack of conventional content panels through view. There is no card grid, dish catalog or menu layout.

Desktop compositions place short type toward the left and give the material most of the frame. The opening food can occlude the enormous CRAVE display. Scene copy defaults to a 48vw maximum, then receives explicit per-scene positioning; the wordmark and controls share the fluid `gutter`. The footer transport sits above the lower safe area and a thin progress trace remains at the viewport edge.

### Responsive composition

| Condition | Implemented behavior |
| --- | --- |
| Width at most 700px | The food stage starts at **14svh**. Its upper edge transitions from transparent to opaque over **25svh**; Desire removes that mask. Most scene copy begins at 15.2svh. Crops use mobile-specific focus coordinates from `frameFor`, not a scaled desktop camera. |
| Mobile opening | The large word begins at 14.5svh; the tagline sits at 29svh. The media receives a distinct vertical crop. |
| Mobile finale | The title is centered at 15svh and the final food uses its own focal placement. |
| Width at most 370px | The narrow gutter and smaller control typography prevent the persistent navigation from crowding. |
| Width at least 1900px | The material range grows to 420px; sensory action spacing grows and the footer rises to 46px. |
| Desktop height at most 600px | The headline follows `min(8.2vw, 17vh)` and the index/transport tighten vertically. This condition applies from 701px width. |

Desktop header controls receive a local contrast veil in Inside, Crust and Glaze. The chapter index is a full-viewport native dialog: two columns with a 6vw gap on desktop, one flowing column on mobile. Its chapter links remain a plain numbered list with fine rules. Text controls, sensory action buttons and range hit areas have a 44px minimum; mobile chapter rows are at least 46px high.

### Scene score

The eleven spans are authored durations, measured in current viewport heights by `main.js`; CSS provides a `100svh`-based fallback. Resizing preserves the active scene and its relative progress.

| Movement | Viewport span | Food material | Composition and authored emphasis |
| --- | ---: | --- | --- |
| 01 — Desire | 1.48 | Laminated pastry | Establish the extreme golden crop, silhouette, dry layers and restrained highlight. |
| 02 — Heat | 1.32 | Seared scallops | Approach the contact edge; small butter bubbles and restrained shimmer imply heat. |
| 03 — Brown | 1.60 | Seared scallops | Warm surface progression, with the Gold–Chestnut control. |
| 04 — Crust | 1.85 | Laminated pastry | Thin anticipation line, a brief fracture, sparse falling flakes, then the soft interior. |
| 05 — Inside | 1.30 | Laminated pastry interior | Release into pale, irregular layers and moist air pockets. |
| 06 — Melt | 1.75 | Thick chocolate | A heavy folded ribbon, controlled local flow and the Thick–Flow range. |
| 07 — Glaze | 1.48 | Caramel apple tart | Coating and selective reflected light follow the apple surface. |
| 08 — Steam | 1.45 | Warm caramel apple tart | Open the frame and add sparse, source-rooted vapor. |
| 09 — Plate | 1.38 | Whole caramel apple tart | First complete presentation with porcelain negative space, then a closer approach. |
| 10 — Cut | 1.85 | Caramel apple tart, cut state | A short metal edge, pressure, separation and a newly exposed section. |
| 11 — Before the first bite | 1.35 | Caramel apple tart, missing-wedge state | Fresh absence, a trace of warmth and the invitation to replay. |

### Motion and handoffs

Every scene is directed as enter, stable composition, living hold, handoff and exit. The living hold comes from localized light, a small focus/crop change, viscous movement or a source of heat. It must leave the food perceptually settled.

Lenis is the sole global smooth-scroll authority (`autoRaf: false`, `lerp: 0.14`). The GSAP ticker supplies the clock, calls `lenis.raf`, drives ScrollTrigger and feeds the material/atmosphere/audio systems. Neither custom renderer owns a separate RAF. The pointer follows a damped target only for eligible mouse motion.

The common handoff occupies progress .77–1. Crust is an internal event: progress .32–.46 opens only the first 1.8% of the reveal; **SNAP** expands the reveal from .46–.52. The visible flakes begin after .46 and end before .65. Cut reveals the prepared cut state over .38–.59, then hands toward the missing wedge after .78. These are authored normalized scene phases, not time, temperature or physical viscosity measurements.

Time-only material redraws are capped at 50Hz on desktop and 40Hz on mobile; input and changed state can request an immediate draw. The atmosphere surface is capped at a 1500px longest backing edge and DPR 1.2, and renders only for its active material events. Hidden tabs stop the shared ticker and suspend audio; the chapter dialog pauses the living scene. Reduced motion removes decorative movement and smoothing, uses stable crops and discrete image state changes, and disables the flow control. The motion toggle cannot override an operating-system reduced-motion preference.

**The Material Handoff Rule.** Carry an edge, sheen, fold or field of air across the transition. The authored masks and internal events must remain tied to scene progress so a pause or reverse preserves a coherent material state.

## Elevation & Depth

The interface has no box-shadow vocabulary. Depth comes from photographic structure, shallow focus, the food in front of the opening display, restrained highlight continuity and localized atmosphere. Controls and the chapter index remain flat. Tone changes, fine rules and contrast gradients organize the interface without raised surfaces.

The food stage sits above the Hero word, followed by the atmosphere, cutting edge and scene copy. Persistent transport and header controls sit above those layers; the native dialog enters the browser's top layer. These are composition layers, not elevation levels for cards.

The heat, browning, fracture, melt and glaze systems are conceptual image treatments. They observe material cues without claiming a fluid, thermal or mechanical simulation. Do not increase effect strength to rescue an unappetizing asset.

**The Quiet Depth Rule.** Depth belongs to the food, light and framing. Keep controls flat and reserve atmospheric overlays for their actual source; steam rises from the warm tart and flakes appear only after separation begins.

## Shapes

The interface is square, open and largely unboxed. Text buttons use zero rounding and transparent surfaces. The only recurring circular form is the small range thumb; its track is a single thin line. A fine arrow accompanies scene and material actions, and a simple diagonal cross closes the index.

Food supplies the irregular edges and curves. The cutting edge is a brief polygonal metal silhouette with restrained tonal stops. It is an action cue, never a freestanding product object. The mobile stage mask, material edge masks and fracture boundary are composed transitions rather than decorative container shapes.

## Components

The sidecar contains nine scoped HTML/CSS previews of the actual visual patterns. It extends the frontmatter with states, responsive rules, SVG paths and motion metadata; it does not redefine primitive token arrays. Preview wrappers provide the appropriate scene tone and are not production card components.

### Wordmark and header controls

The small wordmark is widely tracked and regular weight. Index and Sound are transparent serif text controls. Hover or keyboard focus grows a one-pixel underline over .2s. The shared visible focus outline uses the accent at 2px with a 7px offset. Sound begins off and only changes after an explicit button action.

### Sensory scene title

A short upright phrase can hand to an italic phrase. Inside uses the normal headline scale on porcelain; several other scenes override that scale to protect their food crop. Copy visibility, pointer access and the inert state follow the same scene state. The decorative oversized CRAVE is hidden from assistive technology; the semantic opening heading remains available.

### Material action

“Break the crust” and “Make the cut” use the same underlined sans label and slender arrow. The arrow translates by 5px on hover. Their click seeks a concrete scene phase through Lenis, retaining the same authored fracture or cut event used by scrolling.

### Material range

Gold–Chestnut and Thick–Flow are native range inputs with visually quiet endpoint labels, a one-pixel translucent track and a 13px circular thumb. The track's hit area is 44px high. Accessible labels and changing value text describe the sensory state. The flow input becomes disabled and visually subdued while motion is off; no numerical temperature or viscosity is presented.

### Scene transport and progress

The lower caption is the next-scene button, paired with an aligned `01 / 11` count. Its arrow moves by 6px on hover. In Desire the arrow points down beneath “Scroll to feel”; the last scene changes the same control to “Once more” and returns to the beginning. A 2px bottom trace records total journey progress and exposes its value accessibly.

### Chapter index

The native dialog contains the wordmark, a Close text control, a brief editorial introduction and eleven numbered links. Each link uses a fine bottom rule; hover and the current step draw a darker rule over .24s. The current chapter title becomes italic. Closing restores focus to Index, and left/right arrow keys navigate scenes outside the dialog and form controls.

### Motion control and fallback

Motion is a simple underlined text control in the index footer. Its state reflects the local preference and the device's reduced-motion setting. Optional sensory audio is synthesized and quiet, with short texture events rather than music. The initial still poster, image fallback and non-JavaScript story preserve an edible composition if enhancement is unavailable; the interface does not depend on a remote font or media service.

## Do's and Don'ts

### Do:

- Do judge each stable frame by whether the food looks edible and desirable before adding effects.
- Do retain the four-material cast and the distinct role of every scene.
- Do keep the native serif italics, severe crops and small, accessible text controls.
- Do preserve the mobile stage offset, edge mask and per-scene focus coordinates when adjusting layout.
- Do keep Lenis as the sole global scroll authority and render from the shared GSAP clock.
- Do preserve deterministic crack and cut states during arbitrary pauses and reverse scrolling.
- Do keep sound opt-in and honor reduced motion, hidden tabs and the motion control.
- Do reference the production provenance and license files when replacing an image or font.

### Don't:

- Don't introduce restaurant, recipe, price, shop, card-grid or food-catalog interface patterns.
- Don't replace material transitions with a sequence of unrelated image fades.
- Don't add plastic gloss, impossible crumb, excessive steam, floating ingredients or explosive flakes.
- Don't force the display typography into a generic 96px maximum or shrink the desktop composition onto mobile.
- Don't add rounded pill buttons, decorative shadows or extra accent colors to this flat editorial interface.
- Don't add an independent animation loop, autoplay sound or continuous offscreen effects.
- Don't describe the authored browning, flow or heat effects as measured food physics.

## Collection integration contract

Preserve all eleven supplied scenes, selected generated photographic materials, four food families, macro crops and the authored hold → anticipation → snap → release rhythm. The Fracture and Cut timing is deliberate; integration does not add another easing layer or rebuild those handoffs.

The independent page is pages/crave/index.html; runtime source is experiences/crave/src. Keep one Lenis1.3.26 at lerp0.105, syncTouch:false and autoRaf:false on the original GSAP3.15.0 ticker. Pose progress follows actual document position. OS reduced motion and manual pause disable wheel smoothing/decorative time; native touch and Index remain native. Optional synthesized sound remains off until activated.

Public media, fonts and third-party notices live under public/crave; original selected PNG masters and source history live under provenance/crave. Production image lineage and exact prompts remain in PROVENANCE.json. Rights are unchanged: no additional whole-site MIT, CC0, stock-image license or scientific calibration is claimed. Upstream README, PRODUCT and QA remain historical delivery records; current Collection results belong to ACCEPTANCE.md.

Visibility and BFCache suspend the one clock/audio/scroll authority. Terminal pagehide/HMR abort owned listeners, queued measurements and late fallback work, destroy Lenis/ScrollTrigger and release WebGL/Canvas/audio resources. Current source constructors remain guarded for partial initialization. The shared native Collection return belongs in the existing header and the no-JS article.
