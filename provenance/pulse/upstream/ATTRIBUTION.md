# Attribution and licensing

Reviewed: November 9, 2026. The original project source, generated artwork, third-party libraries, fonts and factual references have different rights and are identified separately below.

## Original project source

Original PULSE HTML, TypeScript, CSS, SVG diagrams, icons, build helpers, tests and original documentation are provided under the **MIT License** terms below. This notice does not assign a personal or corporate authorship identity, assert exclusive ownership of AI-generated material, or relicense dependencies, fonts, source publications or generated artwork.

Existing copyright notices for individual contributions remain with their respective rights holders.

### MIT License — original source only

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Generated artwork

Eight separate images were produced for this task using `image_gen.imagegen`. The exact prompts, references, dimensions and retained paths are recorded in [asset-provenance.json](docs/asset-provenance.json). Their selection and production uses are explained in [asset-selection.md](docs/asset-selection.md).

The generated outputs are supplied for use in this requested project under the applicable image-generation service terms. The project does not claim exclusive copyright in AI-generated outputs or guarantee their copyright status in every jurisdiction. These images are newly generated artistic reconstructions, not licensed photographs, patient scans or copied medical illustrations. They carry no implied NIH, AHA or clinical endorsement.

WebP conversion and responsive resizing preserve the role and composition of the selected assets. Retained native-dimension WebP files are inspectable in `docs/art/`; the original lossless generation files are not required at runtime.

## Runtime libraries

| Package | Installed version | License and attribution |
| --- | --- | --- |
| Lenis | 1.3.27 | MIT. Copyright (c) 2024 darkroom.engineering. [Complete packaged notice](docs/licenses/Lenis-MIT.txt), copied from the installed package. |
| GSAP, including ScrollTrigger | 3.15.1 | [GSAP Standard “No Charge” License](https://gsap.com/standard-license/). [Installed source notices](docs/licenses/GSAP-source-notices.txt): Copyright 2008–2026, GreenSock. All rights reserved. |

GSAP's `package.json` explicitly identifies its Standard “No Charge” license. Its [exact declared license field](docs/licenses/GSAP-package-license.json) is retained with the source notices. It is **not an MIT-licensed dependency**. The official license page was reviewed on November 9, 2026. It permits website implementation subject to its terms, including restrictions concerning competing visual animation builders and removal of proprietary notices. The complete current terms are available at the linked official page. Original-source MIT terms do not replace them. The installed package contains no standalone license file; the preserved source notices are not presented as the full license text.

### Lenis MIT notice

Copyright (c) 2024 darkroom.engineering

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Fonts

| Font | Package | Copyright notice | License |
| --- | --- | --- | --- |
| Cormorant Garamond | `@fontsource/cormorant-garamond` 5.3.0 | Copyright 2015 The Cormorant Project Authors (`github.com/CatharsisFonts/Cormorant`) | SIL Open Font License 1.1 |
| DM Sans | `@fontsource/dm-sans` 5.3.0 | Copyright 2014 The DM Sans Project Authors (`github.com/googlefonts/dm-fonts`) | SIL Open Font License 1.1 |

The installed font packages contain the authoritative notices in their `LICENSE` files. Complete byte-for-byte copies accompany this delivery: [Cormorant Garamond OFL](docs/licenses/Cormorant-Garamond-OFL.txt) and [DM Sans OFL](docs/licenses/DM-Sans-OFL.txt). The [notice index](docs/licenses/README.md) records source paths and copy verification. The font files remain under OFL 1.1 and are not relicensed under the original-source MIT terms. They are locally bundled, with no runtime Google Fonts request.

## Build tools

| Package | Version | Package-declared license |
| --- | --- | --- |
| Vite | 8.3.6 | MIT |
| TypeScript | 7.0.2 | Apache-2.0 |

`package-lock.json` records the resolved dependency tree. A normal `npm ci` installation supplies the tools' own license files and notices. Transitive packages retain their individual terms; this document does not claim that the entire dependency tree has one license.

## Sound and symbols

The optional paired thuds are synthesized from original Web Audio oscillator and gain code in `src/main.ts`. No third-party audio sample is included. The sound is an illustrative rhythm inspired by valve closure, not a real person's recording or a diagnostic signal.

The line icons, wordmark symbol and precise instructional SVG diagrams are original project code. No external icon pack or proprietary medical model is embedded.

## Scientific references

Factual references are listed in `src/content.ts`, [research-notes.md](docs/research-notes.md), and the visible source section of the site. NIH/NHLBI, NCI, AHA and the other source publishers retain all rights in their own text and artwork. Their names identify factual sources only. No source image, video, patient scan or sound recording is redistributed, and no endorsement is claimed.

The supplied brief's headings and leads are retained as requested. Additional explanatory prose was newly authored for the project. The source review does not constitute independent clinical validation of the final diagrams or images.
