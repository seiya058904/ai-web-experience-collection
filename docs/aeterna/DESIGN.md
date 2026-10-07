---
name: AETERNA
description: A monumental digital exhibition of Rome in Marble and Memory.
colors:
  black: "#111210"
  deep: "#090a09"
  bone: "#ede7dc"
  stone: "#b7b0a6"
  paper: "#ded9cf"
  ink: "#242521"
  muted-light: "#5c5b53"
  body-dark: "#cac4b9"
  rule-dark: "rgba(237,231,220,.26)"
  rule-light: "rgba(36,37,33,.28)"
  range-track: "#79776d"
  notes-paper: "#e7e2d8"
typography:
  display:
    fontFamily: "Bodoni, 'Times New Roman', serif"
    fontSize: "20.3vw"
    fontWeight: 400
    lineHeight: 0.86
    letterSpacing: "-.036em"
  headline:
    fontFamily: "Bodoni, 'Times New Roman', serif"
    fontSize: "clamp(56px,5.5vw,212px)"
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "-.033em"
  title:
    fontFamily: "Bodoni, 'Times New Roman', serif"
    fontSize: "clamp(24px,2vw,70px)"
    fontWeight: 400
  body:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "clamp(13px,1.06vw,32px)"
    fontWeight: 400
    lineHeight: 1.85
    letterSpacing: ".005em"
  label:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "clamp(11px,.77vw,24px)"
    fontWeight: 400
  action:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "clamp(12px,.84vw,26px)"
    fontWeight: 400
    lineHeight: 1.4
  wordmark:
    fontFamily: "Bodoni, 'Times New Roman', serif"
    fontSize: "clamp(16px,1.22vw,42px)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: ".32em"
  caption:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "clamp(10px,.68vw,22px)"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: ".01em"
  index-title:
    fontFamily: "Bodoni, 'Times New Roman', serif"
    fontSize: "clamp(23px,2vw,73px)"
    fontWeight: 400
    lineHeight: 1.25
  notes-body:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "clamp(14px,.95vw,24px)"
    fontWeight: 400
    lineHeight: 1.85
rounded:
  square: "0"
  focus-corner: "1px"
  motion-track: "12px"
  circular: "50%"
spacing:
  gutter: "3.2vw"
  gutter-compact: "24px"
components:
  text-action:
    backgroundColor: "transparent"
    padding: "10px 0"
  line-action:
    backgroundColor: "transparent"
    typography: "{typography.action}"
    padding: "10px 0"
  surface-inspection:
    backgroundColor: "transparent"
    textColor: "{colors.bone}"
  portrait-choice:
    backgroundColor: "transparent"
    padding: "0"
  portrait-choice-selected:
    textColor: "{colors.bone}"
  exhibit-range:
    backgroundColor: "transparent"
    width: "100%"
    height: "28px"
  chapter-rail:
    width: "36vw"
    height: "38px"
  index-row:
    textColor: "{colors.ink}"
    typography: "{typography.index-title}"
  motion-toggle:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
  source-panel:
    backgroundColor: "{colors.notes-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "0"
    width: "min(860px,72vw)"
    height: "100dvh"
---

# Design System: AETERNA

## Collection integration — 2026-10-07

The supplied nine rooms retain their own HTML document, native scroll and one on-demand RAF. Assets, fonts, museum models and the Draco decoder remain local and namespaced. The Collection adds its native return link and gallery entrance. In the static reading edition all nine rooms are accessible; the running controller owns inactive-room hiding. Portrait tablets from 701 to 900px reuse the supplied compact layout to keep the sculpture below its heading and above its controls. See [audited intake and acceptance](ACCEPTANCE.md); upstream claims are historical evidence, not Collection acceptance.

## Overview

**Creative North Star: "Rome in Marble and Memory"**

AETERNA is a monumental sculpture exhibition shaped by scale, light, stone and the gaze of a surviving image. A colossal face, a divided body and an almost empty hall belong to the same visual world. The composition gives material and silhouette most of the viewport; a small amount of exact language establishes a point of view. Its character is sculptural, cinematic, tactile and precise.

