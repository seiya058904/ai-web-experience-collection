# Design and implementation rationale

RELAY turns a missing message interval into a visible, actionable problem.
The visual sequence is deliberately **gap → approaching fragment → available
intervention → explanation**. The missing part belongs to the receiver's real
byte state, so the viewer can change what happens rather than simply advance
a prearranged story.

The complete visual specification, image comparisons, material tokens and
boundary plans are in [VISUAL-BIBLE.md](VISUAL-BIBLE.md). This document records
the implementation choices that connect that specification to a working site.

## Why the bridge

Two different Hero directions were actually generated: a broad horizontal
bridge and a suspended letterpress installation. The bridge was selected
because its alternate paths remain traceable, its source and receiver are
spatially distinct, and its curved baseline can transform into a retention
shelf, a receiving shelf and finally an editorial underline. The letterpress
direction gave the phrase more initial typographic weight but made routing and
instance identity less clear.

The accepted world uses warm ivory, graphite, vermilion data and restrained
pine acknowledgements. Broad bands have bounded depth and contact shadows.
Retained copies are outlined ivory plates, travelling data is solid orange,
and acknowledgements carry an opposite direction and a separate silhouette.
Colour supports those distinctions; it is not their sole carrier.

## Why native SVG and live text

The generated images are references for composition, scale, light and
materials. They are not literal production paintings that can be stretched
over an interaction. Their illustrative packet counts, word boundaries,
spelling and statuses cannot establish runtime truth.

The working sculpture therefore has six **code-native SVG poses** of one
shared structure. Forward edges, return edges, gates, retained copies and
received slots use shared layout coordinates. A moving plate's location comes
from its actual edge and model progress; the same edge geometry draws its
rail. A scroll handoff changes those coordinates continuously, keeping the
instance attached to the route.

Headings, source text, the accurate receiver prefix, status and explanations
remain native DOM text. SVG labels identify real blocks and instances. The
receiver's complete sentence is shown only after exact UTF-8 reassembly. A
large arbitrary word fragment from a concept image cannot replace a five-byte
payload interval. Functionality and truthful state determine the final
composition when a static illustration would contradict them.

The media choice also keeps the project small in scope: no WebGL scene,
shader pipeline, video-backed interaction, particle cloud, remote image
dependency or ambient soundtrack is required to explain this system.

## Six poses, independent facts

| View | Compositional priority | Fact that remains independent of the scroll |
| --- | --- | --- |
| The Gap | Source-to-receiver bridge and the visible missing interval. | The opening pause is calculated from a real seeded delivery. |
| Keep a Copy | Retained originals beside separate transported instances. | Retention depends on ACK reception, not the camera position. |
| Another Way Through | A readable fork, alternate bands and adjacent route controls. | Closure and queue rate are explicit user operations. |
| Arrival Is Not Order | Indexed receiving slots and a clear readable-prefix boundary. | Later bytes can be buffered while an earlier interval is absent. |
| Knowing It Arrived | Outward data and independent return transport. | Complete reception does not imply that the sender has confirmation. |
| A Whole Sentence | Received words or an equally deliberate unfinished composition. | Success, pending confirmation and failure follow actual bytes and budgets. |

Scroll progress controls observation. Playback controls simulation time. The
history slider selects detached recorded snapshots. These three clocks are
separate. A GSAP ticker coordinates Lenis and presentation, and advances the
model only while explicit playback is active. There is one Lenis instance with
automatic RAF disabled.

Each scene segment first holds its stable pose, then hands its shared geometry
to the next view. One heading layer fades before its text changes. Reverse
scrolling reverses the composition without undoing delivered bytes, user
operations or recorded events.

## Responsive and state-aware composition

Phone layout changes the sculpture into a vertical journey: sender above,
receiver below, and alternate routes on opposing sides. It is not a reduced
desktop canvas. Native route buttons and the complete block selector preserve
touch and keyboard access when many five-byte slots are too narrow for useful
individual labels.

The source sentence, received prefix, heading and explanation occupy measured
safe regions. Local fonts have explicit fallback families. Larger viewports
increase the readable scale of both the sculpture and its labels. Short
viewports, text wrapping and enlarged content are layout constraints, not
reasons to fabricate message contents or hide controls.

A terminal incomplete round keeps its actual gaps and reason. A complete
receiver with missing ACKs keeps its complete message and pending sender
status. Review is labelled `Recorded moment`; returning from it restores the
live round without starting playback. Reduced motion keeps the same facts and
interventions with less visual movement.

## Evidence and boundaries

The exact image prompts, hashes and adopted/rejected decisions are in
[concepts/generation-record.json](concepts/generation-record.json).
[MODEL.md](MODEL.md) specifies the original toy rules.
[THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) distinguishes generated studies,
original implementation and upstream libraries/fonts.

Actual browser output must be judged separately from a strong concept image.
The source includes [VISUAL-REVIEW.md](VISUAL-REVIEW.md),
[ENGINE-REVIEW.md](ENGINE-REVIEW.md) and saved evidence under `evidence/` for that
purpose. This design rationale describes intended choices; it does not claim
that a screenshot, transition, browser or physical device has passed a test.
