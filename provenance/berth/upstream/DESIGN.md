---
name: "BERTH"
description: "An intimate cinematic reading experience: one night, ten quiet moments."
colors:
  page-bg: "#14242d"
  night: "#182d38"
  deep: "#101e25"
  paper: "#e9dfc9"
  honey: "#dda75d"
  sage: "#7d8b80"
  clip: "#c96b47"
  muted: "#b9c0b9"
  line: "rgba(233,223,201,.21)"
  prose: "#d1d3c9"
  menu-bg: "#1a2d36"
  writing-paper: "#e7dfcc"
  writing-ink: "#26363d"
  field-ink: "#24343a"
  button-bg: "#233b45"
  button-ink: "#f1e8d4"
  button-hover: "#35515b"
  note-ink: "#2d3e43"
  lin-note: "#d8dcd0"
  dawn-bg: "#e2e4db"
  dawn-ink: "#23363f"
  dawn-muted: "#51666b"
  dawn-prose: "#3f555e"
typography:
  hero-display:
    fontFamily: "'Cormorant Garamond', Georgia, serif"
    fontSize: "clamp(100px,11.3vw,180px)"
    fontWeight: 400
    lineHeight: 0.91
    letterSpacing: ".045em"
  hero-subtitle:
    fontFamily: "'Cormorant Garamond', Georgia, serif"
    fontSize: "clamp(29px,3.25vw,50px)"
    fontWeight: 400
    lineHeight: 1.16
    letterSpacing: "-.02em"
  chapter-heading:
    fontFamily: "'Cormorant Garamond', Georgia, serif"
    fontSize: "clamp(2.8rem,4.8vw,4.9rem)"
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "-.025em"
  deck:
    fontFamily: "'Cormorant Garamond', Georgia, serif"
    fontSize: "clamp(1.5rem,2.5vw,2.4rem)"
    fontWeight: 400
    lineHeight: 1.35
  body:
    fontFamily: "'DM Sans', Arial, sans-serif"
    fontSize: "clamp(1rem,1.16vw,1.1rem)"
    fontWeight: 400
    lineHeight: 1.85
  chapter-label:
    fontFamily: "'DM Sans', Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    letterSpacing: ".13em"
  time:
    fontFamily: "ui-monospace, 'Courier New', monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: ".04em"
  control:
    fontFamily: "'DM Sans', Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 400
  utility-control:
    fontFamily: "'DM Sans', Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    letterSpacing: ".02em"
  writing-field:
    fontFamily: "'Cormorant Garamond', Georgia, serif"
    fontSize: "27px"
    fontWeight: 400
    lineHeight: 1.4
  note:
    fontFamily: "'Cormorant Garamond', Georgia, serif"
    fontSize: "clamp(25px,3vw,36px)"
    fontWeight: 400
    lineHeight: 1.25
rounded:
  square: "0"
  paper: "1px"
  fine: "2px"
  group: "4px"
  circle: "50%"
spacing:
  gutter: "clamp(24px,6.5vw,112px)"
  section: "clamp(78px,10vw,152px)"
  tablet-gutter: "40px"
  tablet-section: "100px"
  phone-gutter: "24px"
  phone-section: "78px"
  writing-paper: "clamp(28px,3.7vw,56px)"
  segmented-inset: "4px"
  chapter-heading-after: "32px"
components:
  keep-button:
    backgroundColor: "{colors.button-bg}"
    textColor: "{colors.button-ink}"
    typography: "{typography.control}"
    rounded: "{rounded.fine}"
    padding: "17px 20px"
    width: "100%"
  keep-button-hover:
    backgroundColor: "{colors.button-hover}"
  utility-button:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    typography: "{typography.utility-control}"
    padding: "12px 0"
  begin-link:
    textColor: "{colors.paper}"
    rounded: "{rounded.circle}"
    size: "48px"
  lamp-segmented:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    rounded: "{rounded.group}"
    padding: "{spacing.segmented-inset}"
  lamp-selected:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.deep}"
    rounded: "{rounded.fine}"
    padding: "11px 18px"
  opening-field:
    backgroundColor: "transparent"
    textColor: "{colors.field-ink}"
    typography: "{typography.writing-field}"
    rounded: "{rounded.square}"
    padding: "4px 0 13px"
    width: "100%"
  chapter-menu-panel:
    backgroundColor: "{colors.menu-bg}"
    textColor: "{colors.paper}"
    padding: "28px"
    width: "340px"
  keepsake-note:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.note-ink}"
    typography: "{typography.note}"
    rounded: "{rounded.square}"
    padding: "31px 35px"
  keepsake-note-lin:
    backgroundColor: "{colors.lin-note}"
  binding-state-control:
    backgroundColor: "transparent"
    textColor: "#344a4a"
    rounded: "{rounded.fine}"
    padding: "10px 20px"
  editing-action:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    padding: "8px 0"