The identity comes from oversized classical display type, museum light, deep negative space and close attention to the material. Dark galleries and an ivory conservation room form one restrained palette. Controls feel like exhibit annotations: thin rules, direct labels and deliberate actions. The supplied direction rejects a black-and-gold luxury template, boxed card grids and decorative motion. These are confirmed visual constraints, not inferred conventions for unrelated products.

Use the strongest medium for the image. Interpretive production plates carry the colossal face, marble macro and imagined architecture. Real geometry carries fragment alignment, disassembly, relief travel and the cast inspection. HTML typography and controls remain separate from those materials. The existing title-to-sculpture overlap is a composed spatial relationship, not text baked into an asset. [Visual direction](VISUAL_BIBLE.md) · [Product commitments](UPSTREAM-PRODUCT.md)

**Key Characteristics:**

- Monumental Bodoni display beside quiet Manrope interface text.
- Near-black gallery and ivory archive, with color supplied primarily by the material and lighting.
- Full-viewport exhibits, generous negative space and unboxed reading columns.
- A fine chapter rail, direct exhibit ranges and quiet source panels.
- Purposeful reveal, assembly and fracture; a still final room.
- Mobile compositions that reserve real space for both sculpture and controls.

This document records the implemented system. The frontmatter contains shared values extracted from [the stylesheet](../../experiences/aeterna/src/styles.css); it does not introduce a modular spacing or type scale. Component state and layout behavior follow [the HTML](../../pages/aeterna/index.html), [the main controller](../../experiences/aeterna/src/main.js), [the scroll timeline](../../experiences/aeterna/src/scroll.js) and [the spatial stage](../../experiences/aeterna/src/spatial/index.js). The CSS is authoritative where an earlier visual reference differs. Motion, breakpoints and component excerpts that exceed the portable token schema are recorded in [.impeccable/design.json](../../provenance/aeterna/design.json). This is design documentation, not a verification report.

## Colors

The palette is warm stone against a nearly black gallery, opening into an ivory paper surface with dark mineral ink.

### Neutral

| Token | Character | Application |
|---|---|---|
| `black` | Gallery charcoal | The default page, exhibition and dark-room ground. |
| `deep` | Deep gallery shadow | The near-black used in protective image gradients; it is not an accent. |
| `bone` | Bone-white | Primary dark-room text, selected controls and the pale range thumb. |
| `stone` | Muted stone | Secondary navigation and dark-theme interface text. |
| `paper` | Conservation ivory | The Afterlife gallery and full-screen index. |
| `ink` | Mineral ink | Text and controls on ivory; the relief's text after its light spatial view is revealed. |
| `muted-light` | Archive gray | Secondary light-theme navigation. |
| `body-dark` | Warm reading gray | The shared dark-room body-copy baseline. Individual plates retain their local reading colors. |
| `rule-dark` / `rule-light` | Translucent stone rules | The chapter rail in each theme. |
| `range-track` | Worn stone line | The one-pixel exhibit range track. |
| `notes-paper` | Notes ivory | The slightly lighter source and collection-record panel. |

There is no primary, secondary or tertiary interface accent in the implementation. Bronze and mineral green belong to the material direction; the interface does not establish a bronze button, a gold highlight or a semantic color ramp. Local caption colors respond to individual images and should not be promoted to a new global palette. [Color assignments](../../experiences/aeterna/src/styles.css)

**The Image-Legibility Rule.** Choose text color and protection against the actual plate underneath it. Theme alone does not determine legibility.

