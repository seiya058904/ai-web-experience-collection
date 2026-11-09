# SILLAGE — final verification report

**Record date:** 2026-11-09.  
**Visual handoff decision:** SHIP for the reviewed local source-package scope.  
**Full G5 acceptance:** partial. Download-to-disk, effective browser zoom, OS preference changes, physical devices and performance/stress measurements remain unverified.

Results below come from observed commands, native browser actions, read-only DOM observations and an independent visual review. They do not constitute an all-platform certification. See `VISUAL-REVIEW.md` for the visual decision and `REQUIREMENTS.md` for the detailed acceptance map.

## Engineering, art and build evidence

| ID | Scope | Observed result |
| --- | --- | --- |
| U1 | State | 13 passing tests. All 5,151 nonnegative integer share triples totaling 100 were exercised through 92,718 edits. Bounds, zero cases, phase presence, state separation, title preservation and storage contracts passed. |
| U2 | Artwork | 9 passing tests. Deterministic contours, area/rhythm/depth response, exact zero omission, a neutral hollow, reversible separation, texture mapping, escaping and the flat fallback passed. |
| U3 | Transitions | 56 passing tests. Nine transitions at five progress values on both layouts, arbitrary forward/reverse evaluation, finite geometry, source isolation and unique IDs passed. |
| U4 | Final source and clean rebuild | Final source tests passed 78/78. An independently extracted candidate completed clean installation, a production build and another 78/78 test run. All 36 source/resource files and all 28 `dist/` files compared exactly. |
| A1 | Generated art | 12 genuine AI-generated originals, including the eight required independent outcomes, are recorded in `art-generation.json` with prompts, outputs and provenance. |
| A2 | Runtime art | 14 WebPs total 1,415,236 bytes, about 1.350 MiB. Responsive derivatives do not count as new generated originals. This is an asset inventory, not a transfer/performance measurement. |

The 92,718 redistribution edits are cases within a named test, not 92,718 tests. They cover every valid starting triple, each edited component and six selected next values; they do not exhaust arbitrary event sequences. The content import also established ten chapters, twenty substantive beats, three qualities, three stages and two memories.

```sh
npm ci
npm test
npm run build
```

Final production assets are `index-BnTJrWQm.js` and `index-CVm6gTD3.css`. Build and reproduction logs are delivered under `docs/g6/`.

## Browser observations

| ID | Scope | Observed result and evidence |
| --- | --- | --- |
| B1 | Principal layouts and transitions | All ten chapters inspected at 1440 × 900 and 390 × 844. All nine transitions inspected at five target progress values in each layout: 90 states. The final mobile TR09 correction was recaptured at all five values at 390px, and at 320px with a long CJK title plus its reachable action. |
| B2 | Native controls | Keyboard Index/focus, real bridge numeric editing, zero-share channels and manual Still mode were exercised. `docs/evidence/raw/final-functional-results.json` records 27 additional native control checks with DOM feedback and component presence. |
| B3 | PNG preparation | A real 2400 × 1600 PNG preview was generated and viewed. Editing invalidated the old preview. A second real preview succeeded with the bundled font files removed. Saving the image to disk remains unverified. |
| B4 | Additional responsive matrix | 27 states at 320 × 700, 360 × 640, 768 × 1024, 1920 × 1080, 2560 × 1440, 3840 × 2160, 760 × 900, 761 × 900 and 844 × 390 showed no reported horizontal or text overflow. Visual review still found a mobile TR09 phase collision; it was corrected and separately recaptured before SHIP. |
| B5 | Navigation and persistence | Actual reload retained 60 / 14 / 26 and a custom title. Native history returned to Chapter 9 and forward to Chapter 3. On the final independently rebuilt production page, reloading `#ch-09` retained 60 / 14 / 26 and “A quiet return”. |
| B6 | Failure fixtures | An actual image HTTP 404 produced the Chapter 8 three-phase/path fallback and working selection feedback. Removing bundled fonts still produced the 2400 × 1600 PNG preview. Explicit same-page retry recovery remains unverified because restoring files caused the preview environment to reload automatically. |
| B7 | Independently rebuilt browser path | At 1363 × 936, DPR 1, all ten chapters were reached through the real Index. Every visible HTML image was complete with positive `naturalWidth`; each chapter reported no fallback and no horizontal overflow. The loaded script matched the final JS bundle. Return reached scroll top 0 with default 45 / 20 / 35. `docs/evidence/raw/g6-return-hero.json` contains all ten DOM/resource checks. |
| V1 | Independent final visual gate | SHIP after the CH02/CH04 image-height correction, real TR08 controls, and final mobile TR09 phase-spacing correction. Details are in `VISUAL-REVIEW.md`. |

