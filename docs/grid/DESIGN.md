---
name: "GRID — The Architecture of Visual Order"
description: "Content stays. System changes."
colors:
  paper: "#f8f8f3"
  ink: "#121411"
  signal-red: "#d63121"
  muted-default: "#5a5c56"
  line-default: "#c7c8c1"
  pale-acid: "#f0f18b"
  vermilion: "#f2412d"
  warm-white: "#fff5e9"
  ivory: "#f4f0e7"
  cobalt: "#1749bc"
  acid-yellow: "#e5f629"
  raw-ink: "#10120e"
  electronic-black: "#080d09"
  cool-white: "#e0e7db"
  phosphor-green: "#8ef69f"
  amber: "#e9bd66"
  interface-field: "#e2e4df"
  interface-ink: "#20251f"
  functional-blue: "#194fdb"
  on-blue: "#fff"
  lilac: "#eeebf7"
  variable-ink: "#191820"
  violet: "#6c3acc"
  synthesis-paper: "#f3f0e8"
  synthesis-ink: "#181915"
  orange-red: "#d44818"
  sheet-paper: "#f5f4ee"
  sheet-ink: "#161811"
  sheet-muted: "#5d5f55"
  sheet-line: "#cecec5"
  sheet-current: "#c73020"
  sheet-link-hover: "#bd301b"
  modal-scrim: "rgb(10 13 9 / .55)"
typography:
  display-grotesk:
    fontFamily: "Roboto Flex, Arial, sans-serif"
  display-editorial:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontWeight: 400
  display-electronic:
    fontFamily: "IBM Plex Mono, monospace"
    fontWeight: 400
  body-base:
    fontFamily: "Roboto Flex, Arial, sans-serif"
    fontSize: "16px"
  body-interface:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "clamp(13px, 1.4cqw, 21px)"
    fontWeight: 400
    lineHeight: 1.4
  headline-sheet:
    fontFamily: "Roboto Flex, Arial, sans-serif"
    fontSize: "clamp(32px, 4vw, 58px)"
    fontWeight: 640
    lineHeight: 1.02
    letterSpacing: "-.035em"
  title-system:
    fontFamily: "Roboto Flex, Arial, sans-serif"
    fontSize: "clamp(14px, 1vw, 22px)"
    fontWeight: 650
    letterSpacing: "-.01em"
  label-thesis:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "clamp(10px, .75vw, 16px)"
    fontWeight: 400
    letterSpacing: ".07em"
  label-action:
    fontFamily: "Roboto Flex, Arial, sans-serif"
    fontSize: "clamp(12px, .82vw, 18px)"
    fontWeight: 400
  label-specimen-fallback:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1
  label-interface-action:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "clamp(11px, 1.3cqw, 19px)"
    fontWeight: 400
    lineHeight: 1
  metadata-fallback:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: ".02em"
spacing:
  page-margin: "clamp(24px, 3.5vw, 112px)"
  top-space: "clamp(78px, 9vh, 132px)"
  bottom-space: "clamp(108px, 12vh, 156px)"
  static-grid-gap: "24px"
  interface-grid-gap: "12px"
  interface-phone-gap: "10px"
  axis-grid-gap: "36px"
components:
  text-button:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label-action}"
    padding: "0"
  look-again-fallback:
    textColor: "{colors.ink}"
    typography: "{typography.label-specimen-fallback}"
  interface-action:
    backgroundColor: "{colors.functional-blue}"
    textColor: "{colors.on-blue}"
    typography: "{typography.label-interface-action}"
    padding: "12px 16px"
    width: "100%"
  icon-button:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    width: "40px"
    height: "40px"
  range-thumb:
    backgroundColor: "{colors.ink}"
    rounded: "0"
    width: "9px"
    height: "18px"
  sheet:
    backgroundColor: "{colors.sheet-paper}"
    textColor: "{colors.sheet-ink}"
    padding: "38px 42px 26px"
    width: "min(820px, calc(100% - 48px))"
  index-item-current:
    textColor: "{colors.sheet-current}"
---

# Design System: GRID

## Overview

