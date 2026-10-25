# BACKSTAGE — Visual Bible

## Intent and chosen reference

Experience mode. An audience discovers that a convincing little world is made of painted boards, then changes its cues. One door, one lantern, one stage. Warm, curious, slightly absurd. The stage is the work; navigation stays quiet.

All five reference images were actually generated before production layout or stage code. See `IMAGE_GENERATION.json` for the exact prompts and `references/` for the returned files. They are **reference only**, never interactive UI or image planes pretending to be a stage.

| Study | Decision | Adopt | Deliberate exclusions |
| --- | --- | --- | --- |
| A · Audience | Primary hero reference | Ivory studio, separate large title band, left reading area, teal room, single red door, warm paper lantern, handcrafted miniature | Extra furniture, excessive distressed stone, photoreal ray-traced finish and carved shell ornament are not required; stage uses a more restrained original stepped frame. |
| B · Jewel box | Act II reference | Three-quarter view, frame thickness, timber bracing, parked waves, neutral working light | Generated alternate chapter names and early disclosure of every secret. |
| C · Room to sea | Mechanism reference | Different rotation stages, readable board edges, continuous sky, a room face meeting a coastal face | Reject its full-scale auditorium, hanging lantern, overlarge door and extra props. Lantern stays on its original floor rail. |
| D · Director | Act IV reference | Small three-control column, moon/door/lantern triangle, indigo set inside ivory surroundings | Extra front wave below stage, seats, or extra UI. Text remains DOM. |
| E · Mobile ending | Act V / mobile reference | Elevated frontal crop, stage first, text in its own flow, quiet ending actions | Hanging lantern, extra pier geometry and pill-shaped oversized buttons. Keep one original wheeled lantern. |

## Locked art direction

- Studio / page: warm ivory `#F3EEE5`; text: deep near-black teal `#203631`.
- Door: vermilion `#D84A35`; painted room: teal `#2C5B5D`; proscenium: cream `#F2E5CB`; night: indigo `#142C46`; timber: warm `#C7AF8C`.
- Matte paint, shallow brush variation, fine fiber, plank seams, clean cut edges; no bloom or film-grain overlay obscuring text.
- Fraunces Variable for the wordmark and editorial headings; Source Sans 3 for body and all controls. Fonts and OFL notices are local.
- A thin baseline, restrained red active indicators, flat text buttons and native range controls. No cards, badges, invented readouts, or floating control dashboard.
- Text and model occupy separate layout regions. No important DOM text is painted into a texture.

## Geometry and medium

Three.js, real perspective camera, original geometry and procedural painted textures. A 12 × 8 model platform, roughly 6.6-high proscenium, shallow raised revolve, one continuous curved rail. Exact artistic dimensions may be tuned to tested sightlines; this is not a construction drawing.

The door, lantern carriage and rail share the revolve coordinate system. Four double-sided side flats have thickness, rear battens and diagonal braces. Three short wave panels occupy distinct depth lanes and rise from real guided trap slots; the safe front lane enters first and the rear lane waits for its rotating flat to clear; the open right underside reveals their parked positions. This original miniature mechanism replaces the concept’s lateral wave trucks to avoid sweep conflicts with the proscenium. One moon disc hangs from a bracketed batten on two connected lines; a fixed upper roller unrolls the star cloth between vertical guides. The cloth and its finite star points move together, with no full-size board parked above the model. Real shadow-casting sidelight changes position with Light. Neutral work light grows with the wing angle.

## Stable compositions

| Act | Stable image | Copy / UI safety | Living hold |
| --- | --- | --- | --- |
| I · Believe | Audience near front-left, full cream frame, teal room, red door at right, lantern near door, slanted window light | Title in top band; independent lower-left reading column | Small lantern glow; no camera loop |
| II · The Other Side | Right wing view reveals board thickness, battens, rails, parked waves; door still visible | Smaller heading and short construction note in left column | Neutral work light; scenery stays assembled |
| III · Change the World | Fully settled paper sea, teal coast reverse faces, visible rail and lantern | Sea gets its own hold and reading interval | Low-amplitude offset wave travel |
| IV · Call the Cue | Default night, moon above door, lantern out on rail | Scene, View, Light and reset in left column; mobile below stage | Local cue controller, real effect and ready/moving status |
| V · Believe Again | Audience camera, selected world and light retained; lantern returns to door; warm door gap | Signature, lighter ending sentence, two text actions | Quiet hold; no forced replay |

## Choreography and state boundaries

Page progress `p` comes from one ScrollTrigger updated by Lenis, both scheduled by one GSAP ticker. Chapter anchors: I=0, II=.29, III=.55, IV=.735, V=.985. These are design coordinates, not percentages shown to visitors.

