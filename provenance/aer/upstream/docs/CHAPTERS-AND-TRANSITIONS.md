# AER — Chapter and transition ledger

Prepared 2026-11-09. This ledger describes the files and behavior that have been implemented. It is **not** a claim that every visual acceptance criterion has passed in a real WebGL browser. See [VERIFICATION.md](VERIFICATION.md) for actual observations and [KNOWN-GAPS.md](KNOWN-GAPS.md) for the remaining differences from the original brief.

## What the delivery implements

The site uses a framed editorial sequence: cinematic generated images, real DOM experiments, a shared illustrated flight world, an SVG fallback and exact route diagrams. It does not morph unrelated photographs into a supposedly continuous physical object. The photo/live handovers are deliberate changes of medium; they should be assessed as such rather than described as pixel-matched 3D continuity.

All ten sections are real semantic chapters in `index.html`. Every chapter has its own purpose and content; navigation, the menu, loading states and footer are not counted as chapters.

## Ten chapters and two beats each

| Chapter | First substantive beat | Second substantive beat | Actual medium and implementation evidence |
| --- | --- | --- | --- |
| 01 — Look up | The huge pear-shaped envelope fills the morning sky. | The connected basket and two small figures reveal scale. | H-D desktop photograph and separately generated H-M mobile photograph; real title, navigation and ascent link; corresponding illustration on image failure. |
| 02 — A shape for air | The envelope rests low beside the basket. | The same colors, crown and connections form a full volume. | H-B and H-D are separate, captioned comparison states. Desktop full-motion mode uses real `At rest` / `Held open` buttons; mobile and reduced-motion layouts display both complete images in a vertical stack. No inflation morph is used. |
| 03 — Between light and heavy | Displaced outside air provides support; everything carried still weighs. | Relative warmth and ground load produce heavier, near-balance and rising tendencies. | Native range/radio/preset/reset controls, DOM force bars, text results and a code balloon. Pure `buoyancy()` model; no numerical flight settings. |
| 04 — The ground lets go | Basket bottom and contact shadow separate. | People remain on the field while height grows. | Shared Three.js balloon, terrain and crew; illustrated fallback; two explicit reduced-motion stills. |
| 05 — The shadow goes first | A shadow spans differently colored fields and a pale path. | The terrain gives the shadow a changing spatial context. | Static K-05 plate plus the separately framed T-04-05 oblique study. Reduced motion adds two illustrative common-prefix stills, beside the path and across the next slope. The main photograph does not animate terrain deformation; the adjoining live study owns the projected-shadow state. |
| 06 — The floors of the wind | Low, middle and high authored layers point differently. | Choosing one determines the following path. | Three native selection buttons, SVG layer profile and exact route diagram. Default middle selection has a complete ending. |
| 07 — A choice takes shape | Integrated horizontal drift differs after the common decision. | Branch landmarks and destinations become distinguishable. | Shared 3D world or corresponding illustration; branch-specific copy; comparison panel with noncommitting dotted route previews. |
| 08 — In the same light | Basket/envelope foreground frames a broad morning landscape. | A route diagram recalls the actual selected path. | K-08, K-08-low or K-08-high selected by branch, with a matching lightweight fallback; `Look back along your route` expands the exact diagram. |
| 09 — Back to the earth | The selected landing patch and crew become close. | Basket contact returns and the world settles. | Branch-specific live/illustrated landing; three explicit reduced-motion stages; landing is fixed at the integrated route endpoint. |
| 10 — Keep the sky | The same balloon is shown grounded beside the crew and a coiled rope at the selected destination. | A self-contained SVG or PNG records that same path; retry returns to the choice. | An inline illustrated ending evaluates the selected route at settled progress `9.5`. It remains visible with the wind/destination receipt, portrait keepsake and native download buttons. No new takeoff is triggered. |

## Nine adjoining handovers

These are local chapter handovers, not nine fixed-duration animations. Normal scrolling remains in control. Fractional five-frame and continuous-motion checks must be recorded separately; code implementation alone does not establish visual continuity.

