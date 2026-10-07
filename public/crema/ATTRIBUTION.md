# Attribution and asset provenance

## Original project work

CREMA — 9 Bars is an original interactive work. The scene composition, editorial copy, UI, local preview scripts, procedural particle and flow systems, motion choreography, and synthesized sound were created for this project.

Original source code is provided under the project MIT license. That license does not replace the licenses of dependencies, fonts, or other separately identified materials.

## Generated and procedural visuals

The production imagery was generated for CREMA. Procedural geometry, materials, particles, flow paths and microstructure visuals were authored in code for the work. They are visual interpretations, not photographs from a real espresso experiment, scanned engineering models, measured tomography, or scientific simulation output.

The included production assets and their generation prompts, selection decisions and processing history are recorded in [docs/PROVENANCE.md](docs/PROVENANCE.md). No third-party coffee advertisement, manufacturer photograph, museum image or research figure is claimed as original work.

Generated assets are provided as project assets subject to applicable generation-provider terms. No guarantee of exclusivity is made. Source-code MIT licensing does not purport to override provider terms or any rights that may apply to separately identified material.

## Third-party components

| Component | Version used | Upstream | License / included notice |
|---|---:|---|---|
| Three.js | 0.186.1 | [threejs.org](https://threejs.org/) | MIT — `licenses/THREE.txt` |
| GSAP | 3.15.0 | [gsap.com](https://gsap.com/) | GSAP Standard “no charge” license — `licenses/GSAP-NOTICE.txt` |
| Lenis | 1.3.26 | [lenis.darkroom.engineering](https://lenis.darkroom.engineering/) | MIT — `licenses/LENIS.txt` |
| Archivo Variable font package | 5.3.0 | [Fontsource Archivo](https://fontsource.org/fonts/archivo) | SIL Open Font License 1.1 — `licenses/ARCHIVO-OFL.txt` |
| Vite | 8.3.3 | [vite.dev](https://vite.dev/) | MIT and bundled notices — `licenses/VITE.md` |

**GSAP is not licensed under this project's MIT license.** Its package declares the standard no-charge GSAP license. The canonical terms are linked in the included notice.

Dependency versions are pinned in `package-lock.json`. `node_modules` is deliberately not part of the delivery ZIP. The prebuilt application bundles the runtime code needed for local playback; development tooling is restored through `npm ci` when needed.

## Research references

Scientific papers and manufacturer documentation were used as text references to inform the visual concepts. Direct links, authors, titles, limits and media-use notes appear in [docs/SCIENCE.md](docs/SCIENCE.md). Scientific article text, figures, datasets and paper PDFs are not redistributed as artwork or production assets.

This work is not affiliated with or endorsed by the cited researchers, journals, software authors, font distributors, or espresso manufacturers.