---

# Design System: BERTH

## Overview

**Creative North Star: "One night. Ten quiet moments."**

BERTH is an intimate cinematic reading experience. The artwork leads and the interface recedes: a fixed night-train compartment, cream cotton, old walnut, midnight blue, warm brass light and one orange-red wire paper clip. The existing doorway composition places the opening title in the dark door zone and keeps the compartment legible beside it. Portrait artwork preserves that story on a narrow screen.

Long-form reading stays in ordinary document flow. Generous space, narrow prose measures, serif literary statements and small sans-serif controls give the journey its quiet pace. Paper surfaces are literal objects in the story: the handout, the writing card and the two keepsakes. There is no generic promotional card grid.

The room and its objects remain continuous across the night, while local light and framing change. Motion uses spatial reveals, small displacement and material edges; pausing motion or requesting reduced motion exposes readable still sequences. The direction is humane and understated, without melodrama, marketing slogans or decorative spectacle.

**Key Characteristics:**

- Cinematic artwork with live, selectable typography.
- Midnight surfaces, warm paper and restrained honey accents.
- Cormorant Garamond for literary scale; DM Sans for narration and controls.
- One continuous compartment and two distinct cards.
- Document-flow reading with native controls and explicit focus states.
- Portrait compositions and readable static alternatives.

**Reference status:** This document extracts the existing implementation from `src/styles.css`, with semantic structure from `src/render.ts` and durable direction from `PRODUCT.md`. It preserves the supplied cinematic art direction. The latest full-art desktop Hero has been captured and compared; phone recovery, text interactions and limited responsive geometry have also been observed. Full visual and end-to-end acceptance remains incomplete. This reference does not itself grant a contrast, accessibility or performance pass. See `docs/verification.md` and `docs/finish-review.md` for scoped evidence and remaining gates.

The YAML frontmatter is the normative primitive-token layer. `.impeccable/design.json` extends it using schema version 2; `docs/design-tokens.json` is an identical portable copy of that extension data. The JSON files intentionally do not duplicate the primitive tokens. Their generated OKLCH ramps are display-panel swatch metadata, not additional colors used by the application.

## Colors

The palette moves from muted blue night to pale cool daylight, with paper carrying the human scale and honey carrying small points of warmth.

### Primary

- **Honey light** (`honey`) marks focus rings, selected navigation, story times, small rules and the reading-progress line. It is an accent rather than a large default surface.

### Secondary

- **Sage** (`sage`) is a declared material accent in the existing root palette. It is not the default control fill; the implemented pale note surface has its own `lin-note` token.

### Tertiary

- **Orange-red wire clip** (`clip`) belongs to the small physical paper clip. The paper-binding scene has a separately authored darker clip tone for its daylight setting; preserve that scene-local treatment.

### Neutral

| Token group | Use |
| --- | --- |
| `page-bg`, `night`, `deep` | Page ground, art/transition ground and deep ink. The page ground is deliberately distinct from the declared night token. |
| `paper`, `prose`, `muted`, `line` | Primary light text, sustained reading text, secondary copy and thin separators on night surfaces. |
| `menu-bg` | Expanded chapter navigation, above the page. |
| `writing-paper`, `writing-ink`, `field-ink` | The editable card, its surrounding text and the first-line field. |
| `button-bg`, `button-ink`, `button-hover` | The Keep this line action and its hover state on the writing card. |
| `note-ink`, `lin-note` | Dark keepsake text and Ms. Lin’s distinct pale note surface. Ning’s note uses the paper token. |
| `dawn-bg`, `dawn-ink`, `dawn-muted`, `dawn-prose` | The chapter-eight daylight section and its darker reading hierarchy. |

**The Local Light Rule.** Lamp comparison belongs to the chapter-three table, its paper and nearby surfaces. It must not recolor later scenes or dim the surrounding reading text.

The lamp’s Reading, Soft and Off states alter only the local photograph, layered light and handout colors. The CSS keeps all three handout states as readable paper-and-ink combinations. That is a source-level design decision, not a measured contrast claim. The surrounding UI keeps its chapter palette.

## Typography

**Display font:** Cormorant Garamond, with Georgia and serif fallbacks. **Body and control font:** DM Sans, with Arial and sans-serif fallbacks. Both families are bundled locally. The CSS imports Cormorant Garamond regular, italic and medium, plus DM Sans regular and medium. The documented heading roles use the authored regular weight; loading a medium face is not a direction to make all headings medium.

