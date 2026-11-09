# RALLY — The Space Between — design record

Supplied complete work, imported unchanged in identity, copy, imagery, controls and timing on 9 November 2026.

## Story

One clay-court exchange in ten moments: a topspin ball, a return you choose, and how that choice changes what follows.

## Voice

Barlow Condensed for display and DM Sans for reading, with a slate (#243840) and clay palette. The Collection gallery entrance uses the same faces from existing Collection URLs.

## Motion and lifecycle

One Lenis instance with `autoRaf: false` on the work's own requestAnimationFrame loop, `lerp: 0.14` as supplied. No GSAP and no second clock. Trajectories come from a deterministic educational model (`physics.ts`). The rally persists under `rally-the-space-between-v1`. Lenis starts only without reduced motion.

## Collection boundary

- Page: `pages/rally/index.html`; source: `experiences/rally/src/`; runtime files and notices: `public/rally/`.
- Runtime URLs are prefixed with `import.meta.env.BASE_URL + 'rally/'`; fonts are local `@font-face` rules (see `public/rally/NOTICE.md`).
- The shared Collection return control sits in the work's own header.
- Supplied design and verification records are kept unchanged under `provenance/rally/upstream/`: `docs/design-spec.md`, `docs/physics.md`, `docs/acceptance.md`, `docs/sources-and-licenses.md`.
