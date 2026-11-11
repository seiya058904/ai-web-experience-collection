# NIGHTSHIFT — The city does not sleep at once — design record

Supplied complete work, imported unchanged in identity, copy, imagery, controls and timing on 11 November 2026.

## Story

A portrait of the invisible work that carries the fictional Meridian City from midnight into morning, in eleven chapters with before/after comparisons, an atlas, a rail section and a water diagram.

## Voice

Barlow Condensed 500/600, DM Sans 400/500 and Instrument Serif italic on a night-blue and amber palette (#0B1421). The Collection gallery entrance uses the Collection’s Barlow Condensed and Instrument Serif.

## Motion and lifecycle

One Lenis instance (`autoRaf: false`, `lerp: .115`, `syncTouch: false`) driven by the GSAP ticker with ScrollTrigger, as supplied. Modes full, reduced and stills; the choice persists in `sessionStorage` under `nightshift-motion`.

## Collection boundary

- Page: `pages/nightshift/index.html`; source: `experiences/nightshift/src/`; runtime files and notices: `public/nightshift/`.
- Runtime URLs are prefixed with `import.meta.env.BASE_URL + 'nightshift/'`; fonts are local `@font-face` rules (see `public/nightshift/NOTICE.md`).
- The shared Collection return control sits in the work’s own header.
- Every picture is AI-generated and none documents real people, places or services.
- Supplied design, source, rights and verification records are kept unchanged under `provenance/nightshift/upstream/`.

Preserve the eleven chapters, the stage layers and handoffs, the before/after controls, the diagrams, per-image fallbacks and the still reading edition (`story.html`).
