# Third-party notices

The original OPTIC code is licensed under [MIT](LICENSE). The following third-party components retain their own copyright and license terms.

| Component                                                                                                    | Pinned version | Role                                                                | License and included notice                                                                                      |
| ------------------------------------------------------------------------------------------------------------ | -------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [Three.js](https://threejs.org/) / npm `three`                                                               | 0.186.1        | Runtime rendering library and imported geometry/environment helpers | MIT — [licenses/THREE-LICENSE.txt](licenses/THREE-LICENSE.txt)                                                   |
| [Manrope](https://fontsource.org/fonts/manrope) / npm `@fontsource-variable/manrope`                         | 5.2.8          | Locally bundled variable font                                       | SIL Open Font License 1.1 — [licenses/Manrope-OFL.txt](licenses/Manrope-OFL.txt)                                 |
| [Cormorant Garamond](https://fontsource.org/fonts/cormorant-garamond) / npm `@fontsource/cormorant-garamond` | 5.2.8          | Locally bundled display font                                        | SIL Open Font License 1.1 — [licenses/Cormorant-Garamond-OFL.txt](licenses/Cormorant-Garamond-OFL.txt)           |
| [Vite](https://vite.dev/) / npm `vite`                                                                       | 8.3.3          | Development/build tool and generated module-preload support         | MIT — core notice reproduced below. Its development dependency tree is not bundled as `node_modules` in the ZIP. |

The three included license files are copied verbatim from the installed packages. Their attribution statements are preserved, including **Copyright © 2010–2026 three.js authors**, **Copyright 2019 The Manrope Project Authors**, and the Cormorant Garamond package's supplied **Google Inc.** notice. Fonts are distributed under their font licenses; the project MIT license does not relicense them.

The versions above were checked against `package.json`, `package-lock.json` and the installed package metadata on **2026-10-06**. The three files in `licenses/` were also compared byte-for-byte with those packages' original notices. Font binaries are bundled locally; the listed website links are attribution references, not runtime requests.

Additional development dependencies installed by `npm ci` retain the license files delivered in their respective npm packages. The lock file records the reproducible dependency tree. Do not remove the retained notices when redistributing the application or its production build.

No camera manufacturer's photograph, diagram, model, logo or video is included. The sole AI-generated coastal image, its `.webp.json` sidecar and original procedural assets are recorded in [docs/PROVENANCE.md](../../provenance/optic/PROVENANCE.md); engineering references appear in [docs/SOURCES.md](../../docs/optic/SOURCES.md). Mention of a manufacturer or tool does not imply endorsement.

## Vite core MIT notice

Copied from the installed Vite 8.3.3 package's core license. The complete development-tool distribution retains additional bundled-dependency notices in its own `LICENSE.md` when installed through npm.

```text
MIT License

Copyright (c) 2019-present, VoidZero Inc. and Vite contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

Collection integration uses the existing Vite 8.3.2 build; the Vite 8.3.3 entry above records the supplied standalone package. The generated production dependency inventory records the actual bundled code. Asset prompts and source records live in repository provenance and are not deployment files.
