---
name: MEND — Still Yours
description: A warm, material-led interface around a sunlit workbench.
colors:
  oat: '#f4ebdd'
  paper: '#f7f0e5'
  ink: '#4b423b'
  muted: '#6f6154'
  red: '#a64e3c'
  sage: '#a9b7a2'
  blue: '#456a91'
  terracotta: '#bd6551'
  hairline: rgba(75,66,59,.21)
  letter-paper: '#f8f1e6'
  record-paper: '#f9f3e9'
  primary-hover: '#665442'
  outline-surface: rgba(244,235,221,.5)
  outline-border: '#9c8b77'
  outline-hover: '#e8ddcc'
  selected-sage: rgba(169,183,162,.2)
typography:
  display:
    fontFamily: Newsreader, Georgia, serif
    fontSize: clamp(104px, 11.6vw, 190px)
    fontWeight: 350
    lineHeight: 0.9
    letterSpacing: -.045em
  headline:
    fontFamily: Newsreader, Georgia, serif
    fontSize: clamp(44px, 4.6vw, 78px)
    fontWeight: 350
    lineHeight: 1.035
    letterSpacing: -.035em
  title:
    fontFamily: Newsreader, Georgia, serif
    fontSize: 23px
    fontWeight: 450
    lineHeight: 1.2
  body:
    fontFamily: '"DM Sans", Arial, sans-serif'
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: '"DM Sans", Arial, sans-serif'
    fontSize: 11px
    fontWeight: 400
    letterSpacing: .15em
  control:
    fontFamily: '"DM Sans", Arial, sans-serif'
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.35
  letter:
    fontFamily: Newsreader, Georgia, serif
    fontSize: 21px
    fontWeight: 400
    lineHeight: 1.4
  navigation:
    fontFamily: Newsreader, Georgia, serif
    fontSize: 21px
    fontWeight: 400
    lineHeight: 1.15
  dialog-title:
    fontFamily: Newsreader, Georgia, serif
    fontSize: 38px
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: -.02em
rounded:
  control: 4px
  thumbnail: 3px
  subtle: 2px
  circle: 50%
spacing:
  small: 8px
  compact: 12px
  regular: 18px
  paragraph: 24px
  group: 28px
  gutter: clamp(28px, 6.5vw, 140px)
  gutter-mobile: 25px
  gutter-narrow: 20px
components:
  button-primary:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.paper}'
    typography: '{typography.control}'
    rounded: '{rounded.control}'
    padding: 14px 21px
  button-primary-hover:
    backgroundColor: '{colors.primary-hover}'
  button-outline:
    backgroundColor: '{colors.outline-surface}'
    textColor: '{colors.ink}'
    typography: '{typography.control}'
    rounded: '{rounded.control}'
    padding: 14px 21px
  button-outline-hover:
    backgroundColor: '{colors.outline-hover}'
  button-text:
    textColor: '{colors.ink}'
    padding: 10px 0
  button-text-hover:
    textColor: '{colors.red}'
  repair-option:
    textColor: '{colors.ink}'
    padding: 20px 13px 20px 3px
  repair-option-checked:
    backgroundColor: '{colors.selected-sage}'
  inspection-row:
    textColor: '{colors.ink}'
    padding: 12px 0
    width: 100%
  comparison-control:
    textColor: '{colors.ink}'
    padding: 10px 0
  chapter-link:
    textColor: '{colors.ink}'
    typography: '{typography.navigation}'
    padding: 12px 0
  letter:
    backgroundColor: '{colors.letter-paper}'
    textColor: '{colors.ink}'
    typography: '{typography.letter}'
    padding: 22px 27px 18px
    width: clamp(245px, 25vw, 338px)
  repair-record:
    backgroundColor: '{colors.record-paper}'
    textColor: '{colors.ink}'
    padding: 25px 26px
  dialog:
    backgroundColor: '{colors.paper}'
    textColor: '{colors.ink}'
    rounded: '{rounded.control}'
    padding: 34px 38px
    width: min(530px, calc(100vw - 32px))
---

# Design System: MEND

## Overview

**Creative North Star: "A workbench in the afternoon"**

MEND uses warm daylight, matte materials, and quiet editorial typography. Oat is the continuous ground; sage, cobalt, and terracotta connect the interface to the established artwork. Fine rules and open space organize the controls without turning the experience into a grid of containers.

The character is careful and tactile. Newsreader gives headings and correspondence a human cadence; DM Sans keeps reading, choices, and status information clear. Physical paper appears where the content is itself a letter or a record of care. The visual language is restrained enough for the object and its material differences to remain legible.

