# BERTH — final asset integrity check

**Checked on 2026-11-09. Asset preparation and integrity checks completed successfully.** This report covers image files and portable asset references; it does not claim browser, transition, production-build or ZIP verification.

## What was produced

- **22 distinct current image roles:** three alternate opening concepts and 19 adopted runtime assets.
- **32 successful recorded image-tool requests and distinct returned files**, comprising 22 current selections and 10 superseded correction outputs. Each recorded request returned one image. Orchestration batches, WebP variants and concept copies are not extra generations. Failed or unrecorded calls are not counted.
- **8 required concept outputs** remain independently viewable in `docs/concepts/`.
- **65 WebP files:** 19 full images, 19 small images, 19 recovery previews and 8 concept images.
- Exact prompts, source filenames, references and all 10 revision histories are retained in `docs/asset-records.json` and `docs/image-generation.md`. No seed or hidden generation setting was invented.

## Measured sizes

| Artifact group | Files | Exact bytes |
| --- | ---: | ---: |
| Adopted full images | 19 | 1,671,894 |
| Small responsive images | 19 | 667,986 |
| Recovery preview images | 19 | 219,116 |
| Required concept evidence | 8 | 590,094 |
| Asset manifest, including recovery data URIs | 1 | 317,305 |
| Critical Hero preview module | 1 | 29,011 |

Full/small files use WebP quality 84. Each recovery preview has a **480-pixel long edge**, proportional dimensions and quality 80. The source art was only format-converted and proportionally downscaled; the preparation pipeline did not crop, paint, add text or change compositions. Dimensions were measured with ffprobe during preparation.

## Actual verification

`node scripts/check-assets.mjs` completed successfully:

- All **65 image files** matched their manifest byte counts and SHA-256 values and had valid RIFF/WebP signatures.
- All **19 embedded previews** matched their corresponding preview-file bytes and SHA-256 values.
- IMG-01 through IMG-08 were each present exactly once in the concept inventory.
- The two exports in `src/critical-art.ts`, `heroPreview` and `heroMobilePreview`, exactly matched the selected Hero recovery data URIs.
- No incomplete `.pending.webp` conversions remained in the deliverable asset directory. One unreferenced zero-byte stale temporary was moved outside the project before the final check.

| File | SHA-256 |
| --- | --- |
| `public/assets/manifest.json` | `72faf0400e0253dc5bd6bd1072f3d312348a36cd7411cb2755aa90eb39e938ab` |
| `src/critical-art.ts` | `a1f954fde62f67fcf10207792842a06755304a0431fcba97a44458f876beede5` |

The manifest records individual full/small/preview hashes and sizes for every adopted image, plus each concept file. The portable checker needs only Node; it does not need the generation PNGs or ffmpeg.

## Portable source build

The normal `npm ci`, `npm run dev` and `npm run build` paths use the bundled WebP files and generated TypeScript preview module. They do **not** invoke image generation or asset preparation, do not require original PNGs, and do not rely on a private generation path. A source search found no generation-workspace paths or PNG imports in the application modules.

`scripts/prepare-assets.mjs` is optional tooling for re-encoding source artwork. It requires ffmpeg/ffprobe and can use `--source-dir` with the original generated PNG filenames; when those PNGs are absent, it retains already-prepared assets. It also regenerates the critical Hero preview module from the prepared manifest values. Standard site installation and building do not require either image utility.
