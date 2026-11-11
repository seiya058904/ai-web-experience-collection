# PAPERSUN — architecture

## Experience model

PAPERSUN is a static browser application: English HTML narration flows through eleven sections while a fixed decorative theatre provides the corresponding image, exact SVG objects, and transition masks. There is no application backend, database, login, analytics endpoint, runtime model call, or WebGL requirement.

The generated scene art provides physical paper texture and lighting. Code owns the identity-sensitive objects: the three sun fragments, repaired seams, assembly state, puppet poses, wind-wheel, shade, and inventory. This is a layered 2.5D composition, not a freely rotatable three-dimensional world.

## Modules and ownership

| Module | Owns | Important boundary |
| --- | --- | --- |
| `story.ts` | Chapter prose, two beats per chapter, tool descriptions, transition staging | Content contains no possession side effects. |
| `story-state.ts` | Scroll evaluation and persistence sanitization | Evaluation is a pure function; no previous transition callback is required. |
| `fragments.ts` | Circle radius, three closed paths, shared seams, fragment/sun markup | Every fragment rendering uses these paths. |
| `carrier.ts` | Native Mira/hand/holder poses, holder material, exact fixture poses, separated slots and loose-piece ownership | Pure native geometry: one held fragment ID belongs to either its discovery fixture or the holder. A placed table ID belongs to the root disc. |
| `stage-props.ts` | Mira and joint definitions, lanterns, note, wheel, shade, held carriers, thread, and fallback scenes | Uses the shared carrier helpers; scene props do not own a second assembled sun. |
| `transition-props.ts` | Authored foreground paper, one moving journey actor/holder, discovered-piece transforms and registered occluders | Does not collect pieces or create a joined sun. Its shared actor replaces both underlying scene actors during TR05–TR07. |
| `assets.ts` | Asset URL selection, shared image-load promises, neighboring preloads | Failed art cannot erase the story. |
| `scene-renderer.ts` | Two stage surfaces, art registration, readiness and request serials | A stale request cannot take ownership of a later scene. |
| `main.ts` | DOM, dialogs, actions, navigation, Lenis/GSAP coordination, shared sun | One evaluated snapshot drives the visible composition. |
| `audio.ts` | Opt-in action sounds and their lifecycle | No audio context or playback is needed to read or interact. |
| `style.css` | Reading layout, responsive typography, chrome, masks and reduced motion | Meaningful text remains real DOM content. |

## Scroll and rendering

Each chapter has a measured document top and height. `evaluateStory()` receives native scroll position, viewport dimensions, those chapter measurements, and the motion mode. It returns the active chapter, local progress, optional adjacent transition, and overall progress. A transition spans one viewport before the next chapter's top. Its midpoint transfers active chapter identity.

One Lenis instance has `autoRaf: false`. The application's GSAP ticker callback calls `lenis.raf(time * 1000)`. Lenis scroll updates call `ScrollTrigger.update`; a coordinator trigger marks the composition dirty. The renderer consumes the current snapshot rather than an independently eased progress value. The small hero wick-light variation and active, unsteadied wheel oscillation consume that same ticker time. The wheel swing is bounded and its amplitude reaches zero at the scene handoffs; core geometry remains a direct function of position.

The two scene surfaces display the outgoing and incoming composition. Boundary-specific masks establish the transfer. The bridge-to-worktable transition uses a separate midpoint image between its exterior bridge and interior table. Position-based masks are reversible and support direct transition hashes; they are not forward-only timers.

DOM narration follows normal document flow. It is not painted into raster art, and the entire story remains in selectable DOM text and the text edition. Native browser Find validation remains blocked in the available headless environment; see the acceptance ledger. Chapter links use ordinary hashes with explicit navigation/focus handling. `#tr-08-09@50` is a diagnostic direct-position hash.

On resize and font readiness, chapter measurements, image registration, Lenis dimensions, and trigger boundaries are refreshed. Hidden-page handling removes the main animation callback; returning to the foreground measures again before rendering. The first composition uses authored fallback graphics while image decoding proceeds.

## Exact object identity

