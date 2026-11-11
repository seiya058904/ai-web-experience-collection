# PAPERSUN — Independent visual fidelity review

## Review scope and status

Provisional review, 9 November 2026. This review is based on actual browser captures supplied by the implementation owner, independently compared with the selected generated artwork. It is not inferred from a successful build or from the presence of image files.

Reviewed references: AI-04 desktop hero, AI-05 independently composed portrait hero, AI-06 wind master, AI-07 late light reference, AI-08 midpoint master, and the attic/market/wind/valley/bridge production art. Reviewed actual captures: `docs/evidence/hero-desktop-initial.jpg` and `desktop-ch02.jpg` through `desktop-ch11.jpg`, both individually and in the contact sheet. Supporting layout observations come from `docs/evidence/desktop-chapters.json`.

The captures use a 1440 × 900 CSS application viewport inside a local QA harness, DPR 1, with a displayed capture scale of approximately 0.924. The harness controls above the app are excluded from this product review. These are desktop captures; a generated portrait concept alone is not evidence of mobile implementation quality.

**Current disposition:** the paper world and opening composition are established, but the initial browser captures need targeted material and reading-layer correction before visual acceptance. The two weakest non-hero scenes are CH-06 and CH-10. CH-10's shared disc treatment also affects CH-11. Transition review remains **NOT TESTED** until actual staged frames and motion evidence are available.

## What is visibly working

The opening faithfully preserves the selected art's important structure: a dark empty circle upper-right, one warm attic lower-right, visibly thick layered blue roofs and a red thread. The large serif title lives in the quiet left sky, with a readable lead and a clear thread-following action. It does not replace the circular absence with a moon. The initial capture shows no collision between the hero headline and its lead.

The market has a distinct scene identity: warm lanterns recede through separate stalls and the foreground failed lantern is visually identifiable. The bridge has a coherent curving route, red thread railing and a distant warm destination. The valley's large arch and pin remain readable. These environments belong to the same paper world while changing the observer's scale and emotional register.

The note uses a real three-shape diagram rather than baked fake lettering. Mira keeps the same cut-paper coat, face and joints across the inspected chapters. The exact geometric disc is reused between the repair sequence and the ending instead of switching to AI-07's unrelated generated seam pattern.

## Priority 1: CH-10 — The First Light

**Evidence:** `desktop-ch10.jpg`, `desktop-ch11.jpg`, and the AI-07 material reference.

The repaired disc currently has nearly uniform solid fills in three sectors, a perfectly smooth vector outline and a bright dotted seam. Against fibrous roofs and an irregular physical rim, it reads as a flat chart or illuminated graphic. This is most visible in the climax, where the repaired object is the largest and most important subject. The cream dots suggest beads or lights more strongly than red linen stitches.

**Concrete correction:** preserve every canonical A/B/C path and its exact fit. Add a restrained clipped paper-grain treatment inside those paths, with coherent warm shading and a small contact/inner-edge shadow. Keep the outer silhouette fixed. Make the stitching read as short red-linen strokes crossing the cut boundary, with small dark stitch holes, rather than large cream dots along the seam. The existing code geometry should remain authoritative; replacing it with the generated AI-07 sun would break identity.

The top-right navigation crosses the bright upper disc and fibrous rim. The pale `Chapters` and `About this experience` labels lose definition there. Give the navigation a restrained stable navy backing or comparable local contrast treatment without moving the aperture independently of the opening.

**Expected visible benefit:** the climax's focal object joins the surrounding handmade material language; the repaired seams become a narrative detail instead of a graphic overlay, while navigation remains legible.

**Retest required:** revised CH-10 and CH-11 stills; one close view of the assembled disc; CH-09→10 at 0/25/50/75/100%; return to the opening with the repaired state. Confirm texture and shadow do not alter fragment boundaries or conceal stitches.

## Priority 2: CH-06 — The Wind Hill

**Evidence:** `desktop-ch06.jpg`, AI-06 and the clean wind plate.

The production landscape retains the strong paper-grass depth of the master. The reading layer is less successful: pale body text passes over bright ivory grasses and lighter blue paper, especially in the two lower narrative paragraphs. Their detail competes with the words. The live rotor is recognizable and correctly placed near the pole, but its broad smooth cream faces are noticeably flatter and cleaner than the thick, irregular paper blades in the generated material reference.

