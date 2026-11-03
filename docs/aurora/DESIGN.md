# AURORA — A Storm You Can See

Five chapters follow one night sky back to its cause and home again: the sky, the wind, the oval, the curtain, and your own sky. The film runs from a lake at night to the solar wind, down onto the night-side oval and back under the curtain. Everything is one continuous function of scroll.

## Point of view

The page never says "beautiful". It lets a visitor set a storm and a place, then answers with geometry, including the honest answer: from low latitudes in a weak storm, nothing is visible. That dark sky is part of the work, not a failure state.

## Tokens

- Night `#050a14`, text `#e9f1ee`, quiet `#a9bac0`, hairline `#ffffff2e`.
- The only saturated colours on the page are wavelengths. Green 557.7 nm, red 630.0 nm and violet 427.8 nm appear because they are the subject, and each button's mark shows its own line.
- Roboto Flex is the one family. The name uses its narrowest width and a light weight so the letters read as tall vertical strokes, like rays. Body text uses the same family at normal width. It is loaded from the existing `/grid/fonts/` binary, so no font bytes are duplicated.

## Composition

- Hero: the name stands at the lower left over the lake, the curtain fills the sky above it, and the reflection runs below. No panel, no card.
- Controls sit on a single translucent panel. Chapter II places it on the right so the sunward side of the magnetosphere stays visible; later chapters use the left. On tall screens the panel sits at the bottom and the subject rides above it.
- Sliders use a thin track and a tall narrow thumb, echoing the rays.

## Motion

One Lenis instance (`lerp: 0.105`, `syncTouch: false`, `autoRaf: false`) on the GSAP ticker. Scene values are direct functions of progress with no second easing layer. Slider changes approach their target over a fraction of a second so the sky responds like a sky rather than a switch; still mode applies them immediately. The curtain's own time stops under reduced motion and when the visitor presses Hold still.

## Preserve

The honest visibility states, the emission isolation buttons, the altitude ruler computed from real geometry, the published formulas in `model.js`, the "illustration, not a forecast" statement, the Canvas 2D path and the captioned sky export.