The header and footer retain bone text in dark rooms, but chapter-specific gradients protect them where marble or architecture enters their reading areas. These scrims are intended parts of the composition. At desktop widths, the stone macro's lower annotations sit at the left gutter in the dark area: the specimen title uses bone while its supporting and provenance text remain muted. The surface-inspection label and circular control have dark backing. On phones, the hero uses a localized radial scrim behind the upper-left thought alongside its lower title gradient; the macro has a stronger horizontal reading scrim. In the relief, the foreground and persistent navigation switch to ink only after the pale spatial view is sufficiently revealed; Afterlife is light throughout. Preserve those coordinated changes when changing a crop, image or reveal. [Theme and reveal behavior](../../experiences/aeterna/src/main.js) · [Image protection](../../experiences/aeterna/src/styles.css)

## Typography

**Display Font:** Bodoni Moda, exposed locally as `Bodoni`, with Times New Roman and serif fallbacks. Regular and italic files are self-hosted.

**Body Font:** Manrope, with Arial and sans-serif fallbacks. Regular and medium files are self-hosted; the current interface is predominantly regular.

**Character:** Bodoni supplies scale, fragility and a classical editorial voice. Manrope supplies precise reading and control labels. Italic words make a selective change in tone inside a heading; they are not a general emphasis style for all interface text. [Font and typography declarations](../../experiences/aeterna/src/styles.css)

### Hierarchy

| Role | Use and relationship |
|---|---|
| `display` | The opening AETERNA title: deliberately enormous, tightly spaced and set on one line. Its width is part of the image composition. |
| `headline` | The baseline chapter heading. Local exhibit sizes are composition-specific: Monument and Afterlife grow; Fracture and Relief accommodate their longer phrasing. |
| `title` | The archive object's name. It remains subordinate to the chapter heading while distinguishing the collection record from interface labels. |
| `body` | Short exhibit interpretation, with a desktop maximum line length of (36ch). It should remain a small reading area in a large image. |
| `label` | The heading over an exhibit range. Values use tabular numerals so changing percentages do not disturb the control. |
| `action` | An unboxed detail action with a fine underline and directional arrow. |
| `wordmark` | The small, widely tracked AETERNA identity in the persistent header and dialogs. |
| `caption` | A discreet image or provenance annotation, aligned to the composition. |
| `index-title` | The room names in the large typographic index. |
| `notes-body` | Longer source and collection reading, with a maximum paragraph length of (66ch). |

There is no fixed scale ratio. Display, headings, reading text and annotations use fluid viewport sizes with local bounds. Preserve those relationships rather than rounding them into a generic heading ladder. The final room has its own full-width AETERNA treatment, with generous tracking and reduced opacity.

At compact widths, the opening title remains huge (20.4vw) and moves lower in the image; its duplicate foreground layer is removed. The shared chapter headline becomes `clamp(43px,12.2vw,65px)`, with smaller local sizes in the spatial chapters. Body copy becomes (12px) before exhibit-specific adjustments. These are recompositions, not a requirement to make every text role proportional to the desktop version. [Responsive typography](../../experiences/aeterna/src/styles.css)

**The Monumental Type Rule.** Preserve the striking size difference between display and interface. Do not shrink the exhibition into a conventional title, description and button stack.

## Layout

### Spatial model

The exhibition is a fixed, edge-to-edge stage with one active room. A separate native scroll track supplies chapter progress. Header and footer sit above the exhibit; the scene owns the area between them. Reading columns share the `gutter` token with navigation, while the hero title has its own optical inset. This is an asymmetric exhibition system, not a centered card container. [Page structure](../../pages/aeterna/index.html) · [Scroll architecture](../../experiences/aeterna/src/scroll.js)

The baseline desktop reading column is (42.5vw), with a maximum width of (1800px); actual room compositions vary around it. The body and portrait reserve the left side for interpretation and place their sculptural subject toward the right. The surface image fills its room using cover crops. Captions occupy quiet lower areas and are aligned independently of the main copy. The desktop chapter rail is deliberately much narrower than the viewport; the next-room action anchors the opposite side. [Implemented layout](../../experiences/aeterna/src/styles.css)

### Responsive behavior

