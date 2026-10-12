# Concept-to-browser fidelity ledger

The Visual Bible was created before application code. Its seven images establish composition, material, scale and pacing. Real font outlines, readable native text and the user's variable settings govern the implementation.

The V1 reference comparison included the reference's native **1536 × 1024** size, six requested responsive sizes and a second independent screenshot-based art review. The actual opening and its concept were viewed together at native size. The other scene concepts, final contact sheets and PRESS sequence were also reviewed. V2 retains these references while refining the opening, measured handoffs and interaction timing; its current verification scope is recorded separately in [QA.md](QA.md).

## Five principal comparisons

| Aspect | Reference intent | Final implementation and decision |
| --- | --- | --- |
| Composition and whitespace | Monumental R beside a left editorial title; distinct stone, press, comparison, diagram, live poster and cover silhouettes. | Preserved as seven different stable compositions. Mobile places type and controls in a new vertical arrangement. The tablet R was moved down to protect the subtitle. |
| Typography and glyph accuracy | Strong display contrast, a persistent counter and precise annotations. | Actual Fraunces upright/italic and Roboto Flex binaries supply all type. Genuine contours replace imagegen approximations. The comparison matches cap heights; anatomy uses the actual lowercase x and measured guides. |
| Material and image treatment | Incised stone, a raised reversed metal face and a surviving ink impression. | Procedural material maps and real outline-derived geometry provide depth. Approach, contact, lift and impression are reversible. Concept pixels never render in the application. |
| Palette and hierarchy | Warm paper, ink, rust accents, a mineral live poster and a dark final cover. | Maintained. Mineral changed slightly from #768991 to #7a8d95 to improve small-text contrast. Functional captions have an 11px minimum; primary display proportions remain deliberate. |
| Interface and continuity | Quiet masthead, chapter folios, restrained controls and a recognizable form carried between scenes. | Native Index dialog, range inputs, text field and Reset remain secondary to the type. Letterform handoffs use measured SVG positions or actual material projections. A single native text layer carries the user's words into the closing cover, retaining the same axes. |

## Intentional scene adaptations

| Scene | Adaptation |
| --- | --- |
| SPACE | V2 presents the complete R from arrival, with its actual counter unfilled. A contour trace and subtle scale settling replace the ambiguous dark reveal. Its real Fraunces shape differs from the generated reference; the counter caption follows the measured letter geometry. |
| MARK | A contemporary Fraunces relief study is clearly identified; it is not presented as an ancient inscription. Geometry keeps the counter island intact. During the handoff, the stone contracts toward the die and fades to leave the press composition clear. |
| PRESS | A credible geometric contact sequence takes precedence over matching one static concept arrangement. Die and impression share the source outline and physical cap height. The completed imprint approaches the comparison R using actual projection geometry. Static SVG fallback uses bounded editorial specimens. |
| DIVIDE | Two independent typefaces retain their own structures; no incompatible path morph or invented historical progression is used. |
| ANATOMY | Actual measured contours and an authentic x take precedence over approximate labels in a concept image. The open legend works by click, keyboard and scroll. |
| LIVING TYPE | Real wght, wdth and opsz values alter native glyphs. Resting text is fitted by its actual line boxes when it would overflow. During the handoff, measured native word segments move between the two layouts; any temporary fit adjusts font size uniformly while preserving the axes. |
| PAGE | The visitor's text and axes determine line breaks. The same words arrive in the final layout without a duplicate visible specimen. The original counter becomes a quiet isolated signature, recalling the opening's uninked interior. |

The second V1 art pass recorded no remaining material visual issue in its reviewed normal-mode frames. That historical result does not stand in for V2 acceptance. Current opening, handoff and interaction findings, along with reduced-motion, no-JavaScript and WebGL verification boundaries, are in [QA.md](QA.md).
