# BERTH — One night. Ten quiet moments. — design record

Supplied complete work, imported unchanged in identity, copy, imagery, controls and timing on 9 November 2026.

## Story

A night-train story in ten moments: two travellers, one compartment, a shared lamp and a first line to take into the morning.

## Voice

Cormorant Garamond and DM Sans on a deep blue night ground (#182D38) with warm lamp light. The Collection gallery entrance uses the same faces from existing Collection URLs.

## Motion and lifecycle

One Lenis instance with `autoRaf: false` on the work's own requestAnimationFrame loop, `lerp: 0.16` as supplied. No GSAP and no second clock. Every scene image has an embedded preview from `assets/manifest.json` for recovery. State persists under `berth.user.v1`. Ambient sound is opt-in.

## Collection boundary

- Page: `pages/berth/index.html`; source: `experiences/berth/src/`; runtime files and notices: `public/berth/`.
- Runtime URLs are prefixed with `import.meta.env.BASE_URL + 'berth/'`; fonts are local `@font-face` rules (see `public/berth/NOTICE.md`).
- The shared Collection return control sits in the work's own header.
- Supplied design and verification records are kept unchanged under `provenance/berth/upstream/`: `DESIGN.md`, `PRODUCT.md`, `docs/architecture.md`, `docs/story-and-continuity.md`, `docs/verification.md`.
