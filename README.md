# AI Web Experience Collection

[Open the Collection](https://seiya058904.github.io/f1-beyond-the-limit/)

Three complete, independent web experiences, brought together through a restrained visual entrance. No iframe and no client-side route fallback: each work has its own HTML document, CSS, runtime and lifecycle.

| Route (relative to the deployment base) | Experience | Runtime |
| --- | --- | --- |
| `/` | Collection — three visual entrances | HTML / CSS, optional pointer response |
| `/f1/` | **Beyond the Limit** — Formula 1, Chinese | TypeScript, GSAP, Lenis, SVG / Canvas |
| `/verdant/` | **VERDANT** — nature, spring and architecture | React, GSAP, Lenis, photographic WebGL surfaces |
| `/orbital/` | **ORBITAL** — rockets and deep space | React, GSAP, Lenis, Three.js with Canvas fallback |
| `/credits.html` | Collection provenance and licenses | Static HTML |

VERDANT and ORBITAL were integrated from the supplied complete projects. Their scene code and production imagery are retained; unused server/auth/database starter code and duplicate builds are excluded. The small shared UI directory contains only the original Radix primitives actually used by the works. No account, backend, API key or external asset CDN is required. ORBITAL audio is synthesized after an explicit click; there are no runtime videos.

## Develop and build

Use **Node.js 24 LTS and npm**. One lockfile fixes the dependencies; existing F1 versions were retained and imported dependencies use the versions from the supplied projects.

```sh
npm ci
npm run dev                       # http://127.0.0.1:5173
npm test                          # 7 F1 model + 2 orbital continuity tests
npm run build                     # TypeScript + Vite multi-page build
npm run verify:build              # check output routes, links, CSS assets and licenses
npm run verify                    # all three checks, site-root build
npm run preview -- --port 4174 --strictPort
```

Open `/`, `/f1/`, `/verdant/` or `/orbital/` on either server. Development uses real document navigation so leaving a work also releases its clocks, listeners, Canvas and WebGL resources.

To reproduce GitHub Pages' project path:

```sh
npm run build -- --base=/f1-beyond-the-limit/
npm run verify:build
npm run preview -- --port 4175 --strictPort --base=/f1-beyond-the-limit/
```

Then open `http://127.0.0.1:4175/f1-beyond-the-limit/`. Vite rewrites HTML/CSS assets; dynamically loaded imagery, textures, GLB and links use `import.meta.env.BASE_URL`. Keep trailing slashes on work URLs. There is no SPA rewrite requirement. A deployment to a different base needs a rebuild, not an edited compiled bundle.

## Structure

- `index.html`, `src/collection.*`: Collection homepage.
- `f1/index.html`, `src/{main,motion,choreography,interactions,models}.ts`, `src/styles.css`: original F1 experience.
- `verdant/index.html`, `experiences/verdant/`: original React scenes, journey and surface renderer.
- `orbital/index.html`, `experiences/orbital/`: original mission, spacecraft, audio and compatibility renderer.
- `experiences/shared/`: used Radix UI primitives and the consistent Collection return link.
- `public/media`, `public/fonts`: F1 resources; `public/verdant` and `public/orbital`: namespaced imported resources.
- `assets/imports.json`, `ATTRIBUTION.md`, app source notices, `public/licenses.txt`: provenance and licenses.
- `design/COLLECTION.md`: Collection visual contract; `DESIGN.md`: F1 visual contract; `SCROLL-AUDIT.md`: handoff architecture and bounded verification record.
- `scripts/verify-build.mjs`: checks actual production documents and referenced local files. `scripts/prepare-*.mjs` are deliberate F1 resource import tools, **not** verification commands.

## Motion and typography changes

F1 retains its single Lenis / GSAP clock, 0.105 interpolation, direct scrub, measured normal-flow sticky shells and protected reading regions. The added Hold travel is shorter; scroll input now advances a reversible 12px foreground drift and restrained existing-image scale during that interval. Text does not fade until the original exit range. The shared trajectory still belongs to the transition. Reduced motion removes sticky storytelling and the new movement.

VERDANT's display typography remains large. Architecture, Understory and Coda now group related text in normal flow with explicit gaps. A wide/short Architecture composition uses two title lines rather than letting a width-scaled three-line title collide with prose positioned by height. Mobile Arrival and Coda use the same safe grouping principle. Resource readiness in both imported works is deferred until scroll inertia settles.

## Deployment

`.github/workflows/pages.yml` runs on `main` push or manual dispatch. It performs `npm ci`, all nine tests, a Pages-base production build, and output verification before uploading **only `dist/`**. GitHub Pages serves the four independent entrances from that artifact. Do not commit `dist/`, dependency caches, ZIP exports or browser evidence.

Production preserves upstream legal comments and emits `third-party-licenses.md`; ship it with `licenses.txt` and the namespaced font notices. The `credits.html` page links to these files and explains the generated imagery and independent, unofficial nature of the projects.

## Verification scope

Browser checks cover desktop 1920×1080, 2560×1440, 3840×2160, 1440×900, tablet 768×1024, phone 390×844 and the 1920×900 overlap reproduction. The release record is in `SCROLL-AUDIT.md`. Model tests and CI do not replace browser acceptance. Browser viewport emulation does not certify physical touchpad momentum, iOS Safari or 120/144 Hz hardware. Do not infer those results from a screenshot, synthetic wheel input or an older supplied-project README.

This collection is independent of Formula 1, the FIA, racing teams, NASA and SpaceX. Generated scenes and models are illustrative; original and third-party rights remain distinct.
