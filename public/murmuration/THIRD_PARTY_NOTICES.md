# Third-party notices and asset provenance

The original project code and documentation use the MIT license in `LICENSE`. Dependencies and fonts retain their own terms. Pinned package versions and transitive dependency records are in `package-lock.json`.

| Component | Version | License / source | Included notice |
| --- | --- | --- | --- |
| Lenis | 1.3.27 | MIT · [official repository](https://github.com/darkroomengineering/lenis) | `docs/licenses/Lenis-MIT.txt` |
| GSAP + ScrollTrigger | 3.15.0 | Standard “No Charge” license · [publisher license](https://gsap.com/standard-license/) · [official repository](https://github.com/greensock/GSAP) | The exact installed package declaration is retained below. GSAP is not covered by this project's MIT license. |
| Vite | 8.3.5 | MIT, with bundled third-party notices · [official repository](https://github.com/vitejs/vite) | `docs/licenses/Vite-LICENSE.txt` |
| Playwright Test | 1.56.1 | Apache-2.0 · [official repository](https://github.com/microsoft/playwright) | `docs/licenses/Playwright-Apache-2.0.txt` |
| Anton, from @fontsource/anton | 5.3.0 | SIL Open Font License 1.1 · [Fontsource](https://fontsource.org/fonts/anton) | `public/fonts/Anton-LICENSE.txt` |
| Cormorant Garamond, from @fontsource-variable/cormorant-garamond | 5.3.0 | SIL Open Font License 1.1 · [Fontsource](https://fontsource.org/fonts/cormorant-garamond) | `public/fonts/Cormorant-Garamond-LICENSE.txt` |
| DM Sans, from @fontsource-variable/dm-sans | 5.3.0 | SIL Open Font License 1.1 · [Fontsource](https://fontsource.org/fonts/dm-sans) | `public/fonts/DM-Sans-LICENSE.txt` |

GSAP's installed `package.json` declares:

> Standard 'no charge' license: https://gsap.com/standard-license.

The installed GSAP README states Copyright (c) 2008–2026, GreenSock. All rights reserved. During source verification, the live license URL redirected to the publisher's temporary forums-offline page. This notice preserves the publisher's canonical license link and the package's declared license instead of inventing or substituting license text.

## Generated and original assets

- **`public/sky.webp`**: AI-generated empty sky, made for this project with `image_gen.imagegen`. No photographer, real photographed location or exclusive copyright status is claimed. Applicable image-generator terms remain relevant to its use.
- **`docs/concepts/*.jpg`**: compact previews of five actual AI-generated compositional references. They are design evidence and are not loaded by the website.
- **`public/poster-*.webp`**: actual Canvas stills of the included simulated flock and generated sky, produced by `scripts/posters.cjs`.
- **`public/bird.svg` and bird geometry**: original authored marks. No third-party icon set is embedded.
- **Model data**: produced by the original included implementation; no licensed research dataset or third-party trajectory file is redistributed.
- **QA screenshots and motion evidence**: captures of this original local project. They contain no user account, payment or third-party website content.

Research publications and installation pages are credited in `docs/SOURCES.md` and the site's Field Notes. Their images and full texts are not included. Package license files supplied by dependencies are preserved without altering their copyright notices.
