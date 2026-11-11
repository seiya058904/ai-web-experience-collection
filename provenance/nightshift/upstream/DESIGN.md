---
name: NIGHTSHIFT
description: A humane photographic journey through the work that carries an imagined city into morning.
colors:
  ink: "#0b1421"
  steel: "#203545"
  amber: "#e9a85f"
  rose: "#dda6a0"
  morning: "#e5eae9"
  paper: "#f0eee7"
  muted: "#bdc8cc"
  line: "rgba(210,222,224,.24)"
  reading-lead: "#e0e4df"
  reading-panel: "#0b1421e6"
  dialog-panel: "#10212e"
  diagram-panel: "#142630"
  filter-panel: "#172733"
  diagram-sea: "#85ABB3"
  diagram-muted: "#70858C"
typography:
  display:
    fontFamily: "Barlow Condensed, Arial Narrow, Arial, sans-serif"
    fontSize: "clamp(80px, 9vw, 170px)"
    fontWeight: 500
    lineHeight: 1.02
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Barlow Condensed, Arial Narrow, Arial, sans-serif"
    fontSize: "clamp(54px, 5.75vw, 92px)"
    fontWeight: 500
    lineHeight: 1.02
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "32px"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "normal"
  body:
    fontFamily: "DM Sans, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  lead:
    fontFamily: "DM Sans, Arial, sans-serif"
    fontSize: "clamp(16px, 1.16vw, 19px)"
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "normal"
  label:
    fontFamily: "DM Sans, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0.13em"
  control:
    fontFamily: "DM Sans, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0.015em"
  caption:
    fontFamily: "DM Sans, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  wordmark:
    fontFamily: "Barlow Condensed, Arial Narrow, Arial, sans-serif"
    fontSize: "29px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.09em"
rounded:
  square: "0"
  circle: "50%"
spacing:
  8: "8px"
  12: "12px"
  16: "16px"
  20: "20px"
  24: "24px"
  28: "28px"
  30: "30px"
  40: "40px"
  48: "48px"
  65: "65px"
  gutter: "clamp(24px, 6.7vw, 176px)"
components:
  hero-cta:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    typography: "{typography.control}"
    rounded: "{rounded.square}"
    height: "48px"
  text-link:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    typography: "{typography.control}"
    rounded: "{rounded.square}"
    height: "44px"
  text-link-hover:
    textColor: "{colors.amber}"
  quiet-button:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    typography: "{typography.control}"
    rounded: "{rounded.square}"
    height: "44px"
  segmented-option:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    rounded: "{rounded.square}"
    padding: "12px 17px"
    height: "44px"
  segmented-option-selected:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
  route-filter:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.square}"
    padding: "9px 13px"
    height: "44px"
  route-filter-selected:
    backgroundColor: "{colors.filter-panel}"
    textColor: "{colors.amber}"
  comparison-range:
    height: "30px"
  chapter-menu-row:
    textColor: "{colors.paper}"
    rounded: "{rounded.square}"
    height: "49px"
  reading-panel:
    backgroundColor: "{colors.reading-panel}"
    textColor: "{colors.paper}"
    rounded: "{rounded.square}"
    padding: "{spacing.24}"
  morning-trace:
    backgroundColor: "{colors.morning}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    height: "66px"
  dialog:
    backgroundColor: "{colors.dialog-panel}"
    textColor: "{colors.paper}"
    rounded: "{rounded.square}"
    padding: "{spacing.40}"
    width: "min(690px, calc(100% - 36px))"
---

# Design System: NIGHTSHIFT

## Overview

**Creative North Star: "One Light, Many Lives"**

NIGHTSHIFT is an **Experience-mode** editorial world: a quiet, human photographic account of the work that prepares an ordinary morning. A small amber room sits within a broad dark city. Close hands, flour, wet stone, worn metal, linen, stems, and window glass make labor specific without turning the workers into spectacle. The visual rhythm alternates generous photographic holds with compact observations and useful, restrained controls.

This is a code-led interface built around generated photographic references and production images. The supplied Edition 2.0 brief and `VISUAL-BIBLE.md` provide the visual authority; there is no separately approved complete UI composition to claim as a pixel-match target. The selected desktop opening is AI-04, and the purpose-built portrait opening is AI-05. The photographs establish the material, camera, and light; real HTML and authored SVG provide every meaningful word and control.

