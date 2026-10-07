# PARALLAX — Implementation guide

This is an independent Collection document at `/parallax/`. `pages/parallax/index.html` and `experiences/parallax/src/` are its editable source; runtime images, fonts, notices and the portable GLB live in `public/parallax/`. The running exhibition builds its geometry from `src/model.js` so that every fragment retains its identity across all ten chapters. Original prepared output and standalone tooling are omitted; the intact ZIP and original implementation record remain source history.

## The one timeline

The document position is the only chapter progress authority. `src/timeline.js` maps measured document distance to normalized progress from 0 to 9, and exposes the inverse `scrollFromProgress()`. Reflection → Rift receives 1.8 times the original travel, Rift → Membrane 1.9 times, and Membrane → Chroma 1.35 times; the outer journeys retain their original density. A monotone cubic distance curve has shared positive derivatives at chapter joins. This changes available scroll distance, without adding time-based pose easing.

`src/app.js` uses that same inverse for actual section heights, Index destinations, immediate restoration and pending-navigation arrival. Section tops and native anchors therefore agree with the authored poses. The final section retains one base span. Without JavaScript, the semantic chapters retain their original readable layout. Presentation, camera, fragment, light and optical states all sample the same normalized value.

Logical chapter geometry never transitions. Reduced-mode CSS uses zero transition duration as well: a globally applied tiny nonzero duration can animate initial heights or body margins for one frame, causing Lenis to measure an old limit. Both system-reduced initial hashes and immediate Index destinations must agree with the final semantic section tops.

The Collection adds one existing locked Lenis instance: `lerp: .105`, `syncTouch: false`, `autoRaf: false`, `autoResize: false`. Its `raf()` runs before progress sampling on the existing on-demand `draw()` clock. Frames continue only while scrolling or bounded pointer response settles, then stop. A foreground delta capped at 50 ms drives Lenis; idle, visibility and page restoration reset the timestamp. There is no second scene-progress easing, accumulated object rotation or perpetual ambient animation. Returning to the same document and pointer position produces the same authored pose.

A resize samples normalized progress before changing the span, explicitly measures Lenis and restores the corresponding position immediately. An in-progress Index destination is rebased by chapter index and continues through the same Lenis instance. Arrival clears the intent. Fresh wheel, pointer, touch or scrolling-key input cancels chapter navigation; reverse wheel input cancels its previous inertia before consuming the new delta. The pending index never supplies rendered progress. Reduced motion disables wheel smoothing and programmatic travel. Dialog scrolling and touch remain native; opening Index stops the background scroller and closing it resumes synchronously before chapter navigation.

Align view supersedes any pending destination, restores the reference immediately and replaces the URL with `#alignment` without adding a history entry. The interface also handles regular refresh, page restoration, background visibility changes and graphics context loss. The Index uses real chapter anchors and browser history.

## One authored object

`MASTER_SPEC` in `src/model.js` defines the asymmetric outer profile, oblique aperture, depth, bevel and fragment divisions. Eighteen named structural pieces share the stone and chrome materials. The incision is attached to one crown fragment, so it moves with the object.

Front faces and their small bevels remain black stone. The exposed interior and fracture surfaces are chrome. Face-aware UV projection gives the side walls real texture coordinates instead of stretching a front-face map into stripes. The source stone map is an AI-generated production texture; its neutral treatment is also authored in the material shader.

The same meshes are separated, moved along alignment rays, opened into the Rift, returned to their rest transforms and seen in the final room. Neither the reflection nor the reassembled state loads a substitute model.

## Exact perspective alignment

For a point **P** in fragment *i*, a reference camera position **C**, and a positive depth scale *sᵢ*, the alignment pose is:

```text
P_aligned = C + s_i × (P − C)
```

Every vertex of a fragment is scaled uniformly about **C**. Its position changes along the camera ray, so its projected position remains the same at that camera. Different pieces use different scales and consequently occupy different depths. Moving to another camera position breaks the agreement.

The landscape and portrait compositions use their own reference camera. Portrait tablets share the centred camera, reference rays and mirror framing used on phones. Narrow landscape frames widen the field of view slightly to leave room for the footer; the close Rift passage retains its authored field of view. **Align view** returns to the exact reference; the accessible range input and pointer movement reveal the separated depths. The mathematical tests verify invariant projection and the loss of alignment from a moved viewpoint. The browser diagnostics also measure the difference between the reference silhouette and the current projected geometry.

## Live optics

`src/optics.js` owns the render targets and their lifecycle.

| Surface | Production method |
|---|---|
| Wall mirror | A true reflected perspective camera, clipping plane and render target. The same live sculpture is rendered from the reflected viewpoint. Physical room planes and the selected architecture participate in the mirror environment. |
| Floor | A separate planar reflection with transparent distance falloff. Its geometric reach includes the final museum viewpoint. The floor and wall reflections are used selectively. |
| Membrane | A subdivided, bounded optical sheet samples a fresh capture of the sculpture and the gallery field. View-dependent refraction, a tensioned crease, Fresnel response and restrained spectral separation alter the image behind the film. |
| Chrome | A physical material samples an authored architectural environment with warm room fill, framed windows and narrow transverse skylight bands. Reflected gradients depend on surface normals and the real camera. The environment blends back to the original studio field for CHROMA and HALO. CHROMA adds a spectral coating driven by the reflected view direction, preserving polished silver between cobalt/violet bands and small ruby/amber fringes. |
| Halo | Illumination of the original mass is reduced while its existing outer and aperture contours and single incision remain. No alternate object is introduced. |

