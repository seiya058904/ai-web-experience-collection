# CRAVE — Visual Bible

## Before the first bite

The work is a sensory film about anticipation. Its subjects are browning,
brittleness, moisture, weight, coating, warmth, and the small disturbance of a
cut. Four food materials provide those contrasts; the site does not expand into
a catalog of dishes.

The images are **AI-generated production media**. The language of macro food
photography defines the intended appearance, not a claim that a real camera,
restaurant, chef, or food experiment produced them. Scientific and practitioner
references are documented separately in [RESEARCH.md](RESEARCH.md).

Full verbatim prompts, image-reference lineage IDs, original dimensions,
checksums, and export settings are in [PROVENANCE.json](PROVENANCE.json). Prompt
wording has been preserved, including requests that describe an intended look
rather than measured properties.

## The visual world

| Element | Direction |
| --- | --- |
| Dark field | Warm espresso `#17120f`; enough detail remains in browned shadows. |
| Light field | Porcelain `#eae4d9`, warm ivory `#f0e6d2`, and espresso ink `#2b2018`. |
| Material accent | Natural caramel and browned gold, with `#bd753b` as the editorial accent rather than a universal food tint. |
| Key light | A large, soft source from the upper left. Its reflection is fragmented on crust, quieter on moisture, stretched around chocolate folds, and narrowed on caramel. |
| Type | Cormorant Garamond regular and italic for editorial display; Manrope 400/500 for restrained controls. All production type is HTML/CSS. |
| Camera | Extreme crops, shallow optical depth, edge tracking, slow approach, interior reveal, and a late pullback to the plate. |
| Composition | Food occupies the right and lower field on desktop; left negative space carries very little text. Mobile shifts the crop and keeps texture large. |

The shared light is a visual metaphor across different materials. It should
reveal their differences instead of coating every food with identical gloss.

## Generate, compare, reject, refine, curate

### Three Hero directions

| Candidate | Decision | What the next pass addressed |
| --- | --- | --- |
| **A — Laminated** | Selected by the main and independent direction reviews. The thin dry crust, layered softness, and strong silhouette gave the richest opening contrast. | The production edit removed baked-in type/UI and the background, preserved the food crop, and requested less wet-looking crown gloss. The original comparison image is not bundled. |
| **B — Seared** | Retained for Heat and Brown, rather than selected as the opening. Its original Hero image became the recorded reference for the scallop production edit. | The edit targeted uniform wet gloss on the pearly side and overly dark sear marks, retaining localized butter glints. |
| **C — Glazed** | Retained as a supporting material direction. It was not selected as the opening and is not recorded as a direct image input to the final glaze asset. | Later concept and production prompts emphasized visible apple texture, a thin coating, and less conspicuous white reflection to avoid a resin-like surface. |

This comparison did not end with a beauty mockup. Separate production passes
removed typography and refined the material cues. The torn interior brief
removed a detached floating flake. Chocolate refinements softened its highlights
while preserving a heavy fold. The Steam production edit removed the baked-in
wisps so the atmosphere could be authored at runtime.

The plate is a deliberate exception to the cleanup sequence: the generated
`concept-plate` output already contained no text or UI, despite a full-viewport
prompt that requested them. It was inspected and selected unchanged as
`tart-plate`. The complete original prompt is retained; no nonexistent cleanup
edit is claimed. The Cut image then used this same plate output as its reference,
and the finale used the Cut output to remove the separated wedge.

There are **21 distinct recorded generation outputs**, including three Hero
candidates, three six-panel material study sheets, downstream concepts, and
production edits. The plate concept and its production alias are one output,
not two. Only the nine selected production PNGs and their eighteen WebP delivery
files are included as food image binaries.

### Six required study families

Three generated six-panel study sheets covered the six families below. These
were AI visual studies, distinct from the external factual research. Their full
prompts and output IDs remain in the provenance record, while their contact-sheet
binaries are excluded from the deliverable.

