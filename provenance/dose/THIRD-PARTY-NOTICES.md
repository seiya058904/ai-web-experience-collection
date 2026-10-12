# Third-party notices and asset provenance

The original application source is distributed under the included MIT license. Third-party files retain their original terms. The running application uses local files only.

| Material | Version / origin | Included license / record |
| --- | --- | --- |
| Three.js module and core | `three` 0.183.2 | `vendor/three-LICENSE.txt` (MIT) |
| RoomEnvironment | Three.js 0.183.2 example; import changed to local module | Same Three.js MIT license |
| Lenis | `lenis` 1.3.26 | `vendor/lenis-LICENSE.txt` (MIT) |
| Space Grotesk variable Latin WOFF2 | `@fontsource-variable/space-grotesk` 5.3.0 | `assets/fonts/space-grotesk-OFL.txt` |
| IBM Plex Mono 400 / 500 Latin WOFF2 | `@fontsource/ibm-plex-mono` 5.3.0 | `assets/fonts/ibm-plex-mono-OFL.txt` |
| Barlow Condensed 600 / 700 Latin WOFF2 | `@fontsource/barlow-condensed` 5.3.0 | `assets/fonts/barlow-condensed-OFL.txt` |
| Tablet, grains, punches, die, cutaway and fracture geometry | Original procedural code | Original source license |
| Grain, pore, normal, metal and shadow textures | Original runtime-generated data; no downloaded photo texture | Original source license |
| Logo, arrows, close and plus symbols | Original SVG paths in this project | Original source license |
| Seven concept PNGs | Generated for this project with ImageGen; art-direction references | Exact prompts/provenance in `docs/concept-prompts.json` and `docs/concepts/section-concept-record.json` |

The generated references are included for design review and adaptation with this project. They are not scanned medicine, microscopy, CT data, drug-product photographs or clinical evidence. They are not loaded by the production scene. No proprietary stock image or scientific-paper figure is bundled.

Source URLs and dependency details are in `vendor/DEPENDENCIES.md`. Scientific publications are linked and paraphrased in `docs/SOURCES.md`; those linked publications are not relicensed by this project.

The browser executable, Playwright installation and other temporary QA dependencies used during development are not distributed. Their versions and scope are recorded in `docs/QA.md`.

The generated `dist/` folder contains runtime assets and their license notices. Design concepts, scientific source notes and QA records remain in the complete source distribution; references to `docs/` above refer to that source distribution.
