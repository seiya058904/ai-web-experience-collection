# MEND — Art Direction

## A thing worth keeping

Pip is an inanimate wooden pull-along toy with a particular history. The image should communicate that identity before a visitor reads the title: a long cream body, a chipped hanging ear, blue front wheels, a red cord, and an orange sun hidden underneath.

The emotional sequence is hesitation, attention, a measured choice, a completed short walk, and a quiet return. Material, weight, light, and the relationship between objects carry that sequence. There is no living-animal acting, blinking, idle bouncing, or celebration effect.

## Fixed identity

| Feature | Art contract |
| --- | --- |
| Body | Long, low, thick wooden silhouette with rounded old edges and locally worn cream-yellow paint |
| Face | A simple black dot eye and slightly offset dark nose; no changing expression |
| Ear | Terracotta hanging right ear with a small missing corner at its lower tip; the anatomical side stays consistent across views |
| Tail | Small raised wooden tail, continuous with the established silhouette |
| Wheels | Exactly four mounted disc wheels on two axles; the front pair is cobalt blue and the rear pair is natural wood |
| Fault | The right rear wheel leans inward and rubs against the body before repair |
| Cord | Terracotta red, attached at the nose, with a slack curve and believable points of contact |
| Memory | One uneven orange sun, without a face, painted on the underside; exactly three short move marks nearby |
| Branch A | Keep the original wheel and add a visibly new small sleeve; no loose original wheel |
| Branch B | Fit a distinguishable new wheel and keep the removed original wheel for return |

The sun does not migrate to the flank as a decorative logo. A change of camera must not change the ear chip, wheel count, body proportions, or position of the underside marks. The missing ear corner, worn paint, and sun are retained by both repair plans.

## Palette and materials

| Role | Color |
| --- | --- |
| Oatmeal background | `#F4EBDD` |
| Sage work mat | `#A9B7A2` |
| Cobalt front wheels | `#456A91` |
| Terracotta cord and ear | `#BD6551` |
| Warm umber text and deepest shadows | `#4B423B` |

Light comes from a large window to the upper left and rear. Surfaces are matte: fine wood grain, restrained brush marks, rounded thickness, worn edges, and clear soft contact shadows. Avoid a yellow cast, plastic reflections, excessive dust, lens flare, or decorative tool clutter. New wood should be recognizable without looking unrelated in grain scale or lighting.

Headings use **Newsreader**. Reading copy and controls use **DM Sans**. Real English text has room to wrap naturally; letterforms in a generated still never carry required content. The visual hierarchy comes from scale, whitespace, and a few meaningful paper objects, not a grid of dashboard cards.

## Generation record and selection

The source images were generated with the built-in image-generation tool. The [generation log](art-generation.json) preserves the actual prompts, files, references, and adoption notes. No seed or unsupported generation parameter is claimed.

The accepted baseline uses **H-C for Pip's identity** and **H-D for the desktop Hero composition**. H-C gives the material and silhouette a clear character; H-D makes space for the actual title and letter while keeping that character substantial in the frame. The mobile Hero is separately composed in H-M.

| Role | Independently inspectable source | Use and decision |
| --- | --- | --- |
| H-A | [H-A-v2.png](art-source/H-A-v2.png) | A lower table-edge alternative with generous left-side space. This replaces the rejected first H-A, which appeared to contain five wheels. |
| H-B | [H-B.png](art-source/H-B.png) | The private-parcel alternative. Its paper box communicates care, but its more oblique top view and limited text space are less suitable for the main arrival composition. |
| H-C | [H-C.png](art-source/H-C.png) | Canonical character and material reference. Its close side view supports inspection; limited headline room prevents using it unchanged as the desktop Hero. |
| H-D | [H-D.png](art-source/H-D.png) | Selected desktop Hero. It combines the H-C identity with a large right-side toy, a slack leftward cord, and calm left-side space for DOM text. |
| H-M | [H-M.png](art-source/H-M.png) | Independent portrait Hero. Pip sits in the lower portion; a traceable cord curves through the foreground and the upper area remains open. |
| K-06 | [K-06.png](art-source/K-06.png) | Plan A repair close-up: the original wheel remains, and a small pale sleeve is distinguishable at the axle. This is not a source for a fictitious removed wheel. |
| K-09 | [K-09.png](art-source/K-09.png) | The long sunlit table and stretched cord create spatial evidence of a completed journey. A small sleeve is not legible at this scale, so branch information also needs an accurate close view or DOM record. |
| T-03-04 | [T-03-04.png](art-source/T-03-04.png) | The difficult underside-to-side midpoint: tilted Pip, real support blocks, the sun, three marks, and the rear wheel. A valid still is not proof of continuous geometric motion. |

