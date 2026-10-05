# Third-party notices

KAGE / VOID's original application code, procedural geometry, scene compositions, motion choreography, and interface are distributed under the project's [MIT license](../LICENSE). The spatial artwork is generated in code; no stock photographs, external 3D models, or prerecorded film sequences are required.

## Runtime libraries

| Library | Version | Copyright | License text |
| --- | --- | --- | --- |
| [Three.js](https://github.com/mrdoob/three.js) | 0.186.1 | Copyright © 2010–2026 three.js authors | [Three-MIT.txt](Three-MIT.txt), MIT |
| [Lenis](https://github.com/darkroomengineering/lenis) | 1.3.26 | Copyright (c) 2024 darkroom.engineering | [Lenis-MIT.txt](Lenis-MIT.txt), MIT |

These complete license notices are copied from the exact installed packages. Both libraries are bundled locally into the browser build.

## Fonts

Barlow Condensed, DM Sans, and Noto Sans JP are distributed under the SIL Open Font License 1.1. See [font attribution and checksums](fonts.md), [Barlow's full license](Barlow-Condensed-OFL.txt), [DM Sans's full license](DM-Sans-OFL.txt), and [Noto Sans JP's full license](Noto-Sans-JP-OFL.txt). The bundled Latin WOFF2 files are unchanged Fontsource assets. An unchanged eight-glyph WOFF2 subset supplied by the official Google Fonts CSS API provides the displayed Japanese characters without a runtime font service or system-font dependency.

## Portable edition

the original delivery’s `KAGE-VOID.html` (retained outside deployment in `provenance/kage/`) embeds the application, styles, font files, favicon, and the complete project, library, and font licenses. Its `kage-license-notices` JSON element preserves those notices when the single HTML is copied independently of the project directory.

Build tools are development dependencies listed in `package.json` and `package-lock.json`; their executable packages are installed during development and are not included in the delivered browser runtime. Each retains its own package license.
