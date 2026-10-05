# VERDANT — Asset Sources and Licenses

## Original generated imagery

Four original photographic-style images were created for VERDANT with OpenAI image generation. They depict imagined architectural and natural scenes; the pavilion is a synthetic design, with no claim that it is a photographed real-world building or location.

Each generated PNG master has native dimensions of **1672 × 941 px**. Production uses local WebP derivatives at **1672 × 941 px** and **960 × 540 px**.

| Image | Generated master | Production files | Use |
| --- | --- | --- | --- |
| Limestone pavilion, tree ferns, and reflecting pool | `verdant-pavilion.png` | `../../public/verdant/images/pavilion-1672.webp`, `../../public/verdant/images/pavilion-960.webp` | Arrival, Architecture, and the transition into Water. |
| Sunlit fern macro | `verdant-fern.png` | `../../public/verdant/images/fern-1672.webp`, `../../public/verdant/images/fern-960.webp` | Understory. |
| Pool reflection detail | `verdant-water.png` | `../../public/verdant/images/water-1672.webp`, `../../public/verdant/images/water-960.webp` | Water and its photographic refraction effect. |
| Spring meadow with white flowers | `verdant-meadow.png` | `../../public/verdant/images/meadow-1672.webp`, `../../public/verdant/images/meadow-960.webp` | Open air and Coda. |

The image-generation concept screenshots served as design references. Visible website headings, navigation, controls, and copy are implemented in HTML and CSS. The small favicon and menu glyphs are project-specific SVG geometry.

## Local fonts

The font files are served from `../../public/verdant/fonts/`; the site does not request a hosted font stylesheet at runtime. Both families are supplied through Fontsource 5.3.0 packages and distributed under the **SIL Open Font License 1.1**.

| Family | Local files | Attribution and source | Bundled license |
| --- | --- | --- | --- |
| Instrument Serif | `instrument-serif-regular.woff2`, `instrument-serif-italic.woff2` | Copyright 2022 The Instrument Serif Project Authors. [Upstream project](https://github.com/Instrument/instrument-serif); supplied by `@fontsource/instrument-serif`. | [Instrument-Serif-OFL.txt](../../public/verdant/licenses/Instrument-Serif-OFL.txt) |
| DM Sans | `dm-sans-regular.woff2`, `dm-sans-medium.woff2` | Copyright 2014 The DM Sans Project Authors. [Upstream project](https://github.com/googlefonts/dm-fonts); supplied by `@fontsource/dm-sans`. | [DM-Sans-OFL.txt](../../public/verdant/licenses/DM-Sans-OFL.txt) |

On the deployed site, the complete notices are available at `<base>/verdant/licenses/Instrument-Serif-OFL.txt` and `<base>/verdant/licenses/DM-Sans-OFL.txt`. Keep the copyright and license notices with redistributed font files.

## Motion libraries

| Library | Version used | License and source |
| --- | --- | --- |
| Lenis | 1.3.26 | **MIT**. Copyright (c) 2024 darkroom.engineering. [Upstream repository](https://github.com/darkroomengineering/lenis). Full notice: [Lenis-MIT.txt](../../public/verdant/licenses/Lenis-MIT.txt), also served at `<base>/verdant/licenses/Lenis-MIT.txt`. |
| GSAP core and ScrollTrigger | 3.15.0 | **Standard “No Charge” GSAP License**, published by Webflow. [Official full license](https://gsap.com/community/standard-license/). Retain the package's proprietary notices and consult these terms when updating or redistributing it. |

GSAP's license is not the MIT license. The official GSAP terms are the authoritative source for its permissions and restrictions.

## Other project notices

The generated media and original interface work do not replace the licenses of bundled dependencies. Preserve the notices distributed with each package, including the existing [shadcn Tailwind stylesheet notice](./vendor/shadcn-tailwind-4.13.0.LICENSE.md).
