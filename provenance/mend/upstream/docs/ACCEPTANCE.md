# MEND — execution and acceptance record

**Delivery status: implemented source and generated assets; full browser acceptance is blocked and is not claimed.**

This record separates implementation, executable checks, browser observations, and unverified requirements. The project was made as a local deliverable. No Site was registered, deployed or published; no repository was pushed; no PR, release or Collection change was made.

## What is implemented

- Ten English chapters, with distinct narrative and interaction purposes, plus nine progress-evaluated camera/part handovers in one shared Three.js scene.
- A fixed four-wheel Pip identity, chipped right ear, retained paint, one underside sun and three move marks.
- Real generated artwork for all eight required roles, plus separate B repair/long-road variants and a generated wood-paint surface. Sources and actual prompts are included.
- Lenis 1.3.27 with its stylesheet, one caller-owned RAF, anchor navigation, reduced motion, and normal document flow.
- A/B selection, explicit example/default state, optional local choice persistence, inspection focus, component seating, before/repaired trials, reset, registered comparison, final letter, repair card, text export, and return navigation.
- Correct A/B records: A keeps the original wheel with a sleeve and has no removed-wheel bag; B fits one new wheel and returns the original in its bag.
- Stable, chapter-appropriate image fallbacks. Precise SVG diagrams provide wheel clearance, axial part seating, distance-linked rolling, and a fixed-pose comparison even without WebGL. In the image fallback, the comparison photograph is explicitly a repaired-detail reference; the same-pose drawing carries the selected before/after state.
- The gathered-cord ending uses the brief's permitted no-hand variant. No audio is included.
- Local images/fonts, an included production build, Python/Windows launch helpers, and an additional self-contained HTML packaging script.

Implementation is not a substitute for rendered acceptance. In particular, the nine three-dimensional handovers, mobile framing, model-to-photo fidelity, and actual input paths still require a working browser verification environment.

## Executable checks

The working environment used Node 24.22.1, npm 11.9.0 and Python 3.12. Exact dependency versions and their transitive tree are locked in `package-lock.json`.

| Check | Actual result | Scope |
| --- | --- | --- |
| TypeScript and Vite production build | Passed during implementation; final command log is in `evidence/final-checks.txt` | Compilation, module bundling and asset output; not a visual result |
| State/scroll tests | 14 passed, 0 failed in the recorded run | Choice validation, both branch invariants, explicit trial completion, reset/pause/background timing, reduced-motion outcome, nine handover coordinates, road-entry continuity and direct entry |
| Offline packager | Static reference checks passed | Images, fonts, CSS, entry module and scene module are embedded; missing/unresolved resources fail the packaging step |
| Independent source review | Concrete defects identified and corrected; see `CODE_REVIEW.md` and `FINISH_REVIEW.md` | Code and exact geometry, with no browser visual approval |
| Mechanical design detector | One warning, explained below | Source-only detector, run once |
| Clean archive reproduction | See `evidence/archive-checks.json` | Actual extraction/install/build/check commands; browser reproduction is a separate blocked item |

The detector reported all headings as 16 px when reading HTML without resolving the CSS imported by TypeScript. The actual stylesheet defines a 104–190 px hero title and 44–78 px chapter headings, against 16 px desktop body text. The warning is retained as a source-resolution limitation, not treated as evidence of a flat rendered hierarchy.

## Browser evidence and blockers

Browser interaction was attempted through the Browser plugin first. Navigation to the managed preview address failed with `net::ERR_HTTP_RESPONSE_CODE_FAILURE`. The supported cloud Chrome/CDP path was then used.

The preview CLI returned `http://terminal.local:4173/`. Its route repeatedly served other projects instead of MEND, including titles **ODDS**, **FRAME**, and **RALLY**, after apparently successful preview starts. Those pages were not used as evidence about MEND. A concrete Vite allowed-host error was corrected by permitting exactly `terminal.local` in the local development/preview configuration.

MEND was successfully observed at that address on two occasions:

1. `?graphics=off` showed the English MEND document, all ten chapters in the accessibility tree, the example A record, and the generated opening composition.
2. The normal route attempted Three.js initialization. Chrome reported `GL_VENDOR = Disabled`, `GL_RENDERER = Disabled`, and a WebGL context creation failure. The page displayed its illustrated fallback and the explanatory notice instead of leaving the whole story empty.

