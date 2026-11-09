# RALLY — sources and licenses

## Original project material

The original TypeScript, original SVG geometry, project-specific text, and original documentation are supplied under the [MIT license](../LICENSE). This license does not replace third-party dependency/font notices or make a legal-exclusivity claim about generated imagery.

The court, anonymous players, and ball images were generated for RALLY from original prompts using the built-in image-generation tool. No downloaded athlete photograph, tournament still, brand asset, or stock image was used as an input to the recorded assets. H-D edits the project's own H-A output; K-08's refinement edits its own generated draft. The [asset provenance record](asset-provenance.md) lists actual source files, generation prompts, roles and limitations. The optimized WebP images derive from those source PNGs. No public-domain or exclusive-rights designation is asserted for the generated images.

## Reference sources

| Source | What it supports | How it is used |
| --- | --- | --- |
| [ITF — 2026 Rules of Tennis](https://www.itftennis.com/media/7221/2026-rules-of-tennis-english.pdf), Rule 1 | Official singles geometry, service-line position and net heights | Geometry constants, independently implemented; no copied court illustration |
| [ITF — Tennis Glossary](https://www.itftennis.com/en/about-us/organisation/tennis-glossary/) | Court and shot terminology | Original explanatory wording, not a reproduced article |
| [Rod Cross — Ball Trajectories](https://www.physics.usyd.edu.au/~cross/TRAJECTORIES/Trajectories.html) | Gravity, drag, spin-force direction and trajectory causality | Simplified original model with explicitly authored coefficients; no measured dataset copied |
| [Lenis official repository](https://github.com/darkroomengineering/lenis) | Scroll-library integration | Installed dependency; its license is preserved below |

Research references do not imply endorsement, partnership, measured player data or professional training advice. Numerical assumptions and their verification are recorded in [physics.md](physics.md).

## Installed direct dependencies

The versions and license identifiers in this table were read from the actual installed package metadata and accompanying license files, rather than inferred from a package name. `package-lock.json` is the reproducible dependency-tree record.

| Package | Inspected version | Package license | Preserved notice |
| --- | --- | --- | --- |
| `lenis` | 1.3.27 | MIT | [Lenis-MIT.txt](../public/licenses/Lenis-MIT.txt) |
| `@fontsource/barlow-condensed` | 5.3.0 | OFL-1.1 | [Barlow-Condensed-OFL.txt](../public/licenses/Barlow-Condensed-OFL.txt) |
| `@fontsource/dm-sans` | 5.2.8 | OFL-1.1 | [DM-Sans-OFL.txt](../public/licenses/DM-Sans-OFL.txt) |
| `vite` | 8.3.6 | MIT for Vite core; its notice also includes bundled dependency terms | [Vite-LICENSE.md](licenses/Vite-LICENSE.md) |
| `typescript` | 7.0.2 | Apache-2.0 | [TypeScript-APACHE-2.0.txt](licenses/TypeScript-APACHE-2.0.txt) and [NOTICE](licenses/TypeScript-NOTICE.txt) |

Lenis's notice identifies darkroom.engineering. The Barlow notice identifies The Barlow Project Authors; the DM Sans notice identifies The DM Sans Project Authors. The original font notices and SIL Open Font License text are retained unchanged. The fonts are bundled with the site and keep their own license; they are not relicensed under the project's MIT license.

Runtime/font notices and a copy of the original project MIT notice live in `public/licenses/`, which Vite copies into `dist/licenses/`. Build-tool notices are retained in `docs/licenses/`; Vite's copied notice includes the notices for code bundled into its published package, and TypeScript's accompanying NOTICE is retained. Installed transitive packages retain their own metadata and notices when `npm ci` reconstructs `node_modules`. Do not remove required notices when redistributing a modified source or production package.

## External services and distribution

No third-party image URL, signed generation URL, private filesystem path, secret, API key, or logged-in browser state is required by the production assets. Image generation was a build-time creative step. The source package does not require users to regenerate images to run the site.

The delivered project remains local until its owner separately chooses to host it. This documentation does not authorize or perform publication, repository pushes, a release, or modification of an existing collection.
