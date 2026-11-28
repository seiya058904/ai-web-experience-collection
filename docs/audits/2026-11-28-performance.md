# Collection performance audit — 2026-11-28

The scope is the Collection, all 55 independent works and Credits. The reference is `074f42b`, built from the untouched tree with the GitHub Pages base path. The application still serves independent HTML documents. Navigation, content, artworks, geometry, sampling counts, shaders' visible output, rendering budgets and dependencies remain as authored.

## Where work was removed

| Surface | Runtime change and invariant |
| --- | --- |
| Collection | Let the browser skip descendants of offscreen fixed-height panels. Content-sized tablet rows and Credits keep ordinary layout. The shared pointer and Lenis RAF wakes on input and stops at rest. Pointer movement applies one update to the active image per frame. Native links, keyboard, touch and history still own their position. |
| AURORA and ORBITAL | Share a lossless WebP encoding of the existing Earth texture. The 2048×1024 decoded RGBA is byte-identical, and one request drops from 1,511,379 to 1,199,356 bytes. The PNG and NASA attribution remain available. |
| ATLAS | Cache the scroll pose, camera, labels and stored reading position across living frames. Loading, resize and font events invalidate the affected state. Geographic layers retain ambient time. |
| CREASE | Reuse fold geometry and its shadow when only the camera changes. Upload the used attribute ranges. Rebuild the same map after a caster change or context restoration, and dispose its GPU allocations at terminal navigation. |
| FACET | Build the authored viewport-dependent poses on resize. Limit manual matrix preparation to the visible optical ray's root. The seven pose weights, optical traces and true rotated-hull contacts are unchanged. |
| FERRUM | Reuse the exact lowest vertex across identical metal poses. Scan only while the ground/contact patch or anvil is visible. Upload spark attributes only when there are sparks. |
| GLASSHOUSE | Compute the scene and camera matrices once across the base, reflected scene and ordered panes. Keep every refraction pass and its target size, mipmaps, depth, ordering and camera. |
| GRID | Skip identical SVG path writes and label text replacements. Calculate contrast with the same channel math without duplicate luminance calculation. |
| INKSCAPE | Generate the original brush textures when their layer first needs them. Cache the brush clip's viewport-local samples and restore them on resize. Sample count, pigment edges and paper dimensions are unchanged. |
| MURMURATION | Exit the adjacent-bucket search immediately after inspecting the existing 112-candidate cap. Preserve neighbor visit order, the fixed step and the recorded flight. |
| ODDS | Reuse the three immutable exact-count/probability/expected-count relief markups. The interactive samples and live comparators still derive from their current state. |
| SILICON | Reuse camera basis vectors and remove the extra scene-graph pass immediately before Three's own render traversal. The structural handoff still updates its own world matrices before sampling. |
| SUPERCELL | Reuse each height's field terms, skip uniform contour cells, and update only the moving parcel on a settled airflow frame. The section texture and contours are prepared ahead of their authored entrance. |
| THRUST | Hold the scroll-dependent DOM and skip updates for excluded geometry branches. The visible engine, flow, blade and aircraft reconstruct from current progress and absolute time. |
| URUSHI | The startup poster and identical wide fallback hero now share one URL. Keep both source binaries and the original phone and tablet crops. |

## Reproduction

```powershell
npm ci
npx playwright install chromium
npm run build -- --base=/ai-web-experience-collection/
node scripts/measure-performance.mjs dist "$env:TEMP/collection-performance.json"
```

Build the baseline from its own checkout using the same lockfile and pass its build directory to the same script. Run the profiles serially with no other browser workload. `COLLECTION_PERF_ROUTES` selects comma-separated work slugs (with the Collection included), or `credits` alone. `COLLECTION_PERF_PROFILE` selects `desktop` or `constrained-mobile`. `COLLECTION_PERF_SCREENSHOTS` optionally captures opening frames after measurement.

The comparator uses installed Chromium 158 on Windows, Ryzen 7 9700X and RX 7900 XT via ANGLE D3D11. It serves production files over loopback with gzip for text, range responses for media and a ten-minute cache lifetime. Every route gets a fresh browser context. Desktop is 1440×900 at DPR 1, 50 Mbps and 15 ms latency. Constrained mobile is 390×844 at DPR 2, 12 Mbps, 60 ms latency and 4× main-thread CPU throttling, with touch emulated. The GPU is the same physical GPU in both profiles.

