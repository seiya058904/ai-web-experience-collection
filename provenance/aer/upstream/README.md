# AER — Carried by Air

A quiet, original balloon journey in ten chapters. Meet the weight of the air, leave the ground, choose a fictional wind layer, and bring home an SVG or PNG keepsake of the route that actually resulted.

**This is a local source delivery. No site has been deployed, published, pushed, or added to a collection.** The experience is entirely in English and needs no account, database, telemetry, runtime API, subscription, or paid service.

**Acceptance status:** the implemented mechanics and assets are delivered, but this is not a claim of full conformance to the original visual brief. See [known visual gaps](docs/KNOWN-GAPS.md) and [the exact verification record](docs/VERIFICATION.md).

## Start the prepared site

You need **Node.js 24 or later**. The complete delivery includes the prepared `dist/` directory.

On Windows, extract the whole ZIP into a normal folder and double-click **`START-WINDOWS.cmd`**. It starts a local server and opens your browser. Keep its terminal window open while using the site; press **Ctrl+C** to stop.

On any supported desktop system:

```bash
node scripts/serve.mjs --open
```

Open **http://127.0.0.1:4173/** if the browser does not open automatically. This small server serves only `dist/` and binds only to `127.0.0.1`. It does **not** install packages or need internet access once Node and the prepared files are present.

If the port is busy:

```bash
node scripts/serve.mjs --port 4180 --open
```

Do not open `dist/index.html` with `file://`; use the included server so JavaScript modules and local resources load normally. If `dist/` is absent, follow the build steps below.

## Develop and rebuild

The dependency versions are pinned in `package.json` and `package-lock.json`. Initial installation needs network access to the npm package registry. The delivered site does not make runtime model/API requests.

```bash
npm ci
npm run dev -- --host 127.0.0.1
```

`START-DEV.cmd` does the same on Windows, running `npm ci` only when `node_modules/` is missing. If you change dependency inputs, run `npm ci` yourself to resynchronize them.

Build, then view the production output:

```bash
npm run build
node scripts/serve.mjs --open
```

Vite's preview is also available after dependency installation:

```bash
npm run preview -- --host 127.0.0.1
```

The build uses `base: './'` for relative asset paths. Source and production output contain no private absolute asset paths or temporary image URLs. The small included server mounts `dist/` at its URL root; it is not a publishing or deployment tool.

## The journey

| Chapter | What happens |
| --- | --- |
| 01 — Look up | A vast envelope and two small people establish scale. |
| 02 — A shape for air | Compare the same envelope at rest and held open. |
| 03 — Between light and heavy | Change relative warmth and ground load in a qualitative balance experiment. |
| 04 — The ground lets go | Follow the basket separating from its contact shadow. |
| 05 — The shadow goes first | Observe the shadow in the two-field photographic study and reduced-motion stills. |
| 06 — The floors of the wind | Choose among three explicitly authored wind layers. |
| 07 — A choice takes shape | The selected wind produces a different route; other routes can be previewed without committing them. |
| 08 — In the same light | Pause in the selected route's panorama and look back along its path. |
| 09 — Back to the earth | Approach the selected meadow and settle on the ground. |
| 10 — Keep the sky | Save the actual chosen route as SVG or PNG, or try another layer. |

| Wind | Authored direction | Destination |
| --- | --- | --- |
| Low layer | East, along the field edge | Hedgerow Meadow |
| Middle layer, the default | North, past the village bend | Willow Bend |
| High layer | Northwest, toward open country | Far Meadow |

All choices have the **same complete beginning**. The decision is at narrative progress `5.45`; preferences cannot change any earlier scene. Horizontal movement is integrated from the wind at the current relative height. The meadows are placed at those resulting endpoints. The ground experiment is separate and never changes the flight or lets anything be dropped from the basket.

## Controls and preferences

- Scroll normally, use the chapter menu, or follow chapter anchors `#ch-01` through `#ch-10`.
- Use native buttons, radio controls and the warmth slider with pointer, touch or keyboard.
- **Motion** in the chapter menu offers device preference, full motion and reduced motion. All chapters, wind choices and results remain available.
- The small pause control stops ambient motion. Sound starts off and begins only after an explicit click.
- **Save this journey** downloads an original 720×900 SVG. **Save as PNG** renders the same state to a 1440×1800 image.
- Wind, motion mode and pause preference are stored locally in this browser when storage is available. The recent narrative position is used for session recovery. No personal text or account is required.

