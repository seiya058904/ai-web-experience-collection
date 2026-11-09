---
name: SILLAGE
description: An original visual essay on the shape of scent.
colors:
  paper: "#f3ede1"
  ink: "#29211e"
  muted: "#65564d"
  line: "#cabead"
  brightness: "#e7b353"
  brightness-control: "#a66a16"
  spice: "#594051"
  warmth: "#8a6750"
  print-paper: "#f7f2e8"
typography:
  display:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(66px, 7.3vw, 106px)"
    fontWeight: 400
    lineHeight: 0.96
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(44px, 5.3vw, 80px)"
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "36px"
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.65
  control:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.65
  quiet-control:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
  title-input:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "26px"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  square: "0"
  focus: "2px"
  circular: "50%"
spacing:
  gutter: "clamp(24px, 6.2vw, 120px)"
  chapter-top: "120px"
  chapter-bottom: "100px"
  compact-gutter: "24px"
  control-gap: "24px"
  reading-gap: "48px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.control}"
    rounded: "{rounded.square}"
    padding: "17px 27px"
  button-primary-hover:
    backgroundColor: "{colors.spice}"
    textColor: "{colors.paper}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.quiet-control}"
    padding: "9px 0"
  link-action:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    padding: "12px 0"
  title-field:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.title-input}"
    rounded: "{rounded.square}"
    padding: "8px 40px 10px 0"
    width: "100%"
  chapter-navigation:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    height: "80px"
  choice-text:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    typography: "{typography.control}"
    padding: "12px 0"
  vocabulary-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "20px 0 21px"
    width: "100%"
  imprint:
    width: "100%"
  print-frame:
    backgroundColor: "{colors.print-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "28px 38px 30px"
---

# Design System: SILLAGE

## Overview

**Creative North Star: "An impression held by its empty space"**

SILLAGE is an editorial visual essay with a matte, tactile material world. A fine apricot ridge, a close aubergine fold and a low porous brown plane share one recognisable hollow. The artwork carries the atmosphere; restrained English typography and native controls carry its meaning.

This document records the implemented system in `src/style.css`, `src/artwork.ts`, `src/transitions.ts`, `src/layout.ts` and `src/main.ts`. Tokens describe the code at this documentation pass, not a rendered acceptance verdict. The supplied brief and `PRODUCT.md` establish the artistic boundary: shapes, proportions, stages and memories are original interpretations, not transmitted scent or measured perfume behaviour. The limited research claims and retrieval qualifications are in `docs/SOURCES.md`.

**Key Characteristics:**

- One recurring empty hollow with an upper-left nick.
- Warm paper, dry material detail and quiet structural shadows.
- Serif display type paired with clear sans-serif reading and controls.
- Open editorial layouts, reversible relationships and meaningful personal choices.
- Separate portrait compositions and complete still-mode equivalents.

## Colors

The palette combines warm paper and brown ink with three named material identities. The frontmatter retains the actual CSS values; it does not alter asset colour with a global tint.

### Primary

- **Apricot Brightness:** the thin, sharp ridge and its small identifying marker. Its darker control companion is used for a readable slider thumb.

### Secondary

- **Aubergine Spice:** the folded plane, focus outlines and selected or hovered emphasis.

### Tertiary

- **Dry-Wood Warmth:** the low porous plane and its identifying marker.

### Neutral

- **Ivory Paper:** the page and opaque fixed header.
- **Brown Ink:** primary text, strong rules and the principal export action.
- **Warm Muted Ink:** supporting prose and explanations.
- **Paper Rule:** thin separators and understated field boundaries.
- **Print Paper:** the slightly lighter presentation of the final keepsake frame.

**The Three Voices Rule.** Every accent has a name and a distinct contour or texture; colour is never the only identifier.

## Typography

**Display Font:** Cormorant Garamond, with Georgia and serif fallbacks. Regular, medium and regular italic Latin faces are bundled.  
**Body Font:** DM Sans, with a sans-serif fallback. Regular and medium Latin faces are bundled.

The pairing gives the work a literary voice while leaving actions and explanatory text plain. Display tracking is tight; paragraphs keep a normal reading rhythm. The font files cover Latin; user titles retain their text and use available system fallback for other scripts.

The desktop roles are in the frontmatter. At the compact breakpoint, the Hero uses 65px type, chapter headings use 47px and base text uses 14px. The narrowest layout reduces the Hero to 56px and chapter headings to 41px. Wide layouts use a 110px Hero. Supporting prose is generally limited to 48–66 characters per line. These role-specific changes are not a general permission to shrink essential text.

**The Real Type Rule.** Titles, percentages, instructions, memory copy and export labels remain real text; generated art never supplies their semantics.

## Layout

The page alternates open two-column studies, comparisons, long paths, memory fragments and a large editable composition. Reading copy stays in document flow. A small chapter-number rail provides orientation without turning each section into a poster. The fixed header and bottom utilities share the paper surface and respect safe-area spacing.

| Layout boundary | Implemented decision |
| --- | --- |
| At most 1100px wide | Gutter becomes 40px; columns and gaps tighten. |
| At most 760px wide | Gutter becomes 24px; header becomes 66px. The portrait Hero leads into text below. Studies, comparisons, memories and the editor reorganise vertically. |
| At most 359px wide | Gutter becomes 20px; display scale and secondary gaps reduce. |
| At least 1900px wide | Most chapters receive an approximately 1660px content field; the Hero's alignment is based on a 1700px field. |
| Desktop width with height at most 700px | Hero, sticky stages and chapter dialog receive explicit short-screen handling. |

