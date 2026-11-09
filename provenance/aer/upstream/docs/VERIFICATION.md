# AER — Verification record

Recorded 2026-11-09. This file distinguishes implemented behavior, observed checks, source differences, and unverified conditions. **The original visual contract has not fully passed.** The four source-level differences are listed in [KNOWN-GAPS.md](KNOWN-GAPS.md).

## Automated checks actually executed

| Check | Observed result |
| --- | --- |
| `npm run check` | TypeScript passed; **25 tests passed, 0 failed, 0 skipped**, Node v24.22.1 |
| Journey and physics | 14 cases: full common-prefix state; fixed reduced views; shared decision; forward/reverse boundary continuity; three distinct suffixes; exact integrated increments; independent fine integral; continuous wind; final terrain contact; fixed sun projection; arbitrary seek/history; fixed-volume force accounting; monotonic payload; finite invalid-input defaults |
| Keepsake and route diagrams | 8 cases: deterministic self-contained SVG; 16-gore vector identity; common projection; true route geometry; all alternatives; noncommitting previews; English/no active external content; portable filenames |
| Scene CPU invariants | 3 cases: drawing-buffer pixel bounds; reversible four-rope mouth attachments; landing-mesh triangle interiors above finer terrain |
| `npm run build` | Passed: Vite 8.3.6 production build; relative asset paths; all local fonts and images included |
| Node local-server checks | Syntax and help passed. Twenty-one focused resolver/argument checks were performed by the reviewer without opening a listener, including traversal, encodings, nulls, invalid ports and symlink containment |
| Asset provenance | Ten distinct originals; all dimensions and SHA-256 values matched the generation records; all eight runtime image roles present |

The Three.js chunk remains about 603 kB before gzip / 154 kB gzip and is lazy imported. Vite reports its configured 600 kB chunk warning. It is not hidden or treated as a performance measurement. Main JavaScript is about 63 kB / 22 kB gzip. These are build byte sizes, not load-time or FPS claims.

## Actual browser observations

The available cloud browser was Chrome. The site was exercised through the managed local preview, using a real 1440×900 or 390×844 CSS iframe. The browser reported **GL_VENDOR / GL_RENDERER: Disabled**. Its successful scene observations therefore concern the SVG fallback, not live GPU rendering.

| Action | Observed result and scope |
| --- | --- |
| Desktop opening, 1440×900 | Actual screenshot retained. Headline occupies the left sky; the complete balloon, mouth, rigging, basket and two people remain visible. |
| Mobile opening, 390×844 | Inspected in browser. A title/crown crowding issue was found and corrected; the corrected one-line title layout was visually observed. The final subsequent text-size increase did not receive a successful saved screenshot. |
| Ground experiment presets | Actual buttons produced heavy (weight 1.136), balance (1.000), rising (0.888), while gross support remained 1.000. |
| Payload and keyboard | Heavy payload increased weight at unchanged warmth; keyboard Home set the slider to its lower endpoint; Reset restored standard load and balance. |
| Three wind choices | High, middle and low were each selected with real controls, followed by chapter-menu navigation back to CH05, forward to CH07 and then CH10. |
| Causal reverse check | The complete CH05 state was byte-for-byte equal across all three route choices at progress 4. The common position was (0, 26, 0), and all shadow fields were identical. |
| Three resulting landings | High: Far Meadow; middle: Willow Bend; low: Hedgerow Meadow. Every final scene reported ground contact and its receipt/keepsake destination matched. Actual numeric states are in `evidence/browser-observations.json`. |
| Three branch images | Low loaded `k-08-low.webp`; middle loaded `k-08.webp`; high loaded `k-08-high.webp`. All three reported ready. |
| Reduced motion control | Native menu selection changed the mode to reduced and retained the route; reduced scene/still content remained in the accessibility tree. Final fixed-state fallback integration is additionally covered by shared-helper source/tests, not a completed visual-motion pass. |
| Final source corrections | The last successful accessibility snapshot showed both CH02 images, CH05 two stills, and CH10's grounded balloon/crew/rope tableau in the mobile layout. This is structural evidence, not a new complete visual pass. |
| SVG/PNG download | Attempted. The browser-control transport timed out/reset before a successful download path was returned. **Actual browser file download and PNG output remain unverified.** Vector generation and contents were separately tested and rendered with Inkscape. |

### Resource and infrastructure observations

The shared managed preview changed to an unrelated parallel project during testing. That caused an initial missing panorama; AER kept the selected route's fallback illustration. Restoring this project's preview and selecting all three layers loaded all three correct images. This is an observed failure/fallback case, not a controlled network-throttling or out-of-order response test.

The connected local Browser plugin could not reach the managed preview. The cloud browser later repeatedly returned screenshot, DOM snapshot and attach/control timeouts. New tabs and a production build were attempted. Remaining checks were not converted into assumed passes. A later CSS test fixture explicitly uses `?view=illustrated` to avoid GPU initialization; this does not establish WebGL visual correctness.

## Responsive and interaction coverage

| Requested environment/check | Status |
| --- | --- |
| 390×844 | Opening visual inspection and final accessibility structure observed; full final ten-chapter scroll traversal unverified |
| 1440×900 | Opening screenshot, experiment, menu, reduced-mode selection and three-route reverse/final-state checks observed |
| 320×700, 360×640, 768×1024 | Prepared in the fixture; attempted resize sequence did not complete; **unverified** |
| 1920×1080, 2560×1440, 3840×2160 | Responsive source rules and bounded CPU drawing budget exist; visual checks **unverified** |
| 680/681 breakpoint, short-height landscape | Fixture entries exist; final browser checks **unverified** |
| Real 125% / 150% / 200% browser zoom | **Unverified**; equivalent CSS-size entries are not claimed as zoom tests |
| Physical Android/Windows/Safari/Firefox devices | **Unverified** |
| Full ordinary-scroll journey and all nine 0/25/50/75/100% boundaries | **Unverified**; not all requested choreography is implemented, as detailed in KNOWN-GAPS.md |
| Modal Escape/focus, exhaustive keyboard, screen reader | Semantic/native implementation present; complete manual pass **unverified** |
| Offline/reconnect, slow fonts, late A→B→C resources, background return, history restoration | Guards implemented; complete controlled browser recovery matrix **unverified** |
| FPS, Lighthouse, hardware memory/leaks, thermals | **Not measured** |
| WebGL context-loss/restoration visual behavior | Handlers implemented; actual restored-GPU observation **unverified** |

## Important repairs included

Mobile headline placement and readable control sizes; coalesced layout measurement; reserved panorama dimensions; latest-target image ownership; late-font navigation protection; full local progress; correct millisecond ambient time; accessible sound names; unique SVG IDs; fixed resting mouth/rigging; terrain-safe underlay and landing triangulation; correct branch landmarks; ground-following final rope; finite drawing buffers; shared reduced states; simultaneous mobile/reduced shape comparison; two reduced shadow studies; visible grounded ending tableau.

## Independent final archive check

The final ZIP is extracted and rebuilt after it is created. Exact commands, archive hashes, installation/build results and the production-preview evidence boundary are reported in the accompanying **AER-DELIVERY-REPORT.md**, so the archive itself can remain unchanged throughout its independent verification. No test here is a substitute for the uncompleted visual checks above.
