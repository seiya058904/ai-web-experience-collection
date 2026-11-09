---
name: IMAGO
description: One monarch life, observed through changing forms.
colors:
  paper: "#efede1"
  ink: "#212621"
  green: "#173e34"
  jade: "#8fb790"
  orange: "#c96b2c"
  muted: "#5b665b"
  line: "#c6cbbb"
  light-line: "#557368"
typography:
  display:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(96px, 11vw, 182px)"
    fontWeight: 400
    lineHeight: 0.77
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(52px, 6.2vw, 100px)"
    fontWeight: 400
    lineHeight: 0.96
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "30px"
    fontWeight: 400
    lineHeight: 1.1
  body:
    fontFamily: "Inter, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.9
  label:
    fontFamily: "Inter, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  circle: "50%"
  position-indicator: "20px"
spacing:
  page-gutter: "clamp(24px, 5.7vw, 110px)"
  component-gap: "24px"
  stage-gap: "32px"
  observation-gap: "44px"
  chapter-block: "110px"
components:
  story-link:
    backgroundColor: "transparent"
    textColor: "{colors.green}"
    padding: "13px 0"
  quiet-button:
    backgroundColor: "transparent"
    textColor: "{colors.green}"
    typography: "{typography.label}"
    padding: "5px 0"
  round-button:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.circle}"
    width: "46px"
    height: "46px"
  round-button-hover:
    backgroundColor: "{colors.green}"
    textColor: "{colors.paper}"
    rounded: "{rounded.circle}"
    width: "46px"
    height: "46px"
  stage-choice:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    padding: "15px 17px"
  stage-choice-selected:
    backgroundColor: "transparent"
    textColor: "{colors.green}"
    typography: "{typography.label}"
    padding: "15px 17px"
  chapter-menu:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.green}"
    padding: "48px 55px"
---

# Design System: IMAGO

## Overview

**Creative North Star: "A life held in focus"**

The visual world gives a tiny animal the compositional weight of a portrait. Fine biological surfaces, clear support relationships, and an unhurried editorial voice carry the experience. Imagery occupies meaningful space; the interface remains quiet and useful.

The implemented system uses macro compositions and limited photographic layers, with large serif headings beside narrow sans-serif observations. The selected Hero A defines the entrance: a single opaque green chrysalis to the right, with title and invitation to the left. These images are artistic reconstructions, not a recorded specimen.

**Key Characteristics:**

- A single protagonist, physically grounded in its setting.
- Tactile macro imagery with soft light from the upper left.
- Spacious editorial reading outside the subject's identifying features.
- Stage-specific motion and stillness.
- A gradual color progression from pale egg to jade pupa to orange-and-black adult.

This record was merged against `src/style.css`, `src/content.ts`, `src/engine.ts`, `src/widgets.ts`, and `src/main.ts`, with the corresponding patterns sampled in the compiled `dist` assets. It documents source implementation, not a browser-test verdict. The primitive values above follow the source; the sidecar carries motion, breakpoints, and component examples.

The existing detector report records 97 advisory findings: 82 font sizes and 15 colors outside this deliberately small token set. These findings are not resolved by expanding the system to include every local value. The final bounded verdict in [the finish review](docs/finish-review.md) closes all six scored finish fixes with `disposition: ship`. The emergence title and introduction now occupy a clear paper field above the photograph in the recorded 1440px, 851px, and 390px views. This verdict covers the six scored fixes and their supplied composition and recorded-state evidence; it does not certify the whole surface or continuous motion.

## Colors

The palette uses warm paper and green as the primary reading relationship, with orange becoming material in the adult chapters.

### Primary

- **Deep leaf** (`green`): headings, wordmark, strong focus of the interface, the egg chapter's dark field, and field notes.
- **Chrysalis jade** (`jade`): biological middle-stage identity and the browser scrollbar accent.

### Secondary

- **Wing orange** (`orange`): later-stage imagery, active emergence thumbnails, hover emphasis, and keyboard focus.

### Neutral

- **Bone ivory** (`paper`): the main page ground, header, dialogs, and text over leaf-dark fields.
- **Charcoal** (`ink`): default text.
- **Leaf gray** (`muted`): introductory prose, captions, secondary observations.
- **Pale rule** (`line`): fine comparison and navigation boundaries.
- **Dark-field rule** (`light-line`): dividers within dark scenes.

**The Material Color Rule.** Color follows the organism and its environment; orange is not scattered across the early story as generic decoration.

