# AER — Art direction and asset provenance

Audit date: 2026-11-09.

## What was actually created

Ten independent raster image outputs were generated with the built-in `image_gen.imagegen` tool (exposed in orchestration as `image_gen__imagegen`). They comprise the eight specified base roles plus two additional branch panoramas. Each is an actual separate tool output, not a duplicate counted under a second role. The ten preserved PNG files have ten different SHA-256 hashes.

The tool did not expose a seed, sampler, model version or reproducible generation parameter set. No such values are claimed. Exact prompts and tool-returned original file paths are retained in the generation record bundle. The source references used for edits were other images created for AER in this task; no stock photograph, tourism image or third-party logo was substituted.

The landscapes, balloon and people are generated fictional imagery. The photographic visual style does not make these images photographs of a real flight or a real place. No raster contains required interface labels, controls, equations, navigation, route coordinates or statistics. Those elements are implemented through DOM, SVG and the deterministic journey model.

## Visual direction

The composition balances a huge, quiet volume against a very small basket and human figures. The shared design is a pear-shaped balloon with alternating pearl-cream and soft apricot gores, a single dark indigo crown, a honey-colored basket and four intended suspension attachments. Morning light comes from the left, with gentle field shadows and a stable horizon. The principal palette is lavender-blue `#A7B8D5`, pearl `#F6F1E8`, apricot `#EAB7A1`, sage `#A6B5A0`, distant indigo `#707D9A`, and text blue-gray `#334253`.

Image generation guided silhouette, volume, light, material and scale. It does not establish exact repeated topology: a rendered seam count or a partly hidden rope in a raster is not proof of the runtime model's geometry. The code-owned balloon is the authoritative sixteen-gore construction for the live scene. H-C's less reliable mouth and suspension details are recorded rather than silently treated as exact identity matches.

The opening uses wide H-D and separately generated portrait H-M. Their subject proportions and available sky differ deliberately for the two layouts. Page text remains real, selectable English text. Cropping within the responsive layout is a presentation decision and does not create an additional image-generation result.

## Candidate decisions and page use

| Role | Dimensions | Decision | Reason and use |
| --- | --- | --- | --- |
| H-A | 1536 × 1024 | Candidate / reference | The original low human-height composition establishes the immense envelope, tiny basket and two people. H-D supersedes it as the displayed desktop opening. |
| H-B | 1536 × 1024 | Selected for CH-02 | The partly supported envelope offers a clear before-state without pretending that two unrelated meshes can morph reliably. It is not the opening Hero. |
| H-C | 1536 × 1024 | Rejected as Hero; reference retained | The upward basket view is a distinct alternative, but its mouth is too broad and suspension anatomy is less exact. It is not used for a literal live-model handoff or displayed in the production journey. |
| H-D | 1672 × 941 | Selected desktop Hero / CH-02 held state | The refined wide composition leaves the left sky open for real text, keeps the crown and full suspension connection legible, and retains two small people for scale. |
| H-M | 941 × 1672 | Selected independent mobile Hero | A separate portrait generation places the complete balloon, suspension, basket and ground in a vertical composition, with clear upper sky. It is not a crop counted as another generation. |
| K-05 | 1536 × 1024 | Selected CH-05 image | The balloon shadow stretches across two field tones and a slope; the pale path and small basket-edge cue ground the viewpoint. The raster shadow is artistic, not a measurement or physical simulation. |
| K-08 | 1536 × 1024 | Selected middle-route panorama | The image shows the village beside the road bend and the meadow beyond. The production destination name is Willow Bend. Prompts sometimes describe this visual landmark as Village Bend; that wording is not a second destination. |
| T-04-05 | 1536 × 1024 | Selected transition study | The lower envelope, connected basket, field shadow and pale path coexist at a shallow angle. The image supplies a midway composition reference and a visible study; the presence of a reference alone does not prove a continuous live transition. |
| K-08-low | 1536 × 1024 | Selected low-route panorama | Nearby paired rows of trees and hedgerows frame Hedgerow Meadow. This is a separately generated landscape, with no village used as the destination. |
| K-08-high | 1536 × 1024 | Selected high-route panorama | Broad pale fields, a distant oval grove and a far indigo ridge identify Far Meadow. This is a separately generated landscape rather than a relabeled middle-route bitmap. |

