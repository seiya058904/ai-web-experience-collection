# ODDS — implementation and acceptance report

**Delivery date:** 9 November 2026  
**Version:** 1.0.0, local source delivery  
**Overall status:** Implemented and buildable; automated checks pass; **full browser acceptance is blocked and incomplete**.

This report separates implementation, automated evidence, actual browser observations and remaining work. It does not equate a successful build, a generated concept, a finite SVG or a passing test count with visual acceptance.

## 1. Delivered scope

- Ten English-language chapters with distinct explanations, scenes and native controls.
- Nine locally evaluated, reversible transitions. Scroll, resize and display changes never submit a new experiment.
- Eight separately generated visual-development images, covering all eight required roles, plus a ninth generated production texture.
- A seeded binomial engine, exact enumeration, saved sample identities, independent experiments, replay, restoration and live SVG export.
- One manually advanced Lenis instance; native scrolling and stable scenes in reduced-motion mode.
- SVG apparatus and charts; Canvas 2D portrait with an SVG fallback and equivalent DOM sample/data controls.
- A self-contained `ODDS-Offline.html`, production output in `dist/`, source, lockfile, Windows launch scripts, research, design specification, provenance and license notices.

The project has not been deployed, published, pushed to a repository, submitted as a PR/Release, or added to an existing Collection.

## 2. Ten-chapter ledger

| Chapter | Implemented experience | Evidence level |
| --- | --- | --- |
| CH-01 — Every chance leaves a trace. | Separate personal entrance round, eight-step path, exact endpoint, pause/step/result playback controls. | Real browser: initial Hero and one explicit drop; saved result also survives reload. Engine/state/render tests. |
| CH-02 — Left. Or right. | Four independent one-step choices; keyboard arrows inspect without altering results. | Content present in browser DOM. Action/state/render tests; full browser input path unverified. |
| CH-03 — More paths than places. | Sixteen exact four-choice routes, endpoint/prefix filters, selected route and reset. | Enumeration tests verify 16 unique routes and six central routes. Browser interactions unverified. |
| CH-04 — The middle has more ways in. | Exact eight-layer weights, nine endpoints, probability explanation and source links. | Exact coefficients and unit tests. Full visual inspection unverified. |
| CH-05 — Small samples have character. | Two independent 16-ball rounds, shared expected-count scale, new pair and undo. | State, scale, totals and geometry tests. Browser input/appearance unverified. |
| CH-06 — A different leaning. | New 64-ball experiments at p=0.25/0.50/0.75, expected markers and previous-round restore. | Parameter isolation, counts and rendering tested. Browser input unverified. |
| CH-07 — Same rules. Different evenings. | Three fixed seeds at 16/64/128, shared scale, preserved prefixes; vertical mobile arrangement. | Prefix and shared-geometry tests. Responsive layout unverified in browser. |
| CH-08 — A portrait of 256. | Only the middle teaching round; 256 unique IDs, selectable paths, endpoint filtering and previous/next controls. | 256 identities, Canvas/SVG single ownership and fallback tests. Actual canvas clicking and phone layout unverified. |
| CH-09 — Give chance a set of rules. | n=4/8/12, p=0.25/0.50/0.75, N=16/64/256; run, replay, new round, restore and SVG download implementation. | All 27 rule combinations, saved result and SVG data tests. Browser download event unverified. |
| CH-10 — Still worth watching. | Current workbench rules, exactly one appended sample per action, updated export and return links. | N+1, n+1 slots, old-prefix retention and export-content tests. Full browser ending/return path unverified. |

All ten headings and native control structures were observed in the browser accessibility tree. That observation does not establish that every chapter was individually visible, usable or visually correct.

## 3. Nine-transition ledger

The tests execute the actual scene renderer at all 45 standard checkpoints for both desktop and mobile layout flags. They check finite geometry and data ownership. **These are not 45 browser screenshots and do not establish smooth continuous scrolling.**

