# CHRYSALIS — The architecture of becoming — design record

Supplied complete work, imported unchanged in identity, copy, imagery, controls and timing on 11 November 2026.

## Story

An illustrated macro journey through the monarch butterfly life cycle in eleven observations, from an egg on milkweed to first flight, with scientific caveats and cited sources.

## Voice

Libre Caslon Display and Source Sans 3 on a milkweed-green and cream palette (#173924, #e7e7cf). The Collection gallery entrance uses the Collection’s Pelagic Cormorant and Backstage Sans.

## Motion and lifecycle

One Lenis instance (`autoRaf: false`, `lerp: .12`, `syncTouch: false`) on the work’s own requestAnimationFrame loop, as supplied; no GSAP. Reading position is restored on reload. Motion and view (immersive or stills) persist under `chrysalis-motion` and `chrysalis-view`.

## Collection boundary

- Page: `pages/chrysalis/index.html`; source: `experiences/chrysalis/src/`; runtime files and notices: `public/chrysalis/`.
- Runtime URLs are prefixed with `import.meta.env.BASE_URL + 'chrysalis/'`; fonts are local `@font-face` rules (see `public/chrysalis/NOTICE.md`).
- The shared Collection return control sits in the work’s own header.
- Artwork is AI-assisted natural-history illustration, not photography or measured observation.
- Supplied design, source, rights and verification records are kept unchanged under `provenance/chrysalis/upstream/`.

Preserve the eleven observations, the transition stage ledger, the diagrams and their interactions, the reading checkpoint/position recovery, per-image loading with fallbacks and the text edition (`reading.html`).
