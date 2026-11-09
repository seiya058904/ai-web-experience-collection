---
name: SENTE
description: A playable short story in black, white and the space between.
colors:
  wood: "#c6a476"
  ink: "#242a29"
  paper: "#f3f0e9"
  white: "#e7e6de"
  brown: "#544737"
  accent: "#884f42"
  muted: "#706353"
  line: "#c9c1b3"
  dark-muted: "#c1b9aa"
  dark-line: "#5a5d55"
typography:
  display:
    fontFamily: "Bodoni, Georgia, 'Times New Roman', serif"
    fontSize: "clamp(5rem, 8.25vw, 9rem)"
    fontWeight: 450
    lineHeight: 0.9
    letterSpacing: "-0.025em"
    fontVariation: '"opsz" 18'
  headline:
    fontFamily: "Bodoni, Georgia, 'Times New Roman', serif"
    fontSize: "clamp(3.25rem, 5.65vw, 5.75rem)"
    fontWeight: 450
    lineHeight: 1.04
    letterSpacing: "-0.035em"
    fontVariation: '"opsz" 18'
  title:
    fontFamily: "Bodoni, Georgia, 'Times New Roman', serif"
    fontSize: "1.7rem"
    fontWeight: 450
    lineHeight: 1.24
    fontVariation: '"opsz" 18'
  body:
    fontFamily: "Manrope, 'Segoe UI', sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.75
  control:
    fontFamily: "Manrope, 'Segoe UI', sans-serif"
    fontSize: "13px"
    fontWeight: 650
    lineHeight: 1.4
  field:
    fontFamily: "Manrope, 'Segoe UI', sans-serif"
    fontSize: "12px"
    fontWeight: 400
rounded:
  control: "2px"
  board: "5px"
  transition-board: "2px"
spacing:
  control-block: "14px"
  control-inline: "22px"
  section-block: "130px"
  section-inline: "60px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "14px 22px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "14px 22px"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "8px 0"
  coordinate-select:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.field}"
    rounded: "{rounded.control}"
    padding: "9px 28px 9px 12px"
  navigation:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
  feedback:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "24px 0"
  liberty-key:
    textColor: "{colors.muted}"
---

# Design System: SENTE

## Overview

**Creative North Star: "A quiet wooden table"**

SENTE places a precise, playable Go board on a quiet wooden table. Warm material, dark stones, clear empty intersections and generous editorial spacing carry the identity. English copy and native controls explain a local relationship without adding scores, ranks or decorative cultural motifs.

The delivered work uses a generated still environment, exact SVG boards and ordinary document flow. Its choreography consists of short stone decorations and small, scroll-derived diagram movements. It is not a continuous 3D camera film: the Hero does not tilt into Chapter 2, and the late transitions keep separate opaque positions visible instead of physically merging boards.

**Key Characteristics:**

- Exact seven-by-seven SVG boards over restrained generated wood.
- Bodoni display type, Manrope controls and real English DOM copy.
- Opaque independent positions with clear example and observation labels.
- Complete interaction in ordinary page flow, including reduced motion.

This is an implementation contract extracted from the shipped source and actual captured views. It records design decisions, not a claim that the original cinematic brief or every browser acceptance item passed. Detailed differences and evidence belong in [the chapter ledger](docs/CHAPTERS-AND-TRANSITIONS.md) and the acceptance report.

## Colors

The palette combines warm timber and paper with charcoal, ivory and one muted cinnabar accent. The frontmatter contains the actual CSS values.

- **Primary accent — cinnabar:** liberty rings, connection cues, selected-state marks and keyboard focus. Never the sole carrier of a rule result.
- **Wood and brown:** board surfaces, coordinate text and restrained structural detail.
- **Ink and white:** stones and principal light/dark contrast; the capture and choice chapters use the dark surface.
- **Paper:** normal reading surface and the gutters around the capped wide-screen Hero.
- **Muted text and line:** supporting copy and separators; the dark variants preserve the existing dark-section treatment.

The sidecar's tonal strips are swatch-preview extensions only, not additional colors implemented in the page.

## Typography

Bodoni supplies the serif display voice; Manrope supplies body and control text. Both are self-hosted, with the fallback stacks recorded above. Coordinates use the system monospace stack and SVG text, not a bitmap font.

The actual Bodoni asset supports optical size 6–96 and weight 400–900. The implementation fixes serif optical size at 18 and uses the recorded display weights so fine strokes remain readable over the wooden image. Smaller wordmarks and supporting serif details share that optical setting.

Chapter paragraphs generally use a 45-character measure. Their base size becomes 13px on small screens and 16px in the wide-screen treatment. Controls and annotations have their own compact hierarchy; do not apply the display scale to instructional text. Mobile Hero title sizes and chapter heading sizes use explicit responsive overrides.

**The Stable Letterform Rule.** Keep the serif optical size explicit; automatic display optical sizing produced fragile hairlines in the actual Hero screenshot.