## Three landscapes for three branches

| Selected wind | Production destination | Panorama file | Visible landmark |
| --- | --- | --- | --- |
| Low | Hedgerow Meadow | `public/art/k-08-low.webp` | Nearby paired tree rows, hedgerows and a curved pale path |
| Middle | Willow Bend | `public/art/k-08.webp` | Village roofs beside the road bend and a meadow beyond |
| High | Far Meadow | `public/art/k-08-high.webp` | Broad pale fields, a distant oval grove and the far ridge |

These are three independently generated images. Their common basket rim, right-hand suspension cue and small envelope corner maintain a consistent viewpoint. The application chooses the branch asset from explicit wind state, and the panorama loader has a current-request guard. Those source facts are distinct from browser verification of late requests, route continuity and responsive framing; those checks belong in the testing report.

The image assets are not navigable maps and do not determine the trajectory. `journey.ts` determines common-prefix and branch positions; `scene.ts` renders the live world. The ground experiment's load selection does not change the image set or the flight route.

## Runtime inventory and compression

The eight unique images referenced by `index.html` and the dynamic branch selection code all exist in `public/art/`. The two additional WebPs are retained candidate/reference assets: H-A and H-C.

| WebP file | Runtime role | Bytes | Dimensions |
| --- | --- | ---: | --- |
| `h-a.webp` | Candidate/reference only | 117,002 | 1536 × 1024 |
| `h-b.webp` | Used by the journey | 131,694 | 1536 × 1024 |
| `h-c.webp` | Candidate/reference only | 69,800 | 1536 × 1024 |
| `h-d.webp` | Used by the journey | 99,728 | 1672 × 941 |
| `h-m.webp` | Used by the journey | 118,690 | 941 × 1672 |
| `k-05.webp` | Used by the journey | 178,728 | 1536 × 1024 |
| `k-08.webp` | Used by the journey | 107,534 | 1536 × 1024 |
| `t-04-05.webp` | Used by the journey | 158,454 | 1536 × 1024 |
| `k-08-low.webp` | Used by the journey | 164,210 | 1536 × 1024 |
| `k-08-high.webp` | Used by the journey | 104,876 | 1536 × 1024 |

The eight runtime images total **1,063,914 bytes**. All ten WebPs total **1,250,716 bytes**. The ten original PNG copies total **22,371,980 bytes**. These are file-size totals, not claims about first-load transfer, browser decoding time, FPS or device performance.

The WebPs are compressed derivatives of their corresponding PNGs and are not counted as new generations. Their dimensions remain the same as the original outputs. H-B, H-C, K-05, K-08, T-04-05, K-08-low and K-08-high were encoded with Pillow WebP quality 84 and method 6; the production copies of H-A, H-D and H-M were provided by the main asset workflow. Exact derivative byte hashes are listed below.

## SVG and WebGL alternatives

`illustration.ts` supplies deliberately simplified vector illustrations when WebGL or image resources cannot be used, and for static comparison frames. It retains a pear-shaped balloon, cream/apricot identity, an indigo cap, connected basket, ground relationship and branch-specific landmarks. Its accessible description explicitly identifies it as a simplified scene illustration.

This SVG rendering is **not claimed to reproduce the generated raster material, photographic texture or lighting fidelity**. The SVG is a functional visual alternative with its own drawing style. Its state is evaluated through the same deterministic journey functions, and the code gives simultaneous SVG instances distinct deterministic definition IDs. Illustration state and physical/temporal correctness should be assessed separately from raster-art fidelity.

## Integrity verification

The asset audit read the consolidated generation records and compared each source copy with both its recorded SHA-256 and the original tool output. All ten copies matched; all recorded dimensions matched; all ten hashes were unique. It then collected local art paths from the HTML and the dynamic panorama mapping and checked every required file. No required image was missing.

The original PNG hashes are:

