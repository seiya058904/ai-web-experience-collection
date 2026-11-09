# ODDS

**Every chance leaves a trace.**

An original, English-language interactive probability playground: a matte blue apparatus, an orange ball, and ten chapters about how individual choices become a distribution. Built with Vite, TypeScript, Lenis, exact SVG/Canvas geometry, and locally bundled Manrope fonts. A restrained system-serif italic accent appears in selected headings.

This is a source delivery for local use. It has not been deployed or added to an existing collection.

## Open the offline edition

**`ODDS-Offline.html`** is the self-contained edition. Open it directly in a modern desktop browser; no Node.js installation or dependency download is needed to open that file. Its application JavaScript, styles, Manrope fonts, favicon and production material are embedded in the document. Optional reference links still open their external source websites when followed.

The offline file exists and its resource embedding has been checked in source. **Direct `file://` execution and its complete interaction path remain unverified because this browser environment refused local-file access.** Consult [docs/acceptance.md](docs/acceptance.md) for the final observed result. Browser storage permissions can differ for local files; the application keeps working for the current visit if persistent storage is unavailable. A local file and an HTTP server do not share one saved experiment state.

To edit or rebuild the project, use the source workflow below. After making changes, regenerate the standalone file with:

```sh
npm run portable
```

This runs the normal production build and then `scripts/portable.mjs`. It updates `ODDS-Offline.html`; `npm run build` alone updates `dist/`.

## Start on Windows

For the **source workflow**, install **Node.js 24 or newer**, including npm. Extract `ODDS-Source-v1.0.0.zip` into an ordinary folder before running the scripts; paths with spaces are supported by their quoted directory handling. The Windows scripts have been statically reviewed, but **have not been executed on Windows**.

- Double-click **`START-WINDOWS.cmd`** for the development server.
- Double-click **`PREVIEW-WINDOWS.cmd`** to create and serve a production build.

The scripts check Node and npm, install the locked dependencies only when they are missing or do not match the project, and print the local URL. They do not open or publish an external site. Keep the terminal open while using ODDS; press **Ctrl+C** to stop. If the default port is occupied, use the actual local address printed by Vite.

The initial dependency installation needs internet access to the npm registry. After dependencies are installed, building and serving the experience does not require an external API or a paid service.

## Run from a terminal

In the extracted project directory:

```sh
npm ci
npm run dev
```

Open the printed address, normally `http://localhost:5173`. To listen only on your own computer:

```sh
npm run dev -- --host 127.0.0.1
```

Create the production build and preview it:

```sh
npm run build
npm run preview -- --host 127.0.0.1
```

The preview address is normally `http://localhost:4173`. The build is written to `dist/`. Serve it over HTTP; opening `dist/index.html` directly with `file://` is not the supported application launch method.

If the delivery includes a prebuilt `dist/`, any ordinary static HTTP server can serve that directory. For example, if Python 3 is installed:

```sh
python -m http.server 4173 --bind 127.0.0.1 --directory dist
```

The built experience uses local assets and local computation. It makes no runtime requests for remote fonts, images, libraries or model APIs. Optional reference links lead to their source websites only when followed. The source artwork gallery can also be opened directly at [artwork/index.html](artwork/index.html).

## The ten chapters

| Chapter | What you explore |
| --- | --- |
| 1. Every chance leaves a trace. | Release a ball and connect its actual path to an endpoint. |
| 2. Left. Or right. | Watch independent choices without expecting the next one to compensate for the last. |
| 3. More paths than places | Inspect sixteen four-step paths; six arrive at the same central endpoint. |
| 4. The middle has more ways in. | See exact path multiplicities, probabilities, and their different units. |
| 5. Small samples have character. | Compare two independent sixteen-ball rounds with their expected-count outline. |
| 6. A different leaning | Change the chance of going right and begin a new round. |
| 7. Same rules. Different evenings. | Compare three seeds at sixteen, sixty-four, or one hundred twenty-eight samples. |
| 8. A portrait of 256 | Follow the middle teaching round into a complete portrait and inspect one ball's journey. |
| 9. Give chance a set of rules. | Choose the rules, run, replay, restore, and export a real result. |
| 10. Still worth watching. | Return to the apparatus and append the next ball to the active workbench round. |

