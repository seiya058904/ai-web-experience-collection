# BACKSTAGE

## The art of making believe.

An original, playable miniature theatre in five acts. First, believe in a little teal room. Then step into the wings, watch the painted walls turn into a paper sea, and call the cues yourself.

**One stage. One red door. One paper lantern. Three ways to change the world.**

The live stage uses real Three.js geometry, original Canvas-painted textures and real sidelight shadows. Scenery, rails, the moon and the lantern retain their identities as the viewpoint and production change. Five generated concept studies informed the art direction; they are documented references, not the interactive stage.

## Run locally

Install **Node.js 22.12 or later**, including npm. Extract the source ZIP, open a terminal in this directory, then run:

```sh
npm ci
npm run dev
```

Open the local address printed by Vite, usually `http://127.0.0.1:5173`. Development and preview bind to the local computer by default.

Create and inspect a production build:

```sh
npm run build
npm run preview
```

Preview binds to `127.0.0.1`, usually on port `4173`. Serve the generated `dist/` directory through a local HTTP server; opening `index.html` directly with `file://` does not run the ES module application correctly.

The initial `npm ci` downloads the exact dependencies in `package-lock.json`. Once installed, development and production builds need no remote media, font CDN or API service. All fonts, posters and runtime artwork are local. No account, credentials, environment file or runtime API key is required. The experience is silent.

## How to play

Scroll or choose a Roman numeral in the chapter rail. Each act has a stable viewing composition and a reversible handoff.

| Act | What happens |
| --- | --- |
| **I · Believe** | A complete room, a red door and a warm lantern establish the little world. |
| **II · The Other Side** | The camera moves into the wings to reveal painted boards, timber braces and the mechanisms below. |
| **III · Change the World** | The same flats turn, layered waves rise and the lantern crosses its rail. |
| **IV · Call the Cue** | Choose the scene, viewpoint and sidelight. |
| **V · Believe Again** | The camera returns to the audience; your chosen world and light remain as the lantern comes home. |

Act IV contains three controls:

| Control | Result |
| --- | --- |
| **Scene — Room / Sea / Night** | Moves the existing scenery along an authored mechanism path. A new choice takes over from the current pose; requests do not accumulate in a queue. |
| **View — Audience → Wings** | Moves the camera along a limited viewing arc while keeping the same scene and light. |
| **Light — Low sidelight → High sidelight** | Changes the real key light position and its shadows. |

**Reset this production** restores only the director’s choices. It does not reload the page or change the scroll position. **Return to the wings** reopens the director’s act. **Begin again** returns to Act I and resets the production after the return.

Production choices are saved in this tab’s `sessionStorage`. Reloading and chapter history can restore the same production. Storage is optional: the site still works when it is unavailable, but choices then last only while the page remains open.

## Access and graphics

- The live renderer requires **WebGL 2**. If live graphics cannot start, the static reading edition preserves the story and four composed views. It explicitly omits the live scene, view and light controls.
- Open `http://127.0.0.1:5173/?static=1` to choose the static edition directly, or add `?static=1` to your local preview address.
- **Still mode** removes autonomous movement and settles scene changes. All three director controls remain available. The system’s `prefers-reduced-motion` preference is also respected.
- Use **Tab / Shift+Tab** to move between links, buttons and sliders; **Enter / Space** activates buttons. Native range controls support arrow-key adjustment. Focus has a visible outline, and hidden act controls leave the focus order.
- The skip link moves to the director’s controls. Touch users can use the same chapter links and native sliders.
- If the graphics context is lost, a local poster remains visible with a retry action and access to the static edition. With JavaScript disabled, the text and local images remain readable.

## Project map

| Path | Responsibility |
| --- | --- |
| `index.html` | Semantic five-act copy, chapter navigation, controls and reading fallback |
| `src/main.js` | Lenis, ScrollTrigger, the sole ticker, focus, persistence and renderer lifecycle |
| `src/state.js` | Pure narrative/director state, reversible mechanism path and immutable exit snapshots |
| `src/theatre.js` | Stage geometry, camera, real lights, shadows and rendering |
| `src/materials.js` | Original procedural paint, wood and scenic textures |
| `src/style.css` | Typography, layout, control states and responsive composition |
| `public/fonts/` | Local WOFF2 fonts and their OFL notices |
| `public/posters/` | Static views rendered from the same original stage |
| `tests/` | State reconstruction, interruption, deck openings and sampled scenic-clearance checks |
| `scripts/` | Repeatable browser acceptance, cache/lifecycle checks and real-stage poster capture |
| `docs/` | Research, visual decisions, generation provenance, state contract and acceptance records |

The renderer reads one coordinated pose. A single GSAP ticker drives Lenis, the director state and drawing; the application does not add a competing RAF loop or camera controller. The door, rail and lantern share the same revolve coordinate system.

## Verification

Run the deterministic state and geometry checks:

```sh
npm test
```

The CPU checks cover state behavior and explicitly bounded geometry; they do not certify visual fidelity or every possible collision. The [acceptance record](docs/ACCEPTANCE.md) contains the actual browser procedures, repairs, measurements and uncovered environments.

To repeat browser checks, install the pinned Playwright browser once, build, and choose a group:

```sh
npx playwright install chromium
npm run build
node scripts/acceptance.mjs --group viewports
node scripts/acceptance.mjs --group transitions,interactions
node scripts/acceptance.mjs --group resilience,typography
node scripts/acceptance.mjs --group performance --sample-ms 6000
node scripts/dense-handoff.mjs
```

The harness saves local PNGs and JSON records. It serves the production bytes to its isolated browser, without publishing a website. Run GPU-intensive groups serially. Software WebGL can be slow; a successful automated check still needs visual review. The dense-handoff helper records the real room-to-sea path in both directions, with its normal production clock. `scripts/http-lifecycle.mjs` separately checks real local HTTP caching and browser lifecycle; see its notes in the acceptance record.

To regenerate the four posters directly from the live stage:

```sh
npm run capture:posters -- --out public/posters
```

Posters are captured from the built source at the four specified stable poses. Rebuild after replacing them. No concept image is substituted for a live frame.

## Design and provenance

- [Product intent](PRODUCT.md)
- [Design system](DESIGN.md)
- [Visual Bible](docs/VISUAL_BIBLE.md)
- [State ownership and snapshot contract](docs/STATE.md)
- [Research and design consequences](docs/RESEARCH.md)
- [Actual image-generation record](docs/IMAGE_GENERATION.json)
- [Sources and licenses](docs/SOURCES_AND_LICENSES.md)
- [Actual acceptance, repairs and limitations](docs/ACCEPTANCE.md)
- [Independent art review](docs/ART_REVIEW.md)
- [Evidence index](docs/evidence/README.md)
- [Clean ZIP installation and build verification](docs/ARCHIVE_VERIFICATION.json)

Concepts A–E in `docs/references/` are **reference only**. Their material and composition decisions are described in the Visual Bible; generated furniture, extra props and alternate text were deliberately excluded. Important text is real HTML, and the live scenery is computed geometry.

This delivery is a standalone source archive. It contains no public deployment, hosting configuration, repository publication or integration into an existing collection.
