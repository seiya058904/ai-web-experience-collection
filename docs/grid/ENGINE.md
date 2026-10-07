# The living specimen / 引擎设计

## Invariants

One semantic article owns the same nine content nodes for the entire experience. No chapter duplicates the specimen, replaces its text, or crossfades whole pages. The photograph source never changes. Display glyphs can be cropped, but the semantic heading, explanatory text and action remain available.

The state is a function of **scroll coordinate, viewport dimensions, and explicit user controls**. No positions accumulate from previous frames. A given coordinate produces the same layout when approached from either direction.

## Layout and time

The coordinate runs from 0 (ZERO) to 11 (NO GRID). Each interval has a stable composition, a small progress-driven refinement, and a handoff. These refinements follow scroll rather than a free-running random animation, so a stopped frame is designed and reverse playback is exact.

Scene rules produce target boxes, font parameters, crop parameters, grid geometry and palettes. DOM text reflows in its real box. CSS Grid supplies the physical column relationship and the native interface layout; the engine uses transforms for spatial movement and writes typography and crop parameters in a single batch. Geometry is reconstructed after font preparation and viewport changes. There are no per-frame DOM geometry reads in the normal scene renderer.

During a handoff, reading text is checked against the composited paper, exposed RAW panel and interface surface. A foreground must remain legible on the surfaces it crosses; a reading region that spans incompatible light and dark surfaces retains its own solid paper. The calculation uses the same state as the composition and requires no pixel sampling or DOM measurement.

Reading-order exchanges use pure waypoint routes in `handoff.ts` and `handoff-desktop.ts`. The photograph first makes space for the reading column; folios, labels and actions move through separate lanes in a defined sequence. Their original scene endpoints remain immutable. These routes do not run a collision solver, query the DOM, accumulate travel, duplicate the specimen or hide its nodes.

One Lenis instance has `autoRaf: false`. One GSAP ticker calls `lenis.raf(time * 1000)`. Its scroll event updates ScrollTrigger. ScrollTrigger supplies normalized progress; the renderer runs only when the state changes. There is no secondary requestAnimationFrame loop, scroll smoother, carousel clock or time-dependent random motion.

## Font preparation

All three local families are explicitly requested through `document.fonts.load` before the animated layout is shown, then `document.fonts.ready` is awaited. A static semantic fallback remains available if JavaScript cannot initialize. Real Roboto Flex axes are written as a complete tuple: `wght`, `wdth`, `slnt`, `opsz`. Unrelated font families cannot interpolate continuously; their changes use a deliberate geometric handoff on the same heading element.

## Interface and variable controls

INTERFACE changes an actual container width. Typography and content relationships adapt to that container; it is not a scaled screenshot. Its range control offers direct manipulation, with the visible width value derived from the active frame.

VARIABLE exposes only axes present in the shipped WOFF2. Range controls retain normal keyboard behavior. Reset returns to the scroll-driven baseline. Overrides belong to the active experiment; they do not replace the fixed content.

## Raster

A single Canvas transforms the existing local photograph into a bounded raster in ELECTRONIC. The original `<img>` retains the accessible description. Raster resolution is capped, work is gated to the relevant state, and the renderer has a CSS-image fallback if a 2D context is unavailable. No camera, microphone, external API, WebGL or remote media is required.

## Recovery and accessibility

Resize, orientation change, font completion and page restoration rebuild geometry while preserving the current scene coordinate. Hidden tabs stop visual work. Reduced motion removes large interpolated travel and scroll smoothing while keeping chapter access and manual controls. Native dialogs contain the index, rules and credits; Escape closes them and focus returns to the opener. Direction keys change scenes only when a form control or dialog is not consuming them.

Without JavaScript, the same article becomes a readable static composition with local typography and photography. It is not an empty app shell.

## References

- [Lenis official integration](https://github.com/darkroomengineering/lenis#gsap-scrolltrigger)
- [ScrollTrigger.refresh](https://gsap.com/docs/v3/Plugins/ScrollTrigger/static.refresh()/)
- [CSS Font Loading](https://www.w3.org/TR/css-font-loading-3/)
- [Variable-font axes](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Fonts/Variable_fonts)

This document records architectural intent. The final verification record states which behaviors were exercised in the delivered build.