The workbench supports **4, 8, or 12 forks**, a per-fork right probability of **0.25, 0.5, or 0.75**, and an initial sample count of **16, 64, or 256**. Changing a form control does not silently rewrite a completed experiment; the explicit run action commits the chosen rules. Appending at the ending extends the current round's sequence and updates its sample count and export.

The entrance has its own ball-release round. Teaching comparisons and bias experiments remain separate from the workbench. Before a personal workbench round exists, the workbench and ending show the clearly identified **64-ball demonstration**. If “next ball” is used at that point, it continues that exact demonstration seed to 65 samples; it does not claim a previously unseen 64-ball personal history. Running a chosen experiment creates a fresh personal round instead.

## What the model means

Each fork is an **ideal independent Bernoulli choice**. `p` is the probability of choosing right at each level; `n` is the number of levels. A path ending at slot `k` has exactly `k` right turns. The trajectory visualizes a result already computed by the seeded pseudorandom engine. It is not a calibrated simulation of collisions, gravity, peg angles, or physical marbles.

```text
P(K = k) = C(n,k) p^k (1-p)^(n-k)
```

At eight forks there are **256 possible direction sequences** and nine endpoints. Their exact multiplicities are `1, 8, 28, 56, 70, 56, 28, 8, 1`. These are route counts, not a promise that 256 sampled balls will occupy those endpoints in those numbers.

For sampled rounds, the theoretical reference is an **expected ball count**, `N × P(K=k)`, and observed counts come from the actual saved paths. For example, the central expected count in a sixteen-ball fair round is **4.375**; the observed count must be an integer and may differ. No result is edited into a prettier or more symmetric shape.

The engine uses a deterministic string-seeded pseudorandom stream for repeatable exploration. It is neither cryptographic randomness nor measured experimental data. Reusing the same seed and rules preserves the same sequence; increasing N preserves its existing prefix. Scrolling, resizing, replaying a trajectory, or returning to a chapter does not create another sample.

Mathematical references and implementation reasoning are in [docs/research.md](docs/research.md).

## Data, motion and accessibility

The application runs in the browser without an account, database, telemetry or analytics. Browser `localStorage`, when available, retains the interaction state and preferences on that browser and origin. Clearing this site's stored data resets it; a different port or browser has separate storage. Invalid stored data is discarded rather than repaired into invented results. If storage is unavailable, current-session interaction can continue without persistent restoration.

The system's reduced-motion preference and the application's motion control preserve the chapters and experiment data. Sound starts off and is optional. Keyboard-accessible controls and textual parameter, count and route information accompany the visual apparatus. The live scene is constructed in code so a generated image never decides a fork, slot, count or probability.

## Verification and reproducibility

```sh
npm test
npm run build
node scripts/verify-package.mjs
```

`npm test` uses Node's native test runner and TypeScript support. The tests cover mathematical invariants, deterministic replay and prefixes, stored-state validation, experiment actions, chart mapping, narrative evaluation and export consistency. Passing these checks does not establish visual or browser quality.

The current evidence and remaining limitations belong in [docs/acceptance.md](docs/acceptance.md). The following table records the final observed scope; see the report for precise limitations.

