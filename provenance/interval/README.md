# INTERVAL import

Imported from `D:/下载/INTERVAL-Architecture-Experience.zip` on 2026-10-05. The original delivery remains outside this repository. Its archive hash and all 90 file-entry hashes are recorded in [the delivery manifest](../deliveries/import-manifest.json).

| Original ZIP project path | Collection path |
| --- | --- |
| `src/` | `experiences/interval/src/` |
| `index.html` | `pages/interval/index.html` |
| `public/images/*.webp` | `public/interval/images/` |
| `public/fonts/` fonts and notices | `public/interval/fonts/` |
| `public/licenses/`, favicon and runtime notices | `public/interval/` |
| `public/images/*.json` prompt sidecars | `provenance/interval/images/` |
| `public/fonts/font-provenance.json` | `provenance/interval/font-provenance.json` |
| `DESIGN.md` | `docs/interval/DESIGN.md` |

The supplied asset/font records retain their original ZIP-relative paths and hashes, including historical `dist/` copies. Interpret those paths against the original delivery, then use the mapping above for current files. Original PNG masters were not included in the delivery; the records disclose that explicitly.

All 12 WebP images and four WOFF2 fonts retain their supplied bytes. The journey and geometry implementations are unchanged. Integration only namespaces asset URLs, registers the independent Vite document, adds Collection navigation and social metadata, and reuses the repository's existing GSAP 3.15.0 / Lenis 1.3.26 dependencies. Font notices retain their complete text with trailing whitespace removed; import hashes retain the original bytes. Standalone package/config files, helper servers and duplicated build output are not imported. The original website has no video, audio, Canvas or WebGL runtime.

[Delivery verification](../../docs/interval/DELIVERY-VERIFICATION.md) records historical checks from the supplied README, separately from checks performed during Collection integration. Current development and deployment commands are in the [root README](../../README.md).
