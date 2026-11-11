# CARGO — Sources and factual boundaries

Reviewed on **2026-11-09**. This register separates public-source facts, authored fiction, and visual simplifications. The project is an illustrative editorial experience, not an equipment specification or handling guide. No source artwork is reused.

## Selected container

BOX-001 is a fictional **20-foot standard general-purpose container**, using the following nominal external envelope throughout the authored geometry:

| Property | Value | Evidence |
| --- | --- | --- |
| Length | 6,058 mm / 6.058 m | Hapag-Lloyd container specification, printed page 5; BIC size/type table |
| Width | 2,438 mm / 2.438 m | Hapag-Lloyd container specification, printed page 5 |
| Height | 2,591 mm / 2.591 m | Hapag-Lloyd container specification, printed page 5; BIC size/type table |
| Type | Standard general purpose; 20-foot, 8-foot-6-inch height | BIC size/type guide; Hapag-Lloyd 20-foot standard page |
| Exhibit identity | CARGO / BOX-001 | Authored fiction; not an official owner or registration number |
| Paint and damage | Oxidized red, with one stable upper-right-door scratch | Authored continuity markers |
| Cargo | Repeated arrangement of abstract packing blocks | Authored illustration, not a loading plan |

The dimension source is a public primary publication by an equipment operator; the underlying ISO dimension tables were not purchased or reproduced. The project does not claim manufacturing certification, engineering tolerances, a measured physical asset, safe payload, stacking rating, or certified lifting compatibility. All distances in the model are visualization coordinates based on the external envelope above.

**Interior boundary:** Hapag-Lloyd's current 20-foot page gives one fleet example with an interior of 5,900 × 2,352 × 2,395 mm and a door opening of 2,340 × 2,292 mm. That page explicitly says manufacturers differ. These example values can guide visual plausibility but are not universal normative interior dimensions. Where the model simplifies wall, floor, fitting, hinge, gasket, locking-bar, chassis or spreader details, those details must be described as schematic. No sourced cargo capacity is displayed.

## Subject facts