The governing idea is continuity of attention. An amber edge leads from a room to a route, from a working surface to a corridor, and eventually back to the same room in morning light. It is an editorial connection between separate places. The current medium is opaque photographic compositing with precise SVG explanation, not a physically simulated or fully rotatable city. `PRODUCT.md` records the product commitments; `src/styles.css`, `src/markup.ts`, `src/icons.ts`, `src/diagrams.ts`, and `src/story-controller.ts` are the implementation sources for this extraction. This document records the system and its limits; it does not certify visual acceptance.

**Key Characteristics:**

- Human activity is visible through anonymous hands, small figures, and evidence left in materials.
- Midnight ink and steel teal hold a restrained working amber, with rose and washed morning appearing as the night changes.
- Narrow urban display type, calm sans reading text, and occasional italic serif reflections form one editorial voice.
- Square panels, fine rules, open spacing, and authored stroke icons keep the interface quiet.
- Visitor-owned scroll determines narrative progress; stable still alternatives preserve the same story.

## Colors

The palette moves from cool mineral darkness toward pale morning while keeping warmth attached to actual work lights, human details, and useful interface states. Exact primitives live in the frontmatter; inherited CSS custom properties remain the runtime source.

### Primary

- **Working amber — `amber`:** the small warm window, links, focus outline, selected atlas route controls, times, progress line, and fine editorial guide. It is a light and navigation cue, not a large promotional fill.

### Secondary

- **Steel teal — `steel`:** quiet structural depth, diagrams, the comparison backing, and low-contrast city mass.
- **Sea glass — `diagram-sea`:** explanatory SVG labels and linework. It belongs to the notebook and technical observations, not a new page-wide accent.

### Tertiary

- **Predawn rose — `rose`:** a late-night color commitment, also used for the Care atlas route. Use it as one part of the gradual light change, not as a general call-to-action color.

### Neutral

- **Midnight ink — `ink`:** the document ground, stage fallback, and reliable dark substrate around photography.
- **Warm paper — `paper`:** primary reading text and selected segmented controls on dark scenes.
- **Muted silver — `muted`:** secondary observations, captions, and quiet interface information.
- **Washed morning — `morning`:** the dawn response to midnight; light panels reverse the text to ink.
- **Fine silver rule — `line`:** understated separators between controls and editorial rows.
- **Reading lead, reading panel, dialog panel, diagram panel, and filter panel:** extracted implementation surfaces for their named contexts. They do not form a general-purpose elevation ladder.
- **Diagram slate — `diagram-muted`:** quieter SVG construction and street geometry beneath the selected routes.

**The Task-Light Rule.** Keep amber attached to light, attention, navigation, or state; do not spread it into large decorative gradients.

**The Local Exposure Rule.** Treat each photograph individually. Preserve its material and lighting; do not impose one global color filter across the night and dawn.

The sidecar's eight-step tonal ramps are synthesized display aids for the design panel. They are not additional production palette values or permission to recolor the selected art.

## Typography

**Display font:** Barlow Condensed, with Arial Narrow and Arial fallbacks. **Reading and control font:** DM Sans, with Arial fallback. **Reflective font:** Instrument Serif italic, with Georgia fallback. All production font files are self-hosted WOFF2 assets from the installed font packages; the interface does not depend on a remote font request. Barlow Condensed loads weights 500 and 600, DM Sans loads 400 and 500, and Instrument Serif loads italic 400. Font synthesis is disabled.

### Hierarchy

| Role | Application |
| --- | --- |
| `display` | The opening title. Natural English case and the serif word “sleeps” carry the contrast; the emphasis is approximately 1.03 times the surrounding display size. |
| `headline` | Chapter headings. Base reading measure is capped at 11 characters, with intentional chapter-specific exceptions. |
| `title` | Second observations. The source explicitly sets italic; frontmatter typography cannot encode `font-style`, so the sidecar snippets preserve it. |
| `body` / `lead` | Calm reading and the primary chapter paragraph. Leads use a short maximum measure of 37 characters rather than filling the photograph. |
| `label` | Chapter number and name. Uppercase is confined to this contextual line, with tabular numbers for narrative times. |
| `control` / `caption` | Actions, explanatory labels, and image notes. Controls remain words rather than icon-only guesses. |
| `wordmark` | The compact NIGHTSHIFT identity with a drawn amber window and small amber period. |

The large-screen overrides are deliberate: at 1920px and above, the hero is 180px and ordinary chapter headings become 105px; at 2560px and above, both use larger bounded fluid sizes. At phone widths the hero uses `clamp(60px, 17.5vw, 101px)` and explicitly places “sleeps” on a new line. Below 360px, it becomes 58px. These are cinematic display exceptions, not a new scale for body copy.

