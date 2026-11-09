# SENTE — Between moves — design record

Supplied complete work, imported unchanged in identity, copy, imagery, controls and timing on 9 November 2026.

## Story

A playable short story on a small Go board: ten chapters, three decisions and a note of what you observed.

## Voice

Bodoni Moda for display and Manrope for reading on warm wood (#C6A476). The Collection gallery entrance uses the same faces from existing Collection URLs.

## Motion and lifecycle

One Lenis instance with `autoRaf: false` on the work's own requestAnimationFrame loop, `lerp: 0.15` as supplied. No GSAP and no second clock. The rules engine and teaching positions are computed in code. Observations persist under `sente-observations-v1`; the note exports as SVG. Sound is opt-in.

## Collection boundary

- Page: `pages/sente/index.html`; source: `experiences/sente/src/`; runtime files and notices: `public/sente/`.
- Runtime URLs are prefixed with `import.meta.env.BASE_URL + 'sente/'`; fonts are local `@font-face` rules (see `public/sente/NOTICE.md`).
- The shared Collection return control sits in the work's own header.
- Supplied design and verification records are kept unchanged under `provenance/sente/upstream/`: `DESIGN.md`, `PRODUCT.md`, `docs/RULES-AND-LIMITS.md`, `docs/acceptance.md`, `docs/QA-REPORT.md`.
