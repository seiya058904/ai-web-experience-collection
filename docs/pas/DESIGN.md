# PAS — The distance between two people — design record

Supplied complete work, imported unchanged in identity, copy, imagery, controls and timing on 9 November 2026.

## Story

An original duet in ten movements for two rendered dancers, Cen and Cheng, with unison or echo timing and moments to revisit.

## Voice

Bodoni Moda for display and Manrope for reading on a warm sand ground (#C6B7A3). The Collection gallery entrance uses the same faces from existing Collection URLs.

## Motion and lifecycle

One Lenis instance with `autoRaf: false` on the work's own requestAnimationFrame loop, `lerp: 0.14` as supplied. No GSAP and no second clock. The default renderer plays the complete pre-rendered frame set (4,699 WebP frames, about 85 MB, plus posters and stills); `?renderer=webgl` loads the optional live Three.js stage with the two MakeHuman-based models. Preferences persist under `pas-timing` and `pas-motion`, the position under `pas-position` in sessionStorage.

## Collection boundary

- Page: `pages/pas/index.html`; source: `experiences/pas/src/`; runtime files and notices: `public/pas/`.
- Runtime URLs are prefixed with `import.meta.env.BASE_URL + 'pas/'`; fonts are local `@font-face` rules (see `public/pas/NOTICE.md`).
- The shared Collection return control sits in the work's own header.
- Supplied design and verification records are kept unchanged under `provenance/pas/upstream/`: `DESIGN.md`, `PRODUCT.md`, `docs/CHOREOGRAPHY.md`, `docs/RENDERING.md`, `docs/VERIFICATION.md`, `docs/MODEL-SOURCES.md`.