**Creative North Star: "Content stays. System changes."**

GRID — The Architecture of Visual Order makes a visual system observable. One persistent semantic composition changes its hierarchy, rhythm, type, crop and material across twelve systems. The same word, subtitle, number, paragraph, photograph, metadata, time/place, action and registration mark remain recognizable as their relationships change. The named Swiss, Basel, editorial, raw, electronic, interface and variable directions are binding parts of this work. [Product commitments](UPSTREAM-PRODUCT.md) and the [direction contract](DIRECTION.md) establish this visual authority.

Quiet, instrument-like chrome surrounds an expansive typographic field. The work ranges from a near-empty opening to dense, cropped letterforms, while navigation and reading text retain their practical roles. Precision is visible in baselines, hard image edges, narrow rules, deliberate spacing and the route each element takes through a change. The photograph supplies one constant architectural subject; live typography, layout and processing supply the variation.

Motion belongs to the composition. Scroll reveals the same elements moving through intermediate relationships, with different timing characters for alignment, tension, editorial pacing and quantization. A stopped coordinate produces a stopped composition. Reduced motion retains the compositions and direct navigation. The final composition keeps its established content positions while the guides leave and the registration mark returns to its opening anchor. [Scene definitions](../../experiences/grid/src/scenes.ts), [rendering](../../experiences/grid/src/renderer.ts) and [scroll/control orchestration](../../experiences/grid/src/main.ts) are the implementation sources.

**Key Characteristics:**

- One persistent article with nine content nodes and one semantic heading.
- Twelve distinct systems sharing a fixed content set.
- Local grotesk, serif and monospaced type with real variable-font axes.
- Flat color fields, measured rules, hard photographic crops and one registration mark.
- Separate desktop and mobile compositions, plus real container-driven reflow.
- Reversible, deterministic motion governed by one scroll authority and one clock.

## Colors

Color describes the current system: near-white, ink and a signal expand into acid yellow, vermilion, ivory, electronic black and lilac before returning to a restrained final palette. The frontmatter records authored source primitives. Runtime interpolation and contrast selection can produce additional intermediate colors; those are calculated results, not extra palette tokens. The sidecar's tonal ramps are synthesized swatch previews only; they do not add authored UI colors. [Source palette](../../experiences/grid/src/scenes.ts) and [UI surfaces](../../experiences/grid/src/style.css).

### Primary

| Primitive | Implemented role |
| --- | --- |
| `signal-red` | Deliberate specimen-number, action or navigation emphasis in the opening, System and International families; retained as the reference accent in Basel. |
| `pale-acid` | Basel's field, supporting controlled shear and offset without obscuring the original alignment. |
| `vermilion` | The full Type as image surface. Ink letterforms become the dominant shapes on this field. |
| `acid-yellow` | Raw's exposed structural field, around a separate ivory reading surface. |
| `orange-red` | The final specimen-number emphasis shared by Synthesis and No grid. |

### Secondary

| Primitive | Implemented role |
| --- | --- |
| `cobalt` | Editorial's folio and action reference, set against ivory. |
| `functional-blue` | The filled Interface action; it denotes the usable screen control inside the responsive frame. |
| `violet` | Variable's restrained reference accent, including the active chapter indication after legibility selection. |

### Tertiary

| Primitive | Implemented role |
| --- | --- |
| `phosphor-green` | Electronic's display word, registration mark, action reference and photographic raster. |
| `amber` | Electronic's small specimen number, distinct from the green display treatment. |

### Neutral