**Key Characteristics:**

- Warm oat ground, sage material, cobalt detail, and terracotta accents.
- Newsreader for expressive and editorial roles; DM Sans for reading and controls.
- Fine separators, modest control corners, and sparse paper objects.
- Generous desktop separation and an upper visual stage with normal-flow text on mobile.
- Native semantic controls, visible focus, and stable alternatives to continuous motion.

**Evidence scope:** This is an extraction of the implemented HTML and styles in `index.html`, `src/style.css`, and `src/diagrams.css`, read against `PRODUCT.md` and `docs/ART_DIRECTION.md`. It replaces the earlier directional document. The final browser visual review was unavailable; this document records source evidence and the established art contract, not a visual pass. Page copy, chapter sequence, repair narrative, and image-selection history remain in the product, art, and page sources rather than becoming system rules.

## Colors

The palette has a warm neutral base with restrained botanical, blue, and red material accents. Exact shared values are normative in the frontmatter; the names below explain their use.

### Primary

- **Deep terracotta red (`red`)** is the interaction accent for text-button, navigation, and inspection hover states. It is darker than the object’s terracotta.
- **Primary action pairing** uses warm ink on the button surface and paper for its label. The filled action deliberately belongs to the neutral family; it does not use cobalt as its fill.

### Secondary

- **Sage (`sage`)** belongs to the work mat and the established material world. The translucent `selected-sage` token marks the selected repair row without enclosing it in a raised card.
- **Cobalt (`blue`)** belongs to the front wheels and the visible keyboard-focus outline. It remains a precise accent rather than a full-screen wash.

### Tertiary

- **Terracotta (`terracotta`)** is the cord and ear material, also present in the explanatory diagrams. Its hue relationship to the deeper interface red is deliberate.

### Neutral

- **Oat (`oat`)** is the continuous page and stage ground.
- **Paper (`paper`)**, **letter paper (`letter-paper`)**, and **record paper (`record-paper`)** are close warm variations with distinct implemented uses: overlay surface and light button text, the intake letter, and the care record respectively.
- **Warm ink (`ink`)** supplies the dominant text and primary button fill; **muted umber (`muted`)** supports labels and secondary information.
- **Hairline (`hairline`)** provides translucent warm separators. **Outline surface**, **outline border**, and **outline hover** preserve a lighter secondary action. **Primary hover** is the filled button’s warmer brown state.

**The Material and Interface Rule.** Keep the artwork’s terracotta distinct from the deeper red used for interactive text. Cobalt also carries the visible keyboard-focus treatment. Do not collapse these roles into one accent.

Fine diagrams use additional local wood, sleeve, wear, and line colors from `src/diagrams.css`. These remain illustration detail; they are not a second general UI palette. Photographic stages use oat edge fades for reading continuity, not a newly colored photographic treatment.

## Typography

**Display Font:** Newsreader, with Georgia and the generic serif fallback.

**Body Font:** DM Sans, with Arial and the generic sans-serif fallback.

Both families are served as local Latin WOFF2 assets. Newsreader has normal and italic variable files; DM Sans has a normal variable file. The pairing combines a lightly weighted editorial voice with compact, clear functional text. There is no separate monospace family.

### Hierarchy

| Frontmatter role | Implemented use |
| --- | --- |
| `display` | Largest opening title; compact leading and slightly tighter tracking |
| `headline` | Repeated section headings, often with a Newsreader italic phrase |
| `title` | Repair-choice titles; a slightly firmer serif weight |
| `body` | Main reading copy, normally limited to a short measure of 36ch |
| `label` | Small numbered markers with tabular numerals and open tracking |
| `control` | Filled and outlined action labels |
| `letter` | Correspondence set directly in the serif voice |
| `navigation` | Links in the chapter menu |
| `dialog-title` | Overlay headings |

The scale is fluid and role-specific, not a fixed modular ratio. Supporting text is smaller than body copy; captions and indexes are deliberately quiet. Italic serif asides, return correspondence, and result lines have local sizes appropriate to their role rather than a new font family.

On mobile, section headings use a more compact fixed size (47px, line-height 1.08), main body copy uses 15px and a maximum measure of 40ch, and the largest title changes to a viewport-based clamp. The narrowest breakpoint reduces section headings to 41px and body copy to 14px. These are existing responsive overrides, not desktop token replacements.

**The Two Voices Rule.** Use Newsreader for expressive headings, correspondence, and concise editorial emphasis. Use DM Sans for body copy, labels, controls, and diagram annotations.

## Layout

### Spatial model

