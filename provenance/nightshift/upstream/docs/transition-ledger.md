# NIGHTSHIFT transition implementation and evidence

Reviewed: **2026-11-09**. This records the implementation that exists, replacing the earlier design-only ledger. **All ten boundaries PASS the bounded functional staging/capture checks. Exact photographic/projective matching is NOT TESTED.** The masks and guide positions are deliberately authored screen-space geometry; they are not a calibrated physical camera solution. The broader H1–H9 acceptance limits remain in [requirements-evidence.md](requirements-evidence.md).

## Actual shared renderer

| Property | Implemented contract and limitation |
| --- | --- |
| Entity identity | Source and target are separate photographic locations. TR-06-07 additionally uses the real AI-08 midpoint. The amber guide is editorial; it never asserts connected municipal wiring or plumbing. |
| Media | Two opaque photographic slots, local same-key compact fallback images, CSS `clip-path` reveals, CSS foreground bands, an SVG guide and real DOM copy. No runtime Three.js/WebGL, mesh morph, vehicle simulation or character rig. |
| Units and axes | Document geometry in CSS pixels; transition progress 0–1; editorial guide coordinates normalized 0–1 and drawn in a 1000×1000 SVG viewBox. Screen x increases right and y down. The atlas separately uses a 1000×650 viewBox. |
| Projection / pivots | Photos use `object-fit:cover` and per-image/per-breakpoint `object-position`; base photograph scale stays fixed during a boundary. Mask edges translate in screen space; the occluder is centered on the edge. No measured UV-to-desk homography, physical units, FOV, camera target, near/far planes or 3D pivot is implemented. Those camera parameters are inapplicable to this renderer, not silently validated. |
| Depth | Isolated fixed stage at z0; base plate, incoming plate z1, occluder z2, guide z3, edge shade z4; document text z5, chapter rail z25, fixed navigation z30. Native dialogs use the browser top layer. These are compositing levels, not meters of depth. |
| Light / color | Generated plate lighting, materials and contact shadows are baked into each image. Standard browser image/CSS sRGB compositing and local reading/edge shading are used; no custom HDR tone mapper, runtime relighting or calibrated display transform is claimed. CSS band shadows are editorial shading. |
| State authority | `evaluateStory` / `evaluateTransition` in `src/story-state.ts`; geometry from the controller. One Lenis instance (`autoRaf:false`) is advanced by the same GSAP ticker that renders the story and optional hero atmosphere. ScrollTrigger is updated/refreshed from the same lifecycle. |
| Bounds | Boundary start is its document top minus 0.70 viewport height; end is its document bottom minus 0.12 viewport height. `p=clamp((scrollY-start)/(end-start))`. Measurements refresh after layout, fonts, resize and disclosures. |
| Caption ownership | Full-motion source chapter fades from p=.08 to .25 and is hidden at zero opacity; target starts at .80 and reaches full opacity at .96. A separate short editorial boundary caption may remain. The source/target reading blocks do not overlap at midpoint. |
| Mask behavior | Incoming imagery remains opaque where revealed. No whole-image photographic crossfade or global black bridge. Foreground bands are hidden near each reveal phase's endpoints. The guide follows staged points with bounded cubic interpolation and a separate local opacity envelope. |
| Asset readiness | `src/media.ts` retains active scene identity and request tokens. Primary failure falls back to the same key; total image failure retains full text, controls and recoverable error. A late obsolete request cannot replace a new chapter. Current/next demand is prefetched. |
| Reverse / direct | The evaluator is position-based, independent of previous events. Every direct midpoint and reverse quarter-state is tested; high-risk .49/.50/.51 probes are tested. A fresh TR-01-02 hash is tested. Do not infer a fresh cold-loading test of every boundary from those checks. |
| Phone | Dedicated portrait opening below 640px; other scenes use authored subject-preserving crops, shorter transition regions and adjusted foreground widths. The scene identities and interaction results are retained. These are composed crops, not eleven separate portrait generations. |
| Reduced / still modes | Select the complete source before p=.5 and complete target after p=.5, with no moving seam/guide. TR-06-07 does not require its intermediate image in reduced mode. The full no-JS edition exposes both observations and all static outcomes. |