The sun lives in a 200 × 200 SVG coordinate system with a centre at (100, 100) and radius 86. Three authored seam profiles terminate at the circular perimeter. Each shared internal edge is stored once and traversed in opposite directions by neighboring fragments. Curved outer edges use SVG arc commands. The same paths appear in the note, preview, inventory, discoveries, table, and repaired sun.

Geometry tests inspect shared edge reuse, sampled area, and dense deterministic point coverage. The sampling tests are numerical checks; the production paths retain exact SVG arcs. Antialiased rendering is a separate browser concern. A separate rendered-ownership regression checks valid discovery/reset combinations on both layouts and every table placement mask: each found physical ID has one held owner, and loose table pieces plus filled disc pieces contain A/B/C exactly once. This static markup test does not establish transient scene-layer visibility or aesthetic contact; the actual motion retakes check those separately.

One `#journey-sun` element belongs to the coordinator, not either scene surface. The table-to-sky transformation moves this object between registered screen positions. Seam identity survives the lift and ending. Generated AI-07 is a lighting reference, because its baked seam layout differs from the canonical paths.

### Fixture, holder, table and disc ownership

`found` records the visitor's discoveries; `placed` records their repair. The physical theatre has one visible owner for each participating gold ID. Interface buttons, inventory thumbnails and the note's drawn outlines are representations of those shapes, not additional world objects. Hidden scene and fallback copies support reverse/direct navigation and are not counted as visible owners.

| State | Physical owner |
| --- | --- |
| Held CH05, repaired lantern | A stays at the revealed lantern fixture. Other found IDs, if revisiting, occupy the hand-held carrier. |
| Held CH06, steadied wheel | B stays at the wheel fixture. Other found IDs occupy the carrier. If the wheel is released after discovery, B remains in the carrier rather than being lost. |
| Held CH07, lifted shade | C stays beneath the arch. Other found IDs occupy the carrier. Lowering the shade after discovery retains C in the carrier. |
| Held CH08 | All found IDs occupy separated slots in Mira's carrier. |
| Moving TR05, TR06 or TR07 | `.journey-handoff` owns one actor, its attached holder and one canonical path per found ID. The coordinator hides the scene actors, `.source-discovery-piece` groups and scene holders on both surfaces. |
| Held CH09 | The bench holder contains `A/B/C − placed`; `#journey-sun` fills only `placed`. This includes a first visit that skipped discoveries, matching the existing “try the repair” controls. |
| Moving TR09 and later narrative outcome | Loose table gold is hidden while the single root disc owns A/B/C. The narrative outcome does not rewrite `found` or `placed`. |

The discovery fixture remains visible in a settled discovery scene so repairing a lantern, steadying the wheel or lifting the shade has a concrete local result. The moving renderer takes over that same path at the exact fixture pose, then moves it into the shared holder. It does not create a second source piece while a carrier copy is already present. At the table, placing an ID removes that ID from the loose holder while filling the same canonical sector in the root disc; removing it restores the loose piece.

### Native attachment and projection

Journey plates use native 1586 × 992 coordinates. `PaperPose` means `translate(x y) scale(scale)` applied to the original SVG path origin; it does not mean a centroid. `piecePoseInCarrier()` converts a fixed slot centroid back into that origin using `FRAGMENTS[id].centroid`. This convention is shared by held scenes and transition endpoints.

The carrier strap meets Mira's actual back-hand grip `(49,194)`, rotated about shoulder `(65,130)` by the existing joint angle: 11 degrees in the walk pose and −8 degrees otherwise. The holder uses 0.8 times Mira's scale and extends left/down from that grip, ending above the boots. The front hand keeps the small lamp. During movement, `journeyHandoff()` recomputes the grip from the interpolated actor and back-arm joint instead of independently easing the holder through viewport percentages.

`frameFor()` projects each native pose into screen space with the same uniform scale and offset as its photograph. Non-phone art is contained between the fixed control bands. Phones use the authored crop/portrait registration. There is no perspective camera or mesh simulation. The CH09 bench holder has native strap origin `(1410,722)` and scale `.88`, to the right of the disc centred at `(1095,650)` with radius 140. This keeps the loose pieces separate from the joined sectors.