The desktop composition is an open reading column beside an expansive visual stage. The repeated reading column is `min(36vw, 460px)` wide and starts at the fluid `gutter` token. The opening column is `min(40vw, 540px)`. Body copy has its own shorter reading measure inside those columns. The stage is fixed; the section content remains in normal document flow.

Repeated sections have generous vertical room: the base minimum height is 116svh, with fluid top and bottom padding. There is no universal equal-height card grid. The spacing tokens capture reused intervals, while larger editorial pauses and component padding retain their source-defined values; the implementation does not use a rigid eight-point spacing system.

### Responsive behavior

| Condition | Existing behavior |
| --- | --- |
| Width at most 760px | The `gutter-mobile` token replaces the fluid gutter. The visual stage occupies an upper area (42svh, starting 61px from the top), with normal-flow text below. Section padding begins at `calc(43svh + 94px)` and the reading column becomes full width, capped at 560px. |
| Opening view on mobile | A separately composed portrait image is selected and the stage can occupy the full viewport. This is an explicit opening-view exception, not the layout of every section. |
| Width at most 370px | `gutter-narrow` applies; typography, radio-row drawings, and action gaps tighten. |
| Width 761–1000px | The reading column becomes 38vw; headings and controls compact while retaining the desktop split. |
| Width at least 761px and height at most 600px | The header, vertical padding, and display scale reduce for a short viewport; the desktop split remains. |
| Width at least 2000px | Reading width is restrained to 450px, with a 570px opening column. |

The mobile upper stage sits above outgoing reading content (stage layer 8, caption layer 9); the opening stage is layer 0 so the title remains above it. Header and footer remain on their higher UI layers. Mobile chapter controls have `scroll-margin-top: calc(42svh + 90px)` and a bottom margin of 75px so keyboard-driven scrolling can clear the fixed visual area and footer. This is source-defined clearance, not a claim that final viewport screenshots were inspected.

The chapter rail and floating object hotspots are hidden on mobile. Their functional alternatives are the chapter menu and in-flow inspection rows. Those rows include local crops of the same canonical photograph. The footer respects the safe-area inset. Print styling removes fixed visual and navigation layers, returns the content to a simple reading layout, and gives the record a printable border.

## Elevation & Depth

Most interface content is flat on the oat ground. Depth comes from the established artwork’s matte materials and contact shadows, quiet tonal differences, and a small number of functional overlays. Physical paper is an exception used for correspondence and the care record. The letter is slightly counterclockwise; the record has a smaller clockwise turn. Dialog elevation indicates an overlay and does not turn the dialog into a photographed sheet.

**The Purposeful Paper Rule.** Reserve physical paper framing for correspondence and the repair record. Ordinary choices, inspection rows, and comparison controls sit directly on the shared ground.

### Shadow Vocabulary

| Sidecar shadow | Source use |
| --- | --- |
| `letter` | Soft low shadow beneath the intake letter |
| `repair-record` | Wider, lighter shadow beneath the care record |
| `hotspot` | Small separation beneath an object annotation’s numbered disc |
| `resource-notice` | Restrained elevation for a transient resource notice |
| `dialog` | Deepest UI shadow, paired with a warm translucent backdrop |

The exact shadow strings are in the sidecar because the frontmatter schema has no shadow property. Paper rotation is confined to those existing components; regular rows and reading passages stay level.

## Shapes

Controls have modest corners using the `control` radius. The quieter footer toggle uses `subtle`; mobile detail crops use `thumbnail`. The letter and record keep square sheet edges. Circular geometry belongs to native-choice indicators, object hotspots, progress dots, and the illustrated wheel mechanism; the action buttons are not pills.

Fine one-pixel separators organize inspection, choice, navigation, and record rows. Comparison selection adds a thicker underline. Inline interface icons use simple, open strokes with rounded line caps and joins. Material diagrams preserve distinct old-wood, new-wood, sleeve, and cord shapes without adding decorative container borders.

## Components

### Buttons

Filled and outlined actions are calm, compact, and readable. Their shared base is the `control` typography and corner token, with the frontmatter padding. The primary uses the warm ink / paper pairing; the outline variant uses a fine warm border and translucent oat surface. The base minimum height is 49px on desktop and 46px on mobile. Mobile padding becomes 13px 18px, with smaller context-specific action variants where the source defines them.

Hover changes the surface and translates the button upward by 2px over 0.2 seconds. Text actions have no filled surface, use a minimum height of 44px, and shift to the deeper red on hover. Focus is a cobalt outline (2px, offset 5px); disabled buttons reduce opacity and use a waiting cursor. The OS reduced-motion rule removes button translation as well as transitions. The explicit reduced-motion data state also removes transitions.

