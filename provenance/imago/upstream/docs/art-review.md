# IMAGO — independent image review

## Scope

The named source WebP assets and revised generated PNGs below were opened with the image viewer and checked for obvious duplicated bodies, missing support, wrong wing count, and continuity. This is an independent production review of artistic reconstructions. It is not zoological certification, a validation of each anatomical pixel, or a replacement for the final composed-page review. All coordinate estimates below describe the artwork, not measurements of a real animal.

The current generation inventory contains 31 outcomes across 27 named roles and four retained original registration frames. The source asset folder has 58 WebPs including responsive derivatives; all 58 have adjacent prompt JSON sidecars. This review covers the explicitly named images, not every file in that inventory. The source observations below are now reconciled with the final composed-page [finish review](finish-review.md), whose last appended disposition is **ship**. All six scored finish corrections are closed.

## Release composition evidence

The finish review accepted the remaining stage handovers as a matched-still adaptation, then scored the corrected compositions and the final CH08 safe-area repair. The transition packet contains 45 saved states: 30 unchanged baseline frames and 15 replacement frames for TR01–02, TR05–06, and TR06–07. [transition-captures.json](../evidence/transition-captures.json) and [transition-captures-release.json](../evidence/transition-captures-release.json) retain the capture records. Acceptance concerns the supplied compositions and recorded states; it does not certify continuous motion or every anatomical detail.

| Closed composition issue | Recorded release evidence |
| --- | --- |
| Supported chapter-ten rest, completed departure, and reset | [Native chapter crop](../evidence/chapters/chapter-10-native.jpg); desktop [resting](../evidence/ending-desktop-resting-release.jpg), [completed](../evidence/ending-desktop-completed-release.jpg), [reset](../evidence/ending-desktop-reset-release.jpg); phone-sized [resting](../evidence/ending-mobile-resting-release.jpg), [completed](../evidence/ending-mobile-completed-release.jpg), [reset](../evidence/ending-mobile-reset-release.jpg). |
| Twig/petiole/egg-bearing-leaf bridge | [TR01–02 contact sheet](../evidence/contact-sheets/transition-01-02.jpg) and [mobile midpoint](../evidence/mobile-transition-01-02-050-release.jpg). |
| Five complete instar crops | [Native chapter crop](../evidence/chapters/chapter-04-native.jpg), [mobile body](../evidence/mobile-chapter-04-body.jpg), and [mobile lower rows](../evidence/mobile-chapter-04-lower-release.jpg). |
| Labeled schematic handovers | [TR05–06 contact sheet](../evidence/contact-sheets/transition-05-06.jpg), [TR06–07 contact sheet](../evidence/contact-sheets/transition-06-07.jpg), their [first](../evidence/mobile-transition-05-06-050-release.jpg) and [second](../evidence/mobile-transition-06-07-050-release.jpg) mobile midpoints, and [CH06 schematic](../evidence/chapter-06-schematic-release.jpg). |
| Wide Hero alpha composition | [3840 × 2160 Hero](../evidence/hero-3840x2160.jpg) and [2560 × 1440 Hero](../evidence/hero-2560x1440.jpg). |
| Heading treatment and final CH08 title safe area | [Native chapter crop](../evidence/chapters/chapter-08-native-release.jpg), [1440 × 900 view](../evidence/chapter-08-desktop-safearea-final.jpg), [851 × 900 view](../evidence/chapter-08-851x900-safearea-final.jpg), and [390 × 844 view](../evidence/mobile-chapter-08-safearea-final.jpg). |

## Observations

| Asset | Directly observed | Assessment at this review |
| --- | --- | --- |
| `hero-subject.webp` | One green chrysalis below a small silk attachment on the branch. | No obvious duplicated subject or glass refraction. The final wide Hero compositions were accepted; raw transparent-area RGB is not the rendered background. |
| `hanging-j.webp` | One striped larva, rear attached above, head curved upward at the lower end; small front legs visible. | J pose and load-bearing relationship are readable. Segment-by-segment scientific validation was not performed. |
| `molt.webp` | One active caterpillar plus a small collapsed skin and separate old head capsule behind it. | The discarded head capsule belongs to shed material; it is not evidence of a second living caterpillar. No obvious floating body or extra head on the live animal. |
| `emerging.webp` | One adult partly outside the opened shell, head down, compact wings and visible foot/shell contacts. | Emergence is readable. Shell color and simplified opening remain artistic reconstruction rather than an exact photographed moment. |
| `gripping.webp` | One adult beneath a thin empty shell, compact wings, a large abdomen, and supporting contacts. | Readable post-emergence body. Its branch and silk-pad position differs substantially from the original adjacent frames; see the R1 correction in AR-01. |
| `emerged.webp` | One supported adult beneath the empty shell, wings still compact. | No obvious duplicate adult or unsupported floating. Wing length differs from the previous view in a direction consistent with the intended later stage. |
| `adult.webp` | Four distinguishable wings, two larger forewings and two more rounded hindwings; feet visibly meet the shell. | Four-wing composition is readable. No obvious sex-pattern switch relative to the flight asset was found. Exact venation or minute morphology is not certified. |
| `flight.webp` | One isolated, open-wing adult; forewing and hindwing pairs remain distinct. | Used for the editorial departure; the recorded ending states were accepted. Static artwork is not evidence of realistic flapping kinematics. |

