# Reproducing PAS locally

This document is the reproduction procedure for the source archive. It is not a substitute for a completed test log. Actual commands, environments, observations and limitations belong in `docs/VERIFICATION.md`.

## 1. Extract a clean copy

Use a new directory so an old `node_modules`, `dist` or frame set cannot hide a missing dependency or resource. The entire extracted project must remain together. On Windows, File Explorer's **Extract All** is sufficient. A PowerShell example is:

```powershell
Expand-Archive -LiteralPath .\PAS-source.zip -DestinationPath .\pas-clean
Set-Location .\pas-clean\pas
```

Adjust the archive and inner directory names to match the delivered ZIP. The project directory is the one containing `package.json`, `package-lock.json`, `src` and `public`.

Before changing into the extracted project, the optional ZIP checksum can be checked from the directory containing the archive, without third-party software:

```powershell
Get-FileHash -Algorithm SHA256 .\PAS-source.zip
```

Compare the result with the checksum supplied alongside that particular archive. A checksum verifies byte identity, not visual quality or feature completeness.

## 2. Check the runtime

```powershell
node --version
npm --version
```

Node.js **22.12.0 or later** is required. npm is included in normal Node installations. This project's application and production renderer were developed in the documented Linux environment; no Windows execution is claimed. The commands and `start.cmd` are written to work with the corresponding Windows tools.

If PowerShell chooses a blocked `npm.ps1` file, run `npm.cmd` instead of `npm`, or use Command Prompt. Administrator access and a machine-wide execution-policy change are not required for the project.

## 3. Install the locked dependencies

```powershell
npm ci
```

This uses `package-lock.json` and needs network access to the npm registry on a fresh machine. It should leave the lockfile unchanged. Do not replace it with a floating dependency update when checking reproducibility. No API keys, account login, database setup or environment secrets are required.

The source archive also contains `reference-fonts/`: the exact four imported CSS files, their eight WOFF/WOFF2 resources, and original OFL notices. These are archival copies of the pinned Fontsource packages. The normal source imports continue to resolve through the packages installed by `npm ci`, and Vite emits local font resources when building.

## 4. Check and build

```powershell
npm test
npm run build
```

`npm run build` runs TypeScript's no-emit check before Vite creates `dist/`. `npm test` exercises the authored motion and project invariants present in `tests/`. Passing those checks establishes only their stated assertions. It does not establish photorealism, correct anatomy in every rendered pose, hardware performance, a completed accessibility audit or browser coverage beyond the recorded verification.

## 5. Preview the production build

```powershell
npm run preview
```

Open the HTTP address printed by Vite, normally <http://localhost:4173>. Keep the terminal open, and use **Ctrl+C** to stop it. A clean production check uses this built output, rather than relying only on the development server.

The relative build base is `./`, so the built resources can be served beneath a directory without a fixed public domain. The delivered work is for local use and contains no deployment command or hosting credentials. A future hosting decision is outside this reproduction procedure.

Do not open `dist/index.html` as a `file://` URL. The application needs HTTP requests for modules, manifests and frame images. Copying only the HTML file will not work.

## 6. Verify the actual local path

Perform these actions on the clean production preview and record the result in the verification report:

1. Open the beginning, then move through all ten chapters with ordinary forward scrolling. Observe bodies, text and controls together.
2. Move backward across each transition. Use a direct chapter link and browser Back/Forward. The pose must resolve from the current narrative state without stale bodies from a previous chapter.
3. In **Unison / Echo**, compare the two timings, play the phrase, pause, replay, then return to scrolling. Sound can remain off throughout.
4. In **A Complete Phrase**, play and pause the bounded phrase. Return to normal scrolling and revisit the chapter without forcing an unwanted replay.
5. Check ground/contact/path observation controls in their relevant chapters. Compare the opening and ending, including their distinct posture.
6. Test a narrow viewport and a wide viewport. Confirm that the heads, hands and bare feet remain in frame and that controls do not cover the important movement.
7. Choose **Still moments, step by step**, then return to continuous movement. Check the reading alternative and ordinary keyboard navigation.
8. Reload a direct chapter hash. Confirm that optional settings can be restored, and that blocked or cleared browser storage does not prevent the main experience.
9. Check for missing resource requests and application exceptions using the local browser's developer tools. An unrelated managed-preview failure is not evidence about this clean local server.

