# CARGO — Independent finish review

**disposition: recapture**

Review date: **2026-11-09**. Scope: **capture validity only**. The required CARGO browser evidence is absent, so visual and interaction acceptance remain blocked. This review assigns no aesthetic score, identifies no weakest chapter or transition, and grants no provisional shipping approval. A full independent review is required after valid captures are available.

## Recapture list

1. **Establish that the browser is displaying this production build.**

   Supply a capture manifest with the actual local URL, browser name/version, timestamp, build identity, CSS viewport, device-pixel ratio, motion setting, chapter/hash and state for every submitted capture. Open the served page and confirm that its title, CARGO content and BOX-001 belong to this project before capturing. The supplied handoff reports that the managed preview displayed the unrelated PULSE project and that the normal browser download failed. The retained [browser launch record](evidence/browser-launch.json) separately records that packaged Chromium exited before any page was created. These are blocker records; none supplies a rendered CARGO observation. This reviewer did not repeat the failed launch attempts.

2. **Supply the two missing required desktop and phone captures.**

   | Required path | Required capture | Why it is required |
   | --- | --- | --- |
   | `.impeccable/review/desktop.png` | Actual CARGO interface, settled opening composition, **1440 × 900 CSS-pixel viewport** | Establish the opening's real type, navigation, photograph, subject scale and text-safe composition. |
   | `.impeccable/review/mobile.png` | Actual CARGO interface, settled opening composition, **390 × 844 CSS-pixel viewport** | Establish the portrait source, actual reflow, title wrapping, visible controls and bottom navigation at the requested phone size. |
   | `.impeccable/review/desktop-full.png` | Full-page capture from document top using the same 1440 × 900 viewport | Make the implemented whole-page composition available without treating the hero as evidence for later chapters. |
   | `.impeccable/review/mobile-full.png` | Full-page capture from document top using the same 390 × 844 viewport | Expose the complete phone reading order and essential content. |

   These are requested output paths, not existing evidence. Preserve the actual screenshot pixel dimensions in the manifest when DPR differs from 1. Settle or disable entrance animation before the stable captures; allow the intended images and fonts to load. Open every submitted file and verify the claimed project, viewport, chapter and state, with no accidental blank, wrong-section or half-loaded frame. A full-page overview must be accompanied by readable viewport detail; it cannot carry fine typography or physical-continuity judgments by itself.

3. **Capture the six hero states and their repeatability.**

   At both required sizes, retain the first meaningful image, reveal, complete composition, living hold, first-scroll sequence and return state. Reuse the stable opening and boundary captures where they genuinely represent those states. Include a real browser recording or actions log for scrolling during the reveal, the Follow the container action and **three first-scroll/return cycles**. Compare the settled desktop opening with [AI-04](../art-direction/AI-04.webp) and the portrait opening with [AI-05](../art-direction/AI-05.webp). Those files are artwork references; their own generated image dimensions are not browser viewport measurements. The comparison must show the rendered English title, controls, grounded subject, crane, identity and return pose.

4. **Supply readable chapter and interaction evidence for the complete journey.**

   At **1440 × 900** and **390 × 844**, provide at least one representative real UI frame for every chapter, **CH-01 through CH-11**, organized under `docs/evidence/browser/desktop/` and `docs/evidence/browser/mobile/`. Record both substantive beats, the stable reading hold, each meaningful control's changed result, reset and return behavior in the accompanying actions log. Add detail frames whenever the representative capture cannot show those distinct states. Include the actual menu/dialog focus state, packing and door states, road/rail support choices, identity/location controls, lift inspection, port comparison and ending recap. This is the evidence needed to assess coverage, legibility, selected-box continuity and the ending; source structure and prose descriptions do not demonstrate those rendered outcomes.

5. **Supply all ten authored boundary sequences.**

   For **TR-01-02 through TR-10-11**, capture the actual interface at local progress **0%, 25%, 50%, 75% and 100%**, at both required viewport sizes: **50 checkpoints per complete path, 100 in total**. Use explicit names such as `TR-07-08-p050.png` inside the appropriate viewport directory and identify the boundary, progress and motion mode in the manifest. Retain short continuous browser recordings for **TR-01-02, TR-07-08 and TR-08-09**. Log slow forward movement, fast skips, reverse traversal, direct midpoint entry and entrance/exit threshold neighbors. The reviewer needs to see anchor continuity, support/contact, opaque occlusion and caption ordering in the actual interface. Compare the lift and yard/lift midpoint with [AI-06](../art-direction/AI-06.webp) and [AI-08](../art-direction/AI-08.webp) while preserving the project's explicit distinction between photographic plates and schematic studies.

6. **Supply the actual alternative-state and responsive observations required by the acceptance plan.**

   Capture representative results for reduced motion, image failure, unavailable/lost WebGL, delayed fonts/resources, keyboard focus and menu/dialog operation. The actions log must show that all eleven chapters and meaningful control results remain reachable in the full phone/still path. Record the additional risk-based viewport, breakpoint-neighbor, short-landscape and browser-zoom checks specified in [ACCEPTANCE-PLAN.md](ACCEPTANCE-PLAN.md), with actual outcomes and exact evidence paths. Unexecuted combinations remain untested. Static source checks cannot establish browser overflow, focus visibility, touch geometry, readable moving backgrounds or recovery after a late resource.

7. **Keep the existing evidence in its demonstrated scope and resubmit for a full review.**

   The inspected [detector result](evidence/design-detector.json) is `[]`. It records no findings from that detector run; it supplies no rendered design verdict. [DESIGN.md](../DESIGN.md) and its [sidecar](../.impeccable/design.json) explicitly describe source-derived intent with unverified rendered fidelity. The [asset provenance](ASSET-PROVENANCE.md) documents retained generation outputs and their roles. The [model contract](model-contract.md) limits its checks to schematic geometry and state behavior. The image at [evidence/non-browser/fallback-contact-sheet.png](../evidence/non-browser/fallback-contact-sheet.png) is a labeled direct rasterization of standalone SVGs. It is excluded from website screenshot evidence and has not been judged as a browser UI capture.

   Retain these records alongside the new captures, and update the evidence ledger with actual browser results. Send the valid desktop, phone, chapter, transition and state packet for a **fresh full independent review**. This recapture disposition establishes no aesthetic findings that a limited verdict-only pass could close. Until that review occurs, the two weakest non-hero chapters, weakest transition, correction quality and whole-interface finish remain unassessed. No implementation edits, browser servers, installs or publication actions were performed by this review.
