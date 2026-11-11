# PULSE — Visual bible

Locked after inspection of eight independent Image Gen outputs on November 9, 2026.

## Identity and reading experience

A quiet anatomical museum: living material, rigorous diagrams, generous editorial type. The visitor moves from the exterior to chambers, signal, right-sided return, valves, lungs, exchange, left-sided return, muscular wall, systemic circulation, and the original organ. Scroll position is a reading position, never a physiological clock.

## Selected art and framing

AI-02 supplies the exterior/interior premise. AI-04 is the selected desktop refinement: a complete crown and apex at the right, with approximately forty percent quiet space at the left. AI-05 is an independently generated portrait recomposition with a centered lower organ and quiet upper area. It is not a desktop crop. AI-01 remains the intact alternative; AI-03 situates the organ in the chest and appears in the first chapter's second observation. AI-06 and AI-07 are the material studies for the exchange and ventricular chapters. AI-08 provides the explicit magnification boundary in TR-06-07.

The generated artworks are authored illustrations, not scans or authoritative topology. Exact connections, valve boundaries and gas directions are expressed in separately drawn, source-checked SVG plates. The artwork is not described as clinically validated. No third-party medical illustration is redistributed.

All eight retained outputs are individually inspectable at their original pixel dimensions in `docs/art/`, re-encoded as WebP. Exact prompts and returned dimensions are in `docs/asset-provenance.json`. Production images use responsive WebP versions in `public/art/`.

## Material, light and color

Black-wine background, deep chamber burgundy `#4C1722`, myocardial rose `#CB787A`, arterial crimson `#B03D42`, anatomical ivory `#F1E9E1`, gold `#CBA66C`. Diagram slate is an explicitly labeled route convention. No blood is presented as physically blue. Tissue is fibrous and satin, never chrome. Soft light comes from the upper left, with restrained warm rims. No full-image color tint is applied. Edge masks blend photographic plates into their matching dark field; the tissue itself remains unaltered.

## Typography and components

Self-hosted Cormorant Garamond regular/italic carries large exhibition titles. Self-hosted DM Sans regular/medium carries all prose, diagrams, controls, sources and captions. Fluid titles have bounded sizes; prose has a conservative line measure and at least 16px body text on ordinary viewports. Very small scientific labels are replaced by chamber abbreviations and a full-size DOM key on phones. Controls are flat, substantial buttons with underline/pressed states, not ornamental dashboard chips.

Only the header, a restrained progress rail, and the current chapter marker remain persistent. No biometric metrics, ECG, fake scanning state, decorative data cards, login or analytics. Icons are small original SVG line icons. Real titles and labels are selectable DOM or accessible SVG text.

## Shot sequence

| Chapter | Composition | Second observation |
| --- | --- | --- |
| 01 | Dark, full-width hero, organ right and title left | Torso context paired with the two opening content beats |
| 02 | Ivory editorial spread with a dark four-chamber atlas plate | Chamber selection and a visible septum |
| 03 | Dark heart section with separate gold dotted conduction | Explicit comparison with arrowed blood routes |
| 04 | Reversed split, venous-return diagram at left | A stepwise route through the tricuspid opening |
| 05 | Ivory valve atlas, wide composition | AV/outflow family comparison and distinct phases |
| 06 | Dark pulmonary branch plate | Both lung destinations and the approaching change of scale |
| 07 | Generated alveolar material plate followed by a generous schematic | Opposite gas directions across an intact barrier |
| 08 | Ivory comparison of two distinct returns | Posterior pulmonary-vein entry exposed schematically |
| 09 | Later-act myocardial material macro | A fixed-orientation wall comparison and separate outflow |
| 10 | Ivory body map with tall vertical silhouette | Tissue capillaries and venous return, no shortcut |
| 11 | The identical original desktop/portrait hero asset | Independently selectable signal and circulation overlays |

## Motion and continuity

The film language comes from measured scroll-driven masks, registered SVG anchors, and static reading holds. It is a layered illustration exhibition, not a freely rotatable 3D simulator. This deliberate medium choice avoids invented chamber geometry. Each transition has its own registered anatomical landmark, clipping mask and five-stage contract, documented in `docs/transition-contracts.md`. The microscopic handoff is visibly labeled as a change of representation and scale.

One Lenis instance and one GSAP ticker drive a pure scroll evaluator. No numeric scrub lag or forced introductions. Native document flow remains available. Source and target prose never occupy the same reading position. The shared anatomical anchor is not clipped with the replacing layers. Stopping anywhere leaves a composed frame.

## Mobile, stills and failure

Portrait hero uses AI-05. Chapter compositions stack and change their text/diagram balance; none is deleted. All four chamber names remain full-size DOM controls. Reduced motion uses complete stable plates, retains all chapter content and every interaction result, and disables smoothing. Image failures expose the corresponding SVG plate and explanatory copy. No WebGL is required, so unsupported or lost WebGL cannot remove the story. Every diagram also has a selectable textual reading.

## Sound

Silent by default. Optional, original Web Audio thuds evoke two valve-closure sounds at an authored, non-diagnostic pace. The sound description explicitly states that this is an illustration, not a recording or measurement. The off control acts immediately, and hidden pages suspend sound.

## Hero's six states

1. The static HTML immediately supplies the portrait/desktop art, heading, lead and link.
2. A short light/opacity entrance reveals the already-present plate without blocking input.
3. The complete composition is a stable reading frame.
4. The living hold is quiet; the organ does not endlessly expand and contract.
5. First scroll enters the opening two observations and then the section-plane transition.
6. Return restores the exact art and framing without replaying a cinematic loader.

## Review boundary

This document records design decisions, not test results. Actual screenshot comparisons, failures, repairs and untested conditions belong in the evidence ledger. No numerical aesthetic score or clinical endorsement is claimed.