**Concrete correction:** extend a soft navy reading scrim through the entire prose block, including the lower two beats, while preserving the right-side light and grass. Keep prose opacity high and consider increasing the lower narrative copy from 15 CSS pixels to a comfortable 16–17 CSS pixels if the reading hold has room. Add fine fibrous texture, a slight irregular edge treatment and coherent contact shading to the existing SVG rotor. Preserve its pin and rotation origin; do not reintroduce the removed baked blades.

The supplied CH-06 capture is vertically offset inside the harness and clips the upper rotor region and app header. This alone does not establish a product clipping defect. Obtain an uncropped full-app capture before accepting the wheel's framing.

**Expected visible benefit:** the viewer can read both beats without hunting for contrast, and the moving object feels cut from the same paper as the hill.

**Retest required:** uncropped initial, wheel-steady and released states; a reduced-motion still; one narrow viewport. Confirm the local scrim does not obscure the fragment or turn the scene into a flat dark card.

## Additional visible findings

| Finding | Evidence | Suggested correction or verification |
| --- | --- | --- |
| Lower prose crosses detailed or bright paper in several scenes | CH-02/03 desk edge, CH-04 roofs, CH-08 bridge, CH-10/11 roofs | Apply a consistent local reading surface behind the full prose measure; retain image detail outside that measure. Do not reduce text opacity to compensate for busy art. |
| CH-07 and CH-09 landing holds place their second beat beneath the footer region | CH-07 second paragraph ends at y≈905 CSS pixels; CH-09 at y≈935 in the supplied layout audit | Verify ordinary scrolling exposes the full paragraph with clear footer space. Adjust hold position, flow spacing or footer protection if the fixed footer continues to obscure it. The captures do not prove that these paragraphs are unreachable. |
| The empty repair target already displays complete bright seams at 0/3 placed | `desktop-ch09.jpg` | Distinguish the faint target outline from completed stitches. Show finished stitches only when the applicable pieces are placed, unless the user explicitly previews them; preserve a clear accessible state description. |
| Mira's feet in the bridge shot sit on the front face below the walking deck | `desktop-ch08.jpg` | Raise or slightly reposition her to align the soles with the bridge deck and add a compact contact shadow. Keep the same puppet design. |
| The additional roof route rises behind the puppet and into sky space | `desktop-ch04.jpg` | Inspect the route in motion and align its attachment points with practical roof/chimney supports. Avoid an unsupported character pose or thread seeming to pass through a roof. A single still is insufficient to judge the complete route. |
| Header labels cross roofs, rafters or the sun in several scenes | CH-02/03, CH-10/11 | A stable restrained top navigation contrast treatment resolves this without changing the scene geometry. |

No direct headline/lead overlap was visible in the supplied desktop chapter stills. This does not establish zoom, mobile or transition-midpoint readability. Those require their own captures.

## Aperture and repaired-disc fit

In CH-10 and CH-11, the golden disc appears seated within the same fibrous circular rim shown in the opening. There is no obvious radius jump or second sun in these stills. A thin dark lower edge remains, which can read as depth between paper planes. The supplied layout audit reports the same disc rectangle for both ending chapters: approximately x=904.1, y=17.6, width=418.1, height=418.1 CSS pixels.

This supports visual consistency between the two end holds. It does not prove mathematically exact aperture fitting or continuous alignment during the lift. The canonical fragment test and staged CH-09→10 captures remain the appropriate evidence for those claims.

## Transition review placeholder

**Status: NOT TESTED.** No complete 0/25/50/75/100% boundary capture set or continuous transition recording was available to this reviewer at the time of writing. The weakest transition must be chosen from actual evidence, not presumed from architectural risk.

Priority inspection when evidence arrives: CH-08→09 for an opaque arch handoff without double scenes, CH-09→10 for exact disc continuity, and CH-01→02 for lamp identity and title safety. Reverse motion, direct midpoint entry and pauses should be inspected separately from the stable chapter holds.

## Acceptance follow-up

Revise the two named weak scenes, capture the changed production rendering, and compare those exact captures with this initial evidence. Record the visible difference and any remaining limitation. Do not mark this provisional review as accepted solely because the implementation compiles or because a stylistic adjustment was committed.
