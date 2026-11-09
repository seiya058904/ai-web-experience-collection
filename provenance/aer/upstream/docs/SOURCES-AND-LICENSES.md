# AER — Sources, assets and third-party notices

Prepared 2026-11-09. Source code and dependency versions below refer to the actual local project and locked installation.

## Educational primary sources

| Source | Adopted concept | Scope |
| --- | --- | --- |
| [FAA, Balloon Flying Handbook, Chapter 2: Hot Air Balloon Design, Systems, & Theory](https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/Balloon_Flying_Handbook_FAA-H-8083-11B/bfh_chapter_2.pdf) | Buoyancy, density difference, envelope/basket structure, and total carried weight including internal air | Verified PDF pages 2–4, printed pages 2-2 to 2-4. No FAA image or page is redistributed. |
| [FAA, Balloon Flying Handbook, Chapter 7: In-flight Maneuvers](https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/Balloon_Flying_Handbook_FAA-H-8083-11B/bfh_chapter_7.pdf) | Vertical control and horizontal movement with wind at different heights | Verified PDF pages 5 and 7, printed pages 7-5 and 7-7. No practical burner procedures are reproduced. |

The wind field, terrain, people, time, quantities and destinations are authored fiction. The ground model normalizes volume, outside density and gravity rather than exposing operational temperature, mass or fuel values. These sources inform the qualitative idea, not an assertion that the project models an actual aircraft or weather forecast.

## Actual generated image inventory

All ten files below are distinct generated images supplied with this project. They were produced with the built-in image-generation tool during this task, then optimized as WebP resources. They are not stock-photo downloads. The generation record contains the actual prompts and art decisions; no unavailable seed or model parameter is invented.

| File in `public/art/` | Dimensions | Bytes | Use |
| --- | --- | ---: | --- |
| `h-a.webp` | 1536×1024 | 117,002 | Ground-level Hero candidate; retained as a scale/composition reference |
| `h-b.webp` | 1536×1024 | 131,694 | Distinct resting-envelope candidate; CH02 `At rest` view |
| `h-c.webp` | 1536×1024 | 69,800 | Basket-upward Hero candidate; retained as a reviewed alternative, not used as the opening |
| `h-d.webp` | 1672×941 | 99,728 | Refined desktop Hero; CH01 and CH02 `Held open` view |
| `h-m.webp` | 941×1672 | 118,690 | Independently generated mobile opening composition |
| `k-05.webp` | 1536×1024 | 178,728 | CH05 field-shadow plate |
| `k-08.webp` | 1536×1024 | 107,534 | CH08 middle-route panorama at Willow Bend |
| `k-08-low.webp` | 1536×1024 | 164,210 | Additional CH08 low-route panorama at Hedgerow Meadow |
| `k-08-high.webp` | 1536×1024 | 104,876 | Additional CH08 high-route panorama at Far Meadow |
| `t-04-05.webp` | 1536×1024 | 158,454 | Separately framed oblique balloon/basket/shadow/path study in CH05 |

The first eight requested roles are independently represented; the two extra K-08 branch panoramas make the later route selection visible. H-A/H-C remain references and do not inflate the count of production placements. Navigation, controls, diagram labels and exports are generated in real DOM/SVG rather than read from the image pixels.

Generated artwork is delivered as project material under the applicable generation-service terms. It is not relabeled under the MIT or font licenses below. No separate third-party photo, audio, texture or 3D-model pack was added.

## Runtime packages and fonts

| Package | Installed version | Actual license | Included notice |
| --- | --- | --- | --- |
| [Lenis](https://github.com/darkroomengineering/lenis) | 1.3.27 | MIT; copyright 2024 darkroom.engineering | `licenses/lenis-MIT.txt` |
| [Three.js](https://github.com/mrdoob/three.js) | 0.187.0 | MIT; copyright 2010–2026 Three.js authors | `licenses/three-MIT.txt` |
| [Cormorant Garamond via Fontsource](https://fontsource.org/fonts/cormorant-garamond) | 5.3.0 | SIL Open Font License 1.1; Cormorant Project Authors | `licenses/cormorant-garamond-OFL.txt` |
| [DM Sans via Fontsource](https://fontsource.org/fonts/dm-sans) | 5.3.0 | SIL Open Font License 1.1; DM Sans Project Authors | `licenses/dm-sans-OFL.txt` |

Used font subsets: local Latin Cormorant Garamond 400 and 400 italic, and local Latin DM Sans 400 and 500. Vite copies the referenced WOFF2 resources into the build. No runtime Google Fonts request is needed.

## Build-time packages

| Package | Installed version | Actual license | Included notice |
| --- | --- | --- | --- |
| [Vite](https://github.com/vitejs/vite) | 8.3.6 | Core MIT, with published bundled-dependency notices | `licenses/vite-LICENSE.md` — full upstream file, not just its first section |
| [TypeScript](https://github.com/microsoft/TypeScript) | 5.9.3 | Apache License 2.0 | `licenses/typescript-Apache-2.0.txt` |
| [@types/three / DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/three) | 0.187.0 | MIT | `licenses/types-three-MIT.txt` |

These license files are copied verbatim from the installed packages. The dependency lock file records exact versions; installing dependencies obtains their own notices as part of the packages. `node_modules/` is not part of the source delivery. No blanket project MIT license is inferred from these individual dependencies.

## Original code, vectors and audio

The narrative, interface, deterministic world, balloon geometry, SVG diagrams/keepsakes and synthesized ambient audio were created for this task. See [PROJECT-NOTICE.txt](../PROJECT-NOTICE.txt) for the original-project notice. The local server uses Node's built-in modules only. The soundtrack is optional procedural audio, so there is no music recording or audio attribution file to redistribute.