The source of the literal guide points below is `DESIGNS` in `src/story-state.ts`. They are **editorial coordinates, not measured photograph landmarks**. All `.webp` files below live in `public/media/`; the same name in `public/media/fallback/` is the compact fallback. User-selected bakery/market variants remain associated with their chapters.

## Ten authored boundaries

### TR-01-02 — Window to night atlas

**Assets:** `hero` (or `hero-mobile`) → `atlas`. **Mask:** `window`; target enters from the right. **Relationship:** warm window edge / amber atlas guide, linking separate room and notebook settings. **Points at 0/25/50/75/100%:** (.30,.64), (.34,.61), (.44,.54), (.53,.50), (.58,.46).

| Progress | Actual staged composition |
| --- | --- |
| 0% | Complete selected window/city plate and source reading hold. |
| 25% | Desk plate occupies the incoming right portion; a narrow mullion-like band separates it from the city. Source chapter copy is hidden. |
| 50% | City and notebook remain opaque on opposite sides of the band; the amber graphic moves toward its atlas position. |
| 75% | Desk dominates; source city remains confined to the outgoing region. Target copy has not yet entered. |
| 100% | Desk holds beneath the independent accessible atlas and genuine route controls. |

**Fallback / phone:** same-scene desk fallback; portrait opening hands over to a stacked readable atlas/filter layout. **Evidence:** both five-stage sets; three forward/return cycles per main-suite project; direct initial midpoint hash; recorded forward/reverse passage. **Limit:** the SVG is a flat accessible diagram over a desk composition, not a measured reflective-surface projection. **Functional/capture: PASS. Exact projection: NOT TESTED.**

### TR-02-03 — Atlas to bakery

**Assets:** `atlas` → `bakery-before` (or chosen bakery variant). **Mask:** `door`; target enters from the left. **Relationship:** route point / doorway warmth. **Points:** (.58,.46), (.62,.44), (.66,.40), (.68,.38), (.70,.35).

| Progress | Actual staged composition |
| --- | --- |
| 0% | Atlas chapter and current route selection remain available. |
| 25% | Warm bakery enters the left quarter behind the door-like band. |
| 50% | Independent notebook and workbench plates divide at the opaque frame; the graphic point continues across the selected screen region. |
| 75% | Bakery work and flour dominate; atlas is restricted to its remaining region. |
| 100% | Complete bakery plate and its own reading/control hold. |

**Fallback / phone:** matching bakery still; route selection remains a readable labeled control and is not mutated by the transition. **Evidence:** desktop/phone five stages, direct/reverse checks and atlas state/navigation test. **Limit:** route-point/lamp centers are not photogrammetrically registered. **Functional/capture: PASS. Exact projection: NOT TESTED.**

### TR-03-04 — Bakery to care corridor

**Assets:** chosen bakery plate → `care`. **Mask:** `glass`; target enters from the right. **Relationship:** oven/glass edge / cooler corridor strip. **Points:** (.68,.62), (.62,.61), (.54,.60), (.46,.61), (.40,.64).

| Progress | Actual staged composition |
| --- | --- |
| 0% | Bakery work remains wholly visible. |
| 25% | Cooler corridor appears behind the incoming glass-frame band; outgoing copy has left. |
| 50% | Warm kitchen and cooler care scene remain separate opaque pictures. |
| 75% | Corridor dominates without translucent overlapping hands or people. |
| 100% | Care composition, linen/water observation and scene-note control own the hold. |

**Fallback / phone:** `care` fallback; portrait crop retains care objects and anonymous activity. **Evidence:** both five-stage sets, direct/reverse and care-dialog tests. **Limit:** the band is an editorial glass-frame treatment, not refractive ray tracing or calibrated reflection. **Functional/capture: PASS. Exact projection: NOT TESTED.**

### TR-04-05 — Care floor to wet curb

**Assets:** `care` → `curb-before`. **Mask:** `threshold`; target enters from below. **Relationship:** low floor reflection / curb highlight. **Points:** (.38,.68), (.42,.71), (.50,.76), (.55,.78), (.58,.80).

| Progress | Actual staged composition |
| --- | --- |
| 0% | Complete care scene. |
| 25% | Wet curb enters the lower picture behind the horizontal threshold band. |
| 50% | Corridor above and curb below remain separate; the fine guide indicates the editorial floor relationship. |
| 75% | Street texture occupies most of the picture; no old/new primary captions compete. |
| 100% | Street comparison and its real controls become the reading destination. |