| Primitives | Implemented role |
| --- | --- |
| `paper`, `ink` | The initial field and text pair; `paper` also supplies Interface's inner screen surface. |
| `muted-default`, `line-default` | Initial UI secondary text and rules. The running renderer recalculates muted and line colors from each resolved paper/ink pair. |
| `warm-white` | Type as image's outlined number and geometric reference. |
| `ivory`, `raw-ink` | Ivory supports Editorial and Raw's reading panel; Raw uses its own deep ink for the surrounding structural composition. |
| `electronic-black`, `cool-white` | Electronic's field and readable information. |
| `interface-field`, `interface-ink`, `on-blue` | Interface's outer field, inner text and filled-action text. |
| `lilac`, `variable-ink` | Variable's cool field and display/readable type. |
| `synthesis-paper`, `synthesis-ink` | The shared final field and ink of Synthesis and No grid. |
| `sheet-paper`, `sheet-ink`, `sheet-muted`, `sheet-line` | A stable light palette for Index, Rules and About, independent of the scene underneath. |
| `sheet-current`, `sheet-link-hover` | Current index entry and reference-link hover colors inside those sheets. |
| `modal-scrim` | The translucent backdrop that makes a modal sheet distinct from the composition underneath. |

**The Scene Palette Rule.** Keep each scene's paper, ink and accent relationship intact. Do not collect the sequence's accents into a simultaneous multicolor interface.

**The Surface Contrast Rule.** Evaluate readable text against its composited surface, including the fading Raw panel, Interface frame and partially filled action. Root background color alone is insufficient during a handoff.

The renderer samples the corners and center of reading regions against the composited field, then chooses the desired color, black or white using a contrast threshold of (4.5:1). If a region spans incompatible surfaces, it retains an opaque paper background. The transitioning Interface action is checked against its own composited blue fill. Large display type, outline effects, the mark and the processed photograph have separate visual treatment. These are implementation safeguards; this document does not assert blanket contrast compliance for every pixel or every intermediate coordinate. [Contrast calculation](../../experiences/grid/src/math.ts) and [surface composition](../../experiences/grid/src/renderer.ts).

## Typography

**Grotesk / Variable Font:** Roboto Flex, with Arial and sans-serif fallbacks.

**Editorial Font:** Instrument Serif, with Georgia and serif fallbacks.

**Label / Electronic Font:** IBM Plex Mono, with a monospace fallback.

The pairing moves from a forceful variable grotesk to a sharply contrasting serif and a measured monospaced display. All three WOFF2 assets are local. Instrument Serif and IBM Plex Mono use their regular face; Roboto Flex supplies the actual continuous axes. Font synthesis is disabled. The [font notices](../../public/grid/licenses/THIRD-PARTY-NOTICES.md) and individual OFL files identify the distributable assets.

### Hierarchy

The frontmatter deliberately omits one global display size. Runtime heading geometry is a scene decision based on the available stage width (`W`) and height (`H`); it is rewritten by the renderer and by the native Interface layout. The base body's token describes inherited page styling, and the two `fallback` roles describe the static composition. They do not replace the live scene measurements.

| Runtime display role | Material and sizing contract |
| --- | --- |
| Zero | Small grotesk word in a lower register. Desktop starts at `clamp(.059W, 56, 150)`; phone uses `.29W`. Portrait-tablet refinement is defined in the scene function. |
| System / International | Grotesk at `.30W` on desktop and `.455W` on phone. System uses a partial outline treatment; International resolves into a filled, emphatic heading. |
| Basel / Tension | Grotesk sized to `min(.35W, .63H)` on desktop and `.53W` on phone, with scene rotation and individual letter offsets. |
| Type as image | Grotesk at `.59W` on desktop and `.65W` on phone. The phone composition rearranges the existing four spans into a two-register letter construction. Intentional crop belongs to this display role. |
| Editorial | Instrument Serif at `.355W` on desktop and `.51W` on phone, using the regular face. |
| Raw | Dense grotesk at `.325W` on desktop and `.49W` on phone, against hard structural boundaries. |
| Electronic | IBM Plex Mono at `.243W` on desktop and `.428W` on phone. A small repeating dot pattern clips to the live letterforms. |
| Interface | Container-relative grotesk. The wide heading uses `min(23cqw, .30 × frame-height)`; narrower container rules change its column span and sizing. |
| Variable | Roboto Flex at `.405W` on desktop and `.46W` on phone; four axes interpolate together while surrounding information keeps its measure. |
| Synthesis / No grid | Grotesk at `min(.313W, .5875H)` on desktop and `.48W` on phone. Both states share the same heading geometry and axis tuple. |