The scenery, people, weather layers, timing and quantities are fictional. This is a qualitative explanation and an imagined journey, not weather data, navigation, load assessment, a flight log or flying instruction.

## Visual implementation

The delivery combines **cinematic generated plates, a shared illustrated Three.js world, a lightweight SVG fallback, precise route diagrams and real DOM controls**. Photographic views are deliberately framed separately from the live flight study. The website does not claim that a generated photograph has been reconstructed into a pixel-matched continuous 3D camera shot.

The reusable live balloon has sixteen gores, a pear profile, one navy crown, four suspension connections and a honey-colored basket. Desktop and mobile share the deterministic story state while using different opening compositions. Nine editorial chapter handovers connect the ten sections; their actual media choices and acceptance limits are recorded in [the chapter and transition ledger](docs/CHAPTERS-AND-TRANSITIONS.md).

Ten distinct generated WebP images are included. H-A and H-C are art-development references; H-B, H-D, H-M, K-05, K-08, T-04-05 and the two additional branch panoramas have production uses. See [sources, asset inventory and licenses](docs/SOURCES-AND-LICENSES.md) and [the Visual Bible](docs/DESIGN.md).

## Checks and verification limits

```bash
npm test
npm run check
npm run build
```

The automated suite has **25 passing tests**: 14 for the causal journey/physics engine, 8 for keepsakes and route diagrams, and 3 for scene invariants checked on the CPU. Tests cover the shared prefix, fixed reduced-motion states, deterministic seeking, a separately sampled wind integral, distinct landings, terrain contact, sun projection, force semantics, correct exports and noncommitting previews. The scene checks cover drawing-buffer budgets, fixed suspension connections and landing-mesh clearance. They do not render WebGL or measure frame rate; see [the renderer audit](docs/RENDERER-AUDIT.md) for their exact scope.

**Material browser limitations:** the available cloud Chrome reports `GL_RENDERER: Disabled` and cannot create a WebGL context. Browser observations in that environment exercise the illustrated fallback, not a hardware-rendered Three.js journey. The connected Browser plugin could not access the managed preview. Browser size checks use actual embedded CSS iframe viewports in `tests/browser-harness.html`; these are not physical phones, browser device emulation, hardware 4K screens, or real 125/150/200% browser zoom.

Browser observations are recorded in [the verification record](docs/VERIFICATION.md); the accompanying AER-DELIVERY-REPORT.md records the final archive extraction and rebuild. Anything not actually checked remains explicitly unverified. No Lighthouse score, FPS guarantee, real-device result or complete WebGL visual pass is claimed.

## Project structure

| Location | Purpose |
| --- | --- |
| `index.html` | Ten semantic English chapters and native controls |
| `src/main.ts` | Scroll, preferences, interface, resource ownership and exports |
| `src/journey.ts` | Pure deterministic route, terrain, shadow and qualitative balance model |
| `src/scene.ts`, `src/balloon.ts` | Reusable Three.js world and balloon geometry |
| `src/illustration.ts` | Complete lightweight scene and step illustrations |
| `src/keepsake.ts` | Self-contained SVG keepsakes and accurate route diagrams |
| `src/audio.ts` | Optional synthesized air ambience; no downloaded audio |
| `src/styles.css` | Responsive layout, local fonts and motion/accessibility treatments |
| `public/art/` | Ten generated image assets |
| `tests/` | Journey, export and scene CPU tests; the browser viewport harness |
| `scripts/serve.mjs` | Dependency-free local server for `dist/` |
| `docs/`, `licenses/` | Design, chapter ledger, verification, sources and copied licenses |
| `dist/` | Prepared production output; regenerated by `npm run build` |

## Rights and sources

Original project material is delivered to the commissioning user; this delivery does not select a blanket public open-source license. See [PROJECT-NOTICE.txt](PROJECT-NOTICE.txt). Lenis, Three.js, build tools and fonts retain their own licenses. Complete notices are included in `licenses/`; the two bundled font families use the SIL Open Font License 1.1.

The explanatory ideas were checked against the FAA *Balloon Flying Handbook*, Chapters 2 and 7. No FAA diagrams, photographs or manual pages are bundled. The on-site About dialog includes the source links.

Prepared 2026-11-09.
