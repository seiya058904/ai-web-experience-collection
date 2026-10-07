# AETERNA — Visual Bible

## Direction
A monumental face, cut by a title. A stone body, assembled and then broken. An ivory conservation room. A final distant gaze. This is an exhibition experienced through scale, light and the physical weight of fragments.

The visual pass explored a dark colossal head, an ivory monumental draped figure, marble grain and tool marks, profiles, bronze patina, hands, architectural ruins, museum shafts of light, conservation environments, a deep relief, and absence. The selected dark hero is in `../../provenance/aeterna/design/references/hero-selected.webp`; the retained material/light board is `../../provenance/aeterna/design/references/material-and-light.webp`. Each production plate is also a full-resolution scene keyframe. Exact prompts, native resolutions and asset hashes are in `../../provenance/aeterna/AI_ASSETS.json`. No image is described as a photograph of a real named ancient object.

## Composition system

- Near-black gallery: #111210 / #0a0b0a. Bone-white type: #ede7dc. Muted stone: #b7b0a6.
- Ivory archive: #ded9cf. Ink: #242521. Bronze is a deep mineral green, never a gold accent.
- Bodoni Moda for monumental and quiet classical display; Manrope for precise controls and annotations. All fonts self-hosted.
- Desktop gutter 3.2vw; image scale owns the viewport. Reserve the left 38–43% for reading in the body, portraits and monument scenes.
- No boxed card grids. The three component families are a fine navigation rail, an unboxed reading column, and a small labeled exhibit control.
- The title is real HTML. Hero uses a separate foreground mask to create actual overlap. No UI is baked into an image.
- Mobile is recomposed: sculpture above or behind short text, controls clear of the face, persistent room counter in place of the desktop nine-position rail.

## Medium decisions

| Room | Desired final frame | AI reference | Production medium | Why |
|---|---|---|---|---|
| I. The Colossus | Immense right-cropped marble face; near-black left space; AETERNA interlocked with the face | Selected dark hero and refined clean plate | ImageGen production plate, foreground alpha, HTML type, restrained layered movement | Preserves stone fidelity while motion stays small enough to remain believable |
| II. Stone Becomes Flesh | The eye and its chisel marks become a landscape; intimate raking light | Dedicated eye macro | ImageGen macro, controlled crop/inspection, code-native annotation | Macro grain is stronger in a photograph than an invented real-time face mesh |
| III. The Face of Power | A severe lined face gives way to calm idealization in the same spatial register | Two full-resolution anonymous portraits | Coordinated production plates and a directional reveal controlled by scroll or selection | The meaningful change is the political image and silhouette, not an implausible face morph |
| IV. Body / Authority | A recognisable human form assembles from heavy fitted pieces; scars remain visible | Draped torso/fracture reference | Actual SMK plaster-cast scan, digitally sectioned solid geometry in Three.js | True fracture edges, parallax, side lighting and spatial alignment require actual geometry |
| V. Monument | Statue, arch and small foreground hand create a vast difference of scale | Dedicated architectural-scale plate | ImageGen environment, controlled camera crop, layered typography | An atmospheric establishment frame retains photographic quality without expensive invented architecture |
| VI. History Carved in Stone | A shallow-seeming relief becomes a round object with a world of carved figures | Deep relief keyframe, raking-light board | Met wellhead scan with original maps and real camera travel; AI relief as the initial interpretive plate | Real museum geometry lets the visitor see the carving's depth and the cylindrical continuation of its myths |
| VII. Fracture | The assembled body loses cohesion; a face fragment and absent plinth remain | Dedicated fracture/absence plate | The same genuine geometry disperses along deterministic paths, then yields to the absence plate | Reuses actual matched fragments; avoids unrelated rocks masquerading as a reconstruction |
| VIII. Afterlife | Bright conservation gallery; a transition into an inspectable cast with light controls | Dedicated ivory gallery | ImageGen gallery plus explicit artifact-inspection state with the same 3D cast | Still photographic gallery and interactive object study serve different viewing tasks |
| IX. Aeterna | A tiny bust in a vast dark hall; almost no movement | Dedicated final-gallery plate | ImageGen final plate and restrained live HTML type | The ending needs stillness and negative space rather than spectacle |

## Camera and motion
One native scroll position determines all room progress. Each room enters, reaches a stable composition, holds a small material movement, hands off, and exits. Scrubbing backwards reverses the same deterministic mapping. The body and fracture chapters share source coordinates; reassembly does not swap to a different mesh. Relief uses a real scanned object, not an image tilted in CSS.

Geometry and scroll progress must respond immediately to fast scroll or refresh. Pointer influence is small and independently damped. Off-screen rendering stops. Reduced motion removes ambient movement and camera travel while retaining manual exhibit controls and chapter navigation. The ending is still.

## Historical fidelity
The hero, anonymous portraits, macro and imagined galleries are interpretive images. The real Herakles mesh is a scan of SMK's later plaster cast after a Roman marble, not a scan of the Roman marble itself. Its artificial cuts are a digital study. The relief object is the Met's second-century Roman wellhead (2019.7); the initial generated procession is an interpretive opening image, never a claimed scan of that object. White marble is presented as a modern museum encounter; the notes establish ancient polychromy and its uncertain reconstruction.

## First viewport copy lock
AETERNA; The exhibition; Index; An empire, held in stone.; AETERNA; Rome in Marble and Memory; I II III IV V VI VII VIII IX; Scroll to enter. A reduced-motion control and a mobile chapter counter are accessible responsive extensions. No invented statistics, badges or commercial claims.

## Review standard
Compare the selected hero against the actual browser frame at 1672×941 and 3840×2160, then inspect the full room sequence at desktop and mobile widths. Verify material scale, negative space, type, composition, foreground masking, legibility, motion state and actual scene controls. Native source images are retained at their delivered resolution; a 4K screenshot is a viewport check, not a claim that generated assets were natively rendered at 4K.
