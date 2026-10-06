# AI Web Experience Collection

Eighteen independent cinematic web experiences exploring speed, nature, space, ceramic color, spatial sculpture, mechanical time, architectural light, designed objects, fusion energy, glass, fabric, photography, ink, gemstones, semiconductors, geography, jet engines and acoustic motion.

[Explore the Collection](https://seiya058904.github.io/ai-web-experience-collection/)

## Experiences

| Experience | World | Entrance |
| --- | --- | --- |
| **Beyond the Limit** | Formula 1, speed and racing engineering | [/f1/](https://seiya058904.github.io/ai-web-experience-collection/f1/) |
| **VERDANT** | Nature, botanical landscapes, architecture and light | [/verdant/](https://seiya058904.github.io/ai-web-experience-collection/verdant/) |
| **ORBITAL** | Rockets, orbital flight and deep space | [/orbital/](https://seiya058904.github.io/ai-web-experience-collection/orbital/) |
| **GLAZE — Color Fired Into Form** | Seven studies of ceramics, glaze, color and light | [/glaze/](https://seiya058904.github.io/ai-web-experience-collection/glaze/) |
| **KAGE / VOID** | Eight continuous movements in black, white, light and shadow | [/kage/](https://seiya058904.github.io/ai-web-experience-collection/kage/) |
| **CHRONOS — The Architecture of Time** | A cinematic journey into a mechanical watch | [/chronos/](https://seiya058904.github.io/ai-web-experience-collection/chronos/) |
| **INTERVAL — Architecture Between Light & Space** | Architecture, material, light and shadow across six original spaces | [/interval/](https://seiya058904.github.io/ai-web-experience-collection/interval/) |
| **FORM — Objects in Space** | Three original objects, structure, material and light | [/form/](https://seiya058904.github.io/ai-web-experience-collection/form/) |
| **FUSION — Building a Star** | Tokamak structure, magnetic confinement and an illustrative plasma journey | [/fusion/](https://seiya058904.github.io/ai-web-experience-collection/fusion/) |
| **GLASSHOUSE — Light Through Matter** | Six continuous glass, light and spatial studies | [/glasshouse/](https://seiya058904.github.io/ai-web-experience-collection/glasshouse/) |
| **VEIL — Fabric in Motion** | Thread, fabric, light and soft structure | [/veil/](https://seiya058904.github.io/ai-web-experience-collection/veil/) |
| **OPTIC — The Architecture of an Image** | Nine studies of light, optics and a photographic machine | [/optic/](https://seiya058904.github.io/ai-web-experience-collection/optic/) |
| **INKSCAPE — Paper, Water, Ink** | Eight movements through paper, water, ink and space | [/inkscape/](https://seiya058904.github.io/ai-web-experience-collection/inkscape/) |
| **FACET — The Light Within** | Light, cut and six original gemstone specimens | [/facet/](https://seiya058904.github.io/ai-web-experience-collection/facet/) |
| **SILICON — From Sand to Signal** | Eight studies of a semiconductor architecture | [/silicon/](https://seiya058904.github.io/ai-web-experience-collection/silicon/) |
| **ATLAS — The World in Layers** | Real Fuji terrain, imagery, city and planetary scale | [/atlas/](https://seiya058904.github.io/ai-web-experience-collection/atlas/) |
| **THRUST — Anatomy of a Jet Engine** | Ten continuous shots from intake to flight | [/thrust/](https://seiya058904.github.io/ai-web-experience-collection/thrust/) |
| **RESONANCE — Sound Made Visible** | Eight acoustic acts with local tone capture and playback | [/resonance/](https://seiya058904.github.io/ai-web-experience-collection/resonance/) |

Each work keeps its own imagery, typography, controls and pace. The gallery uses full document navigation; only the selected work's runtime starts. No iframe or SPA fallback.

The four-work import, focused repairs and browser acceptance are recorded in [Collection acceptance](docs/collection/FOUR-WORK-VALIDATION.md).

RESONANCE's delivery audit, three runtime repairs and local production checks are recorded in [RESONANCE acceptance](docs/resonance/ACCEPTANCE.md).

## Repository

```text
collection/          Gallery styles, pointer interaction and credits styles
pages/               Vite HTML root: home, credits and eighteen route documents
experiences/         f1, verdant, orbital, glaze, kage, chronos, interval, form, fusion, glasshouse, veil, optic, inkscape, facet, silicon, atlas, thrust, resonance and shared UI
public/              Namespaced runtime assets, fonts and license notices
docs/                Collection and scoped work design/architecture contracts
provenance/          Unique masters, source records, import hashes and delivery history
scripts/             Build verification and F1 asset maintenance
tests/               Supplied model/continuity tests, including OPTIC
.github/workflows/   Verification and Pages deployment
```

One package manifest and lockfile govern the entire collection. Vite's `root` is `pages/`; output is root `dist/`. Source lives outside the HTML root and is imported explicitly. Runtime resources live under `public/<work>/`; shared gallery assets remain at the top of `public/`. Only byte-identical VERDANT/CHRONOS DM Sans fonts are shared under `public/shared/fonts/`; each work retains its license notice.

## Development

Use **Node.js 24 LTS and npm**.

```sh
npm ci
npm run dev
npm run verify
npm run preview -- --port 4174 --strictPort
```

`npm run verify` runs 118 supplied model/continuity tests at this revision, TypeScript, production build and route/asset checks. There is no lint or browser-test npm script. Tests use Node’s built-in TypeScript transformation for supplied TypeScript fixtures; no additional test dependency is required. The two `scripts/prepare-*.mjs` tools regenerate F1 resources from original sources; do not run them as verification.

## Deployment

[Deploy Pages](.github/workflows/pages.yml) installs locked dependencies, tests, builds with the Pages base path, verifies output references, and deploys only `dist/` on `main`. [Verify](.github/workflows/verify.yml) independently runs `npm run verify`.

Reproduce the production path locally:

```sh
npm run build -- --base=/ai-web-experience-collection/
npm run verify:build
npm run preview -- --port 4175 --strictPort --base=/ai-web-experience-collection/
```

Open `http://127.0.0.1:4175/ai-web-experience-collection/`; all eighteen trailing-slash routes support direct entry and refresh. HTML links use `%BASE_URL%`, runtime links use `import.meta.env.BASE_URL`, and HTML/CSS assets pass through Vite. Canonical, social URLs and generated `sitemap.xml` carry the configured base.

When adding another accepted work, put its HTML in `pages/<route>/`, source in `experiences/<route>/`, resources in `public/<route>/`, and register the input, sitemap and output identity checks in `vite.config.ts` and `scripts/verify-build.mjs`. Update the gallery, credits, product and maintenance guide. Preserve its design and lifecycle; verify both `/` and project-path builds, entry/return, direct loads, mobile and reduced motion.

## Credits and provenance

See [About & credits](https://seiya058904.github.io/ai-web-experience-collection/credits.html), [ATTRIBUTION.md](ATTRIBUTION.md), [Delivery records](provenance/deliveries/legacy-imports.json), [GLAZE provenance](provenance/glaze/ASSET-PROVENANCE.json), [VERDANT sources](experiences/verdant/ASSET-SOURCES.md) and [ORBITAL notes](experiences/orbital/SOURCE.md).

`licenses.txt`, `third-party-licenses.md` and namespaced project/font notices ship in production. GLAZE, KAGE, CHRONOS, INTERVAL, FORM, FUSION, GLASSHOUSE, VEIL, OPTIC, INKSCAPE, FACET, SILICON, ATLAS and THRUST original code retains its supplied MIT license; the collection's own [LICENSE](LICENSE) does not replace upstream terms. GSAP uses its Standard No-Charge License. KAGE's gallery/social plate is captured from its actual procedural FRAME scene. Gallery previews use media from the included works; no new third-party art. ORBITAL and CHRONOS audio is synthesized only after activation; FUSION, THRUST and RESONANCE audio remain silent until activated. RESONANCE uses dependency-free native ES modules and declares no application-wide open-source license; its font OFL notices and source records are preserved.

Unique source material and import checksums live in [provenance/](provenance/README.md), outside deployment.

See [Collection design](docs/collection/DESIGN.md), [F1 design](docs/f1/DESIGN.md), [F1 motion audit](docs/f1/SCROLL-AUDIT.md), [GLAZE design](docs/glaze/DESIGN.md), [KAGE architecture](docs/kage/ARCHITECTURE.md), [CHRONOS motion](docs/chronos/MOTION.md), [INTERVAL design](docs/interval/DESIGN.md), [GLASSHOUSE design](docs/glasshouse/DESIGN.md), [VEIL design](docs/veil/DESIGN.md), [OPTIC design](docs/optic/DESIGN.md) and [INKSCAPE design](docs/inkscape/DESIGN.md), [FACET design](docs/facet/DESIGN.md), [SILICON design](docs/silicon/DESIGN.md), [ATLAS design](docs/atlas/DESIGN.md), [THRUST design](docs/thrust/DESIGN.md) and [RESONANCE design](docs/resonance/DESIGN.md). Browser emulation does not certify physical touch, iOS Safari or high-refresh hardware.
