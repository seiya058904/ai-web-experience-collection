# Visual Bible — The shape of reading

## Governing idea

An R's exact counter is the persistent shape. The opening presents the complete letter with its true uninked interior already visible. That space becomes a stone island, a space untouched by the printing face, an observed anatomical region and a closing signature.

## Selected concept frames

All seven images were generated before the original application code and remain the composition and material references for V2. They are not production letterforms, source photographs, or historical evidence. The real Fraunces and Roboto Flex contours replace any concept-image approximations; the opening and handoffs follow the refinements recorded below.

| Scene | Frame | Stable composition | Visible handoff |
| --- | --- | --- | --- |
| SPACE | [01-space](concepts/01-space.png) | Paper field, left editorial title, complete immense right R with an open counter | A restrained contour trace establishes the space; the actual counter aligns with the stone island |
| MARK | [02-mark](concepts/02-mark.png) | Left thought; right close carved relief with grazing light | The stone contracts toward the raised printing face before fading away |
| PRESS | [03-press](concepts/03-press.png) | One form / many voices; physical mirrored die and printed broadside | The printed specimen moves toward the comparison R using its projected counter |
| DIVIDE | [04-divide](concepts/04-divide.png) | Two real independent Rs at equal visible cap height | One type silhouette resolves into a drafting study |
| ANATOMY | [05-anatomy](concepts/05-anatomy.png) | Large R, genuine x, exact guides, restrained open legend | Counter contour crosses the field into the live poster margin |
| LIVING TYPE | [06-living](concepts/06-living.png) | Mineral-blue live poster and an unboxed control rail | One measured native text layer carries the user's words into the cover's line layout, keeping the same axis values |
| PAGE | [07-page](concepts/07-page.png) | Quiet dark editorial cover, user's type and a counter signature | Explicit return action reconnects the ending to the opening |

## Keyframes and rhythm

Each scene is driven from a normalized scroll value. The first part establishes the composition; the middle remains readable. PRESS contains approach, face-down contact, separation and surviving ink as actual geometric states. The last 22% of each segment uses an authored overlap: measured counter positions carry the letterforms, and measured native words connect the live poster to the cover. Titles exchange on a shorter schedule so the handoff stays legible. Nothing relies on a one-time enter callback, accumulated wheel delta, or remembered playback direction.

## Type specimen

- Fraunces R: wght 600 / opsz 100 / SOFT 0 / WONK 1.
- Roboto Flex R: wght 650 / wdth 100 / opsz 72.
- Cap height and x-height are measured from the chosen instances; see `font-spec.json`.
- Live controls expose Roboto Flex's real wght 100–1000, wdth 25–151 and opsz 8–144.
- Optical-size changes do not scale the DOM text box. Native font-weight and font-stretch own their registered axes; only opsz uses explicit low-level control.

## Copy lock

Masthead: COUNTERFORM. Chapter navigation: The mark / The press / The divide / Anatomy / Living type. Index control: Index. Opening: “The shape of reading.” and “A journey through the spaces that make letters mean something.” Main action: “Scroll to explore”. Scene copy is recorded in the HTML and checked against the selected concept's intended content. Compact chapter folios identify the narrative sequence.

## Intentional adaptations from concept images

1. V2 shows the complete R on arrival and keeps the counter unfilled. A contour trace and a gentle scale change from 1.025 to 1 establish the space over the first 30% of SPACE, addressing the ambiguous dark opening in V1.
2. The real font's shape replaces all AI approximations. Accuracy governs guide positions and letter proportions.
3. The pressure event is a true reversible 3D sequence, so die and paper positions vary during approach/contact; their resting arrangement follows PRESS.
4. Mobile keeps full words and accessible controls by changing composition.
5. The final cover reflects the user's actual chosen text and axis values. The handoff measures the real line layouts with DOM Range and moves one native text layer between them.

## Art review priorities

Continuous counter recognition; seven distinct silhouettes; no colliding letterforms; readable resting frames; honest guide placement; a physical press contact; no bitmap text; a resolved final cover. Font licensing, factual content and functional browser results are documented separately.