Most phone leads are 15px with a 1.7 line-height, and second observations are 14px with a 1.75 line-height. At the narrowest breakpoint some leads are 14px and contextual labels are 8px; toolbar labels are 10px. These are the actual implemented values, not a claim that all interface text meets one minimum-size rule. Preserve readable copy before adding decorative text.

**The Three-Voice Rule.** Use condensed type for the city-scale statement, DM Sans for reading and action, and italic serif for a brief human reflection. Never set controls in the reflective serif.

## Layout

Photography occupies a fixed full-viewport stage; all meaningful reading blocks remain in native document flow above it. Chapters have distinct compositions rather than a repeated card template. The default chapter is at least 120svh, with its own generous observation hold; transitions occupy 72svh. The sidecar records responsive and motion extensions because those groups are outside the frontmatter schema.

Desktop copy usually stays within 470px; second observations usually stay within 390px. The atlas uses an asymmetric two-column grid, while bakery and market pair a large image with a smaller reading region. Care and rail place their main copy to the right of the image's subject. Water returns to a left introduction and a balanced material-detail pair. Dawn reverses to ink text on washed morning and uses a separate list of traces. Base container caps vary with the content: atlas 1640px, bakery 1250px, rail 1150px, water 1230px, market 1280px, and the morning atlas/ending 1400px.

### Responsive behavior

| Query in the source | Layout response |
| --- | --- |
| Default desktop | Fluid gutter from the frontmatter; 94px header and 56px bottom toolbar. |
| `max-width: 1100px` | Gutter becomes 5vw; header becomes 84px; subtitle disappears; grids compress and right-side copy moves inward. |
| `max-width: 800px` | Gutter becomes 28px; chapter rail disappears; atlas and large image panels stack; the hero may wrap; morning traces use two columns. |
| `max-width: 639px` | Gutter becomes 24px; header/toolbar become 76px/58px; dedicated portrait hero is selected; content panels become single-column and transition regions become 52svh. |
| `max-width: 359px` | Gutter becomes 20px; display sizes and panel padding reduce further; long actions stack where needed. |
| `min-width: 1920px` | Type, image holds, and container caps expand without changing the narrative order. |
| `min-width: 2560px` | Gutter becomes 8vw; header/toolbar become 120px/70px; larger bounded type and reading regions serve large CSS viewports. |
| `max-height: 600px` and `min-width: 640px` | Short landscape overrides the header/toolbar to 65px/48px and lengthens hero/atlas reading regions instead of clipping them. |

Phone composition is shot-specific. The dedicated hero image uses a centered crop with a 55% vertical position; bakery uses a 92% horizontal position, care 67%, rail 31%, water 22%, utility 94%, market 96%, both platform photographs 54%, and dawn 12%. These percentages are cover-crop coordinates in CSS, not lens or physical-camera measurements. Utility and market deliberately preserve the human/task area. On phones, the utility reading panel sits at the bottom of the first viewport: `.utility-main` uses a column with end alignment and a minimum height of `calc(100svh - 196px)`. This leaves the inspector’s head, clipboard and work lamp visible above the copy, with 24px clearance before the fixed toolbar. Still mode removes that minimum height. The bakery title panel remains aligned to its intrinsic content height; dawn uses normal block flow, so its light reading panel does not become a viewport-height slab.

The spacing vocabulary is an observed editorial rhythm, not a strict arithmetic scale. Small control gaps and fine details use the smaller tokens. Panels commonly use 24–40px padding; large morning/ending regions get more air. Vertical scene holds use viewport-relative space so a short paragraph can coexist with a meaningful photograph. Do not convert that open scene space into empty panels.

**Native flow.** Keep reading content in document flow, and let panels grow with English copy. Use the photographic stage for the scene, not as an absolute-positioned text layout engine.

## Elevation & Depth

Depth comes primarily from photographic perspective, local light, material contact shadows, opaque compositing, and tonal reading surfaces. Ordinary editorial panels are flat. Atlas and dialog shadows exist to separate those surfaces from complex imagery; they are not hover elevation for every card. The exact shadow vocabulary lives in `.impeccable/design.json`.

The stage places source and target photographs in opaque clip regions. A foreground window edge, frame, pipe, corner, canopy, column, or pane separates the changing scene. The current narrower window/glass/corner/pane widths are respectively 4.4vw, 6vw, 4.5vw, and 7vw; the final horizontal obstruction is 5.5vh. A pipe can occupy 20vw on desktop or 28vw on phone because it must hide a different facility. The rail-to-water transition uses the actual AI-08 midpoint image between its two photographic regions.

