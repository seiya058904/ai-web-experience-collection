# BERTH — Sources and third-party notices

This document separates material created for BERTH from the third-party font and software packages used to build and run it. Package versions and license identifiers below were read from the installed local packages. Their actual license and notice files are included unchanged in `third-party/`.

## Material created for BERTH

| Material | Origin and record |
| --- | --- |
| Story, dialogue, names, and fictional times | Written for this project; canonical text is in `src/story.ts`, with the narrative ledger in [story-and-continuity.md](story-and-continuity.md). |
| Compartment and character imagery | Generated for BERTH with the image-generation tool recorded in [image-generation.md](image-generation.md). That record identifies submitted prompts, actual generated files, references, revisions, selection reasons, and intended uses. |
| Prepared runtime images | WebP exports of the recorded generated images, in `public/assets/`. Their manifest identifies dimensions, sizes, and hashes. These prepared files are included; ordinary builds do not require the original generation folder. |
| Interface, controls, and precise paper text | Implemented in project HTML, CSS, TypeScript, and small SVG elements. User-authored sentences are rendered as real text. |
| Rail ambience | Synthesised locally by `src/ambient.ts`; no sampled sound recording or external audio asset is used. |

No stock-photo library assets or vendor logos are used in this build. The fictional compartment is not presented as an exact reproduction of a real train or a railway operator's service.

The third-party licenses listed below apply to their respective packages. This notice document does not assign those licenses to BERTH's story, generated art, or other project-specific material, and does not introduce a new overall project license.

## Included third-party licenses

Fontsource versions identify the installed distribution packages, not an inferred release number for the original font designs.

| Package | Version | Role | Declared license | Included exact notice |
| --- | --- | --- | --- | --- |
| `lenis` | `1.3.27` | Runtime smooth-scroll coordination | MIT | [Lenis LICENSE](../third-party/lenis-1.3.27/LICENSE) |
| `@fontsource/cormorant-garamond` | `5.3.0` | Self-hosted Cormorant Garamond font assets | OFL-1.1 | [Cormorant Garamond LICENSE](../third-party/cormorant-garamond-5.3.0/LICENSE) |
| `@fontsource/dm-sans` | `5.3.0` | Self-hosted DM Sans font assets | OFL-1.1 | [DM Sans LICENSE](../third-party/dm-sans-5.3.0/LICENSE) |
| `vite` | `8.3.6` | Development server and production build tooling | MIT | [Complete Vite LICENSE.md](../third-party/vite-8.3.6/LICENSE.md) |
| `typescript` | `7.0.2` | Type-checking tooling | Apache-2.0 | [TypeScript LICENSE](../third-party/typescript-7.0.2/LICENSE) and [NOTICE.txt](../third-party/typescript-7.0.2/NOTICE.txt) |

The source archive also includes the **exact five imported font stylesheets and all ten referenced WOFF/WOFF2 files**. The copies are retained under `third-party/cormorant-garamond-5.3.0/` and `third-party/dm-sans-5.3.0/`, with their original `files/` relative paths and OFL license texts. They cover Cormorant Garamond Latin 400 normal, 400 italic and 500 normal, plus DM Sans Latin 400 and 500 normal. All fifteen files were compared byte for byte with the installed pinned packages; the manifest records each size and SHA-256.

These are archival, redistributable font copies. The tested application continues to import the same pinned Fontsource packages through `src/styles.css`; normal `npm ci` and Vite builds are unchanged and bundle those fonts for local serving. The archive does not include `node_modules`, and the archival copies do not replace dependency installation.

The font notices preserve the Cormorant Project Authors and DM Sans Project Authors copyright statements. The Lenis notice preserves darkroom.engineering's copyright statement. Vite's full supplied file includes its core license and bundled third-party notices; it has not been shortened to its first section. TypeScript's complete supplied `NOTICE.txt` is retained alongside its license.

[The third-party manifest](../third-party/manifest.json) records each local source path, included destination, byte size, and SHA-256 digest. The copied files were compared byte for byte with their installed sources. They were not translated, reformatted, or rewritten.

This inventory covers the five packages listed above and the notices they supply. The full dependency graph remains in `package-lock.json`; this document is not an inventory of every transitive package. Refer to the included license and notice texts for their exact terms.

## Consulted design and technical references

| Reference | Use in this project |
| --- | --- |
| [ÖBB Nightjet — sleeper compartments](https://www.nightjet.com/en/komfortkategorien/schlafwagen) | Background for the practical scale of a shared sleeper compartment and ordinary facilities such as berths, a ladder, a small table, and adjustable lighting. It informed the fictional room's constraints; no official photographs or brand assets were adopted. |
| [Lenis official repository](https://github.com/darkroomengineering/lenis) | Technical reference for the pinned Lenis integration and coordinated scroll/RAF behavior. |
| [Vite official guide](https://vite.dev/guide/) | Technical reference for the development and static-build workflow. |

These are references, not claims of endorsement, real-route accuracy, real rolling-stock fidelity, or railway service availability. All station names, story times, and passenger situations in BERTH are fictional.

## QA harness source

The editable inspection harness is retained at `tests/viewport.html`. A matching copy is included at `public/qa/viewport.html`; Vite serves that public file during development and copies it to `dist/qa/viewport.html` during the normal build. This is a CSS viewport inspection aid, not a third-party device emulator or proof of testing on physical hardware.
