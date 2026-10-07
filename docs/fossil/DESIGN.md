---
name: "FOSSIL — Deep Time in Stone"
description: "Life becomes evidence, and time is held in stone."
colors:
  museum: "#141512"
  bone: "#e9e3d6"
  limestone: "#ddd4c4"
  preservation-ground: "#e5ddcc"
  ash: "#bfc1b9"
  warm-ground: "#e5dece"
  ink-light: "#20221d"
  folio-ink: "#22241e"
  muted: "#c2bfb5"
  muted-light: "#494b42"
  rule: "rgba(233,227,214,.55)"
  rule-light: "rgba(39,40,32,.45)"
  folio-rule: "#b8b0a0"
  veil: "rgba(20,21,18,.78)"
  focus: "#d8ac64"
  focus-light: "#765126"
typography:
  display:
    fontFamily: "'Bodoni Moda', Georgia, serif"
    fontSize: "clamp(140px,16.6vw,420px)"
    fontWeight: 400
    lineHeight: 0.87
    letterSpacing: "-.04em"
  display-italic:
    fontFamily: "'Cormorant Garamond', Georgia, serif"
    fontSize: "clamp(70px,6.3vw,154px)"
    fontWeight: 400
    lineHeight: 0.85
    letterSpacing: "-.035em"
  headline:
    fontFamily: "'Cormorant Garamond', Georgia, serif"
    fontSize: "clamp(62px,6.8vw,160px)"
    fontWeight: 400
    lineHeight: 0.96
    letterSpacing: "-.04em"
  title:
    fontFamily: "'Cormorant Garamond', Georgia, serif"
    fontSize: "24px"
    fontWeight: 400
    lineHeight: 1.8
    letterSpacing: ".015em"
  body:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.95
    letterSpacing: ".035em"
  body-small:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.85
    letterSpacing: ".015em"
  label:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "max(11px,.65vw)"
    fontWeight: 400
    lineHeight: 1.8
    letterSpacing: ".12em"
  label-control:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "max(11px,.65vw)"
    fontWeight: 500
    letterSpacing: ".25em"
  label-quiet:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "max(11px,.65vw)"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: ".035em"
  action:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.8
    letterSpacing: ".05em"
  link:
    fontFamily: "'Cormorant Garamond', Georgia, serif"
    fontSize: "23px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: ".075em"
rounded:
  square: "0"
spacing:
  gutter: "3.6vw"
  row-inset: "12px"
  inline-gap: "20px"
components:
  text-control:
    backgroundColor: "transparent"
    textColor: "var(--ink)"
    typography: "{typography.label-control}"
    padding: "0"
  arrow-link:
    backgroundColor: "transparent"
    textColor: "var(--ink)"
    typography: "{typography.link}"
  underlined-action:
    backgroundColor: "transparent"
    textColor: "var(--ink)"
    typography: "{typography.action}"
    padding: "6px 0 4px"
  quiet-action:
    backgroundColor: "transparent"
    textColor: "var(--ink)"
    typography: "{typography.label-quiet}"
    padding: "0"
  fine-range:
    backgroundColor: "transparent"
    textColor: "var(--ink)"
    rounded: "{rounded.square}"
    height: "30px"
    width: "100%"
  preservation-mode:
    backgroundColor: "transparent"
    textColor: "var(--ink)"
    padding: "6px 8% 8px 4%"
  reconstruction-mode:
    backgroundColor: "transparent"
    textColor: "var(--ink)"
    typography: "{typography.title}"
    padding: "6px 0 4px"
  chapter-rail:
    textColor: "var(--ink)"
    padding: "17px 0 0"
  index-row:
    backgroundColor: "transparent"
    textColor: "{colors.folio-ink}"
    padding: "12px 0"
  record-row:
    backgroundColor: "transparent"
    textColor: "{colors.folio-ink}"
    padding: "12px 0"
---

# Design System: FOSSIL — Deep Time in Stone

## Overview

**Creative North Star: "Time becomes evidence."**

FOSSIL joins museum display, geology, sculpture and scientific imaging. A stone object establishes weight and scale; layers, exposed boundaries, sections and records make its traces readable. The atmosphere is quiet, curatorial and tactile. Monumental native typography and generous open space let the specimen carry the image.

