# NIB — Collection acceptance

## Scope

The ten original chapters, generated material imagery, Canvas composition, fluid/paper models and narrative are retained. The Collection adaptation adds a native return link, base-aware resources, the root's existing GSAP/Lenis packages, explicit resource teardown and a repair to the original static fallback.

Browser plugin was not available; checks used the bundled Playwright with real Chromium, normal GPU configuration and no forced SwiftShader. Viewport checks are desktop-browser emulation, not physical touch-device evidence.

## Source intake

- Original ZIP: `NIB-Ink-Under-Pressure.zip`, 34,787,830 bytes, SHA-256 `40b55bcfe94ce8da8db611d84227982e9388aca3df7a9707aca7005d24894395`.
- Safe single-directory inventory: 69 files. All 68 records in `SHA256SUMS` match; the manifest itself is the only excluded file.
- All five vendor/font records and their license hashes match. Supplied GSAP 3.15.0 and Lenis 1.3.26 are byte-identical to the installed root versions.
- All 41 delivered-file hash records in original `docs/PROVENANCE.json` match. Eleven runtime WebP images retain the exact decoded alpha and dimensions of their original PNG counterparts.
- Source check: 10 JavaScript syntax checks, 37 local references and five vendor integrity records pass. No install, original build, material regeneration or dependency update was run.
- The original rights record grants no additional license for original work. It remains user-delivered material; no MIT license has been invented. Generated materials retain their stated provenance and scientific/model caveats.

## Original runtime pre-audit

An independent agent checked the original delivery: 127/127 functional checks passed, with 126 screenshots inspected across film, reader, handoffs, controls, six sizes, reduced motion and static fallback. Its confirmed P2 issue was the globally fixed Trace paragraph/actions appearing over earlier chapters when enhancement was unavailable. The integrated CSS confines these elements to normal document flow in the non-enhanced layout, retaining the film's authored fixed Trace composition.

## Integrated development checks — 2026-10-07

The candidate at `http://127.0.0.1:4195/nib/` passed 58/58 functional assertions, with no uncaught page errors and no HTTP failures. Forty-two viewport captures (40 distinct files) and the UI-free actual Canvas capture were inspected.

- At 1440×900 and 390×844: all ten chapter frames, fast wheel/reverse, arbitrary-stop reload, Index destination, native dialog wheel, Escape/focus return, reading/film switching, reading reload, normalized resize and the native Collection return pass.
- At 768×1024, 1920×1080, 2560×1440 and 3840×2160: opening and Meniscus frames pass, with preserved authored framing and no horizontal overflow. The 3840×2160 Canvas is capped to 2797×1573 pixels.
- Fresh reduced-motion contexts at 1440×900 and 390×844 load `#absorb` at its authored phase and jump immediately to Trace through Index.
- JavaScript-disabled and forced Canvas-2D initialization failure remain readable at both primary sizes. Trace text/actions have static positioning inside the Trace chapter; the beginning no longer contains closing content.
- A targeted four-trial wheel probe confirms that the reverse event cancels the prior Lenis target through public stop/start, then targets 500 pixels upward from the actual event-time position. All four trials move upward after processing. A premature 55 ms sample was superseded by waiting for the actual browser wheel event; its raw diagnostic remains external.
- At desktop size, Index content fits its 900 px container and does not require scrolling. Its wheel event remains native and the background stays fixed. At phone size, Index scrolls natively through its 994 px content in the 844 px container.
- Six pure-model checks pass: finite/positive camera poses across six sizes, continuous nib/stroke contact, monotonic deposit timing, world registration through magnification, reverse/resampling independence and continuous chapter boundaries.

`public/nib/poster.webp` and `social.jpg` derive from the actual opening `material-stage` Canvas. They exclude HTML UI without redrawing the work; only resizing/encoding is applied. Capture parameters and hashes are in `provenance/nib/poster-capture.json`.

## Integrated production checks — 2026-10-07

The final project-path candidate at `http://127.0.0.1:4203/ai-web-experience-collection/nib/` passes **164/164** browser assertions: 58 core, 102 controls/cold-load/resource assertions and four final close-button/keyboard-skip checks. Forty-four distinct complete viewport frames were inspected (46 captures; two opening captures reused their filenames). No page errors, failed HTTP responses or unexplained console warnings/errors occurred. The two intentional forced-Canvas failures produce the expected initialization diagnostic and readable fallback.

- All ten authored frames pass at 1440×900 and 390×844; opening and Meniscus pass at 768×1024, 1920×1080, 2560×1440 and 3840×2160. Full-frame inspection preserves the original photographic material, camera, type and paper/stroke identity.
- Every Index entry and footer chapter tick, enter cue, wordmark, replay, both dialog close controls, Escape/focus restoration, reading/film toggle, keyboard Index navigation/heading focus and native keyboard skip link work at both primary sizes.
- Forty fresh browser contexts verify all ten initial chapter hashes with normal and OS reduced motion at both primary sizes. Reading and reduced-motion wheel events remain native; phone dialogs scroll natively and the film background stays still.
- Delaying the opening image by 300 ms makes early-input readiness unambiguous: a 260 px wheel delivered before `data-ready` is preserved after initialization at both primary sizes.
- Arbitrary-stop reload, reading reload and normalized resize pass. Fast down/reverse responds upward after the real reverse event, without continuing toward the old target. Native Collection return resolves to `/ai-web-experience-collection/`.
- All three local font faces load and all eleven runtime image requests succeed under the project base. Compiled script/CSS and image/font resources retain the same base.
- No-JavaScript and forced-Canvas failure reproduce the fixed static Trace layout at both primary sizes. Closing prose/actions remain inside Trace and do not leak over Metal.

Evidence is retained outside the repository in the NIB intake directory: `integrated-production/results.json`, `extra-results.json`, `last-controls.json` and their screenshots. The Collection owner separately reports both root/project-path builds and strict 728-reference verifications passing, plus the 187-test collection suite (including six NIB paper tests). These are owner-executed build/test results, not commands run by this scoped worker.

The Collection owner handles actual same-window visibility/BFCache, all Collection entrances, Git closeout and live deployment verification. This record confirms the local production candidate; it does not claim an unverified published revision.

Physical touch, iOS/Safari, high-refresh hardware and calibrated performance/FPS measurements remain unverified.
