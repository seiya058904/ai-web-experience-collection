# INKSCAPE visual system

## The work

One continuous sheet. Eight material movements. The interface belongs at the edges. Warm ivory (`#f3f0e8`), carbon (`#25241f`), restrained warm grey (`#69675f`), one late vermilion impression (`#a33a2c`). A source image is a material, never a finished section.

Cormorant Garamond 300/400 and 400 italic carry exhibition-scale typography. Manrope carries navigation and short captions. IBM Plex Mono is reserved for sequential chapter numerals. No card grid, decorative cultural ornaments, marketing badges, statistics, or stock-photo presentation.

## Scene compositions

| Movement | Stable frame | Authored visual mechanism | Handoff |
| --- | --- | --- | --- |
| Water | Large central INKSCAPE lettering, ivory space, a pale bloom to the right | Irregular wetting boundary and pointer water traces | Water takes on pigment |
| Ink | Dense organic bloom on the right; two-line type left | Capillary contours, settling pigment, interactive drops | The same wash finds a paper plane |
| Paper | Three thin deckled sheets on the left, type right | Layer separation, tilt, fold and moving cast shadows | The paper edge opens into a bristle path |
| Trace | Dry brush swept from lower left to upper right | Pressure-shaped bristle drawing and wet/dry control | Bristles magnify into cellulose |
| Fiber | Large material lens on the left, type right | Pointer-controlled optical view, seeded fiber layers | Fiber edges become folds |
| Space | Folded paper opening on the right, type left | Hinged planes, perspective, negative space | A plane leaves a single gesture |
| Mark | Vertical dry trace left, invitation right | Original geometric seal impressions placed by the visitor | The visitor's trace enters the final work |
| Inkscape | Central final statement, wash below, paper above right | Material recomposition and retained impressions | Begin again |

## Motion contract

Each movement uses enter 0–20%, stable composition and living hold 20–72%, material handoff 72–100%. One scroll source, one GSAP ticker. Scene assembly derives from scroll position; time only controls small living detail. At most the outgoing and incoming expensive material scenes render. No document-wide transformed scroll wrapper or independently pinned sections.

Use a CSS sticky stage and an explicit scroll range. Lenis supplies wheel/touch smoothing and shares GSAP's clock. Typography and controls remain HTML. Canvas, paper planes and photographic material assets occupy separate layers. All transitions remain deterministic when reversed. Refresh and meaningful resize preserve normalized journey position. Browser history stores only that normalized progress; a change in motion preference must never restore an old pixel offset into a new scroll range. During handoff, the departing typography gives up its space before the next statement arrives, leaving a short interval for the material itself to carry the composition.

## Responsive and accessible behavior

Desktop scenes alternate their spatial centers. Mobile uses the upper portion for type and the lower portion for material; it does not scale down desktop layouts. Navigation and material controls support keyboard operation. The index is a native dialog. Reduced motion uses stable compositions, direct scrolling, a shorter journey and no autonomous material drift. The unenhanced HTML remains readable if JavaScript fails.

## Asset treatment

Original generated material studies only: transparent ink bloom, fiber macro, ink wash, transparent bristle stroke, a vertical dry gesture and deckled paper. Photos of museum works are references only and are not distributed. Runtime fonts and assets are local. No stock image tint overlays. Transparency, original deckled edges and material-driven masks carry compositing.