Material worlds change while the visual language remains continuous. Museum black supports the slab and grayscale sections; warm stone grounds support preparation and cataloging; ash holds the partial reconstruction. Amber is a concentrated exception created by transmitted light. Fine rules, true italic text and restrained controls hold these worlds together. Motion permits deliberate observation and reverse reading, with one scroll owner and one main animation clock.

This document records the implemented exhibit. The normative primitives are above; exact responsive, focus, motion and component extensions are in [.impeccable/design.json](.impeccable/design.json). Implementation evidence is [src/style.css](src/style.css), including its final overrides, [index.html](index.html), [src/app.js](src/app.js), [src/geology.js](src/geology.js) and [src/imaging.js](src/imaging.js). The durable world comes from [PRODUCT.md](PRODUCT.md) and [docs/VISUAL-BIBLE.html](docs/VISUAL-BIBLE.html); the latter also preserves scene references and their production decisions.

**Key Characteristics:**

- Monumental specimens, grazing light and native serif typography.
- Limestone, bone, ash and museum black, with amber confined to its material role.
- Fine catalog rules and transparent text controls instead of generic cards.
- Shared layers, contours, sections and incomplete geometry across the ten movements.
- Reversible progress, quiet optional motion and useful controls on small screens.

## Colors

The palette follows stone, paper, shadow and transmitted light; it is not a set of independent chapter themes.

### Primary

- **Focus amber** (`focus`) marks keyboard focus in the dark world. It is an interaction color, not a general fill for calls to action.
- **Focus umber** (`focus-light`) marks focus on light material and folio surfaces, and the chapter index uses it on hover.
- **Amber material** is carried by the resin image and its lighting. No flat honey swatch or synthesized amber ramp is defined as a shared interface primitive.

### Neutral

- **Museum black** (`museum`) is the common dark ground and the counter-color on light skip navigation.
- **Bone ivory** (`bone`) carries dark-world type and the open-folio paper surface.
- **Limestone** (`limestone`) establishes the light geological ground. **Preservation ground** (`preservation-ground`) supports the stone and its control baseline; **warm ground** (`warm-ground`) is reused by Exposure and Archive.
- **Ash** (`ash`) is the cool neutral field for reconstruction.
- **Light-world ink** (`ink-light`) and **folio ink** (`folio-ink`) provide the dark type appropriate to their respective surfaces.
- **Muted text** (`muted`, `muted-light`) supports short curatorial notes without replacing primary contrast for controls.
- **Rules** (`rule`, `rule-light`, `folio-rule`) divide catalog relationships and carry progress without enclosing content in boxes.
- **Veil** (`veil`) subdues the world behind a modal folio and supports a geological annotation over texture.

The application switches ink, muted text, rules, focus and color-scheme together. Ground blending is driven by chapter progress. Scene-specific ground variations remain in the scene controller rather than becoming an expanded generic color scale.

**The Material Color Rule.** Let the specimen supply color variation. Keep amber concentrated in resin and light, and keep imaging grayscale or quietly neutral.

## Typography

**Display Font:** Bodoni Moda, with Georgia and serif fallbacks.  
**Narrative Font:** Cormorant Garamond, with separate local regular and italic font files.  
**Body and Label Font:** Manrope, with Arial and sans-serif fallbacks.

The contrast is between the thin, monumental display, the more supple narrative serif, and small, legible sans-serif catalog text. All three families are bundled locally. Headings, labels, control text and physical-record lettering remain native text.

### Hierarchy

- **Display** uses the `display` role for the opening FOSSIL title. Its extreme scale is an intentional expression of the work.
- **Display italic** uses `display-italic` for the two-line opening subtitle. The sidecar records its true italic style, which the frontmatter schema cannot express.
- **Headline** is the common chapter-title baseline. An emphasized line normally grows slightly relative to the roman line. Specific chapter fits remain local to the composition; Preservation has its own smaller emphasized line to fit the reserved reading area.
- **Title** is the serif mode-selection role used by Outline and Volume. Narrative serif notes retain their distinct, locally authored sizing.
- **Body** is the short chapter-note baseline, usually limited to a narrow measure. The record folio uses `body-small` for longer explanatory paragraphs.
- **Label** is the annotation baseline; **label-control** gives Index and Close stronger weight, uppercase text and wider tracking. **Label quiet** supports secondary recovery actions such as Follow scroll.
- **Action** is the stronger underlined sans-serif control. **Link** is the serif directional action with a fine arrow.