| Check | Recorded status at this checkpoint |
| --- | --- |
| Automated suite | Final source regression: **60 of 60** tests passed. The independent archive build repeats the suite. |
| Actual browser interaction | Desktop Hero, first explicit ball drop and reload inspected. A **1440×900 CSS iframe** Hero was also measured and captured; full-journey coverage remains incomplete. |
| Eight art roles plus production material | Eight separate reference files and a ninth generated material tile are present with generation records. |
| Offline edition | File present; resource embedding inspected. Direct local-file browser execution remains pending. |
| Windows scripts | Static review only; execution on Windows remains unverified. |
| Full viewport, transition and recovery matrix | **Blocked/incomplete.** Shared preview replacement and a browser URL-policy refusal stopped the full matrix. No complete pass is claimed. |
| Clean ZIP extraction and reproducibility | Independent archive extraction, locked install, tests and build passed. SHA-256 is supplied alongside the final ZIP. |

[docs/requirements.md](docs/requirements.md) preserves the original acceptance checklist as a planning snapshot. [docs/progress.md](docs/progress.md) records the current stage. Neither substitutes for the final evidence report. Simulated viewports are not evidence of testing physical phones or physical 4K displays.

The source package is designed to reproduce with `npm ci` and `npm run build` after extraction into a separate directory. `package-lock.json` pins the dependency graph; do not replace `npm ci` with an unreviewed dependency upgrade when reproducing the delivery. The final delivery report records the actual clean-extraction checks and archive SHA-256.

| Component | Pinned direct version |
| --- | --- |
| Vite | 8.3.6 |
| TypeScript | 7.0.2 |
| Lenis | 1.3.27 |
| `@fontsource-variable/manrope` | 5.3.0 |
| Node.js runtime | 24 or newer |

## Source map

| Path | Purpose |
| --- | --- |
| `src/engine.ts` | Seeded samples, exact enumeration, theoretical probabilities, validation and SVG export. |
| `src/state.ts` | Explicit experiment actions, independent teaching state, persistence validation and the active personal round. |
| `src/` | Application scenes, interaction, styling and coordinated scrolling. |
| `tests/` | Meaningful deterministic engine and state checks. |
| `public/` | Local production resources. |
| `artwork/` | Eight separately generated reference images and their standalone gallery. |
| `docs/image-generation.json` | Actual image-generation tool, prompts, output provenance and assigned roles. |
| `public/art/material.webp` | Additional generated 512×512 production texture; does not count as one of the eight reference roles. |
| `docs/material-generation.json` | Actual generation prompt and transformation record for the production texture. |
| `DESIGN.md` | Visual system extracted from the current implementation, including explicit compromises. |
| `.impeccable/design.json` | Design metadata, motion, depth, breakpoint and component extensions. |
| `docs/research.md` | Primary-source research and mathematical/scrolling decisions. |
| `docs/sources-and-licenses.md` | Asset provenance and bundled dependency/font notices. |
| `docs/acceptance.md` | Final implementation and verification evidence; untested conditions remain explicit. |
| `dist/` | Production build, when included; reproducible from the source. |
| `ODDS-Offline.html` | Self-contained local-file edition. |
| `scripts/portable.mjs` | Rebuilds the offline edition from the production output. |

## Artwork and permissions

The eight image references are original AI-generated visual development assets for ODDS. **IMG-04** is the selected desktop refinement; IMG-05 is a separate portrait composition. A **ninth generated image** supplies the subtle blue production material at `public/art/material.webp`; it is an additional asset and does not replace any of the eight required roles. The gallery distinguishes these uses and explains why visual references are not statistical evidence.

The production website **reconstructs the apparatus with exact SVG geometry and a Canvas 2D portrait**, rather than using a generated poster as an interactive board. It uses the generated material tile at low opacity over the code-defined surface. This preserves actual layers, slots, identities, controls and results while approximating the reference's light, depth and finish. It is not an arbitrary-view 3D scene or a claim of exact photographic fidelity. Current design choices and their verification limits are recorded in [DESIGN.md](DESIGN.md).

The generation tool did not provide seeds; the provenance record says so. Third-party dependencies and Manrope retain their own licenses, reproduced where required in [docs/sources-and-licenses.md](docs/sources-and-licenses.md). No third-party open-source license is assigned to generated artwork merely because it accompanies this project. This handoff does not authorize publishing, deployment or inclusion in another repository.

