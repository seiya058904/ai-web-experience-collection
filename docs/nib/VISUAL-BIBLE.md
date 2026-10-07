# NIB · Visual Bible

Final direction, curated before application implementation · 7 October 2026.

## The world

An intimate material film controlled by the wheel. The opening is a monumental metal facade. Its fine slit is the invitation inward. The film follows an interface, then a passage, then a mark. A continuous Ink Line changes meaning without losing its visual identity. Replacement air is the quieter opposing action.

The brief fixes the world and grants creative autonomy. Research and concept comparison selected the metal-facade direction. A diagonal composition was retained for mobile and paper contact. The heavily weathered first metal pass and the oversized hanging drop were rejected: both weakened precision. The refined metal pass restores polished planes and a small stable meniscus. The transparent reservoir study was revised into a dark chamber. Rejected source renders are not included.

## Curated frames

The eleven original PNGs in `visual-bible/` are the image-generated composition references. Text in them is a design reference; all application text is accessible, selectable HTML. The production images are separately extracted clean plates and alpha objects. The final production set contains eleven material images, including the two finish-review additions described below; the eleven concept PNGs remain unchanged. Their recorded lineage and file identities are in [ASSET-PROVENANCE.md](ASSET-PROVENANCE.md).

| Frame | Stable composition | Living hold | Handoff |
|---|---|---|---|
| [01 · Metal](visual-bible/01-metal.png) | Ivory NIB on the left; vertical polished nib at right, shoulders out of frame. | Narrow traveling specular reflection and restrained liquid glint. | Axial travel into the slit; the liquid interface opens into the chamber. |
| [02 · Reservoir](visual-bible/02-reservoir.png) | A deep chamber whose blue-black liquid surface crosses the lower half. | Very small surface deformation; intermittent return-air meniscus. | The horizontal ink boundary tilts and narrows into the feed route. |
| [03 · Feed](visual-bible/03-feed.png) | Diagonal matte black fins, longitudinal wet channel, quiet upper-left copy. | A fine moving liquid highlight; partially filled buffer pockets. | Follow the channel, rotating into the two opposing passages. |
| [04 · Balance](visual-bible/04-balance.png) | Two distinct long channels at right; ink and air in the same composition. | Continuous dark ink motion, sparse pale air admission. | The ink path contracts into the slit; air recedes. |
| [05 · Slit](visual-bible/05-slit.png) | Extremely close parallel metal faces enclosing a liquid seam. | A traveling surface reflection follows the seam. | Track the seam toward the rounded tipping halves. |
| [06 · Meniscus](visual-bible/06-meniscus.png) | One attached liquid interface between rounded cool-metal tips. | Shape remains held; only its reflection breathes. | Travel axially into the held liquid, let its optical material occupy the lens, then pull back to the writing pose above stationary paper. |
| [07 · Contact](visual-bible/07-contact.png) | Pale paper receives the tip from upper right. | Ink bridge and the first small wet mark. | The paper takes the visual scale; the contact mark becomes a fiber-level line. |
| [08 · Absorb](visual-bible/08-absorb.png) | One narrow ink stroke passes through visible cellulose fibers. | Local staining and sampled interstitial paths stay close to the stroke; raised fibers partially occlude the wet body. | Pull back along the same controlled stroke. |
| [09 · Write](visual-bible/09-write.png) | A smaller nib traces a single slight curve on ivory paper. | Movement is tied to scroll, with wet reflection near the active tip. | The nib lifts and leaves; the reflection diminishes. |
| [10 · Trace](visual-bible/10-trace.png) | A matte line and sparse centered text. | A still final frame. | Begin again returns to metal through the same scroll authority. |
| [11 · Mobile](visual-bible/11-mobile.png) | Diagonal nib in upper field; NIB and subtitle below. | Limited visual motion, clear text safety. | Same narrative, recomposed geometry and fewer fibers. |

Every chapter has enter, stable composition, living hold, handoff and exit phases. Progress is deterministic and reversible; ambient reflections cannot change the stored material state. A stop at any point must retain an intentional frame.

## Material hierarchy

- Graphite ground: `#080a0d` to `#11151a`; the liquid retains a readable edge against it.
- Display ivory: `#eee9dd`. Small text: `#c0c0b8` on dark ground.
- Ink: `#07172b`, near-black bulk, blue-gray wet boundary. It never becomes neon.
- Paper: `#f1ebdf`, supported by the generated cellulose texture, with dark text `#171c23`.
- Champagne and rhodium belong only to the nib, engraved edges and reflected light. Interface text does not use gold.

Type pairs the narrow contrast and italic continuity of Cormorant Garamond with quiet Manrope controls. This choice follows the measured letterforms of the final concept frames. Large serif forms echo the nib's symmetry; compact sans labels keep navigation legible. The large opening NIB is specific to this composition and does not repeat as a chapter template.

## Composition rules