Story times use a tabular monospaced system stack. No mathematical modular scale is imposed: the implementation uses role-specific fluid sizes, line heights and measured text widths.

| Frontmatter role | Application |
| --- | --- |
| `hero-display` | BERTH wordmark in the opening image; its larger tracking belongs to this title. |
| `hero-subtitle` | The two-line opening promise, with the second phrase italic. |
| `chapter-heading` | Chapter headings; balanced text, normally capped at 12ch. |
| `deck` | Short literary introductions and secondary statements. |
| `body` | Sustained narration; normally capped at 59ch, with some two-column reading blocks capped at 54ch. |
| `chapter-label` | Uppercase chapter identifiers with small tracking and medium weight. |
| `time` | Chapter metadata time, paired with the chapter label and a thin rule. |
| `control`, `utility-control` | Main writing action and compact header utilities respectively. |
| `writing-field` | The real editable first line; vertical resizing is allowed. |
| `note` | Live keepsake text on the two cards. |

The frontmatter describes default desktop roles. The phone layout uses a fluid title (88–136 px), chapter headings (42–63 px), 16 px body text at the same generous line height, a 28 px first-line field and 31 px keepsake text. Individual chapter statements keep their authored overrides rather than being forced into a new universal scale. The Layout section records the breakpoint conditions.

**The Live Text Rule.** Narration, note ownership, the editable first line and feedback remain DOM text. Preserve the reader’s entered language, line breaks and direction instead of baking words into artwork.

## Layout

### Reading and imagery

The principal wrapper is capped at 1640 px and uses the frontmatter gutter token. Regular chapters use the section-spacing token above and below. The opening and ending are full-frame image sections with independently positioned live type; the sustained prose follows in normal flow. The fixed header is 86 px high on the default desktop layout. Chapter anchors have a 90 px scroll margin, and the first reading anchor has 104 px.

The opening image occupies one small-viewport height with a 740 px minimum. Its text zone is 39% wide, capped at 610 px, offset by the gutter and started at `max(185px,25svh)`. The ending image is 95 small-viewport-height units with a 700 px minimum, with a narrower 32% text zone capped at 460 px. These are actual layout rules, not instructions to stretch image pixels or relocate the fixed room.

| Composition | Default grid and role |
| --- | --- |
| Opening reading | 0.9 : 1 columns with a 10% gap. |
| Shared light | 0.82 : 1.18 text/image split with a 7% gap. |
| Table and corridor | 1.25 : 0.75 visual/reading balance with a 7% gap. |
| Night conversation | Wide art capped at 1600 px, followed by equal reading columns with a 13% gap. |
| Writing | 1 : 0.85 story/card columns with an 11% gap. |
| Dawn | Wide art capped at 1600 px, followed by equal reading columns with a 10% column gap. |
| Keepsakes | 1.2 : 0.8 notes/prose columns with a 9% gap. |

Image composition changes with the scene. Portrait-cropped shared light, the wide sleeping berth and intimate paper views use their authored object positions. The opening, night conversation, dawn and empty-room ending have separately generated portrait alternatives. Do not derive a new composition by changing the art itself.

### Responsive rules

These conditions come from the CSS cascade. They describe intended implementation behavior; the listed dimensions are not test results.

| Condition | Implemented behavior |
| --- | --- |
| Width at most 1100 px | Gutter becomes 40 px and section spacing 100 px. Column gaps tighten and the opening text zone grows to 43%. |
| Width at most 800 px | Shared-light, table and corridor visual layouts begin stacking. Some reading subgrids remain two columns; the writing layout remains two columns until the phone breakpoint. |
| Width at most 720 px | Gutter becomes 24 px and section spacing 78 px. Header becomes 72 px high. The chapter menu is fixed 16 px from each edge, below the header. Reading, writing and keepsake layouts become one column. |
| Width at most 720 px, opening/ending | Opening uses 100svh with a 720–1050 px range; ending uses 100svh with a 760–1050 px range. Text begins 28 px from the left. Opening starts 115 px from the top; ending starts 100 px from the top. |
| Width at most 720 px, major scenes | Night conversation and dawn display portrait frames at 9:13. The writing card uses 34 px by 28 px padding. Local controls remain in document flow. |
| Width at most 370 px | Header padding reduces to 16 px, opening title to 84 px and opening minimum height to 680 px. The writing card uses 27 px by 22 px padding, and note text becomes 28 px. |
| Width at least 1900 px | Opening title becomes 195 px, subtitle 55 px and prose 18 px; transition width cap becomes 1300 px. |
| Width at least 3000 px | Opening title becomes 260 px, subtitle 70 px, wrapper cap 2000 px and header 110 px. The title/header alignment moves to 12vw. |
| Height at most 600 px and width at least 721 px | Opening and ending use 720 px height. Header becomes 70 px; transition pinning and the paper-binding scene use compact height rules. |

