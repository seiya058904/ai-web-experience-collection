# THRUST — Attribution

Prepared **2026-10-06**.

## Original visual work

The engine concept, procedural meshes, fan and compressor assemblies, turbine assemblies, isolated cooling blade, shaft system, original aircraft, airflow, thermal effects, shaders, camera choreography and interface composition were created for THRUST.

The engine is an unbranded illustrative design. It does not reproduce a named manufacturer's complete product, and the aircraft does not depict an identified commercial airframe.

No third-party engine photography, manufacturer CAD, downloaded aircraft model or manufacturer logo is included as a runtime asset. Generated design-composition references used during art direction are not shipped runtime assets.

## Generated atmosphere and compatibility poster

`public/atmosphere.webp` is an original generated cloudscape created with OpenAI image generation on 2026-10-06. It contains no aircraft, branding or baked-in interface. The aircraft is separately rendered from the project’s original geometry. The image is illustrative; it is not a photograph of an actual flight.

`public/engine-poster.webp` is an export of this project’s own real-time engine view, with interface elements hidden. It is used only for the WebGL-unavailable reading view. The generation prompt, export method and production asset inventory appear in [docs/PROVENANCE.md](docs/PROVENANCE.md).

## Engineering references

NASA Glenn and NASA Technology Transfer public material informed the engine relationships and cooling explanation. Public GE Aerospace material informed the study of blade form and two-spool mechanical layout. Full URLs and the purpose of each reference appear in [docs/SOURCES.md](docs/SOURCES.md).

The source organizations do not sponsor, certify or endorse this project. Referencing their public engineering explanations does not transfer ownership of their photographs, diagrams or trademarks.

## Software and typography

The project uses the following third-party components. Their applicable license and copyright notices accompany the distribution; those notices control the terms for each component.

| Component | Role | License |
| --- | --- | --- |
| Three.js | Real-time 3D rendering | MIT |
| Vite | Development and production build tooling | MIT |
| Barlow Condensed, distributed through `@fontsource/barlow-condensed` | Display typography | SIL Open Font License 1.1 |
| Manrope, distributed through `@fontsource/manrope` | Interface typography | SIL Open Font License 1.1 |

Font author credits are retained in the corresponding bundled font license notices. Fontsource packages provide the font files; this does not imply that Fontsource authored the typefaces.

## Interpretive artwork

Airflow and thermal colors are authored explanatory visuals. The field displays, motion timing, geometry and 9:1 bypass ratio describe an illustrative concept rather than measured operating data. See [docs/ENGINEERING.md](docs/ENGINEERING.md) for the physical relationships and visual simplifications.

Collection integration retains the root lockfile: Three.js 0.186.1, GSAP 3.15.0 and Lenis 1.3.26 where used; Vite 8.3.2 and Three.js types 0.186.0. Original version records above describe the supplied package. The generated Collection production dependency inventory records actual bundled software. Scoped source and design records remain in repository docs/provenance.