The Hero and CH-08 panorama each have an independent portrait source selected by `<picture>`. The mobile panorama preserves its full 2:3 composition with all three stages. It is not a central crop of the landscape panorama. Stage buttons change the local framing and readable result; mobile uses a smaller scale change than desktop.

Nine handoff runways provide continuous relationships between the complete chapter layouts. Their three reusable print slots are evaluated from current progress; mobile changes the arrangement to a vertical sequence. Still mode removes sticky travel and presents the complete target relationship. Scene geometry may use controlled clipping; required prose and controls remain reachable in the document.

## Elevation & Depth

Depth belongs mainly to the artwork. The UI is predominantly flat, with thin rules and a restrained active-stage shadow. The SVG renderer uses exact contour masks, material-atlas sampling, connected facets and parameter-driven soft shadows. Its apparent thickness changes with the selected visual shares. These gradients and shadows describe the dry relief; they are not glossy surface decoration for interface panels.

The active panorama control uses `0 4px 20px rgb(41 33 30 / 10%)`. Range thumbs use a narrow one-colour outline. Focus uses a visible two-pixel aubergine outline offset by five pixels. The sidecar carries these extension values and the implemented motion timings.

**The Quiet Depth Rule.** Keep controls flat at rest and reserve structural depth for the impression itself.

## Shapes

The impression's identity is defined in `src/artwork.ts`: the 1000×780 viewBox, authored inner curves, stable `HOLLOW_PATH` and `sillage-open-hollow-v1` identity. Shares modify outer contour area, crease rhythm and relief depth. They do not replace the work with generic circles or blobs. A zero share omits that component; the hollow remains empty rather than acquiring an invented yellow edge.

The material atlas supplies three horizontal texture bands. The renderer clips those bands to its exact shapes. Interface frames and text fields are square; small circles and an angled marker identify or operate controls. Rounded cards are not part of this implementation.

## Components

### Actions and navigation

The principal action is a brown-ink rectangular button with paper text and an aubergine hover state. Secondary actions use thin underlines. Inline SVG arrows share one slender stroke language. All actions retain the global focus treatment. The chapter index is a native dialog with a bounded scroll area, two columns on desktop and one on mobile. Closing returns focus to its opener unless a chapter navigation has taken place.

### Vocabulary and stage selectors

Vocabulary rows combine a named shape marker, serif name and concise association. Selected rows expose a real isolated component and accompanying text. Stage choices use `aria-pressed`; their comparison figures retain their own names and text equivalents. The panorama selection also produces a nearby readable result. Hover is an enhancement, not the sole way to understand a choice.

### Shares and title

Three native range controls are paired with numeric inputs. Their labels and markers stay distinct. `src/state.ts` owns integer redistribution, the 100 total, presets, title handling and versioned restoration. The title is an understated serif field. Its 64-character limit counts Unicode code points, not UTF-16 units; user text is rendered as text.

### Parametric impression and handoffs

`src/artwork.ts` is the geometric source of truth for editable previews, comparisons and exported figures. `src/transitions.ts` applies directly evaluable local compositions to reusable instances. `src/main.ts` supplies a single manual RAF to Lenis and the active narrative state. Personal choices, subtraction demonstrations and memory preferences remain separate. A stopped or reversed scroll does not submit a choice.

### Final print, fallback and sound

The final frame contains the current title, three stages and shares. `src/export.ts` reuses the same renderer, embeds a local texture where available, waits for fonts and checks state identity around asynchronous work before creating its PNG. Simplified vector rendering preserves geometry if a raster or texture fails. These are code paths; final export and failure-mode acceptance must be established by the test report.

Optional original tones are off until explicitly enabled. They add atmosphere without carrying required information. Still mode and silence retain the complete story.

### Asset authority

`docs/art-generation.json` records twelve actual original PNG outputs: three Hero candidates, refined desktop and portrait Heroes, the chord, landscape and portrait panoramas, the transition midpoint, a texture atlas and two memory still lifes. Eight are the required unique outcomes; four are supplementary. Original PNGs and their prompts remain in the documented paths; the runtime uses listed WebP derivatives. No seed or model version was returned, so none is asserted. The image record is provenance, not a whole-site visual pass.

## Do's and Don'ts

### Do:

- Do preserve the hollow's geometric identity across comparisons, edits, revisits and export.
- Do pair each colour with its name and its own edge or texture.
- Do keep essential text and controls semantic, readable and in the document flow.
- Do use the portrait Hero and panorama sources for the compact composition.
- Do evaluate narrative motion from current progress and retain every chapter in still mode.
- Do report rendered, interaction and packaging evidence separately from source and unit checks.

### Don't:

- Don't introduce perfume bottles, glass refraction, gardens, petals, smoke clouds or room tours.
- Don't add glossy interface panels, generic card grids or arbitrary particle effects.
- Don't leave a coloured component visible when its share is zero.
- Don't use generated lettering or a fixed promotional image in place of current values and export.
- Don't turn the artwork's stages, distances or memories into scientific measurements or personality claims.
