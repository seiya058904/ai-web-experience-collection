# Sources and editorial boundaries

Reviewed: **2026-11-09**. This is a source review, not an implementation or accessibility acceptance report. The review distinguishes retrieved evidence, editorial fiction, and engineering recommendations. Package versions and test outcomes must come from the delivered lockfile and actual test logs.

## Required primary sources

| ID | Source consulted | Retrieval result | Supported use | Limits |
| --- | --- | --- | --- | --- |
| S01 | [NYC Department of Sanitation: Sanitation Workers](https://www.nyc.gov/site/dsny/careers/sanitation-workers.page) | Official page retrieved. | The role includes equipment operation, refuse and recycling collection, street sweeping, and snow or ice removal. It supports choosing street maintenance as a subject. | It does not establish NIGHTSHIFT's shift times, staffing, equipment practices, street geometry, or fictional route. |
| S02 | [MTA: Planned Service Changes](https://www.mta.info/planned-service-changes) | The supplied URL redirected to [MTA alerts](https://www.mta.info/alerts). The returned official summary describes current and future planned changes for subway, bus, LIRR, and Metro-North travel. | It establishes that planned service changes are publicly communicated. | The retrieved summary alone does not establish why a specific change occurs. It is not a track-access rule, safety procedure, maintenance timetable, or evidence for the film's inspection sequence. No live alerts or route data are reproduced. |
| S03 | [Lenis official repository](https://github.com/darkroomengineering/lenis) and [its README](https://github.com/darkroomengineering/lenis/blob/main/README.md) | The repository root timed out on a repeat request. The official README was then retrieved successfully in full enough to inspect setup, settings, methods, anchor, reduced-motion, and integration guidance. | The README documents the actual Lenis API and its GSAP connection. | A moving main-branch README is not proof that every option exists in a particular installed version. Verify against the pinned package before using an option. |
| S04 | [GSAP ScrollTrigger reference](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) | Official reference retrieved; scrub, update, refresh, teardown, and media-query sections inspected. | Supports scroll-linked progress, measured trigger positions, refresh, and instance cleanup. | Library capability is not evidence that the site's composition, synchronization, or accessibility has passed. |
| S05 | [Playwright: Visual comparisons](https://playwright.dev/docs/test-snapshots) | Official page retrieved. | Screenshot assertions compare a current rendering with a baseline. Rendering depends on browser, OS, environment, and other conditions; comparable runs need controlled conditions. | A first generated baseline is not a successful design review. Still screenshots alone cannot verify uninterrupted motion or exclude a one-frame flash. Record real scrolling as a separate check. |
| S06 | [W3C: Understanding SC 2.2.2, Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) | Official explanatory document retrieved. | Automatically starting visual movement lasting over five seconds alongside other content generally requires a usable pause, stop, or hide mechanism unless essential. Auto-updating information has a related control requirement without that five-second exception. | The Understanding document is explanatory; reading it does not establish WCAG conformance. A pause that holds the user's focus hostage is not an adequate solution. |

No source photograph, logo, map, document screenshot, icon, or official branding is licensed for reuse merely by appearing here. The website should not imply endorsement by DSNY, the MTA, or any other organization.

## Supplemental primary technical references

- [GSAP: gsap.matchMedia()](https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/), reviewed 2026-11-09. It collects animations and triggers created by a matching setup and reverts them when the conditions change. Its cleanup function can remove non-GSAP resources. Use this API, or explicitly managed native media queries, rather than the deprecated `ScrollTrigger.matchMedia()` API.
- [GSAP: gsap.ticker](https://gsap.com/docs/v3/GSAP/gsap.ticker/), reviewed 2026-11-09. A named ticker callback can be removed. `lagSmoothing(0)` disables GSAP's elapsed-time compensation; it does not improve actual hardware frame rate.

## Lenis and ScrollTrigger implementation guidance

The documented integration uses one Lenis instance, sends its scroll events to `ScrollTrigger.update`, and calls `lenis.raf(time * 1000)` from GSAP's ticker. Import `lenis/dist/lenis.css`. Set `autoRaf: false` for an explicit single-clock setup. Do not add a second requestAnimationFrame loop. Native touch is retained with `syncTouch: false`.

Enable anchor handling or own it explicitly; do not leave anchors accidentally blocked. Verify `scrollTo`, `immediate`, `resize`, and `destroy` against the installed types. The currently retrieved README also documents reduced-motion handling, but the application must still preserve its own content and motion setting.

ScrollTrigger's `scrub: true` directly follows trigger progress. A numeric scrub adds a catch-up period; the animation can keep changing after the scroll callback stops. If numeric scrubbing is used, render dependent layers from the animation's actual progress. `refresh()` recomputes trigger positions; it is different from updating progress. Refresh after layout-affecting image or font readiness. Kill owned triggers during cleanup.

For NIGHTSHIFT, the following are project engineering decisions, not statements made by those libraries:

1. Compute a single story snapshot from the current scroll position and measured chapter geometry. Derive chapter identity, transition progress, masks, images, and captions from that snapshot.
2. Keep normal document sections and reliable hash targets. Use measured offsets, not accumulated wheel deltas, as the source of truth.
3. In reduced mode, keep scrolling available while removing smoothing and large camera movement. Never substitute `lenis.stop()` for reduced motion.
4. Pause optional ambient rendering when hidden. On restoration, remeasure and render the current state, without replaying the opening.
5. Give each asynchronous asset request an identity token. An earlier request may populate a cache but must not replace a newer active chapter.
6. Remove the named ticker callback, destroy the Lenis instance, and release owned observers and media-query listeners during teardown. Repeated resize must not create duplicate active controllers.

## Evidence and fiction must remain separate

**Meridian City is invented.** All street names, people, room arrangements, work locations, dates, and on-screen times belong to the fictional story. Times are narrative markers, not service schedules. The atlas is an editorial diagram, not a real route planner or a control system. The amber highlight connects observations; it is not a wire, utility route, or claim of a shared physical network.

The bakery, care, water, light-inspection, and market vignettes are authored composites. They make no institution-specific factual assertion. The supplied sources do not independently verify every detail of these scenes. Avoid operational instructions, technical settings, numerical performance claims, patient information, worker quotations, and invented testimony.

The broad relationship between preparation and an ordinary morning is the work's editorial premise. Each before/after state is a visibly authored illustration of one local scene. It is not measured evidence of public-service outcomes or a promise that one worker performs every task shown.

## Public source-note copy

> Meridian City is an original fictional composite. Its streets, people and times are invented. The scenes are illustrations of an imagined night, not records of a real shift. The atlas and diagrams are editorial illustrations. Public sources informed the choice of subject and the site's technical approach; they do not provide its timetable or endorse this experience.

## Review status

The six required source targets were consulted, including the documented Lenis-root timeout and successful official README fallback. No inaccessible source has been silently treated as read. This file records research only. Functional checks, visual review, package compatibility, and performance measurements remain the responsibility of the implementation evidence ledger.
