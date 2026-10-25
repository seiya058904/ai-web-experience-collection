# GRID rhythm and experiment exit — Batch B (2026-10-25)

The source of truth is `experiences/grid/src/rhythm.ts`. A viewport travel unit is the current viewport height in CSS pixels. These are input distances, not viewing durations. Visitors can stop indefinitely, and experiments remain user-controlled.

Before this change all eleven intervals used 3.9 screens: 1.404 screens of reading/refinement and 2.496 screens of exchange. In the reproduced 1440×900 document, this meant 38,610px of travel; the first 1,264px of ordinary intervals mainly changed tracking, guides and folio position. Full forward wheel runs and twelve-scene contact sheets were reviewed at desktop and phone before editing.

## Twelve-chapter rhythm table

Reading and experiment allocations together map to the existing local `0…0.36` composition/refinement phase. Exchange maps to the original local `0.36…1` geometric handoff. The artwork's poses, nine nodes, photograph, font axes and handoff curves are unchanged.

| Chapter | Reading/refinement (svh) | Manual experiment allocation (svh) | Exchange (svh) | Reason |
|---|---:|---:|---:|---|
| 00 Zero | 0.850 | 0 | 2.496 | Retain the conceptual point and first baseline, shorten the quiet refinement |
| 01 System | 0.700 | 0 | 2.496 | Grid establishment carries the main action in its handoff |
| 02 International | 0.600 | 0 | 2.496 | Simple settled alignment needs the shortest reading refinement |
| 03 Basel / Tension | 1.200 | 0 | 2.496 | Allow the skew, displaced letterforms and anchors to be compared |
| 04 Type as image | 0.800 | 0 | 2.496 | Read the large letterform image, then let its exchange carry the change |
| 05 Editorial | 1.350 | 0 | 2.496 | Preserve a generous serif reading pause and photographic hierarchy |
| 06 Raw | 0.650 | 0 | 2.496 | Direct frame/collision reading; preserve the authored exchange |
| 07 Electronic | 0.800 | 0 | 2.496 | Inspect quantization without extending minor folio/guide changes |
| 08 Interface | 0.400 | 1.004 | 2.496 | Preserve the original total 1.404-screen inspection/experiment hold |
| 09 Variable | 0.400 | 1.004 | 2.496 | Preserve room for all four real font axes and Reset |
| 10 Synthesis | 1.000 | 0 | 2.496 | Give the resolved page a clear pause before guide removal |
| 11 No grid | Unbounded stopped view | Look again/navigation | 0 | Terminal composition has no forced outgoing travel |

Total travel is **38.214 screens**, previously 42.900. At 1440×900 this is **34,393px**, previously 38,610px; at 390×844 it is **32,253px**, previously 36,208px. Every authored exchange retains exactly 2.496 screens. Interface and Variable retain exactly 1.404 screens before exchange. The mapping and inverse are shared by real document input, Index, keyboard navigation, hashes, restoration and resize; no second progress easing or application clock is added.

## Experiment toolbar ownership

Both toolbars use their own existing scene coordinate. Unowned controls fade and move down at local `.32… .46`; the visual state is reversible and has no elapsed-time transition. `inert` removes interaction as visibility falls, then `hidden` removes the finished surface. Taking keyboard or pointer ownership latches a bounded grace: full controls through `.42`, followed by the same fade through `.56`. The grace persists during focus transfer so moving focus cannot snap the surface away. Before a focused toolbar becomes inert, focus moves with `preventScroll` to the always-available Index opener. Scrolling deliberately beyond the grace cannot leave an invisible focused control or retain tools indefinitely.

A pointer drag owns the current scroll until pointer release/cancel/window blur. Wheel is prevented only while that pointer operation is active. Release resumes the same Lenis instance when no native dialog or lifecycle suspension owns it. Native range keyboard input, actual Interface reflow, four font axes and their Reset actions are retained. Reduced motion selects a stable chapter and fully available controls at Interface/Variable.