**Fallback / phone:** matching curb fallback and vertical local comparison; the transition itself remains a short bottom-up reveal. **Evidence:** both stage sets; comparison persistence; independently reviewed thinner separator. **Limit:** no exact shared floor-plane or reflected-stripe projection was measured. **Functional/capture: PASS. Exact projection: NOT TESTED.**

### TR-05-06 — Curb parallels to rails

**Assets:** `curb-before` → `rail`. **Mask:** `curb`; target enters from below. **Relationship:** converging street/rail directions; two-line editorial SVG cue. **Points:** (.52,.70), (.52,.64), (.52,.58), (.52,.54), (.52,.50).

| Progress | Actual staged composition |
| --- | --- |
| 0% | Complete wet street/curb scene. |
| 25% | Rail bed appears below a shallow opaque structural band. |
| 50% | Rail material is already a distinct photographed scene below the boundary; it is not stretched out of pavement. |
| 75% | Ballast, rails and tunnel worklight dominate at their fixed photograph scale. |
| 100% | Rail composition and long title form a stable reading hold. |

**Fallback / phone:** selected rail still; phone crop keeps rail direction without a long virtual camera flight. **Evidence:** desktop/phone five stages; .49/.50/.51 probes; real recorded forward/reverse passage; independent separator correction review. **Limit:** exact vanishing point, line slope and spacing alignment are not calibrated; an engineering gauge is never implied. **Functional/capture: PASS. Exact projection: NOT TESTED.**

### TR-06-07 — Rail to separate water gallery

**Assets:** `rail` → `rail-water-midpoint` (AI-08) → `water`. **Mask:** `pipe`; both target phases enter from the right. **Relationship:** near pipe/frame and worklight as an editorial bridge between different facilities. **Points:** (.72,.50), (.64,.50), (.50,.50), (.40,.52), (.34,.55).

| Progress | Actual staged composition |
| --- | --- |
| 0% | Complete rail inspection plate. |
| 25% | First reveal is halfway: rail and authored AI-08 composition occupy opposite opaque regions. |
| 50% | AI-08 alone owns the picture; it contains its own near pipe/frame and distinct rail/gallery spaces. |
| 75% | Second reveal is halfway: AI-08 and the complete water plate divide behind the foreground band. |
| 100% | Water gallery alone, with its own title and support/log observations. |

**Fallback / phone:** matching midpoint/water fallbacks; phone crop maintains the pipe and separate gallery. Reduced mode switches between complete rail and water scenes at the midpoint. **Evidence:** both stage sets; exact pure midpoint identity; direct/reverse/.49/.51 probes; real movie; 43 inspected adjacent encoded midpoint frames; callback-pacing measurement. **Limit:** physical pipe silhouette registration and support-outline projection have not been calibrated. These are not identical pipes or shared operational infrastructure. **Functional/capture: PASS. Exact projection: NOT TESTED.**

### TR-07-08 — Gallery edge to inspection room

**Assets:** `water` → `utility`. **Mask:** `corner`; target enters from the right. **Relationship:** floor edge / wall turn. **Points:** (.34,.74), (.40,.69), (.50,.62), (.61,.55), (.65,.51).

| Progress | Actual staged composition |
| --- | --- |
| 0% | Water supports and room remain complete. |
| 25% | Incoming utility room appears behind the narrowed corner band. |
| 50% | Inspector and lamp are visible opposite the water flange; the corner hides the graphic seam. |
| 75% | Utility scene dominates; the old detail block is absent from the transition reading region. |
| 100% | Closed-equipment inspection holds; no pipe-to-cable morph or live grid interface. |

**Fallback / phone:** utility-specific fallback; final phone reading panel sits below inspection action. **Evidence:** both stage sets; specific 25/50/75% independent correction review; three final phone utility holds. **Limit:** floor edges are editorial matches, not a measured continuous physical room. **Functional/capture: PASS. Exact projection: NOT TESTED.**

### TR-08-09 — Task lamp to market light

**Assets:** `utility` → chosen `market` / `market-after` plate. **Mask:** `canopy`; target enters from the right. **Relationship:** localized amber task light / canopy worklight. **Points:** (.65,.28), (.60,.26), (.50,.26), (.40,.28), (.35,.30).

