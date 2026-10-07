# Experience contract

## Scope

One local, self-contained browser artwork. Mode: Experience. The brief already pins the visual world and delegates creative execution. Runtime implementation and navigation are authored to serve that world.

## Direction contract

THESIS: The same surface becomes deeper through patient material change. One oblong wooden vessel persists across the whole journey.

OWN-WORLD: Warm museum black, raw grain, a single vermilion turn and late material gold. Bone serif display and precise small sans text live in the negative space. A single long reflected light binds every scene.

STORY: Begin with an unexplained finished black surface; return to its wooden core; build, cure, disrupt and rebuild it; find reflection; deposit, conceal and reveal a sparse gold design; return to the complete object.

FIRST VIEWPORT: URUSHI wordmark at upper left, Index and About at upper right. Three-line heading Surface / becoming / depth. at left; a monumental low oval vessel occupies the right two thirds. Scroll to begin sits at the lower left. No gold appears.

FORM: A continuous original object and reflection choreography, developed through controlled-light material studies. A low elliptical lid, rounded shoulder and quiet seam preserve a recognizable form through close crops.

FINISH: Black retains tonal depth. Abrasion visibly breaks the reflection, polish restores its continuity, and the late gold motif remains bound to the surface. The final design and asset origins are recorded in DESIGN.md and PROVENANCE.md.

## Scene architecture

| Scene | Material event | Composition / handoff |
| --- | --- | --- |
| 00 Black without edge | Unadorned black mirror, soft long reflection | Cropped monumental form on the right; restrained left headline |
| 01 Core | Wood appears; a dense ground prepares its pores | Pull back enough to read the complete unchanged shape |
| 02 First coat | A thin front passes over the prepared surface | Camera holds; reflected light begins to gather |
| 03 Cure | Surface disturbance settles in a humid enclosed atmosphere | Smallest camera movement; dark air, no steam or wet droplets |
| 04 Abrade | Wet fine abrasion interrupts the reflection | Close shoulder study; the surface temporarily becomes matte |
| 05 Layers | Three compressed coat / cure / abrade cycles | Brief fine layer section; then return to the surface |
| 06 Vermilion | A controlled red layer reveals color on one region | Crop retains recognizable shoulder and lid seam |
| 07 Polish | Scratches recede, reflected light becomes continuous | First climax; minimal camera movement, dominant material change |
| 08 Maki-e | Finite metal powder settles onto a tacky design | Sparse curved pattern bound to the same surface; no glow |
| 09 Reveal | A lacquer veil hides the powder, then abrasion reveals it | Second climax; moving physical mask, not a global fade |
| 10 Depth | Final object and a continuous reflected environment | A quiet return; optional pointer/keyboard light study and replay |

## Material continuity

All scene parameters derive from scroll position, with deterministic seeded textures and particle arrival times. Lenis is the only scroll interpolation. The renderer must not independently ease the story position. Pointer movement affects the light mildly and never changes chapter progress. Reduced motion removes autonomous motion and smooth scrolling while preserving access to every state.

## Responsive design

Desktop uses left narrative / right object. Mobile deliberately crops the same form below the copy, keeping a visible reflection and body contour. Chrome uses touch-sized buttons, an accessible index, an About / source panel, and optional language switching inside the index. No numerical humidity or time claims appear as decoration.

## Quality criteria

The initial wood has no coherent reflection. Abrasion must visibly undo clarity. The polish result must have a coherent long reflection without turning the body into chrome. Gold is absent until scene 08 and remains a finite non-emissive surface design. Fast reverse scrolling must restore previous states exactly. Asset requests are local after startup. All code, runtime assets and original AI research images belong in the final ZIP; debug captures do not.
