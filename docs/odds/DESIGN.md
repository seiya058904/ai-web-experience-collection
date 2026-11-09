# ODDS — A playground for chance — design record

Supplied complete work, imported unchanged in identity, copy, imagery, controls and timing on 9 November 2026.

## Story

One ball, eight choices and nine places to land; ten chapters build from a single path to a 256-ball portrait and an apparatus with your own rules.

## Voice

Manrope (variable) on warm paper (#F2EDDF) with a cobalt board. The Collection gallery entrance uses the same faces from existing Collection URLs.

## Motion and lifecycle

One Lenis instance with `autoRaf: false` on the work's own requestAnimationFrame loop, `lerp: 0.13` as supplied. No GSAP and no second clock. Probabilities are exact enumerations; samples are replayable pseudorandom rounds. The playground persists under `odds.playground.v1`. Lenis starts only without reduced motion.

## Collection boundary

- Page: `pages/odds/index.html`; source: `experiences/odds/src/`; runtime files and notices: `public/odds/`.
- Runtime URLs are prefixed with `import.meta.env.BASE_URL + 'odds/'`; fonts are local `@font-face` rules (see `public/odds/NOTICE.md`).
- The shared Collection return control sits in the work's own header.
- Supplied design and verification records are kept unchanged under `provenance/odds/upstream/`: `DESIGN.md`, `PRODUCT.md`, `docs/research.md`, `docs/acceptance.md`, `docs/sources-and-licenses.md`.
