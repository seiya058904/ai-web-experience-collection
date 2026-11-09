# PAS — The distance between two people

An original interactive duet in ten movements, created for observation. Cen wears rust red; Cheng wears sand. The work follows how two people offer, answer, share weight, make room and let go.

The eight original generated PNG studies are preserved in `reference-images/`; the web app uses optimized versions in `public/art/`.

The website is in English. It is a Vite + TypeScript project with locally bundled fonts, images, character assets and sound synthesis. It needs no account, database, API key or paid runtime service. This source archive is for local use; it has not been deployed or published.

## Start on Windows

1. Install **Node.js 22.12.0 or later**, with npm. A currently supported Node LTS release is a suitable choice.
2. Extract the entire ZIP to a normal folder, for example `C:\Projects\pas`. Do not run it from inside the ZIP viewer.
3. Open PowerShell or Command Prompt in the extracted folder containing `package.json`.
4. Run:

```powershell
npm ci
npm run dev
```

Open the local address printed by Vite, normally <http://localhost:5173>. Keep the terminal running while you use the website. Press **Ctrl+C** in that terminal to stop the server.

For a convenient first launch, double-click **`start.cmd`**. It checks the Node version, installs the locked dependencies if Vite is missing, and opens the local development server in your default browser. Read any terminal error before closing the window. The starter and Windows commands are provided for Windows use, but the production work and command checks were performed on Linux rather than a Windows runtime.

If PowerShell blocks the `npm.ps1` wrapper, use `npm.cmd ci` and `npm.cmd run dev`, or open Command Prompt. You do not need to change the machine's PowerShell execution policy.

An initial `npm ci` needs internet access to download the versions in `package-lock.json`. After installation, the app uses its bundled local assets; it does not fetch models, animation, fonts or generated pictures from a third-party runtime service. The exact four font styles are also preserved in `reference-fonts/` as four CSS files, eight WOFF/WOFF2 files and the original OFL notices. The normal application imports the locked npm packages restored by `npm ci`; these archival copies preserve the font resources without creating a second runtime load.

## Production build and local preview

From the project directory:

```powershell
npm run build
npm run preview
```

The build first checks TypeScript, then writes the production website to `dist/`. The preview server normally prints <http://localhost:4173>. These commands build and preview locally; they do not deploy anything.

Use an HTTP server, not a double-click on `index.html` or `dist/index.html`. Modules, JSON manifests and the image sequence are loaded through normal local HTTP requests. If a default port is already in use, Vite prints the address it selected; open that address. Keep the complete `dist/` directory together, including its `frames`, `art` and asset files.

To change the development port explicitly:

```powershell
npm run dev -- --port 5174
```

To run the code checks separately:

```powershell
npm test
npx tsc --noEmit
```

The exact installed runtime and dependency versions, verification scope and remaining limits are recorded in [docs/VERIFICATION.md](docs/VERIFICATION.md). Test success is not a claim that every browser, assistive technology or device has been exercised.

## Optional packed developer review

```powershell
npm run standalone
```

This produces `offline/PAS-preview.html` and `offline/PAS-assets.bin`. Keep both files together and serve the `offline/` directory over HTTP. This is **not** a promise that double-clicking the HTML file will work offline. The packed review route loads its media archive as a binary pack; the normal website retains its lazy, separate local resources. The packed route contains the default image-sequence experience; use the normal development or production server to inspect the optional live WebGL route and its model assets.

One local server option using the already installed Vite dependency is:

```powershell
npx vite offline --host 127.0.0.1 --port 4174
```

Then open <http://localhost:4174/PAS-preview.html>. The normal `npm run preview` command serves `dist/`, not this separate reviewer folder. The verification report records whether the packed review output was actually built and opened.

## How to watch

Scroll forward or backward, use the chapter index, or choose the observation moments within a chapter. The same narrative position controls the body pose and surrounding text. The opening and ending can be compared without forcing a new performance.

The independent phrase in **Unison / Echo** has two genuinely different timing results. Play it, pause it, replay it, then return to scrolling. **A Complete Phrase** provides its own bounded playback. Ground, contact, paths and observation controls make selected relationships easier to inspect.

The **Motion** dialog can follow the device preference, show continuous movement, or present still moments step by step. The reading version in the work's notes and the no-JavaScript content retain the ten-part sequence. Sound is optional and starts only after a deliberate user action. Basic viewing works with sound off.