Grotesk display leading is generally tight (around .80–.82), with negative tracking established per scene. Subtitle roles change between grotesk, serif and mono; the editorial line break appears only in the appropriate serif/native composition. The `08` is independently measured and capped to its actual width so that both digits fit, including tall tablets. Body measure comes from scene boxes rather than a global character-count limit. Phone scene construction enforces body sizes of at least (13px), metadata/place sizes of at least (10px), and action text of at least (11px). Interface uses its own explicit container rules. [Typography geometry](../../experiences/grid/src/scenes.ts) and [native type rules](../../experiences/grid/src/style.css).

The stable chrome has a separate hierarchy: a compact grotesk wordmark, monospaced uppercase thesis and metadata, a medium-weight system name, and quiet numbered chapter labels. Modal headings use the `headline-sheet` role; Rules pairs a serif statement with monospaced category terms and grotesk explanations. Do not enlarge utility labels into competing headings.

### Variable axes

| Axis | Implemented limits | Scroll-driven Variable interval |
| --- | --- | --- |
| `wght` | 100–1000 | 390 → 920 |
| `wdth` | 25–151 | 105 → 62 |
| `slnt` | −10–0 | 0 → −9 |
| `opsz` | 8–144 | 70 → 144 |

**The Real Type Rule.** Change the four real Roboto Flex axes on the existing heading. Do not simulate width with a scaled screenshot or replace the variable font with weight-only presets.

**The Readable Register Rule.** Cropping and letter displacement may affect the display word. Keep the complete subtitle, paragraph, metadata, time/place and action readable in their own spatial register.

## Layout

The application has three spatial roles: a fixed slim header, a bounded live specimen stage and a fixed footer containing the current system, chapter rail and navigation. The root spacing primitives reserve the header and footer; the stage clips intentional display overflow. Its one article contains the nine persistent content nodes. Guide lines, measurements, the Raw reading surface and the Interface frame are supporting layers outside that content set. [Semantic structure](../../pages/grid/index.html).

Most scenes render explicit proportional boxes over a real CSS Grid scaffold. The renderer writes a complete transform, size and type state for each node; it does not accumulate movement. Interface temporarily returns the same nodes to normal CSS Grid participation and measures their actual layout for the entering and leaving transitions. The visible guide count and native Grid columns are related concepts with distinct roles.

| System | Spatial role |
| --- | --- |
| 00 Zero | An open field with one reference point and a low-weight content register. Phone content occupies the lower part of the stage. |
| 01 System | Twelve columns and eight rows make relationships explicit as the word takes on display scale. |
| 02 International | Asymmetric twelve-column alignment separates heading, supporting text and objective photographic evidence. |
| 03 Basel / Tension | The twelve-column reference survives a controlled shear. Desktop uses a rotated right image; phone keeps a narrow left reading column beside it. |
| 04 Type as image | Four broad divisions support overwhelming letterforms and a separate lower reading register. Phone letters and supporting evidence are independently rearranged. |
| 05 Editorial | Six broad columns and a full-height right photograph on desktop. Phone uses a wide photograph between the serif heading and body. |
| 06 Raw | Six columns, three rows, a heavy outer seam and an ivory reading panel. The panel covers part of the desktop width and the full phone width. |
| 07 Electronic | Forty-eight desktop or twenty-four phone guide columns and eighteen rows, with discrete raster and character relationships. |
| 08 Interface | A twelve-column native Grid in a width-changing frame. Container queries change spans, order, image placement and line wrapping. |
| 09 Variable | Column density moves from eight to twelve alongside the type axes. Small text and controls retain separate anchors. |
| 10 Synthesis | Twelve proportional columns combine an emphatic grotesk, an editorial subtitle and a weighted photographic crop. |
| 11 No grid | Synthesis's established content geometry remains; guide visibility leaves and the registration mark returns to the origin. |

### Responsive composition