| Boundary | Implemented handoff | Specific automated evidence |
| --- | --- | --- |
| TR-01-02 | Full board approaches its first fork. | Saved entrance result remains independent; finite scene output. |
| TR-02-03 | One fork unfolds into four levels. | Partial structure does not claim a complete 16-route enumeration. |
| TR-03-04 | Four levels extend to eight, then become exact path weights. | Expansion ends at 75%; full levels occur at 0/.1875/.375/.5625/.75. Partial layers are not assigned a false complete layer count. |
| TR-04-05 | Path counts → probabilities → 16×probability → separate observations. | Units change explicitly; central expected count stays 4.375, never rounded into a promised observation. |
| TR-05-06 | Previous pair recedes as the saved bias apparatus enters. | No experiment action is called by narrative rendering. |
| TR-06-07 | Saved bias round hands over to a separately labelled fair comparison. | Independent seeds and probabilities remain intact. |
| TR-07-08 | Middle tray expands; its prefix grows to 256 after the midpoint. | Existing coordinates/IDs persist; side rounds are not added; SVG and Canvas do not draw duplicate spheres. |
| TR-08-09 | Selected teaching journey gives way to the separate workbench. | Selected sample remains legal; personal parameters are not inferred from the teaching round. |
| TR-09-10 | One observed-column layer interpolates back to the board. | A single owner draws each observed count; source and target bar layers are omitted during the handoff. Current n, p, N and seed remain unchanged. |

Forward/reverse equivalence and direct jumps are tested as pure narrative evaluations. Slow/fast continuous scroll, boundary-adjacent screenshots, visual brightness and motion rhythm remain unverified in a real browser.

## 4. Automated and build verification

The final source suite reports **60 passed, 0 failed, 0 skipped**:

| Area | Tests |
| --- | ---: |
| Probability engine, validation and export | 14 |
| Explicit actions and saved state | 14 |
| Narrative progress and unit semantics | 11 |
| Chart positions, counts and renderer ownership | 12 |
| Actual scene output and handoff ownership | 9 |
| **Total** | **60** |

See [test-results.txt](../evidence/test-results.txt). No test requires a random sample to look symmetric or unusually close to theory.

Completed commands:

```sh
npm ci --no-audit --no-fund
npm test
npm run portable
node scripts/verify-package.mjs
```

`npm run portable` runs TypeScript checking, the Vite production build and standalone HTML packaging. An archive was extracted into an independent directory without `node_modules`; locked installation and the same checks completed there. The rebuilt standalone file was byte-identical to the source build at that checkpoint. The final archive is checked again after packaging.

A managed production-preview process was started from the independent checkout and reported running, then stopped. Its temporary test-only `dev` entry forwarded to the existing `npm run preview` script to use the required preview daemon. The delivered package retains its normal scripts. **Production browser traversal was not performed.**

The packaging integrity check verifies local build dependencies, relative asset URLs, all eight art roles, embedded offline fonts/material/favicon, preserved runtime license notices and absence of absolute workspace dependencies in the standalone application. A relative build base is established in code; actual browser hosting under a nested URL remains unverified.

## 5. Actual browser evidence

| Observation | Scope and result |
| --- | --- |
| Native desktop opening | Initial browser viewport recorded as 1363×936 CSS px. English language marker, ten chapter structures, title and nine-slot board present; no horizontal overflow found at that initial check. |
| First explicit drop | One sample started a separate entrance round. Its eight displayed directions included three right turns and ended at slot 3. The six-ball teaching demonstration was not counted as personal history. |
| Reload | The saved one-ball entrance result and path remained visible. |
| Final desktop still | [hero-desktop-native.jpg](../evidence/hero-desktop-native.jpg), 1355×931 captured raster pixels. Clear headline/action, complete nine slots and saved path. |
| 1440×900 CSS viewport | Same-origin iframe measured width 1440, height 900, document scroll width 1432, ten chapters and language en. Only the Hero was captured. |
| Viewport evidence | [hero-1440x900.jpg](../evidence/hero-1440x900.jpg), 1460×1048 raster including the acceptance wrapper. Its toolbar overlaps part of the wrapper capture; this is not a defect observed in the application's own header. |
| Browser console | An extension metadata error was observed, from a browser-extension URL. It was not attributed to application code. No application error was observed during the limited successful Hero inspection. |

The early [first-desktop.jpg](../evidence/first-desktop.jpg) predates the in-flight-sample fix. It is retained only as defect history and must not certify the final behavior.

### Browser blocker

The shared preview endpoint was repeatedly replaced by other project previews. Subsequent inspection returned an ordinary missing-route page, and a later reload/observation was rejected by the browser security policy with a URL/protocol authority error. Browser work stopped at that rejection. No alternate browser-control surface, raw browser protocol, local-file bypass or network-policy change was used.

