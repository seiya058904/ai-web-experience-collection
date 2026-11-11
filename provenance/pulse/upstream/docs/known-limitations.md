# Known limitations

This document states the scope of the delivered implementation. Exact test runs, failures, fixes and remaining gates belong in [acceptance.md](acceptance.md) and the [evidence index](../evidence/index.md).

## Anatomy and interpretation

PULSE is an educational exhibition of a healthy adult circulation. The generated images are artistic material studies, and the original SVGs are deliberately simplified explanatory plates. They are not patient scans, exact geometric reconstructions, clinical measurements or diagnostic instruments. The final visual assets have **not undergone independent clinical validation**.

The four required NIH/NHLBI/AHA sources were reviewed, with additional references for gas exchange, valve supports, wall differences and vessel terminology. This is literature verification, not a clinician's sign-off. The review date is November 9, 2026; see [research notes](research-notes.md) for exact source scopes and access limits.

Heart-local diagrams preserve an anterior cutaway convention. Some normally posterior connections are exposed schematically to make the route understandable. Labels and written topology should guide interpretation; apparent depth, scale, surface textures and cut planes in generated art are not anatomical evidence by themselves.

The sequence omits clinical variants, fetal shunts, disease processes, most small vascular branches and a complete coronary circulation lesson. It must not be treated as a comprehensive vascular atlas. Blood color, scale cues and arrow legends are explanatory conventions.

No rate, blood pressure, oxygen saturation, wall measurement or whole-circuit transit time is supplied. The optional sound is a synthesized illustration. Scroll progress is not biological time, and the complete circulation is not a one-beat journey of a blood cell.

## Rendering and interaction

The exhibition uses generated stills and original SVG diagrams with layered scroll effects. It is **not a freely rotatable 3D anatomical simulator**. This medium choice keeps the important relationships stable and makes the content available without a GPU rendering context.

There is no WebGL dependency or shader/context recovery path to exercise. Unsupported or unavailable WebGL therefore does not remove any chapter. Image failures have their own scene-local recovery behavior and retain the relevant diagram and written content.

Reduced motion uses stable stages and disables Lenis wheel smoothing; it preserves all chapters and interaction results. It intentionally changes the transition appearance. With JavaScript disabled, the complete static reading path and textual diagram alternatives remain available, while script-dependent controls are hidden.

The separately generated mobile artwork is a portrait composition, not a crop of the desktop asset. Its actual returned size is **984 × 1599 pixels**. The requested 390 × 844 figure is a browser layout target, not the returned bitmap size. Exact output dimensions for all eight generations are retained in [asset selection](asset-selection.md).

## Browser and device coverage

Recorded desktop and phone-sized browser checks describe the tested browser build, CSS viewport, device-pixel ratio and conditions. They do not establish performance or input behavior on a physical phone, tablet, 4K monitor or high-refresh display.

Physical-device testing and Safari/WebKit testing are **not claimed**. Do not interpret a Chromium run or viewport simulation as coverage of those environments. Any newly added platform result must include its actual environment and evidence before this scope is expanded.

No constant 60/120 FPS guarantee, field Core Web Vitals score, live performance score or memory bound is claimed. Local measurements, where recorded, describe only their stated run conditions. Browser zoom, delayed fonts, image failures and repeated navigation require their own evidence; a green production build does not prove them.

Keyboard, semantics, focus, reduced-motion and textual alternatives are implemented and checked as recorded. The project does not claim formal WCAG conformance or a complete assistive-technology certification. A full screen-reader matrix is a separate review.

## Offline edition and local builds

The self-contained `preview/pulse.html` edition embeds the runtime assets for direct offline use. The automated browser exercised the identical embedded bytes over internal HTTP; its protocol policy prevented a direct `file://` opening, which is therefore not claimed as tested. External source pages still require connectivity, and a browser may restrict audio until a user gesture. Browser policies, very old HTML-dialog implementations and embedded in-app browsers may differ from tested modern browsers.

Source development requires Node.js 24 or later and npm package access for an uncached `npm ci`. Exact direct versions and the lockfile are provided; dependency availability outside the delivery environment is controlled by the package registry. There is no paid runtime API or account requirement.

The single-file edition increases the HTML file size in exchange for easy offline opening. It is a convenience build from the same editable source, not a separate implementation. Ordinary `dist/` output should be served by a web server; use the dedicated portable file for direct local opening.

## Rights and publication

Generated output is supplied for the requested project under the applicable service terms. No exclusive copyright or universal legal status is guaranteed for AI-generated art. Fonts and dependencies keep their own licenses, including GSAP's Standard “No Charge” license. See [ATTRIBUTION.md](../ATTRIBUTION.md).

This handoff does not publish a site. No deployment, Git push, pull request, tag, release, domain binding or collection edit is included or authorized.