These eight sources each occupy one counting role. The rejected five-wheel H-A is excluded from that count. Additional branch-specific images or derivatives belong in the same generation log and do not retroactively change what each baseline image demonstrates.

## Production asset contract

The application consumes optimized local images rather than temporary generation URLs. The source PNGs remain available separately for inspection.

| Local production filename | Role |
| --- | --- |
| `public/art/hero-desktop.webp` | Desktop arrival composition based on H-D |
| `public/art/hero-mobile.webp` | Independent portrait arrival based on H-M |
| `public/art/inspection.webp` | Canonical Pip inspection view based on H-C |
| `public/art/underside.webp` | Supported underside view and difficult midpoint reference |
| `public/art/repair-A.webp` | Original wheel with the new sleeve |
| `public/art/repair-B.webp` | Branch B view; its exact derivative/source provenance is recorded in the generation log |
| `public/art/long-road.webp` | Full-table late-story composition based on K-09 |
| `public/art/long-road-B.webp` | Dedicated B long-table variant: new pale wheel, removed original in its bag |
| `public/art/paint-texture.webp` | Generated cream paint/wood surface used on the stable live body mesh |

Image optimization may change encoding and dimensions while preserving composition. Any content-changing edit must remain traceable to its generated source. A B-state graphic must not silently reuse an A sleeve as though the two results were identical.

## Composition and motion

### Arrival

H-D places Pip in the right half, with the large title in the calm left area and the request close to the cord. These are compositional goals, not claimed measurements of the final browser layout. The initial image must already be the finished art, with no gray model presented as a loading stage.

The six Hero states are first view, request reveal, complete composition, quiet hold, first scroll into inspection, and return. A returning visitor sees the arrival composition without replaying an opening sequence. The saved plan remains intact.

### Inspection and the underside

The camera behaves like a person seated at the workbench: a small approach, a meaningful change of view, then time to look. Inspection annotations point to the right rear wheel, chipped ear, and worn paint without moving the text column unpredictably. Mobile uses large controls and readable local views.

The underside view is supported, not magically suspended. The sun and three marks must remain on the same physical surface while the rear axle becomes the next focus. A support block can conceal a difficult seam only when the support itself makes physical sense.

### Repair, trial, and comparison

The chosen part approaches along the axle and settles with a matching contact shadow. A sleeve is a small ring, never a fifth wheel. The A branch retains all original wheels; B creates exactly one removed-wheel instance for the return.

Wheel angle is derived from path displacement. A trial begins with an explicit control and pauses when its chapter is left or the page is hidden. The comparison first settles Pip into a registered pose; it does not dissolve between two different silhouettes.

### The long table and return

CH-09 earns as much art attention as the Hero. The environment opens around Pip, keeping the toy and its cord physically legible. Movement follows chapter progress in either scroll direction. The return follows the cord toward its end, with the letter and truthful repair card entering the remaining space.

The B branch includes the old wheel in its bag. The A branch uses the card and space around it, without inventing a removed part to balance the composition. A small hand may enter only at the edge; the cord being gathered is the acceptable alternative if the hand image is unsuitable.

## DOM, 3D, and fallback relationship

The optional Three.js scene is for meaningful part relationships and controlled demonstrations. It must preserve one stable Pip identity and use the same repair state as the page. Narrative text, choices, comparison controls, and results remain in DOM content.

Every target chapter needs its own correct still or lightweight fallback when a resource or graphics context is unavailable. An old chapter's image must not remain behind a new chapter's explanation. Late resources can be cached, but cannot overwrite the current chapter or chosen branch. Whole-dog transparency dissolves do not replace an aligned handoff.

Reduced motion preserves the full story and its outcomes through stable views and controlled state changes. Mobile composes the toy above its reading content and reorganizes the long road into depth rather than requiring horizontal page travel.

## Visual review boundary

Generated references establish the design; browser screenshots establish whether it was realized. Review the Hero, CH-06, CH-09, the supported underside midpoint, and both repair branches at their actual reading sizes. Then identify and improve the weakest two chapters and weakest adjacent handover. Actual observations and remaining differences belong in [ACCEPTANCE.md](ACCEPTANCE.md).

## Auxiliary sources and fallback comparison

K-06-B and K-09-B are independently generated branch variants, recorded in the actual generation manifest. The extra paint texture is an authored material source. These three additional sources do not replace any of the eight required counting roles.

When WebGL is unavailable, photographs remain stable while exact SVG mechanism diagrams carry clearance, seating and trial motion. CH-08 uses one fixed-pose drawing for before/after; its photograph is explicitly a repaired-detail reference, so different generated photos are not presented as registered geometry. The normal live scene retains the same model and pose for comparison.
