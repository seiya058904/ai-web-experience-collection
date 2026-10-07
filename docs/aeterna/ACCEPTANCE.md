# AETERNA — Collection intake acceptance

Audited and integrated on 2026-10-07. The supplied nine-room Roman sculpture exhibition keeps its monumental marble imagery, Bodoni Moda/Manrope typography, native scrolling, one on-demand RAF, local museum-derived models and manual/follow controls. Two reproduced upstream runtime defects and one confirmed font-notice defect were repaired before acceptance. The new Collection entrance also received a phone title-fit correction. These results cover the local production build; no publication or physical-device acceptance is claimed.

## Delivery and source audit

| Item | Recorded result |
|---|---|
| Original archive | `D:/下载/AETERNA-Rome-in-Marble-and-Memory.zip` |
| Size / entries | 27,993,054 bytes / 82 files / 40,204,997 uncompressed bytes |
| SHA-256 | `e42d84aabd2ebeca9351552a141e5320d406032d97f14ee6ecf2778e1414feb2` |
| Modification time | `2026-10-07T10:23:12.801381` (local filesystem time) |
| Archive integrity | CRC passed; one `AETERNA/` root; no absolute/traversing paths, symlinks, duplicate names or nested archives |
| Supplied checksum inventory | All 81 entries in `SHA256SUMS.txt` matched |
| Extraction | Fresh temporary directory outside the repository; original ZIP stays outside Git and deployment |
| Import boundary | Source in `experiences/aeterna/`, page in `pages/aeterna/`, resources/notices in `public/aeterna/`, scoped docs and provenance |

The upstream `dist/` contains compiled output, including older unreferenced JS/CSS bundles. Its historical verification document therefore does not establish that the actual archive output was clean. All upstream compiled output is omitted; the supplied source is rebuilt with existing Collection dependencies. Standalone package/lockfile, Vite/server configuration and startup tools are omitted and retained in the original archive. No root dependency or lockfile change, dependency installation, asset regeneration, second clock or nested build was introduced. The delivery used Three.js 0.180.0 and Vite 7.1.9; the Collection uses its already-installed Three.js 0.186.1 and Vite 8.3.2.

**CONFIRMED-STATIC:** inspected application source has no remote runtime service, analytics, uploads, microphone or dynamically evaluated code. Reference links are ordinary explicit links. Model/Draco URLs retain the configured base. Both GLBs are self-contained without external buffer/image URIs. Graph coverage reported changed metadata; structural conclusions were checked by reading the source, not by treating the index as complete. **CONFIRMED-RUNTIME:** normal standalone and integrated runs made no external application requests, reported no page errors and had no failed resource requests. Forced model-failure requests are separate, intentional fallback probes.

## Models, imagery and scoped rights

| Supplied GLB | Checked binary / identity |
|---|---|
| `herakles-fragments.glb` | 8,925,536 bytes; SHA-256 `0d73f3a6852023e35b22dd30493f9efacf9813e4744cce2bbc9bd42825f586f7`; 36 meshes/pieces; 154,248 triangles (line primitives excluded) |
| `roman-wellhead.glb` | 7,113,316 bytes; SHA-256 `08d2718277466e65a195c4cd911e6d84269c89586a89f96eb507f1e951ec4cea`; one mesh; 134,781 triangles; local Draco decoding |

