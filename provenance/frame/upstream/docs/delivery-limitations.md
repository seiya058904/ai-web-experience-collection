# FRAME — delivery boundaries and known limitations

This document records implementation and evidence limits. It is not a browser pass report. Actual browser cases, production-build results, clean-extraction results, and their evidence belong in the final delivery report. A source-level check or a passing unit test must not be substituted for those observations.

## Reference art and final material

Eight brief-assigned images and two interface studies were actually generated and are included under `concepts/`. They establish the selected direction, task composition, color, character features, and important later views.

The final animation uses an original deterministic CPU ray-marched character and locally baked frames. The model preserves the intended fold, thumb impression, two eyes, limbs, palette, and task, but its silhouette, face proportions, folded corner, and micro-surface response differ from the generated reference. Generated references are therefore **art-direction references**, not proof of a pixel-identical final implementation. A “10/10 reference match” or indistinguishable physical-clay claim would overstate the result.

The 126 production raster files consist of 64 canonical landscape/portrait sequence assets, 24 compact desktop Hero assets, 24 independently staged portrait Hero assets, and 14 observation/epilogue stills. There are still only **24 story frames**. Different camera renders, the four intermediate push poses in each alternative take, and repeated held beats must not be presented as additional story frames.

## Scroll bridges and scene handoffs

The nine adjacent bridges are separate Canvas compositions driven by the current measured scroll position. They reuse the relevant baked poses, retain explicit selected-frame/configuration state, and transform clearly bounded frame panels. Some bridges switch their observation pose at defined progress thresholds; low-motion mode displays a fixed bridge composition.

This implementation is **not a continuous transfer of the same DOM or Canvas object from one chapter into the next**. A matching frame identifier does not by itself establish identical screen scale, camera framing, material exposure, edge treatment, or silhouette alignment between the surrounding chapter and the bridge at every intermediate position.

Samples at 0%, 25%, 50%, 75%, and 100% can document those observed compositions. They cannot establish every point along a continuous forward/reverse scroll. Slow traversal, fast traversal, direction changes, boundary limits, and late-resource behavior require separate actual browser observation. The delivery must not claim cinematic seamlessness, exact shared-object handoff fidelity, or complete transition acceptance solely from samples or source code.

## Browser, device, and input coverage

- CSS viewport simulation and a scaled same-origin iframe do not constitute physical-phone, touch-hardware, or 4K-monitor testing.
- The QA harness preserves the iframe's CSS width and height while using the host browser's DPR. Its “Fit” display scaling is not 125%, 150%, or 200% native browser zoom validation.
- No physical Android/iPhone device, Windows desktop launcher session, or Safari session is established by this source audit. Do not claim those environments passed unless a separate dated execution record supplies that evidence.
- Chromium observations, if recorded in the final report, apply to the recorded browser, viewport, DPR, and tested paths. They do not establish Firefox/Safari behavior or device-specific performance.
- Frame/hold arithmetic, cache-race tests, and VM playback regressions establish their tested code paths. They do not establish rendered contact, accessibility-tree quality, visual contrast, continuous-scroll comfort, or actual downloaded-file behavior.

There is no measured Lighthouse score, guaranteed FPS, or physical-device memory budget established by this document. Resource byte counts describe files; they are not a substitute for network, decoding, painting, or interaction measurements.

## Offline use and reproduction

The top-level `FRAME.html` contains the production application with its image and font bytes embedded. Its declarative resource references were checked for self-containment; direct `file://` opening on Windows remains unverified. The included `dist/` build runs through the dependency-free local Node.js server. It requires an installed Node.js runtime, but no npm dependency installation to serve that build. Rebuilding the website from source uses `npm ci` and initially requires network access to obtain locked packages.

The recorded Linux reproduction run used a fresh extraction with no `node_modules`, successfully installed from the lockfile, passed all 47 tests, removed the included generated outputs, and rebuilt them. `FRAME.html`, `QA-PREVIEW.html`, `dist/`, and `docs/offline-build.json` matched the source build byte for byte. Before installing dependencies, programmatic HTTP requests verified all 136 distributed files and the server's method/path boundaries. The portable artifact also retained the exact Lenis and Manrope notices, with matching source and metadata hashes. These are source and HTTP results; they do not establish browser rendering or Windows execution. See [reproduction.json](reproduction.json) and [the command log](../evidence/reproduction.log).

The exported HTML film embeds its two canonical camera sets and timeline. Its source is self-contained; actual independent/offline opening, playback, responsive source selection, and PNG appearance must be confirmed by the final export checks.

Rebaking artwork is an optional production workflow. It requires Node.js 24, a C++17 compiler with OpenMP, Python, and the pinned Pillow encoder. It is not required for the ordinary website build or playback. Cross-compiler, cross-platform, and cross-encoder byte-identical art regeneration has not been established. The default landscape/portrait bake and the compact Hero bake are separate commands; see [renderer.md](renderer.md).

## Package and provenance checks

The source audit found relative production asset paths, locally bundled Manrope font input, English-authored product/fallback/export text, and matching asset and license hashes. Historical generator identifiers are provenance only; packaged concept paths point to the included `concepts/` files. No private workspace path or expiring URL is needed by the website runtime.

A candidate ZIP passed entry inspection and the clean-extraction reproduction recorded above. Its hash identifies that candidate, not a later archive containing final documentation and browser evidence. Run `python scripts/package-source.py` again after the final evidence and documentation are complete, then inspect the final archive. The packager includes source, lockfile, final `dist/`, complete local art, concept records, notices, and evidence; it excludes `node_modules`, hidden files, credentials by filename, browser profiles, renderer executables, temporary PPM frames, caches, symlinks, and nested archives. The QA harness is a separately labeled local testing aid and is not linked in the product navigation. Inclusion of that helper does not establish that its browser checks were run.

Do not report an unconditional full pass where required visual fidelity or required browser cases remain unverified. Keep **implemented**, **verified**, **unverified**, and **known deviations** separate in the delivery report.