| Condition | Intended recomposition |
|---|---|
| Width at or below (700px) | Use `gutter-compact`. Replace the nine-position rail with a room number, room name and index trigger. Hide the header's exhibition-text action; retain Index. Re-crop each plate. |
| Width from (701px) through (1000px) | Widen the reading column, restrain body size and adapt the index rows without switching to the phone arrangement. |
| Width at or above (2200px) | Enlarge thin controls, arrow icons, range thumbs and rail targets; let source notes occupy a larger proportional panel. |
| Compact width and height at or below (740px) | Tighten spatial headings and the archive record so exhibit controls still have room. |
| Width above (700px) and height at or below (580px) | Reduce desktop vertical spacing, heading size and record density for short windows. |

Phone portraits place the image above a lower reading block. The mobile conservation gallery places text over a protected ivory area; entering inspection moves its heading up and collection controls down. Hero cropping, gradients and title placement are authored separately for the phone. Compact labels and captions preserve full accessible control names while reducing visible text. [Responsive styles and labels](../../experiences/aeterna/src/styles.css) · [Markup](../../pages/aeterna/index.html)

### Mobile spatial exhibits

Body, Relief, Fracture and cast inspection reserve a measured canvas between the text above and the controls or archive record below. On a phone, the controller reads those elements' actual bounding boxes; it does not rely on the initial percentage inset. It adds a gap of (12px) below a viewport height of (700px), otherwise (16px). The canvas bounds are recomputed when dimensions, chapter, inspection state, manual-control state or font readiness changes. [Canvas layout](../../experiences/aeterna/src/main.js)

The spatial stage then fits the visible geometry and visible pedestal into that supplied rectangle. The floor shadow does not determine the fit. The relief retains a small approach within the fitting area so “Surface” to “Space” still changes the view. Body and Fracture omit their short descriptive paragraphs on compact screens to protect the exhibit itself. These behaviors are intended safeguards for the final mobile composition. [Subject fitting](../../experiences/aeterna/src/spatial/index.js) · [Compact reading layout](../../experiences/aeterna/src/styles.css)

### Rhythm

Use the existing gutter and local vertical rhythm: large viewport-relative intervals in scenes, smaller exact intervals in labels and records. The interface repeatedly uses fine rules and generous empty space. There is no shared eight-point spacing scale to extend. Dialog content scrolls within its own reading area; the exhibit remains stationary underneath it. Safe-area insets are incorporated into the compact header and footer. [Layout and dialog styles](../../experiences/aeterna/src/styles.css)

**The Reserved-Space Rule.** A sculpture, its heading and its direct controls each need a usable area. When the viewport changes, refit the geometry and recompose the text rather than allowing either to overlap the control area.

## Elevation & Depth

The interface has no box-shadow vocabulary. Navigation, links, records and notes are flat at rest. Depth comes from sculpture, photographic light, genuine geometry, occlusion and transparent gradients. Source dialogs separate themselves with a pale surface and a dark backdrop, not a raised card shadow. There is no frosted-glass blur. [Surface styling](../../experiences/aeterna/src/styles.css)

The opening title crosses the colossal face through a foreground mask and a second, clipped HTML title layer. Preserve the shared crop, scale and transform of the base plate and foreground mask. Mobile simplifies this relationship to one clearly legible title. Elsewhere, real scene shadows belong to the exhibit lighting and pedestal; they are not UI elevation tokens. [Hero composition](../../pages/aeterna/index.html) · [Compositing styles](../../experiences/aeterna/src/styles.css) · [Scene lighting](../../experiences/aeterna/src/spatial/index.js)

**The Material-Depth Rule.** Let stone, occlusion and light carry depth. Do not add card shadows or ornamental blur to make the interface compete with the objects.

## Shapes

The ordinary interface is square and open: text actions have no enclosing fill, range thumbs are narrow rectangles, source panels have straight edges and records use rules instead of boxes. A visible focus outline has a small corner adjustment; it does not turn the control into a pill. One-pixel borders are the prevailing division between states and rows. [Shapes and states](../../experiences/aeterna/src/styles.css)

