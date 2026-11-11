# Third-party notices

Reviewed on **2026-11-09** against the packages actually installed for this build. Exact dependency versions are pinned in `package.json` and `package-lock.json`. The inventory in `licenses/DEPENDENCIES.json` records installed packages and the notices copied from them.

The project's own code license does not replace the separate terms for these libraries, fonts or generated artwork. Generated scene provenance and rights limitations are recorded in `ASSET-PROVENANCE.md`.

## Runtime libraries

| Component | Installed version | Package-declared license | Preserved notice |
| --- | --- | --- | --- |
| Lenis | 1.3.27 | MIT | `licenses/lenis/LICENSE` |
| GSAP, including ScrollTrigger | 3.15.1 | Standard “no charge” license; custom terms, not MIT | `licenses/gsap/NOTICE.txt` |

Lenis supplies the scrolling integration. Its installed license credits darkroom.engineering and is preserved without modification. GSAP supplies its ticker and ScrollTrigger integration; its original source notice credits GreenSock and points to [the GSAP standard license](https://gsap.com/standard-license).

### GSAP license identification

The installed `gsap/package.json` identifies its license as the standard no-charge license at the URL above. The npm package does not contain a standalone `LICENSE` file. `licenses/gsap/NOTICE.txt` therefore preserves the actual package license field and the original installed ScrollTrigger source header rather than substituting an invented license.

The [official license page](https://gsap.com/community/standard-license/) was opened and reviewed on 2026-11-09. It identifies website and application implementation as permitted uses, places restrictions on competing visual animation builders, and requires proprietary notices to remain. The page reports an effective date of April 30, 2025 and a last-modified date of May 30, 2025. This project is an editorial website, not an animation-authoring product. The complete applicable terms remain at the linked source; this short identification is not a replacement license or a broader permission grant.

## Embedded fonts

All three font packages are version **5.3.0**, supplied through Fontsource. Their installed package metadata declares **SIL Open Font License 1.1**. The full installed copyright notice and OFL text are included for each family.

| Font family | Used faces | Original copyright attribution in installed package | Preserved license |
| --- | --- | --- | --- |
| Barlow Condensed | Latin 500 and 600, normal | The Barlow Project Authors, 2017 | `licenses/fontsource-barlow-condensed/LICENSE` |
| DM Sans | Latin 400 and 500, normal | The DM Sans Project Authors, 2014 | `licenses/fontsource-dm-sans/LICENSE` |
| Instrument Serif | Latin 400, italic | The Instrument Serif Project Authors, 2022 | `licenses/fontsource-instrument-serif/LICENSE` |

The site embeds the package-provided WOFF2 font files. Font software remains under its own OFL terms, independently of the project's code. Font author names are attribution, not an endorsement of NIGHTSHIFT.

## Development and validation tools

| Component | Installed version | Package-declared license | Preserved notices |
| --- | --- | --- | --- |
| Vite | 8.3.6 | MIT | `licenses/vite/LICENSE.md` |
| TypeScript | 5.9.3 | Apache-2.0 | `licenses/typescript/LICENSE.txt`, `licenses/typescript/ThirdPartyNoticeText.txt` |
| `@playwright/test` | 1.65.0 | Apache-2.0 | `licenses/playwright-test/LICENSE`, `licenses/playwright-test/NOTICE` |
| Playwright | 1.65.0 | Apache-2.0 | `licenses/playwright/LICENSE`, `licenses/playwright/NOTICE`, `licenses/playwright/ThirdPartyNotices.txt` |
| Playwright Core | 1.65.0 | Apache-2.0 | `licenses/playwright-core/LICENSE`, `licenses/playwright-core/NOTICE`, `licenses/playwright-core/ThirdPartyNotices.txt` |

These tools support building or testing and are not a required remote service for visitors. The installed Vite, Rolldown and Playwright distributions include notices for code bundled within those tools; their provided notice files are preserved instead of flattening all bundled code into one license label.

Additional installed dependency notices are copied under `licenses/` and enumerated in `licenses/DEPENDENCIES.json`. Optional binary packages for other operating systems were not installed in this Linux build environment. Their exact dependency entries remain in the lockfile, and their package notices accompany installation on the corresponding platform. `node_modules` and browser binaries are excluded from the source ZIP.

## Images, diagrams, icons and sound

The 21 scene, comparison and concept images are original requested AI-generation outputs for this fictional project. The compressed selected and concept assets are mapped individually in `ASSET-PROVENANCE.md`; no third-party documentary photography or stock-photo license is represented. These images are illustrative fiction and do not prove a real event, identity or work procedure. No claim of exclusive copyright or blanket rights guarantee is made.

The site’s SVG diagrams, interface icons, CSS composition and editorial copy were authored for NIGHTSHIFT. Diagram labels describe fictional or expressly illustrative relationships, not live public infrastructure. Optional ambient sound is synthesized in the original Web Audio implementation; no external music or field recording is included.

Official sanitation, transit, accessibility and technical documentation consulted for limited factual context is listed in `docs/sources.md`. Consulting those sources does not grant permission to reuse their artwork or imply an institutional endorsement. No such artwork is bundled.

## Preservation

Retain this notice, the relevant files in `licenses/`, and the upstream notices carried by distributed library code when redistributing the project. The project's own license, if included, governs only the material it actually covers and does not override third-party or generated-asset terms.
