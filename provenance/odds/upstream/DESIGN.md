---
name: ODDS
description: A tactile probability apparatus in cream, ultramarine and terracotta.
colors:
  blue: "#244ab8"
  blue-hover: "#17388f"
  cream: "#f2eddf"
  orange: "#e87942"
  ink: "#252827"
  body-text: "#4f554e"
  sage: "#879a88"
  muted: "#5d625a"
  rule: "#d1ccbf"
  focus: "#b0461d"
  control-surface: "#f6f2e8"
  control-ink: "#354039"
typography:
  display:
    fontFamily: "Manrope Variable, Manrope, Arial, sans-serif"
    fontSize: "clamp(52px, 5.35vw, 86px)"
    fontWeight: 600
    lineHeight: 1.055
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Manrope Variable, Manrope, Arial, sans-serif"
    fontSize: "clamp(40px, 3.8vw, 64px)"
    fontWeight: 600
    lineHeight: 1.055
    letterSpacing: "-0.04em"
  body:
    fontFamily: "Manrope Variable, Manrope, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.7
  control:
    fontFamily: "Manrope Variable, Manrope, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 400
  label:
    fontFamily: "Manrope Variable, Manrope, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 600
  accent:
    fontFamily: "Georgia, Times New Roman, serif"
    fontWeight: 400
    letterSpacing: "-0.04em"
rounded:
  route: "3px"
  control: "4px"
  secondary: "5px"
  primary: "6px"
  dialog: "8px"
spacing:
  tight: "6px"
  compact: "8px"
  related: "12px"
  standard: "16px"
  section: "24px"
  heading: "28px"
components:
  button-primary:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.cream}"
    rounded: "{rounded.primary}"
    padding: "15px 20px"
    height: "54px"
  button-primary-hover:
    backgroundColor: "{colors.blue-hover}"
    textColor: "{colors.cream}"
    rounded: "{rounded.primary}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.secondary}"
    padding: "11px 16px"
    height: "44px"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "10px 0"
  select:
    backgroundColor: "{colors.control-surface}"
    textColor: "{colors.control-ink}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "12px 30px 12px 12px"
    height: "44px"
  probability-option:
    backgroundColor: "transparent"
    textColor: "{colors.blue}"
    rounded: "{rounded.control}"
    height: "48px"
  probability-option-selected:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.cream}"
    rounded: "{rounded.control}"
    height: "48px"
  route-option:
    backgroundColor: "transparent"
    textColor: "{colors.blue}"
    rounded: "{rounded.route}"
    padding: "8px 9px"
    height: "34px"
---

# Design System: ODDS

## Overview

**Creative North Star: "A tangible place for chance"**

ODDS is a small probability exhibit with physical presence: a warm cream room, a substantial ultramarine pegboard, and orange balls whose journeys remain inspectable. Its tone is curious and composed. The apparatus carries the visual interest; prose and controls sit alongside it as short, usable exhibit notes.

The design follows the supplied palette and material brief. IMG-04 is the selected desktop reference, with IMG-05 supplying an independent portrait study. The implementation rebuilds the subject in exact SVG and Canvas 2D, with a separately generated texture on the SVG board. This allows the number of levels, endpoints, samples and selected paths to remain truthful. It approximates the reference's light and material rather than reproducing a photograph or providing free-camera 3D.

This document extracts the current source system from `src/style.css`, `src/scene.ts`, `src/charts.ts` and `src/content.ts`. It also takes account of the selected reference and the final desktop screenshots. It is **not a visual acceptance verdict**: full responsive, transition and recovery QA is blocked and incomplete. Later source changes should be checked against these extracted values.

**Key Characteristics:**

- A blue apparatus with visible edges, recessed slots and a warm grounded shadow.
- Cream negative space around readable English copy.
- Orange observed balls and explicitly labelled, dashed theoretical references.
- Exact route and sample identities beneath the tactile visual treatment.
- Reserved movement that explains a path or a structural handoff.

## Colors

The palette joins a warm neutral environment to a strong blue object and a restrained orange focal point. Primitive values in the frontmatter reflect the current implementation; component gradients add material depth rather than redefining the palette. The sidecar's eight-step tonal strips are synthesized panel previews, not additional stylesheet colors.

### Primary

- **Ultramarine blue:** apparatus body, primary actions, active route controls, selected probability states and key mathematical labels.
- **Deep blue hover:** the primary action's darker hover state.

### Secondary

