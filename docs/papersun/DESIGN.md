# PAPERSUN — A fable cut from light — design record

Supplied complete work, imported unchanged in identity, copy, imagery, controls and timing on 11 November 2026.

## Story

An original cut-paper fairy tale in eleven chapters. Mira, a lantern-repairer, follows a red thread across a paper city to find three pieces of its missing sun, repairs a lantern, steadies a wind-wheel, lifts a shade, and stitches the pieces into one circle.

## Voice

Cormorant Garamond (400, 400 italic, 500) on a deep blue-ink and warm paper palette (#18233b, #efe4cf). The Collection gallery entrance reuses Cormorant faces already requested by the Collection.

## Motion and lifecycle

One Lenis instance (`autoRaf: false`, `lerp: .13`, `syncTouch: false`) driven by the GSAP ticker with ScrollTrigger, as supplied. Smooth wheel is off in the work’s own reduced-motion mode. Progress persists under `papersun:story:v1`; motion preference under `papersun:motion`. Sound is opt-in and synthesized in code.

## Collection boundary

- Page: `pages/papersun/index.html`; source: `experiences/papersun/src/`; runtime files and notices: `public/papersun/`.
- Runtime URLs are prefixed with `import.meta.env.BASE_URL + 'papersun/'`; fonts are local `@font-face` rules (see `public/papersun/NOTICE.md`).
- The shared Collection return control sits in the work’s own header.
- The reading edition is `public/papersun/story.html`; its links to the interactive page stay relative.
- Supplied design, source, rights and verification records are kept unchanged under `provenance/papersun/upstream/`.

Preserve the three interlocking fragments and their exact geometry, the eleven chapters, the scene actions, the stitched sun, the red thread, the transition props, the text edition (`story.html`) and the “Begin again” reset.