| Progress | Actual staged composition |
| --- | --- |
| 0% | Utility scene and steady task light. |
| 25% | Market enters behind an opaque canopy-like frame. |
| 50% | Separate industrial and sorting scenes remain legible on each side; no flower/equipment alpha blend. |
| 75% | Hands, stems and crates dominate as the incoming chapter prepares to receive its copy. |
| 100% | Full market work scene and meaningful Night/First light toggle. |

**Fallback / phone:** matching selected market still; authored phone crop keeps working hands visible. **Evidence:** both stage sets; variant persistence and material-change tests; corrected phone image review. **Limit:** fixture heights and apparent source sizes are not calibrated to an exact projected light match. **Functional/capture: PASS. Exact projection: NOT TESTED.**

### TR-09-10 — Market route to first-service platform

**Assets:** chosen market plate → `platform-before`. **Mask:** `column`; target enters from the right. **Relationship:** cart/floor route / station guide. **Points:** (.45,.78), (.48,.73), (.52,.69), (.56,.64), (.58,.60).

| Progress | Actual staged composition |
| --- | --- |
| 0% | Market aisle remains complete. |
| 25% | Platform-before plate appears behind a vertical station-like column. |
| 50% | Canopy/market and platform are distinct places, divided by the column. |
| 75% | Prepared platform dominates without starting a wall-clock vehicle sequence. |
| 100% | CH-10 enters its before-service hold; its separate scroll-owned arrival reveal follows. |

**Fallback / phone:** `platform-before` fallback; compact door/platform viewpoint. **Evidence:** both stage sets, independent column correction review, and separate CH-10 first/middle/complete/reverse tests at desktop/phone/4K. **Limit:** the column is editorial screen geometry; no calibrated cart-path/track projection is supplied. **Functional/capture: PASS. Exact projection: NOT TESTED.**

### TR-10-11 — Vehicle panes to morning city

**Assets:** arrived `platform` → `dawn`. **Mask:** `panes`; target enters from the right. **Relationship:** repeated vehicle windows / remembered facade windows. **Points:** (.66,.46), (.60,.44), (.50,.42), (.40,.43), (.30,.45).

| Progress | Actual staged composition |
| --- | --- |
| 0% | Complete arrived platform photograph. |
| 25% | Dawn city enters behind a pane-like foreground edge. |
| 50% | Window rhythms remain on separate opaque photographs; morning light belongs to the target plate. |
| 75% | Original city/room landmark becomes the primary vista. |
| 100% | Dawn holds with six revisitable traces and a genuine Return to midnight action. |

**Fallback / phone:** complete matching dawn still; phone crop exposes the remembered room. **Evidence:** both stage sets; six-trace direct-visit tests; independent original-window/dawn composition review. **Limit:** generated matching images preserve recognizable landmarks, not proven pixel-identical architecture, pane spacing or physical camera calibration. **Functional/capture: PASS. Exact projection: NOT TESTED.**

## Evidence scope and unresolved strict claims

The main suite passed all ten stage/state checks in desktop and phone projects. Nominal frame files follow `evidence/screenshots/{desktop,mobile}-tr-AA-BB-{000,025,050,075,100}.jpg`; metadata records the actual scroll/progress and image identity. The pure tests establish deterministic exact endpoint/midpoint coverage separately from pixel-rounded browser positions.

The actual movie at `evidence/recordings/high-risk-transitions.mp4` covers TR-01-02, TR-05-06 and TR-06-07 forward/reverse. Contact sheets and `motion-zoom.json` record its provenance, timing and inspected subset. Every changing browser frame was requested; actual settled screenshots preserve the final repaint. No motion interpolation was used. Scoped frame inspection is PASS; uninterrupted human playback of the entire movie and manual inspection of every frame are NOT TESTED.

General failed-primary, all-image-failure, stale-response and variant-recovery checks pass. An exhaustive target-failure permutation at all ten boundaries and every entrance/exit neighbor is not recorded. Unsupported WebGL passes because the complete experience has no runtime WebGL dependency; this does not pretend to test a nonexistent 3D-context restoration path.

The required early chronological G2 prototype gate cannot be reconstructed from later results. Early browser access was blocked/ambiguous; later evidence is retained as later evidence. Exact projective/photographic matching, true browser zoom, physical devices and assistive-technology certification remain outside these PASS labels.