The [official SMK KAS224 API record](https://api.smk.dk/api/v1/art/?object_number=KAS224) confirms a plaster cast acquired in 1897 and Public Domain Mark 1.0. This is a later cast of the Lansdowne Herakles, not a direct scan of the ancient Roman marble. The [Getty object explanation](https://www.getty.edu/education/k-12-learning/explore-statue-of-hercules/) dates that Roman original to about 125 CE. AETERNA's 36 digital cuts, cap surfaces, materials and motion are artistic transformations, not evidence of historical fractures.

The [Met object record](https://www.metmuseum.org/art/collection/search/775805) identifies the Roman wellhead, second century CE, accession 2019.7, as Public Domain with a 3D download. The provided CC0 model record is consistent with the [Met Open Access 3D programme](https://www.metmuseum.org/press-releases/3-d-models-announcement-2026). Both GLBs retain the delivery bytes and metadata. Original remote model bytes were not independently redownloaded or compared; the verified chain is delivery hashes, preserved model metadata and official object/rights records.

Ten generated scene plates and one alpha hero cutout remain byte-identical. Prompts, dimensions and hashes are preserved in `AI_ASSETS.json`; two unused design-reference images remain in provenance. Imagined portraits, processions and galleries are not named archaeological objects or documentary photographs. Ancient pigment caveats remain consistent with [the Met's polychromy explanation](https://www.metmuseum.org/essays/polychromy-of-roman-marble-sculpture). Portraiture, contrapposto, Augustus, Marcus Aurelius and restoration notes were checked against the supplied official Met, Getty, Vatican Museums and Musei Capitolini links in `research.js`.

All four font binaries and five local Draco files retain their original bytes. Bodoni Moda and Manrope use SIL OFL; the supplied Manrope notice had a generic `Google Inc.` header. The public notice now includes the official [Manrope Project Authors copyright and complete OFL](https://github.com/google/fonts/blob/main/ofl/manrope/OFL.txt), while the original notice remains in provenance. Bodoni's author statement is consistent with [the official Bodoni Moda notice](https://github.com/google/fonts/blob/main/ofl/bodonimoda/OFL.txt). Draco's complete Apache 2.0 license remains local. Three.js and actual production dependencies are represented by the generated root license inventory; historical standalone tool notices stay in provenance.

The delivery contains no application-wide LICENSE. No MIT or other whole-application grant is invented; museum, font and decoder rights remain scoped. User-supplied integration does not establish a separate redistribution license. See [import mappings](../../provenance/aeterna/IMPORT.json), [original asset record](../../provenance/aeterna/ASSET_PROVENANCE.md) and [public notices](../../public/aeterna/ATTRIBUTION.md).

## Reproduced defects and repairs

| Classification | Before | Repair and verification |
|---|---|---|
| CONFIRMED-RUNTIME | With JavaScript disabled, eight visually displayed rooms retained literal `aria-hidden="true"` and `inert`. The accessibility tree exposed only the opening region. | Remove those initial attributes; the running controller continues to own inactive-room state. The static reading edition exposes all nine regions, keeps prose and hides unsupported interactive controls. JavaScript still leaves eight inactive rooms inert. Native home entry and Collection return work in both modes. |
| CONFIRMED-RUNTIME | At 768×1024 the wellhead overlapped its heading and slider. | Portrait widths 701–900px reuse the supplied compact CSS and measured canvas layout. Before/after runtime frames confirm separation; all nine tablet rooms were captured again. Short landscape keeps its existing composition. |
| CONFIRMED-STATIC | The supplied Manrope OFL copy omitted the named project authors and used a generic Google header. | Ship the official author copyright/OFL, preserve the original notice and document the additional source/hash. Font bytes and appearance remain unchanged. |
| CONFIRMED-RUNTIME — integration | The new gallery title extended beyond its phone panel at 390px. | Reduce only the AETERNA entrance's phone title size, then check its text range and panel bounds after font load. |

`scroll.js`, `notes.js` and `research.js` are unchanged from the original source. Other code adaptations are asset/import paths, shared Collection return, document metadata, static reading accessibility and the portrait compact predicate/CSS. The gallery uses the unchanged supplied hero plate and its own Bodoni voice; no new art or work redesign was introduced. Existing works' runtime source and gallery positions are preserved.

## Executed engineering checks

| Check | Actual result |
|---|---|
| Collection `npm test` | 145/145 passed; three AETERNA measured-scroll, reversal and resize/reading-edition tests added |
| Root `npm run build` + `npm run verify:build` | Passed; 477 local HTML/CSS references checked |
| Project-path build + `npm run verify:build` | Passed with `/ai-web-experience-collection/`; 477 references checked |
| Provenance verification | Archive entry hashes, all imported mappings and unchanged public resources checked; original ZIP and root lockfile unchanged |
| Final Git whitespace check | `git diff --cached --check` passed |

Runtime: Node.js 24.15.0, npm 11.12.1, Chromium 151.0.7922.34. Bundled Playwright was used because the Browser plugin was unavailable. ANGLE/SwiftShader produced real WebGL frames; this does not certify native GPU performance. Native Chromium/CDP was used separately for actual visibility and history events, because Playwright focus emulation masks hidden-tab behavior. The build retains the existing VEIL CSS `@import` ordering warning, outside this intake; both builds pass. Temporary harness errors (wrong body attribute selector and context-loss extension lifetime) were corrected before recording passing browser results and were not product failures.

Both production license inventories, namespaced notices, fonts, photos, GLBs and local Draco resources load under the project base. All 32 AETERNA page/resources and root license inventories matched served bytes against the verified build. Gallery title bounds also passed at 320, 360, 390, 430, 768, 1440 and 3840px widths after font load. The final project-path `dist/` remains available for local preview. Detailed browser drivers/results and screenshots are outside the repository at `C:/Users/admin/AppData/Local/Temp/collection-aeterna-intake-qv89g8xa/`.

## Production browser acceptance

All nine rooms were captured at **390×844, 768×1024, 1440×900, 1920×1080, 2560×1440, 3840×2160 and 844×390**: 63 complete room frames plus entry, gallery, fallback and arbitrary-stop evidence. All seven contact sheets were visually inspected. No horizontal overflow was found and visible controls stayed within viewport bounds. These are CSS viewport simulations, not seven physical devices.

Passed flows:

- Nineteen native home entrances; desktop/phone home → AETERNA → Collection; direct entry and refresh under the project base.
- All chapter/index links, beginning/end restart, portrait selection, marble inspection, cast inspection, research/source disclosures and Escape close; range keyboard increment and manual/follow controls.
- Body 0% → 100% changed actual canvas pixels; returning to 0% reproduced the original canvas PNG hash exactly. Relief Surface → Space and museum light 10% → 90% also changed rendered pixels.
- Saved manual assembly 65% survives reload after the actual 170ms save debounce. Resize retains chapter/read position. System reduced motion remains stable while direct controls work; a manual motion override restores native animated scrolling.
- Fine, slow, normal and high-frequency wheel input, fast down/reverse; visible reversible movement. Arbitrary stops in all four spatial rooms retain usable controls.
- WebGL disabled and GLB requests deliberately blocked: still gallery/readable prose, disabled unavailable model controls and useful navigation. Context loss releases the interactive presentation; restoration re-enables the model, with the gallery exit usable during loss.
- JavaScript-disabled home has nineteen native links; the work exposes nine semantic regions and no inert rooms, hides unsupported controls and retains its native Collection return.
- Idle RAF count remained unchanged for one second. A real hidden tab held frame count, chapter and read position for 1.5 seconds; activation resumed rendering and assembly input changed the sculpture.
- Native Collection exit and browser Back restored Afterlife at scrollY 7646, inspection enabled, light 73%, and manual body state 50%; `pageshow.persisted === true` confirms the tested BFCache return.
- Normal interactive acceptance produced zero page errors and zero failed resource requests.

Physical touch, iOS/Safari, native GPU behavior, high-refresh hardware, hardware performance budgets and full assistive-technology traversal are **NEEDS-VERIFICATION**. No external release was requested or performed. This local acceptance does not certify the deployed Pages version or later changes.