The observed opening screenshot had a 1348 × 925 raster. CSS viewport, DPR, browser version, GPU and performance timings were not independently measured. It revealed the desktop image being cropped by `object-fit: cover`; the source was changed to `contain`. That correction could not be visually rechecked.

A screenshot was emitted and inspected in the browser tool, but its requested synchronized file never became available in the project filesystem. Therefore no screenshot file is included or misrepresented as final visual evidence.

A static, embedded viewport harness was prepared to avoid dependence on development hot reload. Before it could be exercised, the shared preview address again served another project. A direct local-file navigation was rejected by the browser's URL protocol policy. No policy workaround, alternative browser engine, raw CDP path, network-permission change or deployment was used to bypass that rejection.

**The following are unverified:** final desktop/mobile/wide/short-screen screenshots; 1440 × 900 and 390 × 844 complete real-input paths; the other specified CSS viewports; 125/150/200% browser zoom; all 45 rendered transition samples; continuous forward/reverse WebGL motion; live hotspot projection; actual keyboard, touch, modal, download and history flows; deliberate image/font delays and out-of-order network loading; live context-loss/restoration; repeated-render memory/listener measurements; Windows execution; physical phones; Firefox/Safari; and performance/FPS/Lighthouse claims.

The no-WebGL **first-screen fallback** was observed. This does not validate the complete fallback interaction path, and it does not validate the live 3D route.

## Material defects corrected

| Location / condition | Root cause | Correction and evidence |
| --- | --- | --- |
| Hero in a taller desktop frame | `cover` cut off the rear silhouette | Use `contain` for both authored hero compositions. Source checked; final screenshot unverified. |
| CH-08 → CH-09 | Outgoing chapter hold progress was reused as road progress | Separate section-derived `roadProgress`; a focused regression proves no movement before CH-09 and no jump at entry. |
| Before trial / comparison accessibility text | Scene description used only the chapter number | Description now also honors explicit before-trial and before-comparison states. |
| Default A confirmation | Clicking the already checked radio did not fire `change` | Commit choice on activation and on Continue; retain same-plan trial state. |
| Long/overflowing dialogs | Main Lenis instance could consume their wheel events | Native dialogs use `data-lenis-prevent`. Navigation suppresses stale opener focus restoration. |
| Trial controls later in CH-07 | Playback window ended before the displayed chapter | Gate playback by the current authored chapter; keep model displacement at full weight until the comparison handover. |
| No-WebGL trial | Whole photo, including ground, was translated | Keep photographs fixed; schematic rolls four wheels by displacement/radius over fixed ground. |
| No-WebGL CH-08 comparison | Different photographs could imply registered geometry | Keep a labeled repaired-detail photograph and use one registered schematic for both states. |
| CH-09 branch B | A close repair still replaced the long-road composition | Generate and package a dedicated B long-table image with the pale new wheel and original in its bag. |
| Graphics retry and concurrent initialization | Retry could expose a lost canvas or create duplicate scenes | Keep fallback active until restoration; guard scene initialization both before and after import. |
| Late font completion | Hash restoration could override a visitor's new scroll position | Restore the initial hash only if the visitor has not already navigated. |
| Sun/marks in live geometry | Decals were inside the beveled wood | Move them outside the measured underside. Exact raycast findings and remaining verification are recorded in the independent review. |
| Supported underside | Rectangular support tops intersected the rolled body | A geometry-specific correction and ray checks are recorded in the independent review; visual contact remains unverified. |

These checks do not establish final artistic equivalence to the generated references. The first-screen image crop and the underside geometry were the material areas revised from available evidence; a weakest-two-chapter visual ranking could not be responsibly completed.

## Reproduction and next verification

Use the full archive, not a copied `index.html` on its own. The production folder keeps relative asset paths. `npm ci` requires a package registry or a populated cache; the included normal production build can be served with Python without installing Node packages. The optional `dist/MEND-Offline.html` contains its own resources, but its local-file browser execution remains unverified in this environment.

On a browser with an available graphics context, first verify the full hero, supported underside, A/B part seating, CH-07 explicit trials, registered comparison, CH-09 route and ending at desktop and mobile sizes. Then inspect all nine intermediate handovers in both directions, navigation/history, reduced motion and failure recovery. The viewport helper `qa.html` is for development inspection and does not itself count as completed evidence.

This delivery is not described as a complete G5/G6 browser pass. The source and assets are preserved so that the remaining verification can proceed without regenerating the work.
