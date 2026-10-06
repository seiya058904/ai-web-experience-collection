# Attribution & provenance

## Original work

**GLASSHOUSE — Light Through Matter** is an original digital installation created for this project. Its scene composition, authored geometry, pavilion structures, interaction design, motion choreography, procedural light patterns, typography texture composition, dedicated projection texture and application code are provided under the project MIT License in `LICENSE`. Eight shared glass panes move through six authored poses; the principal scene geometry is authored in code rather than imported from architectural models.

Runtime visuals combine authored geometry, custom shading, procedural light details and the dedicated generated material texture documented below. The production experience does not redistribute architectural reference photography, stock photography or stock video, and does not request runtime assets from a CDN. ImageGen was also used during early concept research to explore composition and material direction. Those preliminary composition concepts are not shipped; the later, purpose-made light-projection texture is a runtime asset.

The custom optical pipeline in `src/optical-pass.js` composites successive glass layers through alternating render targets, using linear HDR when floating-point color buffers are available and an 8-bit fallback otherwise. It retains Three.js physical-material specular lighting and uses mip diffusion for frosted glass. An adapted Three.js `FXAAShader` applies ACES tone mapping and output color conversion once to each final sample before comparing display-space luminance, within the same final pass. The optical layers remain linear during compositing. This custom transmission path is an authored screen-space approximation.

`src/caustic-field.js` is original procedural GLSL that constructs small, irregular cusp-shaped light folds and focal regions. Its details are combined with the projection texture on glass and the floor. Caustics and spectral beams are authored approximations for visual expression, not results from a complete physical optical simulator.

`src/atmosphere.js` is an original shared linear-light color field used by both the sky and the distant floor, so their background colors meet continuously as the scene changes.

`src/type-plane.js` places the rightmost 18% of the desktop opening headline's glyph area on a scene plane behind the glass so it participates in optical compositing. The main headline remains crisp DOM text; mobile uses DOM text throughout. Three Three.js `Reflector` surfaces provide planar reflections of an off-camera doorway and the ECHO lettering. Other mirrors are hidden during each mirror's render to avoid recursive reflection. Floor reflections are separate, attenuated mirrored-geometry approximations, not a planar floor-reflection pass or ray tracing.

## Generated material asset

| File | Source and creation | Use | Distribution license |
| --- | --- | --- | --- |
| `src/assets/focused-light.png` | Original black-background light-projection texture generated specifically for GLASSHOUSE with **OpenAI ImageGen**; PNG, **1254 × 1254**, **1,101,055 bytes** (approximately 1.10 MB) | A light gobo sampled by GLSL and projected in world-space light coordinates onto glass and the floor, combined with procedural caustic details | Provided as original project material under the root `LICENSE` (MIT) |

This file is a material input, not a full-screen background, an architectural photograph or a glass product photograph. It was not obtained from a stock library or third-party photographer. OpenAI ImageGen identifies the generation tool used for this project. The texture is bundled locally in the production build; no image-generation service is contacted at runtime.

## Software and typeface

Versions below correspond to this project's `package.json` and lockfile.

