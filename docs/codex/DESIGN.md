> Supplied design/source record, integrated into the Collection on 2026-10-07. Original `src/` paths refer to `experiences/codex/src/`, runtime `public/` assets to `public/codex/`, and concept/export records to `provenance/codex/`. Current lifecycle and path changes are in [INTEGRATION.md](INTEGRATION.md); current checks are in [ACCEPTANCE.md](ACCEPTANCE.md).

# CODEX — visual direction and implementation contract

## Authority

The explicit user brief controls the identity. Ten selected 1536 × 1024 image-generated key frames in `art-direction/` establish the complete visual bible before application coding. Direction: a contemporary black-cloth sewn case binding inside a museum-publishing stage. The user's precise material and narrative commitments override alternatives from the concept seed. No redesign approval is needed because implementation of this complete brief is explicitly requested.

## Tokens

- Museum black `#151513`; deeper stage `#10110f`.
- Paper ground `#eee9dd`; sheet `#f6f0e2`; paper edges `#d6cbb6`.
- Ink `#24251f`; light copy `#eee9dd`; secondary ink `#69675d`.
- Linen `#b69b6b`; foil `#b79650`, confined to stamped type and a thin edge.
- Marbling: charcoal, subdued sage, bone, and a small ochre accent.
- No UI cards or pills. Open composition; 1 px rules and drawn line controls.

## Type

Self-hosted Cormorant Garamond roman and italic (300–700) for display, physical stamped cover type and considered small body copy. Manrope (200–800) for navigation and colophon. Desktop display uses roughly 7vw, with mobile about 14vw. Actual line breaks are the concept's line breaks; body copy is short. All real UI is DOM text. Cover typography is baked into a physical material map plus recessed bump and thin metallic letter geometry/texture, never a floating HTML label.

## Frame

Header: CODEX left; The anatomy of a book in the center; Contents + right. Quiet chapter label bottom-left; Roman-numeral progress rail bottom-right. Scene numbers encode the actual ordered process. Content index is an accessible full-viewport contents sheet. No unrelated navigation.

Desktop: wide negative-space editorial copy left, material world right. The material changes from whole volume to close paper, repeated gatherings, spine macro and floating case. MARBLE uses the entire viewport and places copy near lower-left. Mobile: copy at top, physical object below; signatures stack vertically and the camera moves closer rather than compressing every page.

## Allowed copy

1. The anatomy / of a book. — A study in paper, thread and the quiet architecture of a bound object. — Begin the binding.
2. Before the book, / a sheet. — Flat, but never without depth. Light finds the fibres. A fold finds the grain.
3. Order begins / with a fold. — A crease gives the sheet an axis. A gathering gives it depth.
4. Many parts. / One intention. — Folded sections find their order. The space between them disappears.
5. A line becomes / structure. — Connection gives the pages a spine.
6. The quiet / backbone. — A thousand edges. One continuous body.
7. An ordered / kind of chance. — The pattern becomes part of the binding.
8. A body, / held together. — The structure receives its enclosure.
9. Pressure leaves / an impression. — Type becomes part of the material. A trace of gold catches the light.
10. A book. / At last. — Paper. Thread. Pressure. Everything held. Nothing extra. — Open the cover. — Bind again.

Accessible utility copy for Contents, Close contents, chapter navigation, Motion on/off and Colophon is a necessary functional extension. No additional marketing or proof text.

## Real material systems

One Three.js world handles actual sheet geometry, nested folded signatures, page edges, through-fold structural sewing on three transverse tapes, spine lining, endbands, hinged boards, wrapping turn-ins, pressed foil type and final opening. The prologue is a selected AI photographic still; its fore-edge leads into the live geometry without an explosion. The end state is a live book, preserving the object rather than going to a reader.

A separate Canvas marbling layer applies deterministic displacement/combing to an original selected AI marbling plate. The bath responds to input; after transfer the same image remains attached and stationary on the endpaper. This is an artistic material model, not a numerical fluid simulation.

## Motion architecture

Lenis alone controls smooth scroll. One requestAnimationFrame advances Lenis and the visible scene. Each chapter has enter, stable/living hold, handoff and exit. Geometry is a pure function of absolute chapter position, so quick and reverse scrolling cannot accumulate assembly errors. Camera and material response are restrained. Input-caused micro light and crease motion are permitted during holds.

Support reduced motion and an explicit motion control; no autoplay audio. Cap DPR, shader cost, page count and canvas activity. Pause background rendering when the document is hidden. No remote production fonts, CDNs, analytics or APIs.

## Curatorial decisions

- Reject first CASE concept because the board collided with type; selected revision separates them.
- Select black cloth over leather or antique decorative bindings to honor the contemporary direction.
- Reduce the PRESS concept's loose gold foil area in live geometry; the title and thin edge remain the only metallic emphasis.
- Use source-derived structural discipline for sewing and separate case construction; do not replicate generated images' simplified decorative stitches literally.
- Treat the sequence as an editorial craft study. Cover stamping and edge gilding do not imply a universal manufacturing chronology.

## Verification

Compare selected key frames with actual desktop/mobile screenshots. Verify each scene, chapter navigation, touch scroll, reduced motion, quick/reverse scroll, cover open/close, replay, no console/resource errors, local assets, production build and portable project subpath. Keep temporary screenshots outside the final project.
