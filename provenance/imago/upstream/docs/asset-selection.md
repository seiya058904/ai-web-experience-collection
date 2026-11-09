# IMAGO — asset selection

## Selected visual direction

**Hero A** established the final direction: one opaque jade chrysalis at the right, a visible silk pad and cremaster beneath a slender branch, warm ivory air, and clear space for the title at the left. The large specimen makes the cuticle and tiny gold markings legible. Its calm field also supports the selected Cormorant Garamond and Inter typography.

| Candidate | Observed composition | Decision |
| --- | --- | --- |
| A, `hero-a.webp` | Large right-side chrysalis, ivory ground, upper branch, blurred leaf at lower right. | Selected as the direction. The final desktop composition lowers the branch to reserve navigation space and preserves the whole attachment. |
| B, `hero-b.webp` | Backlit milkweed canopy, strong leaf veins, deep green shelter, right-side chrysalis. | Retained as an alternative. Its dense canopy and darker setting give the entrance a more enclosed tone. |
| C, `hero-c.webp` | Small chrysalis left of center, diagonal twig, wide pale field and distant milkweed. | Retained as an alternative. Its smaller subject emphasizes the environment and calls for a different text arrangement. |

The final desktop image is `hero-desktop.webp`. `hero-background.webp`, `hero-subject.webp`, and `foreground.webp` provide separately generated depth layers. `hero-mobile.webp` is an independently generated **1024 × 1536 portrait composition**, with the subject and open field arranged for the mobile entrance. It is not a desktop crop.

## Generation and adoption

[image-generation.json](image-generation.json) contains **31 image-generation outcomes: 27 named roles plus four registration revisions**. All outcomes are **1536 × 1024**, except the **1024 × 1536** mobile hero. The record preserves each exact submitted prompt, returned PNG basename, role, local output, and recorded processing. No image seed was exposed.

| Adopted revision | Replaced frame | Reason and observed result |
| --- | --- | --- |
| `IMG-07-R1`, emerged | `emerged-first.webp` | Restored the branch and silk attachment to the common hero/gripping framing. |
| `IMG-08-R1`, emerging | `emerging-first.webp` | Removed the vertical attachment jump while retaining the partially emerged, compact-wing body. |
| `IMG-06-R1`, hanging J | `hanging-j-first.webp` | Brought the J-stage support into the forming-pupa reference framing. |
| `IMG-17-R1`, adult | `adult-first.webp` | Brought the open-wing adult's support into the expanding-wing reference framing. |

The revisions address source-image continuity. Their source review is recorded under AR-01 and AR-02 in [art-review.md](art-review.md). The final [finish review](finish-review.md) accepts the supplied matched-stage handovers as a matched-still adaptation and ends with **disposition: ship** after closing all six scored finish fixes. This is acceptance of saved compositions and recorded states, not continuous-motion certification. The four original full-size frames remain in the asset folder as correction history.

The five-row `instars.webp` supplies the chapter-four comparison. Its first row is labeled **First instar**, followed by increasingly large striped stages. Displayed sizes are explicitly schematic. It is an editorial illustration of change, not a measured growth plate.

### Finish-review additions

Two additional generated outcomes address specific composition issues identified during finish review. Both source WebPs were opened and reviewed, integrated into the site, and accepted in the bounded composed-page follow-up documented in [finish-review.md](finish-review.md).

| Output | Returned PNG | Adopted role and source observation |
| --- | --- | --- |
| `IMG-30`, `departure-resting.webp` | `exec-6ee03a3d-33ac-4a28-856f-ee28b5cbcc02.png` | Chapter 10 supported resting/reset scene. One mature adult hangs by visible foot contacts beneath the shell in the meadow setting. Four wings and two antennae are readable. |
| `IMG-31`, `branch-to-leaf.webp` | `exec-edae06de-5127-4dd0-9c1f-833446c99712.png` | TR01–02 spatial bridge. A twig and petiole form a traceable diagonal toward one ribbed egg on a leaf underside; no later life stage is superimposed. |

`departure-resting` uses the existing empty-shell environment and adult as tool references. The broad support position matches the ending environment, while some lower-shell and meadow detail differs between generated images. The six release ending captures show accepted supported rest, completed departure, and reset at desktop and phone-sized viewports. `branch-to-leaf` uses the desktop Hero and egg scene as references; its twig/petiole junction is an artistic spatial construction, not a certified botanical specimen. Its shared diagonal and retrospective cue were accepted in the replacement desktop states and mobile midpoint. The instar repair uses CSS framing of the original plate, with complete isolated rows accepted in the native and mobile captures.