| Condition | Implemented change |
| --- | --- |
| Viewport width at most (600px) | Dedicated phone scene boxes; margins (20px), top reserve (74px), bottom reserve (124px); two-row footer; full-width chapter rail; two-column axis controls; single-column Index. |
| Viewport width at most (1000px) | The header thesis is hidden, navigation compresses and axis gaps tighten. This does not select the phone scene geometry by itself. |
| Viewport width at least (2000px) | Larger footer controls, chapter labels and measurements support the wider field. |
| Height at most (650px), width at least (601px) | Header/footer reserves reduce to (63px)/(88px), the footer verb is hidden and experiment controls compact. |
| Non-phone stage aspect ratio below (1.1) | Targeted portrait-tablet refinements preserve page-like columns and readable lower information. |

Safe-area inset is added to the bottom reserve and footer position. The startup point uses the same page-derived origin as Zero: two-thirds of stage width and a vertical stage proportion of (.44), or (.32) on phone. Its loading placement is derived from the current margins and safe area rather than a separate viewport coordinate. [Responsive and startup CSS](../../experiences/grid/src/style.css).

Interface has additional **container** thresholds. Above (650px) of inner width, the photograph occupies the right half and text the left. At (650px) and below, the heading spans the frame and the image pairs with lower information. At (380px) and below, the image becomes a full-width row, number and body share the preceding row, and action/place share the final row. These thresholds respond to the frame's content width, independently of the outer viewport.

The frame's wide limit is (.92 × stage width); its narrow limit is the smaller of (280px) and (.88 × that wide limit). Padding is clamped from (.026 × frame width) to (12–40px). Its height respects available stage height and a maximum proportion of (1.9 × frame width). The width control exposes this actual layout; Reset restores the scroll-driven wide-to-narrow progression. [Frame measurement](../../experiences/grid/src/main.ts) and [container queries](../../experiences/grid/src/style.css).

### Motion within the layout

Each unit of scene progress uses its first (.36) for the current system's refinement or interactive demonstration; the rest hands existing elements to the next measured state. System and International settle rapidly, Basel slightly overshoots, Editorial opens more softly, Raw introduces a short delayed cut, and Electronic quantizes progress into (28) steps. Intermediate routes reserve lanes for information that changes reading order. They sample immutable endpoints and explicit waypoints, so reverse scrolling and reconstruction reuse the same geometry. [Interpolation](../../experiences/grid/src/math.ts), [handoffs](../../experiences/grid/src/handoff.ts) and [desktop supplements](../../experiences/grid/src/handoff-desktop.ts).

Lenis is the one global scroll smoother, driven by the GSAP ticker; ScrollTrigger maps its progress into the scene coordinate. Do not introduce a second animation clock or an independently scrolling specimen. The no-JavaScript composition remains an ordinary semantic Grid, using twelve desktop columns and four phone columns.

**The Persistent Content Rule.** Preserve the identity and text of the nine content nodes. A new visual rule changes their relationships, not the content tree.

**The Actual Reflow Rule.** Interface must change real container width and Grid layout. Preserve its measured text wrapping and media rearrangement through both user control and scene handoff.

## Elevation & Depth

The system is flat. There is no box-shadow vocabulary. Depth comes from tonal separation, overlap, hard crops, outline strength and scale: the Raw paper panel sits within an exposed frame, Interface's pale inner surface sits on its neutral outer field, and modal sheets separate from the specimen using a dark translucent backdrop. Typography can become an outlined structure or a dot-matrix surface without turning the interface into floating cards. [Layer styling](../../experiences/grid/src/style.css) and [composited rendering](../../experiences/grid/src/renderer.ts).

The stage is an isolated stacking context. Image and reading-panel layers sit behind the content, guide lines above it, controls above the composition, fixed chrome above the stage and modal sheets above the chrome. Guides and supporting surfaces ignore pointer input. The modal sheet owns a stable light color scheme so its text and controls do not inherit an Electronic or Raw scene palette.

**The Flat Surface Rule.** Use the existing field, seam, rule, crop and backdrop vocabulary to separate roles. Do not add ambient shadows, lifted cards or glass effects to this system.

## Shapes

