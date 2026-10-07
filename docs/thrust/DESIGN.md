# THRUST — visual direction and scene architecture

## The world

Experience mode. The browser is a moving camera inside a single machine. The explicit brief fixes a cinematic industrial world; this is the governing visual authority. The design pass explored a product campaign, a technical atlas, and an axial engineering film; the film carries the requested continuous air narrative. No catalogue, card grid or dashboard enters the surface.

Six generated composition studies informed intake, compression, combustion, blade, machine and flight. They are visual references, not engineering drawings or shipped backgrounds. The remaining scenes derive from their adjacent camera positions. Generated incidental captions and part geometry do not override the supplied narrative or NASA references.

## Visual system

- Canvas: blue-black `#060b10`; text: platinum `#eef2f4`; secondary: `#a7b4bc`; cold air: `#81dcec`; heat: `#efa46d`.
- Finale: a pale natural atmosphere, graphite type, no technical annotations.
- Type: self-hosted Barlow Condensed 600 for tall mechanical display; Manrope 400/500 for the optical headings, body and controls. Strong scale, deliberate line breaks; no gradient type.
- Desktop margin: fluid 28–128px, scaling through 4K. Mobile: 22px. The machine occupies at least half the composition; text occupies the remaining negative space.
- Motifs: fine chapter rules, short engineering leaders, blade edges, one original three-line mark. Controls are plain text or thin outlined circles. No decorative frames.
- Hero copy: THRUST; Anatomy of a jet engine.; Follow the air. Enter the machine.; BEGIN THE JOURNEY. Header: THRUST, INDEX, pause control. Bottom: ordered ten-scene rail.

## Ten connected shots

| Scene | Stable composition | Living hold | Handoff |
|---|---|---|---|
| Intake | Monumental three-quarter fan, right; large title, left | Slow rotor and sparse incoming air | Push through inlet |
| Fan | Swept carbon airfoils fill the lens | Blade-edge highlights, fan capture | Annular passage opens |
| Bypass | Upper shell retracted; two spatially distinct paths | Most cool tracers surround core | Follow the smaller inner stream |
| Compression | Grazing camera along the opened, tightening blade corridor | Rotors turn; stators hold; pressure grows | Last stage opens toward dome |
| Combustion | Warm annular liner; anchored injector plumes | Controlled flame and hot downstream gas | Vanes resolve inside the same hot flow |
| Turbine | Turbines then both shafts exposed | Work trace runs forward to correct spool | One turbine blade enlarges |
| Blade | Curved nickel airfoil and cooling holes at macro scale | Cooling film and progressive internal cut | Blade returns to axial assembly |
| Machine | Directed sequential exploded assembly, broad and low | Slow inspection, continuous air path | Reassembly in reverse order |
| Thrust | Concentric nozzle flows seen aft | Air moves aft, machine remains linked | Camera reveals wing and fuselage |
| Flight | Small unbranded aircraft above clouds | Subtle camera settling | Replay returns to intake |

## Rendering responsibilities

Three.js builds the original engine, nested shafts, real rotor/stator meshes, blade and airliner. Thin shader lines carry the same two flow families through the world. Combustion is controlled annular emission. DOM owns all readable type and controls. The only generated runtime raster is the finale atmosphere; there is no prerecorded engine video or model swap.

## Motion and responsiveness

One Lenis instance smooths vertical wheel input (`lerp: 0.105`, `syncTouch: false`, `autoRaf: false`) on the existing RAF. Its document position maps directly to the deterministic scene coordinate; the former second progress easing is removed to avoid delayed camera response. Camera tracks have enter, hold and exit positions, and are reversible. Local rotations are synchronized by spool. Pause freezes ambient motion and disables wheel smoothing while leaving navigation working. Reduced motion preserves the full story. Mobile keeps its authored camera positions, portrait whole-engine compositions, fewer flow traces, lower resolution and shorter scene distances. Touch and dialog scrolling remain native; navigation and restoration use the same Lenis instance.

## Interaction contract

Begin/replay and chapter rail jump to stable scene entries. Index lists all ten chapters and concise model background. Blade button toggles the cooling cut. Horizontal dragging in blade and machine scenes adjusts inspection angle without trapping vertical touch scrolling. Pause and sound controls reflect their actual state; sound is opt-in, generated locally, and stops in hidden tabs. All controls support keyboard focus.

## Honest boundaries

This is an art-directed original engineering illustration, not a CFD, CAD or certified performance model. Colour depicts qualitative fields; displayed bypass split is explicitly illustrative. Real-world frame-rate claims require hardware measurements. Browser captures and structural checks are recorded only after execution.