The default transition stage is 16:9, capped at 64svh inside a 1100 px sticky wrapper positioned 14svh from the top. The base transition occupies 100svh with a 620 px minimum; scene overrides supply more space for actual actions. On phones, the default stage is 1.15:1 and capped at 56svh, with its wrapper 23svh from the top. Sequence stages ordinarily use 1.35:1, but the authored climb handover uses 9:13.

The climb, card-binding and departure sequences have explicit scroll space. Default desktop values are respectively 135svh / 1000 px minimum, 180svh / 1400 px minimum and 160svh / 1200 px minimum; phone values are 125svh / 850 px, 190svh / 1350 px and 155svh / 1050 px. The paper-binding stage is 620 px high by default and 540 px on phones; a separate short-landscape rule limits it to `calc(100svh - 110px)` with a 330 px minimum.

### Motion and still reading

One coordinated scroll progression supplies image displacement, spatial masks and small material-edge movements. CSS uses a 0.2 s control fill transition, a 0.25 s header surface transition and 0.5 s local lamp transitions. Story handovers are scroll-driven geometry; these control durations do not time the story.

Climbing and departure use actual action frames behind spatial masks. The climb handover has a solid near wooden rail; the card-binding scene moves one wire clip between the manuscript and the two live-text cards. Dawn changes light in the existing room. These are source-described mechanisms; visual continuity still requires the separate render review.

The motion-off state and `prefers-reduced-motion: reduce` remove the pinned action presentation and expose the relevant frames in normal flow. Action sequences become two-column stills on desktop and one column on phones, with visible captions. The card-binding scene becomes a readable vertical sequence with native Before/After radios. Reduced-motion CSS disables animations and sets transition durations to zero; the explicit pause also removes local lamp transitions. No scroll snapping or scroll locking is part of the reading model.

## Elevation & Depth

The underlying interface is mostly tonal. The artwork supplies the room’s physical light; a short shadow vocabulary distinguishes paper layers, the clip and the expanded chapter panel. Reading paragraphs do not float in elevated cards.

| Shadow role | Actual CSS value | Use |
| --- | --- | --- |
| Expanded chapter menu | `0 16px 60px #0007` | Separates the open navigation panel from the image or prose below. |
| Handout | `0 10px 28px #0002` | Small lift below the chapter-three paper detail. |
| Writing card | `0 14px 38px #0003` | The editable paper surface. |
| Keepsake notes | `0 10px 26px #0002` | The two overlapping paper cards. |
| Binding cards | `0 7px 16px #34352518` | Shallow paper separation in the daylight binding scene. |
| Wire clip | `drop-shadow(1px 2px 1px #0003)` | The small clip on the keepsake. |

The handout is slightly rotated; the writing card has a fine offset paper outline; Ning’s and Ms. Lin’s keepsakes rotate in opposite directions. Those material cues are not interactive hover lifts.

**The Physical Depth Rule.** Depth comes from the room, paper layers and material edges. Keep shadows attached to those objects or the open navigation panel; do not add decorative glows to reading sections.

## Shapes

Corners stay almost square. Paper uses the paper-radius token where authored; scenes and most controls use the fine-radius token. The lamp group uses the slightly larger group radius. The writing field has square corners and a single lower rule. The circular opening arrow and tiny circular wordmark dot are the limited circular forms.

Separators are fine, low-contrast 1 px strokes. Icons are inline outline SVGs, typically 20 px with a 1.4-unit rounded stroke. The wire clip is a thin open wire silhouette, not a binder clip. Spatial transitions use rectangular clipping and narrow material edges; keep those edges tied to the room or paper they represent.

Global keyboard focus uses a 2 px honey outline, normally 6 px outside the target. The writing field uses a darker warm outline with a 4 px offset on pale paper; binding radios have their own warm 2 px focus outline with a 4 px offset. These are extracted states, not a claim that contrast has been independently measured.

## Components

The JSON sidecar contains nine representative HTML/CSS samples. They are source-derived visual references, not an alternate application runtime. All sample classes are scoped with `ds-`; no framework, remote image or external icon runtime is required. Font fallbacks remain available when the bundled webfonts are not present in the consuming panel.

