# Attribution and media provenance

## CRAVE

Concept and binding direction: the commissioning user's **CRAVE — Before the First Bite** brief. Visual research, art direction, generated food-image curation, original application code and local packaging were produced for that brief with ChatGPT and OpenAI's image-generation tool.

Production imagery is AI-generated. The food identities are generic material studies, not depictions attributed to a real restaurant or food photographer.

- `docs/PROVENANCE.json` records all selected production assets, exact prompts, parent references, generation output identifiers, native dimensions, export parameters and SHA-256 hashes.
- `docs/VISUAL-BIBLE.md` records the A/B/C selection, six study families, refinements and material roles.
- `docs/RESEARCH.md` links the primary material and photographic references. The referenced portfolio photographs and films are **not** distributed inside this package.
- `docs/FONT-PROVENANCE.json` records the actual downloaded font files and license sources.

## Dependencies and fonts

| Item | Attribution / terms |
| --- | --- |
| GSAP 3.15.0 | GreenSock. GSAP Standard No Charge license. Original package notices and exact terms URL are retained in `licenses/GSAP-NOTICES.txt`. |
| Lenis 1.3.26 | darkroom.engineering. MIT; full notice in `licenses/Lenis-MIT.txt`. |
| Vite 8.3.3 | Vite contributors. Core MIT and bundled dependency notices in `licenses/Vite-LICENSE.md`. |
| Cormorant Garamond | The Cormorant Project Authors. SIL Open Font License 1.1 in `licenses/CormorantGaramond-OFL.txt`. |
| Manrope | The Manrope Project Authors. SIL Open Font License 1.1 in `licenses/Manrope-OFL.txt`; original `FONTLOG` is also included. |

The runtime downloads none of these from a CDN. Node.js is required to start the local preview but is not redistributed. The ZIP excludes `node_modules`; `package-lock.json` records the pinned rebuild graph.

The original procedural audio uses no sample library, music, or third-party recording. The geometric favicon, navigation marks and knife silhouette are code-native assets.
