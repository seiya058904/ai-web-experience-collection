# BACKSTAGE — focused research notes

Research date: 24 October 2026. This is an intermediate research note for the production owner, not a construction specification. Research illustrations and institutional photographs have not been copied into the site.

## 1. Verified sources and their design consequences

### 1. National Theatre — Playing With Scale

URL: https://artsandculture.google.com/story/playing-with-scale-national-theatre/awWhDVSTan5fKQ?hl=en

Verified: the exhibition describes physical models used by designers and directors to explore space, movement and materials. Its *Comedy of Errors* model has two towers that swing outward and unfold, and another that translates. *Antony & Cleopatra* uses a rotating two-sided wall and a scene-by-scene model storyboard. *Exit the King* combines a revolve, descending walls and a receding throne.

Implementation translation: create one model with persistent object identities. Treat every transformation as an authored mechanism with a beginning, an intelligible middle and an end. Photograph/sample the actual halfway pose before approving it. The miniature should expose physical surfaces and edges at the wing view; it should not substitute another flat image.

### 2. IATSE Local 470 — Stage Carpentry

URL: https://www.ia470.com/primer/scenery.htm

Verified: adjoining flats may be tied together by rear battens. An on-edge stiffener provides rigidity. Freestanding scenic walls use jacks or stage braces; jacks are triangular frames attached to the flat, commonly with hinges. Stage braces attach the flat to the floor.

Implementation translation: each visible flat gets actual side thickness, an exposed timber perimeter, cross-member and a small rear triangular support. A rotating flat's support belongs to its pivot assembly; it must not stay fixed to the world while the painted face turns. These are simplified miniature mechanisms, not load-bearing theatrical plans.

### 3. Northern Virginia Community College — The Flat

URL: https://novaonline.nvcc.edu/eli/spd130et/TheatreAppreciation/flat-p.htm

Verified: the course distinguishes the exposed back frame from the muslin-covered front; larger/taller flats may require bracing and additional toggles. The reference is older educational material and is used for structural vocabulary, not current construction certification.

Implementation translation: show painted faces with fine fibers and brush variation; use timber frame geometry on the reverse and keep frame-to-skin offset visible. Avoid plastic-like glossy walls.

### 4. J.R. Clancy — rigging glossary

URL: https://www.jrclancy.com/glossary.php

Verified: battens carry lights/scenery/curtains; guides constrain movement with slides/rollers and tracks or tensioned cables. The glossary distinguishes loft blocks that support and redirect lift lines from guide rails for arbors and tension blocks. Masking defines the visual limits of the stage.

Implementation translation: use a visible horizontal batten and two vertical lift lines for the moon/star assembly, with a limited vertical path. If a side guide is shown for the miniature moon, identify it as an original simplification; do not mislabel a counterweight-arbor rail as a real scenery-only standard. Moon, line end and upper attachment must remain connected through the whole travel.

### 5. The Old Vic — Model Box / Geography

URL: https://oldvicmodelbox.com/geography/

Verified: onstage/offstage is a visibility relationship to the audience. A revolve rotates part of the stage; jack-knife sets pivot wheeled wagons. Wood or fabric legs mask the wings. The fly gallery provides ropes and pulleys for flown scenery.

Implementation translation: design audience and wings as two constrained cameras looking at the same scene. Open only the side needed to reveal supports. A change in view must not rebuild the model or expose a featureless back wall. Retain a narrow sightline to the red door during the camera arc.

### 6. Theatres Trust — What spaces make up a theatre?

URL: https://www.theatrestrust.org.uk/discover-theatres/theatre-faqs/171-what-spaces-make-up-a-theatre

Verified: wings store unused scenery and conceal entrances; scenery may move by revolve, truck, track system and elevator. Bars above the stage can fly scenery vertically in/out of sight.

Implementation translation: visibly park sea boards in plausible offstage positions. Their later entrance needs a continuous path. Keep the fly structure part of the miniature silhouette, rather than an unexplained moon descending from empty space. This miniature need not reproduce the documented full-scale fly tower proportions.

### 7. Wenger — StageTek Owner's Manual

URL: https://www.wengercorp.com/Lit/Wenger_StageTek_Owners_280A099.pdf

Verified: modular deck assemblies have legs, frames and joining components. Pages 6–9 describe connecting adjoining assemblies rather than treating them as unrelated floating surfaces.

Implementation translation: use visible plank/deck seams, edge thickness and a modest understructure. The revolve has a circular seam and a readable central axis. Deck seams are physical construction clues, not a decorative checkerboard. Do not borrow exact dimensions or depict this original wooden miniature as a StageTek product.

### 8. V&A — The story of theatre

URL: https://www.vam.ac.uk/articles/the-story-of-theatre

Verified: the history describes moveable scenery arranged in perspective and shutters that move in floor grooves, alongside flown scenery.

