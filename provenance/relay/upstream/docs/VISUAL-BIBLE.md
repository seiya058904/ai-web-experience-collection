# RELAY — Visual Bible

## 1. Creative decision

**One sentence becomes a tangible transport sculpture.** Its missing part is the focal point; every coloured physical instance represents a fact in the local model. The visual order is gap → approaching fragment → available intervention → one sentence of explanation.

The selected Hero is **A: the horizontal bridge**. Broad graphite bands, quiet depth and directional shadows make transport feel physical without invoking an internet map, a circuit board, or a monitoring dashboard. The alternate suspended-letterpress Hero was explored and rejected for production: it gives the message stronger typographic mass, but makes alternate routing and instance identity harder to follow, compresses poorly on mobile, and introduces the wrong editorial type mixture.

All eight images are genuine `image_gen.imagegen` outputs. Their exact prompts, source output filenames, dimensions, hashes, and adopted/rejected status are preserved in `concepts/generation-record.json`. The initial two Hero alternatives and ACK scene were generated before production scene implementation. Every image was opened with `view_image`; these are not invented asset names or unexecuted prompts.

The illustrations are **design references, not production raster assets**. Native SVG and DOM reconstruct the image's geometry, depth, typography, and roles, while the simulation supplies current objects and states. The image references never determine a payload, packet count, state, success, or arrival time. The user explicitly required this code-based medium.

## 2. Exploration and selection ledger

| File | Native size | Status | Adopted | Rejected or corrected |
| --- | --- | --- | --- | --- |
| `concepts/01-hero-a-bridge.png` | 1586 × 992 | reference only; selected Hero | Asymmetric broad bridge; giant top-left title; receiver right; lower-left action; quiet lateral light | Static packet positions and label values are illustrative; simulation must supply actual instances. Concrete housings are not compulsory literal assets. |
| `concepts/02-hero-b-letterpress.png` | 1586 × 992 | rejected | Comparison evidence for message scale and suspended slots | Condensed message type, serif caption, invented marketing navigation, ambiguous routes, oversize physical word fragments incompatible with fixed-byte chunks. |
| `concepts/03-ack-middle.png` | 1586 × 992 | reference only | Retained outline / retransmission solid plate / received plate / return ACK visibly separate; two depths and opposite arrows | Generated serif heading and caption are rejected; native Archivo is used consistently. Example IDs do not establish a runtime state. |
| `concepts/04-keep-copy.png` | 1586 × 992 | reference only | Large retention shelf and outline originals; matching ID on solid departure; distant receiver retains continuity | Message words on reference are not chunk boundaries. Production chunks are fixed byte ranges. |
| `concepts/05-another-way.png` | 1586 × 992 | reference only | Tactile Y fork; two traceable branches; gate controls adjacent to targets; speed control beside one route | Suitcase-like carriers are rejected for clean thin enamel plates; implied route gate state must follow the engine. |
| `concepts/06-out-of-order.png` | 1586 × 992 | reference only | Ordered receiving slots; conspicuous missing slot; legible prefix stops at the gap; merged paths remain traceable | Generated words “arrived early” on payload plates are annotation errors. They belong in inspection status, never in message bytes. |
| `concepts/07-whole-sentence.png` | 1586 × 992 | reference only | Message dominates; bridge compresses into a fine baseline; ACK remains independent; calm retry action | Arbitrary four-fragment count and invented top-right copy are rejected. Complete text only appears after exact reassembly. |
| `concepts/08-mobile-vertical.png` | 853 × 1844 | reference only | Title alone at top; source above; two descending routes; receiver below; reverse ACK direction; broad touch controls | Envelope icons, inserted period after the gap, and green secondary link are rejected. Green carries ACK meaning only. |

## 3. Material, light and colour lock

| Token | Value / role |
| --- | --- |
| Paper | `#F1EBDD`, warm ivory, uninterrupted page background |
| Graphite | `#292B29`, track faces and principal typography |
| Moving data | `#D94D2F`, solid vermilion enamel front face; optional warmer top edge only for physical depth |
| ACK | `#55766A`, pine green used only for genuine acknowledgement instances or acknowledgement status |
| Retained original | Ivory face plus graphite outline; no solid orange fill |
| Missing slot | Open ivory interior, orange perimeter / dashed edge, block number and byte interval on selection |
| Received slot | Ivory or lightly shaded native tile; actual received bytes/ID; not an ACK-green success fill |
| Light | Soft upper-left lateral light; short bottom-right contact shadow; no bright rim glow |
| Thickness | Bounded 2.5D: graphite front, subtly lighter top, darker extruded edge; no mirror metal |

Depth must reinforce legibility. The forward and return carriers differ in silhouette and arrow direction in addition to colour. A retransmit keeps the block ID but adds its attempt/instance identity. Selected states have an outline and label, not a full-screen colour wash.

Use small shadows on the sculpture only. UI stays unboxed except for buttons, native fields, and deliberate retained/received slots. No card-grid dashboard, diffuse orange gradient, nodes floating in space, glare, fine circuitry, dense particles, or automatic red flashing on loss.

