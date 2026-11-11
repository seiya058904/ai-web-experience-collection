# PULSE — An atlas of one heartbeat — design record

Supplied complete work, imported unchanged in identity, copy, imagery, controls and timing on 11 November 2026.

## Story

An illustrated anatomical atlas in eleven plates: chambers, valves, the electrical signal, return of blood from the body and the lungs, wall thickness and the whole circuit. Educational, not diagnostic.

## Voice

Cormorant Garamond with DM Sans on a near-black wine palette (#130c10). The Collection gallery entrance uses the Collection’s Pelagic Cormorant and DM Sans.

## Motion and lifecycle

One Lenis instance (`autoRaf: false`, `lerp: .14`, `syncTouch: false`) driven by the GSAP ticker with ScrollTrigger, as supplied. The document is pre-rendered HTML, so the complete atlas reads without JavaScript. Motion preference persists under `pulse-motion`; sound is opt-in and illustrative, not a heart recording.

## Collection boundary

- Page: `pages/pulse/index.html`; source: `experiences/pulse/src/`; runtime files and notices: `public/pulse/`.
- Runtime URLs are prefixed with `import.meta.env.BASE_URL + 'pulse/'`; fonts are local `@font-face` rules (see `public/pulse/NOTICE.md`).
- The shared Collection return control sits in the work’s own header.
- `pages/pulse/index.html` is the supplied static render (`scripts/render-static.mjs`) with the Collection head, base-aware URLs and return control; that script is not run in the Collection build.
- Supplied design, source, rights and verification records are kept unchanged under `provenance/pulse/upstream/`.

Preserve the eleven plates and their pre-rendered SVG diagrams, the “Read the diagram” results, transition contracts, the atlas controls, the still view and the “illustration, not a medical image” statements.