## Layout

Desktop Hero copy occupies the left region; the exact board occupies the right region of the selected generated environment. At widths of 2200px and above, the Hero is capped at 2200px and centred on paper gutters. Its outside edges are an intentional frame, without repeating a mismatched wood tile.

At 999px and below, the Hero is recomposed as a full square board above the copy. The desktop photograph is hidden, and the separate material asset supports the responsive board. The Hero may exceed one viewport.

Chapter containers normally cap at 1330px, with the section spacing recorded above. The wide treatment uses a 1600px container. At 999px and below, principal board/copy pairs become one column; at 600px and below, comparison and evidence diagrams stack as needed. P1/P2 have result text and an Undo control immediately below their boards at 999px and below, while retaining the complete instructional controls.

The page remains in normal scroll flow. The fixed header is 78px on desktop and 65px on small screens; chapter links, scrolling and browser history do not submit moves.

## Elevation & Depth

Material and contact shadows create depth. Runtime photography supplies the desktop table and waiting stones; SVG gradients and close shadows supply the rule stones. Reading surfaces stay largely flat.

- **Board contact:** `0 22px 44px -23px #3d281759, 0 5px 6px -3px #37251757`.
- **Transition board contact:** `0 9px 18px -9px #61482b4d`.
- **Wide Hero frame:** `0 18px 50px #54473714`.

**The Separate Position Rule.** Every independent setup keeps its own opaque board and identity; shadows must never suggest a duplicate stone or combine two positions.

## Shapes

Boards are squares with lightly softened corners. The desktop Hero preserves the photo's small aspect adjustment while keeping the SVG and hit targets aligned. Stones are curved circular forms; liberties are fine rings and protected targets use a small triangle. Buttons and fields are restrained rectangles. The favicon combines an exact small grid with one black and one white stone.

## Components

### Controls and navigation

Primary buttons use ink on light surfaces and reverse on dark surfaces; secondary buttons retain a quiet outline. Text actions use a fine underline. Pointer hover is short and restrained, focus has an explicit cinnabar outline, and disabled controls remain distinguishable. Main buttons have a minimum height of 48px; small actions and fields generally use 44px. These values do not imply every dense board intersection is a 44px target.

The chapter menu is a native dialog with Close and Escape paths. Sound begins off. No decorative image contains an official control, title or coordinate.

### Exact boards and feedback

Each active intersection has a native button, coordinate and English accessible name. The SVG is the visual layer; the rules engine determines the board before any decoration. Keyboard movement follows the grid, and the three puzzles also offer coordinate selectors. Feedback explains a legal result or rejection in text. The adjacent mobile P1/P2 feedback copies the actual result and offers Undo at the point of action.

### Editorial transitions

There are nine boundaries and 23 read-only transition boards. The first five boundaries show one source and one destination. TR-06-07/TR-07-08 include both current P2 branches; TR-08-09 includes two clearly labelled P3 outcome examples and a separate K1; TR-09-10 includes all three actual observation-note boards.

All figures remain present across each boundary. Scroll geometry changes the explanatory step, thread marker and small group displacement. Early boundaries use up to 16px translation and 2° rotation; later boundaries use up to 8px horizontal movement, or 6px vertical movement in the compact layout. There is no pin, forced replay, opacity blend, camera handoff or staged physical board merge.

Lenis runs from one manual animation frame loop. Reduced motion uses native scrolling, removes diagram transforms and new stone decorations, and retains the complete explanation. Placement decoration lasts 150ms; captured copies lift 12px and fade over 180ms. This does not depict stones travelling into a bowl.

### Assets and closing note

Only two generated-image derivatives are required at runtime:

| Runtime asset | Actual role |
| --- | --- |
| `public/assets/sente-hero-table.webp` | IMG-04 desktop environment, with an unruled board under the exact overlay |
| `public/assets/sente-board-material.webp` | IMG-09 material for responsive and standalone boards |

The other generated images remain art references in `art/concepts/`; their generated positions are never game data. The ending uses three SVG observation panels, real attempt labels and a downloadable SVG note. Its decorative closing stone is CSS; it does not reconstruct the original Hero stone on a wider empty board.

## Do's and Don'ts

### Do:

- Do keep authoritative stones, coordinates, liberties and focus targets in code.
- Do preserve the fixed optical size of the serif display treatment when extending headings.
- Do keep mobile puzzle feedback and Undo beside the board that just changed.
- Do label independent examples and unplayed observation panels truthfully.
- Do retain the full story, board interaction and export when motion is reduced.

### Don't:

- Don't bake a playable grid, answer, control or label into generated imagery.
- Don't overlap unrelated positions or move stones between independent setups.
- Don't add glow, celebratory scores, cultural props or claims of playing strength.
- Don't turn the editorial transitions into claims of a finished camera film.
- Don't tile the wood material outside the capped wide-screen Hero.