| Component | Version | Role | License / retained notice |
| --- | --- | --- | --- |
| [Three.js](https://threejs.org/) | `0.186.1` | Geometry, physical-material lighting, WebGL render targets, planar Reflector and FXAAShader | MIT — `third-party-licenses/THREE-LICENSE.txt` |
| [Lenis](https://github.com/darkroomengineering/lenis) | `1.3.26` | Synchronized smooth scrolling | MIT — `third-party-licenses/LENIS-LICENSE.txt` |
| [GSAP / ScrollTrigger](https://gsap.com/) | `3.15.0` | Animation timing and scroll coordination | GSAP Standard “no charge” License — `third-party-licenses/GSAP-LICENSE-NOTICE.txt` |
| [Vite](https://vite.dev/) | `8.0.13` | Development server and production bundling | MIT and the bundled-dependency notices reproduced in `third-party-licenses/VITE-LICENSE.md` |
| [Manrope](https://github.com/sharanda/manrope), distributed by [Fontsource](https://fontsource.org/fonts/manrope) | `@fontsource-variable/manrope` `5.2.8` | Locally bundled variable typeface | SIL Open Font License 1.1 — `third-party-licenses/MANROPE-OFL.txt` |

Manrope's original notice credits **The Manrope Project Authors** (2019). Font files remain under the SIL Open Font License; the project MIT License does not relicense them.

The upstream Three.js `FXAAShader` comments credit NVIDIA's FXAA algorithm, Jasper Flick's C# implementation and Dave Hoskins's GLSL port. This project adapts the final sample color handling; the upstream shader remains covered by the retained Three.js license.

GSAP is **not MIT-licensed**. The installed GSAP package publishes its exact license reference in its README, package metadata and source headers rather than shipping a standalone full license document. `GSAP-LICENSE-NOTICE.txt` preserves the original installed notices. The governing terms are available at [GSAP Standard License](https://gsap.com/standard-license/). Retain the GSAP copyright and license notices when redistributing the build or source.

The complete notices supplied with Three.js, Lenis, Vite and Manrope were copied from the exact installed package versions without rewriting their terms. Vite's file also retains the notices that its published package includes for bundled dependencies. The project does not include `node_modules`; reinstalling dependencies uses their upstream packages and licenses.

## Architecture and light-art references

The following official project, institution and artist pages were consulted during visual research. The design principles in the right column describe this project's interpretation of those references. No photographs, models, page layouts or artwork reproductions from those sources are included in the ZIP, and the links do not imply endorsement.

| Reference | Design principle studied |
| --- | --- |
| [SANAA — Glass Pavilion, Toledo Museum of Art, MCHAP project page](https://www.mchap.co/mchap-2014-projects/glass-pavilion,-toledo-museum-of-art) | Overlapping transparent boundaries and readable depth through several surfaces |
| [Ateliers Jean Nouvel — Fondation Cartier](https://www.jeannouvel.com/en/projects/fondation-cartier-2/) | Glass planes extending beyond enclosed volume; reflection and transparency in the same composition |
| [Philip Johnson — The Glass House, official site](https://theglasshouse.org/explore/the-glass-house/) | Restrained structure, a continuous field of view and a pavilion defined through proportion |
| [Olafur Eliasson — Beauty](https://olafureliasson.net/artwork/beauty-1993/) | Light becoming visible through a medium and changes in the viewer's position |
| [Olafur Eliasson — Your rainbow panorama](https://olafureliasson.net/artwork/your-rainbow-panorama-2006-2011/) | A continuous spatial journey in which a transparent surface changes perception |
| [Guggenheim — James Turrell exhibition](https://web.guggenheim.org/exhibitions/turrell/) | Light as spatial material, controlled intensity and compositions that reward sustained looking |

## Technical research references

These primary sources informed implementation choices. Linking them does not imply endorsement. The pages, examples and imagery are not redistributed as website content.

- [Lenis official setup and GSAP integration](https://github.com/darkroomengineering/lenis)
- [GSAP ticker](https://gsap.com/docs/v3/GSAP/gsap.ticker/)
- [GSAP matchMedia and reduced-motion conditions](https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/)
- [ScrollTrigger refresh lifecycle](https://gsap.com/docs/v3/Plugins/ScrollTrigger/static.refresh()/)
- [Three.js MeshPhysicalMaterial](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)
- [Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html)
- [Three.js ShaderMaterial](https://threejs.org/docs/pages/ShaderMaterial.html)
- [MDN Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)

## Distribution

The deliverable is a source-and-build ZIP. No hosting, cloud publication or deployment is required or performed by the supplied startup scripts. All browser assets needed by the production build are local to `dist/`.