Desktop stage: viewport-wide with no framed image container, black bars or cards. Header and footer use a fluid 3–5% gutter. Chapter titles occupy the quiet part of the composition, usually upper-left; the final trace is centered. The numbered chapter position is meaningful narrative orientation. Minimal navigation opens a chapter index and a small colophon. No invented metrics, commercial claims, decorative badges or audio controls.

Mobile is an independent composition: a diagonal nib occupies the upper area, opening typography moves below the tip, later chapter text stays above the material action, the final line spans the lower-middle. Its opening uses the separate portrait `hero-mobile` material, with a distinctly visible small attached bead and transparent space below the object for live typography. Navigation remains reachable, scroll remains native to touch, and every scene fits at 390 × 844 as well as narrower phones. Short landscape viewports receive smaller display type and wider safety margins.

## Media and authored systems

The hybrid renderer combines clean image-generated photographic materials with real code geometry. It does not animate screenshots. Separate alpha nibs allow the object to move independently of the paper and ink. The reservoir has a live surface and returned-air interface. Feed and balance have authored paths, capillary geometry and controlled counterflow. The slit receives a liquid seam. The meniscus, ink bridge, fiber network, moving stroke, and wet-to-dry reflection are authored Canvas systems.

Images establish metallurgical and tactile fidelity; live systems establish cause, continuity and behavior. There are no borrowed 3D models. Geometry parameters and renderer source are the complete editable models. A single GSAP ticker advances one Lenis instance and the renderer. No second RAF, CSS continuous animation, or independent animation engine is allowed.

## Scene architecture contract

THESIS: one stored liquid becomes one controlled line through a coupled ink-and-air mechanism.

OWN-WORLD: near-black material space, actual champagne metal, blue-black liquid, then warm ivory cellulose; editorial typography and discreet chapter ticks.

STORY: examine the nib, enter the reservoir, discover feed and balance, follow the slit, pause at the meniscus, touch paper, enter fibers, write and dry.

FIRST VIEWPORT: giant serif NIB at left and polished vertical nib at right, nib shoulders cropped at the top, a tiny attached meniscus near three-quarters height, navigation at the outer corners.

FORM: the user-pinned metal architecture and Ink Line determine the form. The available concept roll was local assignment 3, seed `4e2a0ba8`; the external catalog was unavailable. This exploratory record does not supersede the detailed creative-autonomy brief.

FINISH: the build ends with an independent finish review, its recorded verdict, DESIGN.md, and provenance for every shipping raster.

## Implementation refinements

Direct browser comparison rejected a flat procedural meniscus and the initial graphic fiber field. A separate liquid-only optical plate and an ink-free cellulose macro were generated from the curated references. They supply reflection and substrate relief while code retains placement, contact, flow, uptake and the shared stroke. Metal and liquid remain separate alpha layers.

Implementation refinement added two further production materials. `hero-mobile` is a transparent extraction from the Mobile concept, retaining the diagonal engraved nib, lacquer and a small optically distinct held bead. Its actual PNG and WebP dimensions are 853 × 1844. `nib-profile` is a 1672 × 941 generated side view, using the Contact and Meniscus production originals as references. Its arched metal, rounded tipping and visible black feed thickness provide the continuing paper-scene pose. `contact.webp` remains in use for the short landscape Hero and as the retained generation reference. Exact prompts, references and the mobile prompt/output dimension difference are preserved in the provenance record. Formal review results are documented separately.

The Meniscus-to-Contact transition is a liquid-interface scale handoff. At global chapter progress `q = 5.56–5.82`, `enterPaper()` travels axially into the held meniscus. Its existing optical liquid material occupies the lens at `q = 5.72`; the camera then pulls back to the side-profile nib. The handoff changes the view through the liquid without compressing or overlapping nib silhouettes. It is a registered photographic composition, not a reconstructed 3D model.

That same side-profile pose continues through Contact, the Absorb boundary, Write and the Trace departure. It uses one tip anchor, uniform scale and a fixed attitude. The actual photographic lacquer-boundary strips are extended in code so the grip continues beyond the crop. Paper stays in the same screen plane while the nib lowers to the point of first connection. The final trace shares the writing geometry; its reflection decays and the fully dry frame ceases redrawing.

Paper uptake combines localized staining with capillary paths sampled from the cellulose material. Selected raised photographic fibers partly occlude the wet ink body, keeping the ink within the visible fiber structure. Brightness and local contrast provide compositional cues for this treatment; they do not constitute measured three-dimensional fiber geometry.

## Acceptance focus

Compare final browser frames directly with these references. Verify image/text separation, nib-to-paper contact registration, narrow wet edges, clear ink/air directions, mobile safety zones, no blank scroll intervals, reverse progress, high-frequency wheel input, resize, font/image readiness, deep reload, tab restoration and reduced motion. Performance decisions must preserve complete frames rather than silently removing chapters.
