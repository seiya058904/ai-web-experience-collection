# BACKSTAGE — Design

## A theatre in a warm studio

The miniature carries the visual weight. A cream proscenium frames teal painted scenery, a vermilion door and a warm paper lantern. Moving to the wings reveals the thickness and timber supports that made the first image convincing. The experience remains warm, curious and lightly absurd.

## Tokens

| Token | Value | Role |
| --- | --- | --- |
| Paper | `#F3EEE5` | Continuous warm studio and page background |
| Ink | `#203631` | Headings, controls and primary reading |
| Muted | `#5E675C` | Secondary text and scene captions |
| Rule | `#C9C7B9` | Quiet layout divisions |
| Interface accent | `#BC422D` | Active cue, chapter and focus |
| Door | `#D84A35` | Persistent story anchor |
| Room | `#2C5B5D` | Painted teal scenic faces |
| Proscenium | `#F2E5CB` | Cream stage frame |
| Night | `#142C46` | Indigo night scenery |
| Timber | `#C7AF8C` | Warm platform and support structure |

Three-dimensional lighting changes the rendered appearance of material colors. CSS values describe the interface; they are not a promise that every shaded pixel equals the underlying material hex value.

**Fraunces Variable** supplies the wordmark and editorial headings. **Source Sans 3** supplies copy, captions, buttons and ranges. Both are served locally. Headings have a moderate weight and short measure; functional text remains calm and explicit. Important words are never baked into a texture.

## Composition

The desktop stage occupies the larger right-hand area beneath a separate title band. A narrow left reading area carries the current act and, in Act IV, the director’s controls. The Roman-numeral chapter rail and Still mode sit at the lower edge. Borders mark regions without surrounding every element with a card.

The stage and text share a pinned composition, with sufficient real document travel for each reveal and hold. Text fades out before the next act’s copy arrives; the stage persists throughout. On mobile, the theatre appears above the reading area and controls. A shared tested audience elevation, a bounded wing arc and responsive framing preserve the door, lamp and layered scenery. A separate caption strip keeps the labels clear of the model. Short screens are allowed extra layout height instead of compressing all content into one viewport.

## Form and material

The cream frame uses restrained stepped construction. Four double-sided scenic flats have real thickness, rear battens and diagonal braces. A shallow revolve carries the door, rail and lantern carriage together. Three rigid wave panels rise from separate guided slots: front first, rear only after the wide rotating flat clears. A moon disc on connected suspension, a bracketed batten and a roller-operated star cloth complete NIGHT. A continuous blue-gel treatment dims the same coast paintings and wave surfaces during the night cue.

Original Canvas-painted textures provide brush variation, wood grain and scenic perspective. Geometry provides edges and occlusion. Matte surfaces, low-amplitude movement and readable shadows preserve the sense of a handmade model. There is no bloom layer that hides the joints.

The work uses theatrical structural principles, original simplified mechanisms and artistic perspective. It is not a scale replica or a construction plan.

## Motion and controls

One GSAP ticker schedules Lenis, ScrollTrigger-derived progress, the pure director state and drawing. Authored narrative, visitor choices, finite cue time and ambient motion have separate ownership. The renderer applies their coordinated result.

The principal handoffs are `.12–.26` for audience to wings, `.34–.52` for room to sea, `.60–.68` for sea to director, and `.82–.94` for director to ending. The precise state and snapshot contract is in [STATE.md](docs/STATE.md).

Scene buttons use an underline and restrained accent; View and Light remain native ranges. Focus is explicit. Hidden panels become inert. Still mode removes ambient movement and settles deliberate scenic changes while retaining all controls.

## Reference decisions

Five actual generated studies live in `docs/references/concept-A.png` through `concept-E.png` and are all **reference only**. A guides the entrance, B the wing reveal, C the intermediate scenic change, D the director composition, and E the mobile ending. The live stage is original geometry, not a concept image moved across the screen.

The adopted material, layout and camera relationships—and exclusions such as extra furniture, ornamental shell detail and the generated hanging lantern—are documented in the [Visual Bible](docs/VISUAL_BIBLE.md). Full prompts and returned-file records are in [IMAGE_GENERATION.json](docs/IMAGE_GENERATION.json).
