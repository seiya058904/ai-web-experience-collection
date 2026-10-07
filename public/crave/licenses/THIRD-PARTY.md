# Third-party software and font notices

Inventory checked against the installed, pinned packages and selected font files
on **7 October 2026**. Each component retains its own license; these components
are not collectively described as MIT-licensed.

## JavaScript and build tooling

| Component | Version | Role in CRAVE | License / included notice |
| --- | --- | --- | --- |
| GSAP, including CSSPlugin, ScrollTrigger, and its Observer dependency | 3.15.0 | Browser animation and scroll orchestration | **GSAP Standard "No Charge" license**, not MIT. Exact package declaration and source notices: [GSAP-NOTICES.txt](GSAP-NOTICES.txt). Official terms: https://gsap.com/standard-license (currently redirects to https://gsap.com/community/standard-license/). |
| Lenis | 1.3.26 | Browser smooth scrolling | MIT. [Lenis-MIT.txt](Lenis-MIT.txt) is an unchanged copy of the installed package's `LICENSE`, including the darkroom.engineering copyright notice. |
| Vite | 8.3.3 | Local development and production build; any Vite-generated browser helper is covered by its applicable notice | Vite core is MIT. [Vite-LICENSE.md](Vite-LICENSE.md) is an unchanged copy of its complete installed license file, including the distinct licenses of dependencies bundled by Vite. That file includes notices beyond MIT. |

The GSAP npm package supplied no standalone `LICENSE` file. Its `package.json`
links the standard license, and the distributed source files contain copyright
and terms notices. Those exact notices are retained in `GSAP-NOTICES.txt`; that
file is not a rewritten or replacement license. The official standard-license
page was checked on the inventory date and displayed an effective date of
30 April 2025 and a last-modified date of 30 May 2025.

GSAP's CSSPlugin and Observer are internal parts of the same GSAP package, rather
than separately MIT-licensed dependencies. Lenis's optional React, Vue, and Nuxt
bindings are not used by this vanilla JavaScript project. The local packaged
preview server uses Node.js built-in modules and has no npm runtime dependency.

Node.js itself and `node_modules` are not redistributed in the ZIP. The build
tool's complete notice is included for attribution; this does not mean every
dependency listed inside Vite's license file executes in the browser. The
lockfile records the development dependency graph for rebuilding.

Package references:

- GSAP: https://gsap.com/ and https://github.com/greensock/GSAP
- Lenis: https://github.com/darkroomengineering/lenis
- Vite: https://vite.dev/ and https://github.com/vitejs/vite

## Self-hosted fonts

| Shipped file | Selected face | License / attribution |
| --- | --- | --- |
| `public/fonts/cormorant-garamond-regular.woff2` | Cormorant Garamond, normal, requested weight 400, Latin subset | SIL Open Font License 1.1. Copyright 2015 the Cormorant Project Authors. [CormorantGaramond-OFL.txt](CormorantGaramond-OFL.txt). |
| `public/fonts/cormorant-garamond-italic.woff2` | Cormorant Garamond, italic, requested weight 400, Latin subset | Same Cormorant Garamond notice above. |
| `public/fonts/manrope-variable.woff2` | Manrope, normal, requested weights 400 and 500, Latin subset | SIL Open Font License 1.1. Copyright 2018 The Manrope Project Authors. [Manrope-OFL.txt](Manrope-OFL.txt) and [Manrope-FONTLOG.txt](Manrope-FONTLOG.txt). |

The selected WOFF2 files and accompanying font-license files were obtained from
the Google Fonts sources recorded in
[FONT-PROVENANCE.json](../docs/FONT-PROVENANCE.json). That manifest preserves the
exact source CSS URL, individual download URLs, retrieval time, byte sizes,
SHA-256 checksums, and the recorded font-loading checks. It contains only the
three selected production font files and their associated license/provenance
records. No local conversion or byte modification was applied to those files.
The runtime loads these files locally; it does not call the Google Fonts CDN.

Font license sources:

- https://raw.githubusercontent.com/google/fonts/main/ofl/cormorantgaramond/OFL.txt
- https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/OFL.txt
- https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/FONTLOG.txt

## Production imagery and optional sound

The food production images are project-specific AI-generated media and derived
exports, documented separately by the package's production-asset provenance.
Reference photographs and films listed in `docs/RESEARCH.md` are research links,
not licensed production media or redistributed portfolio assets.

Optional sound is generated in the browser with WebAudio. It uses no third-party
music or sound recordings and is not presented as a recording of real cooking.
The software and font licenses above do not relicense the food images or any
third-party research material.