The startup window ends 550 ms after DOMContentLoaded and a font wait capped at 1.4 s. Reported transfer bytes count completed Chromium responses in that window. A response can move across the boundary at the same encoded size. The after-load phase records a stationary interval, wheel or touch, then document jumps in both directions. Frame intervals come from RAF scheduling, task time from Chrome's `TaskDuration` delta, and LCP from the startup window. JS heap is sampled at two points and depends on GC timing. These are lab measurements.

## Browser results

[Per-route CSV](2026-11-28-performance-matrix.csv) contains 114 before/after pairs across 57 production documents. All 228 route visits completed with zero uncaught page errors and zero HTTP errors. The main pass used one visit per route/profile/revision. ATLAS, AURORA, FERRUM, ORBITAL, THRUST and URUSHI candidate numbers come from the focused reruns of their final revisions. Small changes within sample variation are descriptive. The samples include unchanged pages and their normal run-to-run variance.

| Measure | Desktop before → after | Constrained mobile before → after |
| --- | ---: | ---: |
| Collection startup transfer | 1,953,665 → 1,407,402 B | 2,115,987 → 1,422,130 B |
| Collection observed LCP | 424 → 276 ms | 860 → 420 ms |
| Collection long-task blocking | 154 → 18 ms | 594 → 199 ms |
| Collection input task time | 499 → 465 ms | 526 → 587 ms |
| Site median LCP | 216 → 212 ms | 540 → 520 ms |
| Site 90th-percentile LCP | 436 → 424 ms | 908 → 1,020 ms |
| Site median input task time | 182 → 165 ms | 604 → 667 ms |
| Site 90th-percentile input task time | 581 → 544 ms | 1,638 → 1,686 ms |
| Site median per-page input RAF p95 | 6.3 → 6.3 ms | 6.4 → 6.4 ms |
| Site 90th-percentile per-page input RAF p95 | 6.3 → 6.4 ms | 12.6 → 18.6 ms |

In two additional alternating phone-profile runs, Collection LCP ranged from 940–1,048 ms before and 504–536 ms after. The combined gesture and jump trace rose from 6.4 to 12.5 ms at RAF p95 in both repeats. Skipping offscreen panels reduces first-load work. A large jump can bring layout, title fonts and image decoding together at the destination. The real End-key check confirms arrival, visible art readiness and a stable scroll position.

CREASE's two extra phone runs put input task time at 469–484 ms before and 360–381 ms after. The main pass was 573 → 767 ms. GLASSHOUSE's extra phone runs measured 929–938 ms before and 888–1,084 ms after, with the main pass at 966 → 1,151 ms. The phone results vary. The GPU sample of GLASSHOUSE retains its 29 median draws and the same buffer size. THRUST's main phone trace improved from 2,506 to 2,332 ms of input work while retaining its authored rendering and ambient branch logic.

## GPU work and short memory replay

Six focused desktop pages traversed the opening and multiple chapters four times with explicit JS garbage collection between cycles. The draw probe sampled a settled chapter under the same pointer itinerary. The timer queries bracket the sampled draw submission interval. They include GPU scheduling and therefore support coarse comparisons alongside draw counts and buffer dimensions.

| Page | Median draw calls before → after | Last two retained JS heap samples before → after |
| --- | ---: | --- |
| GLASSHOUSE | 29 → 29 | 6.82 / 6.86 → 6.79 / 6.79 MB |
| CREASE | 4 → 3 | 4.14 / 4.14 → 4.20 / 4.20 MB |
| FACET | 28 → 28 | 6.51 / 6.11 → 6.01 / 6.10 MB |
| SILICON | 104 → 104 | 9.32 / 9.35 → 9.37 / 9.45 MB |
| THRUST | 219 → 218 | 8.58 / 8.61 → 8.56 / 8.59 MB |

