# Biology and editorial interpretation

This document describes the boundary between sourced monarch biology and the authored visual experience. The source review is recorded in [sources.md](./sources.md).

## One illustrated individual

The story follows one imagined _Danaus plexippus_. Its repeated milkweed leaf, vein, nearby support and wing pattern provide visual continuity. The artwork does not document an observed specimen or a recorded life cycle. The recurring setting must not be presented as evidence that every monarch remains on its original plant through pupation.

The narrative follows the species sequence: egg, five larval instars, pupa and adult. Selected poses compress the observations into readable chapters. Scroll distance, animation duration and the interval between comparison states do not represent biological time.

## Terminology and claims

| Term or scene | Editorial treatment |
| --- | --- |
| Egg | A ridged casing attached to milkweed, with no imaginary embryo exposed through a glass shell. |
| Instar | A larval stage between molts. The comparisons use separately drawn body profiles and identifying features. |
| Larval filaments | Kept distinct from the small antennae on the head in the educational drawing. |
| Silk attachment | A small pad and physical contact with the animal; never an unexplained hanging string. |
| Chrysalis | The butterfly pupa, not a silken cocoon. The natural gold markings are restrained. |
| Inside view | An explicitly labeled illustrative reconstruction, with simplified folded-wing regions. No invented organ map is represented as microscopy. |
| Late pattern | Wing pigmentation becomes visible beneath the retained covering; the scene does not claim a transformation into transparent glass. |
| Emergence | Leaving the casing, expanding wings and readiness for flight remain separate observations. |
| Life-cycle return arrow | Represents the next generation, not an adult reverting into an egg. |

## Scientific checks that remain visual

The content and references cannot by themselves certify a generated image. Review the retained art for attachment, plausible silhouettes, ridged egg shape, milkweed context, caterpillar markings and monarch wing pattern. A correct caption does not excuse an incompatible picture. The independent art review and acceptance ledger record the actual visual assessment and its limitations.

## Reading edition

`public/reading.html` is a complete static alternative. It contains all eleven chapters and all twenty-two content beats, plus visible instar comparisons, the inside illustration, the three emergence poses, and source links. It uses native document flow and ordinary anchors, with no JavaScript or animation. User-directed copy that refers to selecting a specimen is adapted to the adjacent static comparison.

To regenerate after changing the shared content, run:

```sh
node --experimental-strip-types scripts/generate-reading.mjs
```

The generator reads `src/content.js`, `src/media.ts` and `src/diagrams.ts`. Its output is copied by Vite from `public` to the build output. The page also opens directly from `public` with its relative illustration files available. Links to the interactive experience are intended for the local development or production-preview server.

## Editorial restraint

The experience supplies no universal development countdown, measured body-length series, survival percentage, handling instructions or route attributed to its imagined adult. A static frame is an illustration, and a moving sequence remains an illustration. Observation notes and image descriptions preserve that distinction in both editions.

No browser result or accessibility-conformance certification is asserted by this content document.
