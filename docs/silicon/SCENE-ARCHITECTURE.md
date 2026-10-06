# SILICON — Scene architecture

This document preserves the original scene direction and reconciles it with the implemented sequence. The normative visual system is in [DESIGN.md](DESIGN.md). Source research and the scientific limits of the abstraction are in [SOURCES.md](SOURCES.md).

## Narrative and first viewport

One material moves through eight manufacturing states. Layers, light, conductive paths and signal are the shared forms. The site is one precision object theatre, with a persistent camera and exhibition ground; it is not a collection of independent landing sections.

The first viewport pairs the oversized SILICON word with an oblique polished wafer. A circular edge, alignment notch, repeated die floorplans and subtle moving reflections establish the material. The title and entry action sit in an editorial frame; header navigation and the eight-part manufacturing rail remain available. Portrait puts the wafer below the title, while compact landscape separates copy and artwork into left and right fields.

## Eight authored scene systems

| Scene | Constructed system and stable composition | Living hold | Structural handoff |
| --- | --- | --- | --- |
| 01 MATERIAL | A notched silicon disk, an authored 26-by-26 die atlas with memory-bank and logic-core floorplans, repeated routing, edge surfaces and a selected die. | The thin-film reflection moves across actual die surfaces; a fine outline identifies the chosen die. | The wafer levels beneath a reflective optical column, preserving its surface and selection. |
| 02 PATTERN | A reflective reticle, three concave mirror faces, a folded optical path and a scanning exposure field above the wafer. | Exposure develops the pattern; the visitor can take direct control. Violet represents invisible EUV. | The selected die carries its same floorplan and outline into the first film at inspection resolution. It lands and remains readable before later deposition covers it. |
| 03 BUILD | Six deposited and patterned films above a silicon foundation; selective removal reveals retained structures, trenches and vertical contacts. | Layer separation and a restrained scanning film expose actual depth. | Three retained precursors grow into the three silicon channels of the transistor cutaway. |
| 04 TRANSISTOR | A gate-all-around section with source, drain, three nanosheets, dielectric and an opened surrounding gate. | Gate state controls the visible conductive channels and their carriers. | Two physical contact caps reshape and lengthen into co-located vertical vias. |
| 05 INTERCONNECT | Six crossing metal levels with explicit vias and dielectric sheets. The densest layers sit nearest the device. | A selected connected route carries activity; the visitor can separate the layers. | Four upper metal rails become four escaped interposer buses within the package footprint. |
| 06 PACKAGE | Solder-ball array, package substrate, interposer, two logic chiplets, four separate eight-layer memory stacks and an open heat spreader. | The same components can be separated or assembled without changing their hierarchy. | The package settles while the primary activity route waits for the Signal chapter. |
| 07 SIGNAL | The same assembly; a primary input-to-logic-to-logic-to-memory path, secondary buses and a localized expressive thermal field. | A packet travels through the connected path. The power control brings the circuit to rest or returns its activity. | Routes quieten and the lid closes over the same assembly. |
| 08 SILICON | The assembled package, brushed heat spreader, etched SILICON word and modelled underside. | A restrained residual signal and reflection preserve the quiet final composition. | Replay returns to material; sources and exhibit notes remain reachable. |

## Lifecycle and timing

Enter → Stable Composition → Living Hold → Handoff → Exit is the compositional rule. The implementation does not force every process into one identical five-part percentage template. Geometry-specific overlaps give the transferred feature time to become legible.

Scroll progress ranges from 0 to 7.999. Chapter navigation goes to composed states: 0 for Material, chapter index plus 0.5 for the intermediate scenes, and 7.57 for Silicon. Copy enters and leaves around the object; it does not determine the structural transfer.

| Transfer | Implemented relationship |
| --- | --- |
| Pattern → Build | The same selected floorplan magnifies during progress 1.78–2.00. Its top face remains registered to the first film during the 2.00–2.12 landing hold. Subsequent resist and films then cover it as deposition and etching change the stack; the carrier releases by 2.47. |
| Build → Transistor | Three actual retained ribs remain identifiable while their positions and dimensions become the transistor channels. |
| Transistor → Interconnect | Contact geometry is interpolated into actual destination via poses, including the change from a rectangular cap to a rounded vertical connection. |
| Interconnect → Package | The source rail endpoints and destination bus vertices are preserved through a flat-route-to-fan-out transformation. |

Each frame releases prior temporary handoff ownership, computes native model poses, then applies the currently active transfer. This deterministic order makes reverse scrolling reconstruct the same geometry. A single GSAP ticker drives Lenis, ScrollTrigger, renderer updates and ambient time. CSS sticky gives the stage one stable lifetime; the implementation does not add ScrollTrigger pin spacers.

Pause holds the ambient clock without blocking navigation or direct controls. Reduced motion removes the moving lens and continuous activity, instead presenting a complete still state for each chapter. Native touch momentum remains available. Resize and restoration preserve proportional journey position while allowing visitor input to take control.

## Rendering and construction choices

| Medium | Role |
| --- | --- |
| Semantic HTML and CSS | Exhibit copy, navigation, ranges, switches, native dialogs and transcript. |
| Inline SVG | Wafer identity mark and functional process, directional, close and motion icons. |
| Three.js | One shared stage, scene geometry, material response, physical sectional depth, instanced repeated parts and structural transfers. |
| Procedural Canvas textures | Authored wafer and reticle floorplans, fine circuit artwork, surface finish and etched package lettering. |
| Canvas fallback | A composed 2.5D version of every chapter with the same navigation and direct inspection controls when WebGL is unavailable. |

The studio's narrow HDR cards and two finite area sources produce localized reflections across silicon, copper and silver. Surface maps carry actual finish and pattern information; they are not photographic backdrops. No external model, vendor illustration or generated concept image is required at runtime.

Only visible scene groups render. Instancing reduces repetition cost, pixel ratio is capped and bounded by a viewport pixel budget, and hidden tabs suspend drawing. The renderer aims to cap ambient work at 60 fps desktop and 45 fps portrait mobile; these are implementation limits, not measured hardware performance claims. Pause and reduced motion render only when state is dirty. Exact acceptance coverage belongs in the release verification document.

## Scientific framing

This is an authored visual synthesis, not a drawing to scale or a foundry recipe. The device and package are selected examples rather than a claim about one commercial chip. EUV uses reflective optics; the visible violet path is representational. The three silicon nanosheets are channels, the gate is separated from them by an insulating layer, metal lines connect through vias, and stacked memory remains distinct from logic dies. Moving pulses show circuit activity rather than electron drift speed. The thermal field is expressive, not a simulation or measurement. “Awakened” is a narrative metaphor for computation, not a claim of consciousness.
