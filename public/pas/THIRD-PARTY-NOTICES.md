# Third-party notices and asset provenance

PAS keeps its runtime dependencies and graphical sources local. The versions below are the versions pinned in this project's package files; the complete resolved dependency tree is in `package-lock.json`.

## Frontend dependencies and fonts

| Package | Locked direct version | License | Upstream / preserved notice |
| --- | --- | --- | --- |
| Three.js | 0.187.0 | MIT | <https://github.com/mrdoob/three.js>; `licenses/three-MIT.txt` |
| Lenis | 1.3.27 | MIT | <https://github.com/darkroomengineering/lenis>; `licenses/lenis-MIT.txt` |
| `@types/three` | 0.187.0 | MIT | <https://github.com/DefinitelyTyped/DefinitelyTyped>; `licenses/types-three-MIT.txt` |
| Vite | 8.3.6 | MIT and notices retained in the distributed license | <https://github.com/vitejs/vite>; `licenses/vite-MIT.txt` |
| TypeScript | 5.9.3 | Apache-2.0 | <https://github.com/microsoft/TypeScript>; `licenses/typescript-Apache-2.0.txt` |
| `@fontsource/bodoni-moda` | 5.3.0 | OFL-1.1 | Bodoni Moda Project Authors, <https://github.com/indestructible-type/Bodoni>; `licenses/bodoni-moda-OFL-1.1.txt` |
| `@fontsource/manrope` | 5.3.0 | OFL-1.1 | Manrope Project Authors, <https://github.com/sharanda/manrope>; `licenses/manrope-OFL-1.1.txt` |

The app bundles the Latin font files it imports; it does not request fonts from Google Fonts at runtime. The exact supplied license files have been copied without changing their copyright statements. `reference-fonts/` additionally preserves the four CSS files and eight WOFF/WOFF2 files used by the application, with each font package's unmodified OFL notice. Those archival copies are byte-identical to the selected files in Fontsource 5.3.0; the normal source imports still use the npm packages. npm-installed transitive packages retain their own license notices in their package distributions. `node_modules` is not part of the source ZIP and is restored with `npm ci`.

## Character graphical data

The neutral anatomical body, adult shape targets, skeleton and source skinning weights come from the MakeHuman Community's explicitly CC0 graphical data. The source program logic is not imported. The official license distinguishes these CC0 graphical assets from the MakeHuman program's AGPL code.

- MakeHuman source: <https://github.com/makehumancommunity/makehuman>, inspected revision `a8bc2d54ff0ac92e78ff71431b1023eda42bf482`.
- License explanation: <https://www.makehumancommunity.org/about/license.html>.
- Official system assets: <https://static.makehumancommunity.org/assets/assetpacks/makehuman_system_assets.html>.
- Official Shirts 01 CC0 pack: <https://static.makehumancommunity.org/assets/assetpacks/shirts01.html>.
- Official Pants 01 CC0 pack: <https://static.makehumancommunity.org/assets/assetpacks/pants01.html>.

The fitted basic T-shirt and harem-pants source geometry were contributed by **Margaret Toigo**, with source author field **MRT**. Their `.mhclo` metadata declares CC0. The project modifies them into plain tees and tapered training trousers. Hair and skin source data come from the official MakeHuman system asset pack.

Source files and metadata are preserved in `scripts/model-source/`. The full CC0 legal text is preserved both there and at `licenses/makehuman-CC0-1.0.txt`. The upstream `LICENSE.CODE.md` is also retained because the upstream explanatory `LICENSE.md` links to it; retaining that license text does not import MakeHuman program logic or apply it to this project's original application code. Detailed origins, modifications and regeneration instructions are in [docs/MODEL-SOURCES.md](docs/MODEL-SOURCES.md).

No third-party dance animation, motion-capture performance, commercial character identity, existing dance video or recorded soundtrack is included. The motion score and synthesis of the optional sound are original project code.

## Generated visual studies and rendered sequence

The eight art-direction studies were genuinely produced with the available image-generation tool for this project. Their prompts, source/output identifiers and packaged files are recorded in `docs/image-generation.json`. They are development references and selected still imagery. They are distinct from the runtime sequence, which is rendered from the bundled 3D characters and deterministic motion functions.

The final runtime bodies are illustrative CGI and do not reproduce the photographic fidelity of the generated studies. No real performer, professional dance validation or biomechanical certification is claimed.

## Optional production tools

Regenerating the assets can use Python, NumPy, Pillow, ModernGL and glcontext with a local OpenGL/EGL implementation. These tools are not required by the browser and their installed packages are not shipped in this source archive. Exact tested versions and the optional installation commands are in `scripts/render-requirements.txt` and [docs/RENDERING.md](docs/RENDERING.md). Their upstream licenses continue to apply to their own distributions.