GLASSHOUSE's GPU sample medians were 5.63 → 5.74 ms and CREASE's were 5.97 → 5.99 ms. This supports the draw-count result for CREASE with a similar elapsed interval on this device. SILICON kept a larger buffer in the candidate sample (1,440×900 versus 1,036×648), so the existing adaptive-quality choices confound its query timing. SUPERCELL uses a WebGL 1 context and recorded one visible draw per sampled frame. Four short replay cycles show bounded working samples in these runs. Driver VRAM, power and long-session leak certification remain open.

## Resources, build and QA

- URUSHI's forced-still wide entry requested two identical 868,256-byte bodies before the change and one after. In the motion run the desktop startup transfer fell from 1,997,669 to 1,129,232 B. Phone retains its dedicated crop. The source test compares the two retained wide originals.
- Chromium Canvas compared all RGBA channels of the original Earth PNG and the shared WebP. ORBITAL fetched the 1,199,356-byte body and AURORA reused it with a cache revalidation in the same context. The encoding uses Sharp 0.35.5 with `lossless: true, effort: 6`. The PNG SHA-256 is `ae6214b078ed0864c96f74bcb10ae3021f6eb116f8059797efe0fa9ea8b89d35`; the WebP SHA-256 is `4700ccd4b71e6571a858bb6a9b405dc03515478796e25332f0bd61dcbb2af574`.
- The build went from 254,746,416 to 255,949,989 bytes, including the new 1,199,356-byte texture while retaining the original. Gzipped generated JS/CSS went from 2,433,042 to 2,434,690 bytes. The build emits independent documents and shared content-hashed runtime chunks. GitHub Pages serves a ten-minute cache policy. Public duplicates total about 4.95 MB, largely fonts, notices and the preserved URUSHI copies. Runtime URL reuse keeps original deployed URLs and license paths available.
- Node passed 1,022 tests. Both root and project-path builds verified 2,094 HTML/CSS references. The 38 focused Chromium tests cover native navigation, keyboard/wheel recovery, controls, dialogs, motion preference and typography. Six reduced-motion viewport sizes (390×844 through 3840×2160) cover all routes for opening layout, horizontal overflow and visible image integrity. Desktop and phone opening-frame contact sheets were visually reviewed. Targeted checks also exercised both cold INKSCAPE deep links and the Mark control, URUSHI forced stills and the shared Earth image through both works.
- The replay and layout coverage provides broad browser regression evidence. Every-chapter artistic review, every individual control at every size, physical touch, Safari and sustained performance on lower-power physical GPUs remain outside the completed evidence. The matrix's limited-device tail and the ORBITAL cloud/Moon and NIB readiness paths remain the highest-value follow-ups.

## Other entry points reviewed

Each entry below was included in the browser matrix. The source review identified what already controls cost and where a change would require dedicated fidelity evidence.

