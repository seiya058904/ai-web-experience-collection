# AER — Visual Bible and implementation contract

## Art direction fixed before production

The accepted primary composition is H-D, with the complete balloon on the right and calm negative space on the left. H-M is a separately generated portrait, with the title above the balloon. H-B is used for the resting-envelope comparison. H-A remains the scale reference. H-C was rejected as the opening view because its mouth and rigging are less reliable. K-05 anchors the central field-shadow chapter. T-04-05 is a deliberately framed oblique study. Three separate K-08 panoramas represent three different routes.

The generated photographs are authored cinematic plates. A shared Three.js world is an explicitly illustrated flight study. These media are framed separately; two different balloon images are never opacity-morphed into one false object. The live model keeps a fixed 16-gore topology, pear profile, small navy crown, four suspension connections and honey basket.

## Tokens

| Role | Value |
| --- | --- |
| Paper | `#F6F1E8` |
| Sky | `#A7B8D5` |
| Apricot | `#EAB7A1` |
| Sage | `#A6B5A0` |
| Distant ridge | `#707D9A` |
| Ink | `#334253` |
| Display | Cormorant Garamond, 400 / italic, local Latin WOFF2 |
| Text and controls | DM Sans, 400 / 500, local Latin WOFF2 |

Large titles stay in normal document flow. Layouts alternate full cinematic plates, open editorial columns, a practical ground experiment, a wind selector, transparent live-scene windows and a portrait keepsake. Borderless open layouts take priority over generic cards. Navigation, formulas, controls, captions and results are real DOM/SVG, never baked into artwork.

## Allowed opening copy

- AER
- Sound off / Sound on
- Chapters
- Carried by air.
- A small journey. An entirely different way to move.
- Begin the ascent
- First, look at what holds it up.
- One balloon. Two small figures. A whole morning waiting.
- Journey progress: 01 / Look up

No extra eyebrow, promotion, metric, countdown or marketing action is added.

## State and world

`sceneAt(chapter + localProgress, windPreference)` is authoritative. Every call before or at 5.45 returns the same complete common-prefix state. Only the suffix uses the preference. Height and drift share one authored path clock; horizontal positions come from integrating the altitude-dependent wind. Landing coordinates come from the integral, not three hand-picked end targets. Ground-lab inputs never alter flight state.

World +Y is up, +X east, +Z north. Model root is the basket bottom. One sun direction is `(-1, 2, -0.5)`. The envelope shadow follows a ray onto the same undulating ground. Distances and time are fictional relative quantities.

## Motion and resources

One RAF calls Lenis and evaluates the visible narrative position. No GSAP or second scroll smoother is used. Reduced motion destroys the smoothing instance, removes ambient movement and uses stable chapter views plus step diagrams without deleting any story or choice. WebGL and the SVG fallback select those fixed views through the same `reducedSceneState()` helper. All branch images are owned by target generation IDs; a late earlier request may cache but cannot overwrite the current branch. Hero assets load eagerly; downstream art is lazy or target-prefetched. Text, precise diagrams and route selection remain available without WebGL.

## Comparisons and the ending

CH02 keeps the `At rest` / `Held open` switch for desktop full-motion viewing. Mobile and reduced-motion layouts show both captioned source images simultaneously in a vertical stack, with the complete images visible. The comparison uses two authored states without inventing a continuous inflation morph.

CH05 retains K-05 as a static photographic plate and T-04-05 as a separate oblique study. Reduced motion adds two schematic shadow stills evaluated from the common journey before any wind choice. Those stills supplement the photograph; they do not turn its painted shadow into a live terrain deformation.

CH10 includes an inline illustration of the selected route's settled state: balloon, grounded basket, crew and coiled rope. The scene remains visible with the named receipt and exact route keepsake, and the mobile ending flows vertically. The illustration is evaluated at progress `9.5`; displaying it or exporting the keepsake does not begin another takeoff.

## Intentional visual adaptations

- The live landscape is an illustrated model, not an attempt to pretend a generated photograph is a 3D reconstruction.
- Full photographic plates use normal document flow and connected anchors rather than opaque whole-screen transitions or forced pins.
- Desktop and mobile share story state but use different image compositions and layout proportions.

These choices retain ten chapters, both core interactions, three routes and exports derived from the actual path. They do not establish full acceptance of the original visual brief. The static Hero, editorial handovers, static CH05 plate and authored CH08 viewpoints retain the specific limitations recorded in [KNOWN-GAPS.md](KNOWN-GAPS.md).
