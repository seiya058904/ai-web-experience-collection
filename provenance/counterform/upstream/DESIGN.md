# COUNTERFORM — design system

The user's brief is the visual authority. The seven concepts in `docs/concepts/` are selected composition references, created before implementation. Font glyphs, anatomy, and physical printing correctness take precedence over inaccuracies in generated lettering.

## Surface

Mode: Experience. One specimen sheet becomes a series of spaces: void, incision, impression, comparison, drawing, working poster, final cover. Native typography is the artwork.

## Tokens

| Token | Value | Role |
| --- | --- | --- |
| Paper | `#eeeae1` | Main light ground |
| Ink | `#20211e` | Type, structure, final ground |
| Rust | `#b93d2c` | Counter contour, proof marks, emphasis |
| Mineral | `#7a8d95` | Live specimen ground |
| Stone | `#cbc3b4` | Carving scene ground |
| Light rule | `rgba(32,33,30,.24)` | Baselines and editorial divisions |
| Gutters | `clamp(20px,3.4vw,132px)` | Continuous edge alignment |

## Typography

Fraunces upright and italic: editorial headings and historical-form specimens. Roboto Flex: navigation, controls and live composition. Both fonts are local licensed binaries. Body sizes scale with the viewport up to a bounded 4K size. Display size is intentionally monumental per the brief; body/controls never inherit display scaling.

Headings use controlled breaks and restrained negative tracking. Serif/Sans outline comparisons match visible cap height, not CSS font size. Every anatomy guide uses the selected font instance's actual metrics.

## Structure and controls

Open editorial fields, thin rules, square control affordances, a quiet masthead and a seven-position chapter rail. No cards. Native range inputs, one editable English specimen field, reset and a chapter index. The index protects keyboard focus while selecting a chapter; its contents include motion preference and source notes.

## Motion

One application RAF feeds Lenis, a deterministic scroll director and the active WebGL scene. Material renderers and the native type handoff have no independent RAF. Every chapter contains a stable hold. Each adjacent handoff moves the existing specimen toward an actual destination before exchanging its surface. Artwork stays present; explanatory copy has a separate, shorter departure so it clears the specimen's path. The counter contour follows the actual SVG transform or projected material surface, including the reversed metal face. User axis state has separate ownership from scroll state.

## Responsive

Desktop: expansive two-column compositions, open side control margin. Mobile: stacked title/specimen, cap-height-matched side-by-side comparison, compact accurate anatomy legend, poster above native controls. Viewports below 700 px high default to the complete reading layout. Reduced-motion uses the same semantic scenes in normal flow.

## Asset treatment

No generated concept pixels render in the application. All letterforms use actual font glyphs. Carved stone and metal are procedural meshes from exact outlines; letters are never painted as generated images. References remain in the design documentation.

## Finish decisions

The mineral ground was adjusted from the concept's #768991 to #7a8d95 so normal control text clears 4.5:1 contrast with the ink color. Functional captions, axis descriptions, navigation and final settings have an 11px minimum. Monumental specimen type retains the deliberately close display leading specified by the brief.

The mechanical scan's cream/paper, Fraunces/Roboto, uppercase folio tracking and cropped-specimen findings are governed by this project's explicit paper-and-ink type-exhibition brief. The stage intentionally clips monumental glyphs and scene transitions; the chapter dialog is outside that clipped stage. These choices do not authorize clipping copy or controls.

## Refined edition — V2

The complete R is visible at arrival. Its counter remains a real unfilled hole at every opening scroll position; no solid negative-shape layer fills it during a dissolve. Scrolling completes the counter contour and settles the specimen by 2.5%, within the title and masthead boundaries. The original seven-scene identity, palette, typefaces and editorial copy are retained.

The focal event remains the material press. MARK → PRESS contracts the stone toward the die, using one renderer and two cached material views on a fixed composition canvas. SPACE → MARK and DIVIDE → ANATOMY align the same real R before the new surface arrives. PRESS → DIVIDE carries the printed paper toward the serif comparison. ANATOMY → LIVING contracts the specimen toward a small explicit counter signature, which carries the motif into user-defined text without pretending arbitrary words contain an R.

LIVING → PAGE presents one native text layer measured from both real layouts. Its positions and real font size change together while the frame and supporting copy settle around it. The variable axes remain those chosen by the visitor, and the original accessible headings retain their layout underneath.

Chapter selection uses a 480 ms direct transition to the chosen composition, interruptible by the visitor. Ordinary scrolling remains fully reversible. Interactive controls wait for a readable panel. Focus belongs to the visitor after they touch or type; no delayed heading timeout may reclaim it. The masthead has an opaque, paired foreground/background, avoiding a low-contrast crossing during the last chapter's color change.

Short viewports below 700 px use the continuous reading layout by default. During narrow-screen text entry, a shrunken visual viewport gives the form its own available space and local scrolling while the story position remains fixed. Native keyboard behavior still requires real-device verification.
