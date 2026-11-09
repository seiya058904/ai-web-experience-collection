# FRAME — digital clay production

## What the images are

Boop is an original digital character. The finished animation is a controlled 3D rendering, guided by the actual image-generation studies recorded in `image-generation.json`. It is not a photograph of a physical clay set, and the animation was not assembled from unrelated AI-generated frames.

The selected reference established an irregular lavender slab, a folded upper-right corner, two small dark eyes, a pressed mouth, two ivory feet, two short arms, and a permanent lower-left thumb impression. The renderer reproduces these features with one model, one stable lighting setup, and a fixed material coordinate system. The rendered interpretation is intentionally identified as such: its folded corner and surface relief are a digital sculpt, not a pixel-identical reconstruction of the generated reference.

## Production assets

| Asset family | Contents | Dimensions |
| --- | --- | --- |
| `public/frames/landscape` | 24 shared story frames and eight alternate push frames | 1280 × 800 |
| `public/frames/portrait` | The same complete story, separately blocked and framed for portrait | 720 × 800 |
| `public/frames/hero` | All 24 even-take poses, compactly blocked for the desktop Hero | 1000 × 900 |
| `public/frames/hero-portrait` | All 24 even-take poses, independently blocked and framed for the compact mobile Hero | 720 × 800 |
| `public/stills` | Matched glance/preparation, contact/pushing, overhead, ending and seated epilogue views in both camera formats | Landscape 1280 × 800; portrait 720 × 800 |
| `public/frames/manifest.json` | Canonical filenames, per-preset mapping, dimensions, byte lengths, hashes and source-pose hash | JSON |
| `public/frames/{hero,hero-portrait}/manifest.json` | Each compact Hero camera’s 24 frames and actual dimensions/hashes | JSON |
| `public/production-art-manifest.json` | All 126 production images, including the 14 stills, with relative paths, sizes and hashes | JSON |

Only frames 08–11 differ between spacing takes. Frames 07 and 12, and every non-push story frame, resolve to the exact same physical image file. This produces **32 unique frames per camera**, or **64 canonical production sequence images**. Separate 24-frame, even-only Hero takes add visual weight in the desktop and mobile openings without changing the editing or export cameras. Holding frame 06 or 18 repeats the same image; a hold is never counted as a new pose.

The main sequence filenames are `even-01.webp` through `even-24.webp`, plus `ease-in-08.webp` through `ease-in-11.webp` and `ease-out-08.webp` through `ease-out-11.webp`. The manifest maps all 24 indices for all three presets.

The fourteen stills are:

- `glance-{landscape|portrait}.webp`: frame 02.
- `preparation-{landscape|portrait}.webp`: frame 06, with the same observation camera as the glance.
- `contact-{landscape|portrait}.webp`: frame 06.
- `pushing-{landscape|portrait}.webp`: frame 09, with the same observation camera as contact.
- `overhead-{landscape|portrait}.webp`: frame 18 from a high observation angle.
- `ending-{landscape|portrait}.webp`: frame 24 in a closer final composition.
- `resting-{landscape|portrait}.webp`: a separate seated epilogue beside the completed task for chapter 10.

The ending still shows the existing final film pose. The explicitly separate resting still is a quiet seated epilogue after the film; it does not change frame 24, the 24-frame sequence, its timing, or exported playback.

## Shared pose data

`src/timeline.ts` owns every performance pose, every preset's spatial distribution, and the playback beat table. `scripts/bake-frames.mjs` imports that module directly. The renderer receives the actual block position, body transform, fold movement, gaze, expression, hand anchors and foot support coordinates.

The tabletop is `y = 0`. The red block is 0.8 units wide and 0.72 units high. Its final center is `x = 1.35`. The main yellow outline has a 1.07-unit centerline width, leaving a clearly visible border around the aligned 0.8-unit block.

The front hand touches the block's left face while pushing. The rear palm rests on its top face. During the correction, the front mitten moves to the front face while the rear palm stays on top, forming a readable two-hand grip. Mesh centers are displaced outward from these logical contact anchors by the relevant mitten radius. The complete limb geometry, contact shadow and prop are rendered together.

Foot poses preserve each planted support point across adjacent frames. The largest stride was visually inspected and adjusted before the complete bake: swing feet land forward before they become planted, rather than creating an implausibly long trailing leg. The model connects each foot to the nearest sensible point on the lower body. Raised feet have actual clearance above the tabletop; planted soles have a flattened contact area.

## Portrait blocking

Portrait images are independently rendered. They are neither a crop nor a horizontal stretch of the desktop images.

The tabletop journey is shortened to **58%** of the desktop travel while the character, block and outline retain their physical sizes. The body-to-block gap and all hand contact surfaces remain intact. A fixed affine mapping of tabletop support coordinates, plus constant per-foot stance offsets, preserves stationary planted feet. Applying a different arbitrary actor offset to every pose would have caused foot sliding; that approach was rejected.