The membrane is not a static distorted image of the sculpture. Each needed frame captures the live geometry with the optical surfaces temporarily excluded, then uses that capture through the sheet. Render-target state and visibility are restored after capture.

The mirror and refraction buffers use supported multisampling where available. Their resolution is bounded independently of the main canvas. The AI-generated source images remain at their documented raster resolution.

## The Rift

The close camera path approaches the aperture, while the heavy side pieces open. At normalized progress around **4.2**, the camera crosses the actual sculpture plane. Near cut surfaces, intermediate piers and overhead slabs give the passage real occlusion and parallax. A selected generated gallery is projected into the distant field to supply architectural detail and atmosphere.

This is a hybrid spatial scene: the distant architecture is an image projection, while the opening and camera passage are live geometry. The entire interior is not a fully modelled building. The same distinction applies to the final monumental room.

The return follows a broad arc after the camera clears the aperture, instead of the original rapid turn at 4.35–4.5 followed by two more short turns. Intermediate waypoints use shape-preserving cubic Hermite interpolation with shared velocities. Complete chapter viewpoints retain their resting ease. Unit viewing direction is interpolated separately from target reach, so a moving target cannot approach the camera and whip its view. The portrait return pulls back earlier to bring the entire form above the captions. The Alignment and Membrane destinations remain unchanged.

The architectural materials fade through the entrance and exit before their group is disabled. Pointer and locked-view influence blend into and out of the exact alignment plateau. All these states remain deterministic functions of document progress; they add no animation clock or delayed pose state.

## Opening and typography

The opening uses the selected transparent sculpture cutout over a separate empty gallery image. A CSS floor reflection and contact treatment belong to this editorial composition. Small pointer separation is intentionally bounded.

Before the live fragments take over, the opening pulls back to their approximate scale and centre. Its short handoff is independent of the earlier title fade, which prevents two display headings from overlapping. The spatial scenes thereafter use the persistent model.

All headings, navigation and explanatory copy remain DOM text. The h1 sits behind the artwork. Portrait phones use a vertical composition; portrait tablets centre the hero and spatial camera while retaining the tablet text scale. The opening's crop is bounded by both viewport height and width, protecting the lower copy in 4:3 landscape. Short landscape screens place the wordmark below the masthead and keep a compact scroll prompt on the clear floor. During the Rift, the UI adapts its contrast to bright chrome and the revealed room. Focus artwork suppresses labels without removing the return control.

## Access and failure behavior

- Real buttons, links, headings and a native modal dialog provide navigation. Escape closes the Index and restores focus.
- Hidden chapter controls do not receive pointer input or keyboard tab stops.
- The alignment range supports touch and keyboard input. Lifting a finger preserves the selected view; only a departing mouse resets hover parallax.
- Reduced motion follows the operating-system preference until explicitly overridden, selects chapter resting poses, removes pointer movement and uses instant anchor travel.
- WebGL failure, compilation failure or context loss reveals a labelled still presentation with local imagery, chapter text and a retry action. This mode does not claim to reproduce the live spatial behavior.
- On context loss, the committed stage is disposed before restoration. The restored context receives a fresh stage sampled from the current scroll position.
- Image textures finish loading before the renderer and reflection environments are allocated. A context interruption during image loading therefore cannot carry pre-restoration GPU targets into the first live frame. Failed initialization releases the textures and any GPU resources already created.
- `disposeExhibition()` removes listeners and releases the renderer; the spatial and optical modules dispose their geometry, materials, textures and targets.

## Local files and editing

| File | Responsibility |
|---|---|
| `index.html` | Semantic exhibition content, local imports, Index and controls. |
| `src/style.css` | Responsive composition, typography, editorial layers and interface. |
| `src/app.js` | Scroll authority, interaction, accessibility state and lifecycle. |
| `src/timeline.js` | Pure presentation sampling. |
| `src/model.js` | Original profile, fragment geometry and shared materials. |
| `src/spatial-math.js` | Camera path interpolation and ray scaling. |
| `src/spatial.js` | Persistent scene, camera choreography, lighting and Rift. |
| `src/optics.js` | Actual mirror and membrane capture/rendering. |
| `scripts/export-model.mjs` | Dependency-free portable GLB export from the model source. |
| `assets/provenance.json` | Machine-readable source asset inventory, prompts and hashes. |

Use the root Collection commands: `npm test`, `npm run build` and `npm run verify:build`, then the project-path build documented in the root README. Supplied projection checks and focused camera, distance-mapping and continuity tests run in the root suite. There is no nested package, server or model-export command. The historical exporter is retained only as source evidence in `provenance/parallax/tools/`; do not run it against the relocated layout without adapting its original paths. Generated images and the supplied assembled GLB are not regenerated during intake.

The GLB preserves the assembled geometry, names, transforms, texture and conventional PBR material mapping. The website's exact studio lighting, custom optical shaders, animated camera and chapter behavior remain in the source modules rather than in the GLB.

See [the visual reader](VISUAL_BIBLE.html), [the full Visual Bible](VISUAL_BIBLE.md), [deployed asset provenance](../../public/parallax/ATTRIBUTION.md), [acceptance](ACCEPTANCE.md) and [root README](../../README.md). Imported `UPSTREAM-*` documents describe the original local delivery, not Collection commands or current acceptance. Hidden tabs cancel old inertia and the RAF; BFCache keeps the cached instance, while final exits and HMR dispose listeners, Lenis and GPU resources.