Hard rectangular crops, square-ended strokes and precise rules define the form. The photograph remains one rectangular media surface with controlled crop, rotation, zoom and contrast. It is the same locally served **Bw Stairs** photograph throughout; its attribution and permitted processing are recorded in [PHOTO-ATTRIBUTION.md](../../public/grid/licenses/PHOTO-ATTRIBUTION.md). The electronic Canvas processes that source in place and remains decorative to assistive technology.

The ordinary frame uses a fine border (1px); Raw exposes a stronger boundary (3px). Guides use thin non-scaling SVG strokes, with intensity controlled by scene progress. The range thumb is a narrow upright rectangle (9px × 18px) with zero radius. No general rounded-corner scale or card shape is defined.

The registration mark is the recurring curved form: one circle and two crossing axes in an SVG view box. The opening and closing mark use a small (6px × 6px) layout footprint; the startup dot is a circle on the same origin. Keep this geometry continuous when its weight or size changes.

**The Source Shape Rule.** Build lettering, guides, controls and geometric marks in HTML, CSS and SVG. Composition-study bitmaps do not become live interface elements.

## Components

The small component vocabulary is direct and restrained. Component snippets in `../../provenance/grid/design.json` reproduce current DOM/CSS patterns with scoped names; they are isolated examples of real controls and marks, not a second component library.

### Text buttons

Index, About and Reset use unfilled text with a short underline revealed on hover. Main header text buttons have a minimum height of (40px), reduced to (36px) on phone; experiment Reset controls use (32px). The underline transition lasts (.2s, ease). Focus uses the shared ink outline (2px) with an offset (5px). No raised or pill treatment is present.

### Look again action

One semantic link stays in the specimen. Outside Interface it is an uppercase monospaced action with a diagonal arrow and a partial underline that extends on hover (.23s, ease). It retains a minimum height of (40px); the renderer protects its lower position with a (48px) stage reserve. With JavaScript, it advances to the next system and returns to Zero from No grid. Its accessible label describes the destination.

Interface makes that same link a blue full-width action with white text, a minimum height of (44px), and arrow aligned to the far edge. Wide-frame padding uses the frontmatter value; narrower container rules reduce padding to (10px). The fill and text are evaluated as a composited surface during the entering and leaving transitions.

### Icon buttons

Previous, Next and sheet Close use unfilled square hit regions with inline SVG. The ordinary size is (40px); large-screen controls use (54px), and phone footer arrows use (32px × 40px). Arrow icons move horizontally (2px) on hover; Close rotates (90deg). Both use the existing (.2s, ease) transition. Disabled boundary navigation uses reduced opacity (.34) and a default cursor.

### Chapter rail and Index

The footer rail is a continuous line of twelve numbered positions. Its current step is identified by `aria-current="step"`, an accent tick at full height and ink-colored numbering. Unselected ticks are quieter. Desktop buttons have a minimum height of (46px); phone rail buttons use (34px) and occupy their own full-width footer row.

Index presents the same destinations as a two-column ruled list, becoming one column on phone. Each item has a number, name and diagonal arrow. Current entries use the sheet's current color; hovering shifts the name (5px) to the right. Left/right arrows, Home and End navigate through the same scene authority when focus is outside controls and modal sheets.

### Range controls

Frame width and the four font axes use native range inputs. The visible track is a fine rule (1px) and the thumb uses the rectangular frontmatter primitive. Numeric outputs are tabular; the axis grid changes from four columns to two on phone. Focus remains visible through the shared outline. The axis values expose actual `wght`, `wdth`, `slnt` and `opsz` values, and Reset removes manual overrides. The frame control and axis console appear only in their respective stable demonstration interval.

### Modal sheets and rule rows

Index, Rules and About are native modal dialogs with a fine ink border, stable sheet colors, constrained viewport height and internal scrolling. Desktop width and padding are in the frontmatter; phone sheets use almost the full width with outer space (12px per side) and padding (24px 22px 20px). Their backdrop dims the specimen. Opening a sheet pauses Lenis; closing resumes it. Escape, close buttons and backdrop activation use the existing dialog behavior.

Rules pairs a serif statement with seven ruled definition rows: Grid, Type, Image, Space, Colour, Interaction and Motion. The category column is (110px) on desktop and (63px) on phone. Current field and column measurements sit in a separate final readout. About uses disclosure rows for references and assets, plus a native checkbox for reduced motion.