A direct local-file browser opening was also refused by the browser's HTTP/HTTPS-only policy. Therefore the offline file's resource completeness is checked, but **actual `file://` execution is not verified**.

## 6. Fixed defects and evidence

| Defect | Change | Verification |
| --- | --- | --- |
| Moving Hero ball also appeared in its final slot. | Remove that sample from the resting layer until playback completes; keep one moving sample ID. | Scene regression test; settled final desktop screenshot. The entire in-flight playback after the fix was not re-observed. |
| Mobile sound icon lacked a reliable name. | Explicit English on/off accessible label. | Source and accessibility-tree observation; full screen-reader workflow unverified. |
| Form looked identical to saved rules after appending to N=65. | Draft note now states saved n,p,N and explains that form controls apply only to the next run. | Source review; full browser scenario unverified. |
| Three mobile comparison trays were horizontal. | Three vertical boxes with a shared scale; middle box interpolates to the same portrait geometry. | Renderer tests; mobile screenshot unverified. |
| TR-03-04 metadata reported layers at different times from the drawing. | Match the 75% expansion phase and label partial layers honestly. | Narrative and actual-renderer tests. |
| Last transition faded two observed result layers across one another. | One interpolated result layer owns every column. | All five checkpoints checked for unique observed ownership. |
| Mobile opening placed the apparatus before the title. | Keep the title in document flow; measure its end and begin the apparatus below it. It later pins under the header. Increase mobile SVG labels. | Final source/type/build checks. **No browser revalidation is claimed.** |
| Canvas hit test chose the first overlapping target. | Choose the nearest eligible sphere; keep native endpoint/sample controls. | Source review; actual canvas pointer selection unverified. |

## 7. Visual review and remaining design gaps

An independent reviewer inspected IMG-04, IMG-05 and both final desktop captures. The warm cream, blue apparatus, orange ball, readable headline, nine complete slots and reserved spacing are established in the desktop Hero.

The reviewer also found material differences from the photographic concept: the actual board occupies less page width, the pins/texture are softer, and the contact shadow is lighter. The current source must **not** be described as having achieved exact photographic fidelity or the brief's 55%–62% board-width target. There is no free-camera 3D or calibrated mechanical collision model.

The mobile title order was corrected in source after that review. Mobile text scaling, contact shadows, touch interaction and the new layout still require actual browser confirmation. With browser access blocked, these changes are delivered with their evidence limit rather than certified by inference.

## 8. Explicitly unverified

- Complete 390×844 and 1440×900 journeys, all chapters' two beats, ending→beginning and direct-late-chapter return.
- 320×700, 360×640, 768×1024, 1920×1080, 2560×1440, 3840×2160, breakpoint neighbors and short landscape in browser.
- Browser zoom at 125%/150%/200%, physical phones, touch hardware, Safari, Firefox and Edge.
- Continuous forward/reverse/fast scrolling, scrollbar drag, interrupted reveal, history restoration and all nine five-frame visual sets.
- Actual reduced-motion switching, complete keyboard/modal focus behavior and screen-reader interaction.
- Actual download event, local-file storage behavior and execution of the Windows CMD scripts.
- Slow/missing font or image conditions, background/resume interaction, memory growth and long-running lifecycle behavior.
- Cold-load timing, first meaningful visual, complete Hero timing, interaction timing, Lighthouse, hardware FPS and throttled-device benchmarks.
- Production browser main path and browser-served nested base path.

WebGL is not a runtime dependency. Canvas failure is covered by a renderer test that keeps the SVG portrait, but an actual browser graphics failure was not induced.

## 9. Local use and continuation

For the simplest file, use `ODDS-Offline.html`. Its expected use is direct opening in a modern browser; the environment did not allow that browser test. The verified source build path is:

```sh
npm ci
npm run build
npm run preview -- --host 127.0.0.1
```

The initial dependency install needs network access. Windows helpers are supplied and statically reviewed; their actual execution remains unverified.

When browser access is available, `tests/browser-harness.html` exposes measured CSS viewports, chapter navigation and per-boundary checkpoints through normal controls. The buttons scroll the real document; they do not inject internal narrative state. The iframe is a CSS layout fixture, not an emulated device or hardware benchmark.

**Acceptance decision:** source and resources delivered, deterministic checks and build reproduction passed, desktop Hero partly verified; full artistic/browser acceptance remains open.

