# Attribution and Rights — NIB

Project: **NIB — Ink Under Pressure**  
Session and source verification date: **2026-10-07**.

## Original project work

The original source, layout, editorial copy and procedural scene systems were created for the user in this session and are delivered as the user's project material. **No additional license is granted for original work.** The third-party licenses below apply to their identified components and do not relicense the original project.

All 11 runtime photographic material assets and all 11 curated Visual Bible images were made with the OpenAI image-generation tool during this session. They are AI-generated imagery, including requested refinements and transparent extractions, rather than photographs of a named pen. This document records their origin and does not assert exclusive copyright in AI-generated imagery. No stock photograph, third-party texture pack or external 3D model is included.

The live reservoir interface, feed flow, fin buffering, counterflow passages, liquid seam, meniscus compositing, paper contact, fiber uptake, stroke and drying are authored code. Their parameters are included in `src/`; no separate binary model files are required. Source research did not supply redistributable images.

See [ASSET-PROVENANCE.md](docs/ASSET-PROVENANCE.md) for the asset register and [PROVENANCE.json](docs/PROVENANCE.json) for retained prompts, input references, output hashes and acknowledged gaps. The exact image-generation service/model version was not retained and is not inferred from filenames.

## Third-party runtime components

| Component | Included version / source identifier | Attribution | Preserved license |
| --- | --- | --- | --- |
| Lenis | 1.3.26 | Copyright © 2024 darkroom.engineering | [MIT](licenses/Lenis-MIT.txt) |
| GSAP | 3.15.0 | Copyright © 2025 Webflow, as stated in the included license | [Standard “No Charge” GSAP License](licenses/GSAP-Standard-License.html) |
| Cormorant Garamond, Latin variable normal and italic | Google Fonts URL revision `v21`; weights 300–700 | Copyright 2015 the Cormorant Project Authors | [SIL Open Font License 1.1](licenses/CormorantGaramond-OFL.txt) |
| Manrope, Latin variable normal | Google Fonts URL revision `v20`; weights 200–800 | Copyright 2018 The Manrope Project Authors | [SIL Open Font License 1.1](licenses/Manrope-OFL.txt) |

**GSAP is distributed under its own proprietary standard license, distinct from MIT and SIL OFL.** The included HTML preserves the complete visible license and FAQ extracted from its official page on the recorded retrieval date; site navigation and commented-out historical content are omitted. The supplied text governs the identified GSAP component. The font URL revisions are retrieval identifiers and are not claimed as full font software release versions.

The library and WOFF2 files are vendored locally. Full URLs, file sizes, SHA256 digests, license source URLs and license digests are recorded in [licenses/vendor-manifest.json](licenses/vendor-manifest.json). Those digests were checked against the delivered files for this documentation pass.

### Upstream sources

- Lenis runtime: https://cdn.jsdelivr.net/npm/lenis@1.3.26/dist/lenis.mjs
- Lenis license: https://cdn.jsdelivr.net/npm/lenis@1.3.26/LICENSE
- GSAP runtime: https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js
- GSAP license: https://gsap.com/standard-license/
- Cormorant project: https://github.com/CatharsisFonts/Cormorant
- Cormorant license source: https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/cormorantgaramond/OFL.txt
- Manrope project: https://github.com/googlefonts/manrope
- Manrope license source: https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/manrope/OFL.txt
- Individual Google Fonts WOFF2 URLs and the CSS request are preserved in the vendor manifest. The included fonts are unmodified Latin subsets.

## Research attribution

Primary mechanism references include PILOT, Platinum, the Japan Writing Instruments Manufacturers Association, Sailor, and Nikolov et al., *How the capillarity and ink-air flow govern the performance of a fountain pen*, Journal of Colloid and Interface Science 578 (2020), 660–667, https://doi.org/10.1016/j.jcis.2020.04.123.

The complete bibliography, access date, publisher-access limitation, supplementary engineering reference, and evidence for paper absorption and dye drying are in [docs/RESEARCH.md](docs/RESEARCH.md). These sources informed qualitative mechanism and visual anatomy. No source photography, article figure or manufacturer diagram is incorporated into the website or ZIP. No source organization is presented as endorsing or commissioning NIB.

## Local delivery

The project is supplied for local development, preview, build and QA. No public deployment is part of the work. Build outputs can be recreated from the included sources, local material assets, libraries and fonts without installing packages.
