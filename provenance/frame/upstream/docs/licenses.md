# FRAME — asset provenance and dependency licenses

Inventory checked against the installed packages on **2026-11-09**. License and notice files under `third-party/` were copied byte-for-byte from those packages; [inventory.json](third-party/inventory.json) records each package version, source path, byte count, and SHA-256. No dependency binaries or `node_modules` are needed in the delivery ZIP.

## Project artwork and code

Boop, the small-block story, project-specific code, and generated concept artwork were produced for FRAME. The film uses deterministic rendered poses derived from the project's character and scene source. It is original digital stop-motion artwork, not a record of physical clay photography.

The ACMI and Aardman pages in [sources.md](sources.md) are method references. Their photographs, film frames, characters, logos, and props are not production assets in this project. The references do not imply endorsement or collaboration.

The generated-image provenance is recorded in [image-generation.json](image-generation.json), with prompts in [image-prompts.json](image-prompts.json). `concepts/IMG-01.png` through `concepts/IMG-08.png` are the eight individually inspectable brief-assigned concept results; `concepts/UI-01.png` and `concepts/UI-02.png` are additional interface studies. These are concept and production references, not 24 separately generated animation poses. Adoption decisions and rendered comparisons belong in the design and validation records. No tool-unreported seeds or hidden generation settings are asserted here.

## Browser runtime and font

| Package / asset | Exact installed version | License and attribution | Included notice |
| --- | --- | --- | --- |
| `lenis` | 1.3.27 | MIT; Copyright (c) 2024 darkroom.engineering | [Lenis LICENSE](third-party/lenis/LICENSE) |
| `@fontsource-variable/manrope` | 5.3.0 | SIL Open Font License 1.1; Copyright 2019 The Manrope Project Authors | [Manrope LICENSE](third-party/fontsource-variable__manrope/LICENSE) |

Manrope is supplied as locally bundled font files. Its upstream attribution URL is https://github.com/sharanda/manrope. The installed Fontsource package identifies the font as Manrope, normal style, variable weight 200–800. Preserve the included font license and attribution with redistributed font files. System fallback fonts are requested by CSS and are not copied into the package.

The portable build script embeds the exact Lenis and Manrope notice texts in `FRAME.html` as an inert `frame-third-party-notices` JSON block. Each record includes the pinned package version and the notice's SHA-256; the same record identifiers and hashes are written to `docs/offline-build.json`. The notices can be read in the HTML source and do not add visible interface content. The original notice files remain in this source package.

## Build tools and retained notices

These tools prepare the project; they are not required by the dependency-free server that opens the included `dist/` build.

| Installed package | Version | Declared license | Included notices |
| --- | --- | --- | --- |
| `vite` | 8.3.6 | MIT; its notice also covers bundled components under BSD-2-Clause, CC0-1.0, ISC, and MIT | [Vite LICENSE.md](third-party/vite/LICENSE.md) |
| `typescript` | 5.9.3 | Apache-2.0 | [LICENSE.txt](third-party/typescript/LICENSE.txt), [ThirdPartyNoticeText.txt](third-party/typescript/ThirdPartyNoticeText.txt) |
| `rolldown` | 1.2.16 | MIT, with additional bundled component notices | [LICENSE](third-party/rolldown/LICENSE), [THIRD-PARTY-LICENSE](third-party/rolldown/THIRD-PARTY-LICENSE) |
| `lightningcss` | 1.33.0 | MPL-2.0 | [Lightning CSS LICENSE](third-party/lightningcss/LICENSE) |
| Other installed build dependencies | See inventory | MIT, Apache-2.0, ISC, BSD-3-Clause, or MPL-2.0 as individually recorded | [Full installed inventory](third-party/inventory.json) and each package's retained notice directory |

The inventory contains **20 installed packages** and **20 copied notice files**. Two installed platform-specific Rolldown adapters declare MIT in their manifests but provide no separate root license file; no native adapter binary is included in the source ZIP. Rolldown's own license and complete bundled third-party notice are retained. Platform-specific optional packages installed on another operating system can differ; the lockfile remains the source of dependency resolution.

These records preserve the components' original terms. They do not relicense third-party code or fonts, assert exclusive rights to generated artwork, or replace the actual notices. Installation, browser acceptance, and final ZIP integrity are separate checks recorded by the delivery report.
