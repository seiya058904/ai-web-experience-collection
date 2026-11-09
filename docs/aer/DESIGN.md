# AER — Carried by Air — design record

Supplied complete work, imported unchanged in identity, copy, imagery, controls and timing on 9 November 2026.

## Story

An unhurried balloon journey in ten chapters: a ground experiment in buoyancy, three authored wind layers, a route that follows your choice and a keepsake of it.

## Voice

Cormorant Garamond for display, DM Sans for reading, on cream (#F6F1E8) with navy ink. The Collection gallery entrance uses the same faces from existing Collection URLs.

## Motion and lifecycle

One Lenis instance with `autoRaf: false` on the work's own requestAnimationFrame loop, `lerp: 0.18` as supplied. No GSAP and no second clock. A Three.js flight study loads lazily; photographic plates and the illustrated study are deliberately different views. Preferences persist under `aer.preferences.v1`; the reading position under `aer-position` in sessionStorage.

## Collection boundary

- Page: `pages/aer/index.html`; source: `experiences/aer/src/`; runtime files and notices: `public/aer/`.
- Runtime URLs are prefixed with `import.meta.env.BASE_URL + 'aer/'`; fonts are local `@font-face` rules (see `public/aer/NOTICE.md`).
- The shared Collection return control sits in the work's own header.
- Supplied design and verification records are kept unchanged under `provenance/aer/upstream/`: `docs/DESIGN.md`, `docs/CHAPTERS-AND-TRANSITIONS.md`, `docs/KNOWN-GAPS.md`, `docs/SOURCES-AND-LICENSES.md`, `docs/VERIFICATION.md`.