## 4. Type and layout system

**Display:** Archivo variable, heavy/wide presentation for RELAY and chapter headings. **Message:** Archivo at normal width, clear spacing, correct DOM text. **Indices and technical ranges:** IBM Plex Mono, restrained. Fonts are local production assets with licences included by the implementation owner; the site must remain legible with the system sans/monospace fallbacks.

The opening contains three intentionally separate text zones: title at upper left; receiving message at right; explanation and primary action at lower left. At the reference size, the title occupies roughly x4–55%, y9–29%; source x0–13%, y42–60%; central sculpture x7–81%, y30–76%; receiver x76–99%, y19–65%; explanation/action x4–37%, y76–94%. These are composition guides, not absolute pixel rules that may override text reflow.

Desktop layout keeps the stage dominant and labels readable at normal size. On 4K, the sculpture's depth, plates and readable type scale with the viewport rather than becoming long thin rails around tiny text. Ordinary prose remains at a bounded line length. At native 125–200% browser zoom, the composition responds to the actual CSS viewport; short, wider windows use a compact horizontal arrangement to keep titles and controls visible. The final browser record distinguishes those passing native-zoom checks from three additional forced-inline-font stress failures. Arbitrary font-size overrides are not claimed to work universally.

### Allowed opening copy

- `RELAY`
- `A message finds its way.`
- `Some things arrive out of order. Help this one find its way.`
- `Continue delivery`
- `Explore the route`
- `A paused delivery` when that is the actual state
- `SENDER` / `RECEIVER`, native block IDs, actual source message, actual readable prefix and actual status
- Minimal navigation required for the six chapters / model explanation; no unrelated marketing destinations

The simulation toolbar and actual-state labels are functional additions required by the brief. They must not compete with the opening's sole primary action. Labels in reference images that are not on this list or in the user's brief are not authorisation to invent product features.

## 5. Stable compositions and five phases

Every chapter reads the current round. It does not stage the desired phenomenon by mutating the simulation. Where the relevant event has already happened, a quiet `Recorded moment` action may explicitly open the real historical snapshot. Where no such history exists, the sculpture explains its structure and offers an explicit new-round action.

| Act | Enter | Stable composition | Living hold | Handoff | Exit |
| --- | --- | --- | --- | --- | --- |
| 01 — The Gap | The complete outline is already visible; shallow layer reveal only | Horizontal bridge, source left, prefix and conspicuous gap right, one genuine nearby instance when available | Paused packets stay fixed; only selection feedback/light may change | Gap baseline stretches toward retained originals | Title leaves its safe zone, gap remains traceable |
| 02 — Keep a Copy | Same source baseline enlarges into a retention shelf | Outline original and solid travelling instance share an ID but remain distinct | Clicking a block opens ID, byte interval, attempts and retention state | Same live instance remains anchored to its edge as branch structure gains weight | Original shelf recedes; selected instance persists |
| 03 — Another Way Through | Same bands spread into an obvious fork | Two thick alternate routes, large gate target, one route speed control | Close/open/speed changes are real model operations; queues remain at true nodes | Merge mouth becomes the structural hinge toward receive slots | Fork persists smaller at the edge |
| 04 — Arrival Is Not Order | Merge opens onto numbered slots | Prefix, empty early slot, later actual buffered slots | Slot inspection distinguishes missing from arrived early; incomplete UTF-8 is never garbled | Eye tracks from missing slot back to retained copy, actual retry when present | Buffer stays in view as ACK direction separates |
| 05 — Knowing It Arrived | Forward plate and reverse ACK separate into two visual depths | Retained, received and acknowledgement-pending roles are simultaneously identifiable | One-shot loss control arms the next qualifying ACK; duplicate reception is truthful | Receive baseline becomes typography baseline while return ACK keeps independent path | No forced green sender status |
| 06 — A Whole Sentence | Text obtains visual priority without inventing reception | Completed message, or equally composed real prefix/gap/incomplete reason; fine track trace below | Actual facts and explicit history control; retry opens a clearly new round | Sculpture's baseline leads to brief model/source notes | Calm ending; replay/reset remains available |

## 6. All chapter boundaries: exact visual sampling plan

The percentages below are visual handoff progress **only**. Packet positions are recomputed from the same actual edge plus interpolation time as the tracks morph; they are never moved to a receiver because the viewer scrolls. Reverse scrolling reverses the layout, not the log or the simulation.

For each adjacent chapter, normalised progress is derived from the actual scroll position. The implementation owner records the final concrete scroll interval in the test record. Every boundary must be inspected at 0/25/50/75/100%, forward and reverse. At no point may both scene backgrounds be absent or old/new headings occupy the same text area.