There is no single modular type ratio: viewport-based clamps and deliberate chapter fits govern the large text. Common control and catalog annotations use the final readable label floor. Mobile reduces tracking as well as size; it does not reuse superseded tiny-label declarations as a general scale.

**The Native Lettering Rule.** Keep titles, navigation, catalog labels and controls in HTML. Use the local italic font for the italic voice; do not bake production typography into specimen images.

## Layout

The exhibit is a fixed, full-viewport world behind semantic chapter sections. Each visible composition places copy in a reserved reading region while material reaches the viewport edge. The default horizontal gutter is a shared primitive; the masthead and chapter rail align to it. Layers and contours hand the image between Specimen, Strata, Burial, Preservation, Exposure, Amber, Scan, Reconstruct, Archive and Deep Time.

The opening desktop composition uses an extremely large cropped slab and a large left-aligned title. Other chapters retain their own editorial placement. These are authored compositions, not a repeated grid of content cards. The record is the deliberate denser surface: a specimen image sits beside structured metadata and readable source text.

### Responsive behavior

| Range | Implemented behavior |
| --- | --- |
| Up to 700px | The gutter becomes fixed; title and copy occupy the upper area, with the object reframed below. The centered masthead subtitle and scroll cue disappear. The full ten-step rail remains. |
| 701–1100px | Typography, control widths and tick spacing tighten while the desktop composition model remains. Preservation mode numbers and secondary index descriptors are hidden. |
| From 2000px | The gutter and supporting typography expand to viewport-based sizes, retaining the same composition. |
| Height up to 620px, width from 701px | Display sizes follow viewport height; notes, folio spacing and controls compress for the short view. |

The mobile Scan contact sheet exposes the three middle previews. The native section slider still reaches all 72 sections. Reconstruction retains both display modes. Archive shows one compact summary row, with the full record available in its dialog. Index changes from two columns of five movements to one column; the specimen record changes from two columns to one.

The chapter span is computed from viewport height, with a shorter mobile span and a separate final-chapter height. The rail respects the bottom safe area on mobile. The exact measurements and responsive type overrides are recorded in the sidecar rather than promoted to a universal spacing grid.

## Elevation & Depth

Depth belongs primarily to material: grazing photographic light, irregular stone boundaries, sediment overlap, translucent resin, separated sections and the partial mesh's normals and occlusion. The interface has no shared card-shadow or elevation scale. Folios are flat, light sheets over a dark veil. Fine rules establish relationships; they do not imitate raised panels. The Scan transition's narrow local light and the renderer's material shading are scene effects, not general component elevation tokens.

**The Material Depth Rule.** Keep interface surfaces flat. Let lighting, texture, occlusion and the actual specimen or data geometry provide the depth.

## Shapes

Interface geometry is straight and precise: thin horizontal rules, square range thumbs, open text buttons and rectangular folios. The range control is a line with a narrow vertical marker. Arrow and close icons use a single fine stroke. Organic geometry belongs to the specimen, irregular beds, exposed boundaries and contours. The circular inspection cursor is a tool footprint, not a reusable pill or badge style.

Crop and alpha preserve the shape of the material. The slab and resin retain natural edges; mobile reframes them rather than reducing an entire desktop scene to a thumbnail. Masks change the reading of stone, dust and boundaries. Missing mesh regions remain part of the reconstruction.

## Components

### Buttons and directional links

Controls feel like concise exhibit annotations. Index and Close combine tracked sans-serif text with a small line glyph; hover rotates the glyph. Underlined actions use stronger sans-serif text and reduce opacity on hover. Quiet recovery actions use a lighter text underline. The serif arrow link carries entry, return and record-download actions; its arrow moves a short distance on hover when motion is allowed.

Buttons use inherited world ink and transparent backgrounds. There is no filled primary-button system. Focus is a visible outline with an offset, shared by buttons, links and inputs. The sidecar preserves exact focus, hover, disabled and responsive hit-area values rather than implying every visible control has identical dimensions.

### Inputs / Fields

The native range is the implemented input primitive. It has a fine current-color track, a square narrow thumb and a separate label/output row. Numeric outputs use tabular figures. Surface revealed spans a percentage; Section spans the complete virtual stack. The controls work independently of hover or precise brushing. There is no text-field, validation-error or search-input style to extrapolate.

