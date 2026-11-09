# AER — Known gaps and verification limits

Reviewed 2026-11-09. The delivery contains implemented interactions, route logic and visual scenes, but **does not fully implement every visual acceptance item in the original brief**. The differences below are present in the source; they are separate from features whose rendering simply remains unverified.

## Remaining differences from the brief

| Area | Requested behavior | Delivered behavior and remaining gap |
| --- | --- | --- |
| Hero's six states | Initial view, gradual reveal, complete composition, pausable slight movement, a first-scroll view tracking the gores toward the mouth/basket, and a reversible return. | H-D and the independently composed H-M are static photographic openings with real text and navigation. The completed composition and return/state behavior exist, but the gradual reveal, Hero movement and tracked first-scroll camera sequence are not fully authored. The six-state requirement is therefore only partly implemented. |
| Nine chapter handovers | Each boundary has a specified five-stage spatial choreography, with a continuously trackable object or anchor and meaningful intermediate compositions. | All nine chapter boundaries exist, but most use normal document flow, framed photographs, explanatory diagrams and separate live-scene windows. These editorial handovers do not reproduce every prescribed 0/25/50/75/100% spatial sequence. Screenshot sampling cannot establish choreography that is absent from the implementation. |
| CH05 terrain and shadow | A visible shadow moves between fields and changes its projection over the terrain during the chapter. | The main K-05 photograph is static, with a separately framed T-04-05 study. Two schematic common-prefix shadow stills are available in reduced motion, and the live world has a terrain-projected shadow. The main photographic chapter does not visibly animate that shadow deforming across its painted terrain. |
| CH08 spatial continuity | The panorama inherits the selected route's actual spatial viewpoint, while foreground identity, landmarks and landing meadow remain geometrically continuous. | Three separately authored photographs depict the corresponding route landmarks and destinations. They are not exact camera projections of the integrated Three.js world. The separate look-back diagram follows the actual route; that geometric accuracy does not make the photographic viewpoints exact. |

## Source corrections now included

The latest source includes simultaneous, vertically stacked CH02 comparisons on mobile and in reduced motion; two reduced-motion CH05 shadow stills; and a visible CH10 grounded tableau with the balloon, crew and coiled rope beside the result. The illustrated fallback and WebGL renderer now use the same reduced-state selection helper. These items should no longer be described as absent from the implementation.

Their implementation is confirmed by source inspection. The latest rendered layouts and integration have not received a fresh complete browser acceptance pass after these edits.

## Browser evidence boundary

The available cloud Chrome reports `GL_RENDERER: Disabled`, so observed browser behavior uses the SVG illustration fallback. The connected Browser plugin could not access the managed preview. Later browser-control attempts repeatedly timed out and prevented completion of the planned final inspection matrix.

Only the earlier recorded **1440×900 and 390×844** inspections and recorded core actions can be treated as actual browser evidence. Those size checks used embedded CSS iframe viewports. They do not establish physical-phone behavior, real browser zoom at 125/150/200%, other browser engines, hardware 4K output or WebGL performance. Unrecorded sizes, interactions, failure conditions and continuous transition checks remain unverified.

See [VERIFICATION.md](VERIFICATION.md) for the exact observations and delivery-package checks, and [RENDERER-AUDIT.md](RENDERER-AUDIT.md) for CPU assertions and source findings. Successful automated tests or a production build do not close the source-level visual gaps above or substitute for the missing browser evidence.