## AR-01 — emergence-frame suspension registration

**Original finding:** In the 1536×1024 source frames, the silk pad in `gripping.webp` was approximately one seventh to one sixth of the image height lower than in the versions now retained as `emerging-first.webp` and `emerged-first.webp`. The branch shape was recognizably related, but the entire support was vertically reframed.

**Impact before correction:** The chapter-eight media stack applies the same framing to these images. Switching through the original versions could make the supposedly fixed suspension point jump. The issue was visual registration, not proof of an anatomical impossibility.

**R1 source review:** The revised emerging and emerged candidates were compared against `gripping.webp`, `opening.webp`, and `hero-desktop.webp`. Their silk pads now occupy approximately x=1120, y=250 in the 1536×1024 canvas. The branch also follows the same broad arc. The original approximately 150-pixel vertical jump is no longer visible in these source candidates. Both revisions retain one adult, compact wings, the shell attachment, and readable foot contacts. There is no obvious new duplicate body or unsupported floating.

**Release status:** Resolved in the R1 sources and adopted as `emerging.webp` and `emerged.webp`; original full-size versions remain as correction history. The [finish review](finish-review.md) accepted TR07–08 and TR08–09 as readable matched-stage handovers in the saved states, including one body and visible emergence support. See the [TR07–08](../evidence/contact-sheets/transition-07-08.jpg) and [TR08–09](../evidence/contact-sheets/transition-08-09.jpg) contact sheets and the final CH08 captures above. This closes the observed registration/composition concern within that evidence; continuous motion and exact anatomy remain unverified.

| Revised candidate | Generation filename | Directly observed |
| --- | --- | --- |
| Emerging R1 | `exec-3e8f9aef-caea-49c0-8fca-c7d733c27203.png` | One adult partly outside a split shell, head downward, abdomen still partly enclosed, compact wings, and feet at the shell. The strongly green covering and simplified split remain artistic approximations of the moment. |
| Emerged R1 | `exec-fc85aba6-5282-426f-a663-e0188b09db6d.png` | One adult suspended from a thin empty shell; elongated but still folded wings, substantial abdomen, visible antennae, and foot contacts. The longer wings read as later than the gripping state. |

## AR-02 — J-stage and adult-stage support drift

The original source review found two further vertical-registration differences, distinct from the emergence-frame issue. Both corrections are documented below.

| Asset or candidate | Approximate silk-pad center, 1536×1024 | Continuity assessment |
| --- | --- | --- |
| `hero-desktop.webp` | x=1120, y=250 | Reference framing. One opaque jade pupa, no duplicate subject. |
| `opening.webp` | x=1120, y=250 | Matches the reference support; the first opening and head are readable. |
| `gripping.webp` | x=1120, y=250 | Matches the reference support. |
| Emerging R1 / Emerged R1 | x=1120, y=250 | Matches the reference support at the level of this visual review. |
| `forming.webp` | x=1120, y=250 | Matches the reference support; one green forming pupa with striped old skin bunched above it. |
| `expanding.webp` | x=1120, y=250 | Matches the reference support; one hanging adult with lengthening folded wings and a large abdomen. |
| Original `hanging-j.webp` | x=1110, y=105 | Approximately 145 pixels higher, about 14% of the image height. Replaced by the correction below. |
| Original `adult.webp` | x=1100, y=105 | Approximately 145 pixels higher, about 14% of the image height. Replaced by the correction below. |

**Impact before correction:** A shared full-frame crop could make the branch and silk pad move downward from J to forming, and upward from expanding to adult. This source drift was a continuity defect in a scene presented as one fixed attachment. Its direction and magnitude were visually clear; the rounded coordinates are not a pixel-registration analysis.

**Correction review:** Both replacement PNGs and their adopted full-size shipping WebPs were opened and compared with the reference. Their branch arc and attachment now share the reference framing, with the silk pads approximately x=1120, y=250–265. The original approximately 145-pixel displacement is no longer visible. The J frame keeps one larva attached at the rear, with the head curled upward at its lower end. The adult frame keeps one supported adult, four distinguishable wings, antennae, and visible foot-to-shell contacts. The full body and support fit within both frames; no obvious new duplicate, clipping, or floating-body defect was found.

| Adopted correction | Generation filename | Shipping asset |
| --- | --- | --- |
| Hanging J R1 | `exec-7b0b3d38-6b4b-4905-a39a-78d030acee9a.png` | `hanging-j.webp` |
| Adult R1 | `exec-cd072ecc-4cdd-443b-82dc-2e08aeb3015f.png` | `adult.webp` |