The 27 later control checks cover all Hero legend choices and restoration; CH02 isolation/restoration; all CH03 stages; CH04 Apart/Together; all three CH05 removals and restoration; CH06 Near/Middle/Far; both CH07 memories and clearing; and all CH08 highlights/reset. The custom title stayed unchanged through memory choices and demo controls did not overwrite the personal composition. These later checks were recorded in the font-file failure fixture using the same application logic; they are not a separate typography pass.

## Environment and evidence provenance

| Field | Recorded context |
| --- | --- |
| Runtime | Node 24.22.1; npm 11.9.0 |
| Locked dependencies | Lenis 1.3.27; Fontsource Cormorant Garamond and DM Sans 5.3.0; Vite 8.3.6; TypeScript 7.0.2 |
| Browser | Captured user agent reports Chrome/156.0.0.0 on Linux x86_64 in a managed browser environment. |
| Origin | `http://terminal.local:4173/`, with production, clean-build and explicitly named failure-fixture paths. |
| Viewports | Main CSS simulations: 1440 × 900 and 390 × 844. Native rebuilt-path observation: 1363 × 936, DPR 1. Additional sizes are listed in B4. |
| Hardware and loading | Physical hardware and throttling were not established. The preview parent preloads images, so observations use warm resources and cannot establish cold-load timing. |
| Evidence corpus | `docs/evidence/raw/` contains 160 browser screenshots and their 160 JSON observations. `docs/evidence/` contains 160 derived cropped views, 11 contact sheets and `final-crop-manifest.json`. Crops use recorded rectangles without retouching; manifest source/metadata paths point into `raw/`. |

Evidence filenames identify cases, not guaranteed exact progress. Final TR09 near-end observations include `.9991` and `.9950`; the separate long-title action capture records `1.0000`. Integer document-pixel rounding explains these small target differences. Controls become operable at `.72`, before the nominal 75% target.

Four TR06/07 midpoint JSON records list an offscreen Hero image as broken during preview-resource interference. Their visible midpoint compositions were correct; those records are retained, and **all assets in all frames** is not claimed. The clean-build checks in B7 establish a narrower, independently observed visible-resource result.

`final-mobile-panorama-selected` is retained as a pre-fallback-fix asset-failure diagnostic, not a final normal-panorama acceptance view. `final-mobile-ch08` is the authoritative normal portrait-panorama record.

Rapid per-chapter native screenshots during the G6 path could lag the Index dialog paint. They were excluded from the presentation corpus and retained only as scratch diagnostics. The aggregate ten-chapter DOM/resource record and settled return view are the evidence; this report does not claim ten additional settled G6 chapter screenshots.

## G4 defects, corrections and rechecks

