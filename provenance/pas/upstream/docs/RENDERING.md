# Offline rendering and the image sequence

PAS can display a deterministic sequence of images rendered from the same character meshes, rig and motion score used by its Three.js scene. The offline route was added because the available cloud browser reported a disabled WebGL renderer. It is genuine 3D asset rendering through EGL and Mesa; it is not browser automation, a browser screenshot, a generated imitation of a runtime frame, or a replacement dance video.

The final sequence is an **illustrative CGI interpretation** of the generated photographic direction. Its faces, material detail and cloth behavior do not reproduce the reference photographs. The characters have stable anatomical meshes and skinned clothing; their cloth is not a physical fabric simulation. No biomechanical or professional dance validation is claimed.

## Runtime and production are separate

The shipped image sequence is an ordinary local web asset. Viewing it does not run Python and does not require an active WebGL context. The optional production commands below regenerate the images; they are not required to install or use the website.

The image sequences contain no UI text or controls. Titles, controls, captions, focus guidance and semantic descriptions remain HTML. The sequence changes only the visual rendering of the shared motion state. Unison and Echo have different rendered actor phases within the independent phrase; they share the same endpoint and the same contact choreography elsewhere.

## Tested rendering environment

- Python 3.12, ModernGL 5.13.0, glcontext 3.1.0, NumPy 2.3.5 and Pillow 13.0.0.
- EGL standalone context, OpenGL 4.5, Mesa 25.2.8.
- Software renderer: `llvmpipe (LLVM 20.1.2, 256 bits)`.
- Linux with existing `libEGL.so.1`, `libEGL_mesa.so.0` and `libGL.so.1`.
- The renderer was tested with four llvmpipe worker threads. Optional production commands on other systems are unverified.

Install the optional Python requirements into a virtual environment:

```bash
python3 -m venv .render-venv
. .render-venv/bin/activate
python3 -m pip install -r scripts/render-requirements.txt
```

The requirements use exact tested versions. An initial package installation needs network access. The renderer itself uses only the shipped meshes, source textures and motion code. ModernGL's official headless-context documentation is at <https://moderngl.readthedocs.io/en/latest/topics/context.html>.

## Export the actual rig

From the project directory, after the ordinary `npm ci` installation:

```bash
node --experimental-strip-types scripts/export-render-rig.mjs --out .render-work/rig --range 0:10:.005 --mode unison
node --experimental-strip-types scripts/export-render-rig.mjs --out .render-work/rig --range 4:4.76:.005 --mode echo
```

This exports static mesh attributes, UVs, materials, skin weights and indices once, followed by per-frame bone matrices and mesh transforms. Bone matrices are column-major and already include the inverse bind transform. The exporter uses `createCharacter()` and `evaluateDance()` from the production source. It does not load external choreography or depend on a DOM.

The completed export must remain unchanged while rendering. Regenerate the whole affected sequence after a motion, rig, geometry, texture, camera or lighting change. Do not combine old and new frames under the same manifest.

## Render the main views

The completed production density is 200 frames per normalized chapter: 2,001 frames from `t = 0` through `t = 10` in each view, plus 153 Echo alternatives per view from `t = 4` through `t = 4.76`. These are narrative sample coordinates, not an asserted playback frame rate. Actual playback frame rate depends on the duration selected by the player and successful loading/decoding on the device.

```bash
LP_NUM_THREADS=4 python3 scripts/render-duet.py .render-work/rig/rig.json --frames .render-work/rig/frames-unison.json --out public/frames/wide --all --density 200 --width 1200 --height 900 --quality 88
LP_NUM_THREADS=4 python3 scripts/render-duet.py .render-work/rig/rig.json --frames .render-work/rig/frames-unison.json --out public/frames/narrow --all --density 200 --width 720 --height 960 --camera-x 2.25 --camera-y 1.35 --camera-z 4.83 --quality 88
LP_NUM_THREADS=4 python3 scripts/render-duet.py .render-work/rig/rig.json --frames .render-work/rig/frames-echo.json --out public/frames/echo-wide --all --density 200 --width 1200 --height 900 --quality 88
LP_NUM_THREADS=4 python3 scripts/render-duet.py .render-work/rig/rig.json --frames .render-work/rig/frames-echo.json --out public/frames/echo-narrow --all --density 200 --width 720 --height 960 --camera-x 2.25 --camera-y 1.35 --camera-z 4.83 --quality 88
```

The complete production pass, including all detail ranges described below, can also run through the two-worker orchestrator. It uses the same fixed settings, checks the export grid, verifies the packet has not changed while rendering, and runs finalization automatically:

```bash
python3 scripts/render-all.py .render-work/rig
```

The default is two simultaneous render processes with four llvmpipe threads each. Use `--workers 1 --threads 4` on a smaller machine. Logs remain in the rig directory's `render-logs` folder. Existing images are replaced; the orchestrator does not reuse files from an older render.

After all four sequences and the detail ranges finish, validate every file, create the chapter/step still aliases and small chapter posters, and write the exact camera manifest:

```bash
python3 scripts/finalize-frames.py --packet .render-work/rig
```

This command fully decodes the expected 4,308 overview/echo frames and 371 detail frames, checking all 4,679 WebP dimensions. It reads the current `CHAPTERS` export to choose the correct step times, including separate Unison/Echo stills. It refuses a missing frame or unexpected sequence filename. The resulting `docs/render-assets.json` includes image hashes and source/packet fingerprints. It is an asset-integrity record; it does not claim visual or browser approval.

Both views use the same `wide` physical motion layout. The portrait view is rendered from a separate stable oblique camera; it is not a crop of the landscape image. Foot/path annotations must use the same physical pose and the appropriate view's exact column-major projection-view matrix in `public/frames/manifest.json`.

The camera settings are:

| View | Image | Eye | Target | Vertical field of view |
| --- | --- | --- | --- | --- |
| Wide | 1200 × 900 | `(0.12, 1.32, 4.60)` | `(0, 0.90, 0)` | 31° |
| Narrow | 720 × 960 | `(2.25, 1.35, 4.83)` | `(0, 0.90, 0)` | 31° |

The source renderer includes matte diffuse lighting, alpha-tested hair, source skin/cotton textures, source cotton bump, vertex colors, geometry-derived shadow maps, and subtle floor/contact shading. Its floor is at world `y = 0`, matching the runtime stage and foot anchors; the wall seam is at `z = -2.7`. Pixel grain and material variation do not alter narrative state.

Files are written atomically. `--skip-existing` may resume a partial render only when its source packet and all rendering settings are identical. It must not be used across a repaired rig or a changed sample density. `--start-index` and `--end-index` can partition a frozen export; the final filenames still derive from the actual narrative time multiplied by `--density`.

## True same-rig detail views

A close view uses the current scene's actual hand meshes and camera target. For example, with the 0.005 export grid:

```bash
python3 scripts/render-duet.py .render-work/rig/rig.json --frames .render-work/rig/frames-unison.json --index 470 --detail hands --detail-x .43 --out .render-work/contact-2.35.webp --width 800 --height 600 --quality 90
python3 scripts/render-duet.py .render-work/rig/rig.json --frames .render-work/rig/frames-unison.json --index 1596 --detail hands --detail-x .43 --out .render-work/contact-7.98.webp --width 800 --height 600 --quality 90
```

These commands render new camera views of the same geometry. They do not crop a low-resolution main frame or exchange the hands for a different image asset. The player should retain a full-body overview when showing a detail.

Every detail uses the same `round(t × 200)` frame index as the overview. No intermediate pose is substituted. The exact local asset ranges are:

| Detail | Narrative time | Filename indices, inclusive | Frames |
| --- | --- | --- | --- |
| Feet in CH02 | 1.000–1.760 | `detail-feet/0200.webp`–`0352.webp` | 153 |
| Palms in CH03 | 2.000–2.760 | `detail-hands/0400.webp`–`0552.webp` | 153 |
| Fingertips and release in CH09 | 7.980–8.300 | `detail-hands/1596.webp`–`1660.webp` | 65 |

All details are 800 × 600 WebP at quality 90. The hand camera follows the current contact target with an eye offset of `(0.43, 0.11, 1.15)` and a 28° vertical field of view. The foot camera remains fixed at `(0.03, 0.65, 1.95)`, looking toward `(0, 0.17, 0.06)`, with a 31° field of view. The full-body cameras remain fixed throughout the score.

## Validation boundary

A valid file, successful build or completed render is not proof of believable contact. Actual rendered review remains necessary for foot sliding, fingers, elbows, cloth intersections, body overlap, camera clipping and continuity in both directions. The test summary records which checks were actually performed. The render manifest and still aliases must be finalized only after the complete expected image set exists and the current content times are aligned.

## Completed asset record

The final uniform pass used the frozen motion containing the relaxed V4 palm contact and corrected passing lane, with the ground at `y = 0` in every view. All 4,679 expected images were fully decoded, their dimensions checked, and their SHA-256 hashes recorded. They occupy 89,270,614 bytes before archive compression. The finalizer also created 100 still aliases and 20 small chapter posters from the current content timings.

`docs/render-assets.json` records individual image hashes, exact ranges and byte counts, the still-to-frame mapping, and source/packet fingerprints. `docs/render-freeze-evidence.json` preserves the motion and mesh checks at the moment the source was frozen. `docs/render-camera-bounds.json` records projected bone bounds across both timing modes and views; it explicitly does not certify full mesh silhouettes or contact.

Representative final production images reviewed include the light-palm contact at `t = 2.35` in both main views and the oblique hand detail, the portrait crossing at `t = 5.33`, fingertip contact at `t = 7.98`, and the foot detail at `t = 1.38`. These samples match the approved rendering settings. Browser interaction, device performance and complete continuous playback remain separate checks in the project verification report.

Earlier interrupted experimental renders left five temporary `.part.webp` files. They were archived outside the project before successful finalization. Temporary partial files are not animation frames; after an interrupted production run, archive or remove those partials before retrying the strict integrity gate.