### Primary writing action

**Character:** A clear dark action on a pale writing card.

Keep this line uses the frontmatter button tokens, spans the card width and has a 52 px minimum height. It places the real label opposite a small right-arrow SVG. Hover changes the fill using the existing 0.2 s transition; focus uses the standard ring. Disabled buttons use the global 0.45 opacity and default cursor. The feedback remains adjacent text and reports the actual local-save outcome.

### Utility and editing actions

**Character:** Small labels with generous working space.

Header sound and motion buttons have a 44 px minimum height, transparent background and honey hover text. Editing actions use muted text and a thin lower rule, with a 36 px desktop minimum and 44 px phone minimum. The implementation supplies no separate editing-button hover color; retain the focus ring and actual disabled state rather than inventing an effect. The opening link pairs its label with the outlined circle; hover fills the circle with paper and changes its arrow to night ink.

### Local lamp comparison

**Character:** Three compact choices beside the table.

A labelled fieldset contains real Reading, Soft and Off buttons. The group has a fine border, small inset and group radius; its buttons have a 42 px minimum height. The pressed state uses paper fill and deep ink, while unselected hover uses a faint paper tint. On phones the group stretches to the available width and each button shares the row. Selected semantics come from `aria-pressed`, not color alone.

### First-line field

**Character:** A real sentence on a real card.

The writing surface uses the writing-paper tokens and shadow. Its textarea is visibly labelled, uses a lower rule rather than a box, wraps long text and permits vertical resizing. Default minimum and maximum heights are 108 px and 340 px; the phone minimum is 120 px. Helper text, character count and status sit with the field. Preset openings are real buttons below the card, and undo/reset remain visible actions. Do not replace this text with a raster reproduction.

### Chapter navigation

**Character:** A restrained index of the night.

The native disclosure opens a dark panel with a honey upper rule. Each chapter link has three columns: number, title and tabular time, with fine separators. Hover and current chapter use honey. The desktop panel is anchored to the header control; the phone panel spans the viewport with fixed insets and an internal scroll limit. Keep the disclosure summary and actual links keyboard-operable. The sidecar shows the expanded panel as a visual specimen.

### Keepsake notes and paper binding

**Character:** Two identifiable pieces of paper, kept together.

Ning’s warm paper and Ms. Lin’s pale sage paper retain different ownership labels, small times and live serif text. The notes overlap gently with the small orange-red wire clip; line breaks remain visible and long content wraps. The chapter-nine pair is a single stack; the expanded ending can use two columns before collapsing on phones.

The binding scene has two live-text cards and a separate manuscript, with a single clip moving between them. In the still presentation, native Before/After radios switch the authored states and retain their checked and focus treatments. The underlying text is allowed to scroll within constrained animated cards; the still presentation removes that height constraint. The CSS does not author a special hover color for these radio labels, so the sidecar preserves their actual checked and focus states.

### Imagery and loading states

Artwork uses ordinary image elements with responsive sources and meaningful text alternatives. The opening has a lightweight same-composition preview behind the full image; recovery previews preserve the same artwork. If every supplied image source fails, a readable description remains in flow on a quiet night-colored surface. A preview background is not evidence that a full-resolution image loaded. Final cold-load and failure behavior belongs in the separate verification report.

## Do's and Don'ts

### Do:

- Do preserve the fixed compartment, travellers, objects and two separate note identities across every scene.
- Do use the supplied landscape and portrait artwork for their intended viewports and keep opening typography in its reserved dark space.
- Do keep narration in normal flow, with the body measure and line height defined here.
- Do retain real labels, keyboard focus, selected states and truthful local-save feedback on interactive controls.
- Do keep the chapter-three lamp comparison local and offer the same story content when motion is paused or reduced.
- Do keep note text selectable and editable text in its original language, including line breaks and bidirectional text.
- Do pair this document with the schema-v2 sidecar when consuming tokens: primitives live in the frontmatter, while component samples and extensions live in JSON.

### Don't:

- Don’t replace the fixed cinematic direction with a generic dashboard, promotional card grid or invented visual theme.
- Don’t substitute an automatic crop for an available independently composed portrait scene.
- Don’t use the orange-red clip color as a general call-to-action fill or let honey accents overwhelm the paper and night surfaces.
- Don’t crossfade displaced human poses or introduce camera shake; keep the authored spatial handovers and action frames.
- Don’t make reading text depend on an image, a hover interaction, sound or continuous animation.
- Don’t infer rendered fidelity, accessibility conformance or performance passes from this source-extracted reference.