| Location | Observed defect and cause | Correction and final result |
| --- | --- | --- |
| CH02 · Vocabulary | The macro lost the material-edge junction and showed mostly blank paper. Fixed HTML image dimensions retained a 1024px height while CSS changed width/aspect ratio. | Image `height:auto` restored natural proportions. Final desktop/mobile views show the material junction. |
| CH04 · Chord | The complete chord became an unintended extreme macro for the same sizing reason. | The image-height correction restored the complete chord. Related CH07 memory images and TR06/07 fragments were rechecked. |
| TR08→09 | At 75/100%, the handoff had artwork and references but no actual share controls. | Native share inputs outside the hidden decorative gallery use the same state owner; mobile controls occupy their own row. Final views retain both references and operable controls without collision. Material-atlas sampling/opacity refinement also improved continuity. |
| TR09→10 · Mobile | The gallery could shrink to 220px under a long title. Phase artwork and labels overlapped, and Trace collided with the title panel. | A non-shrinking gallery uses 2.4× the capped print span, minimum 600px; title/actions flow below it. Desktop is unchanged. All five 390px poses and the 320px CJK gallery/action were recaptured; the reviewer cleared the gate. |
| Late handoffs · Short landscape | A viewport-height width calculation could reach zero. | Positive print-width floors and normal document flow keep artwork and actions reachable. The 844 × 390 matrix state was inspected. |
| Export workbench | Preparation was coupled to download, preventing independent preview review in the restricted browser. | Separate Preview and Keep actions share one guarded preparation path; preview, invalidation and missing-font output were observed. The final disk-download limitation remains. |

## G6 source reproduction and package identity

The independently tested build candidate contained **92 files / 30,758,060 bytes**, with SHA-256:

```text
6e429217da6d5fbfb8c09fb5dcf3d14ea6746085b26701a1a5217c05b5ae5779
```

This hash identifies the **build-verification candidate**, not the larger final archive containing the completed documentation and evidence. The clean extraction installed dependencies, passed all 78 tests, rebuilt successfully and matched all 36 source/resource files plus 28 production files byte for byte. B7 and `docs/evidence/raw/g6-refresh-persistence.json` record the browser path and real reload against that rebuilt application.

The final delivery adds documentation/evidence to the same frozen application. Its final identity and repeated code/resource comparison belong to `PACKAGE-INTEGRITY.json` and the accompanying delivery checksum record. The final ZIP corrects `start.sh` from mode 0644 to 0755 without changing its bytes. This metadata correction and the candidate build do not certify a launcher: `start.cmd` and the macOS/Linux shell launcher were not executed on their target operating systems. The rebuilt `dist/`, including its subpath, was tested through the managed static preview; no separate CLI-server execution pass is claimed.

## Explicit remaining limits — G5 stays partial

| Area | Final status / limitation |
| --- | --- |
| Download to disk | Unverified. Managed browser security rejected Blob/Data download protocols. The actual PNG preview succeeded; no bypass or alternate transfer protocol was used. |
| Browser zoom | Unverified. Native 125/150/200% shortcut attempts did not change the reported viewport or DPR, so they do not establish zoom coverage. |
| OS reduced-motion preference | Unverified. Manual Still mode worked; changing the OS preference was not observed. |
| Physical devices / other browsers | Unverified. CSS simulations do not certify a physical Android/iOS phone, actual 4K display or other browser engine. |
| Operating-system launchers | Windows and macOS execution unverified. Launcher source is provided; the managed static preview of the rebuilt production output was exercised. |
| Performance | No FPS, cold-load timing, Core Web Vitals, Lighthouse or hardware-performance claim. Warm/preloaded resources are explicitly recorded. |
| Broad lifecycle/stress recovery | No heap/leak measurement, stress-race, exhaustive delayed/out-of-order resource, background-return or repeated lifecycle certification. Image/font fixtures and pure contracts establish only their stated cases. |
| Explicit retry recovery | Unverified. Fixture restoration caused preview auto-reload, so same-page retry was not isolated. |
| Broader accessibility / sound | Native keyboard controls/focus were tested. Full screen-reader coverage, a complete contrast audit and audible sound-quality evaluation are not certified. |

The reviewed local package can be handed off with these limits. The independent visual SHIP decision and source reproduction result do not convert the remaining G5 items into passes.
