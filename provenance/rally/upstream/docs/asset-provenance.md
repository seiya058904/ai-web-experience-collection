# RALLY — Asset Provenance

## Generation record

All image assets listed below were actually generated for this project with the built-in `image_gen.imagegen` tool on 2026-11-09. Each role has its own independently viewable output. Three hero candidates, a distinct desktop refinement, an independently composed portrait hero, two chapter key images and one transition image satisfy the eight requested image roles. The three transparent utility cutouts are additional production assets, not substitutes for those eight roles.

The tool did not expose a seed, model revision, lens calibration or a reproducible random-state identifier. None is invented in this package. Exact submitted prompts and the actual parameters are retained in the JSON records linked below. K-08's record also retains its corrective refinement prompt.

## Source image inventory

Paths are relative to the project root. Dimensions and sizes were measured from the actual local PNGs, not taken from requested dimensions.

| Role | Source file | Pixels | Bytes | Status and intended use | Exact record |
| --- | --- | ---: | ---: | --- | --- |
| H-A | `art-assets/H-A.png` | 1672 × 941 | 2,423,936 | Selected low-angle hero direction | [H-A](../art-assets/H-A.provenance.json) |
| H-B | `art-assets/H-B.png` | 1672 × 941 | 2,733,370 | Full-court alternative; not the primary hero | [H-B](../art-assets/H-B.provenance.json) |
| H-C | `art-assets/H-C.png` | 1672 × 941 | 2,408,196 | Sideline alternative and preparation reference | [H-C](../art-assets/H-C.provenance.json) |
| H-D | `art-assets/H-D.png` | 1672 × 941 | 2,463,278 | Refined desktop hero; edit of H-A | [H-D](../art-assets/H-D.provenance.json) |
| H-M | `art-assets/H-M.png` | 941 × 1672 | 2,421,977 | Independently generated portrait hero | [H-M](../art-assets/H-M.provenance.json) |
| K-04 | `art-assets/K-04.png` | 1672 × 941 | 1,841,690 | Spin-comparison macro; empty navy area for code-native explanation | [K-04](../art-assets/K-04.provenance.json) |
| K-08 | `art-assets/k08-court.png` | 1536 × 1024 | 2,712,396 | Late-story overhead reference; axis corrected through a real image edit | [K-08 and T-05-06](../art-assets/late-assets-provenance.json) |
| T-05-06 | `art-assets/t0506-bridge.png` | 1536 × 1024 | 2,879,974 | Net, descending ball, shadow and clay transition reference | [K-08 and T-05-06](../art-assets/late-assets-provenance.json) |
| Player A | `art-assets/player-a.png` | 1254 × 1254 | 1,071,959 | Transparent navy-clad near-player ready posture | [Player A](../art-assets/player-a.provenance.json) |
| Player B | `art-assets/player-b.png` | 1222 × 1287 | 1,085,236 | Transparent cream-clad far-player ready posture | [Player B](../art-assets/player-b-provenance.json) |
| Ball | `art-assets/ball.png` | 1254 × 1254 | 2,273,842 | Transparent main-ball material for programmatic contact/bounce | [Ball](../art-assets/ball.provenance.json) |

The source PNGs are the art records. Optimized production derivatives may have different dimensions and byte counts; they should remain traceable to these files. Raster resizing or format conversion must not be described as an additional generated image.

## Inspection and selection

H-A's low-angle scene communicates one ball connecting two people. H-D develops that route into a desktop still. H-M was generated with its own portrait composition; it is not a desktop crop. H-B provides useful space and long shadows, but its small ball makes it less effective as the requested large-ball hero. H-C has strong felt, clay and racquet detail, but weakens the two-person relationship. These differences motivated the selection, rather than simply counting image calls.

K-04 contains a single explanatory ball with a clear curved cream seam and real-looking felt. Its left field is intentionally empty for precise SVG curves and real text. K-08 was refined to correct its court axis and near/far placement. T-05-06 keeps the net edge, airborne ball, ground and sideline identifiable in one image. The photographic court lines remain art references; they are not authoritative simulation coordinates.

The player cutouts show one anonymous person each, full racquets and both shoes, with no ball or court. They are still postures, not a complete animation system. The ball cutout contains one ball, no ground and no cast shadow. The app supplies positions, scale, trajectories and grounding shadows.

True RGBA transparency was measured in the cutouts. Player A contains 1,102,014 fully transparent pixels; the ball contains 607,155. Both have alpha values spanning 0–255. Their foreground is mostly slightly translucent near alpha 252–253, and fine felt/edge pixels use intermediate alpha. These measurements establish actual transparency; they do not establish final browser compositing quality.

## Attribution and distribution notes

These are newly AI-generated project assets. They are not downloaded tennis photographs, stock athlete portraits or licensed tournament stills. Prompts intentionally excluded famous-player likenesses, brand logos, tournament marks, watermarks and embedded text. Original anonymous people and an original fictional court are used throughout.

Generation records document how the assets were obtained; they do not claim public-domain status or certify every possible intellectual-property question. Software dependencies and any packaged fonts retain their own license terms and should be listed separately in the project's dependency/license documentation. No external photograph was used as an input to the assets in this inventory; H-D references this project's generated H-A, and K-08's refinement references its own generated draft.

All necessary semantics belong to DOM, SVG or the program. No in-image mark acts as a real button, a result, a coordinate, a measured statistic or a text label. Source files with a baked ball are static frames and must not be combined with an additional visible main ball.

## Verification scope

Completed here: actual image generation, local file presence, source dimensions, prompt preservation, source visual inspection and utility-alpha inspection. Not certified by this record: final site composition, transition continuity, physical-model accuracy, complete browser interactions, actual mobile hardware or 4K hardware. Those checks belong in the separate acceptance evidence.