| Boundary and shared anchor | 0% | 25% | 50% | 75% | 100% |
| --- | --- | --- | --- | --- | --- |
| Gap → Copy: source-to-gap baseline | Hero stable; source and receiver visible | Old caption fades first; receiving gap still right; baseline reaches left | Original sentence appears left; RELAY fully leaves reserved heading zone before new title enters | Retained shelf enlarges; receiver becomes upper-right trace; actual traveller distinct | Copy chapter stable; no simulated event triggered |
| Copy → Routes: selected block ID and source branch | Shelf dominates with actual selected block | Outbound band extends while shelf contracts; old body copy clears | Both routes appear connected to the same source; original block still locatable | Fork/gates take focus; new caption enters safe zone | Route controls stable and adjacent to geometry |
| Routes → Buffer: merge mouth | Both complete routes visible | Route ends remain on screen; later received plate can be foreground only if real | Merge is hinge; curved bands straighten into receiving-slot baseline; same IDs | Buffered plates are shown in their actual indexed slots; missing slot stays open | Buffer dominates, fork persists as spatial trace |
| Buffer → ACK: selected block and return baseline | Ordered receiver stable | Receiver selected ID remains; source retained ID gains definition | Two depth planes separate; old heading gone before ACK heading appears | Receiver plate, retained original and live/historical ACK visibly different | Knowing chapter stable; one-shot loss action belongs to current round |
| ACK → Sentence: receive baseline and return edge | Receive slots and genuine forward/return objects visible | Last block moves only if simulation is running; return ACK remains | Complete bytes permit native complete phrase; otherwise exact prefix and gap remain | Message gets scale; route collapses to fact-line baseline; sender truth still independent | Outcome composition stable for Received / Confirmed / Incomplete |

### Layer order and text ownership

1. Persistent ivory background.
2. Contact shadow and farther return rail.
3. Graphite forward rail side/front/top geometry.
4. Actual in-transit instances placed from the same geometry that draws the rail.
5. Receiver and retained-copy slots with accurate text.
6. Selected object label and native adjacent control.
7. Reserved heading/caption zones, then persistent navigation and simulation controls.

Use one old and one incoming text owner per boundary. Old copy exits before new copy becomes readable; the scene remains present through that brief text handoff. The transition is not a blackout or a loader. Numeric label IDs stay stable across geometry changes.

## 7. Mobile reconstruction

Below tablet width the sculpture is a **vertical transport**: source above, receiver below, two usable branches left and right. The title has its own row and the message has its own row; no part of the desktop image is simply shrunk to fit. ACKs point upward on the return plane while data heads down. Source and receiver labels remain horizontal.

At 390px and 360px, both branch structures stay broad enough to identify, with controls placed beside the appropriate fork and native controls at least comfortably touchable. At 320px, the selected path and endpoints get priority; secondary branching can collapse into an explicit disclosure while all facts remain available in the selected-block inspector and actual event history. Reading order is title → source → selected route → receiver → action. Long custom messages wrap in their bounded native text zone instead of shrinking to illegibility.

The generated mobile image is a direction reference, not permission to hide the missing payload behind envelope icons. Actual block IDs and the received prefix replace the illustrated envelope motifs. The secondary exploration link uses graphite, because green is reserved for acknowledgements.

## 8. State-specific visual contract

| True model state | Visual treatment |
| --- | --- |
| Paused | Honest `A paused delivery`; all packet and ACK positions frozen; `Continue delivery` is primary |
| Running / Receiving | Native prefix, real gap and current instances; playback control can pause |
| Received; sender unsure | Full message visible; `Confirmation pending` remains distinct; retained copies or actual ACK route remain visible |
| Confirmed | Whole message plus true confirmation fact; no invented celebration sequence |
| Incomplete | Real prefix and gaps retained at the same compositional quality as success; precise failure reason and explicit new-round action |
| Recorded moment | Persistent `Recorded moment` label; historical cursor is isolated; return-to-live action restores current round without replaying it |
| Reduced motion | Same data and controls; short/instant visual state updates; no forced smooth camera movement |
| Asset/font delay | Same composition via native SVG/DOM and local fallbacks; no loading overlay or invisible text |

## 9. Fidelity acceptance ledger to complete after browser render

Design exploration is complete. Browser fidelity is a separate gate and must be recorded in the final QA documents. Compare the selected Hero, the relevant chapter concepts, and fresh native-viewport browser screenshots using `view_image`. At minimum review: hierarchy, palette, broad-rail thickness/depth, plate-role silhouettes, readable message/gap, safe typography zones, mobile orientation, 4K scale, adjacent control hit areas, and actual intermediate handoff frames.

Intentional differences already authorised by the task are limited to: replacing generated illustration text with exact native text; deriving every visible state and packet count from the engine; SVG/DOM geometry instead of a static 3D raster; responsive safe-zone reflow; removal of rejected image hallucinations. These differences preserve the artwork's composition and semantics. They do not justify a generic thin-line node graph, tiny type, repeated panel stack, blank intermediate scenes or a weak final chapter.

Do not state that visual QA passed until the screenshots and transition evidence actually exist. Record actual failures with viewport, scroll progress/direction, cause, fix and focused regression result. References are evidence of exploration; browser screenshots are evidence of implementation.