- **Terracotta orange:** actual sample balls, the selected journey, the brand dot and text selection. It represents observed activity rather than success or winnings.
- **Sage:** the theoretical-reference family. Renderer-specific lighter and darker sage variants keep the reference readable against different surfaces; a dashed stroke and explicit label carry its meaning.

### Neutral

- **Warm cream:** page, header, bottom navigation and dialog surfaces.
- **Graphite ink:** primary text and controls; body prose uses the slightly softer body-text value.
- **Muted olive-grey:** captions, secondary explanations and compact data labels.
- **Warm rule:** dividers between notes, form rows and data.
- **Light control surface:** native selectors, with a dark green-grey control-ink value.
- **Burnt-orange focus:** visible keyboard outlines, distinct from the blue action fill.

**The Evidence Rule.** Orange observations and theoretical references must also differ by shape, stroke and words. Color alone cannot establish which quantity is being shown.

## Typography

**Display and body:** locally bundled Manrope Variable, with Manrope, Arial and sans-serif fallbacks. Its broad counters keep short statements open and approachable.

**Selective accent:** Georgia, Times New Roman and serif fallback, set in italic in code. It appears in a few words and numbers, including “trace” and “256”. This is an actual implementation choice; the system-serif accent is not a downloaded additional font and can vary across operating systems.

Desktop Hero text uses the display token; chapter headings use the headline token. Body copy normally uses the body token and a relatively short measure of 39 characters to remain separate from the apparatus. Lead copy is slightly larger and more open. Controls and small data labels use compact Manrope; numeric counts use tabular figures when specified in the stylesheet.

At mobile widths the Hero scales between 42 and 62 pixels and chapter headings between 36 and 54 pixels. Body copy becomes 14 pixels. Above the wide-screen breakpoint, the current stylesheet uses a 92-pixel Hero and 68-pixel chapter headings. These are recorded implementation values, not evidence that every long heading has passed viewport and zoom inspection. The compact 8–11 pixel visual captions require particular care during accessibility review; essential information also appears in DOM copy and data tables.

**The Real Text Rule.** Headings, actions, errors, sample details and exported fixed text are English DOM or programmatic text. Generated image lettering never supplies an essential label.

## Layout

The ordinary desktop view uses a fixed header, a left reading column and a sticky right apparatus. The story's maximum width is 1900 pixels. The current right visual rail occupies 59% and the copy column 43%, with internal padding separating their actual content. A fluid side gutter grows from 24 to 92 pixels. The normal header is 94 pixels high and the bottom progress rail 54 pixels.

Chapters remain in normal document order. Their generous minimum heights and bottom spacing provide a stable reading interval followed by a reversible transition. In the narrative evaluator, the first 58% of a measured chapter span is stable and the remaining 42% drives the adjacent handoff. This is a common initial timing model; it does not prove the nine boundaries have equivalent pacing or meet every frame in the brief.

The intermediate layout changes at 1100 pixels. At 760 pixels and below, the opening title stays in normal document flow. Its measured lower edge sets the initial position of the full-width apparatus below it; subsequent scrolling pins the apparatus below the header. Supporting copy and controls follow that reserved scene area. Scene height is normally 40svh and becomes 37svh at 360 pixels and below. Key SVG labels have mobile-specific sizes, and the three-round comparison uses vertical trays. These late corrections have source/build checks, but their short-screen usability, visual balance and touch behavior still require browser confirmation. A short-height desktop adjustment activates below 620 pixels.

Controls sit with their relevant chapter. The workbench's selectors occupy their own rows, while the selected-ball detail is a compact result slip. The large apparatus is not a screenshot-based input surface. The chapter dialog and native anchors offer direct navigation; no scroll snap or forced continuation is part of the design.

## Elevation & Depth

Depth belongs primarily to the apparatus. The board combines a slightly offset dark back edge, a blue face gradient, inset collection slots, peg shadows and a soft floor ellipse. The shared SVG view is 1000×900 units. At the entrance, a mild matrix projection supplies a three-quarter suggestion; the mobile view removes that projection. This is constructed two-dimensional depth, not a physical collision or full three-dimensional renderer.

The separate production tile, IMG-09 at `public/art/material.webp`, adds subtle mineral variation. In the SVG board it repeats at 180 scene units and uses 0.14 opacity with soft-light blending. The exact geometry stays underneath it. If the texture is absent, the gradients and model remain; the user must not lose the apparatus or its results.

### Shadow Vocabulary

