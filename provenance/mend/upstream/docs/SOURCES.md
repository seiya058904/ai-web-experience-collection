# MEND — Sources, Provenance, and Licenses

## Research boundaries

The following primary sources were read on 9 November 2026. They informed the work's approach to understanding wear, limiting intervention, distinguishing additions, and recording decisions. Their museum objects, photographs, specific treatments, and explanatory text were not copied into the artwork.

| Source | What it supports in this project |
| --- | --- |
| [History Trust of South Australia — Conserve, Preserve, Restore: What is the Difference?](https://www.history.sa.gov.au/resource/conserve-preserve-restore-what-is-the-difference/) | The distinction between conserving an object and making it appear new; retaining context and signs of use; documenting an intervention. |
| [Field Museum — Treatment](https://www.fieldmuseum.org/page/treatment) | Care for the object's integrity, visible distinction between old and new materials, and a record of changes and outcomes. |

Pip, Lan, He, their letters, the painted sun, the move marks, and both feasible repair mechanisms are original fiction. The modeled sleeve and replacement wheel are narrative devices, not procedures endorsed by either institution.

**This is a fictional digital repair.** The page does not provide adhesives, solvents, cutting instructions, professional conservation guidance, or children's toy safety certification. A completed digital walk is a result in the model; it does not certify that a physical toy is safe to use.

## Technical references

| Reference | Use |
| --- | --- |
| [Lenis official repository and README](https://github.com/darkroomengineering/lenis) | CSS import, RAF ownership, anchor handling, lifecycle, and scroll synchronization |
| [Lenis releases](https://github.com/darkroomengineering/lenis/releases) | Version-specific behavior; installed package pinned to 1.3.27 |
| [Lenis maintainer discussion of reduced motion](https://github.com/darkroomengineering/lenis/issues/534) | Confirms automatic reduced-motion support was introduced in 1.3.26 |
| [Three.js documentation](https://threejs.org/docs/) | The optional scene's renderer, object, geometry, and material APIs |
| [Vite guide](https://vite.dev/guide/) | Local development and production build tooling |
| [TypeScript documentation](https://www.typescriptlang.org/docs/) | Source typing and compile-time checking |

The installed package source and lockfile define the actual build. Documentation on an upstream main branch must not be treated as proof that a different installed release supports the same API. GSAP is not a dependency in the current package; no GSAP-specific implementation is claimed.

## Direct software dependencies

The table records the package versions and license texts present in the installed dependency tree when this document was prepared. `package-lock.json` records the exact full dependency tree. Full copied notices belong in `docs/licenses/`; a URL alone does not replace a required redistribution notice.

| Package | Locked version | License | Verified local notice | Upstream |
| --- | --- | --- | --- | --- |
| `three` | 0.187.0 | MIT | `node_modules/three/LICENSE` | [Three.js](https://github.com/mrdoob/three.js) |
| `lenis` | 1.3.27 | MIT | `node_modules/lenis/LICENSE` | [Lenis](https://github.com/darkroomengineering/lenis) |
| `vite` | 8.3.6 | MIT for Vite core; package notice also contains bundled dependency notices | `node_modules/vite/LICENSE.md` | [Vite](https://github.com/vitejs/vite) |
| `typescript` | 7.0.2 | Apache License 2.0 | `node_modules/typescript/LICENSE` | [TypeScript](https://github.com/microsoft/TypeScript) |
| `@types/three` | 0.187.0 | MIT | `node_modules/@types/three/LICENSE` | [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/three) |

The TypeScript compiler, Vite, and type declarations are build-time dependencies. Their license labels do not automatically assign a license to MEND's original source, story, or generated images. Transitive dependency notices remain attached to their respective packages and redistributed bundles.

## Fonts

Both font packages are pinned to version **5.3.0**. Their actual `LICENSE` files state **SIL Open Font License 1.1**. The fonts are supplied locally through Fontsource rather than requested from a remote font API at runtime.

| Font | Role | Attribution recorded in the installed font package | Source and notice |
| --- | --- | --- | --- |
| **Newsreader** | Serif titles and expressive text | Copyright 2020 The Newsreader Project Authors | [Original project](https://github.com/productiontype/Newsreader); `node_modules/@fontsource-variable/newsreader/LICENSE` |
| **DM Sans** | Reading copy and interface controls | Copyright 2014 The DM Sans Project Authors | [Original project](https://github.com/googlefonts/dm-fonts); `node_modules/@fontsource-variable/dm-sans/LICENSE` |

Preserve each font's copyright statement and full OFL notice with redistributed font files. The authoritative license text is included with the corresponding package and can also be read at [openfontlicense.org](https://openfontlicense.org/).

## Original generated artwork

The Pip images were generated specifically for MEND using the built-in image-generation tool. The artwork uses an original fictional toy and the project's own generated character reference. The [generation log](art-generation.json) records actual prompts, references, source filenames, and adoption decisions. The accepted source images are in `docs/art-source/`.

The eight baseline roles are **H-A-v2, H-B, H-C, H-D, H-M, K-06, K-09, and T-03-04**. H-A-v2 replaces a rejected first H-A that appeared to contain an extra wheel. Each accepted baseline image counts for one role; additional branch derivatives are identified separately.

These are **AI-generated original assets, subject to the applicable service terms and law**. They are not represented as public-domain photographs, exclusively owned stock, or images licensed by the research institutions. No seed or generation parameter absent from the tool's actual output is claimed. Content-changing derivatives retain their source relationship in the generation record.

## Project-specific work

The narrative, English copy, UI, state logic, scene construction, and Pip design were prepared for this project. Third-party software and font licenses continue to govern their respective components. This source note does not create a blanket public-domain or open-source license for every part of the archive.

No museum image, brand mark, identifiable human face, purchased stock item, account credential, or third-party runtime API key is required by the project design. The delivery's actual resource inventory and remaining limits are recorded in [ACCEPTANCE.md](ACCEPTANCE.md).
