# CARGO — Asset and dependency notices

Reviewed against the installed packages on **2026-11-09**. This file identifies third-party materials and their notices; it does not relicense their code, fonts or artwork. `package-lock.json` is the authority for the full dependency graph.

## Runtime libraries

| Component | Installed version | Upstream license | Retained notice |
| --- | --- | --- | --- |
| Lenis | 1.3.27 | MIT; copyright 2024 darkroom.engineering | [LENIS-MIT.txt](docs/licenses/LENIS-MIT.txt) |
| Three.js | 0.187.0 | MIT; copyright 2010–2026 three.js authors | [THREE-MIT.txt](docs/licenses/THREE-MIT.txt) |
| GSAP and ScrollTrigger | 3.15.1 | GSAP standard no-charge license; not MIT | [GSAP-NOTICE.txt](docs/licenses/GSAP-NOTICE.txt) and [governing license](https://gsap.com/standard-license) |

The installed GSAP package's exact `license` declaration is:

> Standard 'no charge' license: https://gsap.com/standard-license.

The package does not supply a standalone license-text file. Its source headers retain GreenSock's copyright notice and the governing link. Those notices are recorded locally without inventing a permissive replacement license. The [official license page](https://gsap.com/standard-license), reviewed on the date above, distinguishes permitted website/interface use from restricted competing visual animation-building tools. CARGO is an authored editorial website; it does not offer a visual animation builder. Preserve upstream notices and consult the governing terms when changing that scope.

## Fonts

| Font package | Installed version | License and authorship | Retained license |
| --- | --- | --- | --- |
| `@fontsource-variable/archivo` | 5.3.0 | SIL Open Font License 1.1; copyright 2020 The Archivo Project Authors | [ARCHIVO-OFL.txt](docs/licenses/ARCHIVO-OFL.txt) |
| `@fontsource/barlow-condensed` | 5.3.0 | SIL Open Font License 1.1; copyright 2017 The Barlow Project Authors | [BARLOW-CONDENSED-OFL.txt](docs/licenses/BARLOW-CONDENSED-OFL.txt) |

The retained files are exact copies from the installed packages, including their copyright lines. The fonts are bundled as part of the website. Their license remains separate from the project's original narrative, diagrams and application code.

## Build and verification tools

Vite 8.3.6 is used to create the static build. Its complete installed notice, including bundled-dependency notices, is retained in [VITE-LICENSE.md](docs/licenses/VITE-LICENSE.md). TypeScript 5.9.3 and Playwright Test 1.65.0 are development tools declared by the lockfile; their installed packages contain their own Apache-2.0 notices. Node modules and browser binaries are not part of the source ZIP.

The [notice index](docs/licenses/NOTICE-INDEX.json) records package versions, original package paths, retained paths and SHA-256 values for the copied license files. It is an attribution inventory, not a claim that all listed tools execute in the visitor's browser.

## Generated images and original geometry

The images in `public/media/` are generated fictional compositions created for this project with the available image-generation tool. Production WebP files and smaller derivatives are retained locally. They are used as artwork, not documentary evidence of a port, operator, vessel or shipment. The project's asset-provenance record identifies the generation inputs, retained outputs and selection decisions.

The container study, SVG diagrams, UI and narrative were authored for this project. They do not reproduce a licensed industrial CAD model. No exclusive rights, copyright registrability or technical certification are asserted for generated output. Image-generation terms are separate from the software and font licenses above.

No third-party music, alarm recordings, shipping-company logos, stock photography or scraped standards diagrams are included. Audio is unavailable in this version.

## Research references

ISO, IMO, BIC and Hapag-Lloyd are credited as factual sources in [SOURCES.md](docs/SOURCES.md). A reference is not a grant to reuse its artwork or marks. Their standards, publications, photographs, logos and full technical tables are not redistributed as project assets. The exhibit's CARGO / BOX-001 identity is intentionally fictional.