## Typography

**Display Font:** Cormorant Garamond, with Georgia and serif fallbacks.  
**Body Font:** Inter, with Arial and sans-serif fallbacks.

Latin subsets are imported locally: Cormorant Garamond regular 400, italic 400, and regular 500; Inter regular 400 and 500. Their CSS uses `font-display: swap`. Source font notices are preserved under `docs/licenses/`.

### Hierarchy

- **Display:** the `h1` token above is the default desktop IMAGO wordmark. It becomes a fluid portrait heading at the mobile breakpoint.
- **Headline:** the `h2` token is the general chapter scale. Individual scenes adjust it to fit their actual title and composition.
- **Title:** smaller observation headings use the serif title role.
- **Body:** chapter introductions use the body role, usually within roughly 39–55 characters per line depending on the scene.
- **Label:** controls and compact explanations use the sans-serif label role; chapter indices use smaller tracked labels and tabular chapter numbers beneath their headings.

Italic serif lines are used for part of a title or a deliberate reflective sentence. Explanatory paragraphs remain sans-serif. Font fallback, line wrapping, and small-caption readability still require the browser checks recorded separately.

**The Heading First Rule.** Chapter titles lead. Place the chapter number and category beneath the heading; never introduce an above-heading category eyebrow.

## Layout

The default page gutter and chapter block spacing appear in the frontmatter. Large layouts constrain their horizontal content against a 1680px working width. The fixed header is 76px by default, becomes 66px at the 850px breakpoint and 62px at the 700px breakpoint, and grows to 88px from 2500px.

Desktop chapters alternate between two-column observation layouts, broad images, paired comparisons, and a large emergence composition. Typography has stable reading space outside the subject. Handoffs use a sticky image area beside an editorial statement; image phases are discrete states, with progress shared by the stage and its small rule indicator.

At 701px and above, the emergence chapter gives its title and metadata a normal-flow reading area above the photograph, beside the introduction. This uses a 1.1fr/0.9fr grid with a 7% gap and 40px separation before the image. The introduction is capped at 43ch. The earlier negative overlap is superseded; this text-only change leaves the photograph's framing and the layout at 700px and below unchanged.

The two developmental handoffs keep their explanatory SVG in the text column, outside the photographic region. Their desktop divisions are 62%/38%, then the reverse; at the narrow breakpoint, the full 3:2 photograph precedes the text and a compact diagram/caption row. The ending also preserves a complete 3:2 scene: the resting and empty views use containment, so the branch, adult support, and shell are not cropped to fill a shorter strip.

At 700px and below, chapters become a vertical reading sequence. The Hero loads a separate portrait image, with the complete attachment above the text. Chapter controls wrap or occupy a full row, and emergence thumbnails become a two-column set. The side-by-side observer remains available. At 359px and below, gutters and heading sizes reduce further. Short landscape viewports receive a taller natural-flow entrance instead of squeezing the composition into one short screen.

## Elevation & Depth

Depth comes from a foreground leaf edge, the clear middle subject, and a softly receding environment. The desktop Hero starts with a complete still, then may upgrade to three decoded layers. The foreground has a bounded scroll-related translation. Mobile preserves the independent portrait composition rather than those desktop layers. At the very-wide breakpoint, the Hero images use containment; the scene container supplies the surrounding ground while every layer image keeps a transparent background. Alpha layers do not receive their own opaque rectangular matte.

Interface surfaces remain flat: there is no component box-shadow vocabulary. Dialogs use an opaque paper surface and a dark translucent backdrop. The reading interface is not glass, a neon instrument panel, or a floating product-card collection.

**The Still Subject Rule.** The chrysalis has no invented breathing or spinning loop. Stage changes use prepared images; reduced motion retains observation controls and still views.

## Shapes

The organism's silhouette is the dominant shape. Most imagery, reading divisions, and navigation rules use straight edges without card rounding. Circular sequence and close buttons provide a compact identifiable target; the small chapter-position indicator has the only recurring pill outline. Borders are thin, not decorative frames around every scene.

## Components

### Chapter headings

The semantic chapter heading comes first, followed by the numbered category line, then the introduction. The category line is supporting chapter metadata, not a kicker above the title. Its top separation is 18px by default and 15px at 700px and below. The title and metadata stay together when the introduction moves into a neighboring column.

### Story links

Text and a small inline arrow sit above a fine current-color rule. Hover moves the arrow slightly. Focus uses the orange outline shared by all actionable elements. These links remain ordinary anchors for chapter access.

