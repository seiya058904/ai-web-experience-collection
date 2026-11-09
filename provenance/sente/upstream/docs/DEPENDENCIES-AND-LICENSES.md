# Dependencies, licenses, and source inventory

Audit date: **9 November 2026**. This inventory describes the exact local package metadata, lockfile, included notices, and resource bytes inspected for this delivery. It does not claim that these are the latest available package versions or that Windows execution was tested.

## Direct dependencies

Versions and license identifiers below come from the installed packages' `package.json` files, cross-checked against [package.json](../package.json) and [package-lock.json](../package-lock.json). The runtime font copies were also compared byte for byte with their installed source files.

| Package | Locked version | Declared license | Use | Upstream source |
| --- | --- | --- | --- | --- |
| `lenis` | 1.3.27 | MIT | Browser scroll coordination; bundled into the site JavaScript | [darkroomengineering/lenis](https://github.com/darkroomengineering/lenis) |
| `@fontsource-variable/bodoni-moda` | 5.3.0 | OFL-1.1 | Self-hosted heading font | [Fontsource Bodoni Moda](https://fontsource.org/fonts/bodoni-moda), [font files](https://github.com/fontsource/font-files) |
| `@fontsource-variable/manrope` | 5.3.0 | OFL-1.1 | Self-hosted body and interface font | [Fontsource Manrope](https://fontsource.org/fonts/manrope), [font files](https://github.com/fontsource/font-files) |
| `vite` | 8.3.6 | MIT | Development and production build tool; its small generated module-preload helper is included in the build | [vitejs/vite](https://github.com/vitejs/vite) |
| `typescript` | 7.0.2 | Apache-2.0 | Build-time type checking; not a browser runtime dependency | [microsoft/TypeScript](https://github.com/microsoft/TypeScript) |

The package metadata marks the first three as `dependencies` and the final two as `devDependencies`. The font package JavaScript/CSS entry points are not required by the page at runtime: the two selected WOFF2 files are included under `public/fonts/`.

### Included notices and font provenance

These three notice files were confirmed to be exact copies of the corresponding installed package license files:

- [Bodoni Moda — SIL Open Font License 1.1](licenses/Bodoni-Moda-OFL.txt), including the Bodoni Moda Project Authors' copyright statement.
- [Manrope — SIL Open Font License 1.1](licenses/Manrope-OFL.txt), including the Manrope Project Authors' copyright statement.
- [Lenis — MIT License](licenses/Lenis-MIT.txt), including the darkroom.engineering copyright statement.

The original font-project URLs are present in those notices: [indestructible-type/Bodoni](https://github.com/indestructible-type/Bodoni) and [sharanda/manrope](https://github.com/sharanda/manrope).

| Included font | Exact installed source | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| `public/fonts/bodoni-moda-latin.woff2` | `@fontsource-variable/bodoni-moda/files/bodoni-moda-latin-opsz-normal.woff2` | 46,260 | `c032219ef636f7b4932f7d1dc91bdab602c970f090770b546bea4effaab3463c` |
| `public/fonts/manrope-latin.woff2` | `@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2` | 24,836 | `a30ddcd349703aff7464c34bef3fffdff405ee50c113440d7c8693c02d210972` |

The Bodoni package's `bodoni-moda-latin-standard-normal.woff2` is also byte-identical to the included file. The project renamed the selected files for local URLs; their bytes were not edited. Preserve their accompanying notices when redistributing the font files. The Vite core MIT notice is included at the end of this document to accompany generated runtime helper code.

## Locked build-tool dependencies

The lockfile contains **64 package entries**, excluding the project root. Of these, **47 are optional packages**, primarily native binaries selected by platform. Their aggregate declared licenses are: 26 MIT, 22 Apache-2.0, 12 MPL-2.0, 2 OFL-1.1, 1 ISC, and 1 BSD-3-Clause. These counts describe lockfile entries, not independently loaded browser libraries. [Source: package-lock.json](../package-lock.json).

| Package or platform family | Version | Declared license | Role |
| --- | --- | --- | --- |
| `@oxc-project/types` | 0.156.0 | MIT | Build-tool types |
| `@rolldown/pluginutils` | 1.0.1 | MIT | Build-plugin utilities |
| `rolldown` and `@rolldown/binding-*` | 1.2.16 | MIT | JavaScript bundler and platform binaries |
| `@typescript/typescript-*` | 7.0.2 | Apache-2.0 | Native TypeScript platform packages |
| `detect-libc` | 2.1.2 | Apache-2.0 | Native binary platform detection |
| `fdir` | 6.5.0 | MIT | Build-time directory traversal |
| `fsevents` | 2.3.3 | MIT | Optional macOS file watching |
| `lightningcss` and `lightningcss-*` | 1.33.0 | MPL-2.0 | CSS build processing and platform binaries |
| `nanoid` | 3.3.20 | MIT | Build-tool dependency |
| `picocolors` | 1.1.1 | ISC | Build-tool terminal formatting |
| `picomatch` | 4.0.7 | MIT | Build-time pattern matching |
| `postcss` | 8.5.32 | MIT | CSS build processing |
| `source-map-js` | 1.2.2 | BSD-3-Clause | Build-time source-map utilities |
| `tinyglobby` | 0.2.17 | MIT | Build-time file matching |

`node_modules/` is not part of the delivery archive. A source rebuild retrieves these tools and their own notices through `npm ci`. The installed Vite package additionally contains its upstream bundled-dependency license collection in `LICENSE.md`; Rolldown includes `THIRD-PARTY-LICENSE`; TypeScript includes `LICENSE` and `NOTICE.txt`. This inventory does not replace those upstream notices if the tools themselves are redistributed.

## Lockfile and script portability

The inspected lockfile uses version **3**. Its root dependencies, dev dependencies, and Node engine requirement match the package manifest. All 64 package entries have integrity values and public `https://registry.npmjs.org/` tarball URLs. No local-file dependencies, credential-bearing registry URLs, machine-absolute package paths, or private registries were found.

Windows x64 and ARM64 platform entries are present for TypeScript, Rolldown, and Lightning CSS. Their presence makes the lockfile suitable for selecting those platform packages; it is not evidence that a Windows installation or execution has already been tested. The project declares **Node.js >= 24.0.0**. Node 24 satisfies the inspected build tools' Node engine requirements.

| Script | Exact command | Effect |
| --- | --- | --- |
| `start` | `node scripts/serve.mjs` | Serves the included build with Node built-ins; no package installation required |
| `dev` | `vite --host 0.0.0.0` | Starts Vite; the README adds `--host 127.0.0.1` for a local-only development invocation |
| `check` | `tsc --noEmit` | Checks TypeScript without writing output |
| `test` | `node --test tests/*.test.ts` | Runs the existing Node test suite |
| `build` | `npm run check && vite build` | Type-checks and creates `dist/` |
| `preview` | `vite preview --host 127.0.0.1` | Serves a build using installed Vite |

No project install, publish, deployment, or push lifecycle hooks are defined. The only package marked `hasInstallScript` in the lockfile is the optional macOS-only `fsevents` package. The delivery server and Windows launchers do not run `npm install` or change execution policy.

The quoted test argument `tests/*.test.ts` was checked with Node 24 without shell wildcard expansion; Node resolved the test files successfully. This specifically checks the test-runner argument convention, not Windows CMD or PowerShell execution. The Vite base is `./`, and the delivery server can mount the build at an explicit `/subpath/` prefix. The server's root and subpath responses, MIME types, missing-file behavior, URL rejection, and realpath containment were exercised separately.

When packaging, **include `dist/` explicitly** even though it is ignored for source-control purposes. Exclude `node_modules/`, local caches, private browser data, and unrelated files. The included prebuilt site and the source's `public/` assets are both intentional.

## Project asset provenance

| Resource | Source and treatment |
| --- | --- |
| Nine PNG art studies | Nine actual built-in image-generation tool outputs made for this project; eight required studies plus one additional raw wood material. Exact prompts, original output names, selection notes, and hashes are in the [generation log](../art/generation-log.json). All nine file hashes matched that log during this audit. |
| `public/assets/sente-hero-table.webp` | Optimized runtime derivative of the selected generated desktop environment. |
| `public/assets/sente-board-material.webp` | Optimized runtime derivative of the additional generated wood-material study. |
| Grid, stones, coordinates, liberty marks, icons, favicon | Programmatically drawn project assets. Generated imagery does not supply official puzzle positions or labels. |
| Stone sounds | Synthesized locally with Web Audio; no external audio recording is bundled. |
| Rule explanations | Original lesson text informed by the British Go Association references recorded in [research.md](research.md). The source pages are linked; their articles are not bundled as copied assets. |

Generated-art provenance is documented rather than assigned an invented SPDX identifier or an unreported image-model license. The project does not describe these materials as third-party stock photographs or as precious natural stone. No image seed, sampler configuration, or model version absent from the actual tool result is claimed.

## Resource sizes at this audit snapshot

The figures below are uncompressed file bytes, not transfer measurements, a ZIP size, or a performance claim. The final acceptance record and final archive checksum take precedence if the production build changes after this snapshot.

| Group | Files | Bytes |
| --- | ---: | ---: |
| Application TypeScript and CSS under `src/` | 10 | 155,229 |
| Referenced runtime WebP images under `public/assets/` | 2 | 139,694 |
| Runtime WOFF2 fonts under `public/fonts/` | 2 | 71,096 |
| Runtime favicon | 1 | 308 |
| Art studies under `art/concepts/` | 9 | 22,822,794 |
| Current referenced production asset set, including HTML | 8 | 346,913 |

The art archive is approximately **21.77 MiB**. It is included for inspection and further work, and is not fetched as part of the page. Images plus fonts total **210,790 bytes**. The production-build snapshot consists of 93,927 bytes of JavaScript, 40,545 bytes of CSS, 1,343 bytes of HTML, and 211,098 bytes of images, fonts, and favicon.

At this snapshot, the shared working folders also retained obsolete generic image copies and superseded fingerprinted bundles: `public/assets/` contained four files, and `dist/` contained 14 files totalling 744,153 bytes. These extras are not referenced by the current entry point. The eight-file runtime set above uses only the current index, its current JavaScript/CSS, the `sente-`-prefixed images, the two fonts, and the favicon. The final archive should explicitly exclude the obsolete copies; the final acceptance record must confirm its packaged file set.

| Runtime image | Bytes | SHA-256 |
| --- | ---: | --- |
| `public/assets/sente-board-material.webp` | 39,122 | `d5959b1b6674ec6d68f6763ea4d0709bacb7e41d5d1fa6562e2c7706d479dd22` |
| `public/assets/sente-hero-table.webp` | 100,572 | `066a0e0cd472a5db301116cc2e88560ab2dc7c4e00a736822007573187587951` |

## Bounded source inspection

The project text outside installed dependencies was checked for machine-absolute paths, credential-bearing URLs, private-key blocks, and common AWS, OpenAI, and GitHub credential patterns. None matched. No symbolic links were found among the intended project files. This is a bounded packaging inspection, not a claim that every possible secret format has been identified.

The application source has no external API client, analytics sender, or remote font request. The footer's British Go Association links are explicit external navigation. Rule state and observation notes are generated locally. Package downloads occur only when the user chooses to install dependencies for source work.

No new application behavior was changed by this audit. No Windows execution, physical-device testing, or dependency vulnerability scan is claimed here.

## Vite core MIT notice

The following core notice is copied from the locally installed Vite 8.3.6 `LICENSE.md` and accompanies its generated runtime helper code. The full Vite tool's bundled-dependency notices remain in that package when installed.

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