| Surface | Source review |
| --- | --- |
| Credits | Static document with shared typography and local links. No animation runtime or scene initialization. |
| AER | Lazy flight scene and live-visible draw gate. The owner still samples the journey during active motion. |
| AETERNA | Prewarms only chapter-adjacent scans and retains the outgoing plate. Body model decode remains a substantial cold cost. |
| ANAX | One screen, merged static parts and draw-on-change. Its moving mechanism, studio shadows and bloom are live during the opening and idle turn. |
| BACKSTAGE | Batched theatre meshes, cue-dependent light changes and visibility gating. |
| BERTH | Responsive stills, embedded recovery art and cached narrative bounds. Directory scrolling remains native where it overflows. |
| CARGO | One lazy Three scene and an existing draw key. Repeated stage geometry reads during the ticker are a remaining candidate. |
| CHRONOS | Shared watch geometry and offscreen/covered render guards. Interior material passes remain part of the visible mechanism. |
| CHRYSALIS | Slot-generation guards, responsive assets and cached story bounds. Prepared stages retain their ten authored transitions. |
| CODEX | Gated interactive sections with an authored 30 Hz living hold. Paper and spine updates follow the current chapter. |
| COUNTERFORM | Cached fractional placements and shadows. The two full-size RGBA targets preserve ink registration. |
| CRAVE | Conditional, capped material paths, cancellable texture requests, and render suppression in the dialog. |
| CREMA | Instanced particles and cached packing. Inactive packing updates and settled final-cup clears warrant a separate pass. |
| DOSE | Dirty-frame and quality checks, cut-depth mesh rebuild/disposal and a separate fallback. |
| F1 | Three visibility-gated loops, presampled SVG geometry and the authored three-million-pixel Canvas ceiling. |
| FORM | Model rendering uses reduced-motion signatures and an existing adaptive cadence. |
| FOSSIL | The scan script starts asynchronously and the geology/slice view caches reconstructions. The raw scan transfer and initial still decodes dominate the loading path. |
| FRAME | Visible-scene preparation, bounded decoded/encoded caches and request revisions. |
| FUSION | Cached assembly matrices, instanced winding geometry and shader-driven plasma. Paused stable frames are gated. |
| GLAZE | One pin and timeline with deferred chapter images. |
| IMAGO | Measured dirty updates, cached styles and responsive still/alpha recovery. |
| INTERVAL | Cached transform writes and one spatial director. Independent movement remains active in its authored panels. |
| KAGE | One RAF, reduced-motion draw gating and scoped shadows. |
| LUTHIER | Lazy Craft model, reduced-motion still fields and exact moving portal registration. Rendering the portal and field during the Craft handoff remains costly. |
| MAGMA | Bounded texture residency and draw caps. Live cold sheen and hot material passes retain their timing. |
| MEND | The toy is lazy and loose-rope geometry updates only on dirty frames. Ring calculations in actively driven frames are a profiling candidate. |
| NIB | Chapter effects and quiet ending have draw guards. Eleven plate decodes still gate the Canvas. A future staggered load needs first-travel and late-chapter coverage. |
| NIGHTSHIFT | Prepared media slots and token checks protect quick handoffs. Fallback warm-up can overlap an already-prepared full image. |
| OPTIC | Instanced mechanical geometry and signature-gated paused/reduced draws. The final photo stops the live renderer. |
| PAPERSUN | Idle warm-up, near-chapter readiness and a bounded eight-picture cache. |
| PARALLAX | Environment sampling runs in a worker. An on-demand renderer and retained fallback preserve mirror/refraction and context loss. |
| PELAGIC | Conditional pause and an SVG alternative. The original Canvas strips preserve the continuous drift. |
| PULSE | Dirty story state, inline diagrams and prepared transitions. Chapter changes still draw the original cross-sections. |
| RALLY | Measured bounds and visibility gating before court and bridge updates. |
| RELAY | Deterministic simulation and dirty SVG rendering. Delivery pauses when hidden. |
| RESONANCE | Immutable WebGL buffers and shader positions, hidden/capture suspension and Canvas fallback. |
| SENTE | The board responds to input and only nearby transitions remain active on the single clock. |
| SILLAGE | Composition signatures retain SVG output and slider changes coalesce to the frame. |
| VAREN | Scoped GSAP contexts and responsive catalogue sources. |
| VEIL | Scroll/ambient rendering gates with locally owned material and geometry uploads. |
| VERDANT | Authored visible shader passes and bounded texture/Canvas dimensions. |

## Exact-output checks

- SUPERCELL preserved 33,327 scalar results, 63 sampled slices and contour lists, and 14 RGBA density buffers in a differential run against the baseline. On one pinned logical CPU with nine interleaved timed batches, projection (96×64) went from 13.294 to 5.622 ms, contour construction (96×56) from 2.390 to 0.928 ms and raster sampling (160×88) from 3.355 to 1.368 ms. These are median timings for the named kernels.
- FERRUM matched every visible rotated contact point across 1,464 sampled poses. A 2,280-frame synthetic trajectory reduced the complete 1,682-vertex scans to 954, and the contact calculation for the complete trajectory took 7.175 to 2.779 ms. The other 816 poses had no visible support, and 510 reused a visible exact pose.
- MURMURATION matched neighbor IDs and position/velocity buffers over 540 steps, including the shipped seed, a separate live seed and a dense case with ripple and rule changes. A normal 2,400-agent step went from 3.048 to 2.985 ms and a dense step from 1.974 to 1.907 ms. The existing shipped-record reconstruction test also passed.
- INKSCAPE matched 177,268 Canvas drawing commands at 60 compositions across four viewports, including partial brush reveals, overlap and reverse traversal. Three procedural texture canvases (3.41 million pixels) move out of the constructor. GRID matched 10,003 color cases. ODDS matched 150 rendered state/markup results including all three relief units.