- **Primary action:** a small downward shadow (`0 5px 12px rgba(36,74,184,.10)`) helps the action sit above the paper.
- **Dialog:** the deeper navigation shadow (`18px 32px 90px #25282744`) separates the chapter chooser from its backdrop.
- **Storage notice:** a compact soft shadow (`0 5px 25px #25282721`) distinguishes a recovery message.
- **Board:** SVG shadow offset 18/26 units, standard deviation 18, warm flood color with 0.22 opacity.
- **Tray:** SVG shadow offset 8/12 units, standard deviation 8, warm flood color with 0.17 opacity.
- **Peg:** SVG shadow offset 4/7 units, standard deviation 3, deep-blue flood color with 0.42 opacity.

**The Grounding Rule.** Keep the upper-left light and lower-right contact shadows coherent. Extra glowing outlines, transparent duplicate balls or arbitrary camera sweeps would obscure the apparatus rather than enrich it.

## Shapes

The board is a rounded rectangular physical object with a distinct back edge and recessed openings. Its corners are broader than the restrained control corners. Ball silhouettes are circles with a small upper-left highlight and darker lower edge; they do not resemble transparent glass or particles.

UI corners follow the observed route, control, secondary, primary and dialog radii in the frontmatter. Native selects remain recognizable. Route choices use small rectangular tiles; probability options form a simple row. Notes and result slips use horizontal rules rather than a stack of rounded cards. The wordmark's small orange dot echoes a ball without introducing a separate icon family.

## Components

### Primary actions

Solid blue, warm-cream text, gentle corners and a small offset shadow. Desktop actions are at least 54 pixels high and mobile actions 50 pixels. Hover darkens the fill and moves the control upward by two pixels; active state returns it to its baseline. This short 150 ms response is local to the control. A visible burnt-orange focus outline remains independent of hover.

### Secondary and text actions

Secondary actions have a thin neutral border and transparent background. Text actions use clear underlining and a modest underline offset; neither needs a container panel. Disabled controls use reduced opacity and a not-allowed cursor. Replay, restore and undo belong beside the result they affect.

### Native selectors and probability options

Selectors use the light control surface, a single border and conventional native selection behavior. Labels remain outside the field. Probability and comparison-size options use `aria-pressed` to identify the selected value; the selected state uses the primary fill. A control change is described accurately: the bias option starts a new round, while workbench form values wait for explicit submission.

### Paths and result slips

Direction tokens display L or R, with an outline for the inspected step. Route buttons show actual enumerated sequences. The result slip pairs a real sample identifier with its directions and endpoint; selecting it never changes the experiment. The visual path and text details come from the same saved sample.

### Data references

Observed samples are orange; expected counts use a dashed reference, a legend and a shared count scale. Exact path multiplicities occupy the theory chapter before the unit conversion. Expandable data tables provide parameters, probabilities, counts and relative frequencies without placing every number over the apparatus. Charts are data geometry, not decorative AI artwork.

### Navigation and motion

The fixed header includes the wordmark, workbench link, sound toggle and chapter menu. The bottom rail identifies the current chapter and provides chapter links plus the motion preference. A native dialog contains chapter navigation, with close/focus handling implemented in the application. Keyboard behavior remains subject to the final browser pass.

Lenis uses one application-owned RAF with autoRaf disabled and a 0.13 interpolation setting. Reduced motion destroys the instance and uses native scrolling with stable chapter frames. Playback supports pause, step, immediate result and replay, and does not commit another sample. The background page pauses playback. These are source behaviors, not claims that the complete lifecycle matrix has already passed.

## Do's and Don'ts

### Do:

- **Do** retain the warm cream, ultramarine and terracotta identity.
- **Do** derive every live path, endpoint, count and selected sample from the probability state.
- **Do** keep theoretical units and observed units explicitly labelled and comparable.
- **Do** use the generated references for composition and material, with exact SVG/Canvas geometry for interaction.
- **Do** preserve native text, controls and complete chapter content when reducing motion or losing an image.
- **Do** treat the current mobile ordering and compact captions as items to inspect, not as automatically approved design rules.

### Don't:

- **Don't** use a generated peg layout or painted ball count as experiment data.
- **Don't** sample again because of scrolling, resizing, replay, delayed resources or a renderer change.
- **Don't** combine the three teaching rounds into the middle round's portrait.
- **Don't** add gambling cues, rankings, coins, luminous particle rain or unexplained physical claims.
- **Don't** claim photographic equivalence, arbitrary-view 3D, physical-device testing or complete browser acceptance without evidence.