The report should name the browser, CSS viewport, device-pixel ratio where known, any throttling, and the checks that actually ran. Do not invent a Lighthouse score, playback frame rate or assistive-technology result.

## Runtime resources that must be present

The default player uses `public/frames/manifest.json` and the following main frame sets. Each filename is the narrative coordinate multiplied by density 200, padded to four digits.

| Set | Expected index interval | Main image count | Image dimensions |
| --- | --- | ---: | --- |
| `public/frames/wide/` | `0000` through `2000` | 2,001 | 1200 × 900 |
| `public/frames/narrow/` | `0000` through `2000` | 2,001 | 720 × 960 |
| `public/frames/echo-wide/` | `0800` through `0952` | 153 | 1200 × 900 |
| `public/frames/echo-narrow/` | `0800` through `0952` | 153 | 720 × 960 |

These four main sets total **4,308 images**. The additional detail sets contain 153 foot frames and 218 hand frames, for **4,679 rendered frames** in total; 100 still aliases and 20 chapter posters are separate derived files. The density is a narrative sampling interval, not an asserted device frame rate. Player duration, network/storage speed and successful image decoding affect visible playback. At a paused narrative position, the native sequence has no separate idle breathing motion.

The rest of `public/art`, `public/assets`, the source font imports and the generated production assets must also be present. The default player is a same-rig authored render sequence; the AI art-direction studies are separate files. All formal runtime media is bundled, rather than retrieved from private file paths or expiring URLs.

## Optional packed developer review

```powershell
npm run standalone
```

The output is a pair: `offline/PAS-preview.html` and `offline/PAS-assets.bin`. The HTML and its binary asset pack must stay together and be served over HTTP; double-clicking the HTML is not a supported offline-file promise. This optional review build is separate from the normal `dist/` website and its lazy per-resource loading. It packages the default image-sequence experience; use the normal server for the optional WebGL path and its character model resources.

To serve the review directory with the installed Vite dependency:

```powershell
npx vite offline --host 127.0.0.1 --port 4174
```

Open <http://localhost:4174/PAS-preview.html>. Record the build and actual browser result separately from the ordinary production preview. A completed packed build alone does not establish that its larger initial media fetch decoded successfully on a device.

## Optional live WebGL route

```text
http://localhost:4173/?renderer=webgl#between
```

This loads the live Three.js stage using the same deterministic pose source and anatomical assets. The available cloud browser could not create a WebGL context, so this route has not received a completed browser visual check in that environment. Returning to the URL without the query parameter restores the default sequence player. A failure of this optional route does not justify claiming that it was visually verified.

## Optional asset and frame regeneration

A normal install/build/preview uses the committed assets and does not need Python, Blender, MakeHuman, ModernGL or a GPU. If you deliberately change the original motion, rig, geometry, textures, lighting or camera, regenerate the affected rendered sequences as a coherent set.

- Body/garment regeneration: `python3 scripts/build-characters.py`, with Python, NumPy and Pillow.
- Same-rig export: `scripts/export-render-rig.mjs`, which runs in Node without a DOM.
- Offline image rendering: `scripts/render-duet.py` and the exact optional packages in `scripts/render-requirements.txt`.

The complete production commands, camera settings, tested Linux/Mesa environment and atomic-render rules are in [RENDERING.md](RENDERING.md). The full graphical provenance is in [MODEL-SOURCES.md](MODEL-SOURCES.md). Optional EGL rendering on Windows is not verified.

The export packet uses original source geometry plus per-frame matrices. It is an intermediate cache, not a runtime dependency. Keep the packet fixed while rendering; mixing frames from old and new bone matrices under one manifest will make the result inconsistent.

## Packaging boundaries

The source ZIP includes the application source, configuration and lockfile; formal media and archival font files; model source data and licenses; production-render scripts; documentation and selected verification evidence. It excludes `node_modules`, generated `dist/`, `standalone-dist/` and `offline/` outputs, temporary render packets, local caches, development-server processes, browser profiles, credentials and unrelated files. Build outputs can be recreated with the documented commands. The reproducible original CC0 model source is included deliberately; it is not an unlicensed commercial asset cache.

The deliverable does not depend on the original scratch directory, an active development session, a signed-in connector, or a hosted Collection. Generated-image provenance may record the historical output identifiers, but runtime code uses packaged relative resource URLs.
