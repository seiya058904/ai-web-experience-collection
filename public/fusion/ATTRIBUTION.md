# FUSION — Attribution & licenses

## Collection integration

FUSION is built inside the Collection's single Vite project and root lockfile. The versions listed below describe the supplied standalone source package; current deployed dependency versions are recorded in the Collection's generated [`third-party-licenses.md`](../third-party-licenses.md). This work keeps its MIT, GSAP and font/library notices below.

## Original project work

Copyright © 2026 FUSION contributors.

The original application code, layout, copy, procedural geometry, shaders, particle systems, Canvas renderer, SVG graphics and synthesized audio are provided under the [MIT License](LICENSE).

The reactor, lighting environment and all moving visual systems are generated from project code. The runtime does not use third-party photographs, video, recorded music, HDRI files or downloaded 3D models. Internal concept imagery used during design is not included in this package and is not a runtime dependency. No external visual asset is used in the finished experience.

## Third-party runtime software

| Component | Version | Copyright / project | License |
| --- | --- | --- | --- |
| Three.js | 0.180.0 | three.js authors | [MIT — included notice](licenses/Three-MIT.txt); [project](https://threejs.org/) |
| Lenis | 1.3.11 | darkroom.engineering; current [project repository](https://github.com/propagande-studio/lenis) | [MIT — included notice](licenses/Lenis-MIT.txt) |
| GSAP and ScrollTrigger | 3.13.0 | GreenSock / Webflow | [Standard “No Charge” GSAP License](https://gsap.com/standard-license); [included notice](licenses/GSAP-Standard.txt) |

**GSAP is governed by its own Standard “No Charge” License, not MIT.** The original-project license does not relicense GSAP or its plugins. The installed GSAP 3.13.0 package identifies this license by the official URL above. Preserve its notices and applicable license terms when redistributing the production bundle or making derivatives.

The official GSAP license page was checked on 2026-10-05. It identifies an effective date of April 30, 2025 and a last modification date of May 30, 2025. Consult the applicable license text rather than inferring permissions from the word “free.”

## Local fonts

The Latin WOFF2 files were obtained from the corresponding Fontsource packages, copied into `public/fonts/`, and are served from the same origin as the application. There is no Google Fonts or other font-CDN request.

| Font / file | Copyright | License and provenance |
| --- | --- | --- |
| Manrope Variable — `manrope-latin-wght-normal.woff2` | Copyright 2019 The Manrope Project Authors | [SIL Open Font License 1.1 — included text](licenses/Manrope-OFL.txt); [Fontsource package](https://fontsource.org/fonts/manrope); [original font project](https://github.com/sharanda/manrope) |
| IBM Plex Mono 400 — `ibm-plex-mono-latin-400-normal.woff2` | Copyright 2017 IBM Corp. | [SIL Open Font License 1.1 — included text](licenses/IBM-Plex-Mono-OFL.txt); [Fontsource package](https://fontsource.org/fonts/ibm-plex-mono); [original font project](https://github.com/IBM/plex) |

The fonts retain their SIL Open Font License terms. They are not relicensed under the original application's MIT License.

## Development tools

Vite 7.1.9 uses the MIT License; its [included license file](licenses/Vite-MIT.txt) also preserves notices for bundled code. TypeScript 5.9.3 uses Apache-2.0. Type declarations and transitive development dependencies retain their own package licenses. Their versions are resolved in `package-lock.json`; `node_modules/` is intentionally not distributed in the ZIP.

## Research references

ITER, the U.S. Department of Energy and Princeton Plasma Physics Laboratory provided the publicly available scientific information listed in [SOURCES.md](SOURCES.md). The project paraphrases relevant facts and constructs its own visuals. It does not redistribute their photographs, diagrams, footage or branding, and is not an official product of those organizations.

When sharing the complete project, retain `LICENSE`, this file, `SOURCES.md`, the `licenses/` directory and third-party notices present in the built JavaScript.