## Evidence and limits

Evidence directory, outside the repository: `C:\Users\admin\.codex\tmp\flagship-b-20261025\collection-grid\`.

- `before-results.json` reproduces 38,610px/36,208px travel and the opacity-1-to-hidden toolbar discontinuity at both primary sizes.
- `before-grid-contact-*.png`, `before-video/`: all twelve endpoints plus the original full ordinary wheel traversal.
- `after-results.json`, `after-grid-contact-*.png`: all twelve compositions at 390×844, 768×1024, 1440×900, 1920×1080, 2560×1440 and 3840×2160; sampled `.34/.36/.38/.46` toolbar states and focus grace/exit.
- `after-toolbar-*.png`: primary-size complete boundary frames.
- `full-and-native-results.json`, `after-video/`: full forward/reverse wheel journeys, pointer ownership, native keyboard Index and source-return regression.

The six contact sheets were actually inspected, together with selected full endpoint and toolbar frames. These are Chromium 156.0.8078.4 (Playwright build 1248) viewport simulations at DPR 1, not physical mobile/high-refresh/4K-panel certification. Physical touch, iOS/Safari/Firefox and frame-rate claims remain NOT_RUN. Root owns the integrated build/project-base gates.

## Actual completion checks

Focused tests pass **29/29** (24 existing GRID cases, four new mapping/toolbar cases and the Collection native-Index contract); `tsc --noEmit` and scoped `git diff --check` pass. The initial mapping test exposed a floating-point terminal result just below eleven; the mapper now returns the exact terminal bound and the final cases pass.

Fast continuous forward wheel runs on fresh Vite 5183 reached all twelve chapter names at both primary sizes, without page errors. Desktop reached 34,393/34,393px and phone 32,252/32,253px; reverse runs settled within 3/5px of the opening in the recorded observation window. These are traversal observations, not FPS measurements. Actual range dragging changed width to 70/71%; wheel during the active drag moved the document 0px, and release restored scrolling (+322px in the following input). The earlier combined driver attempt queried a range before its programmatic scroll had settled after a full reverse; that attempt stopped without an acceptance result. The final driver uses the actual chapter navigation to acquire the experiment before testing its drag.

At both primary sizes, focused controls remain available at local `.38`, native keyboard changes take effect, deliberate travel to `.54` moves focus to Index before inert, and `.58` is hidden. Reduced-motion Interface and Variable retain full opacity and active native controls; all four axes respond to keyboard input. Arbitrary coordinate 9.2101050825 survives reload exactly; resize produces 9.2102064794 (integer document-pixel rounding), and a fresh Editorial hash arrives at 5.0007654153, inside the retained `.001` endpoint tolerance. See `mode-restoration-results.json` for raw values.

A second, slower complete traversal uses wheel delta 240 every 200ms (the retained .9 multiplier), rather than the earlier delta 667 sequence. Both desktop and phone reach the exact document maximum, 34,393px and 32,253px, and expose all twelve systems. `ordinary-results.json` records the inputs and video paths. The complete videos are 37.52/35.04 seconds; browser-decoded one-second contact sheets (`ordinary-wheel-contact-1440.png` and `ordinary-wheel-contact-390.png`, 37/35 sampled frames) were actually inspected for progression through the full journey and intermediate handoffs. The earlier full forward/reverse videos were also inspected through their 26/25-frame sequential contact sheets. Zero remains an intentional near-empty conceptual composition.

Bounded production-project-path smoke checks on freshly built 4175 pass at 1440×900 and 390×844: native Collection Index entry/return retains exact measured offset and focus; focused controls survive `.38`; `.54` visibly exits with inert and focus on Index; `.58` is hidden; reverse `.34` is interactive; arbitrary reload retains the exact document pixel; all nine content nodes remain; reduced-motion Variable keyboard input works. There are zero page errors or failed HTTP responses. See `production-results.json`. These production-preview observations are distinct from the integrating owner's full 366-test and root/project-build gates and from any external deployment.