### Native repair choices

Repair choices are full-row labels backed by native radio inputs. Each row combines a small inline material drawing, a serif title, a sans-serif explanation, and a circular selected indicator. Fine rules separate the choices. The selected row receives the translucent sage wash and a filled dot, preserving more than a color-only distinction. A focused radio outlines the whole row in cobalt with a 4px offset.

The desktop row uses three columns (58px / flexible / 18px); mobile reduces the drawing and tightens the gaps. This is the implemented input pattern. There is no general text-field or chip component to infer from this page.

### Inspection rows and detail crops

Inspection uses ruled buttons with a small index, plain-language label, and directional icon. The default row minimum height is 57px. The active row and hover use related deep red tones, with `aria-pressed` carrying the semantic state. Desktop stage hotspots have corresponding in-flow controls.

On mobile, each inspection row is at least 78px high and includes a 54px square crop with the `thumbnail` radius. All three crops use the same canonical photograph at a 230px image width; the source fixes separate crop offsets for the wheel, ear, and worn paint. These are detail views of one object, not interchangeable decorative thumbnails.

### Comparison controls

Comparison uses two flexible text buttons on a shared warm rule. The selected option is marked by a two-pixel underline, a deeper red label, and `aria-pressed`; the unselected option remains readable on the open background. The control minimum height is 46px. There is no pill container or floating segmented-control shadow.

### Letters and repair record

The letter is a square-edged warm sheet with serif text, a quiet citation, a short translucent tape strip, its dedicated shadow, and a slight rotation. The repair record uses a related square-edged sheet, a serif heading, a ruled definition list, and a full-width text action. Its content is structured DOM text, not lettering inside generated artwork. Mobile adjusts sheet widths and padding while retaining the same material character.

### Navigation and overlays

The fixed header uses a spaced wordmark, a small line icon, and quiet text controls. The chapter menu uses ruled serif links and smaller sans-serif numbers; links keep a minimum target height of 44px. The supplementary desktop rail uses small dots, with the current number revealed; the full menu remains the touch-friendly alternative. Mobile hides the header note and About shortcut, keeps Motion and Chapters, and hides the rail.

Native dialogs use the paper surface, modest control corners, a warm translucent backdrop, and the deepest interface shadow. Their width is capped while leaving a viewport margin; height is capped to permit internal scrolling. The close button has a 44px square target. Text, action, menu, and footer controls retain their implemented minimum target heights even when their labels become smaller.

### Visual stage and explanatory diagrams

The stage presents photographic or live object views while essential copy and controls remain in DOM content. The image containers preserve the whole composition with contained image sizing. Small explanatory SVGs share the warm ink and material palette, DM Sans labels, fine leaders, and a maximum width of 420px, reducing to 390px on mobile. These diagrams explain material relationships rather than introduce a new card style.

Motion accompanies a meaningful view or state change. The visual contract rejects idle bobbing and anthropomorphic acting. CSS removes transitions under the OS reduced-motion preference and the explicit reduced-motion state; diagram CSS also removes animations for the OS preference. Runtime motion behavior and scene transitions require their own functional verification; the presence of these styles alone is not a completed motion audit.

## Do's and Don'ts

### Do:

- **Do** use the frontmatter tokens as the source for shared color, type, corner, and spacing values.
- **Do** keep the oat, sage, cobalt, and terracotta material world and the Newsreader / DM Sans pairing.
- **Do** retain the upper mobile stage and normal-flow reading content, including the keyboard scroll clearance below fixed chrome.
- **Do** communicate control state with the implemented dot, underline, rule, or pressed-state treatment as well as color.
- **Do** reserve the tilted paper treatment for the letter and repair record.
- **Do** keep native controls, visible cobalt focus, readable DOM content, and the existing reduced-motion alternatives.
- **Do** keep photographic artwork and explanatory diagrams consistent with the material contract in docs/ART_DIRECTION.md.

### Don't:

- **Don't** turn the reading flow into a dashboard card grid or add rounded containers around every passage.
- **Don't** replace the modest control corners with pill-shaped buttons or soften the paper sheets into generic cards.
- **Don't** substitute decorative motion, idle bobbing, or anthropomorphic movement for meaningful object or state changes.
- **Don't** use generated lettering as required UI copy or flatten meaningful controls into an image.
- **Don't** copy the desktop text placement unchanged onto mobile or place essential mobile actions only on stage hotspots.
- **Don't** treat the sidecar’s synthesized tonal ramps as approved additional application colors.
- **Don't** treat this source extraction as a completed browser visual review.
