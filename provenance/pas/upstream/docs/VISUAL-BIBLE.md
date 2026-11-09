# PAS visual bible and image-adoption record

## The work's visual premise

Two fully clothed fictional adults share an empty practice space. The visual subject is the interval between them: a hand offered, a change in footing, a pause before contact, a small adjustment that makes room. Their relationship is left open. The work uses no stage, audience, curtains, theatrical machinery or spectacular environment to explain what the bodies are doing.

The direction began as photographic studies. The delivered animated interpretation is illustrative CGI made from an anatomical rig and authored motion. **It does not match the studies' photorealistic surface quality or reproduce their faces and identities exactly.** Stable identity within the runtime comes from fixed meshes, proportions, hair, clothing colors and named roles. The photographs are direction and selected still imagery, not claims about the rendered character fidelity.

## The eight actual studies

All eight originals are retained as `reference-images/img-01.png` through `img-08.png`. WebP versions used by the project are in `public/art/`. [image-generation.json](image-generation.json) records the real generation tool, prompts, references, outputs and packaged files. No seed is invented; the tool did not provide one.

| Study | Actual role | Visual reading | Adoption decision |
| --- | --- | --- | --- |
| IMG-01 · Hero A | Full figures at a level observation angle | The offered hand, the other person's attention and both sets of feet share one frame | Adopted as the main full-body direction and the identity reference for later studies |
| IMG-02 · Hero B | Elevated oblique view | The floor and placement of the feet become prominent; faces and hand intention are more foreshortened | Retained as a meaningful alternative and depth/grounding study; rejected as the primary Hero because the opening needs the offered-hand exchange at body level |
| IMG-03 · Hero C | Close study of separate hands and forearms | Skin, cloth, finger shape and the strip of air are immediate; faces and support feet are absent | Retained for contact/detail intent; rejected as the primary entry because it cannot establish the complete bodies or their support |
| IMG-04 · Desktop refinement | Landscape 1536×1024 | Both adults and all toes remain visible, with an open text corridor on the left and hands still separate | Selected desktop opening still and principal composition reference |
| IMG-05 · Portrait recomposition | Independent portrait 1024×1536 | Both complete bodies sit below a large quiet upper field; the interval remains legible without a landscape crop | Selected mobile opening still and portrait composition reference |
| IMG-06 · Counterweight | Mid-work full-body support study | A single handhold links two modest outward weight shifts; free arms and feet remain visible | Used for the relationship between grip, support and small lean; the measured runtime rig supplies its own safe reach and hand orientation |
| IMG-07 · A Complete Phrase | Late-work open shape | After the side exchange, a brief connection holds two contrasting free-arm lines and a look back | Used for asymmetric expansion, changed facing and a brief final touch; the CGI result does not reproduce this image's photographic fidelity or exact pose |
| IMG-08 · Transition 06→07 midpoint | Exchanged sides, separate bodies and stepping | Cheng is now left and Cen right, with a small interval between their backs and visible support | Used as a continuity/identity study; the authored crossing already leaves them facing away, so the final sequence uses settling steps instead of adding an unnecessary extra turn |

The rejected Hero routes remain included because they are distinct alternatives, not failed duplicates silently counted as additional work. The two middle/late studies and the transition study each have their own role. None is counted twice toward the required eight results.

The first anatomical hand-name wording in the IMG-06 prompt predates the measured mesh contract. The final rig consistently uses **Cen's anatomical right hand and Cheng's anatomical left hand** for the near-camera contact. The original prompt is preserved as a generation record rather than rewritten to imply it already contained the final rig decision.

## Stable runtime identities

| Attribute | Cen | Cheng |
| --- | --- | --- |
| Relative presence | Shorter, slender adult | Taller, broader adult |
| Model height | 1.68 m | 1.82 m |
| Upper clothing | Plain rust short-sleeve tee | Plain sand short-sleeve tee |
| Lower clothing | Charcoal loose tapered training trousers | Charcoal loose tapered training trousers |
| Hair | Dark fitted scalp with a small low bun | Short dark curls |
| Feet | Bare; individual toes visible | Bare; individual toes visible |
| Initial place | Left, facing inward | Right, facing inward |
| After the crossing | Right | Left |