| ID | Verified statement | Primary source and exact scope | Public-use boundary |
| --- | --- | --- | --- |
| F-01 | ISO 668:2020 concerns Series 1 container classification, external dimensions and ratings, with certain minimum internal and opening dimensions. | [ISO 668:2020](https://www.iso.org/standard/76912.html), official abstract; publication January 2020, edition 7, amendment listed for 2022. | The public abstract supports the standard's scope. It does not expose all normative tables. ISO identifies the relevant ISO 1496 part as authoritative for internal dimensions. |
| F-02 | ISO 1161:2026 is a published revision covering corner and intermediate cast fittings. | [ISO 1161:2026](https://www.iso.org/standard/86404.html), official abstract and lifecycle; edition 6, October 2026, publication milestone 16 October 2026. The lifecycle marks ISO 1161:2016 withdrawn. | Refer to the 2026 edition. The abstract describes dimensions and functional/strength requirements; it is not evidence for an exact hole size, tolerance or load rating. |
| F-03 | The selected standard 20-foot external envelope is 6,058 × 2,438 × 2,591 mm. | [Hapag-Lloyd container specification](https://static-cf.hapag-lloyd.com/content/dam/website/downloads/local_info/HPL-CONTAINER_SPECIFICATION.pdf), PDF page index 3 / printed page 5, external dimension table; corroborated by [BIC size/type codes](https://www.bic-code.org/size-type-code/). | Nominal exterior only. No operator's logo, unit registration, certification plate or fleet photograph is reused. |
| F-04 | Actual interior and door measurements can vary by manufacturer. | [Hapag-Lloyd 20-foot standard](https://www.hapag-lloyd.com/en/services-information/cargo-fleet/container/20-standard.html), example dimensions and manufacturer caveat. | Keep illustrative packing inside the modeled walls and door aperture. Do not equate the external envelope with usable capacity. |
| F-05 | CSC provides a framework for container testing, inspection, approval and maintenance. | [IMO: International Convention for Safe Containers](https://www.imo.org/en/about/conventions/pages/international-convention-for-safe-containers-%28csc%29.aspx), official convention overview. | Do not fabricate a CSC approval plate, imply that BOX-001 was inspected, or present the scene as a complete handling procedure. |
| F-06 | Official identification uses an owner/equipment identifier, serial number and check digit; size/type marking is a separate category. | [BIC markings guide](https://www.bic-code.org/marking-of-containers/) and [BIC identification](https://www.bic-code.org/identification-number/). | BOX-001 is a visibly fictional exhibit identity. No valid-looking owner prefix, serial/check-digit sequence or shipping-company logo is invented. |
| F-07 | Common size/type notation distinguishes 20-foot length, 8-foot-6-inch height and general-purpose construction. | [BIC size/type guide](https://www.bic-code.org/size-type-code/), length, height and type tables. | Technical classification may appear in the source notes. The exhibit stencil remains CARGO / BOX-001. |

The date **2026-10** for ISO 1161 is verified, not extrapolated from the brief. The official lifecycle gives the more precise publication milestone **2026-10-16**. No claim about the detailed changes from the prior edition is made, because a full clause-by-clause comparison was not available in this review.

## Fiction and visual interpretation

The route, ports, coastlines, terminal geometry, warehouse, carrier, weather, cargo, operator, scratch, seal and event sequence are authored fiction. Images are generated industrial illustrations; they are not documentary records of a real shipment. Route recap links describe the story's chapters, not geographical tracking. No cost, carbon, voyage duration, distance, throughput, live-location or fleet-size metrics are asserted.

The shared external envelope and repeated fittings are the educational focus. Mechanical forms are illustrative, with stable contact, attachment and identity as visual constraints. A diagram is not a certification of load paths. The seal belongs to the fictional custody vignette and is never described as a universal guarantee of security.

The chapter phrase “a hundred times the scale” is poetic art direction, not a measured equipment ratio. To avoid an unsupported numerical claim in the public site, prefer **“A few meters of steel. An immense machine.”** Similarly, use **“a landscape of rectangles”** when the rendered yard does not visibly or verifiably contain thousands of units.

## Technical references consulted

| ID | Source | Verified guidance and implementation consequence |
| --- | --- | --- |
| T-01 | [Lenis official README](https://github.com/darkroomengineering/lenis/blob/main/README.md) | The documented GSAP connection uses a single Lenis instance, forwards Lenis scroll updates to ScrollTrigger, and advances Lenis from the GSAP ticker after converting seconds to milliseconds. Disable the separate automatic RAF when using that ticker. Include the package CSS. Anchors need explicit support. |
| T-02 | [Lenis official package metadata](https://github.com/darkroomengineering/lenis/blob/main/package.json) and [releases](https://github.com/darkroomengineering/lenis/releases) | Public metadata reviewed here shows **1.3.27**. The installed version must be verified independently against the lockfile. Version 1.3.26 added reduced-motion preference support; the current README documents live preference changes. The website still needs a complete accessible still presentation. |
| T-03 | [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) | Boolean scrub follows scroll progress; numeric scrub adds a catch-up interval. With numeric scrub, animation updates can continue after scrolling stops. Refresh recalculates start/end positions; update reads the current scroll position. Instance kill removes its listeners and pinning state. Therefore one authoritative progress should drive all story layers, and measurements must refresh after layout-changing assets. |
| T-04 | [GSAP matchMedia](https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/) | Use the current GSAP media-query mechanism if separate animation setups are needed. The older ScrollTrigger-specific matchMedia API is marked deprecated in ScrollTrigger's reference. Cleanup must accompany responsive recreation. |
| T-05 | [Playwright visual comparisons](https://playwright.dev/docs/test-snapshots) | Screenshot comparisons are environment-sensitive and depend on reference baselines. They are useful for regressions but do not establish correct continuous movement. Inspect actual transition motion and record browser, viewport and conditions. |
| T-06 | [W3C WCAG 2.2, understanding 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) | Automatically moving information lasting over five seconds alongside other content needs an appropriate pause/stop/hide mechanism unless essential. The project applies its motion setting to incidental motion too. Passing selected checks does not justify claiming complete WCAG conformance. |

The main GitHub repository URL timed out twice during research. Its official README subpage and package metadata were subsequently retrieved successfully. No third-party mirror was used as authoritative evidence. A guessed BIC check-digit subpage was inaccessible; only the successfully retrieved official marking and identification pages support the published wording.

## Recommended concise detail-plate copy

These are authored paraphrases linked to the facts above, not quotations:

- **External dimensions:** “A 20-foot standard general-purpose container. External envelope: 6.058 × 2.438 × 2.591 m.” — F-03, F-07.
- **Corner fittings:** “Common interfaces let different transport systems meet the same box.” — interpretive explanation grounded in F-01 and F-02; show a schematic label where detail is simplified.
- **Identity:** “CARGO / BOX-001 is a fictional exhibit ID. Real container identification follows a separate international marking system.” — F-06 plus authored identity.
- **Interior:** “The walls define the outside. The opening and internal structure define what can fit.” — F-01, F-04; packing blocks remain illustrative.
- **Seal:** “Illustrative seal. A custody detail in this fictional journey.” — authored scene; no guarantee of security.
- **Carrier comparison:** “Conceptual transfer. One container, two support systems.” — authored comparison, without an operational instruction.
- **Ports:** “Illustrative locations. The route is fictional.” — authored geography.
- **Safety context:** “Real freight containers operate within approval and inspection frameworks.” — F-05.

## Evidence and rights

This review consulted public pages and a public operator specification. It records narrow facts and links; it does not redistribute ISO standards, copyrighted technical tables, third-party logos, photographs or source-page screenshots. The generated asset provenance and software notices are maintained separately by the implementation owner.

`source-review.json` preserves machine-readable dimensions, source URLs, retrieval outcomes and boundaries. Browser source references in that file identify this research session; normal web URLs above remain the portable references for the delivered project. Acceptance, performance and implementation correctness are determined by the project's actual build and browser evidence, not by this research register.