The amber transition line is a one-pixel authored SVG trace. Its staged coordinates are editorial screen coordinates, explicitly not measured image UVs or physical infrastructure. No transparent worker-to-worker dissolve is used. The toolbar and dialog backdrop use blur only as local interface separation; the entire world is not a frosted-glass layer.

**The Opaque Handoff Rule.** Reveal unrelated photographs through an opaque scene edge. Never use overlapping translucent people or equipment as a substitute for spatial continuity.

## Shapes

The system is square and architectural: crisp panels, fine horizontal rules, narrow window shapes, and sparse rectangular control groups. Borders usually separate rows or identify a selectable region rather than encircling every content block. Rounded corners are reserved for the comparison handle, tiny position dots, and miniature traffic lights; there is no rounded-card family.

Icons are authored inline SVG with a 24-by-24 viewBox, no fill, a 1.5px current-color stroke, and round caps/joins. Default icons are 20px; links commonly use 17px, and the primary CTA uses an 18px arrow rotated by 45 degrees. A plus means a local disclosure, an arrow means a destination, and the window motif belongs to the identity. Decorative icon SVGs have `aria-hidden="true"`; the adjacent text or a specific accessible name supplies meaning.

## Components

Component `height` entries record the source's nominal minimum extent where it uses `min-height`; the self-contained sidecar snippets preserve that distinction so controls can grow with their labels.

### Narrative links and quiet actions

The primary action is an understated underlined anchor, not a filled promotional button. Its warm underline and arrow connect the opening to the atlas. Ordinary text links pair calm type with a small arrow; quiet local actions use a fine bottom rule. Navigation is an anchor with a real fragment destination. An action that opens a note, changes a preference, or reveals content is a native button.

Shared keyboard focus is a 2px amber outline offset by 6px. Hover usually changes text to amber. Most action controls provide at least 44px height; the desktop primary CTA provides 48px. The phone primary CTA is currently 42px, and desktop quick-rail links are 32-by-24px; the rail is removed at 800px and below. These are explicit current exceptions, not an accessibility-conformance statement.

### Segmented controls and route filters

Bakery preparation, rail detail, and market light use square native buttons inside a labeled group. Selection uses `aria-pressed`; the selected segment reverses to ink on paper. These are not ARIA tabs. Atlas filters use a darker selected surface with amber text, while non-selected routes remain present at lower opacity. Selecting a route changes its explanatory sentence and real chapter destination; the result is a polite live region. Arrow, Home, and End keys move and select the atlas filters.

### Comparison range

The curb comparison has two matched photographs, a clipped after-state, an authored boundary, a native range input, an output value, and explicit Before/After/Reset buttons. The circular boundary handle is decorative and pointer-transparent. Desktop reveals left-to-right; phone reveals top-to-bottom. The native range itself remains horizontal on phone, with keyboard and button alternatives retained. Do not describe the decorative handle as an implemented draggable control.

### Editorial panels and diagrams

Panels protect short prose from the photograph while preserving its surrounding scale. They do not form a generic dashboard grid. Reading observations use an amber fine rule, italic reflection heading, and muted body. Dawn is the intentional light-surface counterpart. SVG diagrams have their own accessible title/description and real labels; they are conceptual illustrations, not generated pictures of interfaces, operating instructions, or live service data.

### Navigation and dialogs

The fixed header holds the wordmark, About action, and chapter menu; the fixed bottom toolbar holds narrative position, motion preference, and optional sound. The chapter rail marks its active link with `aria-current="location"`. Each chapter is a labeled section with a focusable target heading. The opening has the only primary page heading. Ordinary image details carry descriptive alternatives; stage photographs are decorative, because the chapter prose and still edition supply their meaning.

The menu, About, scene notes, and morning traces use native dialogs with named headings, close buttons, Escape support, and opener-focus restoration. Opening a dialog pauses the same scroll owner; the dialog itself remains scrollable. Navigating to a chapter closes the dialog and transfers focus to the destination heading after the scroll settles. The local “Trace this night” index is native `details`/`summary`, with its plus rotating when open. Morning traces are real buttons that open a before/morning observation pair and a genuine return link.

### Photographic continuity and optional motion

