# Third-party notices and asset provenance

This inventory describes the installed packages and local assets used by
RELAY. Versions are pinned in `package-lock.json`. Individual upstream licences
continue to govern their respective components; this document does not
relicense them or assign one blanket licence to the project.

## Runtime libraries

| Component | Installed version | Included use | Licence and preserved notice |
| --- | --- | --- | --- |
| Lenis | 1.3.27 | Scroll interpolation and its companion CSS, bundled into the production assets. | MIT. Copyright (c) 2024 darkroom.engineering. [Exact installed licence](licenses/Lenis-MIT.txt). [Official repository](https://github.com/darkroomengineering/lenis). |
| GSAP | 3.15.0 | GSAP core and CSSPlugin through the main import; ScrollTrigger and its Observer dependency. Used for the shared ticker, reveal and scroll observation. | GSAP Standard “no charge” licence, **not MIT**. Copyright 2008–2026, GreenSock. [Preserved installed notice](licenses/GSAP-3.15.0-NOTICE.txt). [Official licence](https://gsap.com/standard-license). |

### GSAP's installed declaration

The installed `gsap/package.json` declares the Standard “no charge” licence and
points to `https://gsap.com/standard-license`. The installed README's Licence
section and the copyright headers of the imported GSAP modules point to the
same terms. These declarations are preserved verbatim in
`licenses/GSAP-3.15.0-NOTICE.txt`.

The installed GSAP package contains **no standalone LICENSE file**, so none is
invented here. The saved notice is a copyright notice and pointer, not a local
copy of the complete Standard licence. An official-page retrieval during
preparation redirected to GSAP's temporary offline page; it was not treated as
licence text. The authoritative terms remain at the official URL above. No
third-party summary was substituted for those terms.

The application imports the named modules above. It does not import the entire
GSAP plugin catalogue or load GSAP from a CDN. Local compilation preserves the
application's pinned dependency relationship; the notices remain part of the
source delivery.

## Local fonts

The shipped WOFF2 files were compared byte for byte with the installed
Fontsource package files. Only their project filenames were shortened; the
font binaries were not edited.

| Local asset | Installed source | Licence / copyright |
| --- | --- | --- |
| `public/fonts/archivo-latin.woff2` | `@fontsource-variable/archivo` 5.2.8, `files/archivo-latin-wdth-normal.woff2` (identical to the package's `standard-normal` alias). | SIL Open Font License 1.1. Copyright 2020 The Archivo Project Authors. [Exact notice and licence](licenses/Archivo-OFL.txt). |
| `public/fonts/archivo-latin-ext.woff2` | `@fontsource-variable/archivo` 5.2.8, `files/archivo-latin-ext-wdth-normal.woff2` (identical to its `standard-normal` alias). | The same Archivo notice and SIL Open Font License 1.1. |
| `public/fonts/ibm-plex-mono-latin.woff2` | `@fontsource/ibm-plex-mono` 5.2.7, `files/ibm-plex-mono-latin-400-normal.woff2`. | SIL Open Font License 1.1. Copyright 2017 IBM Corp. [Exact notice and licence](licenses/IBM-Plex-Mono-OFL.txt). |

Upstream font projects: [Archivo](https://github.com/Omnibus-Type/Archivo) and
[IBM Plex](https://github.com/IBM/plex). Fontsource is the package delivery
source. No remote font stylesheet or runtime font service is used.

## Build and verification tools

These are development dependencies, not website services. `node_modules`, the
test browser executable and browser profiles are not included in the source
archive. Their pinned packages can be restored by `npm ci`.

| Tool | Installed version | Role | Notices retained |
| --- | --- | --- | --- |
| Vite | 8.3.5 | Local development, compilation and production preview. | [Installed Vite licence and bundled dependency notices](licenses/Vite-LICENSE.md), beginning with Vite's MIT licence. Copyright (c) 2019–present, VoidZero Inc. and Vite contributors. |
| Playwright / playwright-core | 1.58.2 | Local production-browser verification. | [Apache 2.0](licenses/Playwright-Apache-2.0.txt), [Microsoft copyright / Puppeteer-derived-code notice](licenses/Playwright-NOTICE.txt), [Playwright third-party notices](licenses/Playwright-ThirdPartyNotices.txt), and [playwright-core third-party notices](licenses/Playwright-Core-ThirdPartyNotices.txt). |

Other development transitive dependencies retain the notices supplied by their
own packages. The lockfile records their resolved versions and integrity
information; this inventory does not claim that their terms are all identical.

## Generated studies and original implementation

The eight images in `concepts/` were generated specifically for this project
with `image_gen.imagegen`. Their prompts, original output identifiers,
dimensions, file hashes and selection decisions are preserved in
[generation-record.json](concepts/generation-record.json). Seven are design
references; the alternative letterpress Hero is recorded as rejected. They are
not production image textures, stock photographs, downloaded examples or
licensed copies of an existing artwork.

The runtime sculpture, route geometry, slots, controls and page typography are
implemented in this project's SVG, DOM, CSS and JavaScript. Generated-study
provenance does not place those images under the third-party libraries' MIT,
OFL or GSAP licences. No separate copyright ownership or public-domain claim is
made for the generated outputs in this notices file.

[Ryoji Ikeda's datamatics](https://www.ryojiikeda.com/project/datamatics/) is a
research reference for the idea of making data perceptible. **No Ikeda image,
video, sound, typography asset or source code is copied into RELAY.**
[RFC 9293 §2.2](https://www.rfc-editor.org/rfc/rfc9293.html#section-2.2) is cited
for protocol concepts, not reproduced as a bundled document or claimed as an
implementation specification. See [RESEARCH.md](RESEARCH.md) for scope and
[DESIGN.md](DESIGN.md) for the distinction between studies and interactive work.