Use **Tab** to move through links and controls, **Enter** or **Space** to activate appropriate controls, and normal browser scrolling keys to move through the page. Dialogs have explicit close controls. The project's browser verification report describes the specific keyboard and responsive cases that were actually checked.

Viewing preferences and optional local state are stored in browser storage where available. They are not sent to an account or server. Clearing this site's browser storage resets them.

## What the animation is

The default player shows an **authored image sequence rendered from the same deterministic 3D rig and motion score included in this source**. It selects a frame directly from narrative time; it is not an unrelated dance video or a slideshow of the eight AI concept pictures. The sample density is 200 frames per normalized chapter. Wide and portrait views are independently rendered from the same physical poses, and the Unison / Echo phrase has its own alternate frames.

This route was chosen because the available cloud browser could not create a WebGL context. It lets the default experience use ordinary local image decoding without requiring an active WebGL renderer. The body geometry, textures, neutral rig data and export/render scripts are included for inspection and regeneration. Per-frame bone matrices are regenerated from the bundled deterministic score; the temporary matrix packets are not part of the source archive.

The final characters are **illustrative CGI**. Their faces, material detail and fabric behavior do not equal the photographic quality of the generated art-direction images. The default sequence uses a fixed main camera for each layout with a detail inset; it does not add idle breathing at a paused narrative position. Clothing is fitted skinned geometry, not simulated cloth. The choreography and contact constraints have not been professionally or biomechanically validated.

The source also includes an optional live Three.js implementation. Add `?renderer=webgl` before the chapter hash, for example:

```text
http://localhost:5173/?renderer=webgl#between
```

That route requires browser WebGL support. Its types, geometry and deterministic rig were checked, but the live WebGL path could not be visually verified in the available browser environment. The default image-sequence route is the intended local viewing path.

## Project map

| Path | Purpose |
| --- | --- |
| `src/main.ts`, `src/style.css` | Page, interaction state, coordinated progress and responsive styling |
| `src/content.ts` | English chapter copy, moments and narration labels |
| `src/motion.ts`, `src/motion-types.ts` | Pure pose queries, feet, hands, contacts, timing and camera hints |
| `src/character-metrics.ts` | Measurements from the actual character meshes |
| `src/render/sequence.ts` | Default authored-sequence player and observation overlays |
| `src/render/stage.ts`, `src/render/character.ts` | Optional live stage, shared meshes, skeletons, skin and props |
| `public/frames/` | Bundled main image sequences and render manifest |
| `public/art/` | Optimized versions of the eight genuine AI art-direction results and adopted still references |
| `reference-images/` | The eight original generated PNG files |
| `reference-fonts/` | Exact archival copies of the four imported font styles and their OFL notices |
| `public/assets/` | Character mesh binaries, manifests and textures |
| `scripts/` | Character preprocessing and same-rig render/export tools |
| `scripts/model-source/` | Preserved CC0 graphical source data and its licenses |
| `tests/` | Motion and project checks |
| `docs/` | Requirements, score, provenance, reproduction and verification records |
| `licenses/` | Preserved third-party software, font and graphical-asset notices |

The names in this table refer to source files, not remote services. See [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) for source credits and licenses.

## Reproduction and evidence

- [Visual bible](docs/VISUAL-BIBLE.md): adopted studies, rejected Hero alternatives and the photographic-to-CGI adaptation.
- [Reproduction](docs/REPRODUCTION.md): clean extraction, installation, build and local preview procedure.
- [Rendering](docs/RENDERING.md): optional Python/OpenGL production environment and exact render commands.
- [Model sources](docs/MODEL-SOURCES.md): CC0 anatomy, clothing, hair, textures and original modifications.
- [Character verification](docs/CHARACTER-VERIFICATION.md): actual skin geometry checks and their limits.
- [Choreography](docs/CHOREOGRAPHY.md) and [motion score](docs/motion-score.md): the original duet's structure and timing.
- [Requirements](docs/REQUIREMENTS.md): chapter and transition coverage.
- [Image generation record](docs/image-generation.json): the eight art-direction calls, prompts and adopted files.
- [Verification](docs/VERIFICATION.md): checks actually completed, observations and unresolved limitations.

Python, NumPy, Pillow, ModernGL, EGL and Blender are **not required to install, build or view the bundled website**. Python and the documented rendering dependencies are needed only if you choose to regenerate the character assets or rendered sequences. The production-render commands were tested on the documented Linux/Mesa setup; their execution on Windows is unverified.
