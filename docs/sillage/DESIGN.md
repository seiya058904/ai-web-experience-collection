# SILLAGE — The shape of scent — design record

Supplied complete work, imported unchanged in identity, copy, imagery, controls and timing on 9 November 2026.

## Story

A ten-chapter visual essay that gives brightness, spice and warmth a visual language, then lets you compose and export your own impression.

## Voice

Cormorant Garamond for display, DM Sans for reading on a warm paper ground (#F3EDE1) with dark brown ink (#29211E). The Collection gallery entrance uses the same faces from existing Collection URLs.

## Motion and lifecycle

One Lenis instance with `autoRaf: false` on the work's own requestAnimationFrame loop, `lerp: 0.16` as supplied. No GSAP and no second clock. Composition shares, title and still-mode preference persist in localStorage under `sillage:`. The export workbench prepares a PNG preview separately from saving it. Source links are context only and are labelled that way.

## Collection boundary

- Page: `pages/sillage/index.html`; source: `experiences/sillage/src/`; runtime files and notices: `public/sillage/`.
- Runtime URLs are prefixed with `import.meta.env.BASE_URL + 'sillage/'`; fonts are local `@font-face` rules (see `public/sillage/NOTICE.md`).
- The shared Collection return control sits in the work's own header.
- Supplied design and verification records are kept unchanged under `provenance/sillage/upstream/`: `DESIGN.md`, `PRODUCT.md`, `docs/DIRECTION.md`, `docs/SOURCES.md`, `docs/TEST-REPORT.md`, `docs/VISUAL-REVIEW.md`.