| Source PNG | SHA-256 |
| --- | --- |
| `H-A.png` | `cfaaa53c0e7b59cb7dddef5bf9b5a50b391771b577bdea29dd84fb984788dd90` |
| `H-B.png` | `a8a177192267c743c33d08d6b0d653851a6765aec2f6b60c61e86176bfafe965` |
| `H-C.png` | `ad59a1d34806454e43810f0e57ee51709182199a86f127507ea188d065110779` |
| `H-D.png` | `dda8c81ae92653c706bb383de221b97c46139476ef2feefc3267aac20220a238` |
| `H-M.png` | `02389339addbcaaaa7236cc63be7bbeaff817808a944e12c39b9936ba6ccc4e7` |
| `K-05.png` | `2de01fbee4d4bdca0104e1a58279262c52eae44d973615dd7d7dc4f9a19d94cf` |
| `K-08.png` | `b1e1cb5e0f74250f271045a92263233a46de4b5c07a1e5d64fc9b7966fcdcf39` |
| `T-04-05.png` | `8c6eb9dbcc3021848a3afde4a772245cf513eb0eb907021a88243a900cfaf7a7` |
| `K-08-low.png` | `3c96722abe0df7e59794f7fc0595110dd4f0fbc6632524162d7b4f16cac9a6bc` |
| `K-08-high.png` | `79f1836ef26daea036edc8517a8cde8d85f6a4d0c08266d035a488b602d069c6` |

The optimized WebP hashes are:

| Project asset | SHA-256 |
| --- | --- |
| `public/art/h-a.webp` | `c43c47b5b89f72a4e55fac2b2b05d6cf4241dfbe2a9375e2ae4338520993f8d9` |
| `public/art/h-b.webp` | `ffd3c198f1974aa04186db8a7c03181a213ccfc1f7ea342de1e3657be508a6be` |
| `public/art/h-c.webp` | `03b35f8df376682015d246bac96dd08402a5aee154f16a841b3541d5042019bb` |
| `public/art/h-d.webp` | `d2bf7a6c3be075048f3206456c0145051eb03be22d151bdf741ad5e62356e7d3` |
| `public/art/h-m.webp` | `ddb50ec9da8e8911c92d6e0d9c4ddf5611f06c8003756daee7b38538631a781c` |
| `public/art/k-05.webp` | `f6f74945e90d31815d891b290f8c74c96a71fa9a1364ff696cb73788fea623e6` |
| `public/art/k-08.webp` | `356f6b137a035d2b1fe7878b6b6270ea4cf3d35ba57dd4f80ec5594627c49119` |
| `public/art/t-04-05.webp` | `6e01c6d407038057c5382c47d94b26a378ee26d6ed555b75b65bb07d9681a445` |
| `public/art/k-08-low.webp` | `8aefe49a3a2f27e361502e76d2a3bde5b22dd85eb2767f48d08a49af9060f91c` |
| `public/art/k-08-high.webp` | `fa2e4a722c3217917a41416a5e86dce1696e96ebe81ed337378e467f9e92c818` |

## Detailed record bundle

The detailed art-source bundle contains:

- `main-generation-record.json`: exact H-A, H-D and H-M prompts and original output paths.
- `agent-generation-record.json`: exact H-B, H-C, K-05, K-08 and T-04-05 prompts, source references and adoption observations.
- `branch-generation-record.json`: exact low/high panorama prompts and source references.
- `all-generation-record.json`: consolidated exact records, dimensions and original PNG hashes.
- `art-summary.md`: inventory and initial adoption notes.
- The ten role-named source PNG copies.

For runtime distribution, only the local WebP files are required; there are no temporary signed image URLs, image API calls or private absolute paths in the website's image URLs. Retain the detailed record bundle with the source delivery so the generation facts and decisions remain reviewable. Original tool paths in provenance records identify generation history and are not runtime dependencies.

## Scope of this audit

This document verifies the production art inventory, generation provenance, copy integrity and asset presence. It does not by itself certify the complete ten-chapter experience, camera transitions, the eight-viewport browser matrix, network recovery, keyboard interactions or export behavior. Those require the separate implementation and browser evidence.
