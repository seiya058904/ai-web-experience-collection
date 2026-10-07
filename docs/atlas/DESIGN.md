# ATLAS — visual construction

## Intent

Experience. Scale is the narrative; one geographic world remains in place while its representation changes. The supplied brief fixes the direction: cartographic, editorial, precise, geological, cinematic. All inferences about framing are implementation decisions, not new factual claims.

## Visual language

- Paper: `#eeede6`; limestone: `#d7cbb5`; ink: `#262d2b`; muted ink: `#66716a`.
- Water: `#355d60`; signature line: `#b9633d`; night: `#111d1e`; night text: `#eeede6`.
- Manrope variable for the interface, coordinate numerals and display sans; Cormorant Garamond italic for short spatial statements; IBM Plex Mono for geographic measurements.
- Open full-screen world. No cards, dashboard panels or image-backed sections. UI uses a 28–62 px fluid desktop gutter and 22 px mobile gutters, small quiet rules and generous control targets.
- Main copy is anchored in negative space, with map labels anchored to projected geographic positions. Caption density falls on mobile.
- A contour-shaped A mark, one persistent vermilion point, and a 100 m contour interval define the identity. When the original point is outside a close camera view, a directional `OUTSIDE FRAME` marker preserves the reference without moving its geographic position.

## Reference interpretation

Four internal generated concepts establish coordinate, relief, city, and globe composition. They are art direction, not geographic sources and are not shipped as site imagery. All relief, shorelines, aerial imagery and urban footprints in the implementation come from the documented real data. Exact real topography takes precedence over invented landforms or extra buildings in a concept image.

## Scene architecture

| Progress | Representation | Continuous operation |
| --- | --- | --- |
| 0–0.055 | Coordinate | Fine crosshair grows from the persistent point. |
| 0.055–0.125 | Grid | Scaled projected rules extend; selected rules deform into data-derived contours. |
| 0.125–0.23 | Contour | Actual 100 m contours gain hierarchy, selected height labels and mapped water. |
| 0.23–0.35 | Lift | Matched contour vertices and terrain vertices acquire their Y-axis height together. |
| 0.35–0.43 | Relief | Surface normals and a slow moving sun reveal real ridges and valleys. |
| 0.43–0.51 | Water | Visual emphasis transfers to mapped rivers and lakes; no invented summit runoff. |
| 0.51–0.62 | Imagery | A world-registered material front drapes satellite imagery over the existing mesh, then aerial detail appears in its real footprint. |
| 0.62–0.745 | City | Original road and roof outlines register over aerial imagery, and roofs lift into schematic volumes. |
| 0.745–0.81 | Route | A connected route follows real road centre lines registered to the same ground as the buildings; the camera follows a low oblique view along the route. |
| 0.81–0.86 | Time | Daylight passes through an authored golden interval into night over the same city. |
| 0.86–0.975 | Orbit | Camera altitude increases logarithmically; the planet is tangent at the original coordinate. |
| 0.975–1 | Atlas | Real continental outlines, graticule and the original point resolve into a stable composition. |

## Motion and quality

One Lenis instance smooths wheel input (`lerp: 0.105`, `syncTouch: false`, `autoRaf: false`). The existing requestAnimationFrame loop advances Lenis before evaluating the absolute document position, including while geographic resources load. Camera poses and layer weights follow that position directly; ambient light uses a separate accumulated time value within the same loop. Chapter navigation uses Lenis; reload/history and resize restoration use immediate positioning. Hidden pages pause the loop and discard unfinished inertia. Quiet motion disables wheel smoothing, stops ambient time and renders when state changes. Dialogs retain native internal scrolling. No GSAP or duplicate ticker is introduced.

Entering, a legible composition, living hold and geographic handoff are the intended rhythm. The low route view uses the actual centreline, with its camera target near the registered ground and a roughly hundred-metre vertical separation from that target. It remains a schematic spatial model. The fixed coordinate can move outside the frame, where its directional marker takes over.

On mobile, camera framing, label density and rendering resources differ: the satellite view shifts west to retain Fuji, the route has a tighter caption offset, and the globe uses a wider, lower composition. Initial mobile data uses a 257 × 257 regional mesh with matching triangle-derived contours, a 129 × 129 city mesh, 1024-pixel imagery and 2400 mapped building components. Desktop uses 513, 257, 2048 and 6500 respectively. Resize changes the camera and labels while retaining the initially selected data pairing.

Canvas DPR is capped by device DPR, 1.5 on desktop / 1.6 on mobile, and a 3200 × 1900 target pixel budget, with a minimum ratio of 0.6. 4K support describes viewport composition and interface layout; the WebGL backing buffer is not promised to render every frame at native 4K.

## Geometry and resource lifecycle

The regional grid and its contour file share the exact `[a,c,b]` / `[b,c,d]` triangle convention. Each contour retains the triangle crossings from its matching 513 or 257 node grid. A 12 m display bias separates visible contour lines from the surface; stored contour values remain unchanged. This numerical agreement is not a claim of survey accuracy.

The detailed city floor blends its outer 5% collar into regional terrain. Buildings, road and route centre lines, and camera route targets use that same registered floor. Road and route segments are split at horizontal, vertical and diagonal terrain edges before height sampling. Small display offsets separate the ground and line layers without changing the source elevations. Geometry comes from the real mapped footprints; 8 m extrusion and window patterns remain authored.

Base terrain, contours, regional vectors and route CPU data load first. Regional imagery preloads after progress 0.30, detailed city terrain / aerial texture after 0.48, city geometry after 0.51, and the globe after 0.81. Once progress exceeds 0.977 and the globe is ready, city geometry and detailed terrain / imagery GPU resources are disposed. On reverse scroll the relevant resources preload again; parsed JSON and Float32 elevation data are reused through shared caches. The base geographic frame remains in memory. Layers own their resources, not separate cameras or animation loops.

## Globe construction

Natural Earth 1:50,000,000 land polygons produce a 4096 × 2048 global mask, actual coastline geometry and a restrained 15° graticule. A 2048 × 2048 signed distance field for Japan and nearby East Asia is computed from the same polygon segments; it improves coastline antialiasing during the regional ascent without an extra source or request. The detail weight recedes as altitude increases. A thin atmospheric limb and authored light complete a cartographic sphere, with no stars or invented global imagery.

## Truth boundaries

GSI DEM elevations are real; the visible grid is resampled, not a survey-grade product. Centimetre RGB encoding, small contour intersection error and texture dimensions do not imply finer geographic measurement. Natural Earth's `50m` means the 1:50,000,000 series, not 50-metre spatial resolution. The local coastline distance field sharpens rendering of the existing source edges; it does not add coastal facts.

The graphic contour-to-water handoff interpolates between two real shapes; intermediate positions are a change of layer, not a physical river or measured flow. Satellite mosaic and aerial orthophotography are distinct multi-date products. Building footprints are real, heights schematic. Lighting, golden-hour colour, window patterns and route motion are authored studies, not current conditions or measured facades. Full credits are available from the interface and in [`ATTRIBUTION.md`](../../public/atlas/ATTRIBUTION.md); implementation detail is recorded in [`docs/SCENE-ARCHITECTURE.md`](SCENE-ARCHITECTURE.md).