| Family | What was explored | Curation consequence |
| --- | --- | --- |
| **CRUST** | Croissant flakes, browned bread fissures, and seared surface relief. | Retain unequal, fine edges and local variation. Reject cardboard-like strata or uniformly sharpened crust. |
| **JUICE / MOISTURE** | Torn pastry membranes, unequal air pockets, moist fibers, and localized sauce/fat highlights. | A soft interior must remain connected and edible; reject repeated sponge cells or a uniform oily coating. |
| **MELT** | Softening butter, heavy chocolate folds, short cheese stretch, and caramel flow. | Chocolate became the dedicated flow material. Its motion should suggest accumulation and slow release rather than water-like splashing. |
| **GLAZE** | Thin coating over curved apple and restrained sauce traces on porcelain. | Keep the food visible beneath the sheen. Reject a glass or resin reading. |
| **STEAM / HEAT** | Fine warm-edge wisps, condensation on metal, and tiny butter bubbles beside a seared rim. | Heat remains local and restrained. Steam should have a source and dissipate; dense smoke is unsuitable. |
| **PLATING** | One tart on a large quiet plate, a separated portion, and a missing corner with a few crumbs. | Delay the complete dish until the late pullback. Let the last absence finish the narrative. |

## Four materials, eleven scenes

| Scene | Food material and production media | Authored treatment / narrative purpose |
| --- | --- | --- |
| **01 — Desire** | Laminated pastry: `pastry-hero` | A stable, extreme-crop opening; the alpha silhouette sits in front of monumental type. Light and a restrained approach invite observation. |
| **02 — Heat** | Seared scallop: `scallop-seared` | Contact-local butter bubbles and subtle surface disturbance suggest warmth without a flame backdrop. |
| **03 — Brown** | The same scallop surface | Spatially varied deepening from gold toward amber and chestnut. The material control is an artistic progression, not a thermometer. |
| **04 — Crust** | `pastry-hero` opening toward `pastry-inside` | Anticipation, a brief fracture, separation of image planes, and only a few weighty flakes. The scroll-derived event remains reversible. |
| **05 — Inside** | Laminated pastry: `pastry-inside` | A change to pale, soft, irregular connected layers; restrained depth/focus movement contrasts with the brittle outside. |
| **06 — Melt** | Thick chocolate: `chocolate` | Local flow displacement and a curved highlight suggest a heavy ribbon folding into a pool. The control changes the visual flow response, not a measured viscosity. |
| **07 — Glaze** | Warm apple tart: `tart-glaze` | A coating reveal passes the liquid highlight into thin amber glaze over visible fruit. |
| **08 — Steam** | Warm apple tart: `tart-steam` | Entity gives way to air. Sparse, source-rooted runtime wisps rise above the cropped warm edge; no baked-in fog layer is required. |
| **09 — Plate** | Warm apple tart: `tart-plate` | The first full object and generous porcelain space establish distance after the macro world. |
| **10 — Cut** | `tart-plate` → `tart-cut` → the beginning of `tart-bitten` | An edge, pressure, separation, moist interior, and a few crumbs concentrate the preceding textures into one action. |
| **11 — Before the First Bite** | Warm apple tart: `tart-bitten` | The loose wedge is absent. A fresh gap, a little caramel, and a handful of crumbs leave the bite off screen. |

The scallop photograph contains two scallops, but it serves one seared-food
material study. Pastry exterior and interior are two views of one material
family. The later tart images are continuity states, not additional dishes.

## Continuity and rhythm

**Material match cuts** join contours and surface qualities: a browned edge
hands off to a pastry ridge; a brittle boundary opens into pale layers; the curve
of a heavy liquid highlight carries into caramel; sparse steam opens the field
to porcelain space. The continuity lives in texture, crop, light, and the timing
of the reveal.

The rhythm alternates **hold → anticipation → snap → release**. Stillness permits
the eye to read a surface. A brief fracture or cut interrupts it, followed by the
softer motion of flow or rising air. Food should not constantly twitch, orbit,
or float to demonstrate that the page is interactive.

The media strategy is deliberate: generated stills provide the edible material
base; browser rendering supplies the authored transitions, localized flow,
fracture, coating, light, crumbs, and atmosphere; DOM/CSS carries type and
controls. There are no video recordings, externally captured frame sequences,
or 3D food model assets in this package. Optional sound is quiet WebAudio
synthesis, starts only after the sound control is used, and is not described as a
recording of cooking.

