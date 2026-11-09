# FRAME — A little move. A lot of life. — design record

Supplied complete work, imported unchanged in identity, copy, imagery, controls and timing on 9 November 2026.

## Story

A digital stop-motion story: 24 rendered frames of Boop pushing a red block into its yellow outline, a player, spacing presets and a worktable where you shape and export your own film.

## Voice

Manrope (variable) on a mint ground (#AED0C4) with charcoal violet ink. The Collection gallery entrance uses the same faces from existing Collection URLs.

## Motion and lifecycle

One Lenis instance with `autoRaf: false` on the work's own requestAnimationFrame loop, `lerp: 0.13` as supplied. No GSAP and no second clock. Frames and stills are pre-rendered WebP. The worktable history persists under `frame-boop-v1`. Lenis starts only without reduced motion.

## Collection boundary

- Page: `pages/frame/index.html`; source: `experiences/frame/src/`; runtime files and notices: `public/frame/`.
- Runtime URLs are prefixed with `import.meta.env.BASE_URL + 'frame/'`; fonts are local `@font-face` rules (see `public/frame/NOTICE.md`).
- The shared Collection return control sits in the work's own header.
- Supplied design and verification records are kept unchanged under `provenance/frame/upstream/`: `DESIGN.md`, `PRODUCT.md`, `docs/renderer.md`, `docs/delivery-limitations.md`, `docs/licenses.md`.