### Navigation

The fixed masthead carries the wordmark, a widely spaced serif subtitle and Index. The chapter rail carries a sequential numeric chapter label, ten small ticks and a thin overall-progress line. Active ticks become thicker and fully opaque; hover increases opacity. The index is a native modal folio with numbered, ruled links to all ten movements.

The chapter number, name, current tick and index state follow the active scene. Inactive compositions are inert and removed from the accessibility reading state. Opening either folio pauses Lenis and background rendering; native dialog behavior manages modal focus, and closing restores scrolling. The skip link and semantic chapter content remain available.

### Preservation and reconstruction modes

Preservation offers four open text choices on a shared baseline, separated by fine vertical rules. A local limestone fade behind the desktop control area keeps the modes readable across material changes. The selected or hovered choice gains a short underline. Its labels and explanatory copy change together. Outline and Volume use a lighter serif variant of the underlined action, with a persistent underline on the selected mode. Both groups expose pressed state in native buttons.

### Specimen record and catalog rows

Catalog information is arranged as ruled rows and definition lists. The record dialog is a large bone folio with dark ink, a specimen image, short metadata, source links and a downloadable study record. It fills the mobile viewport. Long-form provenance belongs here; the main world retains sparse annotations. The internal study number must keep its identity as an artwork record.

### Scan, reconstruction and surface inspection

Scan first presents a complete generated specimen image, passes through a contour, and then presents a complete synthetic section. Manual section selection immediately gives the section full visibility and reveals Follow scroll. The contact sheet and current section consume the stored field; the reconstruction uses a partial mesh extracted from that same field. CPU rendering preserves the mesh and its gaps when WebGL is not used.

Surface inspection is a local optional action. The range controls matrix revelation; brushing clears loose dust. Leaving the chapter ends inspection, and Resume the sequence restores automatic revelation and clears brush marks. The native range remains the full alternative to the precision gesture.

**The Shared Evidence Rule.** Preserve the declared relationship among the stored synthetic field, its section images, contours and partial mesh. Keep generated specimen photography and synthetic imaging clearly identified as different representations.

Motion is calculated from one main clock and reversible chapter progress. The existing Lenis instance is the sole smooth-scroll authority. Background or modal states suspend rendering, and unchanged geological plates are retained until relevant state changes. Ambient motion can be paused; reduced motion presents stable scenes, keeps manual controls available and removes directional-arrow hover movement. The sidecar records the actual timing and rendering limits.

## Do's and Don'ts

### Do:

- **Do** preserve the monumental specimen scale, native serif hierarchy and reserved reading space.
- **Do** switch ink, muted text, rules and focus with the light or dark material world.
- **Do** use the final readable catalog-label scale and maintain visible keyboard focus.
- **Do** keep sequential chapter numbering and all ten movements accessible on mobile.
- **Do** retain all 72 section choices, both reconstruction modes and the same mesh in the CPU fallback.
- **Do** keep state derived from the shared scroll progression and preserve manual recovery controls.
- **Do** identify generated imagery, synthetic imaging and the internal study record honestly.

### Don't:

- **Don't** replace the material world with generic cards, capsule tags, dense dashboards or decorative medical HUDs.
- **Don't** use amber as a routine interface fill or turn grayscale imaging into a decorative color theme.
- **Don't** bake titles, navigation, controls or catalog lettering into production images.
- **Don't** present unmatched photograph and section halves as a measured registration.
- **Don't** complete missing reconstruction regions, depict revival or assign the amber inclusion a species identity.
- **Don't** invent collecting locality, specimen age, accession, physical scan measurements or verified provenance.
- **Don't** introduce another global scroll owner, independent scene animation loops or background rendering that ignores the existing pause states.

## Collection integration

The supplied design, imagery and ten-movement composition remain independent. Runtime ownership and base-aware resource/navigation adaptations are recorded in [ARCHITECTURE.md](ARCHITECTURE.md). [ACCEPTANCE.md](ACCEPTANCE.md) separates fresh integration checks from historical delivery QA; [IMPORT.json](../../provenance/fossil/IMPORT.json) contains source and final hashes. The first-scene gallery/social capture hides interface text only in the capture browser; it retains the actual generated specimen composition.