**Release status:** Resolved in the replacement sources and adopted full-size WebPs. The [finish review](finish-review.md) accepted the saved J and wing-stage handovers as a matched-still adaptation; the corrected schematic handover was also accepted in its replacement captures. Relevant evidence is the [TR04–05](../evidence/contact-sheets/transition-04-05.jpg), [TR05–06](../evidence/contact-sheets/transition-05-06.jpg), and [TR08–09](../evidence/contact-sheets/transition-08-09.jpg) contact sheets. This closes the observed source/composition issue without certifying frame-perfect motion, every responsive derivative, or minute anatomy.

## Five-instar comparison plate

Adopted source: `instars.webp`, returned as `exec-fb54bf94-d30e-4e47-be69-631f487b9508.png`.

Five horizontal rows show one head-right caterpillar each, on a narrow leaf surface. The top row is small, pale, and largely unstriped; subsequent rows show clear black, white, and yellow bands with increasing body size. No extra living body, detached duplicate head, or generated text is visible. Feet are small and partly occluded, so exact leg counting is not certified.

The gallery is an **illustrative five-instar comparison** with a schematic-size qualification. Body-length ratios and row spacing are compositional choices, not measured growth data. The first row is labeled generally as **First instar**; its fairly visible filaments are not presented as a precise depiction of the instant of hatching. Newly hatched monarch larvae are pale and lack the later bold stripes; the first instar also changes during its own growth. See [Monarch Joint Venture, Life Cycle](https://monarchjointventure.org/monarch-biology/life-cycle) and the distinctions in [biology.md](biology.md).

**Release status:** Finding 4 is resolved in the [finish review](finish-review.md). The native chapter crop and mobile body/lower views show five isolated, complete specimens with heads, tails, and filaments contained, and all labels and the schematic-size qualification retained. Evidence is linked in the release table above. The repair uses CSS framing of the original plate; it does not repaint the source artwork.

## AR-03 — supported resting adult in the ending

Adopted source: `departure-resting.webp`, returned as `exec-6ee03a3d-33ac-4a28-856f-ee28b5cbcc02.png` (`IMG-30`, 1536×1024).

**Directly observed:** One open-wing adult hangs below one pale empty shell. Four long supporting legs visibly reach the shell rim; two antennae and four distinguishable wings are present. The whole adult fits inside the frame. The branch and silk pad occupy the same broad position as `empty-shell.webp`, around x=1150, y=250. There is no obvious duplicated adult, detached supporting foot, or unsupported floating body in this source.

**Continuity limit:** The generation changes the shell's lower rim and hanging flaps, and some meadow detail, relative to the empty-shell source. It is not a pixel-identical background with an added adult. The final review accepted the supplied resting, completed, and reset compositions; that recorded-state acceptance does not certify the continuous swap or wingbeat mechanics.

**Release status:** Finding 1 is resolved in the [finish review](finish-review.md). The native chapter crop shows a complete supported adult at a credible relative scale, and the six desktop/phone-sized ending captures linked above show rest, the empty-shell result, and restored rest. The earlier unsupported resting composition is superseded. Exact anatomy and the subsequent departure's continuous motion remain outside this still-image verdict.

## AR-04 — twig-to-leaf spatial bridge

Adopted source: `branch-to-leaf.webp`, returned as `exec-edae06de-5127-4dd0-9c1f-833446c99712.png` (`IMG-31`, 1536×1024).

**Directly observed:** A brown twig crosses the upper-right; a green petiole continues diagonally toward the lower-left leaf underside. One small, opaque ivory egg with longitudinal ribs sits near the prominent vein. No chrysalis, caterpillar, adult, duplicate egg, generated text, or transparent mixed-stage animal is visible. The diagonal provides a readable spatial bridge between the twig and leaf imagery.

**Interpretive limit:** The petiole visibly meets the brown twig. This arrangement is an artistic connection between scenes; this review does not certify exact plant morphology or claim a photographed continuous plant. The reviewed transition retains an explicit retrospective cue. This still does not show a chrysalis changing into an egg.

**Release status:** Finding 3 is resolved in the [finish review](finish-review.md). The replacement TR01–02 states show twig, connected petiole, and egg-bearing leaf at 25% and 50%, followed by the egg close view. The [mobile midpoint](../evidence/mobile-transition-01-02-050-release.jpg) preserves that relationship and the retrospective cue. This closes the missing spatial-anchor finding for the supplied compositions.

## Alpha-channel check

`hero-subject.webp` and `flight.webp` contain alpha transparency. Sampled background pixels that appear black or colored in raw RGB have alpha zero, so those pixels are not a visible-background defect. The finish review traced the wide Hero's missing subject to an opaque CSS background on the foreground layer, then closed finding 6 after the 3840×2160 and 2560×1440 captures showed the full branch, attachment, chrysalis, and lower tip. That composed-layer correction is separate from exhaustive alpha-edge inspection. No shipping image was edited by this documentation review.

## Explicit limits

- Only the assets and candidates explicitly named above were opened in this review; it does not certify every source role or responsive derivative.
- No institutional source image is reproduced in this document.
- A plausible visible support and four wings are necessary production checks, not comprehensive scientific validation.
- The final **ship** disposition closes the six scored finish fixes on supplied composition/recorded-state evidence. It does not declare every image, biological detail, continuous transition, or unobserved runtime condition certified.