Curves have specific functions. The marble-inspection control is circular, its plus becoming a close-like diagonal when pressed. The motion preference uses a short rounded track and a circular indicator. Those exceptions do not establish a rounded-card system. Arrows and close marks are thin, unfilled SVG strokes with round caps and joins.

The recurring sculptural forms are the body and the fragment. Cuts, incomplete surfaces, a cylindrical relief and an architectural plinth are exhibit geometry, not interchangeable decorative tiles. Preserve their material scale and silhouette when composing new views. [Material direction](VISUAL_BIBLE.md)

## Components

### Text and detail actions

Quiet, precise actions remain close to their copy. Header and quiet links use a transparent underline at rest, becoming visible on hover. Detail actions pair text with a right arrow and a short underline that extends on hover; the arrow moves slightly in the same direction. They inherit the relevant local foreground. They do not use a filled primary-button treatment. [Action styles](../../experiences/aeterna/src/styles.css)

The shared keyboard treatment is a current-color outline (1px) offset by (6px); ranges use a closer offset (3px). Disabled buttons reduce opacity and use the waiting cursor. Preserve the control's accessible label when a phone substitutes “Details” for its longer visible text. The source and collection actions open a native modal with actual reading material. [Control markup](../../pages/aeterna/index.html) · [Controller](../../experiences/aeterna/src/main.js)

### Surface inspection

A small circular plus is placed on the marble, accompanied by a dark-backed text label. Pressing it changes the crop, rotates the plus and changes “Look closer” to “Return to surface.” Its pressed state is exposed programmatically. The motion is a controlled zoom of the selected macro image, with a smaller range on mobile. [Inspection control](../../pages/aeterna/index.html) · [Crop and state](../../experiences/aeterna/src/main.js) · [Styling](../../experiences/aeterna/src/styles.css)

### Portrait comparison

Two plain text choices share a thin lower rule. The selected tradition uses bone text and a matching rule; the other remains subdued. Selection updates the portrait plate, short interpretation and italic era line together. The image enters through a directional clipping reveal in the same spatial register. Scroll chooses the transition until the visitor selects a tradition manually. This is one continuous portrait composition. [Portrait behavior](../../experiences/aeterna/src/main.js)

### Exhibit ranges

The characteristic input is a horizontal range with a one-pixel track and a square vertical thumb. A descriptive label sits above it, a current output aligns opposite, and named endpoints sit below. The input itself has a generous vertical interaction area. Thumb color follows dark, light and relief-reveal states. Range controls are native inputs, including keyboard operation. [Range markup](../../pages/aeterna/index.html) · [Range styling](../../experiences/aeterna/src/styles.css)

| Exhibit | Range label | Endpoint meaning | Output |
|---|---|---|---|
| Body | Reassemble the figure | Fragment → Form | Percentage |
| Relief | Explore the relief | Surface → Space | Surface, Depth or Space |
| Fracture | Separate the fragments | Held together → Let go | Percentage |
| Cast inspection | Move the museum light | Left → Right | Percentage |

For assembly, relief and fracture, direct input temporarily owns that exhibit state and reveals “Follow the scroll.” That action restores the native-scroll mapping. Geometry controls remain unavailable until their required asset is ready. If a scene is unavailable, the image and status communicate the still view; an imagined fallback does not acquire the real object's caption. [Control and readiness behavior](../../experiences/aeterna/src/main.js) · [Fallback presentation](../../experiences/aeterna/src/styles.css)

### Navigation and index

The persistent identity is a small, widely tracked wordmark. The desktop chapter navigation consists of Roman numerals over one thin rule, with a short active underline. Hover reveals that same underline; the current room has the primary foreground and `aria-current="step"`. A two-pixel overall-progress line runs along the bottom edge at low opacity. The opposite next-room action uses a Bodoni label and a down arrow; the final room changes its action to “Begin again.” [Navigation markup](../../pages/aeterna/index.html) · [Chapter state](../../experiences/aeterna/src/main.js)

