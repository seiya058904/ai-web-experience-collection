# CREASE — The Geometry of a Fold

One sheet of paper across five chapters: one line, four lines that meet, one motion, one pulled corner, and a sheet the visitor sets up and prints. The same rectangle stays on the table throughout. Its pattern changes only at moments when the paper lies flat, so the changes cannot be seen.

## Point of view

The fold is never faked. Facets are exact rigid planes in every frame, and the site's best moment is a visitor breaking the rule: move one crease by three degrees and the sheet can no longer close. It ends off screen on purpose. The last action is to print the pattern and fold real paper.

## Tokens

- Ground `#e8ecf3`, ink `#0d1433`, quiet `#47516f`, cobalt `#1c39c9`, paper `#f4f5f6`, broken `#b92812`.
- One colour does the work: a cobalt sheet with a white reverse, like origami paper. White appears only where the paper has been turned over.
- Space Grotesk is the one family, loaded from DOSE's existing binary. The name is set to the page measure with tight tracking.

## Composition

- The name stands on the ground under the canvas. The sheet lies over its lower edge and casts its shadow across the letters, which share one plane with the paper. When scrolling starts, the top half of the name folds back along a real horizontal crease.
- Text sits directly on the ground in a left column with no panel. On tall screens it becomes a full-width band with the sheet above it.
- The one decorative device is structural: slider thumbs are squares turned 45 degrees, and the main action has one dog-eared corner.

## Motion

One Lenis instance (`lerp: 0.105`, `syncTouch: false`, `autoRaf: false`) on the GSAP ticker. Fold and camera are direct functions of scroll with no second easing layer. Slider input settles over a fraction of a second, and pointer movement shifts the camera by a few degrees. There is no ambient clock: the scene draws only when something changes. Reduced motion applies input immediately and drops pointer motion.

## Preserve

Exact rigid kinematics, the rectangular sheet through every stage, the printed crease lines that fold with the paper, the breakable Kawasaki vertex and its honest readout, the draggable corner with its keyboard slider, the SVG edition and the printable A4 pattern.