### Release disposition and evidence

The final appended verdict in [finish-review.md](finish-review.md) is **ship**: supported chapter-ten rest, the spatial bridge, instar crops, schematic handovers, wide Hero layering, and heading treatment with the final CH08 safe-area correction are all closed within the scored review.

The evidence combines 45 transition frames—30 unchanged baseline frames and 15 replacement frames for TR01–02, TR05–06, and TR06–07—with release mobile midpoints, native chapter crops, and targeted views. The [release transition record](../evidence/transition-captures-release.json) identifies the replacement captures. Key composed results are:

- Ending: [native chapter 10](../evidence/chapters/chapter-10-native.jpg) and the `ending-{desktop,mobile}-{resting,completed,reset}-release.jpg` captures in `evidence/`.
- Spatial and schematic bridges: [TR01–02 mobile midpoint](../evidence/mobile-transition-01-02-050-release.jpg), [TR05–06 midpoint](../evidence/mobile-transition-05-06-050-release.jpg), [TR06–07 midpoint](../evidence/mobile-transition-06-07-050-release.jpg), and [CH06 schematic](../evidence/chapter-06-schematic-release.jpg), with their five-frame desktop contact sheets.
- Instars: [native chapter 4](../evidence/chapters/chapter-04-native.jpg), [mobile body](../evidence/mobile-chapter-04-body.jpg), and [mobile lower rows](../evidence/mobile-chapter-04-lower-release.jpg).
- Wide Hero: [3840 × 2160](../evidence/hero-3840x2160.jpg) and [2560 × 1440](../evidence/hero-2560x1440.jpg) captures.
- Final CH08 safe area: [native chapter crop](../evidence/chapters/chapter-08-native-release.jpg), [desktop](../evidence/chapter-08-desktop-safearea-final.jpg), [851 × 900](../evidence/chapter-08-851x900-safearea-final.jpg), and [phone-sized](../evidence/mobile-chapter-08-safearea-final.jpg) views.

## Delivery processing

The local source inventory contains **58 WebPs**: 31 full-size outputs and 27 responsive derivatives. Recorded encoding uses quality 87 for full-size images, quality 82 for derivatives at 768 pixels wide, and quality 62 for the embedded 256-pixel-wide fallbacks. Landscape derivatives are 768 × 512; the portrait is 768 × 1152. The 27 embedded fallbacks are 256 × 171, or 256 × 384 for the portrait. The anatomy repairs and two finish-review additions were actual image-generation results, not painted into place by code.

[raster-provenance.json](../evidence/raster-provenance.json) records **58/58 successful prompt-provenance writes**, and every source WebP has its adjacent `.webp.json` sidecar. Impeccable's `embed-prompt` uses those JSON sidecars for WebP; the prompt is not claimed to be embedded in the binary image metadata. Sidecar creation does not modify the artwork pixels. These source-inventory facts are separate from production-build and browser evidence.

All page imagery is local. The site does not depend on an external photograph, audio recording, model asset, or live image-generation service. The optional air sound is synthesized in the browser. Font families and retained notices are listed in [sources-and-licenses.md](sources-and-licenses.md).

## Biological and visual limits

These are artistic reconstructions of an imagined continuous individual. They are not a photographed specimen, exact temporal recording, measured anatomical atlas, or scientific simulation. Foot occlusion, fine venation, scale patterns, and exact larval proportions remain approximate. The emerging frame retains a strongly green shell and a simplified opening; it conveys the sequence without documenting an exact observed shell color or split geometry. The empty post-emergence shell is shown separately as thin, pale cuticle.

The J pose, visible suspension, compact newly emerged wings, later wing expansion, four-wing adult shape, supported resting scene, and single-egg bridge were checked for obvious visual contradictions in named assets. Those checks do not certify every pixel. The internal developmental SVG is labeled nonmeasured, and the instar plate's displayed sizes are schematic. The flight cutout supports an editorial departure; it does not provide verified wingbeat kinematics. The final ship disposition covers the six scored fixes and supplied composition/recorded-state evidence, not exact anatomy, continuous motion, or the whole surface in every runtime condition. [biology.md](biology.md) separates the sourced claims from these narrative and visual choices.