The index is a full-viewport ivory dialog. Desktop splits a large introductory heading from the room list; compact screens stack the shorter introduction above the list. Rows have Roman numerals, large Bodoni names and fine dividers. Hover indents the row slightly, and the current title is italic. Opening the index focuses the active room link. Native dialog dismissal and the explicit close control remain available. The phone's room counter opens this same index. [Index structure](../../pages/aeterna/index.html) · [Index behavior](../../experiences/aeterna/src/main.js)

### Source and collection panels

A quiet ivory panel opens from the right on desktop and fills the phone. Its fixed header carries the wordmark and a close control; the reading column scrolls independently. Bodoni headings, Manrope paragraphs, simple definition lists and underlined source links create an editorial record. Use thin divisions only where the content has a meaningful boundary. [Source-panel styling](../../experiences/aeterna/src/styles.css) · [Notes content and behavior](../../experiences/aeterna/src/notes.js)

In Afterlife, “Inspect the cast” exchanges the imagined gallery for the inspectable object and reveals the collection record and light range. The same action returns to the gallery. Keep the visible distinction between the imagined setting, the documented source object and the artistic digital treatment. Do not present source metadata as a decorative badge or a floating card. [Inspection state](../../experiences/aeterna/src/main.js) · [Record markup](../../pages/aeterna/index.html)

### Motion preference and exhibit movement

The index contains a “Reduce motion” button with a small track and indicator. It begins from the system preference unless the visitor has stored an explicit choice. Reduced motion removes chapter-entry animation, ambient plate transforms, the hero light layer and pointer-driven camera drift. With the system preference active and no explicit override, the blanket CSS animation and transition durations are (0s), keeping those states free of timed interpolation. Manual range changes, portrait selection, inspection, museum lighting and chapter navigation remain available. Body uses an assembled resting state; the relief and fracture retain stable representative states unless directly controlled. [Preference and scene state](../../experiences/aeterna/src/main.js) · [Reduced-motion styling](../../experiences/aeterna/src/styles.css)

The shared easing is the stylesheet's `--ease`. Timed reveals belong to a specific act: a room uncovering, a portrait entering or a closer look at marble. Geometry follows deterministic scroll or explicit input. The renderer is inactive away from spatial exhibits and pauses when the document is hidden. The final hall has no ambient image movement. Preserve the verbs in the direction—reveal, align, assemble, fracture, preserve—when extending the exhibition. [Motion direction](VISUAL_BIBLE.md) · [Rendering behavior](../../experiences/aeterna/src/main.js)

## Do's and Don'ts

### Do:

- **Do** preserve the extraordinary scale of Bodoni display type beside the quiet Manrope interface.
- **Do** compose the image, typography and negative space as one frame, including a strong still view.
- **Do** keep the neutral gallery and archive palette tied to material and light.
- **Do** reassess text color and protective gradients against the actual image crop and reveal state.
- **Do** reserve measured space for mobile sculpture, headings and controls, then fit the visible geometry to that space.
- **Do** keep exhibit ranges direct, labeled and keyboard-operable, with a clear return to scroll control.
- **Do** preserve the distinction between interpretive imagery, collection objects and artistic digital treatments.
- **Do** retain useful manual exhibit controls when motion is reduced.

### Don't:

- **Don't** replace the identity with a black-and-gold luxury template or an invented accent-color system.
- **Don't** turn the gallery into a boxed card grid or surround its ordinary text actions with filled pills.
- **Don't** bake the real title, navigation, captions or controls into an image.
- **Don't** substitute generic fade-up effects, endless floating, random particles or meaningless parallax for the exhibition's motion grammar.
- **Don't** simulate fragment alignment or relief travel with a flat image when the view requires real geometry.
- **Don't** derive mobile sculpture framing from the desktop crop or from the floor shadow.
- **Don't** identify an imagined plate as a scanned collection object or display an interactive control as ready before its required geometry is available.
- **Don't** shrink the final hall's stillness and negative space to make room for unrelated interface decoration.
