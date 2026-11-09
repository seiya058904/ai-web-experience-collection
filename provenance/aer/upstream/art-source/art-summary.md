# AER art generation summary

Ten independent built-in Image Gen outputs were produced: the eight requested base roles and two additional distinct branch panoramas. No image is counted twice. The tool did not expose seeds or sampler parameters; none are invented. All original PNG outputs remain available, with project copies in this directory.

| Role | Source copy | Dimensions | Intended use / selection |
| --- | --- | --- | --- |
| H-A | `H-A.png` | 1536 × 1024 | Opening candidate: identity and scale reference; superseded by H-D. |
| H-B | `H-B.png` | 1536 × 1024 | Half-inflated study: CH-02 reference/frame; not selected as opening. |
| H-C | `H-C.png` | 1536 × 1024 | Upward basket candidate: rejected as Hero, perspective reference only; broad mouth / imperfect suspension anatomy. |
| H-D | `H-D.png` | 1672 × 941 | Selected desktop opening refinement. |
| H-M | `H-M.png` | 941 × 1672 | Selected independent portrait opening composition. |
| K-05 | `K-05.png` | 1536 × 1024 | Selected CH-05 shadow/field composition; artistic projection, not measured geometry. |
| K-08 | `K-08.png` | 1536 × 1024 | Selected middle branch panorama: Village Bend only. |
| T-04-05 | `T-04-05.png` | 1536 × 1024 | Selected critical transition reference: lower envelope + basket + shadow + path. |
| K-08-low | `K-08-low.png` | 1536 × 1024 | Selected low branch panorama: Hedgerow Meadow with paired tree rows. |
| K-08-high | `K-08-high.png` | 1536 × 1024 | Selected high branch panorama: Far Meadow with distant oval grove. |

## Exact records

- `main-generation-record.json`: H-A, H-D, H-M; main art direction and Hero generation.
- `agent-generation-record.json`: H-B, H-C, K-05, K-08, T-04-05.
- `branch-generation-record.json`: K-08-low, K-08-high.
- `all-generation-record.json`: consolidated records, unmodified exact prompts, original paths, copied-source dimensions and SHA-256 hashes.

## Identity and adoption notes

The shared identity is an enormous pear-shaped envelope with cream/apricot longitudinal gores, a small indigo crown, four intended suspension attachments, and a honey-brown basket approximately one tenth of the envelope width. The reference and these images guide the live model; pixel imagery is not proof of exact topology. H-C is deliberately excluded from identity-sensitive visual replacement because its mouth and suspension anatomy diverge.

Each panorama has its own actual terrain image: Hedgerow Meadow has nearby paired rows of trees; Village Bend has a small village beside the road bend; Far Meadow has broad pale fields and a distant oval grove. A changed text label is not used to invent a new landscape. Runtime route position, path overlays, late image replacement and landing alignment remain implementation/browser validation responsibilities.

The WebP files are image-format compression of the PNG outputs, not separately counted generations. No raster image contains UI text, control labels, path coordinates, or equations. All actual semantic text and controls belong to DOM/SVG.