### Registration mark and photograph

The mark and photograph belong to the nine-part specimen, not a reusable badge/card set. Keep the same SVG and image nodes throughout. The image's hidden caption and visible-subject alternative text remain attached to its source; the raster Canvas is `aria-hidden`. The semantic heading retains its `GRID` label even when its four visible letter spans are rearranged or cropped. [Content DOM](../../pages/grid/index.html).

### Reduced motion and fallback

The operating-system preference and the in-app preference select direct compositions, turn off smoothing and disable CSS transitions. The system preference takes precedence in About. Controls and navigation remain available. Without JavaScript, all specimen text and the original photograph remain in the static composition; only interactive chrome is withheld. These behaviors are part of the design contract, not separate visual themes.

## Do's and Don'ts

### Do:

- **Do** preserve one article, one semantic heading and the nine persistent specimen nodes.
- **Do** keep each scene's authored palette, type roles and spatial relationships distinct.
- **Do** keep readable information and the action complete while the display word experiments with crop, scale and offset.
- **Do** compose phone layouts independently and preserve portrait-tablet page relationships.
- **Do** use real CSS Grid and container queries for Interface, including measured transition endpoints.
- **Do** interpolate the four real Roboto Flex axes and display their actual values in the controls.
- **Do** evaluate reading text and the transitioning action against their composited surfaces.
- **Do** retain deterministic reverse motion, direct reduced-motion navigation and the semantic static fallback.
- **Do** retain the same photograph, attribution, local font assets and registration geometry.

### Don't:

- **Don't** replace scene changes with separate pages, duplicate content trees or whole-page crossfades.
- **Don't** define one display font size, type family or card layout for all twelve systems.
- **Don't** imitate responsive behavior by scaling a screenshot or the entire composition as one object.
- **Don't** accumulate transforms, invent a second smoother or add an independent animation clock.
- **Don't** let a photographic frame, folio or moving action cover the readable information it passes.
- **Don't** add shadows, rounded cards, glass surfaces or decorative imagery outside the established vocabulary.
- **Don't** convert composition-study imagery into live typography, navigation or geometric UI.
- **Don't** move the final title, subtitle, photograph or information merely because the guides disappear.
- **Don't** treat palette swatches or sampled contrast safeguards as a blanket accessibility certification.

## Collection integration contract

This adaptation retains the twelve original system endpoints, nine persistent semantic nodes, real four-axis Roboto Flex type, credited photograph and deterministic raster. One installed root Lenis1.3.26 uses lerp .105, syncTouch false and autoRaf false on the existing GSAP3.15 ticker. Its constructor duration is removed so wheel interpolation actually uses lerp; authored go() navigation durations remain. Render progress follows the actual document position without another time easing layer. Dialogs and reduced-motion wheel remain native.

Fresh explicit hashes select their named system; reload/back-forward retain the exact fractional document coordinate saved for the current history entry. Resizes retain normalized position. Terminal pagehide aborts owned listeners, clears the original resize queue and disposes Lenis, ScrollTrigger, renderer/raster and the owned ticker callback. A terminal event during awaited fonts/photo prevents late initialization. Persisted pagehide and real hidden tabs suspend the same clock and restore the existing composition on return.

The shared native Collection exit is also visible in the supplied no-JavaScript static composition. Live CSS is owned by the HTML document. Public fonts/photo and upstream legal records retain exact bytes. Visual Bible studies/prompts are source history under provenance/grid and are not runtime screenshots or interface assets. No whole-work MIT grant is asserted.

Two confirmed phone handoff reading defects receive local pure waypoint changes: Zero→System lifts the original photograph beside the reading column before expanding it; International→Basel temporarily compacts the same heading while its subtitle reaches the lower reading lane. All twelve original endpoint poses, nine nodes, easing characters and interval durations remain. Both directions sample the same pure paths; no copy is hidden, masked or globally restyled. The supplied <.001 endpoint tolerance is retained when mapping integer-pixel document positions.
