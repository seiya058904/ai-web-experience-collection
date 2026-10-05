# AI Web Experience Collection

A showcase of cinematic, motion-driven web experiences exploring speed, nature, architecture and space.

[Explore the Collection](https://seiya058904.github.io/ai-web-experience-collection/)

## Experiences

| Experience | World | Entrance |
| --- | --- | --- |
| **Beyond the Limit** | Formula 1, speed and racing engineering through cinematic scroll storytelling. | [`/f1/`](https://seiya058904.github.io/ai-web-experience-collection/f1/) |
| **VERDANT** | A quiet passage through spring, botanical landscapes, architecture and light. | [`/verdant/`](https://seiya058904.github.io/ai-web-experience-collection/verdant/) |
| **ORBITAL** | An illustrative journey through rockets, orbital flight and deep space. | [`/orbital/`](https://seiya058904.github.io/ai-web-experience-collection/orbital/) |

Each work keeps its own imagery, typography, interactions and pace. The Collection entrance connects them through full document navigation.

## Design Philosophy

Cinematic scrolling, continuous section handoffs and motion-driven storytelling. Responsive compositions and visual-first interaction give each world room to unfold; keyboard access and reduced motion preserve the reading experience. A single owned animation clock and bounded rendering cost support smooth motion on high-refresh displays. Physical-device and high-refresh hardware validation limits are recorded in [SCROLL-AUDIT.md](SCROLL-AUDIT.md).

## Technology

- Vite and TypeScript; HTML and CSS.
- GSAP / ScrollTrigger and Lenis.
- React for VERDANT and ORBITAL.
- SVG / Canvas, photographic WebGL surfaces and Three.js; ORBITAL includes a Canvas compatibility renderer.

## Development

Use **Node.js 24 LTS and npm** with the committed lockfile.

```sh
npm ci
npm run dev
npm run build
npm run preview -- --port 4174 --strictPort
```

Open `/`, `/f1/`, `/verdant/` or `/orbital/`. Run `npm run verify` for the nine model/continuity tests, production build and output-reference checks. Asset import scripts are maintenance tools, not verification commands.

## Deployment

GitHub Pages serves separate HTML documents for the Collection and each experience, with no iframe or SPA fallback. Routes above are relative to the deployment base, `/ai-web-experience-collection/`.

[Deploy Pages](.github/workflows/pages.yml) runs on `main` pushes or manual dispatch. It installs locked dependencies, runs tests, builds with the base path returned by GitHub Pages, verifies routes and assets, and deploys only `dist/`. The [Verify workflow](.github/workflows/verify.yml) independently runs `npm run verify`.

Reproduce the production path locally:

```sh
npm run build -- --base=/ai-web-experience-collection/
npm run verify:build
npm run preview -- --port 4175 --strictPort --base=/ai-web-experience-collection/
```

Open `http://127.0.0.1:4175/ai-web-experience-collection/`. Asset URLs and Collection links use Vite's configured base; keep trailing slashes on experience URLs. A different deployment base requires a rebuild. Production canonical and social URLs use the GitHub Pages origin and that same base.

## Credits / Assets

See [About & credits](https://seiya058904.github.io/ai-web-experience-collection/credits.html), [ATTRIBUTION.md](ATTRIBUTION.md), [import provenance](assets/imports.json), [VERDANT asset sources](experiences/verdant/ASSET-SOURCES.md) and [ORBITAL source notes](experiences/orbital/SOURCE.md).

Production includes `licenses.txt`, `third-party-licenses.md` and namespaced font notices. Preserve them and upstream legal comments. The social preview reuses the three works' existing illustrations. Imagery and models are illustrative; ORBITAL audio is synthesized only after activation. No runtime video files are used.

Original work is governed by [LICENSE](LICENSE); third-party materials retain their own terms. This independent collection has no affiliation with Formula 1, FIA, racing teams, NASA or SpaceX.