These treatments are cinematic interpretations. They do not model actual food
chemistry, fracture mechanics, temperature, viscosity, or steam formation.
Reference-based AI edits can also resynthesize small details; the plate sequence
is authored continuity, not proof of pixel-identical physical geometry.

## Production inventory

| Production key | Scene use | Native PNG dimensions | Mode |
| --- | --- | --- | --- |
| [pastry-hero](../../provenance/crave/assets/masters/pastry-hero.png) | 01, 04 | 1536 × 1024 | RGBA; real alpha |
| [scallop-seared](../../provenance/crave/assets/masters/scallop-seared.png) | 02, 03 | 1536 × 1024 | RGB |
| [pastry-inside](../../provenance/crave/assets/masters/pastry-inside.png) | 04, 05 | 1536 × 1024 | RGB |
| [chocolate](../../provenance/crave/assets/masters/chocolate.png) | 06 | 1536 × 1024 | RGB |
| [tart-glaze](../../provenance/crave/assets/masters/tart-glaze.png) | 07 | 1536 × 1024 | RGB |
| [tart-steam](../../provenance/crave/assets/masters/tart-steam.png) | 08 | 1536 × 1024 | RGB |
| [tart-plate](../../provenance/crave/assets/masters/tart-plate.png) | 09, 10 | 1536 × 1024 | RGB |
| [tart-cut](../../provenance/crave/assets/masters/tart-cut.png) | 10 | 1536 × 1024 | RGB |
| [tart-bitten](../../provenance/crave/assets/masters/tart-bitten.png) | 10, 11 | 1536 × 1024 | RGB |

All nine packaged PNG masters are unchanged copies of their selected generated
outputs, verified byte-for-byte. Full SHA-256 values, byte sizes, parent IDs, and
exact production prompts are recorded per image in `PROVENANCE.json`.

Each master has two runtime WebP files:

| Delivery width | Dimensions | WebP quality | Alpha quality | Encoder effort |
| --- | --- | --- | --- | --- |
| 1536 | 1536 × 1024 | 90 | 100 | 6 |
| 768 | 768 × 512 | 86 | 100 | 6 |

The recorded export used **Sharp 0.35.4**:

```js
sharp(source)
  .resize({ width, withoutEnlargement: true })
  .webp({ quality: width === 1536 ? 90 : 86, alphaQuality: 100, effort: 6 });
```

The resize kernel was Sharp's default **Lanczos3**, not an explicitly supplied
option. The aspect ratio is unchanged; the native-size export is not upscaled.
The pastry Hero retains real alpha in both the PNG master and WebP derivatives;
its observed PNG alpha range is 0–254 and was preserved rather than normalized.
A 4K viewport is a responsive composition and rendering target, not a claim that
these source images were generated at native 4K resolution.

Mobile uses these same selected materials with an authored vertical crop and
large texture. The unselected mobile concept is documented as a direction study,
not bundled as an additional runtime screenshot.

## Appetite and delivery boundaries

Selection prioritized credible edible color, localized moisture, imperfect
layers, readable soft interiors, controlled reflection, and restrained heat cues.
Plastic or wax-like gloss, impossible repeated crumb, synthetic smoke, detached
floating food, and excessive sharpening were rejection criteria. These are art
direction judgments, not measured claims about every viewer's appetite.

The package contains the selected masters and delivery derivatives, not rejected
candidates, study contact sheets, QA screenshots, traces, or duplicated public
build media. Unselected reference-image binaries are intentionally absent;
provenance preserves their exact prompts and identifiers without promising that
text alone will regenerate identical pixels. Final browser checks and operating
instructions belong to the delivered README.

The generated food images are not assigned an invented MIT, CC0, or stock-image
license here. This document describes provenance and creative decisions; it does
not assert exclusive copyright ownership or change third-party terms. Software
and font notices are in [THIRD-PARTY.md](../../public/crave/licenses/THIRD-PARTY.md).