### Stage choices

A group of native buttons sits on a shared bottom rule. The selected item has `aria-pressed="true"` and a short stronger underline. Keyboard handling supports arrow keys, Home, and End, with a single selected tab stop per choice family. Selection changes explicit observation state; scrolling does not submit it.

### Sequence buttons

Circular native buttons have a pale rule at rest and a leaf-green fill with paper-colored arrow on hover. Disabled end states visibly reduce opacity. Their accessible names identify previous and next emergence views.

### Navigation and chapter menu

The fixed header provides a wordmark, desktop stage links, a motion setting, and the chapter-menu control. Stage links disappear at the tablet breakpoint, while the complete chapter navigation remains in a native dialog. The menu uses numbered rows and current-chapter coloring. Close and Escape paths restore focus in source logic.

### Observation table

Early, middle, and late views use a shared image region and a corresponding caption. The initial selected stage is middle. A separate side-by-side mode includes an optional native range comparison; the range is labeled and is not a biological-time controller. Reset restores middle, single view, and a halfway reveal position.

### Instar comparison

Five separately captioned views are cropped from one authored contact sheet. The image rows have unequal bounds, rather than equal fifths; the crop is centered on each recorded interval. These are asset registration data, not reusable spacing tokens.

| Instar | Vertical crop interval in the 1024px source |
| --- | --- |
| I | 60–175px |
| II | 190–330px |
| III | 340–513px |
| IV | 520–713px |
| V | 720–965px |

The gallery uses five columns by default, three at 850px and below, and one at 700px and below. Each image window has a 4.5:1 aspect ratio. Relative display sizes remain explicitly schematic, not a measured growth chart.

### Developmental bridge

A real inline SVG carries the interpretive relationship between pupal reorganization and adult structures. It uses an unfilled envelope, dashed wing outlines, and a central axis, with the same green as the surrounding text. Its visible caption reads “Developmental schematic — not measured internal imagery.” The diagram remains a sibling to the photograph rather than being painted over a specimen.

The first developmental handoff reveals the diagram after its initial surface-only moment; reduced motion keeps it visible. In the later handoff, the diagram contracts to 74% and removes the envelope and stage list as the outward wing pattern becomes visible. These are explanatory state changes, not measured internal anatomy or a simulated biological morph.

### Departure

Chapter 10 rests on a complete opaque artwork of the adult gripping the rim of its shell beneath the branch. The empty scene and transparent flight layer are hidden in this resting state. “Watch it leave” synchronously exchanges the resting image for the empty scene and flight layer, then runs the finite departure animation (2.2s). The alpha layer is hidden again when the departure completes; it is never the resting animal.

“See the final view” skips directly to the empty scene. “Return to the branch” restores the supported opaque artwork. Reduced motion resolves departure directly to the final view, and a departure already underway completes when the tab is hidden. Disabled button states and a live status sentence reflect the current state.

### Media recovery

An image that fails has a stage-specific embedded fallback and an explicit retry control. The compact paper recovery notice sits over imagery. Failure handling and its visual result are documented separately in the verification evidence; this design record does not establish a guarantee about every network condition.

### Motion and sound

The motion control cycles automatic, reduced, and full modes. Lenis has one manually driven RAF path; reduced motion uses native scrolling. The optional sound control starts off and creates a softly filtered synthetic air soundscape only after user action. It is labeled as composed sound, not field-recorded insect audio.

## Do's and Don'ts

### Do:

- Do preserve a complete attachment and subject outline in every key view.
- Do place important text outside the biological features it explains.
- Do keep chapter titles above their numbered category metadata.
- Do use the same light, camera direction, and registration for comparison views.
- Do keep developmental diagrams outside photographs and visibly label their interpretive status.
- Do retain visible material texture in late-stage pupae.
- Do treat every generated image as an artistic reconstruction and document its provenance.
- Do preserve every content beat and control in reduced-motion and narrow layouts.

### Don't:

- Don't turn the chrysalis into glass, jade jewelry, or a silk cocoon.
- Don't replace difficult emergence geometry with overlapping translucent adults.
- Don't bring full adult orange into the early chapters as generic decoration.
- Don't add words, controls, logos, or factual labels inside generated bitmap art.
- Don't use an above-heading category eyebrow or a transparent flight cutout as the resting adult.
- Don't use full-screen flashes, obligatory entrance sequences, or scroll locks.
- Don't mistake a concept image for browser evidence.
