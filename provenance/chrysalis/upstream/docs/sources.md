# Scientific source record

Reviewed: **9 November 2026**. Subject: **monarch butterfly, _Danaus plexippus_**.

The public content is an illustrated explanation. Its recurring individual, leaf, lighting and nearby pupation support are editorial continuity. They are not records of an observed animal. No source artwork has been copied into the project.

## Reviewed sources and exact scope

| ID | Source | Scope used | Chapters |
| --- | --- | --- | --- |
| fws | [U.S. Fish & Wildlife Service — Monarch](https://www.fws.gov/species/monarch-danaus-plexippus) | Species identity, milkweed dependence, five larval instars, green-and-gold pupa, adult stage. | 01, 02, 07, 11 |
| mjv-life | [Monarch Joint Venture — Life Cycle](https://monarchjointventure.org/monarch-biology/life-cycle) | Instar characteristics, feeding, visible late wing pigmentation and emergence. | 04, 05, 09, 10 |
| mjv-growth | [Monarch Joint Venture — Growth and Development](https://monarchjointventure.org/monarch-biology/growth-and-development) | Molting, adult development beginning before pupation, wing and flight-muscle growth. | 05, 08 |
| mjv-host | [Monarch Joint Venture — Why Milkweed?](https://monarchjointventure.org/monarch-biology/why-milkweed) | Specialized larval feeding on milkweed. | 02, 04, 11 |
| watch-biology | [Monarch Watch — Monarch Biology](https://www.monarchwatch.org/biology/) | Egg casing, hatching, larval/pupal anatomy and silk/cremaster attachment. | 01, 03, 06, 07 |
| mjv-pupation | [Monarch Joint Venture — Why do I not see many pupae?](https://monarchjointventure.org/faq/mowing-habitat-management/why-dont-i-see-many-pupae) | Mature larvae usually leave the feeding plant before pupation. | 06 |
| western-biology | [Western Monarch Milkweed Mapper — Western Monarch Biology](https://www.monarchmilkweedmapper.org/western-monarch-biology/) | Environmental variation in life-cycle development. | 09 |

These sources were consulted through current web retrieval and opened directly. The University of Florida page at `https://ask.ifas.ufl.edu/publication/IN780` was searched but direct opening encountered a redirect loop; it is not needed as a production citation.

## Scientific decisions that affect the artwork

1. **Continuity is composed.** The nearby pupation support retains the habitat without implying that every larva pupates on its original leaf. The site explicitly distinguishes the setting from the general behavior.
2. **The last larval molt is physical.** The larval skin and chrysalis are separate surfaces. Keep the attachment visible. No particle assembly or unanchored pupa.
3. **The inside view is explanatory.** It carries “Illustrative reconstruction.” The shell silhouette is a registration guide; the drawing is not direct observation or a comprehensive organ map.
4. **The late pattern is pigmentation.** Do not suggest the shell turns into transparent glass. Preserve its surface around the visible pattern.
5. **Emergence and flight are different beats.** Show folded, expanding and settled wings as selected poses. Do not imply equal intervals or a measured time-lapse.
6. **The five specimens differ in more than size.** The content index emphasizes bands, head and filaments. Display sizes are illustrative, not a scale bar or a claim of measured specimens.

## Copy and evidence boundaries

- The original brief's chapter titles, leads and editorial headings are retained in `src/content.js`.
- Source-backed biology is separated from directions to inspect the artwork.
- Developmental durations, body dimensions, survival rates and migration distances are deliberately omitted: none is needed for the story's learning outcomes.
- No hatch-count, survival guarantee, universal time-to-emergence or diagnosis is presented.
- The project is an observation experience. It does not instruct visitors to handle, relocate, rear or intervene with wild larvae or pupae.
- Scientific references provide evidence, not a license to reuse photographs, figures or institutional logos. No endorsement is implied.

## Content audit

`src/content.js` provides eleven chapters, each with two separate content beats and the required exact editorial lead. It additionally exports the homepage copy, five instar captions, three emergence captions and an interpretation statement. Strings are English. Each chapter includes source IDs resolved through the exported source list.

This record verifies editorial source use, not final visual anatomy. The build's generated images and diagrams still require the independent visual checks documented in the acceptance ledger.

## Technical references and review scope

| Primary reference | Scope used |
| --- | --- |
| [Lenis documentation](https://github.com/darkroomengineering/lenis) | Real Lenis integration with one requestAnimationFrame owner, resize and native scroll synchronization. The installed version is pinned in the lockfile. |
| [Playwright — Visual comparisons](https://playwright.dev/docs/test-snapshots) | Reviewed on 9 November 2026. Screenshot comparisons depend on the rendering environment. Saved screenshots in this project are observed evidence, not golden-image regression passes; the standalone Playwright browser installation was blocked. |
| [W3C — Understanding SC 2.2.2: Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) | Reviewed on 9 November 2026. The interface offers motion and still-view controls; this review does not establish WCAG conformance. Scroll-linked observations and user-triggered flight are distinguished from prolonged automatic motion. |

No numerical performance capability, physical-device coverage, accessibility certification, or automated visual-diff pass is inferred from these references.