The [focused fresh-table check](evidence/local-table-holder-final-results.json) records four actual first arrivals at 320 × 700, 360 × 640, 390 × 844 and 700 × 900 on `index-DkJKhC7c.js` / `index-C8PaC5EY.css`. Each has zero discoveries/placements, exactly three loose table paths and three transparent root-disc paths. All four full-resolution screenshots were viewed: the holder sits on the visible bench and clears the disc/feedback; the complete outline, heading, controls and feedback fit above the footer. This is a scoped headless CSS-viewport result, not a physical-device or moving-transition claim.

### Physical occlusion and scene ownership

Scene ownership and visibility are separate. A hidden path may retain its ID and endpoint pose while an opaque paper edge covers it. Opacity is not used as evidence that a fragment physically moved between places.

For TR06, the wind ridge and valley floor have different support positions. The growing reveal circle is centred at the native wheel pivot `(1065,255)` projected through `frameFor(5)`. Its CSS radius `progress × 145%` is reproduced in SVG as `progress × 1.45 × hypot(viewportWidth, viewportHeight) / sqrt(2)`. A solid annular paper lip uses that same outer circle and an inner circle. The renderer derives the covered interval from the complete source actor, holder and piece bounds, and delays target exposure until its nearest bounds are clear. It keeps the source at the wind pose, changes to the target pose only behind that lip, then uncovers the grounded valley pose. All found IDs and the holder share the actor's clip. The lip sits behind the opaque six-blade wheel and leaves geometrically, without an opacity envelope or a rectangular cut through the circular boundary. This replaces the visibly unsupported linear interpolation retained in [the before image](evidence/local-tr06-ground-before.jpg).

For TR07, the valley floor and bridge deck have different support heights. The renderer computes when the actual growing takeover ellipse covers the source actor, holder and source-piece bounds. It keeps Mira grounded until that point, changes the registered pose behind a solid rim attached to the same ellipse, and uncovers the grounded bridge pose through the rim's inner ellipse. The holder and gold share the actor's clip. Rim thickness changes geometrically; this is an occluded handoff between authored support planes, not a claim that Mira walks through open air or that the valley deforms into a bridge.

TR08 uses bridge → authored midpoint → worktable scene ownership. In its second half, `tableReveal = clamp((progress − .5) × 2, 0, 1)`. The worktable and root disc use the same target ellipse. `updateSun()` converts that ellipse into the sun element's local coordinates and keeps its opacity at 1, so it is uncovered with the table rather than fading over an already exposed room. The arch foreground stays above the root disc for this entry. The midpoint does not own a visible puppet or holder; its fallback copies are suppressed, and underlying carriers are hidden with their corresponding scene handoffs.

These statements describe the integrated mechanism. They do not award moving visual acceptance. The [motion review addendum](motion-review-addendum.md) retains the earlier duplicate/fade failures, and the final evidence ledger records the corrective retakes.

## Interaction and persistence

`StoryMemory` separates `found` pieces from `placed` pieces. Discoveries require explicit market, wheel, and shade actions. Previewing and scrolling do not collect. A visitor who jumps to the table can still try the repair; that action does not rewrite their discovery history. Later narrative scenes show Mira's complete outcome while the interface identifies the visitor's own repair state.

Scene resets restore the local prop state and preserve discoveries. Removing a placed piece clears the lifted state. Begin again restores the initial narrative memory. Local storage is optional and guarded against parse or access errors. Versioned recovery filters IDs to A/B/C, eliminates duplicates, reconciles completed discovery flags with the inventory, and rejects a lifted incomplete repair.

The keys are `papersun:story:v1` and `papersun:motion`. They are local browser data, not identifiers transmitted to a remote service. Sound preference is not persisted: each fresh document begins silent.

## Asset lifecycle and fallback

The asset map reuses environments where narrative continuity calls for the same city or workroom. A separate portrait city image is selected for narrow layouts. Shared load promises avoid repeating the same request. A renderer serial increments when scene identity, responsive art selection, or an explicit retry changes; completion checks that serial before updating readiness.

Each stage contains a fallback SVG, raster image, and live-props surface. While art is unavailable, the fallback already contains the correct current prop state and the ordinary props surface is hidden to avoid duplication. When art is ready, the fallback is hidden and live props accompany the raster plate. An unavailable bridge midpoint uses the destination repair-room fallback.

