# Asset and code provenance

Prepared 2026-10-06 for **THRUST — Anatomy of a Jet Engine**.

| Component | Origin | Production use |
|---|---|---|
| Engine geometry and textures | Original procedural Three.js meshes and deterministic DataTextures in `src/engine.js` | All engine scenes, including the same exploded assembly |
| Cooling blade | Original lofted airfoil, true aperture details, channel geometry and procedural metal map in `src/blade.js` | Blade scale-reversal scene |
| Airflow / combustion | Original analytic shader paths and annular plumes in `src/flow.js` | Continuous core and bypass narrative |
| Aircraft | Original procedural closed surfaces, windows and matching left engine in `src/flight.js`; the full detailed engine remains the right pod | Thrust-to-flight camera pullback |
| Atmosphere | Generated with OpenAI image generation, 2026-10-06 | `public/atmosphere.webp` |
| Engine poster | Export of the original real-time engine view | WebGL-unavailable reading view only |
| Mark / favicon / controls | Original SVG geometry | Native interface |
| Typography | Barlow Condensed 600; Manrope 400/500 via pinned Fontsource packages | Locally bundled WOFF2; OFL notices in `licenses/` |
| Three.js / Vite | Pinned npm dependencies | Rendering / build tooling; MIT notices included |

No manufacturer CAD, third-party engine model, brand logo, photograph, video, CFD dataset or licensed stock footage is included. NASA and GE pages informed the qualitative engineering; their text and images are not bundled as visual assets.

## Generated asset prompt

The atmosphere was generated as a standalone production asset, not as a screenshot or page background with baked-in interface text:

> A high-resolution 16:9 natural cloudscape at passenger-airliner cruising height. No aircraft, objects, text, logos or UI. Clean luminous pearl-blue sky in the upper area; a vast softly sunlit sea of white cloud tops below, with realistic cool blue-gray depth and restrained warmth. Clean upper-left negative space for native dark typography. A separately rendered original aircraft will sit over the lower-right clouds. Calm premium aerospace cinematography; no artificial repeated cloud spheres.

The PNG output was encoded once as WebP at quality 88. The image is illustrative generated imagery; it does not document an actual location or flight.

## Concept studies

Six generated design references covered Intake, Compression, Combustion, Blade, Machine and Flight. They established the dark studio, cold/hot color handoff, type hierarchy, negative space and light finale. They were not accepted as engineering references and are not runtime assets. Incidental model errors and generated caption inaccuracies were replaced by the consistent original model and supplied chapter order.

Only the final atmosphere and original engine poster are distributed as production raster assets. Concept images, failed variants, browser test screenshots and temporary render files are excluded from the ZIP.