| Boundary | Retained narrative anchor | Actual handover | Remaining acceptance concern |
| --- | --- | --- | --- |
| 01→02 | Navy crown, cream/apricot panels, connected basket | Full opening plate leaves in normal flow; the rest/open comparison enters, stacked in mobile and reduced-motion layouts. | The delivery uses framed photo views rather than an uninterrupted camera tracking down a single photograph. |
| 02→03 | Envelope identity, mouth and basket relation | Comparison gives way to a precise ground experiment in normal document flow. | Confirm title/control readability at all intermediate scroll positions and fallback fonts. |
| 03→04 | Basket bottom and ground | DOM experiment yields to the shared live or illustrated field. | Verify physical contact and the media change on an actual WebGL-capable browser. |
| 04→05 | Projected shadow and pale path | The live camera has a downward shadow view, then K-05 and the oblique study occupy their own frames; reduced motion also presents two common-prefix shadow stills. | The photograph is an authored companion view, not an exact texture reconstruction or an animated deformation of the live terrain. |
| 05→06 | The common path and decision position | The photo chapter gives way to the wind profile and exact three-route diagram. | Confirm the full common-prefix invariant in each wind selection and reversed browsing. |
| 06→07 | Shared decision point and selected suffix | Controls yield to the live branch world; height and horizontal wind drift use the same story clock. | Verify the visual handover and continuous camera path with real WebGL; model causality has automated coverage. |
| 07→08 | The selected route's meadow and landmarks | Live flight framing gives way to that branch's separate panorama plate. | No claim of a pixel-aligned 3D/photo dissolve. Confirm route identity and readable foreground framing. |
| 08→09 | The chosen meadow | Panorama exits; the live/illustrated landing approaches the actual selected endpoint. | Test loading failure, route changes and restored chapter offsets; final WebGL framing remains environment-dependent. |
| 09→10 | Grounded basket, crew, gathered rope and completed route | The arrival is followed by a visible settled illustration, named receipt and original route keepsake in normal document flow. | The ending illustration is a separate framed medium rather than the specified continuous camera retreat; check the whole phone ending and current-state export. |

## Causal invariants and evidence

| Requirement | Implementation | Verification status |
| --- | --- | --- |
| CH01–05 are independent of later wind preference | `sceneAt()` always uses the common state through and including `5.45` | Verified in the deterministic engine tests, including complete state equality |
| Each branch starts from one snapshot | Identical position, altitude, heading, shadow and common path | Verified by tests at the decision and adjacent samples |
| Wind, not a horizontal steering control, changes the path | Continuous height-dependent wind integrated over one authored clock | Verified against an independently finer numerical integration |
| Three distinct completed destinations | Endpoints derive from the integral; the three meadows are placed there | Verified by state tests and exact export geometry tests |
| Ground experiment never changes flight state | Independent pure `buoyancy()` module state | Verified by randomized seek/lab operation tests |
| Extra load does not increase gross buoyancy | Fixed external support and volume, explicit internal/structure/payload weights | Verified by monotonicity and force accounting tests |
| Preview cannot commit a wind change | Preview overlay state is separate from selected preference | Export/diagram nonmutation verified; browser interaction record remains separate |
| SVG matches the actual route | `getRoute()` / `getBranchRoute()` provide vector points | Verified for all three choices; simplification stays below 0.041 SVG pixels including rounding |
| Reduced motion keeps content and results | Native scrolling; shared `reducedSceneState()` for WebGL and SVG views; stacked shape comparison; explicit lift, shadow and landing stills; the same choices and result | Implemented in source; fixed-state selection has automated coverage. Actual observed browser cases remain separate in the verification record |
| Image/WebGL failure retains the current target | Target-keyed image loading plus scene illustrations | Implemented; cloud browser is exercising the no-WebGL path |
| Nine boundaries remain readable and visually controlled | Document flow, fixed world, explicit media frames and one scroll owner | Requires the browser evidence matrix; no blanket five-frame/WebGL pass is asserted here |

## Environment limits

The available cloud Chrome disables WebGL. The connected Browser plugin cannot reach the managed preview. The viewport harness embeds the real site in CSS-sized frames; it does not simulate physical devices, platform-specific touch behavior, real browser zoom or GPU performance. These facts must remain visible in the final acceptance record rather than being replaced with an assumed pass.
