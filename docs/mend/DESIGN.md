# MEND — Still Yours — design record

Supplied complete work, imported unchanged in identity, copy, imagery, controls and timing on 9 November 2026.

## Story

A story about repairing an old wooden toy dog: inspect, choose a plan, try it, compare and keep what matters.

## Voice

Newsreader for display and DM Sans for reading on warm paper (#F4EBDD). The Collection gallery entrance uses the same faces from existing Collection URLs.

## Motion and lifecycle

One Lenis instance with `autoRaf: false` on the work's own requestAnimationFrame loop, `lerp: 0.13` as supplied. No GSAP and no second clock. The live Three.js toy loads lazily; a still-view mode keeps the photographs. The chosen plan persists under `mend.choice.v1`, the motion preference under `mend.motion`.

## Collection boundary

- Page: `pages/mend/index.html`; source: `experiences/mend/src/`; runtime files and notices: `public/mend/`.
- Runtime URLs are prefixed with `import.meta.env.BASE_URL + 'mend/'`; fonts are local `@font-face` rules (see `public/mend/NOTICE.md`).
- The shared Collection return control sits in the work's own header.
- Supplied design and verification records are kept unchanged under `provenance/mend/upstream/`: `DESIGN.md`, `PRODUCT.md`, `docs/ART_DIRECTION.md`, `docs/ACCEPTANCE.md`, `docs/SOURCES.md`.
