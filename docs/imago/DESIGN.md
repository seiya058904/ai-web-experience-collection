# IMAGO — Wings within — design record

Supplied complete work, imported unchanged in identity, copy, imagery, controls and timing on 9 November 2026.

## Story

One monarch butterfly in ten chapters: egg, caterpillar, chrysalis and adult, with observation tools (egg zoom, instar rows, pupation stages, comparison reveal, wing detail) and a departure ending.

## Voice

Cormorant Garamond for display and Inter for reading on a pale ivory ground (#EFEDE1) with deep green ink (#173E34). The Collection gallery entrance uses the same faces from existing Collection URLs.

## Motion and lifecycle

One Lenis instance with `autoRaf: false` on the work's own requestAnimationFrame loop, `lerp: 0.16` as supplied. No GSAP and no second clock. The settled hero photograph is the critical image; layered alpha plates only replace it once all three decode. Media recovery swaps in embedded low-resolution fallbacks and offers a retry. Observation state lives in sessionStorage (`imago:observations:v1`); scroll restoration is manual by design, so a reload starts at the top.

## Collection boundary

- Page: `pages/imago/index.html`; source: `experiences/imago/src/`; runtime files and notices: `public/imago/`.
- Runtime URLs are prefixed with `import.meta.env.BASE_URL + 'imago/'`; fonts are local `@font-face` rules (see `public/imago/NOTICE.md`).
- The shared Collection return control sits in the work's own header.
- Supplied design and verification records are kept unchanged under `provenance/imago/upstream/`: `DESIGN.md`, `PRODUCT.md`, `docs/biology.md`, `docs/sources-and-licenses.md`, `docs/verification.md`.