Implementation translation: the ROOM's apparent depth can exceed its actual depth using repeated shallow scenic layers, narrowing painted trim and a perspective window. The illusion should separate visibly when viewed from the side. Use a restrained front camera rather than strong wide-angle distortion.

### 9. National Gallery — Perspective

URL: https://www.nationalgallery.org.uk/paintings/glossary/perspective

Verified: perspective creates three-dimensional depth on a two-dimensional surface; recession lines converge to a vanishing point and background objects appear smaller.

Implementation translation: define one authored audience sightline and coherent vanishing point for painted room features. Do not make every painted plane billboard to the camera: the revelation depends on the painted illusion becoming imperfect at the wings.

## 2. Existing collection differentiation — actual repository reads

Web and raw HTTP retrieval of the supplied GitHub URLs failed. The read-only GitHub file connector then successfully retrieved all three files on the default branch. The file SHAs below document what was reviewed; no repository mutations occurred.

| Reference | File SHA | Existing visual idea | BACKSTAGE distinction |
| --- | --- | --- | --- |
| [INTERVAL](https://github.com/seiya058904/ai-web-experience-collection/blob/main/docs/interval/DESIGN.md) | `1323b67048b52a044ebfb3d9df0077607982be7b` | Continuous photo-based seaside architecture; doorway and pillar transitions; Bodoni Moda with Manrope | A handmade miniature whose physical scenic mechanism is visible, driven by a small story and persistent props. No architectural image-to-image passage. |
| [KAGE / VOID](https://github.com/seiya058904/ai-web-experience-collection/blob/main/docs/kage/DESIGN.md) | `337bca6fba388482833b362c2538b9352922d9dc` | Five reusable monochrome rectangular frame groups; changing thickness, spacing and opening; oversized condensed type | Painted color, wood, thick poster serif, recognisable door/lantern, and realistic pivot/lift/track actions instead of abstract transforming frames. |
| [VEIL](https://github.com/seiya058904/ai-web-experience-collection/blob/main/docs/veil/DESIGN.md) | `9e6f3fd079b43249dd53aec5ea6648205d428c43` | Continuous textile installation; shared UV surface; tension/light/fold interactions; Cormorant with Manrope | Curtain only frames the performance. Double-sided rigid scenery and the resulting performance are the protagonist. |

## 3. Three levels of truth

**Real structural principles.** Flats have fronts, backs, thickness and supports; platforms have seams and substructure; a revolve has a pivot; ropes/battens have connected ends; masking works through occlusion; light and shadow change together.

**Original simplified mechanisms.** Four rigid two-sided flat assemblies rotate in preassigned side lanes. Three sea-board lanes enter only after the nearby flat has cleared. The moon follows one guide. The door and lantern rail share a local revolve group. The model omits industrial controls, counterweight safety hardware and unseen machinery.

**Artistic illusion.** Painted room perspective, a small layered sea, stars as finite pierced/emissive dots, and a slightly oversized lantern make the miniature readable. The stage and viewer-facing lighting are optimized for storytelling. No claim is made that the miniature would support real performers or that its mechanism is suitable for construction.

## 4. Concrete geometry and sequencing recommendations

These are design recommendations, not sourced dimensional facts. The production owner should finalize exact coordinates after browser inspection.

- Establish one world coordinate system: X is width, Y is height, Z is depth. Use a roughly 3:2 base ratio. Put the door, track, lantern carriage and revolve surface under the same scene-graph parent.
- Keep a protected central corridor for the lantern. Place flat pivots in side lanes and retain enough clearance for their support frames, not merely their painted skins. Check the swept support volume at 25/50/75% rotation.
- Sequence outer flat clearance, inner flat rotation and wave entry. At least one substantial painted face should present to the camera throughout the 50% transition. Waiting until every flat is edge-on creates a dead composition.
- Give the three wave boards different depth lanes and small phase offsets. Their sides remain rigid and visibly thin. A full-height ocean mesh would erase the central theatrical idea.
- Put the lantern rail on a narrow board/jetty that remains visible above the low wave crests. End at an unambiguous door docking point. During revolve rotation, transform this entire assembly together; only lantern progress is local to the rail.
- Restrict the audience-to-wing camera arc before the far side becomes empty. Use a higher mobile camera and a shorter horizontal arc so the door, lantern and two scenic layers remain legible at 320 px.
- Backlighting/work lighting should reveal support geometry as the camera moves toward the wings. Keep the cue sidelight directional with a floor shadow so the user can perceive the slider's consequence.

## 5. Research limits

- Research sources support the scenic vocabulary and artistic treatment. They do not certify collision-free implementation, physical safety or rendering quality; these need actual project tests.
- No source artwork was downloaded or used as a finished asset.
- The exact painted scenic style, geometry, story and cue timeline are original production decisions.
- The supplied repository design documents were verified through the GitHub connector after public web retrieval failed.
