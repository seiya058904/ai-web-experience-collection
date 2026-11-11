# CARGO — The same box, a changing world — design record

Supplied complete work, imported unchanged in identity, copy, imagery, controls and timing on 11 November 2026.

## Story

One fictional freight container, BOX-001, followed through eleven chapters: packing, doors, road, intermodal change, rail, a terminal, a crane lift, open water and arrival.

## Voice

Archivo (variable) with Barlow Condensed 600/700 on a graphite, paper and red palette (#283138, #edf0eb, #a64b3b). The Collection gallery entrance uses Magma’s Archivo and the Collection’s Barlow Condensed.

## Motion and lifecycle

One Lenis instance (`autoRaf: false`, `duration: .8`, `syncTouch: false`) driven by the GSAP ticker with ScrollTrigger, as supplied. A lazy Three.js container study has a complete SVG alternative. `?stills` and the motion toggle select the still edition; the choice persists under `cargo-motion`.

## Collection boundary

- Page: `pages/cargo/index.html`; source: `experiences/cargo/src/`; runtime files and notices: `public/cargo/`.
- Runtime URLs are prefixed with `import.meta.env.BASE_URL + 'cargo/'`; fonts are local `@font-face` rules (see `public/cargo/NOTICE.md`).
- The shared Collection return control sits in the work’s own header.
- The photographic scenes are AI-generated fictional industrial scenes, not a documented shipment.
- Supplied design, source, rights and verification records are kept unchanged under `provenance/cargo/upstream/`.

Preserve the shared container model, the eleven chapters, boundary transitions with their stage selectors, the inspection panels, the schematic fallback with Retry, and the still view.
