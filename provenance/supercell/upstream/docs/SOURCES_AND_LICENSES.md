# Sources, assets and licenses

Checked on 2026-10-24. This document identifies the actual source material and dependency notices. Scientific references inform the explanation; they do not endorse the work. SUPERCELL is an independent weather-themed project with no association with the game company Supercell.

## Research references

| Primary source | Use in this project | Scope |
| --- | --- | --- |
| [NOAA NSSL — Thunderstorm Types](https://www.nssl.noaa.gov/education/svrwx101/thunderstorms/types/) | Organized, tilted, rotating updraft; different storms show different combinations of visible features | General explanatory facts only. No source photograph, measured parameter or weather warning is reproduced. |
| [National Weather Service — The Supercell, Pt. 1](https://www.weather.gov/spotterguide/supercell1) | Wind speed/direction changing with height; relation among tilt, updraft and downwind precipitation | The interface uses dimensionless artistic conditions. Its rotation is one illustrative orientation, not a universal hemisphere-independent rule. |
| [NASA Earth Observatory — The Anatomy of a Thunderstorm](https://science.nasa.gov/earth/earth-observatory/the-anatomy-of-a-thunderstorm-78101/) | Rising air and horizontal spreading into an anvil | The source describes a particular DC3 research observation. Its measured heights, speeds and event date are not assigned to this fictional storm. |
| [Berndnaut Smilde — Nimbus](https://www.berndnaut.nl/works/nimbus/) | Cloud as a temporary spatial presence; the visual strength of a held photographic composition | Artistic reference only. No original photograph, interior installation, image crop or distinctive staging is reproduced. |

All four URLs were opened during research. The project uses **no third-party photographs** from these sources. The explanation and model limitations are developed in [RESEARCH.md](RESEARCH.md).

## Generated and original assets

| Packaged asset | Provenance | Notes |
| --- | --- | --- |
| `public/assets/storm-desktop.webp` | Built-in `image_gen.imagegen`; original output `exec-1cece603-eb5e-42e9-9137-2ff02a02f90b.png` | Selected landscape artwork, 1672×941. |
| `public/assets/storm-mobile.webp` | Built-in `image_gen.imagegen`; original output `exec-466c13a4-d851-4721-a513-911c39d6cb92.png` | Selected independent portrait artwork, 941×1672. |
| Embedded posters in the source | Small derivatives of the selected generated artwork | Immediate local image fallback; no remote image dependency. |
| `docs/concepts/*.webp` | Compact copies of the additional generated explorations | Evidence/reference only, including the rejected elevated Hero direction. They are not alternate chapter backgrounds. |
| SVG mark, interface geometry and density contours | Created in project code | Section geometry is generated from the shared analytic field. |
| Depth-integrated structural texture and neighboring planes | Created by `src/volume.ts` from `src/field.ts` | Original computed illustrations from the same dimensionless field; no downloaded scientific dataset or measured cloud volume. |
| Optional wind sound | Synthesized by `src/audio.ts` using the browser Web Audio API | No recording, music sample or third-party audio file is used. |

The generated artwork was created for this task. Its provenance is recorded in [GENERATION_RECORD.json](GENERATION_RECORD.json), and selection decisions appear in [VISUAL_BIBLE.md](VISUAL_BIBLE.md). This record does not assign or guarantee exclusive copyright in AI-generated output. It also does not grant rights to any third-party trademarks or reference artworks.

## Runtime dependencies and font

| Component | Version | License / notice |
| --- | --- | --- |
| [Lenis](https://github.com/darkroomengineering/lenis) | 1.3.27 | MIT. Copyright (c) 2024 darkroom.engineering. Full bundled notice: [licenses/Lenis-MIT.txt](licenses/Lenis-MIT.txt). |
| [GSAP / ScrollTrigger](https://github.com/greensock/GSAP) | 3.15.0 | The installed package declares `Standard 'no charge' license: https://gsap.com/standard-license.` Copyright (c) 2008–2026 GreenSock. **This is not an MIT license.** See the verification note below. |
| [Manrope](https://github.com/sharanda/manrope), delivered through `@fontsource-variable/manrope` | Fontsource package 5.2.8 | SIL Open Font License 1.1. Copyright 2019 The Manrope Project Authors. Full bundled notice: [licenses/Manrope-OFL.txt](licenses/Manrope-OFL.txt). The Latin WOFF2 is served locally. |

### GSAP verification note

The installed package's own `package.json` license field and `README.md`, together with the official [greensock/GSAP README](https://github.com/greensock/GSAP#license), identify the standard no-charge license and link to [gsap.com/standard-license](https://gsap.com/standard-license). On the research date, that URL redirected to [gsap.com/offline/](https://gsap.com/offline/), so the complete license text could not be verified through that endpoint. The package's copyright and license-pointer notices remain authoritative; they are available under `node_modules/gsap/` after `npm ci`. This project does not relabel GSAP as MIT, claim a different license, or substitute a third-party summary for the upstream terms.

Engineering API references used: [Lenis documentation](https://github.com/darkroomengineering/lenis) and [GSAP ScrollTrigger documentation](https://gsap.com/docs/v3/Plugins/ScrollTrigger/).

## Development dependencies

These direct dependency versions and license identifiers were checked from the installed package metadata. The lockfile records the full dependency graph; individual packages retain their own notices when installed.

| Package | Installed version | Declared license |
| --- | --- | --- |
| `vite` | 8.3.5 | MIT |
| `typescript` | 5.9.3 | Apache-2.0 |
| `@types/node` | 24.19.2 | MIT |
| `@fontsource-variable/manrope` | 5.2.8 | OFL-1.1 |
| `playwright` | 1.56.1 | Apache-2.0 |

Dependencies are installed from npm using the included lockfile. `node_modules` is not part of the source ZIP. Production output includes the runtime code required to run the experience; font and dependency notices remain applicable to that output. Playwright is used only by the optional test harness. Its downloaded Chromium browser, browser profile and runtime caches are not production assets and are not included in the source ZIP.

## Project-specific source

The scene coordination, illustrative field, field integration, SVG geometry, shaders, layout and optional audio synthesis were written for this task. The 2.5D medium combines local generated photographs and computed projections; it is not a physical weather solver or a measured three-dimensional reconstruction. This document records provenance and upstream obligations; it does not replace the separate licenses of bundled dependencies or assign a blanket MIT license to the entire archive.