| Handoff | Range | 0% | 25% | 50% | 75% | 100% |
| --- | --- | --- | --- | --- | --- | --- |
| I → II | .12–.26 | Full room | Front column starts to occlude; old text fades | Painted face separates from backing | Work light exposes supports | Full wing composition |
| II → III | .34–.52 | Room at wings | Right coast rotates into view | Left room and right coast share the frame; front wave enters | Left flats clear; remaining waves enter | Full sea, front-leaning camera |
| III → IV | .60–.68 | Sea | Stars begin their vertical travel | Moon descends, side light cools | Camera finds night triangle | Director default or saved choices |
| IV → V | .82–.94 | Immutable current cue snapshot | Controls leave; scene signature appears | Frame obscures mechanics; lantern travels home | Warm doorway becomes focus | Selected stable world, full ending |

All handoffs use the same real objects in both directions. No two-scene opacity blend. Every intermediate sample is a real camera and mechanism state. The stage remains visible when text changes.

## Control ownership

| Owner | Owns | Does not own |
| --- | --- | --- |
| Author narrative | Camera path and first three acts | Saved director choices |
| Director state | Scene target, view and light, local finite cue | Scroll progress |
| Exit snapshot | Captured world, lantern position, view, light, target and remaining path | Live local cue clock |
| Environment clock | Small wave and lantern breathing only | Structural transforms |
| Renderer | Applies one evaluated pose | Starts no independent camera or scenery tween |

Cue retargets start at the current scalar position on a collision-separated authored mechanism path, with the latest target replacing any prior target. Exiting captures once; reverse motion through the handoff never captures again. A true reentry resumes local work. A later exit after resumed work may capture a new pose within the same production revision to preserve boundary continuity.

## Responsive composition

Desktop: wide title band, 28–30% reading rail, 70–72% theatre region. The model is framed as an object with contact shadow; typography never intersects the door or moon. At 4K, use restrained maximum content width and a capped render pixel budget rather than native-resolution offscreen buffers.

Mobile/tablet portrait: separate compact heading, theatre above copy, the same tested audience elevation and bounded wing arc, framed to the available canvas; navigation is a five-act rail. The reading/control region uses real layout height. Short viewports may scroll the full composition vertically; body copy and controls are not squeezed into a fixed 100vh box. At 320px, door and lantern must remain recognizable.

## Resilience

First paint uses a local poster captured from the completed real model, at matching framing, until WebGL renders. A static reading mode has room, wings, sea and night views and honest unavailable-control text. Reduced motion preserves all scenes, views and light controls while settling mechanical cues immediately. Hidden tabs pause the clock; restoration clamps frame delta. Context loss shows static art and a retry action; restoration reconstructs from the current state.

## Verification standard

Compare A/B/D/E with actual desktop/mobile/4K images for (1) story anchor, (2) camera and scale, (3) ivory/teal/red palette, (4) separate text regions and type, (5) material edges and shadows, (6) control proportions, (7) mobile ordering. Inspect all stable acts and 0/25/50/75/100% handoff frames in both directions. Record intentional reference deviations above rather than claiming a photoreal concept is identical to real-time geometry.

## Refinements from actual rendering

The final camera uses a bounded −.085 to 1.35-radian arc. A longer wing angle clears both the near column and right scenic flat from the lantern sightline. The audience uses a .15 elevation baseline; an earlier higher phone elevation clipped the moon. For a tall canvas (aspect below 1.1), audience eye height is capped at 6.05 model units and blended back into the elevated wing view, keeping the whole moon below the near valance at 4K. A separate 32-pixel strip protects the caption. The moon stops at Y=4.37 below its Y=7.32 suspension. The inner left flat was widened to 4.30 units to make the room read as a connected wall; side flats retain their .64 / −.95-radian stable offsets.

Actual screenshots prompted lighter cream and timber material bases, thinner charcoal rigging and one shadow-casting sidelight; the fill light supplies illumination without a second shadow pass. NIGHT applies a continuous blue gel to the same painted coast maps and dims the sea, while preserving the ivory shell and vermilion door. The ending point-light intensity was reduced so the thin opening carries warmth without washing out the front of the door. These are documented refinements of the generated concepts, not claims of photographic identity.

At the ROOM→SEA midpoint the left room is intact, the right coast is present, and the front wave has entered its clear lane. The wider rear flat finishes before the back wave rises. Actual stage geometry is checked by both rendered midpoints and the sampled envelopes described in `GEOMETRY_CHECK.md`.

Short landscape windows use a compact two-column stage/control layout, including the 720×450 CSS-pixel viewport used for 200% layout/DPR zoom emulation. Footer focus rings sit inside their controls so the lower viewport edge cannot cut them. Native range focus rings also remain inside their input box so endpoint labels stay unobscured.