Narrative movement is evaluated from the scroll position with one Lenis instance driven by the GSAP ticker. Text and photographic handoffs use the same evaluated chapter/transition state; no second autonomous narrative timeline is introduced. Chapter-link travel is 0.9 seconds in full-motion mode and immediate in reduced/still modes. Interface opacity/background transitions are generally 0.2 seconds. Source copy leaves between progress 0.08 and 0.25; incoming copy enters between 0.80 and 0.96.

The opening's optional reveal is a small exposure overlay on the complete photograph: a 0.10-second delay followed by 1.15 seconds of exposure change, with overlay opacity capped at 0.20. It does not delay scrolling. Two 2-by-3px distant desktop traffic lights follow a restrained 22-second cycle on the same ticker. They are hidden on phone and in reduced/still modes, and the ticker does no work while the document is hidden. Returning to the opening does not replay the exposure reveal. The worker, lamp, window, and skyline are not independently animated layers.

First Service now uses matched `platform-before` and `platform` photographs. Scroll normally reveals the stationary, open-door arrival image from 10–65% of a viewport into the chapter; this interval is shortened when the available reading hold requires it, so arrival finishes before the dawn transition. The reveal uses an opaque photographic aperture and column edge. Reversing scroll reverses that same reveal. This is a photographic transition from waiting to boarding, not a simulated moving train or a mesh animation. Reduced and still modes show both actual images with captions in a two-column pair, stacked below 640px.

Reduced motion keeps native scrolling and switches the scene at the transition midpoint; optional hero motion is removed. Still view removes the fixed stage and inserts chapter images into document flow. Both preserve all eleven chapters and meaningful interaction results. The separate `story.html` edition supplies the full story and static outcomes without JavaScript. Image failures try the corresponding smaller chapter asset, then preserve text and an honest Retry/still-view notice. No fallback to an unrelated generic city image is part of the system.

### Fidelity boundaries

| Current implementation | Exact interpretation |
| --- | --- |
| Generated photographic scene layers and authored SVG | The brief's permitted photographic fallback; no claim of fully rotatable 3D, character animation, physical rail inspection, or pipe simulation. |
| Hero exposure plus miniature traffic drift | The complete selected photo is visible first; there is no separately sequenced lamp/person/depth reconstruction. |
| Ten editorial edge handoffs | Distinct reversible staged designs exist; their guide anchors are not a measured physical/projective calibration. Screenshot presence does not prove every seam is visually accepted. |
| First Service empty/arrived image pair | A scroll-owned opaque photo reveal depicts a stationary arrival/boarding state; it does not animate vehicle translation. |
| Dedicated portrait hero; scene-specific cover positions elsewhere | Most non-hero phone scenes are recomposed through crop and layout, not independently regenerated portrait photographs. |
| Desktop title stretches across the calm sky | The implementation intentionally uses an extended display line above 800px rather than restricting the whole heading to a literal 36% column. |
| Native range plus a decorative comparison handle | The visible phone reveal changes orientation; the input remains horizontal and supports keys and explicit state buttons. |
| Self-hosted fonts and expanded large CSS layouts | The CSS supports large viewports; this does not imply native 4K photographic resolution or a physical 4K-device test. |

Final functional results, continuous movement observations, corrections, and untested conditions belong in the evidence records. This design extraction neither awards an aesthetic score nor changes those acceptance statuses.

## Do's and Don'ts

### Do:

- **Do** keep the pinned midnight, steel, amber, rose, and morning palette and the self-hosted three-family type system.
- **Do** make each photograph's human task, material, and lighting legible before adding interface detail.
- **Do** preserve intrinsic reading-panel height, short English measures, and normal document flow at phone widths.
- **Do** use native links for destinations, buttons for actions, labeled ranges for comparison, and native dialogs or details for disclosure.
- **Do** keep opaque photographic handoffs reversible, directly seekable, and controlled by the shared scroll state.
- **Do** retain both content beats and real outcomes in reduced motion, still view, and failed-asset states.
- **Do** return to the opening window and relative city geometry at dawn.

### Don't:

- **Don't** replace human work with generic neon skylines, KPI cards, service dashboards, or product advertising.
- **Don't** bake readable words, numbers, labels, or invented official markings into generated imagery.
- **Don't** apply one global color filter or float unrelated workers across a translucent dissolve.
- **Don't** turn the amber editorial guide into a claim that separate facilities share one physical network.
- **Don't** introduce uncoordinated animation clocks, force an intro to finish, or animate human gestures in a reading hold.
- **Don't** call the photographic stage fully rotatable 3D or describe a reveal between stills as simulated vehicle motion.
- **Don't** infer visual acceptance, accessibility conformance, physical-device coverage, or performance results from this document alone.
