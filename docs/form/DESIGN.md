# FORM — Design and motion notes

## The authored world

Three objects share a small vocabulary: a continuous curve, a restrained metal support, an intelligible connection, and a carefully resolved edge. ARC is a bent shell above a sled frame; ORB translates the curve into a revolved shade; PLANE resolves the family into a circular stone surface and three supporting axes. Keep these relationships visible when changing the design. New object types should earn their place through the existing narrative.

The hero combines oversized typography and an actual object. Subsequent chapters change scale, illumination, structure, and the observer's relationship to the object. A passage should still be a composed picture when scrolling stops. Objects, dimensions, and captions belong to the same space.

## Visual tokens

The authoritative values live in `src/styles.css`, `src/world/materials.js`, and `src/world/world.js`.

| Token | Current value / rule | Role |
| --- | --- | --- |
| Warm surface | `#eeeae3` | Daylight studio ground and interface background |
| Ink | `#262521` | Type and line hierarchy |
| Secondary ink | `#6b685f` | Captions and supporting copy |
| Accent | `#a4573a` | Active measure, selected chapter, focus and interaction |
| Night field | `#22221f` | Lamp and section studies |
| Rule | Ink at 24% opacity | Measured, restrained divisions |
| Desktop gutter | `clamp(22px, 3.6vw, 152px)` | Shared editorial alignment |
| Portrait gutter | `22px` | Readable narrow-screen edge |
| Typography | DM Sans; IBM Plex Mono | Sculptural headings; measured labels and controls |
| Narrative travel | `165svh` per chapter; portrait `140svh` | Scroll distance, separate from the fixed visual stage |

DM Sans uses fluid scale and tight heading tracking. IBM Plex Mono is reserved for labels, measures, chapter indices, and small controls. Both fonts are local WOFF2 assets. Avoid adding a third family or turning small annotations into competing headlines. Material colour should provide most of the chromatic interest; the accent remains sparse.

## Scene lifecycle

The timeline in `src/director.js` is the source of truth. A pose contains object transforms, exploded amounts, camera span and target, darkness, grid, and chapter-specific weights. Normalized progress covers eight chapters from 0 to 8. The first and final poses also provide stable limits for initial load and end-of-scroll.

1. **Enter:** acquire an edge, volume, or plane from the previous composition and move the observer into the new relationship.
2. **Stable composition:** allow the full subject, title, and important annotation to become readable together.
3. **Living hold:** use small, continuous camera and light changes while retaining the composition; user controls remain available.
4. **Handoff:** transfer a recognizable contour or plane toward the next subject.
5. **Exit:** relinquish the previous title and controls only as the new geometric relationship becomes established.

The inherited contour in `src/world/drafting.js` reads the chair's actual perimeter and travels through the lamp, table, and final spatial frame. Dimensions and assembly guides follow model transforms. SVG labels are projected from 3D anchors rather than placed over a guessed screenshot. Preserve that registration when changing camera or geometry.

The scene uses a perspective camera. The Proportion chapter narrows its field of view and compensates the camera distance to approach an orthographic-looking measurement view while retaining the same camera. Do not replace this with a projection-type switch that changes composition abruptly. During Material, the chair's supporting frames travel down their assembly axis so the shell can occupy the close view. During the final family handoff, use the tabletop height to place the lamp; it should settle onto a surface rather than float independently through the composition.

The completed film must remain seekable. A chapter must not require another chapter's entrance callback to have run. Do not replace absolute sampling with accumulating position changes, queued scroll tweens, or chained completion callbacks. Test forward and backward paths when adding keyframes.

## Object integrity

The shell has real thickness and seven veneer bands. Support tabs, tie rods, pads, bolts, and washers are geometries with defined positions. The lamp has exterior and interior surfaces, a diffuser, collar, retaining details, and a clipping-plane-aligned ribbon that exposes the material thickness. The table has a top, a three-way support, three legs, mounting plates, and captive fixings.

Exploded poses must be offsets from a stable assembled state. Reverse assembly must return to that exact state. Keep material UVs continuous around bends and use planar mapping on the stone top. Normalize procedural normals and tangents after construction; tiny lathed details are especially sensitive to seam errors. Local clipping planes must be transformed when any relevant ancestor moves, rotates, or scales.

Screen measurements are rounded concept dimensions. They explain proportion and do not claim CAD, manufacturing, structural, or electrical validation. Keep that distinction in the README instead of adding intrusive technical warnings to the experience.

## Runtime and responsive constraints

Use the existing GSAP application ticker. It advances Lenis and offers the newest scroll pose to the renderer; Lenis does not run its own RAF. Retain one ScrollTrigger over the continuous experience and the sticky viewport. Additional objects and drawing systems should expose update methods that the world calls; they should not own animation loops or independent timers.

The renderer uses a nonblocking WebGL 2 fence to keep at most one submitted GPU frame in flight. While it is busy, keep advancing the current scroll position without accumulating render jobs. Once the fence completes, render the newest state and its matching annotations. Do not add a blocking GPU wait or replay skipped intermediate poses after a fast scroll.

Portrait composition is separately directed at 700 CSS pixels and below. Text occupies the upper part of the page while the primary object uses a lower stage. The finale gets its own camera framing and scale relationship. Labels are reduced to maintain clarity, and controls are repositioned. Do not fix narrow screens by scaling the whole desktop interface.

Light also compensates its camera span when a desktop frame is narrower than a 1.6 aspect ratio. This correction follows the existing Light weight, preserving the complete shade, stem and base through a narrow tablet hold; Material and Detail retain their authored close views. The separately directed portrait poses keep their existing span. Reload and document Back retain the browser's latest observation point; only fresh hash entry seeks the chapter's authored destination.

Reduced motion uses stable per-chapter poses, snaps local transitions, and skips redundant idle rendering. Keep all reading and interaction available. Retain the WebGL fallback, native controls, focus outlines, native Index dialog, and noninteractive hidden chapters.

The renderer caps DPR at 1.5 on desktop and 1.6 on mobile. Its total-pixel budget begins at 2,800,000. Four consecutive frames whose fences are observed as complete more than 70 ms after submission trigger a reduction to 78% of the current budget, with a floor of 1,100,000 pixels. The elapsed interval is an observed completion heuristic that also depends on when the application checks the fence; it is not a GPU timer-query measurement. This adaptation changes raster resolution, leaving CSS layout, geometry, and narrative state intact. Preserve that separation when adjusting the budget. Neither native 4K raster resolution nor a particular FPS is promised.

Prefer geometry, transforms, modest lighting changes, and small reused textures to full-screen blur or per-frame DOM layout reads. The app must remain self-contained at runtime.

## Review after a change

Run `npm run check` and `npm run build`. Inspect normal and slow scroll, sharp reversals, the middle of every handoff, direct hash links, browser history, Index, material/light/section/assembly controls, resize, portrait framing, and reduced motion. Stop at arbitrary points: the object should retain a clear silhouette, headings should have intentional space, and dimension or detail labels should still point to their geometry.

Keep only the final source, required assets, reproducible package files, notices, and current production build in the deliverable. Research images, QA captures, traces, dependency directories, logs, and intermediate builds are working materials rather than website assets.