Production images are local WebP files. The app preloads its responsive hero and warms neighboring chapter art. It does not install a service worker or promise an offline cache. An intentionally missing-image diagnostic is enabled by `?test-assets=fail`; removing the query restores normal URLs.

## Access and sound

Navigation and actions use buttons or links; the native dialog supplies modal behavior. Visible focus, destination-heading focus, Escape close, opener restoration, status announcements, and explicit piece controls provide non-drag interaction paths. Reduced motion changes composition to complete still states and suppresses ambient animation while preserving the same story results.

The sound utility creates Web Audio nodes only after intentional enabling. It generates sine tones and a brief seeded filtered-noise grain without sample files. It caps scheduled sources, uses short gain envelopes, silences and stops voices immediately when disabled, and suspends on hidden pages. It introduces neither another animation clock nor a network dependency.

These implementation features do not by themselves constitute a formal accessibility-conformance or physical-device test result. Consult the final evidence record for actual coverage.

## Build and local serving

The lockfile pins the dependency tree. `npm run build` checks TypeScript before Vite creates relative-path static assets in `dist/`. `npm run preview` and `npm run dev` run the included Node static server. `npm run develop` uses Vite for source editing. Launchers build first and bind the static server to loopback.

The server serves files beneath `dist/`, rejects paths outside that root, returns actual missing-file errors, and marks responses as uncached for reliable local iteration. `HOST` and `PORT` are configurable; no server command performs deployment.

For explicit QA requests only, image URLs beneath `/art/` can carry `qa-delay=<milliseconds>`. The server clamps the value to 0–5000 and awaits an independent timer before sending that image. Concurrent requests remain serviceable. This mechanism creates controlled response latency and completion-order scenarios; it is not real bandwidth or CPU throttling. Normal URLs have no injected delay.

The source archive excludes installed dependencies, private credentials, browser profiles, and image-generation transfer buffers. Runtime art, fonts restored through the lockfile, source, provenance, tests, documentation, and evidence are sufficient for the documented rebuild. The archive's clean-extraction check is an independently recorded delivery step.

## Development limitation

The HMR disposer cleans up the main ticker, Lenis, renderers, coordinator, and audio context. Some anonymous document/window/media listeners currently survive a hot replacement. Use a full reload after interactive source edits. This does not add listeners during ordinary production chapter navigation.

## Exact file guide for physical ownership

| File / entry point | Read it when changing |
| --- | --- |
| `src/carrier.ts`: `miraPlacement`, `handPose`, `carrierPose` | Puppet placement, free-hand attachment, holder size or bench placement. |
| `src/carrier.ts`: `sourceFixturePose`, `carrierPiecesForScene`, `scenePiecePose`, `piecePoseInCarrier` | Which physical representation owns A/B/C, or the transform convention for any handoff. |
| `src/carrier.ts`: `renderCarrierBody`, `renderCarrierPiece` | Holder material or canonical loose-piece rendering; preserve opaque base fills and namespaced definitions. |
| `src/stage-props.ts`: `miraJoints`, `miraGroup`, `sceneCarrier`, `journeyMira`, discovery fixtures | Held scene composition and the exact puppet joint geometry reused by movement. |
| `src/transition-props.ts`: `journeyHandoff`, `renderTransitionProp` | Shared moving actor/holder, fixture-to-carrier transforms, registered TR06 circle and TR07 ellipse support rims, wheel exit and blue arch foreground. |
| `src/main.ts`: `transitionMask`, `frame`, `updateSun` | Scene/transition ownership, hiding dormant copies, midpoint staging, root disc mask and table-to-sky placement. |
| `src/scene-renderer.ts`: `frameFor`, `SceneRenderer` | Photograph/prop projection, responsive crop, readiness and stale-request protection. |
| `tests/geometry.test.ts` | Exact tessellation, state sanitization and rendered fixture/carrier/table ownership checks. These are code checks, not screenshot acceptance. |

## References

The [reviewed source register](sources.md) records the primary documentation for Lenis/GSAP, CSS transforms, Canvas APIs, reduced motion, pause/stop controls, and visual-test interpretation. The [story ledger](story-ledger.md), [transition ledger](transition-ledger.md), and [asset record](assets.md) specify the content and visual contracts independently of implementation mechanics.