The portrait and landscape takes retain the same 24 story poses, ordering, spacing-preset behavior, held frames, beat rate, overshoot and final alignment. Their staging is intentionally different, as required for readable small screens.

## Compact desktop Hero

The Hero has a complete 24-frame even take in `public/frames/hero`, with its own `manifest.json`. Its approach travel is shortened to 35% of the desktop editor's distance. The overshoot and correction retain their full 0.45-unit extent, so the mistake remains visibly outside the outline. The body, block, outline, hand contact and authored acting remain consistent with the main model. Foot support uses a fixed mapping and preserves planted anchors.

A 1000 × 900 frame and a matching 10:9 display surface give the character substantially more visual weight than fitting the full-width editor scene into a narrow Hero column. Simply putting the portrait source inside a 1.3-ratio container with `object-fit: contain` would largely cancel that benefit through height fitting. The compact take should be used throughout the desktop Hero preview and its matching entry handoff; it should not be interleaved frame-by-frame with a different camera during playback.

`src/art.ts` provides typed Hero and still URL helpers. Its still mappings are for stationary observation; the caller must not swap an isolated close still into an otherwise wide playback sequence. The canonical editor, premiere and exports continue to use the original landscape/portrait cameras and three spacing takes.

## Compact mobile Hero

A real 390 × 844 browser screenshot exposed a scale problem: the canonical portrait film, fitted into the Hero, left Boop too small. The dedicated `public/frames/hero-portrait` sequence addresses that defect with a new 720 × 800 camera render of all 24 even poses. It uses 18% approach travel, the complete 0.45-unit overshoot/correction, unchanged physical model and prop sizes, and a fixed affine mapping of planted support points. The orthographic camera has a 3.72-unit width, targets `(0.49, 0.82, 0.02)`, and retains the stable lighting. These images are not crops or warps of the desktop Hero.

The opening, overshoot and ending are checked for whole-body, feet, block and outline framing. A complete contact sheet is included as `docs/hero-portrait-contact-sheet.webp`. The first draft’s left edge was too tight; the final camera was widened and approach staging tightened before baking all frames. Use the portrait Hero consistently throughout its preview and associated handoff, on a matching 9:10 display surface. Image-level checks establish asset framing, while a fresh mobile browser screenshot must establish the corrected CSS display size.

## Material and light

The renderer uses signed distance geometry and deterministic CPU ray marching. The production render uses four subpixel samples per pixel, contact-aware soft shadows and ambient occlusion.

- The body is an asymmetric, shallow, softly rounded slab with a gently bowed front.
- The corner is a curved thick flap with rounded edges and an actual crease.
- The lower-left thumb impression has fixed shallow concentric relief in model coordinates.
- Fine pores and subtle material variation are fixed to the character's local surface, not randomly regenerated every frame.
- The eyes are small glossy dark beads; the mouth is a shallow sculpted groove.
- The block has firmer rounded edges than the body, while the matte tabletop remains calm.
- The main soft light remains at the upper front-left for every frame and every pose. There is no random exposure or camera shake.

The fixed procedural material hash is an implementation detail, not an image-generation seed. No seed or hidden setting from the image-generation tool is claimed.

## Rebuilding assets

**Running or building the website does not require this step.** All production images are already bundled locally.

Optional asset production requires Node.js 24 or later, a C++17 compiler with OpenMP support, Python 3 and Pillow with WebP support. The recorded production environment used G++ 13.3.0 and Pillow 13.0.0. The renderer has no browser, GPU, WebGL, server, online model or API dependency.

From the project directory, install the optional image encoder once, then bake:

```sh
python3 -m pip install -r scripts/requirements-render.txt
node scripts/bake-frames.mjs --stills
node scripts/bake-frames.mjs --camera=hero
node scripts/bake-frames.mjs --camera=hero-portrait
python3 scripts/manifest-art.py
```

A targeted draft can be generated with:

```sh
node scripts/bake-frames.mjs --camera=landscape --only=even-06 --samples=1
```

A targeted close composition can be generated with:

```sh
node scripts/bake-frames.mjs --camera=portrait --only=even-06 --mode=preparation
```

`FRAME_CXX` and `FRAME_PYTHON` can select the compiler and Python executable. Windows users may use an existing MSYS2/MinGW toolchain with OpenMP; a browser or the ordinary website build does not need that toolchain. Byte-identical rebuilds across different compiler, math-library or WebP encoder versions have not been verified. The wrapper creates its own temporary working directory and removes only that directory when finished. No executable or intermediate PPM file is needed in the delivered application. Partial draft renders leave the full-production manifest unchanged; rerun the full production command before shipping modified art.

## Scope of verification

The production renderer's visual checks cover character consistency, the fold and thumb impression, mouth and gaze, the two feet, the maximum stride, left/top/front hand contact, overshoot, final outline margin, and full portrait framing. These checks establish the image assets, not the browser's playback timing, interaction state, downloads, scrolling or accessibility. Those require the separate application tests and browser evidence in the delivery report.