The models have actual anatomical surface meshes, separate fingers, toe geometry and explicit eye details. They are not ball-and-stick mannequins. The mesh/skin/garment provenance and original modifications are documented in [MODEL-SOURCES.md](MODEL-SOURCES.md). These are newly assembled fictional character models, not scans or recreations of real performers.

The costume colors identify the actors after they change sides. Names never depend on screen-left or screen-right. Hair and costume remain constant across all chapters and timing modes. The final source does not swap one model for a different pose-specific character.

## Palette, material and typography

| Role | Color / treatment |
| --- | --- |
| Primary text | Charcoal brown `#27221F` |
| Warm paper / light surfaces | `#F2E8DA` |
| Sand interface accent | `#C6B7A3` |
| Cen / active observation accent | Rust `#963F32` |
| Secondary text | Warm brown `#625246` |
| Environment | Restrained taupe plaster and matte floor |
| Body / costume rendering | Matte skin and cotton; soft cloth folds, no metallic finish |

The rendered tee albedos are adjusted for the scene lighting, so their raw material values are not the same as the interface swatches. The intended visible distinction remains rust versus sand. Charcoal trousers keep the legs readable as continuous shapes, while exposed ankles and toes locate support.

Bodoni Moda provides the editorial titles and italic wordmark. Manrope provides body copy, controls and compact labels. Both fonts are bundled locally under the SIL Open Font License. The large opening title is real HTML rather than text baked into an image. Short captions give the viewer a direction of attention; the bodies remain the main evidence.

No bright dashboard cards, decorative charts, generic technology gradients or ornamental 3D objects are used to occupy the space. Rules and small controls are visually quiet, while focused controls must remain identifiable. The website's built-in text, including accessible names and failure states, is English.

## Framing and mobile interpretation

The desktop opening keeps a quiet text corridor and a full-body relation. The portrait opening is a separate generated composition, not an automatic crop. In the native animated sequence, both layouts use the same physical choreography, with separately rendered wide and oblique portrait cameras. Their exact production settings are in [RENDERING.md](RENDERING.md).

The main sequence uses a fixed observation camera for each layout. A detail inset can show the relevant feet or hands while a complete-body overview remains available. This is an adaptation of the requested changing detail attention: the native player does not reproduce a continuously travelling cinematic main camera. A still narrative coordinate does not produce independent breathing animation.

A change of image is always driven by the shared narrative coordinate or an explicit timing/viewing choice. It is not a timed photographic slideshow. Unison and Echo change the bodies' authored phase, and the same source score generates the frames used for reverse or direct access.

## Grounding and restraint

The floor plane is `y=0`, with actual geometry-derived shadows. Supporting feet, contact hands, elbows and the line of the torso must be visible together when their relationship matters. The final changes corrected cloth poke-through, folded light-contact wrists, a forearm twist discontinuity, a visible fingertip gap, an 8 mm floor offset and insufficient passing clearance. [CHARACTER-VERIFICATION.md](CHARACTER-VERIFICATION.md) records the measured checks rather than using the reference pictures as proof.

A secure grip precedes counterweight. Both actors recover their own support before releasing. Back contact is below the neck; the shared descent is modest. The finale returns to a comparable interval while preserving the exchanged sides and a different waiting posture. There is no celebratory bow or stage ending.

## Fidelity boundary and final review

The photographs provide a stronger level of fine skin, hair, cloth and facial detail than the authored CGI. The final work keeps the palette, adult clothed figures, bare feet, quiet space and relationship-led composition, while accepting simpler anatomy shading, fixed skinned clothing and reduced facial expression. That difference is a documented production limitation, not evidence that the photorealistic brief has been matched exactly.

Likewise, an attractive direction still does not establish correct browser behavior or continuous contact. The actual website, image sequence and controls are reviewed separately. [VERIFICATION.md](VERIFICATION.md) distinguishes completed numerical/proof-image checks from pending or untested browser, physical-device and package cases. This visual bible is an adopted direction and adaptation record; it is not an “all passed” acceptance certificate.
